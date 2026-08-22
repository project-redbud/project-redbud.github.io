# GamingQueue 事件模式

GamingQueue 通过 **31 个事件** 将整个游戏循环暴露给外部，让开发者可以在客户端（UI 渲染）、服务端（网络同步）或 AI 系统中介入每个决策点。

> 参考项目：`FunGame.Testing/Desktop/GameMapTesting` — WPF 实现的完整回合制演示，展示了所有事件的 UI 绑定模式。

::: info v3.0 起统一上下文参数
所有事件委托均接收单一**参数上下文对象**，队列实例从 `ctx.Queue` 获取（旧版首参 `GamingQueue queue` 已移除），主角色从 `ctx.Actor` 获取。上下文类与特效钩子共享同一族，详见 [HookContext 参数上下文族](/api/HookContext)。
:::

---

## 事件驱动架构

```
GamingQueue.ProcessTurn()
    │
    ├──→ TurnStartEvent         ← 回合开始（可取消）
    │       │
    │       ├── AI 模式：自动决策
    │       │
    │       └── 玩家模式：
    │               DecideActionEvent    ← 选择行动类型
    │               SelectSkillEvent      ← 选择技能
    │               SelectItemEvent       ← 选择物品
    │               SelectNormalAttackTargetsEvent   ← 选择普攻目标
    │               SelectSkillTargetsEvent          ← 选择技能目标
    │               SelectNonDirectionalSkillTargetsEvent ← 选择非指向性目标
    │               SelectTargetGridEvent ← 选择移动目标
    │               CharacterInquiryEvent ← 询问玩家反应
    │
    ├──→ CharacterNormalAttackEvent    ← 普攻执行
    ├──→ CharacterPreCastSkillEvent    ← 技能预释放
    ├──→ CharacterCastSkillEvent       ← 技能释放完成
    ├──→ CharacterUseItemEvent         ← 物品使用
    ├──→ CharacterMoveEvent            ← 角色移动
    ├──→ DamageToEnemyEvent            ← 造成伤害
    ├──→ HealToTargetEvent             ← 治疗
    ├──→ InterruptCastingEvent         ← 打断施法
    ├──→ DeathCalculationEvent         ← 死亡结算
    ├──→ CharacterDeathEvent           ← 角色死亡
    ├──→ CharacterImmunedEvent         ← 免疫触发
    ├──→ CharacterExemptionEvent       ← 豁免触发
    │
    ├──→ CharacterActionTakenEvent     ← 行动完成
    ├──→ CharacterDecisionCompletedEvent ← 决策完成
    ├──→ TurnEndEvent                  ← 回合结束
    │
    └──→ QueueUpdatedEvent             ← 顺序表更新
```

---

## 事件分类

### 一、游戏生命周期（2 个）

| 事件 | 签名 | 返回值 |
|---|---|---|
| `GameStartEvent` | `(HookContext ctx)` | void |
| `GameEndEvent` | `(HookContext ctx)`，胜者为 `ctx.Actor` | `bool` |

### 二、回合生命周期（3 个）

| 事件 | 签名 | 返回值 |
|---|---|---|
| `TurnStartEvent` | `(TurnContext ctx)`，含 DP / Enemys / Teammates / Skills / Items | `bool` |
| `DecideActionEvent` | `(TurnContext ctx)` | `CharacterActionType` |
| `TurnEndEvent` | `(TurnContext ctx)`，含 DP | void |

### 三、交互式选择事件（7 个）— 需要用户/UI 输入

| 事件 | 签名 | 返回值 | 用途 |
|---|---|---|---|
| `SelectSkillEvent` | `(SelectionContext ctx)`，`ctx.Skills` | `Skill?` | 选技能 |
| `SelectItemEvent` | `(SelectionContext ctx)`，`ctx.Items` | `Item?` | 选物品 |
| `SelectNormalAttackTargetsEvent` | `(SelectionContext ctx)`，含 NormalAttack / 各目标列表 / CastRange | `List<Character>` | 选普攻目标 |
| `SelectSkillTargetsEvent` | `(SelectionContext ctx)`，含 Skill / AllEnemys / AllTeammates / CastRange | `List<Character>` | 选指向性技能目标 |
| `SelectNonDirectionalSkillTargetsEvent` | `(SelectionContext ctx)`，含 Skill / Enemys / Teammates / CastRange | `List<Grid>` | 选非指向性格子 |
| `SelectTargetGridEvent` | `(SelectionContext ctx)`，含 Map / MoveRange | `Grid` | 选移动目标格子 |
| `CharacterInquiryEvent` | `(InquiryContext ctx)`，含 DP / Options | `InquiryResponse` | 询问玩家 |

### 四、动作执行事件（8 个）— 通知型

| 事件 | 上下文 | 触发时机 |
|---|---|---|
| `CharacterNormalAttackEvent` | `NormalAttackContext`（DP / NormalAttack / Targets） | 普攻执行 |
| `CharacterPreCastSkillEvent` | `SkillCastContext`（DP / SkillTarget / Skill） | 技能吟唱（含即时战技） |
| `CharacterCastSkillEvent` | `SkillCastContext`（含 Cost / Targets / Grids） | 技能释放完成（含消耗） |
| `CharacterUseItemEvent` | `ItemUseContext`（DP / Item / Skill / Targets） | 物品使用 |
| `CharacterCastItemSkillEvent` | `SkillCastContext`（含 Item / MPCost / EPCost） | 物品技能释放 |
| `CharacterMoveEvent` | `MoveContext`（DP / Target 格子） | 角色移动 |
| `CharacterDoNothingEvent` | `ActionContext`（DP） | 主动结束回合 |
| `CharacterGiveUpEvent` | `ActionContext`（DP） | 放弃行动 |

### 五、战斗事件（7 个）— 通知型

| 事件 | 上下文 | 触发时机 |
|---|---|---|
| `DamageToEnemyEvent` | `DamageContext`（含 Damage / ActualDamage / DamageResult 等） | 造成伤害 |
| `HealToTargetEvent` | `HealContext`（含 Heal / IsRespawn） | 治疗 |
| `DeathCalculationEvent` | `DeathContext`（Actor 为亡者，含 Killer） | 死亡结算 |
| `DeathCalculationByTeammateEvent` | `DeathContext` | 击杀队友 |
| `CharacterDeathEvent` | `DeathContext`（含 Killer / Assists） | 角色死亡（结算后） |
| `InterruptCastingEvent` | `SkillCastContext`（含 Skill / Interrupter） | 打断施法 |
| `CharacterImmunedEvent` | `ImmuneContext`（含 Target / Skill / Item） | 免疫 |
| `CharacterExemptionEvent` | `ImmuneContext`（含 Source / IsEvade） | 豁免 |

### 六、状态变更事件（3 个）

| 事件 | 上下文 | 触发时机 |
|---|---|---|
| `QueueUpdatedEvent` | `QueueUpdatedContext`（含 Characters / HardnessTime / Reason / Message） | 顺序表变化 |
| `CharacterActionTakenEvent` | `ActionContext`（含 DP / ActionType / Record 回合快照） | 行动完成 |
| `CharacterDecisionCompletedEvent` | `ActionContext`（含 DP / Record） | 决策完成 |
