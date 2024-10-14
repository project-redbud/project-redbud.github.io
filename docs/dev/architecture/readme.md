---
title: 架构说明
author: Project Redbud
createTime: 2024/09/29 18:41:20
permalink: /dev/architecture/
prev: /welcome/
next: /dev/config/
---

本文档介绍客户端与服务器的连接、数据交互的底层思想与设计逻辑。

## 通信机制

`FunGame-Server` 项目将构建两个服务器端程序：`FunGameServer` 和 `FunGameWebAPI`。

`FunGameServer` 提供 `Socket` 和 `WebSocket` 的通信服务，但只允许开启其中一种，不能同时开启。

`FunGameWebAPI` 提供 `WebSocket` 和 `RESTful API` 共存的服务，共享数据处理。

### 1. Socket / WebSocket

`FunGame-Desktop` 是 FunGame 项目最初开发的桌面客户端，使用了传统的 `Socket` 进行与 `FunGameServer` 的连接。Socket 通过持久的 TCP 连接，实现了低延迟、高效的数据传输，适合实时交互的游戏逻辑。

- **适用场景**：桌面客户端应用、实时回合对战、低延迟数据同步。
- **特点**：基于 TCP 的长连接，能够保持持续的连接状态，适用于对网络延迟敏感的场景。

为了实现跨平台的兼容性，FunGame 引入了 `WebSocket` 通信模式。WebSocket 是一种轻量、支持双向通信的协议，适合浏览器和移动端应用。

- **FunGameServer 中的 WebSocket**：适用于桌面客户端转向跨平台应用时的通信需求，保证实时数据同步。
- **FunGameWebAPI 中的 WebSocket**：与 `RESTful API` 并行存在，用于实时更新、推送数据和处理快速交互。

随着游戏向多平台扩展，`WebSocket` 将作为首选维护模式。它不仅支持跨平台，还能满足实时通信的需求，尤其在 Web 浏览器和移动设备上有广泛应用。

### 2. RESTful API

RESTful API 是 FunGame 中处理非实时数据交互的核心机制之一。它通过标准的 HTTP 请求与服务器通信，适合需要较高可靠性但实时性要求较低的场景，如用户登录、数据查询和报告生成等。

- **无状态连接**：与 Socket 不同，RESTful API 不维护持续连接，采用无状态的请求响应模式。每次请求都独立于之前的连接。
  
- **基于 JWT 的身份认证**：为了保持客户端与服务器的交互安全，RESTful API 使用 **JWT（JSON Web Token）** 进行身份认证。客户端通过带有有效令牌的 HTTP 请求与服务器通信，并在令牌过期前刷新，从而实现安全且持久的通信。

- **游戏数据的共享和集成**：RESTful API 提供了一些无需认证的公共接口，适合外部应用引用 FunGame 的公开数据。例如，外部应用可以通过这些接口获取游戏的排行榜、物品库存等非敏感信息。

## 数据结构

### 1. `SocketObject` 结构解析

```cs
[Serializable]
public readonly struct SocketObject
{
    public SocketMessageType SocketType { get; } = SocketMessageType.Unknown;  // 消息的类型
    public Guid Token { get; } = Guid.Empty;  // 用于标识客户端的唯一令牌
    public object[] Parameters { get; } = [];  // 动态参数数组，存储不同类型的参数
    public int Length => Parameters.Length;  // 返回参数的长度

    [JsonConstructor]
    public SocketObject(SocketMessageType socketType, Guid token, params object[] parameters)
    {
        SocketType = socketType;
        Token = token;
        if (parameters != null && parameters.Length > 0) Parameters = parameters;
    }
}
```

`SocketObject` 是一个封装了客户端和服务器之间消息结构的类，是 `FunGame` 通信的主要数据结构。它通过 JSON 序列化和反序列化的方式传输数据，并通过 `JsonConstructor` 特性指定 JSON 解析时所使用的构造函数。下面详细解释其各个属性和结构。

#### 属性说明：

- **SocketType (SocketMessageType)**：代表消息的类型，通常用于标识这是哪类操作请求，例如连接请求、数据发送等。默认值为 `Unknown`。
  
- **Token (Guid)**：用来标识当前连接或会话的唯一标识符，用于追踪不同客户端的操作。
  
- **Parameters (object[])**：一个不确定类型的参数数组，允许动态传递不同类型的数据。根据消息类型不同，参数内容可能是客户端的状态、配置、或其他信息。

