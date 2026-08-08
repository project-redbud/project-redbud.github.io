# GamingQueue

回合制游戏队列基类，位于 `FunGame.Core.Model.Queue`。

提供混战模式的默认实现，可继承扩展。`MixGamingQueue` 和 `TeamGamingQueue` 是开箱即用的子类。

> 机制规则详见 [回合制系统](/guide/turn-based) 与 [行动顺序表](/guide/action-queue)。

## 构造函数

```csharp
// 无角色列表（后续用 InitCharacters 加载）
public GamingQueue(Action<string>? writer = null, GameMap? map = null)

// 带角色列表
public GamingQueue(List<Character> characters, Action<string>? writer = null, GameMap? map = null)
```

## 属性

### 基础配置

| 属性 | 类型 | 说明 |
|---|---|---|
| `GameplayEquilibriumConstant` | `EquilibriumConstant` | 游戏平衡常数（规则见 [EquilibriumConstant](/api/EquilibriumConstant)） |
| `WriteLine` | `Action<string>` | 日志输出委托（只读） |
| `IsDebug` | `bool` | 调试模式 |
| `Guid` | `Guid` | 本队列唯一标识（外发数据包的 `g` 字段） |
| `UseQueueProtected` | `bool` | 是否启用插队保护 |
| `MaxCutQueueTimes` | `int` | 插队保护最多被插队次数（-1 默认 = 队列长度，最少 5；0 不保护） |

### 队列状态

| 属性 | 类型 | 说明 |
|---|---|---|
| `AllCharacters` | `List<Character>` | 参与游戏的所有角色 |
| `Original` | `Dictionary<Guid, Character>` | 原始角色字典（用于复活还原） |
| `Queue` | `List<Character>` | 当前行动顺序（规则见 [行动顺序表](/guide/action-queue)） |
| `HardnessTime` | `Dictionary<Character, double>` | 硬直时间表 |
| `Eliminated` | `List<Character>` | 已死亡角色（按死亡顺序，规则见 [死亡机制](/guide/characters-death)） |
| `CharactersInAI` | `List<Character>` | 处于 AI 控制的角色 |
| `TotalTime` | `double` | 游戏运行时间 |
| `TotalRound` | `int` | 游戏总回合数 |
| `GameOver` | `bool` | 游戏是否已结束（只读） |
| `Map` | `GameMap?` | 使用的地图（见 [GameMap](/api/GameMap)） |

### 战斗数据

| 属性 | 类型 | 说明 |
|---|---|---|
| `CharacterStatistics` | `Dictionary<Character, CharacterStatistics>` | 角色统计数据（见 [CharacterStatistics](/api/CharacterStatistics)） |
| `AssistDetails` | `Dictionary<Character, AssistDetail>` | 助攻明细 |
| `EarnedMoney` | `Dictionary<Character, int>` | 金币奖励记录 |
| `FirstKiller` | `Character?` | 首个击杀者 |
| `MaxRespawnTimes` | `int` | 最大复活次数（0 不复活 / -1 无限 / >0 死斗） |
| `RespawnTimes` | `Dictionary<Character, int>` | 各角色已复活次数 |
| `RespawnCountdown` | `Dictionary<Character, double>` | 复活倒计时 |
| `MaxScoreToWin` | `int` | 获胜所需分数 |
| `CharacterDecisionPoints` | `Dictionary<Character, DecisionPoints>` | 角色决策点（规则见 [决策点](/guide/decision-points)） |
| `CustomData` | `Dictionary<string, object>` | 自定义数据（事件间传参） |

### 回合记录与外发

| 属性 | 类型 | 说明 |
|---|---|---|
| `LastRound` | `RoundRecord` | 上回合记录（见 [RoundRecord](/api/RoundRecord)） |
| `CurrentAction` | `ActionRecord?` | 当前操作记录（只读） |
| `Rounds` | `List<RoundRecord>` | 所有回合记录 |
| `RoundRewards` | `Dictionary<int, List<Skill>>` | 回合奖励表（规则见 [回合奖励](/guide/round-bonus)） |
| `CheckpointInterval` | `int` | 状态检查点生成间隔（回合数），默认 50；0 或负数不生成 |
| `RoundRecordSink` | `IRoundRecordSink?` | 回合记录外发通道（见 [即时外发](/dev/outbound)） |

## 主要方法

### 队列框架

