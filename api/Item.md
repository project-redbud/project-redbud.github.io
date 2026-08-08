# Item

物品/装备基类，位于 `Milimoe.FunGame.Core.Entity`。

与 `Skill` 一样，**需要继承此类**来构造自定义物品。物品通过 `Skills`（`SkillGroup`）关联主动/被动技能，装备后自动生效。

## 构造函数

```csharp
// 指定物品类型（isInGame = 是否游戏内物品，默认 true）
public Item(ItemType type, bool isInGame = true)

// 默认构造（JSON 反序列化用）
public Item()
```

## 属性

### 基础信息

| 属性 | 类型 | 说明 |
|---|---|---|
| `Id` | `long` | 唯一标识符 |
| `Name` | `string` | 物品名称（可重写） |
| `Description` | `string` | 物品描述 |
| `GeneralDescription` | `string` | 通用描述（不随等级变化） |
| `BackgroundStory` | `string` | 背景故事 |
| `Category` | `string` | 分类 |
| `Tags` | `List<string>` | 标签 |

### 类型与品质

| 属性 | 类型 | 说明 |
|---|---|---|
| `ItemType` | `ItemType` | 物品类型（武器/防具/消耗品等） |
| `EquipSlotType` | `EquipSlotType` | 装备栏位 |
| `WeaponType` | `WeaponType` | 武器类型 |
| `QualityType` | `QualityType` | 品质等级 |
| `RarityType` | `RarityType` | 稀有度 |
| `RankType` | `ItemRankType` | 物品等级 |
| `IsEquipment` | `bool` | 是否为装备（只读） |

### 使用与交易

| 属性 | 类型 | 说明 |
|---|---|---|
| `IsLock` | `bool` | 是否锁定 |
| `Equipable` / `Unequipable` | `bool` | 可装备/可卸下 |
| `Enable` | `bool` | 是否启用 |
| `IsInGameItem` | `bool` | 是否游戏内物品 |
| `IsPurchasable` | `bool` | 是否可购买 |
| `Price` | `double` | 价格 |
| `IsSellable` / `NextSellableTime` | `bool` / `DateTime` | 可出售 / 下次可出售时间 |
| `IsTradable` / `NextTradableTime` | `bool` / `DateTime` | 可交易 / 下次可交易时间 |
| `RemainUseTimes` | `int` | 剩余使用次数 |
| `IsReduceTimesAfterUse` | `bool` | 使用后是否减少次数 |
| `IsRemoveAfterUse` | `bool` | 使用后是否移除 |
| `Stackable` / `StackCount` | `bool` / `int` | 可堆叠 / 堆叠数量 |
| `Key` | `int` | 快捷键 |

### 内容与归属

| 属性 | 类型 | 说明 |
|---|---|---|
| `Skills` | `SkillGroup` | 物品技能组（`Active` 主动技 + `Passives` 被动技） |
| `IsActive` | `bool` | 是否有主动技能（只读） |
| `Character` | `Character?` | 所属角色 |
| `User` | `User?` | 所属用户 |
| `Others` | `Dictionary<string, object>` | 动态扩展数据 |

## 主要方法

| 方法 | 说明 |
|---|---|
| `OnItemEquip(Character, EquipSlotType)` | 装备时调用（触发被动技能等） |
| `OnItemUnEquip(EquipSlotType)` | 卸下时调用 |
| `UseItem(IGamingQueue, Character, DecisionPoints, ...)` | 战斗内使用物品 |
| `UseItem(User, int times, Dictionary<string, object> args)` | 对局外使用物品 |
| `ReduceTimesAndRemove(int times = 1)` | 减少使用次数并在用尽时移除 |
| `SetGamingQueue(IGamingQueue)` | 绑定队列（传递技能/特效上下文） |
| `InquiryBeforeTargetSelection(Character, DecisionPoints)` | 使用物品选择目标前询问 |
| `ResolveInquiryBeforeTargetSelection(...)` | 解析询问结果 |
| `Copy(bool copyLevel, bool copyGuid, bool copyProperty, bool copyOthers, ...)` | 复制物品（含关联技能） |
| `SetLevel(int)` / `SetMagicsLevel(int)` | 设置物品/魔法技能等级 |
| `SetPropertyToItemModuleNew(Item)` | 同步新物品属性（物品模组用） |
| `ToString()` / `ToString(bool, bool)` / `ToStringInventory(bool)` | 文本输出（描述/背包） |

### 可重写虚方法

| 方法 | 说明 |
|---|---|
| `OnItemEquipped(Character, EquipSlotType)` | 装备完成后回调（预制实体在此应用特性） |
| `OnItemUnEquipped(Character, EquipSlotType)` | 卸下完成后回调（恢复特性） |
| `OnItemUsed(...)` | 物品使用后回调 |
| `AfterCopy(...)` | 复制完成后回调 |
| `InquiryBeforeTargetSelection(...)` / `ResolveInquiryBeforeTargetSelection(...)` | 目标选择询问 |

## 继承示例

```csharp
public class ExampleItem : Item
{
    public override long Id => 1;
    public override string Name => "ExampleItem";

    public ExampleItem(Character? character = null) : base(ItemType.Weapon)
    {
        Price = 0;
        IsSellable = false;
        IsTradable = false;

        // 技能一定要设置等级大于 0，否则不会生效
        Skills.Passives.Add(new ExampleItemSkill(character, this) { Level = 1 });
        Skills.Active = new ExampleNonDirectionalSkill2(character) { Level = 4 };
    }
}
```

## 关联

- 自定义物品 → [自定义物品](/dev/custom-item)
- 物品系统规则 → [物品与装备](/guide/items)
- 运行时动态创建 → [OpenSkill](/api/OpenSkill)
