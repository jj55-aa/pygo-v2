# 独立挑战——桌面工坊的结业大考

## 🛠️ 工具全景：外壳 + 引擎，界面是壳、逻辑是核

工坊里最顺手的螺丝刀，手柄再漂亮也只是外壳，真正干活的是那根钢芯。桌面小工具也一样：**你看到的窗口、按钮、输入框是外壳（界面），真正算数、判断、出结果的是引擎（核心逻辑）**。两者分工清楚，工具才「能用」：

| 部分 | 工坊比喻 | 桌面工具里的角色 |
| --- | --- | --- |
| 外壳（界面） | 手柄、按钮、刻度 | Tkinter 的窗口、`Entry` 输入框、`Button`、`Label` |
| 引擎（核心逻辑） | 钢芯、机芯 | 读输入 → 校验 → 计算 → 输出的那串代码 |

在 Pyodide 判题环境里没有 Tkinter 窗口，但**引擎可以脱离外壳单独验证**——把「从输入框拿数据」换成「从 `sys.stdin` 读数据」，核心逻辑一模一样。工坊结业考题，考的正是这颗引擎：

```python
import sys

def calc_bmi(height, weight):
    """引擎：输入身高（米）、体重（kg），返回 BMI 数值"""
    return weight / (height * height)   # BMI = 体重 ÷ 身高²

text = sys.stdin.read()                 # 外壳换成判题输入：一行身高、一行体重
parts = text.split()
height = float(parts[0])
weight = float(parts[1])
print("BMI=%.1f" % calc_bmi(height, weight))
```

> ⚠️ 易错点：把全部逻辑都堆进界面回调（按钮的点击函数）里，外壳一换程序就废——**逻辑写成独立的函数/代码段，外壳只是「递数据、收结果」的传话人**；另外 `Entry` 输入框里拿到的**永远是字符串**，不 `float()` 就做除法，`"70" / 2.89` 直接 TypeError 崩给你看。

## 🔍 输入校验：非法输入先说「不」

用户是随意的人：身高可能填成 `abc`、`-1.7`、`0`，体重可能空着。一个「能用」的工具，在计算之前先**校验**——像安检口，先查票再放行：

**输入校验** = 计算之前检查输入合不合法（是不是数字、范围对不对），不合法就给一句人话提示、**不参与计算**。

```python
text = sys.stdin.read()
parts = text.split()
height = float(parts[0])     # "1.75" → 1.75；"abc" 在这里会抛 ValueError
weight = float(parts[1])

if height <= 0:              # 身高 ≤ 0 是非法输入，先拦住
    print("输入有误")
else:
    print("BMI=%.1f" % (weight / (height * height)))
```

> ⚠️ 易错点：**校验要放在计算之前**——不校验就拿负数身高去算，会算出个负数 BMI 还一本正经地打印出来；`float()` 转不了非数字会抛 **ValueError**（这属于「输入格式错」，可以用 try/except 兜，见第四张卡）；`float(parts[0])` 里 `parts` 取不到第 0 个元素时（没输入）抛的是 **IndexError**，两种异常都要想到。

## 🧮 计算与输出：把数字翻译成人话

引擎算出 `22.86` 这种数字，用户看不懂，要**翻译成有意义的结论**。计算与输出 = 公式算数值 + **多分支判断（if/elif/else）把数值分档** + 格式化输出：

```python
bmi = weight / (height * height)     # 计算：公式
if bmi < 18.5:                       # 多分支：翻译成评价
    level = "偏瘦"
elif bmi < 24:
    level = "正常"
elif bmi < 28:
    level = "偏胖"
else:
    level = "肥胖"
print("BMI=%.1f，评价=%s" % (bmi, level))   # 友好输出：保留 1 位小数
```

> ⚠️ 易错点：**`height * height` 就是身高²，别漏平方**（漏了算出来是「体重 ÷ 身高」，数值大得离谱）；分档的**边界**要写对：`<18.5 偏瘦、<24 正常、<28 偏胖、≥28 肥胖`——`elif bmi < 24` 承接的是「不小于 18.5 且小于 24」，边界值 18.5 和 24 要落在正确的档；输出用 `%.1f` 保留 1 位小数（`22.857` 会显示成 `22.9`），占位符 `%s`/`%.1f` 和后面括号里的变量**个数要一一对应**。

## 🛡️ 异常兜底与验收：程序永远不崩

校验管得住「值不合理」，管不住「格式炸了」：`float("abc")` 抛 **ValueError**、没输入时 `parts[0]` 抛 **IndexError**。u6 学的防御式编程在收尾课登场——**用 try/except 接住格式类异常**，打印「输入有误」，程序不崩：

```python
import sys

text = sys.stdin.read()
try:
    parts = text.split()
    height = float(parts[0])
    weight = float(parts[1])
    if height <= 0:
        print("输入有误")                     # 校验：值不合理
    else:
        bmi = weight / (height * height)
        if bmi < 18.5:
            level = "偏瘦"
        elif bmi < 24:
            level = "正常"
        elif bmi < 28:
            level = "偏胖"
        else:
            level = "肥胖"
        print("BMI=%.1f，评价=%s" % (bmi, level))
except (ValueError, IndexError):
    print("输入有误")                         # 兜底：格式炸了也不崩
```

**验收** = 拿真实输入把程序跑一遍：每个分档来一条（偏瘦 / 正常 / 偏胖 / 肥胖）+ 非法输入来一条（非数字 / 身高 ≤ 0），全部输出符合预期才算「能用」。

> ⚠️ 易错点：except 要写**具体异常类型** `except (ValueError, IndexError)`，别写裸 `except:` 把别的 bug 也悄悄吞掉；**「校验」和「兜底」各管一摊**——`if height <= 0` 管值不合理，`try/except` 管格式炸了，别把校验也扔进 except 里绕成一团；验收别只测正常档——**非法输入不测，等于没验收**。
