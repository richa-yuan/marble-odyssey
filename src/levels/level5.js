// 第五关:星海漫游 — 低重力小行星群,失重跳跃
import * as THREE from 'three'
import { rockTex, ice } from '../core/Textures.js'

export default {
  id: 5,
  name: '星海漫游',
  en: 'Cosmic Drift',
  card: ['#c0a0ff', '#4a3a8f'],
  sky: { top: '#050614', horizon: '#1a1038', sun: '#b0a0ff', sunDir: [-0.3, 0.4, 0.55], sunGlow: 0.12 },
  fog: { color: '#0e0a20', density: 0.006 },
  light: { dir: [-35, 60, 30], color: '#c8c0ff', intensity: 1.25, hemi: ['#5a4a9a', '#141024', 0.35] },
  trail: '#c0a0ff',
  bloom: 0.65,
  stars: true,
  music: [207.7, 260, 311.1],
  gravity: -9,
  ambient: { count: 220, color: '#c0a0ff', size: 0.15, opacity: 0.8, speed: 0.7, drift: 'float', spread: [90, 18, 110], center: [10, 6, 50] },
  theme: {
    topTex: rockTex(), sideTex: rockTex(), topRough: 0.95,
    gem: '#c084fc', accent: '#c084fc', accent2: '#8affd4', pad: '#c084fc', bumper: '#ff7ab8',
    crystal: '#c084fc', islandColor: '#4a4a5c', texScale: 0.24,
  },
  spawn: [0, 1.8, 0],
  build(L) {
    L.spawn([0, 1.8, 0])
    L.killY(-30)

    // 起点小行星
    L.box({ pos: [0, 0, 0], size: [9, 1, 9], rot: [0.03, 0.3, 0.02], style: { island: 7 } })
    L.crystal([-2.8, 0.5, -2.8], '#c084fc', 0.8, 1.6)
    L.crystal([2.6, 0.5, -2.4], '#8affd4', 0.6, 1.6)
    L.rock([3, 0.7, 3], 0.5)

    // 失重跳岛(重力低,可跳更远)
    L.box({ pos: [3, 0.3, 9], size: [5, 1, 5], rot: [0.05, 0.8, 0.04], style: { island: 6 } })
    L.gem([3, 1.6, 9])
    L.box({ pos: [7, 0.6, 17], size: [5, 1, 5], rot: [-0.04, 1.6, 0.05], style: { island: 6 } })
    L.gem([7, 1.9, 17])
    L.box({ pos: [10, 1, 25], size: [6, 1, 6], rot: [0.04, 2.4, -0.03], style: { island: 7 } })
    L.checkpoint([10, 1.5, 24])
    L.crystal([12, 1.5, 27], '#c084fc', 0.9, 1.5)

    // 环形宝石群
    L.box({ pos: [5, 1.5, 32], size: [3, 1, 3], style: { island: 4 } })
    L.gem([5, 2.6, 32])
    L.box({ pos: [10, 2, 35], size: [3, 1, 3], style: { island: 4 } })
    L.gem([10, 3.1, 35])
    L.box({ pos: [15, 2.2, 32], size: [3, 1, 3], style: { island: 4 } })
    L.gem([15, 3.3, 32])

    // 移动平台 → 核心星
    L.mover({ from: [15, 2.2, 39], to: [15, 2.2, 45], size: [3, 0.6, 3], period: 4.2 })
    L.box({ pos: [15, 2.2, 53], size: [10, 1, 10], rot: [0.02, 0.9, 0.03], style: { island: 9 } })
    L.crystal([11.5, 2.7, 50], '#c084fc', 1.1, 1.6)
    L.crystal([18.5, 2.7, 51], '#8affd4', 0.9, 1.6)
    L.bumper([11, 3.3, 55], 0.9)
    L.pad([15, 2.7, 56], 12.5)

    // 高空星核
    L.box({ pos: [15, 8.5, 56], size: [4, 1, 4], style: { island: 5 } })
    L.gem([15, 9.7, 56])

    // 长滑坡 → 中继星
    L.box({ pos: [15, 6, 64], size: [3, 0.6, 12], rot: [-0.24, 0, 0], style: { topTex: ice(), sideTex: rockTex(), ice: true, topRough: 0.05 } })
    L.box({ pos: [15, 2.9, 71], size: [6, 1, 6], rot: [0.03, 1.2, 0.04], style: { island: 7 } })
    L.checkpoint([15, 3.4, 70])
    L.crystal([17, 3.4, 73], '#c084fc', 0.8, 1.5)
    L.gem([15, 4.2, 72])

    // 弹碰球连环
    L.box({ pos: [19, 3.2, 77], size: [4, 1, 4], style: { island: 5 } })
    L.bumper([19, 4.3, 77], 0.8)
    L.box({ pos: [15, 3.5, 84], size: [4, 1, 4], style: { island: 5 } })
    L.bumper([15, 4.6, 84], 0.8)
    L.gem([15, 4.9, 84])
    L.box({ pos: [10, 3.8, 91], size: [5, 1, 5], rot: [-0.04, 2.0, 0.03], style: { island: 6 } })
    L.gem([10, 5, 91])

    // 传送门星
    L.box({ pos: [10, 3.8, 99], size: [9, 1, 9], rot: [0.02, 0.5, 0.02], style: { island: 8 } })
    L.portal([10, 4.3, 99])
    L.crystal([6.5, 4.3, 95.5], '#c084fc', 0.9, 1.7)
    L.crystal([13.5, 4.3, 95.5], '#8affd4', 0.8, 1.7)
    L.crystal([6.8, 4.3, 102.5], '#8affd4', 0.8, 1.7)
    L.crystal([13.2, 4.3, 102.5], '#c084fc', 0.9, 1.7)

    // 远景:带环行星
    const planetGroup = new THREE.Group()
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(55, 32, 24),
      new THREE.MeshStandardMaterial({ color: '#7a5ac0', roughness: 0.85, flatShading: false, emissive: '#3a2470', emissiveIntensity: 0.5 })
    )
    planetGroup.add(globe)
    const ringGeo = new THREE.TorusGeometry(85, 7, 2, 60)
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: '#c0a0ff', transparent: true, opacity: 0.4 }))
    ring.rotation.x = Math.PI / 2.4
    planetGroup.add(ring)
    planetGroup.position.set(-160, 95, 240)
    L.scene.add(planetGroup)
  },
}
