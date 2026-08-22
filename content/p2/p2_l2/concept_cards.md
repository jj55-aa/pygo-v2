# 提取与统计——把网里的电影数据捞出来算一算

## 🎬 一行数据拆两样：同时提取片名和评分

影评峡谷的站长把电影榜 HTML 拍在桌上：「网撒出去了，货也到手了——可这密密麻麻的标签里，一部电影的**片名**和**评分**到底藏哪儿？」你凑近一看：每部电影是一个 `<div class="movie">` 卡片，卡片上**同时印着片名和评分两样信息**：

> `<div class="movie"><span class="title">肖申克的救赎</span><span class="rating">9.7</span></div>`

一部电影 = 一行数据 = 两个字段。把两样**同时**捞出来，有两套套路，任选其一：

- **套路 A：两个 findall 各取各的**——用两个正则分别抓片名、抓评分，得到两个列表。**两个列表按下标一一对应**：第 i 个片名 ↔ 第 i 个评分。
- **套路 B：遍历行**——先用一个 findall 把每部电影的卡片内容（`(.*?)` 分组）拆出来，再对每一部用 re.search 分别提片名和评分。

```python
import re
import sys

html = sys.stdin.read()   # 一次读入多行 HTML

# 套路 A：两个 findall，列表按下标一一对应
titles  = re.findall(r'<span class="title">(.*?)</span>', html)
ratings = re.findall(r'<span class="rating">(.*?)</span>', html)
print(titles[0], ratings[0])   # 第 0 部：肖申克的救赎 9.7

# 套路 B：先拆出每部电影，再分别 search
movies = re.findall(r'<div class="movie">(.*?)</div>', html)
m = movies[0]
t = re.search(r'<span class="title">(.*?)</span>', m).group(1)
s = re.search(r'<span class="rating">(.*?)</span>', m).group(1)
print(t, s)                     # 肖申克的救赎 9.7
```

> ⚠️ 新手最容易踩的坑：
> 1. **两个 findall 的顺序和数量必须一致**——都按 HTML 出现顺序提取，第 i 个片名才配得上第 i 个评分；只要有一部电影缺字段，两个列表就对不上号。
> 2. 正则要和 HTML **一字不差**：class 名（title/rating）、引号、标签大小写，错一个字符就匹配不到——`<span class="score">` 永远抓不到 `rating`。
> 3. `.*` 贪婪会**吞掉整行**（一路吃到最后一个 `</span>`）；提取内容一律用惰性的 `.*?`。

## 🔢 评分转数字：字符串不能比大小、算平均

从 HTML 里提取出来的评分 `'9.7'`，是**字符串**——它是印在标签上的「文字」，不是能计算的「数字」。拿字符串直接干两件事都会翻车：

- `'9.7' + '8.0'` 是**拼接**成 `'9.78.0'`，不是相加；`total += score` 这种「字符串加数字」还会当场 TypeError；
- `'9.7' >= '8.0'` 是按**字典序**逐位比字符：碰巧是 True，但 `'10.0' >= '8.0'` 会判成 False（第 1 位 `'1'` 比 `'8'` 小）——满分大片 10.0 反被当成低分！

所以**统计前必做的一步**：`float()` 把「长得像小数的字符串」变成真正的浮点数；`strip()` 顺手撕掉字符串首尾的空白（空格、换行、Tab）：

```python
rating = ' 9.7 '                # 提取出来可能带着首尾空白
score = float(rating.strip())   # ' 9.7 ' -> '9.7' -> 9.7（真正的数字）
print(score + 0.1)              # 9.8：能算了！
print(score >= 8.0)             # True：能比了！
```

> ⚠️ 新手最容易踩的坑：
> 1. **忘了 float()**：`total += score` 把字符串加进数字直接 TypeError；或 `'9.7' + '8.0'` 悄悄拼成 `'9.78.0'`，账全乱了。
> 2. **用 int() 转评分**：`int('9.7')` 会 ValueError——评分是小数，必须用 `float()`；`int()` 只适合纯整数。
> 3. `float()` 只能转「长得像数字」的字符串，`float('9.7分')` 报 ValueError。**先 strip 去空白、再 float 转数字**，顺序别反。

## 📊 统计大招：计数、筛选、平均分

数据洗干净、转成数字，就到了本课的重头戏——**统计**。就像给一筐鱼记账，一共三招：

- **计数**：计数器 `count = 0` 放在 for 循环**外面**初始化一次，循环里满足条件就 `count += 1`；
- **筛选**：`if score >= 8.0:` 只挑出符合条件的数据处理——8.0 分整也算高分；
- **平均分**：循环里 `total += score` 累加，循环结束后 `avg = total / len(ratings)`，用 `"%.1f"` 保留 1 位小数。

```python
ratings = ['9.7', '9.6', '9.5', '7.9', '9.4']
high = 0        # ① 计数器：循环外初始化
total = 0.0     # ① 累加器：也是循环外
for r in ratings:
    score = float(r.strip())   # 先转数字！
    total += score             # ③ 累加
    if score >= 8.0:           # ② 筛选：>= 8.0 才算高分
        high += 1              # ② 计数
avg = total / len(ratings)     # ③ 平均分
print("高分电影%d部" % high)   # 高分电影4部
print("平均分 %.1f" % avg)     # 平均分 9.2
```

> ⚠️ 新手最容易踩的坑：
> 1. **计数器写在循环里**：每部电影都把 count 清零，数完永远只有 0 或 1——初始化必须在循环外。
> 2. 平均分用浮点除法 `/`：`total // count` 是整除会把小数丢掉；`"%.1f"` 保留 1 位小数，`"%.0f"` 会直接四舍五入成整数。
> 3. 高分边界是 `>= 8.0`，别写成 `> 8.0`——8.0 分整也是高分，写错了会把压线好片漏掉。

## 🧹 数据清洗：把鱼洗干净再记账

网里捞上来的鱼，身上总带着水草泥沙——HTML 里的**首尾空格、换行、空行**就是「水草」。不洗直接记账，账就乱了：片名打印出来带着空格，空行被当成一部「电影」数进总数。

三道清洗工序：

- **strip() 去首尾空白**：`' 肖申克的救赎 '` → `'肖申克的救赎'`；
- **跳过空行**：按行解析时 `if not line: continue`（空字符串就是空行）；
- **连纯空格行一起跳**：`if not line.strip(): continue`（一行全是空格也算「空」）。

```python
import re
import sys

html = sys.stdin.read()             # 电影榜 HTML（多行）

for line in html.split('\n'):       # 一行一行过
    line = line.strip()             # ① 去首尾空白
    if not line:                    # ② 空行 / 纯空白行：跳过
        continue
    if '<div class="movie">' not in line:
        continue                    # ③ 不是电影行的杂行也跳过
    title  = re.search(r'<span class="title">(.*?)</span>', line).group(1).strip()
    rating = re.search(r'<span class="rating">(.*?)</span>', line).group(1).strip()
    print(title, rating)
```

> ⚠️ 新手最容易踩的坑：
> 1. **该 strip 的字段都要 strip**：`float(' 9.7 ')` 碰巧能转（float 自带去空白），但片名不 strip 打印出来就带着空格——片名、评分都要洗。
> 2. **空行不跳**：空行被当成一部「电影」数进 `len()`，总数虚高。
> 3. `strip()` 只去**首尾**空白，去不掉中间的：`'肖申克 的救赎'` 中间的空格会原样保留——那是数据本身，别指望 strip 处理。
