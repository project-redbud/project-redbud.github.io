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
var pack = new MagicCardPack(new Dictionary<string, object>
{
    { "exstr", 15 },           // +15 力量
    { "exagi", 10 },           // +10 敏捷
    { "resonance", "AGI" }     // 同频共振 → 敏捷
});

// 添加魔法技能
Skill magic = new 火之矢 { Level = 5 };
pack.Skills.Magics.Add(magic);

// 添加神经校准
pack.NeuralCalibration = new MyNeuralCalibration { SupportedWeaponType = WeaponType.Bow };

// 添加勇气指令
pack.CourageCommand = new MyCourageCommand();

// 添加灵魂绑定爆发技
pack.Soulbound = new MySoulbound();

// 装备到角色
character.EquipSlot.MagicCardPack = pack;
// → OnItemEquipped 自动调用，所有特性生效
```

### 装备/卸载自动处理

```csharp
// 装备时 (OnItemEquipped)
character.ExSTR += AttributeBoosts["STR"];
character.ExAGI += AttributeBoosts["AGI"];
character.ExINT += AttributeBoosts["INT"];
character.PrimaryAttribute = Resonance;  // 同频共振
character.Effects.Add(NeuralCalibration); // 神经校准
character.Skills.Add(CourageCommand);     // 勇气指令
character.Skills.Add(Soulbound);          // 灵魂绑定

// 卸载时 (OnItemUnEquipped) → 全部恢复
```

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

    public override void OnSkillCasted(Character caster, ...)
    {
        double baseDamage = 500;
        double finalDamage = baseDamage * (1 + Improvement);  // 增强系数
        // 100 EP → Improvement = 0       → 500 伤害
        // 200 EP → Improvement = 0.5     → 750 伤害
        // 300 EP → Improvement = 1.0     → 1000 伤害
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

## 四种预制实体的关系

```
MagicCardPack（魔法卡包）
├── Skills.Magics          ← 魔法技能组
├── AttributeBoosts        ← 动态矩阵（+STR/AGI/INT）
├── Resonance              ← 同频共振（切换核心属性）
├── NeuralCalibration      ← 神经校准（武器特效）
├── CourageCommand         ← 勇气指令（附赠技能）
└── Soulbound              ← 灵魂绑定（增强爆发技）
```
