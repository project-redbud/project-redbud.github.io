# Character

角色实体，位于 `Milimoe.FunGame.Core.Entity`。

使用 **Factory.Get()** 创建，并需要设置 `InitRequired` 标记的属性。

## 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `Guid` | `Guid` | 唯一标识符 |
| `Name` | `string` | 角色姓 |
| `FirstName` | `string` | 角色名 |
| `NickName` | `string` | 昵称 |
| `Level` | `int` | 等级 |
| `HP` / `MaxHP` | `double` | 当前/最大生命值 |
| `MP` / `MaxMP` | `double` | 当前/最大魔法值 |
| `EP` | `double` | 当前爆发能量 |
| `STR` | `double` | 力量 |
| `AGI` | `double` | 敏捷 |
| `INT` | `double` | 智力 |
| `ATK` | `double` | 攻击力 |
| `DEF` | `double` | 物理护甲 |
| `SPD` | `double` | 行动速度 |
| `MagicType` | `MagicType` | 魔法属性 |
| `FirstRoleType` | `RoleType` | 角色定位 |
| `Skills` | `List<Skill>` | 技能列表 |
| `Effects` | `List<Effect>` | 当前状态栏特效 |
| `EquipSlot` | `EquipSlot` | 装备栏 |
| `User` | `User` | 所属玩家 |
| `Team` | `Team` | 所属队伍 |
| `IsAlive` | `bool` | 是否存活 |
| `IsDead` | `bool` | 是否死亡 |

## 工厂方法

```csharp
// 创建新角色
var character = Character.Factory.Get();

// 复制角色（无共享引用）
var copy = source.Copy();
```
