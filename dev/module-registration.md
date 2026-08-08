# 实体模组 (EntityModule)

实体模组是 FunGame 扩展系统的基石——通过三种模组类将角色、技能/特效、物品注册到框架的全局工厂中，使 `Factory.OpenFactory.GetInstance<T>()` 能按 id 动态创建实体。

---

## 三种实体模组

| 模组 | 基类（`FunGame.Core.Library.Module`） | 注册的工厂 |
|---|---|---|
| `CharacterModule` | 继承 `IModule` | `CharacterFactory()` |
| `SkillModule` | 继承 `IModule` | `SkillFactory()` + `EffectFactory()` |
| `ItemModule` | 继承 `IModule` | `ItemFactory()` |

三者共享相同的生命周期（`Load`/`UnLoad`/`BeforeLoad`/`AfterLoad`），见 [模组开发总览](/dev/module-overview)。

---

## CharacterModule 角色模组

```csharp
public class ExampleCharacterModule : CharacterModule
{
    public override string Name => "fungame.example.character";
    public override string Description => "示例角色模组";
    public override string Version => "1.0.0";
    public override string Author => "FunGamer";

    // 预定义的角色（编码实现）
    public override Dictionary<string, Character> Characters
    {
        get
        {
            Dictionary<string, Character> dict = [];
            Character c = new()
            {
                Name = "Oshima",
                FirstName = "Shiya",
                NickName = "OSM",
                MagicType = MagicType.PurityNatural,
                InitialHP = 30,
                InitialSTR = 20,
                InitialAGI = 10,
                InitialINT = 5,
                InitialATK = 100,
                InitialDEF = 10
            };
            dict.Add(c.Name, c);
            return dict;
        }
    }

    // ═══ 核心：ID → Character 的工厂方法 ═══
    protected override Factory.EntityFactoryDelegate<Character> CharacterFactory()
    {
        return (id, name, args) =>
        {
            return id switch
            {
                1 => new OshimaShiya(),
                2 => new MyWarrior(),
                _ => null
            };
        };
    }

    // 注册工厂后，创建角色只需这样调用
    public static Character CreateCharacter(long id, string name, Dictionary<string, object> args)
    {
        return Factory.OpenFactory.GetInstance<Character>(id, name, args);
    }
}
```

### 工厂委托签名

```csharp
public delegate T? EntityFactoryDelegate<T>(long id, string name, Dictionary<string, object> args);
```

| 参数 | 说明 |
|---|---|
| `id` | 实体唯一 ID（switch 分支的依据） |
| `name` | 实体名称（备用） |
| `args` | 额外参数字典（备用，如 JSON 反序列化时传入） |

---

## SkillModule 技能模组

技能模组需要同时注册**技能工厂**和**特效工厂**：

```csharp
public class ExampleSkillModule : SkillModule
{
    public override string Name => "fungame.example.skill";

    // 预定义的技能（编码实现）
    public override Dictionary<string, Skill> Skills
    {
        get
        {
            Dictionary<string, Skill> dict = [];
            dict.Add("全力一击", new ExampleSkill());
            return dict;
        }
    }

    // ═══ 技能工厂 ═══
    protected override Factory.EntityFactoryDelegate<Skill> SkillFactory()
    {
        return (id, name, args) =>
        {
            return id switch
            {
                1 => new 疾风步(),
                2 => new 火之矢(),
                3 => new 心灵之弦(),
                _ => null
            };
        };
    }

    // ═══ 特效工厂 ═══
    protected override Factory.EntityFactoryDelegate<Effect> EffectFactory()
    {
        return (id, name, args) =>
        {
            // args 中可携带 "skill" 参数（JSON 反序列化时自动传入所属技能）
            Skill? skill = args.TryGetValue("skill", out object? v) && v is Skill s ? s : null;
            skill ??= new OpenSkill(id, name, args);
            return id switch
            {
                1001 => new ExATK(skill, args),
                1002 => new ExDEF(skill, args),
                _ => null
            };
        };
    }
}
```

> **为什么需要 EffectFactory？** 特效通过 `Dictionary<string, object>` 传递参数（如 JSON 中 `"exatk": 20`），工厂负责根据 ID 创建正确的特效类型并传入参数。这使得同一个特效类可以被不同数值复用。

