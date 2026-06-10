# EquilibriumConstant

游戏平衡常数，位于 `Milimoe.FunGame.Core.Model`。

所有数值完全可配置。默认值可通过 `General.GameplayEquilibriumConstant` 获取。

## 使用方法

```csharp
var eq = new EquilibriumConstant
{
    InitialHP = 100,
    MaxLevel = 60,
    InGameTime = "秒",
    InGameCurrency = "金币",
};

var queue = new MixGamingQueue(characters, Console.WriteLine)
{
    GameplayEquilibriumConstant = eq
};
```

## 术语与基础

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `InGameCurrency` | `string` | `"金币"` | 游戏货币名称 |
| `InGameMaterial` | `string` | `"材料"` | 第二货币名称 |
| `InGameTime` | `string` | `"时间"` | 时间单位名称 |
| `UseMagicType` | `HashSet<MagicType>` | 全部 9 种 | 启用的魔法类型 |

## 角色属性（初始值）

| 属性 | 类型 | 默认值 | 相关公式 |
|---|---|---|---|
| `InitialHP` | `double` | 60 | `BaseHP = InitialHP + (Lv-1)×(LevelToHPFactor + HPGrowthFactor×InitialHP) + BaseSTR×STRtoHPFactor` |
| `InitialMP` | `double` | 10 | `BaseMP = InitialMP + (Lv-1)×(LevelToMPFactor + MPGrowthFactor×InitialMP) + BaseINT×INTtoMPFactor` |
| `InitialATK` | `double` | 15 | `BaseATK = InitialATK + (Lv-1)×(LevelToATKFactor + ATKGrowthFactor×InitialATK) + BasePrimaryAttribute` |
| `InitialDEF` | `double` | 5 | `BaseDEF = InitialDEF + BaseSTR×STRtoDEFFactor` |
| `MaxEP` | `double` | 200 | 爆发能量上限 |

## 等级与成长

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `MaxLevel` | `int` | 60 | 角色最高等级 |
| `EXPUpperLimit` | `Dictionary<int, double>` | 1级1000... | 每级经验上限 |
| `UseLevelBreak` | `bool` | true | 启用等级突破 |
| `LevelBreakList` | `HashSet<int>` | [10,20,30,40,50,60] | 突破等级节点 |
| `STRGrowth` | `double` | 0 | 每级力量成长 |
| `AGIGrowth` | `double` | 0 | 每级敏捷成长 |
| `INTGrowth` | `double` | 0 | 每级智力成长 |

## 等级成长因子

| 属性 | 默认值 | 公式用途 |
|---|---|---|
| `LevelToHPFactor` | 17 | `(Lv-1) × 17` |
| `HPGrowthFactor` | 0.68 | `(Lv-1) × 0.68 × InitialHP` |
| `LevelToATKFactor` | 0.95 | `(Lv-1) × 0.95` |
| `ATKGrowthFactor` | 0.045 | `(Lv-1) × 0.045 × InitialATK` |
| `LevelToMPFactor` | 1.5 | `(Lv-1) × 1.5` |
| `MPGrowthFactor` | 0.14 | `(Lv-1) × 0.14 × InitialMP` |
| `DEFReductionFactor` | 240 | `PDR = DEF / (DEF + 240)` |

## 核心属性系数

