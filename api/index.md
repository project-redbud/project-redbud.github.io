# API 参考

FunGame.Core 的核心 API 一览。

## 核心类

| 类 | 命名空间 | 说明 |
|---|---|---|
| [GamingQueue](./GamingQueue.md) | `FunGame.Core.Model.Queue` | 回合制队列基类（可继承扩展） |
| [AIController](./AIController.md) | `FunGame.Core.Controller` | AI 模式、估值、策略求值与规划指标 |
| [决策表 API](./DecisionTable.md) | `FunGame.Core.Api` / `FunGame.Core.Model.DecisionTable` | JSON、构建、编译、加载、绑定与求值模型 |
| [MixGamingQueue](./GamingQueue.md#三种队列对比) | `FunGame.Core.Model.Queue` | 混战模式队列 |
| [TeamGamingQueue](./GamingQueue.md#三种队列对比) | `FunGame.Core.Model.Queue` | 团队模式队列 |
| [EquilibriumConstant](./EquilibriumConstant.md) | `FunGame.Core.Model.Framework` | 游戏平衡常数（全部可配置） |
| [Character](./Character.md) | `FunGame.Core.Entity` | 角色实体 |
| [Skill](./Skill.md) | `FunGame.Core.Entity` | 技能基类 |
| [Effect](./Effect.md) | `FunGame.Core.Entity` | 特效基类（上下文钩子） |
| [HookContext](./HookContext.md) | `FunGame.Core.Model.EffectContext` | 特效钩子/队列事件的统一参数上下文族 |
| [EffectResult](./EffectResult.md) | `FunGame.Core.Model.EffectResult` | 特效钩子返回值结构体族 |
| [NormalAttack](./NormalAttack.md) | `FunGame.Core.Entity` | 普通攻击 |
| [OpenSkill](./OpenSkill.md) | `FunGame.Core.Entity` | 开放技能（运行时动态创建） |
| [Item](./Item.md) | `FunGame.Core.Entity` | 物品/装备 |
| [Factory](./Factory.md) | `FunGame.Core.Api` | 全局工厂（创建角色/技能/特效/物品） |
| [ClassPlanner](./ClassPlanner.md) | `FunGame.Core.Model` | 职业规划器（选职业/升级/学技能/属性分配/洗点） |
| [SwitchCombatTalentSkill](./SwitchCombatTalentSkill.md) | `FunGame.Core.Model.PrefabricatedEntity` | 转换战斗天赋战技 |

## 核心接口

| 接口 | 命名空间 | 说明 |
|---|---|---|
| [IGamingQueue](./GamingQueue.md) | `FunGame.Core.Interface.Base` | 回合制队列接口 |
| [IDecisionPolicy](./DecisionTable.md#代码策略与扩展) | `FunGame.Core.Interface` | 只读角色策略求值接口 |
| [IModule](./IModule.md) | `FunGame.Core.Interface.Base` | 模组接口（Name/Version/Author + Load/UnLoad） |
| [IRoundRecordSink](./IRoundRecordSink.md) | `FunGame.Core.Interface.Base` | 回合记录外发通道接口（9 个外发方法） |

## 即时外发

| 类 | 命名空间 | 说明 |
|---|---|---|
| [RoundRecordPayload](./RoundRecordPayload.md) | `FunGame.Core.Model.Framework` | 即时外发数据包（g/t/e/d/s 线协议模型） |
| [DefaultRoundRecordSink](./DefaultRoundRecordSink.md) | `FunGame.Core.Api` | 外发通道默认实现（即时主动 POST + 签名握手） |
| [RoundRecordSinkEventIds](./RoundRecordSinkEventIds.md) | `FunGame.Core.Api` | 外发事件 id 常量（"0"~"8" + 握手 "13"） |
| [BattleStatePredictor](./BattleStatePredictor.md) | `FunGame.Core.Api` | 战斗状态推算（基于检查点重建任意回合） |
| [RoundRecordRenderer](./RoundRecordRenderer.md) | `FunGame.Core.Api` | 回合记录文本渲染（回放） |

## Model 层

| 类 | 命名空间 | 说明 |
|---|---|---|
| [HookContext](./HookContext.md) | `FunGame.Core.Model.EffectContext` | 钩子/事件统一参数上下文族（v3.0 起） |
| [RoundRecord](./RoundRecord.md) | `FunGame.Core.Model.Framework` | 回合记录（含行动流与汇总） |
| [RoundRewardRecord](./RoundRewardRecord.md) | `FunGame.Core.Model.Framework` | 回合奖励事件记录（发放/移除/夺取事件流） |
| [ActionRecord](./ActionRecord.md) | `FunGame.Core.Model.Framework` | 单次操作记录 |
| [ChainActionRequest / ChainActionResult](./ChainActionRequest.md) | `FunGame.Core.Model.Framework` | 协同请求与确认结果 |
| [CharacterStateSnapshot](./CharacterStateSnapshot.md) | `FunGame.Core.Model.Framework` | 角色状态快照（检查点/回放） |
| [CharacterStatistics](./CharacterStatistics.md) | `FunGame.Core.Entity` | 角色统计数据 |
| [DecisionPoints](./DecisionPoints.md) | `FunGame.Core.Model.Framework` | 决策点数据 |
| [AIDecision](./AIDecision.md) | `FunGame.Core.Model.Framework` | AI 决策数据 |
| [GameMap](./GameMap.md) | `FunGame.Core.Model.Framework` | 地图基类 |
| [Grid](./Grid.md) | `FunGame.Core.Model.Framework` | 地图格子 |

## 模组

| 类 | 命名空间 | 说明 |
|---|---|---|
| [CharacterModule](./CharacterModule.md) | `FunGame.Core.Library.Module` | 角色模组（注册角色工厂） |
| [SkillModule](./SkillModule.md) | `FunGame.Core.Library.Module` | 技能模组（注册技能 + 特效工厂） |
| [ItemModule](./ItemModule.md) | `FunGame.Core.Library.Module` | 物品模组（注册物品工厂） |
| [EntityModuleConfig&lt;T&gt;](./EntityModuleConfig.md) | `FunGame.Core.Api` | 实体配置文件（modules/ 目录 JSON 读写） |

## 预制实体

| 类 | 说明 |
|---|---|
| [MagicCardPack](./MagicCardPack.md) | 魔法卡包（6 大特性） |
| [SoulboundSkill](./SoulboundSkill.md) | 灵魂绑定爆发技 |
| [CourageCommandSkill](./CourageCommandSkill.md) | 勇气指令技能 |
| [NeuralCalibrationEffect](./NeuralCalibrationEffect.md) | 神经校准特效 |
