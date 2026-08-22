# 报错初识——报错不可怕，是 Python 在帮你

## 😱 报错不可怕

新手最大的恐惧之一：**看到红字就慌**。其实报错是**好事**——Python 在用错误信息告诉你"哪里出了问题"，帮你快速定位，而不是让你对着错误结果瞎猜。

一次报错信息长这样（真实 traceback）：

```
Traceback (most recent call last):
  File "<pygo>", line 2, in <module>
    print(x)
NameError: name 'x' is not defined
```

读报错就三件事：
1. **最下面一行**：错误类型和原因（NameError：名字没定义）
2. **往上找 File "...", line N**：出错在第几行
3. **看那行代码**：想清楚为什么错

> 我们软件的报错面板还会给你**中文翻译**：这是什么错 / 为什么 / 怎么改 / 常见场景。

## 🔍 SyntaxError 语法错误

最常见的新手报错——**代码不符合 Python 语法规则，解释器读不懂**：

```python
print("你好"      # 括号没闭 → SyntaxError
print（"你好"）    # 中文括号 → SyntaxError
if x > 10        # 缺冒号 → SyntaxError
```

常见原因：括号/引号没配对、if/for/def 后面忘了冒号、**用了中文标点**（，。（））。

> 记住：写代码只用英文半角标点 `( ) " ' , :`，中文标点只能出现在被引号包住的文字里。

## 🏷️ NameError 名字未定义

**用了一个不存在的变量或函数名**：

```python
print(age)       # age 没赋值 → NameError: name 'age' is not defined
name = 小明       # 小明没加引号，被当成变量名 → NameError
```

排查思路：
1. 变量名**拼写**对吗？（Python 区分大小写：`Name` 和 `name` 是两个名字）
2. 使用前**先赋值**了吗？
3. 字符串**加引号**了吗？

## 💥 类型错误和更多常见报错

**TypeError 类型错误**——不同类型不能混着算：

```python
print("1" + 1)      # 字符串 + 数字 → TypeError
print("1" + str(1)) # 对：先转成一样
```

**ZeroDivisionError 除以 0**：`print(10 / 0)` → 数学上不允许。

**IndexError 下标越界**：

```python
s = "hi"
print(s[5])        # 一共才 2 个字符 → IndexError
```

> 遇到底层办法：**看报错面板的中文翻译**，每条都告诉你"怎么改"。报错不是终点，是线索——会读报错，你就开始像程序员一样思考了。