- **Length**：一个只读属性，返回 `Parameters` 数组的长度。

#### `JsonConstructor` 说明：

- `[JsonConstructor]` 特性告诉 JSON 解析器应该使用带有此特性的构造函数来反序列化 JSON 数据。当接收到 JSON 消息时，解析器会自动映射 JSON 对象的属性到相应的构造函数参数。

#### `SocketMessageType` 枚举：

```cs
public enum SocketMessageType
{
    Unknown,
    DataRequest,
    GamingRequest,
    Connect,
    Disconnect,
    System,
    HeartBeat,
    ForceLogout,
    Chat,
    UpdateRoomMaster,
    MatchRoom,
    StartGame,
    EndGame,
    Gaming
}
```

#### `DataRequestType` 枚举：

当 `SocketMessageType` 为 `DataRequest` 时，请求参数中需要包括 `DataRequestType` 枚举，这是接收双方的约定，用于判断请请求的实际类型。

```cs
public enum DataRequestType
{
    UnKnown,
    RunTime_Logout,
    Main_GetNotice,
    Main_CreateRoom,
    Main_UpdateRoom,
    Main_IntoRoom,
    Main_QuitRoom,
    Main_MatchRoom,
    Main_Chat,
    Main_Ready,
    Main_CancelReady,
    Main_StartGame,
    Reg_Reg,
    Login_Login,
    Login_GetFindPasswordVerifyCode,
    Login_UpdatePassword,
    Room_GetRoomSettings,
    Room_GetRoomPlayerCount,
    Room_UpdateRoomMaster,
    Gaming
}
```

### 2. JSON 解析过程

在 WebSocket 通信中，`SocketObject` 通过 JSON 格式序列化和反序列化进行传输。在客户端和服务器之间传递数据时，系统会将 `SocketObject` 转换为 JSON 字符串。具体步骤如下：

#### **发送过程**：
1. 创建 `SocketObject` 实例，指定 `SocketType`、`Token` 和 `Parameters`。
2. 使用 JSON 序列化工具将 `SocketObject` 转换为 JSON 格式字符串。
3. 通过 WebSocket 将 JSON 字符串发送到另一端。

#### **接收过程**：
1. 接收到 WebSocket 传递过来的 JSON 字符串。
2. 使用 JSON 反序列化工具将 JSON 字符串转换为 `SocketObject` 实例。
3. 验证 `SocketObject` 的 `Token` 是否正确。（Connect 和 HeartBeat 请求不需要验证）
4. 根据 `SocketObject` 的 `SocketType` 和 `Parameters` 执行相应的处理逻辑。

#### 示例 JSON 格式：
```JSON
{
  "socketType": 1,  // 如 SocketMessageType.Connect
  "token": "00000000-0000-0000-0000-000000000000",  // 客户端的 OpenToken，需要 Connect 获取
  "parameters": [
    [
      "param1"
    ], // Connect 需要的参数 1，是一个数组
    true // Connect 需要的参数 2，是一个布尔值
  ]  // 参数数组，包含不同类型的值
}
```

## 连接服务器

::: tip 提示
此部分文档适用于 `Socket` 和 `WebSocket` 模式。
:::

此部分介绍 `FunGameServer` 如何处理客户端发送的连接请求。

### 1. **主要流程**
1. 服务器监听客户端请求。
2. 客户端通过 WebSocket 发送 `SocketObject` 作为请求体。
3. 服务器解析 `SocketObject` 中的参数，判断连接条件是否满足。
4. 返回连接状态：成功或拒绝。

### 2. **请求体**

```JSON
{
  "socketType": 1,
  "token": "00000000-0000-0000-0000-000000000000",
  "parameters": [
    [
      "ModA", "ModB"
    ], // 游戏模组列表
    true // 是否开启开发者模式
  ]
}
```

- `socketType`: 1 表示连接请求。
- `token`: 连接成功后，服务器会返回 `OpenToken`，在这之后客户端每次请求都要附带这个 token，本次是连接服务器，没有 token，因此需要传入 `Guid.Empty`。
- `parameters[0]`: 客户端所安装的游戏模组列表。
- `parameters[1]`: 客户端是否启用开发者模式。

### 3. **连接流程解析**

#### **服务端接收与处理**
服务器通过 `ServerWebSocket` 接收客户端连接请求。代码流程如下：

