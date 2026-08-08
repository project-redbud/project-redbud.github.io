# 完整示例

基于官方示例 `Library/Module/Example/ExampleGameModule.cs`（`ExampleSkill.cs`、`ExampleItem.cs`）。

## 创建自定义游戏模式

### 混战模式（Mix）

```csharp
using FunGame.Core.Entity;
using FunGame.Core.Model.Framework;
using FunGame.Core.Model.Queue;

// 准备角色列表（角色通过继承 Character 定义，见《自定义角色》）
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
using FunGame.Core.Entity;
using FunGame.Core.Model.Framework;
using FunGame.Core.Model.Queue;

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

默认的队友判定基于召唤物（`Master`）关系；团队模式基于队伍。如需自定义规则，重写 `GetTeammates`（`GetEnemies` 内部会调用它）：

```csharp
public class MyGameMode : GamingQueue
{
    public MyGameMode(Action<string> writer) : base(writer) { }

    // 重写队友判定逻辑（例如：与角色同 Master 的角色视为队友）
    public override List<Character> GetTeammates(Character character)
        => AllCharacters
            .Where(c => c != character && IsSameFactionAs(c, character))
            .ToList();
}
```

---

## 完整的游戏循环

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

> 手动控制（玩家决策）需把事件绑定到 UI，见 [事件绑定与游戏循环](/dev/events-game-loop)。

---

## 调整游戏平衡

通过 `EquilibriumConstant` 定制数值（`FunGame.Core.Model.Framework`）：

```csharp
var eq = new EquilibriumConstant
{
    InitialHP = 100,
    InitialATK = 20,
    InitialDEF = 8,
    MaxLevel = 60,
    CritRate = 0.08,          // 8% 初始暴击
    CritDMG = 1.5,            // 150% 暴击伤害
    SPDUpperLimit = 2000,     // 速度上限
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
// GamingQueue 自动记录了所有统计数据（CharacterStatistics）
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

---

## 即时外发

游戏过程中的数据可以实时外发到专用服务器（观战/回放）：

```csharp
using FunGame.Core.Api;
using FunGame.Core.Model.Queue;

DefaultRoundRecordSink sink = new("https://example.com/api/round",
[
    RoundRecordSinkEventIds.Action,
    RoundRecordSinkEventIds.Round,
    RoundRecordSinkEventIds.CheckpointRound,
    RoundRecordSinkEventIds.CharacterStatistics,
    RoundRecordSinkEventIds.Characters,
    RoundRecordSinkEventIds.QueueData,
    RoundRecordSinkEventIds.EliminatedCharacters,
]);

MixGamingQueue queue = new(characters, Console.WriteLine)
{
    GameplayEquilibriumConstant = eq,
    RoundRecordSink = sink
};
```

详见 [即时外发功能](/dev/outbound)。

---

## 下一步

- 自定义角色 → [自定义角色](/dev/custom-character)
- 模组化你的实体 → [模组开发总览](/dev/module-overview)
- 事件驱动与 UI 交互 → [GamingQueue 事件模式](/dev/events-overview)
