# Skill

技能基类，位于 `Milimoe.FunGame.Core.Entity`。

建议**继承此类**来构造自定义技能。一个技能由多个 `Effect` 组合而成。

## 核心属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `Id` | `long` | 唯一标识符 |
| `Name` | `string` | 技能名称 |
| `Description` | `string` | 技能描述 |
| `GeneralDescription` | `string` | 通用描述（不随等级变化） |
| `DispelDescription` | `string` | 驱散性说明 |
| `ExemptionDescription` | `string` | 豁免性说明 |
| `Slogan` | `string` | 释放口号 |
| `Level` | `int` | 当前等级 |
| `MaxLevel` | `int` | 最大等级 |

## 类型与消耗

| 属性 | 类型 | 说明 |
|---|---|---|
| `SkillType` | `SkillType` | 技能类型 |
| `EPCost` | `double` | 爆发能量消耗 |
| `MPCost` | `double` | 魔法消耗 |
| `CD` | `double` | 冷却时间 |
| `HardnessTime` | `double` | 硬直时间 |
| `CastTime` | `double` | 吟唱时间（魔法） |
| `CostAllEP` | `bool` | 是否消耗全部能量 |

## 类型枚举 `SkillType`

| 值 | 说明 |
|---|---|
| `Skill` | 主动战技 |
| `Passive` | 被动战技 |
| `SuperSkill` | 爆发技 |
| `Magic` | 魔法 |
| `Item` | 物品主动技能 |

## 伤害与魔法

| 属性 | 类型 | 说明 |
|---|---|---|
| `DamageType` | `DamageType` | 伤害类型（Physical/Magical/True） |
| `MagicType` | `MagicType` | 魔法属性 |
| `MagicBottleneck` | `double` | 魔法瓶颈（智力门槛） |

## 目标选择

| 属性 | 类型 | 说明 |
|---|---|---|
| `CanSelectSelf` | `bool` | 可选自己 |
| `CanSelectEnemy` | `bool` | 可选敌人 |
| `CanSelectTeammate` | `bool` | 可选队友 |
| `CanSelectTargetCount` | `int` | 可选目标数（0 = 全体） |
| `CanSelectTargetRange` | `int` | 施法距离 |
| `CastRange` | `int` | 施法范围半径（非指向性） |
| `IsNonDirectional` | `bool` | 是否非指向性（选格子） |
| `SkillRangeType` | `SkillRangeType` | 范围形状（Diamond/Circle/Square/Line/LinePass/Sector） |

## 豁免

| 属性 | 类型 | 说明 |
|---|---|---|
| `EffectForExemptionCheck` | `Effect?` | 指定用于豁免检定的特效 |

## 关系属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `Character` | `Character?` | 所属角色 |
| `Item` | `Item?` | 关联物品 |
| `Effects` | `List<Effect>` | 特效列表 |
| `GamingQueue` | `GamingQueue?` | 所在的游戏队列 |

## 被动技能特殊要求

```csharp
// 被动技能必须重写此方法！
public override IEnumerable<Effect> AddPassiveEffectToCharacter()
{
    return Effects;
}
```
