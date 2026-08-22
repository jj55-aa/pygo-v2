# 独立挑战——教务楼的结业大考

## 🏫 综合系统全景：把所有功能串成一条流水线

教务楼的班主任桌上贴着一张菜单：**1 添加 2 删除 3 修改 4 查询 5 退出**。整个学生管理系统就像前台接待——用户点哪个菜单，就调哪个"办事员"（函数）；所有学生的数据统一存在一个"档案柜"（字典）里，**学号当钥匙，学生信息当内容**。

**学生管理系统 = 一个字典（存数据）+ 几个函数（增/删/改/查）+ 一个主循环（菜单驱动）**。数据只存一份，所有功能都操作这同一个字典，功能之间互不干扰、又串成一条完整的流水线：

```python
students = {}                       # 档案柜：学号 → 学生信息

def add_student(sid, name, score):
    students[sid] = {"name": name, "score": score}   # 添加：直接往柜里放

def delete_student(sid):
    if sid in students:             # 先查后删：找不到不崩
        del students[sid]
        print("已删除", sid)
    else:
        print("查无此人")

def show_all():
    for sid, info in students.items():
        print(sid, info["name"], info["score"])       # 查询：整个柜子翻一遍

add_student("1001", "小明", 92)
add_student("1002", "小红", 55)
show_all()                          # 1001 小明 92 / 1002 小红 55
delete_student("1001")
show_all()                          # 只剩 1002 小红 55
```

> ⚠️ 易错点：删除/修改前**先 `if sid in students` 判断**再动手，直接 `del students[sid]` 遇到不存在的学号会崩（KeyError）；修改分数要写 `students[sid]["score"] = 新分数`，别不小心整条覆盖成新记录；主循环要留**退出条件**，不然程序永远停不下来。

## 📊 排序与统计：sorted 自动排序 + 平均分

班主任要看"谁考得好"，不会一页页翻档案柜，而是把成绩单**按分数排好序**，再**算出平均分**——`sorted` / `list.sort()` 就是那个"自动排序器"，`sum()` / `len()` 就是那个"计算器"。

**`sorted(列表, key=取分数的函数, reverse=True)` 返回按分数从高到低的新列表（不改原列表）；平均分 = 总分 ÷ 人数 = `sum(分数) / len(分数)`**。`key=lambda s: s[2]` 的意思是"拿每条记录的第 3 个元素（分数）当排序依据"，`reverse=True` 才是降序：

```python
records = [["1001", "小明", 92], ["1002", "小刚", 78], ["1003", "小红", 55]]

records.sort(key=lambda s: s[2], reverse=True)   # 按分数从高到低（原地排序）
for sid, name, score in records:
    print(name, score)                           # 小明 92 / 小刚 78 / 小红 55

avg = sum(s[2] for s in records) / len(records)  # 平均分 = 总分 ÷ 人数
print("平均分 %.1f" % avg)                        # 平均分 75.0
```

> ⚠️ 易错点：`sorted` **不写 key** 会按整个记录排（拿"小明"这种字符串和数字比，结果全乱）；忘写 `reverse=True` 就变成升序；平均分要用**浮点除法 `/`**，写成整除 `//` 会把小数直接丢掉；保留 1 位小数用 `"%.1f" % 平均分`。

## 🛡️ 异常兜底：输入非法与「查无此人」

前台遇到客人报一个不存在的学号，不会摔本子，而是礼貌地说"查无此人"；遇到分数填了字母，也不会当场崩溃，而是提醒"分数必须是数字"。程序也一样：**把可能出错的代码包进 try/except，接住异常给人话提示，程序不崩**。

**`int("abc")` 转不动字母会抛 ValueError；`students["不存在的学号"]` 直接取会抛 KeyError**。两个防御姿势：① 输入非法 → try/except 接住；② 查无此人 → 先 `if sid in students` 判断，或干脆用函数挡住：

```python
def set_score(sid, score):
    if sid not in students:          # 查无此人：先判断再动手
        return "查无此人"
    try:
        score = int(score)           # 非法输入：接住 ValueError
    except ValueError:
        return "分数必须是数字"
    students[sid]["score"] = score
    return "修改成功"

print(set_score("1001", "95"))       # 修改成功
print(set_score("9999", "95"))       # 查无此人
print(set_score("1001", "abc"))      # 分数必须是数字
```

> ⚠️ 易错点：except 要写**具体异常类型**（`except ValueError`），别写裸 `except:` 把别的 bug 也悄悄吞掉；`int(score)` 必须放在 try 里才接得住；查无此人要**先判断再改**——不判断就 `students[sid] = ...` 会把一条新记录凭空"造"出来，班主任查账时对不上。

## 🧪 挑战与验收：自己测、找 bug

交卷前要像班主任那样"亲自验收"：把系统当成新来的实习生，**把每个菜单都点一遍**——正常数据、边界数据（0 分、60 分、100 分）、非法数据（字母、负数）全都要试。程序说"通过"，自己还要**手算一遍核对**，别只相信代码。

**验收清单**：① 添加 → 查询能看见；② 删除 → 真的消失；③ 修改 → 分数真的变了；④ 查不到 → 友好提示不崩；⑤ 排序 → 从高到低；⑥ 平均分 → 手算核对一致；⑦ 不及格 → 60 分到底是及格还是不及格。

```python
# 自己当「验收员」：每个功能都亲手试一遍，再核对结果
students = {"1001": {"name": "小明", "score": 92}}

def try_delete(sid):
    if sid in students:
        del students[sid]
        return "删除成功"
    return "查无此人"

print(try_delete("1001"))            # 删除成功（正常数据）
print(try_delete("9999"))            # 查无此人（不存在的学号）
print(len(students))                 # 0：亲眼看它真的被删掉了
```

> ⚠️ 易错点：只测"正常情况"不算测完——**边界和非法输入才是 bug 高发区**（60 分及格线、0 分、100 分、字母、负数、不存在的学号）；改完代码要**重新跑一遍旧测试**，确认没把原来的功能改坏；平均分这类结果**先手算一遍再对答案**，别让代码自己"自我感觉良好"。
