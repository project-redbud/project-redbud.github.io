# 自定义技能

基于官方示例 `Library/Module/Example/ExampleSkill.cs`。

## 设计思想

- **所有技能特效，如果能直接 `new`，建议就直接 `new`**，提高性能和可读性
- 工厂模式更偏向于动态创建技能（JSON/配置），编码实现的技能直接 `new` 更简单
- 一个技能 = 多个特效的组合

---

## 指向性战技：全力一击

对目标造成物理伤害并打断施法，展示多特效组合 + 豁免检定：

```csharp
public class ExampleSkill : Skill
{
    public override long Id => 3;
    public override string Name => "全力一击";
    public override string Description =>
        string.Join("", Effects.Select(e => e.Description));
    public override double EPCost => 60;
    public override double CD => 20;
    public override double HardnessTime { get; set; } = 8;

    // 豁免检定方式一：设置 EffectForExemptionCheck
    // 豁免成功则整个技能失效（包括伤害）
    public override Effect? EffectForExemptionCheck =>
        Effects.FirstOrDefault(e => e is ExampleInterruptCastingEffect);

    public ExampleSkill(Character? c = null) : base(SkillType.Skill, c)
    {
        // 特效1：基于攻击力的物理伤害（带基础数值 + 等级成长）
        Effects.Add(new ExampleDamageBasedOnATKWithBasicDamage(
            this, 65, 65, 0.09, 0.04, DamageType.Physical));
        // 特效2：打断施法
        Effects.Add(new ExampleInterruptCastingEffect(this));
    }
}
```

### 伤害特效（带等级成长）

```csharp
public class ExampleDamageBasedOnATKWithBasicDamage : Effect
{
    // 数值随技能等级动态变化
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
    private DamageType DamageType { get; set; } = DamageType.Magical;

    public ExampleDamageBasedOnATKWithBasicDamage(
        Skill skill, double baseNumericDamage, double baseNumericDamageLevelGrowth,
        double baseATKCoefficient, double baseATKCoefficientLevelGrowth,
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

    public override void OnSkillCasted(SkillCastContext ctx)
    {
        if (ctx.Trigger is Character caster)
        {
            foreach (Character enemy in ctx.Targets)
                DamageToEnemy(caster, enemy, DamageType, MagicType, Damage);
        }
    }
}
```

### 打断施法特效（豁免检定方式二）

```csharp
public class ExampleInterruptCastingEffect : Effect
{
    public override EffectType EffectType => EffectType.InterruptCasting;

    public ExampleInterruptCastingEffect(Skill skill) : base(skill)
    {
        GamingQueue = skill.GamingQueue;
    }

    public override void OnSkillCasted(SkillCastContext ctx)
    {
        if (ctx.Trigger is not Character caster) return;
        foreach (Character target in ctx.Targets)
        {
            // 方式二：手动调用 CheckExemption
            // 只对该特效有效，不影响同技能的其他特效（伤害不会丢失）
            if (!CheckExemption(caster, target, this))
                InterruptCasting(target, caster);
        }
    }
}
```

---

## 非指向性战技：迷踪步

不选角色选格子，传送到范围内空地：

```csharp
public class ExampleNonDirectionalSkill1 : Skill
{
    public override double EPCost => 25;
    public override double CD => 35 - 1.5 * Level;
    public override double HardnessTime { get; set; } = 3;

    // 非指向性关键配置
    public override bool CanSelectSelf => true;
    public override bool CanSelectEnemy => false;
    public override bool SelectIncludeCharacterGrid => false;  // 不选有人的格子
    public override bool AllowSelectNoCharacterGrid => true;   // 可选空格

    public ExampleNonDirectionalSkill1(Character? c = null)
        : base(SkillType.Skill, c)
    {
        IsNonDirectional = true;
        CastRange = 9;
        Effects.Add(new ExampleNonDirectionalSkill1Effect(this));
    }
}

// 特效：执行传送
public class ExampleNonDirectionalSkill1Effect(Skill skill) : Effect(skill)
{
    public override void OnSkillCasted(SkillCastContext ctx)
    {
        if (ctx.Trigger is Character caster && GamingQueue?.Map is GameMap map && ctx.Grids.Count > 0)
            map.CharacterMove(caster, map.GetCharacterCurrentGrid(caster), ctx.Grids[0]);
    }
}
```

