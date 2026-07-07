# 打卡 — 项目上下文

## 项目概况

- **用途**：个人习惯追踪 PWA，手机端（Mate 40 Pro）桌面安装使用
- **部署地址**：<https://sky-20261231.github.io/daka/>
- **GitHub 仓库**：<https://github.com/Sky-20261231/daka>
- **技术栈**：纯 HTML/CSS/JS（单文件 SPA），无框架，无构建工具

## 文件结构

```
打卡tool/
├── index.html      # 主应用（单文件，~930行）：CSS + HTML + JS
├── manifest.json   # PWA 清单，standalone 模式，SVG 图标
├── sw.js           # Service Worker：缓存 + 定时提醒通知
├── 使用说明.md      # 用户操作指南（分享给使用者的文档）
├── CLAUDE.md       # 本文件（给 AI 助手的项目上下文）
└── .claude/        # Claude Code 本地设置（不上传到 GitHub）
```

## 待办事项

- [x] ~~PWA 核心功能开发（打卡/复盘/设置/提醒）~~ ✅ 2026-07-01
- [x] ~~GitHub Pages 部署上线~~ ✅ 2026-07-02
- [x] ~~编写用户使用说明~~ ✅ 2026-07-02
- [x] ~~推送未同步的本地 commit~~ ✅ 2026-07-07
- [ ] **扩展数据模型**：给 habits/records 加 `updatedAt` 字段（优先级：低）
  - 为可能的跨设备同步做准备，目前不影响功能

## 架构设计

### 应用架构

单文件 SPA，三个视图通过底部导航切换：

| 视图 | DOM id | 职责 |
|------|--------|------|
| 今日 | `view-today` | 打卡主界面，日期导航 + 补卡 + 习惯卡片 |
| 复盘 | `view-review` | 统计卡片 + 图表 + 月度日历 |
| 设置 | `view-settings` | 习惯管理 + 提醒时间 + 通知权限 |

全局状态（`index.html` 中的 JS 变量）：
- `habits[]` — 当前习惯列表（从 DB 加载到内存）
- `currentView` — 当前视图 (`'today'`/`'review'`/`'settings'`)
- `selectedDate` — 今日页面当前选中的日期（用于补卡）
- `editingHabit` / `recordModalHabitId` / `deleteHabitId` — 弹窗状态

### 数据层（IndexedDB）

数据库名 `dakaDB`，版本 1，两个 object store：

**`habits`** store（keyPath: `id`）：
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | UUID，`uid()` 生成 |
| name | string | 习惯名称 |
| type | string | `'check'`（完成型）或 `'record'`（数值型） |
| unit | string | 数值型的单位，完成型为空 |
| color | string | 颜色 hex 值 |
| createdAt | number | 毫秒时间戳 |
| createdAt | number | 毫秒时间戳 |

> ⚠️ `updatedAt` 字段当前未实现，已在待办中标记为后续扩展项。

**`records`** store（keyPath: `id`，indexes: `habitId`, `date`, `habitDate`）：
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | UUID |
| habitId | string | 外键，关联 habits.id |
| date | string | YYYY-MM-DD 格式日期 |
| timestamp | number | 毫秒时间戳 |
| value | boolean\|number | 完成型为 `true`，数值型为数字 |

> ⚠️ `updatedAt` 字段当前未实现，已在待办中标记为后续扩展项。

数据**完全本地存储**，不上传任何服务器，无同步机制。

### PWA 机制

**Service Worker（sw.js）**：
- 缓存策略：cache-first，缓存 index.html 和 manifest.json（`dakaApp-v1`）
- `SKIP_WAITING` + `clients.claim()`：更新 SW 后立即接管
- 消息通道：主线程发 `SCHEDULE_REMINDER` 消息 → SW 计算下一次提醒时间 → 到时 `showNotification`
- 通知点击：聚焦已有窗口或打开新窗口

**提醒持久化**：
- 提醒时间存在 `localStorage.reminderTime`，默认 `21:00`
- 每次打开应用/修改设置时，通过 postMessage 重新调度 SW

### UI 设计

- 移动端优先，`max-width: 480px`，`overflow-x: hidden`
- 底部导航栏（今日/复盘/设置），SVG 图标
- 弹窗：底部滑出（sheet 风格），`modal-handle` 拖拽指示条
- 颜色系统：8 色预设 `COLORS[]`，`--primary: #5C6BC0`

## 开发与部署

### 本地开发

直接用浏览器打开 `index.html` 即可。需要 Live Server（VS Code 插件）才能完整测试 SW。

### 部署更新流程

1. 修改代码
2. 提交：`git add . && git commit -m "描述改动" && git push`
3. GitHub Pages 约 1 分钟后自动更新
4. 用户端：刷新页面即可获取新版本（SW 自动更新）

### 更新注意事项

- 如果需要清除旧缓存，修改 `sw.js` 中的 `CACHE` 名称（如 `dakaApp-v2`）
- 修改 IndexedDB schema 时，必须在 `onupgradeneeded` 中做版本迁移
- manifest.json 中 `start_url` 不能改，否则 PWA 丢失

## 关键代码段位置

| 功能 | 行号范围（约） |
|------|---------------|
| CSS 样式 | 1–166 |
| HTML 结构 | 167–297 |
| DB 层（IndexedDB） | 300–365 |
| App 状态 & 工具函数 | 367–400 |
| 今日视图（渲染+打卡） | 402–489 |
| 复盘视图（统计+图表+日历） | 491–742 |
| 设置视图 | 744–787 |
| 弹窗逻辑（习惯编辑+数值录入+删除确认） | 789–930 |

## 用户偏好

- 用户：尹红芳，非技术背景，偏好简洁直观的 UI
- 输出风格：中文回复，逻辑清晰，分段输出
- 涉及标准/协议的断言必须先查原文
- 标注状态/结论时必须提供来源
