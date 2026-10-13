# 事件绑定与游戏循环

完整的 GamingQueue 使用流程来自 WPF Demo：`GameMapTesting.StartGame()`。

## 第一步：创建队列并绑定事件

事件应在 `InitActionQueue()` **之前** 绑定：

```csharp
// 创建队列
GamingQueue queue = new MixGamingQueue(characters, WriteLine);
// 或 TeamGamingQueue（团队模式）

// ═══ 绑定所有事件（v3.0 起处理器接收单一上下文参数，队列从 ctx.Queue 获取） ═══

// 游戏级
queue.GameStartEvent += (ctx) => { /* 游戏开始 */ };
queue.GameEndEvent += (ctx) => { /* 游戏结束，胜者 ctx.Trigger */ return true; };

// 回合级
queue.TurnStartEvent += Queue_TurnStart;
queue.DecideActionEvent += Queue_DecideAction;
queue.TurnEndEvent += Queue_TurnEnd;

// 选择（交互型——需要 UI 输入）
queue.SelectSkillEvent += Queue_SelectSkill;
queue.SelectItemEvent += Queue_SelectItem;
queue.SelectNormalAttackTargetsEvent += Queue_SelectNormalAttackTargets;
queue.SelectSkillTargetsEvent += Queue_SelectSkillTargets;
queue.SelectNonDirectionalSkillTargetsEvent += Queue_SelectNonDirectionalSkillTargets;
queue.SelectTargetGridEvent += Queue_SelectTargetGrid;

// 状态变更
queue.QueueUpdatedEvent += Queue_QueueUpdated;
queue.CharacterActionTakenEvent += Queue_CharacterActionTaken;
queue.CharacterDecisionCompletedEvent += Queue_DecisionCompleted;
queue.CharacterInquiryEvent += Queue_CharacterInquiry;
queue.CharacterMoveEvent += Queue_CharacterMove;

// 战斗（可选）
queue.DamageToEnemyEvent += (ctx) => { /* 动画：ctx.Trigger 对 ctx.Enemy 造成 ctx.ActualDamage */ };
queue.DeathCalculationEvent += (ctx) => { /* 特效：ctx.Killer 击杀 ctx.Trigger */ return true; };

// 加载地图（可选）
queue.LoadGameMap(gameMap);
```

---

## 第二步：初始化队列

```csharp
// 初始化行动顺序
queue.InitActionQueue();

// 设置 AI 控制（取消 AI = 玩家通过事件决策）
queue.SetCharactersToAIControl(cancel: false, allCharacters);
queue.SetCharactersToAIControl(cancel: true, player);  // 玩家手动控制

// 存引用以便事件处理器访问
queue.CustomData["player"] = player;
```

---

## 第三步：游戏循环

```csharp
while (!queue.GameOver && queue.TotalRound < maxRound)
{
    // NextCharacter 内部推进时间，直到下一个角色可以行动
    Character? characterToAct = queue.NextCharacter();
    if (characterToAct is null) break;
    if (queue.ProcessTurn(characterToAct)) break;
    queue.DisplayQueue();
}
```

---

## 第四步：赛后统计

```csharp
// GamingQueue 自动记录了所有统计数据
foreach (Character character in queue.CharacterStatistics
    .OrderByDescending(d => d.Value.Rating).Select(d => d.Key))
{
    CharacterStatistics stats = queue.CharacterStatistics[character];
    // stats.Kills, stats.Assists, stats.TotalDamage,
    // stats.TotalHeal, stats.DamagePerSecond, stats.Rating...
}
```

---

## AI vs 玩家控制

`SetCharactersToAIControl` 决定角色由谁控制：

| 调用 | 效果 |
|---|---|
| `SetCharactersToAIControl(false, chars)` | chars 由 AI 自动决策 |
| `SetCharactersToAIControl(true, player)` | player 由事件驱动（玩家控制） |

宿主事件优先于内置 AI 回退。AI 控制的角色也可能触发选择事件，例如需要补齐目标时；处理器应按角色与界面状态决定是否交互。玩家控制时，宿主负责返回有效选择。

```csharp
// 示例：事件处理器中判断是否是玩家
private List<Character> Queue_SelectSkillTargets(SelectionContext ctx)
{
    if (ctx.Queue.IsCharacterInAIControlling(ctx.Trigger!)) return [];
    return SyncAwaiter.WaitResult(
        Controller.RequestTargetSelection(ctx.Trigger!, ctx.Skill!,
            ctx.AllEnemys, ctx.AllTeammates, ctx.Enemys, ctx.Teammates));
}
```

---

## 完整游戏流程图

```
StartGame()
  │
  ├─ 创建角色、升级、赋能
  ├─ 创建 GamingQueue
  ├─ 绑定 20+ 个事件
  ├─ LoadGameMap()
  ├─ InitActionQueue()
  ├─ SetCharactersToAIControl()
  │
  └─ while (true)
       │
       ├─ queue.NextCharacter()     → 等待硬直时间归零
       ├─ queue.ProcessTurn(c)      → 触发所有事件
       │    ├─ TurnStartEvent        → UI 更新信息面板
       │    ├─ DecideActionEvent     → UI 显示行动按钮
       │    ├─ SelectSkillEvent       → UI 弹出技能列表
       │    ├─ SelectSkillTargetsEvent → UI 高亮可选目标
       │    ├─ CharacterCastSkillEvent → UI 播放技能动画
       │    ├─ TurnEndEvent           → UI 清理状态
       │    └─ QueueUpdatedEvent      → UI 刷新顺序表
       │
       └─ 回到 NextCharacter()，推进时间并获取下一角色
```
