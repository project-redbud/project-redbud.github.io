# GamingQueue

回合制游戏队列基类，位于 `Milimoe.FunGame.Core.Model`。

默认实现为混战模式 (`RoomType.Mix`)，可继承扩展。

## 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `GameplayEquilibriumConstant` | `EquilibriumConstant` | 使用的游戏平衡常数 |
| `WriteLine` | `Action<string>` | 日志输出委托 |
| `IsDebug` | `bool` | 调试模式 |
| `AllCharacters` | `List<Character>` | 参与游戏的所有角色 |
| `Queue` | `List<Character>` | 当前行动顺序 |
| `HardnessTime` | `Dictionary<Character, double>` | 硬直时间表 |
| `Eliminated` | `List<Character>` | 已死亡角色（按死亡顺序） |
| `TotalTime` | `double` | 游戏运行时间 |
| `TotalRound` | `int` | 游戏总回合数 |
| `Map` | `GameMap?` | 使用的地图 |

## 主要方法

| 方法 | 说明 |
|---|---|
| `ProcessTurn(Character)` | 处理角色回合 |
| `DamageToEnemy(...)` | 对敌人造成伤害 |
| `HealToTarget(...)` | 治疗目标 |
| `CalculatePhysicalDamage(...)` | 计算物理伤害 |
| `CalculateMagicalDamage(...)` | 计算魔法伤害 |
| `DeathCalculation(Character, Character)` | 死亡结算 |
| `InterruptCasting(...)` | 打断施法 |
| `UseItem(...)` | 使用物品 |
| `CharacterMove(...)` | 角色移动 |
| `SelectTargets(...)` | 选取技能/普攻目标 |
| `GetEnemies(Character)` | 获取敌人列表 |
| `GetTeammates(Character)` | 获取队友列表 |
| `ChangeCharacterHardnessTime(...)` | 修改硬直时间 |
| `CheckSkilledImmune(...)` | 免疫检定 |
| `CheckExemption(...)` | 豁免检定 |
| `Inquiry(Character, InquiryOptions)` | 向玩家发送询问 |

## 继承扩展

```csharp
public class MyGameMode : GamingQueue
{
    public MyGameMode(Action<string> writeLine) : base(writeLine) { }

    // 重写想要自定义的逻辑
    protected override void OnRoundStart(Character character) { ... }
    protected override void OnRoundEnd(Character character) { ... }
}
```
