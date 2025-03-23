---
title: SocketObject
author: Project Redbud
createTime: 2025/03/23 20:01:20
permalink: /dev/data/socketobject/
prev: /dev/architecture/transmittal/
next: /dev/data/payload/
---

本介绍 `FunGameServer` 或 `FunGame Web API` 中使用的数据传输结构之 `SocketObject`。

## 数据结构

```cs
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
        Parameters = parameters;
    }
}
```

`SocketObject` 是一个封装了客户端和服务器之间消息结构的类，是 `FunGame` 通信的主要数据结构。它通过 JSON 序列化和反序列化的方式传输数据，并通过 `JsonConstructor` 特性指定 JSON 解析时所使用的构造函数。下面详细解释其各个属性和结构。

## 属性说明

- **SocketType (SocketMessageType)**：代表消息的类型，通常用于标识这是哪类操作请求，例如连接请求、数据发送等。默认值为 `Unknown`。
  
- **Token (Guid)**：用来标识当前连接或会话的唯一标识符，用于追踪不同客户端的操作。
  
- **Parameters (object[])**：一个不确定类型的参数数组，允许动态传递不同类型的数据。根据消息类型不同，参数内容可能是客户端的状态、配置、或其他信息。

- **Length**：一个只读属性，返回 `Parameters` 数组的长度。

### `JsonConstructor` 说明

- `[JsonConstructor]` 特性告诉 JSON 解析器应该使用带有此特性的构造函数来反序列化 JSON 数据。当接收到 JSON 消息时，解析器会自动映射 JSON 对象的属性到相应的构造函数参数。

### `SocketMessageType` 枚举

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

### `DataRequestType` 枚举：

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

## JSON 解析过程

在 WebSocket 通信中，`SocketObject` 通过 JSON 格式序列化和反序列化进行传输。在客户端和服务器之间传递数据时，系统会将 `SocketObject` 转换为 JSON 字符串。具体步骤如下：

### 发送过程：

1. 创建 `SocketObject` 实例，指定 `SocketType`、`Token` 和 `Parameters`。
2. 使用 JSON 序列化工具将 `SocketObject` 转换为 JSON 格式字符串。
3. 通过 WebSocket 将 JSON 字符串发送到另一端。

### 接收过程：

1. 接收到 WebSocket 传递过来的 JSON 字符串。
2. 使用 JSON 反序列化工具将 JSON 字符串转换为 `SocketObject` 实例。
3. 验证 `SocketObject` 的 `Token` 是否正确。（Connect 和 HeartBeat 请求不需要验证）
4. 根据 `SocketObject` 的 `SocketType` 和 `Parameters` 执行相应的处理逻辑。

### 示例 JSON 格式：

```JSON
{
  "socketType": 1,
  "token": "00000000-0000-0000-0000-000000000000",  // 客户端的 OpenToken，需要 Connect 获取
  "parameters": [
    [
      "param1"
    ],
    true
  ]
}
```

socketType 是一个整数，表示消息的类型（`SocketMessageType` 枚举），如 `Connect`、`DataRequest` 等。

parameters 说明：

- parameters[0] Connect 需要的参数 1，是一个数组
- parameters[1] Connect 需要的参数 2，是一个布尔值
