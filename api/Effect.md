# Effect

特效基类，位于 `Milimoe.FunGame.Core.Entity`。

需继承并使用。一个 `Skill` 由多个 `Effect` 组合而成，每个 `Effect` 负责一种具体效果。

## 核心属性

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `Id` | `long` | — | 唯一标识符（从 `Skill` 继承） |
| `Name` | `string` | — | 名称（从 `Skill` 继承） |
| `Description` | `string` | `""` | 效果描述 |
| `Skill` | `Skill` | — | 所属技能（只读） |
| `Priority` | `int` | 0 | 触发优先级，越大越高。在状态栏中影响哈希排序 |
| `Level` | `int` | — | 等级，跟随技能等级 |
| `EffectType` | `EffectType` | `None` | 特效类型（50+ 种，决定 BUFF/DEBUFF/控制/驱散分类） |
| `IsDebuff` | `bool` | false | 是否是负面效果 |
| `MagicType` | `MagicType` | `None` | 魔法类型 |
| `MagicEfficacy` | `double` | — | 魔法效能%（来自 `Skill.MagicEfficacy`，只读） |

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
| `GamingQueue` | `GamingQueue?` | 所在的游戏队列 |
| `GameplayEquilibriumConstant` | `EquilibriumConstant` | 游戏平衡常数 |

---

## 可重写方法

### 生命周期

| 方法 | 触发时机 |
|---|---|
| `OnEffectGained(Character)` | 特效施加到角色 |
| `OnEffectLost(Character)` | 特效从角色移除 |
| `OnGameStart()` | 游戏开始时 |
| `OnTurnStart(Character, List<Character>, List<Character>, List<Skill>, List<Item>)` | 回合开始时 |
| `OnTurnEnd(Character)` | 回合结束时 |
| `OnTimeElapsed(Character, double)` | 时间流逝时 |
| `OnTimeElapsed(Grid, double)` | 时间流逝时（格子版本） |
| `OnAttributeChanged(Character)` | 角色属性变化时 |

### 技能相关

| 方法 | 触发时机 |
|---|---|
| `OnSkillCasting(Character, List<Character>, List<Grid>)` | 技能吟唱开始时 |
| `OnSkillCasted(Character, List<Character>, List<Grid>, Dictionary)` | 技能释放完成时 |
| `OnSkillCasted(User, List<Character>, Dictionary)` | 技能释放完成（用户版本） |
| `BeforeSkillCasted(Character, List<Character>, List<Grid>, double, double)` | 技能释放前（含消耗信息） |
| `AfterSkillCasted(Character, List<Character>, List<Grid>)` | 技能释放后 |
| `OnSkillCastInterrupted(Character, Skill, Character)` | 技能吟唱被打断时 |
| `OnSkillLevelUp(Character, double)` | 技能升级时 |
| `OnOwnerLevelUp(Character, double)` | 所属角色升级时 |

### 伤害相关

| 方法 | 触发时机 | 返回 |
|---|---|---|
| `AlterDamageTypeBeforeCalculation(Character, Character, ref bool, ref DamageType, ref MagicType)` | 计算前修改伤害类型 | void（ref 修改） |
| `AlterExpectedDamageBeforeCalculation(Character, Character, double, bool, DamageType, MagicType, Dictionary)` | 乘区1调整 | double（加值） |
| `AlterActualDamageAfterCalculation(Character, Character, double, bool, DamageType, MagicType, DamageResult, ref bool, Dictionary)` | 乘区2调整 | double（加值） |
| `BeforeApplyTrueDamage(Character, Character, double, bool, DamageResult)` | 真实伤害生效前 | bool（false=阻止） |
| `OnApplyDamage(Character, Character, double, double, bool, DamageType, MagicType, DamageResult)` | 伤害生效时 | void |
| `AfterDamageCalculation(Character, Character, double, double, bool, DamageType, MagicType, DamageResult)` | 伤害计算完成后 | void |

### 治疗相关

| 方法 | 触发时机 | 返回 |
|---|---|---|
| `BeforeHealToTarget(Character, Character, double, bool)` | 治疗前 | bool（false=阻止） |
| `AlterHealValueBeforeHealToTarget(Character, Character, double, ref bool, Dictionary)` | 修改治疗值 | double（加值） |

### 硬直时间

| 方法 | 触发时机 |
|---|---|
| `AlterHardnessTimeAfterNormalAttack(Character, ref double, ref bool)` | 普攻后调整硬直 |
| `AlterHardnessTimeAfterCastSkill(Character, Skill, ref double, ref bool)` | 释放技能后调整硬直 |

### 能量与回复

| 方法 | 触发时机 |
|---|---|
| `AlterEPAfterDamage(Character, ref double)` | 造成伤害后修改获得的 EP |
| `AlterEPAfterGetDamage(Character, ref double)` | 受到伤害后修改获得的 EP |
| `BeforeApplyRecoveryAtTimeLapsing(Character, ref double, ref double)` | 时间流逝回复前 |

### AI 决策

| 方法 | 触发时机 | 返回 |
|---|---|---|
| `AlterActionTypeBeforeAction(Character, DecisionPoints, CharacterState, ref bool, ref bool, ref double, ref double, ref double, ref bool)` | AI 决策偏好调整 | `CharacterActionType` |

### 死亡

| 方法 | 触发时机 |
|---|---|
| `AfterDeathCalculation(Character, bool, Character?, Dictionary, Dictionary, Character[], ...)` | 死亡结算后 |

---

## 特效内部可用方法

| 方法 | 说明 |
|---|---|
| `DamageToEnemy(actor, enemy, DamageType, MagicType, damage)` | 造成伤害（走完整伤害计算流程） |
| `CheckExemption(caster, target, this)` | 豁免检定（true = 豁免成功） |
| `InterruptCasting(target, interrupter)` | 打断目标施法 |
| `RecordCharacterApplyEffects(caster, params EffectType[])` | 记录特效施加 |
| `WriteLine(string)` | 输出日志 |
| `GetDispelDescription(string)` | 生成驱散说明 |
