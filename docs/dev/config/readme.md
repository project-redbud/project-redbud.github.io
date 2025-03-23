---
title: 配置文件说明
author: Project Redbud
createTime: 2024/09/29 18:41:20
permalink: /dev/config/
prev: /welcome/
next: /dev/architecture/
---

`FunGame` 的配置文件在客户端和服务器端都命名为 `FunGame.ini`。在启动程序时，如果未检测到配置文件，程序会自动生成。

## 客户端配置文件

```ini
# FunGame.ini

[Config]
AutoConnect=
AutoLogin=

[Account]
UserName=
Password=
AutoKey=
```

### Config

| 名称   |   类型   |   含义   |  默认值  |
|:----------:|:--------:|:--------:|:--------:|
| `AutoConnect` | `bool` | 打开客户端自动连接服务器   |  false |
| `AutoLogin` | `bool` | 打开客户端自动登录账号   |  false  |

### Account

| 名称   |   类型   |   含义   |  默认值  |
|:----------:|:--------:|:--------:|:--------:|
| `UserName` | `string` | 用户名   |  |
| `Password` | `string` | 密码     |  |
| `AutoKey` | `string` | 自动登录秘钥，通过用户中心设置  |  |

## 服务器端配置文件

```ini
# FunGame.ini

[Server]
Name=FunGame Server
Password=
Describe=Just Another FunGame Server.
Notice=This is the FunGame Server''s Notice.
Key=
Status=1
BannedList=

[ServerMail]
OfficialMail=
SupportMail=

[Socket]
Port=22222
UseWebSocket=false
WebSocketAddress=*
WebSocketPort=22223
WebSocketSubUrl=ws
WebSocketSSL=false
MaxPlayer=20
MaxConnectFailed=0

[MySQL]
UseMySQL=false
DBServer=localhost
DBPort=3306
DBName=fungame
DBUser=root
DBPassword=pass

[SQLite]
UseSQLite=true
DataSource=FunGameDB

[Mailer]
UseMailSender=false
MailAddress=
Name=
Password=
Host=
Port=587
OpenSSL=true
```

### Server

| 名称   |   类型   |   含义   |  默认值  |
|:----------:|:--------:|:--------:|:--------:|
| `Name` | `string` | 服务器名称   |  FunGame Server |
| `Password` | `string` | 服务器密码   |  |
| `Describe` | `string` | 服务器描述   | Just Another FunGame Server. |
| `Notice` | `string` | 服务器公告   | This is the FunGame Server's Notice. |
| `Key` | `string` | 服务器OP秘钥   |  |
| `Status` | `int` | 服务器状态 (0：关闭, 1：运行中)   | 1 |
| `BannedList` | `string` | 禁止访问的IP地址列表（用逗号隔开）   |  |

### ServerMail

| 名称   |   类型   |   含义   |  默认值  |
|:----------:|:--------:|:--------:|:--------:|
| `OfficialMail` | `string` | 官方邮箱地址   |  |
| `SupportMail` | `string` | 客服邮箱地址   |  |

### Socket

| 名称   |   类型   |   含义   |  默认值  |
|:----------:|:--------:|:--------:|:--------:|
| `Port` | `int` | Socket 端口号   | 22222 |
| `UseWebSocket` | `bool` | 是否启用 WebSocket   | false |
| `WebSocketAddress` | `string` | WebSocket 地址（监听 * 需要管理员身份运行）   | * |
| `WebSocketPort` | `int` | WebSocket 端口号   | 22223 |
| `WebSocketSubUrl` | `string` | WebSocket 子路径   | ws |
| `WebSocketSSL` | `bool` | WebSocket 是否启用 SSL   | false |
| `MaxPlayer` | `int` | 最大玩家数量   | 20 |
| `MaxConnectFailed` | `int` | 允许的最大连接失败次数   | 0 |

::: tip 提示
此配置项仅适用于 `FunGameServer.exe`。运行 `FunGameWebAPI.exe` 时，上述配置无效，Web API 同时支持 RESTful API 和 WebSocket。
:::

### MySQL

| 名称   |   类型   |   含义   |  默认值  |
|:----------:|:--------:|:--------:|:--------:|
| `UseMySQL` | `bool` | 是否使用 MySQL 数据库   | false |
| `DBServer` | `string` | MySQL 服务器地址   | localhost |
| `DBPort` | `int` | MySQL 端口号   | 3306 |
| `DBName` | `string` | 数据库名称   | fungame |
| `DBUser` | `string` | MySQL 用户名   | root |
| `DBPassword` | `string` | MySQL 密码   | pass |

### SQLite

| 名称   |   类型   |   含义   |  默认值  |
|:----------:|:--------:|:--------:|:--------:|
| `UseSQLite` | `bool` | 是否使用 SQLite 数据库   | true |
| `DataSource` | `string` | SQLite 数据源名称   | FunGameDB |

::: tip 提示
`MySQL` 和 `SQLite` 只会运行一个，`MySQL` 优先运行。两个配置项都为 `false` 时，将不启用 `SQL` 服务，某些请求将无法处理。
:::

### Mailer

| 名称   |   类型   |   含义   |  默认值  |
|:----------:|:--------:|:--------:|:--------:|
| `UseMailSender` | `bool` | 是否启用邮件发送功能   | false |
| `MailAddress` | `string` | 邮件地址   |  |
| `Name` | `string` | 邮件发送者名称   |  |
| `Password` | `string` | 邮件密码   |  |
| `Host` | `string` | 邮件服务器地址   |  |
| `Port` | `int` | 邮件服务器端口号   | 587 |
| `OpenSSL` | `bool` | 是否使用 OpenSSL 进行安全加密   | true |
