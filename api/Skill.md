# Skill

技能基类，位于 `FunGame.Core.Entity`。

建议**继承此类**来构造自定义技能。一个技能由多个 `Effect` 组合而成，技能负责消耗、冷却、目标选择等框架行为，具体效果由特效实现。

## 构造函数

```csharp
// type：技能类型；character：所属角色（可选）
protected Skill(SkillType type, Character? character = null)
```

> 构造函数为 `protected`，必须继承后使用。JSON 反序列化使用内部构造。

## 核心属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `Id` | `long` | 唯一标识符 |
| `Guid` | `Guid` | 全局唯一标识（默认新生成） |
| `AssociatedItemGuid` | `Guid` | 关联物品的 Guid |
| `Name` | `string` | 技能名称 |
| `Description` | `string` | 技能描述 |
| `GeneralDescription` | `string` | 通用描述（不随等级变化） |
| `DispelDescription` | `string` | 驱散性说明 |
| `ExemptionDescription` | `string` | 豁免性说明 |
| `Slogan` | `string` | 释放口号 |
| `Level` | `int` | 当前等级（自动限制在最大等级内） |
| `ExLevel` | `int` | 额外等级 |
| `MaxLevel` | `int` | 最大等级（0 时按平衡常数） |
| `Enable` | `bool` | 是否启用（默认 true） |
| `IsInEffect` | `bool` | 是否生效中（默认 false） |

## 类型与消耗

| 属性 | 类型 | 说明 |
|---|---|---|
| `SkillType` | `SkillType` | 技能类型 |
| `IsActive` | `bool` | 是否为主动技能（只读）：`SkillType != Passive` |
| `IsSuperSkill` | `bool` | 是否为爆发技（只读） |
| `IsMagic` | `bool` | 是否为魔法（只读） |
| `MPCost` | `double` | 魔法消耗 |
| `FreeCostMP` | `bool` | 是否免魔法消耗 |
| `RealMPCost` | `double` | 实际魔法消耗（只读）：`MPCost × (1 - INT 减耗)` |
| `EPCost` | `double` | 爆发能量消耗 |
| `CostAllEP` | `bool` | 是否消耗全部能量 |
| `MinCostEP` | `double` | 最低能量消耗（默认 100） |
| `FreeCostEP` | `bool` | 是否免能量消耗 |
| `RealEPCost` | `double` | 实际能量消耗（只读，受 INT 减耗影响） |
| `LastCostMP` / `LastCostEP` | `double` | 最近一次实际消耗 |
| `CD` | `double` | 冷却时间 |
| `InstantReset` | `bool` | 是否立即重置冷却 |
| `RealCD` | `double` | 实际冷却（只读）：`CD × (1 - CDR)` |
| `CastTime` | `double` | 吟唱时间（魔法） |
| `RealCastTime` | `double` | 实际吟唱时间（只读）：`CastTime × (1 - 加速系数)` |
| `HardnessTime` | `double` | 硬直时间 |
| `ExHardnessTime` / `ExHardnessTime2` | `double` | 额外硬直时间 |
| `RealHardnessTime` | `double` | 实际硬直时间（只读）：`(HardnessTime + ExHardnessTime) × (1 + ExHardnessTime2) × (1 - 行动系数)` |

## 类型枚举 `SkillType`

| 值 | 说明 |
|---|---|
| `Skill` | 主动战技 |
| `Passive` | 被动战技 |
| `SuperSkill` | 爆发技 |
| `Magic` | 魔法 |
| `Item` | 物品主动技能 |

## 伤害与魔法

| 属性 | 类型 | 说明 |
|---|---|---|
| `DamageType` | `DamageType` | 伤害类型（Physical/Magical/True） |
| `MagicType` | `MagicType` | 魔法属性 |
| `MagicBottleneck` | `double` | 魔法瓶颈（智力门槛） |
| `MagicEfficacy` | `double` | 魔法效能（只读）：`1.0 + (角色智力 - 魔法瓶颈) ÷ 魔法瓶颈` |

## 目标选择

