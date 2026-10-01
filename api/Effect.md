# Effect

特效基类，位于 `FunGame.Core.Entity`。

需继承并使用。一个 `Skill` 由多个 `Effect` 组合而成，每个 `Effect` 负责一种具体效果。特效承载技能的实际效果，可通过约 60 个虚方法（钩子）介入游戏的各个环节。

::: info v3.0 起统一上下文参数与结构体回读
所有可重写钩子均接收单一**参数上下文对象**（`HookContext` 派生类，如 `DamageContext`、`SkillCastContext`），替代旧版的长参数列表与 `ref` 传参；需要回读结果的钩子返回 **`readonly record struct` 结果对象**（见 [EffectResult](/api/EffectResult)），`default` 即"不干预"。上下文定义见 [HookContext 参数上下文族](/api/HookContext)。
:::

## 构造函数

```csharp
// skill：所属技能；args：动态参数（写入 Values 字典）
protected Effect(Skill skill, Dictionary<string, object>? args = null)

// 默认构造（JSON 反序列化用，Skill = new()）
public Effect()
```

## 核心属性

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `Id` | `long` | — | 唯一标识符（从 `Skill` 继承） |
| `Name` | `string` | — | 名称（从 `Skill` 继承） |
| `Description` | `string` | `""` | 效果描述 |
| `Skill` | `Skill` | — | 所属技能（只读） |
| `Level` | `int` | — | 等级，跟随技能等级（只读） |
| `Priority` | `int` | 0 | 触发优先级，**越大越先触发**（框架按 Priority 降序、去重调度），同时在状态栏中影响哈希排序 |
| `EffectType` | `EffectType` | `None` | 特效类型（50+ 种，决定 BUFF/DEBUFF/控制/驱散分类） |
| `IsDebuff` | `bool` | false | 是否是负面效果 |
| `MagicType` | `MagicType` | `None` | 魔法类型 |
| `MagicEfficacy` | `double` | — | 魔法效能%（来自 `Skill.MagicEfficacy`，只读） |
| `Values` | `Dictionary<string, object>` | — | 动态参数数据 |

## 持续时间

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `Durative` | `bool` | false | 是否按时间持续 |
| `Duration` | `double` | 0 | 持续时间（配合 `Durative = true`） |
| `DurationTurn` | `int` | 0 | 持续时间（回合，`Durative = false` 时） |
| `RemainDuration` | `double` | 0 | 剩余持续时间 |
| `RemainDurationTurn` | `int` | 0 | 剩余持续回合数 |
| `DurativeWithoutDuration` | `bool` | false | 无具体持续时间的持续性特效 |

## 驱散系统

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `DispelType` | `DispelType` | `None` | 驱散性（能驱散什么） |
| `DispelledType` | `DispelledType` | `Weak` | 被驱散性（能被什么驱散） |
| `DispelDescription` | `string` | — | 驱散性文字说明 |
| `CanWeakDispel` | `bool` | — | 是否具备弱驱散能力（只读） |
| `CanStrongDispel` | `bool` | — | 是否具备强驱散能力（只读） |
| `IsTemporaryDispel` | `bool` | — | 是否是临时驱散（只读） |
| `IsBeingTemporaryDispelled` | `bool` | false | 是否处于临时被驱散状态 |

## 豁免系统

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `Exemptable` | `bool` | — | 是否可被属性豁免（只读） |
| `ExemptionType` | `PrimaryAttribute` | 自动判定 | 豁免所需属性类型 |
| `ExemptDuration` | `bool` | false | 豁免是否减少持续时间 |
| `ExemptionDescription` | `string` | — | 豁免性文字说明 |
| `IgnoreImmune` | `ImmuneType` | `None` | 可无视的免疫类型 |

## 外观

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `ForceHideInStatusBar` | `bool` | false | 强制在状态栏中隐藏 |
| `ShowInStatusBar` | `bool` | — | 是否显示在状态栏（只读） |
| `IsInEffect` | `bool` | — | 特效是否生效（只读，`Level > 0 && !IsBeingTemporaryDispelled`） |

