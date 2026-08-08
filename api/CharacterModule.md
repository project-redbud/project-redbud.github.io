# CharacterModule

角色模组基类（抽象类），位于 `Milimoe.FunGame.Core.Library.Module`。实现 `IModule`，负责把自定义角色注册到全局工厂。

## 抽象成员

```csharp
public abstract string Name { get; }
public abstract string Description { get; }
public abstract string Version { get; }
public abstract string Author { get; }

// 此模组中包含的角色（预定义，编码实现）
public abstract Dictionary<string, Character> Characters { get; }
```

## 工厂

```csharp
// 注册工厂（默认返回 new Character { Id = id, Name = name }）
protected virtual Factory.EntityFactoryDelegate<Character> CharacterFactory();
```

注册后可通过 `Factory.OpenFactory.GetInstance<Character>(id, name, args)` 创建角色。

## 生命周期

| 方法 | 说明 |
|---|---|
| `Load(params object[] objs)` | 加载模组（注册角色工厂，单例防重复） |
| `UnLoad(params object[] objs)` | 卸载模组（注销工厂） |
| `BeforeLoad()` | 返回 `false` 可阻止加载 |
| `AfterLoad()` | 加载后回调 |

## 继承示例

```csharp
public class ExampleCharacterModule : CharacterModule
{
    public override string Name => "fungame.example.character";

    public override Dictionary<string, Character> Characters
    {
        get
        {
            Dictionary<string, Character> dict = [];
            Character c = new()
            {
                Name = "Oshima",
                InitialHP = 30,
                InitialATK = 100
            };
            dict.Add(c.Name, c);
            return dict;
        }
    }

    protected override Factory.EntityFactoryDelegate<Character> CharacterFactory()
    {
        return (id, name, args) => id switch
        {
            1 => new OshimaShiya(),
            2 => new MyWarrior(),
            _ => null
        };
    }
}
```

## 关联

- 模组体系 → [模组开发总览](/dev/module-overview)
- 实体模组详解 → [实体模组 (EntityModule)](/dev/module-registration)
- 工厂 → [Factory](/api/Factory)
