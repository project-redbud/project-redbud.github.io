# API 参考

FunGame.Core 的核心 API 一览。

## 核心类

| 类 | 命名空间 | 说明 |
|---|---|---|
| `GamingQueue` | `Milimoe.FunGame.Core.Model` | 回合制队列基类（可继承扩展） |
| `MixGamingQueue` | `Milimoe.FunGame.Core.Model` | 混战模式队列 |
| `TeamGamingQueue` | `Milimoe.FunGame.Core.Model` | 团队模式队列 |
| `EquilibriumConstant` | `Milimoe.FunGame.Core.Model` | 游戏平衡常数（全部可配置） |
| `Character` | `Milimoe.FunGame.Core.Entity` | 角色实体 |
| `Skill` | `Milimoe.FunGame.Core.Entity` | 技能基类 |
| `Effect` | `Milimoe.FunGame.Core.Entity` | 特效基类 |
| `NormalAttack` | `Milimoe.FunGame.Core.Entity` | 普通攻击 |
| `OpenSkill` | `Milimoe.FunGame.Core.Entity` | 开放技能（运行时动态创建） |
| `Item` | `Milimoe.FunGame.Core.Entity` | 物品/装备 |
| `Factory` | `Milimoe.FunGame.Core.Api.Utility` | 全局工厂（创建角色/技能/特效/物品） |

## 核心接口

| 接口 | 说明 |
|---|---|
| `IGamingQueue` | 回合制队列接口 |
| `IClient` | 客户端配置接口 |
| `IServer` | 服务端配置接口 |

## Model 层

| 类 | 说明 |
|---|---|
| `GamingQueue` | 队列基类 |
| `MixGamingQueue` | 混战模式 |
| `TeamGamingQueue` | 团队模式 |
| `Session` | 会话管理 |
| `DecisionPoints` | 决策点数据 |
| `RoundRecord` | 回合记录 |
| `AIDecision` | AI 决策数据 |
| `GameMap` | 地图基类 |
| `Grid` | 地图格子 |

## 预制实体

| 类 | 说明 |
|---|---|
| `MagicCardPack` | 魔法卡包（6 大特性） |
| `SoulboundSkill` | 灵魂绑定爆发技 |
| `CourageCommandSkill` | 勇气指令技能 |
| `NeuralCalibrationEffect` | 神经校准特效 |
