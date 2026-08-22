// ============================================================
// PyGo V2 —— 判题引擎（主线程 API）
//   运行学生代码 → 真·CPython（Pyodide，Worker 内加载，本地离线）
//   多测试用例判定 → 真实 traceback → 错误行号 + 中文翻译
//   超时保护：死循环/卡死 由主线程 terminate worker 兜底
// 对外接口（与 app.js 契约一致）：
//   PyGoJudge.run(code, testcases, {timeoutMs, expected})  → 运行+判题
//   PyGoJudge.check(question, payload)                     → 非编程题判定
//   PyGoJudge.ready() / onProgress(fn) / status            → 加载状态（UI 进度）
// ============================================================
(function () {
  'use strict';

  // worker 与 judge.js 同目录（core/），从页面任何路径加载都正确
  var scriptSrc = (document.currentScript && document.currentScript.src) || '';
  var base = scriptSrc ? scriptSrc.replace(/[^/]*$/, '') : ((location.pathname || '/').replace(/[^/]*$/, '') || '/');
  var WORKER_URL = base + 'judge-worker.js';

  var worker = null;
  var status = 'idle';          // idle | loading | ready | error | busy
  var detail = '';
  var version = '';
  var seq = 0;
  var pending = new Map();      // id -> { resolve, timer }
  var progressCbs = [];

  function setStatus(s, d, v) {
    status = s; detail = d || ''; if (v) version = v;
    var evt = { status: status, detail: detail, version: version, ready: status === 'ready' };
    progressCbs.forEach(function (fn) { try { fn(evt); } catch (e) { console.error('[Judge] progress cb', e); } });
  }

  function ensureWorker() {
    if (worker) return worker;
    // Pyodide 314 起仅支持 module worker
    worker = new Worker(WORKER_URL, { type: 'module' });
    setStatus('loading', '正在启动 Python 解释器…');
    worker.onmessage = function (e) {
      var d = e.data;
      if (d.id != null && pending.has(d.id)) {
        var p = pending.get(d.id);
        pending.delete(d.id);
        if (p.timer) clearTimeout(p.timer);
        p.resolve(d);
      } else if (d.type === 'status') {
        if (d.status === 'ready') setStatus('ready', 'Python ' + (d.version || ''), d.version);
        else if (d.status === 'error') setStatus('error', d.detail || '解释器加载失败');
        else setStatus('loading', d.detail || '加载中…');
      }
    };
    worker.onerror = function () {
      // worker 崩溃（通常是被超时 terminate 或加载失败）→ 下次运行自动重建
      var w = worker; worker = null;
      try { w.terminate(); } catch (e) { /* noop */ }
      setStatus('idle', '解释器已停止，下次运行将自动重新启动');
    };
    return worker;
  }

  // 等待解释器就绪（worker 加载 Pyodide 期间不计入运行超时）
  function waitReady(maxWait) {
    return new Promise(function (resolve) {
      if (status === 'ready') return resolve(true);
      if (status === 'error') return resolve(false);
      var timer = setTimeout(function () { cleanup(); resolve(false); }, maxWait || 60000);
      function cleanup() { progressCbs = progressCbs.filter(function (f) { return f !== fn; }); }
      function fn(evt) {
        if (evt.ready || evt.status === 'error') {
          clearTimeout(timer); cleanup();
          resolve(evt.ready);
        }
      }
      progressCbs.push(fn);
    });
  }

  function send(type, payload, timeoutMs) {
    return new Promise(function (resolve) {
      // 解释器未就绪（首次加载 / 超时后重建）→ 先等就绪，不占运行超时
      if (status !== 'ready') {
        ensureWorker();
        waitReady(60000).then(function (ok) {
          if (!ok) { resolve({ id: 0, type: 'error', message: 'Python 解释器加载失败' }); return; }
          dispatch();
        });
        return;
      }
      dispatch();
      function dispatch() {
        var w = worker;
        var id = ++seq;
        var timer = null;
        pending.set(id, { resolve: resolve, timer: null });
        if (timeoutMs > 0) {
          timer = setTimeout(function () {
            if (!pending.has(id)) return;
            pending.delete(id);
            // 超时：终止 worker 兜底（死循环只能这样打断），下次自动重建
            var dead = worker; worker = null;
            try { dead.terminate(); } catch (e) { /* noop */ }
            setStatus('idle', '运行超时，解释器已重置');
            resolve({ id: id, type: 'timeout', timeoutMs: timeoutMs });
          }, timeoutMs);
          pending.get(id).timer = timer;
        }
        try {
          w.postMessage(Object.assign({ id: id, type: type }, payload));
        } catch (err) {
          pending.delete(id);
          if (timer) clearTimeout(timer);
          resolve({ id: id, type: 'error', message: String(err && err.message || err) });
        }
      }
    });
  }

  // ---------- 对外 API ----------

  // 运行学生代码（code/debug/sort 题）：多用例判定，全部通过才 ok
  async function run(code, testcases, opts) {
    opts = opts || {};
    var timeoutMs = opts.timeoutMs || 2000;
    var expected = opts.expected != null ? opts.expected : null;
    var res = await send('run', { code: String(code || ''), testcases: testcases || [], expected: expected }, timeoutMs);

    if (res.type === 'timeout') {
      var zh = {
        title: '运行超时',
        what: '代码运行超过 ' + timeoutMs + 'ms 还没结束，已被强制停止。',
        why: '最常见原因是死循环：while True 或循环条件永远为真，程序停不下来。',
        fix: '检查循环条件是否会在某一步变成 False；while 循环里确认有 break 或能退出的路径；也检查是否忘了写 exit 条件。',
        scenarios: ['while True 循环里没有 break', '循环变量没有更新，条件永远成立', '递归没有出口']
      };
      return { ok: false, timeout: true, stdout: '', error: '运行超时', errorType: 'TimeoutError', errorLine: null, errorZh: zh, feedback: '运行超时：请检查是否有死循环（while True）或 input() 等待输入', passedCount: 0, totalCount: (testcases || []).length || 1 };
    }
    if (res.type === 'error') {
      return { ok: false, stdout: '', error: res.message, errorType: 'EngineError', errorLine: null, errorZh: null, feedback: '判题引擎出错：' + res.message };
    }
    return res.result;
  }

  // 非编程题判定（choice/judge/fill/pair/sort/think）
  var _libPromise = null;
  async function check(question, payload) {
    if (!_libPromise) _libPromise = import(base + 'judge-lib.mjs');
    var lib = await _libPromise;
    return lib.check(question, payload);
  }

  function ready() {
    if (status === 'ready') return Promise.resolve(true);
    return new Promise(function (resolve) {
      var fn = function (evt) {
        if (evt.ready || evt.status === 'error') {
          progressCbs = progressCbs.filter(function (f) { return f !== fn; });
          resolve(evt.ready);
        }
      };
      progressCbs.push(fn);
      ensureWorker();
    });
  }

  function onProgress(fn) {
    progressCbs.push(fn);
    // 立即回放当前状态
    try { fn({ status: status, detail: detail, version: version, ready: status === 'ready' }); } catch (e) { /* noop */ }
    return function () {
      progressCbs = progressCbs.filter(function (f) { return f !== fn; });
    };
  }

  window.PyGoJudge = {
    run: run,
    check: check,
    ready: ready,
    onProgress: onProgress,
    get status() { return status; },
    get version() { return version; },
    get detail() { return detail; },
    // 供调试：强制重建 worker
    reset: function () { if (worker) { try { worker.terminate(); } catch (e) {} worker = null; } setStatus('idle', '已重置'); }
  };
})();
