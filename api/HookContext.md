# HookContext 参数上下文族

统一参数上下文基类，位于 `FunGame.Core.Model.EffectContext`。

自 v3.0 起，**特效钩子（`Effect` 的约 60 个虚方法）与 GamingQueue 的全部事件委托都改为单一上下文参数**：框架在管线节点构造一次上下文实例，同一实例依次流经 事件 → 技能分发 → 特效钩子，替代了旧版的长参数列表 + `ref` 传参。

```csharp
// 旧版（v3.0 之前）
public override void AlterHardnessTimeAfterNormalAttack(Character character, ref double baseHardnessTime, ref bool isCheckProtected)
{
    baseHardnessTime *= 0.8;
}

// 新版（v3.0 起）
public override void AlterHardnessTimeAfterNormalAttack(HardnessContext ctx)
{
    ctx.BaseHardnessTime *= 0.8;   // ref 变量 → 可写属性
}
```

## 基类 HookContext

```csharp
public class HookContext(IGamingQueue? queue, Character? actor)
```

| 属性 | 类型 | 说明 |
|---|---|---|
| `Queue` | `IGamingQueue?` | 当前的行动顺序表实例；局外场景（如局外对目标触发技能效果）为 `null`（只读） |
| `Actor` | `Character?` | 触发钩子/事件的主角色（只读） |

## 可变语义约定

| 旧版机制 | 新版机制 | 说明 |
|---|---|---|
| `ref` 参数（如 `ref damage`、`ref isEvaded`） | 上下文可写属性（`ctx.Damage = x`、`ctx.IsEvaded = true`） | 框架在调用前写入初值、调用后读回，链式修改语义不变 |
| `double` 返回值（伤害/治疗增减值） | **保持返回值不变** | 返回的加值仍由框架累计进 `ctx.TotalDamageBonus` / `ctx.TotalHealBonus` |
| `bool` 返回值（拦截/取消） | **保持返回值不变** | 如 `BeforeApplyTrueDamage` 返回 `true` 仍表示取消伤害 |
| `Dictionary<Effect, double> totalDamageBonus` 参数 | `ctx.TotalDamageBonus` 属性 | 各特效的贡献记录，可读取其他特效的加成 |

## 上下文类族一览

所有派生类位于 `FunGame.Core.Model.EffectContext`，按业务域分组（表中「可写」即原 `ref` 参数）：

| 上下文类 | 关键属性 | 服务的特效钩子 | 服务的 GamingQueue 事件 |
|---|---|---|---|
| `HookContext`（基类直用） | Queue、Actor | `OnEffectGained`、`OnEffectLost`、`OnGameStart`、`OnAttributeChanged` | `GameStartEvent`、`GameEndEvent`（Actor 为胜者） |
| `TurnContext` | DP、Enemys、Teammates、Skills、Items | `OnTurnStart`、`OnTurnEnd` | `TurnStartEvent`、`TurnEndEvent`、`DecideActionEvent` |
| `DecisionContext` | DP、State、CanUseItem / CanCastSkill / PUseItem / PCastSkill / PNormalAttack / ForceAction（全部可写） | `AlterActionTypeBeforeAction` | — |
| `SelectionContext` | Skill、NormalAttack、Skills、Items、AllEnemys、AllTeammates、Enemys、Teammates、CastRange、Map、MoveRange、ContinuousKilling、EarnedMoney | `AlterSelectListBeforeAction`、`AlterSelectListBeforeSelection`、`BeforeSelectTargetGrid` | 全部 6 个选择型事件 |
| `DamageContext` | Enemy、Damage、ActualDamage、IsNormalAttack、DamageType、MagicType、DamageResult、IsEvaded（可写）、ShieldMessage、OriginalMessage（可写）、TotalDamageBonus、BaseEP（可写）、Dice、ThrowingBonus（可写） | 伤害计算前后修改、伤害应用、免疫/闪避/暴击检定、能量获取修改（共 13 个钩子） | `DamageToEnemyEvent` |
| `ShieldContext` | Attacker、DamageType、MagicType、Damage、DamageReduce（可写）、Message（可写）、ShieldType、ShieldEffect、OverFlowing | `BeforeShieldCalculation`、`OnShieldNeutralizeDamage`、`OnShieldBroken` | — |
| `SkillCastContext` | User（局外）、Skill、Item、DP、SkillTarget、Targets、Grids、Others、MPCost、EPCost、Cost、Interrupter | 吟唱 / 打断 / 释放前后共 10 个钩子 | `CharacterPreCastSkillEvent`、`CharacterCastSkillEvent`、`CharacterCastItemSkillEvent`、`InterruptCastingEvent` |
| `HardnessContext` | Skill、BaseHardnessTime（可写）、IsCheckProtected（可写） | `AlterHardnessTimeAfterNormalAttack`、`AlterHardnessTimeAfterCastSkill` | — |
| `HealContext` | Target、Heal、CanRespawn（可写）、IsRespawn、TotalHealBonus | `BeforeHealToTarget`、`AlterHealValueBeforeHealToTarget` | `HealToTargetEvent` |
| `LifestealContext` | Enemy、Damage、Steal | `BeforeLifesteal`、`AfterLifesteal` | — |
| `DeathContext` | Killer、HasMaster、ContinuousKilling、EarnedMoney、Assists | `AfterDeathCalculation` | `DeathCalculationEvent`、`DeathCalculationByTeammateEvent`、`CharacterDeathEvent` |
| `DispelContext` | Target、Effect、DispellerEffect、IsEnemy | `OnDispellingEffect`、`OnEffectIsBeingDispelled` | — |
| `TimeLapseContext` | Grid、Elapsed、HR（可写）、MR（可写） | `BeforeApplyRecoveryAtTimeLapsing`、`OnTimeElapsed` | — |
| `InquiryContext` | DP、Options、Response | `OnCharacterInquiry` | `CharacterInquiryEvent` |
| `ImmuneContext` | Target、Source、Skill、Item、Effect、IsEvade、ThrowingBonus（可写） | `OnImmuneCheck`、`OnExemptionCheck` | `CharacterImmunedEvent`、`CharacterExemptionEvent` |
| `ActionContext` | DP、ActionType、Record | `OnCharacterActionStart`、`OnCharacterActionTaken`、`OnCharacterDecisionCompleted` | `CharacterActionTakenEvent`、`CharacterDecisionCompletedEvent`、`CharacterDoNothingEvent`、`CharacterGiveUpEvent` |
| `MoveContext` | DP、Target | `AfterCharacterMove` | `CharacterMoveEvent` |
| `NormalAttackContext` | DP、NormalAttack、Targets | `AfterCharacterNormalAttack` | `CharacterNormalAttackEvent` |
| `ItemUseContext` | DP、Item、Skill、Targets | `AfterCharacterUseItem` | `CharacterUseItemEvent` |
| `LevelUpContext` | Level | `OnSkillLevelUp`、`OnOwnerLevelUp` | — |
| `QueueUpdatedContext` | Characters、DP、HardnessTime、Reason、Message | — | `QueueUpdatedEvent` |

