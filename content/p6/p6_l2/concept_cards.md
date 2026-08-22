# 数据与模板——把后端的数据端上页面

## 📥 数据从哪来：请求参数、数据库与 JSON

驿站里，旅人（浏览器）来取信，信的内容可不是凭空编的——驿站长得先**取数据**。后端（Python/Flask）的数据有三个常见来源：

- **请求参数**：旅人把要求写在 URL 上，比如访问 `/search?keyword=宝剑`，Flask 用 `request.args.get("keyword")` 就能拿到 `"宝剑"`。URL 上 `?` 后面的就是参数，多个参数用 `&` 连接
- **数据库**：驿站的档案库。后端用 SQL 查出记录（比如所有公告），查到的是 Python 的列表/字典
- **写死的配置**：有些数据直接写在后端代码里（比如版本号），也是数据

数据到手后，后端要把它们**打包成 JSON 字符串**再交给前端（浏览器）——JSON 是前端认识的格式，见下一张卡。

```python
import json

# 模拟：后端从「请求参数」拿到关键词（判题环境用 input() 模拟 URL 参数）
keyword = input()

# 模拟：后端从「数据库」查出的一份数据（这里假装查出来的）
students = [
    {"name": "小明", "score": 92},
    {"name": "小红", "score": 85},
]

# 后端把数据打包成 JSON，准备发给前端
resp = json.dumps(students, ensure_ascii=False)
print("拿到参数：", keyword)
print("打包好的 JSON：", resp)
```

> ⚠️ 新手最容易踩的坑：
> 1. **请求参数（URL 上的、input() 读进来的）都是字符串**——要算数先 `int()` / `float()` 转换。
> 2. 数据库查出来的数据在 Python 里是**字典/列表**，发给前端前要先 `json.dumps` 打包成 JSON，前端才认识。

## 🌐 JSON：前后端的通用语言

前端（浏览器里的 JavaScript）和后端（Python）是两种不同的语言，怎么对话？靠 **JSON**——一种两边都认识的**通用语言**。

JSON 的样子和 Python 的字典/列表很像：

- 对象 `{"name": "小明"}` ↔ Python 字典
- 数组 `[1, 2, 3]` ↔ Python 列表
- 键必须用**双引号**：`{"score": 92}`，不是 `{'score': 92}`

Python 里打包/拆包的工具就是 json 模块，两个函数一对：

```python
import json

# 拆包：JSON 字符串 → Python 数据（前端发给后端的数据，后端这样读）
s = '{"name": "小明", "score": 92}'
data = json.loads(s)
print(data["name"], data["score"])

# 打包：Python 数据 → JSON 字符串（后端要发给前端的数据，这样写）
out = json.dumps(data, ensure_ascii=False)
print(out)
```

> ⚠️ 新手最容易踩的坑：
> 1. **`json.loads` 返回的是 Python 字典**——取字段用 `data["name"]`（中括号 + 键），**不是** `data.name`（那是对象属性的写法，字典用会报错）。
> 2. **JSON 的键要和你代码里取的键一字不差**：JSON 里是 `"score"`，就写 `data["score"]`；写成 `data["分数"]` 会抛 `KeyError`。
> 3. 打包含中文的数据记得加 `ensure_ascii=False`，否则中文会变成 `\uXXXX`。

## 🖼️ 模板渲染：把数据嵌进页面

后端取到数据、打好包，最后一步是**把数据端上页面**——这就是「模板渲染」。

真实 Flask 里是两步：

1. 后端写一个**模板文件**（一般放在 `templates/` 目录，比如 `show.html`），页面里留好「空位」
2. 调用 `render_template("show.html", students=students)`，Flask 把数据填进空位，渲染出**完整的页面**再发给浏览器

模板里的「空位」长这样（Jinja2 语法，Flask 默认用它）：

- `{{ 变量 }}` —— 显示一个变量的值
- `{% for 变量 in 列表 %}` ... `{% endfor %}` —— 把列表逐条循环渲染

判题环境没有 Flask，我们用标准库**模拟**「把列表逐条渲染成文本行」——其实就是 for 循环 + print：

```python
import json

# 模拟：后端查数据库拿到学生列表（以 JSON 字符串给你）
s = input()
students = json.loads(s)

# 模拟 render_template：逐条把数据「渲染」成一行文本
for stu in students:
    print("姓名：" + stu["name"] + "，分数：" + str(stu["score"]))
```

> ⚠️ 新手最容易踩的坑：
> 1. 模板里显示变量用 **`{{ }}` 双大括号**——不是 `{ }`、不是 `${}`、不是 `< >`。
> 2. `render_template` 的**第一个参数是模板文件名**（字符串），第二个及以后才是要填进页面的数据。
> 3. 循环渲染列表时，**分数是数字**，拼字符串前要 `str(score)`，否则 `+` 会把字符串和数字「相加」报错。

## 🔁 模拟渲染：判题环境里照样跑

判题环境（Pyodide）没有 Flask、也没有网络——`from flask import render_template` 直接报错。但别慌，**模拟方案和真实渲染是一套逻辑**：

| 真实环境 | 判题环境（模拟） |
| --- | --- |
| `request.args.get("keyword")` 取请求参数 | `input()` 读入一行 |
| 数据库查出的记录 | 一行 JSON 字符串 |
| `resp.json()` / `json.loads()` 解析 | `json.loads(s)` |
| `render_template` 把列表逐条渲染 | `for` 循环逐条 `print` |

做题时记住这个「万能四步」：

```python
import json

# 第 1 步：读入一行 JSON（模拟后端接口返回的数据）
s = input()

# 第 2 步：json.loads 解析成 Python 数据
data = json.loads(s)

# 第 3 步：取出你要的字段（键必须和 JSON 里完全一致）
# 第 4 步：for 循环逐条「渲染」成文本行
for item in data:
    print("- " + item)
```

> ⚠️ 新手最容易踩的坑：
> 1. **别 `import flask`**——判题环境没有这个库，import 就崩。要模拟就老老实实用标准库 `json`。
> 2. **JSON 是「一行」输入**：用 `input()` 读一次就行，JSON 内部不要自己加换行。
> 3. 解析出来**是列表就 for 循环、是字典就按键取**——先想清楚 `json.loads` 的结果是什么结构，再写第 3、4 步。
