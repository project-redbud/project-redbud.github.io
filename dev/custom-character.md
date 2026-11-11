# 自定义角色

角色通过**继承 `Character` 类**来定义，在构造函数中设置初始属性。

需要按条件控制角色行动时，可以为模板设置 `DecisionTableId` 并通过 Loader 绑定策略，随后交由 AI 控制。配置支持 JSON 与链式构建，见 [编写决策表](./decision-tables.md)。

## 基本创建（继承方式）

```csharp
using FunGame.Core.Entity;
using FunGame.Core.Library.Constant;

public class MyWarrior : Character
{
    public MyWarrior() : base()
    {
        Id = 1;
        Name = "MyGame";
        FirstName = "Warrior";
        NickName = "钢铁战士";

        // 核心属性
        PrimaryAttribute = PrimaryAttribute.STR;

        // 初始能力值
        InitialHP = 85;
        InitialMP = 10;
        InitialATK = 25;
        InitialDEF = 8;
        InitialSPD = 300;
        InitialHR = 4;
        InitialMR = 2;

        // 属性成长
        InitialSTR = 30;
        STRGrowth = 3;
        InitialAGI = 5;
        AGIGrowth = 1;
        InitialINT = 0;
        INTGrowth = 0;

        // 角色定位
        PrimaryRoleType = RoleType.Guardian;
    }
}
```

## 使用工厂创建通用角色

如果不想继承，可以用工厂创建通用角色：

```csharp
using FunGame.Core.Entity;
using FunGame.Core.Api;

// 直接 new 通用角色，再设置属性
Character c = new()
{
    Name = "临时角色",
    NickName = "路人",
    InitialHP = 60,
    InitialATK = 15,
    InitialSPD = 110,
    PrimaryRoleType = RoleType.Core
};

// 或通过工厂动态创建（注册了角色工厂后按 id 创建对应实体类）
Character c2 = Factory.OpenFactory.GetInstance<Character>(1, "", []);
```

## 使用工厂方法注册（推荐用于 Module）

```csharp
// 在 CharacterModule.CharacterFactory() 中注册
protected override Factory.EntityFactoryDelegate<Character> CharacterFactory()
{
    return (id, name, args) =>
    {
        return id switch
        {
            1 => new MyWarrior(),
            2 => new MyMage(),
            _ => null
        };
    };
}

// 使用时通过工厂获取
Character c = Factory.OpenFactory.GetInstance<Character>(1, "", []);
```

---

## 属性体系

Character 的属性分为三层：初始值 → 基础值 → 最终值。**只需设置 `Initial*`，框架自动计算 `Base*` 和最终值**。

### 生命值

```csharp
Character character = new() { InitialHP = 85, Level = 1 };
// 默认配置：BaseHP = InitialHP + (Level-1) * (17 + 0.68 * InitialHP) + BaseSTR * 13
// ExHP = ExHPFromExSTR + ExHP2 + ExHP3
// MaxHP = Math.Max(1, BaseHP + ExHP)
double maxHP = character.MaxHP;
character.HP = 40;
```

### 攻击力

```csharp
Character character = new() { InitialATK = 25, InitialSTR = 30, Level = 1 };
// 默认配置：BaseATK = InitialATK + (Level-1) * (0.95 + 0.045 * InitialATK) + BasePrimaryAttributeValue
// ExATK = ExATKFromExPrimaryAttribute + ExATK2 + ExATK3
// ATK = BaseATK + ExATK
double attack = character.ATK;
```

### 核心属性

```csharp
Character character = new() { InitialSTR = 30, STRGrowth = 3, Level = 3 };
character.ExSTR2 = 5;
character.ExSTRPercentage = 0.2;
// BaseSTR = InitialSTR + STRGrowth * (Level-1)
// ExSTR3 = BaseSTR * ExSTRPercentage
// ExSTR = ExSTR2 + ExSTR3
// STR = BaseSTR + ExSTR
double strength = character.STR;
```

公式示例采用默认平衡常数；运行时以 `GameplayEquilibriumConstant` 配置为准。

### 技能/物品修改的属性

技能和物品通过 Effect 修改固定点数或比例；额外聚合、百分比派生及来源属性只读：

| 属性 | 类型 | 说明 |
|---|---|---|
| `ExATK2` | 可读写 | 额外攻击力（固定值） |
| `ExATKPercentage` | 可读写 | 额外攻击力百分比 |
| `ExHP2` / `ExMP2` | 可读写 | 额外生命 / 魔法固定点数 |
| `ExDEF2` | 可读写 | 额外物理护甲 |
| `ExSTR2` / `ExAGI2` / `ExINT2` | 可读写 | 核心属性固定点数 |
| `ExSTRPercentage` / `ExAGIPercentage` / `ExINTPercentage` | 可读写 | 核心属性比例 |
| `ExSTR` / `ExAGI` / `ExINT` / `ExATK` / `ExDEF` / `ExHP` / `ExMP` | 只读 | 全部额外来源的聚合 |
| `Ex*3` / `Ex*FromEx*` | 只读 | 百分比派生与核心属性来源 |
| `ExSPD` | 可读写 | 额外行动速度 |
| `ExEvadeRate` | 可读写 | 额外闪避率 |
| `PhysicalPenetration` | 可读写 | 物理穿透 |

---

## 复制角色

```csharp
// 创建独立副本（无共享引用）
Character copy = template.Copy();
copy.Name = "战士复制体";
```

---

## 等级与经验

```csharp
character.Level = 1;    // 直接设置等级
character.EXP += 500;   // 添加经验

// 等级提升时，BaseHP/BaseATK 等自动重新计算
```

---

## 完整角色示例

```csharp
using FunGame.Core.Entity;
using FunGame.Core.Library.Constant;

public class OshimaShiya : Character
{
    public OshimaShiya() : base()
    {
        Id = 1;
        Name = "Oshima";
        FirstName = "Shiya";
        NickName = "大島シヤ";
        PrimaryAttribute = PrimaryAttribute.STR;
        PrimaryRoleType = RoleType.Core;
        MagicType = MagicType.None;

        // 初始能力值
        InitialHP = 85;
        InitialMP = 10;
        InitialATK = 25;
        InitialDEF = 8;
        InitialSPD = 300;
        InitialHR = 4;
        InitialMR = 2;

        // 属性成长
        InitialSTR = 30;
        STRGrowth = 3;
        InitialAGI = 0;
        AGIGrowth = 0;
        InitialINT = 0;
        INTGrowth = 0;
    }
}
```
