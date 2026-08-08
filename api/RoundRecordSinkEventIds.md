# RoundRecordSinkEventIds

即时外发事件 id 常量，位于 `FunGame.Core.Api`。静态类，`RoundRecordPayload.E` 的取值。

## 常量

| 常量 | 值 | 数据格式 | 发送时机 |
|---|---|---|---|
| `Action` | `"0"` | `ActionRecord` | 每次角色操作结束后 |
| `Round` | `"1"` | `RoundRecord` | 每次角色操作结束后 |
| `CheckpointRound` | `"2"` | `RoundRecord`（附状态快照） | 回合结束时，且当前回合为检查点 |
| `CharacterStatistics` | `"3"` | `Dictionary<Guid, CharacterStatistics>` | 回合结束时 |
| `Characters` | `"4"` | `Character[]` | 回合结束时 |
| `Teams` | `"5"` | `Team[]` | 回合结束时（团队模式） |
| `QueueData` | `"6"` | `Dictionary<string, double>` | 每次角色操作结束后 |
| `EliminatedCharacters` | `"7"` | `string[]`（角色 Guid） | 每次角色操作结束后 |
| `EliminatedTeams` | `"8"` | `string[]`（团队 Name） | 回合结束时（团队模式） |
| `VerifySignature` | `"13"` | `string`（secret 的 SHA256 hex） | 签名验证握手 |

## 使用

```csharp
// intents 指定要外发的事件
DefaultRoundRecordSink sink = new("https://example.com/api/round",
[
    RoundRecordSinkEventIds.Action,
    RoundRecordSinkEventIds.Round,
    RoundRecordSinkEventIds.CheckpointRound,
]);
```

## 关联

- 外发功能 → [即时外发功能](/dev/outbound)
- 数据包模型 → [RoundRecordPayload](/api/RoundRecordPayload)
