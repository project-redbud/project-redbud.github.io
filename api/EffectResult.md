# EffectResult

特效钩子返回值结构体族，位于 `FunGame.Core.Model.EffectResult`。共 23 个 `public readonly record struct`。

::: info 设计要点
全部遵循「**默认即无害**」：`default` 结构体 = 该特效不干预。需要干预时返回设置了相应字段的结构体。bool 语义统一为「**肯定动作**」命名（如 `CancelHeal`、`BlockInterruption`），替代旧版易混淆的 `bool` 返回值。
:::

## 聚合规则

多个特效返回的结果按以下四类规则聚合：

| 规则 | 含义 | 示例字段 |
|---|---|---|
| **OR** | 任一 true 即生效，短路后续特效 | `CancelHeal`、`ForceAction` |
| **SUM** | 数值累加 | `DamageDelta`、`ThrowingBonusDelta` |
| **覆盖后者胜** | 非 null 即覆盖，后续特效可读 ctx 最新值链式叠加 | `BaseEP?`、`DamageType?` |
| **连乘** | 系数相乘 | `Factor`（硬直系数） |

## 结构体清单

| 结构体 | 对应钩子 | 属性（聚合规则） |
|---|---|---|
| `AlterActionTypeResult` | `AlterActionTypeBeforeAction` | `ActionType`、`ForceAction`(OR)、`CanUseItem?`/`CanCastSkill?`/`PUseItem?`/`PCastSkill?`/`PNormalAttack?`（覆盖后者胜） |
| `AlterActualDamageResult` | `AlterActualDamageAfterCalculation` | `DamageDelta`(SUM)、`IsEvaded`(OR，化解伤害) |
| `AlterDamageTypeResult` | `AlterDamageTypeBeforeCalculation` | `IsNormalAttack?`/`DamageType?`/`MagicType?`（覆盖后者胜） |
| `AlterEPResult` | `AlterEPAfterDamage` / `AlterEPAfterGetDamage` | `BaseEP?`（覆盖后者胜，可 `ctx.BaseEP * 1.5` 链式） |
| `AlterHardnessTimeResult` | `AlterHardnessTimeAfterNormalAttack` / `AfterCastSkill` | `Factor`(连乘)、`ClearHardnessTime`(OR，清零硬直并解除插队保护)、`OverrideCheckProtected?` |
| `AlterHealValueResult` | `AlterHealValueBeforeHealToTarget` | `HealDelta`(SUM)、`AllowRespawn`(OR) |
| `BeforeApplyRecoveryResult` | `BeforeApplyRecoveryAtTimeLapsing` | `CancelRecovery`(OR)、`HROverride?`/`MROverride?` |
| `BeforeApplyTrueDamageResult` | `BeforeApplyTrueDamage` | `NullifyDamage`(OR) |
| `BeforeCriticalCheckResult` | `BeforeCriticalCheck` | `SkipCriticalCheck`(OR)、`ThrowingBonusDelta`(SUM) |
| `BeforeEvadeCheckResult` | `BeforeEvadeCheck` | `SkipEvadeCheck`(OR)、`ThrowingBonusDelta`(SUM) |
| `BeforeHealToTargetResult` | `BeforeHealToTarget` | `CancelHeal`(OR) |
| `BeforeLifestealResult` | `BeforeLifesteal` | `CancelLifesteal`(OR) |
| `BeforeShieldCalculationResult` | `BeforeShieldCalculation` | `SkipShield`(OR)、`DamageReduce`(SUM)、`Message?`（覆盖后者胜） |
| `BeforeSkillCastWillBeInterruptedResult` | `BeforeSkillCastWillBeInterrupted` | `BlockInterruption`(OR) |
| `BeforeSkillCastedOnStatusResult` | `BeforeSkillCastedOnStatus` | `RemoveFromTargets`(OR) |
| `OnApplyDamageResult` | `OnApplyDamage` | `OriginalMessage?`（覆盖后者胜） |
| `OnDamageImmuneCheckResult` | `OnDamageImmuneCheck` | `IgnoreDamageImmunity`(OR) |
| `OnEffectIsBeingDispelledResult` | `OnEffectIsBeingDispelled` | `BlockDispel`(OR) |
| `OnEvadedTriggeredResult` | `OnEvadedTriggered` | `IgnoreEvaded`(OR) |
| `OnExemptionCheckResult` | `OnExemptionCheck` | `SkipExemptionCheck`(OR，跳过豁免骰=必定命中)、`ThrowingBonusDelta`(SUM) |
| `OnImmuneCheckResult` | `OnImmuneCheck` | `IgnoreImmunity`(OR) |
| `OnShieldBrokenResult` | `OnShieldBroken` | `NullifyRemainingDamage`(OR，剩余伤害置 0) |

## 使用示例

```csharp
public class MyInterruptEffect : Effect
{
    // 旧版：bool BeforeSkillCastWillBeInterrupted(...) => false;  // false = 阻止打断
    // 新版：返回结构体，BlockInterruption = true 表示阻止打断
    public override BeforeSkillCastWillBeInterruptedResult BeforeSkillCastWillBeInterrupted(SkillCastContext ctx)
        => new() { BlockInterruption = true };

    // 旧版：double AlterEPAfterDamage(Character, ref double baseEP)  // ref 修改
    // 新版：返回覆盖值，可链式读取 ctx.BaseEP
    public override AlterEPResult AlterEPAfterDamage(DamageContext ctx)
        => new() { BaseEP = ctx.BaseEP * 1.5 };
}
```

## 关联

- 使用这些结构体的钩子 → [Effect](/api/Effect)
- 参数上下文族 → [HookContext](/api/HookContext)
