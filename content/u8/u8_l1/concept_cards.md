# 标准库初探——打开 Python 的百宝箱

## 🧰 标准库就是 Python 自带的百宝箱

走进「百宝箱」世界，你面前立着一只大箱子。管理员拍拍箱盖：「**这里面的工具，装好 Python 就全齐了，不用你额外去装**。」就像新手机自带相机、计算器、备忘录一样，不用另外下载。

Python 装好后自带的一大批**官方模块**，合起来就叫**标准库（Standard Library）**：算数学找 `math`、抽随机数找 `random`、处理日期找 `datetime`、读写 JSON 找 `json`……要什么有什么，随取随用。

想用箱子里的工具，第一步永远是：**用 `import` 把模块「请」出来**。`import` 就是打开百宝箱的钥匙：

```python
import math            # 打开箱子，把 math 模块请出来
print(math.sqrt(16))   # 4.0 —— 开平方
print(math.pi)         # 3.141592653589793 —— 圆周率
```

> ⚠️ 新手最容易踩的坑：
> 1. **忘了 `import` 直接调用会报 `NameError`**：比如直接写 `sqrt(16)`，Python 会说 `name 'sqrt' is not defined`——它根本不认识这个「裸名字」，因为工具还在箱子里没拿出来。
> 2. `import` 之后要用**全名**调用：`math.sqrt(16)` 前面的 `math.` 是「从哪个模块来」的身份证，不能省。

## 🔑 import 的三种写法：怎么拿工具随你挑

钥匙有了，拿法有三种，就像从箱子里取工具——**整箱搬走 / 只拿一件 / 起个小名**：

| 写法 | 拿法 | 之后怎么调用 |
| --- | --- | --- |
| `import math` | 整箱搬走 | `math.sqrt(16)`（每次带模块名） |
| `from math import sqrt` | 只拿 `sqrt` 这一件 | `sqrt(16)`（直接叫名字） |
| `import math as m` | 整箱搬走，起小名 `m` | `m.sqrt(16)`（用小名） |

```python
import math
print(math.sqrt(9))          # 3.0 —— 整箱搬走，全名调用

from math import sqrt
print(sqrt(9))               # 3.0 —— 只拿一件，直接调用

import math as m
print(m.sqrt(9))             # 3.0 —— 起个小名 m
```

> ⚠️ 新手最容易踩的坑：
> 1. **两种写法别混着用**：`from math import sqrt` 之后，`math` 这个名字并没有被导入——这时再写 `math.sqrt(16)` 照样报 `NameError: name 'math' is not defined`。拿了哪件，就用哪件。
> 2. **别把变量名起成 `math`**：比如 `math = 10` 会把模块「盖住」，之后 `math.pi` 取到的就不是圆周率而是报错了。给变量起名时，避开模块名。

## ➗ math：数学计算专家

`math` 模块是百宝箱里的**数学专家**，常用的工具就这几件：

| 函数/常量 | 作用 | 例子 | 结果 |
| --- | --- | --- | --- |
| `sqrt(x)` | 开平方 | `math.sqrt(16)` | `4.0` |
| `ceil(x)` | 向上取整 | `math.ceil(3.2)` | `4` |
| `floor(x)` | 向下取整 | `math.floor(3.8)` | `3` |
| `pow(x, y)` | x 的 y 次方 | `math.pow(2, 10)` | `1024.0` |
| `pi` | 圆周率 π | `math.pi` | `3.14159…` |

```python
import math
print(math.sqrt(81))    # 9.0  开平方
print(math.ceil(3.2))   # 4    向上取整（往大的方向）
print(math.floor(3.8))  # 3    向下取整（往小的方向）
print(math.pi)          # 3.141592653589793
```

> ⚠️ 新手最容易踩的坑：
> 1. **`sqrt` 的结果是小数**：`math.sqrt(16)` 得到 `4.0` 而不是 `4`——平方根不一定是整数，别指望它一定返回整数。
> 2. `ceil` 和 `floor` 别搞反：**向上**取整是 `ceil`（天花板），**向下**取整是 `floor`（地板）——记不住就想想「抬头是天花板，踩脚是地板」。

## 🗂️ os 与 sys：箱子里的两位「管家」

百宝箱里还有两位「管家」，本课先**混个脸熟**（概念为主，API 不用背）：

- **`os` 模块**：管**操作系统**——比如「我现在在哪个目录工作」（`os.getcwd()`）、文件路径怎么拼。程序要跟电脑系统打交道，找它。
- **`sys` 模块**：管**Python 解释器自己**——比如当前 Python 版本（`sys.version`）、程序启动时带的参数。想知道「解释器什么情况」，找它。

```python
import os
import sys

print(os.getcwd())   # 当前工作目录（每台电脑不一样）
print(sys.version)   # Python 版本号
```

> ⚠️ 新手最容易踩的坑：
> 1. 用之前**同样要先 `import`**：`os`、`sys` 也是标准库模块，不 import 直接 `os.getcwd()` 一样报 `NameError`。
> 2. **别指望输出都一样**：`os.getcwd()` 的结果取决于电脑和文件夹，不同机器、不同系统（Windows / Mac / Linux）跑出来可能不同——看到「和教程不一样」别慌，这是正常的。
