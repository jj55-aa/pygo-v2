# Excel 读写——让车间报表自动化

## 🗂️ Excel 三件套：工作簿、工作表、单元格

车间资料柜里立着三层大书架：最上面一层是整本《车间台账》（一个 `.xlsx` 文件），中间一层是台账的每一页纸（左下角的 Sheet1、Sheet2……），最下面一层是页面上一个个写满字的小格子。这套"书架—书页—格子"的结构，就是 Excel 的"三件套"：

- **工作簿（Workbook）**：整个 `.xlsx` 文件，就像一本《车间台账》——一个文件就是一本"书"
- **工作表（Worksheet）**：书里的每一页，一个文件可以有好几页（Sheet1、Sheet2、Sheet3……）
- **单元格（Cell）**：页面上的一个小格子，用**坐标**定位：列是字母 A、B、C……，行是数字 1、2、3……

一个格子的坐标就是"**列字母 + 行数字**"：**A1** = 第一列（A）第一行（1）——**先看列、再看行**。

判题环境里没有 Excel，我们用**列表模拟**一张工作表来理解坐标：每个小列表 = 一行，`ws[行-1][列-1]` 就相当于 Excel 的坐标：

```python
# 用列表模拟一张"工作表"：每个小列表 = 一行
ws = [
    ["姓名", "工资"],        # 第 1 行
    ["小明", 5000],         # 第 2 行
    ["小红", 6000],         # 第 3 行
]
print(ws[1][0])   # 第 2 行第 1 列 → 相当于 Excel 的 A2 → 小明
print(ws[2][1])   # 第 3 行第 2 列 → 相当于 Excel 的 B3 → 6000
```

> ⚠️ 新手最容易踩的坑：
> 1. **坐标先列后行**：A1 是 A 列第 1 行，不是"第 A 行"——列是字母、行是数字，顺序别搞反。
> 2. **行列从 1 开始**：Excel 没有"第 0 行"。用列表模拟时记得减 1：`ws[行-1][列-1]`。
> 3. **没填过的格子是空的**：Excel 里空格子的值是 None（空），做运算前记得先判断。

## 📖 用 openpyxl 读 Excel：三步翻开台账

Python 读 Excel 最常用的库是 **openpyxl**——注意它是**第三方库**，不是标准库，得先 `pip install openpyxl` 装上才能 `import`。读一份报表就三步：**打开工作簿 → 拿工作表 → 取单元格**。

```python
import openpyxl   # 真实环境示例：需先 pip install openpyxl（本课练习环境没有）

wb = openpyxl.load_workbook("工资表.xlsx")   # 1. 打开工作簿（.xlsx 文件）
ws = wb.active                               # 2. 拿到默认的工作表（有几张表还能 wb["工资表"] 按名字取）

print(ws["A1"].value)        # 3. 按坐标取单元格的值（A1 = 第一列第一行）
print(ws.cell(1, 2).value)   #    或按行列数字取：第 1 行第 2 列 = B1
for row in ws.iter_rows(values_only=True):   #    想整表遍历？一次拿一整行
    print(row)
```

- `load_workbook("工资表.xlsx")`：打开已有文件，返回**工作簿对象** `wb`
- `wb.active`：拿当前默认的工作表；`ws["A1"].value` 取格子的值
- `iter_rows(values_only=True)`：整表逐行遍历，每行直接是**值**的元组 `('小明', 5000)`——不加 `values_only=True`，拿到的是一堆单元格对象，还得一个个 `.value`

> ⚠️ 新手最容易踩的坑：
> 1. **没装 openpyxl 就 import → ModuleNotFoundError**！先 `pip install openpyxl`，装不上就先检查 pip 环境。
> 2. **`ws["A1"]` 是单元格对象，不是值**：想拿里面的数据必须加 `.value`，不然打印出来是一堆 `Cell A1` 之类的东西。
> 3. **公式单元格**：表里写的是 `=SUM(B2:B10)` 这种公式时，默认读出来是公式字符串；想读结果要 `load_workbook(..., data_only=True)`，而且文件得先被 Excel 打开保存过一次。

## ✍️ 用 openpyxl 写 Excel：三步行成新报表

光会读不算本事，车间要的是**生成报表**。用 openpyxl 新建一张表也是三步：**建工作簿 → 填数据 → 保存**。

```python
import openpyxl   # 真实环境示例：需先 pip install openpyxl（本课练习环境没有）

wb = openpyxl.Workbook()      # 1. 新建一个空白工作簿
ws = wb.active                #    拿到默认的工作表
ws.title = "工资表"            #    给工作表起个名字

ws["A1"] = "姓名"             # 2. 往格子里填数据：坐标 A1 = 第一列第一行
ws["B1"] = "工资"
ws.append(["小明", 5000])     #    或一次加一整行，自动排到表格最后一行下面
ws.append(["小红", 6000])

wb.save("工资表.xlsx")         # 3. 保存！不保存，前面全白干
```

- `Workbook()` 新建空白工作簿，`ws.active` 拿默认工作表
- `ws["A1"] = "姓名"` 按坐标填单个格子；**`ws.append([...])` 一次加一整行**，像排队上车，自动追加到末尾——要生成几十上百行数据时，配循环无敌
- `wb.save("文件名.xlsx")` 是**重中之重**：openpyxl 的一切操作都发生在内存里，不 save，磁盘上的文件纹丝不动

> ⚠️ 新手最容易踩的坑：
> 1. **忘了 `save()`，一切白干**：填了半天数据，文件没变化。写代码先写 save，再回头填数据。
> 2. **`append` 永远追加在最后一行下面**：表格里已有表头就别再 append 一个表头，不然表头重复。
> 3. **覆盖保存会盖掉原文件**：改错就没救了——先复制一份备份，或另存成新文件名。

## ⚖️ CSV vs Excel 怎么选？判题环境用 csv 模拟

真实车间里，报表该用 CSV 还是 Excel？记住这句口诀：**简单通用用 CSV，好看好用用 Excel**。

| 需求 | 选谁 | 为什么 |
| --- | --- | --- |
| 给程序用、要通用、要轻量 | **CSV** | 纯文本，任何软件任何语言都能读 |
| 给人看、要颜色/公式/多张表 | **Excel** | `.xlsx` 里有样式、公式、多工作表 |
| 只是统计几列数据（人数、合计） | **CSV 就够** | 数据一样算，还不用装 openpyxl |

本课的判题环境（Pyodide）**没有 openpyxl**——所以练习都用 **csv + io.StringIO** 来模拟"Excel 报表"：每一行是一条记录，逗号分隔各列，跟 Excel 里一行行数据一一对应：

```python
import csv
import io

# 用 csv + io.StringIO 模拟一张"Excel 报表"：第 1 行是表头
text = "姓名,工资\n小明,5000\n小红,6000"
rows = list(csv.reader(io.StringIO(text)))

print(rows[0])                # 表头：['姓名', '工资']
print(rows[1][0], rows[1][1]) # 第 2 行：小明 5000
print("人数：", len(rows) - 1) # 减掉表头，就是 2 人
```

> ⚠️ 新手最容易踩的坑：
> 1. **判题环境没有 openpyxl**：code 题里别 `import openpyxl`，会报 ModuleNotFoundError——练习一律用 csv + io.StringIO 模拟表格。
> 2. **csv 读出来全是字符串**：`'5000'` 不是数字 5000！统计工资前先 `int()` / `float()` 转一下。
> 3. **别拿 CSV 存样式**：CSV 只有数据没有格式；要颜色/公式/多张表时，才轮到真实环境里的 openpyxl 上场。
