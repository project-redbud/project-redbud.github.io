# 即时外发功能（RoundRecordSink）

FunGame.Core 提供**即时外发**能力：在游戏过程中，将操作记录、回合数据、角色状态等实时推送（POST）到**外部专用服务器**，用于观战、回放、数据统计或存档等场景。

::: info v3.0 新增
即时外发是 v3.0 引入的新特性（核心库不提供网络传输层，本功能是唯一的官方"外发通道"实现）。
:::

## 核心概念

外发功能由三个部分组成：

| 组件 | 说明 |
|---|---|
| `GamingQueue.RoundRecordSink` | 队列上的外发通道属性（`IRoundRecordSink?`），赋值的瞬间触发绑定握手 |
| `IRoundRecordSink` | 外发通道接口，定义了 9 个外发方法，分别对应 9 种事件 |
| `DefaultRoundRecordSink` | 官方默认实现：将数据包**即时主动 POST** 到外部服务器（`FunGame.Core.Api`） |

数据包统一封装为 `RoundRecordPayload`（`FunGame.Core.Model.Framework`），线协议字段为紧凑格式：

| 字段 | JSON 键 | 类型 | 说明 |
|---|---|---|---|
| `G` | `g` | `Guid` | 所属 `GamingQueue` 的 Guid（队列唯一标识） |
| `T` | `t` | `long` | 当前时间戳（Unix 毫秒） |
| `E` | `e` | `string` | 事件 id（`"0"` ~ `"8"`，握手为 `"13"`） |
| `D` | `d` | `object?` | 数据包，不同事件格式不同 |
| `S` | `s` | `string` | 签名（握手成功前为空字符串） |

## 快速开始

两步即可启用外发：

```csharp
using FunGame.Core.Api;
using FunGame.Core.Model.Queue;

// 1. 创建外发通道：指定服务器 URL 与要外发的事件 id
DefaultRoundRecordSink sink = new("https://example.com/api/round",
[
    RoundRecordSinkEventIds.Action,       // "0" 单次操作
    RoundRecordSinkEventIds.Round,        // "1" 回合数据
    RoundRecordSinkEventIds.CheckpointRound, // "2" 检查点回合
    RoundRecordSinkEventIds.CharacterStatistics, // "3" 角色统计
    RoundRecordSinkEventIds.Characters,   // "4" 全角色
    RoundRecordSinkEventIds.QueueData,    // "6" 行动顺序表
    RoundRecordSinkEventIds.EliminatedCharacters, // "7" 淘汰名单
]);

// 2. 挂到队列上（赋值瞬间立即发起签名验证握手）
MixGamingQueue queue = new(characters, Console.WriteLine)
{
    RoundRecordSink = sink
};
```

之后无需任何额外代码——操作完成、回合结束、游戏结束时，队列会自动通过该通道外发数据包。

::: warning 注意
- 设置了 `Secret` 时，**握手成功前其他事件一律不外发**，未设置 `Secret` 则直接外发（明文、无签名）。
- 外发是 **fire-and-forget** 的：不阻塞游戏线程，发送失败**不补发**，错过的数据只能靠下一次事件携带的完整快照弥补。
:::

## 事件 id 与数据格式

事件 id 常量定义在 `RoundRecordSinkEventIds`（`FunGame.Core.Api`），与 `IRoundRecordSink` 方法一一对应：

| 事件 id | 常量 | 触发时机 | `d` 字段格式 |
|---|---|---|---|
| `"0"` | `Action` | 每次角色操作结算完成后 | `ActionRecord`（单次操作记录） |
| `"1"` | `Round` | 每次角色操作结算完成后 | `RoundRecord`（当前回合数据） |
| `"2"` | `CheckpointRound` | 回合结束，且该回合为检查点回合时 | `RoundRecord`（附带全角色状态快照 `Checkpoint`） |
| `"3"` | `CharacterStatistics` | 回合结束时 | `Dictionary<Guid, CharacterStatistics>`（角色 Guid → 统计） |
| `"4"` | `Characters` | 回合结束时 | `Character[]`（参与游戏的所有角色完整数据） |
| `"5"` | `Teams` | 回合结束时（仅团队模式） | `Team[]`（当前存活团队） |
| `"6"` | `QueueData` | 每次角色操作结算完成后 | `Dictionary<string, double>`（角色 Guid → 当前等待时间） |
| `"7"` | `EliminatedCharacters` | 每次角色操作结算完成后 | `string[]`（已淘汰/死亡角色 Guid） |
| `"8"` | `EliminatedTeams` | 回合结束时（仅团队模式） | `string[]`（已淘汰团队 Name） |
| `"13"` | `VerifySignature` | 绑定队列且设置 Secret 后立即发送 | `string`（secret 的 SHA256 hex，签名握手） |

::: tip 团队模式的补充外发
`"5"` / `"8"` 两个事件由 `TeamGamingQueue` 重写 `AfterSendRoundEndData()` 发送（`GamingQueue.cs` 基类只发送 `"2"`/`"3"`/`"4"`）。继承 `GamingQueue` 的自定义队列若需要额外外发内容，重写该方法即可。
:::

## 外发时机

外发全部由队列内部自动触发，开发者在正确的时机收到对应事件：

