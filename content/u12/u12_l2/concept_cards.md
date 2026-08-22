# 增删改查——地堡档案的四把钥匙

## 🗂️ 增 INSERT：往地堡放新档案

地堡档案室的柜子里码着一排排档案。要**新增一份档案**，管理员的做法是：抽出一个新文件夹，填好信息，塞进柜子。SQL 里这一步叫 **INSERT（增）**——往表里**新增一行**。

给 players 表（上一课建好的档案表）加一名玩家「剑圣」，等级 50：

- `INSERT INTO players VALUES (3, '剑圣', 50);` —— 按列顺序填值，新增一行
- 一次插多行：多组值用逗号隔开：`INSERT INTO players VALUES (4, '奶茶猫', 32), (5, '熬夜冠军', 18);`
- 也可以只给部分列赋值：`INSERT INTO players (name, level) VALUES ('剑圣', 50);`

几个要点：

- `INSERT INTO 表名 VALUES (...)`：`INTO` 后面写**进哪张表**，`VALUES` 后面按列顺序填值
- **字符串必须加引号**（`'剑圣'`），数字不用（`50`）——和 Python 写字符串一个习惯
- 想让 id 自动递增？那是建表时的 `AUTO_INCREMENT` 干的活（本课了解即可，建表时才用），INSERT 时不用写

> ⚠️ 新手最容易踩的坑：
> 1. 漏写 `INTO`：`INSERT players VALUES (...)` 是语法错误，`INSERT INTO` 是连体兄弟
> 2. 字符串裸写：`VALUES (剑圣, 50)` 会被当成列名/变量，必须加引号
> 3. **判题环境没有数据库**（Pyodide 没有 sqlite3、也没有 MySQL）——SQL 的语义照讲，动手题全部用 Python 的 **dict 模拟表**：键 = 主键 id，值 = 一行档案 `[姓名, 等级]`。「新增」在 dict 里就是给新键赋值：

```python
# dict 模拟 players 表：键是 id，值是 [姓名, 等级]
archives = {
    1: ["剑圣", 50],
    2: ["奶茶猫", 32],
}
# 模拟 INSERT：新增 id=3 的档案
archives[3] = ["熬夜冠军", 18]
print(archives)
```

## 🔍 查 SELECT：取档案

想找某份档案？管理员不会把柜子搬过来，而是按条件**翻出那一份**递给你——不改动任何档案，只是"看"。SQL 里这一步叫 **SELECT（查）**，是四兄弟里最常用的。

- `SELECT * FROM players;` —— 查整张表（`*` = 所有列）
- `SELECT name, level FROM players;` —— 只挑部分列
- `SELECT name, level FROM players WHERE id = 1;` —— **挑列 + 挑行**：只查 id=1 那行的姓名和等级

记忆骨架：**`SELECT 列 FROM 表 WHERE 条件`** —— 选哪些列、从哪张表、满足什么条件，三句话构成查询。

SELECT 是"只读"操作：它把结果递给你，**表里的数据一动不动**。dict 模拟里的"查"就是"看键在不在、把值取出来"：

```python
# dict 模拟 SELECT：查 id=1 的档案
archives = {1: ["剑圣", 50], 2: ["奶茶猫", 32]}
target = 1
if target in archives:               # 键在 → 查得到
    print(archives[target][0], archives[target][1])   # 剑圣 50
else:
    print("查无此档案")
```

> ⚠️ 新手最容易踩的坑：
> 1. **SQL 里判断相等用单个等号 `=`，不是 Python 的 `==`**！`WHERE id == 1` 在 SQL 里是语法错误
> 2. `WHERE` 后面跟的是"筛选条件"，不写 WHERE = 查整张表（查是全表没问题，但改和删可不行，见下两张卡）
> 3. dict 模拟里判断"键在不在"用 `in`：`if target in archives:`，别用 `archives[target]` 直接取——键不存在会抛 `KeyError`