---

## 魔法：钻石星尘

圆形 AOE + 等级成长目标数 + 魔法瓶颈：

```csharp
public class ExampleNonDirectionalSkill2 : Skill
{
    public override double MPCost =>
        Level > 0 ? 80 + 75 * (Level - 1) : 80;
    public override double CD =>
        Level > 0 ? 35 + 2 * (Level - 1) : 35;
    public override double CastTime => 9;          // 吟唱时间
    public override double HardnessTime { get; set; } = 6;

    // 目标数随等级成长
    public override int CanSelectTargetCount => Level switch
    {
        4 or 5 or 6 => 2, 7 or 8 => 3, _ => 1
    };

    public override SkillRangeType SkillRangeType => SkillRangeType.Circle;
    public override int CanSelectTargetRange => 2;
    public override double MagicBottleneck =>
        35 + 24 * (Level - 1);  // 智力门槛随等级提高

    public ExampleNonDirectionalSkill2(Character? c = null)
        : base(SkillType.Magic, c)
    {
        IsNonDirectional = true;
        Effects.Add(new ExampleDamageBasedOnATKWithBasicDamage(
            this, 20, 20, 0.03, 0.02, DamageType.Magical));
    }
}
```

---

## 被动技能：心灵之弦

被动技能**必须重写 `AddPassiveEffectToCharacter()`** 才会自动添加到角色：

```csharp
public class ExamplePassiveSkill : Skill
{
    public ExamplePassiveSkill(Character? c = null)
        : base(SkillType.Passive, c)
    {
        Effects.Add(new ExamplePassiveSkillEffect(this));
    }

    // ⚠️ 被动技能必须重写此方法！
    public override IEnumerable<Effect> AddPassiveEffectToCharacter()
    {
        return Effects;
    }
}
```

被动特效 —— 普攻额外触发 + 伤害折半 + 硬直时间减免 + 时间冷却：

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
    public override AlterActualDamageResult AlterActualDamageAfterCalculation(DamageContext ctx)
    {
        // 嵌套普攻伤害折半（DamageDelta 为 SUM 聚合，负值即削减）
        if (ctx.Trigger == Skill.Character && IsNested && ctx.IsNormalAttack && ctx.Damage > 0)
            return new AlterActualDamageResult { DamageDelta = -(ctx.Damage / 2) };
        return default;
    }

    // 伤害计算后钩子：额外发动一次普通攻击
    public override void AfterDamageCalculation(DamageContext ctx)
    {
        if (ctx.Trigger is Character character && ctx.Enemy is Character enemy
            && character == Skill.Character && ctx.IsNormalAttack
            && CurrentCD == 0 && !IsNested && GamingQueue is IGamingQueue queue && enemy.HP > 0)
        {
            CurrentCD = CD;
            IsNested = true;
            try
            {
                character.NormalAttack.Attack(queue, character, null, enemy);
            }
            finally
            {
                IsNested = false;
            }
        }
    }

    // 时间流逝时冷却
    public override void OnTimeElapsed(TimeLapseContext ctx)
    {
        if (CurrentCD > 0)
        {
            CurrentCD -= ctx.Elapsed;
            if (CurrentCD <= 0) CurrentCD = 0;
        }
    }

    // 普攻后硬直时间减免（Factor 连乘聚合：最终硬直 = 基础 × (1 + Factor)）
    public override AlterHardnessTimeResult AlterHardnessTimeAfterNormalAttack(HardnessContext ctx)
    {
        return new AlterHardnessTimeResult { Factor = -0.2 };  // 即 × 0.8
    }
}
```

---

## 爆发技：千羽瞬华

自我增益型爆发技，联动其他技能（心灵之弦）：

```csharp
public class ExampleSuperSkill : Skill
{
    public override double EPCost => 100;
    public override double CD => 60;
    public override double HardnessTime { get; set; } = 10;
    public override bool CanSelectSelf => true;
    public override bool CanSelectEnemy => false;

