# ActionRecord

单次操作记录，位于 `Milimoe.FunGame.Core.Model.Framework`。记录角色一次行动（普攻/技能/物品/移动/结束回合等）的完整明细。

## 构造函数

```csharp
public ActionRecord(int round)
```

## 属性

### 行动信息

| 属性 | 类型 | 说明 |
|---|---|---|
| `Round` | `int` | 回合数 |
| `Actor` | `Character` | 行动角色 |
| `ActionIndex` | `int` | 操作序号（从 1 开始） |
| `ActionType` | `CharacterActionType` | 行动类型（普通攻击/战技/魔法/物品等） |
| `Skill` | `Skill?` | 使用的技能 |
| `Item` | `Item?` | 使用的物品 |
| `IsSuccess` | `bool` | 是否成功 |
| `FailReason` | `string` | 失败原因 |
| `Messages` | `List<string>` | 行动消息 |

### 消耗

| 属性 | 类型 | 说明 |
|---|---|---|
| `Cost` | `string` | 消耗文本 |
| `MPCost` | `double` | 魔法消耗 |
| `EPCost` | `double` | 爆发能量消耗 |
| `SkillCD` | `double` | 技能冷却时间 |
| `DecisionPointsCost` | `double` | 决策点消耗 |
| `CastTime` | `double` | 吟唱时间 |
| `HardnessTime` | `double` | 硬直时间 |

### 目标与结算

| 属性 | 类型 | 说明 |
|---|---|---|
| `Targets` | `List<Character>` | 目标角色 |
| `Damages` | `Dictionary<Character, double>` | 各目标受到的伤害 |
| `IsCritical` / `IsEvaded` / `IsImmune` | `Dictionary<Character, bool>` | 暴击 / 闪避 / 免疫标记 |
| `Heals` | `Dictionary<Character, double>` | 各目标的治疗量 |
| `ApplyEffects` | `Dictionary<Character, List<EffectType>>` | 各角色被施加的特效类型 |

## 方法

| 方法 | 说明 |
|---|---|
| `AddApplyEffects(Character, params EffectType[])` | 记录角色被施加的特效类型 |
| `Snapshot()` | 生成结构快照（集合独立副本、实体引用共享），用于外发 |
| `ToString()` | 渲染操作文本 |

## 关联

- 回合记录 → [RoundRecord](/api/RoundRecord)
- 外发事件 `"0"` → [即时外发功能](/dev/outbound)
