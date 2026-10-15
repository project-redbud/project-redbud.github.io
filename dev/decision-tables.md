# 编写决策表

决策表配置使用 BCL JSON，既可直接编写，也可通过链式构建器生成。配置、编译策略和角色绑定是三个步骤。规则语义见 [决策表](../guide/decision-tables.md)，接口速查见 [决策表 API](../api/DecisionTable.md)。

也可使用 Testing-v3 的[可视化决策表编辑器](./decision-table-editor.md)编排规则并导出 JSON，再通过下面的 Loader 接入角色。

## JSON 配置

下面的治疗策略先治疗生命比例低于 30% 的合法友方，没有可执行方案时回退到默认 AI。`1001` 是示例技能 ID，需替换为模组中实际提供的治疗技能。

```json
{
  "schemaVersion": 1,
  "id": "example:healer",
  "fallback": "defaultAI",
  "rules": [
    {
      "id": "heal",
      "priority": 100,
      "trigger": "beforeDecision",
      "target": { "relation": "ally", "selector": "lowestHpRatio", "bind": "patient" },
      "when": {
        "all": [
          { "type": "target.hpRatio", "target": "patient", "operator": "lessThan", "value": 0.3 },
          { "type": "skill.available", "skillId": 1001 }
        ]
      },
      "action": { "type": "castSkill", "skillId": 1001, "target": "patient", "movement": "ifNeeded" }
    }
  ]
}
```

JSON 使用 camelCase，未知字段会被拒绝。`schemaVersion` 当前为 1，表 ID 采用 `module:name`。`enabled` 默认 true，`trigger` 默认 `beforeDecision`；省略 `when` 表示无条件，动作仍须合法。

## 链式构建与绑定

下例为现有角色模板绑定同一策略。模板已具备技能，绑定应在队列复制模板之前完成。

```csharp
using FunGame.Core.Api;
using FunGame.Core.Entity;
using FunGame.Core.Model.DecisionTable;

static DecisionTableLoader BindHealer(Character template)
{
    DecisionTableCompiler compiler = new(skills: [1001]);
    DecisionTableConfig config = DecisionTableBuilder.Create("example:healer")
        .AddRule("heal", rule => rule.Priority(100)
            .Target(Targets.Allies("patient"))
            .When(Conditions.All(
                Conditions.TargetHpRatio("patient", "lessThan", 0.3),
                Conditions.SkillAvailable(1001)))
            .Then(Actions.CastSkill(1001, "patient")))
        .Build(compiler);

    DecisionTableLoader loader = new(compiler);
    ThrowIfInvalid(loader.Register(config));
    template.DecisionTableId = config.Id;
    ThrowIfInvalid(loader.Bind(template));
    return loader;
}

static void ThrowIfInvalid(IReadOnlyList<DecisionDiagnostic> diagnostics)
{
    if (diagnostics.Count > 0)
        throw new InvalidOperationException(string.Join("; ", diagnostics.Select(
            diagnostic => $"{diagnostic.Path}: {diagnostic.Message}")));
}
```

`Build` 校验并创建独立配置快照，不绑定角色，也不读写文件。配置不合法时抛出 `ArgumentException`；需要收集错误时使用 `TryBuild`。编译器的技能/物品目录校验资源 ID 是否存在，不验证运行时角色是否已经学会技能；运行时仍从当前角色的可用实例解析。

## 文件导出与加载

```csharp
using FunGame.Core.Api;
using FunGame.Core.Entity;
using FunGame.Core.Model.DecisionTable;

static IReadOnlyList<DecisionDiagnostic> LoadHealer(Character template, string path)
{
    DecisionTableLoader loader = new(new DecisionTableCompiler(skills: [1001]));
    IReadOnlyList<DecisionDiagnostic> diagnostics = loader.Load(path);
    if (diagnostics.Count > 0) return diagnostics;
    template.DecisionTableId = "example:healer";
    return loader.Bind(template);
}

static void ExportTable(DecisionTableConfig config, string path)
{
    DecisionTableGenerator.Save(config, path);
}
```

`Save` 默认拒绝覆盖已有文件，显式传 `overwrite: true` 才覆盖。`Load` 解析、校验、编译并注册一张表，返回带路径的诊断。重复 ID 不会覆盖已有策略；需要替换整套配置时可创建新的 Loader 后重新绑定角色。`GetJson` 可导出文本，`TryParse` 只检查 JSON 格式，语义校验由 Compiler 完成。

`Load` 将文件路径格式、I/O、读取权限和 JSON 格式错误转为诊断；文件读取之外的编程异常继续抛出。文件输入出错不会替换已注册策略。

## 动作字段

| 字段 | 值与用途 |
|---|---|
| `type` | `normalAttack`、`castSkill`、`useItem`、`approach`、`retreat`、`endTurn` |
| `skillId` / `itemId` | 施放技能 / 使用物品所需的资源 ID |
| `target` | 当前规则定义的 `target.bind` |
| `movement` | `never`、`ifNeeded`、`required`；默认 `ifNeeded` |
| `positionPreference` | `current`、`coverage`、`safe`；默认 `current` |
| `bindPlan` | 给当前范围与位置方案命名，供 `plan.*` 条件引用 |
| `maxRisk` | 非负有限风险上限，省略表示不限 |
| `parameters` | 扩展动作的 JSON 参数对象 |

