# 时间与随机——让程序知道"现在"，也会"掷骰子"

## 🕐 datetime 认识时间：现在几点了？

想象你走进「百宝箱」，墙上挂着一座会自己走动的魔法时钟。你想知道"现在几点了"，不用自己算，抬头问时钟就行。

Python 里也一样：`datetime` 是标准库里（`from datetime import datetime`）的一个**类**，代表"某年某月某日某时某分某秒"这一个时刻；而 `datetime.now()` 就是那座魔法时钟——**调用它，就拿到"当前这一刻"的 datetime 对象**。

拿到时刻之后，再用**字段**把年月日拆出来：

- `now.year` → 年份（整数，如 2026）
- `now.month` → 月份（整数，1~12）
- `now.day` → 日（整数）
- 还有 `now.hour` / `now.minute` / `now.second` 可以拆时分秒

```python
from datetime import datetime

now = datetime.now()        # 报时！拿到"现在"这个时刻
print(now)                  # 例如：2026-05-20 14:30:05.123456
print(now.year, "年")       # 2026 年
print(now.month, "月")      # 5 月
print(now.day, "日")        # 20 日
```

> ⚠️ 新手最容易踩的坑：
> 1. `datetime` 是类，用之前**必须先导入**：`from datetime import datetime`。忘了 import 会报 `NameError: name 'datetime' is not defined`。
> 2. `now()` 是**方法调用，要带括号**！写 `datetime.now` 不带括号，拿到的是"方法本身"，不是时间。
> 3. 字段是**整数**：`now.year` 是 2026，不能和字符串直接拼接——`"今年是" + now.year` 会报 `TypeError`，要先用 `str(now.year)` 转成字符串。

## 📅 构造与比较固定日期：自己圈日历

除了"问时钟"，你还可以**自己写一个日期**——像在日历上亲手圈出某一天，完全不依赖"现在几点"。这在写题、做测试时特别有用：结果确定，随时可复现。

`datetime(年, 月, 日)` 直接构造一个固定时刻，还能带上时分秒：

- `datetime(2026, 1, 1)` → 2026 年 1 月 1 日 0 点
- `datetime(2026, 3, 15, 12, 30)` → 2026 年 3 月 15 日 12 点 30 分

两个 datetime 可以**直接比较**：`>` 看谁更晚，`==` 看是不是同一天；还能**相减**得到时间差，再用 `.days` 取相差的天数：

```python
from datetime import datetime

d1 = datetime(2026, 1, 1)    # 元旦
d2 = datetime(2026, 3, 15)   # 消费者权益日

print(d2 > d1)               # True：3 月 15 日在 1 月 1 日之后
print((d2 - d1).days)        # 73：相差 73 天
print(d2.month)              # 3
```

> ⚠️ 新手最容易踩的坑：
> 1. **月份从 1 开始**：`datetime(2026, 1, 1)` 是 1 月。写 `datetime(2026, 0, 1)` 或 `datetime(2026, 13, 1)` 会直接报 `ValueError`。
> 2. 参数顺序固定：**年、月、日**（、时、分、秒）。把顺序写反不会报错，但结果完全不对。
> 3. 比较/相减的两边**都必须是 datetime 对象**：`datetime(2026, 1, 1) > "2026-01-01"` 会报 `TypeError`，字符串不能和 datetime 比大小。

## 🎲 random 三兄弟：randint / choice / shuffle

百宝箱里躺着一颗"随机骰子"——随机这件事，Python 里交给 `random` 模块。它有三位好兄弟，各管一摊：

| 函数 | 作用 | 例子 |
| --- | --- | --- |
| `random.randint(a, b)` | 在 a~b 之间随机取一个**整数** | `random.randint(1, 6)` 掷骰子 |
| `random.choice(列表)` | 从列表里**随机挑一个**元素 | 抽签、抽奖 |
| `random.shuffle(列表)` | 把列表**原地打乱** | 洗牌 |

```python
import random

print(random.randint(1, 6))      # 掷骰子：1~6 之间的随机整数
lucky = random.choice(["锦鲤", "海豚", "章鱼"])   # 随机挑一个
print("今日幸运动物：", lucky)

cards = ["A", "2", "3", "4"]
random.shuffle(cards)            # 原地洗牌
print(cards)                     # 顺序已经打乱
```

> ⚠️ 新手最容易踩的坑：
> 1. `randint(1, 3)` 是**闭区间**：1、2、3 都可能。别把它当成"含头不含尾"的 `range`。
> 2. `choice` 要传**列表/元组**。传字符串 `random.choice("abc")` 会随机挑一个**字符**（a/b/c），而不是一个"单词"。
> 3. `shuffle` 是**原地**打乱并返回 `None`：写 `cards = random.shuffle(cards)` 会让 cards 变成 None，后面全乱套。

## 🎛️ seed：给随机一本"剧本"

随机看起来像魔术，其实背后是一本**随机数手册**：里面按顺序写着一长串数字。`random.seed(42)` 就是"翻到第 42 页从头读"——**同一个种子 + 同样的调用顺序 = 每次读到一模一样的数字**。

- 不设种子：每次运行结果都不同（系统默认拿当前时间当种子）
- 设了种子：结果**可复现**——调试时错误能重演，判题时输出稳定

什么时候用随机？抽签抽奖、掷骰子游戏、模拟试验（比如抛一万次硬币统计正反面）——凡是"每次结果不一样才有趣"的地方，都交给 random。

```python
import random

random.seed(42)                  # 固定种子：让下面的随机"有剧本"
print(random.randint(1, 6))      # 每次运行都打印同一个数
print(random.choice(["苹果", "香蕉", "橘子"]))
```

> ⚠️ 新手最容易踩的坑：
> 1. `seed()` 必须放在随机操作**之前**，而且同一段随机流程里设一次就够——放在随机之后调用就不起作用了。
> 2. 同样的 seed，**调用顺序不同**，结果也不同：它控制的是整条"随机序列"的起点，不只第一个数。
> 3. 换一个 seed 值（比如 `random.seed(7)`），结果就完全不同。想复现结果，seed 和调用顺序都要保持不变。
