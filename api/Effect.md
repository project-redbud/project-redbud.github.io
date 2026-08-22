# Effect

特效基类，位于 `FunGame.Core.Entity`。

需继承并使用。一个 `Skill` 由多个 `Effect` 组合而成，每个 `Effect` 负责一种具体效果。特效承载技能的实际效果，可通过约 60 个虚方法介入游戏的各个环节。

::: info v3.0 起统一上下文参数
所有可重写钩子均接收单一**参数上下文对象**（如 `DamageContext`、`SkillCastContext`），替代旧版的长参数列表与 `ref` 传参；返回值语义（`double` 加值 / `bool` 拦截）保持不变。详见 [HookContext 参数上下文族](/api/HookContext)。
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
| `Priority` | `int` | 0 | 触发优先级，越大越高。在状态栏中影响哈希排序 |
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
| `ExemptDuration` | `bool` | false | 豁免是否减半持续时间 |
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
| `GameplayEquilibriumConstant` | `EquilibriumConstant` | 游戏平衡常数（继承自 BaseEntity） |

---

## 可重写方法

所有钩子均为单一上下文参数（括号内为上下文类型，主角色统一从 `ctx.Actor` 获取）。

### 生命周期

| 方法 | 上下文 | 触发时机 |
|---|---|---|
| `OnEffectGained(HookContext)` | 主角色 | 特效施加到角色 |
| `OnEffectLost(HookContext)` | 主角色 | 特效从角色移除 |
| `OnGameStart(HookContext)` | — | 游戏开始时 |
| `OnTurnStart(TurnContext)` | DP/敌人/队友/技能/物品列表 | 回合开始时 |
| `OnTurnEnd(TurnContext)` | DP | 回合结束时 |
| `OnTimeElapsed(TimeLapseContext)` | `ctx.Actor` 或 `ctx.Grid` | 时间流逝时（角色版与地图格版共用，v3.0 合并） |
| `OnAttributeChanged(HookContext)` | 主角色 | 角色属性变化时 |
| `OnSkillLevelUp(LevelUpContext)` | `ctx.Level` | 技能升级时 |
| `OnOwnerLevelUp(LevelUpContext)` | `ctx.Level` | 所属角色升级时 |

### 技能相关

| 方法 | 上下文 | 触发时机 |
|---|---|---|
| `OnSkillCasting(SkillCastContext)` | 施法者/Targets/Grids | 技能吟唱开始时 |
| `OnSkillCasted(SkillCastContext)` | 施法者/Targets/Grids/Others | 技能释放完成时（局内） |
| `OnSkillCastedOutside(SkillCastContext)` | `ctx.User` | 技能释放完成（局外，v3.0 由 User 重载改名） |
| `BeforeSkillCasted(SkillCastContext)` | MPCost/EPCost | 技能释放前【技能的特效组】 |
| `BeforeSkillCastedOnStatus(SkillCastContext)` | Skill/Targets/Others | 技能释放前【状态栏特效】，返回 false 将角色从目标集合移除（v3.0 改名） |
| `AfterSkillCasted(SkillCastContext)` | 施法者/Targets/Grids | 技能释放后 |
| `BeforeSkillCastWillBeInterrupted(SkillCastContext)` | Skill/Interrupter | 技能将被打断前（bool：false 阻止打断） |
| `OnSkillCastInterrupted(SkillCastContext)` | Skill/Interrupter | 技能吟唱被打断时 |

### 伤害相关

| 方法 | 上下文要点 | 触发时机 | 返回 |
|---|---|---|---|
| `AlterDamageTypeBeforeCalculation(DamageContext)` | 可写 IsNormalAttack/DamageType/MagicType | 计算前修改伤害类型 | void（属性修改） |
| `AlterExpectedDamageBeforeCalculation(DamageContext)` | TotalDamageBonus | 乘区1调整 | double（加值） |
| `AlterActualDamageAfterCalculation(DamageContext)` | 可写 IsEvaded | 乘区2调整 | double（加值） |
| `BeforeApplyTrueDamage(DamageContext)` | — | 真实伤害生效前 | bool（true=取消伤害） |
| `OnApplyDamage(DamageContext)` | 可写 OriginalMessage | 伤害生效时 | void |
| `AfterDamageCalculation(DamageContext)` | — | 伤害计算完成后 | void |