## 关系属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `ParentEffect` | `Effect?` | 附属的主特效 |
| `IsSubsidiary` | `bool` | 是否是附属特效（只读） |
| `Source` | `Character?` | 特效来源角色 |
| `GamingQueue` | `IGamingQueue?` | 所在的游戏队列 |
| `Random` | `Random` | 队列的确定性随机数（无队列时回退 `Random.Shared`） |
| `GameplayEquilibriumConstant` | `EquilibriumConstant` | 游戏平衡常数（继承自 BaseEntity） |

---

## 可重写钩子

所有钩子均为单一上下文参数（括号内为上下文类型，主角色统一从 `ctx.Trigger` 获取）。带返回结构体的钩子按聚合规则合并（OR 短路 / SUM 累加 / 覆盖后者胜 / 连乘），见 [EffectResult](/api/EffectResult)。

### 生命周期

| 方法 | 上下文 | 触发时机 |
|---|---|---|
| `OnEffectGained(HookContext)` | 主角色 | 特效施加到角色 |
| `OnEffectLost(HookContext)` | 主角色 | 特效从角色移除 |
| `OnGameStart(HookContext)` | — | 游戏开始时 |
| `OnTurnStart(TurnContext)` | DP/敌人/队友/技能/物品列表 | 回合开始时 |
| `OnTurnEnd(TurnContext)` | DP | 回合结束时 |
| `OnTimeElapsed(TimeLapseContext)` | `ctx.Trigger` 或 `ctx.Grid` | 时间流逝时（角色版与地图格版共用，v3.0 合并） |
| `OnAttributeChanged(HookContext)` | 主角色 | 角色属性变化时 |
| `OnSkillLevelUp(LevelUpContext)` | `ctx.Level` | 技能升级时 |
| `OnOwnerLevelUp(LevelUpContext)` | `ctx.Level` | 所属角色升级时 |
| `AfterDeathCalculation(DeathContext)` | Killer/HasMaster/ContinuousKilling/EarnedMoney/Assists | 死亡结算后（广播全体） |

### 技能相关

| 方法 | 上下文 | 触发时机 | 返回 |
|---|---|---|---|
| `OnSkillCasting(SkillCastContext)` | 施法者/Targets/Grids | 技能吟唱开始时 | void |
| `OnSkillCasted(SkillCastContext)` | 施法者/Targets/Grids/Others | 技能释放完成时（局内） | void |
| `OnSkillCastedOutside(SkillCastContext)` | `ctx.User` | 技能释放完成（局外，v3.0 由 User 重载改名） | void |
| `BeforeSkillCasted(SkillCastContext)` | MPCost/EPCost | 技能释放前【技能的特效组】 | void |
| `BeforeSkillCastedOnStatus(SkillCastContext)` | Skill/Targets/Others | 技能释放前【状态栏特效】 | `BeforeSkillCastedOnStatusResult`（RemoveFromTargets） |
| `AfterSkillCasted(SkillCastContext)` | 施法者/Targets/Grids | 技能释放后 | void |
| `BeforeSkillCastWillBeInterrupted(SkillCastContext)` | Skill/Interrupter | 技能将被打断前 | `BeforeSkillCastWillBeInterruptedResult`（BlockInterruption） |
| `OnSkillCastInterrupted(SkillCastContext)` | Skill/Interrupter | 技能吟唱被打断时 | void |

### 伤害相关

