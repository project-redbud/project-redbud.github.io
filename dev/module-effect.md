# 创建自定义特效

特效（Effect）是技能的**实际执行单元**。一个技能由多个特效组合而成。

## 官方示例中的特效类型

| 示例 | 用途 |
|---|---|
| `ExampleDamageBasedOnATKWithBasicDamage` | 基于攻击力的伤害（带基础数值） |
| `ExampleNonDirectionalSkill1Effect` | 传送到目标格子 |
| `ExampleInterruptCastingEffect` | 打断施法 + 豁免检定 |
| `ExamplePassiveSkillEffect` | 被动：普攻额外触发 + 冷却 |
| `ExampleSuperSkillEffect` | 爆发技：属性增益 + 联动 |
| `ExampleOpenEffectExATK2` | 开放特效：百分比攻击力 |

---

## 伤害特效（带等级成长）

```csharp
public class ExampleDamageBasedOnATKWithBasicDamage : Effect
{
    public override long Id => Skill.Id;
    public override string Name => Skill.Name;

    // 动态描述
    public override string Description =>
        $"对{Skill.TargetDescription()}造成 {BaseDamage:0.##} + " +
        $"{ATKCoefficient * 100:0.##}% 攻击力 [ {Damage:0.##} ] 点" +
        $"{CharacterSet.GetDamageTypeName(DamageType, MagicType)}。";

    // 数值随等级成长
    private double BaseDamage =>
        Skill.Level > 0
            ? BaseNumericDamage + BaseNumericDamageLevelGrowth * (Skill.Level - 1)
            : BaseNumericDamage;

    private double ATKCoefficient =>
        Skill.Level > 0
            ? BaseATKCoefficient + BaseATKCoefficientLevelGrowth * (Skill.Level - 1)
            : BaseATKCoefficient;

    private double Damage => BaseDamage + ATKCoefficient * (Skill.Character?.ATK ?? 0);

    // 可配置参数
    private double BaseNumericDamage { get; set; } = 100;
    private double BaseNumericDamageLevelGrowth { get; set; } = 50;
    private double BaseATKCoefficient { get; set; } = 0.2;
    private double BaseATKCoefficientLevelGrowth { get; set; } = 0.2;

    public ExampleDamageBasedOnATKWithBasicDamage(
        Skill skill,
        double baseNumericDamage,
        double baseNumericDamageLevelGrowth,
        double baseATKCoefficient,
        double baseATKCoefficientLevelGrowth,
        DamageType damageType = DamageType.Magical,
        MagicType magicType = MagicType.None) : base(skill)
    {
        GamingQueue = skill.GamingQueue;
        // ... 赋值 ...
    }

    public override void OnSkillCasted(Character caster, List<Character> targets,
        List<Grid> grids, Dictionary<string, object> others)
    {
        foreach (Character enemy in targets)
        {
            DamageToEnemy(caster, enemy, DamageType, MagicType, Damage);
        }
    }
}
```

::: tip 设计要点
特效的数值通过构造函数参数传入，同一个特效类可以复用于不同数值的技能。这就是"开放特效"的思想。
:::

---

## 打断施法 + 豁免检定

```csharp
public class ExampleInterruptCastingEffect : Effect
{
    public override EffectType EffectType => EffectType.InterruptCasting;

    public override void OnSkillCasted(Character caster, List<Character> targets,
        List<Grid> grids, Dictionary<string, object> others)
    {
        foreach (Character target in targets)
        {
            // 自行调用豁免检定（只对此特效有效，不影响同技能的其他特效）
            if (!CheckExemption(caster, target, this))
            {
                InterruptCasting(target, caster);
            }
        }
    }
}
```

::: tip 两种豁免检定方式
1. **技能级**：设置 `Skill.EffectForExemptionCheck`，豁免成功则整个技能失效
2. **特效级**：在特效内部自行调用 `CheckExemption()`，豁免成功只跳过该特效
:::

---

## 地图特效（选择格子）

```csharp
public class ExampleNonDirectionalSkill1Effect(Skill skill) : Effect(skill)
{
    public override void OnSkillCasted(Character caster, List<Character> targets,
        List<Grid> grids, Dictionary<string, object> others)
    {
        // 只有地图模式才有效
        if (GamingQueue?.Map is GameMap map && grids.Count > 0)
        {
            map.CharacterMove(caster,
                map.GetCharacterCurrentGrid(caster), grids[0]);
        }
    }
}
```

---

## 开放特效（百分比攻击力加成）

```csharp
public class ExampleOpenEffectExATK2 : Effect
{
    public override long Id => 1001;  // 分配唯一 ID 便于工厂注册
    public override string Name { get; set; } = "攻击力加成";

    private readonly double BonusFactor = 0;
    private double ActualBonus = 0;

    public override void OnEffectGained(Character character)
    {
        ActualBonus = character.BaseATK * BonusFactor;
        character.ExATKPercentage += BonusFactor;
    }

    public override void OnEffectLost(Character character)
    {
        character.ExATKPercentage -= BonusFactor;
    }

    // 属性变化时刷新加成
    public override void OnAttributeChanged(Character character)
    {
        OnEffectLost(character);
        OnEffectGained(character);
    }

    // 从 Dictionary 读取参数（支持动态创建）
    public ExampleOpenEffectExATK2(Skill skill, Dictionary<string, object> args,
        Character? source = null) : base(skill, args)
    {
        EffectType = EffectType.Item;
        if (Values.TryGetValue("exatk", out object? v)
            && double.TryParse(v?.ToString(), out double val))
        {
            BonusFactor = val;
        }
    }
}
```

---

## 关键生命周期方法

| 方法 | 触发时机 | 返回 |
|---|---|---|
| `OnSkillCasted` | 技能释放 | void |
| `OnEffectGained` | 特效施加到角色 | void |
| `OnEffectLost` | 特效从角色移除 | void |
| `AfterDamageCalculation` | 伤害计算后 | void |
| `AlterActualDamageAfterCalculation` | 乘区 2 调整 | double（加值） |
| `AlterExpectedDamageBeforeCalculation` | 乘区 1 调整 | double（加值） |
| `AlterHardnessTimeAfterNormalAttack` | 普攻后调整硬直 | ref 修改 |
| `AlterActionTypeBeforeAction` | AI 决策调整 | CharacterActionType |
| `OnTimeElapsed` | 时间流逝 | void |
| `OnAttributeChanged` | 属性变化 | void |
