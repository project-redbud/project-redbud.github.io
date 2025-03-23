import{_ as l,r as n,c as d,a as e,d as t,b as a,w as c,e as s,o as r}from"./app-k4uPTofk.js";const i={},u=s('<p>本文档介绍 <code>FunGame</code> 的项目架构、数据交互的底层思想与设计逻辑。</p><h2 id="通信机制" tabindex="-1"><a class="header-anchor" href="#通信机制"><span>通信机制</span></a></h2><p><code>FunGame-Server</code> 项目将构建两个服务器端程序：<code>FunGameServer</code> 和 <code>FunGameWebAPI</code>。</p><p><code>FunGameServer</code> 提供 <code>Socket</code> 和 <code>WebSocket</code> 的通信服务，但只允许开启其中一种，不能同时开启。</p><p><code>FunGameWebAPI</code> 提供 <code>WebSocket</code> 和 <code>RESTful API</code> 共存的服务，共享数据处理。</p><h3 id="_1-socket-websocket" tabindex="-1"><a class="header-anchor" href="#_1-socket-websocket"><span>1. Socket / WebSocket</span></a></h3><p><code>FunGame-Desktop</code> 是 FunGame 项目最初开发的桌面客户端，使用了传统的 <code>Socket</code> 进行与 <code>FunGameServer</code> 的连接。Socket 通过持久的 TCP 连接，实现了低延迟、高效的数据传输，适合实时交互的游戏逻辑。</p><ul><li><strong>适用场景</strong>：桌面客户端应用、实时回合对战、低延迟数据同步。</li><li><strong>特点</strong>：基于 TCP 的长连接，能够保持持续的连接状态，适用于对网络延迟敏感的场景。</li></ul><p>为了实现跨平台的兼容性，FunGame 引入了 <code>WebSocket</code> 通信模式。WebSocket 是一种轻量、支持双向通信的协议，适合浏览器和移动端应用。</p><ul><li><strong>FunGameServer 中的 WebSocket</strong>：适用于桌面客户端转向跨平台应用时的通信需求，保证实时数据同步。</li><li><strong>FunGameWebAPI 中的 WebSocket</strong>：与 <code>RESTful API</code> 并行存在，用于实时更新、推送数据和处理快速交互。</li></ul><p>随着游戏向多平台扩展，<code>WebSocket</code> 将作为首选维护模式。它不仅支持跨平台，还能满足实时通信的需求，尤其在 Web 浏览器和移动设备上有广泛应用。</p><h3 id="_2-restful-api" tabindex="-1"><a class="header-anchor" href="#_2-restful-api"><span>2. RESTful API</span></a></h3><p>RESTful API 是 FunGame 中处理非实时数据交互的核心机制之一。它通过标准的 HTTP 请求与服务器通信，适合需要较高可靠性但实时性要求较低的场景，如用户登录、数据查询和报告生成等。</p><ul><li><p><strong>无状态连接</strong>：与 Socket 不同，RESTful API 不维护持续连接，采用无状态的请求响应模式。每次请求都独立于之前的连接。</p></li><li><p><strong>基于 JWT 的身份认证</strong>：为了保持客户端与服务器的交互安全，RESTful API 使用 <strong>JWT（JSON Web Token）</strong> 进行身份认证。客户端通过带有有效令牌的 HTTP 请求与服务器通信，并在令牌过期前刷新，从而实现安全且持久的通信。</p></li><li><p><strong>游戏数据的共享和集成</strong>：RESTful API 提供了一些无需认证的公共接口，适合外部应用引用 FunGame 的公开数据。例如，外部应用可以通过这些接口获取游戏的排行榜、物品库存等非敏感信息。</p></li></ul><h2 id="数据结构" tabindex="-1"><a class="header-anchor" href="#数据结构"><span>数据结构</span></a></h2><h3 id="_1-socketobject" tabindex="-1"><a class="header-anchor" href="#_1-socketobject"><span>1. SocketObject</span></a></h3>',16),h=e("h3",{id:"_2-payloadmodel",tabindex:"-1"},[e("a",{class:"header-anchor",href:"#_2-payloadmodel"},[e("span",null,"2. PayloadModel")])],-1),p=e("h2",{id:"数据传输",tabindex:"-1"},[e("a",{class:"header-anchor",href:"#数据传输"},[e("span",null,"数据传输")])],-1),m=e("h2",{id:"连接服务器",tabindex:"-1"},[e("a",{class:"header-anchor",href:"#连接服务器"},[e("span",null,"连接服务器")])],-1),k=e("h2",{id:"客户端令牌",tabindex:"-1"},[e("a",{class:"header-anchor",href:"#客户端令牌"},[e("span",null,"客户端令牌")])],-1);function _(b,f){const o=n("RouteLink");return r(),d("div",null,[u,e("p",null,[t("参见："),a(o,{to:"/dev/data/socketobject/"},{default:c(()=>[t("SocketObject")]),_:1})]),h,e("p",null,[t("参见："),a(o,{to:"/dev/data/payload/"},{default:c(()=>[t("PayloadModel")]),_:1})]),p,e("p",null,[t("参见："),a(o,{to:"/dev/architecture/transmittal/"},{default:c(()=>[t("数据传输示例")]),_:1})]),m,e("p",null,[t("参见："),a(o,{to:"/dev/architecture/connect/"},{default:c(()=>[t("连接服务器")]),_:1})]),k,e("p",null,[t("参见："),a(o,{to:"/dev/architecture/token/"},{default:c(()=>[t("客户端令牌")]),_:1})])])}const S=l(i,[["render",_],["__file","index.html.vue"]]),v=JSON.parse(`{"path":"/dev/architecture/","title":"架构说明","lang":"en-US","frontmatter":{"title":"架构说明","author":"Project Redbud","createTime":"2024/09/29 18:41:20","permalink":"/dev/architecture/","prev":"/dev/config/","next":"/dev/architecture/connect/","head":[["script",{"id":"check-dark-mode"},";(function () {const um= localStorage.getItem('vuepress-theme-appearance') || 'auto';const sm = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;if (um === 'dark' || (um !== 'light' && sm)) {document.documentElement.classList.add('dark');}})();"],["script",{"id":"check-mac-os"},"document.documentElement.classList.toggle('mac', /Mac|iPhone|iPod|iPad/i.test(navigator.platform))"]]},"headers":[{"level":2,"title":"通信机制","slug":"通信机制","link":"#通信机制","children":[{"level":3,"title":"1. Socket / WebSocket","slug":"_1-socket-websocket","link":"#_1-socket-websocket","children":[]},{"level":3,"title":"2. RESTful API","slug":"_2-restful-api","link":"#_2-restful-api","children":[]}]},{"level":2,"title":"数据结构","slug":"数据结构","link":"#数据结构","children":[{"level":3,"title":"1. SocketObject","slug":"_1-socketobject","link":"#_1-socketobject","children":[]},{"level":3,"title":"2. PayloadModel","slug":"_2-payloadmodel","link":"#_2-payloadmodel","children":[]}]},{"level":2,"title":"数据传输","slug":"数据传输","link":"#数据传输","children":[]},{"level":2,"title":"连接服务器","slug":"连接服务器","link":"#连接服务器","children":[]},{"level":2,"title":"客户端令牌","slug":"客户端令牌","link":"#客户端令牌","children":[]}],"readingTime":{"minutes":2.41,"words":723},"git":{"updatedTime":1742734543000,"contributors":[{"name":"milimoe","email":"mili@wrss.org","commits":1}]},"filePathRelative":"dev/architecture/readme.md","categoryList":[{"id":"e77989","sort":10000,"name":"dev"},{"id":"b9252b","sort":10003,"name":"architecture"}]}`);export{S as comp,v as data};
