// 第二关:赤沙遗迹 — 沙漠神殿,旋转机关与弹射高台
import { sand, sandstone } from '../core/Textures.js'

export default {
  id: 2,
  name: '赤沙遗迹',
  en: 'Dune Ruins',
  card: ['#f2b06b', '#c96a3a'],
  sky: { top: '#58a7e8', horizon: '#f5d9a8', sun: '#fff4d0', sunDir: [0.35, 0.55, -0.5], sunGlow: 0.42 },
  fog: { color: '#ecd0a0', density: 0.005 },
  light: { dir: [-40, 70, -25], color: '#fff3da', intensity: 1.7, hemi: ['#ffe2b8', '#b0805a', 0.4] },
  trail: '#ffcf8a',
  bloom: 0.32,
  music: [196, 233.1, 293.7],
  gravity: -24,
  ambient: { count: 150, color: '#e8c99a', size: 0.15, opacity: 0.3, speed: 0.5, drift: 'sway', spread: [60, 12, 110], center: [5, 6, 55], additive: false },
  theme: {
    topTex: sand(), sideTex: sandstone(), topRough: 0.95,
    gem: '#ffb84f', accent: '#ff9e4a', accent2: '#e8c66a', pad: '#ff8a3a',
    crystal: '#ffcf6a', islandColor: '#8a6a44',
  },
  spawn: [0, 1.6, 0],
  build(L) {
    L.spawn([0, 1.6, 0])
    L.killY(-18)

    // 神殿大门
    L.box({ pos: [0, 0, 0], size: [10, 1, 10], style: { island: 6 } })
    L.column([-3.8, 0.5, 3.5], 1.2)
    L.column([3.8, 0.5, 3.5], 1.2)
    L.column([-3.5, 0.5, -3.2], 0.9)
    L.obelisk([4.2, 0.5, -3.5], 0.8)
    L.obelisk([-4.2, 0.5, -3.5], 0.7)

    // 长桥
    L.box({ pos: [0, 0, 13], size: [3, 0.8, 16] })
    L.gem([0, 1.4, 9])
    L.gem([0, 1.4, 15])

    // 机关广场(旋转护栏)
    L.box({ pos: [0, 0, 24], size: [9, 1, 9], style: { island: 5 } })
    L.spinner({ pos: [0, 0, 24], length: 6.5, speed: 1.9 })
    L.gem([-3, 1.3, 21.5])
    L.gem([3, 1.3, 26.5])
    L.column([-3.8, 0.5, 27.5], 0.8)
    L.column([3.8, 0.5, 27.5], 1.0)

    // 之字窄桥
    L.box({ pos: [3, 0.5, 32], size: [2, 0.8, 7] })
    L.gem([3, 1.8, 32])
    L.box({ pos: [6.5, 0.5, 37.5], size: [7, 0.8, 2] })
    L.box({ pos: [10, 0.5, 44], size: [2, 0.8, 10] })
    L.gem([10, 1.8, 44])
    L.cactus([7.5, 0.9, 37.5], 0.5)

    // 广场2 + 弹射高台
    L.box({ pos: [10, 0.5, 53], size: [8, 1, 8], style: { island: 6 } })
    L.checkpoint([10, 1, 51])
    L.cactus([6.8, 1, 55], 0.7)
    L.cactus([13, 1, 51], 0.5)
    L.pad([10, 1, 55], 16)
    L.obelisk([10, 0.5, 55], 1.4)

    // 高台
    L.box({ pos: [10, 5.6, 55], size: [3.2, 1, 3.2], style: { island: 4, islandColor: '#a8895c' } })
    L.gem([10, 6.8, 55])

    // 下坡坡道 → 广场3
    L.box({ pos: [10, 4.4, 60], size: [2.5, 0.6, 8], rot: [-0.2, 0, 0], style: { topTex: sandstone(), sideTex: sandstone() } })
    L.box({ pos: [10, 2.9, 67], size: [8, 1, 8], style: { island: 6 } })
    L.checkpoint([10, 3.4, 65])
    L.column([6.8, 3.4, 69.5], 1.1)
    L.gem([13, 4, 69])
    L.rock([13.2, 3.6, 65], 0.5)

    // 碰碰球长廊
    L.box({ pos: [10, 2.9, 75.5], size: [3, 0.8, 10] })
    L.bumper([10, 3.9, 73], 0.85)
    L.bumper([10, 3.9, 78], 0.85)
    L.gem([10, 4.2, 80.2])

    // 广场4
    L.box({ pos: [10, 2.9, 85], size: [9, 1, 9], style: { island: 6 } })
    L.gem([7, 4.1, 85])
    L.obelisk([13.5, 3.4, 87.5], 0.9)
    L.cactus([6.8, 3.4, 88], 0.6)

    // 双移动平台 → 圣所
    L.mover({ from: [10, 2.9, 92], to: [10, 2.9, 96], size: [3, 0.6, 3], period: 3.6, phase: 0 })
    L.mover({ from: [10, 2.9, 95.5], to: [10, 2.9, 99.5], size: [3, 0.6, 3], period: 3.6, phase: Math.PI })

    // 圣所 + 传送门
    L.box({ pos: [10, 2.9, 106], size: [8, 1, 8], style: { island: 7 } })
    L.portal([10, 3.4, 106])
    L.column([6.8, 3.4, 103], 1.0)
    L.column([13.2, 3.4, 103], 1.0)
    L.obelisk([6.8, 3.4, 109], 0.8)
    L.obelisk([13.2, 3.4, 109], 0.8)
    L.crystal([10, 3.4, 109.8], '#ffcf6a', 0.7, 0.8)
  },
}
