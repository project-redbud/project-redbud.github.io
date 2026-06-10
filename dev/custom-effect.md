# 自定义特效

基于官方示例 `Library/Common/Addon/Example/ExampleSkill.cs` 和 `ExampleItem.cs`。

---

## 伤害特效（带等级成长）

最常见的特效类型，数值随技能等级动态计算：

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

    // 可配置参数（通过构造函数传入）
    private double BaseNumericDamage { get; set; } = 100;
    private double BaseNumericDamageLevelGrowth { get; set; } = 50;
    private double BaseATKCoefficient { get; set; } = 0.2;
    private double BaseATKCoefficientLevelGrowth { get; set; } = 0.2;
    private DamageType DamageType { get; set; } = DamageType.Magical;

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
        BaseNumericDamage = baseNumericDamage;
        BaseNumericDamageLevelGrowth = baseNumericDamageLevelGrowth;
        BaseATKCoefficient = baseATKCoefficient;
        BaseATKCoefficientLevelGrowth = baseATKCoefficientLevelGrowth;
        DamageType = damageType;
        MagicType = magicType;
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

---

## 打断施法特效（含豁免检定）

```csharp
public class ExampleInterruptCastingEffect : Effect
{
    public override long Id => Skill.Id;
    public override string Name => Skill.Name;
    public override string Description =>
        $"对{Skill.TargetDescription()}施加打断施法效果：中断其正在进行的吟唱。";
    public override EffectType EffectType => EffectType.InterruptCasting;

    public ExampleInterruptCastingEffect(Skill skill) : base(skill)
    {
        GamingQueue = skill.GamingQueue;
    }

    public override void OnSkillCasted(Character caster, List<Character> targets,
        List<Grid> grids, Dictionary<string, object> others)
    {
        foreach (Character target in targets)
        {
            // 手动调用豁免检定——只对该特效有效
            if (!CheckExemption(caster, target, this))
            {
                InterruptCasting(target, caster);
            }
        }
    }
}
```

---

## 地图传送特效（非指向性技能用）

```csharp
public class ExampleNonDirectionalSkill1Effect(Skill skill) : Effect(skill)
{
    public override long Id => Skill.Id;
    public override string Name => Skill.Name;
    public override string Description =>
        $"立即将角色传送到范围内的任意{Skill.TargetDescription()}。";

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

## 被动特效（普攻额外触发 + CD + 乘区钩子）

```csharp
public class ExamplePassiveSkillEffect(Skill skill) : Effect(skill)
{
    public override long Id => Skill.Id;
    public override string Name => Skill.Name;
    public override string Description =>
        $"普通攻击硬直时间减少 20%。冷却 {CD:0.##} {GameplayEquilibriumConstant.InGameTime}。" +
        (CurrentCD > 0 ? $"（冷却剩余 {CurrentCD:0.##}）" : "");

    public double CurrentCD { get; set; } = 0;
    public double CD { get; set; } = 10;
    private bool IsNested = false;

    // 乘区2钩子：调整伤害计算后的实际伤害
    public override double AlterActualDamageAfterCalculation(
        Character character, Character enemy, double damage,
        bool isNormalAttack, DamageType damageType, MagicType magicType,
        DamageResult damageResult, ref bool isEvaded,
        Dictionary<Effect, double> totalDamageBonus)
    {
        // 嵌套普攻伤害折半
        if (character == Skill.Character && IsNested && isNormalAttack && damage > 0)
            return -(damage / 2);  // 返回负值即削减
        return 0;
    }

    // 伤害计算后钩子：额外发动一次普通攻击
    public override void AfterDamageCalculation(
        Character character, Character enemy, double damage,
        double actualDamage, bool isNormalAttack, DamageType damageType,
        MagicType magicType, DamageResult damageResult)
    {
        if (character == Skill.Character && isNormalAttack
            && CurrentCD == 0 && !IsNested && GamingQueue != null && enemy.HP > 0)
        {
            WriteLine($"[ {character} ] 发动了{Skill.Name}！额外进行一次普通攻击！");
            CurrentCD = CD;
            IsNested = true;
            character.NormalAttack.Attack(GamingQueue, character, null, enemy);
        }

        if (character == Skill.Character && IsNested)
            IsNested = false;
    }

    // 时间流逝时冷却
    public override void OnTimeElapsed(Character character, double elapsed)
    {
        if (CurrentCD > 0)
        {
            CurrentCD -= elapsed;
            if (CurrentCD <= 0) CurrentCD = 0;
        }
    }

