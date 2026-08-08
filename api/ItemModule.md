# ItemModule

物品模组基类（抽象类），位于 `Milimoe.FunGame.Core.Library.Module`。实现 `IModule`，负责把自定义物品注册到全局工厂。

## 抽象成员

```csharp
public abstract string Name { get; }
public abstract string Description { get; }
public abstract string Version { get; }
public abstract string Author { get; }

// 此模组中包含的物品（预定义，编码实现）
public abstract Dictionary<string, Item> Items { get; }
```

## 工厂

```csharp
// 物品工厂
protected abstract Factory.EntityFactoryDelegate<Item> ItemFactory();
```

注册后可通过 `Factory.OpenFactory.GetInstance<Item>(id, name, args)` 创建物品。

## 生命周期

| 方法 | 说明 |
|---|---|
| `Load(params object[] objs)` | 加载模组（注册物品工厂，单例防重复） |
| `UnLoad(params object[] objs)` | 卸载模组（注销工厂） |
| `BeforeLoad()` | 返回 `false` 可阻止加载 |
| `AfterLoad()` | 加载后回调 |

## 继承示例

```csharp
public class ExampleItemModule : ItemModule
{
    public override string Name => "fungame.example.item";

    public override Dictionary<string, Item> Items
    {
        get
        {
            Dictionary<string, Item> dict = [];
            dict.Add("ExampleItem", new ExampleItem());
            return dict;
        }
    }

    protected override Factory.EntityFactoryDelegate<Item> ItemFactory()
    {
        return (id, name, args) => id switch
        {
            10001 => new 铁剑(),
            10002 => new 回复药(),
            _ => null
        };
    }
}
```

## 关联

- 模组体系 → [模组开发总览](/dev/module-overview)
- 实体模组详解 → [实体模组 (EntityModule)](/dev/module-registration)
- 物品基类 → [Item](/api/Item)
