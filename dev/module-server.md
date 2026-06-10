# 服务端模组 (GameModuleServer)

服务端模组是 Module 开发的核心。它继承 `GameModuleServer`，负责创建 `GamingQueue`、处理客户端消息、驱动游戏循环。

## 基本模板

```csharp
public class ExampleGameModuleServer : GameModuleServer, IHotReloadAware
{
    public override string Name => ExampleGameModuleConstant.ExampleGameModule;
    public override string Description => "My First GameModule";
    public override string Version => "1.0.0";
    public override string Author => "FunGamer";

    // 工作类：隔离每个房间的状态（模组是单例的！）
    private readonly struct ModuleServerWorker(GamingObject obj)
    {
        public GamingObject GamingObject { get; } = obj;
        public List<User> ConnectedUser { get; } = [];
        public List<Character> CharactersForPick { get; } = [];
        public Dictionary<string, Character> UserCharacters { get; } = [];
        public Dictionary<string, Dictionary<string, object>> UserData { get; } = [];
    }

    private ConcurrentDictionary<string, ModuleServerWorker> Workers { get; } = [];
}
```

::: warning 重要
模组是**单例**的。多个房间共享同一个模组实例。必须用 `ConcurrentDictionary<string, Worker>` 来隔离每个房间的状态！
:::

---

## 启动服务端

```csharp
public override bool StartServer(GamingObject obj, params object[] args)
{
    // 为这个房间创建一个工作类
    ModuleServerWorker worker = new(obj);
    Workers[obj.Room.Roomid] = worker;

    // 创建线程执行游戏逻辑（此方法必须立即返回）
    TaskUtility.NewTask(async () => await Test(obj, worker))
        .OnError(Controller.Error);

    return true;
}
```

---

## 完整的游戏流程

```csharp
private async Task Test(GamingObject obj, ModuleServerWorker worker)
{
    // ═══ 第一步：确认客户端连接 ═══
    Dictionary<string, object> data = [];
    data.Add("info_type", "check");
    Guid token = Guid.NewGuid();
    data.Add("connect_token", token);

    foreach (string username in obj.Users.Select(u => u.Username))
    {
        worker.UserData[username] = new() { { "connect_token", token } };
    }
    await SendGamingMessage(obj.All.Values, GamingType.UpdateInfo, data);

    // 等待所有玩家确认（30秒超时）
    await WaitForUsers(30,
        async () => worker.ConnectedUser.Count == obj.Users.Count,
        200,
        async () => await CancelGame(obj, worker, "等待超时，游戏已取消!"),
        async () => await StartGame(obj, worker)
    );
}
```

---

## 消息处理

```csharp
public override async Task<Dictionary<string, object>> GamingMessageHandler(
    IServerModel model, GamingType type, Dictionary<string, object> data)
{
    ModuleServerWorker worker = Workers[model.InRoom.Roomid];
    string username = model.User.Username;

    switch (type)
    {
        case GamingType.Connect:
            // 验证 token
            string un = NetworkUtility.JsonDeserializeFromDictionary<string>(data, "username") ?? "";
            Guid token = NetworkUtility.JsonDeserializeFromDictionary<Guid>(data, "connect_token");
            if (un == username && worker.UserData[username]["connect_token"]?.Equals(token) ?? false)
            {
                worker.ConnectedUser.Add(obj.Users.First(u => u.Username == username));
            }
            break;

        case GamingType.PickCharacter:
            long id = NetworkUtility.JsonDeserializeFromDictionary<long>(data, "id");
            if (worker.CharactersForPick.FirstOrDefault(c => c.Id == id) is Character character)
            {
                worker.UserCharacters[username] = character.Copy(); // 复制防冲突
            }
            break;

        case GamingType.Skill:
            string e = NetworkUtility.JsonDeserializeFromDictionary<string>(data, "event") ?? "";
            if (e == "SelectSkillTargets")
            {
                long[] targets = NetworkUtility.JsonDeserializeFromDictionary<long[]>(data, "targets") ?? [];
                worker.UserData[username]["SkillTargets"] = targets;
            }
            break;
    }
    return [];
}
```

---

## 创建 GamingQueue 并运行

