# CourageCommandSkill

勇气指令，位于 `Milimoe.FunGame.Core.Model.PrefabricatedEntity`。抽象类，行动回合内的附赠指令技能，使用后**不会结束回合**，可继续执行其他行动。

## 定义

```csharp
public abstract class CourageCommandSkill(Character? character = null)
    : Skill(SkillType.Skill, character)
{
    // 继承后实现具体逻辑即可
    // 框架会自动处理"不结束回合"的特殊行为
}
```

## 说明

- 属于主动战技（`SkillType.Skill`）
- 使用后不结束回合，可继续执行其他行动
- 通常由魔法卡包的 `CourageCommand` 属性提供（见 [MagicCardPack](/api/MagicCardPack)）

## 继承示例

```csharp
public class MyCourageCommand : CourageCommandSkill
{
    public MyCourageCommand(Character? c = null) : base(c)
    {
        Name = "冲锋指令";
        Effects.Add(new MyCourageCommandEffect(this));
    }
}
```

## 关联

- 特性详解 → [预制实体 - 勇气指令](/guide/prefabricated-entities#couragecommandskill-—-勇气指令)
- 魔法卡包 → [MagicCardPack](/api/MagicCardPack)
