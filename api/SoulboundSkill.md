# SoulboundSkill

灵魂绑定爆发技，位于 `FunGame.Core.Model.PrefabricatedEntity`。抽象类，一个至少消耗 100 EP、每额外消耗 20 EP 效果增强 10% 的爆发技。

## 定义

```csharp
public abstract class SoulboundSkill(Character? character = null)
    : Skill(SkillType.SuperSkill, character)
{
    public override bool CostAllEP => true;   // 消耗全部能量
    public override double MinCostEP => 100;  // 至少 100
}
```

## 配套：SoulboundEffect

```csharp
public abstract class SoulboundEffect(SoulboundSkill skill) : Effect(skill)
{
    public SoulboundSkill SoulboundSkill => skill;

    // 增强系数：每额外 20 EP → +10% 效果
    public double Improvement
    {
        get => (character.EP - 100) / 20.0 * 0.1;
    }

    public override void BeforeSkillCasted(...);  // 释放前
    public override void AfterSkillCasted(...);   // 释放后
}
```

## 增强系数

| 能量 (EP) | Improvement | 效果 |
|---|---|---|
| 100 | 0 | 基础效果 |
| 200 | 0.5 | +50% |
| 300 | 1.0 | +100% |

## 继承示例

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
        double finalDamage = baseDamage * (1 + Improvement);
    }
}
```

## 关联

- 特性详解 → [预制实体 - 灵魂绑定](/guide/prefabricated-entities#soulboundskill-—-灵魂绑定爆发技)
- 爆发技规则 → [爆发技](/guide/skills-ultimate)