---

## ItemModule 物品模组

```csharp
public class ExampleItemModule : ItemModule
{
    public override string Name => "fungame.example.item";

    // 预定义的物品（编码实现）
    public override Dictionary<string, Item> Items
    {
        get
        {
            Dictionary<string, Item> dict = [];
            dict.Add("ExampleItem", new ExampleItem());
            return dict;
        }
    }

    protected override Factory.EntityFactoryDelegate<Item> ItemFactory()
    {
        return (id, name, args) =>
        {
            return id switch
            {
                10001 => new 铁剑(),
                10002 => new 回复药(),
                _ => null
            };
        };
    }
}
```

---

## 生命周期

每个实体模组的生命周期完全一致：

```
Load(objs)
    │
    ├─ 已加载 → 返回 false（不允许重复加载）
    │
    ├─ BeforeLoad()
    │     └─ 返回 false → 跳过加载
    │
    ├─ 标记 _isLoaded = true
    ├─ 注册工厂到 Factory.OpenFactory
    │   ├─ CharacterModule  → RegisterFactory(CharacterFactory())
    │   ├─ SkillModule      → RegisterFactory(SkillFactory()) + RegisterFactory(EffectFactory())
    │   └─ ItemModule       → RegisterFactory(ItemFactory())
    │
    └─ AfterLoad()  ← 可重写，在此修改全局平衡常数等

UnLoad(objs)
    └─ UnRegisterFactory(对应工厂)
```

### AfterLoad 示例

```csharp
protected override void AfterLoad()
{
    // 修改游戏术语
    General.GameplayEquilibriumConstant.InGameTime = "秒";
    General.GameplayEquilibriumConstant.InGameMaterial = "钻石";

    // 限制启用的魔法类型
    General.GameplayEquilibriumConstant.UseMagicType = [MagicType.None];
}
```

### BeforeLoad 示例

```csharp
protected override bool BeforeLoad()
{
    // 条件加载：根据宿主传入的参数决定是否加载，返回 false 将阻止加载
    return true;
}
```

---

## JSON 配置文件（EntityModuleConfig）

编码实现之外，`EntityModuleConfig<T>`（`FunGame.Core.Api`）支持把实体保存为 JSON 文件并按需读取——适用于动态扩展技能/物品、保存玩家存档：

```csharp
// 读取配置：程序目录/modules/<模组名>/<文件名>.json
Dictionary<string, Item> items =
    Factory.GetGameModuleInstances<Item>("module_name", "file_name");
if (items.Count > 0)
{
    Item firstItem = items.Values.First();
}

// 保存配置：把实体字典写入 JSON 文件（覆盖同名文件，请注意备份）
Factory.CreateGameModuleEntityConfig("module_name", "file_name", items);
```

要点：

- 仅支持继承 `BaseEntity` 的实体类型，每个配置文件只保存一种实体类型。
- 反序列化时，JSON 中未映射到转换器属性的字段自动进入实体的 `Values`/`Others` 字典。
- 需要动态创建的特效类必须在 `EffectFactory()` 中按 id 注册（如上面的 `1001 => new ExATK(...)`）。

> JSON 结构与完整示例见 [自定义物品 - JSON 动态创建](/dev/custom-item)。

---

## 硬编码 vs 工厂 vs JSON

| 方式 | 适用场景 | 特点 |
|---|---|---|
| 编码 + 直接 `new` | 技能/特效逻辑复杂 | 高性能、可调试、可读性好（推荐） |
| 工厂 `GetInstance<T>` | 运行时按 id/参数动态创建 | 灵活，适合模组化分发 |
| JSON 配置 | 简单实体（数值修正）、存档 | 免编码，配合 `EffectFactory` 实现逻辑 |

> 来自官方示例的注释：*"所有的技能特效，如果能直接 `new`，建议就直接 `new`，提高性能和可读性。工厂效率低且不好调试，工厂更偏向于动态创建技能。"*

---

## 下一步

- 三种模组的完整示例 → [完整示例](/dev/examples)
- 模组体系与设计原则 → [模组开发总览](/dev/module-overview)
- 编码实现一个技能/特效 → [自定义技能](/dev/custom-skill) / [自定义特效](/dev/custom-effect)
