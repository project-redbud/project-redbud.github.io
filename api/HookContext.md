# HookContext 参数上下文族

统一参数上下文基类，位于 `FunGame.Core.Model.EffectContext`。

自 v3.0 起，**特效钩子（`Effect` 的约 60 个虚方法）与 GamingQueue 的全部事件委托都改为单一上下文参数**：框架在管线节点构造一次上下文实例，同一实例依次流经 事件 → 技能分发 → 特效钩子，替代了旧版的长参数列表 + `ref` 传参。

## 基类 HookContext

```csharp
public class HookContext(IGamingQueue? queue, Character? trigger)
```

| 属性 | 类型 | 说明 |
|---|---|---|
| `Queue` | `IGamingQueue?` | 当前的行动顺序表实例；局外场景（如局外对目标触发技能效果）为 `null`（只读） |
| `Trigger` | `Character?` | 触发钩子/事件的主角色（只读） |

::: warning 上下文属性只读（internal set）
所有派生上下文的属性均为 `{ get; internal set; }`——**模组代码不能直接写 `ctx.X = y`**。需要修改结算行为时，通过钩子的**返回值结构体**（见 [EffectResult](/api/EffectResult)）声明干预意图，由框架聚合后写回上下文。唯一例外：`InquiryContext.Response` 为 public set（in-out 契约）。
:::

## 可变语义约定

| 旧版机制 | 新版机制 | 说明 |
|---|---|---|
| `ref` 参数（如 `ref isEvaded`、`ref throwingBonus`） | 返回**结果结构体**（如 `AlterActualDamageResult.IsEvaded`、`OnExemptionCheckResult.ThrowingBonusDelta`） | 框架聚合各特效的结果后写回上下文；后续特效可读到前序特效的最新修改 |
| `double` 返回值（`AlterExpectedDamageBeforeCalculation` 增量） | **保持 double 返回值** | 返回的加值仍由框架累计进 `ctx.TotalDamageBonus` |
| `bool` 返回值（拦截/取消） | 返回**结果结构体**，语义统一为「肯定动作」命名 | 如 `BeforeHealToTarget` 旧版返回 `false` 取消治疗 → 新版返回 `new() { CancelHeal = true }` |
| `Dictionary<Effect, double> totalDamageBonus` 参数 | `ctx.TotalDamageBonus` 属性 | 各特效的贡献记录，可读取其他特效的加成 |

## 上下文类族一览

所有派生类位于 `FunGame.Core.Model.EffectContext`，按业务域分组：

