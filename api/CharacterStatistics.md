# CharacterStatistics

角色统计数据，位于 `FunGame.Core.Entity`。记录角色在一局游戏（或累计生涯）中的各项统计，由 `GamingQueue` 自动维护，随事件 `"3"` 外发。

## 伤害统计

| 属性 | 说明 |
|---|---|
| `TotalDamage` / `AvgDamage` | 总计 / 平均伤害 |
| `TotalPhysicalDamage` / `TotalMagicDamage` / `TotalTrueDamage` | 物理 / 魔法 / 真实伤害 |
| `TotalTakenDamage` / `AvgTakenDamage` | 总计 / 平均受到伤害 |
| `TotalTakenPhysicalDamage` / `TotalTakenMagicDamage` / `TotalTakenTrueDamage` | 受到物理 / 魔法 / 真实伤害 |

## 治疗与护盾

| 属性 | 说明 |
|---|---|
| `TotalHeal` / `AvgHeal` | 总计 / 平均治疗量 |
| `TotalShield` / `AvgShield` | 总计 / 平均护盾值 |

## 生存统计

| 属性 | 说明 |
|---|---|
| `LiveRound` / `AvgLiveRound` | 存活回合数 |
| `LiveTime` / `AvgLiveTime` | 存活时间 |
| `ActionTurn` / `AvgActionTurn` | 行动回合数 |
| `ControlTime` / `AvgControlTime` | 被控制时间 |

## 输出效率

| 属性 | 说明 |
|---|---|
| `DamagePerRound` | 每回合伤害 |
| `DamagePerTurn` | 每次行动伤害 |
| `DamagePerSecond` | 每秒伤害 |

## 对局表现

| 属性 | 说明 |
|---|---|
| `Kills` / `Deaths` / `Assists` | 击杀 / 死亡 / 助攻 |
| `FirstKills` / `FirstDeaths` | 一血 / 首死 |
| `TotalEarnedMoney` / `AvgEarnedMoney` | 总计 / 平均获得金币 |
| `UseDecisionPoints` / `TurnDecisions` | 使用决策点 / 决策次数 |
| `Rating` | 技术得分 |
| `MVPs` | MVP 次数 |

## 生涯统计（跨对局）

| 属性 | 说明 |
|---|---|
| `Plays` / `Wins` / `Loses` | 场次 / 胜场 / 负场 |
| `Top3s` / `Top3rate` | 前三名次数 / 前三率 |
| `LastRank` / `AvgRank` | 最近排名 / 平均排名 |
| `Winrate` | 胜率 |

## 使用示例

```csharp
// GamingQueue 自动记录所有统计数据
foreach (Character character in queue.CharacterStatistics
    .OrderByDescending(d => d.Value.Rating).Select(d => d.Key))
{
    CharacterStatistics stats = queue.CharacterStatistics[character];
    Console.WriteLine($"{character}：伤害 {stats.TotalDamage:0.##}，击杀 {stats.Kills}，评分 {stats.Rating:0.0#}");
}
```

## 关联

- 赛后统计示例 → [完整示例](/dev/examples#赛后统计)
- 外发事件 `"3"` → [即时外发功能](/dev/outbound)
