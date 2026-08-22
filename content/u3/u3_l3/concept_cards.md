# 字符串进阶——文字的百宝箱

## 🔤 字符串就是一串珠子

你见过手串吗？一颗颗珠子按顺序串在绳子上。Python 里的**字符串（str）**就是这样——**一串按顺序排列的字符**，用引号包起来。它和列表、元组一样都是**序列**：能下标、能切片、能用 `len()` 和 `in`。学一个，等于会三个！

```python
s = "hello"
print(s[0])       # h，第一个字符
print(s[-1])      # o，最后一个字符
print(s[1:4])     # ell，切一段（终点取不到）
print(s[::-1])    # olleh，整个倒过来
print("th" in s)  # False
print(len(s))     # 5，一共 5 颗珠子
```

> 💡 记住：**列表、元组、字符串都是"序列"**，都能下标、切片、`len()`、`in`。

## 🔠 大小写与查找：字符串的美颜和侦探

字符串自带很多"方法"（功能），先看**大小写**和**查找判断**：

```python
print("hello".upper())          # HELLO，全部变大写
print("HELLO".lower())          # hello，全部变小写
s = "hello world"
print(s.find("world"))          # 6，"world" 从下标 6 开始
print(s.find("xyz"))            # -1，找不到返回 -1（不报错！）
print(s.startswith("he"))       # True，以 he 开头
print("123".isdigit())          # True，全是数字
print("abc123".isdigit())       # False，混了数字就不行
```

> ⚠️ 这些方法**不会改原来的字符串**——字符串和元组一样**不可变**，方法都返回**新字符串**。想用结果得存下来：`s = s.upper()`。超实用：用户输入的"年龄"先 `isdigit()` 判断是不是数字，再转 `int()`，能少报好多错。

## ✂️ 清洁、分割与拼接：处理文字三板斧

**去空格**、**替换**、**分割**、**拼接**——处理用户输入全靠它们：

```python
s = "  你好呀  "
print(s.strip())                  # 你好呀，两边的空格没了

line = "小明,88,高三"
parts = line.split(",")           # 分割：按逗号剪成列表
print(parts)                      # ['小明', '88', '高三']

words = ["我", "爱", "Python"]
print("-".join(words))            # 我-爱-Python，胶水是 "-"
print("".join(words))             # 我爱Python，空串拼接，直接连一起
```

> ⚠️ `join` 是**字符串**调用的，不是列表调用的！`"-".join(words)` 对，`words.join("-")` 错。记法：**前面的符号是"胶水"**，把后面的列表粘起来。`replace("苹果", "香蕉")` 还能把某个词替换成另一个。

## 🧮 f-string：把数字填进句子

想让数字"插进"句子里，最爽的是 **f-string**——f 开头，花括号里写变量：

```python
name = "小明"
score = 95
print(f"{name}考了{score}分")      # 小明考了95分
print(f"今年{2026}年")             # 花括号里直接写表达式也行

# 老式写法又啰嗦又容易漏：
print(name + "考了" + str(score) + "分")   # 还要手动转 str
```

> 💡 口诀：**改格式找方法（upper/split/strip），填数字找 f-string**。平时写代码用 f-string 就够啦。
