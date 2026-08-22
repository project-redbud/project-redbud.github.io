# CharacterStateSnapshot

角色状态快照，位于 `FunGame.Core.Model.Framework`。记录角色在某个时间点的完整状态（生命值、属性、装备、技能、物品、特效），是检查点与回放的数据基础。

同目录还定义了 4 个状态明细类：`SkillStateSnapshot`、`ItemStateSnapshot`、`EffectStateSnapshot`、`EquipmentStateSnapshot`。

## CharacterStateSnapshot 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `Character` | `Character` | 角色引用 |
| `HP` / `MaxHP` | `double` | 当前/最大生命值 |
| `MP` / `MaxMP` | `double` | 当前/最大魔法值 |
| `EP` | `double` | 爆发能量 |
| `HR` / `MR` | `double` | 生命回复 / 魔法回复 |
| `Attributes` | `Dictionary<string, string>` | 角色全部属性（属性名 → 展示值，与 `Character.GetInfo()` 中出现的属性一致；由队列生成检查点时写入 `GetAttributeValues()` 的结果） |
| `Equipments` | `Dictionary<EquipSlotType, long>` | 装备槽位 → 物品 Id |
| `EquipmentsDetail` | `List<EquipmentStateSnapshot>` | 装备明细（含物品名与描述，序列化后可直接展示） |
| `Skills` | `List<SkillStateSnapshot>` | 技能状态明细（含技能描述） |
| `Items` | `List<ItemStateSnapshot>` | 物品状态明细（含物品描述） |
| `Effects` | `List<EffectStateSnapshot>` | 特效状态明细（含特效描述与施加者 Guid） |

## 明细类

### SkillStateSnapshot

| 属性 | 类型 | 说明 |
|---|---|---|
| `SkillId` / `SkillName` | `long` / `string` | 技能标识与名称 |
| `Level` | `int` | 技能等级 |
| `CurrentCD` | `double` | 当前冷却 |
| `Description` | `string` | 技能描述 |

### ItemStateSnapshot

| 属性 | 类型 | 说明 |
|---|---|---|
| `ItemId` / `ItemName` | `long` / `string` | 物品标识与名称 |
| `Description` | `string` | 物品描述 |

### EffectStateSnapshot

| 属性 | 类型 | 说明 |
|---|---|---|
| `EffectId` / `EffectName` | `long` / `string` | 特效标识与名称 |
| `EffectType` | `EffectType` | 特效类型 |
| `RemainDuration` | `double` | 剩余持续时间 |
| `RemainDurationTurn` | `int` | 剩余持续回合 |
| `SourceGuid` | `Guid` | 特效施加者（Source 角色）的 Guid（无施加者时为 `Guid.Empty`） |
| `Description` | `string` | 特效描述 |

### EquipmentStateSnapshot

独立文件定义（`FunGame.Core.Model.Framework`），用于回放/展示时显示装备名与描述：

| 属性 | 类型 | 说明 |
|---|---|---|
| `Slot` | `EquipSlotType` | 装备槽位 |
| `ItemId` / `ItemName` | `long` / `string` | 物品标识与名称 |
| `Description` | `string` | 物品描述 |

## 生成方式

```csharp
// GamingQueue 每 CheckpointInterval 回合自动生成一次（默认 50）
queue.CheckpointInterval = 10;
// 快照会写入 RoundRecord.Checkpoint，并随事件 "2" 外发
```

## 关联

- 检查点机制 → [即时外发功能 - 检查点](/dev/outbound#检查点-checkpoint)
- 状态推算 → [BattleStatePredictor](/api/BattleStatePredictor)
