# OpenSkill

开放技能，位于 `Milimoe.FunGame.Core.Entity`。继承 `Skill` 的**运行时动态创建**技能：通过 `Dictionary<string, object>` 参数解析技能属性，无需编写 C# 类。

## 构造函数

```csharp
// id：技能唯一标识；name：技能名称；args：动态参数（写入 Values 字典）
// character：所属角色（可选）
public OpenSkill(long id, string name, Dictionary<string, object> args, Character? character = null)
```

## 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `Id` | `long` | 唯一标识符（可设置） |
| `Name` | `string` | 技能名称（可设置） |
| `Description` | `string` | 描述（只读）：由所有特效的描述拼接而成 |
| `SkillType` | `SkillType` | 默认 `Passive` |

## 参数解析

构造时 `args` 中的键值会被解析为技能属性，支持以下常用键：

| 键 | 解析为 |
|---|---|
| `active` | 是否为主动技能 |
| `self` | 是否可选自身 |
| `enemy` | 是否可选敌人 |
| `mp` | 魔法消耗 |
| `ep` | 爆发能量消耗 |
| `cd` | 冷却时间 |
| 其他键 | 写入 `Values` 字典，供特效读取 |

## 使用示例

```csharp
// 直接创建
Skill skill = new OpenSkill(2001, "木杖", new()
{
    { "mp", 10 },
    { "cd", 5 }
});

// 通过工厂创建（注册 SkillFactory 后）
Skill skill2 = Factory.OpenFactory.GetInstance<Skill>(2001, "木杖", args);
```

> JSON 反序列化创建物品时，其关联技能即为 `OpenSkill`。见 [自定义物品 - JSON 动态创建](/dev/custom-item)。

## 关联

- 动态创建物品（含 OpenSkill） → [自定义物品](/dev/custom-item)
- 技能基类 → [Skill](/api/Skill)
