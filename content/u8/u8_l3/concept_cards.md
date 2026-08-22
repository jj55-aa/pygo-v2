# pip 与第三方库——把百宝箱变大

## 🎁 百宝箱之外，还有一座大仓库：PyPI

百宝箱（Python 自带的标准库）里装的是出厂就配好的工具：`math`、`random`、`time`……打开箱子（`import`）就能用。

但世界上的问题远不止这些：想发网络请求？想分析表格数据？想画图？Python 的百宝箱之外，还藏着一座**全世界开发者共享的大仓库**——**PyPI**（Python Package Index，Python 官方包仓库）。里面躺着几十万个**别人做好、打包好**的工具，统称**第三方库**。

**第三方库 = 别人做好的工具**：你不需要重新造轮子，用一条命令（`pip install 库名`）就能把它"搬"到自己电脑上，然后像用标准库一样 import 它。

有名的第三方库：

- `numpy` —— 科学计算（数组、矩阵运算）
- `pandas` —— 数据分析（表格处理）
- `requests` —— 网络请求（爬虫必备）

这三个全都是要 **pip 装来** 的第三方库，Python 出厂时并没有它们。

```python
# 标准库：出厂自带，import 就能用
import math
print("标准库 math 直接能用：", math.pi)

# 第三方库：没装就 import 会怎样？取消注释下面一行试试
# import requests   # 报 ModuleNotFoundError：requests 没安装
```

> ⚠️ 新手最容易踩的坑：
> 1. **标准库 vs 第三方库**：标准库随 Python 一起安装、自带；第三方库要先用 `pip install` 装，装完才能 import。
> 2. **别把 PyPI 和 pip 搞混**：PyPI 是"放工具的仓库"（几十万个包），pip 是"搬运工具"（把包从仓库搬进你电脑）。

## 🔧 装库三步走：装 → 用 → 查

装第三方库就像去 PyPI 大仓库"取货"，一共三步：

| 步骤 | 做什么 | 命令/代码 |
| --- | --- | --- |
| ① 装 | 把库下载安装到电脑 | `pip install 库名` |
| ② 用 | 在代码里导入并使用 | `import 库名` |
| ③ 查 | 查看电脑上已装了哪些库 | `pip list` |

**第一步：装。** 打开命令行（Windows 按 `Win + R`，输入 `cmd` 回车），敲 `pip install requests`。看到 `Successfully installed requests` 就说明装好了。

**第二步：用。** 回到代码里 import，用法和标准库一模一样：`import requests`，然后调它提供的函数干活。

**第三步：查。** 再敲 `pip list`，屏幕上列出所有已安装的库——里面能看到 `requests`，就说明装成功了。

```python
# 判题环境里没有第三方库，下面用标准库演示「装完怎么用」：
# 真实的命令是在命令行里敲的：
#   ① 装：pip install 库名
#   ③ 查：pip list
import math
print("import 成功，工具拿来就用：", math.sqrt(16))
```

> ⚠️ 新手最容易踩的坑：
> 1. **装的名字 ≠ import 的名字**：pip 装的是**库名**，import 用的可能同名（`pip install requests` → `import requests`），也可能不同名（`pip install Pillow` → `import PIL`）。装完先查一下文档怎么 import。
> 2. **装完新库要"重启"**：如果终端在你安装之前就开着，它可能还"不认识"新库——**重新打开终端**（或重启解释器）再 import。
> 3. **判题环境里没有第三方库**：本课的练习只能用标准库。想用 requests？下一站就会带你认识它。

## 🚨 装库失败怎么办？先读最后两行

装库偶尔会失败。别慌！报错信息大多长这样：满屏红字 + 最后几行关键信息。**先看最后两行**，再对照这张"急诊表"：

| 症状（报错长什么样） | 常见原因 | 解决办法 |
| --- | --- | --- |
| 提示 `'pip' 不是内部或外部命令` | pip 没配进环境变量（PATH） | 装 Python 时勾选 **Add Python to PATH**，或到控制面板修复安装 |
| 满屏红字，最后提示 pip 版本过旧 | pip 太老，装不动新库 | 升级 pip：`python -m pip install --upgrade pip` |
| 下载到一半超时：`ReadTimeout` | 网络不稳，默认连国外官方源太慢 | 换**国内镜像源**：`pip install 库名 -i https://pypi.tuna.tsinghua.edu.cn/simple` |
| 报错里有 `Permission denied` | 权限不足 | 用**管理员身份**打开终端再装 |
| 报错里有版本冲突（`X requires Y` 之类） | 不同库要求的版本打架 | 用**虚拟环境**隔离项目（见下一张卡） |

**国内镜像源** = 放在国内的 PyPI"分店"（清华、阿里、豆瓣），下载更快更稳。用法：在安装命令最后加 `-i` 加镜像网址。

```python
# 装库失败自查清单（遇到报错对着查）：
#   □ 提示 'pip' 不是内部或外部命令 → 检查 PATH / Add Python to PATH
#   □ 满屏红字 + pip 版本过旧       → python -m pip install --upgrade pip
#   □ 下载超时 ReadTimeout          → pip install 库名 -i 国内镜像网址
#   □ 报错含 Permission denied      → 管理员身份打开终端
#   □ 版本冲突                      → 用虚拟环境隔离
print("报错不可怕：先读最后两行，再对照清单排查！")
```

> ⚠️ 新手最容易踩的坑：
> 1. **报错要看最后两行**，别被满屏红字吓住——关键信息（原因和解决方案）都藏在结尾。
> 2. **镜像源是 `-i` + 网址**，网址是 `https://` 开头。换源能治"网络慢/超时"，但治不了"pip 没装进 PATH"——先对症，再下药。

## 🏠 虚拟环境：每个项目一个独立小房间

场景：项目 A 用 `pandas 2.0`，项目 B 还在用 `pandas 1.x`。如果所有项目**共用同一套** Python 和第三方库（全局环境），升级 A 的 pandas，B 就崩了；降回 1.x，A 又崩了——版本打架，左右为难。

**虚拟环境（virtual environment）= 给每个项目开一间独立的小房间**：房间里有一套只属于这个项目的 Python 解释器、pip 和第三方库。A 在 A 房装 pandas 2.0，B 在 B 房装 1.x，互不干扰。

创建并进入虚拟环境（命令行里执行）：

- `python -m venv venv` —— 创建一间叫 `venv` 的房间
- `venv\Scripts\activate` —— 走进这间房（Windows）
- `pip install pandas` —— 在这间房里单独装库

> 提示：很多 IDE（如 PyCharm）新建项目时会自动帮你建好虚拟环境，不用手敲命令。

```python
# 虚拟环境 = 每间房各装各的工具（真实命令在命令行里执行）：
#   python -m venv venv     # 创建独立小房间
#   venv\Scripts\activate   # 走进这间房（Windows）
#   pip install pandas      # 在这间房里单独装库
#
# 判题环境里只有一个标准库"房间"，练习只用它：
import math
print("本房间可用工具：", math.pi)
```

> ⚠️ 新手最容易踩的坑：
> 1. **每个虚拟环境都是"从零开始"**：换一个新虚拟环境，之前在别的环境里 pip 装的库不会自动跟过来——要在新环境里重新 `pip install`。
> 2. **虚拟环境里的库不影响外面**：在虚拟环境里装的库，全局环境和其他项目都看不到；反过来也一样。这正是它"防版本打架"的原理。
