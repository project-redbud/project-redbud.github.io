# 模组开发总览

FunGame.Core 通过**模组（Module）**系统扩展游戏内容。模组将角色、技能/特效、物品注册到全局工厂中，供 `Factory.OpenFactory.GetInstance<T>()` 动态创建实体；也可与 JSON 配置文件结合，实现免编码的实体扩展。

官方示例位于 `Library/Module/Example/`（`ExampleGameModule.cs`、`ExampleSkill.cs`、`ExampleItem.cs`）。

---

## 模组体系

v3.0 的模组体系由 **1 个接口 + 3 个实体模组基类 + 1 个地图基类**组成：

| 类型 | 基类/接口 | 注册内容 |
|---|---|---|
| `CharacterModule` | `FunGame.Core.Library.Module` | 角色工厂 |
| `SkillModule` | `FunGame.Core.Library.Module` | 技能工厂 + 特效工厂 |
| `ItemModule` | `FunGame.Core.Library.Module` | 物品工厂 |
| `GameMap` | `FunGame.Core.Model.Framework` | 战棋地图（网格数据 + 队列事件介入） |

所有模组都实现 `IModule` 接口（`FunGame.Core.Interface.Base`）：

```csharp
public interface IModule
{
    string Name { get; }
    string Description { get; }
    string Version { get; }
    string Author { get; }

    bool Load(params object[] objs);    // 加载模组（单例，防重复）
    void UnLoad(params object[] objs);  // 卸载模组
}
```

---

## 三种实体模组

实体模组负责把自定义实体注册到 `Factory.OpenFactory`，使 `GetInstance<T>(id, name, args)` 能按 id 创建正确的实体类。

| 模组 | 必须实现的成员 | 注册的工厂 |
|---|---|---|
| `CharacterModule` | `Characters`（角色字典）、`CharacterFactory()` | 角色工厂 |
| `SkillModule` | `Skills`（技能字典）、`SkillFactory()` + `EffectFactory()` | 技能工厂 + 特效工厂 |
| `ItemModule` | `Items`（物品字典）、`ItemFactory()` | 物品工厂 |

```csharp
public class ExampleSkillModule : SkillModule
{
    public override string Name => "fungame.example.skill";
    public override string Description => "My First SkillModule";
    public override string Version => "1.0.0";
    public override string Author => "FunGamer";

    // 预定义的技能（编码实现）
    public override Dictionary<string, Skill> Skills
    {
        get
        {
            Dictionary<string, Skill> dict = [];
            // 技能应新建类继承 Skill 实现，再自行构造并加入此列表
            dict.Add("全力一击", new ExampleSkill());
            return dict;
        }
    }

    // 技能工厂：按 id/name/args 动态创建技能
    protected override Factory.EntityFactoryDelegate<Skill> SkillFactory()
    {
        return (id, name, args) => id switch
        {
            1 => new ExampleNonDirectionalSkill1(),
            2 => new ExampleNonDirectionalSkill2(),
            3 => new ExampleSkill(),
            _ => null
        };
    }

    // 特效工厂：动态创建特效（JSON 配置创建实体时必须在此注册）
    protected override Factory.EntityFactoryDelegate<Effect> EffectFactory()
    {
        return (id, name, args) =>
        {
            // args 中可携带 "skill" 等参数
            Skill? skill = args.TryGetValue("skill", out object? v) && v is Skill s ? s : null;
            skill ??= new OpenSkill(id, name, args);
            return id == 1001 ? new ExampleOpenEffectExATK2(skill, args) : null;
        };
    }
}
```

### 工厂委托签名

```csharp
public delegate T? EntityFactoryDelegate<T>(long id, string name, Dictionary<string, object> args);
```

| 参数 | 说明 |
|---|---|
| `id` | 实体唯一 ID（switch 分支的依据） |
| `name` | 实体名称（备用） |
| `args` | 额外参数字典（备用，如 JSON 反序列化时传入） |

### 工厂的两种用法

- **编码实现**：能直接 `new` 就 `new`——`Effects.Add(new MyDamageEffect(this, 100, 0.5))`。高性能、可调试、可读性好。
- **动态创建**：`Factory.OpenFactory.GetInstance<Effect>(1001, "", args)`——根据运行时传入的 ID 和参数决定创建哪个类，配合 JSON 配置文件使用。

> 工厂的价值在于**根据运行时传入的 ID 和参数决定创建哪个类**。编码时你已经知道要创建哪个类，直接 new 即可。

---

## GameMap 地图模组

地图继承抽象类 `GameMap`，重写元数据与尺寸，并实现 `InitGamingQueue(IGamingQueue)` 返回一个**新的地图实例**（模组是单例的，不能复用同一个地图对象）：

```csharp
public class ExampleGameMap : GameMap
{
    public override string Name => "fungame.example.gamemap";
    public override string Description => "My First GameMap";
    public override string Version => "1.0.0";
    public override string Author => "FunGamer";

    public override int Length => 12;
    public override int Width => 12;
    public override int Height => 6;
    public override float Size => 4.0f;

    public override GameMap InitGamingQueue(IGamingQueue queue)
    {
        GameMap map = new ExampleGameMap();
        map.Load();

        // 介入游戏队列（注意传入的 queue 可能不是 GamingQueue，要做类型检查）
        if (queue is GamingQueue gq)
        {
            gq.SelectTargetGridEvent += Gq_SelectTargetGrid;
        }
        return map;
    }

    private Grid Gq_SelectTargetGrid(GamingQueue queue, Character character,
        List<Character> enemys, List<Character> teammates, GameMap map,
        List<Grid> canMoveGrids)
    {
        // 介入选择，假设这里更新界面，让玩家选择目的地
        return Grid.Empty;
    }
}
```

