# Character

角色实体，位于 `FunGame.Core.Entity`。

- **编码定义**：继承 `Character` 类，在构造函数中设置属性
- **工厂创建**：通过 `Factory.OpenFactory.GetInstance<Character>(id, name, args)`
- **复制**：使用中调用 `Copy()` 创建独立副本

## 构造函数

```csharp
public Character()
```

## 身份与归属

| 属性 | 类型 | 说明 |
|---|---|---|
| `Id` | `long` | 唯一标识符 |
| `Guid` | `Guid` | 全局唯一标识（默认新生成） |
| `Name` / `FirstName` / `NickName` | `string` | 姓 / 名 / 昵称 |
| `User` | `User` | 所属玩家 |
| `Profile` | `CharacterProfile` | 角色档案 |
| `EquipSlot` | `EquipSlot` | 装备栏 |
| `MagicType` | `MagicType` | 魔法属性 |
| `FirstRoleType` / `SecondRoleType` / `ThirdRoleType` | `RoleType` | 角色定位（最多三个） |
| `Promotion` | `int` | 段位（默认 100） |
| `RoleRating` | `RoleRating` | 评级（由 Promotion 计算，只读） |
| `PrimaryAttribute` | `PrimaryAttribute` | 核心属性（STR/AGI/INT） |

## 等级与经验

| 属性 | 类型 | 说明 |
|---|---|---|
| `Level` | `int` | 当前等级（自动限制在最大等级内） |
| `ExLevel` | `int` | 额外等级 |
| `MaxLevel` | `int` | 最大等级（0 时按平衡常数） |
| `EXP` | `double` | 经验值 |
| `LevelBreak` | `int` | 等级突破（默认 -1） |

## 战斗状态

| 属性 | 类型 | 说明 |
|---|---|---|
| `CharacterState` | `CharacterState` | 当前角色状态（默认 `Actionable`） |
| `CharacterEffectStates` | `Dictionary<Effect, List<CharacterState>>` | 特效施加的角色状态 |
| `CharacterEffectTypes` | `Dictionary<Effect, List<EffectType>>` | 特效施加的特效类型 |
| `CharacterImmuneTypes` | `Dictionary<Effect, List<ImmuneType>>` | 特效施加的免疫类型 |
| `IsNeutral` | `bool` | 是否中立 |
| `IsUnselectable` | `bool` | 是否不可选中 |
| `ImmuneType` | `ImmuneType` | 免疫类型（位标志） |

## 生命值体系

| 属性 | 类型 | 说明 |
|---|---|---|
| `InitialHP` | `double` | 初始生命值（可设置） |
| `BaseHP` | `double` | 基础最大生命值（只读）：`InitialHP + (Level-1) × (17 + 0.68 × InitialHP) + BaseSTR × 9` |
| `ExHP` | `double` | 额外生命值（只读）：`ExSTR × 9` |
| `ExHP2` | `double` | 额外生命值（固定值） |
| `ExHP3` | `double` | 额外生命值（只读）：`BaseHP × ExHPPercentage` |
| `ExHPPercentage` | `double` | 额外生命值百分比 |
| `MaxHP` | `double` | 最大生命值（只读，至少 1）：`BaseHP + ExHP + ExHP2 + ExHP3` |
| `HP` | `double` | 当前生命值 |

## 魔法值体系

| 属性 | 类型 | 说明 |
|---|---|---|
| `HasMP` | `bool` | 是否有魔法值（默认 true） |
| `InitialMP` | `double` | 初始魔法值（可设置） |
| `BaseMP` | `double` | 基础最大魔法值（只读）：`InitialMP + (Level-1) × (1.5 + 0.14 × InitialMP) + BaseINT × 8` |
| `ExMP` | `double` | 额外魔法值（只读）：`ExINT × 8` |
| `ExMP2` | `double` | 额外魔法值（固定值） |
| `ExMP3` | `double` | 额外魔法值（只读）：`BaseMP × ExMPPercentage` |
| `ExMPPercentage` | `double` | 额外魔法值百分比 |
| `MaxMP` | `double` | 最大魔法值（只读，至少 1） |
| `MP` | `double` | 当前魔法值 |

## 爆发能量

