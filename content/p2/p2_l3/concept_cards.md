# 爬虫项目收尾——影评峡谷的结业大考

## 🗺️ 项目全景：一张网撒向多个网页

爬虫就像**撒网捕鱼**：网撒向多片海域（多个网页），把每一网（每一段 HTML）捞到的鱼（电影数据）都倒进同一个鱼篓（一个列表），最后回家统一数一数、挑一挑、排一排。**完整流程 = 读入分段 → 提取 → 清洗 → 统计 → 排序输出 → 异常兜底**，一步都不能少：

| 步骤 | 渔夫比喻 | 代码对应 |
| --- | --- | --- |
| 读入分段 | 把多片海域的鱼网都收回来 | `sys.stdin.read()` + `split("\n\n")` |
| 提取 | 从每条鱼里挑出「片名」和「评分」 | `re.findall(r'<title>(.*?)</title>', seg)` |
| 清洗 | 刮鳞去腥：评分字符串 → 数字 | `float(score[0])` |
| 统计 | 数一数、算平均分 | `sum()` / `len()` |
| 排序输出 | 按评分排好，挑前 3 名展示 | `sorted(..., reverse=True)` + `top[:3]` |
| 异常兜底 | 捞到烂网、空网也不翻船 | try/except + 友好提示 |

```python
import io, re, sys

text = sys.stdin.read()                  # 1. 读入：多段 HTML（模拟多个网页）
segments = text.strip().split("\n\n")    # 2. 分段：每段 = 一个网页

movies = []                              # 3. 合并：所有网页的数据汇进同一个鱼篓
for seg in segments:
    seg = seg.strip()
    if not seg:
        continue
    title = re.findall(r'<title>(.*?)</title>', seg)
    score = re.findall(r'<rating>(.*?)</rating>', seg)
    if title and score:                  # 4. 提取 + 清洗：字段齐了才收
        movies.append([title[0], float(score[0])])

print(len(movies), "部电影")             # 5. 统计/输出：对合并后的数据统一分析
```

> ⚠️ 易错点：多网页的数据要**合并进同一个列表**再统一分析——别每页单独处理、各算各的，那永远凑不成整张榜单。分段用空行（`split("\n\n")`），段内的换行是网页结构的一部分，别把段内换行当成新段。

## 🔍 提取与清洗：两个 findall 同步核对

从 HTML 里取数据，像**从一摞名片里找「名字」和「手机号」**两个字段：名字拿一叠、号码拿一叠，两叠数量对得上才是一张完整名片。`re.findall(正则, 文本)` 返回**所有匹配项组成的列表**；片名和评分要**两个 findall 同步**——各取各的，再核对两边都正好 1 个：

```python
import re

html = """<title>肖申克的救赎</title>
<rating>9.7</rating>"""

title = re.findall(r'<title>(.*?)</title>', html)
score = re.findall(r'<rating>(.*?)</rating>', html)

if len(title) == 1 and len(score) == 1:   # 两个字段同步核对：都正好 1 个
    movie = [title[0], float(score[0])]   # 清洗：评分字符串 → 数字
    print(movie)                          # ['肖申克的救赎', 9.7]
else:
    print("格式错误")                      # 缺字段 / 多字段都算格式错
```

> ⚠️ 易错点：两个 findall 要**分别核对长度**——只查一个（`if title:`）会把「有片名没评分」的坏段也收进来。评分是字符串，排序、算平均分前必须 `float()` 转数字，否则按字典序排——`"10.0"` 会排在 `"9.7"` 后面，榜单直接崩坏。

## 🏆 排序与 Top：sorted 降序 + 切片取前三

发榜单像**贴排行榜**：先把所有成绩按分数排好队，再从队首撕下前 3 张贴上去。`sorted(列表, key=取分函数, reverse=True)` 返回按评分**从高到低**的新列表；取前 3 名用**切片 `top[:3]`**——数据不足 3 条也不会崩，有多少取多少：

```python
movies = [["千与千寻", 9.4], ["肖申克的救赎", 9.7], ["霸王别姬", 9.6], ["阿甘正传", 9.5]]

top = sorted(movies, key=lambda m: m[1], reverse=True)   # 按评分降序
for m in top[:3]:                                        # 切片：前 3 名
    print(m[0], m[1])
# 输出：
# 肖申克的救赎 9.7
# 霸王别姬 9.6
# 阿甘正传 9.5
```

> ⚠️ 易错点：不写 `key`，sorted 就按整个列表比（先比片名），不是按评分——**key=lambda m: m[1] 是必写项**。评分还是字符串时，`reverse=True` 排的是字典序，照样错；切片 `[:3]` 越少越安全：只有 2 条数据也只打印 2 条，绝不越界报错。

## 🛡️ 异常兜底：格式错、空数据都不崩

收银台结账遇到**扫不出条码的商品**：不会让整个柜台停摆，而是单独提示一声、跳过这件，继续结下一件。爬虫也一样——坏段（缺片名 / 缺评分 / 评分不是数字）用 try/except 接住，打印「格式错误」后跳过；所有段都处理完，一条有效数据都没有，再打印「没有数据」：

```python
import io, re, sys

text = sys.stdin.read()
segments = text.strip().split("\n\n")

movies = []
for seg in segments:
    seg = seg.strip()
    if not seg:
        continue
    title = re.findall(r'<title>(.*?)</title>', seg)
    score = re.findall(r'<rating>(.*?)</rating>', seg)
    try:
        movies.append([title[0], float(score[0])])   # 可能 IndexError / ValueError
    except (IndexError, ValueError):
        print("格式错误")        # 坏段：提示 + 跳过，程序不崩

if not movies:
    print("没有数据")            # 空数据兜底：处理完所有段之后再检查
```

> ⚠️ 易错点：**空数据检查必须放在所有段处理完之后**（看收集到的 `movies` 是否为空），而不是开头看一眼输入就下结论——后面可能还有好段没处理呢。「格式错误」要在循环里逐段 try/except 接住，别让一个坏段拖垮整个程序。
