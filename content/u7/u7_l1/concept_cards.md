# 文件读写——档案馆的第一本小本本

## 📒 文件就是档案管理员的小本本

你走进档案馆，新工的第一课：认识「小本本」。

程序的**内存**就像一块白板——写上数据，程序一关，白板被一擦而空，什么都没了。**文件**就是档案管理员的小本本：把数据写在纸上，关灯走人、明天再来，它还在。游戏存档、记账本、档案馆里的卷宗，靠的都是文件。

Python 用 `open()` 打开文件，三个常用参数：

- 第一个：**文件路径**（如 `"archives.txt"`，或完整路径）
- 第二个：**模式**——`"r"` 读、`"w"` 写（覆盖）、`"a"` 追加
- 第三个：**编码**——读写中文一定要 `encoding="utf-8"`

```python
f = open("archives.txt", "r", encoding="utf-8")   # r：只读
f = open("archives.txt", "w", encoding="utf-8")   # w：清空重写
f = open("archives.txt", "a", encoding="utf-8")   # a：末尾追加
```

> ⚠️ 新手最容易踩的坑：
> 1. **`"w"` 会直接清空原文件**！旧档案还想留，就改用 `"a"` 追加。
> 2. 打开的文件用完要 `close()`，否则可能丢数据（第 4 张卡有更省心的办法）。
> 3. 咱们的在线环境（浏览器里的 Python）读写真实磁盘受限，练习里用 `io.StringIO` 在内存里模拟「小本本」——用法几乎一样：`write` / `read` / `readline` / `readlines` 全支持，只是没有真实路径，也不需要编码参数。

## 📖 读档案：read / readline / readlines

读卷宗有三种姿势，对应三个方法：

- `read()`——**一口气读完**整个文件，返回一个大字符串
- `readline()`——**一次读一行**，返回一行字符串
- `readlines()`——**一口气读完，但按行切好**，返回一个列表，每个元素是一行

```python
f = open("names.txt", "r", encoding="utf-8")
all_text = f.read()        # 整个文件 → 一个大字符串
line1 = f.readline()       # 再读一行
lines = f.readlines()      # 剩余内容 → 每行一个元素的列表
f.close()
```

> ⚠️ 新手最容易踩的坑：
> 1. 文件对象像有根**「读指针」**：读完一遍指针就到头了，再 `read()` 只能得到空字符串。想再读一遍，重新 `open()`，或把指针拨回开头（`f.seek(0)`）。
> 2. `readlines()` 得到的每行**带着末尾的 `\n`**，直接打印会在行与行之间多出空行，常用 `strip()` 去掉。

## ✍️ 写档案：write 与 w/a 模式

在登记簿上写字，用的是 `write()`。注意：**它不会自动换行**，想另起一行要自己写 `\n`（换行符）。

- `"w"`（write）：**换一本全新的本子**——原内容全部清空重写
- `"a"`（append）：**在旧本子末尾接着写**——原内容保留

```python
f = open("names.txt", "w", encoding="utf-8")
f.write("张三\n")
f.write("李四\n")
f.close()

f = open("names.txt", "a", encoding="utf-8")
f.write("王五\n")      # 追加在最后一行后面
f.close()
```

> ⚠️ 新手最容易踩的坑：
> 1. **`"w"` 会清空旧内容**！动手前先想三秒：里面的旧档案还要不要？
> 2. `write()` 不会自动加换行：先 `f.write("张三")` 再 `f.write("李四")`，会变成一行 `张三李四`。

## 🔑 with 自动关门 + 编码 utf-8

每次手动 `close()`，就像出门要记得关门——忙起来总有人忘，忘了就可能丢数据。Python 的 `with` 语句是**自动感应门**：缩进块一结束，文件自动关闭，忘关文件这件事从此不存在。

```python
with open("names.txt", "r", encoding="utf-8") as f:
    content = f.read()
print(content)     # with 结束后，文件已经自动关闭
```

顺带把**编码**一起记住：文件里的中文要用 UTF-8 存。Windows 的默认编码可能不是 UTF-8，读中文文件不带 `encoding="utf-8"` 就会报 `UnicodeDecodeError` 或读出一堆乱码——**凡是有中文的文件，一律带上 `encoding="utf-8"`**。

> ⚠️ 新手最容易踩的坑：
> 1. `with` 缩进块**一结束文件就关了**，别在块外面再 `f.read()`——会报 `ValueError: I/O operation on closed file`。
> 2. 读中文不加 `encoding="utf-8"`，在 Windows 上十有八九乱码。宁可每次都写，别省。