| 属性 | 类型 | 说明 |
|---|---|---|
| `EP` | `double` | 当前爆发能量（战技/爆发技消耗，最大 200） |

## 攻击力体系

| 属性 | 类型 | 说明 |
|---|---|---|
| `InitialATK` | `double` | 初始攻击力（可设置） |
| `BaseATK` | `double` | 基础攻击力（只读）：`InitialATK + (Level-1) × (0.95 + 0.045 × InitialATK) + BaseSTR` |
| `ExATK` | `double` | 额外攻击力（由核心属性提供） |
| `ExATK2` | `double` | 额外攻击力（固定值） |
| `ExATK3` | `double` | 额外攻击力（只读）：`BaseATK × ExATKPercentage` |
| `ExATKPercentage` | `double` | 额外攻击力百分比 |
| `ATK` | `double` | 总攻击力（只读）：`BaseATK + ExATK + ExATK2 + ExATK3` |

## 防御体系

| 属性 | 类型 | 说明 |
|---|---|---|
| `InitialDEF` | `double` | 初始物理护甲（可设置） |
| `BaseDEF` | `double` | 基础护甲（只读）：`InitialDEF + BaseSTR × 0.75` |
| `ExDEF` | `double` | 额外护甲（只读）：`ExSTR × 0.75` |
| `ExDEF2` | `double` | 额外护甲（固定值） |
| `ExDEF3` | `double` | 额外护甲（只读）：`BaseDEF × ExDEFPercentage` |
| `ExDEFPercentage` | `double` | 额外护甲百分比 |
| `DEF` | `double` | 总护甲（只读） |
| `ExPDR` | `double` | 额外物理伤害减免 |
| `MDF` | `MagicResistance` | 魔法抗性（按魔法属性区分） |

## 回复体系

| 属性 | 类型 | 说明 |
|---|---|---|
| `InitialHR` | `double` | 初始生命回复（可设置） |
| `HR` | `double` | 生命回复（只读）：`InitialHR + STR × 0.15 + ExHR` |
| `ExHR` | `double` | 额外生命回复 |
| `InitialMR` | `double` | 初始魔法回复（可设置） |
| `MR` | `double` | 魔法回复（只读）：`InitialMR + INT × 0.1 + ExMR` |
| `ExMR` | `double` | 额外魔法回复 |
| `ER` | `double` | 能量回复 |

## 核心属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `InitialSTR` / `InitialAGI` / `InitialINT` | `double` | 初始力量 / 敏捷 / 智力 |
| `BaseSTR` / `BaseAGI` / `BaseINT` | `double` | 基础属性（只读）：`Initial + Growth × (Level-1)` |
| `STR` / `AGI` / `INT` | `double` | 总属性（只读）：`Base + Ex + Ex2` |
| `ExSTR` / `ExAGI` / `ExINT` | `double` | 额外属性（固定值） |
| `ExSTR2` / `ExAGI2` / `ExINT2` | `double` | 额外属性（只读）：`Base × ExPercentage` |
| `ExSTRPercentage` / `ExAGIPercentage` / `ExINTPercentage` | `double` | 额外属性百分比 |
| `STRGrowth` / `AGIGrowth` / `INTGrowth` | `double` | 每级属性成长 |
| `STRExemption` / `AGIExemption` / `INTExemption` | `double` | 豁免率（只读，由核心属性计算） |

## 速度与行动

| 属性 | 类型 | 说明 |
|---|---|---|
| `InitialSPD` | `double` | 初始行动速度（可设置） |
| `SPD` | `double` | 行动速度（只读）：`InitialSPD + AGI × 0.65 + ExSPD` |
| `ExSPD` | `double` | 额外行动速度 |
| `ActionCoefficient` | `double` | 行动系数（只读，减少硬直时间） |
| `ExActionCoefficient` | `double` | 额外行动系数 |
| `AccelerationCoefficient` | `double` | 加速系数（只读，减少吟唱时间） |
| `ExAccelerationCoefficient` | `double` | 额外加速系数 |