### 治疗相关

| 方法 | 上下文要点 | 触发时机 | 返回 |
|---|---|---|---|
| `BeforeHealToTarget(HealContext)` | — | 治疗前 | bool（false=阻止） |
| `AlterHealValueBeforeHealToTarget(HealContext)` | 可写 CanRespawn | 修改治疗值 | double（加值） |

### 硬直时间

| 方法 | 上下文要点 | 触发时机 |
|---|---|---|
| `AlterHardnessTimeAfterNormalAttack(HardnessContext)` | 可写 BaseHardnessTime/IsCheckProtected | 普攻后调整硬直 |
| `AlterHardnessTimeAfterCastSkill(HardnessContext)` | 同上 + Skill | 释放技能后调整硬直 |

### 能量与回复

| 方法 | 上下文要点 | 触发时机 |
|---|---|---|
| `AlterEPAfterDamage(DamageContext)` | 可写 BaseEP | 造成伤害后修改获得的 EP |
| `AlterEPAfterGetDamage(DamageContext)` | 可写 BaseEP | 受到伤害后修改获得的 EP |
| `BeforeApplyRecoveryAtTimeLapsing(TimeLapseContext)` | 可写 HR/MR | 时间流逝回复前（false=否决） |

### 检定：闪避 / 暴击

| 方法 | 上下文要点 | 触发时机 | 返回 |
|---|---|---|---|
| `BeforeEvadeCheck(DamageContext)` | 可写 ThrowingBonus | 闪避检定前 | bool（false=必定失败） |
| `OnEvadedTriggered(DamageContext)` | Dice | 闪避成功时 | bool（true=无视闪避） |
| `BeforeCriticalCheck(DamageContext)` | 可写 ThrowingBonus | 暴击检定前 | bool |
| `OnCriticalDamageTriggered(DamageContext)` | Dice | 暴击触发时 | void |

### 免疫与豁免

| 方法 | 上下文要点 | 触发时机 | 返回 |
|---|---|---|---|
| `OnImmuneCheck(ImmuneContext)` | Target/Skill/Item | 技能免疫检定 | bool |
| `OnDamageImmuneCheck(DamageContext)` | — | 伤害免疫检定 | bool |
| `OnExemptionCheck(ImmuneContext)` | Effect/IsEvade、可写 ThrowingBonus | 豁免检定 | bool |

### 护盾

| 方法 | 上下文要点 | 触发时机 | 返回 |
|---|---|---|---|
| `BeforeShieldCalculation(ShieldContext)` | 可写 DamageReduce/Message | 护盾结算前 | bool（false=跳过结算） |
| `OnShieldNeutralizeDamage(ShieldContext)` | ShieldType | 护盾抵消伤害时 | void |
| `OnShieldBroken(ShieldContext)` | ShieldType 或 ShieldEffect | 护盾破碎时（v3.0 两版重载合并为一个钩子） | bool（false=阻止扣血） |

### 生命偷取

| 方法 | 上下文 | 触发时机 | 返回 |
|---|---|---|---|
| `BeforeLifesteal(LifestealContext)` | Enemy/Damage/Steal | 生命偷取前 | bool |
| `AfterLifesteal(LifestealContext)` | Enemy/Damage/Steal | 生命偷取后 | void |

### 驱散

| 方法 | 上下文 | 触发时机 | 返回 |
|---|---|---|---|
| `OnDispellingEffect(DispelContext)` | Target/Effect | 驱散其他特效时（有默认实现） | void |
| `OnEffectIsBeingDispelled(DispelContext)` | Target/DispellerEffect | 自身被驱散时 | bool（false=阻止） |

### AI 决策与选择

