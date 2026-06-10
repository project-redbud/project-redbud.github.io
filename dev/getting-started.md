# 快速开始

## 安装

通过 NuGet 安装：

```bash
dotnet add package FunGame.Core
```

## 基本概念

FunGame.Core 是一个**回合制游戏框架库**，提供：

- `GamingQueue` / `MixGamingQueue` / `TeamGamingQueue` — 回合制队列引擎（核心）
- `Character` — 角色实体
- `Skill` / `Effect` — 技能与特效系统
- `EquilibriumConstant` — 游戏平衡常数配置
- `IGamingQueue` — 队列接口（可自定义实现）

## 第一个回合

框架通过 **接口驱动** 设计，最直接的方式是使用 `MixGamingQueue` 或 `TeamGamingQueue`：

```csharp
using Milimoe.FunGame.Core.Model;
using Milimoe.FunGame.Core.Entity;
using Milimoe.FunGame.Core.Api.Utility;

// 1. 创建角色
// 角色通过继承 Character 类来定义（见下一章），这里用工厂创建
Character player = Factory.GetCharacter();
player.Name = "玩家1";
player.NickName = "勇者";
player.InitialHP = 80;
player.InitialATK = 20;
player.InitialSPD = 120;

Character enemy = Factory.GetCharacter();
enemy.Name = "敌人";
enemy.NickName = "魔王";
enemy.InitialHP = 100;
enemy.InitialATK = 15;
enemy.InitialSPD = 100;

// 2. 创建混战模式队列
List<Character> characters = [player, enemy];
MixGamingQueue queue = new(characters, Console.WriteLine)
{
    GameplayEquilibriumConstant = new EquilibriumConstant() // 可选：自定义平衡常数
};

// 3. 加载地图（可选），初始化队列
// queue.LoadGameMap(myMap);
queue.InitActionQueue();

// 4. 设置 AI 控制（自动化战斗）
queue.SetCharactersToAIControl(cancel: false, characters);

// 5. 游戏循环
int round = 0;
while (round < 100)
{
    Character? actor = queue.NextCharacter();
    if (actor != null)
    {
        Console.WriteLine($"=== 回合 {++round} ===");
        Console.WriteLine($"现在是 [ {actor} ] 的回合！");

        bool isGameEnd = queue.ProcessTurn(actor);
        if (isGameEnd) break;

        queue.DisplayQueue();
    }
    queue.TimeLapse();
}

Console.WriteLine("--- 游戏结束 ---");
```

## 手动控制（玩家决策）

如果不想全 AI，可以让特定角色由玩家控制：

```csharp
// 全部 AI
queue.SetCharactersToAIControl(cancel: false, characters);

// 取消 player 的 AI，改为事件驱动
queue.SetCharactersToAIControl(cancel: true, player);

// 绑定选择事件
queue.SelectSkillEvent += (queue, character, skills) =>
{
    // 在这里弹出 UI 让玩家选技能
    return skills.FirstOrDefault();
};
```

## 下一步

- 学习如何 [自定义角色](/dev/custom-character)
- 学习如何 [自定义技能](/dev/custom-skill)
- 查看 [完整示例](/dev/examples)
- 了解 [GamingQueue 事件模式](/dev/events-overview)
