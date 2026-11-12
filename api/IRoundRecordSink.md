# IRoundRecordSink

回合记录外发通道接口，位于 `FunGame.Core.Interface.Base`。

实现方负责将记录序列化并发送（如 POST 到远程服务、写入消息队列等）。`GamingQueue.RoundRecordSink` 属性赋值的瞬间会调用 `Attach(Guid)`。

## 方法

| 方法 | 事件 id | 触发时机 | 参数说明 |
|---|---|---|---|
| `Attach(Guid queueId)` | — | 设置 `RoundRecordSink` 属性时 | 绑定所属队列，提供队列 Guid |
| `End()` | — | 游戏结束时 | 停止握手重试等 |
| `SendAction(ActionRecord)` | `"0"` | 每次角色操作完成后 | 单次操作记录（实时增量推送） |
| `SendRound(RoundRecord)` | `"1"` | 每次角色操作完成后 | 当前回合数据（含本回合操作流与汇总） |
| `SendCheckpointRound(RoundRecord)` | `"2"` | 回合结束且为检查点时 | 检查点回合记录（附全角色状态快照） |
| `SendCharacterStatistics(Dictionary<Guid, CharacterStatistics>)` | `"3"` | 回合结束时 | 角色 Guid → 统计数据 |
| `SendCharacters(IEnumerable<Character>)` | `"4"` | 回合结束时 | 参与本局的所有角色 |
| `SendTeams(IEnumerable<Team>)` | `"5"` | 回合结束时（团队模式） | 当前存活的团队 |
| `SendQueueData(Dictionary<Guid, double>)` | `"6"` | 每次角色操作完成后 | 角色 Guid → 当前等待时间 |
| `SendEliminatedCharacters(IEnumerable<string>)` | `"7"` | 每次角色操作完成后 | 已淘汰/死亡角色 Guid |
| `SendEliminatedTeams(IEnumerable<string>)` | `"8"` | 回合结束时（团队模式） | 已淘汰团队 Name |

## 自定义实现

```csharp
public class MyMQSink : IRoundRecordSink
{
    public void Attach(Guid queueId) { }
    public void End() { }
    public void SendAction(ActionRecord action) { }
    public void SendRound(RoundRecord round) { }
    public void SendCheckpointRound(RoundRecord round) { }
    public void SendCharacterStatistics(Dictionary<Guid, CharacterStatistics> statistics) { }
    public void SendCharacters(IEnumerable<Character> characters) { }
    public void SendTeams(IEnumerable<Team> teams) { }
    public void SendQueueData(Dictionary<Guid, double> queueData) { }
    public void SendEliminatedCharacters(IEnumerable<string> characterGuids) { }
    public void SendEliminatedTeams(IEnumerable<string> teamNames) { }
}
```

> Action / Round / Checkpoint 使用结构快照，实体引用仍共享；其他参数按各外发入口提供，不能推断为深拷贝。异步消费者需要按自身用途冻结实体及嵌套数据，避免读取后续变化。

## 关联

- 外发功能使用 → [即时外发功能](../dev/outbound.md)
- 官方默认实现 → [DefaultRoundRecordSink](./DefaultRoundRecordSink.md)
- 服务器端协议 → [专用服务器开发](../dev/outbound-server.md)
