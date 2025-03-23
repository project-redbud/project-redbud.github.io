---
title: 客户端令牌
author: Project Redbud
createTime: 2025/03/23 20:01:20
permalink: /dev/architecture/token/
prev: /dev/architecture/connect/
next: /dev/architecture/transmittal/
---

本介绍 `FunGameServer` 或 `FunGame Web API` 中使用的客户端令牌的定义、获取方式、验证机制等。

## OpenToken

在 FunGame 中，**OpenToken**（客户端令牌，简称 `Token`）在请求体中起着关键的作用，负责确保客户端与服务器之间的合法交互。具体的说明如下：

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

::: tip 提示
在 RESTful API 模式下， `OpenToken` 是作兼容性保留，只有调用 `/adapter` 接口（使用 `SocketObject` 为请求体）请求时，才需要验证 `OpenToken`。
:::

## BearerToken

在 **RESTful API** 模式下，客户端与服务器之间的通信通过 **BearerToken** 进行验证。BearerToken 是一种用于验证用户身份的令牌，由服务器生成并返回给客户端，客户端在每次请求时都要携带这个令牌。

### 1. **定义**

BearerToken 在本系统中全称 `JWT Bearer Token`，是一个字符串，由服务器生成并返回给客户端，用于验证客户端的身份。

### 2. **获取方式**

客户端通过调用 `/user/login/` 接口进行账号登录，登录成功后服务器会返回 `BearerToken` 和 `OpenToken`。

> 有关此部分返回体的详细内容，参见 [账号管理 | 登录](/api/user/login/)。
