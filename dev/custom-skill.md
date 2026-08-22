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

    public ExampleDamageBasedOnATKWithBasicDamage(
        Skill skill, double baseNumericDamage, double baseNumericDamageLevelGrowth,
        double baseATKCoefficient, double baseATKCoefficientLevelGrowth,
        DamageType damageType = DamageType.Magical,
        MagicType magicType = MagicType.None) : base(skill)
    {
        GamingQueue = skill.GamingQueue;
        // 赋值所有参数...
    }

    public override void OnSkillCasted(SkillCastContext ctx)
    {
        if (ctx.Actor is Character caster)
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

    public override void OnSkillCasted(SkillCastContext ctx)
    {
        if (ctx.Actor is not Character caster) return;
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
    public override bool IsNonDirectional => true;
    public override bool CanSelectSelf => true;
    public override bool CanSelectEnemy => false;
    public override bool SelectIncludeCharacterGrid => false;  // 不选有人的格子
    public override bool AllowSelectNoCharacterGrid => true;   // 可选空格

    public ExampleNonDirectionalSkill1(Character? c = null)
        : base(SkillType.Skill, c)
    {
        CastRange = 9;
        Effects.Add(new ExampleNonDirectionalSkill1Effect(this));
    }
}

// 特效：执行传送
public class ExampleNonDirectionalSkill1Effect(Skill skill) : Effect(skill)
{
    public override void OnSkillCasted(SkillCastContext ctx)
    {
        if (ctx.Actor is Character caster && GamingQueue?.Map is GameMap map && ctx.Grids.Count > 0)
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

    public override bool IsNonDirectional => true;
    public override SkillRangeType SkillRangeType => SkillRangeType.Circle;
    public override int CanSelectTargetRange => 2;
    public override double MagicBottleneck =>
        35 + 24 * (Level - 1);  // 智力门槛随等级提高

    public ExampleNonDirectionalSkill2(Character? c = null)
        : base(SkillType.Magic, c)
    {
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
    public double CurrentCD { get; set; } = 0;
    public double CD { get; set; } = 10;
    private bool IsNested = false;

    // 乘区2：嵌套普攻伤害折半
    public override double AlterActualDamageAfterCalculation(DamageContext ctx)
    {
        if (ctx.Actor == Skill.Character && IsNested && ctx.IsNormalAttack)
            return -(ctx.Damage / 2);
        return 0;
    }

    // 伤害计算后：额外发动一次普通攻击
    public override void AfterDamageCalculation(DamageContext ctx)
    {
        if (ctx.Actor is Character character && ctx.Enemy is Character enemy
            && character == Skill.Character && ctx.IsNormalAttack
            && CurrentCD == 0 && !IsNested && enemy.HP > 0)
        {
            CurrentCD = CD;
            IsNested = true;
            character.NormalAttack.Attack(GamingQueue, character, null, enemy);
        }
    }

    // 时间流逝时冷却
    public override void OnTimeElapsed(TimeLapseContext ctx)
    {
        if (CurrentCD > 0) CurrentCD -= ctx.Elapsed;
    }

    // 普攻后减少硬直时间
    public override void AlterHardnessTimeAfterNormalAttack(HardnessContext ctx)
    {
        ctx.BaseHardnessTime *= 0.8;
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
    public override bool Durative => true;
    public override double Duration => 30;
    public override DispelledType DispelledType => DispelledType.CannotBeDispelled;

    // 保存实际加成值以便恢复
    private double ActualATKBonus = 0, ActualPenBonus = 0, ActualEvadeBonus = 0;

    public override void OnEffectGained(HookContext ctx)
    {
        if (ctx.Actor is not Character character) return;
        ActualATKBonus = ATKMultiplier * character.BaseATK;
        character.ExATK2 += ActualATKBonus;
        character.PhysicalPenetration += 0.1 + 0.03 * (Skill.Level - 1);
        character.ExEvadeRate += 0.1 + 0.02 * (Skill.Level - 1);

        // 联动：降低心灵之弦的冷却时间至 3
        if (character.Effects.FirstOrDefault(
            e => e is ExamplePassiveSkillEffect) is ExamplePassiveSkillEffect e)
        {
            e.CD = 3;
            if (e.CurrentCD > e.CD) e.CurrentCD = e.CD;
        }
    }

    public override void OnEffectLost(HookContext ctx)
    {
        if (ctx.Actor is not Character character) return;
        character.ExATK2 -= ActualATKBonus;
        // 恢复所有...
        if (character.Effects.FirstOrDefault(
            e => e is ExamplePassiveSkillEffect) is ExamplePassiveSkillEffect e)
            e.CD = 10;
    }

    // AI 决策偏好调整
    public override CharacterActionType AlterActionTypeBeforeAction(DecisionContext ctx)
    {
        ctx.PNormalAttack += 0.1;  // 提高普攻优先级
        return CharacterActionType.None;
    }

    // 乘区1：基于敏捷的普攻伤害加成
    public override double AlterExpectedDamageBeforeCalculation(DamageContext ctx)
    {
        if (ctx.Actor == Skill.Character && ctx.IsNormalAttack)
            return 1.2 * (1 + 0.5 * (Skill.Level - 1)) * ctx.Actor.AGI;
        return 0;
    }

    // 普攻硬直时间额外减免（与心灵之弦叠加）
    public override void AlterHardnessTimeAfterNormalAttack(HardnessContext ctx)
    {
        ctx.BaseHardnessTime *= 0.8;  // 最终 = 原硬直 * 0.8 * 0.8
    }

    public override void OnSkillCasted(SkillCastContext ctx)
    {
        if (ctx.Actor is not Character caster) return;
        // 不叠加效果：刷新持续时间
        RemainDuration = Duration;
        if (!caster.Effects.Contains(this))
        {
            caster.Effects.Add(this);
            OnEffectGained(new HookContext(GamingQueue, caster));
        }
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
