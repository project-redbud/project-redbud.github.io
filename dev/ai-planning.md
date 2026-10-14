# AI 模式与施法规划

角色 [决策表](/dev/decision-tables) 优先选择动作；未命中并设置 `defaultAI` 时，才使用这里的默认 AI 模式。无需绑定决策表也能单独使用新模式。默认仍为 `Legacy`。

## 设置模式

为已加载最终地图且启用 AI 的队列配置控制器：

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

队列更换地图会自动重建控制器，因此应在加载地图后设置模式、阈值并绑定实例事件。

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

新模式评分扣除路径步数成本、位置风险及返回近期位置的额外成本。`MovementBenefitThreshold` 会在同一动作/技能/物品存在近似收益原地方案时保留原地行动；`RepeatedPositionPenalty` 降低往返偏好。近期实际位置按控制器及角色对象隔离，不序列化。三个阈值都必须为非负有限数。

Legacy 的既有评估事件可能并行调用，订阅者需线程安全。新模式与有序规则在单次决策内串行评估。

## 地图施法

规则表与两个新模式共用目标驱动的规划器：

- 全图指向性技能复用目标组合；即时魔法默认优先原地，实际吟唱时间大于零的魔法独立评估安全站位。
- 基础圆形、菱形和正方形范围从合法目标位置反推施法中心，合并去重后检查中心射程。敌人之间的空地也能成为落点；有限射程限制中心，但效果可覆盖中心周围、施法射程以外的角色。
- 同一决策中复用射程查询、路径成本、范围投影和目标筛选结果；不会临时移动角色来测量范围。
- 直线、贯穿线、扇形、自定义范围或目标查询、允许空地施法的技能保留完整查询。

当前位置能触及所有目标或范围落点，且无需安全位置、风险限制或强制移动时，可只规划原地。规则含 `distance` 或自定义条件时保留位置搜索。

`AIDecision.CastCenter` 是选择中心/方向参考格，`TargetGrids` 是实际影响格，二者不能互换。协同提交可携带 `castCenter`，队列重验中心射程并重算影响范围，见 [协同接入](/dev/chain-action)。

## 搜索预算与扩展

| `DecisionEvaluationContext` 配置 | 默认预算 |
|---|---|
| `PositionBudget` | 每动作完整评估 32 个位置 |
| `CenterBudget` | 每位置 64 个施法中心 |
| `PlanBudget` | 整次决策最多保留 4096 个方案 |

普通搜索的当前位置也占预算，强制移动除外。预算可在自行创建的上下文中配置；它们不是 `AIController` 的可写属性。有界搜索可能漏掉更好的方案，优化不代表所有地图场景都稳定加速，有限射程仍有路径搜索成本。

派生地图应重写 `GetMovementCosts`，并与 `CharacterMove` 使用同一套移动规则；基础实现沿用八方向路径搜索，MOV 候选仍按现有曼哈顿范围生成。自定义技能需同时实现假设起点查询 `SelectNonDirectionalTargetsFrom` / `SelectTargetsByRangeFrom`，以正确评估尚未移动的站位。

`LastMetrics` 记录位置、方案、中心与耗时；`CentersGenerated` 按位置累计，`CentersEvaluated` 仅统计完整投影和覆盖检查，缓存命中不会增加它。指标用于分析具体夹具，不应把某次测量当作普遍性能保证。

接口与事件签名见 [AIController](/api/AIController)，决策输出见 [AIDecision](/api/AIDecision)。
