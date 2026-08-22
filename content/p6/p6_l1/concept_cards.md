# 路由与接口——让 Python 跑在网页上

## 🏪 后端与接口：网络驿站的柜台

网络驿站开门了！把浏览器当成「客人」，把服务器上跑的程序当成「柜台里的小二」。

客人走到柜台前，递上一句话（**请求 request**）：「我要查天气！」小二转身翻翻本子、算一算，回你一句（**响应 response**）：「明天晴，26℃，记得带伞。」

这个「**跑在服务器上、24 小时守着请求、处理完返回响应**」的程序，就是**后端（backend）**。它不像普通 Python 程序那样"跑一遍就结束"——它一直开着：来一个请求，回一个响应；再来一个，再回一个，循环往复。

后端留给前端（浏览器 / App）调用的「服务窗口」就叫**接口（interface / API）**。每个接口有两条约定：**来什么请求（URL 路径）**、**回什么响应（数据）**。这两条约定写清楚，前端才知道怎么找它、能拿到什么。

```python
# 真实 Flask 后端（本地电脑运行，需先 pip install flask）：
# from flask import Flask
# app = Flask(__name__)
#
# @app.route("/")             # 接口约定一：来什么请求（访问根路径 "/"）
# def index():
#     return "网络驿站欢迎你！"  # 接口约定二：回什么响应
# app.run()                   # 开门营业：开始接收请求

# 逻辑模拟（判题环境可运行）：来一个请求，回一个响应
path = input("客人来了，访问哪个路径？")
if path == "/":
    print("网络驿站欢迎你！")
else:
    print("404 未找到")
```

> ⚠️ 新手最容易踩的坑：
> 1. **后端不是一次性的普通程序**：它要一直运行、反复「请求 → 响应」，靠的是 Web 框架（如 Flask）撑起的服务，不是 `python xxx.py` 跑一遍就结束。
> 2. **接口要约定清楚**：「来什么路径、回什么数据」写明白，前端才接得上；路径、返回格式随便写，前后端就「对不上话」。

## 🧭 Flask 与路由：@app.route 指路牌

驿站里立着一排**指路牌**：每块牌子写着一个路径，指向一个柜台窗口。`@app.route("/hello")` 就是一块牌子——「来 `/hello` 的客人，去这个函数窗口」；`@app.route("/bye")` 是另一块牌子。

把「URL 路径 → 处理函数」的对应关系挂起来的机制，叫**路由（route）**。**Flask** 就是 Python 最流行的 **Web 框架**——一个第三方库，路由、接请求、回响应这些后端杂活它全包了。

Flask 不是标准库，**装好 Python 并没有它**，要先 pip 装一次：

```
pip install flask
```

装好后，最小骨架长这样：`from flask import Flask` → `app = Flask(__name__)` → `@app.route(...)` 注册路由 → 写处理函数 → `app.run()` 启动服务。

```python
# 安装（在电脑终端运行一次）：
# pip install flask

# 真实 Flask（本地电脑运行）：
# from flask import Flask
# app = Flask(__name__)
#
# @app.route("/hello")     # 指路牌：访问 /hello 的客人来这里
# def hello():
#     return "你好，驿站！"
# @app.route("/bye")
# def bye():
#     return "再见！"
# app.run()                # 开门营业

# 逻辑模拟（判题环境可运行）：读入路径，模拟「路由分发」
path = input()
if path == "/hello":
    print("你好，驿站！")
elif path == "/bye":
    print("再见！")
else:
    print("404 未找到")
```

> ⚠️ 新手最容易踩的坑：
> 1. **flask 要 `pip install flask` 才能用**：它和 math、random 不一样，不是自带标准库。没装就 `import flask` 会报 `ModuleNotFoundError`。
> 2. **路由路径要写对**：`@app.route("/hello")` 就得访问 `/hello`——少写斜杠、拼错单词，都会走到 404。
> 3. **判题环境（Pyodide）没有 flask，也起不了真 Web 服务**：概念照讲，动手题用 input/print 模拟「路由分发」验证逻辑。

## 📮 GET 与参数：URL 问号后面的小纸条

客人光说「我要啥」还不够，有时还要递一张**小纸条**（参数）：「我要问候小明」。这张纸条塞在哪？——**URL 的问号（?）后面**：

```
/greet?name=小明
```

`?` 后面就是参数，格式 `key=value`（键=值）；多个参数用 `&` 连接：`/greet?name=小明&city=上海`。

**GET** 是最常用的 HTTP 方法——浏览器告诉服务器「**我要获取信息**」。GET 请求的参数就写在 URL 里（问号后面），谁都能在地址栏看到。Flask 里用 `request.args.get("key")` 把参数取出来：

```python
# 真实 Flask（本地电脑运行）：
# from flask import Flask, request
# app = Flask(__name__)
#
# @app.route("/greet")                    # 指路牌：/greet
# def greet():
#     name = request.args.get("name")     # 取出 URL 参数 ?name=XXX
#     return f"你好，{name}！"

# 逻辑模拟（判题环境可运行）：模拟 URL 参数 name
name = input("请输入 ?name= 参数的值：")
print(f"你好，{name}！")
```

> ⚠️ 新手最容易踩的坑：
> 1. **参数必须写在 `?` 后面**，格式 `?key=value`：写成 `/greet/name=小明`（用斜杠）或忘了问号，服务器就取不到参数。
> 2. **取值用 `request.args.get("key")`**，不是直接读一个叫 key 的变量——参数是通过请求对象取的。
> 3. 判题环境没有 flask，模拟时把「URL 参数」当 `input()` 读进来即可。

## 📦 JSON 响应：把数据打包寄给前端

柜台不能只回一句大白话——客人要的是**一份包裹**（数据）：名字、分数、状态……前后端通用的包裹格式是 **JSON**。

JSON 长什么样？看下面的字典——Python 的**字典和 JSON 长得几乎一模一样**：

```python
# 真实 Flask（本地电脑运行）：
# from flask import Flask, jsonify
# app = Flask(__name__)
#
# @app.route("/api/user")
# def user():
#     return jsonify({"name": "小明", "score": 100})  # jsonify：字典 → JSON 响应
# # 访问 /api/user 得到：{"name": "小明", "score": 100}

# 逻辑模拟（判题环境可运行）：字典 → JSON 文本（用标准库 json 打包）
import json
user = {"name": "小明", "score": 100}
print(json.dumps(user, ensure_ascii=False))
```

**jsonify** 就是 Flask 提供的「打包员」：把字典变成 JSON 文本作为响应返回，前端拿到就能解析。接口返回数据，就是「数据 → 字典 → JSON 文本」的过程。

> ⚠️ 新手最容易踩的坑：
> 1. **jsonify 是 Flask 提供的**，判题环境没有 flask 不能 import；模拟时用标准库 `json.dumps`（Pyodide 自带）或直接 print 字典。
> 2. **JSON 的键和字符串要双引号**：`{"name": "小明"}` 是合法 JSON，`{'name': '小明'}`（单引号）只是 Python 字典——真 JSON 严格要求双引号。
> 3. **接口要返回「结构化数据」**（有键有值），别只 return 一句话——前端拿到 JSON 才好解析、才好用。