## ✏️ 改 UPDATE：改档案，必须带 WHERE！

管理员发现剑圣升到 51 级了，要把档案里的等级改掉——这一步叫 **UPDATE（改）**：只改**数据**，柜子（表结构）不动。

- `UPDATE players SET level = 51 WHERE id = 1;` —— 把 id=1 那行的等级改成 51
- `UPDATE players SET level = 51, gold = 100 WHERE name = '剑圣';` —— 一次改多列，逗号隔开
- `UPDATE players SET level = level + 1 WHERE id = 1;` —— 在原值基础上 +1，思路和 Python 的 `+=` 一样

要点：`SET` 后面写"**改成什么**"，`WHERE` 后面写"**改哪些行**"。

dict 模拟里没有 SET/WHERE 关键字，套路是**循环 + if 找到目标行再改**——那个 `if` 就是 WHERE 的化身：

```python
# dict 模拟 UPDATE：id=1 的档案等级 +1
archives = {1: ["剑圣", 50], 2: ["奶茶猫", 32]}
for key in archives:                  # 模拟 WHERE id = 1
    if key == 1:
        archives[key][1] += 1         # 等级 +1（archives[key][1] 是等级）
print(archives)
```

> ⚠️ 新手最容易踩的坑：
> 1. **史上第一坑：忘写 WHERE！** `UPDATE players SET level = 1;` 会把**所有档案的等级全改成 1**——UPDATE 不带 WHERE = 全表遭殃。写 UPDATE 之前先问自己一句："我的 WHERE 呢？"
> 2. dict 模拟时别写成 `key += 1`——`key` 是循环里的"钥匙"（id），改它不等于改档案内容，要改的是 `archives[key]` 里的值
> 3. `level = level + 1` 是"原值 +1"，不是"改成 1"——后者是 `SET level = 1`

## 🗑️ 删 DELETE：删档案，必须带 WHERE！

某份档案作废了，管理员把它从柜子里抽走扔掉——这一步叫 **DELETE（删）**：删的是**行**（档案），柜子（表结构）还在。

- `DELETE FROM players WHERE id = 2;` —— 只删 id=2 那一行
- `DELETE FROM players;` —— **不带 WHERE：所有行全删光**，只剩一张空表！

要点：`DELETE FROM 表名` 后面接 `WHERE 条件`，条件决定删哪些行。**不带 WHERE = 清空整张表，没有"撤销"按钮**。

dict 模拟里"删"就是删掉那个键（`del`），最后用 `sorted` 按 id 升序盘点：

```python
# dict 模拟 DELETE：删除 id=2 的档案，再按 id 升序盘点
archives = {1: ["剑圣", 50], 2: ["奶茶猫", 32], 3: ["熬夜冠军", 18]}
del archives[2]                        # 模拟 DELETE ... WHERE id = 2
for key in sorted(archives):           # SELECT ... ORDER BY id 的雏形
    print(key, archives[key][0], archives[key][1])
```

| SQL | 作用 | Python（dict 模拟） |
| --- | --- | --- |
| `INSERT INTO players VALUES (...)` | 增一行 | `archives[3] = ["熬夜冠军", 18]` |
| `SELECT ... FROM players WHERE ...` | 查 | `if id in archives:` / 循环遍历 |
| `UPDATE players SET ... WHERE ...` | 改行 | 循环 + `if` 找到目标再改 |
| `DELETE FROM players WHERE ...` | 删行 | `del archives[id]` |

> ⚠️ 新手最容易踩的坑：
> 1. **不带 WHERE 的 DELETE = 全表清空**：`DELETE FROM players;` 会把所有行删光——删前先确认你的 WHERE
> 2. DELETE 删的是"行"，**表结构（列）还在**；想连结构一起删，那是 `DROP TABLE` 的活，更要慎用
> 3. dict 模拟里删键用 `del archives[id]`；如果键不存在，`del` 会抛 `KeyError`——删前可以先 `if id in archives:` 确认
