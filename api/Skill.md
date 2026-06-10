# Skill

技能基类，位于 `Milimoe.FunGame.Core.Entity`。

建议**继承此类**来构造自定义技能。

## 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `Guid` | `Guid` | 标识符（物品技能用于关联 Item.Guid） |
| `Name` | `string` | 技能名称 |
| `Description` | `string` | 技能描述 |
| `GeneralDescription` | `string` | 通用描述 |
| `Slogan` | `string` | 释放技能口号 |
| `Level` | `int` | 技能等级 |
| `MaxLevel` | `int` | 最大等级 |
| `SkillType` | `SkillType` | 技能类型 |
| `DamageType` | `DamageType` | 伤害类型 |
| `MagicType` | `MagicType` | 魔法属性 |
| `EPCost` | `double` | 爆发能量消耗 |
| `MPCost` | `double` | 魔法消耗 |
| `Cooldown` | `double` | 冷却时间 |
| `HardnessTime` | `double` | 硬直时间 |
| `CastRange` | `int` | 施法距离 |
| `Effects` | `List<Effect>` | 特效列表 |
| `Character` | `Character?` | 所属角色 |

## SkillType 枚举

| 值 | 说明 |
|---|---|
| `Skill` | 主动战技 |
| `Passive` | 被动战技 |
| `SuperSkill` | 爆发技 |
| `Magic` | 魔法 |
| `Talent` | 战斗天赋 |
