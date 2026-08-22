
// ============================================================
// PyGo V2 —— 判题库（纯逻辑 + 执行封装，浏览器 worker / Node 双端可用）
// 职责：
//   1. executeAll(pyodide, code, testcases)  —— 真解释器执行 + 多用例判定
//   2. parseTraceback(msg)                   —— 真实 traceback → 错误类型/行号
//   3. translateError(type, msg, source)     —— 报错"翻译成人话"（中文库）
//   4. diffHint(out, exp)                    —— 输出逐行 diff 提示
//   5. check(question, payload)              —— 非编程题判定（choice/judge/fill/pair/sort/think）
// 素材：V1 grader.py（宽容判分/diff 提示）、视频025《Python 常见报错整理》、教材第 9 章
// ============================================================
// 纯 ESM 模块（浏览器 module worker / Node 双端可用）
'use strict';

  // ---------- 中英文同义词（V1 迁移）：填中文也算对 ----------
  const SYNONYMS = {
    float: ['浮点数', '浮点型', '小数'],
    int: ['整型', '整数'],
    str: ['字符串', '字符型', '文本'],
    bool: ['布尔型', '布尔值', '布尔', '真假'],
    true: ['真', '正确', '对'],
    false: ['假', '错误', '错'],
    list: ['列表'],
    tuple: ['元组'],
    dict: ['字典'],
    set: ['集合'],
    none: ['空', '什么都没有']
  };

  function _norm(s) {
    return String(s == null ? '' : s).replace(/[<>'"`()（）《》\s]/g, '').trim().toLowerCase();
  }

  // 宽容判分：归一化后相等/包含，或中英文同义词匹配；数字答案严格匹配
  function matchAnswer(ans, key) {
    const a = _norm(ans), k = _norm(key);
    if (a === k) return true;
    // 数字答案严格匹配，避免 3 误判 3.5 / 18 误判 183
    if (/^\d+(\.\d+)?$/.test(k) || /^\d+(\.\d+)?$/.test(a)) {
      // 仅当两者都是纯数字时比较
      if (/^\d+(\.\d+)?$/.test(k) && /^\d+(\.\d+)?$/.test(a)) return Number(a) === Number(k);
      return false;
    }
    if (a && k && (a.includes(k) || k.includes(a))) return true;
    for (const en of Object.keys(SYNONYMS)) {
      const cns = SYNONYMS[en];
      if (k === en) return cns.some(cn => a.includes(cn) || cn.includes(a));
      if (a === en) return cns.some(cn => k.includes(cn) || cn.includes(k));
    }
    return false;
  }

  // fill 答案支持多答案（任一匹配即对）
  function matchAny(answer, key) {
    const keys = Array.isArray(key) ? key : [key];
    return keys.some(k => matchAnswer(answer, k));
  }

  // ---------- 输出比对 ----------
  function normalizeOutput(s) {
    return String(s == null ? '' : s).replace(/\s+$/, '');
  }

  function outputMatches(out, expected) {
    return normalizeOutput(out) === normalizeOutput(expected);
  }

  // V1 迁移：逐行 diff 提示
  function diffHint(out, exp) {
    out = normalizeOutput(out);
    exp = normalizeOutput(exp);
    if (!exp) return '';
    if (out === exp) return '';   // 归一化后相同（如仅尾部换行差异）不算差异
    const ol = out.split('\n'), el = exp.split('\n');
    if (ol.length !== el.length) {
      return '行数不同：你输出了 ' + ol.length + ' 行，期望 ' + el.length + ' 行——检查是否多写/漏写了 print()';
    }
    for (let i = 0; i < ol.length; i++) {
      if (ol[i] !== el[i]) {
        const a = ol[i], b = el[i];
        if (a.length !== b.length) {
          return '第 ' + (i + 1) + ' 行不同：你的是「' + a + '」（' + a.length + '字），期望「' + b + '」（' + b.length + '字）——检查内容与空格';
        }
        return '第 ' + (i + 1) + ' 行不同：你的是「' + a + '」，期望「' + b + '」——检查大小写与字符';
      }
    }
    return '输出看起来一样却被判错——检查是不是多了空格或换行';
  }

  // ---------- traceback 解析 ----------
  function parseTraceback(message, source) {
    const msg = message || '';
    let errorType = null, errorMsg = '';
    const lines = msg.split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const t = lines[i].trim();
      if (!t || t.startsWith('File ') || t.startsWith('  ')) continue;
      const m = t.match(/^([A-Za-z_][A-Za-z0-9_.]*):\s*(.*)$/);
      if (m) { errorType = m[1]; errorMsg = m[2].trim(); break; }
    }
    const frames = [];
    const re = /File "([^"]+)", line (\d+)/g;
    let fm;
    while ((fm = re.exec(msg))) frames.push({ file: fm[1], line: parseInt(fm[2], 10) });
    let errorLine = null;
    for (let i = frames.length - 1; i >= 0; i--) {
      if (frames[i].file === '<pygo>') { errorLine = frames[i].line; break; }
    }
    if (errorLine == null) {
      for (let i = frames.length - 1; i >= 0; i--) {
        const f = frames[i].file;
        if (f === '<exec>' || f === '<string>' || f === '<module>') { errorLine = frames[i].line; break; }
      }
    }
    // 语法错误有时只有 <pygo> 帧且位于最前
    if (errorLine == null) {
      for (const fr of frames) { if (fr.file === '<pygo>') { errorLine = fr.line; break; } }
    }
    let snippet = null;
    if (errorLine != null && typeof source === 'string') {
      const src = source.split('\n');
      if (errorLine >= 1 && errorLine <= src.length) snippet = src[errorLine - 1];
    }
    return { errorType, errorMsg, errorLine, snippet, frames };
  }

  // ---------- 中文报错翻译库 ----------
  // 素材：视频025《Python 中常见的报错整理》、教材第 9 章异常处理、V1 friendly_error
  const ZH_ERRORS = {
    SyntaxError: {
      title: '语法错误',
      what: '这行代码不符合 Python 的语法规则，解释器读不懂这句话。',
      why: '常见原因：括号/引号没配对、if/for/def 后面忘了冒号、用了中文标点。',
      fix: '对照报错指向的行，把标点全部换成英文半角（, . : ; ( ) " ），并检查括号、引号是否成对闭合。',
      scenarios: ['if 条件后忘记写冒号 :', '用了中文输入法的标点 ，。（）', '引号或括号只写了一半'],
      patterns: [
        { re: /[，。；：？！“”‘’（）【】《》、]/, hint: '检测到中文标点：请把 ，。；：（）“” 等全部改成英文半角 , . ; : ( ) "" —— Python 只认英文标点。' },
        { re: /invalid syntax/, hint: '这一行写错了：常见是漏了冒号、括号不配对、关键字拼错（if/for/def/while 是保留字，不能当变量名）。' }
      ]
    },
    IndentationError: {
      title: '缩进错误',
      what: '代码的缩进（行首空格）不对，Python 不知道这几行属于哪个代码块。',
      why: '常见原因：if/for/while/def 冒号后面的代码块忘了缩进；同一代码块里缩进不一致；某行前不小心多了空格。',
      fix: '用 Tab 键统一缩进：冒号后的代码块统一缩进 4 个空格，同一块的每一行缩进必须一模一样。',
      scenarios: ['if 语句下要执行的代码没有缩进', '同一代码块有的缩进 2 格、有的 4 格', '某行前面手滑多打了一个空格'],
      patterns: [
        { re: /expected an indented block/, hint: '冒号后面必须有一个缩进的代码块：if/for/while/def 的下一行要按 Tab 缩进。' },
        { re: /unindent does not match any outer indentation level/, hint: '缩进层级对不上：这一行的缩进和它所属的代码块不一致，检查是否多退/少退了空格。' },
        { re: /unexpected indent/, hint: '这一行意外多了缩进：这行不该有缩进，把行首空格删掉。' }
      ]
    },
    TabError: {
      title: '缩进混用错误',
      what: '同一文件里混用了 Tab 和空格来缩进。',
      why: 'Python 不允许同一代码块里 Tab 和空格混用（虽然肉眼看起来一样）。',
      fix: '统一只用 Tab 或只用空格：推荐全部用 Tab（编辑器里 Tab 会自动对齐）。',
      scenarios: ['复制粘贴代码时带来了混用缩进']
    },
    NameError: {
      title: '名字未定义',
      what: '用到了一个不存在的变量或函数名。',
      why: '要么拼写错误（大小写也算错），要么这个变量还没赋值/还没定义就用它。',
      fix: '检查名字拼写（Python 区分大小写：Name 和 name 是两个名字）；确认使用前先赋值；函数要先 def 再调用。',
      scenarios: ['变量名拼错：写成 pritn 而不是 print', '变量还没赋值就 print(x)', '把字符串忘加引号：name = 小明 会报 NameError'],
      patterns: [
        { re: /name '([^']+)' is not defined/, hint: null } // hint 由调用方用捕获名拼装
      ]
    },
    UnboundLocalError: {
      title: '局部变量未赋值就使用',
      what: '函数里用了一个变量，但这个变量在函数里还没赋值。',
      why: '只要函数里有 x = ... 的赋值，整个函数里的 x 都被当作"局部变量"；在赋值之前使用它就会报错。',
      fix: '把使用放在赋值之后；如果要用外面的全局变量，在函数里声明 global x。',
      scenarios: ['函数里先 print(x) 再 x = 1', '忘记在函数里给变量赋初值']
    },
    TypeError: {
      title: '类型错误',
      what: '不同类型的数据不能进行这个操作（最常见：字符串和数字相加）。',
      why: 'Python 对数据类型要求严格：「1」+ 1 这种字符串 + 数字不被允许；input() 拿到的永远是字符串。',
      fix: '先看两个操作数分别是什么类型，用 int() / float() / str() 转成同类型再运算。',
      scenarios: ['「1」+ 1：字符串和数字直接相加', 'input() 输入数字后没转 int() 就做算术', 'len() 作用在数字上'],
      patterns: [
        { re: /unsupported operand type\(s\) for \+: '(\w+)' and '(\w+)'/, hint: null },
        { re: /can only concatenate str \(not "([^"]+)"\) to str/, hint: '拼接字符串时混进了数字：数字要先 str() 转成字符串，例如 "价格：" + str(price)。' },
        { re: /must be str, not (\w+)/, hint: 'input() 拿到的总是字符串：做算术前要 int() / float() 转换，例如 n = int(input(...))。' },
        { re: /'([^']+)' object is not callable/, hint: null },
        { re: /not all arguments converted during string formatting/, hint: '格式化占位符数量不匹配：%d / {} 的个数和后面的参数个数要对上。' }
      ]
    },
    AttributeError: {
      title: '属性或方法不存在',
      what: '这个对象身上没有你要用的属性/方法。',
      why: '对象类型用错了，或函数忘了 return 导致拿到的是 None。',
      fix: '检查变量到底是什么类型（print(type(x)) 看看）；函数里记得写 return。',
      scenarios: ['NoneType 上调用方法：函数没写 return', '把列表当成字符串用 .upper()'],
      patterns: [
        { re: /'NoneType' object has no attribute '([^']+)'/, hint: null }
      ]
    },
    ValueError: {
      title: '值错误',
      what: '值的内容不符合要求（常见：想把"abc"转成整数）。',
      why: 'int()/float() 只能转换长得像数字的字符串；解包时数量对不上也会报这个错。',
      fix: '检查要转换的内容是不是纯数字；检查赋值解包的数量是否一致。',
      scenarios: ['int("abc") 转非数字', 'input() 输入了字母却要转数字', 'a, b = [1, 2, 3] 数量对不上'],
      patterns: [
        { re: /invalid literal for int\(\) with base 10: '([^']*)'/, hint: null },
        { re: /invalid literal for float\(\): '([^']*)'/, hint: null },
        { re: /not enough values to unpack/, hint: '解包数量对不上：左边变量个数和右边可拆的数量不一致（a, b = [1, 2, 3] 会报错）。' }
      ]
    },
    ZeroDivisionError: {
      title: '除以 0',
      what: '把 0 当成了除数（分母）。',
      why: '数学上不能除以 0，Python 会直接报错。',
      fix: '检查除数是否可能为 0，先判断：if b != 0: 再计算，或用 try/except。',
      scenarios: ['x / 0 直接写死', '循环到某次分母变成 0', '取余 % 0 也一样报错']
    },
    IndexError: {
      title: '下标越界',
      what: '用了一个不存在的下标去取列表/字符串/元组里的元素。',
      why: '下标从 0 开始数：长度是 n 的序列，合法下标是 0 ~ n-1。',
      fix: '检查下标范围：len(x) 获取长度，下标不要超过 len(x)-1；循环里注意边界。',
      scenarios: ['lst[3] 但列表只有 3 个元素', '循环里下标越界', '忘了 range(len(x)) 的边界'],
      patterns: [
        { re: /string index out of range/, hint: '字符串下标越界：下标从 0 开始，别超过 长度-1。' },
        { re: /list index out of range/, hint: '列表下标越界：长度为 n 的列表，最大下标是 n-1。' },
        { re: /tuple index out of range/, hint: '元组下标越界：长度为 n 的元组，最大下标是 n-1。' }
      ]
    },
    KeyError: {
      title: '字典键不存在',
      what: '用了一个字典里不存在的键去取值。',
      why: '字典 dict 只认它里面有的键；用不存在的键 d["xxx"] 直接取会报错。',
      fix: '先确认键存在：用 in 判断（if k in d:），或使用 d.get(k, 默认值)。',
      scenarios: ['d["name"] 但字典里没有 name 这个键', '键名拼写/大小写不一致']
    },
    ModuleNotFoundError: {
      title: '模块找不到',
      what: 'import 了一个不存在的模块（库）。',
      why: '模块名拼错，或这个库没有安装（浏览器版 Python 只内置部分库）。',
      fix: '检查 import 的模块名拼写；浏览器版（Pyodide）可用 import sys 查看内置模块，第三方库需在本地 Python 安装。',
      scenarios: ['import numpy 但在线环境没有', '模块名拼错：import requets']
    },
    ImportError: {
      title: '导入错误',
      what: '模块存在，但里面没有要导入的那个名字。',
      why: 'from xxx import yyy 里 yyy 不存在（名字拼错，或这个函数/类不在该模块里）。',
      fix: '检查要导入的名字拼写；不确定时先 import xxx 再 help(xxx) 查看。',
      scenarios: ['from math import squrt（应为 sqrt）']
    },
    RecursionError: {
      title: '无限递归',
      what: '函数不停调用自己，栈被撑爆了。',
      why: '递归函数缺少退出条件，或条件永远不满足。',
      fix: '检查递归的基准条件（base case）：递归调用必须让问题越来越小，最终走到出口。',
      scenarios: ['def f(): return f() 没有出口']
    },
    EOFError: {
      title: '输入不足',
      what: '代码里的 input() 想读取输入，但已经没有可读的数据了。',
      why: '测试用例提供的输入行不够，或代码多读了一次 input()。',
      fix: '检查代码里 input() 的调用次数是否和题目要求一致；不要随便多加 input()。',
      scenarios: ['题目只需 1 次 input()，代码里写了 2 次']
    },
    FileNotFoundError: {
      title: '文件不存在',
      what: '打开了一个不存在的文件路径。',
      why: '文件名拼错、路径不对，或（浏览器版）该文件根本没放在可读取的位置。',
      fix: '检查文件名与路径是否正确；浏览器版 Python 无法读写本地磁盘文件。',
      scenarios: ['open("data.txt") 但文件不在']
    },
    OverflowError: {
      title: '数值溢出',
      what: '数字运算结果超出范围（常见于把超大的数转成整数）。',
      why: 'int() 转换的值太大，或计算结果超出类型限制。',
      fix: '检查是否有死循环让数字无限增长，或避免把超大字符串转 int()。'
    },
    MemoryError: {
      title: '内存耗尽',
      what: '程序占用的内存太多，被系统拦下了。',
      why: '最常见：死循环里不停往列表里 append，或无限递归。',
      fix: '检查循环是否会结束、列表是否无限增长；加上退出条件。'
    },
    AssertionError: {
      title: '断言失败',
      what: 'assert 语句的条件不成立。',
      why: '程序里写了 assert 条件，运行时条件为 False。',
      fix: '检查 assert 里的条件为什么为假——通常说明程序逻辑有 bug。',
      scenarios: ['assert 检查的结果和预期不符']
    },
    RuntimeError: {
      title: '运行时错误',
      what: '程序运行过程中抛出的其他异常。',
      why: '看最后一行报错信息，那是最具体的原因。',
      fix: '根据报错信息检查对应代码行。'
    },
    SystemExit: {
      title: '程序主动退出',
      what: '代码调用了 exit() / sys.exit() 让程序结束。',
      why: 'exit() 一般用于提前结束程序，测试中视为程序结束了。',
      fix: '确认是否真的想在这里结束程序。'
    },
    KeyboardInterrupt: {
      title: '程序被中断',
      what: '程序执行被 Ctrl+C 中断（测试中一般不出现）。',
      why: '手动中断了运行。',
      fix: '重新运行即可。'
    }
  };

  function translateError(errorType, message, source) {
    const type = errorType || 'RuntimeError';
    const entry = ZH_ERRORS[type] || {
      title: type,
      what: '程序运行时抛出了 ' + type + '。',
      why: '看最后一行报错，那是最具体的原因。',
      fix: '对照报错提示检查对应行。',
      scenarios: []
    };
    let hint = null;
    // 全局检测优先：源码里出现中文标点 → 直接给中文标点提示
    if (type === 'SyntaxError' && typeof source === 'string' && /[，。；：？！“”‘’（）【】《》、]/.test(source)) {
      hint = '检测到中文标点：请把 ，。；：（）“” 等全部改成英文半角 , . ; : ( ) "" —— Python 只认英文标点。';
    }
    // 类型专属的模式匹配
    if (!hint && entry.patterns) {
      for (const p of entry.patterns) {
        if (p.re && message && p.re.test(message)) {
          hint = p.hint;
          if (p.hint === null) {
            // 动态拼装（NameError / TypeError / ValueError / AttributeError 等带名字的）
            const m = message.match(p.re);
            if (m && m[1]) {
              if (type === 'NameError') hint = '变量/函数「' + m[1] + '」没有定义：检查拼写（大小写也算），或确认使用前先赋值。';
              else if (type === 'TypeError') hint = '「' + m[1] + '」和「' + m[2] + '」不能直接相加：' + m[1] + ' 要 str() 转成字符串，或 ' + m[2] + ' 要 int()/float() 转成数字。';
              else if (type === 'AttributeError') hint = '函数没有返回值：调用的结果是什么都没有的 None，再对它 .' + m[1] + '() 就报错——检查函数是否漏写了 return。';
              else if (type === 'ValueError') hint = '想把「' + m[1] + '」转成数字失败：input() 拿到的是字符串，只有纯数字才能 int()/float()。';
            }
          }
          if (hint) break;
        }
      }
    }
    const summary = hint || (entry.what || '');
    return {
      title: entry.title,
      what: entry.what,
      why: entry.why,
      fix: entry.fix,
      scenarios: entry.scenarios,
      hint,
      summary,
      raw: message
    };
  }

  // ---------- 执行封装（需要 pyodide 实例，浏览器 worker / Node 通用） ----------
  const CAPS = { maxChars: 20000, maxLines: 300 };

  function setupIO(pyodide, inputText) {
    // 注意：pyodide 314 的 raw 模式回调收到「字节数值」（UTF-8 字节），
    // 需收集后统一用 TextDecoder 解码，否则中文输出会变乱码（å¥æ°）
    const outBytes = [], errBytes = [], outStr = [], errStr = [];
    const lines = inputText == null || inputText === '' ? [] : String(inputText).split('\n');
    let li = 0, outChars = 0, outLines = 0, errChars = 0;
    let outCapped = false, errCapped = false;
    // 数值=UTF-8 字节（收集后统一解码）；字符串=环境直接给的已解码文本
    function collect(list, listStr, s, capped) {
      if (typeof s === 'number') { if (!capped) list.push(s); return 1; }
      const str = String(s);
      if (!capped) listStr.push(str);
      return str.length;
    }
    pyodide.setStdout({ raw: (s) => {
      outChars += collect(outBytes, outStr, s, outCapped);
      outLines += (String(s).match(/\n/g) || []).length;
      if (outChars > CAPS.maxChars || outLines > CAPS.maxLines) outCapped = true;   // 超限后不再收集（仍计数）
    }});
    pyodide.setStderr({ raw: (s) => {
      errChars += collect(errBytes, errStr, s, errCapped);
      if (errChars > CAPS.maxChars) errCapped = true;
    }});
    pyodide.setStdin({ stdin: () => (li < lines.length ? lines[li++] : null) });
    function decode(bytes, strChunks) {
      if (bytes.length) strChunks.push(new TextDecoder('utf-8').decode(Uint8Array.from(bytes)));
      return strChunks.join('');
    }
    return {
      out: () => decode(outBytes, outStr),
      err: () => decode(errBytes, errStr),
      truncated: outCapped || errCapped
    };
  }

  function runCodeOnce(pyodide, code, inputText) {
    const io = setupIO(pyodide, inputText);
    const globals = pyodide.globals.get('dict')();
    try {
      const wrapped = 'exec(compile(' + JSON.stringify(code) + ", '<pygo>', 'exec'))";
      pyodide.runPython(wrapped, { globals });
      return { ok: true, stdout: io.out(), stderr: io.err(), truncated: io.truncated };
    } catch (e) {
      const msg = (e && e.message) || String(e);
      const parsed = parseTraceback(msg, code);
      const zh = translateError(parsed.errorType, parsed.errorMsg, code);
      return {
        ok: false, stdout: io.out(), stderr: io.err(), truncated: io.truncated,
        error: msg, errorType: parsed.errorType, errorMsg: parsed.errorMsg,
        errorLine: parsed.errorLine, snippet: parsed.snippet, frames: parsed.frames,
        errorZh: zh
      };
    }
  }

  // 多测试用例执行：每个用例独立运行（fresh globals），全部通过才 ok
  function executeAll(pyodide, code, testcases, opts) {
    opts = opts || {};
    const tcs = Array.isArray(testcases) ? testcases : [];
    if (tcs.length === 0) {
      // 无 testcases：单次运行，若给了 expected 则比对
      const r = runCodeOnce(pyodide, code, opts.stdin != null ? opts.stdin : '');
      if (!r.ok) {
        return {
          ok: false, stdout: r.stdout, error: r.error, errorType: r.errorType,
          errorLine: r.errorLine, errorZh: r.errorZh, snippet: r.snippet,
          feedback: errorFeedback(r), passedCount: 0, totalCount: 1,
          testcaseResults: [{ ...r, passed: false }]
        };
      }
      const passed = opts.expected != null ? outputMatches(r.stdout, opts.expected) : true;
      return {
        ok: passed, stdout: r.stdout, error: null, errorLine: null, errorZh: null,
        feedback: passed ? '运行成功 ✅' : diffHint(r.stdout, opts.expected),
        passedCount: passed ? 1 : 0, totalCount: 1,
        testcaseResults: [{ ...r, passed, expected: opts.expected, diff: passed ? '' : diffHint(r.stdout, opts.expected) }]
      };
    }
    const results = tcs.map((tc) => {
      const r = runCodeOnce(pyodide, code, tc && tc.input != null ? tc.input : '');
      if (!r.ok) return { ...r, tc, passed: false };
      const passed = tc && tc.expected != null ? outputMatches(r.stdout, tc.expected) : true;
      return { ...r, tc, passed, diff: passed ? '' : diffHint(r.stdout, tc.expected) };
    });
    const passedCount = results.filter(x => x.passed).length;
    const totalCount = results.length;
    const allPassed = passedCount === totalCount;
    const firstFail = results.find(x => !x.passed);
    const last = results[results.length - 1];
    return {
      ok: allPassed,
      stdout: last.stdout, stderr: last.stderr,
      error: firstFail && !firstFail.ok ? firstFail.error : null,
      errorType: firstFail && !firstFail.ok ? firstFail.errorType : null,
      errorLine: firstFail && !firstFail.ok ? firstFail.errorLine : null,
      errorZh: firstFail && !firstFail.ok ? firstFail.errorZh : null,
      snippet: firstFail && !firstFail.ok ? firstFail.snippet : null,
      feedback: allPassed
        ? '全部 ' + totalCount + ' 个测试用例通过 ✅'
        : (firstFail && !firstFail.ok ? errorFeedback(firstFail)
           : '第 ' + (results.findIndex(x => !x.passed) + 1) + ' 个测试用例未通过：' + (firstFail ? firstFail.diff : '')),
      passedCount, totalCount,
      testcaseResults: results,
      truncated: results.some(x => x.truncated)
    };
  }

  function errorFeedback(r) {
    const zh = r.errorZh;
    if (!zh) return '运行出错：' + (r.errorMsg || r.error || '');
    const where = r.errorLine != null ? '（第 ' + r.errorLine + ' 行）' : '';
    return zh.title + where + '：' + zh.summary;
  }

  // ---------- 非编程题判定 ----------
  function check(question, payload) {
    const q = question || {};
    const type = q.type;
    const explain = q.explain || '';
    const baseHint = q.hint || null;

    const trapHint = (payload) => {
      if (Array.isArray(q.traps)) {
        const t = q.traps.find(x => x.opt === payload || x.wrong === payload);
        if (t && t.why) return t.why;
      }
      return baseHint;
    };

    switch (type) {
      case 'choice': {
        const correct = payload === q.answer || (Array.isArray(q.answer) && q.answer.includes(payload));
        return {
          correct,
          feedback: correct ? '答对啦！' + explain : '',
          hint: correct ? null : trapHint(payload),
          correctAnswer: Array.isArray(q.answer) ? q.answer[0] : q.answer
        };
      }
      case 'judge': {
        const correct = Boolean(payload) === Boolean(q.answer);
        return {
          correct,
          feedback: correct ? '答对啦！' + explain : '',
          hint: correct ? null : (baseHint || '再想想判断的依据'),
          correctAnswer: Boolean(q.answer)
        };
      }
      case 'fill': {
        const ok = matchAny(String(payload == null ? '' : payload), q.answer);
        return {
          correct: ok,
          feedback: ok ? '答对啦！' + explain : '',
          hint: ok ? null : trapHint(String(payload == null ? '' : payload)),
          correctAnswer: Array.isArray(q.answer) ? q.answer[0] : q.answer
        };
      }
      case 'pair': {
        // answer: [[左下标, 右下标], ...] 或 {左下标: 右下标}
        const ansPairs = (Array.isArray(q.answer) ? q.answer : Object.entries(q.answer || {}).map(([l, r]) => [+l, r]))
          .map(p => [p[0], p[1]]);
        const pl = Array.isArray(payload) ? payload.map(p => Array.isArray(p) ? [p[0], p[1]] : [p.left, p.right]) : [];
        const norm = (pairs) => pairs.map(p => p[0] + '|' + p[1]).sort().join(',');
        const correct = norm(pl) === norm(ansPairs);
        return {
          correct,
          feedback: correct ? '答对啦！' + explain : '',
          hint: correct ? null : (baseHint || '配对不完整或配错了，再检查一下')
        };
      }
      case 'sort': {
        let correct = Array.isArray(payload) && Array.isArray(q.answer) &&
          payload.length === q.answer.length && payload.every((v, i) => v === q.answer[i]);
        // 等价排列支持：equivalentGroups = [[位置a, 位置b], ...]。
        // 注意：位置是 answer 数组（正确顺序下标序列）的索引，不是 lines 的下标！
        // 例：answer=[3,0,2,1,4,5,6], [[0,1]] 表示 answer[0]=3 与 answer[1]=0 可互换（即 lines 中 x=5 与 y=10 两行），
        // 学员提交 [0,3,2,1,4,5,6] 也算对。组内位置互不依赖（谁先谁后结果相同）。
        if (!correct && Array.isArray(q.equivalentGroups) && Array.isArray(payload) && Array.isArray(q.answer) &&
            payload.length === q.answer.length) {
          const groups = q.equivalentGroups;
          const inGroup = new Array(q.answer.length).fill(false);
          let valid = true;
          for (const g of groups) {
            if (!Array.isArray(g) || g.length < 2) { valid = false; break; }
            for (const p of g) {
              if (typeof p !== 'number' || p < 0 || p >= q.answer.length || inGroup[p]) { valid = false; break; }
              inGroup[p] = true;
            }
            if (!valid) break;
          }
          if (valid) {
            const norm = (arr, positions) => JSON.stringify(
              positions.map(p => arr[p]).sort((a, b) =>
                typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b)))
            );
            valid = groups.every(g => norm(q.answer, g) === norm(payload, g)) &&
              q.answer.every((v, i) => inGroup[i] || payload[i] === v);
          }
          correct = valid;
        }
        return {
          correct,
          feedback: correct ? '答对啦！' + explain : '',
          hint: correct ? null : (baseHint || '顺序不对，再排一下')
        };
      }
      case 'think': {
        // 思考题：无对错，展示解析即可
        return { correct: true, feedback: explain || '思考题：想清楚后点「下一题」继续', hint: null };
      }
      default:
        return { correct: false, feedback: '未知题型：' + type, hint: null };
    }
  }

export {
  SYNONYMS, matchAnswer, matchAny, normalizeOutput, outputMatches, diffHint,
  parseTraceback, translateError, ZH_ERRORS, runCodeOnce, executeAll, errorFeedback,
  check
};
export default {
  SYNONYMS, matchAnswer, matchAny, normalizeOutput, outputMatches, diffHint,
  parseTraceback, translateError, ZH_ERRORS, runCodeOnce, executeAll, errorFeedback,
  check
};
