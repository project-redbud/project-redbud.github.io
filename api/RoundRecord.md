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
| `Skills` / `SkillsCost` | `Dictionary<CharacterActionType, Skill>` / `Dictionary<Skill, string>` | 使用的技能及其消耗文本 |
| `Items` / `ItemsCost` | `Dictionary<CharacterActionType, Item>` / `Dictionary<Item, string>` | 使用的物品及其消耗文本 |
| `Damages` | `Dictionary<Character, double>` | 各目标受到的伤害 |
| `IsCritical` / `IsEvaded` / `IsImmune` | `Dictionary<Character, bool>` | 暴击 / 闪避 / 免疫标记 |
| `Heals` | `Dictionary<Character, double>` | 各目标的治疗量 |
| `Effects` | `Dictionary<Character, Skill>` | 施加特效的角色与技能 |
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
| `RoundRewards` | `List<Skill>` | 本回合奖励的技能 |

### 全局信息

| 属性 | 类型 | 说明 |
|---|---|---|
| `AllCharacters` | `List<Character>` | 开局全角色清单 |
| `TeamMap` | `Dictionary<Guid, string>` | 角色 Guid → 队伍名 |
| `CharacterStatistics` | `Dictionary<Character, CharacterStatistics>` | 角色统计（终局写入） |
| `GameResult` | `List<RankingEntry>` | 终局排名 |
| `Checkpoint` | `List<CharacterStateSnapshot>?` | 检查点：全角色状态快照（检查点回合才有） |

## 方法

| 方法 | 说明 |
|---|---|
| `AddApplyEffects(Character, params EffectType[])` | 记录角色被施加的特效类型 |
| `Snapshot()` | 生成结构快照（集合独立副本、实体引用共享），用于外发 |
| `ToString()` | 渲染回合文本 |

## 关联

- 单次操作记录 → [ActionRecord](/api/ActionRecord)
- 外发时机 → [即时外发功能](/dev/outbound)
- 状态快照 → [CharacterStateSnapshot](/api/CharacterStateSnapshot)
