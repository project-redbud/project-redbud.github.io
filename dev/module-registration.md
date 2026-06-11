# 实体模组 (EntityModule)

实体模组是 FunGame 扩展系统的基石——通过三种模组类将角色、技能/特效、物品注册到框架的全局工厂中。

---

## 三种实体模组

| 模组 | 基类 | 注册的工厂 |
|---|---|---|
| `CharacterModule` | `Library.Common.Addon.CharacterModule` | `CharacterFactory()` |
| `SkillModule` | `Library.Common.Addon.SkillModule` | `SkillFactory()` + `EffectFactory()` |
| `ItemModule` | `Library.Common.Addon.ItemModule` | `ItemFactory()` |

它们都继承 `IAddon` 接口，共享相同的生命周期。

---

## CharacterModule 角色模组

```csharp
public class ExampleCharacterModule : CharacterModule
{
    public override string Name => "fungame.example.character";
    public override string Description => "示例角色模组";
    public override string Version => "1.0.0";
    public override string Author => "FunGamer";

    // 供外部直接访问的角色列表
    public override Dictionary<string, Character> Characters
    {
        get
        {
            // 从工厂获取所有已注册的角色实例
            return Factory.GetGameModuleInstances<Character>(
                "module_name", "character_file");
        }
    }

    // ═══ 核心：ID → Character 的工厂方法 ═══
    protected override Factory.EntityFactoryDelegate<Character> CharacterFactory()
    {
        return (id, name, args) =>
        {
            return id switch
            {
                1 => new OshimaShiya(),
                2 => new MyWarrior(),
                _ => null
            };
        };
    }
}
```

### 工厂委托签名

```csharp
// Factory.EntityFactoryDelegate<T> 的实际签名
public delegate T EntityFactoryDelegate<T>(long id, string name, Dictionary<string, object> args);
```

| 参数 | 说明 |
|---|---|
| `id` | 实体唯一 ID（switch 分支的依据） |
| `name` | 实体名称（备用） |
| `args` | 额外参数字典（备用，如 JSON 反序列化时传入） |

---

## SkillModule 技能模组

技能模组需要同时注册**技能工厂**和**特效工厂**：

```csharp
public class ExampleSkillModule : SkillModule
{
    public override string Name => "fungame.example.skill";

    public override Dictionary<string, Skill> Skills
    {
        get => Factory.GetGameModuleInstances<Skill>("module", "skill");
    }

    // ═══ 技能工厂 ═══
    protected override Factory.EntityFactoryDelegate<Skill> SkillFactory()
    {
        return (id, name, args) =>
        {
            return id switch
            {
                1 => new 疾风步(),
                2 => new 火之矢(),
                3 => new 心灵之弦(),
                _ => null
            };
        };
    }

    // ═══ 特效工厂 ═══
    protected override Factory.EntityFactoryDelegate<Effect> EffectFactory()
    {
        return (id, name, args) =>
        {
            // args 中必须包含 "skill" 和 "values"
            if (args.TryGetValue("skill", out object? v) && v is Skill skill
                && args.TryGetValue("values", out v) && v is Dictionary<string, object> dict)
            {
                return id switch
                {
                    1001 => new ExATK(skill, dict),
                    1002 => new ExDEF(skill, dict),
                    _ => null
                };
            }
            return null;
        };
    }
}
```

> **为什么需要 EffectFactory？** 特效通过 `Dictionary<string, object>` 传递参数（如 JSON 中 `"exatk": 20`），工厂负责根据 ID 创建正确的特效类型并传入参数。这使得同一个特效类可以被不同数值复用。

---

## ItemModule 物品模组

```csharp
public class ExampleItemModule : ItemModule
{
    public override string Name => "fungame.example.item";

    public override Dictionary<string, Item> Items
    {
        get => Factory.GetGameModuleInstances<Item>("module", "item");
    }

    protected override Factory.EntityFactoryDelegate<Item> ItemFactory()
    {
        return (id, name, args) =>
        {
            return id switch
            {
                10001 => new 铁剑(),
                10002 => new 回复药(),
                _ => null
            };
        };
    }
}
```

---

## 生命周期

每个实体模组的生命周期完全一致：

