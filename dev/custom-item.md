# 自定义物品

基于官方示例 `Library/Module/Example/ExampleItem.cs`。

---

## 基本模板：装备物品

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
        // 不支持重写的属性在构造函数中初始化
        Price = 0;
        IsSellable = false;
        IsTradable = false;
        IsLock = true;

        // ⚠️ 技能一定要设置等级大于0，否则不会生效
        Skills.Passives.Add(new ExampleItemSkill(character, this));
        Skills.Passives.Add(new ExamplePassiveSkill(character) { Level = 1 });
        Skills.Active = new ExampleNonDirectionalSkill2(character) { Level = 4 };
    }
}
```

---

## 物品关联技能

物品通过 `Skills` 属性关联主动/被动技能：

```csharp
public class ExampleItemSkill : Skill
{
    private readonly double 攻击力加成 = 0.46;  // 46%

    public ExampleItemSkill(Character? character = null, Item? item = null)
        : base(SkillType.Passive, character)
    {
        Level = 1;           // ⚠️ 必须 > 0
        Item = item;         // 关联物品

        Dictionary<string, object> values = new()
        {
            { "exatk", 攻击力加成 }
        };
        Effects.Add(new ExampleOpenEffectExATK2(this, values, character));
    }

    public override IEnumerable<Effect> AddPassiveEffectToCharacter()
    {
        return Effects;
    }
}
```

---

## 开放特效（百分比攻击力加成）

物品特效应通过 `Dictionary<string, object>` 传递参数，支持动态创建：

```csharp
public class ExampleOpenEffectExATK2 : Effect
{
    public override long Id => 1001;  // 分配唯一ID便于工厂注册
    public override string Name { get; set; } = "攻击力加成";

    public override string Description =>
        $"{(ActualBonus >= 0 ? "增加" : "减少")}角色 " +
        $"{Math.Abs(BonusFactor) * 100:0.##}% " +
        $"[ {(ActualBonus == 0 ? "基于基础攻击力" : $"{Math.Abs(ActualBonus):0.##}")} ] 点攻击力。";

    private readonly double BonusFactor = 0;
    private double ActualBonus = 0;
    private bool BonusApplied = false;
    private double AppliedBonusFactor = 0;

    public override void OnEffectGained(HookContext ctx)
    {
        if (ctx.Trigger is not Character character || BonusApplied) return;
        ActualBonus = character.BaseATK * BonusFactor;
        AppliedBonusFactor = BonusFactor;
        character.ExATKPercentage += AppliedBonusFactor;
        BonusApplied = true;
    }

    public override void OnEffectLost(HookContext ctx)
    {
        if (ctx.Trigger is not Character character || !BonusApplied) return;
        character.ExATKPercentage -= AppliedBonusFactor;
        AppliedBonusFactor = 0;
        ActualBonus = 0;
        BonusApplied = false;
    }

    // 属性变化时刷新加成（等级提升、装备更换等）
    public override void OnAttributeChanged(HookContext ctx)
    {
        if (ctx.Trigger is Character character && BonusApplied)
            ActualBonus = character.BaseATK * AppliedBonusFactor;
    }

    // 从 Dictionary 读取参数
    public ExampleOpenEffectExATK2(Skill skill, Dictionary<string, object> args,
        Character? source = null) : base(skill, args)
    {
        EffectType = EffectType.Item;
        GamingQueue = skill.GamingQueue;
        Source = source;
        if (Values.Count > 0)
        {
            string key = Values.Keys.FirstOrDefault(
                s => s.Equals("exatk", StringComparison.CurrentCultureIgnoreCase)) ?? "";
            if (key.Length > 0 && double.TryParse(Values[key].ToString(), out double v))
                BonusFactor = v;
        }
    }
}
```

::: tip 设计要点
属性写入 ExATKPercentage 后，ExATK3 会随 BaseATK 实时计算。OnAttributeChanged 仅更新展示值，不重复施加或移除特效，也不重置持续时间；生效标记保证增减各执行一次。
:::

---

## JSON 动态创建物品

框架支持通过 JSON 创建物品，无需编写 C# 类：

```csharp
string json = @"{
    ""Id"": 10001,
    ""Name"": ""木杖"",
    ""Description"": ""增加角色 20% 基础攻击力。"",
    ""BackgroundStory"": ""魔法使的起点。"",
    ""ItemType"": 1,
    ""WeaponType"": 8,
    ""QualityType"": 0,
    ""Skills"": {
        ""Active"": null,
        ""Passives"": [{
            ""Id"": 2001,
            ""Name"": ""木杖"",
            ""SkillType"": 3,
            ""Level"": 1,
            ""Effects"": [{
                ""Id"": 1001,
                ""exatk"": 0.2
            }]
        }]
    }
}";

// 读取配置，再经已注册的工厂构造技能与编码特效。
Item definition = NetworkUtility.JsonDeserialize<Item>(json)
    ?? throw new InvalidOperationException("物品配置为空。");
Item item = definition.Copy(copyLevel: true);
```

::: info JSON 结构说明
读取前加载本页特效对应的 SkillModule；示例的 exatk 是比例，0.2 表示 20%，技能 Level 必须大于 0 才能生效。
- `ItemType` / `WeaponType` / `QualityType` 使用枚举的 int 值
- `SkillType: 3` → `SkillType.Passive`
- `Effects` 中未映射到转换器的属性自动进入 `Effect.Values` 字典
- 特效的 `Id` 需要在 `SkillModule.EffectFactory()` 中注册
- 直接反序列化得到配置容器；`Copy(copyLevel: true)` 保留技能等级，并在重建 OpenSkill 的特效时调用注册的专用工厂。只读取 JSON 不会自动得到编码特效的行为。
:::

### JSON 等效代码

```csharp
Skill skill = new OpenSkill(2001, "木杖", []) { Level = 1 };
Effect effect = Factory.OpenFactory.GetInstance(1001, "", skill, new()
{
    { "exatk", 0.2 }
});
skill.Effects.Add(effect);

Item item = new OpenItem(10001, "木杖", [])
{
    Description = "增加角色 20% 基础攻击力。",
    BackgroundStory = "魔法使的起点。",
    ItemType = ItemType.Weapon,
    EquipSlotType = EquipSlotType.Weapon,
    WeaponType = WeaponType.Staff,
    QualityType = QualityType.White,
};
item.Skills.Passives.Add(skill);
```

---

## 从配置文件批量加载

```csharp
// 使用 EntityModuleConfig<T> 配置文件读取器
Dictionary<string, Item> items =
    Factory.GetGameModuleInstances<Item>("module_name", "file_name");
if (items.Count > 0)
{
    Item firstItem = items.Values.First();
}
```

::: tip 两者结合
- **编码实现** = 复杂特效逻辑（伤害计算、状态变化、联动其他技能）
- **JSON 创建** = 简单物品（数值修正），通过 `EffectFactory` 注册的特效实现逻辑，JSON 传入数值

既能享受动态数值的灵活性，也能享受编码逻辑的表达力。
:::

---

## 物品类型速查

```csharp
// 武器 → 有 WeaponType、攻击力、攻击距离
new Item(ItemType.Weapon)

// 防具 → 有 DEF、MDF
new Item(ItemType.Armor)

// 鞋子 → 有 SPD
new Item(ItemType.Shoes)

// 饰品 → 可装备2个，各种属性
new Item(ItemType.Accessory)

// 消耗品 → 可设置 MaxStack，Skills.Active 为使用时触发的技能
new Item(ItemType.Consumable)

// 礼包 → 打开获得物品
new Item(ItemType.GiftBox)
```
