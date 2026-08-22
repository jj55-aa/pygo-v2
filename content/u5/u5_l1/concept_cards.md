# 面向对象——给魔法生物建档案

## 🏠 类与对象：图纸和房子

魔法学院的档案室里，几百只魔法生物等着建档：每只都有名字、所属元素、拿手的魔法。按以前学的老方法（面向过程），你得把「名字」「元素」传来传去，还要记住哪份数据配哪个操作——**数据（档案）和操作（施法）是分开的**，单子一多准乱套。

**面向对象编程（OOP）**换了个思路：把数据和操作**打包在一起**。一只小火龙自己知道自己是小火龙、自己会喷火——代码更像现实世界：**谁的东西，谁来管**。

OOP 世界有两个核心概念，记住这个比喻：

- **类（class）**：一张**图纸**。图纸上画了房子有几个房间、几扇门——但它不是房子。
- **对象（object）**：按图纸**盖出来的房子**。同一张图纸可以盖很多栋，每栋都是独立的。

```python
class House:      # 这是图纸（类）
    pass

h1 = House()      # 按图纸盖一栋（创建对象）
h2 = House()      # 再盖一栋
print(type(h1))   # 输出：<class '__main__.House'>
print(h1 is h2)   # 输出：False，两栋房子是独立的
```

> 💡 一句话记住：**类是抽象的概念，对象是具体的实例**。"魔法生物"是一个类，"档案室里那只叫小火龙的"就是一个对象。

## ✍️ 定义类与方法：给对象装「技能」

用 `class` 加类名定义类。注意命名规矩：**类名用大驼峰命名法**（每个单词首字母大写，如 `MagicalCreature`、`FireDragon`），和变量的下划线命名法（`student_name`）区分开。

写在类里面的函数叫**方法（method）**——就是这类对象"会做的事"。**方法的第一个参数必须是 `self`**，代表"对象自己"：

```python
class Student:
    """学生类"""

    def study(self, course):     # self 代表对象自己
        print(f'正在学习{course}')

    def play(self):
        print('正在打游戏')

stu = Student()          # 创建对象：类名 + 括号
stu.study('Python')      # 输出：正在学习Python
stu.play()               # 输出：正在打游戏
```

> ⚠️ 三个新手常踩的坑：
> 1. 类名首字母大写（`Student`），方法名小写（`study`），别混着来
> 2. 类里的方法，第一个参数必须是 `self`。忘了写，调用时会报"参数数量不对"
> 3. `stu = Student`（忘了括号）只是把"类本身"存进变量，并没有创建对象！这时的 `stu` 是类，不是学生——**`类名()` 才是创建对象**

## 📋 __init__：创建对象时自动填档案

现在的对象空有技能（方法），没有档案（数据）。想让每只魔法生物有自己的**属性**（名字、元素），就要靠 `__init__` 方法——它是创建对象时**自动执行**的初始化方法，负责给对象"填档案"。名字里的 `init` 就是 initialize（初始化）的意思：

```python
class MagicalCreature:
    def __init__(self, name, element):   # 创建对象时自动执行
        self.name = name                  # 给这个对象贴上"名字"标签
        self.element = element            # 再贴上"元素"标签

    def cast(self):
        print(f'{self.name}释放了{self.element}魔法！')

dragon = MagicalCreature('小火龙', '火')   # 括号里的参数会传给 __init__
deer = MagicalCreature('冰晶鹿', '冰')
print(dragon.name, dragon.element)         # 输出：小火龙 火
dragon.cast()                              # 输出：小火龙释放了火魔法！
```

`self.name = name` 的意思是：把传入的 `name` 存成"这个对象自己的 name 属性"。**每个对象都有一份自己的属性**，互相不干扰——小火龙的档案是"火"，冰晶鹿的档案是"冰"，谁也不会串。

> ⚠️ `__init__` 是**两个下划线**夹着 `init`。写成 `_init_` 或 `__int__` 都不会被自动执行，对象就变成"三无产品"（没有属性）。

## 🔍 方法里全靠 self：对象的记忆与协作

方法里想访问自己的属性，用 `self.属性名`；想调用自己的另一个方法，用 `self.方法名()`。**`self` 就是"我"**——我的档案、我的技能：

```python
class Cat:
    def __init__(self, name):
        self.name = name
        self.hunger = 50     # 饱腹度 0~100
        self.happy = 50      # 心情 0~100

    def feed(self):
        self.hunger = min(100, self.hunger + 30)
        print(f'{self.name}吃饱了！饱腹度 {self.hunger}')

    def play(self):
        self.happy = min(100, self.happy + 20)
        self.hunger = max(0, self.hunger - 10)
        print(f'{self.name}玩得很开心！心情 {self.happy}')

    def show(self):
        print(f'{self.name}：饱腹 {self.hunger}，心情 {self.happy}')

cat = Cat('咪咪')
cat.show()     # 输出：咪咪：饱腹 50，心情 50
cat.feed()     # 输出：咪咪吃饱了！饱腹度 80
cat.play()     # 输出：咪咪玩得很开心！心情 70
cat.show()     # 输出：咪咪：饱腹 70，心情 70
```

看出面向对象的好处了吗？咪咪的数据（饱腹、心情）和动作（喂食、玩耍）绑在了一起。想再养一只猫？`Cat('小黑')` 就行，代码一行都不用改——**一套图纸，想盖几栋盖几栋**。魔法学院想给几百只生物建档？一个类 + 一行 `类名(...)`，搞定！