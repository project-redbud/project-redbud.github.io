# AI 模式与施法规划

角色 [决策表](./decision-tables.md) 优先选择动作；未命中并设置 `defaultAI` 时，才使用这里的默认 AI 模式。无需绑定决策表也能单独使用新模式。默认仍为 `Legacy`。

## 设置模式

为启用 AI 的队列配置控制器，之后加载或更换地图也会保留这些设置：

```csharp
using FunGame.Core.Controller;
using FunGame.Core.Model.DecisionTable;
using FunGame.Core.Model.Queue;

static void ConfigureAI(GamingQueue queue)
{
    AIController ai = queue.AI
        ?? throw new InvalidOperationException("需要先启用队列 AI。");
    ai.SelectionMode = AISelectionMode.Deterministic;
    ai.ScoreTolerance = 25;
    ai.MovementBenefitThreshold = 1;
    ai.RepeatedPositionPenalty = 1;
}
```

| 模式 | 选择方式 |
|---|---|
| `Legacy` | 保留既有候选与随机评分，分数乘类别权重 |
| `Deterministic` | 有界候选规划、稳定估值与排序，不加入随机评分 |
| `WeightedNearBest` | 从与最高分差值不超过 `ScoreTolerance` 的候选中，先按调整后的行动类别权重抽样，再按类别内收益抽样 |

### 控制器生命周期

`queue.AI` 首次访问时创建控制器，换图和关闭再启用均复用同一实例。模式、阈值、实例事件订阅与宿主持有的引用保持有效。

| 操作 | 地图与短期状态 |
|---|---|
| `LoadGameMap` 返回不同地图实例 | 立即更新已有控制器的 `Map`，清空位置历史、`LastPolicyResult`、`LastMetrics` 与 `LastPlanningDiagnostics` |
| 实际地图仍是同一实例 | 保留短期状态 |
| `EnableAI = false` | 队列入口返回 null；清空短期状态，保留内部实例、配置与订阅 |
| 关闭期间加载地图，再启用 | 已有实例立即同步地图；启用后继续使用该实例 |
| 新建队列 | 使用独立控制器、配置、位置历史与随机序号 |

随机决策序号不因换图或开关归零。同种子、同输入及同操作序列可重放；不同局面不要求产生相同行动。直接 `new AIController(queue, map)` 的独立实例保持显式地图绑定，队列换图不会更新它。宿主需同步换图与决策操作。

`WeightedNearBest` 使用队列种子派生随机数；技能数量不会直接放大技能类别的权重。`ScoreTolerance` 是绝对分差，不是百分比。`Deterministic` 不给评分添加随机数，动作执行中的命中、伤害等随机过程仍按游戏规则运行。

## 语义估值

新模式普攻沿用现有伤害估值。技能缺少语义时以合法目标数量作为基础值，并调用对应的既有评估事件；框架不能自动知道自定义技能实际造成多少伤害或有效治疗。

可通过实例事件 `EvaluatePlanEvent` 提供统一价值。下面假设模组中的 `1001` 为治疗最大生命 30% 的技能，用缺失生命限制治疗收益：

```csharp
using FunGame.Core.Controller;

static void AddHealingValue(AIController ai)
{
    ai.EvaluatePlanEvent += (_, plan) => plan.Decision.SkillToUse?.Id == 1001
        ? plan.Decision.Targets.Sum(target =>
            Math.Min(Math.Max(0, target.MaxHP - target.HP), target.MaxHP * 0.3))
        : null;
}
```

返回 null 使用内置估值，返回数值替代本次方案的基础价值；移动与风险扣分随后仍会应用。回调不得修改战斗状态。普通多播委托取最后一个订阅者的返回值，不会自动累加多个评估器，应在一个统一处理器中分派技能语义。

新模式的普攻、物品、即时技能和吟唱技能都按方案的实际位置扣除风险，再扣路径步数与返回近期位置的额外成本。`MovementBenefitThreshold` 会在同一动作/技能/物品存在近似收益原地方案时保留原地行动；`RepeatedPositionPenalty` 降低往返偏好。近期实际位置按控制器及角色对象隔离，不序列化。三个阈值都必须为非负有限数。

规则的 `current`、`coverage`、`safe` 方案均提供实际风险，`plan.risk` 条件与 `maxRisk` 使用同一估计。风险求值本身不额外开启站位搜索：即时技能可以只检查原地，吟唱技能仍可按安全偏好搜索位置。

