# 注册与初始化

## 角色模块注册

```csharp
public class ExampleCharacterModule : CharacterModule
{
    public override string Name => ExampleGameModuleConstant.ExampleCharacter;
    public override string Description => "My First CharacterModule";
    public override string Version => "1.0.0";
    public override string Author => "FunGamer";

    // 方式一：直接返回预定义列表
    public override Dictionary<string, Character> Characters
    {
        get
        {
            Character c = Factory.GetCharacter();
            c.Name = "Oshima";
            c.FirstName = "Shiya";
            c.InitialHP = 60;
            c.InitialATK = 100;
            // ...
            return new() { { c.Name, c } };
        }
    }

    // 方式二：工厂模式（根据 id 动态生成）
    protected override Factory.EntityFactoryDelegate<Character> CharacterFactory()
    {
        return (id, name, args) =>
        {
            return id switch
            {
                1 => new OshimaShiya(),
                2 => new MyWarrior(),
                _ => null,
            };
        };
    }
}
```

---

## 技能模块注册

技能模块同时注册**技能工厂**和**特效工厂**：

```csharp
public class ExampleSkillModule : SkillModule
{
    public override string Name => ExampleGameModuleConstant.ExampleSkill;

    // 技能工厂
    protected override Factory.EntityFactoryDelegate<Skill> SkillFactory()
    {
        return (id, name, args) =>
        {
            return id switch
            {
                1 => new ExampleNonDirectionalSkill1(),
                2 => new ExampleNonDirectionalSkill2(),
                3 => new ExampleSkill(),
                4 => new ExamplePassiveSkill(),
                5 => new ExampleSuperSkill(),
                _ => null,
            };
        };
    }

    // 特效工厂
    protected override Factory.EntityFactoryDelegate<Effect> EffectFactory()
    {
        return (id, name, args) =>
        {
            if (args.TryGetValue("skill", out object? v) && v is Skill skill
                && args.TryGetValue("values", out v) && v is Dictionary<string, object> dict)
            {
                return id switch
                {
                    1001 => new ExampleOpenEffectExATK2(skill, dict),
                    _ => null,
                };
            }
            return null;
        };
    }
}
```

---

## 物品模块注册

```csharp
public class ExampleItemModule : ItemModule
{
    public override string Name => ExampleGameModuleConstant.ExampleItem;

    public override Dictionary<string, Item> Items
    {
        get
        {
            Dictionary<string, Item> dict = [];
            // 物品应新建类继承 Item 实现
            return dict;
        }
    }

    protected override Factory.EntityFactoryDelegate<Item> ItemFactory()
    {
        return (id, name, args) =>
        {
            return id switch
            {
                1 => new ExampleItem(),
                10001 => new OpenItem(10001, "木杖", []),
                _ => null,
            };
        };
    }
}
```

---

## 地图注册

```csharp
public class ExampleGameMap : GameMap
{
    public override string Name => ExampleGameModuleConstant.ExampleMap;
    public override string Description => "My First GameMap";
    public override string Version => "1.0.0";
    public override string Author => "FunGamer";

    public override int Length => 12;
    public override int Width => 12;
    public override int Height => 6;
    public override float Size => 4.0f;

    public override GameMap InitGamingQueue(IGamingQueue queue)
    {
        // 每次游戏返回新地图对象（模组是单例的！）
        GameMap map = new ExampleGameMap();
        map.Load();

        // 可选：绑定游戏队列事件
        if (queue is GamingQueue gq)
        {
            gq.SelectTargetGridEvent += Gq_SelectTargetGrid;
        }
        return map;
    }
}
```

---

## 游戏模式组装

在 `GameModuleServer.StartServer()` 中获取已加载的角色/技能：

```csharp
// 从 ModuleLoader 获取角色模块
if (ModuleLoader != null && ModuleLoader.Characters.Count > 0)
{
    CharacterModule cm = ModuleLoader.Characters.Values.First();
    Character c = cm.Characters.Values.FirstOrDefault()?.Copy()
        ?? Factory.GetCharacter();
}

// 从工厂动态创建
Character c1 = Factory.OpenFactory.GetInstance<Character>(1, "", []);
Skill s = Factory.OpenFactory.GetInstance<Skill>(1, "", []);

// 获取已加载的地图
GameMap? map = GameModuleDepend.Maps.FirstOrDefault();
```

---

## 依赖声明

`GameModuleDepend` 决定了框架加载模组时自动加载哪些子模块：

```csharp
public static GameModuleDepend GameModuleDepend => new(
    Maps: [ExampleMap],
    Characters: [ExampleCharacter],
    Skills: [ExampleSkill],
    Items: [ExampleItem]
);
```

---

## 完整加载流程

```
框架启动
  ↓
读取 GameModuleDepend
  ↓
加载 GameMap ──→ 加载 CharacterModule ──→ 加载 SkillModule ──→ 加载 ItemModule
  ↓                                                    ↓
GameModule.StartGame()                         EffectFactory 注册
  ↓
GameModuleServer.StartServer()
  ↓
创建 GamingQueue → 绑定事件 → InitActionQueue → 游戏循环
```
