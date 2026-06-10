# Character

角色实体，位于 `Milimoe.FunGame.Core.Entity`。

- **编码定义**：继承 `Character` 类，在构造函数中设置属性
- **工厂创建**：通过 `Factory.GetCharacter()` 或 `Factory.OpenFactory.GetInstance<Character>(id, name, args)`

## 编码定义（推荐）

```csharp
public class MyCharacter : Character
{
    public MyCharacter() : base()
    {
        Id = 1;
        Name = "Oshima";
        FirstName = "Shiya";
        NickName = "大島シヤ";
        PrimaryAttribute = PrimaryAttribute.STR;
        FirstRoleType = RoleType.Core;

        InitialHP = 85;
        InitialMP = 10;
        InitialATK = 25;
        InitialDEF = 8;
        InitialSPD = 300;
        InitialHR = 4;
        InitialMR = 2;

        InitialSTR = 30;  STRGrowth = 3;
        InitialAGI = 0;   AGIGrowth = 0;
        InitialINT = 0;   INTGrowth = 0;
    }
}
```

## 工厂创建

```csharp
Character c = Factory.GetCharacter();
c.Name = "临时角色";
c.InitialHP = 60;
c.InitialATK = 15;

// 或通过注册的工厂
Character c2 = Factory.OpenFactory.GetInstance<Character>(1, "", []);
```

## 属性体系（三层）

| 层级 | 示例 | 说明 |
|---|---|---|
| **初始值** | `InitialHP`, `InitialATK`, `InitialDEF`, `InitialSTR` | 你在构造函数中设置 |
| **基础值** | `BaseHP`, `BaseATK`, `BaseDEF` | 框架根据初始值 + 等级 + 核心属性自动计算（只读） |
| **最终值** | `HP`, `MaxHP`, `ATK`, `DEF`, `SPD` | Base + 各种 Ex 加成（只读） |

## 核心属性

| 属性 | 设置方式 | 说明 |
|---|---|---|
| `Id` | 构造函数 | 唯一标识符 |
| `Name` / `FirstName` / `NickName` | 构造函数 | 角色姓名 |
| `PrimaryAttribute` | 构造函数 | 核心属性（STR/AGI/INT） |
| `FirstRoleType` | 构造函数 | 角色定位 |
| `MagicType` | 构造函数 | 魔法属性 |
| `Level` | 可读写 | 当前等级 |
| `HP` / `MP` / `EP` | 可读写 | 当前生命/魔法/能量 |

## 初始值（`[InitRequired]`）

| 属性 | 说明 |
|---|---|
| `InitialHP` | 初始生命值 |
| `InitialMP` | 初始魔法值 |
| `InitialATK` | 初始攻击力 |
| `InitialDEF` | 初始物理护甲 |
| `InitialSPD` | 初始行动速度 |
| `InitialHR` | 初始生命回复 |
| `InitialMR` | 初始魔法回复 |
| `InitialSTR` | 初始力量 |
| `InitialAGI` | 初始敏捷 |
| `InitialINT` | 初始智力 |

## 属性成长

| 属性 | 说明 |
|---|---|
| `STRGrowth` | 每级力量成长 |
| `AGIGrowth` | 每级敏捷成长 |
| `INTGrowth` | 每级智力成长 |

## 额外属性（技能/物品修改）

| 属性 | 说明 |
|---|---|
| `ExHP` / `ExHP2` / `ExHPPercentage` | 额外生命值 |
| `ExATK2` / `ExATKPercentage` | 额外攻击力 |
| `ExMP` / `ExMP2` | 额外魔法值 |
| `ExDEF2` | 额外物理护甲 |
| `ExSTR` / `ExAGI` / `ExINT` | 额外核心属性 |
| `ExSPD` | 额外行动速度 |
| `ExEvadeRate` | 额外闪避率 |
| `PhysicalPenetration` | 物理穿透 |

## 装备与技能

| 属性 | 类型 | 说明 |
|---|---|---|
| `EquipSlot` | `EquipSlot` | 装备栏 |
| `Skills` | `List<Skill>` | 技能列表 |
| `Effects` | `List<Effect>` | 状态栏特效 |
| `NormalAttack` | `NormalAttack` | 普通攻击 |

## 关系属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `User` | `User` | 所属玩家 |
| `Team` | `Team` | 所属队伍 |
| `IsAlive` | `bool` | 是否存活 |
| `IsDead` | `bool` | 是否死亡 |

## 复制

```csharp
Character copy = source.Copy();  // 独立副本
```
