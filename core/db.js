// ============================================================
// 数据层：进度 / 错题 / 复习队列 / 连胜 / 埋点
// 本期：localStorage 骨架；后续换 IndexedDB（Electron 用 SQLite）
// ============================================================
window.PyGoDB = {
  get(key) { try { return JSON.parse(localStorage.getItem('pygo:' + key)); } catch (e) { return null; } },
  set(key, val) { localStorage.setItem('pygo:' + key, JSON.stringify(val)); },
  load(key) { return this.get(key) || {}; },
  save(key, val) { this.set(key, val); },
  // 埋点：事件日志（本地）
  log(event, props) {
    const ts = new Date().toISOString();
    const logs = this.get('events') || [];
    logs.push({ ts, event, props });
    if (logs.length > 20000) logs.splice(0, logs.length - 20000);
    this.set('events', logs);
  }
};
