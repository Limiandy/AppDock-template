import { fabric } from 'fabric-with-erasing'
import { parsePGM, parseYamlMinimal, pixelToCanvas, removeHost, worldToPixel } from '@/components/SlamMap/utils'
import MarkerStyle from '@/components/SlamMap/MarkerStyle'
import MultiMarker from '@/components/SlamMap/MultiMarker'

import Vue from 'vue'
import MapSlider from './MapSlider.vue'
// eslint-disable-next-line import/no-cycle
import MultiPolyline from '@/components/SlamMap/MultiPolyline'
import PolylineStyle from '@/components/SlamMap/PolylineStyle'
// 覆写
fabric.Text.prototype._setTextStyles = function (ctx, charStyle, forMeasuring) {
  // ✅ 修正拼写错误
  ctx.textBaseline = 'alphabetic'
  if (this.path) {
    // eslint-disable-next-line default-case
    switch (this.pathAlign) {
      case 'center':
        ctx.textBaseline = 'middle'
        break
      case 'ascender':
        ctx.textBaseline = 'top'
        break
      case 'descender':
        ctx.textBaseline = 'bottom'
        break
    }
  }
  ctx.font = this._getFontDeclaration(charStyle, forMeasuring)
}

fabric.Image.prototype.toObject = (function (toObject) {
  return function () {
    return fabric.util.object.extend(toObject.call(this), {
      metadata: this.metadata,
      marker_id: this.marker_id,
      style_id: this.style_id,
      geometry: this.geometry,
    })
  }
})(fabric.Image.prototype.toObject)

class PgmMap {
  canvasInstance = null
  errorText = '⚠ 地图加载失败，请检查地图文件是否正确'
  loadingText = '⏳ 正在加载地图资源...'
  yamlData = null
  pgmImg = null
  _resizeTimer = null

  constructor(el, options = {}) {
    this.el = el
    this.options = options
    this.zoom = 1
    this.minZoom = 1
    this.maxZoom = 5
    this._markers = new Map()
    this._polylines = new Map()
    this._init()
  }

  _init() {
    this.canvasInstance?.dispose()
    this.canvasInstance = null

    // 全局默认配置保持不变
    fabric.Object.prototype.set({
      hasControls: false,
      cornerColor: '#1890ff',
      cornerStyle: 'circle',
      cornerSize: 8,
      hasBorders: true,
      borderColor: '#1890ff',
      selectable: false,
      hasRotatingPoint: false,
    })

    // -------------------------------
    // 判断 el 是否为 <canvas>
    // -------------------------------
    let realCanvasEl = null

    if (this.el instanceof HTMLCanvasElement) {
      // 直接就是 canvas
      realCanvasEl = this.el
    } else {
      // 是 div / span / 其他东西 → 自动创建 canvas
      realCanvasEl = document.createElement('canvas')

      // 清空 el 再挂 canvas
      if (this.el instanceof HTMLElement) {
        this.el.style.position = 'relative'
        this.el.innerHTML = ''
        this.el.appendChild(realCanvasEl)
      } else {
        throw new Error('SlamMap: el 不是合法的 DOM 元素')
      }
    }

    const width = this.el.clientWidth
    const height = this.el.clientHeight

    // 创建 fabric canvas
    const canvas = new fabric.Canvas(realCanvasEl, {
      selection: false,
      isDrawingMode: false,
    })

    canvas.setWidth(width)
    canvas.setHeight(height)

    const wrapper = canvas.wrapperEl
    if (wrapper) {
      wrapper.style.position = 'absolute'
      wrapper.style.inset = '0'
    }

    canvas.hoverCursor = 'pointer'

    this.canvasInstance = canvas
    this._initPanZoom()
    this._initResizeObserver()

    // -------------------- 渲染 MapSlider --------------------
    const sliderContainer = document.createElement('div')
    this.el.appendChild(sliderContainer)

    const SliderConstructor = Vue.extend(MapSlider)
    this.sliderVm = new SliderConstructor({
      propsData: {
        value: this.zoom,
        min: this.minZoom,
        max: this.maxZoom,
        step: 0.5,
        canvas: this,
      },
    })

    this.sliderVm.$mount(sliderContainer)
  }

  _initResizeObserver() {
    // 1) 监听自身尺寸
    this.resizeObserver = new ResizeObserver(() => {
      this._scheduleResize()
    })
    this.resizeObserver.observe(this.el)

    // 2) 窗口尺寸变化
    window.addEventListener('resize', () => {
      this._scheduleResize()
    })
  }

  _scheduleResize() {
    const now = performance.now()

    // 16ms 节流，大概一帧
    if (this._lastCall && now - this._lastCall < 16) {
      return
    }
    this._lastCall = now

    if (this._rafId) cancelAnimationFrame(this._rafId)
    this._rafId = requestAnimationFrame(() => {
      this._fitMapToContainer()
    })
  }

