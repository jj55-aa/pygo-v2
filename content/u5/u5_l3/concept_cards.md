# 面向对象应用——毕业实战：魔法生物对决

## 🎓 需求分析：给魔法生物写「档案」先圈词

院长说：「你要设计的不是一只魔法生物，而是**一套能让魔法生物打起来的系统**。」动手写代码之前，先做**需求分析**——方法简单得像圈重点：把需求描述里的**名词**圈出来（大概率是类或属性），把**动词**圈出来（大概率是方法）。

| 需求里的词 | 角色 |
| --- | --- |
| 魔法生物、小火龙、史莱姆 | 类 |
| 名字、血量、攻击力 | 属性 |
| 攻击、受击、战斗 | 方法 |

一个游戏角色 = **属性（它有什么）+ 方法（它能做什么）**。先圈词再写码，这就是「磨刀不误砍柴工」：

```python
class MagicCreature:
    def __init__(self, name, hp):   # 属性：名字、血量
        self.name = name
        self.hp = hp

    def attack(self):                # 方法：攻击
        return f'{self.name}发动了攻击'

    def is_alive(self):              # 方法：还活着吗
        return self.hp > 0

pet = MagicCreature('小火苗', 50)
print(pet.name)       # 小火苗
print(pet.hp)         # 50
print(pet.attack())   # 小火苗发动了攻击
```

> 💡 记住这个套路：**定义类 → 创建对象 → 给对象发消息（调方法）**。建档案和写游戏，本质是一回事。

## 🐉 继承：魔法生物家族，一招「多态」打天下

三种魔法生物都有名字和血量、都会攻击——公共部分抽一个 `Monster` 父类，小火龙、冰霜史莱姆**继承**它，各自**重写（override）attack**：

```python
class Monster:
    def __init__(self, name, hp):
        self.name = name
        self.hp = hp

    def attack(self):
        return f'{self.name}发动了攻击'

    def is_alive(self):
        return self.hp > 0

class FireDragon(Monster):          # 小火龙继承 Monster
    def attack(self):
        return f'{self.name}喷出火焰，造成 30 点伤害'

class FrostSlime(Monster):          # 冰霜史莱姆继承 Monster
    def attack(self):
        return f'{self.name}用冰霜身体撞击，造成 12 点伤害'

for m in [FireDragon('烈焰', 80), FrostSlime('果冻', 40)]:
    print(m.attack())
# 烈焰喷出火焰，造成 30 点伤害
# 果冻用冰霜身体撞击，造成 12 点伤害
```

同一个 `attack()`，两只生物两种效果——这就是**多态**：调同一个方法名，**谁的对象就执行谁的版本**。以后想加「雷鹰」？再写一个子类就行，其他代码**一行都不用改**。

> ⚠️ 子类重写方法时，**方法名必须和父类一模一样**（包括大小写）。拼错不会报错，只会让「重写」静默失败——调用时悄悄落回父类版本，坑得很！

## ⚔️ 回合制战斗：两个对象互相「发消息」

战斗的本质是**对象协作**：小火龙给史莱姆「发消息」（调用它的受击方法），史莱姆还活着就回敬一拳。用 `while` 循环驱动回合：

```python
class Monster:
    def __init__(self, name, hp, atk):
        self.name = name
        self.hp = hp
        self.atk = atk

    def is_alive(self):
        return self.hp > 0

    def take_hit(self, damage):          # 受击：扣血，且不为负
        self.hp = max(0, self.hp - damage)

    def attack(self, other):             # 攻击：打对方
        print(f'{self.name}攻击{other.name}，造成 {self.atk} 点伤害')
        other.take_hit(self.atk)

def battle(a, b):
    round_no = 1
    while a.is_alive() and b.is_alive():
        print(f'—— 第 {round_no} 回合 ——')
        a.attack(b)                      # a 先出手
        if b.is_alive():                 # b 还活着就反击
            b.attack(a)
        round_no += 1
    print(f'{a.name}获胜！' if a.is_alive() else f'{b.name}获胜！')

battle(Monster('小火龙', 50, 15), Monster('冰霜史莱姆', 40, 10))
# —— 第 1 回合 ——
# 小火龙攻击冰霜史莱姆，造成 15 点伤害
# 冰霜史莱姆攻击小火龙，造成 10 点伤害
# —— 第 2 回合 ——
# 小火龙攻击冰霜史莱姆，造成 15 点伤害
# 冰霜史莱姆攻击小火龙，造成 10 点伤害
# —— 第 3 回合 ——
# 小火龙攻击冰霜史莱姆，造成 15 点伤害
# 小火龙获胜！
```

**每回合的流程**：打印回合号 → a 攻击 → b 存活则反击 → 回合 +1，直到一方血量归零——这就是回合制战斗的标准套路。

> ⚠️ `while` 的条件是「双方都存活」，所以**循环里必须有人扣血**，否则永远打不完（死循环）。细心看：`take_hit` 里用 `max(0, ...)` 把血量钳在 0，扣成负数游戏就穿帮了。

## 🛡️ 血量守门员：私有属性 + @property 守护血量

血量是角色的命根子，不能被随便改成负数。用**私有属性** `__hp` 藏起来，再用 `@property` 当「守门员」：任何赋值都要过 setter 这一关，`max(0, value)` 把负数挡在门外。再定义 `__str__`，让 `print(对象)` 显示得漂漂亮亮：

```python
class Wizard:
    def __init__(self, name, hp, wand):
        self.name = name
        self.__hp = hp                  # 私有属性：外面碰不到
        self.wand = wand

    @property
    def hp(self):                       # 读血量：走 getter
        return self.__hp

    @hp.setter
    def hp(self, value):                # 改血量：走 setter
        self.__hp = max(0, value)       # 血量永远不会低于 0

    def __str__(self):                  # 自我介绍
        return f'{self.name}（手持{self.wand}，血量 {self.hp}）'

w = Wizard('阿莉', 100, '橡木魔杖')
print(w)          # 阿莉（手持橡木魔杖，血量 100）
w.hp = 30         # 正常扣血
print(w.hp)       # 30
w.hp = -5         # 想改成负数？
print(w.hp)       # 0 —— 守门员拦住了
```

> 💡 `__str__` 是**魔术方法**：定义了它，`print(对象)` 就显示你写的文字，而不是一长串内存地址。规则集中在一处、血条永远健康——这就是**封装**的威力。
