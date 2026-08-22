# 综合实战——自动化车间的结业流水线

## 🏭 自动化流水线：车间里的传送带

车间里最壮观的一条线：原料从一头送上传送带，经过清洗、加工，另一头吐出包装好的成品——这就是**流水线**。办公自动化也是同一条传送带，只不过搬的是**数据**：

**读数据 → 清洗 → 统计 → 输出**（读、洗、算、出）

| 步骤 | 车间比喻 | 代码对应 |
| --- | --- | --- |
| 读数据 | 原料送上传送带 | `sys.stdin.read()` + `io.StringIO` / `csv.reader` |
| 清洗 | 洗掉泥沙、挑出废料 | `strip()`、跳过空行、转数字 |
| 统计 | 测量、计数、称重 | `count += 1` / `total += x` / `avg` |
| 输出 | 打包成品、贴标签 | `print` 生成一句摘要 |

```python
import io
import sys

text = sys.stdin.read()        # ① 读：原料进车间（StringIO 模拟报表文件）
data = io.StringIO(text)

total = 0
count = 0
for line in data:              # 逐行加工
    line = line.strip()        # ② 清洗：去掉首尾空白
    if not line:               #    空行跳过
        continue
    parts = line.split(",")    #    拆出姓名和工时
    total += int(parts[1])     # ③ 统计：工时转数字并累加
    count += 1                 #    人数 +1

print("总工时%d，共%d人" % (total, count))   # ④ 输出：一句摘要
```

> ⚠️ 易错点：四步顺序别乱——数据没读到谈不上清洗，脏数据没洗就统计，算出来的全是错的，结果没算出来谈何输出。另外要分清动作放哪：**统计变量在循环外初始化**，**加工动作在循环内执行**——放反了要么每轮被重置，要么只处理最后一行。

## 📖 读报表与清洗：csv + io 双人组

报表文件就像一摞原料单，怎么把它搬进程序？两个标准库搭档：**`io.StringIO`** 把一整段文本伪装成"文件"，**`csv` 模块**当读卡器，逐行把数据刷出来——**不用装任何第三方库**。

`csv.reader(数据源)` 把每一行按逗号拆成一个**列表**，一个元素就是一列；读出来的**全是字符串**。

```python
import csv
import io

text = "小明,8\n小红,6\n\n小刚,4"      # 注意：中间夹了一个空行
data = io.StringIO(text)

total = 0
for row in csv.reader(data):
    if not row:              # 清洗①：空行读出来是空列表 []，跳过
        continue
    name = row[0]            # 姓名
    hours = int(row[1])      # 清洗②：工时从字符串转数字
    total += hours           # 统计：累加
print("总工时", total)        # 输出：18
```

> ⚠️ 易错点：csv 读出来的**全是字符串**——`'8'` 不是数字 8，直接 `'8' + '6'` 会拼成 `'86'`，转数字前做除法还会抛 TypeError；**空行读出来是空列表 `[]`，不是空白字符串**，跳过判断要用 `if not row`；CSV 字段里万一有逗号（如地址），csv 模块会自动用引号处理——**别自己手拼字符串**，否则字段就裂开了。

## 📊 统计与摘要：数一数、加一加、算平均

统计就是流水线上的测量仪：数有几件（**计数**）、称总重（**求和**）、算平均单重（**平均值**）。三个动作套路一模一样——"循环 + 变量"：

```python
total = 0      # 求和：先归零
count = 0      # 计数：先归零
for h in [8, 6, 4, 10]:
    total += h      # 求和
    count += 1      # 计数
avg = total / count                     # 平均值
print("共%d人，总工时%d，人均%.1f" % (count, total, avg))
# 共4人，总工时28，人均7.0
```

保留小数两种写法：`round(avg, 1)` 返回数字，`"%.1f" % avg` 直接格式化出带 1 位小数的字符串——报表摘要里用后者更方便。

> ⚠️ 易错点：求和/计数变量要**先归零、放循环外面**——放里面每轮都被重置；算平均值前**先判断 count 不为 0**，空数据直接 `total / count` 会 ZeroDivisionError；别把整除 `//` 和除法 `/` 搞混——`7 // 2` 是 3（整数除法），`7 / 2` 才是 3.5。

## 🛡️ 异常兜底与输出：给流水线装保险丝

流水线最怕两件事：**原料是空的**（没活干）和**原料是坏的**（格式错）。给流水线装个保险丝——`try/except`——出问题不炸机器，只亮提示灯，还把结果打包成一句话吐出来（这就是"生成摘要"）：

- **空数据**：统计前判断 `count == 0`，打印「没有数据」
- **格式错**：缺逗号拆不出第 2 个字段 → `IndexError`；工时不是数字 `int()` 转不动 → `ValueError`。用 `except (ValueError, IndexError)` 一起接住，打印「数据格式错误」

```python
import io
import sys

text = sys.stdin.read()
data = io.StringIO(text)
total = 0
count = 0
try:
    for line in data:
        line = line.strip()
        if not line:
            continue
        parts = line.split(",")
        total += int(parts[1])     # 工时不是数字 → ValueError
        count += 1                 # 缺逗号时 parts[1] → IndexError
    if count == 0:                 # 空数据兜底
        print("没有数据")
    else:
        print("总工时%d，人均%.1f" % (total, total / count))
except (ValueError, IndexError):   # 格式错兜底
    print("数据格式错误")
```

> ⚠️ 易错点：except 要写**具体异常类型**，别写裸 `except:`——那会把程序自己的 bug 也悄悄吞掉；空数据判断要放**循环外**（用 count 的最终值），放循环里每行都会被重置判断；缺逗号是 `IndexError`、不是数字是 `ValueError`，两种都要接住。
