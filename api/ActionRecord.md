# ActionRecord

单次操作记录，位于 `FunGame.Core.Model.Framework`。记录角色一次行动（普攻/技能/物品/移动/结束回合等）的完整明细。

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
| `TurnActor` | `Character?` | 协同动作所属回合的角色 |
| `ChainActionRequestId` | `Guid?` | 关联的协同请求 ID |
| `ChainActor` | `Character?` | 确认记录中的实际协作方 |
| `ActionIndex` | `int` | 操作序号（从 1 开始） |
| `ActionType` | `CharacterActionType` | 行动类型（普通攻击/战技/魔法/物品等） |
| `Skill` | `Skill?` | 使用的技能 |
| `Item` | `Item?` | 使用的物品 |
| `IsSuccess` | `bool` | 是否成功 |
| `FailReason` | `string` | 失败原因 |
| `Messages` | `List<string>` | 行动消息 |
| `Inquiries` | `List<InquiryRecord>` | 本次操作触发的询问记录（v3.0+） |

### 消耗

| 属性 | 类型 | 说明 |
|---|---|---|
| `Cost` | `string` | 本次操作的展示用消耗文本；物品免费使用时为空字符串 |
| `MPCost` | `double` | 本次操作实际消耗的魔法值（结构化数值） |
| `EPCost` | `double` | 本次操作实际消耗的能量值（战技、爆发技及物品均可使用） |
| `SkillCD` | `double` | 技能冷却时间 |
| `DecisionPointsCost` | `double` | 决策点消耗 |
| `CastTime` | `double` | 本次操作的实际吟唱时间 |
| `HardnessTime` | `double` | 本次操作贡献的硬直，在外发前写入；不含回合末汇总与协同原硬直 |

### 目标与结算

| 属性 | 类型 | 说明 |
|---|---|---|
| `Targets` | `List<Character>` | 目标角色 |
| `NonDamageAssistTargets` | `List<Character>` | 本次操作登记的非伤害助攻目标 |
| `Damages` | `Dictionary<Character, double>` | 各目标受到的伤害 |
| `DamageDetails` | `Dictionary<Character, Dictionary<DamageType, double>>` | 伤害类型分桶（物理/魔法/真实，v3.0+） |
| `Dice` | `Dictionary<Character, double>` | 检定骰子值（v3.0+） |
| `IsCritical` / `IsEvaded` / `IsImmune` | `Dictionary<Character, bool>` | 暴击 / 闪避 / 免疫标记 |
| `Heals` | `Dictionary<Character, double>` | 各目标的治疗量 |
| `ApplyEffects` | `Dictionary<Character, List<EffectType>>` | 各角色被施加的特效类型 |

## 方法

| 方法 | 说明 |
|---|---|
| `AddApplyEffects(Character, params EffectType[])` | 记录角色被施加的特效类型 |
| `AddInquiry(Character, InquiryOptions, InquiryResponse)` | 记录一次询问（v3.0+） |
| `Snapshot()` | 生成结构快照（集合独立副本、实体引用共享），用于外发 |
| `ToString()` | 渲染操作文本 |

## 协同与失败记录

协同执行记录的 `Actor` 是实际执行动作的角色，`TurnActor` 是确认者。协同吟唱释放时仍关联原请求；失败后重新决策产生的新魔法不继承原请求归属。

确认记录展示为“当前角色确认协作方的申请”，执行记录展示实际协作方及动作结果。费用使用记录数值，开始吟唱不当作已成功释放，失败记录不显示为已完成协作；`NonDamageAssistTargets` 表示非伤害辅助目标。

统计逐次费用时使用 `MPCost` / `EPCost` / `DecisionPointsCost`，不解析 `Cost` 文本，也不从回合级同名消耗映射推断归属。
物品同时消耗 MP 和 EP 时，两项数值属于同一次操作；魔法开始吟唱时不扣 MP，实际消耗写在释放记录中。

打断、目标丢失、资源不足会生成归属于吟唱角色的失败记录。预释放爆发技覆盖、移出队列和死亡只记录终止原因。回合外终止产生独立记录，不覆盖当前行动者的操作记录。

读取最终回合硬直请使用 `RoundRecord.HardnessTime`；读取角色当前排队时间请使用 `GamingQueue.HardnessTime`。

## 关联

- 回合记录 → [RoundRecord](./RoundRecord.md)
- 外发事件 `"0"` → [即时外发功能](../dev/outbound.md)
