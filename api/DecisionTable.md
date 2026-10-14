# 决策表 API

配置与运行时模型位于 `FunGame.Core.Model.DecisionTable`，解析、构建、编译与加载入口位于 `FunGame.Core.Api`，代码策略接口位于 `FunGame.Core.Interface`。使用流程见 [编写决策表](/dev/decision-tables)。

## 配置模型

| 类型 | 属性 |
|---|---|
| `DecisionTableConfig` | `SchemaVersion = 1`、`Id`、`Fallback = "defaultAI"`、`Rules` |
| `DecisionRuleConfig` | `Id`、`Enabled = true`、`Priority`、`Trigger = "beforeDecision"`、`Target?`、`When?`、`Action` |
| `TargetSelectorConfig` | `Relation = "enemy"`、`Selector = "lowestHpRatio"`、`Bind = "target"` |
| `ConditionConfig` | `Type`、`All?`、`Any?`、`Not?`、`Target?`、`SkillId?`、`Operator = "atLeast"`、`Value`、`Parameters` |
| `ActionConfig` | `Type`、`SkillId?`、`ItemId?`、`Target?`、`Movement = "ifNeeded"`、`PositionPreference = "current"`、`BindPlan?`、`MaxRisk?`、`Parameters` |
| `DecisionDiagnostic` | 记录类型 `(string Path, string Message)` |

`SkillId` / `ItemId` 为 `long?`，`Value` 为 `double`，`MaxRisk` 为 `double?`，扩展 `Parameters` 为 `Dictionary<string, JsonElement>`。完整字段值与条件语义见 [配置指南](/dev/decision-tables#动作字段)。

## 解析与生成

| 方法 | 返回值 / 行为 |
|---|---|
| `DecisionTableParser.Parse(string json)` | `DecisionTableConfig`；格式错误抛出 `JsonException` |
| `DecisionTableParser.TryParse(string json, out DecisionTableConfig? config, out IReadOnlyList<DecisionDiagnostic> diagnostics)` | `bool`；返回格式诊断，语义仍需 Validate |
| `DecisionTableGenerator.GetJson(DecisionTableConfig config)` | `string`，camelCase JSON |
| `DecisionTableGenerator.Save(DecisionTableConfig config, string path, bool overwrite = false)` | 写入 UTF-8 文件，默认拒绝覆盖 |

Parser 拒绝未知字段；Generator 不代替 Compiler 校验配置。

## 构建与编译

| 入口 | 返回值 / 用途 |
|---|---|
| `DecisionTableBuilder.Create(string id)` | 创建构建器 |
| `WithSchemaVersion(int version)` / `WithFallback(string mode)` | 链式配置 |
| `AddRule(string id, Action<DecisionRuleBuilder> configure)` | 构建时配置规则 |
| `Build(DecisionTableCompiler? compiler = null)` | 经校验的配置快照，无效时抛出 `ArgumentException` |
| `TryBuild(out DecisionTableConfig? config, out IReadOnlyList<DecisionDiagnostic> diagnostics, DecisionTableCompiler? compiler = null)` | `bool`，失败返回诊断 |
| `new DecisionTableCompiler(DecisionTableRegistry? registry = null, IEnumerable<long>? skills = null, IEnumerable<long>? items = null)` | 可选扩展注册表与资源 ID 目录 |
| `Validate(DecisionTableConfig config)` | `IReadOnlyList<DecisionDiagnostic>` |
| `Compile(DecisionTableConfig config)` | `IDecisionPolicy`，无效时抛出 `ArgumentException`；独立配置与注册表快照 |

`DecisionRuleBuilder` 提供 `Priority`、`Enabled`、`On`、`Target`、`When`、`Then`。辅助入口 `Conditions.All/Any/Not/SelfHpRatio/TargetHpRatio/SkillAvailable/Compare`、`Targets.Self/Allies/Enemies`、`Actions.CastSkill/NormalAttack/UseItem/EndTurn` 均返回配置对象；其他动作可直接构建 `ActionConfig`。

## 加载与绑定

```csharp
public sealed class DecisionTableLoader(DecisionTableCompiler? compiler = null)
```

| 方法 | 返回值 / 用途 |
|---|---|
| `Register(DecisionTableConfig config)` | 诊断列表；校验、编译、注册，不覆盖重复 ID |
| `Register(string id, IDecisionPolicy policy)` | 诊断列表；注册代码策略，不覆盖重复 ID |
| `Load(string path)` | 诊断列表；读取一个 JSON 文件并注册 |
| `Get(string id)` | `IDecisionPolicy?`，找不到时为 null |
| `Bind(Character character)` | 诊断列表；按 `DecisionTableId` 绑定，无 ID 解除，未知 ID 清除绑定并报错 |

配置策略可共享，角色 JSON 仅保存 ID。角色属性与生命周期见 [Character](/api/Character#决策策略)。

## 代码策略与扩展

```csharp
public interface IDecisionPolicy
{
    DecisionEvaluationResult Evaluate(DecisionEvaluationContext context);
}
```

`DecisionTableRegistry.RegisterCondition(string id, Func<DecisionEvaluationContext, ConditionConfig, DecisionPlan, bool> evaluate)` 注册只读条件；`RegisterAction(string id, Func<DecisionEvaluationContext, ActionConfig, TargetSelectorConfig?, IReadOnlyList<DecisionPlan>> plan)` 注册只读规划器。扩展 ID 使用 `module:name`，不能重复注册。

`FunGame.Core.Controller.DecisionActionPlanner.Plan(DecisionEvaluationContext context, ActionConfig action, TargetSelectorConfig? selector)` 返回 `IReadOnlyList<DecisionPlan>`，按当前局面生成合法候选。

## 求值上下文与结果

| 类型 / 属性 | 说明 |
|---|---|
| `DecisionEvaluationContext.Queue / Actor / Points` | 必需初始化的 `GamingQueue`、`Character`、`DecisionPoints` |
| `TurnOrigin` / `MoveGrids` | 回合移动原点与候选位置 |
| `Skills / Items` | 当前角色可用实例 |
| `Enemies / Allies / SelectableEnemies / SelectableAllies` | 全部与可选角色集合 |
| `IsChainAction` | 原地协同求值 |
| `AllowItem / AllowSkill / AllowAttack` | 类别是否允许，默认 true |
| `PositionBudget / CenterBudget / PlanBudget` | 默认 32 / 64 / 4096 |
| `RejectedRules` | 本次行动尝试已失效的规则 ID 集合 |
| `RecentPositions` | 近期实际离开的格子 ID |
| `Metrics` | 只读 `DecisionMetrics` 实例 |
| `DecisionPlan.Decision` | 必需初始化的 `AIDecision` |
| `Target / Center / SelectedGrids` | 当前方案绑定目标、中心与覆盖格 |
| `TargetCount / Risk / MoveSteps` | 合法角色数、近似风险、路径步数 |

上下文配置为 `init` 属性，评估期间不得修改引用的战斗对象。`DecisionPlan.TargetCount` 来自 `Decision.Targets.Count`。

`DecisionEvaluationResult` 是 `(AIDecision? Decision, string? RuleId, IReadOnlyList<DecisionDiagnostic> Diagnostics)`，`Matched` 表示 `Decision != null`；回退 `endTurn` 也属于有效决策，可没有命中规则 ID。指标见 [AIController](/api/AIController#诊断与统计)。
