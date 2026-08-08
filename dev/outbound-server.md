# 专用服务器开发

客户端通过 `DefaultRoundRecordSink` 将游戏数据包**即时主动 POST** 到专用服务器。本文从服务端视角说明：如何接收、验证、分发这些数据包，实现观战、回放、统计等能力。

> 适用对象：为 `FunGame.Core` 游戏开发"旁观/回放/数据服务"的服务器端。核心库不提供网络传输层，本页面给出的协议与 `DefaultRoundRecordSink`（`FunGame.Core.Api`）的实现一一对应。

## 服务器职责

```
游戏进程 (GamingQueue)
   │  POST RoundRecordPayload（g/t/e/d/s）
   ▼
专用服务器
   ├─ ① Bearer token 校验（可选，客户端 AccessToken）
   ├─ ② 签名验证（可选，客户端 Secret）
   ├─ ③ 按事件 id 分发处理
   │     ├─ "13" → 握手：返回签名
   │     ├─ "0"/"1" → 实时增量（行动、回合）
   │     ├─ "2" → 检查点（可重建战况）
   │     └─ "3"~"8" → 统计、全量数据、淘汰名单
   └─ ④ 落库 / 推送观战端 / 供回放查询
```

## 线协议

每个数据包都是 `RoundRecordPayload` 的紧凑 JSON：

```json
{
  "g": "3f2a...-...",        // GamingQueue 的 Guid（每局游戏唯一）
  "t": 1754123456789,        // Unix 毫秒时间戳
  "e": "1",                  // 事件 id："0"~"8"，握手为 "13"
  "d": { ...事件数据... },    // 事件数据，格式见下表
  "s": "9b31...hex...",      // 签名（握手成功前为空字符串）
}
```

| 事件 id | `d` 格式 | 用途 |
|---|---|---|
| `"0"` | `ActionRecord` | 单次操作（每次行动后） |
| `"1"` | `RoundRecord` | 当前回合数据（每次行动后） |
| `"2"` | `RoundRecord` + `Checkpoint` | 检查点回合，附带全角色状态快照，**回放锚点** |
| `"3"` | `Dictionary<Guid, CharacterStatistics>` | 角色统计 |
| `"4"` | `Character[]` | 全角色完整数据 |
| `"5"` | `Team[]` | 存活团队（仅团队模式） |
| `"6"` | `Dictionary<string, double>` | 行动顺序表（角色 Guid → 等待时间） |
| `"7"` | `string[]` | 淘汰/死亡角色 Guid 名单 |
| `"8"` | `string[]` | 淘汰团队 Name 名单（仅团队模式） |
| `"13"` | `string` | 握手：secret 的 SHA256 hex |

## 握手与签名验证（核心协议）

设置 `Secret` 时，客户端在 `Attach` 后立即 POST 事件 `"13"`，失败则每 `HandshakeRetryIntervalSeconds` 秒（默认 60）重发一次，直到成功或游戏结束。**握手成功前，其他事件一律不外发。**

### 握手流程

```
客户端（DefaultRoundRecordSink）                服务器
        │                                          │
        │ 1. d = SHA256(secret) 的 hex（小写）       │
        │ 2. POST { g, t, e:"13", d, s:"" }         │
        │ ────────────────────────────────────────> │
        │                                          │ 3. 校验 d == SHA256(secret) hex
        │                                          │ 4. key = d[..10] + d[^10..] + t
        │                                          │    sig = HMAC-SHA512(key, secret) hex
        │ 5. 响应体 = sig（纯文本）                   │
        │ <──────────────────────────────────────── │
        │ 6. 比对响应体 == 本地计算的 sig（忽略大小写）   │
        │    匹配 → 握手成功，此后所有数据包 s = sig    │
```

### 服务器端实现

