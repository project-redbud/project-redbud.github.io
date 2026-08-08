# DecisionPoints

决策点数据，位于 `Milimoe.FunGame.Core.Model.Framework`。表示角色在回合内允许的操作数量及其配额，由 `GamingQueue` 为每个角色维护一份。

## 属性

### 决策点

| 属性 | 类型 | 说明 |
|---|---|---|
| `GameplayEquilibriumConstant` | `EquilibriumConstant` | 游戏平衡常数 |
| `CurrentDecisionPoints` | `int` | 当前决策点（默认初始值） |
| `MaxDecisionPoints` | `int` | 决策点上限（默认初始值，最高 7） |
| `RecoverDecisionPointsPerRound` | `int` | 每回合恢复量 |
| `DecisionPointsRecovery` | `int` | 额外恢复量（特效可修改） |
| `DecisionPointsCost` | `int` | 本回合已消耗的决策点 |
| `ActionsTaken` | `int` | 本回合已行动次数 |
| `CourageCommandSkill` | `bool` | 是否使用了勇气指令（不结束回合） |

### 临时配额（特效施加）

| 属性 | 类型 | 说明 |
|---|---|---|
| `TempActionQuotaAllRound` | `int` | 临时全能配额（可转换为任意指定配额） |
| `TempActionQuotaNormalAttack` | `int` | 临时普攻配额 |
| `TempActionQuotaSuperSkill` | `int` | 临时爆发技配额 |
| `TempActionQuotaSkill` | `int` | 临时战技配额 |
| `TempActionQuotaItem` | `int` | 临时物品配额 |
| `TempActionQuotaOther` | `int` | 临时其他配额 |

### 行动记录

| 属性 | 类型 | 说明 |
|---|---|---|
| `ActionTypes` | `Dictionary<CharacterActionType, int>` | 各行动类型的使用次数 |
| `ActionsHardnessTime` | `List<double>` | 各行动的硬直时间 |

### 索引器

```csharp
// 获取/设置某行动类型的配额
public int this[CharacterActionType type] { get; set; }
```

## 主要方法

| 方法 | 说明 |
|---|---|
| `AddTempActionQuota(Effect, CharacterActionType? type, int add = 1)` | 特效添加临时配额（不指定 type 为全能配额） |
| `ClearTempActionQuota()` | 清空临时配额（回合结束时调用） |
| `AddActionType(CharacterActionType, Skill?, bool addActionTaken = true)` | 记录行动类型 |
| `CheckActionTypeQuota(CharacterActionType)` | 检查是否还有该行动的配额 |
| `GetActionPointCost(CharacterActionType, Skill?)` | 获取该行动消耗的决策点 |
| `GetDecisionPointsInfo()` | 输出决策点信息文本 |

## 决策点消耗

| 行动 | 消耗 |
|---|---|
| 普通攻击 | 1 |
| 战技 / 魔法 | 2 |
| 物品 | 1 |
| 回合内爆发技 / 回合外爆发技 | 2 / 3 |

## 关联

- 决策点规则 → [决策点](/guide/decision-points)
- 操作决策点 → [特效系统](/guide/effects)
