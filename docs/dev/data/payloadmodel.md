---
title: PayloadModel
author: Project Redbud
createTime: 2025/03/23 20:26:26
permalink: /dev/data/payload/
prev: /dev/data/socketobject/
next: /welcome/
---

`PayloadModel` 是 RESTful API 中通用的响应数据结构，用于封装请求类型、状态码、消息和业务数据。

## 概述

`PayloadModel` 是一个泛型数据结构，仅在 FunGame WebAPI（RESTful API）中使用，用于标准化 API 的响应格式。它通过 JSON 格式传输，支持不同的请求类型（由枚举 `T` 定义，如 `DataRequestType` 或 `GamingType`），并提供状态码、消息和业务数据的字段，便于客户端解析和处理响应。客户端在发送请求时，仅需提供 `RequestType` 和 `Data`，而 `Timestamp`、`Message` 和 `StatusCode` 由服务器端生成。

## 数据结构

```cs
public class PayloadModel<T> where T : struct, Enum
{
    /// <summary>
    /// 请求类型
    /// </summary>
    public T RequestType { get; set; } = default;

    /// <summary>
    /// 状态码
    /// </summary>
    public int StatusCode { get; set; } = 200;

    /// <summary>
    /// 处理结果
    /// </summary>
    public string Message { get; set; } = "";

    /// <summary>
    /// 响应时间
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.Now;

    /// <summary>
    /// 业务数据
    /// </summary>
    public Dictionary<string, object> Data { get; set; } = [];
}
```

### 属性说明

| 属性名       | 类型                  | 描述                              | 默认值           | 示例值                       | 客户端提供 |
|--------------|-----------------------|-----------------------------------|------------------|------------------------------|------------|
| `RequestType`| `T` (枚举)           | 请求的类型，用于标识具体操作      | `default(T)`    | `RunTime_Logout` (序列化为 1) | 是         |
| `StatusCode` | `int`                | HTTP 状态码，表示请求处理结果     | `200`           | `200`                       | 否         |
| `Message`    | `string`             | 处理结果的描述信息                | `""`            | `"你已成功退出登录！"`      | 否         |
| `Timestamp`  | `DateTime`           | 响应生成的时间戳                  | `DateTime.Now`  | `"2025-03-23 20:26:26"`    | 否         |
| `Data`       | `Dictionary<string, object>` | 业务数据，键值对形式存储附加信息 | `[]` (空字典)   | `{"success": true}`         | 是         |

#### 类型约束

- `T` 是一个枚举类型（`struct, Enum`），如 `DataRequestType` 枚举，表示具体的请求类型。
- 在 JSON 序列化时，枚举值将被转换为对应的整数值（从 0 开始计数）。

#### `DataRequestType` 枚举

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

## JSON 格式

客户端在使用 `PayloadModel` 发送请求时，仅需提供 `RequestType` 和 `Data` 字段。`Timestamp`、`Message` 和 `StatusCode` 由服务器端填充。

### JSON 示例

#### 请求示例
```json
{
  "RequestType": 1,
  "Data": {
    "someKey": "someValue"
  }
}
```

#### 成功响应

```json
{
  "RequestType": 1,
  "StatusCode": 200,
  "Message": "你已成功退出登录！",
  "Timestamp": "2025-03-23 20:26:26.123",
  "Data": {}
}
```

#### 失败响应

```json
{
  "RequestType": 13,
  "StatusCode": 401,
  "Message": "用户名或密码不正确。",
  "Timestamp": "2025-03-23 20:34:31.345",
  "Data": {}
}
```

#### 带业务数据的响应

```json
{
  "RequestType": 13,
  "StatusCode": 200,
  "Message": "登录成功！",
  "Timestamp": "2025-03-23 20:26:26.123",
  "Data": {
    "bearerToken": "eyJhbGciOiJIUzI1NiIs...",
    "openToken": "abcd1234-efgh-5678-ijkl-9012mnop"
  }
}
```

## 使用场景

- **客户端请求**：客户端发送 `PayloadModel` 请求时，仅需指定 `RequestType` 和 `Data`，用于向服务器发送特定操作请求。
- **服务器响应**：服务器返回完整的 `PayloadModel`，提供请求处理结果和附加数据。
- **错误处理**：通过 `StatusCode` 和 `Message` 提供错误信息，客户端可据此判断请求是否成功。
- **数据传输**：`Data` 字段支持动态键值对，适用于传递不同类型的业务数据。

## 注意事项

- **`RequestType`**：客户端应根据接口文档确认对应的 `RequestType` 值，以便正确解析响应。
- **`Timestamp`**：服务器通常返回 `yyyy-MM-dd HH:mm:ss.fff`，建议客户端按此格式处理。
- **`Data`**：`Data` 字段可能为空字典，客户端需检查其内容是否存在并正确解析。
