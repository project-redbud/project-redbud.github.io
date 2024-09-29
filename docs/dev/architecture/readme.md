---
title: 架构说明
author: Project Redbud
createTime: 2024/09/29 18:41:20
permalink: /dev/architecture/
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


## 连接服务器



##  登录账号



> 参见：[登录文档](/docs/api/user/login)

## 请求身份认证


