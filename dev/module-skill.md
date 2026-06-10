# 创建自定义技能

技能通过继承 `Skill` 类来创建。官方示例展示了 **6 种技能类型** 的完整实现。

## 指向性技能：全力一击

对目标造成物理伤害并打断施法：

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

    // 指定用于豁免检定的特效
    public override Effect? EffectForExemptionCheck =>
        Effects.FirstOrDefault(e => e is ExampleInterruptCastingEffect);

    public ExampleSkill(Character? character = null)
        : base(SkillType.Skill, character)
    {
        // 特效1：伤害
        Effects.Add(new ExampleDamageBasedOnATKWithBasicDamage(
            this, 65, 65, 0.09, 0.04, DamageType.Physical));
        // 特效2：打断施法
        Effects.Add(new ExampleInterruptCastingEffect(this));
    }
}
```

---

## 非指向性技能：迷踪步

传送到范围内的空地（不选角色，选格子）：

```csharp
public class ExampleNonDirectionalSkill1 : Skill
{
    public override long Id => 1;
    public override string Name => "迷踪步";
    public override double EPCost => 25;
    public override double CD => 35 - 1.5 * Level;
    public override double HardnessTime { get; set; } = 3;

    // 非指向性：不选择目标角色，选择目标格子
    public override bool IsNonDirectional => true;
    public override bool CanSelectSelf => true;
    public override bool CanSelectEnemy => false;
    public override bool CanSelectTeammate => false;
    public override int CanSelectTargetRange => 0;
    public override bool SelectIncludeCharacterGrid => false;  // 不选有人的格子
    public override bool AllowSelectNoCharacterGrid => true;   // 可选空格子

    public ExampleNonDirectionalSkill1(Character? character = null)
        : base(SkillType.Skill, character)
    {
        CastRange = 9;  // 施法范围
        Effects.Add(new ExampleNonDirectionalSkill1Effect(this));
    }
}
```

---

## 魔法：钻石星尘

圆形范围魔法伤害，带魔法瓶颈：

```csharp
public class ExampleNonDirectionalSkill2 : Skill
{
    public override long Id => 2;
    public override string Name => "钻石星尘";
    public override double MPCost => Level > 0 ? 80 + 75 * (Level - 1) : 80;
    public override double CD => Level > 0 ? 35 + 2 * (Level - 1) : 35;
    public override double CastTime => 9;          // 吟唱时间
    public override double HardnessTime { get; set; } = 6;

    // 目标数随等级成长
    public override int CanSelectTargetCount => Level switch
    {
        4 or 5 or 6 => 2,
        7 or 8 => 3,
        _ => 1
    };

    public override bool IsNonDirectional => true;
    public override SkillRangeType SkillRangeType => SkillRangeType.Circle;
    public override int CanSelectTargetRange => 2;
    public override double MagicBottleneck => 35 + 24 * (Level - 1);

    public ExampleNonDirectionalSkill2(Character? character = null)
        : base(SkillType.Magic, character)
    {
        Effects.Add(new ExampleDamageBasedOnATKWithBasicDamage(
            this, 20, 20, 0.03, 0.02, DamageType.Magical));
    }
}
```

---

## 被动技能：心灵之弦

被动技能必须重写 `AddPassiveEffectToCharacter()` 才会自动添加到角色：

```csharp
public class ExamplePassiveSkill : Skill
{
    public override long Id => 4;
    public override string Name => "心灵之弦";

    public ExamplePassiveSkill(Character? character = null)
        : base(SkillType.Passive, character)
    {
        Effects.Add(new ExamplePassiveSkillEffect(this));
    }

    /// <summary>
    /// 被动技能必须重写此方法！否则特效不会自动添加到角色身上
    /// </summary>
    public override IEnumerable<Effect> AddPassiveEffectToCharacter()
    {
        return Effects;
    }
}
```

被动特效示例（普攻额外触发 + 硬直时间减免）：

```csharp
public class ExamplePassiveSkillEffect(Skill skill) : Effect(skill)
{
    public double CurrentCD { get; set; } = 0;
    public double CD { get; set; } = 10;
    private bool IsNested = false;

    // 伤害计算后：额外发动一次普攻
    public override void AfterDamageCalculation(Character character, Character enemy,
        double damage, double actualDamage, bool isNormalAttack, ...)
    {
        if (character == Skill.Character && isNormalAttack
            && CurrentCD == 0 && !IsNested && enemy.HP > 0)
        {
            CurrentCD = CD;
            IsNested = true;
            character.NormalAttack.Attack(GamingQueue, character, null, enemy);
        }
    }

    // 嵌套普攻伤害折半
    public override double AlterActualDamageAfterCalculation(...)
    {
        if (character == Skill.Character && IsNested && isNormalAttack)
            return -(damage / 2);  // 返回负值即削减
        return 0;
    }

    // 普攻后减少硬直时间
    public override void AlterHardnessTimeAfterNormalAttack(Character character,
        ref double baseHardnessTime, ref bool isCheckProtected)
    {
        baseHardnessTime *= 0.8;
    }

    // 时间流逝时冷却
    public override void OnTimeElapsed(Character character, double elapsed)
    {
        if (CurrentCD > 0) CurrentCD -= elapsed;
    }
}
```

---

## 爆发技：千羽瞬华

自身增益型爆发技，联动其他技能：

```csharp
public class ExampleSuperSkill : Skill
{
    public override long Id => 5;
    public override string Name => "千羽瞬华";
    public override double EPCost => 100;
    public override double CD => 60;
    public override double HardnessTime { get; set; } = 10;
    public override bool CanSelectSelf => true;
    public override bool CanSelectEnemy => false;

    public ExampleSuperSkill(Character? character = null)
        : base(SkillType.SuperSkill, character)
    {
        Effects.Add(new ExampleSuperSkillEffect(this));
    }
}
```

爆发技特效（叠加属性 + 联动心灵之弦）：

```csharp
public class ExampleSuperSkillEffect(Skill skill) : Effect(skill)
{
    public override bool Durative => true;
    public override double Duration => 30;
    public override DispelledType DispelledType => DispelledType.CannotBeDispelled;

    public override void OnEffectGained(Character character)
    {
        character.ExATK2 += ATKBonus;
        character.PhysicalPenetration += PhysicalPenetrationBonus;
        character.ExEvadeRate += EvadeRateBonus;

        // 联动心灵之弦：降低其冷却时间
        if (character.Effects.FirstOrDefault(
            e => e is ExamplePassiveSkillEffect) is ExamplePassiveSkillEffect e)
        {
            e.CD = 3;
        }
    }

    public override void OnEffectLost(Character character)
    {
        character.ExATK2 -= ATKBonus;
        // ... 恢复所有修改
    }

    // AI 决策偏好调整
    public override CharacterActionType AlterActionTypeBeforeAction(...)
    {
        pNormalAttack += 0.1;  // 提高普攻优先级
        return CharacterActionType.None;
    }
}
```

---

## 技能类型速查

| 类型 | SkillType | 特点 |
|---|---|---|
| 指向性战技 | `SkillType.Skill` | 选目标角色，直接生效 |
| 非指向性战技 | `SkillType.Skill` + `IsNonDirectional` | 选目标格子 |
| 魔法 | `SkillType.Magic` | 有吟唱时间 + 魔法瓶颈 |
| 被动 | `SkillType.Passive` | 必须重写 `AddPassiveEffectToCharacter()` |
| 爆发技 | `SkillType.SuperSkill` | 回合外预释放 |
| 物品技能 | `SkillType.Passive` / `SkillType.Item` | 关联到 Item |
