// 程序化天空:渐变穹顶 shader + 太阳光晕 + 星空 + 极光带
import * as THREE from 'three'
import { starDot } from './Textures.js'

const SKY_VERT = /* glsl */`
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const SKY_FRAG = /* glsl */`
  uniform vec3 topColor;
  uniform vec3 horizonColor;
  uniform vec3 sunColor;
  uniform vec3 sunDir;
  uniform float sunSize;
  uniform float sunGlow;
  varying vec3 vDir;

  void main() {
    float h = max(vDir.y, 0.0);
    vec3 col = mix(horizonColor, topColor, pow(h, 0.62));
    // 地平线下方压暗
    col = mix(col * 0.55, col, smoothstep(-0.25, 0.05, vDir.y));
    // 太阳
    float s = max(dot(vDir, normalize(sunDir)), 0.0);
    col += sunColor * pow(s, 900.0) * 4.0;                      // 日面
    col += sunColor * pow(s, 24.0) * sunGlow;                   // 晕
    col += sunColor * pow(s, 3.5) * sunGlow * 0.25;             // 大范围泛光
    gl_FragColor = vec4(col, 1.0);
  }
`

export function makeSky({ top, horizon, sun = '#ffffff', sunDir = [0.4, 0.5, -0.6], sunSize = 1, sunGlow = 0.35 }) {
  const geo = new THREE.SphereGeometry(900, 32, 20)
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      topColor: { value: new THREE.Color(top) },
      horizonColor: { value: new THREE.Color(horizon) },
      sunColor: { value: new THREE.Color(sun) },
      sunDir: { value: new THREE.Vector3(...sunDir).normalize() },
      sunSize: { value: sunSize },
      sunGlow: { value: sunGlow },
    },
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.renderOrder = -100
  mesh.frustumCulled = false
  return mesh
}

// 星空 Points(夜空关卡)
export function makeStars(count = 900, radius = 700) {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const size = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const dir = new THREE.Vector3().randomDirection()
    dir.y = Math.abs(dir.y) * 0.9 + 0.06
    dir.normalize().multiplyScalar(radius)
    pos[i * 3] = dir.x; pos[i * 3 + 1] = dir.y; pos[i * 3 + 2] = dir.z
    size[i] = 1.2 + Math.random() * 3.4
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uMap: { value: starDot() },
    },
    vertexShader: /* glsl */`
      attribute float aSize;
      varying float vTw;
      uniform float uTime;
      void main() {
        vTw = 0.55 + 0.45 * sin(uTime * (0.6 + aSize * 0.35) + aSize * 91.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (950.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */`
      varying float vTw;
      uniform sampler2D uMap;
      void main() {
        vec4 tex = texture2D(uMap, gl_PointCoord);
        gl_FragColor = vec4(tex.rgb * 1.4, tex.a * vTw);
      }
    `,
  })
  const pts = new THREE.Points(geo, mat)
  pts.renderOrder = -99
  pts.frustumCulled = false
  return pts
}

// 极光带(霜峰关卡)
export function makeAurora() {
  const group = new THREE.Group()
  const bands = [
    { y: 130, z: -180, w: 340, h: 70, c1: '#3affc3', c2: '#2a7fff' },
    { y: 165, z: -230, w: 420, h: 85, c1: '#7aff9e', c2: '#b93aff' },
    { y: 110, z: -260, w: 300, h: 60, c1: '#3ad9ff', c2: '#3aff9e' },
  ]
  for (const b of bands) {
    const geo = new THREE.PlaneGeometry(b.w, b.h, 64, 1)
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      fog: false,
      uniforms: {
        uTime: { value: 0 },
        uC1: { value: new THREE.Color(b.c1) },
        uC2: { value: new THREE.Color(b.c2) },
      },
      vertexShader: /* glsl */`
        varying vec2 vUv;
        uniform float uTime;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.y += sin(uv.x * 9.0 + uTime * 0.9) * 6.0;
          p.z += sin(uv.x * 5.0 - uTime * 0.6) * 8.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        varying vec2 vUv;
        uniform vec3 uC1;
        uniform vec3 uC2;
        uniform float uTime;
        void main() {
          float fade = smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
          fade *= smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.88, 1.0, vUv.x));
          float ripple = 0.72 + 0.28 * sin(vUv.x * 24.0 + uTime * 1.6);
          vec3 col = mix(uC1, uC2, vUv.y + 0.2 * sin(vUv.x * 7.0 + uTime));
          gl_FragColor = vec4(col * 0.9, fade * ripple * 0.5);
        }
      `,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(0, b.y + (Math.random() - .5) * 40, b.z)
    mesh.rotation.z = (Math.random() - .5) * 0.2
    mesh.userData.isAurora = true
    group.add(mesh)
  }
  return group
}

export function updateSkyObjects(skyGroup, t) {
  skyGroup.traverse((o) => {
    if (o.userData.isAurora) o.material.uniforms.uTime.value = t
    if (o.isPoints && o.material.uniforms && o.material.uniforms.uTime) o.material.uniforms.uTime.value = t
  })
}