    // 普攻后硬直时间减免
    public override void AlterHardnessTimeAfterNormalAttack(
        Character character, ref double baseHardnessTime, ref bool isCheckProtected)
    {
        baseHardnessTime *= 0.8;  // ref 变量直接修改
    }
}
```

---

## 爆发技增益特效（叠加属性 + 联动技能 + AI 偏好）

```csharp
public class ExampleSuperSkillEffect(Skill skill) : Effect(skill)
{
    public override long Id => Skill.Id;
    public override string Name => Skill.Name;
    public override string Description =>
        $"{Duration:0.##} {GameplayEquilibriumConstant.InGameTime}内，增加" +
        $"{ATKMultiplier * 100:0.##}% 攻击力、{PhysicalPenetrationBonus * 100:0.##}% 物理穿透、" +
        $"{EvadeRateBonus * 100:0.##}% 闪避率，普攻硬直时间额外减少 20%。";

    public override bool Durative => true;
    public override double Duration => 30;
    public override DispelledType DispelledType => DispelledType.CannotBeDispelled;

    private double Coefficient => 1.2 * (1 + 0.5 * (Skill.Level - 1));
    private double ATKMultiplier =>
        Skill.Level > 0 ? 0.15 + 0.03 * (Skill.Level - 1) : 0.15;
    private double ATKBonus => ATKMultiplier * (Skill.Character?.BaseATK ?? 0);
    private double PhysicalPenetrationBonus =>
        Skill.Level > 0 ? 0.1 + 0.03 * (Skill.Level - 1) : 0.1;
    private double EvadeRateBonus =>
        Skill.Level > 0 ? 0.1 + 0.02 * (Skill.Level - 1) : 0.1;

    // 保存实际加成值以便恢复
    private double ActualATKBonus = 0;
    private double ActualPhysicalPenetrationBonus = 0;
    private double ActualEvadeRateBonus = 0;

    // 特效施加：修改角色属性
    public override void OnEffectGained(Character character)
    {
        ActualATKBonus = ATKBonus;
        ActualPhysicalPenetrationBonus = PhysicalPenetrationBonus;
        ActualEvadeRateBonus = EvadeRateBonus;
        character.ExATK2 += ActualATKBonus;
        character.PhysicalPenetration += ActualPhysicalPenetrationBonus;
        character.ExEvadeRate += ActualEvadeRateBonus;

        // 联动其他技能：修改 ExamplePassiveSkillEffect 的冷却
        if (character.Effects.FirstOrDefault(
            e => e is ExamplePassiveSkillEffect && e.Skill.Character == character)
            is ExamplePassiveSkillEffect e)
        {
            e.CD = 3;
            if (e.CurrentCD > e.CD) e.CurrentCD = e.CD;
        }
    }

    // 特效移除：恢复角色属性
    public override void OnEffectLost(Character character)
    {
        character.ExATK2 -= ActualATKBonus;
        character.PhysicalPenetration -= ActualPhysicalPenetrationBonus;
        character.ExEvadeRate -= ActualEvadeRateBonus;

        if (character.Effects.FirstOrDefault(
            e => e is ExamplePassiveSkillEffect && e.Skill.Character == character)
            is ExamplePassiveSkillEffect e)
        {
            e.CD = 10;
        }
    }

    // AI 决策偏好：提高普攻积极性
    public override CharacterActionType AlterActionTypeBeforeAction(
        Character character, DecisionPoints dp, CharacterState state,
        ref bool canUseItem, ref bool canCastSkill,
        ref double pUseItem, ref double pCastSkill,
        ref double pNormalAttack, ref bool forceAction)
    {
        pNormalAttack += 0.1;
        return CharacterActionType.None;
    }

    // 乘区1钩子：普攻伤害加成（基于敏捷）
    public override double AlterExpectedDamageBeforeCalculation(
        Character character, Character enemy, double damage,
        bool isNormalAttack, DamageType damageType, MagicType magicType,
        Dictionary<Effect, double> totalDamageBonus)
    {
        if (character == Skill.Character && isNormalAttack)
            return Coefficient * character.AGI;
        return 0;
    }

    // 普攻后硬直时间减免
    public override void AlterHardnessTimeAfterNormalAttack(
        Character character, ref double baseHardnessTime, ref bool isCheckProtected)
    {
        baseHardnessTime *= 0.8;
    }

