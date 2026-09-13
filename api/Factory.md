# Factory

全局工厂，位于 `FunGame.Core.Api`。负责按 `id`/`name`/`args` 动态创建实体（角色、技能、特效、物品等），并支持从 JSON 配置文件批量加载实体。

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
| `GetInstance<T>(long id, string name, Dictionary<string, object> args)` | 按 id 创建实体（无工厂命中时回退：Character 默认 `new`、Skill 默认 `OpenSkill`、Item 默认 `OpenItem`） |
| `RegisterFactory(EffectFactoryDelegate)` | 注册**特效专用**工厂（v3.0 分离，见下） |
| `UnRegisterFactory(EffectFactoryDelegate)` | 注销特效专用工厂 |
| `GetInstance(long id, string name, Skill skill, Dictionary<string, object>? args)` | 创建特效（非泛型，无工厂命中时回退 `new Effect()`） |

::: warning 特效工厂已从泛型路径分离（v3.0）
`RegisterFactory<Effect>` / `UnRegisterFactory<Effect>` / `GetInstance<Effect>` 泛型路径现在会抛出 `NotSupportedInstanceClassException`。特效必须使用专用委托，其签名镜像 `Effect` 受保护构造函数的参数：

```csharp
public delegate Effect? EffectFactoryDelegate(long id, string name, Skill skill, Dictionary<string, object>? args);

// 注册示例
Factory.OpenFactory.RegisterFactory((id, name, skill, args) =>
{
    skill ??= new OpenSkill(id, name, args ?? []);
    return id == 1001 ? new ExampleOpenEffectExATK2(skill, args ?? []) : null;
});

// 创建特效
Effect e = Factory.OpenFactory.GetInstance(1001, "攻击力加成", skill, args);
```
:::

支持类型：`Character`、`Inventory`、`Skill`、`Item`、`Room`、`User`（泛型路径）+ `Effect`（专用路径）。

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