```cs
Guid token = Guid.NewGuid(); // 服务器会在监听时，为客户端生成一个 OpenToken
socket = await listener.Accept(token);

// 处理客户端请求
while (!objs.Any(o => o.SocketType == SocketMessageType.Connect))
{
    objs = objs.Union(await socket.ReceiveAsync());
}
```

- 服务器首先等待客户端发送 `SocketObject`，并通过 `socket.ReceiveAsync()` 接收数据。
- 只有当 `SocketObject.SocketType` 为 `Connect` 时，服务器才开始处理连接。

#### **连接判断逻辑**
```cs
(isConnected, isDebugMode) = await ConnectController.Connect(
    listener, socket, token, clientip, objs.Where(o => o.SocketType == SocketMessageType.Connect)
);
```

- `ConnectController.Connect()` 负责检查客户端是否满足连接条件，如客户端游戏模组与服务器的兼容性、IP 是否在黑名单中等。

#### **条件判断**
- 如果客户端的模组列表缺少服务器所需模组，则连接被拒绝。
- 如果客户端开启了开发者模式，服务器会记录并显示该信息。

### 4. **返回结果解析**

根据连接判断结果，服务器会返回相应的消息，表明连接是否成功。

#### **成功连接**
```JSON
{
  "socketType": 1,
  "token": "00000000-0000-0000-0000-000000000000",
  "parameters": [
    true, // 连接状态：成功
    "", // 表示无错误信息
    "3fa85f64-5717-4562-b3fc-2c963f66afa6", // 客户端的 OpenToken
    "FunGame Server", // 服务器名称
    "This is a notice." // 服务器公告或通知
  ]
}

```

| **参数**    | **类型**              | **描述**                                               |
|----------------|-----------------------|----------------------------------------------------------|
| Parameters[0] | `bool`    | 指示连接结果，`true` 表示连接成功，`false` 表示失败 |
| Parameters[1] | `string`  | 服务器返回的消息   |
| Parameters[2] | `Guid`   | 客户端的 OpenToken，从下次请求开始，客户端都需要发送用于验证   |
| Parameters[3] | `string`  | 服务器的名称，连接成功时返回    |
| Parameters[4] | `string`  | 服务器的公告信息，连接成功时返回    |

#### **连接拒绝**
```JSON
{
  "socketType": 1,
  "token": "00000000-0000-0000-0000-000000000000",
  "parameters": [
    false, // 连接状态：失败
    "Missing required mods." // 错误信息
  ]
}
```

- `parameters[0]`: `false` 表示连接失败。
- `parameters[1]`: 返回具体的拒绝原因，如缺少服务器所需模组或 IP 被封禁。

### 5. **错误处理**

服务器在处理连接过程中可能会遇到错误，如客户端发送了无效数据或者不符合规范的请求。此时服务器会向客户端返回错误消息并关闭连接。

```cs
await SendRefuseConnect(socket, "服务器已拒绝连接。");
```

## 客户端连接令牌

在 FunGame 中，**OpenToken**（客户端连接令牌，简称 `Token`）在请求体中起着关键的作用，负责确保客户端与服务器之间的合法交互。具体的说明如下：

### 1. **定义**

这是服务器生成并提供给客户端的唯一标识符，验证客户端的操作是否合法。每次与服务器交互时，客户端必须提供正确的 token 以获得服务器的回应。

```cs
// ISocketMessageProcessor 接口
public Guid Token { get; init; }
```

### 2. **获取方式**

1. **Socket/WebSocket 模式下**：
   - 客户端首次连接服务器成功后，返回的 JSON 中便包含这个 token 值，客户端要保存到对应的 `ISocketMessageProcessor` 接口对象中。

2. **RESTful API 模式下**：
   - 客户端通过调用 `/user/login/` 接口进行账号登录，登录成功后服务器会返回 `BearerToken` 和 `OpenToken`。
   - 在 **RESTful API** 模式下，实际的验证机制通过 **JWT（JSON Web Token）** 实现。JWT 更加适合处理跨平台、跨设备的多端兼容性问题。而 `OpenToken` 是作兼容性保留，因为不管是什么模式，都调用相同的后台逻辑。因此，OpenToken 在 RESTful API 中，相当于第二道防线。

> 有关此部分返回体的详细内容，参见 [账号管理 | 登录](/docs/api/user/login/)。

## 数据发送与接收

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

