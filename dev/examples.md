# 完整示例

基于 `Library/Common/Addon/Example/ExampleGameModule.cs` 官方示例。

## 接口实现模式

FunGame.Core 使用**接口驱动**架构。框架定义了接口，开发者需要在 `Milimoe.FunGame.Core.Implement` 命名空间下创建实现：

```csharp
using Milimoe.FunGame.Core.Interface;

namespace Milimoe.FunGame.Core.Implement
{
    public class IClientImpl : IClient
    {
        public string RemoteServerIP()
        {
            string serverIP = "127.0.0.1";
            string serverPort = "22222";
            return serverIP + ":" + serverPort;
        }
    }
}
```

> **注意**：namespace 必须是 `Milimoe.FunGame.Core.Implement`，文件夹位置随意。

---

## 核心接口一览

| 接口 | 用途 |
|---|---|
| `IGamingQueue` | 回合制队列核心 |
| `IClient` | 客户端配置 |
| `IServer` | 服务端配置 |
| `ISQLHelper` | 数据库操作 |
| `IMailSender` | 邮件发送 |

---

## 创建自定义游戏模式

### 混战模式（Mix）

```csharp
using Milimoe.FunGame.Core.Model;
using Milimoe.FunGame.Core.Entity;
using Milimoe.FunGame.Core.Api.Utility;

// 准备角色列表
List<Character> characters = [player, enemy1, enemy2, enemy3];

// 创建混战队列
MixGamingQueue queue = new(characters, Console.WriteLine)
{
    GameplayEquilibriumConstant = new EquilibriumConstant(),
    IsDebug = true
};

// 加载地图（可选）
// queue.LoadGameMap(myMap);

// 初始化
queue.InitActionQueue();
queue.SetCharactersToAIControl(cancel: false, characters);
```

### 团队模式（Team）

```csharp
using Milimoe.FunGame.Core.Model;

// 创建团队队列
TeamGamingQueue queue = new(Console.WriteLine)
{
    GameplayEquilibriumConstant = new EquilibriumConstant()
};

// 添加团队
queue.AddTeam("红队", [player1, player2, player3]);
queue.AddTeam("蓝队", [enemy1, enemy2, enemy3]);

// 初始化角色
queue.InitCharacters(allCharacters);
queue.InitActionQueue();
```

### 自定义继承

```csharp
public class MyTeamQueue : TeamGamingQueue
{
    public MyTeamQueue(Action<string> writer) : base(writer) { }

    // 重写队伍判定逻辑
    public override List<Character> GetTeammates(Character character)
    {
        return AllCharacters
            .Where(c => c != character && c.Team == character.Team)
            .ToList();
    }

    public override List<Character> GetEnemies(Character character)
    {
        return AllCharacters
            .Where(c => c.Team != character.Team)
            .ToList();
    }
}
```

---

## 完整的游戏循环

来自 `GameMapTesting` WPF Demo：

```csharp
double totalTime = 0;
int round = 1;

while (round < 999)
{
    // 获取下一个可行动的角色（硬直时间归零）
    Character? actor = queue.NextCharacter();

    if (actor != null)
    {
        Console.WriteLine($"=== 回合 {round++} ===");

        // ProcessTurn 内部会触发所有事件
        bool isGameEnd = queue.ProcessTurn(actor);
        if (isGameEnd) break;

        queue.DisplayQueue();
    }

    // 时间流逝 → 硬直时间衰退
    totalTime += queue.TimeLapse();
}

Console.WriteLine($"总游戏时长：{totalTime:0.##}");
```

---

## 调整游戏平衡

通过 `EquilibriumConstant` 定制数值。所有可配置项见 `Library/Constant` 中的 `EquilibriumConstant` 类：

```csharp
var eq = new EquilibriumConstant
{
    InitialHP = 100,
    InitialATK = 20,
    InitialDEF = 8,
    MaxLevel = 60,
    CritRate = 0.08,          // 8% 初始暴击
    CritDMG = 1.5,            // 150% 暴击伤害
    SPDUpperLimit = 2000,      // 速度上限
    MaxEP = 200,              // 最大爆发能量
    InGameCurrency = "金币",
    InGameTime = "秒",
};

var queue = new MixGamingQueue(characters, Console.WriteLine)
{
    GameplayEquilibriumConstant = eq
};
```

---

## 赛后统计

```csharp
// GamingQueue 自动记录了所有统计数据
foreach (Character character in queue.CharacterStatistics
    .OrderByDescending(d => d.Value.Rating).Select(d => d.Key))
{
    CharacterStatistics stats = queue.CharacterStatistics[character];
    Console.WriteLine($"[ {character} ]");
    Console.WriteLine($"技术得分：{stats.Rating:0.0#}");
    Console.WriteLine($"击杀：{stats.Kills} / 助攻：{stats.Assists}");
    Console.WriteLine($"总计伤害：{stats.TotalDamage:0.##}");
    Console.WriteLine($"每秒伤害：{stats.DamagePerSecond:0.##}");
}
```