| 方法 | 上下文要点 | 触发时机 | 返回 |
|---|---|---|---|
| `AlterDamageTypeBeforeCalculation(DamageContext)` | 可写 IsNormalAttack/DamageType/MagicType | 计算前修改伤害类型 | `AlterDamageTypeResult` |
| `AlterExpectedDamageBeforeCalculation(DamageContext)` | TotalDamageBonus | 乘区1调整 | double（加值） |
| `AlterActualDamageAfterCalculation(DamageContext)` | — | 乘区2调整 | `AlterActualDamageResult`（DamageDelta/IsEvaded） |
| `BeforeApplyTrueDamage(DamageContext)` | — | 真实伤害生效前 | `BeforeApplyTrueDamageResult`（NullifyDamage） |
| `OnApplyDamage(DamageContext)` | 可写 OriginalMessage | 伤害生效时 | `OnApplyDamageResult` |
| `AfterDamageCalculation(DamageContext)` | — | 伤害计算完成后 | void |

### 治疗相关

| 方法 | 上下文要点 | 触发时机 | 返回 |
|---|---|---|---|
| `BeforeHealToTarget(HealContext)` | — | 治疗前 | `BeforeHealToTargetResult`（CancelHeal） |
| `AlterHealValueBeforeHealToTarget(HealContext)` | — | 修改治疗值 | `AlterHealValueResult`（HealDelta/AllowRespawn） |

### 硬直时间

| 方法 | 上下文要点 | 触发时机 | 返回 |
|---|---|---|---|
| `AlterHardnessTimeAfterNormalAttack(HardnessContext)` | BaseHardnessTime/IsCheckProtected | 普攻后调整硬直 | `AlterHardnessTimeResult`（Factor 连乘） |
| `AlterHardnessTimeAfterCastSkill(HardnessContext)` | 同上 + Skill | 释放技能后调整硬直 | `AlterHardnessTimeResult` |

### 能量与回复

| 方法 | 上下文要点 | 触发时机 | 返回 |
|---|---|---|---|
| `AlterEPAfterDamage(DamageContext)` | BaseEP | 造成伤害后修改获得的 EP | `AlterEPResult` |
| `AlterEPAfterGetDamage(DamageContext)` | BaseEP | 受到伤害后修改获得的 EP | `AlterEPResult` |
| `BeforeApplyRecoveryAtTimeLapsing(TimeLapseContext)` | HR/MR | 时间流逝回复前 | `BeforeApplyRecoveryResult`（CancelRecovery/HROverride/MROverride） |

### 检定：闪避 / 暴击

| 方法 | 上下文要点 | 触发时机 | 返回 |
|---|---|---|---|
| `BeforeEvadeCheck(DamageContext)` | ThrowingBonus | 闪避检定前 | `BeforeEvadeCheckResult`（SkipEvadeCheck/ThrowingBonusDelta） |
| `OnEvadedTriggered(DamageContext)` | Dice | 闪避成功时 | `OnEvadedTriggeredResult`（IgnoreEvaded） |
| `BeforeCriticalCheck(DamageContext)` | ThrowingBonus | 暴击检定前 | `BeforeCriticalCheckResult`（SkipCriticalCheck/ThrowingBonusDelta） |
| `OnCriticalDamageTriggered(DamageContext)` | Dice | 暴击触发时 | void |

### 免疫与豁免

| 方法 | 上下文要点 | 触发时机 | 返回 |
|---|---|---|---|
| `OnImmuneCheck(ImmuneContext)` | Target/Skill/Item | 技能免疫检定 | `OnImmuneCheckResult`（IgnoreImmunity） |
| `OnDamageImmuneCheck(DamageContext)` | — | 伤害免疫检定 | `OnDamageImmuneCheckResult`（IgnoreDamageImmunity） |
| `OnExemptionCheck(ImmuneContext)` | Effect/IsEvade、ThrowingBonus | 豁免检定 | `OnExemptionCheckResult`（SkipExemptionCheck/ThrowingBonusDelta） |

### 护盾

| 方法 | 上下文要点 | 触发时机 | 返回 |
|---|---|---|---|
| `BeforeShieldCalculation(ShieldContext)` | DamageReduce/Message | 护盾结算前 | `BeforeShieldCalculationResult`（SkipShield/DamageReduce） |
| `OnShieldNeutralizeDamage(ShieldContext)` | ShieldType | 护盾抵消伤害时 | void |
| `OnShieldBroken(ShieldContext)` | ShieldType 或 ShieldEffect | 护盾破碎时（v3.0 两版重载合并为一个钩子） | `OnShieldBrokenResult`（NullifyRemainingDamage） |

