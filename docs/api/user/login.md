---
title: 登录
author: Project Redbud
createTime: 2025/03/21 01:38:46
permalink: /api/user/login/
---

本文档面向开发者与调用者，详细描述了 FunGame WebAPI 中 `Login` 端口的功能、使用方法、请求与响应格式，以及可能的错误情况。

## 概述

`Login` 端口用于用户登录，支持通过用户名和密码进行身份验证。成功登录后，服务器将返回一个 JWT Bearer Token 和一个 Open Token，用于后续的 API 调用和会话管理。该端口无需额外的 API Bearer Token 验证，属于公开访问端口。

## API 请求

- **URL**: `/user/login`
- **HTTP 方法**: `POST`
- **认证方案**: 无需认证
- **请求体格式**: JSON
- **响应体格式**: JSON

示例：[https://api.redbud.fun/user/login/](https://api.redbud.fun/user/login/)

## URL 查询参数

无

## 请求体

请求体应包含以下字段：

| 参数名     | 类型   | 描述                     | 示例值         |
|------------|--------|--------------------------|----------------|
| `Username` | string | 用户名，唯一标识用户     | `"player123"` |
| `Password` | string | 用户密码                 | `"Passw0rd!"` |

```json
{
  "Username": "player123",
  "Password": "Passw0rd!"
}
```

**注意**：
- 用户名和密码不能为空。
- 建议客户端对密码进行加密传输，服务器会在接收后使用用户特定的密钥进行二次加密验证。

## 返回结果

请求成功时（`StatusCode` = 200）会返回一个 `PayloadModel` 对象，包含以下字段：

| 字段名       | 类型   | 描述                     | 示例值                       |
|--------------|--------|--------------------------|------------------------------|
| `RequestType`| int    | 请求类型，固定为 `Login_Login` | `13`                   |
| `StatusCode` | int    | HTTP 状态码              | `200`                       |
| `Message`    | string | 操作结果的描述信息       | `"登录成功！"`              |
| `Data`       | object | 附加数据，包含登录结果   | 见下文                      |

### `Data` 对象字段

| 字段名       | 类型   | 描述                     | 示例值                       |
|--------------|--------|--------------------------|------------------------------|
| `bearerToken`| string | JWT Bearer Token，用于认证后续请求 | `"eyJhbGciOiJIUzI1NiIs..."` |
| `openToken`  | string | Open Token，用于会话管理 | `"abcd1234-efgh-5678-..."` |

## 响应示例

### 登录成功

```json
{
  "RequestType": 13,
  "StatusCode": 200,
  "Message": "登录成功！",
  "Data": {
    "bearerToken": "eyJhbGciOiJIUzI1NiIs...",
    "openToken": "abcd1234-efgh-5678-ijkl-9012mnop"
  }
}
```

### 401 Unauthorized

当用户名或密码不正确时返回：

```json
{
  "RequestType": 13,
  "StatusCode": 401,
  "Message": "用户名或密码不正确。",
  "Data": {}
}
```

### 400 Bad Request

当服务器无法处理请求时返回：

```json
"服务器暂时无法处理登录请求。"
```

## 可能的错误情况

| 场景                 | 响应消息                          | HTTP 状态码 |
|----------------------|-----------------------------------|-------------|
| 用户名或密码不正确   | `"用户名或密码不正确。"`          | 401         |
| 服务器内部错误       | `"服务器暂时无法处理登录请求。"`   | 400         |

**注意**：
- 状态码 `200` 表示请求被成功接收并处理，但具体登录是否成功需通过 `Data` 中的内容判断。
- 状态码 `401` 表示认证失败，通常是用户名或密码错误。
- 状态码 `400` 表示请求格式错误或服务器内部异常。

## 使用流程

1. **发送登录请求**：
   - 使用用户名和密码向 `/user/login` 发送 POST 请求。
2. **处理响应**：
   - 若成功，提取 `bearerToken` 和 `openToken`，分别用于后续 API 认证和会话管理。
   - 若失败，根据 `Message` 和 `StatusCode` 处理错误。

## 注意事项

客户端需妥善处理 `bearerToken` 和 `openToken`，避免泄露给他人，确保账户安全。

## 代码示例

### cURL 请求

```bash
curl -X POST "https://api.redbud.fun/user/login" \
-H "Content-Type: application/json" \
-d '{
  "Username": "player123",
  "Password": "Passw0rd!"
}'
```
