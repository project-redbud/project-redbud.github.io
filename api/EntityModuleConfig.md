# EntityModuleConfig

实体模组配置文件，位于 `Milimoe.FunGame.Core.Api`。继承 `Dictionary<string, T>`，用于读取/保存实体 JSON 配置文件，适用范围：动态扩展技能和物品、保存玩家的存档。

文件保存路径：`程序目录/<ModuleDirectory>/<ModuleName>/<FileName>.json`。

## 构造函数

```csharp
// module_name：模组名称；file_name：配置文件名称（后缀 .json）；module_directory：目录，默认 "modules"
public EntityModuleConfig<T>(string module_name, string file_name, string module_directory = "modules") where T : BaseEntity
```

> 仅支持继承了 `BaseEntity` 的实体类型，每个 `EntityModuleConfig<T>` 仅保存一种实体类型的数据。

## 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `ModuleName` | `string` | 模组名称 |
| `FileName` | `string` | 配置文件名称 |
| `ModuleDirectory` | `string` | 模组目录（默认 `modules`） |

## 方法

| 方法 | 说明 |
|---|---|
| `LoadConfig()` | 从配置文件读取配置（文件不存在则保持空） |
| `SaveConfig()` | 将配置保存到配置文件（覆盖同名文件，请注意备份） |
| `Get(string key)` | 获取指定 key 的 value（不存在返回 null） |
| `Add(string key, T value)` | 添加配置（已存在 key 会覆盖） |
| `this[string key]` | 索引器（赋值时自动 Add） |

## 快捷方法（Factory）

```csharp
// 读取配置：程序目录/modules/<模组名>/<文件名>.json
Dictionary<string, Item> items =
    Factory.GetGameModuleInstances<Item>("module_name", "file_name");

// 保存配置
Factory.CreateGameModuleEntityConfig("module_name", "file_name", items);
```

## 使用示例

```csharp
EntityModuleConfig<Item> config = new("my_module", "my_items");
config.LoadConfig();                      // 读取已有配置

config["铁剑"] = new OpenItem(10001, "铁剑", []);
config.SaveConfig();                      // 保存（覆盖）
```

## 关联

- JSON 配置详解 → [实体模组 - JSON 配置文件](/dev/module-registration#json-配置文件-entitymoduleconfig)
- 工厂快捷方法 → [Factory](/api/Factory)
