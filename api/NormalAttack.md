# NormalAttack

普通攻击，位于 `Milimoe.FunGame.Core.Entity`。实现 `ISkill` 接口的特殊技能类型，基于角色的总攻击力造成伤害。

## 构造函数

```csharp
// character：所属角色；isMagic：是否附魔为魔法伤害；magicType：魔法属性类型
public NormalAttack(Character character, bool isMagic = false, MagicType magicType = MagicType.None)
```

## 伤害计算

| 属性 | 类型 | 说明 |
|---|---|---|
| `Damage` | `double` | 最终伤害（只读）：`Character.ATK × BaseDamageMultiplier × (1 + ExDamage2) + ExDamage` |
| `ExDamage` | `double` | 额外伤害（固定值） |
| `ExDamage2` | `double` | 额外伤害百分比加成 |
| `BaseDamageMultiplier` | `double` | 基础伤害倍率（随等级成长） |
| `Level` | `int` | 等级（最高 8 级，升级等级 8/16/24/32/40/48/56） |
| `IsMagic` | `bool` | 是否魔法伤害（只读） |
| `MagicType` | `MagicType` | 魔法属性类型（只读） |

## 硬直时间

| 属性 | 类型 | 说明 |
|---|---|---|
| `HardnessTime` | `double` | 基础硬直时间 |
| `ExHardnessTime` / `ExHardnessTime2` | `double` | 额外硬直时间 |
| `RealHardnessTime` | `double` | 实际硬直时间（只读）：`HardnessTime × (1 - 行动系数)` |

## 目标选择（ISkill）

| 属性 | 类型 | 说明 |
|---|---|---|
| `CanSelectSelf` / `CanSelectEnemy` / `CanSelectTeammate` | `bool` | 可选目标类型 |
| `SelectAllEnemies` / `SelectAllTeammates` | `bool` | 全选敌人/队友 |
| `CanSelectTargetCount` | `int` | 可选目标数量（默认 1） |
| `CanSelectTargetRange` | `int` | 目标选择范围 |

## 主要方法

| 方法 | 说明 |
|---|---|
| `Attack(IGamingQueue queue, Character attacker, DamageCalculationOptions? options, params Character[] enemys)` | 执行普攻（伤害结算 + 特效触发） |
| `SetMagicType(bool? isMagic, MagicType? magicType, IGamingQueue? queue)` | 设置附魔（转为魔法伤害） |
| `SetMagicType(NormalAttackOfEffect, IGamingQueue?)` | 由特效设置附魔 |
| `UnsetMagicType(Effect, IGamingQueue?)` | 取消特效附魔 |
| `GetSelectableTargets(...)` / `SelectTargets(...)` | 获取可选目标 / 选择目标 |
| `GetInfo(bool showOriginal)` | 输出攻击信息 |

## 附魔机制（NormalAttackOfEffect）

特效可以对普通攻击进行附魔，`NormalAttackOfEffects` 字典记录每个特效的附魔信息：

```csharp
public class NormalAttackOfEffect(Effect effect, bool isMagic, MagicType type, int priority)
{
    public Effect Effect { get; set; }
    public bool IsMagic { get; set; }
    public MagicType MagicType { get; set; }
    public int Priority { get; set; }
}
```

> 装备的武器类型为法杖或法器时自动附魔；未指定附魔类型时默认为角色的魔法属性类型。

## 关联

- 普攻规则 → [普通攻击](/guide/skills-normal-attack)
- 使用示例 → [完整示例](/dev/examples)
