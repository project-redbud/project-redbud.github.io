# DecisionPoints

决策点数据，位于 `FunGame.Core.Model.Framework`。表示角色在回合内允许的操作数量及其配额，由 `GamingQueue` 为每个角色维护一份。

## 属性

### 决策点

| 属性 | 类型 | 说明 |
|---|---|---|
| `GameplayEquilibriumConstant` | `EquilibriumConstant` | 游戏平衡常数 |
| `CurrentDecisionPoints` | `int` | 当前决策点（默认初始值） |
| `MaxDecisionPoints` | `int` | 决策点上限（默认初始值，最高 7） |
| `RecoverDecisionPointsPerRound` | `int` | 恢复量配置；主循环按角色状态与上限的一半计算恢复量 |
| `DecisionPointsRecovery` | `int` | 本回合实际恢复的决策点 |
| `DecisionPointsCost` | `int` | 本回合已消耗的决策点 |
| `ActionsTaken` | `int` | 本回合已行动次数 |
| `CourageCommandSkill` | `bool` | 是否使用了勇气指令（不结束回合） |

### 临时配额（特效施加）

| 属性 | 类型 | 说明 |
|---|---|---|
| `TempActionQuotaAllRound` | `int` | 临时全能配额（魔法不享受此配额） |
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
// 获取某行动类型的配额
public int this[CharacterActionType type] { get; }
```

## 主要方法

| 方法 | 说明 |
|---|---|
| `AddTempActionQuota(Effect, CharacterActionType? type, int add = 1)` | 特效添加临时配额（不指定 type 为全能配额） |
| `ClearTempActionQuota()` | 清空临时配额（回合结束时调用） |
| `AddActionType(CharacterActionType, Skill?, bool addActionTaken = true)` | 记录行动类型 |
| `CheckActionTypeQuota(CharacterActionType)` | 检查是否还有该行动的配额 |
| `GetActionPointCost(CharacterActionType, Skill? skill = null, bool chainAction = false)` | 获取行动消耗；协同参与者传入 `chainAction: true` |
| `ConsumeChainAction(CharacterActionType, Skill?)` | 扣除协同参与者自己的决策点并记录类型，不增加自己的行动次数、回合消耗统计或硬直列表 |
| `GetDecisionPointsInfo()` | 输出决策点信息文本 |

## 决策点消耗

| 行动 | 消耗 |
|---|---|
| 普通攻击 | 1 |
| 战技 / 魔法 | 2 |
| 物品 | 1 |
| 回合内爆发技 / 回合外爆发技 | 2 / 3 |
| 协同确认 | 1（确认者支付） |

协同参与者另付自己的行动消耗；协同爆发技按回合内价格 2 计算。吟唱结算回合不恢复决策点：普通吟唱沿用已消耗配额，协同吟唱清除旧行动计数后结算。释放失败不再次支付决策点，可在剩余决策点和配额内继续决策。

## 关联

- 决策点规则 → [决策点](/guide/decision-points)
- 操作决策点 → [特效系统](/guide/effects)
