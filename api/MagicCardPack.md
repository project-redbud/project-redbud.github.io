# MagicCardPack

魔法卡包，位于 `FunGame.Core.Model.PrefabricatedEntity`。继承 `Item` 的魔法卡包标准实现，装备到角色后自动生效。

## 构造函数

```csharp
// args：动态参数（"exstr"/"exagi"/"exint" 写入 AttributeBoosts，"resonance" 设置 Resonance）
public MagicCardPack(Dictionary<string, object>? args = null)
```

## 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `ItemType` | `ItemType` | 固定 `MagicCardPack`（只读） |
| `Magics` | `HashSet<Skill>` | 卡包提供的所有魔法技能（即 `Skills.Magics`） |
| `AttributeBoosts` | `Dictionary<PrimaryAttribute, double>` | 动态矩阵：增加角色额外核心属性（STR/AGI/INT） |
| `Resonance` | `PrimaryAttribute` | 同频共振：强制转换角色核心属性为该属性 |
| `NeuralCalibration` | `NeuralCalibrationEffect?` | 神经校准：使用特定武器时获得额外特效 |
| `CourageCommand` | `CourageCommandSkill?` | 勇气指令：附赠指令技能（不结束回合） |
| `Soulbound` | `SoulboundSkill?` | 灵魂绑定：至少 100EP、可增强的爆发技 |

## 装备/卸载自动处理

装备时（重写 `OnItemEquipped`）：

- 应用 `AttributeBoosts` 到 `ExSTR2`/`ExAGI2`/`ExINT2`
- 设置 `PrimaryAttribute = Resonance`（同频共振）
- 添加 `NeuralCalibration` 特效
- 添加 `CourageCommand`、`Soulbound` 技能

卸载时（重写 `OnItemUnEquipped`）回收点数、特效与技能，并还原已记录的非 `None` 主属性。

## 使用示例

```csharp
Character character = new() { Level = 1 };
MagicCardPack pack = new(new Dictionary<string, object>
{
    ["exstr"] = 15d,
    ["exagi"] = 10d,
    ["resonance"] = "AGI"
});

character.Equip(pack);
// 点数写入 ExSTR2 / ExAGI2，核心属性为 AGI。
// 可通过 pack.Magics 添加魔法，或配置 NeuralCalibration / CourageCommand / Soulbound。
character.UnEquip(EquipSlotType.MagicCardPack);
```

## 关联

- 特性详解 → [预制实体 - 魔法卡包](../guide/prefabricated-entities.md#magiccardpack-—-魔法卡包)
- 灵魂绑定 → [SoulboundSkill](./SoulboundSkill.md)
- 神经校准 → [NeuralCalibrationEffect](./NeuralCalibrationEffect.md)
