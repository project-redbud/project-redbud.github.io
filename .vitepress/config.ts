import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'FunGame 开发文档',
  description: '基于 C#.NET 的回合制游戏开发库 — 规则书 & 开发者文档',
  lang: 'zh-CN',
  base: '/',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],

  themeConfig: {
    // 顶栏导航
    nav: [
      { text: '规则书', link: '/guide/turn-based' },
      { text: '开发者指南', link: '/dev/getting-started' },
      { text: 'API 参考', link: '/api/' },
      {
        text: '相关链接',
        items: [
          { text: 'NuGet 包', link: 'https://www.nuget.org/packages/FunGame.Core' },
          { text: 'GitHub 仓库', link: 'https://github.com/project-redbud/FunGame-Core' },
          { text: 'FunGame Server', link: 'https://github.com/project-redbud/FunGame-Server' },
        ],
      },
    ],

    // 侧边栏
    sidebar: {
      '/guide/': [
        {
          text: '🎮 游戏机制',
          collapsed: false,
          items: [
            { text: '回合制系统', link: '/guide/turn-based' },
            { text: '行动顺序表', link: '/guide/action-queue' },
            { text: '决策点', link: '/guide/decision-points' },
            { text: '伤害计算', link: '/guide/damage' },
            { text: '回合奖励', link: '/guide/round-bonus' },
          ],
        },
        {
          text: '🧙 角色系统',
          collapsed: false,
          items: [
            { text: '角色概述', link: '/guide/characters' },
            { text: '能力值详解', link: '/guide/characters-stats' },
            { text: '核心属性', link: '/guide/characters-attributes' },
            { text: '角色状态', link: '/guide/characters-states' },
            { text: '死亡机制', link: '/guide/characters-death' },
          ],
        },
        {
          text: '⚔️ 技能系统',
          collapsed: false,
          items: [
            { text: '技能概述', link: '/guide/skills' },
            { text: '普通攻击', link: '/guide/skills-normal-attack' },
            { text: '战技 & 被动', link: '/guide/skills-abilities' },
            { text: '爆发技', link: '/guide/skills-ultimate' },
            { text: '魔法', link: '/guide/skills-magic' },
            { text: '资源消耗 & 冷却', link: '/guide/skills-cost' },
          ],
        },
        {
          text: '✨ 特效系统',
          collapsed: false,
          items: [
            { text: '特效概述', link: '/guide/effects' },
            { text: '增益 & 负面状态', link: '/guide/effects-buffs' },
            { text: '控制效果', link: '/guide/effects-control' },
            { text: '驱散系统', link: '/guide/effects-dispel' },
            { text: '免疫 & 豁免', link: '/guide/effects-immunity' },
          ],
        },
        {
          text: '🎒 物品与装备',
          collapsed: false,
          items: [
            { text: '物品系统概述', link: '/guide/items' },
            { text: '预制实体 (卡包/灵魂绑定等)', link: '/guide/prefabricated-entities' },
          ],
        },
      ],

      '/dev/': [
        {
          text: '入门指南',
          items: [
            { text: '快速开始', link: '/dev/getting-started' },
            { text: '完整示例 (Example.cs)', link: '/dev/examples' },
          ],
        },
        {
          text: '基础开发',
          items: [
            { text: '自定义角色', link: '/dev/custom-character' },
            { text: '自定义技能', link: '/dev/custom-skill' },
            { text: '自定义特效', link: '/dev/custom-effect' },
            { text: '自定义物品', link: '/dev/custom-item' },
          ],
        },
        {
          text: 'GamingQueue 事件模式',
          collapsed: false,
          items: [
            { text: '事件总览 (31个事件)', link: '/dev/events-overview' },
            { text: '事件绑定与游戏循环', link: '/dev/events-game-loop' },
            { text: 'SyncAwaiter 同步模式', link: '/dev/events-pattern' },
            { text: 'WPF Demo 完整示例', link: '/dev/events-wpf-demo' },
          ],
        },
        {
          text: '模组开发',
          collapsed: false,
          items: [
            { text: '总览与架构', link: '/dev/module-overview' },
            { text: '客户端模组 (GameModule)', link: '/dev/module-game-module' },
            { text: '服务端模组 (Server)', link: '/dev/module-server' },
            { text: '实体模组 (EntityModule)', link: '/dev/module-registration' },
            { text: '插件系统 (Plugin)', link: '/dev/module-plugin' },
          ],
        },
      ],

      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '概述', link: '/api/' },
            { text: 'EquilibriumConstant', link: '/api/EquilibriumConstant' },
            { text: 'GamingQueue', link: '/api/GamingQueue' },
            { text: 'Character', link: '/api/Character' },
            { text: 'Skill', link: '/api/Skill' },
            { text: 'Effect', link: '/api/Effect' },
          ],
        },
      ],
    },

    // 搜索
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档' },
          modal: { noResultsText: '未找到相关结果', resetButtonTitle: '清除' },
        },
      },
    },

    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/project-redbud/FunGame-Core' },
    ],

    // 页脚
    footer: {
      message: '基于 LGPL-3.0 许可证发布',
      copyright: '© 2023-present Project Redbud and contributors',
    },

    // 编辑链接
    editLink: {
      pattern: 'https://github.com/project-redbud/FunGame-Core/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    // 最后更新时间
    lastUpdated: {
      text: '最后更新',
    },

    // 大纲
    outline: {
      level: [2, 3],
      label: '本页目录',
    },
  },
})
