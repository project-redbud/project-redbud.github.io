# CharacterStateSnapshot

角色状态快照，位于 `Milimoe.FunGame.Core.Model.Framework`。记录角色在某个时间点的完整状态（生命值、装备、技能、物品、特效），是检查点与回放的数据基础。

同一文件还定义了 4 个状态明细类：`SkillStateSnapshot`、`ItemStateSnapshot`、`EffectStateSnapshot`、`EquipmentStateSnapshot`。

## CharacterStateSnapshot 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `Character` | `Character` | 角色引用 |
| `HP` / `MaxHP` | `double` | 当前/最大生命值 |
| `MP` / `MaxMP` | `double` | 当前/最大魔法值 |
| `EP` | `double` | 爆发能量 |
| `HR` / `MR` | `double` | 生命回复 / 魔法回复 |
| `Equipments` | `Dictionary<EquipSlotType, long>` | 装备槽位 → 物品 Id |
| `EquipmentsDetail` | `List<EquipmentStateSnapshot>` | 装备明细 |
| `Skills` | `List<SkillStateSnapshot>` | 技能状态明细 |
| `Items` | `List<ItemStateSnapshot>` | 物品状态明细 |
| `Effects` | `List<EffectStateSnapshot>` | 特效状态明细 |

## 明细类

### SkillStateSnapshot

| 属性 | 类型 | 说明 |
|---|---|---|
| `SkillId` / `SkillName` | `long` / `string` | 技能标识与名称 |
| `Level` | `int` | 技能等级 |
| `CurrentCD` | `double` | 当前冷却 |

### ItemStateSnapshot

| 属性 | 类型 | 说明 |
|---|---|---|
| `ItemId` / `ItemName` | `long` / `string` | 物品标识与名称 |

### EffectStateSnapshot

| 属性 | 类型 | 说明 |
|---|---|---|
| `EffectId` / `EffectName` | `long` / `string` | 特效标识与名称 |
| `EffectType` | `EffectType` | 特效类型 |
| `RemainDuration` | `double` | 剩余持续时间 |
| `RemainDurationTurn` | `int` | 剩余持续回合 |

## 生成方式

```csharp
// GamingQueue 每 CheckpointInterval 回合自动生成一次（默认 50）
queue.CheckpointInterval = 10;
// 快照会写入 RoundRecord.Checkpoint，并随事件 "2" 外发
```

## 关联

- 检查点机制 → [即时外发功能 - 检查点](/dev/outbound#检查点-checkpoint)
- 状态推算 → [BattleStatePredictor](/api/BattleStatePredictor)
