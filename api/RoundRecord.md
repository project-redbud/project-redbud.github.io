# RoundRecord

回合记录，位于 `FunGame.Core.Model.Framework`。记录一个回合（Round）内发生的全部行动流与汇总数据。

## 构造函数

```csharp
public RoundRecord(int round)
```

## 属性

### 回合信息

| 属性 | 类型 | 说明 |
|---|---|---|
| `Round` | `int` | 回合数 |
| `Actor` | `Character` | 本回合的行动角色 |
| `Seed` | `int` | 本局游戏的随机种子（每回合持久化，供存档/回放复现；见 `GamingQueue.Seed`） |
| `Actions` | `List<ActionRecord>` | 本回合已发生的操作记录列表 |
| `ActionTypes` | `HashSet<CharacterActionType>` | 本回合出现的行动类型集合 |
| `CastTime` | `double` | 吟唱时间 |
| `HardnessTime` | `double` | 本回合硬直时间 |
| `HasKill` | `bool` | 本回合是否发生击杀 |
| `TotalTime` | `double` | 累计游戏时间 |

### 行动明细

| 属性 | 类型 | 说明 |
|---|---|---|
| `Targets` | `Dictionary<CharacterActionType, List<Character>>` | 各行动类型的目标角色 |
| `Skills` | `Dictionary<CharacterActionType, Skill>` | 各行动类型使用的技能引用 |
| `SkillsCost` | `Dictionary<Skill, string>` | 各技能实例最近一次释放的消耗文本 |
| `Items` | `Dictionary<CharacterActionType, Item>` | 各行动类型使用的物品引用 |
| `ItemsCost` | `Dictionary<Item, string>` | 各物品实例最近一次使用的消耗文本；免费使用为空字符串 |
| `Damages` | `Dictionary<Character, double>` | 各目标受到的伤害 |
| `DamageDetails` | `Dictionary<Character, Dictionary<DamageType, double>>` | 伤害类型分桶（物理/魔法/真实，各桶之和 = Damages，v3.0+） |
| `Dice` | `Dictionary<Character, double>` | 各角色的检定骰子值（确定性随机，v3.0+） |
| `Inquiries` | `List<InquiryRecord>` | 本回合的询问记录（含答复与来源，v3.0+） |
| `IsCritical` / `IsEvaded` / `IsImmune` | `Dictionary<Character, bool>` | 暴击 / 闪避 / 免疫标记 |
| `Heals` | `Dictionary<Character, double>` | 各目标的治疗量 |
| `Effects` | `Dictionary<Character, List<Skill>>` | 各角色在本回合触发过特效的技能列表（按首次触发顺序去重；v3.0 起由单技能改为技能列表） |
| `ApplyEffects` | `Dictionary<Character, List<EffectType>>` | 各角色被施加的特效类型 |
| `Assists` | `List<Character>` | 助攻角色 |
| `OtherMessages` | `List<string>` | 其他消息 |

### 击杀与复活

| 属性 | 类型 | 说明 |
|---|---|---|
| `ActorContinuousKilling` | `List<string>` | 行动角色连续击杀记录 |
| `DeathContinuousKilling` | `List<string>` | 死亡角色连续击杀记录 |
| `RespawnCountdowns` | `Dictionary<Character, double>` | 复活倒计时 |
| `Respawns` | `List<Character>` | 本回合复活的角色 |
| `RoundRewards` | `List<Skill>` | 本回合奖励的技能（一行汇总，兼容旧存档） |
| `RoundRewardEvents` | `List<RoundRewardRecord>` | 本回合的全部回合奖励事件流（发放/移除/夺取，按发生顺序；只读，结构见 [RoundRewardRecord](./RoundRewardRecord.md)） |

### 全局信息

| 属性 | 类型 | 说明 |
|---|---|---|
| `AllCharacters` | `List<Character>` | 开局全角色清单 |
| `TeamMap` | `Dictionary<Guid, string>` | 角色 Guid → 队伍名 |
| `CharacterStatistics` | `Dictionary<Character, CharacterStatistics>` | 角色统计（终局写入） |
| `GameResult` | `List<RankingEntry>` | 终局排名 |
| `Checkpoint` | `List<CharacterStateSnapshot>?` | 检查点：全角色状态快照（检查点回合才有） |

## 读取消耗记录

显示每次行动的费用和执行者时，读取 [ActionRecord](./ActionRecord.md) 的 `Actor`、`Cost`、`MPCost`、`EPCost` 和 `DecisionPointsCost`。
同一实例在一回合内多次使用时，`SkillsCost` / `ItemsCost` 只保留该实例最近一次的消耗文本，不能作为逐次明细或累计费用。

JSON 中两个消耗字段的格式均为 `Id.Name → string`。不同实例具有相同键时，按消耗字典枚举顺序覆盖，只保留一个展示值；
该值不能区分角色，也不保证对应最后一次行动。协同确认费用归确认记录，实际 MP / EP 消耗归协作方的执行记录。

反序列化不依赖 JSON 属性顺序。消耗优先匹配回合级 `Skills` / `Items` 中首个同名引用，缺失时匹配 `Actions` 中最后出现的同名引用；
这种匹配用于恢复兼容展示字段，不代表费用归属。没有对应引用的条目不恢复。

## 方法

| 方法 | 说明 |
|---|---|
| `AddApplyEffects(Character, params EffectType[])` | 记录角色被施加的特效类型 |
| `AddEffectTriggered(Character, Skill?)` | 记录角色触发了某技能的特效（按技能 Guid 去重，保留首次触发顺序；框架在特效钩子触发时自动调用） |
| `AddInquiry(Character, InquiryOptions, InquiryResponse)` | 记录一次询问（v3.0+） |
| `Snapshot()` | 生成结构快照（集合独立副本、实体引用共享），用于外发 |
| `ToString()` | 渲染回合文本（有奖励事件流时按事件渲染，否则退化为旧的奖励一行汇总） |

## 关联

- 单次操作记录 → [ActionRecord](./ActionRecord.md)
- 外发时机 → [即时外发功能](../dev/outbound.md)
- 状态快照 → [CharacterStateSnapshot](./CharacterStateSnapshot.md)
