# RoundRewardRecord

回合奖励事件记录，位于 `FunGame.Core.Model.Framework`。记录一次回合奖励的**发放 / 移除 / 夺取**，供回合日志与回放展示。

由队列在奖励管线各节点写入 `RoundRecord.RoundRewardEvents`（按发生顺序排列），随回合记录一并 JSON 序列化外发。相比旧的 `RoundRecord.RoundRewards`（仅一行技能汇总），它额外带上了归属方、绑定方式与键位、顺延标记与夺取对手。

## 事件类型 RoundRewardEventKind

| 值 | 说明 |
|---|---|
| `Gained` | 发放（获得） |
| `Lost` | 移除：回合结束回收、吟唱顺延清算、被打断、施法者死亡、剥夺类效果清除 |
| `Stolen` | 夺取：归属由原持有者转移给夺取者 |

## 绑定方式 RoundRewardBinding

| 值 | 说明 |
|---|---|
| `Round` | 回合绑定：以全局回合为键，所有角色在该回合共享 |
| `Character` | 角色绑定：以「该角色的第 X 个行动回合」为键，仅该角色命中（默认不启用） |

## 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `Kind` | `RoundRewardEventKind` | 事件类型（默认 `Gained`） |
| `Binding` | `RoundRewardBinding` | 奖励的绑定方式 |
| `TurnKey` | `int` | 奖励键：回合绑定时为全局回合；角色绑定时为该角色的行动回合序号 |
| `Character` | `Character` | 归属角色：Gained / Lost 为奖励归属方；Stolen 为**原持有者** |
| `Counterpart` | `Character?` | 对方角色：仅 `Stolen` 有值（夺取者） |
| `Skills` | `List<Skill>` | 涉及的奖励；夺取时为全部被夺取项 |
| `IsCarryOver` | `bool` | 是否为「吟唱回合顺延到结算回合」的被动奖励（仅 `Lost` 有意义） |
| `BindingText` | `string` | 绑定方式与键位的中文描述（只读，如「全局回合 10」/「行动回合 3」） |

## 文本渲染

`ToString()` 渲染为一行日志文本，回合日志与 [RoundRecordRenderer](/api/RoundRecordRenderer) 均使用它：

```text
[ 米理 ] 获得回合奖励（全局回合 10）：暴击强化
[ 米理 ] 失去回合奖励（全局回合 10）：暴击强化
[ 米理 ] 失去回合奖励（行动回合 3，顺延结算）：恢复光环
[ 阿波 ] 的回合奖励（行动回合 5）被 [ 米理 ] 夺取：暴击强化 / 恢复光环
```

## 关联

- 事件流宿主 → [RoundRecord](/api/RoundRecord)
- 奖励规则 → [回合奖励](/guide/round-bonus)
- 上下文对象 → [RoundRewardContext](/api/HookContext)
