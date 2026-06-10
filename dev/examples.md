# 完整示例

基于 `Interface/Example.cs` 的接口实现模式。

## 接口实现模式

FunGame.Core 使用**接口驱动**架构。框架定义了接口（`Interface/` 目录），开发者需要在 `Milimoe.FunGame.Core.Implement` 命名空间下创建实现：

```csharp
using Milimoe.FunGame.Core.Interface;

namespace Milimoe.FunGame.Core.Implement
{
    public class IClientImpl : IClient
    {
        public string RemoteServerIP()
        {
            // 连接远程服务器的地址和端口
            string serverIP = "127.0.0.1";
            string serverPort = "22222";
            return serverIP + ":" + serverPort;
        }
    }
}
```

> **注意**：namespace 必须是 `Milimoe.FunGame.Core.Implement`，文件夹位置随意。

## 核心接口一览

| 接口 | 文件 | 用途 |
|---|---|---|
| `IGamingQueue` | `Interface/Base/IGamingQueue.cs` | 回合制队列核心 |
| `IClient` | `Interface/General/IClient.cs` | 客户端配置 |
| `IServer` | `Interface/General/IServer.cs` | 服务端配置 |
| `IEntityConverter` | `Interface/Base/IEntityConverter.cs` | 实体序列化 |
| `ISQLHelper` | `Interface/Base/ISQLHelper.cs` | 数据库操作 |
| `IMailSender` | `Interface/Base/IMailSender.cs` | 邮件发送 |
| `ISocketListener` | `Interface/Base/Sockets/ISocketListener.cs` | 套接字监听 |

## 创建自定义 GamingQueue

```csharp
using Milimoe.FunGame.Core.Model;
using Milimoe.FunGame.Core.Entity;
using Milimoe.FunGame.Core.Interface.Base;

namespace Milimoe.FunGame.Core.Implement
{
    /// <summary>
    /// 自定义游戏模式：Team vs Team
    /// </summary>
    public class TeamGamingQueue : GamingQueue
    {
        public TeamGamingQueue(Action<string> writeLine, bool isDebug = false)
            : base(writeLine, isDebug)
        {
        }

        // 重写队伍判定逻辑
        public override List<Character> GetTeammates(Character character)
        {
            // 自定义：同一 Team 的即为队友
            return AllCharacters
                .Where(c => c != character && c.Team == character.Team)
                .ToList();
        }

        public override List<Character> GetEnemies(Character character)
        {
            // 不在同一 Team 的即为敌人
            return AllCharacters
                .Where(c => c.Team != character.Team)
                .ToList();
        }
    }
}
```

## 调整游戏平衡

通过 `EquilibriumConstant` 定制数值：

```csharp
var eq = new EquilibriumConstant
{
    InitialHP = 100,
    InitialATK = 20,
    MaxLevel = 60,
    CritRate = 0.08,         // 8% 初始暴击
    CritDMG = 1.5,           // 150% 暴击伤害
    SPDUpperLimit = 2000,     // 速度上限提升
};

var queue = new GamingQueue(Console.WriteLine)
{
    GameplayEquilibriumConstant = eq
};
```

## 集成服务端

配合 [FunGame-Server](https://github.com/project-redbud/FunGame-Server)（ASP.NET Core Web API）可以将战斗系统作为服务运行。

```csharp
// 在 ASP.NET Core 中使用
builder.Services.AddSingleton<GamingQueue>(sp =>
{
    var logger = sp.GetRequiredService<ILogger<GamingQueue>>();
    return new GamingQueue(msg => logger.LogInformation(msg))
    {
        GameplayEquilibriumConstant = new EquilibriumConstant()
    };
});
```
