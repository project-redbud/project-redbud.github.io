# 交互式事件：同步等待 UI 输入

选择型事件（`SelectSkillEvent`、`SelectSkillTargetsEvent` 等）在同步方法中被调用，但 UI 输入是异步的。FunGame 使用两个关键模式来解决这个问题。

---

## SyncAwaiter：同步等待异步 Task

`SyncAwaiter` 使用 `ManualResetEventSlim` 在同步上下文中安全等待 Task 完成，避免死锁。

```csharp
public static class SyncAwaiter
{
    /// <summary>
    /// 在同步方法中安全等待一个 Task 完成并获取结果
    /// </summary>
    public static T WaitResult<T>(Task<T> task)
    {
        if (task.IsCompleted) return task.Result;

        using ManualResetEventSlim mres = new(false);
        task.ContinueWith(_ => mres.Set(), TaskScheduler.Default);
        mres.Wait();      // 阻塞当前线程直到 task 完成
        return task.Result; // 安全访问（不会死锁）
    }

    /// <summary>
    /// 无返回值版本
    /// </summary>
    public static void Wait(Task task)
    {
        if (task.IsCompleted) return;
        using ManualResetEventSlim mres = new(false);
        task.ContinueWith(_ => mres.Set(), TaskScheduler.Default);
        mres.Wait();
    }
}
```

### 为什么不用 `.Result` 直接访问？

在 WPF/WinForms 的同步上下文中，直接访问 `task.Result` 会导致**死锁**——因为 `await` 需要回到 UI 线程，但 UI 线程被 `.Result` 阻塞了。`ManualResetEventSlim` 在线程池上等待，不会占用 UI 线程。

---

## UserInputRequester\<T\>：通用的异步输入请求器

```csharp
/// <summary>
/// 管理异步用户输入请求的辅助类
/// </summary>
public class UserInputRequester<T>
{
    private TaskCompletionSource<T?>? _tcs;

    /// <summary>
    /// 请求用户输入，阻塞直到 UI 返回
    /// </summary>
    public async Task<T?> RequestInput(Action<Action<T?>> uiPromptAction)
    {
        _tcs = new TaskCompletionSource<T?>();
        // 将 ResolveInput 作为回调传给 UI
        uiPromptAction(ResolveInput);
        return await _tcs.Task;
    }

    /// <summary>
    /// UI 调用此方法返回结果
    /// </summary>
    public void ResolveInput(T? result)
    {
        _tcs?.TrySetResult(result);
        _tcs = null;
    }
}
```

### 工作流程

```
事件处理器（同步）                        UI 线程（异步）
     │                                       │
     ├─ RequestInput(uiAction) ──────────→   │
     │  (创建 TaskCompletionSource)          │
     │  (调用 uiAction，传入 ResolveInput)    │
     │                                       ├─ 显示选择界面
     │  [阻塞在 WaitResult()]                 │
     │                                       ├─ 用户点击确定
     │                                       ├─ 调用 ResolveInput(result)
     │  ←─── Task 完成 ────────────────────  │
     │                                       ├─ 隐藏选择界面
     ├─ 返回 result                           │
```

---

## 完整示例：选择技能目标

### 事件处理器（同步上下文）

```csharp
private List<Character> Queue_SelectSkillTargets(
    GamingQueue queue, Character caster, Skill skill,
    List<Character> allEnemys, List<Character> allTeammates,
    List<Character> enemys, List<Character> teammates,
    List<Grid> castRange)
{
    // 事件处理器是同步的，但 UI 是异步的
    // 使用 SyncAwaiter.WaitResult 桥接
    List<Character>? selectedTargets = SyncAwaiter.WaitResult(
        Controller.RequestTargetSelection(
            caster, skill, allEnemys, allTeammates,
            enemys, teammates, castRange));

    return selectedTargets ?? [];
}
```

### Controller：启动 UI 请求

```csharp
// 创建请求器实例
private readonly UserInputRequester<List<Character>> _targetSelectionRequester = new();

public async Task<List<Character>> RequestTargetSelection(
    Character character, ISkill skill,
    List<Character> allEnemys, List<Character> allTeammates,
    List<Character> enemys, List<Character> teammates,
    List<Grid> range)
{
    List<Character> selectable = skill.GetSelectableTargets(
        character, allEnemys, allTeammates, enemys, teammates);

    List<Character> targets = await _targetSelectionRequester.RequestInput(
        async (callback) => await UI.InvokeAsync(() =>
            UI.ShowTargetSelectionUI(character, skill, selectable,
                enemys, teammates, range, callback))
    ) ?? [];

    // 只返回可选范围内的目标（安全过滤）
    return targets.Where(selectable.Contains).ToList();
}
```

### Controller：接收 UI 结果

```csharp
public async Task ResolveTargetSelection(List<Character> targetIds)
{
    _targetSelectionRequester.ResolveInput(targetIds);
    await UI.InvokeAsync(() => UI.HideTargetSelectionUI());
}
```

### UI：显示选择界面并回调

```csharp
public void ShowTargetSelectionUI(Character character, ISkill skill,
    List<Character> selectable, List<Character> enemys,
    List<Character> teammates, List<Grid> range,
    Action<List<Character>> callback)
{
    _resolveTargetSelection = callback;  // 保存回调

    // 高亮可选目标
    foreach (Character c in selectable)
        HighlightCharacter(c, isSelectable: true);

    // 显示确认/取消按钮
    ConfirmButton.Visibility = Visibility.Visible;
    CancelButton.Visibility = Visibility.Visible;
}

// 用户点击确认
private void ConfirmButton_Click(object sender, RoutedEventArgs e)
{
    _resolveTargetSelection?.Invoke(SelectedTargets.ToList());
}
```

---

## 完整数据流示意

```
GamingQueue.ProcessTurn()
  │  [同步调用链]
  ├─ OnSelectSkillTargetsEvent()
  │    └─ Queue_SelectSkillTargets()          ← 同步事件处理器
  │         └─ SyncAwaiter.WaitResult(task)    ← 阻塞等待
  │              │
  │              └─ Controller.RequestTargetSelection()  ← async Task
  │                   └─ UserInputRequester.RequestInput()
  │                        └─ await tcs.Task   ← 在 UI 线程 await
  │                             │
  │                             └─ UI.ShowTargetSelectionUI(callback)
  │                                  │
  │                           [用户操作 UI...]
  │                                  │
  │                             UI 调用 callback(targets)
  │                                  │
  │                             ←── tcs.TrySetResult()
  │                        ←── Task 完成
  │              ←── mres.Set()
  │         ←── 返回 targets
  │    ←── 返回 targets
  │  ProcessTurn 继续执行技能
```
