# NeuralCalibrationEffect

神经校准，位于 `Milimoe.FunGame.Core.Model.PrefabricatedEntity`。抽象类，使用特定武器时触发的额外特效。

## 定义

```csharp
public abstract class NeuralCalibrationEffect : Effect
{
    // 触发所需武器类型
    public WeaponType SupportedWeaponType { get; set; } = WeaponType.None;
}
```

## 说明

- 当角色使用 `SupportedWeaponType` 指定的武器时，此特效生效
- 通常由魔法卡包的 `NeuralCalibration` 属性提供（见 [MagicCardPack](/api/MagicCardPack)）

## 继承示例

```csharp
public class BowMasteryEffect(Skill skill) : NeuralCalibrationEffect
{
    public BowMasteryEffect() : this(null) { }

    // 当角色使用 SupportedWeaponType 武器时，此特效生效
    // 例如：使用弓时普攻伤害提升
    public override void OnEffectGained(Character character)
    {
        if (character.EquipSlot.Weapon?.WeaponType == SupportedWeaponType)
        {
            // 施加加成...
        }
    }
}
```

## 关联

- 特性详解 → [预制实体 - 神经校准](/guide/prefabricated-entities#neuralcalibrationeffect-—-神经校准)
- 魔法卡包 → [MagicCardPack](/api/MagicCardPack)
