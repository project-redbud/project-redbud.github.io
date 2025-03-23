---
title: 刷新令牌
author: Project Redbud
createTime: 2025/03/23 19:35:36
permalink: /api/user/refresh/
---

本文档面向开发者与调用者，详细描述了 FunGame WebAPI 中 `Refresh` 端口的功能、使用方法、请求与响应格式，以及可能的错误情况。

## 概述

`Refresh` 端口用于刷新用户的 JWT Bearer Token。用户在登录后可以通过此端口获取一个新的 Bearer Token，以延长会话的有效期或在旧 Token 被吊销后重新获取认证凭证。此端口需要用户已登录并提供有效的 Bearer Token 进行身份验证。

**Token 过期时间**：默认情况下，JWT Bearer Token 的有效期为 30 分钟，自生成之时起计算。

## API 请求

- **URL**: `/user/refresh`
- **HTTP 方法**: `POST`
- **认证方案**: Bearer Token（一个有效的 JWT Bearer Token）
- **请求体格式**: 无需请求体
- **响应体格式**: JSON

示例：[https://api.redbud.fun/user/refresh/](https://api.redbud.fun/user/refresh/)

## URL 查询参数

无

## 请求头

| 头字段        | 类型   | 描述                     | 示例值                       |
|---------------|--------|--------------------------|------------------------------|
| `Authorization` | string | Bearer Token，用于身份验证 | `"Bearer eyJhbGciOiJIUzI1NiIs..."` |

**注意**：
- 请求头中必须包含 `Authorization` 字段，且格式为 `Bearer <token>`。
- Token 必须是有效的、未被吊销且未过期的 JWT Bearer Token。默认过期时间为 30 分钟。

## 返回结果

请求成功时（`StatusCode` = 200）会返回一个新的 JWT Bearer Token 字符串：

| 类型   | 描述                     | 示例值                       |
|--------|--------------------------|------------------------------|
| string | 新的 JWT Bearer Token    | `"eyJhbGciOiJIUzI1NiIs..."` |

### 失败时的返回

当请求失败时，返回一个简单的错误消息字符串：

| 类型   | 描述                     | 示例值                       |
|--------|--------------------------|------------------------------|
| string | 错误描述                 | `"服务器暂时无法处理请求。"`  |

## 响应示例

### 刷新成功

```json
"eyJhbGciOiJIUzI1NiIs..."
```

### 400 Bad Request

当服务器无法处理请求或用户身份验证失败时返回：

```json
"服务器暂时无法处理请求。"
```

## 可能的错误情况

| 场景                 | 响应消息                          | HTTP 状态码 |
|----------------------|-----------------------------------|-------------|
| Bearer Token 无效或已吊销 | `"此 Token 已吊销，请重新登录以获取 Token。"`   | 401         |
| 未提供 Authorization 头 | 无详细消息      | 401         |
| 服务器内部错误       | `"服务器暂时无法处理请求。"`      | 400         |

**注意**：
- 状态码 `200` 表示成功刷新，返回新的 Bearer Token。
- 状态码 `401` 表示认证失败，通常是由于未提供 Token，也可能是 Token 无效、已过期、已吊销。
- 状态码 `400` 表示服务器无法处理请求，或内部异常。

## 使用流程

1. **准备认证**：
   - 确保用户已登录并持有有效的 Bearer Token，且 Token 未超过 30 分钟的有效期。
2. **发送刷新请求**：
   - 使用现有的 Bearer Token 在请求头中向 `/user/refresh` 发送 POST 请求。
3. **处理响应**：
   - 若成功，获取新的 Bearer Token 并替换旧 Token 用于后续请求。
   - 若失败，根据返回的错误消息处理异常。

## 注意事项

- 刷新操作会吊销旧的 Bearer Token，新 Token 将替代旧 Token 用于认证。
- 客户端应妥善保存新 Token，避免泄露。
- 若 Token 已过期（超过 30 分钟），需重新登录以获取新 Token。

## 代码示例

### cURL 请求

```bash
curl -X POST "https://api.redbud.fun/user/refresh" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
-H "Content-Type: application/json"
```
