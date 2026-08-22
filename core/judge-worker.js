// ============================================================
// PyGo V2 —— 判题 worker（MODULE worker）
// 在 Worker 里加载 Pyodide 并执行学生代码；主线程通过超时
// terminate 本 worker 来兜底死循环（见 judge.js）
// 注：Pyodide 314 起不再支持 classic worker，必须用 module worker
// ============================================================
import { loadPyodide } from '../vendor/pyodide/pyodide.mjs';
import * as PyGoJudgeLib from './judge-lib.mjs';

let pyodide = null;
let ready = false;
const queue = [];

self.onmessage = function (e) {
  if (!ready) { queue.push(e); return; }
  handle(e);
};

function handle(e) {
  const d = e.data;
  if (d.type === 'run') {
    try {
      const result = PyGoJudgeLib.executeAll(pyodide, d.code, d.testcases, { expected: d.expected });
      self.postMessage({ id: d.id, type: 'result', result });
    } catch (err) {
      self.postMessage({ id: d.id, type: 'error', message: (err && err.message) || String(err) });
    }
  }
}

async function init() {
  self.postMessage({ type: 'status', status: 'loading', detail: '正在加载 Python 运行时（首次较慢）…' });
  try {
    pyodide = await loadPyodide({ indexURL: '../vendor/pyodide/' });
    ready = true;
    self.postMessage({ type: 'status', status: 'ready', version: pyodide.version });
    while (queue.length) handle(queue.shift());
  } catch (err) {
    self.postMessage({ type: 'status', status: 'error', detail: (err && err.message) || String(err) });
  }
}
init();
