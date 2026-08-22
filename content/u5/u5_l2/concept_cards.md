# 面向对象进阶——魔法生物家族

## 🔁 继承：儿子继承爸爸的家产

档案室里，小火龙和冰晶兽都有名字、都有魔法威力，都会施法。不偷懒的写法是把公共代码写两遍：每个类里都来一份 `__init__` 和 `attack`。写两遍还行，写十遍呢？哪天想把公共逻辑改一改，要改十处——改漏一处就是 bug。

**继承**就是来解决这个问题的：把公共的部分抽到**父类**（也叫基类）里，让**子类**自动拥有，不用重复写。

```python
class Person:                      # 父类（也叫基类）
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def eat(self):
        print(f'{self.name}在吃饭')

class Student(Person):             # 子类：括号里写父类
    def __init__(self, name, age, score):
        super().__init__(name, age)    # 公共属性交给父类初始化
        self.score = score

    def study(self):
        print(f'{self.name}在学习')

s = Student('小明', 18, 95)
s.eat()        # 输出：小明在吃饭（父类的方法，子类直接用）
s.study()      # 输出：小明在学习（子类自己的新方法）
print(s.score) # 输出：95
```

三个要点：

- **继承语法**：`class Student(Person)`，括号里写父类名
- **`super().__init__(name, age)`**：调用父类的初始化方法，把公共属性（name、age）交给父类处理。子类的 `__init__` 只管自己多出来的部分（score）
- 子类**自动拥有**父类的属性和方法（`s.eat()` 能用），还能**添加**自己的（`study`）

> ⚠️ 大坑：子类重写了 `__init__` 却忘了写 `super().__init__(...)`，父类的属性就没初始化，一访问 `s.name` 就报 `AttributeError`。

## ✏️ 方法重写：把继承来的方法改成自己的版本

父类的方法不一定适合每个子类。子类可以定义**同名方法**把父类的版本**覆盖**掉，这叫**重写（override）**。重写之后，调用时执行的是子类的版本；没重写的部分，继续用父类的。

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        print('……')

class Dog(Animal):
    def speak(self):              # 重写父类的方法
        print(f'{self.name}：汪汪！')

class Cat(Animal):
    def speak(self):
        print(f'{self.name}：喵喵！')

d = Dog('旺财')
c = Cat('咪咪')
d.speak()    # 输出：旺财：汪汪！
c.speak()    # 输出：咪咪：喵喵！
```

所有动物都会"叫"（这个能力继承自 Animal），但怎么叫，各写各的（重写）。子类可以只重写一部分方法，没重写的继续沿用父类。

## 🔒 封装：把机密数据藏进保险柜

**封装**：把不想让别人乱动的数据**藏起来**，只暴露几个安全的操作入口。就像银行——钱锁在保险柜里，存取都走柜台窗口，窗口里还有规则（不能存负数、不能透支）。

用**两个下划线开头**（`__money`）声明的属性叫**私有属性**，类的外面不能直接访问：

```python
class BankAccount:
    def __init__(self, name, money):
        self.name = name
        self.__money = money       # 私有属性：存款

    def save(self, amount):
        if amount > 0:
            self.__money += amount
            print(f'存入 {amount} 元')

    def draw(self, amount):
        if 0 < amount <= self.__money:
            self.__money -= amount
            print(f'取出 {amount} 元')
        else:
            print('余额不足！')

    def show(self):
        print(f'{self.name}的余额：{self.__money} 元')

acc = BankAccount('小明', 1000)
acc.save(500)     # 输出：存入 500 元
acc.draw(2000)    # 输出：余额不足！
acc.draw(300)     # 输出：取出 300 元
acc.show()        # 输出：小明的余额：1200 元
# print(acc.__money)   # ❌ AttributeError：类外面碰不到私有属性
```

外面的人想改余额，只能走 `save` / `draw` 两个"窗口"，而且窗口里还能加规则。这就是封装的价值：**藏起细节，守住规则**。

> 💡 Python 的私有是"约定"不是"铁律"：`__money` 其实会被改名为 `_BankAccount__money` 藏起来，硬要访问还是能访问到——但没人会那么干，大家都守规矩。想给私有属性开一个**受控的读取口**，可以在类里写一个公开方法（比如 `get_power()`）直接返回它。

## 🎭 多态：同一个口令，不同的咒语

**多态**：调用**同一个方法名**，不同的对象做出不同的事。上面 Dog / Cat 的 `speak` 就是多态。它的威力在于——**写代码时不需要知道对象具体是谁**：

```python
class Animal:
    def speak(self):
        return '……'

class Dog(Animal):
    def speak(self):
        return '汪汪'

class Cat(Animal):
    def speak(self):
        return '喵喵'

class Duck(Animal):
    def speak(self):
        return '嘎嘎'

def zoo_speak(animal):
    print(animal.speak())     # 不管来的是什么动物，喊它叫就行

zoo_speak(Dog())    # 输出：汪汪
zoo_speak(Cat())    # 输出：喵喵
zoo_speak(Duck())   # 输出：嘎嘎
```

`zoo_speak` 根本不关心传进来的是谁，只要它会 `speak` 就行。以后想加个 `Pig` 类？新增一个类、重写 `speak`，这个函数一行都不用改。**扩展新功能 = 新增类，不碰旧代码**——这就是多态最实在的好处。

继承、封装、多态各司其职：**继承复用代码、封装保护数据、多态方便扩展**。有了这三板斧，魔法学院档案室里的生物家族谱就能越写越大了！