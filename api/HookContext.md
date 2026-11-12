# HookContext 参数上下文族

统一参数上下文基类，位于 `FunGame.Core.Model.EffectContext`。

特效钩子与 GamingQueue 的上下文事件在管线节点接收上下文，同一实例依次流经事件、技能分发与特效钩子。`SelectChainActionEvent` 使用 `(Character, IReadOnlyList<ChainActionRequest>)` 两个参数，其他事件的具体类型见[事件模式](../dev/events-overview.md)。

## 基类 HookContext

```csharp
public class HookContext(IGamingQueue? queue, Character? trigger)
```

| 属性 | 类型 | 说明 |
|---|---|---|
| `Queue` | `IGamingQueue?` | 当前的行动顺序表实例；局外场景（如局外对目标触发技能效果）为 `null`（只读） |
| `Trigger` | `Character?` | 触发钩子/事件的主角色（只读） |

::: warning 上下文属性的写入权限
上下文属性通常只有 getter，或使用 `{ get; internal set; }`——**模组代码不能直接写 `ctx.X = y`**。需要修改结算行为时，通过钩子的**返回值结构体**（见 [EffectResult](./EffectResult.md)）声明干预意图，由框架聚合后写回上下文。唯一例外：`InquiryContext.Response` 为 public set（in-out 契约）。
:::

## 可变语义约定

| 干预方式 | 说明 |
|---|---|
| 结果结构体 | 使用 `AlterActualDamageResult.IsEvaded`、`OnExemptionCheckResult.ThrowingBonusDelta` 等字段声明干预；框架聚合后写回上下文，后续特效读取当前值 |
| `double` 返回值 | `AlterExpectedDamageBeforeCalculation` 的增量累计进 `ctx.TotalDamageBonus` |
| 肯定动作字段 | `BeforeHealToTarget` 返回 `new() { CancelHeal = true }` 表示取消治疗 |
| `ctx.TotalDamageBonus` | 记录各特效的伤害贡献，可读取其他特效的加成 |

## 上下文类族一览

所有派生类位于 `FunGame.Core.Model.EffectContext`，按业务域分组：

| 上下文类 | 关键属性 | 服务的特效钩子 | 服务的 GamingQueue 事件 |
|---|---|---|---|
| `HookContext`（基类直用） | Queue、Trigger | `OnEffectGained`、`OnEffectLost`、`OnGameStart`、`OnAttributeChanged` | `GameStartEvent`、`GameEndEvent`（Trigger 为胜者） |
| `TurnContext` | DP、Enemys、Teammates、Skills、Items、ChainActions | `OnTurnStart`、`OnTurnEnd` | `TurnStartEvent`、`TurnEndEvent`、`DecideActionEvent` |
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
| `RoundRewardContext` | Binding、TurnKey、Skills、Thief、From、IsCarryOver | `OnRoundRewardGained`、`OnRoundRewardLost`、`OnRoundRewardStolen` | 回合奖励的 6 个前后事件（见 [回合奖励](../guide/round-bonus.md#事件与钩子)） |
| `LevelUpContext` | Level | `OnSkillLevelUp`、`OnOwnerLevelUp` | — |
| `QueueUpdatedContext` | Characters、DP、HardnessTime、Reason、Message | — | `QueueUpdatedEvent` |

`TurnContext.ChainActions` 的类型为 `IReadOnlyList<ChainActionRequest>`，提供当前可确认的协同请求。请求的提交、撤回与确认应通过队列 API 完成，接入方式见 [协同行动](../dev/chain-action.md)。

::: tip 同域共享
参数形状相同的钩子与事件共享同一个上下文类。例如 `TurnContext` 同时服务 `Effect.OnTurnStart` 钩子与 `TurnStartEvent` 事件；事件处理器修改的上下文与特效钩子收到的是同一实例。

**修改类列表属性例外**：`TurnContext` 与 `SelectionContext` 的列表字段（如 `Enemys`、`Skills`、`CastRange`）是普通可变集合，事件处理器与特效钩子可以**就地修改**（Add/Remove/Clear）——这是唯一的直接修改途径。
:::

## RoundRewardContext

回合奖励域上下文：发放（获得）、移除、夺取。框架在奖励管线的每个节点构造一次实例，同一实例依次流经 [ 队列事件 → 特效钩子 ]，并写入回合日志事件流（见 [RoundRewardRecord](./RoundRewardRecord.md)）。

| 属性 | 类型 | 说明 |
|---|---|---|
| `Binding` | `RoundRewardBinding` | 本次涉及的奖励绑定方式（回合 / 角色） |
| `TurnKey` | `int` | 奖励键：回合绑定时为全局回合；角色绑定时为该角色的行动回合序号 |
| `Skills` | `IReadOnlyList<Skill>` | 涉及的全部奖励（夺取时为全部被夺取项） |
| `Thief` | `Character?` | 夺取者（仅 `OnRoundRewardStolen` 有值） |
| `From` | `Character?` | 原持有者（仅 `OnRoundRewardStolen` 有值） |
| `IsCarryOver` | `bool` | 是否为「吟唱回合顺延到结算回合」的被动奖励 |

各钩子触发时 `ctx.Trigger` 的含义：`OnRoundRewardGained` / `OnRoundRewardLost` 为获得/失去奖励的角色；`OnRoundRewardStolen` 为**原持有者**（夺取者的特效同样会被触发，通过 `ctx.Thief` 判定归属）。

## 钩子入口与上下文使用

| 钩子 | 返回值 / 上下文 |
|---|---|
| `OnSkillCastedOutside(SkillCastContext)` | 局外技能效果，用户从 ctx.User 获取 |
| `BeforeSkillCastedOnStatus(SkillCastContext)` | 状态栏特效过滤目标，返回 BeforeSkillCastedOnStatusResult；技能组入口为 BeforeSkillCasted |
| `OnShieldBroken(ShieldContext)` | 返回 OnShieldBrokenResult，ShieldType / ShieldEffect 区分分桶与绑定特效护盾 |
| `OnTimeElapsed(TimeLapseContext)` | Trigger / Grid 区分角色与地图格场景 |

## 干预结算示例

```csharp
public override AlterActionTypeResult AlterActionTypeBeforeAction(DecisionContext ctx)
{
    return new() { PNormalAttack = ctx.PNormalAttack + 0.1 };
}
```

```csharp
public override AlterHardnessTimeResult AlterHardnessTimeAfterNormalAttack(HardnessContext ctx)
{
    return new() { Factor = -0.2 };
}
```

```csharp
public override BeforeHealToTargetResult BeforeHealToTarget(HealContext ctx)
    => new() { CancelHeal = true };
```

## 关联

- 全部钩子清单 → [Effect](./Effect.md)
- 返回值结构体 → [EffectResult](./EffectResult.md)
- 全部事件签名 → [GamingQueue 事件模式](../dev/events-overview.md)
- 自定义特效实战 → [自定义特效](../dev/custom-effect.md)