    // 技能释放时：不叠加效果刷新持续时间
    public override void OnSkillCasted(Character caster, List<Character> targets,
        List<Grid> grids, Dictionary<string, object> others)
    {
        ActualATKBonus = 0;
        ActualPhysicalPenetrationBonus = 0;
        ActualEvadeRateBonus = 0;
        RemainDuration = Duration;
        if (!caster.Effects.Contains(this))
        {
            caster.Effects.Add(this);
            OnEffectGained(caster);
        }
        RecordCharacterApplyEffects(caster, EffectType.DamageBoost, EffectType.PenetrationBoost);
    }
}
```

---

## 开放特效（从 Dictionary 读取参数，支持动态创建）

```csharp
public class ExampleOpenEffectExATK2 : Effect
{
    public override long Id => 1001;
    public override string Name { get; set; } = "攻击力加成";
    public override string Description =>
        $"{(ActualBonus >= 0 ? "增加" : "减少")}角色 " +
        $"{Math.Abs(BonusFactor) * 100:0.##}% " +
        $"[ {(ActualBonus == 0 ? "基于基础攻击力" : $"{Math.Abs(ActualBonus):0.##}")} ] 点攻击力。";

    private readonly double BonusFactor = 0;
    private double ActualBonus = 0;

    // 特效施加
    public override void OnEffectGained(Character character)
    {
        if (Durative && RemainDuration == 0)
            RemainDuration = Duration;
        else if (RemainDurationTurn == 0)
            RemainDurationTurn = DurationTurn;

        ActualBonus = character.BaseATK * BonusFactor;
        character.ExATKPercentage += BonusFactor;
    }

    // 特效移除
    public override void OnEffectLost(Character character)
    {
        character.ExATKPercentage -= BonusFactor;
    }

    // 属性变化时刷新（等级提升、装备更换等引起的基础属性变化）
    public override void OnAttributeChanged(Character character)
    {
        OnEffectLost(character);
        OnEffectGained(character);
    }

    // 从 Dictionary 读取参数
    public ExampleOpenEffectExATK2(Skill skill, Dictionary<string, object> args,
        Character? source = null) : base(skill, args)
    {
        EffectType = EffectType.Item;
        GamingQueue = skill.GamingQueue;
        Source = source;
        if (Values.Count > 0)
        {
            string key = Values.Keys.FirstOrDefault(
                s => s.Equals("exatk", StringComparison.CurrentCultureIgnoreCase)) ?? "";
            if (key.Length > 0 && double.TryParse(Values[key].ToString(), out double v))
                BonusFactor = v;
        }
    }
}
```

---

## 真实 Effect 方法速查

以下方法均来自官方示例的实际 `override`，没有虚构：

| 方法签名 | 用途 | 来自 |
|---|---|---|
| `OnEffectGained(Character)` | 特效施加到角色 | `ExampleSuperSkillEffect`, `ExATK2` |
| `OnEffectLost(Character)` | 特效从角色移除 | `ExampleSuperSkillEffect`, `ExATK2` |
| `OnSkillCasted(Character, List<Character>, List<Grid>, Dictionary)` | 技能释放时执行 | 所有技能特效 |
| `OnTimeElapsed(Character, double)` | 时间流逝 | `ExamplePassiveSkillEffect` |
| `OnAttributeChanged(Character)` | 属性变化时刷新 | `ExATK2` |
| `AfterDamageCalculation(Character, Character, double, double, bool, DamageType, MagicType, DamageResult)` | 伤害计算后 | `ExamplePassiveSkillEffect` |
| `AlterActualDamageAfterCalculation(Character, Character, double, bool, DamageType, MagicType, DamageResult, ref bool, Dictionary)` | 乘区2调整（返回加值） | `ExamplePassiveSkillEffect` |
| `AlterExpectedDamageBeforeCalculation(Character, Character, double, bool, DamageType, MagicType, Dictionary)` | 乘区1调整（返回加值） | `ExampleSuperSkillEffect` |
| `AlterHardnessTimeAfterNormalAttack(Character, ref double, ref bool)` | 普攻后调整硬直（ref 修改） | `ExamplePassiveSkillEffect`, `ExampleSuperSkillEffect` |
| `AlterActionTypeBeforeAction(Character, DecisionPoints, CharacterState, ref bool, ref bool, ref double, ref double, ref double, ref bool)` | AI 决策偏好调整 | `ExampleSuperSkillEffect` |
| `BeforeSkillCasted(Character, List<Character>, List<Grid>, double, double)` | 技能释放前 | `SoulboundEffect` |
| `AfterSkillCasted(Character, List<Character>, List<Grid>)` | 技能释放后 | `SoulboundEffect` |

## 特效内部可用方法

| 方法 | 说明 |
|---|---|
| `DamageToEnemy(caster, enemy, DamageType, MagicType, damage)` | 造成伤害 |
| `CheckExemption(caster, target, this)` | 豁免检定（返回 true = 豁免成功） |
| `InterruptCasting(target, interrupter)` | 打断目标施法 |
| `RecordCharacterApplyEffects(caster, params EffectType[])` | 记录特效施加到回合日志 |
| `WriteLine(string)` | 输出日志 |
