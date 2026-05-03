# MVP 进度地图

本文档用图形方式展示当前项目进度。建议在支持 Mermaid 的 Markdown 预览器中查看，例如 GitHub、VS Code Markdown Preview 或部分文档工具。

## 当前总览

```mermaid
flowchart LR
  P0["项目初始化"] --> P1["阶段 1<br/>日历档案页"]
  P1 --> P2["阶段 2<br/>肌群与动作预选"]
  P2 --> P3["阶段 3<br/>逐组打卡执行"]
  P3 --> P4["阶段 4<br/>数据联动与完善"]

  P0:::done
  P1:::done
  P2:::next
  P3:::todo
  P4:::todo

  classDef done fill:#181714,color:#F7F5F0,stroke:#181714,stroke-width:1px;
  classDef next fill:#EFE8D8,color:#181714,stroke:#181714,stroke-width:1px;
  classDef todo fill:#F7F5F0,color:#8B867C,stroke:#D8D1C4,stroke-width:1px;
```

## 阶段完成度

```mermaid
xychart-beta
  title "MVP 阶段完成度"
  x-axis ["项目初始化", "阶段 1", "阶段 2", "阶段 3", "阶段 4"]
  y-axis "完成度" 0 --> 100
  bar [100, 100, 0, 0, 0]
```

## 当前架构

```mermaid
flowchart TB
  subgraph Mobile["mobile：Expo + React Native"]
    Router["Expo Router"]
    Shell["档案 Stack 壳层"]
    Archive["首页：极简日历档案"]
    Settings["左上角入口：设置页"]
    Motion["Reanimated<br/>Spring 动效"]
    Theme["极简主题与排版"]
    I18n["中英文切换<br/>轻量 i18n"]

    Router --> Shell
    Shell --> Archive
    Archive --> Settings
    Archive --> Motion
    Archive --> Theme
    Theme --> I18n
  end

  subgraph Backend["backend：FastAPI"]
    API["FastAPI 应用"]
    Health["/health 健康检查"]
    DB["SQLite 本地数据库"]
    Models["SQLAlchemy 核心模型"]
    Seeds["默认动作种子数据"]

    API --> Health
    API --> DB
    DB --> Models
    Models --> Seeds
  end

  Mobile -. "阶段 4 接入真实 API" .-> Backend
```

## 数据模型地图

```mermaid
erDiagram
  User ||--o{ WorkoutSession : owns
  WorkoutSession ||--o{ ExerciseLog : contains
  Exercise ||--o{ ExerciseLog : referenced_by

  User {
    int id
    string display_name
    datetime created_at
  }

  WorkoutSession {
    int id
    int user_id
    date date
    string status
    datetime created_at
    datetime updated_at
  }

  Exercise {
    int id
    string name
    string muscle_group
  }

  ExerciseLog {
    int id
    int session_id
    int exercise_id
    int target_sets
    float target_weight
    int completed_sets
    datetime created_at
  }
```

## 产品流程地图

```mermaid
flowchart TD
  Home["首页<br/>日历档案"] --> Start["开启今日训练"]
  Start --> Muscle["选择肌群<br/>胸 / 肩 / 背 / 臀腿 / 手臂 / 腹部"]
  Home --> Detail["单日训练概览<br/>活动环 / 数据摘要"]
  Muscle --> Exercise["选择动作<br/>例如：腹部 → 卷腹"]
  Exercise --> Config["配置参数<br/>组数 / 重量"]
  Config --> Execute["逐组打卡<br/>大圆按钮 + 进度点"]
  Execute --> Done["训练完成<br/>状态 Done"]
  Done --> HomeUpdate["首页日历更新"]

  Home:::done
  Start:::done
  Detail:::done
  Muscle:::next
  Exercise:::next
  Config:::next
  Execute:::todo
  Done:::todo
  HomeUpdate:::todo

  classDef done fill:#181714,color:#F7F5F0,stroke:#181714;
  classDef next fill:#EFE8D8,color:#181714,stroke:#181714;
  classDef todo fill:#F7F5F0,color:#8B867C,stroke:#D8D1C4;
```

## 功能清单

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| 项目目录隔离 | 已完成 | 新项目位于 `fitness-minimal/` |
| Expo 前端骨架 | 已完成 | 已配置 Expo Router |
| Reanimated 动效 | 已完成 | 首页、弹窗与训练流程已有 spring 动效，SDK 54 下使用 Reanimated 4 |
| 中英文切换 | 已完成 | 设置页可切换中文 / English，并从首页左上角进入 |
| 极简日历首页 | 已完成 | 单月、单色、无空心占位的极简日历 |
| 黑色运动环视觉 | 已完成 | 首页改为黑色背景与每日训练环 |
| 日历主色圆环 | 已完成 | 默认统一主色圆环，透明度表达训练量 |
| 首页日历详情 | 已完成 | 点击日期弹出当天训练记录窗口 |
| UI 主题自定义 | 已完成 | 深色 / 浅色在一级设置，主色与肌群色收纳进“个性化设置” |
| 渐进式肌群信息 | 已完成 | 点击肌群后平滑切换分段颜色、文字和图例 |
| 单日训练概览页 | 已完成 | 点击日历日期进入活动环概览，当前为 mock 数据 |
| 设置入口 | 已完成 | 底部导航已移除，设置收纳到首页左上角菜单 |
| FastAPI 后端骨架 | 已完成 | 已有应用入口和健康检查 |
| 数据库模型 | 已完成 | 已有 4 张核心表 |
| 默认动作种子 | 已完成 | 已覆盖 6 大肌群 |
| 肌群选择页 | 已完成 | 点击“开启今日训练”进入 6 大肌群选择 |
| 动作选择页 | 已完成 | 选择肌群后进入本地动作列表，支持多选动作 |
| 参数配置页 | 已完成 | 单动作直接进入配置，多动作从今日动作列表进入，组数 / 重量使用纵向滚轮 |
| 逐组打卡页 | 已完成 | 中央大圆按钮逐组打卡，单动作回首页，多动作回列表 |
| 本地训练记录 | 已完成 | 完成动作后写入本地 session，首页日历详情同步更新 |
| 档案记录弹窗 | 已完成 | 点击某天日历以独立窗口查看动作、组数、重量和训练量 |
| 前后端真实联动 | 未开始 | 阶段 4 开发 |

## 现在我们在哪

```mermaid
flowchart LR
  A["你现在能测试的"] --> B["打开 Expo 首页"]
  A --> C["查看日历档案视觉"]
  A --> D["点击左上角进入设置"]
  A --> E["检查后端健康接口"]
  A --> K["在设置页切换中英文"]

  F["下一步要做的"] --> G["点击开始训练"]
  G --> H["进入 6 大肌群选择"]
  H --> I["选择动作"]
  I --> J["配置组数与重量"]
```
