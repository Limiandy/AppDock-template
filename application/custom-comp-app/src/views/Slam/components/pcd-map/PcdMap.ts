import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createPointLoading, type PointLoading } from './createPointLoading.ts'
import workerCode from './pcdWorker.ts?rawJs'
import { useWorkerPool } from 'common/hooks'

const { workerPool } = useWorkerPool()
workerPool!.registerWorker('pcd-load', workerCode)

interface PcdMapOptions {
  pointSize: number
  fileUrl: string
}

export default class PcdMap {
  scene: THREE.Scene | undefined
  camera: THREE.PerspectiveCamera | undefined
  renderer: THREE.WebGLRenderer | undefined
  controls: OrbitControls | undefined
  pointCloud?: THREE.Points
  container: HTMLElement
  pointSize?: number
  pointLoading: PointLoading | undefined
  fileUrl: string

  constructor(container: HTMLElement, options: PcdMapOptions) {
    this.container = container
    const { pointSize = 0.05, fileUrl } = options
    this.pointSize = pointSize
    if (!fileUrl) {
      throw new Error('Rendering the pcd map requires the pcd file URL.')
    }
    this.fileUrl = fileUrl
  }

  static async create(container: HTMLElement, options: PcdMapOptions) {
    const instance = new PcdMap(container, options)
    const { fileUrl } = options
    instance.init()
    await instance.loadPCD(fileUrl)
    return instance
  }

  private createLoading() {
    const pointLoading = createPointLoading()
    this.scene?.add(pointLoading.group)
    this.pointLoading = pointLoading
  }

  private startLoading() {
    this.controls!.enabled = false
    this.pointLoading?.setVisible(true)
    // 在渲染循环中
    const renderLoop = () => {
      this.pointLoading?.update()
      this.renderer?.render(this.scene!, this.camera!)
      requestAnimationFrame(renderLoop)
    }

    renderLoop()
  }

  private stopLoading() {
    this.pointLoading?.setVisible(false)
    this.pointLoading?.dispose()
    this.controls!.enabled = true
  }

  private updateLoadProgress(num: number) {
    this.pointLoading?.updateProgress(num)
  }

  private adjustCameraToPointCloud(points: THREE.Points) {
    if (!this.camera || !this.controls) return

    // 1️⃣ 计算点云边界盒
    const box = new THREE.Box3().setFromObject(points)

    // 2️⃣ 计算中心和尺寸
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)

    // 3️⃣ 设置相机位置
    // PerspectiveCamera fov 角度转弧度
    const fov = this.camera.fov * (Math.PI / 180)
    // 根据最大维度计算相机距离，1.2 是留一点边距
    const cameraZ = (maxDim / (2 * Math.tan(fov / 2))) * 1.2

    // 假设沿 Z 轴看点云
    this.camera.position.set(center.x, center.y, center.z + cameraZ)
    this.camera.near = cameraZ / 100 // 调整近平面
    this.camera.far = cameraZ * 100 // 调整远平面
    this.camera.updateProjectionMatrix()

    // 限制缩放
    this.controls.minDistance = 20
    this.controls.maxDistance = 60

    // 4️⃣ 更新控制器 target
    this.controls.target.copy(center)

