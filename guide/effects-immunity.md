# 免疫 & 豁免

## ImmuneType 免疫类型（位标志枚举）

```csharp
[Flags]
public enum ImmuneType
{
    None = 0,
    Physical = 1 << 0,   // 物理免疫
    Magical = 1 << 1,    // 魔法免疫
    Skilled = 1 << 2,    // 技能免疫
    All = 1 << 3,        // 完全免疫（物理 + 技能）
    Special = 1 << 4     // 特殊免疫
}
```

因为是位标志，可以组合：

```csharp
ImmuneType immunity = ImmuneType.Physical | ImmuneType.Magical;
```

## 免疫优先级

```
免疫 > 豁免 > 免控护盾
```

当角色同时具有免疫、豁免和免控护盾时，免疫优先生效。

---

## 豁免系统

豁免由角色的**核心属性**决定，每个控制效果关联一个豁免属性：

### 力量豁免 (STR)

| 可豁免的 EffectType |
|---|
| `Stun`（眩晕）、`Freeze`（冻结）、`Knockdown`（击倒）、`Taunt`（嘲讽）、`Root`（定身）、`Disarm`（缴械）、`Petrify`（石化）、`GrievousWound`（重伤） |

### 敏捷豁免 (AGI)

| 可豁免的 EffectType |
|---|
| `Sleep`（睡眠）、`Fear`（恐惧）、`Slow`（减速）、`Blind`（致盲）、`Cripple`（致残）、`Burn`（燃烧）、`Bleed`（流血）、`Delay`（迟滞） |

### 智力豁免 (INT)

| 可豁免的 EffectType |
|---|
| `Silence`（沉默）、`SilenceMagic`（法术沉默）、`Charm`（魅惑）、`Confusion`（混乱）、`Banish`（放逐）、`InterruptCasting`（打断施法）、`Curse`（诅咒）、`Exhaustion`（疲劳）、`ManaBurn`（魔力燃烧）、`Vulnerable`（易伤） |

### 豁免类型

| 豁免类型 | 说明 |
|---|---|
| **无豁免** | 默认。控制效果施加后，通过驱散解除 |
| **软豁免** | 施加时豁免检定，成功则不受此控制影响。默认几率 0% |
| **强豁免** | 豁免成功时，除不受影响外，还**反弹**给施法者 |

每 1 点核心属性提升豁免率：
- 力量豁免率：每点 +0.1%
- 敏捷豁免率：每点 +0.1%
- 智力豁免率：每点 +0.1%
