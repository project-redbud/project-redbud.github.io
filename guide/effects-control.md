# 控制效果

控制效果由 `EffectType` 定义，框架通过 `SkillSet.GetCharacterStateByEffectType()` 映射到角色状态。

## 强控制效果（改变角色状态）

| EffectType | 映射的 CharacterState | 说明 |
|---|---|---|
| `Stun` | `NotActionable` | 眩晕 → 完全行动不能 |
| `Freeze` | `NotActionable` | 冻结 → 完全行动不能 |
| `Sleep` | `NotActionable` | 睡眠 → 完全行动不能 |
| `Knockdown` | `NotActionable` | 击倒 → 完全行动不能 |
| `Petrify` | `NotActionable` | 石化 → 完全行动不能 |
| `Banish` | `NotActionable` | 放逐 → 完全行动不能 |
| `Root` | `ActionRestricted` | 定身 → 行动受限 |
| `Fear` | `ActionRestricted` | 恐惧 → 行动受限 |
| `Taunt` | `ActionRestricted` | 嘲讽 → 行动受限 |
| `Charm` | `ActionRestricted` | 魅惑 → 行动受限 |
| `Confusion` | `ActionRestricted` | 混乱 → 行动受限 |
| `Silence` | `SkillRestricted` | 沉默 → 技能受限 |
| `SilenceMagic` | `SkillRestricted` | 法术沉默 → 技能受限 |
| `Disarm` | `AttackRestricted` | 缴械 → 攻击受限 |

## 软控制效果（不改变角色状态）

以下 EffectType 属于负面效果但不改变 `CharacterState`：

`Slow`、`Weaken`、`Poison`、`Burn`、`Bleed`、`Blind`、`Cripple`、`Curse`、`Exhaustion`、`ManaBurn`、`GrievousWound`、`Vulnerable`、`Delay`、`PenetrationBoost`（对敌方）、`MagicResistBreak`

## 状态覆盖优先级回顾

```
NotActionable → ActionRestricted → BattleRestricted → SkillRestricted / AttackRestricted → Actionable
```

当角色同时受多种控制时，最高级别的状态生效。

## 豁免类型

每个控制效果都有对应的豁免属性（核心属性），由 `SkillSet.GetExemptionTypeByEffectType()` 确定：

| 豁免属性 | 可豁免的控制效果 |
|---|---|
| **力量 (STR)** | 眩晕、冻结、击倒、嘲讽、定身、缴械、石化、重伤 |
| **敏捷 (AGI)** | 睡眠、恐惧、减速、致盲、致残、燃烧、流血、迟滞 |
| **智力 (INT)** | 沉默、法术沉默、魅惑、混乱、放逐、打断施法、诅咒、疲劳、魔力燃烧、易伤 |