### 生命偷取

| 方法 | 上下文 | 触发时机 | 返回 |
|---|---|---|---|
| `BeforeLifesteal(LifestealContext)` | Enemy/Damage/Steal | 生命偷取前 | `BeforeLifestealResult`（CancelLifesteal） |
| `AfterLifesteal(LifestealContext)` | Enemy/Damage/Steal | 生命偷取后 | void |

### 驱散

| 方法 | 上下文 | 触发时机 | 返回 |
|---|---|---|---|
| `OnDispellingEffect(DispelContext)` | Target/Effect | 驱散其他特效时（有默认实现） | void |
| `OnEffectIsBeingDispelled(DispelContext)` | Target/DispellerEffect | 自身被驱散时 | `OnEffectIsBeingDispelledResult`（BlockDispel） |

### AI 决策与选择

| 方法 | 上下文要点 | 触发时机 | 返回 |
|---|---|---|---|
| `AlterActionTypeBeforeAction(DecisionContext)` | CanUseItem/CanCastSkill/PUseItem/PCastSkill/PNormalAttack/ForceAction | AI 决策偏好调整 | `AlterActionTypeResult` |
| `AlterSelectListBeforeAction(SelectionContext)` | 可修改 Enemys/Teammates/Skills 列表 | 行动前修改可选列表 | void |
| `AlterSelectListBeforeSelection(SelectionContext)` | Skill/AllEnemys/AllTeammates | 选择前修改可选列表 | void |
| `BeforeSelectTargetGrid(SelectionContext)` | Map/MoveRange | 选择目标格子前 | void |

### 角色行动回调

| 方法 | 上下文 | 触发时机 |
|---|---|---|
| `OnCharacterActionStart(ActionContext)` | DP/ActionType | 角色行动开始时 |
| `OnCharacterActionTaken(ActionContext)` | DP/ActionType | 角色行动完成时（广播全体） |
| `OnCharacterDecisionCompleted(ActionContext)` | DP | 角色决策完成时 |
| `OnCharacterInquiry(InquiryContext)` | Options/Response | 角色询问时（唯一 public set 的 in-out 契约，可写入 `ctx.Response`） |
| `AfterCharacterMove(MoveContext)` | Target（目标格子） | 角色移动后 |
| `AfterCharacterNormalAttack(NormalAttackContext)` | NormalAttack/Targets | 角色普攻后 |
| `AfterCharacterStartCasting(SkillCastContext)` | Skill/Targets | 角色开始吟唱后 |
| `AfterCharacterCastSkill(SkillCastContext)` | Skill/Targets | 角色释放技能后 |
| `AfterCharacterUseItem(ItemUseContext)` | Item/Skill/Targets | 角色使用物品后 |

### 回合奖励

| 方法 | 上下文要点 | 触发时机 |
|---|---|---|
| `OnRoundRewardGained(RoundRewardContext)` | Binding/TurnKey/Skills（此刻 Thief/From 为 null） | 回合奖励被发放到角色时 |
| `OnRoundRewardLost(RoundRewardContext)` | Binding/TurnKey/Skills/IsCarryOver | 回合奖励从角色身上被移除时（回合结束回收、吟唱被打断/施法者死亡时清理顺延奖励、特效主动移除） |
| `OnRoundRewardStolen(RoundRewardContext)` | Skills（全部被夺取项）/Thief/From | 回合奖励被夺取时（**原持有者与夺取者**的特效都会被触发，通过 `ctx.Trigger` 为原持有者、`ctx.Thief` 为夺取者判定归属） |

