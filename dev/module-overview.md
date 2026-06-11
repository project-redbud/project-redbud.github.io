# 模组开发总览

FunGame 通过 **Addon（附加组件）** 系统扩展游戏内容。所有扩展——从角色、技能到完整的游戏模式——都通过 Addon 注册到框架中。

官方示例位于 `Library/Common/Addon/Example/`。

---

## Addon 体系

FunGame 有 **8 种 Addon 类型**，按职责分为三类：

### 游戏模式类

| 类型 | 基类 | 运行位置 | 职责 |
|---|---|---|---|
| `GameModule` | `Library.Common.Addon.GameModule` | 客户端 | 一种游戏模式的客户端逻辑 |
| `GameModuleServer` | `Library.Common.Addon.GameModuleServer` | 服务端 | 同模式的服务端逻辑、创建 GamingQueue |
| `GameMap` | `Library.Common.Addon.GameMap` | 通用 | 战棋地图（网格数据 + 队列事件） |

### 实体注册类（EntityModule）

| 类型 | 基类 | 注册内容 |
|---|---|---|
| `CharacterModule` | `Library.Common.Addon.CharacterModule` | 角色工厂 |
| `SkillModule` | `Library.Common.Addon.SkillModule` | 技能工厂 + 特效工厂 |
| `ItemModule` | `Library.Common.Addon.ItemModule` | 物品工厂 |

### 插件类

| 类型 | 基类 | 运行位置 | 职责 |
|---|---|---|---|
| `Plugin` | `Library.Common.Addon.Plugin` | 客户端 | 拦截/增强现有功能 |
| `ServerPlugin` | `Library.Common.Addon.ServerPlugin` | 服务端 | 服务端拦截/增强（登录验证等） |

---

## 核心架构：GameModule + GameModuleServer

一个完整的游戏模式由**一对客户端和服务端模组**组成。服务端负责驱动游戏逻辑和 GamingQueue，客户端负责 UI 展示和用户交互。

```
客户端 (GameModule)                    服务端 (GameModuleServer)
     │                                       │
     │  StartGame()                           │  StartServer()
     │  连接房间                               │  为每个房间创建 Worker
     │                                       │  创建 GamingQueue
     │                                       │
     │  ←── GamingType.UpdateInfo ────────── │  推送游戏状态/要求确认
     │                                       │
     │  ─── GamingType.Connect ──────────→   │  客户端确认连接 (带 token)
     │  ─── GamingType.PickCharacter ────→   │  选择角色 (传角色 ID)
     │  ─── GamingType.Skill ────────────→   │  选技能/选目标/释放
     │                                       │
     │  ←── GamingType.Round ────────────── │  回合执行结果
     │  ←── GamingType.EndGame ──────────── │  游戏结束 + 统计数据
```

## 加载流程

框架启动时按固定顺序加载所有 Addon：

```
① 扫描 DLL 目录（modules/ maps/ plugins/）
    │
② 加载 GameMap（地图数据）
    │
③ 加载实体模组 → 注册工厂
    ├── CharacterModule  → Factory.OpenFactory 注册角色工厂
    ├── SkillModule      → 注册技能工厂 + 特效工厂
    └── ItemModule       → 注册物品工厂
    │
④ 加载 GameModule / GameModuleServer
    ├── GameModuleDepend.GetDependencies()  自动填充依赖
    ├── module.Load()                       触发实体模组加载
    └── module.AfterLoad()                  模组初始化回调
    │
⑤ 加载 Plugin / ServerPlugin
```

> 顺序很重要：地图和实体模组必须在 GameModule 之前加载，GameModule 的 `GameModuleDepend` 依赖声明指向的模组名必须与已加载的模组名称匹配。

---

## 项目结构

一个典型的 Module 解决方案：

