# PyGo V2 —— UI 任务包（给 UI 端 AI）

> **你负责产出 PyGo V2 的全部页面 UI（视觉 + 交互）。** 核心层（判题/数据/内容/进度）已全部就绪并跑通，**你只做展示与交互**，逻辑一律走 `window.App`，不要自己实现任何核心逻辑。
> 产出放 `D:\pylearn-v2\ui\pages\`，每页一个文件。交付后由核心层联调走查。

---

## 1. 任务总览

产品：零基础 Python 学习者的**闯关式学习应用**（参考多邻国路径地图 + 夜曲编程分步卡片教学）。
核心体验：**路径式学习地图 → 3~5 分钟微课（概念卡 + 微练习轮换）→ 即时判题反馈（真 Python 解释器）→ 复习中心**。

产出的页面（**建议顺序**）：
1. **课程页** `lesson.html`（核心，含代码编辑器 + 报错面板，最花功夫，先做）
2. **学习路径页** `map.html`
3. **复习中心** `review.html` → **战绩页** `stats.html` → **设置页** `settings.html`

每完成 1 页 → 告知核心层联调。

---

## 2. 必读文档（按顺序）

| 文档 | 位置 | 看什么 |
|---|---|---|
| 《Python学习软件V2_UI设计流程.md》 | 桌面 | **设计系统（第 2 节 tokens）/ 页面规范（第 3 节）/ 动效规范（第 4 节）/ 走查清单（第 7 节）** |
| 《UI对接协议.md》 | `D:\pylearn-v2\docs\UI对接协议.md` | 全局接口契约（本文件已摘要，细节以它为准） |
| 本文件 §4~§8 | 本文件 | 对接契约摘要 + **真实样板课数据** + 交付格式 |

---

## 3. 分工铁律（违反 = 返工）

- ✅ **只做**：渲染 `window.App.state`、绑定事件、调用 `window.App.actions.*`、订阅 `window.App.events` 做反馈动画
- ❌ **禁止**：修改 state、自己算 XP/判题/进度、操作 localStorage、定义路由、改核心层文件（`core/*`）
- ❌ **禁止**：判断"这题对不对"——判题是 `App.actions.answer/runCode` 的事，你只展示返回的 `lastResult`

---

## 4. 全局接口 `window.App`（契约摘要）

### 4.1 state（只读，订阅渲染）

```js
window.App.state = {
  screen: 'map',                // map | lesson | review | stats | settings
  xp: 120, hearts: 5, streak: 3,
  dailyXp: 18, dailyGoal: 20,
  pyodide: { status, ready, detail },   // 判题引擎加载进度（首次加载较慢，UI 必须显示进度，不能白屏）

  units: [                      // 学习路径
    { id, name, icon, locked,
      story: { theme, hook, quest },    // 冒险主线：单元=主题世界，横幅显示剧情钩子
      lessons: [ { id, title, status } ]  // status: done | current | locked
    }
  ],
  lesson: {                     // 课程中
    id, title, stepIndex, stepCount,
    steps: [ { type:'concept'|'question'|'quest'|'summary', ... } ],  // 见 §5.2
    question: { ... },          // 当前题（结构见 §5.3）
    lastResult: null | { correct, xpGain, heartsLeft, feedback, hint, run }
  },
  review: { dueCount, total, queue: [] },
  stats: { level, title, levelProgress, streakCalendar, badges, league },
  settings: { dailyGoalMin, remindEnabled }
};
```

### 4.2 actions（UI 调用，全部返回 Promise）

```js
goto(screen)               // 切页
startLesson(lessonId)      // 进课（state.lesson 就绪）
quitLesson()               // 退出课程
answer(payload)            // choice:选项下标 / judge:true·false / fill:字符串 / pair:[配对数组] / sort:[下标序列] / think:忽略
runCode(code)              // code/debug/sort 编程题：运行代码（真解释器判定），返回 run 结果
useHint()                  // 查看解析（扣 1 心）
nextStep()                 // 下一步
finishLesson()             // 课程完成（结算 XP）
startReview() / submitReviewAnswer(p) / completeReview()
setSetting(key, value)
resetProgress()
```

### 4.3 events（UI 订阅做反馈动画）

```js
App.events.on('answer', (result) => {})          // 播对/错动画
App.events.on('hearts-changed', (hearts) => {})  // 心碎裂动画
App.events.on('xp-changed', ({xp, gain}) => {})  // XP 飘字
App.events.on('lesson-complete', (summary) => {})// 通关庆祝
App.events.on('unit-unlocked', (unit) => {})
App.events.on('screen-changed', (screen) => {})  // 切页动画
```

### 4.4 订阅 state

```js
const unsub = window.App.subscribe((state) => { render(state); });  // state 每次变化回调
```

---

## 5. 真实样板课数据（u1_l2「变量」—— 现在就能渲染调试）

### 5.1 units（路径页数据，当前实际值）

```js
units = [{
  id: 'u1', name: '初见Python', icon: '🚀', locked: false,
  story: { theme: '新手村', hook: '小卖部老板的找零难题', quest: '用变量写一个找零程序' },
  lessons: [
    { id: 'u1_l1', title: '第一个程序', status: 'done'|'current'|'locked' },  // 按进度计算
    { id: 'u1_l2', title: '变量',       status: '...' },
    { id: 'u1_l3', title: '数字与字符串', status: '...' },
    { id: 'u1_l4', title: '报错初识',    status: '...' }
  ]
}]
```

### 5.2 lesson.steps（u1_l2 共 14 步，4 种卡片）

| index | type | 内容 | 渲染方式 |
|---|---|---|---|
| 0~3 | `concept` | { title, body(markdown), code? } | 概念卡：标题 → 正文 → 代码块（`code` 有值就渲染编辑器/代码块） |
| 4~11 | `question` | { title, question: {...} } | 练习卡：按 `question.type` 渲染（见 §5.3） |
| 12 | `quest` | { title, story, body, question(code 题) } | **剧情任务卡**：🎬 剧情文案（story）→ 任务描述 → 代码编辑器 → 判题 |
| 13 | `summary` | { body } | 小结卡：正文（markdown） |

### 5.3 question 结构（8 种题型，UI 按 type 渲染）

```js
{
  id: 'u1_l2_p1',
  type: 'choice',                    // choice | judge | fill | pair | sort | code | debug | think
  stem: '题目文字',
  options: ['A','B','C','D'],        // choice 用；answer 是对应下标
  answer: 1,                         // judge: true/false；fill: 字符串/数组；pair/sort: 数组
  leftOptions: [...], rightOptions: [...],  // pair 用
  lines: ['...', '...'],             // sort 用（打乱的代码行）
  code: '初始代码',                   // code/debug 用
  testcases: [{ input: '5', expected: '120' }],  // code/debug/quest 用
  hint: '答错第 1 次的提示',
  explain: '标准解析',
  traps: [{ opt/wrong, why }],       // 答错时 hint 会优先变成对应陷阱的 why
  concept: ['变量']
}
```

**各题型交互与提交 payload：**

| 题型 | UI | 提交 payload |
|---|---|---|
| choice | 单选卡片（点击选中，选完即交） | 选项下标（number） |
| judge | 两个大按钮：正确 / 错误 | `true` / `false` |
| fill | 输入框 + 提交按钮 | 字符串 |
| pair | 左列点一个 + 右列点一个 → 成对；可重选 | `[[左下标,右下标], ...]` |
| sort | 代码行可上下拖动/点按调整顺序 | `[下标序列]`（正确顺序） |
| code | **代码编辑器 + 运行按钮** | `runCode(code)` |
| debug | 代码编辑器（含 bug）+ 运行 | `runCode(code)` |
| think | 展示题（无对错），直接显示解析 | 忽略 |
| quest | 剧情文案 + 代码编辑器 + 运行 | `runCode(code)` |

### 5.4 答题结果 lastResult（反馈区渲染）

```js
{
  correct: true,              // 对错
  xpGain: 10,                 // +XP（飘字）
  heartsLeft: 4,              // 剩余心
  feedback: '答对啦！…',       // 对 → 直接展示；错 → 展示 hint
  hint: '答错第 1 次的提示',    // 错 → 展示；点"看解析"调 useHint()
  run: null | {               // code 题才有
    ok, stdout,               // 运行输出
    error,                    // 真实 traceback 全文（错时）
    errorLine,                // 出错行号（编辑器标红定位）
    errorZh,                  // 中文翻译：{ title, what, why, fix, scenarios, hint }
    feedback,                 // 判题反馈（如"全部 2 个测试用例通过 ✅"或 diff 提示）
    testcaseResults           // 每个用例的结果
  }
}
```

**报错面板渲染（用户点名要的体验，课程页重点）：**
- 展示真实 traceback（`run.error`，不掩盖，培养读报错能力）
- 出错行在编辑器**标红 + 波浪线**（`run.errorLine`）
- 中文翻译卡片（`run.errorZh`）：💡 这是什么错（`what`）/ 🛠 怎么改（`fix`）/ ❓ 为什么（`why`）+ 常见场景（`scenarios`）

### 5.5 编辑器要求（设计流程 3.2）

- 等宽字体（JetBrains Mono / Consolas 14px）、**行号**、**语法高亮**、报错行标红
- 下方输出面板：正常输出 / 错误 traceback / 中文翻译
- 运行按钮旁显示"真 Python 解释器"小标识
- 运行有 2s 超时保护（死循环会被终止，UI 显示超时反馈即可，引擎会自动恢复）

---

## 6. 页面规范（每页要点，细节见设计流程第 3 节）

### ① 课程页 lesson.html（先做，核心）
- 顶部：返回 + 课名 + step 进度条（3/14）+ ♥♥♥♥♥（hearts）
- 中部：按 `lesson.steps[stepIndex]` 渲染概念卡/练习卡/剧情任务卡/小结卡
- 代码题：编辑器 + 运行按钮 + 输出/报错面板；**答对/答错反馈 0.5s 内出现**
- 底部：唯一主按钮（"检查答案"/"下一步"——`answer` 后对则 `nextStep`，错则显示 hint + "看解析"按钮调 `useHint`）
- Pyodide 首次加载：顶栏/编辑器区显示加载进度（`state.pyodide`），不能白屏

### ② 学习路径页 map.html
- 顶栏：slogan + 状态胶囊（XP·连胜·心）+ 每日目标进度环（dailyXp/dailyGoal）
- **竖直流线路径地图**：单元 = 主题世界（story.theme 横幅 + story.hook 剧情钩子）
- 节点状态：🔒灰 / ▶️当前（强调色+呼吸光晕）/ ✅完成（绿勾）
- 点击 current 课程 → `startLesson(id)`；动效：节点错峰进场 60ms

### ③ 复习中心 review.html
- 顶部统计卡（dueCount/total）→ 复习队列（queue，复用课程页交互）
- 进入前一句鼓励文案；答对 → 卡片消失动效

### ④ 战绩页 stats.html
- 连胜日历（30 天格）→ XP → 等级/称号卡（title · Lv.level + levelProgress 进度条）→ 徽章墙 → 联赛段位
- 数字滚动动效（XP 变化）

### ⑤ 设置页 settings.html
- 分组列表：每日目标（dailyGoalMin）· 学习提醒开关（remindEnabled）· 数据（重置 = resetProgress，需确认弹窗）
- 开关即时生效，无"保存"按钮

---

## 7. 设计系统速查（Design Tokens）

| 项 | 值 |
|---|---|
| 背景 / 卡片 | `#F7F8F8` / `#FFFFFF` |
| 文字 | 主 `#0A0A0A` · 次 `#62666D` · 弱 `#8A8F98` |
| **强调色（唯一）** | `#5E6AD2`（hover `#7170FF`） |
| 成功 / 错误 / 警告 | `#10B981` / `#EF4444` / `#F59E0B` |
| 边框 | `#E6E6E6` / `#D0D6E0` |
| 圆角 | 按钮 6px · 卡片 8px · 弹窗 12px（**不要大圆角糖果风**） |
| 间距 | 4 的倍数（4/8/12/16/24/32） |
| 字体 | 界面 Inter/微软雅黑（正文 14px）；代码 JetBrains Mono/Consolas 14px |
| 阴影 | 卡片 `0 1px 2px rgba(0,0,0,.04)`；浮层 `0 8px 24px rgba(0,0,0,.12)` |
| 图标 | **线性 SVG**（emoji 只允许出现在内容文案里） |
| 动效 | 页面/卡片切换 200ms 淡入上移（`cubic-bezier(0.2,0.8,0.2,1)`）；反馈 300ms；错峰 60ms；进度条 400ms；庆祝 800ms |

---

## 8. 交付格式与联调

1. **每页一个文件**，放 `ui/pages/`：`map.html` `lesson.html` `review.html` `stats.html` `settings.html`
2. 文件 = HTML 片段（**不是完整 HTML 文档**，不带 `<html>/<head>/<body>`）：
   ```html
   <style>/* 本页样式，用 CSS 变量或直接写 */</style>
   <div class="page" id="page-lesson">…</div>
   <script>
     // 渲染 window.App.state + 绑定事件 + 调 window.App.actions + 订阅 events
   </script>
   ```
   片段内的 `<script>` 会被核心层注入器执行（内联或 src 均可）；页面脚本在每次切页时重新执行，所以**每次进入页面要完整重渲染**（不能依赖上次的 DOM 状态）。
3. 页面按 `state.screen` 自动注入（map/lesson/review/stats/settings），你不用管路由。
4. 交付后核心层联调：填真实内容走一遍 → 走查清单（设计流程第 7 节）逐项过。
5. **先做课程页**，联调通过后再做路径页，逐页推进。

---

## 9. 验收必过项（核心层联调时逐项打勾）

- [ ] 课程页能完整走完 u1_l2 的 14 步（概念卡 → 8 种题型 → 剧情任务 → 小结）
- [ ] code/debug/quest 题：编辑器 + 运行 → 真实判题 → 反馈 ≤ 0.5s；报错显示真实 traceback + 行号标红 + 中文翻译
- [ ] 答对 +XP 飘字、答错扣心动画；useHint 流程不卡死
- [ ] Pyodide 首次加载有进度提示，无白屏 > 1s
- [ ] 路径页：story 横幅 + 节点状态（done/current/locked）渲染正确，点击进入课程
- [ ] 窗口缩到 900px 无横向滚动；键盘可操作（Enter 提交、Esc 关弹窗）
- [ ] 全程无控制台报错
