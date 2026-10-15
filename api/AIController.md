# AIController

AI 控制器位于 `FunGame.Core.Controller`。通常使用启用 AI 的 `GamingQueue.AI`，由队列派发普通行动与协同申请。模式和估值说明见 [AI 规划](../dev/ai-planning.md)。

队列首次访问 `AI` 时创建控制器。换图、关闭再启用均复用同一实例，保留模式、阈值和实例事件订阅；换成不同地图实例或关闭 AI 时清空位置历史与最近诊断、统计。关闭期间加载地图也会同步已有实例，随机决策序号不重置。完整操作语义见 [控制器生命周期](../dev/ai-planning.md#控制器生命周期)。

直接构造的独立控制器保持显式地图绑定，不随队列换图自动更新。宿主需同步换图与决策操作。

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

队列自动生成申请时只求值由 AI 控制的协作方，使用其自己的局面与策略；当前行动者可以是手动玩家。申请收集发生在行动类型选择前，确认仍由当前行动者决定。

`SelectChainAction(Character actor)` 返回首个有效申请的 `Guid?`，没有申请时为 null。决策输出字段见 [AIDecision](./AIDecision.md)，队列调用优先级见 [决策表规则](../guide/decision-tables.md#何时使用)。

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
| `LastPlanningDiagnostics` | `IReadOnlyList<DecisionDiagnostic>`，最近一次决策的策略与默认 AI 规划诊断 |
| `PolicyEvaluatedEvent` | `Action<Character, DecisionEvaluationResult, DecisionMetrics>`，每次已绑定策略求值后触发，包括协同 |

`DecisionMetrics` 位于 `FunGame.Core.Model.DecisionTable`：

| 属性 | 类型 | 含义 |
|---|---|---|
| `PositionsGenerated` | `int` | 生成的候选位置数 |
| `PositionsEvaluated` | `int` | 完整评估的位置次数 |
| `PlansEvaluated` | `int` | 已生成并保留的候选方案数，不含常量结束回合 |
| `PolicyPlansEvaluated` | `int` | 策略阶段保留的方案数 |
| `DefaultAIPlansEvaluated` | `int` | 默认 AI 阶段保留的方案数 |
| `BudgetTruncations` | `int` | 因位置、中心或方案上限截断的预算范围数，每个范围至多计一次 |
| `BudgetExhaustions` | `int` | 因没有方案额度而跳过规划的次数 |
| `RiskEvaluations` | `int` | 实际计算位置风险的次数 |
| `RiskCacheHits` | `int` | 命中位置风险缓存的次数 |
| `CentersGenerated` | `int` | 按位置累计的施法中心候选数 |
| `CentersEvaluated` | `int` | 完整投影与覆盖检查次数，缓存命中不计入 |
| `Elapsed` | `TimeSpan` | 决策耗时 |

指标对调用方只读。事件发生在策略评估后、默认 AI 回退前，交付当时的独立统计快照；后续回退不会修改该快照。`LastMetrics` 在决策完成后包含两个阶段的汇总。预算分配见 [搜索预算与扩展](../dev/ai-planning.md#搜索预算与扩展)，诊断代码见 [运行诊断](./DecisionTable.md#运行诊断)。