## 其他战斗属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `CDR` | `double` | 冷却缩减（只读） |
| `ExCDR` | `double` | 额外冷却缩减 |
| `ExATR` | `int` | 额外攻击距离 |
| `ExMOV` | `int` | 额外移动距离 |
| `ExCritRate` | `double` | 额外暴击率 |
| `ExCritDMG` | `double` | 额外暴击伤害 |
| `ExEvadeRate` | `double` | 额外闪避率 |
| `Lifesteal` | `double` | 生命偷取 |
| `PhysicalPenetration` | `double` | 物理穿透（只读） |
| `Shield` | `Shield` | 护盾 |
| `IsUnit` | `bool` | 是否为召唤单位（virtual，默认 false） |
| `Master` | `Character?` | 召唤主（Unit 的主人） |

## 装备与技能

| 属性 | 类型 | 说明 |
|---|---|---|
| `Class` | `CharacterClass` | 角色职业 |
| `NormalAttack` | `NormalAttack` | 普通攻击（只读） |
| `Skills` | `HashSet<Skill>` | 技能集合 |
| `Effects` | `HashSet<Effect>` | 特效集合（状态栏） |
| `Items` | `HashSet<Item>` | 物品集合 |

## 主要方法

### 生命恢复

| 方法 | 说明 |
|---|---|
| `Recovery(double EP = -1)` | 满状态恢复（EP 默认恢复全部） |
| `Recovery(int time, double EP = -1)` | 按时间流逝恢复（生命/魔法回复 × 时间） |
| `Recovery(double pastHP, double pastMP, double pastMaxHP, double pastMaxMP)` | 按历史值恢复（复活还原用） |

### 装备

| 方法 | 说明 |
|---|---|
| `Equip(Item item, EquipSlotType slot, out Item? previous)` | 装备到指定栏位（返回被替换的物品） |
| `Equip(Item item)` | 自动装备到合适栏位 |
| `Equip(Item item, out Item? previous)` | 自动装备（返回被替换的物品） |
| `UnEquip(EquipSlotType type)` | 卸下指定栏位的物品 |

### 等级

| 方法 | 说明 |
|---|---|
| `SetLevel(int level, bool recovery = true)` | 设置等级（可选恢复状态） |
| `OnLevelUp(int level = 0, bool checkLevelBreak = true)` | 升级回调 |
| `OnLevelBreak()` | 等级突破回调 |
| `OnAttributeChanged()` | 属性变化回调（通知技能/特效刷新） |

### 状态

| 方法 | 说明 |
|---|---|
| `UpdateCharacterState()` | 根据特效重新计算角色状态，返回新状态 |

### 复制与复活

| 方法 | 说明 |
|---|---|
| `Copy(bool copyEx = false, bool copyMagic = false, bool copyItem = false)` | 创建独立副本 |
| `Respawn(Character original)` | 按原角色复活还原 |

### 文本输出

| 方法 | 说明 |
|---|---|
| `GetName(bool full = true)` | 角色名 |
| `GetInfo(...)` / `GetSimpleInfo(...)` | 角色信息 |
| `GetInBattleInfo(double hardnessTimes, bool simpleStatusBar)` | 战斗 HUD |
| `GetSkillInfo(bool showUser)` | 技能信息 |
| `GetItemInfo(...)` | 物品信息 |
| `GetAttributeInfo(...)` / `GetSimpleAttributeInfo(...)` | 属性信息 |
| `GetStatusInfo()` | 状态信息 |
| `GetEquipSlotInfo()` | 装备栏信息 |
| `GetBackpackItemsInfo()` | 背包信息 |
| `GetMagicResistanceInfo()` | 魔法抗性信息 |
| `ToString()` 系列 | 多种文本输出（含用户/等级等变体） |

## 继承示例

```csharp
public class MyWarrior : Character
{
    public MyWarrior() : base()
    {
        Id = 1;
        Name = "MyGame";
        FirstName = "Warrior";
        PrimaryAttribute = PrimaryAttribute.STR;

        InitialHP = 85;
        InitialMP = 10;
        InitialATK = 25;
        InitialDEF = 8;
        InitialSPD = 300;
        InitialHR = 4;
        InitialMR = 2;

        InitialSTR = 30;  STRGrowth = 3;
        FirstRoleType = RoleType.Guardian;
    }
}
```

## 关联

- 角色规则 → [角色概述](/guide/characters) / [能力值详解](/guide/characters-stats)
- 自定义角色 → [自定义角色](/dev/custom-character)
- 工厂创建 → [Factory](/api/Factory)
