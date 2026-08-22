# 反爬与应对——学会和网站守卫打交道

## 🛡️ 网站凭什么拦你？——反爬三件套

蜘蛛峡谷深处的「宝库塔」门口站着守卫。守卫为什么要盘查？不是刁难你，而是怕来者不善：要么是想把塔里珍贵的资料整个搬走（偷数据），要么是来搞破坏的（恶意流量把塔挤垮）。

网站也一样。**反爬（Anti-Crawler）是网站的自卫手段：保护自己的数据不被恶意抓取，也保护服务器不被海量请求压垮。** 常见的反爬手段就是守卫的"三件套"：

- **UA 检测**：守卫看你的"名片"（User-Agent）。正常浏览器都自带名片，而裸奔的爬虫要么没有名片，要么名片写着 `Python-requests/2.31`——一看就不是人
- **频率限制**：守卫数你一分钟来几次。来得太频繁 → 判定是机器人 → 封掉你的 IP
- **cookie 校验**：守卫查你有没有"登记凭证"。没凭证的请求，直接拒之门外
- **进阶手段**：验证码——专门拦自动化程序，人眼看得懂，机器（暂时）看不懂

守卫的三道检查是一起生效的，用代码模拟一下：

```python
# 模拟峡谷守卫的三道检查
def check_visitor(headers, times, cookie):
    # ① UA 检测：你是谁？
    if "Mozilla" not in headers.get("User-Agent", ""):
        return "拦截：没有浏览器身份（UA）"
    # ② 频率限制：你是不是来得太勤？
    if times > 5:
        return "拦截：访问太频繁，封 IP！"
    # ③ cookie 校验：你有没有登记凭证？
    if not cookie:
        return "拦截：没有登录凭证（cookie）"
    return "放行：正经游客，请进！"

headers = {"User-Agent": "Mozilla/5.0"}
print(check_visitor(headers, 3, "session=abc"))
print(check_visitor(headers, 99, "session=abc"))
```

> ⚠️ 新手最容易踩的坑：
> 1. 反爬不是"网站看你不顺眼"，而是网站的自卫——别把服务器当免费矿场，抓太狠真的会被封 IP。
> 2. 三道检查是**叠加**的：UA 伪装得再好，频率太快照样被拦下。

## 🎭 伪装 UA：递一张"浏览器名片"

守卫盘问"你是谁"，正经游客都会掏出身份证——浏览器自动带的 User-Agent。可很多爬虫是"裸奔"的：不带 UA，或者 UA 明晃晃写着 `Python-requests`，守卫一眼识破。

**伪装 UA = 在请求头（headers）里声明一个正常浏览器的 User-Agent，让服务器以为你是浏览器用户。**

headers（请求头）是请求的"附加说明"，里面有很多字段：`User-Agent`（我是谁）、`Accept`（我想要什么格式）……爬虫在发请求时带上 headers，就是在给服务器递名片。

```python
# 请求头（headers）就是爬虫递给网站的"名片"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "text/html",
}

# 峡谷守卫检查名片上的 UA
if "Mozilla" in headers["User-Agent"]:
    print("UA 像浏览器，放行！")
else:
    print("UA 不对劲，拦截！")
```

> ⚠️ 新手最容易踩的坑：
> 1. UA 是"你是谁"的名片，不是随便填个字母就能过——服务器会检测 UA 里有没有浏览器的特征（比如 `Mozilla`）。
> 2. headers 是字典：键名是 `"User-Agent"`（带连字符），写成 `"user_agent"`（下划线）等于没带名片，服务器根本查不到。

## 🍪 cookie：登录凭证

宝库塔有个"会员区"，只有登记过的游客能进。你第一次登记（登录）时，守卫发给你一张**通行证**——cookie。下次再来，掏出通行证就不用重新登记了。

**cookie 是服务器发给浏览器的一串 key=value 文本（比如 `session=abc123; theme=dark`），用来记录登录状态等信息，浏览器每次请求都会带上它。** HTTP 是无状态的——服务器本来不知道"你是谁"，cookie 就是让服务器认人的凭证。

爬虫想访问"登录后才能看"的内容（个人中心、订单记录……），就得在请求里携带正确的 cookie；有些网站还会专门做 cookie 校验——没带 cookie 的请求直接被当成爬虫。

```python
# cookie 是一串 key=value 文本，用 ";" 分隔多组
cookie = "session=abc123; theme=dark"

# 解析：按 ";" 拆成多个键值对，再按 "=" 切出键和值
for part in cookie.split(";"):
    key, value = part.strip().split("=", 1)
    if key == "session":
        print("登录凭证 session =", value)
```

> ⚠️ 新手最容易踩的坑：
> 1. cookie 是"登录凭证"：不带 cookie 就去抓登录后的页面，服务器会把你当陌生人拒之门外。
> 2. cookie 会过期：今天登录取的 cookie，明天可能就失效了——持久 cookie 都有有效期。
> 3. 解析 cookie 记得 `strip()` 掉空格：`" theme=dark".strip()` 才是 `"theme=dark"`，直接 `split("=")` 会拿到带空格的键。

## 🐢 礼貌爬虫：限速、robots.txt 与边界

守卫最后叮嘱你：塔里的资料可以看，但**一次别搬太多，也别闯别人家的后院**。爬虫也一样——技术再强，也要讲规矩：

- **限速**：两次请求之间休息一下（`time.sleep`），别把服务器压垮——请求太频繁会被封 IP
- **robots.txt**：网站的"访客须知"，放在网站根目录（如 `https://example.com/robots.txt`），声明哪些路径允许爬、哪些禁止爬。正经爬虫先读它再动手
- **边界**：只抓公开、允许抓的数据。涉及个人隐私、需要登录/付费才能看的内容，别碰——越界爬取可能踩法律红线

```python
import time

# 礼貌爬虫三件事：限速、看 robots.txt、不越界
print("先读访客须知 robots.txt……")
for page in range(1, 4):
    print("抓取第", page, "页……")
    time.sleep(0.5)   # 每页休息 0.5 秒，别把服务器压垮
print("抓完收工，服务器很轻松")
```

> ⚠️ 新手最容易踩的坑：
> 1. robots.txt 是"访客须知"，不是强制协议——但遵守它是爬虫的基本礼仪；它只对守规矩的爬虫有效。
> 2. "能爬到"不等于"该爬"：技术上能绕过验证码、能拿到登录后数据，也不代表可以——**越界抓取可能违法**，别爬不该爬的。
