# Module 开发总览

FunGame 框架通过 **Addon（附加组件）** 系统来扩展游戏内容。位于 `Library/Common/Addon/Example/` 的官方示例展示了完整的开发模式。

## Addon 体系

| 类型 | 基类 | 运行位置 | 职责 |
|---|---|---|---|
| `GameModule` | `Library.Common.Addon.GameModule` | 客户端 | 一种游戏模式的客户端逻辑 |
| `GameModuleServer` | `Library.Common.Addon.GameModuleServer` | 服务端 | 对应 GameModule 的服务端逻辑 |
| `GameMap` | `Library.Common.Addon.GameMap` | 通用 | 战棋地图 |
| `CharacterModule` | `Library.Common.Addon.CharacterModule` | 通用 | 角色注册 |
| `SkillModule` | `Library.Common.Addon.SkillModule` | 通用 | 技能 + 特效注册 |
| `ItemModule` | `Library.Common.Addon.ItemModule` | 通用 | 物品注册 |
| `Plugin` | `Library.Common.Addon.Plugin` | 客户端 | 客户端插件 |
| `ServerPlugin` | `Library.Common.Addon.ServerPlugin` | 服务端 | 服务端插件 |

## 核心架构：GameModule + GameModuleServer

一个完整的游戏模式由一对 **客户端模组** 和 **服务端模组** 组成：

```
客户端 (GameModule)                    服务端 (GameModuleServer)
     │                                       │
     │  StartGame()                           │  StartServer()
     │  连接房间                               │  创建 GamingQueue
     │                                       │
     │  ←── GamingType.UpdateInfo ────────── │  推送游戏状态
     │                                       │
     │  ─── GamingType.Connect ──────────→   │  确认连接
     │  ─── GamingType.PickCharacter ────→   │  选择角色
     │  ─── GamingType.Skill ────────────→   │  释放技能
     │                                       │
     │  ←── GamingType.Round ────────────── │  回合结果
     │  ←── GamingType.EndGame ──────────── │  游戏结束
```

## 项目结构

```
MyGameModule.sln
├── ExampleGameModuleConstant    # 常量定义（名称、依赖）
├── ExampleGameModule            # 客户端模组
├── ExampleGameModuleServer      # 服务端模组
├── ExampleGameMap               # 地图
├── ExampleCharacterModule       # 角色模块
├── ExampleSkillModule           # 技能模块（技能 + 特效工厂）
├── ExampleItemModule            # 物品模块
├── ExamplePlugin                # 客户端插件
└── ExampleServerPlugin          # 服务端插件
```

## 常量定义

```csharp
public class ExampleGameModuleConstant
{
    public const string ExampleGameModule = "fungame.example.gamemodule";
    public const string ExampleMap = "fungame.example.gamemap";
    public const string ExampleCharacter = "fungame.example.character";
    public const string ExampleSkill = "fungame.example.skill";
    public const string ExampleItem = "fungame.example.item";

    // GameModuleDepend 声明此模组依赖的子模块
    public static GameModuleDepend GameModuleDepend => new(
        Maps: [ExampleMap],
        Characters: [ExampleCharacter],
        Skills: [ExampleSkill],
        Items: [ExampleItem]
    );
}
```

## 关键设计原则

1. **模组是单例的** — 一个模组类只有一个实例，多个房间共享。使用 `ConcurrentDictionary<string, Worker>` 来隔离每个房间的状态。
2. **客户端主动请求** — 建议永远使用客户端发起请求，而非服务端主动推送（实现难度较低）。
3. **热重载支持** — 需要热重载的模组必须实现 `IHotReloadAware` 接口。
4. **工厂优先于直接 new** — 技能/特效/物品应注册工厂，便于动态创建和 JSON 反序列化。
