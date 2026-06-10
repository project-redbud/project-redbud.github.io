# 客户端模组 (GameModule)

客户端模组继承 `GameModule`，负责客户端的游戏逻辑。

## 基本模板

```csharp
public class ExampleGameModule : GameModule, IGamingUpdateInfoEvent
{
    public override string Name => ExampleGameModuleConstant.ExampleGameModule;
    public override string Description => "My First GameModule";
    public override string Version => "1.0.0";
    public override string Author => "FunGamer";

    // 默认地图（取第一个依赖的地图）
    public override string DefaultMap =>
        GameModuleDepend.MapsDepend.Length > 0
            ? GameModuleDepend.MapsDepend[0]
            : "";

    // 依赖声明
    public override GameModuleDepend GameModuleDepend =>
        ExampleGameModuleConstant.GameModuleDepend;

    // 房间类型
    public override RoomType RoomType => RoomType.Mix;
    public override int MaxUsers => 8;

    public ExampleGameModule()
    {
        // 指定对应的服务端模组名称（默认与客户端模组同名）
        IsConnectToOtherServerModule = true;
        AssociatedServerModuleName = ExampleGameModuleConstant.ExampleGameModule;
    }
}
```

## 核心方法

### StartGame — 游戏开始

```csharp
protected Gaming? Instance;

public override void StartGame(Gaming instance, params object[] args)
{
    Instance = instance;
    GamingEventArgs eventArgs = instance.EventArgs;
    room = eventArgs.Room;
    users = eventArgs.Users;
    // 等待服务端消息，进一步处理...
}
```

### 事件处理 — 接收服务端消息

通过实现事件接口来响应服务端推送：

```csharp
// 实现 IGamingUpdateInfoEvent 接收更新消息
public void GamingUpdateInfoEvent(object sender, GamingEventArgs e,
    Dictionary<string, object> data)
{
    if (data.ContainsKey("showmessage"))
    {
        // 显示服务端发来的文本
        string msg = DataRequest.GetDictionaryJsonObject<string>(data, "msg") ?? "";
        Controller.WriteLine(msg);
    }

    if (data.ContainsKey("info_type"))
    {
        string info_type = DataRequest.GetDictionaryJsonObject<string>(data, "info_type") ?? "";
        if (info_type == "check")
        {
            // 服务端要求确认连接
            Guid token = DataRequest.GetDictionaryJsonObject<Guid>(data, "connect_token");
            DataRequest request = Controller.NewDataRequest(GamingType.Connect);
            request.AddRequestData("username", ((Gaming)sender).CurrentUser.Username);
            request.AddRequestData("connect_token", token);
            if (request.SendRequest() == RequestResult.Success)
            {
                string msg = request.GetResult<string>("msg") ?? "";
                Controller.WriteLine(msg);
            }
            request.Dispose();
        }
    }
}
```

## 关键属性

| 属性 | 说明 |
|---|---|
| `Name` | 模组唯一名称 |
| `DefaultMap` | 默认地图名称 |
| `GameModuleDepend` | 依赖的子模块声明 |
| `RoomType` | 房间类型（Mix/Team等） |
| `MaxUsers` | 最大玩家数 |
| `IsConnectToOtherServerModule` | 是否连接外部服务端模组 |
| `AssociatedServerModuleName` | 关联的服务端模组名 |
