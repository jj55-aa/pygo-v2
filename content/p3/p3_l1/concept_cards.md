# 读取与清洗——数据工坊的开门第一课

## 📋 数据工坊的原料：表格数据长什么样

你走进「数据工坊」，传送带上堆着一堆 Excel 报表。工头老王把一张表拍在桌上：「要处理数据，先得**看懂表格**——这就是我们的原料。」

表格数据就长这样——**行 × 列**的二维结构：

| 商品 | 价格 |
| --- | --- |
| 苹果 | 5 |
| 香蕉 | 10 |
| 橘子 | 3 |

- **第一行是表头（列名/字段名）**：告诉每一列装的是什么——「商品」列装商品名，「价格」列装价格
- **一行 = 一条记录**：一个商品的全部信息（苹果、5 元）——数据的最小单元
- **一列 = 一个字段**：所有商品的价格都排在同一列——方便整列一起统计（求和、比大小）

记住这个比喻：表格就像**填好的点名册**——每一行是一个同学（一条记录），每一列是一种信息（一个字段），最上面一行写的是「学号、姓名、成绩」（表头）。

```python
# 用 Python 的列表模拟这张表格：
# 表头 + 3 条记录
table = [
    ["商品", "价格"],   # 表头：字段名
    ["苹果", "5"],      # 一条记录
    ["香蕉", "10"],     # 一条记录
    ["橘子", "3"],      # 一条记录
]
print("行数（含表头）：", len(table))
print("第一条记录：", table[1])
```

> ⚠️ 新手最容易踩的坑：
> 1. **别把表头当数据**：表头是字段名，不是记录。统计商品条数时把表头数进去，结果就多 1。
> 2. **表格里看着是数字，Python 读到的是字符串**：`"5"` 和 `5` 不是一回事——`"5" + 1` 会报错，统计前要转数字（第 3 张卡教你）。

## 🚪 进料口：用 csv + StringIO 读取表格

Excel 文件在电脑里没法直接「读文本」，但它有个亲民的小弟——**CSV**（Comma-Separated Values，逗号分隔值）：把表格存成纯文本，一行一条记录，字段之间用逗号隔开。上面的销售表存成 csv 就是：

```
商品,价格
苹果,5
香蕉,10
橘子,3
```

Python 的 `csv` 模块是数据工坊的**进料口**：`csv.reader(文件对象)` 像传送带一样，把文本一行行送进来，每行变成一个列表 `["商品", "价格"]`、`["苹果", "5"]`。

但判题环境里**没有真正的 Excel 文件**，怎么办？用 `io.StringIO`——它能把一段字符串**伪装成文件对象**，喂给 `csv.reader`：

```python
import csv
from io import StringIO

# 判题环境（Pyodide）没有 pandas/openpyxl、也没有真实 Excel 文件，
# 所以用「csv 文本 + StringIO」模拟读取表格：
text = """商品,价格
苹果, 5
香蕉, 10"""
reader = csv.reader(StringIO(text))
for row in reader:
    print(row)   # ['商品', '价格'] / ['苹果', ' 5'] / ['香蕉', ' 10']
```

> ⚠️ 新手最容易踩的坑：
> 1. **`csv.reader` 要的是「文件对象」，不是字符串**：直接把字符串丢进去会报错——先用 `StringIO(文本)` 包一层。
> 2. **读出来的每个字段都是字符串**：`"5"` 还是字符串，要统计必须转数字；而且字段可能带着多余空格（上面 `" 5"`），清洗时一起处理。

## 🧹 清洗三板斧：strip / 跳过空行 / 转数字

原料进了车间，先别急着算——老王盯着纸条直皱眉：「这些数据脏得很，带空格的、夹空行的，不洗干净算出来的全是错的！」清洗是数据分析的**第一步**，三板斧记牢：

**① `strip()` 去首尾空白**：字符串方法，剥掉两头的空格、换行、Tab——`"  苹果  ".strip()` → `"苹果"`（只动两端，中间不动）

**② 跳过空行**：空行（还有全空白行）不是数据，直接 `continue` 绕过去——注意**先 strip 再判断**：`line = line.strip()`，然后 `if line == '': continue`

**③ `int()` / `float()` 转数字**：把数字字符串变成真数字——`int("5")` → `5`，`float("5.5")` → `5.5`；转不动会抛 `ValueError`

```python
import sys

# 车间送来一行行原料：可能带空格、可能有空行
lines = sys.stdin.read().split('\n')

total = 0
for line in lines:
    line = line.strip()          # ① 去首尾空白
    if line == '':               # ② 跳过空行（含全空白行）
        continue
    parts = line.split(',')      # 拆成 [商品, 价格]
    price = parts[1].strip()     # ③ 清洗价格字段
    total += int(price)          #    再转成整数累加
print("总价：", total)
```

> ⚠️ 新手最容易踩的坑：
> 1. **先 strip 再判断空行**：全空白的行（`"  "`）不 strip 的话 `== ''` 是 False，会被当成数据混进来。
> 2. **脏数据要先洗干净再转数字**：`int(" 5")` 能过（int 会忽略首尾空白），但 `int("5 元")`、`int("")` 会抛 `ValueError`——规则：**strip → 判空 → 转数字**，顺序别乱。

## 🐼 pandas 认识一下：装表格的库

工头老王卖了个关子：「你说的这些，工坊隔壁有台『神器』——装进来就是整张表，按列统计一行搞定。它叫 pandas。」**pandas** 是 Python 最流行的数据分析库，它的核心是 **DataFrame**——一个「聪明的二维表格」：自带列名，行是记录、列是字段，和 Excel 表格一一对应。

真实项目里（电脑上装了 pandas），读 Excel 报表只要三行：

```python
# ① 真实项目：电脑上装好 pandas 后这样读 Excel（本课判题环境没有 pandas）
# import pandas as pd
# df = pd.read_excel("销售报表.xlsx")   # 整张表装进 DataFrame
# print(df["价格"].sum())               # 一列求和，一行搞定

# ② 本课判题环境（Pyodide）：没有 pandas / openpyxl，用 csv + StringIO 模拟
import csv
import sys
from io import StringIO

text = sys.stdin.read()
for row in csv.reader(StringIO(text)):
    if row and row[0].strip():
        print(row)
```

**为什么本课用 csv 模拟？** 判题环境（Pyodide）里 `import pandas` 会直接报 `ModuleNotFoundError`。所以：pandas 的**概念**（DataFrame、read_excel、按列统计）先记牢；练习统一用 **csv + StringIO** 把「读取 + 清洗」的手感练出来——把 csv 玩熟了，以后换 pandas 就是换个「进料口」的事。

> ⚠️ 新手最容易踩的坑：
> 1. **判题环境 import pandas 会报错**：别在练习代码里写 `import pandas as pd`——用 csv + StringIO 模拟。
> 2. **pandas 不是本课的判题重点**：DataFrame 概念认识即可；本课的实操是「读多行文本 → 逐行清洗 → 转数字统计」，这套基本功 pandas 也离不开。
