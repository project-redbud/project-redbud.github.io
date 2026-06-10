# 插件系统 (Plugin)

Plugin 是客户端/服务端的轻量扩展。与 GameModule 不同，Plugin 不创建游戏模式，而是对现有功能进行增强。

## 客户端插件

```csharp
public class ExamplePlugin : Plugin, IConnectEvent
{
    public override string Name => "fungame.example.plugin";
    public override string Description => "My First Plugin";
    public override string Version => "1.0.0";
    public override string Author => "FunGamer";

    // 实现事件接口
    public void AfterConnectEvent(object sender, ConnectEventArgs e)
    {
        // 连接服务器后执行...
    }

    public void BeforeConnectEvent(object sender, ConnectEventArgs e)
    {
        // 与服务器插件联动
        DataRequest request = Controller.NewDataRequest(
            targetAddon: "fungame.example.serverplugin");
        long tick = DateTime.Now.Ticks;
        request.AddRequestData("event", "ping");
        request.AddRequestData("tick", tick);
        request.SendRequest();

        if (request.Result == RequestResult.Success)
        {
            long newTick = request.GetResult<long>("tick");
            long latency = Math.Min(999,
                new TimeSpan(newTick - tick).TotalMilliseconds);
            Controller.WriteLine($"服务器延迟：{latency}ms");
        }
    }
}
```

---

## 服务端插件

```csharp
public class ExampleServerPlugin : ServerPlugin, ILoginEvent
{
    public override string Name => "fungame.example.serverplugin";
    public override string Description => "My First Server Plugin";
    public override string Version => "1.0.0";
    public override string Author => "FunGamer";

    // 控制台命令
    public override void ProcessInput(string order, string[] args)
    {
        if (order.Equals("info", StringComparison.CurrentCultureIgnoreCase))
        {
            Controller.WriteLine($"This is {nameof(ExampleServerPlugin)}!!");
        }
    }

    // 处理客户端数据请求
    public override Dictionary<string, object> HandleDataRequest(
        Dictionary<string, object> data, AddonDataRequestEventArgs e)
    {
        // 只处理发给自己的请求
        if (e.From == "fungame.example.plugin" && e.Target == Name)
        {
            string ent = NetworkUtility.JsonDeserializeFromDictionary<string>(
                data, "event") ?? "";
            if (ent == "ping")
            {
                return new() { { "tick", DateTime.Now.Ticks } };
            }
        }
        return [];
    }

    // 登录事件介入
    public void BeforeLoginEvent(object sender, LoginEventArgs e)
    {
        // 可取消登录以加入自定义验证
        if (Controller.SQLHelper != null)
        {
            DataRow? row = Controller.SQLHelper.ExecuteDataRow(
                UserQuery.Select_UserByUsername(Controller.SQLHelper, e.Username));
            if (row is null)
            {
                e.Cancel = true;
                e.EventMsg = "用户名不存在。";
            }
        }
    }

    public void AfterLoginEvent(object sender, LoginEventArgs e) { }
}
```

---

## Plugin vs GameModule

| 维度 | Plugin | GameModule |
|---|---|---|
| 作用 | 增强/拦截现有功能 | 创建新的游戏模式 |
| 运行 | 全局（所有房间） | 按房间实例化 |
| 例子 | 登录验证、延迟测试 | 回合制对战、卡牌游戏 |
| 复杂度 | 轻量 | 完整游戏逻辑 |
