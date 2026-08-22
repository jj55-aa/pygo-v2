# 抓取实战——蜘蛛峡谷的收网时刻

## 🕸️ 爬虫四步走：织网→收网→拆解→入库

蜘蛛峡谷里的猎手从不乱扑：先**织网**，等猎物撞进来，再**收网**拖回，最后慢慢**拆解享用**。爬虫抓数据也是同一条流水线，**四步一个都不能少**：

| 步骤 | 蜘蛛比喻 | 代码动作 |
| --- | --- | --- |
| ① 发请求 | 织网（把网撒向目标） | `requests.get(url)`（概念；本环境无网络，用题目给的 HTML 代替） |
| ② 拿响应 | 收网（猎物撞进网里） | 拿到网页源码字符串（真实环境是 `response.text`） |
| ③ 解析 | 拆解（把猎物从网里解出来） | 正则按标签形状把内容捞出来（`re.findall`） |
| ④ 提取数据 | 入库（整理进仓库） | 清洗、统计、打印 / 保存 |

看一遍完整流程——注意：本判题环境（Pyodide）**没有 requests、也没有网络**，所以第 ① 步在练习里是"题目直接给你一段 HTML"来模拟响应：

```python
import re

# ① 发请求：真实爬虫用 requests.get(url)——本环境无网络，改用「题目给定的 HTML」模拟响应
# ② 拿响应：html 就是服务器返回的网页源码字符串
html = """<p class="title">流浪地球</p>
<p class="title">星际穿越</p>
<p class="title">大闹天竺</p>"""

# ③ 解析：用正则按 <p class="title">…</p> 的形状把片名全捞出来
titles = re.findall(r'<p class="title">(.*?)</p>', html)

# ④ 提取数据：遍历打印 + 统计
for t in titles:
    print(t)
print("共%d部电影" % len(titles))
```

> ⚠️ 新手最容易踩的坑：
> 1. **四步顺序不能乱**：没发请求就没有响应；没拿到响应就谈不上解析；解析出来的原始数据不清洗就直接用，全是脏数据。
> 2. 判题环境**没有 requests、没有网络**：完整流程当概念记牢，练习时别写 `import requests`（会 ModuleNotFoundError），直接用给定 HTML + 正则。

## 🧾 解析表格：<tr> / <td> 的结构

网页里的表格就像峡谷情报站的陈列架：整张表是 `<table>`，**一行**是 `<tr>`（table row），**一格**是 `<td>`（table data）。层层嵌套：

```
<table>            ← 整张表
  <tr>             ← 一行
    <td>片名</td>   ← 一个单元格
    <td>评分</td>
  </tr>
</table>
```

解析表格 = **从外到内逐层拆**：先用 `re.findall(r"<tr>(.*?)</tr>", html)` 把每一行捞出来，再对每一行用 `re.findall(r"<td>(.*?)</td>", row)` 拆出所有单元格。`.*?` 是**惰性匹配**（精准停在最近的结束标签），`(.*?)` 分组只留下标签里的内容：

```python
import re

html = """<table>
<tr><td>流浪地球</td><td>8.5</td></tr>
<tr><td>星际穿越</td><td>9.4</td></tr>
</table>"""

rows = re.findall(r"<tr>(.*?)</tr>", html)   # 先拆行
for row in rows:
    cells = re.findall(r"<td>(.*?)</td>", row)  # 再拆单元格
    print(cells)                                # ['流浪地球', '8.5'] / ['星际穿越', '9.4']
```

> ⚠️ 新手最容易踩的坑：
> 1. 正则里的标签要和题目 HTML **完全一致**：`<td>` 不是 `<TD>`，`class="title"` 的引号别丢，大小写引号错一个就匹配不到。
> 2. 别写**贪婪的 `.*`**：`r"<td>(.*)</td>"` 会把两个单元格之间的 `</td><td>` 也吞进去，一次吃掉一长串。
> 3. 拆完 `<tr>` 还要拆 `<td>`：只按 `<tr>` 拆，拿到的还是一整行字符串，不是一个个单元格。

## 🧹 提取与清洗：正则 + strip

从网上捞回来的数据，像刚从河里拖上来的鱼：身上裹着泥——标签缝隙里的空白、字符串形式的数字。**入库前必须清洗**：

- `strip()`：去掉字符串**首尾**的空白（空格 / 换行 / 制表符）
- `float("8.5")`：把评分字符串转成**数字**，才能比较大小、算平均
- 统计套路：`count += 1` 计数、`total += score` 求和、`total / count` 求平均

```python
import re

html = """<table>
<tr><td>流浪地球</td><td>8.5</td></tr>
<tr><td>星际穿越</td><td>9.4</td></tr>
<tr><td>大闹天竺</td><td>3.7</td></tr>
</table>"""

rows = re.findall(r"<tr>(.*?)</tr>", html)
high = []
for row in rows:
    cells = re.findall(r"<td>(.*?)</td>", row)
    title = cells[0].strip()           # 清洗①：片名去首尾空白
    score = float(cells[1].strip())    # 清洗②：评分转成数字
    print(title, score)
    if score >= 8.0:                   # 统计：挑出高分片
        high.append(title)

print("高分电影", len(high), "部：", high)
```

> ⚠️ 新手最容易踩的坑：
> 1. 正则捞出来的**全是字符串**：`'8.5'` 不是数字 8.5，直接相加会拼成字符串，直接比大小会得出错误结论——先 `float()` 转换。
> 2. `strip()` 只去**首尾**空白，中间的空格不管；顺序是"先 strip 再转数字"，别把带空白的 `' 8.5 '` 直接 float（会报错）。
> 3. 平均分用真除法 `total / count`；`count` 为 0 时直接除会 **ZeroDivisionError**，先判断再除。

## 💾 存储与收尾：存 CSV / JSON（+ 判题环境怎么"入库"）

抓到的数据不能看一眼就扔——要**入库保存**。两种最通用的"仓库"：

- **CSV**：逗号分隔的表格文件，Excel 直接打开，`csv.writer` 一行一行写
- **JSON**：字典 / 列表转成的通用文本，`json.dumps(数据, ensure_ascii=False)` 转成字符串，任何程序都能读

判题环境是浏览器里的 Python（Pyodide）：**写本地文件既看不见、也没法判题**，所以练习里用 `io.StringIO()` **模拟文件**，或直接用 `print` 把"入库结果"打印出来——判题就比对打印内容：

```python
import csv
import io
import json

movies = [["流浪地球", 8.5], ["星际穿越", 9.4]]

# ① CSV：逗号分隔的表格文件（Excel 能直接打开）
buf = io.StringIO()           # StringIO 模拟一个文件
w = csv.writer(buf)
w.writerow(["片名", "评分"])    # 表头
for m in movies:
    w.writerow(m)
print("CSV 内容：")
print(buf.getvalue())

# ② JSON：字典/列表转成的通用文本格式
data = [{"片名": "流浪地球", "评分": 8.5}, {"片名": "星际穿越", "评分": 9.4}]
print("JSON：", json.dumps(data, ensure_ascii=False))
```

> ⚠️ 新手最容易踩的坑：
> 1. 判题环境里别用 `open("movies.csv", "w")` 真写盘：结果既看不到也判不了——统一用 `StringIO` 模拟 + `print` 输出。
> 2. `json.dumps` 默认会把中文转成 `\uXXXX` 乱码，**必须加 `ensure_ascii=False`** 才能看到中文片名。
> 3. `csv.writer` 的 `writerow` 一次写**一行列表**，别把整张表当一个字符串塞进去；先写表头再逐行写数据。
