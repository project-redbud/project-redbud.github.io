# API 参考

FunGame.Core 的核心 API 一览。

::: tip 提示
API 参考由 C# XML 文档注释自动生成。如需查看所有公开 API，请参阅项目源码中的 XML 文档注释。
:::

## 核心类

| 类 | 命名空间 | 说明 |
|---|---|---|
| `GamingQueue` | `Milimoe.FunGame.Core.Model` | 回合制队列引擎（可直接使用或继承） |
| `EquilibriumConstant` | `Milimoe.FunGame.Core.Model` | 游戏平衡常数（全部可配置） |
| `Character` | `Milimoe.FunGame.Core.Entity` | 角色实体 |
| `Skill` | `Milimoe.FunGame.Core.Entity` | 技能基类 |
| `Effect` | `Milimoe.FunGame.Core.Entity` | 特效基类 |
| `NormalAttack` | `Milimoe.FunGame.Core.Entity` | 普通攻击 |
| `OpenSkill` | `Milimoe.FunGame.Core.Entity` | 开放技能（运行时扩展） |
| `Item` | `Milimoe.FunGame.Core.Entity` | 物品/装备 |
| `Session` | `Milimoe.FunGame.Core.Model` | 会话管理 |

## 核心接口

| 接口 | 命名空间 | 说明 |
|---|---|---|
| `IGamingQueue` | `Milimoe.FunGame.Core.Interface.Base` | 队列接口 |
| `IClient` | `Milimoe.FunGame.Core.Interface.General` | 客户端配置接口 |
| `IServer` | `Milimoe.FunGame.Core.Interface.General` | 服务端配置接口 |

## 模型类

| 类 | 说明 |
|---|---|
| `GamingQueue` | 混战模式队列 |
| `TeamGamingQueue` | 组队模式队列 |
| `MixGamingQueue` | 混合模式队列 |
| `DecisionPoints` | 决策点数据 |
| `RoundRecord` | 回合记录 |
| `DamageCalculationOptions` | 伤害计算选项 |
| `AIDecision` | AI 决策数据 |
