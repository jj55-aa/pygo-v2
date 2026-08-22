# UI 层说明（给 UI 生成 AI 的指令）

## 先读这个 ⭐

**`ui/UI任务包.md`** —— 你的完整任务输入：
1. 任务总览与页面清单（先做课程页）
2. 对接契约摘要（`window.App`：state / actions / events）
3. **真实样板课数据**（u1_l2「变量」，可直接渲染调试）
4. 页面规范 + 设计系统速查（tokens / 动效）
5. 交付格式（每页一个 HTML 片段放 `ui/pages/`）

## 必读（按顺序）

1. `../ui/UI任务包.md` —— 最重要，先读
2. `../docs/UI对接协议.md` —— 对接契约（细节以它为准）
3. 桌面《Python学习软件V2_UI设计流程.md》第 2、3 节 —— 设计系统与页面规范

## 产出规则

- 每页一个文件：`ui/pages/map.html`、`lesson.html`、`review.html`、`stats.html`、`settings.html`
- 文件 = HTML **片段**（`<style>` + `<div class="page">` + `<script>`），不带 `<html>/<head>/<body>`
- **只做**：渲染 `window.App.state`、绑定事件、调用 `window.App.actions.*`、订阅 `window.App.events`
- **禁止**：修改 state、写判题/进度逻辑、操作 localStorage
- 视觉：Linear 极简风，强调色 `#5E6AD2`，背景 `#F7F8F8`，圆角 6/8/12px
- 动效：反馈 300ms、切换 200ms、错峰 60ms（见 UI 设计流程第 4 节）

## 建议顺序

1. `lesson.html`（课程页，核心，含编辑器+报错面板）
2. `map.html`（学习路径页）
3. `review.html` → `stats.html` → `settings.html`

每完成一页 → 告知核心层联调（核心层会自动注入 `ui/pages/` 下的页面，无需其他配置）。
