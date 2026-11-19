// 第一关:翠谷序曲 — 日落草甸浮岛,新手引导
import { grass, dirt, wood } from '../core/Textures.js'

export default {
  id: 1,
  name: '翠谷序曲',
  en: 'Verdant Prelude',
  card: ['#ffd29b', '#7fbf6a'],
  sky: { top: '#6a5fc0', horizon: '#ffb36b', sun: '#ffd9a0', sunDir: [0.55, 0.3, -0.35], sunGlow: 0.42 },
  fog: { color: '#f0b98a', density: 0.006 },
  light: { dir: [45, 55, -35], color: '#ffe8c8', intensity: 1.7, hemi: ['#ffd9b0', '#4c7a3a', 0.4] },
  trail: '#ffd76b',
  bloom: 0.35,
  music: [220, 277.2, 329.6],
  gravity: -24,
  ambient: { count: 110, color: '#ffe08a', size: 0.22, opacity: 0.8, speed: 0.7, drift: 'float', spread: [70, 12, 80], center: [6, 5, 50] },
  theme: {
    topTex: grass(), sideTex: dirt(), topRough: 0.95,
    gem: '#ffd76b', accent: '#ffb35a', accent2: '#57e0a2', pad: '#ff9e4a',
    treeColor: '#4aa03c', islandColor: '#8a5a33',
  },
  spawn: [0, 1.6, 0],
  build(L) {
    L.spawn([0, 1.6, 0])
    L.killY(-16)

    // 起点岛
    L.box({ pos: [0, 0, 0], size: [10, 1, 10], style: { island: 5 } })
    L.tree([-3.5, 0.5, -3.5], 1.1)
    L.tree([3.8, 0.5, -2.5], 0.9)
    L.rock([4, 0.6, 3.5], 0.5)

    // 木桥
    L.box({ pos: [0, 0, 9.5], size: [3, 0.8, 11], style: { topTex: wood(), sideTex: dirt() } })
    L.gem([0, 1.4, 8])

    // 岛2
    L.box({ pos: [0, 0, 18], size: [8, 1, 8], style: { island: 6 } })
    L.gem([0, 1.4, 18])
    L.tree([-2.8, 0.5, 20.5], 1)
    L.tree([2.6, 0.5, 15.6], 0.8)

    // 跳跃小岛(高 0.8)
    L.box({ pos: [0, 0.8, 26], size: [6, 1, 6], style: { island: 6 } })
    L.rock([-2, 1.4, 27], 0.4)

    // 侧移窄桥
    L.box({ pos: [3, 0.8, 32.5], size: [2, 0.8, 7] })
    L.gem([3, 2, 32.5])

    // 岛4 + 检查点
    L.box({ pos: [6, 0.8, 40], size: [7, 1, 7], style: { island: 7 } })
    L.checkpoint([6, 1.3, 38])
    L.tree([8.2, 1.3, 42.5], 1.2)
    L.tree([3.5, 1.3, 42], 0.9)

    // 移动平台跨谷
    L.mover({ from: [6, 0.8, 47], to: [6, 0.8, 54], size: [3, 0.6, 3], period: 4.5 })

    // 岛5 + 弹射台
    L.box({ pos: [6, 0.8, 60], size: [7, 1, 7], style: { island: 7 } })
    L.gem([6, 2, 60])
    L.pad([6, 1.3, 62], 16)

    // 高空平台
    L.box({ pos: [6, 5.5, 62], size: [4, 1, 4], style: { island: 4 } })
    L.gem([6, 6.6, 62])

    // 下坡木坡道 → 岛6
    L.box({ pos: [6, 4.2, 68], size: [3, 0.6, 9], rot: [-0.22, 0, 0], style: { topTex: wood(), sideTex: dirt() } })
    L.box({ pos: [6, 2.2, 74], size: [8, 1, 8], style: { island: 7 } })
    L.checkpoint([6, 2.7, 72])
    L.gem([6, 3.4, 74])
    L.tree([8.5, 2.7, 76.5], 1.1)
    L.tree([3.2, 2.7, 71.5], 1)
    L.rock([9, 2.9, 72], 0.5)

    // 三连踏石
    L.box({ pos: [2, 2.4, 81], size: [3, 1, 3], style: { island: 4 } })
    L.gem([2, 3.6, 81])
    L.box({ pos: [6, 2.6, 85.5], size: [3, 1, 3], style: { island: 4 } })
    L.gem([6, 3.8, 85.5])
    L.box({ pos: [10, 2.8, 90], size: [3, 1, 3], style: { island: 4 } })
    L.gem([10, 4, 90])

    // 终点岛 + 传送门
    L.box({ pos: [10, 2.8, 97], size: [8, 1, 8], style: { island: 8 } })
    L.portal([10, 3.3, 97])
    L.tree([7.5, 3.3, 94], 1.1)
    L.tree([12.8, 3.3, 94.5], 0.9)
    L.tree([7.8, 3.3, 100], 0.9)
    L.rock([13, 3.5, 99.5], 0.45)
  },
}