| 属性 | 类型 | 说明 |
|---|---|---|
| `CastAnywhere` | `bool` | 是否全地图施放（默认 false，魔法自动为 true） |
| `CanSelectSelf` | `bool` | 可选自己 |
| `CanSelectEnemy` | `bool` | 可选敌人（默认 true） |
| `CanSelectTeammate` | `bool` | 可选队友 |
| `SelectAllEnemies` / `SelectAllTeammates` | `bool` | 全选敌人 / 全选队友 |
| `CanSelectTargetCount` | `int` | 可选目标数（默认 1） |
| `CanSelectTargetRange` | `int` | 施法距离 |
| `IsNonDirectional` | `bool` | 是否非指向性（选格子） |
| `SelectIncludeCharacterGrid` | `bool` | 非指向性：可选有角色的格子（默认 true） |
| `AllowSelectNoCharacterGrid` | `bool` | 非指向性：可选空格子 |
| `AllowSelectDead` | `bool` | 可选死亡角色 |
| `SkillRangeType` | `SkillRangeType` | 范围形状（Diamond/Circle/Square/Line/LinePass/Sector） |
| `SectorAngle` | `double` | 扇形角度（默认 90） |
| `SelectTargetPredicates` | `List<Func<Character, bool>>` | 自定义目标过滤条件 |

## 豁免

| 属性 | 类型 | 说明 |
|---|---|---|
| `EffectForExemptionCheck` | `Effect?` | 指定用于豁免检定的特效（豁免成功则整个技能失效） |

## 关系属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `Character` | `Character?` | 所属角色 |
| `Item` | `Item?` | 关联物品 |
| `Effects` | `HashSet<Effect>` | 特效集合 |
| `Values` | `Dictionary<string, object>` | 动态数据 |
| `GamingQueue` | `IGamingQueue?` | 所在的游戏队列 |

## 生命周期方法

| 方法 | 说明 |
|---|---|
| `OnSkillGained(IGamingQueue)` | 技能获得时（加入角色技能列表后） |
| `OnTurnStart(Character, enemys, teammates, skills, items)` | 角色回合开始时 |
| `OnLevelUp()` | 技能升级时 |
| `OnSkillCasting(IGamingQueue, caster, targets, grids)` | 技能吟唱开始时 |
| `BeforeSkillCasted(Character, targets, grids)` | 技能释放前 |
| `OnSkillCasted(IGamingQueue, caster, targets, grids)` | 技能释放完成时 |
| `OnSkillCasted(User, targets)` | 技能释放完成（对局外版本） |
| `AfterSkillCasted(Character, targets, grids)` | 技能释放后 |
| `OnCharacterRespawn(Skill)` | 角色复活时 |
| `AddSkillToCharacter(Character)` / `RemoveSkillFromCharacter(Character)` | 添加/移除到角色 |
| `IsCharacterInAIControlling(Character)` | 角色是否处于 AI 控制 |

## 目标选择方法

| 方法 | 说明 |
|---|---|
| `InquiryBeforeTargetSelection(Character, DecisionPoints)` | 选择目标前询问（可返回 InquiryOptions） |
| `ResolveInquiryBeforeTargetSelection(...)` | 解析询问结果 |
| `GetSelectableTargets(...)` | 获取所有可选目标 |
| `RealCanSelectTargetCount(enemys, teammates)` | 实际可选目标数 |
| `SelectTargets(...)` | 按规则选择目标 |
| `SelectTargetsByCanSelectTargetRange(...)` | 按施法距离选择目标 |
| `SelectTargetsByRange(...)` | 按指定格子范围选择目标 |
| `SelectNonDirectionalTargets(caster, targetGrid, includeCharacter)` | 非指向性目标格子 |

## 被动技能特殊要求

被动技能必须重写 `AddPassiveEffectToCharacter()` 才会自动添加到角色：

```csharp
public override IEnumerable<Effect> AddPassiveEffectToCharacter()
{
    return Effects;
}
```

## 其他方法

| 方法 | 说明 |
|---|---|
| `Copy(bool copyProperty = true, IEnumerable<Skill>? skillsDefined = null)` | 复制技能（可指定关联技能定义） |
| `SetPropertyToItemModuleNew(Skill)` | 将新技能属性同步到自身（物品模组用） |
| `GetInfo(bool showOriginal, bool showCD, bool showHardness)` | 技能信息文本 |
| `ToString()` | 技能文本输出 |

## 继承示例

```csharp
public class ExampleSkill : Skill
{
    public override long Id => 3;
    public override string Name => "全力一击";
    public override double EPCost => 60;
    public override double CD => 20;
    public override double HardnessTime { get; set; } = 8;

    public ExampleSkill(Character? c = null) : base(SkillType.Skill, c)
    {
        Effects.Add(new ExampleDamageBasedOnATKWithBasicDamage(this, 65, 65, 0.09, 0.04, DamageType.Physical));
        Effects.Add(new ExampleInterruptCastingEffect(this));
    }
}
```

## 关联

- 自定义技能 → [自定义技能](/dev/custom-skill)
- 技能规则 → [技能概述](/guide/skills)
- 特效基类 → [Effect](/api/Effect)
