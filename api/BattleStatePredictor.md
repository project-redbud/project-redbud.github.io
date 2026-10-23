# BattleStatePredictor

战斗状态推算器，位于 `FunGame.Core.Api`。静态类。

基于回合记录（`RoundRecord`）与检查点（`CharacterStateSnapshot`）推算到目标回合时各角色的状态，用于回放与观战的"跳到第 N 回合"功能。

## 方法

| 方法 | 签名 | 说明 |
|---|---|---|
| `PredictAll` | `static Dictionary<Guid, CharacterStateSnapshot> PredictAll(IEnumerable<RoundRecord> rounds, int targetRound)` | 推算到目标回合时**所有角色**的状态快照（key: 角色 Guid） |
| `Predict` | `static CharacterStateSnapshot? Predict(IEnumerable<RoundRecord> rounds, int targetRound, Guid characterGuid)` | 推算**单个角色**的状态快照 |

## 使用示例

```csharp
using FunGame.Core.Api;
using FunGame.Core.Model.Framework;

// LoadRounds 由宿主实现；包含目标回合之前的检查点及其后直到第 15 回合的完整记录
List<RoundRecord> rounds = LoadRounds(queueId);

// 推算第 15 回合所有角色的状态
Dictionary<Guid, CharacterStateSnapshot> states =
    BattleStatePredictor.PredictAll(rounds, targetRound: 15);

// 推算单个角色
CharacterStateSnapshot? state =
    BattleStatePredictor.Predict(rounds, targetRound: 15, characterGuid);
```

## 说明

- 基准为目标回合之前（不含目标回合）的最近检查点 `RoundRecord.Checkpoint`。即使目标回合自身带有检查点，也使用更早的检查点作为推算基准。
- 目标回合之前没有检查点时，`PredictAll` 返回空字典，`Predict` 返回 `null`；角色不在基准检查点中时，其结果也会缺失。
- 输入应包含基准检查点及其后直到目标回合的完整回合记录。推算使用逐次 `Actions` 中的伤害、治疗、资源消耗等数据，并沿 `TotalTime` 处理回复与冷却。

## 快照与精度

返回状态中的 `Items`、`EquipmentsDetail` 保留基准检查点的物品和装备名称、描述等字段，并逐项复制。
修改这些列表及其明细对象不会回写检查点；`Character` 仍是共享的实体引用。

推算用于回放展示，不重新执行技能或特效钩子。装备、背包及属性变化不会随 `Actions` 完整推演，
这些字段以基准检查点中的值为准；需要准确状态时读取对应检查点。状态快照结构见 [CharacterStateSnapshot](./CharacterStateSnapshot.md)。

## 关联

- 回放与渲染 → [RoundRecordRenderer](./RoundRecordRenderer.md)
- 检查点机制 → [即时外发功能 - 检查点](../dev/outbound.md#检查点-checkpoint)
