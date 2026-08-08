# IModule

模组接口，位于 `FunGame.Core.Interface.Base`。所有模组（`CharacterModule`/`SkillModule`/`ItemModule`/`GameMap`）的公共契约。

## 接口定义

```csharp
public interface IModule
{
    string Name { get; }        // 模组唯一名称
    string Description { get; } // 模组描述
    string Version { get; }     // 模组版本
    string Author { get; }      // 模组作者

    bool Load(params object[] objs);    // 加载模组（单例，防重复）
    void UnLoad(params object[] objs);  // 卸载模组
}
```

## 生命周期

```
Load(objs)
    ├─ 已加载 → 返回 false（不允许重复加载）
    ├─ BeforeLoad() → 返回 false 可阻止加载
    ├─ 标记已加载 + 注册工厂
    └─ AfterLoad()
```

- `Load`：加载模组。实体模组在内部注册工厂到 `Factory.OpenFactory`；重复加载返回 `false`
- `UnLoad`：卸载模组，注销工厂

## 关联

- 模组体系 → [模组开发总览](/dev/module-overview)
- 实体模组 → [CharacterModule](/api/CharacterModule) / [SkillModule](/api/SkillModule) / [ItemModule](/api/ItemModule)
