# 接入协同行动

协同行动由队列管理申请与校验，宿主负责收集协作方的动作/目标，以及让回合角色选择申请。规则见[协同行动](/guide/chain-action)，入口见 [GamingQueue](/api/GamingQueue#协同行动)。

## 通过正常行动分支确认

在 `TurnStartEvent` 或正常决策期间调用 `SubmitChainAction`。选择协同时，`DecideActionEvent` 返回 `CharacterActionType.ChainAction`，`SelectChainActionEvent` 返回申请 ID；主循环负责协调方的确认硬直、动作外发与回合收尾。

下例为已有队列绑定事件。`coordinator`、`partner` 和 `enemy` 是本局角色；队伍、位置和预算须已满足协作条件。

```csharp
using FunGame.Core.Entity;
using FunGame.Core.Library.Constant;
using FunGame.Core.Model.Framework;
using FunGame.Core.Model.Queue;

static void BindChainActions(
    GamingQueue queue, Character coordinator, Character partner, Character enemy)
{
    queue.TurnStartEvent += ctx =>
    {
        if (ctx.Trigger == coordinator)
        {
            ChainActionRequest? request = queue.SubmitChainAction(
                coordinator, partner, CharacterActionType.NormalAttack,
                [enemy], out string failure);
            if (request is null) queue.WriteLine(failure);
        }
        return true;
    };

    queue.DecideActionEvent += ctx =>
        ctx.Trigger == coordinator && ctx.ChainActions.Count > 0
            ? CharacterActionType.ChainAction
            : CharacterActionType.EndTurn;

    queue.SelectChainActionEvent += (actor, pending) =>
        actor == coordinator ? pending.FirstOrDefault()?.Id : null;
}
```

协作申请的类型与动作对应如下：

| 申请类型 | 动作参数 |
|---|---|
| `NormalAttack` | 不传 `skill` / `item` |
| `CastSkill` | `SkillType.Skill` 战技 |
| `PreCastSkill` | `SkillType.Magic` 魔法 |
| `CastSuperSkill` | `SkillType.SuperSkill` 爆发技，按正常爆发成本执行 |
| `UseItem` | 传 `item` 及其主动技能；仅传 `item` 时可自动取 `item.Skills.Active` |

地图中的非指向性技能用 `targetGrids`，符合空地施法条件时可传空的 `targets`。申请目标集合在提交时复制；实体引用仍共享。确认会重新校验，不要以界面上的旧申请替代实时校验结果。

非指向性规划结果还可传 `castCenter: decision.CastCenter`。中心是选择落点或方向参考格，`targetGrids` 是影响格；提供中心时队列重验中心射程并重算范围，未提供中心则沿用直接提交格子的校验契约。AI 代交申请会携带中心；[决策表](/dev/decision-tables)也用于协作方规划，协同禁止移动，表内 `endTurn` 表示不提交申请。

## 生命周期与取消

`GetAvailableChainActors` 查询当前连续同队区间；`GetPendingChainActions` 返回仍有效的申请，并清除已失效的申请。协作方可用 `WithdrawChainAction` 撤回自己的申请。

申请绑定一次 `ProcessTurn` 的 `ChainActionTurnId`。同一协作方提交新申请会替换旧申请；回合结束统一清空。手动角色未选择申请时可以返回 `null`；AI 未选择时由内置选择逻辑回退。

队列及其入口按同步模型运行。网络或 UI 线程应把请求串行派发到本局游戏循环，不能嵌套调用 `ProcessTurn`。

## 接管整回合时直接确认

直接调用 `ConfirmChainAction` 仍须处于协调方自己的回合内。它扣减双方预算、记录确认成本并执行协作方动作，但**不为协调方写确认硬直或收尾**。

如果 `TurnStartEvent` 返回 `false` 接管整个回合，宿主须处理协调方的确认硬直入账、确认记录的硬直、回合聚合、所需钩子及重新入队；不能把直接确认当成主循环已完成的一次行动。通常应使用上面的正常 `ChainAction` 分支接入。

## 吟唱结算与失败后的菜单

普通和协同魔法都由正常回合释放，会触发回合开始/结束、奖励及特效钩子。`Casting` 态的释放尝试不触发 `DecideActionEvent`；失败或提前被打断后，主循环可以再次调用它，菜单应使用当前保留的 DP 与配额。

`TurnStartEvent` 返回 `false` 也能接管吟唱结算。未完成释放时保留施法上下文，宿主负责收尾与重新入队，后续回合继续释放。

## 记录与回放

成功确认会保存协调方确认记录和协作方执行记录，共享 `ChainActionRequestId`。执行记录 `Actor` 为协作方，`TurnActor` 为原协调方；确认记录另有 `ChainActor`。读取具体目标、费用与伤害时使用 `RoundRecord.Actions`，不要仅依赖回合级汇总字典。

即时动作在确认记录上保存 `NonDamageAssistTargets`。魔法成功释放时才建立有效协调辅助；失败记录归施法者，不会把打断者的当前成功动作误记为失败。

`ActionRecord.HardnessTime` / `CastTime` 是单次操作自身的值，在外发前填写。原队列位置 `x` 的还原属于回合或队列层，不计入单条释放记录硬直。外部终止的独立失败记录也可能在他人回合或时间流逝阶段外发。