```
ProcessTurn(character)
    │
    ├── 操作结算完成（每次行动）
    │     ├─ SendAction("0")     ← 单次操作记录
    │     ├─ SendRound("1")      ← 当前回合数据
    │     ├─ SendQueueData("6")  ← 行动顺序表
    │     └─ SendEliminatedCharacters("7")
    │
    └── 回合结束（SendRoundEndData）
          ├─ 若为检查点回合 → SendCheckpointRound("2")
          ├─ SendCharacterStatistics("3")
          ├─ SendCharacters("4")
          ├─ （团队模式）SendTeams("5") / SendEliminatedTeams("8")
          └─ 扩展点 AfterSendRoundEndData()

游戏结束
    └─ RoundRecordSink.End()  ← 停止握手重试
```

> 被**取消的操作**（AI 决策次数耗尽等）不予记录、不予外发。

## DefaultRoundRecordSink 配置

| 配置项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| 构造函数 `(string url, string[] intents)` | — | — | `url`：服务器可访问的 POST 地址；`intents`：需要外发的事件 id 集合（不在集合内的事件直接丢弃） |
| `AccessToken` | `string` | `""` | 服务器的 accessToken，非空时每个请求携带 `Authorization: Bearer <token>` |
| `Secret` | `string` | `""` | 签名验证密钥。为空不做签名验证；非空则立即发起握手，成功前其他事件不外发 |
| `HandshakeRetryIntervalSeconds` | `int` | `60` | 握手失败后重发事件 `"13"` 的间隔（秒），直到成功或游戏结束 |

### 带认证与签名的完整配置

```csharp
DefaultRoundRecordSink sink = new("https://example.com/api/round", intents)
{
    AccessToken = "server-issued-token",
    Secret = "shared-secret-key",
    HandshakeRetryIntervalSeconds = 30
};
queue.RoundRecordSink = sink;
```

- 每个 POST 请求的 HTTP 超时为 **5 秒**——服务器必须及时响应，否则挂起的请求会影响游戏性能。
- 握手成功后，后续所有 payload 的 `s` 字段携带握手得到的签名，服务器可据此验证数据包来源与完整性。
- 游戏结束时队列自动调用 `End()` 停止握手重试；`DefaultRoundRecordSink` 实现了 `IDisposable`，应在游戏结束后释放。

## 检查点（Checkpoint）

`GamingQueue.CheckpointInterval`（默认 `50`）控制状态检查点的生成频率：大于 0 时，每 N 回合在回合记录上附带一次**全角色状态快照** `CharacterStateSnapshot`（HP/MP/EP、装备、技能、物品、特效状态明细）。

```csharp
queue.CheckpointInterval = 10;  // 每 10 回合生成一次检查点
```

- 检查点回合外发事件 `"2"`（内容比 `"1"` 更完整）。
- 快照是**回放的基石**：配合 `BattleStatePredictor` 可从任意检查点推算后续回合状态。

## 自定义外发通道

若默认的 HTTP POST 实现不满足需求（如走消息队列、WebSocket 等），实现 `IRoundRecordSink` 接口即可：

```csharp
public class MyMQSink : IRoundRecordSink
{
    public void Attach(Guid queueId) { /* 绑定队列，可忽略 queueId */ }
    public void End() { /* 游戏结束，停止重试等 */ }
    public void SendAction(ActionRecord action) { /* 推送到消息队列 */ }
    public void SendRound(RoundRecord round) { /* ... */ }
    // ...其余 6 个方法
}
```

所有方法的参数均为**结构快照**（集合为独立副本、实体引用共享），可在回调中安全消费。

## 回放与渲染

核心库附带两个回放辅助工具（`FunGame.Core.Api`），可基于外发的回合记录重建战斗过程：

| 工具 | 方法 | 说明 |
|---|---|---|
| `BattleStatePredictor` | `PredictAll(rounds, targetRound)` | 推算到目标回合时所有角色的状态快照（`Dictionary<Guid, CharacterStateSnapshot>`） |
| `BattleStatePredictor` | `Predict(rounds, targetRound, characterGuid)` | 推算单个角色的状态 |
| `RoundRecordRenderer` | `RenderRound(round)` | 将单回合渲染为可读文本 |
| `RoundRecordRenderer` | `RenderAll(rounds)` | 渲染全部回合 |
| `RoundRecordRenderer` | `RenderCharacterActions(rounds, character)` | 渲染指定角色的全部行动 |

```csharp
// 服务器收到"2"后即可重建任意时刻的战况
Dictionary<Guid, CharacterStateSnapshot> states =
    BattleStatePredictor.PredictAll(rounds, targetRound: 15);

string text = RoundRecordRenderer.RenderAll(rounds);
```

## 注意事项

- **5 秒超时**：服务器响应慢会拖累游戏，必要时提高服务器吞吐或改用自定义通道。
- **失败不补发**：外发数据流本身不保证可靠投递，可靠场景请依赖检查点 + 回放工具重建。
- **Secret 泄漏即失效**：握手密钥一旦泄漏，任何持有者都能伪装数据源，请通过环境变量或配置中心注入。
- 未设置 `Secret` 时数据为明文传输，请自行评估安全风险（HTTPS 是底线）。

## 下一步

- 服务端如何接收与验证这些数据包？→ [专用服务器开发](/dev/outbound-server)
- 回合记录结构详解 → [GamingQueue API 参考](/api/GamingQueue)