上下文结构见 [RoundRewardContext](/api/HookContext#roundrewardcontext)，奖励规则见 [回合奖励](/guide/round-bonus)。

---

## 钩子触发机制

框架在管线节点（回合开始、伤害结算、施法等）构造上下文并调度特效：

1. 按 `Effect.Priority` **降序**触发，多角色来源时去重（高优先级先触发）
2. 每个特效触发前自动赋值 `GamingQueue` 并**自动记录到回合日志**（`RoundRecord.Effects`）——仅当特效类型实际重写了该钩子时才记录（反射缓存），开发者无需手动记录
3. 同一管线内**共享同一个上下文实例**（如整条伤害管线共用一个 `DamageContext`），覆盖值写回 ctx，后续特效可读到前序特效的最新修改，可链式叠加
4. 返回结果按聚合规则合并：OR（任一 true 即生效，短路）、SUM（数值累加）、覆盖后者胜、连乘

## 特效内部可用方法

| 方法 | 说明 |
|---|---|
| `DamageToEnemy(actor, enemy, DamageType, MagicType, damage, options?)` | 造成伤害（走完整伤害计算流程，返回 `DamageRecord`） |
| `HealToTarget(actor, target, heal, canRespawn, triggerEffects)` | 治疗目标 |
| `CheckExemption(caster, target, this)` | 豁免检定（true = 豁免成功） |
| `CheckSkilledImmune(character, target, skill, item?)` | 技能免疫检定 |
| `InterruptCasting(caster, interrupter)` | 打断目标施法 |
| `Dispel(dispeller, target, isEnemy)` | 执行驱散 |
| `AddToCharacter(Character)` / `RemoveFromCharacter(Character)` | 添加/移除特效到角色（添加前会判重：目标身上已存在同一特效时不重复施加、不触发 `OnEffectGained`） |
| `QueryRoundReward(target, actionTurnOffset)` | 查询目标未来第 `offset` 个行动回合的回合奖励（仅角色绑定，召唤物折算到 Master） |
| `AddRoundReward(owner, actionTurnOffset, skill)` | 为目标追加一条未来行动回合的回合奖励 |
| `RemoveRoundReward(target, actionTurnOffset, skill)` | 移除目标未来某行动回合中的一条回合奖励 |
| `RemoveRoundRewards(target, actionTurnOffset, out removed)` | 一次性移除目标未来某行动回合的全部回合奖励 |
| `StealRoundReward(target, fromOffset, thief, toOffset, out stolen)` | 夺取目标某行动回合的全部奖励，并入夺取者的指定行动回合 |
| `Activate(caster, targets?, grids?, others?)` | 只触发 `OnSkillCasted`（不含完整施放流程） |
| `AddEffectStatesToCharacter / AddEffectTypeToCharacter / AddImmuneTypesToCharacter` | 施加状态/类型/免疫到角色 |
| `RemoveEffectStatesFromCharacter / RemoveEffectTypesFromCharacter / RemoveImmuneTypesFromCharacter` | 移除角色状态/类型/免疫 |
| `RemoveEffectTypesByDispel / RemoveEffectStatesByDispel` | 按驱散规则移除 |
| `ChangeCharacterHardnessTime(character, addValue, isPercentage, isCheckProtected)` | 修改硬直时间 |
| `SetCharactersToAIControl(cancel, characters)` | 设置 AI/玩家控制 |
| `IsCharacterInAIControlling(character)` | 是否处于 AI 控制 |
| `Inquiry(character, options)` | 询问角色/玩家 |
| `RecordCharacterApplyEffects(caster, params EffectType[])` | 记录特效施加 |
| `WriteLine(string)` | 输出日志 |
| `Copy(Skill, bool copyByCode)` | 复制特效（走专用特效工厂） |
| `GetDispelDescription(string)` | 生成驱散说明 |
| `ToString()` | 特效文本输出 |

## 关联

- 参数上下文族 → [HookContext](/api/HookContext)
- 返回值结构体 → [EffectResult](/api/EffectResult)
- 自定义特效 → [自定义特效](/dev/custom-effect)
- 特效规则 → [特效概述](/guide/effects)
- 技能基类 → [Skill](/api/Skill)
