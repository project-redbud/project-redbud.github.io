# 自定义角色

角色使用 **Factory 模式** 创建，需要设置 `InitRequired` 标记的属性。

## 基本创建

```csharp
using Milimoe.FunGame.Core.Entity;
using Milimoe.FunGame.Core.Library.Constant;

// 创建一个新角色
var character = Character.Factory.Get();
character.Name = "战士阿尔法";
character.FirstName = "阿尔法";
character.NickName = "钢铁之盾";

// 设置核心属性
character.STR = 10;    // 基础力量
character.AGI = 5;     // 基础敏捷
character.INT = 3;     // 基础智力

// 设置角色定位
character.FirstRoleType = RoleType.Guardian;  // 近卫

// 设置等级
character.Level = 1;
```

## 复制已有角色

```csharp
// 从模板角色创建副本（不共享引用）
var copy = template.Copy();
copy.Name = "战士复制体";
```

## 属性设置

```csharp
// 基础能力值
character.BaseHP = 80;
character.BaseMP = 15;
character.BaseATK = 12;
character.BaseDEF = 8;
character.BaseSPD = 120;  // 行动速度

// 额外能力值（来自装备/技能）
character.ExtraSTR = 5;
character.ExtraATK = 20;

// 魔法类型
character.MagicType = MagicType.Element;  // 元素属性
```

## 角色升级

```csharp
// 添加经验
character.EXP += 500;

// 升级逻辑由框架自动处理
// 升级时会根据 EquilibriumConstant 自动计算新数值
```

## 装备武器

```csharp
var sword = new Item
{
    Name = "铁剑",
    ItemType = ItemType.Weapon,
    WeaponType = WeaponType.OneHandedSword,
    ATK = 25,
    AttackRange = 1
};

character.EquipSlot.Weapon = sword;
```

## 完整自定义角色示例

```csharp
public static Character CreateWarrior(string name, int level)
{
    var c = Character.Factory.Get();
    c.Name = name;
    c.Level = level;
    c.FirstRoleType = RoleType.Guardian;
    c.MagicType = MagicType.None;

    // 基础属性
    c.STR = 10 + (level - 1) * 2;
    c.AGI = 5 + (level - 1) * 1;
    c.INT = 3;

    // 初始能力值
    c.InitialHP = 80;
    c.InitialATK = 15;
    c.InitialSPD = 110;

    return c;
}
```