| 方法 | 说明 |
|---|---|
| `InitCharacters(List<Character>)` | 初始化角色列表（复制原角色、初始化统计/助攻） |
| `InitActionQueue()` | 初始化行动顺序表（按速度排位，规则见 [行动顺序表 - 排位顺序](/guide/action-queue#排位顺序)） |
| `AddCharacter(Character, double hardnessTime, bool isCheckProtected = true)` | 添加角色到队列（含插队保护） |
| `RemoveCharacterFromQueue(params Character[])` | 从队列移除角色 |
| `ClearQueue()` | 清空队列 |
| `DisplayQueue()` | 输出队列信息 |

### 时间与回合

| 方法 | 说明 |
|---|---|
| `NextCharacter()` | 获取下一个可行动角色（硬直时间归零） |
| `TimeLapse()` | 时间流逝：硬直/冷却/特效持续时间衰减，回血回蓝（规则见 [回合制系统 - 时间](/guide/turn-based#时间)） |
| `ProcessTurn(Character)` | 处理角色回合（触发事件，返回是否游戏结束） |

### 地图

| 方法 | 说明 |
|---|---|
| `LoadGameMap(GameMap)` | 加载地图 |
| `RemoveCharacterFromMap(params Character[])` | 从地图移除角色 |
| `RemoveCharactersUnitFromMap(params Character[])` | 从地图移除角色的召唤单位 |

### 战斗结算

| 方法 | 说明 |
|---|---|
| `DamageToEnemy(actor, enemy, damage, isNormalAttack, ...)` | 造成伤害（完整流程：增伤→免疫→闪避→暴击→防御→护盾，规则见 [伤害计算](/guide/damage)） |
| `HealToTarget(actor, target, heal, ...)` | 治疗目标 |
| `DeathCalculation(killer, death)` | 死亡结算（规则见 [死亡机制](/guide/characters-death)） |
| `DeathCalculationByTeammate(killer, death)` | 队友击杀的死亡结算 |
| `DealWithCharacterDied(killer, death, assists)` | 处理角色死亡（击杀/助攻/统计） |
| `CalculatePhysicalDamage(...)` / `CalculateMagicalDamage(...)` | 物理/魔法伤害计算（返回 `DamageResult`） |
| `CalculateCharacterDamageStatistics(...)` | 更新角色伤害统计 |

### 技能与物品使用

| 方法 | 说明 |
|---|---|
| `UseItem(Item, Character, DecisionPoints, ...)` | 使用物品 |
| `CharacterMove(Character, DecisionPoints, Grid, Grid?)` | 角色移动 |
| `CheckCanCast(Character, Skill, out cost)` | 检查能否释放技能（消耗） |
| `CheckCanCast(Character, Item, out costMP, out costEP)` | 检查能否使用物品 |
| `GetTurnStartNeedyList(...)` | 获取回合开始所需列表 |
| `GetSelectedSkillTargetsList(...)` | 获取技能目标列表 |
| `Equip(Character, Item)` / `Equip(Character, EquipSlotType, Item, out Item?)` | 装备物品 |
| `UnEquip(Character, EquipSlotType)` | 卸下物品 |
| `AddCharacterEquipSlotSkills(Character, List<Skill>)`（static） | 添加装备栏技能 |

### 目标与敌我

| 方法 | 说明 |
|---|---|
| `GetEnemies(Character)` | 获取敌人列表 |
| `GetTeammates(Character)`（virtual） | 获取队友列表（可重写，规则见 [角色状态](/guide/characters-states)） |
| `IsTeammate(Character, Character)` | 判断是否队友 |
| `GetIsTeammateDictionary(Character, params Character[])` | 获取队友判定字典 |
| `IsSameFactionAs(Character, Character?)`（static） | 判断是否同阵营（召唤物关系） |
| `SelectTargetGrid(...)` / `SelectTargets(...)` | 目标选择（触发对应事件） |
| `SelectNonDirectionalSkillTargetGrid(...)` | 非指向性技能目标格子 |

### 状态与控制

| 方法 | 说明 |
|---|---|
| `SetCharactersToAIControl(bool bySystem, bool cancel, params Character[])` | 设置 AI/玩家控制 |
| `SetCharactersToAIControl(bool cancel, params Character[])` | 设置 AI/玩家控制（重载） |
| `IsCharacterInAIControlling(Character)` | 是否处于 AI 控制 |
| `IsCharacterInAIControllingBySystem(Character)` / `IsCharacterInAIControllingByUser(Character)` | 系统/玩家 AI 控制判定 |
| `CheckSkilledImmune(...)` | 技能免疫检定（规则见 [免疫 & 豁免](/guide/effects-immunity)） |
| `CheckExemption(...)` | 豁免检定（规则见 [免疫 & 豁免](/guide/effects-immunity)） |
| `InterruptCasting(caster, interrupter)` / `InterruptCasting(interrupter)` | 打断施法 |
| `ChangeCharacterHardnessTime(character, addValue, isPercentage, isCheckProtected)` | 修改硬直时间 |
| `SetCharacterRespawn(Character)` | 设置角色复活 |
| `SetCharacterPreCastSuperSkill(Character, Skill)` | 设置预释放爆发技（规则见 [爆发技](/guide/skills-ultimate)） |
| `SetNotDamageAssistTime(Character, params Character[])` | 设置不计算助攻时间 |
| `SetOnlyMoveHardnessTime(Character, DecisionPoints, ref double)` | 纯移动的硬直时间 |
| `DecisionPointsRecovery(Character)` | 决策点恢复（规则见 [决策点](/guide/decision-points)） |
| `Inquiry(Character, InquiryOptions)` | 向角色/玩家询问 |

### 回合奖励

| 方法 | 说明 |
|---|---|
| `InitRoundRewards(maxRound, maxRewardsInRound, effects, factoryEffects?)` | 初始化回合奖励表（规则见 [回合奖励](/guide/round-bonus)） |

### 工具（static）

| 方法 | 说明 |
|---|---|
| `GetActionType(DecisionPoints, pUseItem, pCastSkill, pNormalAttack)` | 根据概率决定行动类型 |
| `GetEP(double a, double b, double max)` | 计算获得的爆发能量 |

## 扩展点（protected 虚方法）

继承 `GamingQueue` 时可通过重写这些方法定制流程：

| 方法 | 说明 |
|---|---|
| `BeforeTurn(Character)` / `AfterTurn(Character)` | 回合前/后（bool 返回可跳过） |
| `AfterCharacterAction(Character, CharacterActionType)` | 角色行动后 |
| `AfterCharacterDecision(Character, DecisionPoints)` | 角色决策完成后 |
| `OnDeathCalculation(Character, Character)` / `AfterDeathCalculation(Character, Character?, Character[])` | 死亡结算前后（内置胜利判定：队列中全部同阵营即游戏结束） |
| `GetRespawnTime(Character, int times)` | 复活时间 |
| `GetCharacterTeamName(Character)` | 团队模式返回队伍名 |
| `AfterSendRoundEndData()` | 回合结束后额外外发（团队模式在此外发团队数据） |
| `ProcessCharacterDeath()` | 处理角色死亡 |
| `CreateStateCheckpoint()` | 生成全角色状态快照（检查点） |
| `GetRoundRewards(int round, Character)` / `RemoveRoundRewards(...)` | 回合奖励发放/移除 |
| `WillPreCastSuperSkill()` | 预释放爆发技处理 |

## 即时外发

设置 `RoundRecordSink` 后，队列会在游戏过程中自动向外发通道推送数据包：

- **每次操作结算完成后**：`SendAction`（"0"）、`SendRound`（"1"）、`SendQueueData`（"6"）、`SendEliminatedCharacters`（"7"）
- **回合结束时**：检查点回合 `SendCheckpointRound`（"2"）、`SendCharacterStatistics`（"3"）、`SendCharacters`（"4"）
- **游戏结束时**：`End()`（停止握手重试）

```csharp
using FunGame.Core.Api;

DefaultRoundRecordSink sink = new("https://example.com/api/round",
[
    RoundRecordSinkEventIds.Action,
    RoundRecordSinkEventIds.Round,
    RoundRecordSinkEventIds.CheckpointRound,
]);

queue.RoundRecordSink = sink;  // 赋值瞬间发起签名验证握手
```

> 团队模式下 `TeamGamingQueue` 还会额外外发 `SendTeams`（"5"）与 `SendEliminatedTeams`（"8"）。自定义队列可通过重写 `AfterSendRoundEndData()` 追加外发内容。

详见 [即时外发功能](/dev/outbound) 与 [专用服务器开发](/dev/outbound-server)。

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

    // 重写队伍判定（默认基于召唤物 Master 关系）
    public override List<Character> GetTeammates(Character character)
        => AllCharacters.Where(c => c != character && IsSameFactionAs(c, character)).ToList();
}
```

## 31 个事件

详见 [GamingQueue 事件模式](/dev/events-overview)。

## 关联

- 规则书：回合制 / 行动顺序表 / 决策点 / 伤害计算 / 回合奖励 / 角色状态 / 死亡机制 / 技能 / 特效
- 外发：即时外发功能 / 专用服务器开发
- 相关 API：[Character](/api/Character) / [Skill](/api/Skill) / [Effect](/api/Effect) / [Item](/api/Item) / [GameMap](/api/GameMap) / [RoundRecord](/api/RoundRecord)
