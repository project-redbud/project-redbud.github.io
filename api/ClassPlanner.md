# ClassPlanner

职业规划器，位于 `FunGame.Core.Model`。把「规划操作 → 校验 → 写入 `Character.Class`」收敛为带事件推送的入口。

## 构造与属性

```csharp
public ClassPlanner(Character character)
```

| 属性 | 类型 | 说明 |
|---|---|---|
| `Character` | `Character` | 规划的角色（只读） |
| `Plan` | `CharacterClass` | 职业计划（= `Character.Class`，只读） |
| `Eq` | `EquilibriumConstant` | 平衡常数（只读） |
| `Settler` | `IClassRewardSettler` | 结算器扩展点（默认 `DefaultClassRewardSettler.Instance`） |
| `SkillSelectionEnabled` | `bool` | false = 职业池全量授予（默认）；true = 已习得制 |

## 事件

```csharp
public event Action<ClassPlanner, ClassPlanEventArgs>? Planned;
```

每次成功的规划动作后触发。`ClassPlanEventArgs`（`FunGame.Core.Library.Common.Event`）：

| 成员 | 说明 |
|---|---|
| `Phase` | `ClassPlanPhase` 枚举：`SelectClass` / `UpgradeClass` / `SettleReward` / `LearnClassSkill` / `AllocateAttribute` / `SelectRoleTypes` / `LearnTalent` / `ForgetTalent` / `ActivateTalent` / `ResetPlan` / `ChangeDefault` / `SetClassLevel` / `CommitClass` |
| `Plan` | 职业计划 |
| `Success` | 是否成功 |
| `Message` | 消息 |

模组可按阶段监听：实现 `IClassPlanSelectClassEvent` / `IClassPlanUpgradeClassEvent` / `IClassPlanSettleRewardEvent` 等接口（`FunGame.Core.Interface.Event`），把实例方法挂到 `Planned` 事件。

## 规划动作

全部动作返回 `ClassPlanResult`（`Success` / `Message` / `Data`，可隐式转 bool）。

### 职业与等级

| 方法 | 说明 |
|---|---|
| `SelectClass(Class classDef, SubClass subClassDef)` | 选择职业与流派：消耗 1 职业点数，校验归属/重复/兼职上限/等级门槛，新职业 1 级起步并结算 1 级奖励 |
| `UpgradeClass(Class record)` | 职业升级 +1（上限 `MaxClassLevel`），消耗 1 点，结算区间奖励，**升级即确认** |
| `SetClassLevel(Class record, int level)` | 草稿态调级：可升可降、不耗点数、绝对对齐；已确认等级不可下调 |
| `CommitClassLevel(Class record)` | 确认草稿等级，按净增级数消耗职业点数 |
| `CommitAllClassLevels()` | 先整体校验点数再逐个确认 |
| `ApplyToCharacter(Character? character = null)` | 物化：先确认全部草稿，再重建角色技能/天赋/定位 |
| `ChangeDefaultPlan(Class classDef, SubClass subClassDef)` | 修改默认职业（仅 ≥ `MinLevelCanModifyDefaultClass` 级） |
| `ResetPlan()` | 洗点：回收全部奖励与属性；角色等级不足时恢复 1 级默认职业 |

### 技能与属性

| 方法 | 说明 |
|---|---|
| `LearnClassSkill(Class record, Skill skill)` | 消耗技能选择权习得职业技能（校验流派/属性前置，`Source = SkillSource.Class`） |
| `TakeInitialAllocation(Class record, ClassAttributeAllocation allocation)` | 消耗 1 级初始分配权（受职业/角色模板上下限交集约束） |
| `TakeNumericBoost(Class record, ClassAttributeAllocation allocation)` | 数值提升（不受限，与被动选择严格互斥） |
| `TakeNumericBoost(Class record)` | 数值提升重载：按 `PrimaryAttribute` 把额度全塞主属性 |

### 战斗天赋