    public ExampleSuperSkill(Character? c = null)
        : base(SkillType.SuperSkill, c)
    {
        Effects.Add(new ExampleSuperSkillEffect(this));
    }
}
```

爆发技特效 —— 多重加成 + 联动其他技能 + AI 偏好：

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
    private bool BonusApplied = false;
    private double ActualATKBonus = 0;
    private double ActualPhysicalPenetrationBonus = 0;
    private double ActualEvadeRateBonus = 0;

    // 特效施加：修改角色属性
    public override void OnEffectGained(HookContext ctx)
    {
        if (ctx.Trigger is not Character character || BonusApplied) return;
        BonusApplied = true;
        ActualATKBonus = ATKBonus;
        double previousPenetration = character.PhysicalPenetration;
        character.PhysicalPenetration += PhysicalPenetrationBonus;
        ActualPhysicalPenetrationBonus = character.PhysicalPenetration - previousPenetration;
        ActualEvadeRateBonus = EvadeRateBonus;
        character.ExATK2 += ActualATKBonus;
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
    public override void OnEffectLost(HookContext ctx)
    {
        if (ctx.Trigger is not Character character || !BonusApplied) return;
        BonusApplied = false;
        character.ExATK2 -= ActualATKBonus;
        character.PhysicalPenetration -= ActualPhysicalPenetrationBonus;
        character.ExEvadeRate -= ActualEvadeRateBonus;
        ActualATKBonus = 0;
        ActualPhysicalPenetrationBonus = 0;
        ActualEvadeRateBonus = 0;

        if (character.Effects.FirstOrDefault(
            e => e is ExamplePassiveSkillEffect && e.Skill.Character == character)
            is ExamplePassiveSkillEffect e)
        {
            e.CD = 10;
        }
    }

    // AI 决策偏好：提高普攻积极性
    public override AlterActionTypeResult AlterActionTypeBeforeAction(DecisionContext ctx)
    {
        return new AlterActionTypeResult
        {
            ActionType = CharacterActionType.None,
            PNormalAttack = ctx.PNormalAttack + 0.1  // 覆盖后者胜：基于 ctx 最新值链式叠加
        };
    }

    // 乘区1钩子：普攻伤害加成（基于敏捷）
    public override double AlterExpectedDamageBeforeCalculation(DamageContext ctx)
    {
        if (ctx.Trigger == Skill.Character && ctx.IsNormalAttack)
            return Coefficient * (Skill.Character?.AGI ?? 0);
        return 0;
    }

    // 普攻后硬直时间减免
    public override AlterHardnessTimeResult AlterHardnessTimeAfterNormalAttack(HardnessContext ctx)
    {
        return new AlterHardnessTimeResult { Factor = -0.2 };
    }

    // 技能释放时：不叠加效果刷新持续时间
    public override void OnSkillCasted(SkillCastContext ctx)
    {
        if (ctx.Trigger is not Character caster) return;
        RemainDuration = Duration;
        AddToCharacter(caster);
        RecordCharacterApplyEffects(caster, EffectType.DamageBoost, EffectType.PenetrationBoost);
    }
}
```

---

## 两种豁免检定方式对比

| 方式 | 设置位置 | 豁免成功后果 |
|---|---|---|
| 方式一：`EffectForExemptionCheck` | `Skill` 属性 | **整个技能失效**（含伤害等所有特效） |
| 方式二：`CheckExemption()` | `Effect.OnSkillCasted` 内手动调用 | **只跳过该特效**（不影响其他特效） |

> 方式二更安全——伤害不会因为豁免失败而丢失。
