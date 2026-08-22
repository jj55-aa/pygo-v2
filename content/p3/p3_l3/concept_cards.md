# 独立挑战——数据工坊的结业大考

## 🏭 项目全景：数据工坊的完整流水线

工坊老师傅处理堆成山的部门报表（销售部、技术部、行政部……），从来不下手乱抓，永远走同一条流水线：**读 → 洗 → 分 → 汇**。程序分析一份「部门,姓名,工资」报表，走的也是这四步：

| 步骤 | 工坊比喻 | 代码对应 |
| --- | --- | --- |
| 读 | 把整摞报表搬到工作台 | `csv.reader` + `io.StringIO` 逐行读入 |
| 洗 | 抖掉字段上的灰尘空格、扔掉空行 | `strip()`、跳过空行、`int()` 转数字 |
| 分 | 按部门把条目分进各自的账本格 | 字典 `books[部门]` 分组累加 |
| 汇 | 各账本小计 + 全厂总账 | `sorted(books)` 排序输出、`sum` 算总合计 |

```python
import csv
import io
import sys

text = sys.stdin.read()                # 读：整份报表读进来
data = io.StringIO(text)

books = {}                             # 分组账本：部门 -> [人数, 工资合计]
for row in csv.reader(data):           # 读：逐行读
    if not row:                        # 洗：空行跳过
        continue
    dept = row[0].strip()              # 洗：去掉字段上的空白
    salary = int(row[2].strip())       # 洗：工资字符串转数字
    if dept not in books:              # 分：新部门先开账本
        books[dept] = [0, 0]
    books[dept][0] += 1                # 分：人数 +1
    books[dept][1] += salary           # 分：工资累加

for dept in sorted(books):             # 汇：按部门名排序
    print("%s：%d人，合计%d" % (dept, books[dept][0], books[dept][1]))
```

> ⚠️ 易错点：四步别混着写。**「读」出来的字段全是字符串**，要算工资必须先 `int()` 转数字；**「分」的账本要先开再记**（新部门没初始化就累加会 KeyError）；**「汇」的顺序是排序 → 小计 → 总合计**，想清楚每一步在哪个位置输出。

## 🧹 清洗与分组：抖灰尘、扔空行、开账本

报表是从 Excel 导出来的，字段上常粘着空格、行尾还拖着换行符，有的行干脆是空的。**清洗**就是把这些脏东西处理掉，让数据干净可算：

- **去空白**：`row[0].strip()`——字段两端空格、`\n` 全去掉。脏的 `"销售 "` 和干净的 `"销售"` 才能归到同一个组。
- **扔空行**：`if not row: continue`——csv 读到的空行是一个空列表 `[]`，直接跳过。
- **转数字**：`int(row[2].strip())`——工资是字符串 `"5000"`，转成数字才能相加。

**分组账本**：用字典把条目按部门归堆——键是部门名，值是账本 `[人数, 工资合计]`：

```python
books = {}                            # 空账本
for row in csv.reader(data):
    if not row:
        continue
    dept = row[0].strip()
    salary = int(row[2].strip())
    if dept not in books:             # 第一次见到这个部门 → 开一本新账
        books[dept] = [0, 0]
    books[dept][0] += 1               # 记账：人数 +1
    books[dept][1] += salary          # 记账：工资累加
```

> ⚠️ 易错点：**新部门没开账本就往里记，`books[dept][0] += 1` 会抛 KeyError**——先 `if dept not in books` 初始化成 `[0, 0]` 再累加；工资不 `int()` 就做加法，`"5000" + "6000"` 会变成 `"50006000"`（字符串拼接，不是 11000！）；分组键要用**清洗后的** `dept`，没 strip 的 `"销售"` 和 `"销售 "` 会分进两本账。

## 📊 汇总输出：各账本小计、全厂总账、平均工资

分组统计完，最后一步是把结果**汇成报表**：每个部门的小计 + 全厂的总账。套路三步走：

- **排序**：`for dept in sorted(books)`——`sorted(字典)` 按键（部门名）排好序，输出顺序稳定不乱。
- **小计**：`books[dept]` 里存着 `[人数, 合计]`，直接取出来拼进字符串。
- **总账**：`sum(v[0] for v in books.values())` 把各账本的人数加起来 = 总人数；同理把合计加起来 = 总工资。
- **平均**：部门平均工资 = 合计 ÷ 人数，`"%.1f"` 保留 1 位小数。

```python
for dept in sorted(books):
    n, total = books[dept]           # 拆开账本：n 人数、total 工资合计
    print("%s：%d人，合计%d" % (dept, n, total))

total_people = sum(v[0] for v in books.values())
total_money  = sum(v[1] for v in books.values())
print("总人数%d，总工资%d" % (total_people, total_money))

for dept in sorted(books):
    avg = books[dept][1] / books[dept][0]     # 平均工资 = 合计 ÷ 人数
    print("%s：平均%.1f" % (dept, avg))
```

> ⚠️ 易错点：平均工资要用 `/`（浮点除法）别用 `//`（整除），否则 11000÷2 会输出 `5500` 而不是 `5500.0`；`"%s：%d人，合计%d" % (dept, n, total)` 的**格式占位数要和后面元组里的变量一一对应**，少一个或多一个都会报错；总合计要用 `sum(v[0] for v in books.values())` 统一算，别在循环里手写累加又重复加。

## 🛡️ 异常兜底：格式错别崩，空数据别慌

真实报表永远有意外：某行缺了字段（`"销售,小明"` 只有两列）、工资不是数字（`"abc"`）、引号没闭合……这些都会让程序当场抛异常。u6 学的防御式编程在这派上大用场——**用 try/except 把整个处理包住**，出错就打印人话提示，程序不崩：

- 缺字段 → `row[2]` 越界抛 **IndexError**
- 工资不是数字 → `int("abc")` 抛 **ValueError**
- csv 格式坏（引号没闭合等）→ 抛 **csv.Error**

三种异常用 `except (ValueError, IndexError, csv.Error)` 一起接住，打印「格式错误」。**空数据**是另一类意外：报表里一行都没有，此时账本是空的，要在循环**结束后**检查并打印「没有数据」：

```python
books = {}
try:
    for row in csv.reader(data):
        if not row:
            continue
        dept = row[0].strip()
        salary = int(row[2].strip())
        if dept not in books:
            books[dept] = [0, 0]
        books[dept][0] += 1
        books[dept][1] += salary
    if not books:                        # 循环结束后账本仍空 → 没有数据
        print("没有数据")
    else:
        for dept in sorted(books):
            print("%s：%d人，合计%d" % (dept, books[dept][0], books[dept][1]))
        print("总人数%d，总工资%d" % (sum(v[0] for v in books.values()), sum(v[1] for v in books.values())))
except (ValueError, IndexError, csv.Error):
    print("格式错误")
```

> ⚠️ 易错点：except 要写**具体异常类型** `except (ValueError, IndexError, csv.Error)`，别写裸 `except:` 把别的 bug 也悄悄吞掉；**空数据检查必须放在循环之后**（循环里每行都检查会误判「处理到一半就是空」）；「格式错误」和「没有数据」是两回事——前者是数据坏了，后者是压根没数据，提示语要分开。
