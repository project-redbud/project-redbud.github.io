import { viteBundler } from '@vuepress/bundler-vite'
import { defineUserConfig } from 'vuepress'
import { plumeTheme } from 'vuepress-theme-plume'

export default defineUserConfig({
    base: '/docs/',
    title: 'FunGame 开发文档',
    description: 'Project Redbud',
    head: [
        ['link', { rel: 'icon', href: '/favicon.ico' }] // 添加这一行
    ],
    theme: plumeTheme({
        lang: 'zh-CN',
        notes: { link: '/', dir: 'api', notes: [] },
        navbar: [
            {
                text: '首页',
                link: '/',
            },
            {
                text: '账号管理',
                items: [
                    { text: '注册', link: '/api/user/register/' },
                    { text: '登录', link: '/api/user/login/' },
                    { text: '用户中心', link: '/api/user/usercenter/' },
                    { text: '每日签到', link: '/api/user/dailysignin/' },
                ]
            },
            {
                text: '房间管理',
                items: [
                    { text: '房间列表', link: '/api/room/list/' },
                    { text: '创建房间', link: '/api/room/create/' },
                    { text: '加入房间', link: '/api/room/join/' },
                    { text: '退出房间', link: '/api/room/quit/' },
                    { text: '匹配房间', link: '/api/room/match/' },
                    { text: '房间互动', link: '/api/room/interaction/' },
                    { text: '房间设置', link: '/api/room/roomsettings/' },
                ]
            },
            {
                text: '库存管理',
                items: [
                    { text: '商店物品列表', link: '/api/inventory/store/' },
                    { text: '市场物品列表', link: '/api/inventory/market/' },
                    { text: '购买物品', link: '/api/inventory/purchase/' },
                    { text: '出售物品', link: '/api/inventory/sell/' },
                    { text: '修改售价', link: '/api/inventory/updateprice/' },
                    { text: '下架物品', link: '/api/inventory/remove/' },
                    { text: '发起报价', link: '/api/inventory/makeoffer/' },
                    { text: '修改报价', link: '/api/inventory/reviseoffer/' },
                    { text: '回应报价', link: '/api/inventory/respondoffer/' },
                ]
            },
            {
                text: '查询系统',
                items: [
                    { text: '对局历史', link: '/api/query/history/' },
                    { text: '账号数据', link: '/api/query/userstats/' },
                    { text: '游戏数据', link: '/api/query/gamestats/' },
                ]
            },
            {
                text: 'SDK文档',
                items: [
                    {
                        text: '模组',
                        items: [
                            { text: '游戏模组', link: '/dev/module/game/' },
                            { text: '地图模组', link: '/dev/module/map/' },
                            { text: '服务器模组', link: '/dev/module/server/' },
                            { text: '角色模组', link: '/dev/module/character/' },
                            { text: '技能模组', link: '/dev/module/skill/' },
                            { text: '物品模组', link: '/dev/module/item/' },
                        ]
                    },
                    {
                        text: '插件',
                        items: [
                            { text: '服务器插件', link: '/dev/plugin/server/' },
                            { text: '桌面客户端', link: '/dev/plugin/desktop/' },
                            { text: 'Web 端', link: '/dev/plugin/web/' },
                        ]
                    },
                ]
            }
        ],
        aside: 'left',
        docsRepo: 'project-redbud/docs',
        docsBranch: 'master',
        docsDir: 'docs',
        externalLinkIcon: true,
        editLinkText: '在 GitHub 上编辑此页',
        lastUpdated: true,
	    footer: {
            message: "<a href='https://www.gnu.org/licenses/agpl-3.0' target='_blank'>AGPL-3.0 license</a>",
		    copyright: "Copyright © 2014-至今 <a href='https://github.com/project-redbud' target='_blank'>Project Redbud</a>."
        },
        social: [
            { icon: 'github', link: 'https://github.com/project-redbud' }
        ]
    }),
    bundler: viteBundler(),
    plugins: []
})
