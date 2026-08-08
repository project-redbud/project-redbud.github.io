# GameMap

战棋地图基类（抽象类），位于 `Milimoe.FunGame.Core.Model.Framework`。网格数据 + 队列事件介入，需继承实现。

## 抽象成员

```csharp
public abstract string Name { get; }        // 地图名称
public abstract string Description { get; } // 描述
public abstract string Version { get; }     // 版本
public abstract string Author { get; }      // 作者

public abstract int Length { get; }  // 长度
public abstract int Width { get; }   // 宽度
public abstract int Height { get; }  // 高度
public abstract float Size { get; }  // 格子大小

// 返回一个绑定到队列的新地图实例（模组是单例的，每次游戏需新实例）
public abstract GameMap InitGamingQueue(IGamingQueue queue);
```

## 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `Grids` | `Dictionary<long, Grid>` | 格子集合（按 Id） |
| `GridsByCoordinate` | `Dictionary<(int x, int y, int z), Grid>` | 格子集合（按坐标） |
| `Characters` | `Dictionary<Character, Grid>` | 角色 → 所在格子 |

### 索引器

```csharp
public Grid? this[int x, int y, int z = 0]  // 按坐标取格子
public Grid? this[long id]                  // 按 Id 取格子
```

## 主要方法

### 加载与角色位置

| 方法 | 说明 |
|---|---|
| `Load(params object[] objs)` | 加载地图（生成格子，`BeforeLoad` 可阻止） |
| `GetCharacterCurrentGrid(Character)` | 获取角色所在格子 |
| `SetCharacterCurrentGrid(Character, Grid)` | 设置角色所在格子 |
| `RemoveCharacter(Character)` | 移除角色 |

### 取格（范围计算）

| 方法 | 说明 |
|---|---|
| `GetGridsByRange(Grid, int range, bool includeCharacter)` | 菱形范围（曼哈顿距离） |
| `GetOuterGridsByRange(Grid, int range, bool includeCharacter)` | 菱形外圈 |
| `GetGridsByCircleRange(Grid, int range, bool includeCharacter)` | 圆形范围 |
| `GetOuterGridsByCircleRange(...)` | 圆形外圈 |
| `GetGridsBySquareRange(Grid, int range, bool includeCharacter)` | 方形范围 |
| `GetOuterGridsBySquareRange(...)` | 方形外圈 |
| `GetGridsOnLine(Grid casterGrid, Grid targetGrid, bool passThrough, bool includeCharacter)` | 直线（可贯通） |
| `GetGridsOnThickLine(Grid start, Grid directionRef, int range, bool passThrough, bool includeChar)` | 粗直线 |
| `GetGridsInSector(Grid casterGrid, Grid targetGrid, int range, double angleDegrees, bool includeCharacter)` | 扇形 |

### 移动

| 方法 | 说明 |
|---|---|
| `CharacterMove(Character, Grid? current, Grid target)` | 角色移动（检查可达性与占用） |
| `CharacterMoveToClosestReachable(Character, Grid? current, Grid target)` | 移动到最接近的可达格子 |

### 静态工具

| 方法 | 说明 |
|---|---|
| `CalculateManhattanDistance(Grid g1, Grid g2)` | 曼哈顿距离 |
| `GCD(int a, int b)` | 最大公约数 |
| `GetLinePoints(int x0, int y0, int x1, int y1)` | 两点间直线坐标点集 |

### 时间流逝

| 方法 | 说明 |
|---|---|
| `OnTimeElapsed(double timeToReduce)` | 时间流逝（`BeforeTimeElapsed`/`AfterTimeElapsed` 为虚方法扩展点） |

## 继承示例

```csharp
public class ExampleGameMap : GameMap
{
    public override string Name => "fungame.example.gamemap";
    public override int Length => 12;
    public override int Width => 12;
    public override int Height => 6;
    public override float Size => 4.0f;

    public override GameMap InitGamingQueue(IGamingQueue queue)
    {
        GameMap map = new ExampleGameMap();
        map.Load();
        if (queue is GamingQueue gq)
        {
            gq.SelectTargetGridEvent += Gq_SelectTargetGrid;  // 介入目标选择
        }
        return map;
    }
}
```

## 关联

- 模组中的地图 → [模组开发总览](/dev/module-overview)
- 格子结构 → [Grid](/api/Grid)
- 战棋玩法 → [回合制系统](/guide/turn-based)
