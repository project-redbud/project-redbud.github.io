# SwitchCombatTalentSkill

转换战斗天赋战技，位于 `FunGame.Core.Model.PrefabricatedEntity`。抽象类，战斗内切换当前生效的战斗天赋。

授予前提：角色已学战斗天赋 ≥ 2（`CharacterClass.HasCombatTalentSwitch`），由 `ClassPlanner.LearnCombatTalent` 学满 2 个时自动授予。

## 定义

```csharp
public abstract class SwitchCombatTalentSkill : Skill
{
    // 切换到该定位下尚未激活的已学天赋；null/None 自动选下一个
    public RoleType? TargetRoleType { get; set; } = null;

    // 指定天赋 IdName，优先于 TargetRoleType（同定位多天赋时唯一精确方式）
    public string? TargetTalentId { get; set; } = null;

    protected SwitchCombatTalentSkill(Character? character = null) : base(SkillType.Skill, character)
    {
        Effects.Add(new SwitchCombatTalentEffect());
    }
}
```

## 配套特效 SwitchCombatTalentEffect

```csharp
public class SwitchCombatTalentEffect : Effect
{
    public override void OnSkillCasted(SkillCastContext ctx)
    {
        // 前置：ctx.Trigger?.Class is CharacterClass plan && plan.HasCombatTalentSwitch
        // 1. TargetTalentId 精确匹配 → plan.SwitchCombatTalent(byTalent, out _)
        // 2. TargetRoleType → plan.SwitchCombatTalent(role, out _)
        // 3. 未指定 → plan.NextTalentAfter(plan.CombatTalent) 循环切换
    }
}
```

## 切换效果

切换后 `ClassPlanRoleResolver` 重新推导定位：**主要定位**变为新天赋所属定位（影响 `MOV` 等按定位取值的属性），核心定位天赋的等级加成（普攻与主动技能 `ExLevel + 1`）随之转移。

## 使用示例

```csharp
public class MyTalentSwitch : SwitchCombatTalentSkill
{
    public MyTalentSwitch(Character? c = null) : base(c)
    {
        Id = 9001;
        Name = "转换战斗天赋";
        // TargetRoleType = RoleType.Guardian;   // 可选：固定切到某定位
        // TargetTalentId = "my.talent.id";      // 可选：精确指定天赋
    }
}

// 注入到规划器（角色学会 2 个天赋后自动获得）
planner.SetCombatTalentSwitchSkill(new MyTalentSwitch());

// 存档重建需注册
ClassDefinitionRegistry.RegisterSwitchSkill("my.talent.switch", () => new MyTalentSwitch());
```

## 关联

- 职业系统规则 → [职业规划系统](/guide/class-plan)
- 规划器 → [ClassPlanner](/api/ClassPlanner)
- 魔法卡包 → [MagicCardPack](/api/MagicCardPack)
