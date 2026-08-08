# AIDecision

AI 决策数据，位于 `Milimoe.FunGame.Core.Model.Framework`。由 `AIController.DecideAIAction()` 返回，描述 AI 角色的完整行动方案。

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

## 使用示例

```csharp
// AIController 决策（AIController 在 FunGame.Core.Controller 命名空间）
AIDecision decision = aiController.DecideAIAction(
    character, dp, startGrid, allPossibleMoveGrids, skills, items, ...);

if (decision.ActionType == CharacterActionType.Move)
{
    // 执行移动
    map.CharacterMove(character, startGrid, decision.TargetMoveGrid);
}
```

## 关联

- AI 控制器 → [GamingQueue API](/api/GamingQueue)
- AI 决策事件 → [GamingQueue 事件模式](/dev/events-overview)
