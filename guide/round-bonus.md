# 回合奖励

游戏开始时生成回合奖励表，为指定回合里正在行动的角色提供额外技能奖励。

::: tip 示例
第 10 回合 → 暴击率 **+50%**
:::

回合奖励在该回合结束时立即失效。在此基础上，v3.0 扩展了两种绑定方式、吟唱顺延与奖励的查询/追加/夺取。

## 绑定方式

回合奖励支持两种绑定方式（`RoundRewardBinding`）：

| 绑定方式 | 键位 | 说明 |
|---|---|---|
| `Round`（默认） | 全局回合数 | 所有角色在该回合共享同一份奖励表 |
| `Character` | 该角色的第 X 个**行动回合** | 每个角色有独立的奖励表；默认不启用，需在初始化时开启 |

两种表**可以同时启用并叠加**：回合开始发放奖励时，先查回合绑定表中当前全局回合的项，再查角色绑定表中该角色当前行动回合的项，两处命中即全部发放。

## 生成规则

- 沿用稀疏步进生成：相邻两个奖励之间随机间隔 1~8 个回合（`Random.Next(1, 9)`），每个命中的键位固定生成 **1 个**奖励（不再需要 `maxRound` / `maxRewardsInRound` 参数）
- 奖励表按 **1000 键窗口**滚动惰性物化（`GamingQueue.RoundRewardWindowSize`）：查询或发放跨过已生成范围时，按同一随机源自动物化下一窗口，不浪费随机数
- 奖励技能从初始化传入的特效池中随机构造，名称带 `[R]` 前缀，`SkillSource` 标记为 `Reward`

## 发放与结算

每个行动回合的奖励生命周期：

```
回合开始（TurnStart 事件之前）→ 发放奖励
    ├── 主动奖励 → 立即对自身施放（获得即释放），随后照常回收
    └── 被动奖励 → 挂载到角色技能栏（特效进入状态栏）
回合结束 → 结算奖励
```

| 回合如何结束 | 结算结果 |
|---|---|
| 正常结束（含事件接管整回合） | 全部回收 |
| 以**吟唱**或**预释放爆发技**结束 | 主动奖励照常回收；**被动奖励顺延**到该吟唱的结算回合 |
| 顺延后的结算回合结束 | 顺延奖励一并清除（无论该回合如何结束） |
| 吟唱被打断 / 施法者死亡 | 已顺延的被动奖励**立即清除** |

::: info 技能受限时的例外（v3.0+）
回合奖励技能被标记为 `SkillSource.Reward` 来源。角色处于**技能受限**状态时，其他技能不可用，但 **Reward 来源的奖励技能仍可释放**。
:::

## 角色绑定的扩展操作

启用角色绑定后，可以通过 `IGamingQueue` 对**未来的**回合奖励进行查询、追加、移除和夺取（全部带事件与特效钩子，并写入回合日志事件流）：

| 方法 | 说明 |
|---|---|
| `QueryRoundRewards(character, offset)` | 查询角色未来第 `offset` 个行动回合的奖励 |
| `AddRoundReward(character, offset, skill)` | 追加一条未来行动回合的奖励 |
| `RemoveRoundReward(character, offset, skill, out removed)` | 移除未来某行动回合中的一条奖励 |
| `RemoveRoundRewards(character, offset, out removed)` | 一次性移除未来某行动回合的**全部**奖励 |
| `StealRoundReward(target, fromOffset, thief, toOffset, out stolen)` | 夺取目标某行动回合的全部奖励，并入夺取者的指定行动回合 |

统一约定：

- **offset 语义**：相对各自当前行动回合的偏移，最小为 1（1 = 下一个行动回合）
- **召唤物折算**：召唤物（`Master` 非空）不单独享受角色绑定奖励，查询/追加/夺取统一折算到其 `Master` 名下；但对召唤物的移除不会误伤 `Master`
- 夺取语义为**引用转移**：目标键位的全部奖励一次性转移并与夺取者目标键位的奖励合并，来源登记同步改到夺取者侧
- 这些操作仅在启用角色绑定时可用（未启用时返回 `false` / 空列表）

## 事件与钩子

奖励管线的每个节点（发放 / 移除 / 夺取）都会构造一份 `RoundRewardContext`，同一实例依次流经 **队列事件 → 特效钩子**，并写入回合日志的奖励事件流（见 [RoundRewardRecord](/api/RoundRewardRecord)）：

| 节点 | 队列事件（Before / After） | 特效钩子 |
|---|---|---|
| 获得奖励 | `GamingRoundRewardGainedBefore/After` | `OnRoundRewardGained` |
| 失去奖励 | `GamingRoundRewardLostBefore/After` | `OnRoundRewardLost` |
| 奖励被夺取 | `GamingRoundRewardStolenBefore/After` | `OnRoundRewardStolen`（原持有者与夺取者的特效都会触发） |

特效内部也可用 `QueryRoundReward` / `AddRoundReward` / `RemoveRoundReward(s)` / `StealRoundReward` 等保护方法操作奖励，见 [Effect](/api/Effect#特效内部可用方法)。

## 关联

- API → [GamingQueue](/api/GamingQueue#回合奖励) / [RoundRewardRecord](/api/RoundRewardRecord) / [RoundRewardContext](/api/HookContext)
- 奖励事件 → [GamingQueue 事件模式](/dev/events-overview#七、回合奖励事件-6-个-—-通知型)
