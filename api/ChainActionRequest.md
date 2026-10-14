# ChainActionRequest 与 ChainActionResult

协同行动申请与执行结果，位于 `FunGame.Core.Model.Framework`。规则见[协同行动](/guide/chain-action)，接入见[开发者指南](/dev/chain-action)。

## ChainActionRequest

`sealed class`，构造函数为内部入口。调用 `GamingQueue.SubmitChainAction` 创建申请，不直接 `new`；提交失败返回 `null` 并填写失败原因。

| 属性 | 类型 | 说明 |
|---|---|---|
| `Id` | `Guid` | 本次申请 ID |
| `TurnId` | `Guid` | 所属 `ProcessTurn` 的唯一回合标识 |
| `Round` | `int` | 所属全局回合 |
| `TurnActor` | `Character` | 当前回合的协调方 |
| `Actor` | `Character` | 实际动作执行者 |
| `ActionType` | `CharacterActionType` | 协作动作类型 |
| `Skill` | `Skill?` | 技能或物品的主动技能 |
| `Item` | `Item?` | 使用的物品 |
| `Targets` | `IReadOnlyList<Character>` | 提交时复制并去重的目标集合 |
| `TargetGrids` | `IReadOnlyList<Grid>` | 提交时复制并去重的目标格集合 |
| `CastCenter` | `Grid?` | 可选施法中心或方向参考格，用于重验中心射程与重算影响格 |

所有属性只读，集合中的实体引用共享。申请只在所属回合有效；同一协作方的新申请会替换旧申请，查询及确认会移除失效申请。

## ChainActionResult

```csharp
public sealed record ChainActionResult(
    bool IsSuccess,
    string FailReason = "",
    bool IsCasting = false,
    double HardnessTime = 0,
    ActionRecord? Record = null);
```

| 属性 | 说明 |
|---|---|
| `IsSuccess` | 申请通过确认并发动；开始吟唱也算发动成功，不保证最终释放成功 |
| `FailReason` | 确认失败原因；确认失败不扣费用 |
| `IsCasting` | 确认完成后是否仍在协同吟唱 |
| `HardnessTime` | 协作方即时动作产生的硬直，开始吟唱时通常为 0；不是最终队列位置 |
| `Record` | 协作方执行记录的结构快照，实体引用共享 |

协作魔法的吟唱时间可读取 `Record.CastTime`，实际队列等待时间读取 `GamingQueue.HardnessTime`。直接确认不会替协调方入账确认硬直，宿主收尾契约见[接管整回合](/dev/chain-action#接管整回合时直接确认)。
