# 物品与装备

## 武器类型 (WeaponType)

| 武器 | 枚举值 | 攻击距离 | 硬直时间 | 基础伤害倍率 | 倍率成长 |
|---|---|---|---|---|---|
| 单手剑 | `OneHandedSword` | 1 | 8 | 1.00 | 0.05 |
| 双手重剑 | `TwoHandedSword` | 2 | 12 | 1.20 | 0.06 |
| 弓 | `Bow` | 4 | 9 | 0.90 | 0.04 |
| 手枪 | `Pistol` | 3 | 6 | 0.90 | 0.03 |
| 步枪 | `Rifle` | 5 | 11 | 1.10 | 0.05 |
| 双持短刀 | `DualDaggers` | 1 | 7 | 0.85 | 0.04 |
| 法器 | `Talisman` | 5 | 10 | 1.00 | 0.05 |
| 法杖 | `Staff` | 3 | 12 | 1.15 | 0.04 |
| 长柄 | `Polearm` | 2 | 10 | 0.95 | 0.05 |
| 拳套 | `Gauntlet` | 1 | 8 | 1.05 | 0.05 |
| 暗器 | `HiddenWeapon` | 4 | 7 | 0.90 | 0.05 |

> 法杖和法器自动获得**普通攻击附魔**（转为魔法伤害）。

## 物品类型 (ItemType)

| 类型 | ID 范围 | 栏位 |
|---|---|---|
| `MagicCardPack` | 10xxx | 魔法卡包栏 ×1 |
| `Weapon` | 11xxx | 武器栏 ×1 |
| `Armor` | 12xxx | 防具栏 ×1 |
| `Shoes` | 13xxx | 鞋子栏 ×1 |
| `Accessory` | 14xxx | 饰品栏 ×2 |
| `Consumable` | 15xxx | 背包 |
| `MagicCard` | 16xxx | 背包 |
| `Collectible` | 17xxx | 背包 |
| `SpecialItem` | 18xxx | 背包 |
| `QuestItem` | 19xxx | 背包 |
| `GiftBox` | 20xxx | 背包 |
| `Others` | 21xxx | 背包 |

## 品质等级 (QualityType)

| 品质 | 颜色 | 枚举值 |
|---|---|---|
| 普通 | 白 | `White` |
| 优秀 | 绿 | `Green` |
| 稀有 | 蓝 | `Blue` |
| 史诗 | 紫 | `Purple` |
| 传说 | 橙 | `Orange` |
| 神话 | 红 | `Red` |
| 不朽 | 金 | `Gold` |

## 装备栏位 (EquipSlotType)

| 栏位 | 数量 |
|---|---|
| 魔法卡包 | 1 |
| 武器 | 1 |
| 防具 | 1 |
| 鞋子 | 1 |
| 饰品 1 | 1 |
| 饰品 2 | 1 |
