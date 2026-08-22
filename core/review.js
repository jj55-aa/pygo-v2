// ============================================================
// PyGo V2 —— 复习调度（SM-2 简化版）
//   答错 → 题目进复习队列，当天可复习（due=今天）
//   复习答对 → 间隔 ×2（1d→2d→4d…，上限 30 天）
//   复习答错 → 间隔重置 1d，明天再复习
// 数据存 localStorage（key: pygo:review），纯浏览器逻辑，Node 可测（需 window 垫片）
// ============================================================
window.PyGoReview = (function () {
  'use strict';

  function db() { return window.PyGoDB || { get: function () { return null; }, set: function () {} }; }

  // 本地日期 YYYY-MM-DD（±offsetDays）
  function todayStr(offsetDays) {
    var d = new Date();
    if (offsetDays) d.setDate(d.getDate() + offsetDays);
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function getQueue() {
    try {
      var q = db().get('review');
      return Array.isArray(q) ? q : [];
    } catch (e) { return []; }
  }
  function saveQueue(q) { db().set('review', q); }

  // 答错入队：同题已存在则重置间隔；新题入队
  // 只收可快速重做的题型（choice/judge/fill）；编程题在课程里重做即可
  var REVIEWABLE = ['choice', 'judge', 'fill'];
  function addWrong(lessonId, question) {
    if (!question || !question.id) return getQueue();
    if (REVIEWABLE.indexOf(question.type) === -1) return getQueue();
    var queue = getQueue();
    var exist = queue.find(function (it) { return it.qid === question.id; });
    if (exist) {
      exist.interval = 1;
      exist.due = todayStr(0);
      exist.wrongCount = (exist.wrongCount || 0) + 1;
    } else {
      queue.push({
        id: 'rv_' + Date.now() + '_' + question.id,
        lessonId: lessonId || '',
        qid: question.id,
        qtype: question.type || '',
        stem: question.stem || '',
        question: JSON.parse(JSON.stringify(question)),
        interval: 1,
        due: todayStr(0),
        wrongCount: 1
      });
    }
    saveQueue(queue);
    return queue;
  }

  function total() { return getQueue().length; }

  function dueCount() {
    var today = todayStr(0);
    return getQueue().filter(function (it) { return it.due <= today; }).length;
  }

  // 取 due 的复习题（优先错得多的）
  function dueItems(limit) {
    var today = todayStr(0);
    return getQueue()
      .filter(function (it) { return it.due <= today; })
      .sort(function (a, b) { return (b.wrongCount || 0) - (a.wrongCount || 0); })
      .slice(0, limit || 10);
  }

  // 复习提交：correct=true → interval×2；false → 重置 1d
  function submit(qid, correct) {
    var queue = getQueue();
    var it = queue.find(function (x) { return x.qid === qid; });
    if (!it) return { ok: false };
    if (correct) {
      it.interval = Math.min(30, (it.interval || 1) * 2);
      it.due = todayStr(it.interval);
    } else {
      it.interval = 1;
      it.due = todayStr(1);
    }
    saveQueue(queue);
    return { ok: true, item: it };
  }

  function remove(qid) {
    saveQueue(getQueue().filter(function (x) { return x.qid !== qid; }));
  }

  return {
    addWrong: addWrong,
    total: total,
    dueCount: dueCount,
    dueItems: dueItems,
    submit: submit,
    remove: remove,
    todayStr: todayStr
  };
})();
