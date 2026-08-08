# Grid

地图格子，位于 `Milimoe.FunGame.Core.Model.Framework`。战棋地图的最小单位，承载角色、特效与交互点。

## 构造函数

```csharp
public Grid(int id, int x, int y, int z)
```

## 静态成员

```csharp
// 空格子（无效位置占位，Id = -1）
public static Grid Empty { get; }
```

## 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `Id` | `int` | 格子唯一标识（只读） |
| `X` / `Y` / `Z` | `int` | 三维坐标（只读） |
| `Characters` | `HashSet<Character>` | 格子上的角色 |
| `Effects` | `HashSet<Effect>` | 格子上的特效 |
| `InteractionPoints` | `HashSet<InteractionPoint>` | 格子上的交互点 |
| `Color` | `Color` | 格子颜色（默认 Gray） |

## 事件

```csharp
public delegate void CharacterEnteredHandler(Character character);
public event CharacterEnteredHandler? CharacterEntered;  // 角色进入格子
public void OnCharacterEntered(Character character);

public delegate void CharacterExitedHandler(Character character);
public event CharacterExitedHandler? CharacterExited;    // 角色离开格子
public void OnCharacterExited(Character character);
```

## 使用示例

```csharp
// 地图取格
Grid? grid = map[3, 4, 0];        // 按坐标
Grid? grid2 = map[1001];          // 按 Id

// 角色进入
map.SetCharacterCurrentGrid(character, grid);

// 格子事件
grid.CharacterEntered += c => Console.WriteLine($"{c} 进入了格子 {grid.Id}");
```

## 关联

- 地图类 → [GameMap](/api/GameMap)
- 取格方法 → [GameMap - 取格](/api/GameMap#取格范围计算)
