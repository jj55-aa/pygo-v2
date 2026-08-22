# 增删改查实现——让档案袋活起来

## 📥 添加与查找：把档案卡放进袋子，再按学号翻出来

班主任的柜子里有一只**档案袋**：每个学生一张档案卡，上面写着学号、姓名、分数。这只档案袋在 Python 里就是一个**列表** `students`，每条记录是 `[学号, 姓名, 分数]`。

**添加（增）** = 把新档案卡放进袋子：用 `students.append([学号, 姓名, 分数])`，新记录自动排在末尾，像把卡塞进袋子最上面。

**查找（查）** = 按学号把卡翻出来：一张张翻（for 遍历），比对学号（`stu[0] == 要找的学号`），翻到就打印、用 `break` 停手——学号是唯一的，找到一张就够了。

```python
students = []                       # 空档案袋
students.append([1, '张三', 90])    # 添加：装进第一张卡
students.append([2, '李四', 80])    # 添加：再装一张

find_id = 2                         # 要查的学号
for stu in students:                # 一张张翻
    if stu[0] == find_id:           # 学号对上了？
        print(stu[1], stu[2])       # 输出：李四 80
        break                       # 找到了，停
```

> ⚠️ 新手最容易踩的坑：
> 1. **学号必须唯一**：添加前先遍历查一遍，学号重复就要提示，否则后面"按学号查找"会翻出两张卡，删也不知道删哪张。
> 2. `input()` 拿到的是**字符串**：要 `int(input())` 转成数字再比，否则 `"1" == 1` 永远是 False——明明有这个人，却永远"查无此人"。
> 3. 找不到时要有**兜底提示**：for 循环走完都没 break，就是没找到，别让程序静悄悄结束。

## ✏️ 修改：先找到那张卡，再把分数改掉

改分就像老师改作业：**先找到那张档案卡，再动笔改**。代码里分两步：① 遍历找到学号匹配的那条记录；② 直接改这条记录里的分数。

关键区别：`for stu in students:` 里的 `stu` **就是列表里那条记录本身**，不是复印件！所以 `stu[2] += 5` 改的是列表里的真实数据，修改直接生效（写回）。

```python
students = [[1, '张三', 90], [2, '李四', 80]]

for stu in students:            # ① 先找
    if stu[0] == 2:             #    学号是 2？
        stu[2] += 5             # ② 后改：这条记录本身分数 +5（写回生效）
        break                   #    改完就停
print(students)   # [[1, '张三', 90], [2, '李四', 85]]
```

> ⚠️ 新手最容易踩的坑：
> 1. **改了临时变量没写回**：写 `stu = [2, '李四', 85]` 只是让循环变量 stu 指向一个新列表，`students` 里的数据纹丝不动——要改就改 `stu[2]` 这类**下标**，改的才是列表里的元素。
> 2. **改错下标**：记录是 `[学号, 姓名, 分数]`，分数是 `stu[2]`；改 `stu[1]` 会把名字改掉，改 `stu[0]` 会把学号改掉。
> 3. 找到后记得 `break`：虽然学号唯一，但不 break 会继续白翻，万一数据里有重复学号还会改错人。

## 🗑️ 删除：把不要的档案卡抽出来扔掉

删除有两条路：

- **按位置删**：先找到目标记录的下标 `i`，再 `del students[i]`——像抽掉袋子里第 i 张卡，后面的卡自动往前补。
- **按条件删（列表重建）**：用列表推导式把"学号不等于目标"的卡全部留下，等于目标的自然被"过滤"掉。

```python
students = [[1, '张三', 90], [2, '李四', 80], [3, '王五', 70]]

# 方式一：找到下标，del 删除
for i in range(len(students)):
    if students[i][0] == 2:      # 找到学号 2 的下标
        del students[i]          # 抽掉这张卡
        break

# 方式二：列表重建，留下学号 != 3 的
students = [stu for stu in students if stu[0] != 3]

print(students)   # [[1, '张三', 90]]
```

> ⚠️ 新手最容易踩的坑：
> 1. **边遍历边删会跳元素**：`for stu in students:` 里直接 `students.remove(stu)`，删除后后面的卡自动前移、循环却继续往前走，会**跳过下一张卡**——改用 `del students[i]` + `break`，或直接列表重建。
> 2. `remove()` 按**内容**删：`students.remove([1, '张三', 90])` 要写整条记录，而且两条一模一样的记录会误删；按学号删用下标/条件更稳。
> 3. 删除前**先确认找到了**：找不到就提示"查无此人"，别让程序假装删成功了。

## 🧩 完整系统：把增删改查打包成菜单

光有零散操作还不够——班主任要的是一个**一站式服务台**：打开程序就显示菜单，输入数字选操作，用完还能退出。做法是把每个功能封装成**函数**，再用 `while True` 主循环反复接待。

```python
students = []   # 全局档案袋：[[学号, 姓名, 分数], ...]

def add_student():          # 增
    sid = int(input('学号：'))
    name = input('姓名：')
    score = int(input('分数：'))
    students.append([sid, name, score])
    print('添加成功')

def show_all():             # 查全部
    for stu in students:
        print(stu[0], stu[1], stu[2])

def find_student():         # 按学号查
    sid = int(input('要查的学号：'))
    for stu in students:
        if stu[0] == sid:
            print(stu[1], stu[2])
            return
    print('查无此人')

def update_score():         # 改：找到后加 5 分
    sid = int(input('要加分的学号：'))
    for stu in students:
        if stu[0] == sid:
            stu[2] += 5
            print('加分成功')
            return
    print('查无此人')

def delete_student():       # 删
    sid = int(input('要删除的学号：'))
    for i in range(len(students)):
        if students[i][0] == sid:
            del students[i]
            print('删除成功')
            return
    print('查无此人')

while True:                 # 主循环：菜单服务台
    cmd = int(input('1添加 2查看 3查找 4加分 5删除 0退出：'))
    if cmd == 1:
        add_student()
    elif cmd == 2:
        show_all()
    elif cmd == 3:
        find_student()
    elif cmd == 4:
        update_score()
    elif cmd == 5:
        delete_student()
    elif cmd == 0:
        break
```

> ⚠️ 新手最容易踩的坑：
> 1. **函数里 `students = [...]` 会报 UnboundLocalError**：函数内重新赋值会把它当成局部变量；只想"改列表内容"（append / del / 改下标）就不用管，想**换一个新列表**才需要声明 `global students`。
> 2. 主循环**别忘了 `break`**：`cmd == 0` 时 break 才能退出循环，否则程序永远转圈。
> 3. 菜单输入 `int(input(...))` 也要转换；选菜单、选学号都先想清楚"这里是数字还是字符串"。
