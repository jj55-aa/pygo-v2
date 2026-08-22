// ============================================================
// PyGo V2 —— 授权模块（激活码验签 + 机器绑定 + 解锁门）
//
// 安全原则（w5 守卫塔「安全闭坑」落地）：
//   1. 应用只嵌公钥（core/license-pub.js），私钥只在卖家机器
//      → 激活码由 Ed25519 私钥签发，可验证、不可伪造（改任何一位都验不过）
//   2. 解锁状态 = 签名过的授权对象，不存明文标志位 → 改 localStorage 无效
//   3. 机器码绑定 + 3 次自动迁移（学生换电脑友好，超限需联系卖家）
//   4. 日志脱敏：激活记录只记类型/结果，不记完整激活码
//   5. 默认拒绝：公钥缺失 / 环境不支持安全校验 → 一律不解锁
//
// 环境要求：crypto.subtle（Web Crypto Ed25519，Chrome 113+ / Edge 113+）
//   - http://localhost 或 Electron 内可直接使用
//   - 纯 file:// 或非本地 http 打开时不支持安全校验 → 保持锁定（诚实失败）
// ============================================================
window.PyGoLicense = (function () {
  'use strict';

  var PUB_B64 = (window.PyGoLicensePub || '').trim();
  var STORE_KEY = 'pygo:license';
  var FREE_UNITS = ['u1'];        // 免费单元（新手村）：完整版解锁全部 87 课
  var MAX_MIGRATE = 3;            // 换机自动迁移上限
  var DAY_MS = 86400000;

  var cache = { unlocked: false, info: null, error: null, verified: false };

  // ---------- 机器指纹（绑定用；不需要加密强度，要稳定） ----------
  // 注意：故意不取 userAgent——浏览器一升级它就会变，会把真用户误判成换机。
  // 只用稳定特征：系统、语言、屏幕、CPU/内存、时区。
  function fingerprint() {
    var parts = [
      navigator.platform || '', navigator.language || '',
      String(screen.width) + 'x' + String(screen.height), String(screen.colorDepth || ''),
      String(navigator.hardwareConcurrency || ''), String(navigator.deviceMemory || ''),
      String(new Date().getTimezoneOffset())
    ];
    return fnv1a(parts.join('|'));
  }
  function fnv1a(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  }

  // ---------- base64url 工具 ----------
  function toBytes(b64) {
    try {
      var s = String(b64).replace(/-/g, '+').replace(/_/g, '/');
      s += '==='.slice(0, (4 - (s.length % 4)) % 4);
      var bin = atob(s);
      var u = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      return u;
    } catch (e) { return null; }
  }
  function bytesToB64(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function hasCrypto() {
    return !!(window.crypto && window.crypto.subtle);
  }

  // ---------- 激活码解析与验签 ----------
  function parseCode(raw) {
    var s = String(raw || '').trim().replace(/\s+/g, '');
    var m = s.match(/^PYGO-([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/);
    if (!m) return null;
    var payloadBytes, payload;
    try {
      payloadBytes = toBytes(m[1]);
      if (!payloadBytes) return null;
      payload = JSON.parse(new TextDecoder().decode(payloadBytes));
    } catch (e) { return null; }
    var sigBytes = toBytes(m[2]);
    if (!sigBytes) return null;
    return { payload: payload, payloadBytes: payloadBytes, sigBytes: sigBytes };
  }

  async function verifySignature(parse) {
    var key = await window.crypto.subtle.importKey('spki', toBytes(PUB_B64), { name: 'Ed25519' }, false, ['verify']);
    return window.crypto.subtle.verify({ name: 'Ed25519' }, key, parse.sigBytes, parse.payloadBytes);
  }

  // ---------- 持久化（localStorage；签名保证不可伪造） ----------
  function loadRecord() {
    try {
      var v = localStorage.getItem(STORE_KEY);
      return v ? JSON.parse(v) : null;
    } catch (e) { return null; }
  }
  function saveRecord(rec) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(rec)); } catch (e) { /* noop */ }
  }
  function clearRecord() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* noop */ }
  }

  // ---------- 初始化：读记录 → 验签 → 查有效期 → 机器绑定/迁移 ----------
  async function init() {
    cache = { unlocked: false, info: null, error: null, verified: false };
    var rec = loadRecord();
    if (!rec || !rec.code) return cache;
    var p = parseCode(rec.code);
    if (!p || !hasCrypto() || !PUB_B64) return cache;
    var good = false;
    try { good = await verifySignature(p); } catch (e) { good = false; }
    if (!good) { clearRecord(); return cache; }          // 被篡改 → 清掉，重新激活

    // 试用码有效期（从签发时刻起算，重输不会续期）
    if (p.payload.t === 'trial') {
      var exp = Number(p.payload.exp) || 0;
      if (Date.now() > exp) {
        cache.info = { unlocked: false, type: 'trial', expired: true, note: p.payload.n };
        return cache;
      }
    }

    // 机器绑定：指纹变化 → 自动迁移（≤3 次）；超限 → 锁定并提示联系卖家
    var fp = fingerprint();
    if (rec.fp !== fp) {
      var mig = Number(rec.migrates) || 0;
      if (mig >= MAX_MIGRATE) {
        cache.error = '换机次数超限（' + MAX_MIGRATE + ' 次），如需换机请联系卖家';
        return cache;
      }
      rec.fp = fp; rec.migrates = mig + 1; saveRecord(rec);
    }

    cache.unlocked = true;
    cache.info = {
      unlocked: true, type: p.payload.t, days: p.payload.d, note: p.payload.n,
      exp: Number(p.payload.exp) || 0,
      activatedAt: rec.activatedAt, migrates: Number(rec.migrates) || 0
    };
    cache.verified = true;
    return cache;
  }

  // ---------- 激活 ----------
  async function activate(code) {
    var p = parseCode(code);
    if (!p) return { ok: false, error: '激活码格式不对（应为 PYGO-… 格式）' };
    if (!PUB_B64) return { ok: false, error: '应用缺少公钥，无法校验激活码' };
    if (!hasCrypto()) return { ok: false, error: '当前环境不支持安全校验（请用 localhost 或打包版打开）' };

    var good = false;
    try { good = await verifySignature(p); } catch (e) { good = false; }
    if (!good) return { ok: false, error: '激活码无效（签名校验失败）' };

    // 试用码已过期：码是有效的，但不能再用来激活
    if (p.payload.t === 'trial') {
      var exp = Number(p.payload.exp) || 0;
      if (Date.now() > exp) return { ok: false, error: '该试用码已过期' };
    }

    saveRecord({ code: String(code).trim(), fp: fingerprint(), activatedAt: Date.now(), migrates: 0 });
    await init();
    if (!cache.unlocked) return { ok: false, error: cache.error || '激活未生效' };
    return { ok: true, unlocked: true, info: cache.info };
  }

  function deactivate() {
    clearRecord();
    cache = { unlocked: false, info: null, error: null, verified: false };
    return { ok: true };
  }

  // ---------- 对外接口 ----------
  return {
    init: init,
    activate: activate,
    deactivate: deactivate,
    isUnlocked: function () { return !!cache.unlocked; },
    getInfo: function () { return cache.info; },
    getError: function () { return cache.error; },
    isFreeUnit: function (unitId) { return FREE_UNITS.indexOf(unitId) !== -1; },
    freeUnits: FREE_UNITS.slice(),
    maskCode: function (code) {
      if (!code || code.length < 14) return '****';
      return code.slice(0, 8) + '…' + code.slice(-6);
    }
  };
})();