| 上下文类 | 关键属性 | 服务的特效钩子 | 服务的 GamingQueue 事件 |
|---|---|---|---|
| `HookContext`（基类直用） | Queue、Trigger | `OnEffectGained`、`OnEffectLost`、`OnGameStart`、`OnAttributeChanged` | `GameStartEvent`、`GameEndEvent`（Trigger 为胜者） |
| `TurnContext` | DP、Enemys、Teammates、Skills、Items | `OnTurnStart`、`OnTurnEnd` | `TurnStartEvent`、`TurnEndEvent`、`DecideActionEvent` |
| `DecisionContext` | DP、State、CanUseItem / CanCastSkill / PUseItem / PCastSkill / PNormalAttack / ForceAction | `AlterActionTypeBeforeAction` | — |
| `SelectionContext` | Skill、NormalAttack、Skills、Items、AllEnemys、AllTeammates、Enemys、Teammates、CastRange、Map、MoveRange、ContinuousKilling、EarnedMoney | `AlterSelectListBeforeAction`、`AlterSelectListBeforeSelection`、`BeforeSelectTargetGrid` | 全部 6 个选择型事件 |
| `DamageContext` | Enemy、Damage、ActualDamage、IsNormalAttack、DamageType、MagicType、DamageResult、IsEvaded、ShieldMessage、OriginalMessage、TotalDamageBonus、BaseEP、Dice、ThrowingBonus | 伤害计算前后修改、伤害应用、免疫/闪避/暴击检定、能量获取修改（共 13 个钩子） | `DamageToEnemyEvent` |
| `ShieldContext` | Attacker、DamageType、MagicType、Damage、Message、ShieldType、ShieldEffect、OverFlowing | `BeforeShieldCalculation`、`OnShieldNeutralizeDamage`、`OnShieldBroken` | — |
| `SkillCastContext` | User（局外）、Skill、Item、DP、SkillTarget、Targets、Grids、Others、MPCost、EPCost、Cost、Interrupter | 吟唱 / 打断 / 释放前后共 10 个钩子 | `CharacterPreCastSkillEvent`、`CharacterCastSkillEvent`、`CharacterCastItemSkillEvent`、`InterruptCastingEvent` |
| `HardnessContext` | Skill、BaseHardnessTime、IsCheckProtected | `AlterHardnessTimeAfterNormalAttack`、`AlterHardnessTimeAfterCastSkill` | — |
| `HealContext` | Target、Heal、CanRespawn、IsRespawn、TotalHealBonus | `BeforeHealToTarget`、`AlterHealValueBeforeHealToTarget` | `HealToTargetEvent` |
| `LifestealContext` | Enemy、Damage、Steal | `BeforeLifesteal`、`AfterLifesteal` | — |
| `DeathContext` | Killer、HasMaster、ContinuousKilling、EarnedMoney、Assists | `AfterDeathCalculation` | `DeathCalculationEvent`、`DeathCalculationByTeammateEvent`、`CharacterDeathEvent` |
| `DispelContext` | Target、Effect、DispellerEffect、IsEnemy | `OnDispellingEffect`、`OnEffectIsBeingDispelled` | — |
| `TimeLapseContext` | Grid、Elapsed、HR、MR | `BeforeApplyRecoveryAtTimeLapsing`、`OnTimeElapsed` | — |
| `InquiryContext` | DP、Options、**Response（public set）** | `OnCharacterInquiry` | `CharacterInquiryEvent` |
| `ImmuneContext` | Target、Source、Skill、Item、Effect、IsEvade、ThrowingBonus | `OnImmuneCheck`、`OnExemptionCheck` | `CharacterImmunedEvent`、`CharacterExemptionEvent` |
| `ActionContext` | DP、ActionType、Record | `OnCharacterActionStart`、`OnCharacterActionTaken`、`OnCharacterDecisionCompleted` | `CharacterActionTakenEvent`、`CharacterDecisionCompletedEvent`、`CharacterDoNothingEvent`、`CharacterGiveUpEvent` |
| `MoveContext` | DP、Target | `AfterCharacterMove` | `CharacterMoveEvent` |
| `NormalAttackContext` | DP、NormalAttack、Targets | `AfterCharacterNormalAttack` | `CharacterNormalAttackEvent` |
| `ItemUseContext` | DP、Item、Skill、Targets | `AfterCharacterUseItem` | `CharacterUseItemEvent` |
| `RoundRewardContext` | Binding、TurnKey、Skills、Thief、From、IsCarryOver | `OnRoundRewardGained`、`OnRoundRewardLost`、`OnRoundRewardStolen` | 回合奖励的 6 个前后事件（见 [回合奖励](/guide/round-bonus#事件与钩子)） |
| `LevelUpContext` | Level | `OnSkillLevelUp`、`OnOwnerLevelUp` | — |
| `QueueUpdatedContext` | Characters、DP、HardnessTime、Reason、Message | — | `QueueUpdatedEvent` |

::: tip 同域共享
参数形状相同的钩子与事件共享同一个上下文类。例如 `TurnContext` 同时服务 `Effect.OnTurnStart` 钩子与 `TurnStartEvent` 事件；事件处理器修改的上下文与特效钩子收到的是同一实例。

**修改类列表属性例外**：`TurnContext` 与 `SelectionContext` 的列表字段（如 `Enemys`、`Skills`、`CastRange`）是普通可变集合，事件处理器与特效钩子可以**就地修改**（Add/Remove/Clear）——这是唯一的直接修改途径。
:::

## RoundRewardContext

回合奖励域上下文：发放（获得）、移除、夺取。框架在奖励管线的每个节点构造一次实例，同一实例依次流经 [ 队列事件 → 特效钩子 ]，并写入回合日志事件流（见 [RoundRewardRecord](/api/RoundRewardRecord)）。

| 属性 | 类型 | 说明 |
|---|---|---|
| `Binding` | `RoundRewardBinding` | 本次涉及的奖励绑定方式（回合 / 角色） |
| `TurnKey` | `int` | 奖励键：回合绑定时为全局回合；角色绑定时为该角色的行动回合序号 |
| `Skills` | `IReadOnlyList<Skill>` | 涉及的全部奖励（夺取时为全部被夺取项） |
| `Thief` | `Character?` | 夺取者（仅 `OnRoundRewardStolen` 有值） |
| `From` | `Character?` | 原持有者（仅 `OnRoundRewardStolen` 有值） |
| `IsCarryOver` | `bool` | 是否为「吟唱回合顺延到结算回合」的被动奖励 |

各钩子触发时 `ctx.Trigger` 的含义：`OnRoundRewardGained` / `OnRoundRewardLost` 为获得/失去奖励的角色；`OnRoundRewardStolen` 为**原持有者**（夺取者的特效同样会被触发，通过 `ctx.Thief` 判定归属）。

## v3.0 破坏性变更：改名与合并的钩子

签名收窄为单上下文参数后，以下同名重载被改名或合并：

| 旧签名 | 新签名 | 说明 |
|---|---|---|
| `OnSkillCasted(User, List<Character>, Dictionary)` | `OnSkillCastedOutside(SkillCastContext)` | 局外版改名，触发者放在 `ctx.User` |
| `BeforeSkillCasted(Character, Skill, ...)` 返回 bool（状态栏特效版） | `BeforeSkillCastedOnStatus(SkillCastContext)` 返回 `BeforeSkillCastedOnStatusResult` | 与技能组版重名冲突而改名；技能组版保留 `BeforeSkillCasted` 原名 |
| `OnShieldBroken(Character, Character, ShieldType, double)` 与 `OnShieldBroken(Character, Character, Effect, double)` | 合并为 `OnShieldBroken(ShieldContext)` 返回 `OnShieldBrokenResult` | 用 `ctx.ShieldType`（非绑定护盾）/ `ctx.ShieldEffect`（绑定特效护盾）区分 |
| `OnTimeElapsed(Character, double)` 与 `OnTimeElapsed(Grid, double)` | 合并为 `OnTimeElapsed(TimeLapseContext)` | 用 `ctx.Trigger`（角色版）/ `ctx.Grid`（地图格版）区分 |

## 迁移示例

```csharp
// ═══ 旧版：ref 修改 + 长参数 + 返回行动类型 ═══
public override CharacterActionType AlterActionTypeBeforeAction(
    Character character, DecisionPoints dp, CharacterState state,
    ref bool canUseItem, ref bool canCastSkill,
    ref double pUseItem, ref double pCastSkill, ref double pNormalAttack,
    ref bool forceAction)
{
    pNormalAttack += 0.1;
    return CharacterActionType.None;
}

// ═══ 新版：单上下文参数 + 返回结果结构体 ═══
public override AlterActionTypeResult AlterActionTypeBeforeAction(DecisionContext ctx)
{
    return new AlterActionTypeResult
    {
        ActionType = CharacterActionType.None,
        PNormalAttack = ctx.PNormalAttack + 0.1   // 覆盖后者胜：基于 ctx 最新值链式叠加
    };
}
```

```csharp
// ═══ 旧版：ref 修改硬直时间 ═══
public override void AlterHardnessTimeAfterNormalAttack(
    Character character, ref double baseHardnessTime, ref bool isCheckProtected)
{
    baseHardnessTime *= 0.8;
}

// ═══ 新版：返回系数（连乘聚合，最终硬直 = 基础 × (1 + Factor)）═══
public override AlterHardnessTimeResult AlterHardnessTimeAfterNormalAttack(HardnessContext ctx)
{
    return new AlterHardnessTimeResult { Factor = -0.2 };   // 即 × 0.8
}
```

```csharp
// ═══ 旧版：bool 返回值（false = 取消治疗）═══
public override bool BeforeHealToTarget(Character actor, Character target, double heal, bool canRespawn)
    => false;

// ═══ 新版：肯定动作命名（CancelHeal = true 取消治疗）═══
public override BeforeHealToTargetResult BeforeHealToTarget(HealContext ctx)
    => new() { CancelHeal = true };
```

```csharp
// ═══ 旧版：OnApplyDamage 10 个参数 ═══
public override void OnApplyDamage(Character character, Character enemy, double damage,
    double actualDamage, bool isNormalAttack, DamageType damageType, MagicType magicType,
    DamageResult damageResult, string shieldMessage, ref string originalMessage)

// ═══ 新版 ═══
public override OnApplyDamageResult OnApplyDamage(DamageContext ctx)
{
    return new OnApplyDamageResult { OriginalMessage = ctx.OriginalMessage + "（附加信息）" };
}
```

## 关联

- 全部钩子清单 → [Effect](/api/Effect)
- 返回值结构体 → [EffectResult](/api/EffectResult)
- 全部事件签名 → [GamingQueue 事件模式](/dev/events-overview)
- 自定义特效实战 → [自定义特效](/dev/custom-effect)