```csharp
private async Task StartGame(GamingObject obj, ModuleServerWorker worker)
{
    // 让玩家选角色
    Character c1 = Factory.OpenFactory.GetInstance<Character>(1, "", []);
    worker.CharactersForPick.Add(c1);

    // 从 ModuleLoader 获取已加载的角色
    if (ModuleLoader?.Characters.Values.FirstOrDefault() is CharacterModule cm)
    {
        Character c2 = cm.Characters.Values.FirstOrDefault()?.Copy() ?? Factory.GetCharacter();
        if (c2.Id > 0) worker.CharactersForPick.Add(c2);
    }

    data["list"] = worker.CharactersForPick.Select(c => c.Id);
    await SendGamingMessage(obj.All.Values, GamingType.PickCharacter, data);

    // 等待选择完成...
    await WaitForUsers(30, /* ... */);

    // 准备角色
    List<Character> finalList = [.. worker.UserCharacters.Values];
    foreach (Character c in finalList)
    {
        c.Level = 60;
        c.NormalAttack.Level = 8;
        Skill s = Factory.OpenFactory.GetInstance<Skill>(1, "", []);
        s.Level = 6;
        c.Skills.Add(s);
    }

    // 创建队列
    MixGamingQueue queue = new(finalList, async (str) =>
    {
        await SendAllTextMessage(obj, str);
    });

    // 加载地图（可选）
    if (GameModuleDepend.Maps.FirstOrDefault() is GameMap map)
    {
        queue.LoadGameMap(map);
    }

    // 绑定事件
    queue.SelectSkillTargetsEvent += (q, caster, skill, ...) =>
    {
        return SyncAwaiter.WaitResult(
            RequestClientSelectSkillTargets(worker, caster, skill, ...));
    };

    queue.InitActionQueue();
    queue.SetCharactersToAIControl(cancel: false, finalList);

    // 游戏循环
    int i = 1;
    while (i < 999)
    {
        Character? characterToAct = queue.NextCharacter();
        if (characterToAct != null)
        {
            await SendAllTextMessage(obj, $"=== Round {i++} ===");
            await SendAllTextMessage(obj, $"现在是 [ {characterToAct} ] 的回合！");

            bool isGameEnd = queue.ProcessTurn(characterToAct);
            if (isGameEnd) break;
            queue.DisplayQueue();
        }
        queue.TimeLapse();
    }

    // 赛后统计
    foreach (Character character in queue.CharacterStatistics
        .OrderByDescending(d => d.Value.TotalDamage).Select(d => d.Key))
    {
        CharacterStatistics stats = queue.CharacterStatistics[character];
        // 输出各项统计...
    }
}
```

---

## 与客户端交互：选择技能目标

```csharp
private async Task<List<Character>> RequestClientSelectSkillTargets(
    ModuleServerWorker worker, Character caster, Skill skill, ...)
{
    Dictionary<string, object> data = [];
    data.Add("event", "SelectSkillTargets");
    data.Add("caster", caster.Id);
    data.Add("skill", skill.Id);
    data.Add("allenemys", allEnemys.Select(c => c.Id));
    data.Add("teammates", teammates.Select(c => c.Id));
    await SendGamingMessage(_clientModels, GamingType.Skill, data);

    // 等待客户端返回选择结果
    List<Character> selectTargets = [];
    await WaitForUsers(30, /* 等待 UserData["SkillTargets"] */ );
    return selectTargets;
}
```

---

## 匿名服务器

支持客户端不经过 FunGameServer 登录验证直接连接：

```csharp
public override bool StartAnonymousServer(IServerModel model,
    Dictionary<string, object> data)
{
    string access_token = NetworkUtility.JsonDeserializeFromDictionary<string>(
        data, "access_token") ?? "";
    if (access_token == "approval_access_token")
    {
        _clientModels.Add(model);
        return true;
    }
    return false;
}

public override async Task<Dictionary<string, object>> AnonymousGameServerHandler(
    IServerModel model, Dictionary<string, object> data)
{
    // 自定义协议处理...
    return [];
}
```

## 热重载 (IHotReloadAware)

```csharp
public void OnBeforeUnload()
{
    // 清理所有匿名连接
    GamingObjects.Clear();
    foreach (IServerModel model in _clientModels)
    {
        model.NowGamingServer = null;
        CloseAnonymousServer(model);
    }
}
```