  /* ---------------------- 尺寸更新核心 ---------------------- */
  _fitMapToContainer() {
    if (!this.canvasInstance) return
    const canvas = this.canvasInstance

    const mapEL = this.el
    const newW = mapEL.clientWidth
    const newH = mapEL.clientHeight
    const oldW = canvas.getWidth()
    const oldH = canvas.getHeight()
    if (newW === oldW && newH === oldH) return

    this._updateCanvasSize(newW, newH)

    this._markers.values().forEach(marker => {
      const { geometries } = marker
      const newGeometries = geometries.map(geometry => {
        const { position } = geometry
        geometry.position = new PgmMap.LatLng(this, position.latLng)
        return geometry
      })
      marker.updateGeometries(newGeometries)
    })

    this._polylines.values().forEach(polyline => {
      const { geometries } = polyline
      const newGeometries = geometries.map(geometry => {
        const { paths } = geometry
        geometry.paths = paths.map(path => new PgmMap.LatLng(this, path.latLng))
        return geometry
      })

      polyline.updateGeometries(newGeometries)
    })
  }

  _updateCanvasSize(newW, newH) {
    console.log('======newW, newH========: ', newW, newH)
    const canvas = this.canvasInstance
    const img = this.pgmImg

    canvas.setWidth(newW)
    canvas.setHeight(newH)

    const scaleX = newW / (img?.width || 1)
    const scaleY = newH / (img?.height || 1)
    const scale = Math.min(scaleX, scaleY)

    img?.set({
      scaleX: scale,
      scaleY: scale,
      left: newW / 2,
      top: newH / 2,
    })

    return scale
  }

  _renderHelpText(message) {
    const canvas = this.canvasInstance
    const mapEL = this.el
    const newW = mapEL.clientWidth
    const newH = mapEL.clientHeight
    canvas.setWidth(newW)
    canvas.setHeight(newH)
    // 清除当前画布内容
    canvas.clear()

    // 创建错误提示文本
    const text = new fabric.Text(message, {
      left: canvas.getWidth() / 2,
      top: canvas.getHeight() / 2,
      originX: 'center',
      originY: 'center',
      fontSize: 24,
      fill: 'red',
      fontWeight: 'bold',
    })

    // 给 text 一个标识，方便后续移除
    text.id = 'HELP_TEXT'

    canvas.add(text)
    canvas.renderAll()
  }

  _removeHelpText() {
    if (!this.canvasInstance) return

    const canvas = this.canvasInstance
    const errorObj = canvas.getObjects().find(obj => obj.id === 'HELP_TEXT')
    if (errorObj) {
      canvas.remove(errorObj)
      canvas.renderAll()
    }
  }

  _renderLoading() {
    const canvas = this.canvasInstance

    const bg = new fabric.Rect({
      left: 0,
      top: 0,
      width: canvas.width,
      height: canvas.height,
      fill: 'rgba(0, 0, 0, 0.5)',
      selectable: false,
      evented: false,
    })

    const radius = 30
    const perim = 2 * Math.PI * radius
    const visible = perim * 0.75
    const gap = perim - visible

    const gradient = new fabric.Gradient({
      type: 'linear',
      coords: {
        x1: -radius, y1: 0,
        x2: radius, y2: 0,
      },
      colorStops: [
        { offset: 0, color: '#ff4b4b' },
        { offset: 0.5, color: '#ffd600' },
        { offset: 1, color: '#3eff8a' },
      ],
    })

    const arc = new fabric.Circle({
      left: canvas.width / 2,
      top: canvas.height / 2 - 20,
      radius,
      stroke: gradient,
      strokeWidth: 4,
      fill: '',
      originX: 'center',
      originY: 'center',
      strokeDashArray: [visible, gap],
      selectable: false,
      evented: false,
    })

    const group = new fabric.Group([bg, arc], {
      selectable: false,
      hasRotatingPoint: false,
    })
    group.id = 'LOADING_GROUP'
    canvas.add(group)

    // ========== 圆环旋转动画 ==========
    function animateArc() {
      arc.animate('angle', arc.angle + 360, {
        duration: 1000,
        onChange: canvas.renderAll.bind(canvas),
        onComplete: animateArc,
      })
    }
    animateArc()
  }

  _removeLoading() {
    const canvas = this.canvasInstance
    canvas.getObjects().find(obj => obj.id === 'LOADING_GROUP')?.remove()
  }

  /* ---------------------- 数据加载 ---------------------- */
  async _renderByBuffer(buffer) {
    try {
      const { width, height, pixels } = parsePGM(buffer)

      const mapEL = this.el
      const mapELWidth = mapEL?.clientWidth
      const mapELHeight = mapEL?.clientHeight

      const canvas = this.canvasInstance
      canvas?.setWidth(mapELWidth)
      canvas?.setHeight(mapELHeight)

      // 绘制 PGM 图像
      const off = document.createElement('canvas')
      off.width = width
      off.height = height
      const ctx = off.getContext('2d')
      const imageData = ctx.createImageData(width, height)
      for (let i = 0; i < pixels.length; i++) {
        const v = pixels[i]
        imageData.data.set([v, v, v, 255], i * 4)
      }
      ctx.putImageData(imageData, 0, 0)

      const img = new Image()
      img.src = off.toDataURL()
      await new Promise((res) => (img.onload = res))

      const scaleX = mapELWidth / img.width
      const scaleY = mapELHeight / img.height
      const scale = Math.min(scaleX, scaleY)

      this.pgmImg = new fabric.Image(img, {
        metadata: { id: '123', type: 'BASE_IMAGE' },
        originX: 'center',
        originY: 'center',
        left: mapELWidth / 2,
        top: mapELHeight / 2,
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
      })
      canvas?.clear()
      canvas?.setBackgroundColor('#CDCDCD', canvas.renderAll.bind(canvas))
      canvas?.add(this.pgmImg)
      canvas?.sendToBack(this.pgmImg)
      canvas?.renderAll()
      return true
    } catch (e) {
      console.error('Failed to parse PGM', e)
    }
  }

