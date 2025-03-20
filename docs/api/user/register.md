---
title: 注册
author: Project Redbud
createTime: 2024/09/29 18:41:20
permalink: /api/user/register/
---

本文档面向开发者与调用者，详细描述了 FunGame WebAPI 中 `Register` 端口的功能、使用方法、请求与响应格式，以及可能的错误情况。

## 概述

`Register` 端口用于用户注册，支持通过用户名、密码、邮箱和验证码完成账户创建。由于注册是公开操作，为防止 API 滥用，该端口需要使用 **API Bearer Token** 进行身份验证。

API Bearer Token 由服务器生成并存储在数据库的 `apitokens` 表中，默认 TokenID 为 `fungame_web_api`。开发者若需使用此默认 Token 的秘钥，请联系服务器管理员获取。

已注册并登录的用户也可以生成自己的 API Bearer Token，用于访问需要 `APIBearer` 验证的 API 端口。

## API 请求

- **URL**: `/user/register`
- **HTTP 方法**: `POST`
- **认证方案**: `APIBearer`
- **请求体格式**: JSON
- **响应体格式**: JSON

示例：[https://api.redbud.fun/user/register/](https://api.redbud.fun/user/register/)

## URL 查询参数

无

## 请求体

请求体应包含以下字段：

| 参数名       | 类型   | 描述                     | 示例值             |
|--------------|--------|--------------------------|--------------------|
| `Username`   | string | 用户名，唯一标识用户     | `"player123"`     |
| `Password`   | string | 用户密码                 | `"Passw0rd!"`     |
| `Email`      | string | 用户邮箱 | `"user@example.com"` |
| `VerifyCode` | string | 验证码（为空时为请求验证码） | `"123456"`       |

```json
{
  "Username": "player123",
  "Password": "Passw0rd!",
  "Email": "user@example.com",
  "VerifyCode": "123456"
}
```

**注意**：
- 建议密码经过加密处理。客户端的安全性需自行负责，服务器会在收到密码后进行二次加密。
- 若 `VerifyCode` 为空字符串（`""`），服务器将生成并发送验证码至指定邮箱，需在后续请求中提供正确的验证码。
- 请求头需包含有效的 `Authorization: Bearer <API_TOKEN>`。

## 返回结果

请求成功时（`StatusCode` = 200）会返回一个 `PayloadModel` 对象，包含以下字段：

| 字段名       | 类型   | 描述                     | 示例值             |
|--------------|--------|--------------------------|--------------------|
| `RequestType`| int    | 请求类型，固定为 `Reg_Reg` | `12`          |
| `StatusCode` | int    | HTTP 状态码              | `200`             |
| `Message`    | string | 操作结果的描述信息       | `"注册成功！请牢记您的账号与密码！"` |
| `Data`       | object | 附加数据，包含注册结果   | 见下文            |

### `Data` 对象字段

| 字段名    | 类型   | 描述                     | 示例值             |
|-----------|--------|--------------------------|--------------------|
| `success` | bool   | 是否注册成功             | `true`            |
| `type`    | int    | 注册操作类型（见下表）   | `0`               |

#### `type` 枚举值 (`RegInvokeType`)
| 值 | 枚举名            | 描述                     |
|----|-------------------|--------------------------|
| 0  | `None`           | 无特定类型，通常表示失败或过期 |
| 1  | `DuplicateUserName` | 用户名已存在          |
| 2  | `DuplicateEmail` | 邮箱已注册             |
| 3  | `InputVerifyCode`| 需要输入验证码         |

## 响应示例

### 注册成功

```json
{
  "RequestType": 12,
  "StatusCode": 200,
  "Message": "注册成功！请牢记您的账号与密码！",
  "Data": {
    "success": true,
    "type": 0
  }
}
```

### 需要验证码
```json
{
  "RequestType": 12,
  "StatusCode": 200,
  "Message": "",
  "Data": {
    "success": false,
    "type": 3
  }
}
```

### 400 Bad Request

当服务器无法处理请求时返回：
```json
"服务器暂时无法处理注册请求。"
```

### 可能的错误情况
| 场景                 | 响应消息                          | `type` 值 | HTTP 状态码 |
|----------------------|-----------------------------------|-----------|-------------|
| 用户名已存在         | `"此账号名已被使用！"`            | 1         | 200         |
| 邮箱已注册           | `"此邮箱已被注册！"`              | 2         | 200         |
| 验证码不正确         | `"验证码不正确，请重新输入！"`     | 0         | 200         |
| 验证码已过期         | `"此验证码已过期，请重新注册。"`   | 0         | 200         |
| 服务器内部错误       | `"服务器暂时无法处理注册请求。"`   | N/A       | 400         |

**注意**：
- 即使是逻辑错误（如用户名重复），状态码仍为 `200`，通过 `Data.success` 和 `Message` 判断具体结果。
- 验证码有效期为 10 分钟，过期后需重新请求生成新的验证码。

## 使用流程

1. **获取 API Bearer Token**：
   - 若无 Token，请联系服务器管理员获取默认 Token，或使用已注册账户生成个人 Token。
2. **初次请求（无验证码）**：
   - 发送请求，将 `VerifyCode` 设为空字符串（`""`）。
   - 服务器生成验证码并通过邮件发送至 `Email`，响应中 `type` 为 `3`。
3. **验证并注册**：
   - 使用收到的验证码，重新发送请求，填入正确的 `VerifyCode`。
   - 若成功，响应 `success` 为 `true`，账户注册完成。

## 注意事项

- **安全性**：密码在服务器端使用用户特定的密钥加密后存储，确保安全性。
- **频率限制**：同一用户名和邮箱在 10 分钟内只能生成一次验证码，避免滥用。
- **客户端支持**：推荐使用服务器运营者提供的客户端完成注册流程，以简化 Token 获取。

## 代码示例

### cURL 请求

```bash
curl -X POST "https://api.redbud.fun/user/register" \
-H "Authorization: Bearer YOUR_API_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "Username": "player123",
  "Password": "Passw0rd!",
  "Email": "user@example.com",
  "VerifyCode": "123456"
}'
```
