// ============================================================
// PyGo V2 —— 内容引擎
//   读 content/units.json（单元/课程索引 + 冒险剧情 story）
//   读 content/<unit>/<lesson>/concept_cards.md（概念卡）
//   读 content/<unit>/<lesson>/quiz.json（微练习 + 剧情任务 + 小结）
//   schema 校验 + 组装 lesson.steps（concept / question / quest / summary）
// 纯函数（parseConceptCards / validateQuiz / buildSteps）可在 Node 直接测试
// ============================================================
window.PyGoContent = (function () {
  'use strict';

  var baseUrl = '';
  function configure(opts) { if (opts && typeof opts.baseUrl === 'string') baseUrl = opts.baseUrl; }

  // ---------- 概念卡解析：md → [{title, body, code}] ----------
  function parseConceptCards(md) {
    var cards = [];
    var cur = null;
    var inCode = false;
    function flush() {
      if (!cur) return;
      var body = (cur._body || []).join('\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      var code = (cur._code && cur._code.length) ? cur._code.join('\n') : null;
      cards.push({ title: cur.title, body: body, code: code });
      cur = null;
    }
    var lines = String(md || '').split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var m = line.match(/^##\s+(.*)$/);
      if (m) { flush(); cur = { title: m[1].trim(), _body: [], _code: [] }; inCode = false; continue; }
      if (!cur) continue;                                   // 跳过 # 大标题等
      if (/^\s*\`\`\`/.test(line)) {
        if (!inCode) { inCode = true; cur._code = []; } else { inCode = false; }
        continue;
      }
      if (inCode) { cur._code.push(line); continue; }
      cur._body.push(line);
    }
    flush();
    return cards;
  }

  // ---------- quiz schema 校验 ----------
  var REQUIRED_BY_TYPE = {
    choice: ['options', 'answer'],
    judge: ['answer'],
    fill: ['answer'],
    pair: ['leftOptions', 'rightOptions', 'answer'],
    sort: ['lines', 'answer'],
    code: ['code'],
    debug: ['code', 'testcases'],
    think: ['explain']
  };

  function validateQuiz(quiz) {
    var issues = [];
    if (!quiz || typeof quiz !== 'object') return { ok: false, issues: ['quiz.json 不是有效 JSON 对象'] };
    if (!quiz.lesson) issues.push('缺少 lesson 字段');
    var qs = quiz.questions;
    if (!Array.isArray(qs)) issues.push('questions 必须是数组');
    else {
      qs.forEach(function (q, idx) {
        if (!q.id) issues.push('questions[' + idx + '] 缺少 id');
        if (!q.type) issues.push('questions[' + idx + '] 缺少 type');
        else if (!REQUIRED_BY_TYPE[q.type]) issues.push('questions[' + idx + '] 未知题型 ' + q.type);
        else {
          REQUIRED_BY_TYPE[q.type].forEach(function (f) {
            if (q[f] === undefined) issues.push('questions[' + idx + '](' + q.id + ') 缺少 ' + f);
          });
        }
        if (q.type === 'choice' && Array.isArray(q.options) && (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.options.length)) {
          issues.push('questions[' + idx + '](' + q.id + ') answer 超出 options 范围');
        }
        if ((q.type === 'code' || q.type === 'debug') && q.testcases) {
          if (!Array.isArray(q.testcases) || q.testcases.length === 0) issues.push('questions[' + idx + '](' + q.id + ') testcases 为空');
        }
      });
    }
    if (quiz.quest) {
      if (!quiz.quest.code) issues.push('quest 缺少 code');
      if (!Array.isArray(quiz.quest.testcases) || quiz.quest.testcases.length === 0) issues.push('quest 缺少 testcases');
    }
    return { ok: issues.length === 0, issues: issues };
  }

  // ---------- 组装 steps ----------
  function normalizeQuestion(q) {
    var out = {};
    Object.keys(q).forEach(function (k) { out[k] = q[k]; });
    // V1 兼容：question 字段 → stem
    if (!out.stem && out.question) out.stem = out.question;
    if (!out.code && out.initialCode) out.code = out.initialCode;
    // quest 或未标题型但带 code/testcases → 按 code 题处理
    if (out.type === 'quest' || (!out.type && (out.testcases || out.code))) out.type = 'code';
    // 有 expected 无 testcases → 转成单用例
    if ((out.type === 'code' || out.type === 'debug') && !Array.isArray(out.testcases) && out.expected != null) {
      out.testcases = [{ input: '', expected: String(out.expected) }];
    }
    return out;
  }

  function buildSteps(cardsMd, quiz) {
    var steps = [];
    var cards = parseConceptCards(cardsMd || '');
    cards.forEach(function (c) { steps.push({ type: 'concept', title: c.title, body: c.body, code: c.code }); });
    (quiz.questions || []).forEach(function (q) {
      steps.push({ type: 'question', title: (q.stem || '').split('\n')[0], question: normalizeQuestion(q) });
    });
    if (quiz.quest) {
      steps.push({
        type: 'quest',
        title: quiz.quest.title || '剧情任务',
        story: quiz.quest.story || '',
        body: quiz.quest.stem || '',
        question: normalizeQuestion(Object.assign({ type: 'code' }, quiz.quest))
      });
    }
    if (quiz.summary) steps.push({ type: 'summary', body: quiz.summary.body || '' });
    var firstQ = null;
    for (var i = 0; i < steps.length; i++) { if (steps[i].question) { firstQ = steps[i].question; break; } }
    return { steps: steps, question: firstQ };
  }

  // ---------- 异步 IO（浏览器 fetch） ----------
  var _index = null;       // lessonId -> { unitId, unit, lesson, unitIndex, lessonIndex }
  var _unitsData = null;

  async function loadUnits() {
    var resp = await fetch(baseUrl + 'content/units.json');
    if (!resp.ok) { console.warn('[Content] units.json 加载失败', resp.status); return []; }
    var data = await resp.json();
    _unitsData = data;
    _index = {};
    var completed = readCompleted();
    // 先构建完整结构，再统一计算状态（computeStatus 依赖完整 units，不能在 map 中途引用）
    var units = (data.units || []).map(function (unit, ui) {
      return {
        id: unit.id, name: unit.name, icon: unit.icon || '📘',
        locked: !!unit.locked, story: unit.story || null,
        lessons: (unit.lessons || []).map(function (l, li) {
          _index[l.id] = { unitId: unit.id, unit: unit, lesson: l, unitIndex: ui, lessonIndex: li };
          return { id: l.id, title: l.title, status: 'locked' };
        })
      };
    });
    units.forEach(function (unit, ui) {
      unit.lessons.forEach(function (lesson, li) {
        lesson.status = computeStatus(ui, li, unit, units, completed);
      });
    });
    return units;
  }

  function readCompleted() {
    try {
      if (window.PyGoDB && window.PyGoDB.get) {
        var c = window.PyGoDB.get('completed');
        return Array.isArray(c) ? c : [];
      }
    } catch (e) { /* noop */ }
    return [];
  }

  function allLessonsDone(unit, completed) {
    return unit.lessons.every(function (l) { return completed.indexOf(l.id) !== -1; });
  }

  function computeStatus(unitIndex, lessonIndex, unit, units, completed) {
    var prevUnitDone = unitIndex === 0 ? true : allLessonsDone(units[unitIndex - 1], completed);
    if (unit.locked || !prevUnitDone) return 'locked';
    if (completed.indexOf(unit.lessons[lessonIndex].id) !== -1) return 'done';
    var prevLessonDone = lessonIndex === 0 ? true : completed.indexOf(unit.lessons[lessonIndex - 1].id) !== -1;
    return prevLessonDone ? 'current' : 'locked';
  }

  async function loadLesson(lessonId) {
    if (!_index) await loadUnits();
    var entry = _index && _index[lessonId];
    if (!entry) { console.warn('[Content] 找不到课程', lessonId); return null; }
    var dir = 'content/' + entry.unitId + '/' + lessonId + '/';
    var [cardsMd, quiz] = await Promise.all([fetchText(dir + 'concept_cards.md'), fetchJson(dir + 'quiz.json')]);
    if (!quiz) { console.warn('[Content] 课程内容未就绪', lessonId, dir + 'quiz.json'); return null; }
    var v = validateQuiz(quiz);
    if (!v.ok) { console.warn('[Content] quiz schema 校验未通过', lessonId, v.issues); }
    var built = buildSteps(cardsMd, quiz);
    return {
      id: lessonId,
      title: quiz.title || entry.lesson.title,
      stepCount: built.steps.length,
      steps: built.steps,
      question: built.question,
      validation: v
    };
  }

  async function fetchText(url) {
    try {
      var r = await fetch(baseUrl + url);
      return r.ok ? await r.text() : '';
    } catch (e) { return ''; }
  }
  async function fetchJson(url) {
    try {
      var r = await fetch(baseUrl + url);
      return r.ok ? await r.json() : null;
    } catch (e) { return null; }
  }

  // ---------- 对外接口 ----------
  return {
    configure: configure,
    loadUnits: loadUnits,
    loadLesson: loadLesson,
    // 纯函数（测试用）
    parseConceptCards: parseConceptCards,
    validateQuiz: validateQuiz,
    buildSteps: buildSteps,
    normalizeQuestion: normalizeQuestion,
    _resetIndex: function () { _index = null; _unitsData = null; }
  };
})();
