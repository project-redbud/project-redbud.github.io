# 职业规划系统

FunGame 提供 DND 式的**职业规划系统**：玩家消耗**职业点数**选择**职业（Class）与流派（SubClass）**、升级、消耗选择权学习职业技能、分配核心属性、学习与激活**战斗天赋**，从而决定角色的**定位（RoleType）**。

## 核心概念

```
职业点数（角色升级获得，见 ClassPointsGetterList）
    ↓
ClassPlanner（规划器，校验 + 写入 Character.Class + 事件推送）
    ├── 选择职业/流派（SelectClass）→ 结算 1 级奖励
    ├── 职业升级（UpgradeClass）→ 结算区间奖励
    ├── 学习职业技能（LearnClassSkill，消耗选择权）
    ├── 初始属性分配 / 数值提升（消耗分配权/提升次数）
    ├── 学习/激活战斗天赋（LearnCombatTalent / ActivateCombatTalent）
    └── 洗点（ResetPlan）
    ↓
ClassRewardLedger（每个职业一本账本：已结算水位、剩余选择权、已施加属性）
    ↓
IClassRewardSettler（结算器，可替换扩展点；默认 DefaultClassRewardSettler）
```

- **定义 vs 记录**：`Class`/`SubClass` 既是模板也是玩家记录。`Class.Copy()` 深拷贝技能实例生成"职业记录"，存于 `CharacterClass.Classes`
- **升级路线图**：`ClassLevelUpReward` 描述职业每一级（1–10）发放什么，可整体替换 `EquilibriumConstant.ClassLevelUpRewards`
- **奖励账本**：`ClassRewardLedger` 记录已结算水位 `SettledToLevel`、已确认下限 `CommittedLevel`、剩余选择权、已学技能、已施加属性
- **结算器**：`IClassRewardSettler` 是核心扩展点，默认实现 `DefaultClassRewardSettler`；属性落地经 `IClassAttributeApplier` 可替换（默认写到 `InitialSTR/AGI/INT` 与成长）

## 升级路线图（默认表）

| 职业等级 | 奖励 |
|---|---|
| 1 | 流派固有被动 ×1 + 初始属性分配权（30 点属性 + 3.0 成长，受限） |
| 2 | 技能选择权 ×2 |
| 3 | 技能提级 ×1 + 魔法额外 +1 |
| 4 | 被动 ×1（可用数值提升替代：9 点 + 0.9 成长） |
| 5 | 选择权 ×2 + 提级 ×1 + 魔法额外 +1 |
| 6 | 流派固有被动 ×1 |
| 7 | 提级 ×1 + 魔法额外 +1 |
| 8 | 选择权 ×2 + 提级 ×1 + 魔法额外 +1 |
| 9 | 被动 ×2（可用数值提升替代） |
| 10 | 选择权 ×2 + 提级 ×1 + 魔法额外 +1 |

> 被动选择与数值提升是同一档的两种选法，**严格互斥**（消耗数值提升时需同时消耗一份被动选择权）。

## 定位推导

定位**不再由玩家手动选择**，由 `ClassPlanRoleResolver` 自动推导：

- **主要定位**（`PrimaryRoleType`）= 当前生效战斗天赋所属定位；未激活为 `RoleType.None`
- **次要定位**（`SecondaryRoleTypes`）= 流派按"所属职业等级降序、同级按选择顺序"展开候选，至多 2 个
- 主要定位决定 `MOV`（移动距离）等按定位取值的属性，转换天赋时随之变化

## 战斗天赋与转换战技

- 每个定位的战斗天赋属于被动战技，可学习多个（上限 `CharacterClass.MaxLearnedTalentCount` = 3），但同一时间只能**激活** 1 个
- 学满 2 个天赋后获得【转换战斗天赋】战技（预制实体 `SwitchCombatTalentSkill`），战斗内可切换生效天赋
- 核心定位天赋激活时，普攻与全部主动技能获得 `ExLevel + 1`（排除 `SkillSource.Item/MagicCardPack/Reward`）

## 存档

`ClassPlanSnapshot` 只保存 IdName 与状态，读档时经 `ClassDefinitionRegistry`（模组启动时注册职业/流派/转换战技工厂）重建完整定义副本。

## 平衡常数

| 配置项 | 默认值 | 说明 |
|---|---|---|
| `MaxClassLevel` | 10 | 职业等级上限 |
| `MaxClassCount` | 0（不限） | 兼职最多职业数 |
| `MinCharacterLevelForMulticlass` | 1 | 兼职所需最低角色等级 |
| `MinLevelCanModifyDefaultClass` | 20 | 修改默认职业/洗点完全重选的最低角色等级 |
| `InitialAllocationOnlyForFirstClass` | true | 仅首个职业发放 1 级初始分配权 |
| `ClassPointsGetterList` | `[1,5,10,...,55]` | 角色升级获得职业点数的等级表 |
| `ClassLevelUpRewards` | 默认路线图 | 职业 1–10 级升级奖励 |
| `InitialAttributeBudget` | 30 点 + 3.0 成长（受限） | 1 级初始分配额度 |
| `NumericBoostBudget` | 9 点 + 0.9 成长（不限） | 数值提升单次额度 |

## 相关 API

- 规划器与全部动作 → [ClassPlanner](/api/ClassPlanner)
- 转换战斗天赋战技 → [SwitchCombatTalentSkill](/api/SwitchCombatTalentSkill)
- 角色定位属性 → [Character](/api/Character)
