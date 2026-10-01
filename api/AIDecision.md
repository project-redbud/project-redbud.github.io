# AIDecision

AI 决策数据，位于 `FunGame.Core.Model.Framework`。由 `AIController.DecideAIAction()` 返回，描述 AI 角色的完整行动方案。

## 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `ActionType` | `CharacterActionType` | 决策的行动类型（默认 `EndTurn`） |
| `TargetMoveGrid` | `Grid?` | 目标移动格子 |
| `SkillToUse` | `ISkill?` | 要使用的技能 |
| `ItemToUse` | `Item?` | 要使用的物品 |
| `Targets` | `List<Character>` | 目标角色列表 |
| `TargetGrids` | `List<Grid>` | 目标格子列表（非指向性技能） |
| `Score` | `double` | 决策评分 |
| `ProbabilityWeight` | `double` | 概率权重 |
| `IsPureMove` | `bool` | 是否纯移动行动 |
| `HasCandidate` | `bool` | AI 是否评估出了可行行动；false 表示只有 EndTurn 占位，宿主应回退到事件与概率决策 |

## 确定性

AI 决策完全由 `GamingQueue.Seed` 驱动，同种子 + 同局面下决策序列可复现：

- 每个候选移动格使用独立的随机源，由 `Seed` + 决策评估序号 + 格子标识（FNV 哈希）派生，结果不依赖并行任务的调度顺序
- 候选决策同分时按「行动类型 → 移动格 → 技能 → 物品 → 目标数」的固定次级排序决胜（`ConcurrentBag` 枚举顺序不确定，必须显式 tie-break）
- 目标选择的随机排序以角色 `Guid` 兜底，保证结果确定

配合 [RoundRecord.Seed](/api/RoundRecord#回合信息) 的逐回合持久化，可用同一份种子复现整局（含 AI 行为）。

## 使用示例

```csharp
// AIController 决策（AIController 在 FunGame.Core.Controller 命名空间）
// v3.0+：map 可空（支持非战棋模式）；startGrid 可空
AIDecision decision = aiController.DecideAIAction(
    character, dp, startGrid, allPossibleMoveGrids, skills, items, ...);

// AI 决策顺序（GamingQueue 内部）：模组 DecideActionEvent 优先 → AI 控制器 → 概率决策
// 仅当 decision.HasCandidate 时才采纳 AI 结果

if (decision.ActionType == CharacterActionType.Move)
{
    // 执行移动
    map.CharacterMove(character, startGrid, decision.TargetMoveGrid);
}
```

## 关联

- AI 控制器 → [GamingQueue API](/api/GamingQueue)
- AI 决策事件 → [GamingQueue 事件模式](/dev/events-overview)
