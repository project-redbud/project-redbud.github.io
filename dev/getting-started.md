# 快速开始

## 安装

通过 NuGet 安装：

```bash
dotnet add package FunGame.Core
```

或在 [Release 页面](https://github.com/project-redbud/FunGame-Core/releases) 下载 DLL。

## 基本概念

FunGame.Core 是一个**回合制游戏框架库**，提供：

- `GamingQueue` — 回合制队列引擎（核心）
- `Character` — 角色实体
- `Skill` / `Effect` — 技能与特效系统
- `EquilibriumConstant` — 游戏平衡常数配置
- `IGamingQueue` — 队列接口（可自定义实现）

## 第一个回合

要使用框架，需要实现 `IGamingQueue` 接口，或直接继承 `GamingQueue` 基类。框架通过 **接口驱动** 设计，开发者实现接口来控制游戏行为。

继承 `GamingQueue` 是最简单的方式：

```csharp
using Milimoe.FunGame.Core.Model;
using Milimoe.FunGame.Core.Entity;

// 1. 创建游戏队列
var queue = new GamingQueue(
    writeLine: Console.WriteLine,  // 日志输出
    isDebug: true
);

// 2. 创建角色
var player = Character.Factory.Get();
player.Name = "玩家1";
player.Level = 1;

var enemy = Character.Factory.Get();
enemy.Name = "敌人";
enemy.Level = 1;

// 3. 加入队列
queue.AddCharacter(player);
queue.AddCharacter(enemy);

// 4. 开始游戏
queue.StartGame();
```

## 下一步

- 学习如何 [自定义角色](/dev/custom-character)
- 学习如何 [自定义技能](/dev/custom-skill)
- 查看 [完整示例](/dev/examples)
