# RoundRecordRenderer

回合记录文本渲染器，位于 `Milimoe.FunGame.Core.Api`。静态类。

将回合记录（`RoundRecord`）渲染为可读文本，用于回放与战斗日志。

## 方法

| 方法 | 签名 | 说明 |
|---|---|---|
| `RenderRound` | `static string RenderRound(RoundRecord round)` | 渲染单回合为文本 |
| `RenderAll` | `static string RenderAll(IEnumerable<RoundRecord> rounds)` | 渲染全部回合 |
| `RenderCharacterActions` | `static string RenderCharacterActions(IEnumerable<RoundRecord> rounds, Character character)` | 渲染指定角色的全部行动 |

## 使用示例

```csharp
using FunGame.Core.Api;

List<RoundRecord> rounds = LoadRounds(queueId);

// 渲染整场战斗
string battleText = RoundRecordRenderer.RenderAll(rounds);

// 渲染单个回合
string roundText = RoundRecordRenderer.RenderRound(rounds[0]);

// 渲染指定角色的行动
string myActions = RoundRecordRenderer.RenderCharacterActions(rounds, character);
```

## 关联

- 状态推算 → [BattleStatePredictor](/api/BattleStatePredictor)
- 回合记录结构 → [RoundRecord](/api/RoundRecord)
