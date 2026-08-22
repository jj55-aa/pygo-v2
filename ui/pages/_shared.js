/*!
 * PyGo V2 · UI 公共工具（被各页面片段 <script src="ui/pages/_shared.js"></script> 加载）
 * 只做「展示与交互辅助」：渲染 markdown / 语法高亮 / 线性图标 / 反馈动效。
 * 不碰核心逻辑：不读写 state、不算判题、不操作 localStorage。
 */
(function () {
  'use strict';

  // ============================================================
  // 0. 注入共享样式（Design Tokens + keyframes + 工具类）
  // ============================================================
  var SHARED_CSS = [
    ':root{',
    '--bg:#F7F8F8;--card:#FFFFFF;',
    '--text:#0A0A0A;--text-2:#62666D;--text-3:#8A8F98;',
    '--accent:#5E6AD2;--accent-2:#7170FF;',
    '--ok:#10B981;--bad:#EF4444;--warn:#F59E0B;',
    '--border:#E6E6E6;--border-2:#D0D6E0;',
    '--r-btn:6px;--r-card:8px;--r-modal:12px;',
    '--shadow-card:0 1px 2px rgba(0,0,0,.04);',
    '--shadow-float:0 8px 24px rgba(0,0,0,.12);',
    '--ease:cubic-bezier(.2,.8,.2,1);',
    '--font-ui:Inter,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;',
    '--font-code:"JetBrains Mono",Consolas,"SF Mono",Menlo,monospace;',
    '}',
    // 通用工具类
    '.page{animation:pgFadeUp .2s var(--ease) both;}',
    '.ic{display:inline-block;vertical-align:-3px;flex:none;}',
    // 语法高亮 token
    '.tk-c{color:#8A8F98;font-style:italic;}',
    '.tk-s{color:#16A34A;}',
    '.tk-k{color:#7C3AED;font-weight:600;}',
    '.tk-f{color:#2563EB;}',
    '.tk-n{color:#D97706;}',
    // 反馈 / 动效
    '.xp-float{position:fixed;z-index:10000;font-weight:700;font-size:16px;color:var(--accent);pointer-events:none;animation:xpFloat 1.1s var(--ease) forwards;}',
    '.confetti i{display:block;position:absolute;top:-20px;}',
    '.shakable.shake{animation:shake .3s var(--ease);}',
    '.heart-pop{animation:heartPop .3s var(--ease);}',
    '@keyframes pgFadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}',
    '@keyframes cardIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}',
    '@keyframes xpFloat{0%{opacity:0;transform:translateY(0) scale(.8);}20%{opacity:1;}100%{opacity:0;transform:translateY(-46px) scale(1.05);}}',
    '@keyframes shake{0%,100%{transform:translateX(0);}20%{transform:translateX(-5px);}40%{transform:translateX(5px);}60%{transform:translateX(-3px);}80%{transform:translateX(3px);}}',
    '@keyframes heartPop{0%{transform:scale(1);}40%{transform:scale(1.35);}70%{transform:scale(.9);}100%{transform:scale(1);}}',
    '@keyframes confettiFall{to{transform:translateY(105vh) rotate(540deg);opacity:0;}}',
    '@keyframes breathe{0%,100%{box-shadow:0 0 0 0 rgba(94,106,210,.35);}50%{box-shadow:0 0 0 8px rgba(94,106,210,0);}}',
    '@keyframes pulseDot{0%,100%{opacity:1;}50%{opacity:.4;}}',
    '@keyframes barFill{from{width:0;}}',
    '@keyframes spin{to{transform:rotate(360deg);}}'
  ].join('\n');

  function injectCss() {
    if (document.getElementById('pygo-shared-css')) return;
    var st = document.createElement('style');
    st.id = 'pygo-shared-css';
    st.textContent = SHARED_CSS;
    document.head.appendChild(st);
  }
  injectCss();

  // ============================================================
  // 1. HTML 转义
  // ============================================================
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ============================================================
  // 2. 轻量 Markdown（段落 / 加粗 / 行内代码 / 列表 / 表格 / 引用）
  // ============================================================
  function inline(s) {
    s = esc(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    return s;
  }

  function renderTable(rows) {
    var cells = rows.map(function (r) {
      return r.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(function (c) { return c.trim(); });
    });
    if (!cells.length || !cells[0].length) return '';
    var html = '<div class="md-table"><table><thead><tr>';
    cells[0].forEach(function (c) { html += '<th>' + inline(c) + '</th>'; });
    html += '</tr></thead><tbody>';
    for (var r = 2; r < cells.length; r++) {
      if (!cells[r]) continue;
      html += '<tr>';
      cells[r].forEach(function (c) { html += '<td>' + inline(c) + '</td>'; });
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    return html;
  }

  function md(src) {
    if (!src) return '';
    var lines = String(src).replace(/\r\n?/g, '\n').split('\n');
    var out = [];
    var para = [];
    var listType = null;
    var i = 0;

    function flushPara() {
      if (para.length) { out.push('<p>' + para.map(inline).join('<br>') + '</p>'); para = []; }
    }
    function closeList() { if (listType) { out.push('</' + listType + '>'); listType = null; } }

    while (i < lines.length) {
      var line = lines[i];
      var t = line.trim();

      if (/^```/.test(t)) {
        flushPara(); closeList();
        var codeLines = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) { codeLines.push(lines[i]); i++; }
        i++;
        out.push('<pre class="md-code">' + esc(codeLines.join('\n')) + '</pre>');
        continue;
      }
      if (/^\|.*\|$/.test(t)) {
        flushPara(); closeList();
        var rows = [];
        while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) { rows.push(lines[i].trim()); i++; }
        out.push(renderTable(rows));
        continue;
      }
      if (/^>\s?/.test(t)) {
        flushPara(); closeList();
        var q = [];
        while (i < lines.length && /^>\s?/.test(lines[i].trim())) { q.push(lines[i].trim().replace(/^>\s?/, '')); i++; }
        out.push('<blockquote>' + q.map(inline).join('<br>') + '</blockquote>');
        continue;
      }
      if (/^[-*]\s+/.test(t)) {
        flushPara();
        if (listType !== 'ul') { closeList(); out.push('<ul>'); listType = 'ul'; }
        out.push('<li>' + inline(t.replace(/^[-*]\s+/, '')) + '</li>');
        i++; continue;
      }
      if (/^\d+[.、]\s+/.test(t)) {
        flushPara();
        if (listType !== 'ol') { closeList(); out.push('<ol>'); listType = 'ol'; }
        out.push('<li>' + inline(t.replace(/^\d+[.、]\s+/, '')) + '</li>');
        i++; continue;
      }
      if (!t) { flushPara(); closeList(); i++; continue; }
      para.push(t);
      i++;
    }
    flushPara(); closeList();
    return out.join('');
  }

  // ============================================================
  // 3. Python 语法高亮
  // ============================================================
  var KW = ('False None True and as assert async await break class continue def del elif else ' +
    'except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield').split(' ');
  var BI = ('print input int float str bool type len range list dict set tuple sorted sum min max abs ' +
    'round open help format enumerate zip map filter').split(' ');

  function pyHighlight(code) {
    var s = String(code == null ? '' : code);
    var ph = [];
    // 先保护字符串与注释（占位符用字母 p 前缀，避免被数字 / 关键字正则误吞）
    s = s.replace(/(#.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/gm, function (m, comment, str) {
      var idx = ph.length;
      if (comment) ph.push('<span class="tk-c">' + esc(comment) + '</span>');
      else ph.push('<span class="tk-s">' + esc(str) + '</span>');
      return '\u0000p' + idx + '\u0000';
    });
    s = esc(s);
    s = s.replace(new RegExp('\\b(' + KW.join('|') + ')\\b', 'g'), '<span class="tk-k">$1</span>');
    s = s.replace(new RegExp('\\b(' + BI.join('|') + ')(?=\\()', 'g'), '<span class="tk-f">$1</span>');
    s = s.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tk-n">$1</span>');
    s = s.replace(/\u0000p(\d+)\u0000/g, function (m, idx) { return ph[+idx]; });
    return s;
  }

  // 多行高亮：按行包裹，可标记报错行（errorLine 从 1 计数）
  function pyLines(code, errorLine) {
    var lines = String(code == null ? '' : code).split('\n');
    return lines.map(function (line, idx) {
      var cls = (errorLine != null && (idx + 1) === errorLine) ? ' class="err"' : '';
      return '<span' + cls + '>' + (pyHighlight(line) || ' ') + '\n</span>';
    }).join('');
  }

  // ============================================================
  // 4. 线性 SVG 图标（stroke 风格，currentColor 继承）
  // ============================================================
  var PATHS = {
    back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
    heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    flame: 'M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z',
    bolt: 'M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z',
    lock: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
    play: 'M8 5v14l11-7z',
    check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
    close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    warn: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
    code: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
    book: 'M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z',
    target: 'M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z',
    bell: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
    refresh: 'M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
    trophy: 'M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z',
    calendar: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z',
    clock: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
    star: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
    arrowUp: 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z',
    arrowDown: 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z',
    help: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z',
    shield: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z'
  };

  function icon(name, size) {
    size = size || 20;
    var d = PATHS[name] || PATHS.help;
    return '<svg class="ic" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  }

  // 心形（filled 控制实心/空心）
  function heartSvg(filled, size) {
    size = size || 20;
    var d = PATHS.heart;
    if (filled) {
      return '<svg class="ic" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' + d + '"/></svg>';
    }
    return '<svg class="ic" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  }

  // ============================================================
  // 5. 反馈动效工具
  // ============================================================
  // XP 飘字（在指定坐标附近）
  function xpFloat(text, x, y) {
    var el = document.createElement('div');
    el.className = 'xp-float';
    el.textContent = text;
    if (x != null && y != null) {
      el.style.left = x + 'px';
      el.style.top = y + 'px';
    } else {
      el.style.left = '50%';
      el.style.top = '40%';
    }
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 1200);
  }

  // 通关庆祝（彩带粒子，800ms+，自动清理）
  function celebrate() {
    var colors = ['#5E6AD2', '#10B981', '#F59E0B', '#EF4444', '#7170FF', '#14B8A6'];
    var wrap = document.createElement('div');
    wrap.className = 'confetti';
    wrap.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
    var i, p, size;
    for (i = 0; i < 70; i++) {
      p = document.createElement('i');
      size = 6 + Math.random() * 8;
      p.style.cssText = 'position:absolute;left:' + (Math.random() * 100) + 'vw;top:-24px;width:' + size + 'px;height:' + size +
        'px;background:' + colors[i % colors.length] + ';opacity:.9;transform:rotate(' + (Math.random() * 360) + 'deg);' +
        'border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';animation:confettiFall ' + (1.2 + Math.random() * 0.9) + 's linear ' + (Math.random() * 0.5) + 's forwards;';
      wrap.appendChild(p);
    }
    document.body.appendChild(wrap);
    setTimeout(function () { wrap.remove(); }, 2800);
  }

  // 抖动（答错反馈）
  function shake(el) {
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }

  // ============================================================
  // 6. 键盘 / 无障碍辅助
  // ============================================================
  function onKey(scope, key, fn) {
    document.addEventListener('keydown', function (e) {
      if (e.key === key && !(e.target && /input|textarea/i.test(e.target.tagName))) {
        fn(e);
      }
    });
  }

  // ============================================================
  // 7. 页面生命周期：切页时清理上一页面的订阅，避免监听器累积
  // ============================================================
  function bindPage(onState) {
    // 清理上一个页面遗留的订阅 / 事件
    if (window.__pygoPageCleanup) { try { window.__pygoPageCleanup(); } catch (e) { /* noop */ } }
    var App = window.App;
    var unsub = App && App.subscribe ? App.subscribe(onState) : null;
    var evts = [];
    var api = {
      on: function (name, fn) {
        if (App && App.events && App.events.on) { App.events.on(name, fn); evts.push([name, fn]); }
      },
      cleanup: function () {
        if (unsub) { try { unsub(); } catch (e) { /* noop */ } }
        evts.forEach(function (p) { try { App.events.off(p[0], p[1]); } catch (e) { /* noop */ } });
      }
    };
    window.__pygoPageCleanup = api.cleanup;
    return api;
  }

  // ============================================================
  window.PyGoUI = {
    esc: esc,
    md: md,
    inline: inline,
    pyHighlight: pyHighlight,
    pyLines: pyLines,
    icon: icon,
    heartSvg: heartSvg,
    xpFloat: xpFloat,
    celebrate: celebrate,
    shake: shake,
    onKey: onKey,
    bindPage: bindPage
  };
})();