风险按存活且可行动敌人的移动和最大射程估计威胁数量，射程取普攻与已启用、冷却就绪且可选敌方的技能。它不逐一验证对手资源或完整行动策略，也不预测隐藏效果和队友保护；风险为 0 不保证绝对安全。

Legacy 的既有评估事件可能并行调用，订阅者需线程安全。新模式与有序规则在单次决策内串行评估。

## 地图施法

规则表与两个新模式共用目标驱动的规划器：

- 全图指向性技能复用合法目标组合；全选敌友同样按全图指向性处理，不搜索范围中心。即时魔法默认优先原地，实际吟唱时间大于零的魔法独立评估安全站位。
- 基础圆形、菱形和正方形范围从合法目标位置反推施法中心，合并去重后检查中心射程。敌人之间的空地也能成为落点；有限射程限制中心，但效果可覆盖中心周围、施法射程以外的角色。
- 同一决策中复用射程查询、路径成本、范围投影和目标筛选结果；不会临时移动角色来测量范围。
- 直线、贯穿线、扇形、自定义范围或目标查询、允许空地施法的技能保留完整查询。

当前位置能触及所有目标或范围落点，且无需安全位置、风险限制或强制移动时，可只规划原地。规则含 `distance` 或自定义条件时保留位置搜索。

`AIDecision.CastCenter` 是选择中心/方向参考格，`TargetGrids` 是实际影响格，二者不能互换。协同提交可携带 `castCenter`，队列重验中心射程并重算影响范围，见 [协同接入](./chain-action.md)。

## 搜索预算与扩展

| `DecisionEvaluationContext` 配置 | 默认预算 |
|---|---|
| `PositionBudget` | 每动作完整评估 32 个位置 |
| `CenterBudget` | 每位置 64 个施法中心 |
| `PlanBudget` | 当前规划范围的方案上限，默认 4096；策略与新模式默认 AI 分阶段独立使用 |

普通搜索的当前位置也占位置预算，强制移动除外。预算可在自行创建的上下文中配置；它们不是 `AIController` 的可写属性。

策略按优先级和同级配置顺序匹配。禁用、当前尝试中重验失败及内置条件可预判为 false 的规则不占方案额度；自定义条件不参与预判。剩余额度为 R、待规划规则数为 N 时，本条最多使用 `ceil(R / N)`，未用额度顺延，命中立即返回。`endTurn` 不消耗搜索额度，但仍检查条件。总额度小于规则数时，后序规则仍可能没有规划机会。

策略未命中后，`defaultAI` 获得独立完整阶段额度。两个新模式在普攻、可用技能和物品间分配这份额度；地图普通行动在总额至少为 2 时预留一个纯移动兜底方案。默认配置下，两阶段合计最多保留 8192 个方案；位置与中心预算分别约束各次动作规划。Legacy 保留既有候选与随机评分，不使用新模式的动作额度分配。

自定义动作读取传入上下文的 `PlanBudget`，返回超额集合会被截断；扩展内部调用内置规划器时，同一 `DecisionPlan` 实例不重复计费。扩展回调自身耗时不受候选数量上限保证。

射程、路径、敌方威胁、范围投影和位置风险缓存仅在一次决策中复用，规则与回退共享只读查询结果，预算分别结算。实际风险查询可能增加首次规划成本，不能仅凭候选减少推断耗时不变。有界搜索可能漏掉更好的方案，有限射程仍有路径搜索成本。

派生地图应重写 `GetMovementCosts`，并与 `CharacterMove` 使用同一套移动规则；基础实现沿用八方向路径搜索，MOV 候选仍按现有曼哈顿范围生成。自定义技能需同时实现假设起点查询 `SelectNonDirectionalTargetsFrom` / `SelectTargetsByRangeFrom`，以正确评估尚未移动的站位。

`LastPlanningDiagnostics` 汇总策略与默认规划诊断，区分预算耗尽、截断和无法执行；`LastMetrics` 记录完整决策的阶段计数、风险计算与缓存命中、位置、方案、中心和耗时。`PolicyEvaluatedEvent` 交付策略评估结束时的独立统计快照，后续默认 AI 不会改写它。`CentersGenerated` 按位置累计，`CentersEvaluated` 仅统计完整投影和覆盖检查，缓存命中不会增加它。指标用于分析具体夹具，不应把某次测量当作普遍性能保证。

接口与事件签名见 [AIController](../api/AIController.md)，决策输出见 [AIDecision](../api/AIDecision.md)。
