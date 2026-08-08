# SkillModule

技能模组基类（抽象类），位于 `FunGame.Core.Library.Module`。实现 `IModule`，负责把自定义技能与特效注册到全局工厂。

## 抽象成员

```csharp
public abstract string Name { get; }
public abstract string Description { get; }
public abstract string Version { get; }
public abstract string Author { get; }

// 此模组中包含的技能（预定义，编码实现）
public abstract Dictionary<string, Skill> Skills { get; }
```

## 工厂

```csharp
// 技能工厂
protected abstract Factory.EntityFactoryDelegate<Skill> SkillFactory();

// 特效工厂
protected abstract Factory.EntityFactoryDelegate<Effect> EffectFactory();
```

注册后可通过 `Factory.OpenFactory.GetInstance<Skill>(id, name, args)` 与 `GetInstance<Effect>(id, name, args)` 创建技能与特效。

> **为什么需要 EffectFactory？** 特效通过 `Dictionary<string, object>` 传递参数（如 JSON 中 `"exatk": 20`），工厂根据 ID 创建正确的特效类型并传入参数，使同一个特效类可以被不同数值复用。

## 生命周期

| 方法 | 说明 |
|---|---|
| `Load(params object[] objs)` | 加载模组（注册技能 + 特效工厂，单例防重复） |
| `UnLoad(params object[] objs)` | 卸载模组（注销工厂） |
| `BeforeLoad()` | 返回 `false` 可阻止加载 |
| `AfterLoad()` | 加载后回调 |

## 继承示例

```csharp
public class ExampleSkillModule : SkillModule
{
    public override string Name => "fungame.example.skill";

    public override Dictionary<string, Skill> Skills
    {
        get
        {
            Dictionary<string, Skill> dict = [];
            dict.Add("全力一击", new ExampleSkill());
            return dict;
        }
    }

    protected override Factory.EntityFactoryDelegate<Skill> SkillFactory()
    {
        return (id, name, args) => id switch
        {
            1 => new ExampleNonDirectionalSkill1(),
            3 => new ExampleSkill(),
            _ => null
        };
    }

    protected override Factory.EntityFactoryDelegate<Effect> EffectFactory()
    {
        return (id, name, args) =>
        {
            Skill? skill = args.TryGetValue("skill", out object? v) && v is Skill s ? s : null;
            skill ??= new OpenSkill(id, name, args);
            return id == 1001 ? new ExampleOpenEffectExATK2(skill, args) : null;
        };
    }
}
```

## 关联

- 模组体系 → [模组开发总览](/dev/module-overview)
- 实体模组详解 → [实体模组 (EntityModule)](/dev/module-registration)
- 技能基类 → [Skill](/api/Skill)
