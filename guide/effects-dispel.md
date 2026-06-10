# 驱散系统

## 驱散性类型 (DispelType)

| 枚举值 | 中文名 | 能力 |
|---|---|---|
| `None` | 无驱散 | 默认，不能驱散其他特效 |
| `Weak` | 弱驱散 | 消除可弱驱散的特效 |
| `DurativeWeak` | 持续性弱驱散 | 持续对弱驱散目标生效 |
| `TemporaryWeak` | 临时弱驱散 | 暂时使弱驱散可驱的特效无效化 |
| `Strong` | 强驱散 | 消除需强驱散和可弱驱散的特效 |
| `DurativeStrong` | 持续性强驱散 | 持续对强驱散目标生效 |
| `TemporaryStrong` | 临时强驱散 | 暂时使所有可驱散特效无效化 |
| `Special` | 特殊驱散 | 只对特定特效有效 |

## 被驱散性预设 (DispelledType)

由 `SkillSet.GetDispelledTypeByEffectType()` 自动判定：

| 特效类型 | 被驱散性 | 说明 |
|---|---|---|
| `None`, `Item`, `Knockback`, `Unselectable`, `Doom` | `CannotBeDispelled` | 不可驱散 |
| `Stun`, `Freeze`, `Silence`, `Root`, `Fear`, `Sleep`, `Knockdown`, `Taunt`, `Invulnerable`, `Charm`, `Disarm`, `Confusion`, `Petrify`, `SilenceMagic`, `Banish` | `Strong` | 需强驱散 |
| 所有其他类型 | `Weak` | 可弱驱散 |

## 驱散逻辑

在 `Effect.cs` 中的驱散实现：

```
强驱散 → 能消除 DispelledType.Weak + DispelledType.Strong
弱驱散 → 只能消除 DispelledType.Weak（且有限制：部分强控制无法被弱驱散消除）
特殊驱散 → 能消除 DispelledType.Special（由具体特效决定）
```

## 驱散目标策略

- **对敌方施加强驱散** → 移除所有 BUFF（`IsDebuff = false` 且可驱散的）
- **对友方施加强驱散** → 移除所有 DEBUFF + 控制状态（`IsDebuff = true` 且可驱散的），非吟唱态时恢复常态
- **对敌方施加弱驱散** → 移除可弱驱散的 BUFF
- **对友方施加弱驱散** → 移除除完全行动不能/行动受限/战斗不能外的控制效果 + 所有软控制
