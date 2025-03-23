---
title: 数据传输
author: Project Redbud
createTime: 2025/03/23 20:01:20
permalink: /dev/architecture/transmittal/
prev: /dev/architecture/token/
next: /dev/data/socketobject/
---

## 数据传输

无论使用哪种连接模式，对底层数据的处理逻辑始终基于我们深度定制的架构。

### `ISocketMessageProcessor` 接口

#### 1. 定义

```cs
public interface ISocketMessageProcessor
{
    public Type InstanceType { get; }
    public Guid Token { get; }
    public string ClientIP { get; }
    public string ClientName { get; }

    public SocketObject[] Receive();
    public Task<SocketObject[]> ReceiveAsync();
    public SocketResult Send(SocketMessageType type, params object[] objs);
    public Task<SocketResult> SendAsync(SocketMessageType type, params object[] objs);
    public void Close();
    public Task CloseAsync();
}
```

#### 2. 用途

此接口定义的 `套接字消息处理器` 是最底层的一环，它将在服务器中运行，在服务器相关的服务启动监听后，接收并处理客户端发送来的数据。此接口定义了 `客户端连接令牌` 属性和 `接收数据` 方法、`发送数据` 方法以及 `关闭` 连接的方法。

如上文所说，接收和发送数据都以 `SocketObject` 结构体为请求体、回执信息，因此在 `Receive` 方法中，返回 `SocketObject[]` 为接收方获取的数据。
而 `Send` 方法只需要传入请求类型和请求参数即可，实现此接口的类都应该在实际 Send 之前，构造一个 SocketObject 对象。

#### 3. 实现

`FunGame-Core` 中已经基于此接口封装实现了 `ServerSocket` 和 `ServerWebSocket` 类，这两个类是服务器监听到的客户端套接字实例，在服务器上，每个客户端都运行着独立的套接字实例。

::: tip 提示
Web API 的 `RESTful API` 模式也实现了这个接口，因模式的特殊性，它仅仅选择性的实现并作了部分改动，但服务器在处理消息时，调用的逻辑与 Socket 模式相同，具体的实现方法可见 `FunGame-Server` 项目 `WebAPI` 模块的源代码。这里不再赘述，下同。
:::

### `ISocketListener<ISocketMessageProcessor>` 接口

#### 1. 定义

```cs
public interface ISocketListener<T> where T : ISocketMessageProcessor
{
    public string Name { get; }
    public ConcurrentModelList<IServerModel> ClientList { get; }
    public ConcurrentModelList<IServerModel> UserList { get; }
    public List<string> BannedList { get; }

    public void Close();
}
```

#### 2. 用途

`ISocketListener` 接口定义的泛型 `T` 继承自 `ISocketMessageProcessor`，它表示这个套接字监听器只负责构建对应 ISocketMessageProcessor 接口的实现类实例，这种专一职责的设计更好维护和发展。

#### 3. 实现

`FunGame-Core` 中已经基于此接口封装实现了 `SocketListener`（继承自 `ISocketListener<ServerSocket>`）和 `HTTPListener`（继承自 `ISocketListener<ServerWebSocket>`）类。例如，服务器想要监听 `Socket` 的数据，只需要创建 `SocketListener` 类的实例即可。

### `IServerModel` 接口

#### 1. 定义

```cs
public interface IServerModel
{
    public bool Running { get; }
    public ISocketMessageProcessor? Socket { get; }
    public SQLHelper? SQLHelper { get; }
    public MailSender? MailSender { get; }
    public User User { get; }
    public string ClientName { get; }
    public bool IsDebugMode { get; }
    public Room InRoom { get; set; }
    public GameModuleServer? NowGamingServer { get; set; }

    public Task<bool> Send(SocketMessageType type, params object[] objs);
    public void SendSystemMessage(ShowMessageType showtype, string msg, string title, int autoclose, params string[] usernames);
    public string GetClientName();
}
```

#### 2. 用途

此接口映射客户端在服务器上的模型。在 `ISocketListener<>` 接口监听到数据后，服务器需要构建 `ISeverModel` 接口的实现类实例，以对指定的客户端发送消息。

接口定义了客户端的运行状态、对应的套接字消息处理器、SQL服务、邮件服务、客户端当前登录的用户、客户端的名称、是否开启了开发者模式、正在某个房间中、已连接至某个服务器模组等属性。