---

## 生命周期

`IModule.Load()` 由框架或宿主调用，三个实体模组的加载流程一致：

```
Load(objs)
    │
    ├─ 已加载（_isLoaded = true）→ 直接返回 false，禁止重复加载
    │
    ├─ BeforeLoad()   ← 返回 false 可阻止加载（如"只在服务端加载"）
    │
    ├─ 标记 _isLoaded = true
    ├─ RegisterFactory(工厂)   ← 注册到 Factory.OpenFactory
    │     ├─ CharacterModule → RegisterFactory(CharacterFactory())
    │     ├─ SkillModule     → RegisterFactory(SkillFactory()) + RegisterFactory(EffectFactory())
    │     └─ ItemModule      → RegisterFactory(ItemFactory())
    │
    └─ AfterLoad()     ← 加载后回调（可修改全局平衡常数等）

UnLoad(objs)
    └─ UnRegisterFactory(工厂)  ← 从 Factory.OpenFactory 注销
```

### AfterLoad 示例

```csharp
protected override void AfterLoad()
{
    // 修改游戏术语与平衡参数
    General.GameplayEquilibriumConstant.InGameTime = "秒";
    General.GameplayEquilibriumConstant.UseMagicType = [MagicType.None];
}
```

### BeforeLoad 示例

```csharp
protected override bool BeforeLoad()
{
    // 条件加载：根据宿主传入的参数决定是否加载此模组
    // 返回 false 将阻止加载（Load 返回 false，不注册工厂）
    return true;
}
```

---

## JSON 配置文件（EntityModuleConfig）

无需编写 C# 类即可扩展实体。`EntityModuleConfig<T>`（`FunGame.Core.Api`）读取/保存 `程序目录/modules/<模组名>/<文件名>.json`：

```csharp
// 读取配置：所有条目进入字典
Dictionary<string, Item> items =
    Factory.GetGameModuleInstances<Item>("module_name", "file_name");

// 写入配置：把实体字典保存为 JSON 文件
Factory.CreateGameModuleEntityConfig("module_name", "file_name", myItems);
```

- 仅支持继承 `BaseEntity` 的实体类型（`Character`/`Skill`/`Effect`/`Item` 等）。
- 每个配置文件只保存**一种实体类型**。
- 反序列化时，JSON 中未映射到转换器属性的字段自动进入实体的 `Values`/`Others` 字典；需要动态创建的特效类请在 `EffectFactory()` 中按 id 注册。

> 适用于：动态扩展技能和物品、保存玩家的存档。详见 [自定义物品 - JSON 动态创建](/dev/custom-item)。

---

## 项目结构

一个典型的模组解决方案：

```
MyGameModule.sln
│
├── MyCore/                     # 常量定义项目
│   └── Constant.cs             # 模组名称常量
│
└── MyModules/                  # 实体 + 实体模组
    ├── Characters/             # 角色类（继承 Character）
    ├── Skills/                 # 技能类（继承 Skill）
    ├── Effects/                # 特效类（继承 Effect）
    ├── Items/                  # 物品类（继承 Item）
    ├── Modules/                # 实体模组类（注册工厂）
    │   ├── CharacterModule.cs
    │   ├── SkillModule.cs
    │   └── ItemModule.cs
    ├── MyGameMap.cs            # 地图（继承 GameMap）
    └── MyGameModuleConstant.cs # 常量类
```

---

## 常量定义

模组名称建议统一在常量类中定义，供工厂与配置文件引用：

```csharp
public class ExampleGameModuleConstant
{
    public const string ExampleGameModule = "fungame.example.gamemodule";
    public const string ExampleMap        = "fungame.example.gamemap";
    public const string ExampleCharacter  = "fungame.example.character";
    public const string ExampleSkill      = "fungame.example.skill";
    public const string ExampleItem       = "fungame.example.item";
}
```

---

## 关键设计原则

### 1. 模组是单例的

一个模组类在进程内只有一个实例（`Load` 防重复）。**不要把游戏局级别的数据放在模组的实例字段上**——每局游戏的状态应放在队列、地图或外部存储中。

### 2. 硬编码直接 new，动态创建走工厂

来自官方示例的注释：

> 所有的技能特效，如果能直接 `new`，建议就直接 `new`，提高性能和可读性。工厂效率低且不好调试，工厂更偏向于动态创建技能，而对于编码实现的技能来说，怎么简单怎么来。

```
硬编码技能（你手写的 C# 类）
  → Effects.Add(new MyDamageEffect(this, 100, 0.5))
  ✅ 直接 new：高性能、可调试、可读性好

JSON/配置文件动态创建
  → Factory.OpenFactory.GetInstance<Effect>(1001, "", args)
  ✅ 走工厂：特效 ID → 工厂查找 → 传入参数 Dictionary → 创建实例
```

### 3. 命名空间约定

- 扩展接口实现必须在 `Milimoe.FunGame.Core.Implement` 命名空间下
- Module 类可以放在任意命名空间，通过加载流程发现
- 推荐使用 `Oshima.FunGame.OshimaModules` 这样的独立命名空间

### 4. v3.0 变更说明

v3.0 剥离了网络传输层（Socket/HTTP/WebSocket、`DataRequest` 等）与数据库代码，因此 v2.x 的 `GameModule`/`GameModuleServer`/`Plugin` 体系**已不存在**。核心库只保留数据契约与抽象；客户端↔服务端通信由外部项目自实现，游戏数据外发请使用 [即时外发功能](/dev/outbound)。

---

## 下一步

- 三种实体模组详解 → [实体模组 (EntityModule)](/dev/module-registration)
- 完整示例代码 → [完整示例](/dev/examples)
- 数据外发到专用服务器 → [即时外发功能](/dev/outbound)
