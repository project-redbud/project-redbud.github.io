# WPF Demo 实战：完整的游戏循环

`FunGame.Testing/Desktop/GameMapTesting` 是一个 WPF 实现的完整回合制演示，展示了 GamingQueue 所有事件的 UI 绑定模式。

## 项目结构

| 文件 | 职责 |
|---|---|
| `GameMapTesting.cs` | 游戏逻辑核心：创建队列、绑定事件、游戏循环 |
| `GameMapController.cs` | 桥接层：将事件请求转发到 UI，管理 UserInputRequester |
| `GameMapViewer.xaml.cs` | UI 层：WPF 地图渲染、选择界面、日志输出 |
| `SyncAwaiter.cs` | 同步等待异步 Task 的工具类 |
| `TestMap.cs` | 测试用地图 |
| `ViewModels.cs` | WPF 数据绑定模型 |
| `Converters.cs` | WPF 值转换器 |

---

## 事件绑定总览（WPF Demo 的生产级写法）

```csharp
// === 回合生命周期 ===
queue.TurnStartEvent += Queue_TurnStart;
queue.DecideActionEvent += Queue_DecideAction;
queue.TurnEndEvent += Queue_TurnEnd;

// === 交互式选择（玩家控制时触发）===
queue.SelectSkillEvent += Queue_SelectSkill;
queue.SelectItemEvent += Queue_SelectItem;
queue.SelectNormalAttackTargetsEvent += Queue_SelectNormalAttackTargets;
queue.SelectSkillTargetsEvent += Queue_SelectSkillTargets;
queue.SelectNonDirectionalSkillTargetsEvent += Queue_SelectNonDirectionalSkillTargets;
queue.SelectTargetGridEvent += Queue_SelectTargetGrid;
queue.CharacterInquiryEvent += Queue_CharacterInquiry;

// === 状态同步 ===
queue.QueueUpdatedEvent += Queue_QueueUpdated;
queue.CharacterActionTakenEvent += Queue_CharacterActionTaken;
queue.CharacterMoveEvent += Queue_CharacterMove;
```

每个事件处理器的核心模式相同：

```
事件触发 → 判断 AI/玩家 → SyncAwaiter.WaitResult(Controller.RequestXxx()) → UI 交互 → 返回结果
```

---

## 各事件处理详解

### TurnStart — 回合开始

```csharp
private bool Queue_TurnStart(GamingQueue queue, Character character,
    DecisionPoints dp, List<Character> enemys, List<Character> teammates,
    List<Skill> skills, List<Item> items)
{
    // 更新 UI 底部信息面板（决策点、技能列表、物品列表）
    SyncAwaiter.Wait(Controller.UpdateBottomInfoPanel(dp));
    return true;  // true = 继续，false = 取消回合
}
```

### DecideAction — 选择行动类型

```csharp
private CharacterActionType Queue_DecideAction(GamingQueue queue,
    Character character, DecisionPoints dp, ...)
{
    if (!IsPlayer_OnlyTest(queue, character))
        return CharacterActionType.None;  // AI 不进入此分支

    // 请求 UI 显示行动按钮
    return SyncAwaiter.WaitResult(
        Controller.RequestActionType(character, items));
}
```

### SelectSkill — 选择技能

```csharp
private Skill? Queue_SelectSkill(GamingQueue queue, Character character,
    List<Skill> skills)
{
    if (!IsPlayer_OnlyTest(queue, character)) return null;

    Skill? skill = SyncAwaiter.WaitResult(
        Controller.RequestSkillSelection(character, skills));
    SyncAwaiter.Wait(Controller.ResolveSkillSelection(skill));
    return availableSkills.Any(s => s == skill) ? skill : null;
}
```

### SelectNormalAttackTargets — 选择普攻目标

```csharp
private List<Character> Queue_SelectNormalAttackTargets(
    GamingQueue queue, Character character, NormalAttack attack,
    List<Character> allEnemys, List<Character> allTeammates,
    List<Character> enemys, List<Character> teammates,
    List<Grid> attackRange)
{
    if (!IsPlayer_OnlyTest(queue, character)) return [];

    List<Character> targets = SyncAwaiter.WaitResult(
        Controller.RequestTargetSelection(
            character, attack, allEnemys, allTeammates,
            enemys, teammates, attackRange));
    SyncAwaiter.Wait(Controller.ResolveTargetSelection(targets));
    return targets ?? [];
}
```

### SelectSkillTargets — 选择指向性技能目标

```csharp
private List<Character> Queue_SelectSkillTargets(
    GamingQueue queue, Character caster, Skill skill,
    List<Character> allEnemys, List<Character> allTeammates,
    List<Character> enemys, List<Character> teammates,
    List<Grid> castRange)
{
    if (!IsPlayer_OnlyTest(queue, caster)) return [];

    List<Character> targets = SyncAwaiter.WaitResult(
        Controller.RequestTargetSelection(
            caster, skill, allEnemys, allTeammates,
            enemys, teammates, castRange));
    SyncAwaiter.Wait(Controller.ResolveTargetSelection(targets));
    return targets ?? [];
}
```

