# JSON 序列化——给档案打包的万能档案袋

## 📦 序列化：给数据打包（万能档案袋）

档案馆里，数据（字典、列表）就像一摞摞散乱的卷宗。可传送带（文件、网络）只认**文本**——`f.write()` 直接写字典会当场报错（TypeError）！怎么办？把卷宗装进档案馆统一配发的**万能档案袋**：一种所有分馆、所有系统都认得的**标准文本格式**。装进袋子的数据能存进文件、能跨系统传输；到了目的地，拆开袋子，内容原样还原。

- **序列化（打包）**：把内存里的 Python 对象（字典、列表……）变成**能存文件、能传输的文本**
- **反序列化（拆包）**：把文本读回来，**还原成 Python 对象**

```python
data = {"name": "小明", "age": 18}

# 直接写字典 → 报错！write() 只收字符串
# with open("档案.txt", "w", encoding="utf-8") as f:
#     f.write(data)          # TypeError: write() argument must be str

import json
s = json.dumps(data, ensure_ascii=False)   # 打包：字典 → 文本
print(s)                                   # {"name": "小明", "age": 18}
print(type(s))                             # <class 'str'>  现在是字符串了！
```

> ⚠️ 新手最容易踩的坑：
> 1. **`json.dumps()` 出来的不是字典，是字符串**（`<class 'str'>`）——想再当字典用，还得拆包。
> 2. 文件只能写文本：**打包之后再写文件**，顺序别搞反。

## 📄 JSON 长什么样：档案袋的统一写法

万能档案袋的**统一格式**叫 **JSON**（JavaScript Object Notation）。它长得和 Python 的字典、列表几乎一模一样，而且**全世界的编程语言都认得它**——这就是它能跨系统传输的原因。

| Python | JSON | 例子 |
| --- | --- | --- |
| `dict` 字典 | **对象** `{...}` | `{"name": "小明"}` |
| `list` 列表 | **数组** `[...]` | `[90, 85, 92]` |
| `str` 字符串 | 字符串（**双引号**） | `"小明"` |
| `int` / `float` | 数字 | `18` / `3.14` |
| `True` / `False` | `true` / `false`（**小写**） | `true` |
| `None` | `null` | `null` |

```python
# 这就是一份 JSON 文本：键和字符串都用双引号，true / null 小写
s = '{"name": "小明", "age": 18, "scores": [90, 85, 92], "vip": true, "note": null}'
print(s)
```

> ⚠️ 新手最容易踩的坑：
> 1. JSON 里**键必须用双引号** `"name"`，单引号 `'name'` 不是合法 JSON。
> 2. `true` / `false` / `null` 都是**小写**；Python 里是 `True` / `False` / `None`。放心，用 `json` 模块转换时它自动帮你处理。

## 🎒 json.dumps：把字典打包成字符串

`dumps` = **d**ump-**s**tring，把档案内容装进档案袋——**把 Python 对象变成 JSON 字符串**。装袋时可以提一个要求：**`ensure_ascii=False`**，让中文原样保留，别被转成 `\uXXXX` 火星文。

```python
import json

player = {"name": "小明", "level": 5, "score": 92}
s = json.dumps(player, ensure_ascii=False)
print(s)          # {"name": "小明", "level": 5, "score": 92}
print(type(s))    # <class 'str'>  已经变成字符串了

# 对比：不加 ensure_ascii=False，中文会变成 \uXXXX 转义符
print(json.dumps({"name": "小明"}))                     # {"name": "\u5c0f\u660e"}
print(json.dumps({"name": "小明"}, ensure_ascii=False))  # {"name": "小明"}
```

> ⚠️ 新手最容易踩的坑：
> 1. **忘了 `ensure_ascii=False` 不会报错**，但中文全变成 `\uXXXX`，存进文件后看着怀疑人生——**含中文一律加上 `ensure_ascii=False`**。
> 2. `dumps` 返回的是**字符串**，别拿它当字典直接 `d["name"]` 取值（那是拆包之后的事）。

## 📥 json.loads：把字符串拆包回字典

`loads` = **load-string**，档案袋送到目的地后**拆包**：**把 JSON 字符串还原成 Python 对象**（字典、列表……）。拆包之后又能用 `[键]` 取值了。记个口诀：**带 s 的是字符串版**（`dumps` / `loads`），不带 s 的是文件版（`dump` / `load`）。

```python
import json

# 收到一份 JSON 文本（比如文件里读出来的、网络上传过来的）
s = '{"name": "小明", "level": 5, "score": 92}'

data = json.loads(s)        # 拆包：JSON 字符串 → 字典
print(data["name"])         # 小明
print(data["score"])        # 92
print(type(data))           # <class 'dict'>  变回字典了
```

> ⚠️ 新手最容易踩的坑：
> 1. `loads` 要的是 **JSON 字符串**；把 Python 字典直接塞给它会报错（`TypeError: the JSON object must be str`）。
> 2. 拆包后是字典/列表等普通 Python 对象，**用 `[键]` 或 `[下标]` 取值**——别再用 `json` 的写法。