  async render(pgmUrl, yamlUrl) {
    if (!pgmUrl || !yamlUrl) {
      this._renderHelpText(this.errorText)
      return Promise.reject(new Error('请先设置 yamlUrl 和 pgmUrl'))
    }

    try {
      this._renderLoading()
      const [yamlRes, pgmRes] = await Promise.all([
        fetch(removeHost(yamlUrl)),
        fetch(removeHost(pgmUrl)),
      ])

      // 延迟测试
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 检查两个响应是否都成功
      if (!yamlRes.ok || !pgmRes.ok) {
        this._renderHelpText(this.errorText)
        return Promise.reject(new Error('地图文件加载失败'))
      }

      // 都成功才执行解析与渲染
      const yamlText = await yamlRes.text()
      const pgmBuffer = await pgmRes.arrayBuffer()
      this.yamlData = parseYamlMinimal(yamlText)
      this._removeLoading()
      await this._renderByBuffer(pgmBuffer)

      return Promise.resolve(this.canvasInstance)
    } catch (e) {
      this._renderHelpText(this.errorText)
      return Promise.reject(new Error('地图文件加载失败'))
    }
  }

  static async create(el, [pgmUrl, yamlUrl], options = {}) {
    const instance = new PgmMap(el, options)
    await instance.render(pgmUrl, yamlUrl)
    return instance
  }

  destroy() {
    this.sliderVm && this.sliderVm.$destroy()
    this.resizeObserver?.disconnect()
    window.removeEventListener('resize', this._scheduleResize)
    // this.canvasInstance?.dispose()
    this.canvasInstance = null
  }

  getPixelCoordinates([dx, dy]) {
    const { u, v } = worldToPixel(
      dx,
      dy,
      this.yamlData,
      this.pgmImg.width,
      this.pgmImg.height,
    )

    const { x: cx, y: cy } = pixelToCanvas(u, v, this.pgmImg)

    return {
      x: cx,
      y: cy,
    }
  }

  /* ---------------------- 交互控制 ---------------------- */
  _initPanZoom() {
    let isDragging = false
    let lastPosX, lastPosY
    const canvas = this.canvasInstance

    canvas.on('mouse:down', opt => {
      isDragging = true
      lastPosX = opt.e.clientX
      lastPosY = opt.e.clientY
    })

    canvas.on('mouse:move', opt => {
      if (!isDragging) return
      const { e } = opt
      const vpt = canvas.viewportTransform
      vpt[4] += e.clientX - lastPosX
      vpt[5] += e.clientY - lastPosY
      canvas.requestRenderAll()
      lastPosX = e.clientX
      lastPosY = e.clientY
    })

    canvas.on('mouse:up', () => (isDragging = false))
  }

  setZoom(zoom) {
    const canvas = this.canvasInstance
    zoom = Math.min(Math.max(zoom, this.minZoom), this.maxZoom)
    const center = { x: canvas.getWidth() / 2, y: canvas.getHeight() / 2 }
    canvas.zoomToPoint(center, zoom)
    this.zoom = zoom
  }

  registerMarker(marker) {
    this._markers.set(marker.instanceId, marker)
  }

  registerPolyline(polyline) {
    this._polylines.set(polyline.instanceId, polyline)
  }

  getMarker(id) {
    return this._markers.get(id)
  }

  getPolyline(id) {
    return this._polylines.get(id)
  }
}

/**
 * 世界坐标转，适用于 PgmMap 的屏幕坐标。
 * 输入的 x, y 单位为米（地图世界坐标）。
 * 返回的 x, y 单位为像素，用于 canvas 绘制。
 */
PgmMap.LatLng = class {
  /**
   * @param {PgmMap} map 地图实例
   * @param {number} dx 世界坐标 X（米）
   * @param {number} dy 世界坐标 Y（米）
   */
  constructor(map, [dx, dy]) {
    this.latLng = [dx, dy]
    const { x, y } = map.getPixelCoordinates([dx, dy])
    this.x = x
    this.y = y
  }
}

PgmMap.MultiMarker = MultiMarker

PgmMap.MarkerStyle = MarkerStyle

PgmMap.MultiPolyline = MultiPolyline

PgmMap.PolylineStyle = PolylineStyle

export default PgmMap
