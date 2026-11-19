// 第四关:霓虹穹顶 — 夜之都市天台,霓虹灯带与弹射塔
import { neonGrid, darkPanel, snow } from '../core/Textures.js'

export default {
  id: 4,
  name: '霓虹穹顶',
  en: 'Neon Grid',
  card: ['#3af0ff', '#b93aff'],
  sky: { top: '#06081a', horizon: '#241447', sun: '#9fb8ff', sunDir: [0.3, 0.5, 0.5], sunGlow: 0.15 },
  fog: { color: '#171030', density: 0.0095 },
  light: { dir: [30, 70, 20], color: '#a8baff', intensity: 1.1, hemi: ['#3a3a80', '#10101e', 0.4] },
  trail: '#4affff',
  bloom: 0.75,
  stars: true,
  music: [174.6, 220, 261.6],
  gravity: -24,
  ambient: { count: 150, color: '#4ad6ff', size: 0.16, opacity: 0.8, speed: 0.9, drift: 'rise', spread: [70, 18, 110], center: [0, 4, 50] },
  theme: {
    topTex: neonGrid('#3af0ff'), sideTex: darkPanel(), topRough: 0.5, metal: 0.35,
    gem: '#ff5ad0', accent: '#3af0ff', accent2: '#ff5ad0', pad: '#ff5ad0', bumper: '#ff5ad0',
    crystal: '#7bff8a', islandColor: '#1a1e30', texScale: 0.22,
  },
  spawn: [0, 1.6, 0],
  build(L) {
    L.spawn([0, 1.6, 0])
    L.killY(-24)

    // 起点天台
    L.box({ pos: [0, 0, 0], size: [10, 1, 10], style: { neon: '#3af0ff' } })
    L.crystal([-3.5, 0.5, -3.5], '#ff5ad0', 0.7, 2)
    L.crystal([3.5, 0.5, -3.2], '#3af0ff', 0.6, 2)

    // 天台踏石
    L.box({ pos: [0, 0, 9], size: [4, 1, 4], style: { neon: '#ff5ad0' } })
    L.gem([0, 1.4, 9])
    L.box({ pos: [0, 0.4, 15], size: [4, 1, 4], style: { neon: '#3af0ff' } })

    // 升降平台(电梯)→ 高层天台
    L.mover({ from: [0, 0.2, 21], to: [0, 4.2, 21], size: [4, 0.6, 4], period: 5.5 })
    L.box({ pos: [0, 4, 28], size: [8, 1, 8], style: { neon: '#3af0ff' } })
    L.checkpoint([0, 4.5, 26])
    L.gem([0, 5.7, 29])
    L.crystal([-3, 4.5, 30.5], '#3af0ff', 0.7, 2)
    L.crystal([3, 4.5, 30.8], '#7bff8a', 0.6, 2)

    // 高层跳台
    L.box({ pos: [0, 4, 36], size: [6, 1, 6], style: { neon: '#ff5ad0' } })
    L.box({ pos: [0, 4, 44], size: [6, 1, 6], style: { neon: '#3af0ff' } })
    L.gem([0, 5.4, 36])
    L.gem([0, 5.4, 44])

    // 碰碰长廊
    L.box({ pos: [0, 4, 52], size: [3, 1, 12], style: { neon: '#ff5ad0' } })
    L.bumper([0, 5, 49.5], 0.8)
    L.bumper([0, 5, 54.5], 0.8)

    // 霓虹下坡
    L.box({ pos: [0, 3, 63], size: [3, 0.6, 10], rot: [-0.2, 0, 0], style: { topTex: neonGrid('#b93aff'), sideTex: darkPanel(), neon: '#b93aff' } })
    L.box({ pos: [0, 0.8, 70], size: [6, 1, 6], style: { neon: '#3af0ff' } })
    L.checkpoint([0, 1.3, 68])
    L.gem([0, 2.2, 70])

    // 弹射上塔
    L.pad([0, 1.3, 72.5], 17)
    L.box({ pos: [0, 5.8, 72.5], size: [5, 1, 5], style: { neon: '#ff5ad0' } })
    L.gem([0, 7, 72.5])

    // 高空天桥(带缺口)
    L.box({ pos: [0, 6, 77.5], size: [2.5, 0.8, 5], style: { neon: '#3af0ff' } })
    L.gem([0, 7.2, 77.5])
    L.box({ pos: [0, 6, 83.5], size: [2.5, 0.8, 5], style: { neon: '#3af0ff' } })
    L.gem([0, 7.2, 83.5])

    // 尾端移动平台 → 穹顶
    L.mover({ from: [0, 6, 89], to: [0, 6, 93], size: [3, 0.6, 3], period: 4 })
    L.box({ pos: [0, 6, 98], size: [9, 1, 9], style: { neon: '#b93aff' } })
    L.portal([0, 6.4, 98])
    L.crystal([-3.2, 6.4, 94.5], '#3af0ff', 0.8, 2)
    L.crystal([3.2, 6.4, 94.5], '#ff5ad0', 0.8, 2)
    L.crystal([-3, 6.4, 101.5], '#7bff8a', 0.7, 2)
    L.crystal([3, 6.4, 101.5], '#3af0ff', 0.7, 2)

    // 城市剪影(远景楼群)
    const blocks = [
      [-22, -12, 8, 26, 8, '#3af0ff'], [-30, 6, 10, 34, 10, '#ff5ad0'], [-16, 22, 8, 30, 8, '#b93aff'],
      [22, -10, 9, 28, 9, '#ff5ad0'], [30, 8, 10, 38, 10, '#3af0ff'], [17, 26, 8, 24, 8, '#3af0ff'],
      [-8, 42, 9, 32, 9, '#ff5ad0'], [10, 44, 8, 26, 8, '#b93aff'], [-34, 30, 12, 20, 12, '#3af0ff'],
      [34, 32, 11, 22, 11, '#b93aff'],
    ]
    for (const [bx, bz, w, h, d, c] of blocks) L.building([bx, -8, bz], w, h, d, c)
  },
}