::: tip 同域共享
参数形状相同的钩子与事件共享同一个上下文类。例如 `TurnContext` 同时服务 `Effect.OnTurnStart` 钩子与 `TurnStartEvent` 事件；事件处理器修改 `ctx.Enemys` 后，同一实例会继续传给该回合内后续触发的特效钩子。
:::

## v3.0 破坏性变更：改名与合并的钩子

签名收窄为单上下文参数后，以下同名重载被改名或合并：

| 旧签名 | 新签名 | 说明 |
|---|---|---|
| `OnSkillCasted(User, List<Character>, Dictionary)` | `OnSkillCastedOutside(SkillCastContext)` | 局外版改名，触发者放在 `ctx.User` |
| `BeforeSkillCasted(Character, Skill, ...)` 返回 bool（状态栏特效版） | `BeforeSkillCastedOnStatus(SkillCastContext)` | 与技能组版重名冲突而改名；技能组版保留 `BeforeSkillCasted` 原名 |
| `OnShieldBroken(Character, Character, ShieldType, double)` 与 `OnShieldBroken(Character, Character, Effect, double)` | 合并为 `OnShieldBroken(ShieldContext)` | 用 `ctx.ShieldType`（非绑定护盾）/ `ctx.ShieldEffect`（绑定特效护盾）区分 |
| `OnTimeElapsed(Character, double)` 与 `OnTimeElapsed(Grid, double)` | 合并为 `OnTimeElapsed(TimeLapseContext)` | 用 `ctx.Actor`（角色版）/ `ctx.Grid`（地图格版）区分 |

## 迁移示例

```csharp
// ═══ 旧版：ref 修改 + 长参数 ═══
public override CharacterActionType AlterActionTypeBeforeAction(
    Character character, DecisionPoints dp, CharacterState state,
    ref bool canUseItem, ref bool canCastSkill,
    ref double pUseItem, ref double pCastSkill, ref double pNormalAttack,
    ref bool forceAction)
{
    pNormalAttack += 0.1;
    return CharacterActionType.None;
}

// ═══ 新版：单上下文参数 ═══
public override CharacterActionType AlterActionTypeBeforeAction(DecisionContext ctx)
{
    ctx.PNormalAttack += 0.1;
    return CharacterActionType.None;   // 返回值语义保持不变
}
```

```csharp
// ═══ 旧版：OnApplyDamage 10 个参数 ═══
public override void OnApplyDamage(Character character, Character enemy, double damage,
    double actualDamage, bool isNormalAttack, DamageType damageType, MagicType magicType,
    DamageResult damageResult, string shieldMessage, ref string originalMessage)

// ═══ 新版 ═══
public override void OnApplyDamage(DamageContext ctx)
{
    ctx.OriginalMessage += "（附加信息）";   // 原 ref originalMessage
}
```

## 关联

- 全部钩子清单 → [Effect](/api/Effect)
- 全部事件签名 → [GamingQueue 事件模式](/dev/events-overview)
- 自定义特效实战 → [自定义特效](/dev/custom-effect)
