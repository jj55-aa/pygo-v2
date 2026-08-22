# 进阶查询——数据地堡的结业大考

## 🔍 WHERE 筛选：只挑达标的档案

地堡管理员处理一整柜档案时，从不把几百份全搬出来——他会先问一句：「只要等级 ≥ 40 的精英档案」。**WHERE 就是这句提问**：给查询加筛选条件，只返回满足条件的行，其余全部跳过。

**WHERE 筛选** = `SELECT 列 FROM 表 WHERE 条件`——「选哪些列、从哪张表、满足什么条件」，三句话构成查询的骨架。条件里用比较符 `>` `<` `>=` `<=`（还有判断相等的 `=`、不等的 `!=`），多个条件用 `AND`（并且）/ `OR`（或者）组合。

```python
# 判题环境没有数据库：用列表推导的 if 模拟 WHERE
players = [
    {"name": "剑圣", "level": 50},
    {"name": "奶茶猫", "level": 32},
    {"name": "摸鱼大师", "level": 41},
]
elite = [p for p in players if p["level"] >= 40]   # 相当于 WHERE level >= 40
for p in elite:
    print(p["name"], p["level"])
```

SQL 里写成：

- `SELECT name, level FROM players WHERE level >= 40;`（挑出等级 ≥ 40 的档案）
- `SELECT name FROM players WHERE level >= 40 AND gold > 10000;`（两个条件都要满足）

> ⚠️ 易错点：SQL 判断**相等只写一个等号** `=`（`WHERE level = 40`），不是 Python 的 `==`——写 `==` 直接语法错误；数字值不加引号，只有文本值才加单引号（`WHERE name = '剑圣'`）。判题环境（Pyodide）没装数据库，筛选一律用列表推导的 `if` 模拟。

## 📊 ORDER BY 排序：档案排排站

筛选完的档案还是乱序的。管理员想按金币从多到少排好再看——**ORDER BY 就是排序指令**：让查询结果按某一列的值排列。

**ORDER BY 列名 [ASC | DESC]**：`ASC` 升序（小 → 大），`DESC` 降序（大 → 小）。**不写方向默认 ASC**。多列排序 `ORDER BY a, b` 表示先按 a 排，a 相同再按 b 排。

```python
# sorted 模拟 ORDER BY：reverse=True 相当于 DESC
players = [
    {"name": "剑圣", "gold": 99999},
    {"name": "奶茶猫", "gold": 5200},
    {"name": "熬夜冠军", "gold": 300},
]
ranked = sorted(players, key=lambda p: p["gold"], reverse=True)  # 降序
for p in ranked:
    print(p["name"], p["gold"])
```

SQL 里写成：

- `SELECT name, gold FROM players ORDER BY gold DESC;`（按金币从高到低）
- `SELECT name, gold FROM players ORDER BY gold ASC;`（按金币从低到高，`ASC` 不写也是默认）

> ⚠️ 易错点：**ORDER BY 默认是 ASC 升序**——想从高到低必须写 `DESC`（Python 里对应 `reverse=True`）；ORDER BY 只改变查询结果的**展示顺序**，不会动数据库里存的原始数据；多列排序先写主排序列。

## 🔢 LIMIT 与聚合：限量取件与一数总结

地堡有两类常见查询：**「只要最强的 2 名」**和**「总共有多少人、平均等级多少」**。前者是限量，后者是聚合。

- **LIMIT n** = 只返回前 n 行，**放在整个查询的最后**。
- **聚合函数** = 把一堆行压成**一个数**：`COUNT(*)` 数行数、`SUM(列)` 求和、`AVG(列)` 求平均。

```python
players = [
    {"name": "剑圣", "level": 50, "gold": 99999},
    {"name": "奶茶猫", "level": 32, "gold": 5200},
    {"name": "摸鱼大师", "level": 41, "gold": 88000},
]
top2 = sorted(players, key=lambda p: p["gold"], reverse=True)[:2]  # 相当于 LIMIT 2
for p in top2:
    print(p["name"], p["gold"])
print("共", len(players), "人，平均等级", sum(p["level"] for p in players) / len(players))
```

SQL 里写成：

- `SELECT name, gold FROM players ORDER BY gold DESC LIMIT 2;`（取金币前 2 名）
- `SELECT COUNT(*), AVG(level) FROM players;`（总人数 + 平均等级）

> ⚠️ 易错点：**LIMIT 永远放查询最后**（顺序是 SELECT → FROM → WHERE → ORDER BY → LIMIT）；聚合函数的**结果和普通列不能混着选**（`SELECT name, COUNT(*) ...` 没意义——name 是多行的、COUNT 是单个数）；判题环境里用 `[:2]` 切片模拟 LIMIT、`len()` 模拟 COUNT、`sum()/len()` 模拟 AVG。

## 🐍 综合查询与 Python 接入：把查询装进程序

真正的项目里，SQL 不是人手动敲进终端的，而是**程序发命令、数据库执行、再把结果拿回程序用**。Python 接数据库是固定三步：**连接（connect）→ 执行（execute）→ 取结果（fetch）**，用完要关闭。

`SELECT ... WHERE ... ORDER BY ... LIMIT ...` 可以**串成一条综合查询**：先筛选、再排序、最后限量——顺序不能乱。

```python
# 综合查询：筛选 + 排序 + 限量（判题环境用 Python 模拟）
players = [
    {"name": "剑圣", "level": 50, "gold": 99999},
    {"name": "奶茶猫", "level": 32, "gold": 5200},
    {"name": "摸鱼大师", "level": 41, "gold": 88000},
]
top = sorted([p for p in players if p["level"] >= 40],
             key=lambda p: p["gold"], reverse=True)[:2]
for p in top:
    print(p["name"], p["gold"])
```

SQL 里写成一条：

`SELECT name, gold FROM players WHERE level >= 40 ORDER BY gold DESC LIMIT 2;`

真实代码里 Python 接入数据库的套路（环境里没有 MySQL，跟着思路看）：`conn = pymysql.connect(host=..., user=..., password=..., database=...)` → `cursor = conn.cursor()` → `cursor.execute("SELECT ...")` → `rows = cursor.fetchall()` → `cursor.close(); conn.close()`；改数据的操作后还要 `conn.commit()` 提交。

> ⚠️ 易错点：综合查询里**各子句顺序固定**：WHERE → ORDER BY → LIMIT，写反会语法错误；SQL 字符串值用**单引号**、判断相等用单个 `=`；Python 接数据库**改完数据必须 `commit()`** 才落库；判题环境（Pyodide）没有数据库，一切查询用「列表推导 + `sorted` + 切片」模拟——这套 Python 写法就是 SQL 语义的翻版。
