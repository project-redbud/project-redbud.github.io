# GamingQueue

回合制游戏队列基类，位于 `Milimoe.FunGame.Core.Model`。

提供混战模式的默认实现，可继承扩展。`MixGamingQueue` 和 `TeamGamingQueue` 是开箱即用的子类。

## 构造函数

```csharp
// 无角色列表（后续用 InitCharacters 加载）
public GamingQueue(Action<string>? writer = null, GameMap? map = null)

// 带角色列表
public GamingQueue(List<Character> characters, Action<string>? writer = null, GameMap? map = null)
```

## 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `GameplayEquilibriumConstant` | `EquilibriumConstant` | 游戏平衡常数 |
| `WriteLine` | `Action<string>` | 日志输出委托（只读） |
| `IsDebug` | `bool` | 调试模式 |
| `AllCharacters` | `List<Character>` | 参与游戏的所有角色 |
| `Queue` | `List<Character>` | 当前行动顺序 |
| `HardnessTime` | `Dictionary<Character, double>` | 硬直时间表 |
| `Eliminated` | `List<Character>` | 已死亡角色（按死亡顺序） |
| `TotalTime` | `double` | 游戏运行时间 |
| `TotalRound` | `int` | 游戏总回合数 |
| `Map` | `GameMap?` | 使用的地图 |
| `LastRound` | `RoundRecord` | 上回合记录 |
| `Rounds` | `List<RoundRecord>` | 所有回合记录 |
| `CharacterStatistics` | `Dictionary<Character, CharacterStatistics>` | 角色统计数据 |
| `CustomData` | `Dictionary<string, object>` | 自定义数据（事件间传参） |

## 主要方法

| 方法 | 说明 |
|---|---|
| `InitCharacters(List<Character>)` | 初始化角色列表 |
| `InitActionQueue()` | 初始化行动顺序表 |
| `ProcessTurn(Character)` | 处理角色回合（触发事件） |
| `NextCharacter()` | 获取下一个可行动角色 |
| `TimeLapse()` | 时间流逝（返回流逝时间） |
| `DisplayQueue()` | 输出队列信息 |
| `LoadGameMap(GameMap)` | 加载地图 |
| `SetCharactersToAIControl(bool cancel, params IEnumerable<Character>)` | 设置 AI/玩家控制 |
| `InitRoundRewards(...)` | 初始化回合奖励 |
| `DamageToEnemy(actor, enemy, damage, isNormalAttack, ...)` | 造成伤害 |
| `HealToTarget(actor, target, heal, ...)` | 治疗目标 |
| `DeathCalculation(killer, death)` | 死亡结算 |
| `InterruptCasting(caster, interrupter)` | 打断施法 |
| `ChangeCharacterHardnessTime(character, addValue, isPercentage, isCheckProtected)` | 修改硬直时间 |
| `CheckSkilledImmune(character, target, skill, item?)` | 免疫检定 |
| `CheckExemption(character, source, effect)` | 豁免检定 |

## 时间机制

| 方法 | 说明 |
|---|---|
| `TimeLapse()` | 时间流逝，硬直时间衰减。返回本次流逝的时间。每次计算保留两位小数 |

```csharp
// 游戏循环
while (round < maxRound)
{
    Character? actor = queue.NextCharacter();
    if (actor == null)
    {
        // 没有人可以行动 → 时间流逝
        queue.TimeLapse();
        continue;
    }

    bool isGameEnd = queue.ProcessTurn(actor);
    if (isGameEnd) break;
}
```

## 三种队列对比

| 队列 | 适用场景 | 构造函数 |
|---|---|---|
| `GamingQueue` | 基类，可继承自定义 | `new GamingQueue(writer)` |
| `MixGamingQueue` | 混战（所有人互殴） | `new MixGamingQueue(characters, writer)` |
| `TeamGamingQueue` | 团队战 | `new TeamGamingQueue(writer)` + `AddTeam()` |

## 继承扩展

```csharp
public class MyGameMode : GamingQueue
{
    public MyGameMode(Action<string> writer) : base(writer) { }

    // 重写队伍判定
    public override List<Character> GetTeammates(Character c)
        => AllCharacters.Where(x => x.Team == c.Team).ToList();
}
```

## 31 个事件

详见 [GamingQueue 事件模式](/dev/events-overview)。
