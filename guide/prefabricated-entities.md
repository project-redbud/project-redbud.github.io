# 预制实体

FunGame.Core 提供 4 种预制实体，位于 `Model/PrefabricatedEntity/`，可直接继承使用。

---

## MagicCardPack — 魔法卡包

继承自 `Item`，是魔法卡包的标准实现。装备到角色后自动生效。

### 核心特性

| 特性 | 属性 | 说明 |
|---|---|---|
| **魔法技能组** | `Skills.Magics` | 卡包提供的所有魔法技能 |
| **动态矩阵** | `AttributeBoosts` | 增加角色额外核心属性（STR/AGI/INT） |
| **同频共振** | `Resonance` | 强制转换角色核心属性为该属性 |
| **神经校准** | `NeuralCalibration` | 使用特定武器时获得额外特效 |
| **勇气指令** | `CourageCommand` | 附赠指令技能（不结束回合） |
| **灵魂绑定** | `Soulbound` | 至少 100EP、可增强的爆发技 |

### 构造

```csharp
Character character = new() { Level = 1 };
MagicCardPack pack = new(new Dictionary<string, object>
{
    ["exstr"] = 15d,
    ["exagi"] = 10d,
    ["resonance"] = "AGI"
});

character.Equip(pack);
// 点数写入 ExSTR2 / ExAGI2，核心属性为 AGI。
// 可通过 pack.Magics 添加魔法，或配置 NeuralCalibration / CourageCommand / Soulbound。
character.UnEquip(EquipSlotType.MagicCardPack);
```

### 装备/卸载自动处理

装备通过 `Character.Equip(pack)` 进入物品钩子，动态矩阵的固定点数写入 `ExSTR2` / `ExAGI2` / `ExINT2`，`Ex*` 聚合实时反映。
`AttributeBoosts` 的键是 `PrimaryAttribute`：

```csharp
MagicCardPack pack = new();
pack.AttributeBoosts[PrimaryAttribute.STR] = 15;
pack.AttributeBoosts[PrimaryAttribute.AGI] = 10;
```

配置共振时，装备会切换核心属性；卸载回收动态矩阵，并还原已记录的非 `None` 主属性。
神经校准、勇气指令、灵魂绑定在配置后由对应装备钩子挂载和移除。

---

## SoulboundSkill — 灵魂绑定爆发技

一个至少消耗 100 EP、每额外消耗 20 EP 效果增强 10% 的爆发技。

### 基类

```csharp
public abstract class SoulboundSkill(Character? character = null)
    : Skill(SkillType.SuperSkill, character)
{
    public override bool CostAllEP => true;   // 消耗全部能量
    public override double MinCostEP => 100;  // 至少 100
}
```

### 增强系数

配套的 `SoulboundEffect` 自动计算增强系数：

```csharp
public double Improvement
{
    get
    {
        // 每额外 20 EP → +10% 效果
        return (character.EP - 100) / 20.0 * 0.1;
    }
}
```

### 使用示例

```csharp
public class MySoulbound : SoulboundSkill
{
    public MySoulbound(Character? c = null) : base(c)
    {
        Name = "终焉审判";
        Effects.Add(new MySoulboundEffect(this));
    }
}

public class MySoulboundEffect : SoulboundEffect
{
    public MySoulboundEffect(MySoulbound skill) : base(skill) { }

    public override void OnSkillCasted(SkillCastContext ctx)
    {
        double baseDamage = 500;
        double finalDamage = BaseDamage * (1 + Improvement);  // 增强系数
        // 100 EP → Improvement = 0       → 500 伤害
        // 200 EP → Improvement = 0.5     → 750 伤害
    }
}
```

---

## CourageCommandSkill — 勇气指令

行动回合内的附赠指令技能。使用后**不会结束回合**，可继续执行其他行动。

```csharp
public abstract class CourageCommandSkill(Character? character = null)
    : Skill(SkillType.Skill, character)
{
    // 继承后实现具体逻辑即可
    // 框架会自动处理"不结束回合"的特殊行为
}
```

---

## NeuralCalibrationEffect — 神经校准

使用特定武器时触发的额外特效。

```csharp
public abstract class NeuralCalibrationEffect : Effect
{
    public WeaponType SupportedWeaponType { get; set; } = WeaponType.None;
}

// 实现示例
public class BowMasteryEffect(Skill skill) : NeuralCalibrationEffect
{
    public BowMasteryEffect() : this(null) { }
    // 当角色使用 SupportedWeaponType 武器时，此特效生效
}
```

---

## SwitchCombatTalentSkill — 转换战斗天赋

战斗内切换当前生效战斗天赋的战技。角色学满 2 个战斗天赋后由 `ClassPlanner` 自动授予。

- `TargetRoleType`：切换到该定位下尚未激活的已学天赋；null 自动循环切换
- `TargetTalentId`：精确指定天赋 IdName（优先于 TargetRoleType）

```csharp
public class MyTalentSwitch : SwitchCombatTalentSkill
{
    public MyTalentSwitch(Character? c = null) : base(c)
    {
        Id = 9001;
        Name = "转换战斗天赋";
    }
}
```

切换后主要定位随之变化（影响 MOV 等按定位取值的属性）。详见 [SwitchCombatTalentSkill API](../api/SwitchCombatTalentSkill.md)。

---

## 预制实体的关系

```
MagicCardPack（魔法卡包）
├── Skills.Magics          ← 魔法技能组
├── AttributeBoosts        ← 动态矩阵（+STR/AGI/INT）
├── Resonance              ← 同频共振（切换核心属性）
├── NeuralCalibration      ← 神经校准（武器特效）
├── CourageCommand         ← 勇气指令（附赠技能）
└── Soulbound              ← 灵魂绑定（增强爆发技）
```
