---
title: FunGame 开发文档
author: Project Redbud
createTime: 2024/09-29 18:41:27
permalink: /welcome/
prev: /api/
next: /dev/config/
---

![红芽绽放之时，繁花散落满世](/images/logo.png)

本文档的主要目标是为了能让开发者更方便地进行 `FunGame` 的开发与调试。

## 关于 FunGame

`FunGame` 是一套基于 `C#.NET` 设计的回合制游戏服务器端开发框架，旨在简化多人回合制在线游戏的开发过程。FunGame 的实现基于以下多个项目：

### 1. FunGame-Core

**FunGame-Core** 是整个 `FunGame` 系统的基础模块，包含了框架的基本组件。主要功能包括：

- **基本 API**：提供一系列常用的 API，如网络模块、模组模块、插件模块等。
- **工具库**：包括日志记录、配置管理等工具。
- **实体类**：包含与游戏逻辑相关的基础数据结构，如用户、角色、技能、物品等，支持快速搭建游戏的核心数据模型。

### 2. FunGame-Server

**FunGameServer** 是 `FunGame` 的服务器端实现，基于 `ASP.NET Core Web API`，负责处理游戏的主要逻辑和数据交互。它支持多种服务模式，使得服务器端的扩展和集成更加灵活。主要特性包括：

- **Socket 服务**：支持传统的 TCP 通信，适合低延迟的实时游戏场景。
- **WebSocket 服务**：支持基于 Web 的实时通信，适用于 HTML5 和移动端应用的互动。
- **WebAPI 服务**：提供标准的 RESTful API 接口，便于与其他系统进行集成和数据交互。

通过这些服务模式，FunGameServer 能够适应不同类型的游戏场景，满足从实时对战到数据查询等多样化需求。

### 3. FunGame-Desktop

**FunGameDesktop** 是一个基于 `Winform` 的桌面客户端实现，可以直接使用。开发者不需要修改 `FunGame-Desktop` 本身，而是通过开发**模组**和**插件**来扩展其功能。

### 4. FunGame-Web

**FunGame-Web** 是一个基于 `Node.js` 的跨平台客户端实现，设计目的是使游戏能够运行在多种平台上，包括 Web 浏览器和移动设备。