```
MyGameModule.sln
│
├── MyCore/                     # 常量定义项目
│   └── Constant.cs             # 模组名称、依赖声明
│
├── MyModules/                  # 实体 + 游戏逻辑
│   ├── Characters/             # 角色类（继承 Character）
│   ├── Skills/                 # 技能类（继承 Skill）
│   │   ├── 战技/
│   │   ├── 魔法/
│   │   └── 爆发技/
│   ├── Effects/                # 特效类（继承 Effect）
│   │   ├── SkillEffects/       # 技能释放特效
│   │   ├── PassiveEffects/     # 被动状态特效
│   │   └── ItemEffects/        # 物品使用特效
│   ├── Items/                  # 物品类（继承 Item）
│   ├── Modules/                # 实体模组类（注册工厂）
│   │   ├── CharacterModule.cs
│   │   ├── SkillModule.cs
│   │   └── ItemModule.cs
│   ├── ExampleGameModule.cs    # 客户端游戏模式
│   ├── ExampleGameModuleServer.cs  # 服务端游戏模式
│   └── ExampleGameMap.cs       # 地图
│
├── MyPlugin/                   # 客户端插件
└── MyServerPlugin/             # 服务端插件
```

---

## 常量定义

所有模组的名称在常量类中统一定义，供 `GameModuleDepend` 和框架查找使用：

```csharp
public class ExampleGameModuleConstant
{
    public const string ExampleGameModule = "fungame.example.gamemodule";
    public const string ExampleMap        = "fungame.example.gamemap";
    public const string ExampleCharacter  = "fungame.example.character";
    public const string ExampleSkill      = "fungame.example.skill";
    public const string ExampleItem       = "fungame.example.item";

    // 声明此模组依赖的子模组（框架自动从 loader 填充实例）
    public static GameModuleDepend GameModuleDepend => new(
        Maps:       [ExampleMap],
        Characters: [ExampleCharacter],
        Skills:     [ExampleSkill],
        Items:      [ExampleItem]
    );
}
```

---

## 关键设计原则

### 1. 模组是单例的

一个模组类在进程内只有一个实例。多个房间共享同一个模组实例。

> ⚠️ **必须用 `ConcurrentDictionary<string, Worker>` 隔离不同房间的状态。** 不能把房间级别的数据放在模组的实例字段上。

```csharp
// ✅ 正确：每个房间一个 Worker，用 ConcurrentDictionary 隔离
private ConcurrentDictionary<string, ModuleServerWorker> Workers { get; } = [];

public override bool StartServer(GamingObject obj, params object[] args)
{
    Workers[obj.Room.Roomid] = new ModuleServerWorker(obj);
    // ...
}
```

### 2. 客户端主动请求优于服务端推送

在客户端-服务端通信中，**建议永远使用客户端发起请求的模式**（如 `DataRequest`），而非服务端单向推送。客户端发请求的实现难度更低，更易调试。

### 3. 热重载需实现 `IHotReloadAware`

只有实现了 `IHotReloadAware` 接口的模组才会被热重载模式识别。`OnBeforeUnload()` 在卸载前被调用，应在此清理网络连接、清空缓存等。

### 4. 硬编码直接 new，动态创建走工厂

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

两者的区分：**工厂的价值在于根据运行时传入的 ID 和参数决定创建哪个类**。编码时你已经知道要创建哪个类，直接 new 即可。

### 5. 命名空间约定

- 扩展接口实现必须在 `Milimoe.FunGame.Core.Implement` 命名空间下
- Module 类可以放在任意命名空间，通过 DLL 扫描发现
- 推荐使用 `Oshima.FunGame.OshimaModules` 这样的独立命名空间

### 6. `StartServer` 必须立即返回

`GameModuleServer.StartServer()` 被调用后**必须立即返回**。需要持续执行的逻辑应通过 `TaskUtility.NewTask()` 启动新线程或 `Task`：

```csharp
public override bool StartServer(GamingObject obj, params object[] args)
{
    Workers[obj.Room.Roomid] = new ModuleServerWorker(obj);

    // 启动新线程执行游戏逻辑——此方法必须立即返回
    TaskUtility.NewTask(async () => await GameLoop(obj, worker))
        .OnError(Controller.Error);

    return true;
}
```
