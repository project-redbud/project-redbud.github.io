---
title: 注册
author: Project Redbud
createTime: 2024/09/29 18:41:20
permalink: /api/user/register/
---

注册一个 `FunGame` 账号。

::: tip 提示
使用 RESTful API 连接时，不需要 Auth。
:::

## API 请求

`POST`：/user/register/

示例：[https://api.redbud.fun/user/register/](https://api.redbud.fun/user/register/)

## 参数

无

## 请求体

```JSON
{
  "socketType": 2,
  "token": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "parameters": [
    12,
    "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    {
      "username": "your_username",
      "password": "your_password",
      "email": "example@example.com",
      "verifycode": "123456"
    }
  ]
}
```

## JSON 解析

JSON 的属性含义：

| 名称   |   类型   |   含义   |
|:----------:|:--------:|:--------:|
| `socketType` | `int` | `SocketMessageType` 枚举   |
| `token` | `Guid` | 客户端连接令牌   |
| `parameters[0]` | `int` | `DataRequestType` 枚举   |
| `parameters[1]` | `Guid` | RequestID   |
| `username` | `string` | 用户名   |
| `password` | `string` | 密码     |
| `email`    | `string` | 电子邮件 |
| `verifycode` | `string` | 注册验证码  |

其中：`socketType` 固定为 2，代表 `SocketMessageType.DataRequest`；

`parameters[0]` 固定为 12，代表 `DataRequest.Reg_GetRegVerifyCode`；

`parameters[1]` 指示一个请求 ID，如果使用了 `DataRequest` 类请求数据，此属性用于判断任务是否结束。通常，服务器返回的 RequestID 与请求时的相同。

如果 `verifycode` 为空，则指示为第一阶段注册，服务器将返回一个注册验证码；不为空时，指示第二阶段注册，服务器将检验用户的输入是否正确。

## 返回结果

请求成功，将返回如下结果：

```JSON
{
  "socketType": 2,
  "token": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "parameters": [
    12,
    "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    {
        "msg": "返回提示文本",
        "type": 0,
        "success": true
    }
  ]
}
```

返回的参数中，`type` 是 `RegInvokeType` 枚举，返回值有以下含义：

`None`（值：0）：注册成功，账号数据写入数据库；

`DuplicateUserName`（值：1）：提示有重复的用户名；

`DuplicateEmail`（值：2）：提示有重复的邮箱；

`InputVerifyCode`（值：3）：这是注册的第一阶段，用于创建验证码返回，用户输入验证码后需要再次请求此接口。
