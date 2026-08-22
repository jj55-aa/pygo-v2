# HTTP 与 requests——织网的第一步

## 🏷️ URL：资源的门牌号

想象你来到「蜘蛛峡谷」，峡谷里每一份情报都有自己的门牌号。**URL（网址）就是资源的门牌号**：告诉服务器"我要找的那份情报在哪儿"。爬虫的第一件事，就是看懂门牌号，然后照着地址去敲门。

一个完整的 URL 拆开来看，有四样东西：

`https://www.example.com/map?level=2&id=7`

| 部分 | 例子 | 干什么用的 |
| --- | --- | --- |
| 协议 | `https://` | 用什么"规则"对话（http/https，https 是加密版） |
| 域名 | `www.example.com` | 服务器在哪——门牌号上的"大楼地址" |
| 路径 | `/map` | 服务器上的哪个资源——哪一层的哪间房 |
| 参数 | `?level=2&id=7` | 问号后面，`key=value` 键值对，捎带的筛选条件 |

参数这块最容易看花眼，记住两条铁律：**第一个参数从 `?` 开始；多个参数之间用 `&` 连接**（`?key1=value1&key2=value2`）。把下面的门牌号拆开看看：

```python
url = "https://www.example.com/map?level=2&id=7"
head, rest = url.split("://")       # 先拆协议
print("协议:", head)                 # https
domain, tail = rest.split("/", 1)   # 再拆域名
print("域名:", domain)               # www.example.com
path, _, query = tail.partition("?")
print("路径:", path)                 # map
print("参数:", query)                # level=2&id=7
```

> ⚠️ 新手最容易踩的坑：
> 1. 参数一定在 `?` **后面**；`?` 只出现一次（第一个参数前面），参数之间用 `&` 连接，不是空格也不是逗号
> 2. URL 里不能直接写中文和空格——浏览器会自动编码成 `%E8%9C%98%E8%9B%9B` 这种样子。别手写编码，让库帮你处理

## 📨 GET 与 POST：取数据 vs 交数据

门牌号看懂了，接下来要选"怎么敲门"。HTTP 请求方法里最常用的两个：**GET 和 POST**。

- **GET = 取数据**（只读）：看网页、搜关键词、查详情，都是 GET——你只是"去取"，不改动服务器上的任何东西
- **POST = 交数据**（提交）：登录时提交用户名密码、发帖子、下单，都是 POST——你把信息"交"给服务器

打个比方：GET 像去图书馆借书看（看完还回去，书没动）；POST 像填报名表交上去（信息留在了那里）。

```python
# 真实环境代码（需要先安装 requests：pip install requests，并且有网络）
import requests
# GET：取数据，参数拼在 URL 的问号后面
resp = requests.get("https://www.example.com/search?q=蜘蛛")
# POST：提交数据，用户名密码放在请求体里，不在 URL 里
resp2 = requests.post("https://www.example.com/login",
                      data={"user": "admin", "pass": "123456"})
```

除了方法和地址，请求里还带着**请求头（headers）**——比如 `User-Agent` 告诉服务器"我是浏览器，不是机器人"；POST 提交的数据则放在**请求体**里。这些在浏览器按 F12 → 网络（Network）里都能看到。

> ⚠️ 新手最容易踩的坑：
> 1. **别用 GET 传密码**——GET 的参数会明晃晃地出现在 URL 和服务器日志里，等于把密码贴墙上
> 2. POST 提交的数据放在**请求体**里，不在 URL 上
> 3. 判题环境（Pyodide）没有网络，上面的 `requests.get/post` 跑不了——第 4 张卡会教你用 JSON 字符串模拟

## 📟 状态码：服务器的回执暗号

你敲了门，服务器一定会回话——回话里带着一个三位数字的**状态码**，它就是服务器的"回执暗号"。看到暗号，你就知道这趟到底成没成：

| 状态码 | 含义 | 大白话 |
| --- | --- | --- |
| `200` | 请求成功 | 一切正常，数据到手 |
| `404` | 资源不存在 | 门牌号记错了，没有这个资源 |
| `403` | 禁止访问 | 服务器拒绝你（可能觉得你是机器人） |
| `500` | 服务器内部错误 | 服务器自己崩了，跟你没关系 |

```python
# 概念代码（真实环境）：resp.status_code 就是状态码
import requests
resp = requests.get("https://www.example.com/gone")
print(resp.status_code)         # 404：服务器说"没这个资源"
print(resp.status_code == 200)  # False：这次请求不算成功
```

> ⚠️ 新手最容易踩的坑：
> 1. **404 是服务器的"回答"，不是 Python 报错！** 程序不会崩，`resp.status_code` 就是 404 这个数字——资源不存在，不代表你的代码写错了
> 2. `500` 说明**服务器那边**出了问题，不是你的请求写错了
> 3. 拿到响应先看状态码：`200` 才放心取数据，`404 / 500` 就别硬着头皮解析内容了

## 🕷️ requests 基本用法：发请求、看响应

状态码看懂了，正式织网。**爬虫的第一步 = 发请求、拿响应**：对着 URL 发一个 GET 请求，服务器把数据放进响应里还给你，你从响应里把数据取出来。

真实环境里用第三方库 **requests**（语法简单，爬虫圈标配）。它是第三方库，**先安装再导入**：命令行执行 `pip install requests`，然后代码里 `import requests`。

真实环境的三步：`resp = requests.get(url)` 发请求，然后 `resp.status_code` 看状态码、`resp.text` 拿原文（字符串）、`resp.json()` 把 JSON 响应解析成字典/列表。响应对象的这三个常用"把手"记牢：**`.status_code` 看状态码、`.text` 拿原文、`.json()` 解析成字典/列表**。

但注意：**判题环境（Pyodide）没有 requests、也没有网络**，`import requests` 会报 `ModuleNotFoundError`。怎么练？用"假响应"模拟——题目把服务器返回的 JSON 字符串直接给你，用标准库 `json.loads` 解析，效果和 `resp.json()` 一样：

```python
# 判题环境模拟：没有 requests、没有网络
# 这段 JSON 字符串就当作服务器返回的响应体
import json
resp_text = '{"title": "蜘蛛峡谷情报", "tag": "机密"}'
data = json.loads(resp_text)   # 等价于 resp.json() 的效果
print(data["title"])           # 蜘蛛峡谷情报
print(data["tag"])             # 机密
```

> ⚠️ 新手最容易踩的坑：
> 1. **requests 是第三方库，不是标准库**——直接 `import requests` 会报错，必须先 `pip install requests`
> 2. `resp.text` 是**字符串**，要取字段得先 `resp.json()`（判题环境里就是 `json.loads`）解析成字典，才能用 `data["键"]`
> 3. **判题环境没有 requests 和网络**：别写 `requests.get(...)`，用题目给的 JSON 字符串 + `json.loads` 模拟
> 4. 爬虫第一步永远是"发请求拿响应"——响应都没拿到，后面的解析无从谈起
