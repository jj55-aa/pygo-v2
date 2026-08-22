// ============================================================
// PyGo V2 —— 核心层入口：window.App 对接接口
// UI 只读 state / 调 actions / 听 events（见 docs/UI对接协议.md）
// 模块：judge 判题 / content 内容 / review 复习(SM-2) / gamify 游戏化 / db 数据+埋点
// ============================================================

(function () {
  'use strict';

  // ---------- 微型事件总线 ----------
  class EventBus {
    constructor() { this._map = {}; }
    on(name, fn) { (this._map[name] = this._map[name] || []).push(fn); }
    off(name, fn) { this._map[name] = (this._map[name] || []).filter(f => f !== fn); }
    emit(name, payload) { (this._map[name] || []).forEach(fn => { try { fn(payload); } catch (e) { console.error('[App] event', name, e); } }); }
  }

  // ---------- 初始 state（与对接协议一致） ----------
  const initialState = {
    screen: 'map',
    xp: 0, hearts: 5, streak: 0,
    dailyXp: 0, dailyGoal: 20,
    units: [],                      // 由 content.js 注入
    lesson: null,                   // { id,title,stepIndex,stepCount,steps,question,lastResult }
    review: { dueCount: 0, total: 0, queue: [], session: { active: false, index: 0 } },
    stats: { level: 1, title: '代码萌芽', levelProgress: 0, streakCalendar: [], badges: [], league: { tier: '青铜', rank: 1, weekXp: 0 } },
    settings: { dailyGoalMin: 10, remindEnabled: true },
    license: { unlocked: false, info: null },        // 授权状态（激活码模块写入）
    pyodide: { status: 'idle', ready: false, detail: '' }   // 判题引擎加载状态（UI 显示进度）
  };

  const state = JSON.parse(JSON.stringify(initialState));
  const events = new EventBus();
  const listeners = new Set();

  function notify() { listeners.forEach(fn => fn(state)); }

  // ---------- 模块接入（带兜底，缺文件不崩） ----------
  const db = window.PyGoDB || { get: () => null, set: () => {}, load: () => ({}), save: () => {}, log: () => {} };
  const judge = window.PyGoJudge || { run: async () => ({ ok: true }), check: async () => ({ correct: true }), onProgress: null, ready: null };
  const content = window.PyGoContent || { loadUnits: async () => [], loadLesson: async () => null };
  const review = window.PyGoReview || { addWrong: () => [], dueCount: () => 0, total: () => 0, dueItems: () => [], submit: () => ({ ok: false }), todayStr: () => '' };
  const gamify = window.PyGoGamify || { levelInfo: xp => ({ level: 1, title: '代码萌芽', levelProgress: 0 }), touchStreak: () => 0, getStreak: () => 0 };
  // 授权模块（w5 安全原则：默认拒绝——模块缺失/未初始化 = 不解锁）
  const license = window.PyGoLicense || {
    init: async () => ({ unlocked: false }), isUnlocked: () => false, getInfo: () => null,
    getError: () => '未加载授权模块', isFreeUnit: () => false, freeUnits: [],
    activate: async () => ({ ok: false, error: '未加载授权模块' }), deactivate: () => ({ ok: true })
  };

  // ---------- 埋点 ----------
  function track(event, props) { try { db.log(event, props || {}); } catch (e) { /* noop */ } }

  // ---------- 内部工具 ----------
  function refreshStats() {
    const snap = gamify.statsSnapshot({ xp: state.xp, streak: gamify.getStreak(), completedCount: (db.get('completed') || []).length });
    state.stats.level = snap.level;
    state.stats.title = snap.title;
    state.stats.levelProgress = snap.levelProgress;
    state.stats.league = snap.league;
    state.stats.badges = snap.badges;
    state.stats.streakCalendar = snap.streakCalendar;
    state.streak = gamify.getStreak();
  }

  // 只刷新复习统计（不打断进行中的复习会话）
  function refreshReviewStats() {
    state.review.dueCount = review.dueCount();
    state.review.total = review.total();
  }

  // ---------- 授权门（w5 原则：核心层判断才算数，UI 藏按钮不算） ----------
  function isFreeLesson(lessonId) {
    var unit = (state.units || []).find(u => (u.lessons || []).some(l => l.id === lessonId));
    return !!(unit && license.isFreeUnit(unit.id));
  }

  // 未解锁时：免费单元之外全部锁死（配合地图 UI 的 locked 渲染）
  function applyLicenseGate() {
    var unlocked = license.isUnlocked();
    (state.units || []).forEach(function (u, i) {
      if (unlocked || license.isFreeUnit(u.id)) return;
      u.locked = true;
      (u.lessons || []).forEach(function (l) { l.status = 'locked'; });
    });
  }

  function syncLicenseState() {
    state.license = { unlocked: license.isUnlocked(), info: license.getInfo() };
  }

  function checkDailyGoal() {
    if (state.dailyXp >= state.dailyGoal && !state._goalHitToday) {
      state._goalHitToday = true;
      events.emit('daily-goal-hit', { xp: state.dailyXp, goal: state.dailyGoal });
    }
  }

  function gainXp(n) {
    const prevLevel = state.stats.level;
    state.xp += n; state.dailyXp += n;
    state.streak = gamify.touchStreak();
    refreshStats();
    if (state.stats.level > prevLevel) events.emit('level-up', { level: state.stats.level, title: state.stats.title });
    checkDailyGoal();
    events.emit('xp-changed', { xp: state.xp, gain: n });
    events.emit('streak-updated', state.streak);
    db.save('progress', { xp: state.xp, dailyXp: state.dailyXp, streak: state.streak, hearts: state.hearts });
  }

  function loseHeart() {
    if (state.hearts > 0) state.hearts -= 1;
    events.emit('hearts-changed', state.hearts);
    db.save('progress', { hearts: state.hearts });
  }

  // 答错 → 错题进复习队列（SM-2）
  function recordWrong(lesson, q) {
    try { review.addWrong(lesson && lesson.id, q); } catch (e) { /* noop */ }
    refreshReviewStats();
  }

  function applyAnswerResult(lesson, q, result) {
    if (result.correct) {
      lesson.lastResult = { correct: true, xpGain: 10, heartsLeft: state.hearts, feedback: result.feedback, hint: null };
      gainXp(10);
      track('answer_correct', { lessonId: lesson.id, qid: q.id, type: q.type, concept: q.concept || [] });
    } else {
      lesson.lastResult = { correct: false, xpGain: 0, heartsLeft: state.hearts, feedback: '', hint: q.hint, run: result.run };
      loseHeart();
      recordWrong(lesson, q);
      track('answer_wrong', { lessonId: lesson.id, qid: q.id, type: q.type, concept: q.concept || [] });
    }
  }

  // ---------- actions ----------
  const actions = {
    async goto(screen) {
      state.screen = screen;
      // 进入复习页且不在复习会话中 → 填充待复习列表
      if (screen === 'review' && !(state.review.session && state.review.session.active)) {
        refreshReviewStats();
        state.review.queue = review.dueItems(10).map(it => ({
          qid: it.qid, lessonId: it.lessonId, question: it.question, dueIn: it.due, interval: it.interval
        }));
      }
      notify(); events.emit('screen-changed', screen);
    },

    async startLesson(lessonId) {
      // 授权门：未解锁时，免费单元（新手村）外的课程一律拦截
      if (!license.isUnlocked() && !isFreeLesson(lessonId)) {
        notify();
        return { ok: false, error: '免费版仅开放新手村，请到设置页激活完整版解锁全部 87 课' };
      }
      const lesson = await content.loadLesson(lessonId);
      if (!lesson) {
        // 内容未就绪：给占位课（避免"点了没反应"）
        let title = lessonId;
        (state.units || []).forEach(u => (u.lessons || []).forEach(l => { if (l.id === lessonId) title = l.title; }));
        state.lesson = {
          id: lessonId, title,
          stepCount: 1,
          steps: [{
            type: 'summary',
            body: '🎬 这一课的内容还在制作中……\n\n核心层（判题/内容/UI）已全部就绪，内容团队正在把 V1 课程迁移成 V2 格式。\n\n先试试已经做好的课程：返回地图 → 点击「变量」！'
          }],
          question: null,
          lastResult: null
        };
        state.screen = 'lesson';
        notify();
        return;
      }
      state.lesson = { ...lesson, stepIndex: 0, lastResult: null };
      state.screen = 'lesson';
      track('lesson_start', { lessonId });
      notify(); events.emit('lesson-start', lesson);
    },

    quitLesson() {
      const lesson = state.lesson;
      state.lesson = null;
      state.screen = 'map';
      if (lesson) track('lesson_quit', { lessonId: lesson.id, stepIndex: lesson.stepIndex });
      notify();
    },

    // 选择/判断/填空类题目作答
    async answer(payload) {
      const lesson = state.lesson;
      const q = lesson.question;
      const result = await judge.check(q, payload);   // 判题引擎判定
      applyAnswerResult(lesson, q, result);
      notify();
      events.emit('answer', result);
    },

    // 编程题：先运行代码（真解释器），返回运行结果
    async runCode(code) {
      const lesson = state.lesson;
      const q = lesson.question;
      const run = await judge.run(code, q.testcases || [], { timeoutMs: 2000, expected: q.expected });
      if (run.ok) {
        const result = { correct: true, xpGain: 15, heartsLeft: state.hearts, feedback: run.feedback, run };
        lesson.lastResult = result; gainXp(result.xpGain);
        track('answer_correct', { lessonId: lesson.id, qid: q.id, type: q.type, concept: q.concept || [], runOk: true });
        notify(); events.emit('answer', result);
      } else {
        const result = { correct: false, xpGain: 0, heartsLeft: state.hearts, feedback: '', hint: q.hint, run };
        lesson.lastResult = result; loseHeart();
        recordWrong(lesson, q);
        track('answer_wrong', { lessonId: lesson.id, qid: q.id, type: q.type, concept: q.concept || [], runOk: false });
        notify(); events.emit('answer', result);
      }
      return run;
    },

    useHint() {
      // 查看完整解析：扣 1 心（若心为 0 则只展示）
      const lesson = state.lesson;
      lesson.lastResult = { ...lesson.lastResult, showExplain: true };
      if (state.hearts > 0) loseHeart();
      track('hint_shown', { lessonId: lesson.id, qid: lesson.question && lesson.question.id });
      notify();
    },

    nextStep() {
      const lesson = state.lesson;
      if (lesson.stepIndex < lesson.stepCount - 1) {
        lesson.stepIndex += 1;
        lesson.question = lesson.steps[lesson.stepIndex] && lesson.steps[lesson.stepIndex].question || null;
        lesson.lastResult = null;
      }
      notify();
    },

    async finishLesson() {
      const bonus = 20;
      gainXp(bonus);
      // 记录完成 → 地图状态更新（done/current/locked）
      const lesson = state.lesson;
      let unitCompleted = false;
      if (lesson && lesson.id) {
        const completed = db.get('completed') || [];
        if (completed.indexOf(lesson.id) === -1) { completed.push(lesson.id); db.save('completed', completed); }
        try {
          state.units = await content.loadUnits();
          // 单元完成检测（B 剧情推进）
          const unit = state.units.find(u => (u.lessons || []).some(l => l.id === lesson.id));
          if (unit && unit.lessons.every(l => l.status === 'done')) {
            unitCompleted = true;
            events.emit('unit-unlocked', unit);
            track('unit_complete', { unitId: unit.id, unitName: unit.name });
          }
        } catch (e) { /* 不阻塞结算 */ }
      }
      const summary = { xp: state.xp, streak: state.streak, unitCompleted };
      state.lesson = null;
      state.screen = 'map';
      track('lesson_complete', { lessonId: lesson && lesson.id, xp: state.xp, unitCompleted });
      refreshReviewStats();
      notify();
      events.emit('lesson-complete', summary);
    },

    setSetting(key, value) {
      state.settings[key] = value;
      db.save('settings', state.settings);
      notify();
    },

    // ---------- 授权 ----------
    // 激活完整版：验签通过 → 重载单元（去锁）→ 更新状态
    async activateLicense(code) {
      const r = await license.activate(code);
      if (r && r.ok) {
        try { state.units = await content.loadUnits(); } catch (e) { /* 保持原状态 */ }
      }
      applyLicenseGate();
      syncLicenseState();
      // 日志脱敏：只记结果与类型，不记激活码
      track('license_activate', { ok: !!(r && r.ok), type: (r && r.info && r.info.type) || null, err: (r && r.error) || null });
      notify();
      events.emit('license-changed', state.license);
      return r;
    },

    // 注销授权（售后/换机用；不影响学习进度）
    async deactivateLicense() {
      license.deactivate();
      try { state.units = await content.loadUnits(); } catch (e) { /* 保持原状态 */ }
      applyLicenseGate();
      syncLicenseState();
      track('license_deactivate', {});
      notify();
      events.emit('license-changed', state.license);
      return { ok: true };
    },

    getLicenseInfo() { return license.getInfo(); },

    // ---------- 复习 ----------
    async startReview() {
      refreshReviewStats();
      state.review.queue = review.dueItems(10).map(it => ({
        qid: it.qid, lessonId: it.lessonId, question: it.question, dueIn: it.due, interval: it.interval
      }));
      state.review.session = { active: true, index: 0 };
      state.screen = 'review';
      track('review_start', { count: state.review.queue.length });
      notify();
    },

    // 复习作答：payload 与答题一致（choice 下标 / judge 布尔 / fill 字符串 …）
    async submitReviewAnswer(payload) {
      const rv = state.review;
      if (!rv.session || !rv.session.active || !rv.queue.length) {
        return { correct: false, feedback: '没有进行中的复习' };
      }
      const item = rv.queue[0];
      const result = await judge.check(item.question, payload);
      try { review.submit(item.qid, result.correct); } catch (e) { /* noop */ }
      rv.queue.shift();
      rv.session.index = 0;
      if (result.correct) {
        track('review_correct', { qid: item.qid, interval: item.interval });
        if (state.hearts < 5) { state.hearts += 1; events.emit('hearts-changed', state.hearts); }
      } else {
        loseHeart();
        track('review_wrong', { qid: item.qid });
      }
      refreshReviewStats();
      notify();
      events.emit('answer', result);
      return result;
    },

    completeReview() {
      state.review.queue = [];
      state.review.session = { active: false, index: 0 };
      refreshReviewStats();
      state.screen = 'map';
      notify();
    },

    async resetProgress() {
      Object.assign(state, JSON.parse(JSON.stringify(initialState)));
      db.save('all', state);
      db.set('completed', []);
      db.set('review', []);
      db.set('streakInfo', { streak: 0, lastDate: '' });
      syncLicenseState();       // 重置学习进度 ≠ 注销授权
      notify();
    }
  };

  // ---------- 启动 ----------
  async function init() {
    await license.init();                 // 先验授权（签名/有效期/机器绑定）
    syncLicenseState();
    state.units = await content.loadUnits();
    applyLicenseGate();                   // 未解锁 → 免费单元外全部锁死
    Object.assign(state, db.load('progress') || {});
    if (typeof state._goalHitToday === 'undefined') state._goalHitToday = false;
    refreshStats();
    refreshReviewStats();
    // 判题引擎加载进度 → state.pyodide（UI 显示"加载 Python 解释器…"）
    if (judge && judge.onProgress) {
      judge.onProgress(function (s) {
        state.pyodide = { status: s.status, ready: !!s.ready, detail: s.detail || '' };
        notify();
      });
    }
    // 预加载 Python 解释器（后台），避免首次做题白等
    if (judge && judge.ready) { judge.ready().catch(function () { /* 状态经 onProgress 反映 */ }); }
    window.App = { state, actions, events, subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); } };
    notify();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
