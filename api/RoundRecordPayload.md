# RoundRecordPayload

即时外发数据包（线协议模型），位于 `FunGame.Core.Model.Framework`。

POST 到外部专用服务器的数据包格式，序列化字段为紧凑格式：`g`（GamingQueue 的 Guid）、`t`（时间戳）、`e`（事件 id）、`d`（数据包）、`s`（签名）。

## 属性

| 属性 | JSON 键 | 类型 | 说明 |
|---|---|---|---|
| `G` | `g` | `Guid` | GamingQueue 的 Guid（每局游戏唯一） |
| `T` | `t` | `long` | 当前时间戳（Unix 毫秒） |
| `E` | `e` | `string` | POST 事件 id（`"0"`~`"8"`、握手 `"13"`） |
| `D` | `d` | `object?` | 数据包，不同事件格式不同 |
| `S` | `s` | `string` | 签名（握手成功前为空字符串） |

## 示例

```json
{
  "g": "3f2a...-...",
  "t": 1754123456789,
  "e": "1",
  "d": { ...RoundRecord 序列化... },
  "s": "9b31...hex..."
}
```

## 事件数据格式

| 事件 id | `d` 格式 |
|---|---|
| `"0"` | `ActionRecord` |
| `"1"` / `"2"` | `RoundRecord`（"2" 附带 `Checkpoint` 状态快照） |
| `"3"` | `Dictionary<Guid, CharacterStatistics>` |
| `"4"` | `Character[]` |
| `"5"` | `Team[]` |
| `"6"` | `Dictionary<string, double>`（角色 Guid → 等待时间） |
| `"7"` / `"8"` | `string[]` |
| `"13"` | `string`（secret 的 SHA256 hex） |

## 关联

- 服务器端协议与验签 → [专用服务器开发](/dev/outbound-server)
- 事件 id 常量 → [RoundRecordSinkEventIds](/api/RoundRecordSinkEventIds)