```
BeforeLoad()
    │
    ├─ 返回 false → 跳过加载
    │
    └─ 返回 true
         │
         ├─ 标记 _isLoaded = true（不允许重复加载）
         ├─ 注册工厂到 Factory.OpenFactory
         │   ├─ CharacterModule  → RegisterFactory(CharacterFactory())
         │   ├─ SkillModule      → RegisterFactory(SkillFactory()) + RegisterFactory(EffectFactory())
         │   └─ ItemModule       → RegisterFactory(ItemFactory())
         │
         └─ AfterLoad()  ← 可重写，在此修改全局平衡常数等
```

### AfterLoad 示例

```csharp
protected override void AfterLoad()
{
    // 修改游戏术语
    General.GameplayEquilibriumConstant.InGameTime = "秒";
    General.GameplayEquilibriumConstant.InGameMaterial = "钻石";

    // 限制启用的魔法类型
    General.GameplayEquilibriumConstant.UseMagicType = [MagicType.None];
}
```

### BeforeLoad 示例

```csharp
protected override bool BeforeLoad()
{
    // 条件加载：只在服务器端加载此模组
    return Controller.IsServer;
}
```

---

## 完整加载流程

框架启动时，`GameModuleLoader.LoadGameModules()` 按以下顺序加载所有组件：

```
① 扫描 modules/ 目录的 DLL
    │
② 找到所有 IAddon 实现类
    ├── GameMap           → 加载到 loader.Maps
    ├── CharacterModule   → 加载到 loader.Characters
    ├── SkillModule       → 加载到 loader.Skills
    ├── ItemModule        → 加载到 loader.Items
    ├── GameModule        → 加载到 loader.Modules（客户端）
    └── GameModuleServer  → 加载到 loader.ModuleServers（服务端）
    │
③ 对每个 GameMap
    ├── map.ModuleLoader = loader
    └── map.AfterLoad(loader, objs)
    │
④ 对每个 GameModule / GameModuleServer
    ├── module.ModuleLoader = loader
    ├── module.GameModuleDepend.GetDependencies(loader)  ← 自动填充依赖
    ├── module.Load()        ← 触发实体模组的加载
    │     ├── CharacterModule.Load()  → 注册角色工厂
    │     ├── SkillModule.Load()      → 注册技能+特效工厂
    │     └── ItemModule.Load()       → 注册物品工厂
    └── module.AfterLoad(loader, objs)
```

## GameModuleDepend 依赖声明

`GameModuleDepend` 声明一个 GameModule 依赖哪些子模组，由框架自动填充：

```csharp
public class ExampleGameModuleConstant
{
    public const string ExampleGameModule = "fungame.example.gamemodule";
    public const string ExampleMap        = "fungame.example.gamemap";
    public const string ExampleCharacter  = "fungame.example.character";
    public const string ExampleSkill      = "fungame.example.skill";
    public const string ExampleItem       = "fungame.example.item";

    public static GameModuleDepend GameModuleDepend => new(
        Maps:       [ExampleMap],       // 依赖的地图模组名
        Characters: [ExampleCharacter], // 依赖的角色模组名
        Skills:     [ExampleSkill],     // 依赖的技能模组名
        Items:      [ExampleItem]       // 依赖的物品模组名
    );
}
```

框架调用 `GetDependencies(loader)` 时，会自动从 `loader` 中查找名称匹配的模组并填充到对应的集合中。**不要手动填充 `Maps`/`Characters`/`Skills`/`Items` 集合**。

---

## 热重载支持

需要热重载的模组应实现 `IHotReloadAware` 接口：

```csharp
public class MySkillModule : SkillModule, IHotReloadAware
{
    // ... 工厂注册 ...

    public void OnBeforeUnload()
    {
        // 清理状态：关闭网络连接、清空缓存等
        // 框架在卸载前调用此方法
    }
}
```

> 只有实现了 `IHotReloadAware` 的模组才会被热重载模式识别。未实现该接口的模组在热重载时会被忽略。

---

## DLL 部署位置

| 目录 | 内容 |
|---|---|
| `modules/` | 游戏模组 DLL（GameModule / GameModuleServer + EntityModule） |
| `maps/` | 地图模组 DLL |
| `plugins/` | 客户端/服务端插件 DLL |

框架启动时自动扫描对应目录，找到所有 `IAddon` 实现并执行加载流程。