### `Data Request` 类

此类封装了对于 `SocketMessageType` 为 `DataRequest` 和 `Gaming` 枚举的数据请求方法。此方法相对于直接调用 Socket 的 Send 方法相比更方便和易维护。

#### 示例 1、客户端发送数据请求

```cs
public async Task<Room> CreateRoomAsync(RoomType roomType, string gameModuleServer, string gameMap, bool isRank, int maxUsers, string password = "")
{
    Room room = General.HallInstance;

    try
    {
        CreateRoomRequest.AddRequestData("roomtype", roomType);
        CreateRoomRequest.AddRequestData("gamemoduleserver", gameModuleServer);
        CreateRoomRequest.AddRequestData("gamemap", gameMap);
        CreateRoomRequest.AddRequestData("master", Usercfg.LoginUser);
        CreateRoomRequest.AddRequestData("password", password);
        CreateRoomRequest.AddRequestData("isrank", isRank);
        CreateRoomRequest.AddRequestData("maxusers", maxUsers);
        await CreateRoomRequest.SendRequestAsync();
        if (CreateRoomRequest.Result == RequestResult.Success)
        {
            room = CreateRoomRequest.GetResult<Room>("room") ?? room;
        }
    }
    catch (Exception e)
    {
        Main.GetMessage(e.GetErrorInfo(), TimeType.None);
    }

    return room;
}
```

#### 示例 2、服务器接收并处理请求

```cs
private void CreateRoom(Dictionary<string, object> requestData, Dictionary<string, object> resultData)
{
    Room room = General.HallInstance;

    RoomType type = DataRequest.GetDictionaryJsonObject<RoomType>(requestData, "roomtype");
    string gamemodule = DataRequest.GetDictionaryJsonObject<string>(requestData, "gamemoduleserver") ?? "";
    string gamemap = DataRequest.GetDictionaryJsonObject<string>(requestData, "gamemap") ?? "";
    bool isrank = DataRequest.GetDictionaryJsonObject<bool>(requestData, "isrank");
    ServerHelper.WriteLine(Server.GetClientName() + " -> " + DataRequestSet.GetTypeString(_lastRequest) + " : " + RoomSet.GetTypeString(type) + " (" + string.Join(", ", [gamemodule, gamemap]) + ")", InvokeMessageType.DataRequest);
    if (gamemodule == "" || gamemap == "" || Config.GameModuleLoader is null || !Config.GameModuleLoader.ModuleServers.ContainsKey(gamemodule) || !Config.GameModuleLoader.Maps.ContainsKey(gamemap))
    {
        ServerHelper.WriteLine("缺少对应的模组或地图，无法创建房间。");
        resultData.Add("room", room);
        return;
    }
    User user = DataRequest.GetDictionaryJsonObject<User>(requestData, "master") ?? Factory.GetUser();
    string password = DataRequest.GetDictionaryJsonObject<string>(requestData, "password") ?? "";
    int maxusers = DataRequest.GetDictionaryJsonObject<int>(requestData, "maxusers");

    if (user.Id != 0)
    {
        string roomid;
        while (true)
        {
            // 防止重复
            roomid = Verification.CreateVerifyCode(VerifyCodeType.MixVerifyCode, 7).ToUpper();
            if (Config.RoomList.GetRoom(roomid).Roomid == "-1")
            {
                break;
            }
        }
        if (roomid != "-1" && SQLHelper != null)
        {
            SQLHelper.Execute(RoomQuery.Insert_CreateRoom(roomid, user.Id, type, gamemodule, gamemap, isrank, password, maxusers));
            if (SQLHelper.Result == SQLResult.Success)
            {
                ServerHelper.WriteLine("[CreateRoom] Master: " + user.Username + " RoomID: " + roomid);
                SQLHelper.ExecuteDataSet(RoomQuery.Select_IsExistRoom(roomid));
                if (SQLHelper.Result == SQLResult.Success && SQLHelper.DataSet.Tables[0].Rows.Count > 0)
                {
                    room = Factory.GetRoom(SQLHelper.DataSet.Tables[0].Rows[0], user);
                    Config.RoomList.AddRoom(room);
                }
            }
        }
    }

    resultData.Add("room", room);
}
```

::: tip 提示
客户端和服务器端是全双工通信，因此，双方可以调用相同的逻辑收/发消息。
:::