| 方法 | 上下文要点 | 触发时机 | 返回 |
|---|---|---|---|
| `AlterActionTypeBeforeAction(DecisionContext)` | 可写 CanUseItem/CanCastSkill/PUseItem/PCastSkill/PNormalAttack/ForceAction | AI 决策偏好调整 | `CharacterActionType` |
| `AlterSelectListBeforeAction(SelectionContext)` | 可修改 Enemys/Teammates/Skills 列表 | 行动前修改可选列表 | void |
| `AlterSelectListBeforeSelection(SelectionContext)` | Skill/AllEnemys/AllTeammates | 选择前修改可选列表 | void |
| `BeforeSelectTargetGrid(SelectionContext)` | Map/MoveRange | 选择目标格子前 | void |

### 角色行动回调

| 方法 | 上下文 | 触发时机 |
|---|---|---|
| `OnCharacterActionStart(ActionContext)` | DP/ActionType | 角色行动开始时 |
| `OnCharacterActionTaken(ActionContext)` | DP/ActionType | 角色行动完成时（广播全体） |
| `OnCharacterDecisionCompleted(ActionContext)` | DP | 角色决策完成时 |
| `OnCharacterInquiry(InquiryContext)` | Options/Response | 角色询问时 |
| `AfterCharacterMove(MoveContext)` | Target（目标格子） | 角色移动后 |
| `AfterCharacterNormalAttack(NormalAttackContext)` | NormalAttack/Targets | 角色普攻后 |
| `AfterCharacterStartCasting(SkillCastContext)` | Skill/Targets | 角色开始吟唱后 |
| `AfterCharacterCastSkill(SkillCastContext)` | Skill/Targets | 角色释放技能后 |
| `AfterCharacterUseItem(ItemUseContext)` | Item/Skill/Targets | 角色使用物品后 |

### 死亡

| 方法 | 上下文 | 触发时机 |
|---|---|---|
| `AfterDeathCalculation(DeathContext)` | Killer/HasMaster/ContinuousKilling/EarnedMoney/Assists | 死亡结算后（广播全体） |

---

## 特效内部可用方法

| 方法 | 说明 |
|---|---|
| `DamageToEnemy(actor, enemy, DamageType, MagicType, damage, options?)` | 造成伤害（走完整伤害计算流程，返回 `DamageRecord`） |
| `HealToTarget(actor, target, heal, canRespawn, triggerEffects)` | 治疗目标 |
| `CheckExemption(caster, target, this)` | 豁免检定（true = 豁免成功） |
| `CheckSkilledImmune(character, target, skill, item?)` | 技能免疫检定 |
| `InterruptCasting(caster, interrupter)` | 打断目标施法 |
| `Dispel(dispeller, target, isEnemy)` | 执行驱散 |
| `AddEffectStatesToCharacter / AddEffectTypeToCharacter / AddImmuneTypesToCharacter` | 施加状态/类型/免疫到角色 |
| `RemoveEffectStatesFromCharacter / RemoveEffectTypesFromCharacter / RemoveImmuneTypesFromCharacter` | 移除角色状态/类型/免疫 |
| `RemoveEffectTypesByDispel / RemoveEffectStatesByDispel` | 按驱散规则移除 |
| `ChangeCharacterHardnessTime(character, addValue, isPercentage, isCheckProtected)` | 修改硬直时间 |
| `SetCharactersToAIControl(cancel, characters)` | 设置 AI/玩家控制 |
| `IsCharacterInAIControlling(character)` | 是否处于 AI 控制 |
| `Inquiry(character, options)` | 询问角色/玩家 |
| `RecordCharacterApplyEffects(caster, params EffectType[])` | 记录特效施加 |
| `WriteLine(string)` | 输出日志 |
| `Copy(Skill, bool copyByCode)` | 复制特效 |
| `GetDispelDescription(string)` | 生成驱散说明 |
| `ToString()` | 特效文本输出 |

## 关联

- 参数上下文族 → [HookContext](/api/HookContext)
- 自定义特效 → [自定义特效](/dev/custom-effect)
- 特效规则 → [特效概述](/guide/effects)
- 技能基类 → [Skill](/api/Skill)
