import * as THREE from 'three'

export interface PointLoading {
  group: THREE.Group<THREE.Object3DEventMap>
  update: () => void
  updateProgress: (p: number) => void
  setVisible: (show: boolean) => void
  dispose: () => void
}

export function createPointLoading(): PointLoading {
  const group = new THREE.Group()

  // ---------------------------------------------------
  // 1. 点云圆环
  // ---------------------------------------------------
  const particleCount = 2500
  const radius = 2.0
  const thickness = 1.5 // 粗细
  const positions = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2
    const r = radius + (Math.random() - 0.5) * thickness
    positions[i * 3] = Math.cos(angle) * r
    positions[i * 3 + 1] = Math.sin(angle) * r
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    color: 0x66ccff,
    size: 0.035,
    transparent: true,
    opacity: 0.9,
  })

  const ringPoints = new THREE.Points(geometry, material)
  group.add(ringPoints)

  // ---------------------------------------------------
  // 2. Sprite 百分比文字
  // ---------------------------------------------------
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!

  function drawText(percent: number) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#88ddff'
    ctx.font = 'bold 80px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${percent}%`, 128, 128)
    progressTexture.needsUpdate = true
  }

  const progressTexture = new THREE.CanvasTexture(canvas)
  const percentageMaterial = new THREE.SpriteMaterial({
    map: progressTexture,
    transparent: true,
  })
  const percentageSprite = new THREE.Sprite(percentageMaterial)
  percentageSprite.scale.set(1.2, 1.2, 1.2)
  group.add(percentageSprite)

  // ---------------------------------------------------
  // 3. 动画控制
  // ---------------------------------------------------
  const startTime = performance.now()

  function update() {
    const t = (performance.now() - startTime) * 0.001

    // 圆环旋转
    ringPoints.rotation.z = t * 0.4

    // 呼吸缩放
    const scale = 1 + Math.sin(t * 3) * 0.12
    ringPoints.scale.set(scale, scale, scale)

    // 点云微抖动
    const pos = geometry.attributes.position
    for (let i = 0; i < particleCount; i++) {
      pos.array[i * 3 + 2] += (Math.random() - 0.5) * 0.0005
    }
    pos.needsUpdate = true
  }

  // ---------------------------------------------------
  // 对外接口
  // ---------------------------------------------------
  return {
    group,

    update() {
      update()
    },

    updateProgress(p: number) {
      drawText(p)
    },

    setVisible(show: boolean) {
      group.visible = show
    },

    dispose() {
      geometry.dispose()
      material.dispose()
      percentageMaterial.dispose()
      progressTexture.dispose()
    },
  }
}
