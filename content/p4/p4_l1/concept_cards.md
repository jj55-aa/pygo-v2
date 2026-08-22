# 窗口与控件——图形界面的第一步

## 🖥️ 告别黑乎乎：什么是图形界面（GUI）

你走进「桌面工坊」——这是专门造**桌面小工具**的地方。工坊里摆着以前做的小工具：都是终端程序，黑底白字，用户得一行一行敲命令才能用。工坊师傅摇了摇头：「客户要的不是这个——他们要能**看**、能**点**的东西。」

**终端程序 vs 图形界面**，就像两种问路方式：终端程序是**打电话报菜单**——「请输入 1 录入、2 退出」，全靠文字来来回回；图形界面是**到店里柜台办事**——招牌（窗口标题）、按钮、输入框都摆在眼前，点一下就行。

**GUI = Graphical User Interface（图形用户界面）**：用窗口、按钮、输入框这些图形元素和程序打交道的界面。Python 里做 GUI 最省事的方式，就是用自带的 **Tkinter**——它是 Python 标准库（Tk 图形工具包的 Python 接口），**随 Python 一起安装，不用 pip 装**。

```python
# 真实的 Tkinter 界面（在本地电脑上运行，能弹出窗口）：
# import tkinter as tk
# root = tk.Tk()                # 创建主窗口
# root.title("我的第一个窗口")    # 设置窗口标题
# root.mainloop()               # 让窗口保持显示

# 判题环境没有 tkinter，用 print 模拟「开窗口」的流程：
print("Tkinter 三步曲：")
print("1. import tkinter as tk")
print("2. root = tk.Tk() 创建主窗口")
print("3. root.mainloop() 让窗口保持显示")
```

> ⚠️ 新手最容易踩的坑：
> 1. **Tkinter 是标准库**：Python 装好就有，不用 `pip install tkinter`。
> 2. **判题环境（Pyodide）没有 tkinter、弹不出真窗口**——本课概念照讲，动手题（code/quest）一律用 input/print 验证**按钮背后的逻辑**。

## 🪟 窗口三件套：Tk、控件、mainloop

一个 Tkinter 程序就像开一家「桌面小店」，靠三件套就能开张：

- **`Tk()`——租下店面**：创建主窗口，它是所有控件的「爸爸窗口」——创建控件时第一个参数要传给它（`tk.Label(root, ...)`）。
- **控件（widget）——摆货架**：窗口里的零件，Label 文字、Button 按钮、Entry 输入框……往店里一件件摆。
- **`mainloop()`——开门营业**：让窗口保持显示、时刻准备响应用户的点击和输入；它会一直「阻塞」在这里，直到用户关窗，程序才结束。

三件套的顺序是固定的：**先 import → 再 Tk() 建窗口 → 摆控件 → mainloop() 营业**。摆控件还有个讲究：控件创建后要告诉它怎么放，`pack()` 是一个接一个纵向堆叠，`grid()` 像 Excel 表格一样按行列摆——**不布局，控件就不显示**。

```python
# 真实的窗口三件套（在本地电脑上运行）：
# import tkinter as tk
# root = tk.Tk()                        # ① 创建主窗口（租店面）
# label = tk.Label(root, text="你好，桌面工坊！")
# label.pack()                          # ② 控件 + 布局，才会显示（摆货架）
# root.mainloop()                       # ③ 让窗口保持显示（开门营业）

# 逻辑模拟：三件套的顺序（判题环境可运行）：
print("① Tk()：创建主窗口（租下店面）")
print("② 创建控件 + pack()/grid()：摆进窗口（摆货架）")
print("③ mainloop()：开门营业，窗口保持显示")
```

> ⚠️ 新手最容易踩的坑：
> 1. **`mainloop()` 是阻塞的**：它后面的代码要等窗口关闭才会执行；一个程序通常只调用一次。
> 2. **控件要 `pack()`/`grid()` 布局才显示**：忘了布局，控件就「隐形」了，窗口里空空如也。

## 🧩 常用控件：Label、Button、Entry

店里最常用的三样招牌装备：

| 控件 | 类名 | 干什么 | 常用参数 / 方法 |
| --- | --- | --- | --- |
| 标签 | `tk.Label` | 显示一段固定文字（静态招牌） | `text="要显示的文字"` |
| 按钮 | `tk.Button` | 点击时触发一个函数（服务铃） | `text="按钮文字"`、`command=函数名` |
| 输入框 | `tk.Entry` | 让用户输入一行文字（意见簿） | 用 `.get()` 取出输入的内容 |

这三个控件就是图形界面的「积木」：Label 负责展示、Entry 负责收集、Button 负责触发动作。摆放时一个接一个用 `pack()`，想按行列对齐就用 `grid(row=..., column=...)`。

```python
# 真实的控件三兄弟（在本地电脑上运行）：
# import tkinter as tk
# root = tk.Tk()
# tk.Label(root, text="用户名：").pack()        # Label 标签：显示文字
# entry = tk.Entry(root)                         # Entry 输入框：收用户输入
# entry.pack()
# def login():
#     print("欢迎，", entry.get())               # .get() 取出输入内容
# tk.Button(root, text="登录", command=login).pack()  # Button 按钮：点击触发 login
# root.mainloop()

# 逻辑模拟：Label 显示 / Entry 输入 / Button 触发（判题环境可运行）：
print("Label：显示「用户名：」")
print("Entry：用户在输入框里输入名字")
print("Button：点了「登录」→ 程序执行 login() 里的逻辑")
```

> ⚠️ 新手最容易踩的坑：
> 1. **Button 的 `command` 传的是函数名，不加括号**：`command=login`。写成 `command=login()` 会在创建按钮时立刻执行，真正点按钮反而没反应。
> 2. **Entry 里的文字要用 `.get()` 取**：直接 `print(entry)` 打印的是控件对象，不是输入的内容。

## 🏭 界面与逻辑分离：按钮背后是函数

桌面工坊造工具，讲究**外壳与引擎**分工：**外壳**是窗口、按钮、输入框、标签——负责「好看、好点」；**引擎**是函数——负责「真干活」。点按钮，就是按下引擎的启动键。

**界面与逻辑分离** = 把「点按钮后要做的计算」写成普通函数。这个函数**不依赖窗口**，单独就能测试：给它一个数，它返回结果。界面只负责三件事：从输入框拿数据 → 调引擎函数 → 把结果展示出来。

```python
# 引擎：按钮背后的逻辑函数（不依赖窗口，可以单独测试）
def square(n):
    return n * n

# 外壳：真实的 Tkinter 界面（在本地电脑上运行）：
# import tkinter as tk
# root = tk.Tk()
# entry = tk.Entry(root)
# entry.pack()
# def on_click():
#     print(square(int(entry.get())))   # 点按钮 → 拿输入 → 调引擎
# tk.Button(root, text="计算平方", command=on_click).pack()
# root.mainloop()

# 逻辑模拟：判题环境里验证「按钮背后的逻辑」——把引擎函数单独调一调：
print(square(5))    # 模拟：输入框填 5，点「计算平方」→ 显示 25
print(square(0))    # 模拟：输入框填 0 → 显示 0
```

> ⚠️ 新手最容易踩的坑：
> 1. **判题环境没有 tkinter**：本课的 code/quest 题只验证「按钮背后的逻辑」（函数与计算），窗口代码不会运行。
> 2. **逻辑要写进函数**，别全堆在界面代码里——这是「外壳与引擎」的分工。下一课「事件与交互」，我们就把引擎装进外壳，让它真的转起来！
