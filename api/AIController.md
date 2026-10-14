# AIController

AI 控制器位于 `FunGame.Core.Controller`。通常使用启用 AI 的 `GamingQueue.AI`，由队列派发普通行动与协同申请。模式和估值说明见 [AI 规划](/dev/ai-planning)。

队列更换地图时会自动重建控制器，模式与实例事件应在加载地图后配置。

## 构造与配置

```csharp
public AIController(GamingQueue queue, GameMap? map)
```

| 属性 | 类型 | 默认 / 说明 |
|---|---|---|
| `Map` | `GameMap?` | 只读地图 |
| `IsMapMode` | `bool` | 只读，地图是否存在 |
| `SelectionMode` | `AISelectionMode` | `Legacy`；枚举位于 `FunGame.Core.Model.DecisionTable`，另有 `Deterministic` / `WeightedNearBest` |
| `ScoreTolerance` | `double` | 25，近似最佳集合的绝对分差 |
| `MovementBenefitThreshold` | `double` | 1，同动作原地方案与移动方案的收益阈值 |
| `RepeatedPositionPenalty` | `double` | 1，返回近期实际位置的额外评分成本 |

新模式检查枚举有效性及阈值的非负有限性，无效时抛出 `InvalidOperationException`。

## 决策入口

```csharp
public AIDecision DecideAIAction(
    Character character, DecisionPoints dp, Grid? startGrid,
    List<Grid> allPossibleMoveGrids, List<Skill> availableSkills,
    List<Item> availableItems, List<Character> allEnemysInGame,
    List<Character> allTeammatesInGame, List<Character> selectableEnemys,
    List<Character> selectableTeammates, double pUseItem, double pCastSkill,
    double pNormalAttack, bool isChainAction = false,
    IReadOnlySet<string>? rejectedRules = null)
```

先评估角色绑定策略，取得动作则返回；未命中时按 `SelectionMode` 规划。类别概率不大于 0 时相应类别禁用，策略也不能绕过。`isChainAction` 使用协同预算且禁止移动，`rejectedRules` 跳过当前尝试中执行重验失败的规则。

`SelectChainAction(Character actor)` 返回首个有效申请的 `Guid?`，没有申请时为 null。决策输出字段见 [AIDecision](/api/AIDecision)，队列调用优先级见 [决策表规则](/guide/decision-tables#何时使用)。

## 估值事件

| 事件 | 用途 |
|---|---|
| `EvaluatePlanEvent`（实例） | `Func<DecisionEvaluationContext, DecisionPlan, double?>`；新模式的基础价值覆盖，null 使用内置值 |
| `EvaluateNormalAttackEvent`（静态） | 普攻估值 |
| `EvaluateSkillEvent`（静态） | 指向性技能估值 |
| `EvaluateNonDirectionalSkillEvent`（静态） | 非指向性技能估值 |
| `EvaluateItemEvent`（静态） | 物品估值 |
| `CalculateTargetValueEvent`（静态） | 目标价值修正 |
| `ResolveInquiryEvent`（静态） | 询问答复；null 回退到内置规则 |

回调应只读，多播返回值不自动求和。Legacy 估值可能并行调用；新模式及有序规则单次决策串行。`EvaluatePlanEvent` 作用于新模式默认 AI 的候选评分，不改变规则的优先级或位置偏好排序。

## 诊断与统计

| 属性 / 事件 | 类型 / 含义 |
|---|---|
| `LastPolicyResult` | `DecisionEvaluationResult?`，最近一次策略求值结果 |
| `LastMetrics` | `DecisionMetrics?`，最近一次决策统计 |
| `PolicyEvaluatedEvent` | `Action<Character, DecisionEvaluationResult, DecisionMetrics>`，每次已绑定策略求值后触发，包括协同 |

`DecisionMetrics` 位于 `FunGame.Core.Model.DecisionTable`：

| 属性 | 类型 | 含义 |
|---|---|---|
| `PositionsGenerated` | `int` | 生成的候选位置数 |
| `PositionsEvaluated` | `int` | 完整评估的位置次数 |
| `PlansEvaluated` | `int` | 完整评估的方案数 |
| `CentersGenerated` | `int` | 按位置累计的施法中心候选数 |
| `CentersEvaluated` | `int` | 完整投影与覆盖检查次数，缓存命中不计入 |
| `Elapsed` | `TimeSpan` | 决策耗时 |

指标均只读。事件发生在策略评估后、默认 AI 回退前；若策略未命中，后续回退还可能更新同一个 `LastMetrics` 实例。采集策略命中和当时指标应及时复制字段，不能只保存最后一次引用或只看战斗结束值。
