---
title: 登出
author: Project Redbud
createTime: 2025/03/23 19:47:43
permalink: /api/user/logout/
---

本文档面向开发者与调用者，详细描述了 FunGame WebAPI 中 `LogOut` 端口的功能、使用方法、请求与响应格式，以及可能的错误情况。

## 概述

`LogOut` 端口用于用户退出登录，旨在终止当前用户的会话并吊销相关的 JWT Bearer Token。调用此端口需要用户已登录并提供有效的 Bearer Token 进行身份验证。成功退出后，用户会话将被销毁，后续请求需重新登录。

## API 请求

- **URL**: `/user/logout`  
- **HTTP 方法**: `POST`  
- **认证方案**: Bearer Token  
- **请求体格式**: 无需请求体  
- **响应体格式**: JSON  

示例：[https://api.redbud.fun/user/logout/](https://api.redbud.fun/user/logout/)

## URL 查询参数

无

## 请求头

| 头部字段      | 类型   | 描述                     | 示例值                       |
|---------------|--------|--------------------------|------------------------------|
| `Authorization` | string | Bearer Token，用于身份验证 | `Bearer eyJhbGciOiJIUzI1NiIs...` |

**注意**：  
- 请求头中必须包含有效的 `Authorization` 字段，格式为 `Bearer <token>`，否则将返回认证失败。

## 请求体

此端口无需请求体，直接发送 POST 请求即可。

## 返回结果

请求成功时（`StatusCode` = 200）会返回一个 `PayloadModel` 对象，包含以下字段：

| 字段名       | 类型   | 描述                     | 示例值                       |
|--------------|--------|--------------------------|------------------------------|
| `RequestType`| int    | 请求类型，固定为 `RunTime_Logout` | `1`                  |
| `StatusCode` | int    | HTTP 状态码              | `200`                       |
| `Message`    | string | 操作结果的描述信息       | `"你已成功退出登录！"`      |
| `Data`       | object | 附加数据，此处为空       | `{}`                        |

## 响应示例

### 退出登录成功

```json
{
  "RequestType": 1,
  "StatusCode": 200,
  "Message": "你已成功退出登录！",
  "Data": {}
}
```

### 400 Bad Request

当退出登录失败或服务器无法处理请求时返回：

```json
{
  "RequestType": 1,
  "StatusCode": 400,
  "Message": "退出登录失败！",
  "Data": {}
}
```

### 未授权（未提供有效 Token）

若未提供有效的 Bearer Token，返回标准的 HTTP 401 状态码，通常不附带详细响应体：

```
401 Unauthorized
```

## 可能的错误情况

| 场景                 | 响应消息                          | HTTP 状态码 |
|----------------------|-----------------------------------|-------------|
| 用户未登录或 Token 无效 | 无详细消息           | 401         |
| 用户会话不存在       | `"退出登录失败！"`               | 400         |
| 服务器内部错误       | 无详细消息       | 400         |

**注意**：  
- 状态码 `200` 表示退出登录成功，用户会话已被销毁，关联的 Bearer Token 失效。  
- 状态码 `401` 表示未通过认证，通常是 Token 缺失或无效。  
- 状态码 `400` 表示请求处理失败，可能是用户会话未找到或服务器异常。

## 使用流程

1. **发送退出请求**：  
   - 使用有效的 Bearer Token，向 `/user/logout` 发送 POST 请求。  
2. **处理响应**：  
   - 若成功（`StatusCode` = 200），客户端应清除本地保存的 Token，结束用户会话。  
   - 若失败，根据 `StatusCode` 和 `Message` 处理错误，可能需要重新登录。

## 注意事项

- 客户端在收到成功响应后，应立即删除本地存储的 Bearer Token，以防止后续误用。  
- 退出登录后，任何需要认证的 API 调用将失败，需重新登录获取新 Token。

## 代码示例

### cURL 请求

```bash
curl -X POST "https://api.redbud.fun/user/logout" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```