```csharp
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

// 与 FunGame.Core 的 RoundRecordPayload 字段一致的模型
public class RoundRecordPayload
{
    [JsonPropertyName("g")] public Guid G { get; set; }
    [JsonPropertyName("t")] public long T { get; set; }
    [JsonPropertyName("e")] public string E { get; set; } = "";
    [JsonPropertyName("d")] public JsonElement D { get; set; }
    [JsonPropertyName("s")] public string S { get; set; } = "";
}

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// 与客户端 DefaultRoundRecordSink.Secret 相同的共享密钥
const string Secret = "shared-secret-key";

// 会话表：握手成功后保存 g → d，用于验证后续数据包的签名
var sessions = new Dictionary<Guid, string>();  // 生产环境请加锁或使用 ConcurrentDictionary

app.MapPost("/api/round", async (HttpContext context) =>
{
    // ① Bearer token 校验（与客户端 AccessToken 对应，可选）
    string auth = context.Request.Headers.Authorization.ToString();
    if (!auth.StartsWith("Bearer ", StringComparison.Ordinal))
        return Results.Unauthorized();

    // ② 读取数据包
    RoundRecordPayload? payload = await context.Request.ReadFromJsonAsync<RoundRecordPayload>();
    if (payload is null) return Results.BadRequest("invalid payload");

    // ③ 事件 "13"：签名验证握手
    if (payload.E == "13")
    {
        string d = Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(Secret)));
        if (payload.D.GetString() != d)
            return Results.BadRequest("d mismatch");

        string key = d[..10] + d[^10..] + payload.T;
        string signature = Convert.ToHexStringLower(
            HMACSHA512.HashData(Encoding.UTF8.GetBytes(key), Encoding.UTF8.GetBytes(Secret)));

        sessions[payload.G] = d;  // 记住 d，供后续数据包验签
        return Results.Text(signature);  // 响应体即签名，客户端比对后启用 s
    }

    // ④ 其余事件：用握手时保存的 d 验证签名（可选但推荐）
    if (sessions.TryGetValue(payload.G, out string? savedD))
    {
        string key = savedD[..10] + savedD[^10..] + payload.T;
        string expected = Convert.ToHexStringLower(
            HMACSHA512.HashData(Encoding.UTF8.GetBytes(key), Encoding.UTF8.GetBytes(Secret)));
        if (!payload.S.Equals(expected, StringComparison.OrdinalIgnoreCase))
            return Results.Unauthorized();  // 签名不匹配，拒绝
    }

    // ⑤ 按事件 id 分发处理
    switch (payload.E)
    {
        case "0":  // ActionRecord：单次操作（实时观战推送）
            ActionRecord? action = payload.D.Deserialize<ActionRecord>();
            await BroadcastToViewers(payload.G, payload.D);   // 推送到观战端
            break;

        case "1":  // RoundRecord：当前回合数据
            break;

        case "2":  // CheckpointRound：检查点回合（回放重建锚点）
            RoundRecord? checkpoint = payload.D.Deserialize<RoundRecord>();
            SaveCheckpoint(payload.G, checkpoint);
            break;

        case "3":  // CharacterStatistics
        case "4":  // Characters 全量数据
        case "5":  // Teams
        case "6":  // QueueData 行动顺序表
        case "7":  // EliminatedCharacters
        case "8":  // EliminatedTeams
            SaveEvent(payload.G, payload.E, payload.D);
            break;
    }
    return Results.Ok();
});

app.Run();
```

### 验签算法要点

| 步骤 | 算法 | 说明 |
|---|---|---|
| 握手请求 `d` | `SHA256(secret)` 转小写 hex | 服务器应比对客户端发来的 `d` 是否等于此值 |
| 签名 `key` | `d[..10] + d[^10..] + t` | `d` 的前 10 字符 + 后 10 字符 + 该数据包的 `t`（字符串拼接） |
| 签名 | `HMAC-SHA512(key, secret)` 转小写 hex | 握手时返回给客户端；后续数据包用保存的 `d` 重新计算并比对 `s` |

::: warning 注意
- `key` 拼接用的 `t` 是**当前数据包**的时间戳（毫秒），因此每个数据包的签名都不同。
- 服务器必须保存握手时的 `d`（或直接保存签名算法所需信息），才能验证后续数据包——每局游戏 `g` 唯一，握手一般只发生一次。
- 客户端比对响应体时忽略大小写并 `Trim()`，服务器返回纯文本 hex 即可。
:::

### 握手重试语义

- 服务器未就绪 / 网络抖动时，客户端每 `HandshakeRetryIntervalSeconds` 秒重发 `"13"`——**重复握手是正常行为**，幂等处理即可（重复 `sessions[g] = d` 无害）。
- 游戏结束时客户端调用 `End()` 停止重试，不会再发任何事件。
- 握手成功前的其他事件**不会发出**，服务器无需处理"未握手先发数据"的情况（但建议按坏数据拒绝）。

## 存储与回放建议

- **按 `g` 分组会话**：一局游戏的所有事件共享同一个 `g`，落库时以此为会话主键，按 `t` 排序。
- **`"2"` 检查点是重建锚点**：其 `d.RoundRecord.Checkpoint` 是全角色状态快照（HP/MP/EP、装备、技能、物品、特效状态）。服务器端可缓存最近的检查点，配合增量事件（`"0"`/`"1"`）重建任意时刻的战况。
- **回放渲染**：服务端可直接引用 FunGame.Core 的 `RoundRecordRenderer`（`RenderRound`/`RenderAll`/`RenderCharacterActions`）将回合记录渲染为文本，或自行实现富客户端回放。
- **状态推算**：`BattleStatePredictor.PredictAll(rounds, targetRound)` 可基于检查点推算目标回合的全角色状态，适合实现"跳到第 N 回合"的观战快进功能。

```csharp
// 服务器端回放示例（引用 FunGame.Core）
List<RoundRecord> rounds = LoadRounds(queueId);           // 从 "1"/"2" 事件还原
string battleText = RoundRecordRenderer.RenderAll(rounds); // 渲染整场战斗文本

Dictionary<Guid, CharacterStateSnapshot> states =
    BattleStatePredictor.PredictAll(rounds, targetRound: 15);
```

## 性能与可靠性

- 客户端每个 POST 的 **HTTP 超时为 5 秒**：服务器应在 5 秒内返回（`Results.Ok()` 等），耗时操作（落库、推送）应异步化。
- 客户端**不等待响应、失败不重试**：服务器按"实时数据流"设计，重要状态以检查点为准，不要依赖单次事件送达。
- 高频事件为 `"0"`/`"1"`/`"6"`/`"7"`（每次操作都发）：可考虑批量落库或写入消息队列削峰。
- 若服务器需要更强的可靠性（如乱序、丢包重传），可在核心库之外自行实现 `IRoundRecordSink` 自定义协议。

## 下一步

- 客户端配置与事件详情 → [即时外发功能](/dev/outbound)
- 回合记录数据结构 → [GamingQueue API 参考](/api/GamingQueue)
