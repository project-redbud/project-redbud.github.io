# API 参考

FunGame.Core 的核心 API 一览。

## 核心类

| 类 | 命名空间 | 说明 |
|---|---|---|
| `GamingQueue` | `Milimoe.FunGame.Core.Model.Queue` | 回合制队列基类（可继承扩展） |
| `MixGamingQueue` | `Milimoe.FunGame.Core.Model.Queue` | 混战模式队列 |
| `TeamGamingQueue` | `Milimoe.FunGame.Core.Model.Queue` | 团队模式队列 |
| `EquilibriumConstant` | `Milimoe.FunGame.Core.Model.Framework` | 游戏平衡常数（全部可配置） |
| `Character` | `Milimoe.FunGame.Core.Entity` | 角色实体 |
| `Skill` | `Milimoe.FunGame.Core.Entity` | 技能基类 |
| `Effect` | `Milimoe.FunGame.Core.Entity` | 特效基类 |
| `NormalAttack` | `Milimoe.FunGame.Core.Entity` | 普通攻击 |
| `OpenSkill` | `Milimoe.FunGame.Core.Entity` | 开放技能（运行时动态创建） |
| `Item` | `Milimoe.FunGame.Core.Entity` | 物品/装备 |
| `Factory` | `Milimoe.FunGame.Core.Api` | 全局工厂（创建角色/技能/特效/物品） |

## 核心接口

| 接口 | 命名空间 | 说明 |
|---|---|---|
| `IGamingQueue` | `Milimoe.FunGame.Core.Interface.Base` | 回合制队列接口 |
| `IModule` | `Milimoe.FunGame.Core.Interface.Base` | 模组接口（Name/Version/Author + Load/UnLoad） |
| `IRoundRecordSink` | `Milimoe.FunGame.Core.Interface.Base` | 回合记录外发通道接口（9 个外发方法） |

## 即时外发

| 类 | 命名空间 | 说明 |
|---|---|---|
| `RoundRecordPayload` | `Milimoe.FunGame.Core.Model.Framework` | 即时外发数据包（g/t/e/d/s 线协议模型） |
| `DefaultRoundRecordSink` | `Milimoe.FunGame.Core.Api` | 外发通道默认实现（即时主动 POST + 签名握手） |
| `RoundRecordSinkEventIds` | `Milimoe.FunGame.Core.Api` | 外发事件 id 常量（"0"~"8" + 握手 "13"） |
| `BattleStatePredictor` | `Milimoe.FunGame.Core.Api` | 战斗状态推算（基于检查点重建任意回合） |
| `RoundRecordRenderer` | `Milimoe.FunGame.Core.Api` | 回合记录文本渲染（回放） |

## Model 层

| 类 | 命名空间 | 说明 |
|---|---|---|
| `RoundRecord` | `Milimoe.FunGame.Core.Model.Framework` | 回合记录（含行动流与汇总） |
| `ActionRecord` | `Milimoe.FunGame.Core.Model.Framework` | 单次操作记录 |
| `CharacterStateSnapshot` | `Milimoe.FunGame.Core.Model.Framework` | 角色状态快照（检查点/回放） |
| `CharacterStatistics` | `Milimoe.FunGame.Core.Entity` | 角色统计数据 |
| `DecisionPoints` | `Milimoe.FunGame.Core.Model.Framework` | 决策点数据 |
| `AIDecision` | `Milimoe.FunGame.Core.Model.Framework` | AI 决策数据 |
| `GameMap` | `Milimoe.FunGame.Core.Model.Framework` | 地图基类 |
| `Grid` | `Milimoe.FunGame.Core.Model.Framework` | 地图格子 |

## 模组

| 类 | 命名空间 | 说明 |
|---|---|---|
| `CharacterModule` | `Milimoe.FunGame.Core.Library.Module` | 角色模组（注册角色工厂） |
| `SkillModule` | `Milimoe.FunGame.Core.Library.Module` | 技能模组（注册技能 + 特效工厂） |
| `ItemModule` | `Milimoe.FunGame.Core.Library.Module` | 物品模组（注册物品工厂） |
| `EntityModuleConfig<T>` | `Milimoe.FunGame.Core.Api` | 实体配置文件（modules/ 目录 JSON 读写） |

## 预制实体

| 类 | 说明 |
|---|---|
| `MagicCardPack` | 魔法卡包（6 大特性） |
| `SoulboundSkill` | 灵魂绑定爆发技 |
| `CourageCommandSkill` | 勇气指令技能 |
| `NeuralCalibrationEffect` | 神经校准特效 |
