# 完整 BOSS 决策表

此配置与 Core #198 的五规则 BOSS 回归夹具一致。它演示按优先级选择治疗、范围压制、追击、安全吟唱与普攻。可[下载 JSON](/examples/boss-decision-table.json)，再用 [DecisionTableLoader](../api/DecisionTable.md#加载与绑定) 加载。

## 所需技能

JSON 不会创建技能或技能效果，角色必须已有下列技能，ID 可按自己的模组修改：

| ID | 夹具中的技能 |
|---|---|
| `9001` | 自身恢复战技 |
| `9002` | 攻击敌方的范围战技 |
| `9003` | 指向性攻击战技 |
| `9004` | 攻击敌方的范围魔法，吟唱时间 3 |

夹具设置技能射程 3、范围半径 1、范围目标上限 3、硬直 5、冷却 10，EP / MP 成本为 5。这些属于测试技能实现，不是 JSON 配置字段，也不是框架默认值。实际效果可参考 [BossBattleFixture 源码](https://github.com/project-redbud/FunGame-Core/blob/1f755dd/tests/FunGame.Core.Tests.Queue/BossBattleFixture.cs)。

## 规则顺序

| 优先级 | 规则 | 何时执行 |
|---|---|---|
| 100 | `emergency-recover` | 自身生命低于 30%，原地使用恢复战技 |
| 90 | `pressure-cluster` | 范围方案覆盖至少 2 个合法目标，优先更多覆盖 |
| 80 | `focus-wounded` | 对生命比例低于 25% 的合法敌人使用追击战技 |
| 70 | `safe-channel` | 自身生命至少 40%、覆盖至少 1 个目标、方案风险为 0 时吟唱 |
| 60 | `basic-pressure` | 按生命比例排序尝试合法普攻目标 |

高优先级规则无法执行就继续尝试下一条。无地图时 `plan.risk` 不匹配，因此安全吟唱规则被跳过；协同时不移动，需原地满足射程及覆盖。全部未命中时回退到默认 AI。

## JSON

<<< @/public/examples/boss-decision-table.json{json}

## 加载角色模板

```csharp
using FunGame.Core.Api;
using FunGame.Core.Entity;
using FunGame.Core.Model.DecisionTable;

static void BindBoss(Character template, string path)
{
    DecisionTableLoader loader = new(new DecisionTableCompiler(
        skills: [9001, 9002, 9003, 9004]));
    IReadOnlyList<DecisionDiagnostic> diagnostics = loader.Load(path);
    if (diagnostics.Count == 0)
    {
        template.DecisionTableId = "example:boss";
        diagnostics = loader.Bind(template);
    }
    if (diagnostics.Count > 0)
        throw new InvalidOperationException(string.Join("; ", diagnostics.Select(
            diagnostic => $"{diagnostic.Path}: {diagnostic.Message}")));
}
```

在队列初始化并复制模板前绑定；已创建参战实例时对实际实例 Bind。策略 ID 会随角色 JSON 保存，读回后须重新绑定。默认 AI 的回退模式独立配置，见 [AI 模式与施法规划](./ai-planning.md)。
