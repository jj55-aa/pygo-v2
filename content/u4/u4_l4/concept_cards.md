# 函数的高级应用——给工具加 buff

## 🎀 装饰器：给函数加 buff

打游戏时，装备上「攻击力+50%」的 buff，你的招式就变强了——**招式没变，但威力变了**。Python 的**装饰器（decorator）**就是干这个的：**在不改函数本身的前提下，给函数附加额外功能**。

实现装饰器需要「函数套函数」：外层函数接收一个函数，内层函数负责「加 buff」：

```python
def shout(func):                 # 装饰器：接收一个函数
    def wrapper():               # 内层函数：包一层"特效"
        print("=" * 20)          # 开场特效
        func()                   # 调用原来的函数
        print("=" * 20)          # 谢幕特效
    return wrapper               # 把加了特效的版本交回去

@shout                          # 语法糖：等价于 hello = shout(hello)
def hello():
    print("你好呀！")

hello()
```

运行后，输出是三行：一行 `=` 组成的装饰线、`你好呀！`、再来一行装饰线。

`@shout` 这个魔法符号叫**语法糖**，它做的事等价于 `hello = shout(hello)`：把原来的 `hello` 函数**替换**成加了特效的 `wrapper` 版本。之后调用 `hello()`，实际跑的是包装后的版本。

> ⚠️ 装饰器要先定义，才能用 `@` 装饰别的函数。另外内层 `wrapper` 里记得**调用原函数** `func()`，不然原功能就没了。

装饰器最常见的用途：**打日志、计时、权限检查**——函数本身一行不改，功能就多了。

## 📦 闭包：函数里藏了个"小本本"

**闭包（closure）**是个有点玄乎的词，但它做的事很朴素：**内层函数「记住」了外层函数的变量**。

```python
def make_greeter(name):          # 外层函数
    def greet():                 # 内层函数
        print("你好，" + name + "！")   # 用到了外层的 name
    return greet                 # 返回内层函数

greet_ming = make_greeter("小明")
greet_ming()    # 你好，小明！

def make_counter():              # 计数器：闭包"记住"count
    count = 0
    def counter():
        nonlocal count           # 声明：我要改外层函数的 count
        count += 1
        return count
    return counter

c = make_counter()
print(c())    # 1
print(c())    # 2
print(c())    # 3
```

神奇的地方在于：`make_greeter("小明")` 执行完了，按理说局部变量 `name` 应该「消失」了——但 `greet` 函数**记住了**它。等外层函数返回后，`greet_ming` 手里还攥着 `"小明"` 这个小本本。

第二个例子里的 `nonlocal` 关键字和 `global` 类似：`global` 声明「用全局变量」，`nonlocal` 声明「用外层函数的变量」——这样内层函数才能**修改**外层函数的变量。

> 💡 闭包的套路：**外层函数造变量，内层函数用（或改）变量，外层把内层函数返回**。这样内层函数就带走了「专属记忆」。

## 🌀 生成器：边做边给，不用一次全做完

普通函数一次算出**全部**结果。生成器（generator）不一样——它**做一个给一个**，像流水线一样。

关键就一个词：**`yield`**（产出）。函数里只要出现 `yield`，它就变成了生成器：

```python
def countdown(n):
    while n > 0:
        yield n          # 暂停！先把这个数交出去
        n -= 1           # 下次继续从这里跑

print(list(countdown(3)))    # [3, 2, 1]

c = countdown(3)
print(next(c))    # 3   用 next() 挤一个
print(next(c))    # 2
print(next(c))    # 1
```

执行过程就像「挤牙膏」：每次 `yield` 交出一个数，函数就**暂停**；等调用方要下一个时，才从暂停的地方继续跑。

**生成器最大优势：省内存。** 要生成 1 亿个数，普通列表先把 1 亿个数全造出来堆在内存里；生成器则算一个给一个，内存占用几乎为 0。

> ⚠️ **生成器只能遍历一次**！它像一次性吸管，挤完就没了。想反复用，就 `list()` 转成列表存起来。

## 🧰 常用内置函数大盘点

学了这么久，该把常用「武器」盘点一下了。下面这些都是**不用 import** 就能用的内置函数：

```python
print(abs(-8))                # 8            绝对值
print(round(3.14159, 2))      # 3.14         四舍五入保留 2 位小数
print(sum([1, 2, 3, 4]))      # 10           求和
print(max(3, 7, 2))           # 7            最大值
print(min(3, 7, 2))           # 2            最小值

scores = [88, 45, 92]
for i, s in enumerate(scores, start=1):   # 同时拿序号和元素
    print(i, s)               # 1 88 / 2 45 / 3 92

names = ["小明", "小红"]
scores2 = [88, 92]
print(list(zip(names, scores2)))    # [('小明', 88), ('小红', 92)]

print(all([True, True, True]))    # True   全都真才 True
print(all([True, False, True]))   # False
print(any([False, False, True]))  # True   有一个真就 True
```

- `enumerate`：遍历时**同时拿到序号和元素**，`start=1` 让序号从 1 开始
- `zip`：把两个列表**按位置配对**成元组
- `all` / `any`：`all` 全真才真，`any` 有一个真就真
