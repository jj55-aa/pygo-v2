# 综合项目——蜘蛛峡谷的结业大考

## 🕸️ 爬虫项目全景：从 URL 到数据——情报站的五步流水线

蜘蛛峡谷的情报站站长抓情报，从来不是一步到位：先向目标网页**发请求**（撒网），把 HTML 原始内容拿到手；再从 HTML 里**解析**出想要的数据（收网）；把脏数据**清洗**干净（挑鱼）；数一数、算一算（记账）；最后把结果**输出或存储**（入库）。程序抓数据走的也是同一条流水线，共五步：

**请求 → 解析 → 清洗 → 统计 → 输出/存储**

| 步骤 | 蜘蛛峡谷比喻 | 代码对应 |
| --- | --- | --- |
| 请求 | 撒网：向网页服务器打招呼 | `requests.get(url)`（真实环境）；练习环境没有网络，用给定 HTML 字符串模拟 |
| 解析 | 收网：从 HTML 里捞数据 | `re.search` / `re.findall` 提取标题、链接 |
| 清洗 | 挑鱼：去空白、扔空行 | `strip()` / `if not line: continue` |
| 统计 | 记账：数一数、算一算 | 计数器 `count += 1`、`len()` |
| 输出/存储 | 入库：结果给人看或存起来 | `print()` / 写文件、存 JSON |

```python
import re

# 模拟：情报站收到一个网页的 HTML（练习环境没有网络，用字符串代替响应）
html = '<html><title>峡谷新闻</title><a href="http://g.com/1">一</a><a href="http://g.com/2">二</a></html>'

# 解析：提取标题和所有链接
m = re.search(r"<title>(.*?)</title>", html)      # 标题：峡谷新闻
links = re.findall(r'<a href="(.*?)">', html)     # 链接：['http://g.com/1', 'http://g.com/2']

# 清洗 + 统计：标题去首尾空白、链接数一数
title = m.group(1).strip()
print("标题：", title)                 # 标题： 峡谷新闻
print("链接数：", len(links))          # 链接数： 2
```

> ⚠️ 易错点：五步别跳着写——数据还没到手（请求/给定 HTML）就解析、还没解析就统计，都是空中楼阁；练习环境里没有网络，用字符串模拟网页，学的是「拿到 HTML 之后」那几手本事，真实环境换成 `requests.get(url).text` 就能接上。

## 🎯 解析与提取：正则收网——从 HTML 里捞标题和链接

网撒下去了，该收网了。**正则表达式就是你的「网眼」**：用一段模式把 HTML 里想要的字符精确捞出来，捞上来的是什么全由网眼（模式）决定。

- `re.search(模式, 文本)`：找**第一个**匹配（拿页面标题）
- `re.findall(模式, 文本)`：找**全部**匹配，返回列表（拿所有链接）
- `.*?`：**非贪婪**——匹配到第一个 `>` 就停，不会一口气吞掉后面所有标签
- `re.IGNORECASE`：忽略大小写（`<TITLE>` 也能匹配上）

```python
import re

html = '<a href="http://a.com/1">第一条</a><a href="http://b.com/2">第二条</a>'

# 贪婪 .* 会吞太多：href="http://a.com/1">第一条</a><a href="http://b.com/2"（只匹配出 1 个）
print(re.findall(r'<a href=".*">', html))          # ['<a href="http://a.com/1">第一条</a><a href="http://b.com/2">']

# 非贪婪 .*? 见好就收：每个链接各归各
print(re.findall(r'<a href="(.*?)">', html))       # ['http://a.com/1', 'http://b.com/2']

# 标题：<title> 和 </title> 之间的内容
m = re.search(r"<title>(.*?)</title>", '<title>峡谷新闻</title>')
print(m.group(1))                                  # 峡谷新闻
```

> ⚠️ 易错点：`.*` 贪婪匹配会一路吞到最后一个 `>`，把好几个链接算成 1 个——**提取链接/标题一定要用 `.*?` 非贪婪**；匹配不到时 `re.search` 返回 `None`、`re.findall` 返回空列表 `[]`，都不报错，记得判断 `None` 和 `len()`。

## 🧼 清洗与统计：strip / 去空 / 计数——鱼捞上来先洗再记账

鱼捞上来了，先洗一洗再记账：HTML 一行行读进来，行尾常带着换行符，还可能有整行的空行——不洗直接数，账就乱了。

- `line.strip()`：去掉字符串首尾的空白（空格、`\n`、Tab）
- `if not line: continue`：空行直接跳过
- 计数器：`count = 0` 放循环**外面**，循环里 `count += 1`
- 去重：`list(set(x))` 快但会乱序，要保序用 `dict.fromkeys(x)`

```python
import re

pages = [
    '<title>峡谷新闻</title>\n',   # 行尾带着换行符
    '',                              # 空行
    '<title>峡谷公告</title>',
]
count = 0
for page in pages:
    page = page.strip()          # 清洗：去掉首尾空白
    if not page:                 # 清洗：空行跳过
        continue
    m = re.search(r"<title>(.*?)</title>", page)
    count += 1                   # 统计：标题数 +1
print("标题数", count)            # 标题数 2（空行没被当成数据）
```

> ⚠️ 易错点：计数器要**先归零、放在循环外面**——放里面会被每轮循环重置，数出来永远是 1；`strip()` 处理的是整行，`m.group(1)` 抓出来的标题内容要再 `strip()` 一次，首尾才干净。

## 🛡️ 异常兜底与输出：格式错 / 空数据——坏消息也要报得明明白白

情报站的收音机会收到杂音：网页格式坏了（缺 `<title>`）、或一条数据都没有——程序都不能崩，要给人话提示。这正是 u6 防御式编程的用武之地：

- **格式错**：提取不到标题说明这一页坏了，用 `raise ValueError` **主动抛错**，`except ValueError` 接住打印友好提示
- **空数据**：统计完先判断，`count == 0` 就打印「没有数据」

```python
import re

pages = ['<title>好页</title>', '这页没有标题', '']
count = 0
try:
    for page in pages:
        page = page.strip()
        if not page:                       # 空行跳过
            continue
        m = re.search(r"<title>(.*?)</title>", page)
        if m is None:                      # 格式坏：这一页没有标题
            raise ValueError("页面缺少标题")  # 主动抛错，交给 except 接住
        count += 1
    if count == 0:                         # 空数据兜底：一条都没有
        print("没有数据")
    else:
        print("标题数%d" % count)
except ValueError:
    print("数据格式错误，请检查网页源码")
```

> ⚠️ 易错点：except 要写**具体异常类型**（`except ValueError`），别写裸 `except:` 把代码 bug 也悄悄吞掉；空数据判断要放在「输出统计」**之前**，否则空输入会打印出「标题数0」这种吓人的结果；`raise` 抛出的异常必须有人接——try 和 except 要配套，不然照样崩。
