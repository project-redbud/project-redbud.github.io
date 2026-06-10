# 自定义角色

角色通过**继承 `Character` 类**来定义，在构造函数中设置初始属性。

## 基本创建（继承方式）

```csharp
using Milimoe.FunGame.Core.Entity;
using Milimoe.FunGame.Core.Library.Constant;

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
        FirstRoleType = RoleType.Guardian;
    }
}
```

## 使用工厂创建通用角色

如果不想继承，可以用 `Factory.GetCharacter()` 创建通用角色：

```csharp
using Milimoe.FunGame.Core.Api.Utility;

Character c = Factory.GetCharacter();
c.Name = "临时角色";
c.NickName = "路人";
c.InitialHP = 60;
c.InitialATK = 15;
c.InitialSPD = 110;
c.FirstRoleType = RoleType.Core;
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
// 你设置的
InitialHP = 85;

// 框架自动计算
// BaseHP = InitialHP + (Level-1) * (17 + 0.68 * InitialHP) + BaseSTR * 9
// MaxHP = BaseHP + ExHP + ExHP2 + ExHP3

// 运行时使用（只读）
character.HP;      // 当前生命值
character.MaxHP;   // 最大生命值
```

### 攻击力

```csharp
InitialATK = 25;

// 框架自动计算
// BaseATK = InitialATK + (Level-1) * (0.95 + 0.045 * InitialATK) + BaseSTR (核心属性)
// ATK = BaseATK + ExATK + ExATK2 + ExATK3

character.ATK;      // 最终攻击力（只读）
character.BaseATK;  // 基础攻击力（只读）
```

### 核心属性

```csharp
InitialSTR = 30;
STRGrowth = 3;      // 每级 +3 力量

// 框架自动计算 STR = InitialSTR + STRGrowth * (Level-1)
// BaseSTR 和 STR 由框架维护
```

### 技能/物品修改的属性

这些是 `Ex*` 属性，**由技能和物品的 Effect 修改**，不要在构造函数里直接设：

| 属性 | 类型 | 说明 |
|---|---|---|
| `ExATK2` | 可读写 | 额外攻击力（固定值） |
| `ExATKPercentage` | 可读写 | 额外攻击力百分比 |
| `ExHP` / `ExHP2` | 可读写 | 额外生命值 |
| `ExDEF2` | 可读写 | 额外物理护甲 |
| `ExSTR` / `ExAGI` / `ExINT` | 可读写 | 额外核心属性 |
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
using Milimoe.FunGame.Core.Entity;
using Milimoe.FunGame.Core.Library.Constant;

public class OshimaShiya : Character
{
    public OshimaShiya() : base()
    {
        Id = 1;
        Name = "Oshima";
        FirstName = "Shiya";
        NickName = "大島シヤ";
        PrimaryAttribute = PrimaryAttribute.STR;
        FirstRoleType = RoleType.Core;
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
