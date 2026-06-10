# GamingQueue 事件模式

GamingQueue 通过 **31 个事件** 将整个游戏循环暴露给外部，让开发者可以在客户端（UI 渲染）、服务端（网络同步）或 AI 系统中介入每个决策点。

> 参考项目：`FunGame.Testing/Desktop/GameMapTesting` — WPF 实现的完整回合制演示，展示了所有事件的 UI 绑定模式。

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
| `GameStartEvent` | `(GamingQueue queue)` | void |
| `GameEndEvent` | `(GamingQueue queue, Character winner)` | `bool` |

### 二、回合生命周期（3 个）

| 事件 | 签名 | 返回值 |
|---|---|---|
| `TurnStartEvent` | `(GamingQueue queue, Character character, DecisionPoints dp, List<Character> enemys, List<Character> teammates, List<Skill> skills, List<Item> items)` | `bool` |
| `DecideActionEvent` | `(GamingQueue queue, Character character, DecisionPoints dp, ...)` | `CharacterActionType` |
| `TurnEndEvent` | `(GamingQueue queue, Character character, DecisionPoints dp)` | void |

### 三、交互式选择事件（7 个）— 需要用户/UI 输入

| 事件 | 签名 | 返回值 | 用途 |
|---|---|---|---|
| `SelectSkillEvent` | `(queue, character, List<Skill>)` | `Skill?` | 选技能 |
| `SelectItemEvent` | `(queue, character, List<Item>)` | `Item?` | 选物品 |
| `SelectNormalAttackTargetsEvent` | `(queue, character, NormalAttack, allEnemys, ...)` | `List<Character>` | 选普攻目标 |
| `SelectSkillTargetsEvent` | `(queue, caster, Skill, allEnemys, ...)` | `List<Character>` | 选指向性技能目标 |
| `SelectNonDirectionalSkillTargetsEvent` | `(queue, caster, Skill, enemys, teammates, castRange)` | `List<Grid>` | 选非指向性格子 |
| `SelectTargetGridEvent` | `(queue, character, enemys, teammates, map, moveRange)` | `Grid` | 选移动目标格子 |
| `CharacterInquiryEvent` | `(queue, character, dp, InquiryOptions)` | `InquiryResponse` | 询问玩家 |

### 四、动作执行事件（8 个）— 通知型

| 事件 | 触发时机 |
|---|---|
| `CharacterNormalAttackEvent` | 普攻执行 |
| `CharacterPreCastSkillEvent` | 技能吟唱（含即时战技） |
| `CharacterCastSkillEvent` | 技能释放完成（含消耗） |
| `CharacterUseItemEvent` | 物品使用 |
| `CharacterCastItemSkillEvent` | 物品技能释放 |
| `CharacterMoveEvent` | 角色移动 |
| `CharacterDoNothingEvent` | 主动结束回合 |
| `CharacterGiveUpEvent` | 放弃行动 |

### 五、战斗事件（7 个）— 通知型

| 事件 | 触发时机 |
|---|---|
| `DamageToEnemyEvent` | 造成伤害 |
| `HealToTargetEvent` | 治疗 |
| `DeathCalculationEvent` | 死亡结算 |
| `DeathCalculationByTeammateEvent` | 击杀队友 |
| `CharacterDeathEvent` | 角色死亡（结算后） |
| `InterruptCastingEvent` | 打断施法 |
| `CharacterImmunedEvent` | 免疫 |
| `CharacterExemptionEvent` | 豁免 |

### 六、状态变更事件（3 个）

| 事件 | 触发时机 |
|---|---|
| `QueueUpdatedEvent` | 顺序表变化 |
| `CharacterActionTakenEvent` | 行动完成 |
| `CharacterDecisionCompletedEvent` | 决策完成 |
