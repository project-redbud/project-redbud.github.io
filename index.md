---
layout: home

hero:
  name: "FunGame 开发文档"
  text: "回合制游戏开发库"
  tagline: 基于 C#.NET 的轻量回合制战斗框架：行动顺序表、决策点、六乘区伤害、技能与特效系统开箱即用
  image:
    src: /hero.svg
    alt: FunGame
  actions:
    - theme: brand
      text: 📖 阅读规则书
      link: /guide/turn-based
    - theme: alt
      text: 🚀 快速开始
      link: /dev/getting-started
    - theme: alt
      text: 📚 API 参考
      link: /api/
    - theme: alt
      text: 📦 NuGet 安装
      link: https://www.nuget.org/packages/FunGame.Core

features:
  - icon: 🎯
    title: 完整回合制系统
    details: 基于时间流逝机制的动态行动顺序表 · 回合内可多次行动的决策点系统 · 
    link: /guide/turn-based
    linkText: 了解回合制
  - icon: 📊
    title: 伤害乘区概念
    details: 六大伤害乘区 · 物理/魔法伤害类型独立计算 · 暴击/闪避/穿透/护盾完整链路
    link: /guide/damage
    linkText: 查看伤害公式
  - icon: ⚔️
    title: 灵活技能系统
    details: 普攻/战技/被动/爆发技/魔法五大类型 · 回合外爆发插队 · 魔法吟唱机制
    link: /guide/skills
    linkText: 探索技能系统
  - icon: ✨
    title: 特效与驱散
    details: 50+ 特效类型 · 强/弱/临时/特殊驱散体系 · 免疫与豁免检定
    link: /guide/effects
    linkText: 了解特效系统
  - icon: 🧙
    title: 角色属性系统
    details: 力量/敏捷/智力核心属性 · 18 项能力值 · 五大角色定位 · 装备与物品体系
    link: /guide/characters
    linkText: 查看角色系统
  - icon: 🔌
    title: 模组与扩展
    details: 继承 GamingQueue 定制模式 · Factory + JSON 动态实体 · 数据即时外发与回放
    link: /dev/module-overview
    linkText: 开始自定义
---

## 📖 项目简介

**FunGame.Core** 是一套基于 **C#.NET** 设计的轻量、可扩展的回合制战斗系统类库，旨在打造充满策略趣味的战棋回合制游戏。

它围绕以下几个设计目标构建：

- **轻量零依赖**：纯 BCL 实现，不依赖任何第三方库，`dotnet add package FunGame.Core` 即可接入任何 .NET 项目
- **策略深度**：行动顺序表、决策点、六乘区伤害、技能/特效/驱散/免疫等机制开箱即用，为战棋玩法提供完整的战斗底层
- **接口驱动、极易扩展**：`IGamingQueue` 定义全部契约，继承 `GamingQueue` 即可定制游戏模式；31 个事件覆盖整个游戏循环，UI、AI、网络层可独立介入
- **实体可动态化**：Factory 工厂 + JSON 配置文件支持免编码动态创建角色、技能、特效与物品，模组化分发游戏内容
- **数据可观测**：回合记录以不可变快照沉淀，支持即时外发到专用服务器，用于观战、回放与战斗状态重建

> 库的安装与引用方式见 [快速开始](/dev/getting-started)。

## 🚀 快速上手

```csharp
using FunGame.Core.Entity;
using FunGame.Core.Model.Queue;

// 1. 创建角色
Character player = new()
{
    Name = "角色1",
    InitialHP = 80,
    InitialATK = 20,
    InitialSPD = 120
};

Character enemy = new()
{
    Name = "角色2",
    InitialHP = 60,
    InitialATK = 25,
    InitialSPD = 100
};

// 2. 创建混战队列
MixGamingQueue queue = new([player, enemy], Console.WriteLine);
queue.InitActionQueue();
queue.SetCharactersToAIControl(cancel: false, [player, enemy]);

// 3. 游戏循环
while (queue.NextCharacter() is Character actor)
{
    if (queue.ProcessTurn(actor)) break;
    queue.TimeLapse();
}
```

> 完整示例见 [快速开始](/dev/getting-started) 与 [完整示例](/dev/examples)。

## 📚 文档导航

| 模块 | 内容 | 入口 |
|---|---|---|
| **规则书** | 回合制 / 行动顺序表 / 决策点 / 伤害计算 / 角色 / 技能 / 特效 / 物品 全机制详解 | [游戏机制](/guide/turn-based) · [角色系统](/guide/characters) · [技能系统](/guide/skills) · [特效系统](/guide/effects) |
| **开发者指南** | 快速开始 / 自定义角色·技能·特效·物品 / 事件驱动 / 模组开发 / 即时外发 | [快速开始](/dev/getting-started) · [事件模式](/dev/events-overview) · [模组开发](/dev/module-overview) · [即时外发](/dev/outbound) |
| **API 参考** | 核心类与接口的完整代码级 API：GamingQueue / Character / Skill / Effect / Item / 外发通道等 33 个页面 | [API 参考](/api/) |

## ✨ 核心能力

- **接口驱动**：`IGamingQueue` 定义全部契约，继承即可定制游戏模式
- **事件总线**：31 个事件覆盖整个游戏循环，UI / AI / 网络可独立介入
- **可扩展实体**：Factory 工厂 + JSON 配置文件，免编码动态创建角色、技能、特效与物品
- **数据外发**：回合记录实时 POST 到专用服务器，支持观战、回放与状态重建
- **零依赖**：纯 BCL 实现，`dotnet add package FunGame.Core` 即可接入