| 方法 | 说明 |
|---|---|
| `LearnCombatTalent(RoleType roleType, Skill talent)` | 学习天赋（须属于已选职业的定位天赋池，上限 3；学满 2 个授予转换战技） |
| `ActivateCombatTalent(RoleType roleType)` / `ActivateCombatTalent(Skill talent)` | 激活/转换生效天赋 |
| `ForgetCombatTalent(Skill talent)` | 遗忘天赋（释放名额） |
| `SetCombatTalentSwitchSkill(Skill switchSkill)` | 注入【转换战斗天赋】战技模板（预制实体 `SwitchCombatTalentSkill`） |
| `RefreshRoleTypes()` | 只刷新定位（`Plan.SyncRoleTypes()`） |

### 对账

| 方法 | 说明 |
|---|---|
| `SyncRewards()` | 按当前职业等级补发奖励（存档恢复后对账；水位高于当前等级则整体拒绝） |
| `ValidateState(out string? error)` | 整体一致性校验 |

## 结算器扩展点（IClassRewardSettler）

位于 `FunGame.Core.Model.Framework`（`ClassRewardSettlement.cs`）：

| 方法 | 说明 |
|---|---|
| `Settle(context, ledger, fromLevel, toLevel)` | 结算区间奖励，幂等（只补发未结算区间） |
| `Reconcile(context, ledger, targetLevel)` | 绝对对齐（可升可降；已用配额下调整体失败） |
| `SpendSkillChoice(context, ledger, skill)` | 消耗选择权习得技能 |
| `SpendInitialAllocation(context, ledger, allocation)` | 消耗 1 级初始分配权 |
| `SpendNumericBoost(context, ledger, allocation)` | 数值提升（同时消耗一份被动选择权） |
| `Revoke(context, ledger)` | 洗点回收 |
| `InitialAllocationBudget(...)` / `NumericBoostBudget(...)` | 查询当前额度 |

默认实现 `DefaultClassRewardSettler`（`FunGame.Core.Api`），属性落地策略 `IClassAttributeApplier` 可替换（默认 `DefaultClassAttributeApplier` 写到 `InitialSTR/AGI/INT` 与成长）。

## 配套数据类（FunGame.Core.Model.Framework）

| 类 | 用途 |
|---|---|
| `ClassLevelUpReward` | 职业升级路线图（每级奖励；`BuildDefaultTable()` 默认表） |
| `ClassAttributeBudget` | 属性分配额度（属性点总额 + 成长总额 + 是否受限） |
| `ClassAttributeLimit` | 属性分配上下限（按项可空；`Intersect` 取交集） |
| `ClassAttributeAllocation` | 一次属性分配（STR/AGI/INT + 三项成长；`Add`/`Subtract`/`Scale`） |
| `ClassRewardLedger` | 单个职业的奖励账本（水位/选择权/已学技能/已施加属性） |
| `ClassPlanResult` | 规划操作结果 |
| `ClassPlanSnapshot` | 存档快照（`Capture` / `ApplyTo`） |
| `ClassDefinitionRegistry` | 职业内容注册表（static，`Register`/`CreateClass`/`RegisterSwitchSkill`） |
| `ClassPlanRoleResolver` | 定位推导（static，`ResolvePrimary`/`ResolveSecondary`/`ApplyTo`） |

## 使用示例

```csharp
ClassPlanner planner = new(character);

// 监听规划事件
planner.Planned += (p, e) => Console.WriteLine($"[{e.Phase}] {e.Message}");

// 选择职业与流派（消耗 1 职业点数）
Class warriorDef = LoadWarriorDefinition();
SubClass berserkerDef = LoadBerserkerDefinition();
planner.SelectClass(warriorDef, berserkerDef);

// 职业升级
planner.UpgradeClass(warriorDef);

// 学习职业技能（消耗选择权）
planner.LearnClassSkill(warriorDef, someSkill);

// 1 级初始属性分配（30 点 + 3.0 成长，受限）
planner.TakeInitialAllocation(warriorDef, new(str: 15, agi: 10, int_: 5, strGrowth: 1.5, agiGrowth: 1.0, intGrowth: 0.5));

// 学习并激活战斗天赋
planner.LearnCombatTalent(RoleType.Guardian, myTalent);
planner.ActivateCombatTalent(RoleType.Guardian);

// 物化到角色
planner.ApplyToCharacter();
```

## 关联

- 系统规则 → [职业规划系统](/guide/class-plan)
- 转换战技 → [SwitchCombatTalentSkill](/api/SwitchCombatTalentSkill)
- 角色定位属性 → [Character](/api/Character)
