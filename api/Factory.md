# Factory

全局工厂，位于 `Milimoe.FunGame.Core.Api`。负责按 `id`/`name`/`args` 动态创建实体（角色、技能、特效、物品等），并支持从 JSON 配置文件批量加载实体。

## 工厂实例

```csharp
// 全局唯一工厂实例（可动态扩展）
public static Factory OpenFactory { get; }
```

## 委托

```csharp
public delegate T? EntityFactoryDelegate<T>(long id, string name, Dictionary<string, object> args);
```

## 方法

### 注册与创建

| 方法 | 说明 |
|---|---|
| `RegisterFactory<T>(EntityFactoryDelegate<T>)` | 注册实体工厂（模组 Load 时自动调用） |
| `UnRegisterFactory<T>(EntityFactoryDelegate<T>)` | 注销实体工厂 |
| `GetInstance<T>(long id, string name, Dictionary<string, object> args)` | 按 id 创建实体（无工厂命中时回退：Character 默认 `new`、Skill 默认 `OpenSkill`、Item 默认 `OpenItem`、Effect 默认 `new`） |

支持类型：`Character`、`Inventory`、`Skill`、`Effect`、`Item`、`Room`、`User`。

```csharp
// 使用工厂创建（需先通过模组注册对应工厂）
Character c = Factory.OpenFactory.GetInstance<Character>(1, "", []);
Skill s = Factory.OpenFactory.GetInstance<Skill>(1001, "火之矢", args);
Item i = Factory.OpenFactory.GetInstance<Item>(20001, "铁剑", args);
```

### JSON 配置文件

| 方法 | 说明 |
|---|---|
| `GetGameModuleInstances<T>(string module_name, string file_name)` | 从 `modules/<模组名>/<文件名>.json` 读取实体字典 |
| `CreateGameModuleEntityConfig<T>(string module_name, string file_name, Dictionary<string, T> dict)` | 将实体字典保存为 JSON 配置文件 |

```csharp
// 读取配置
Dictionary<string, Item> items =
    Factory.GetGameModuleInstances<Item>("module_name", "file_name");

// 保存配置
Factory.CreateGameModuleEntityConfig("module_name", "file_name", items);
```

> 仅支持继承 `BaseEntity` 的实体类型（`where T : BaseEntity`）。详见 [实体模组 - JSON 配置文件](/dev/module-registration#json-配置文件entitymoduleconfig)。

## 关联

- 模组如何注册工厂 → [实体模组 (EntityModule)](/dev/module-registration)
- 模组体系 → [模组开发总览](/dev/module-overview)
