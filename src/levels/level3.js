// 第三关:霜峰之径 — 冰面低摩擦 + 弹射登塔 + 极光
import { ice, snow } from '../core/Textures.js'

export default {
  id: 3,
  name: '霜峰之径',
  en: 'Frost Spire',
  card: ['#7fd0ff', '#3a5ac0'],
  sky: { top: '#4a7fd0', horizon: '#cfe8ff', sun: '#eaf4ff', sunDir: [-0.4, 0.45, -0.55], sunGlow: 0.35 },
  fog: { color: '#c6dcf2', density: 0.009 },
  light: { dir: [-45, 60, -30], color: '#eaf2ff', intensity: 1.6, hemi: ['#bfdcff', '#8899b0', 0.5] },
  trail: '#aee6ff',
  bloom: 0.4,
  music: [261.6, 311.1, 392],
  gravity: -24,
  stars: true,
  aurora: true,
  ambient: { count: 300, color: '#ffffff', size: 0.2, opacity: 0.85, speed: 1.3, drift: 'fall', spread: [80, 22, 110], center: [0, 8, 48] },
  theme: {
    topTex: snow(), sideTex: snow(), topRough: 0.9,
    gem: '#7fd8ff', accent: '#6ec6ff', accent2: '#8affd4', pad: '#5ad0ff',
    crystal: '#7fd8ff', islandColor: '#5a6a85', texScale: 0.28,
  },
  spawn: [0, 1.6, 0],
  build(L) {
    L.spawn([0, 1.6, 0])
    L.killY(-18)

    // 雪原出发点
    L.box({ pos: [0, 0, 0], size: [10, 1, 10], style: { island: 7 } })
    L.pine([-3.5, 0.5, -3.5], 1.1)
    L.pine([3.5, 0.5, -3.8], 0.9)
    L.rock([4, 0.7, 3], 0.5)

    // 宽幅下滑坡道 → 冰湖
    L.box({ pos: [0, -1.06, 12], size: [6, 0.6, 14], rot: [-0.18, 0, 0], style: { topTex: ice(), sideTex: snow(), ice: true, topRough: 0.06 } })

    // 冰湖(滑!)
    L.box({ pos: [0, -2.5, 22], size: [12, 1, 12], style: { island: 7, ice: true, topTex: ice(), topRough: 0.06 } })
    L.gem([-3.2, -1.5, 20])
    L.gem([3.2, -1.5, 21.5])
    L.gem([0, -1.5, 25])
    L.crystal([-5, -2, 27], '#7fd8ff', 0.9, 1.2)
    L.crystal([5.2, -2, 26], '#7fd8ff', 0.7, 1.2)
    L.checkpoint([0, -2, 26.5])

    // 冰桥
    L.box({ pos: [0, -2.5, 33], size: [2.5, 1, 10], style: { ice: true, topTex: ice(), topRough: 0.06 } })
    L.gem([0, -1.4, 33])

    // 弹射登塔链
    L.box({ pos: [0, -2.5, 41], size: [4, 1, 4], style: { island: 5 } })
    L.pad([0, -2, 41], 16)
    L.box({ pos: [0, 2.2, 41], size: [3, 1, 3], style: { island: 4 } })
    L.gem([0, 3.4, 41])
    L.pad([0, 2.7, 41], 17)
    L.box({ pos: [0, 7.5, 43], size: [4, 1, 4], style: { island: 5 } })
    L.gem([0, 8.7, 43])
    L.crystal([-1.4, 8, 44.2], '#8affd4', 0.6, 1.4)

    // 冰滑梯盘旋而下
    L.box({ pos: [0, 6, 50], size: [3, 0.6, 12], rot: [-0.3, 0, 0], style: { topTex: ice(), sideTex: snow(), ice: true, topRough: 0.05 } })
    L.box({ pos: [0, 4, 59], size: [6, 1, 6], style: { island: 6 } })
    L.checkpoint([0, 4.5, 57.5])
    L.pine([-2.2, 4.5, 61.2], 0.9)
    L.pine([2.4, 4.5, 60.8], 1)
    L.gem([0, 5.6, 59])

    // 峡谷冰桥跳跃
    L.box({ pos: [0, 4, 65], size: [2.5, 1, 6], style: { ice: true, topTex: ice(), topRough: 0.06 } })
    L.gem([0, 5.2, 65])
    L.box({ pos: [0, 4, 73], size: [2.5, 1, 5], style: { ice: true, topTex: ice(), topRough: 0.06 } })
    L.gem([0, 5.2, 73])
    L.box({ pos: [0, 4, 80], size: [5, 1, 5], style: { island: 5 } })
    L.pine([1.8, 4.5, 81.8], 0.8)
    L.crystal([-1.8, 4.5, 78.8], '#7fd8ff', 0.7, 1.3)

    // 碰碰球桥
    L.box({ pos: [0, 4, 86], size: [3, 1, 8], style: { ice: true, topTex: ice(), topRough: 0.06 } })
    L.bumper([0, 5, 85], 0.8)
    L.gem([0, 5.2, 89])

    // 极光之巅 + 传送门
    L.box({ pos: [0, 4, 95], size: [8, 1, 8], style: { island: 8 } })
    L.portal([0, 4.5, 95])
    L.crystal([-2.5, 4.5, 92], '#7fd8ff', 0.8, 1.4)
    L.crystal([2.6, 4.5, 92.5], '#8affd4', 0.7, 1.4)
    L.crystal([-2.4, 4.5, 98], '#9fd8ff', 0.7, 1.4)
    L.crystal([2.5, 4.5, 98], '#7fe8ff', 0.8, 1.4)
    L.pine([-3.2, 4.5, 95], 0.9)
    L.pine([3.2, 4.5, 95], 0.9)
  },
}