### SelectNonDirectionalSkillTargets — 选择非指向性目标（格子）

```csharp
private List<Grid> Queue_SelectNonDirectionalSkillTargets(
    GamingQueue queue, Character caster, Skill skill,
    List<Character> enemys, List<Character> teammates,
    List<Grid> castRange)
{
    if (!IsPlayer_OnlyTest(queue, caster)) return [];

    if (queue.Map == null) return [];

    Grid current = queue.CustomData["currentGrid"] as Grid ?? Grid.Empty;
    if (current == Grid.Empty) return [];

    List<Grid> targets = SyncAwaiter.WaitResult(
        Controller.RequestTargetGridsSelection(
            caster, skill, enemys, teammates, current, castRange));
    SyncAwaiter.Wait(Controller.ResolveTargetGridsSelection(targets));
    return targets ?? [];
}
```

### SelectTargetGrid — 选择移动目标

```csharp
private Grid Queue_SelectTargetGrid(GamingQueue queue,
    Character character, List<Character> enemys,
    List<Character> teammates, GameMap map, List<Grid> moveRange)
{
    if (!IsPlayer_OnlyTest(queue, character)) return Grid.Empty;

    Grid current = queue.CustomData["currentGrid"] as Grid ?? Grid.Empty;
    if (current == Grid.Empty) return current;

    Grid? target = SyncAwaiter.WaitResult(
        Controller.RequestTargetGridSelection(
            character, current, map.GetGridsByRange(current, character.MOV)));
    SyncAwaiter.Wait(Controller.ResolveTargetGridSelection(target));
    return target ?? Grid.Empty;
}
```

### CharacterInquiry — 询问玩家

```csharp
private InquiryResponse Queue_CharacterInquiry(
    GamingQueue queue, Character character,
    DecisionPoints dp, InquiryOptions options)
{
    if (!IsPlayer_OnlyTest(queue, character))
        return new(options);  // AI 默认响应

    return SyncAwaiter.WaitResult(
        Controller.RequestInquiryResponseSelection(options));
}
```

### QueueUpdated — 顺序表更新

```csharp
private void Queue_QueueUpdated(GamingQueue queue,
    List<Character> characters, Character character,
    DecisionPoints dp, double hardnessTime,
    QueueUpdatedReason reason, string msg)
{
    // 只在非行动原因时更新（避免频繁刷新）
    if (reason != QueueUpdatedReason.Action)
    {
        SyncAwaiter.Wait(Controller.UpdateQueue(dp));
    }
}
```

### CharacterActionTaken / CharacterMove — 地图同步

```csharp
private void Queue_CharacterActionTaken(GamingQueue queue,
    Character actor, DecisionPoints dp,
    CharacterActionType type, RoundRecord record)
{
    SyncAwaiter.Wait(Controller.UpdateCharacterPositionsOnMap());
}

private void Queue_CharacterMove(GamingQueue queue,
    Character actor, DecisionPoints dp, Grid grid)
{
    SyncAwaiter.Wait(Controller.UpdateCharacterPositionsOnMap());
}
```

---

## Controller 层的 UserInputRequester 实例

```csharp
public class GameMapController
{
    // 每种输入类型一个独立的请求器
    private readonly UserInputRequester<Character> _characterSelectionRequester = new();
    private readonly UserInputRequester<InquiryResponse> _inquiryResponseRequester = new();
    private readonly UserInputRequester<Grid> _targetGridSelectionRequester = new();
    private readonly UserInputRequester<CharacterActionType> _actionTypeRequester = new();
    private readonly UserInputRequester<List<Character>> _targetSelectionRequester = new();
    private readonly UserInputRequester<List<Grid>> _targetGridsSelectionRequester = new();
    private readonly UserInputRequester<Skill> _skillSelectionRequester = new();
    private readonly UserInputRequester<Item> _itemSelectionRequester = new();
    private readonly UserInputRequester<bool> _continuePromptRequester = new();
}
```

---

## 模式总结

| 模式 | 说明 |
|---|---|
| **单向通知** | `TurnEndEvent`、`DamageToEnemyEvent` 等 → `SyncAwaiter.Wait(Controller.DoSomething())` |
| **交互选择** | `SelectSkillEvent` 等 → `SyncAwaiter.WaitResult(Controller.RequestXxx())` 阻塞等待用户输入 |
| **AI 分流** | 每个选择型事件开头检查 `IsPlayer_OnlyTest()` → AI 控制时直接跳过 UI |
| **双 Resolve** | 事件处理器调 `Request` + `Resolve`（请求 UI 弹出 + 清理 UI 状态） |
| **CustomData 传参** | `queue.CustomData["currentGrid"]` 在事件间传递状态 |