    this.controls.update()
  }

  // 调试用：打印坐标范围，并在场景中显示轴和包围盒
  // @ts-ignore
  private debugPointCloudOrientation(points: THREE.Points) {
    const box = new THREE.Box3().setFromObject(points)
    const min = box.min
    const max = box.max
    console.log('bounds:', {
      xMin: min.x,
      xMax: max.x,
      xRange: max.x - min.x,
      yMin: min.y,
      yMax: max.y,
      yRange: max.y - min.y,
      zMin: min.z,
      zMax: max.z,
      zRange: max.z - min.z,
    })

    // 添加坐标轴帮助线（红=X, 绿=Y, 蓝=Z）
    const axes = new THREE.AxesHelper(
      Math.max(box.getSize(new THREE.Vector3()).length(), 1),
    )
    axes.position.copy(box.getCenter(new THREE.Vector3()))
    this.scene?.add(axes)

    // 包围盒辅助线
    const boxHelper = new THREE.Box3Helper(box, 0xffaa00)
    this.scene?.add(boxHelper)
  }

  private init() {
    const container = this.container
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x000000)

    const width = container.clientWidth
    const height = container.clientHeight

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    this.camera.position.set(0, 0, 10)

    this.renderer = new THREE.WebGLRenderer({ antialias: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.renderer.setSize(width, height)

    container.appendChild(this.renderer.domElement)

    // 添加交互控制
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enabled = false
    this.controls.enableDamping = true // 平滑惯性
    this.controls.dampingFactor = 0.05
    this.controls.screenSpacePanning = true // true 可以在平面上平移

    this.animate = this.animate.bind(this)
    this.animate()

    this.createLoading()
    window.addEventListener('resize', () => this.resize())
  }

  private renderPcd(points: THREE.Points) {
    const geometry = points.geometry as THREE.BufferGeometry
    const positions = geometry.getAttribute('position')
    const colors: number[] = []

    // 获取 z 的最小值和最大值，用于归一化
    let zMin = Infinity,
      zMax = -Infinity
    for (let i = 0; i < positions.count; i++) {
      const z = positions.getZ(i)
      if (z < zMin) zMin = z
      if (z > zMax) zMax = z
    }

    for (let i = 0; i < positions.count; i++) {
      const z = positions.getZ(i)
      const t = (z - zMin) / (zMax - zMin) // 归一化到 0~1
      const hue = 240 * (1 - t) // 240 -> 蓝, 0 -> 红

      const color = new THREE.Color()
      color.setHSL(hue / 360, 0.6, 0.4) // 饱和度0.6，亮度0.4，更柔和

      colors.push(color.r, color.g, color.b)
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: this.pointSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.6, // 半透明
    })

    const coloredPoints = new THREE.Points(geometry, material)
    // coloredPoints.rotation.x = Math.PI

    this.scene?.add(coloredPoints)
    this.pointCloud = coloredPoints
    this.adjustCameraToPointCloud(coloredPoints)
    // this.debugPointCloudOrientation(coloredPoints)
    this.addMarker(0, 0, 0, 0xff0000, 1.5)
  }

  private loadPCD(url: string) {
    this.startLoading() // 禁止操作 + 显示 loading

    return new Promise<void>(async (resolve, reject) => {
      try {
        const positionsChunks: Float32Array[] = []
        let totalPoints = 0
        let expectedPoints = 0 // worker 返回的 totalPoints

        // Worker 流式加载
        await workerPool!.postTask(
          'pcd-load',
          { fileUrl: url, chunkSize: 3000 },
          (chunk: {
            positions: ArrayBuffer
            count: number
            totalPoints: number
          }) => {
            const posChunkFull = new Float32Array(chunk.positions)
            const posChunk = posChunkFull.subarray(0, chunk.count * 3) // 只取有效点
            positionsChunks.push(posChunk)

            totalPoints += chunk.count
            expectedPoints = chunk.totalPoints

            // 更新加载进度
            this.updateLoadProgress((totalPoints / expectedPoints) * 100)
          },
        )

        // 所有 chunk 加载完成后，合并 positions
        const allPositions = new Float32Array(expectedPoints * 3)
        let offset = 0
        for (const arr of positionsChunks) {
          allPositions.set(arr, offset)
          offset += arr.length
        }

        // 修复 NaN（如果有）
        for (let i = 0; i < allPositions.length; i++) {
          if (!Number.isFinite(allPositions[i])) allPositions[i] = 0
        }

        // 创建 BufferGeometry
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute(
          'position',
          new THREE.BufferAttribute(allPositions, 3),
        )

        // 创建 Points 对象并渲染颜色
        const points = new THREE.Points(
          geometry,
          new THREE.PointsMaterial({
            size: this.pointSize,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
          }),
        )

        this.renderPcd(points) // renderPcd 内会计算颜色、加到场景中、调整相机等

        resolve()
      } catch (err) {
        reject(err)
      } finally {
        this.stopLoading()
      }
    })
  }

  animate() {
    requestAnimationFrame(this.animate)
    this.controls?.update() // 必须调用才能生效
    this.renderer?.render(this.scene!, this.camera!)
  }

  resize() {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    this.camera!.aspect = width / height
    this.camera!.updateProjectionMatrix()
    this.renderer!.setSize(width, height)
  }

  /**
   * 将点云转换为 Mesh（凸包示例）
   */
  addMarker(
    x: number,
    y: number,
    z: number,
    color: THREE.ColorRepresentation = 0xff0000,
    size: number = 0.2,
  ) {
    if (!this.scene) return
    const group = new THREE.Group()
    group.add(this.pointCloud!)
    // 创建一个小球作为标记
    const geometry = new THREE.SphereGeometry(size, 16, 16)
    const material = new THREE.MeshBasicMaterial({ color })
    const marker = new THREE.Mesh(geometry, material)

    // 设置世界坐标
    marker.position.set(x, y, z)
    group.add(marker)
    this.scene.add(group)

    return marker
  }
}
