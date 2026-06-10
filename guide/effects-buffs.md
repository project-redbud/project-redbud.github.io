# 增益 & 负面状态

每个特效都有 `IsDebuff` 属性，框架通过 `SkillSet.GetIsDebuffByEffectType()` 自动判断。

## BUFF（增益状态）`IsDebuff = false`

| 特效类型 | EffectType | 说明 |
|---|---|---|
| 护盾 | `Shield` | 吸收伤害 |
| 持续治疗 | `HealOverTime` | 逐步恢复生命值 |
| 加速 | `Haste` | 提升行动速度 |
| 无敌 | `Invulnerable` | 不受任何伤害 |
| 不可选中 | `Unselectable` | 无法成为目标 |
| 伤害提升 | `DamageBoost` | 增加攻击输出 |
| 防御提升 | `DefenseBoost` | 减少所受伤害 |
| 暴击提升 | `CritBoost` | 增加暴击率/暴击伤害 |
| 魔法恢复 | `MPRegen` | 增加魔法值回复 |
| 物理免疫 | `PhysicalImmune` | 免疫物理伤害 |
| 魔法免疫 | `MagicalImmune` | 免疫魔法伤害 |
| 技能免疫 | `SkilledImmune` | 免疫技能效果 |
| 完全免疫 | `AllImmune` | 物理 + 技能免疫 |
| 闪避提升 | `EvadeBoost` | 提高闪避率 |
| 生命偷取 | `Lifesteal` | 造成伤害时吸取生命 |
| 持续性弱驱散 | `WeakDispelling` | 周期性驱散弱驱散效果 |
| 持续性强驱散 | `StrongDispelling` | 周期性驱散强驱散效果 |
| 恢复 | `Recovery` | 综合恢复效果 |
| 装备特效 | `Item` | 来自装备的增益 |
| 专注 | `Focusing` | 集中状态 |

## DEBUFF（负面状态）`IsDebuff = true`

| 特效类型 | EffectType | 是否有控制效果 |
|---|---|---|
| 眩晕 | `Stun` | ✅ 强控制 |
| 冻结 | `Freeze` | ✅ 强控制 |
| 沉默 | `Silence` | ✅ 强控制 |
| 定身 | `Root` | ✅ 强控制 |
| 恐惧 | `Fear` | ✅ 强控制 |
| 睡眠 | `Sleep` | ✅ 强控制 |
| 击退 | `Knockback` | ✅ |
| 击倒 | `Knockdown` | ✅ 强控制 |
| 嘲讽 | `Taunt` | ✅ 强控制 |
| 石化 | `Petrify` | ✅ 强控制 |
| 放逐 | `Banish` | ✅ 强控制 |
| 魅惑 | `Charm` | ✅ 强控制 |
| 混乱 | `Confusion` | ✅ 强控制 |
| 缴械 | `Disarm` | ✅ 强控制 |
| 法术沉默 | `SilenceMagic` | ✅ 强控制 |
| 减速 | `Slow` | ❌ 软控制 |
| 衰弱 | `Weaken` | ❌ 软控制 |
| 中毒 | `Poison` | ❌ 软控制 |
| 燃烧 | `Burn` | ❌ 软控制 |
| 流血 | `Bleed` | ❌ 软控制 |
| 致盲 | `Blind` | ❌ 软控制 |
| 致残 | `Cripple` | ❌ 软控制 |
| 诅咒 | `Curse` | ❌ 软控制 |
| 疲劳 | `Exhaustion` | ❌ 软控制 |
| 魔力燃烧 | `ManaBurn` | ❌ 软控制 |
| 重伤 | `GrievousWound` | ❌ 软控制 |
| 易伤 | `Vulnerable` | ❌ 软控制 |
| 迟滞 | `Delay` | ❌ 软控制 |
| 穿透提升 | `PenetrationBoost` | ❌（对敌方）
| 降低魔抗 | `MagicResistBreak` | ❌（对敌方）
| 标记 | `Mark` | ❌ |
| 毁灭 | `Doom` | ❌ |
| 打断施法 | `InterruptCasting` | ❌ |

## 判定原理

驱散时，框架会根据 `IsDebuff` 区分：

- **对敌方施加强驱散** → 消除所有强驱散/弱驱散型 `IsDebuff = false` 的特效（即移除敌方的 BUFF）
- **对友方施加强驱散** → 消除所有控制效果的 `IsDebuff = true` 特效（即移除友方的 DEBUFF）

```csharp
// 单特效判定
bool isDebuff = SkillSet.GetIsDebuffByEffectType(effect.EffectType);

// 驱散时的逻辑（Effect.cs 内部）
if (isEnemy == effect.IsDebuff) 
    continue;  // 敌方跳过 debuff，友方跳过 buff
```
