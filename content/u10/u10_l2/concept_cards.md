# Word 与 PDF——让文档自己动起来

## 📄 Word 文档：一张会排版的纸（.docx 是什么）

**类比**：记事本（.txt）里的文字像流水账，从头写到尾、没有任何格式；而 Word（.docx）文档像车间里排好版的宣传单——有标题、有段落、能加粗、能调字号、能上色。你在 Word 里看到的"排版效果"，正是 .docx 和 .txt 最大的区别。

**定义**：`.docx` 是 Word 文档的格式，它保存的是一串「段落 + 样式」的结构，而不是纯文字。Python 用 **python-docx** 库读写它：新建文档、加标题、加段落、保存，一条龙。

```python
from docx import Document   # 需要 pip install python-docx（导入名是 docx）

doc = Document()                        # 1. 新建空白文档
doc.add_heading("车间周报", level=1)     # 2. 加一级标题
doc.add_paragraph("本周完成了 Word 自动化练习。")  # 加一段正文
doc.save("车间周报.docx")               # 3. 保存！
```

> ⚠️ 易错点：
> 1. **装库的包名和导入名不一样**：`pip install python-docx` 装的是 python-docx，但代码里写 `from docx import Document`。
> 2. **判题环境（Pyodide）没有这些库**：浏览器里跑不了 `import docx`，所以本课练习统一用**字符串模拟**文本处理。
> 3. **忘了 save() 就白干**：所有操作只在内存里，不 `doc.save()`，文件根本不存在。

## 🔍 读 Word：doc.paragraphs 就是「段落清单」

**类比**：读 Word 就像翻开笔记本逐行读——`doc.paragraphs` 是整份文档的**段落清单**，里面每个元素是一个段落对象，`p.text` 才是这段的文字。

**定义**：`Document("通知.docx")` 打开已有文档后，`for p in doc.paragraphs: print(p.text)` 就能把正文逐段打印出来。想改某段文字，直接给 `p.text` 赋新值，再 `doc.save()` 保存，改动才真正落盘。

```python
from docx import Document

doc = Document("通知.docx")
for p in doc.paragraphs:
    print(p.text)          # 逐段打印正文
```

> ⚠️ 易错点：
> 1. `doc.paragraphs` 只管**正文段落**——表格里、页眉页脚、文本框里的文字不在里面，得另找入口。
> 2. 修改后**必须 save()**，否则改动只在内存里，关掉就没了。
> 3. Word 里「回车」是**新段落**（对应一个新段落对象），「Shift+回车」才是段落内换行——程序里是两回事。

## 🖨️ PDF 为什么难：它是「打印好的纸」

**类比**：PDF 像一张**已经打印好的纸**——每个字都"印"在固定的坐标上。你可以读它、复印它，但想把"这段文字抠出来重新排版"就很难，因为纸上的字不是连续的句子，而是一个个带位置的字块。

**定义**：PDF 是**版式（layout）格式**：文件里存的更多是"每个字符印在哪"，而不是"一段连续的文本"。所以提取文字时可能**乱序、被拆成碎片**。常用库：**pdfplumber**（提取表格准）、**PyMuPDF**（导入名 `fitz`，读文字快、能合并拆分）、**PyPDF2** 等。扫描版 PDF 内容其实是图片、**没有文字层**，要先 OCR 文字识别。

```python
import fitz   # 需要 pip install PyMuPDF（导入名是 fitz）

doc = fitz.open("排班表.pdf")
for page in doc:              # 遍历每一页
    text = page.get_text()    # 提取整页文字（真机上才能跑）
    print(text)
```

> ⚠️ 易错点：
> 1. **提取出来的文字可能乱序/被拆碎**：PDF 按「位置」存字，不是按阅读顺序。
> 2. **扫描版提不到字**：内容是图片、没有文字层，`get_text()` 返回空，得先 OCR。
> 3. **页索引从 0 开始**：`pages[0]` 才是第 1 页，别按"第 1 页"的习惯去取。

## 🏭 自动化场景：批量生成通知、合并 PDF

**类比**：自动化车间最擅长的就是流水线——**一份模板 + 一堆名单**，机器就能哗啦啦吐出 N 份成品。批量生成 Word 通知就是这个道理：循环里一次次新建文档、填内容、保存，50 份通知和 1 份通知的代码几乎一样长。

**定义**：办公自动化的两个典型场景：
- **批量生成 Word**：循环 + `add_paragraph` / 替换模板文字，把名单里的每个名字生成一份通知
- **合并 PDF**：把多份 PDF 拼成一本（如 PyMuPDF 的页面插入），几十份资料一键合成

```python
# 模拟批量生成通知：一份模板 + 一份名单 = N 份文字通知
names = ["张三", "李四", "王五"]
for name in names:
    print(f"{name}，请到 2 号会议室开会！")
print("3 份通知生成完毕！")
```

> ⚠️ 易错点：
> 1. **判题环境没有 python-docx / pdfplumber**：本课 code 题统一用**字符串 + input() 模拟**文本处理（统计关键词次数、按名单生成通知行），真实库的用法先记牢概念。
> 2. 批量生成别忘了**保存到不同的文件名**，否则后一份会覆盖前一份。
> 3. 合并 PDF 注意**页序**：先插谁、后插谁，顺序就是成品的页码顺序。
