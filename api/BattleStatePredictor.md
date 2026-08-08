# BattleStatePredictor

战斗状态推算器，位于 `Milimoe.FunGame.Core.Api`。静态类。

基于回合记录（`RoundRecord`）与检查点（`CharacterStateSnapshot`）推算到目标回合时各角色的状态，用于回放与观战的"跳到第 N 回合"功能。

## 方法

| 方法 | 签名 | 说明 |
|---|---|---|
| `PredictAll` | `static Dictionary<Guid, CharacterStateSnapshot> PredictAll(IEnumerable<RoundRecord> rounds, int targetRound)` | 推算到目标回合时**所有角色**的状态快照（key: 角色 Guid） |
| `Predict` | `static CharacterStateSnapshot? Predict(IEnumerable<RoundRecord> rounds, int targetRound, Guid characterGuid)` | 推算**单个角色**的状态快照 |

## 使用示例

```csharp
using FunGame.Core.Api;

// 服务器端从 "1"/"2" 事件还原的回合记录
List<RoundRecord> rounds = LoadRounds(queueId);

// 推算第 15 回合所有角色的状态
Dictionary<Guid, CharacterStateSnapshot> states =
    BattleStatePredictor.PredictAll(rounds, targetRound: 15);

// 推算单个角色
CharacterStateSnapshot? state =
    BattleStatePredictor.Predict(rounds, targetRound: 15, characterGuid);
```

## 说明

- 推算基于最近的有效检查点（`RoundRecord.Checkpoint`）逐操作（`ActionRecord`）应用
- 无检查点时从开局状态推算
- 状态快照结构见 [CharacterStateSnapshot](/api/CharacterStateSnapshot)

## 关联

- 回放与渲染 → [RoundRecordRenderer](/api/RoundRecordRenderer)
- 检查点机制 → [即时外发功能 - 检查点](/dev/outbound#检查点-checkpoint)
