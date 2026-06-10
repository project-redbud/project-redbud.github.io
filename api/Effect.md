# Effect

特效基类，位于 `Milimoe.FunGame.Core.Entity`。

需继承并使用，关联到 Skill。

## 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `Skill` | `Skill` | 所属技能 |
| `Priority` | `int` | 触发优先级（越大越高，默认 0） |
| `EffectType` | `EffectType` | 特效类型 |
| `Durative` | `bool` | 是否持续性 |
| `Duration` | `double` | 持续时间（配合 Durative） |
| `DurationTurn` | `int` | 持续时间回合（Durative = false 时） |
| `RemainDuration` | `double` | 剩余持续时间 |
| `Dispellability` | `Dispellability` | 驱散性 |
| `DispelType` | `DispelType` | 被驱散性 |

## 可重写方法

| 方法 | 触发时机 |
|---|---|
| `OnApply(Character)` | 特效施加 |
| `OnRemove(Character)` | 特效移除 |
| `OnTick(Character, double)` | 时间流逝 |
| `OnNormalAttack(...)` | 角色普攻时 |
| `OnSkillCast(...)` | 角色释放技能时 |
| `OnTakingDamage(...)` | 角色受到伤害时 |
| `OnDealingDamage(...)` | 角色造成伤害时 |
