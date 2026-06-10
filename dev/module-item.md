# 创建自定义物品

物品继承 `Item` 类，可附带主动/被动技能。

## 基本模板

```csharp
public class ExampleItem : Item
{
    public override long Id => 1;
    public override string Name => "ExampleItem";
    public override string Description =>
        $"{Skills.Passives.First().Description}" +
        $"{Skills.Passives.Last().Name}：{Skills.Passives.Last().Description}";
    public override string BackgroundStory => "Item's Background Story";
    public override WeaponType WeaponType => WeaponType.Staff;
    public override QualityType QualityType => QualityType.Gold;

    public ExampleItem(Character? character = null) : base(ItemType.Weapon)
    {
        Price = 0;
        IsSellable = false;
        IsTradable = false;
        IsLock = true;

        // 添加被动技能
        Skills.Passives.Add(new ExampleItemSkill(character, this));
        Skills.Passives.Add(new ExamplePassiveSkill(character) { Level = 1 });

        // 添加主动技能
        Skills.Active = new ExampleNonDirectionalSkill2(character) { Level = 4 };
    }
}
```

## 物品关联技能

物品技能通过 `Skills` 属性关联：

| 属性 | 类型 | 说明 |
|---|---|---|
| `Skills.Active` | `Skill?` | 主动使用技能 |
| `Skills.Passives` | `List<Skill>` | 被动技能列表（装备时生效） |

```csharp
public class ExampleItemSkill : Skill
{
    public ExampleItemSkill(Character? character = null, Item? item = null)
        : base(SkillType.Passive, character)
    {
        Level = 1;
        Item = item;  // 关联物品
        Dictionary<string, object> values = new() { { "exatk", 0.46 } };
        Effects.Add(new ExampleOpenEffectExATK2(this, values, character));
    }

    public override IEnumerable<Effect> AddPassiveEffectToCharacter()
    {
        return Effects;
    }
}
```

---

## JSON 动态创建物品

框架支持通过 JSON 动态创建物品、角色和技能：

```csharp
string json = @"{
    ""Id"": 10001,
    ""Name"": ""木杖"",
    ""Description"": ""增加角色 20 点攻击力。"",
    ""ItemType"": 1,
    ""WeaponType"": 8,
    ""QualityType"": 0,
    ""Skills"": {
        ""Active"": null,
        ""Passives"": [{
            ""Id"": 2001,
            ""Name"": ""木杖"",
            ""SkillType"": 3,
            ""Effects"": [{
                ""Id"": 1001,
                ""exatk"": 20
            }]
        }]
    }
}";

Item item = NetworkUtility.JsonDeserialize<Item>(json) ?? Factory.GetItem();
```

::: info JSON 结构说明
- `SkillType: 3` → `SkillType.Passive`
- `Effects` 中的属性如果在转换器上没有对应字段，会进入 `Effect.Values` 字典
- 特效通过 `Values` 字典自行解析额外参数，如上例中的 `exatk: 20`
- 详情参见 `JsonConverter.ItemConverter` / `JsonConverter.SkillConverter`
:::

## 从配置文件批量加载

```csharp
// 使用 EntityModuleConfig<T> 配置文件读取器
Dictionary<string, Item> exItems =
    Factory.GetGameModuleInstances<Item>("module_name", "file_name");
if (exItems.Count > 0)
{
    Item item = exItems.Values.First();
}
```
