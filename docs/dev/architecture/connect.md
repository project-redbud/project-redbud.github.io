---
title: 连接服务器
author: Project Redbud
createTime: 2025/03/23 20:01:20
permalink: /dev/architecture/connect/
prev: /dev/architecture/
next: /dev/architecture/token/
---

本介绍 `FunGameServer` 如何处理客户端发送的连接请求。

::: tip 提示
本文档适用于 `Socket` 和 `WebSocket` 模式。
:::

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
    ],
    true
  ]
}
```

- `socketType`: 1 表示连接请求。
- `token`: 连接成功后，服务器会返回 `OpenToken`，在这之后客户端每次请求都要附带这个 token，本次是连接服务器，没有 token，因此需要传入 `Guid.Empty`。

- 在 [服务器配置文件](/dev/conifg/) 中，如果 `[Server]` 节点内的 `UseDesktopParameters` 项设置为 `true`，那么 `parameters` 需要提供两个参数：
1. `parameters[0]`: 客户端所安装的游戏模组列表。
2. `parameters[1]`: 客户端是否启用开发者模式。

### 3. **连接流程解析**

#### **服务端接收与处理**

- 服务器只有在接收到服务器发送的 `SocketObject.SocketType` 为 `Connect` 时，服务器才开始处理连接。

- 服务器将检查客户端是否满足连接条件，如客户端游戏模组与服务器的兼容性、IP 是否在黑名单中等。

#### **条件判断**

- 如果客户端的模组列表缺少服务器所需模组，则连接被拒绝。
- 如果客户端开启了开发者模式，服务器会记录并显示该信息。
- 如果客户端的 IP 在服务器的黑名单中，则连接被拒绝。

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
