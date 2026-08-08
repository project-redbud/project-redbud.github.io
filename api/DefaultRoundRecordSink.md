# DefaultRoundRecordSink

即时主动 POST 外发数据包的默认实现，位于 `Milimoe.FunGame.Core.Api`。实现 `IRoundRecordSink`、`IDisposable`。

将游戏过程中产生的数据包即时 POST 到外部专用服务器（服务器需存在一个 POST 方法，body 接收与 `RoundRecordPayload` 相同格式的模型）。设置 `Secret` 时，`Attach` 后立即发送事件 `"13"` 验证签名，成功前其他事件不会外发。

## 构造函数

```csharp
// url：可访问 POST 方法的 URL
// intents：会外发什么事件（事件 id 集合，见 RoundRecordSinkEventIds）
public DefaultRoundRecordSink(string url, string[] intents)
```

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `AccessToken` | `string` | `""` | 服务器的 accessToken（Bearer 认证），非空时每个请求携带 `Authorization: Bearer <token>` |
| `Secret` | `string` | `""` | 签名验证密钥。为空不做签名验证；非空则立即发起签名验证握手，成功前其他事件不外发 |
| `HandshakeRetryIntervalSeconds` | `int` | `60` | 签名验证失败后重发事件 `"13"` 的间隔（秒），直到成功或游戏结束 |

## 方法

| 方法 | 说明 |
|---|---|
| `Attach(Guid queueId)` | 绑定队列（`GamingQueue.RoundRecordSink` 赋值时调用），立即发起握手 |
| `End()` | 游戏结束，停止签名验证重试 |
| `SendAction` / `SendRound` / `SendCheckpointRound` / `SendCharacterStatistics` / `SendCharacters` / `SendTeams` / `SendQueueData` / `SendEliminatedCharacters` / `SendEliminatedTeams` | 9 个外发方法（见 `IRoundRecordSink`） |
| `Dispose()` | 释放 HttpClient 资源 |

## 使用示例

```csharp
DefaultRoundRecordSink sink = new("https://example.com/api/round",
[
    RoundRecordSinkEventIds.Action,       // "0"
    RoundRecordSinkEventIds.Round,        // "1"
    RoundRecordSinkEventIds.CheckpointRound, // "2"
    RoundRecordSinkEventIds.CharacterStatistics, // "3"
    RoundRecordSinkEventIds.Characters,   // "4"
    RoundRecordSinkEventIds.QueueData,    // "6"
    RoundRecordSinkEventIds.EliminatedCharacters, // "7"
])
{
    AccessToken = "server-issued-token",
    Secret = "shared-secret-key"
};

queue.RoundRecordSink = sink;  // 赋值瞬间发起签名验证握手
```

## 实现机制

- **fire-and-forget**：异步 POST 不阻塞游戏线程，失败不补发
- **HTTP 超时 5 秒**：服务器必须及时响应
- **握手协议**：事件 `"13"` 的 `d` = secret 的 SHA256 hex；服务器返回 `HMACSHA512(key = d[..10] + d[^10..] + t, secret)` 的 hex，匹配后作为后续所有 payload 的 `s` 字段
- 序列化选项与 `JsonService.GeneralOptions` 一致（不缩进）

## 关联

- 使用指南 → [即时外发功能](/dev/outbound)
- 接口定义 → [IRoundRecordSink](/api/IRoundRecordSink)
- 服务器端验签实现 → [专用服务器开发](/dev/outbound-server)
