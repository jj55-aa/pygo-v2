// ============================================================
// PyGo V2 —— 游戏化状态机（A 等级称号 + 连胜 + C 每日战报辅助）
//   A 等级称号：XP → level + 称号（代码萌芽→脚本新手→循环行者→函数工匠→对象大师→项目猎人→架构师）
//   连胜 Streak：每天首次获得 XP 时累计（昨日学过 +1，中断则重置 1）
//   C 每日战报：每日目标达成由 app.js 检查并触发 daily-goal-hit 事件
//   B 冒险剧情：内容 story 已承载；单元通关事件由 app.js 触发 unit-unlocked
// ============================================================
window.PyGoGamify = (function () {
  'use strict';

  var TITLES = ['代码萌芽', '脚本新手', '循环行者', '函数工匠', '对象大师', '项目猎人', '架构师'];
  var XP_PER_LEVEL = 100;

  function db() { return window.PyGoDB || { get: function () { return null; }, set: function () {} }; }

  function todayStr(offsetDays) {
    var d = new Date();
    if (offsetDays) d.setDate(d.getDate() + offsetDays);
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  // XP → 等级/称号/本级进度
  function levelInfo(xp) {
    xp = xp || 0;
    var level = Math.floor(xp / XP_PER_LEVEL) + 1;
    var idx = Math.min(level - 1, TITLES.length - 1);
    var cur = xp % XP_PER_LEVEL;
    return {
      level: level,
      title: TITLES[idx],
      levelProgress: cur / XP_PER_LEVEL,
      xpInLevel: cur,
      xpForNext: XP_PER_LEVEL
    };
  }

  function getStreakInfo() {
    try { return db().get('streakInfo') || { streak: 0, lastDate: '' }; }
    catch (e) { return { streak: 0, lastDate: '' }; }
  }

  function getStreak() { return getStreakInfo().streak || 0; }

  // 每天首次获得 XP 时调用：更新连胜
  function touchStreak() {
    var info = getStreakInfo();
    var today = todayStr(0);
    if (info.lastDate === today) return info.streak || 0;
    var yesterday = todayStr(-1);
    info.streak = (info.lastDate === yesterday) ? (info.streak || 0) + 1 : 1;
    info.lastDate = today;
    db().set('streakInfo', info);
    return info.streak;
  }


  // ---------- 全通关统计快照（等级/称号/联赛/徽章/连胜日历） ----------
  // 由 app.js refreshStats 调用；纯函数，双端可用。
  var LEAGUE_TIERS = ['青铜','白银','黄金','铂金','钻石','大师','王者'];
  var LEAGUE_THRESH = [100,300,700,1500,3000,6000];
  function leagueTier(xp) {
    var idx = 0;
    for (var i = 0; i < LEAGUE_THRESH.length; i++) { if (xp >= LEAGUE_THRESH[i]) idx = i + 1; }
    return LEAGUE_TIERS[idx] || '王者';
  }
  function statsSnapshot(o) {
    o = o || {};
    var xp = Number(o.xp) || 0;
    var streak = Number(o.streak) || 0;
    var done = Number(o.completedCount) || 0;
    var info = levelInfo(xp);
    // 联赛段位（本地联赛，按 XP 段位）
    var tier = leagueTier(xp);
    var league = { tier: tier, rank: 1, weekXp: Math.min(1200, xp) };
    // 徽章墙：按里程碑解锁，最多展示 6 个
    var badges = [];
    if (done >= 1) badges.push('初出茅庐');
    if (streak >= 7) badges.push('连胜7天');
    if (done >= 6) badges.push('单元通关');
    if (xp >= 500) badges.push('渐入佳境');
    if (done >= 30) badges.push('勤学不辍');
    if (done >= 87) badges.push('课程全通');
    if (info.title === '架构师') badges.push('最高称号');
    // 连胜日历：最近 30 天，从 streak 起往前点亮
    var cal = [];
    for (var i = 0; i < 30; i++) cal.push(streak >= 30 || i >= 30 - streak);
    return { level: info.level, title: info.title, levelProgress: info.levelProgress, xpInLevel: info.xpInLevel, xpForNext: info.xpForNext, league: league, badges: badges, streakCalendar: cal };
  }

  return {
    TITLES: TITLES,
    XP_PER_LEVEL: XP_PER_LEVEL,
    levelInfo: levelInfo,
    touchStreak: touchStreak,
    getStreak: getStreak,
    todayStr: todayStr,
    statsSnapshot: statsSnapshot
  };
})();