| 属性 | 默认值 | 公式 |
|---|---|---|
| `STRtoHPFactor` | 13 | 每 1 力量 + 13 HP |
| `STRtoHRFactor` | 0.15 | 每 1 力量 + 0.15 生命回复 |
| `STRtoDEFFactor` | 0.75 | 每 1 力量 + 0.75 DEF |
| `STRtoCritDMGMultiplier` | 0.00575 | 每 1 力量 + 0.575% 暴击伤害 |
| `STRtoExemptionRateMultiplier` | 0.001 | 每 1 力量 + 0.1% 力量豁免率 |
| `INTtoMPFactor` | 8 | 每 1 智力 + 8 MP |
| `INTtoCDRMultiplier` | 0.0025 | 每 1 智力 + 0.25% 冷却缩减 |
| `INTtoMRFactor` | 0.1 | 每 1 智力 + 0.1 魔法回复 |
| `INTtoCastMPReduce` | 0.00125 | 每 1 智力 - 0.125% 魔法消耗 |
| `INTtoCastEPReduce` | 0.00075 | 每 1 智力 - 0.075% EP 消耗 |
| `INTtoAccelerationCoefficientMultiplier` | 0.00125 | 每 1 智力 + 0.125% 加速系数 |
| `INTtoExemptionRateMultiplier` | 0.001 | 每 1 智力 + 0.1% 智力豁免率 |
| `AGItoSPDMultiplier` | 0.65 | 每 1 敏捷 + 0.65 SPD |
| `AGItoCritRateMultiplier` | 0.0025 | 每 1 敏捷 + 0.25% 暴击率 |
| `AGItoEvadeRateMultiplier` | 0.00175 | 每 1 敏捷 + 0.175% 闪避率 |
| `AGItoExemptionRateMultiplier` | 0.001 | 每 1 敏捷 + 0.1% 敏捷豁免率 |

## 战斗基础值

| 属性 | 默认值 | 说明 |
|---|---|---|
| `CritRate` | 0.05 | 初始暴击率 (5%) |
| `CritDMG` | 1.25 | 初始暴击伤害 (125%) |
| `EvadeRate` | 0.05 | 初始闪避率 (5%) |
| `SPDUpperLimit` | 1500 | 行动速度上限 |
| `DamageGetEPFactor` | 0.03 | 造成伤害获 EP 系数 |
| `DamageGetEPMax` | 30 | 造成伤害获 EP 上限 |
| `TakenDamageGetEPFactor` | 0.015 | 受到伤害获 EP 系数 |
| `TakenDamageGetEPMax` | 15 | 受到伤害获 EP 上限 |

## 技能等级上限

| 属性 | 默认值 | 说明 |
|---|---|---|
| `MaxNormalAttackLevel` | 8 | 普通攻击 |
| `MaxMagicLevel` | 8 | 魔法 |
| `MaxSkillLevel` | 6 | 战技 |
| `MaxSuperSkillLevel` | 6 | 爆发技 |
| `MaxPassiveSkillLevel` | 6 | 被动 |

## 决策点

| 属性 | 默认值 | 说明 |
|---|---|---|
| `InitialDecisionPoints` | 1 | 初始决策点 |
| `MaxDecisionPoints` | 7 | 决策点上限 |
| `RecoverDecisionPointsPerRound` | 1 | 每回合回复 |
| `DecisionPointsCostNormalAttack` | 1 | 普攻消耗 |
| `DecisionPointsCostSkill` | 2 | 战技消耗 |
| `DecisionPointsCostSuperSkill` | 2 | 爆发技（回合内）消耗 |
| `DecisionPointsCostSuperSkillOutOfTurn` | 3 | 爆发技（回合外）消耗 |
| `DecisionPointsCostMagic` | 2 | 魔法消耗 |
| `DecisionPointsCostItem` | 1 | 物品消耗 |

## 武器属性速查

| 武器 | 倍率 | 倍率成长 | 硬直 | 距离 |
|---|---|---|---|---|
| 单手剑 | 1.00 | 0.05 | 8 | 1 |
| 双手剑 | 1.20 | 0.06 | 12 | 2 |
| 弓 | 0.90 | 0.04 | 9 | 4 |
| 手枪 | 0.90 | 0.03 | 6 | 3 |
| 步枪 | 1.10 | 0.05 | 11 | 5 |
| 双持短刀 | 0.85 | 0.04 | 7 | 1 |
| 法器 | 1.00 | 0.05 | 10 | 5 |
| 法杖 | 1.15 | 0.04 | 12 | 3 |
| 长柄 | 0.95 | 0.05 | 10 | 2 |
| 拳套 | 1.05 | 0.05 | 8 | 1 |
| 暗器 | 0.90 | 0.05 | 7 | 4 |

## 一次性应用到实体

```csharp
eq.SetEquilibriumConstant(character1, character2, skill1, effect1);
```

所有实体共享同一套平衡常数，保证数值一致性。