配置动作 `castSkill` 统一映射到普通回合的 `PreCastSkill` 入口，再按技能类型执行战技、吟唱魔法或爆发技。协同申请使用对应动作类型和协同预算，禁止移动。规则不会绕过冷却、DP、配额、资源或宿主的选择列表限制。

`current` 是低移动成本偏好，严格原地行动应使用 `movement: never`。规则中的位置偏好按配置执行；默认 AI 自动区分即时魔法与吟唱魔法的行为见 [AI 规划](./ai-planning.md)。

## 条件字段

`all`、`any`、`not` 与叶节点 `type` 每个节点只能选一种形式。空 `all` 成立，空 `any` 不成立。比较符为 `lessThan`、`atMost`、`equal`、`atLeast`、`greaterThan`，默认 `atLeast`。

| `type` | 引用与含义 |
|---|---|
| `self.hpRatio` | 自身生命比例，`value` 在 0 至 1 |
| `target.hpRatio` | 绑定目标生命比例，`target` 引用目标绑定 |
| `self.mp` / `self.ep` | 当前 MP / EP |
| `self.state` | `CharacterState` 的整数值 |
| `skill.available` | `skillId`；检查当前可用技能、资源、状态、DP 与配额 |
| `decisionPoints` | 当前 DP |
| `target.exists` | `target` 引用已定义的目标绑定 |
| `distance` | 从规划位置到绑定目标的曼哈顿距离；需地图 |
| `plan.targetCount` | `target` 引用 `action.bindPlan`；当前方案合法覆盖数 |
| `plan.risk` | 引用方案绑定；当前站位的近似威胁值，需地图 |
| `parameters` | 扩展条件的 JSON 参数对象 |

例如 `bindPlan: "cluster"` 必须与 `plan.targetCount` 条件的 `target: "cluster"` 一致。绑定不能跨规则引用。`plan.risk` 与 `maxRisk` 在 `current`、`coverage`、`safe` 下均使用实际位置风险，求值风险不额外开启位置搜索。

规则列表不可为 null，允许空表，最多 256 条。条件根节点深度为 0，最多嵌套 16 级；单个 `all` / `any` 最多 64 个直接子条件。JSON 对象和数组的最大深度为 64，包含扩展 `parameters`，与条件语义深度独立。无效数值、未知类型和无效绑定返回配置路径诊断。

## 规则预算

规则共用策略阶段的方案总额度，每条按剩余额度与待规划规则数分配，未用额度顺延。禁用、被拒及内置条件预判不成立的规则不占额度；`endTurn` 不消耗搜索额度但仍检查条件。低额度下，高优先级规则可能只搜索部分候选，后序规则也可能没有额度，应结合 `budget.truncated` / `budget.exhausted` 判断未命中的含义。

表未命中时，`defaultAI` 使用独立预算，策略搜索耗尽不会挤占这份额度。算法和默认数值见 [搜索预算与扩展](./ai-planning.md#搜索预算与扩展)。

## 角色复制与持久化

`Character.DecisionTableId` 保存策略 ID，`DecisionPolicy` 为只读的运行时绑定，通过 `loader.Bind(character)` 设置。更改 ID 会清除旧绑定；ID 为 null 时 Bind 解除绑定，未知 ID 则返回错误并清除旧绑定。

角色复制、`CharacterBuilder` 和模板恢复继承 ID 与可共享的策略。角色 JSON 只保存 ID，不保存编译策略；反序列化后先加载配置，再对角色重新 Bind。如果已经初始化队列，须绑定实际参战角色，而非只修改队列此前复制的模板。

## 扩展与诊断

`DecisionTableRegistry.RegisterCondition` / `RegisterAction` 注册 `module:name` 扩展，配置仅保存标识和 JSON 参数；构建器 lambda 只在构建阶段执行，不导出 C# 委托。编译器复制配置与注册表，扩展回调应只读，不得改变战斗状态。

Registry 重复注册扩展抛出 `ArgumentException`；Loader 重复注册配置或代码策略返回 `id` 诊断。两者均保留已有内容。自定义动作须按上下文额度规划，框架截断超额返回，同一方案实例不重复计费。

也可实现 `IDecisionPolicy` 并用 `loader.Register(id, policy)` 注册代码策略。代码策略无法作为独立 JSON 规则导出；共享实现不得保存角色或战斗的可变状态。

`AIController.PolicyEvaluatedEvent` 提供每次策略评估及当时的独立统计快照，包括协同申请；`LastPolicyResult` 保存最近一次策略结果，`LastPlanningDiagnostics` 和 `LastMetrics` 汇总最近一次完整决策。后续默认 AI 不改写事件快照。诊断代码及指标见 [决策表 API](../api/DecisionTable.md#运行诊断)和 [AIController](../api/AIController.md#诊断与统计)。

完整配置与使用场景见 [BOSS 决策表示例](./decision-table-boss.md)。
