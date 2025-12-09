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
    // 添加到场景
    this.scene?.add(points)
    this.pointCloud = points

    // 相机适应点云
    this.adjustCameraToPointCloud(points)

    // 可选：添加调试标记
    this.addMarker(0, 0, 0, 0xff0000, 1.5)
  }

  /**
   * 流式加载 PCD 文件并渲染点云
   *
   * 逻辑：
   * 1. Worker 按 chunk 解析 PCD 文件，每个 chunk 返回 positions + colors
   * 2. 主线程累积 chunk 数据，同时更新加载进度
   * 3. 所有 chunk 完成后，合并 positions 和 colors，创建 BufferGeometry
   * 4. 创建 THREE.Points 并添加到场景，同时调整相机和添加标记
   */
  private async loadPCD(url: string) {
    this.startLoading() // 显示 loading，禁止操作

    try {
      const positionsChunks: Float32Array[] = []
      const colorsChunks: Float32Array[] = []
      let totalPoints = 0
      let expectedPoints = 0

      // Worker 流式加载
      await workerPool!.postTask(
        'pcd-load',
        { fileUrl: url, chunkSize: 3000 },
        (chunk: {
          positions: ArrayBuffer
          colors: ArrayBuffer
          count: number
          totalPoints: number
        }) => {
          // 只取有效数据
          const posChunkFull = new Float32Array(chunk.positions)
          const colorChunkFull = new Float32Array(chunk.colors)
          positionsChunks.push(posChunkFull.subarray(0, chunk.count * 3))
          colorsChunks.push(colorChunkFull.subarray(0, chunk.count * 3))

          totalPoints += chunk.count
          expectedPoints = chunk.totalPoints

          // 更新加载进度百分比
          this.updateLoadProgress((totalPoints / expectedPoints) * 100)
        },
      )

      // 所有 chunk 完成后，合并 positions 和 colors
      const allPositions = new Float32Array(expectedPoints * 3)
      const allColors = new Float32Array(expectedPoints * 3)
      let offset = 0
      for (let i = 0; i < positionsChunks.length; i++) {
        allPositions.set(positionsChunks[i], offset)
        allColors.set(colorsChunks[i], offset)
        offset += positionsChunks[i].length
      }

      // 防止 NaN 导致 BufferGeometry 报错
      for (let i = 0; i < allPositions.length; i++) {
        if (!Number.isFinite(allPositions[i])) allPositions[i] = 0
        if (!Number.isFinite(allColors[i])) allColors[i] = 0
      }

      // 创建 BufferGeometry 并设置属性
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(allPositions, 3),
      )
      geometry.setAttribute('color', new THREE.BufferAttribute(allColors, 3))

      // 创建 PointsMaterial，启用 vertexColors
      const points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          size: this.pointSize,
          vertexColors: true,
          transparent: true,
          opacity: 0.6,
        }),
      )

      this.renderPcd(points)

      return Promise.resolve()
    } catch (err) {
      return Promise.reject(err)
    } finally {
      this.stopLoading() // 隐藏 loading
    }
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
