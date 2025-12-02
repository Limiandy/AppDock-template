import { fabric } from 'fabric-with-erasing'
import MarkerStyle from '@/components/SlamMap/MarkerStyle'
import { randomUUID } from '@/components/SlamMap/utils'

/**
 * @typedef {Object} LatLng
 * @property {number} lat - 纬度
 * @property {number} lng - 经度
 */

/**
 * PointGeometry 表示单个 marker 的几何信息
 * @typedef {Object} PointGeometry
 * @property {string} [id] - 点图形数据的唯一标识，不可重复。若未提供会随机生成。若重复，后续会重新分配。
 * @property {string} [styleId] - 对应 MultiMarker 样式表中的样式 ID。如果样式表中没有此 ID，会使用默认样式。
 * @property {LatLng} position - 标注点在地图上的位置（经纬度）。
 * @property {number} [rank] - 绘制顺序，值越大越靠上绘制。
 * @property {Object} [properties] - 自定义属性数据，可存储任意附加信息。
 * @property {string} [content] - 标注点文本内容，默认 undefined 表示不绘制文本。
 * @property {MarkerStyle} [extraStyle] - 扩展的样式，会覆盖样式表中的样式。
 */

export default class MultiMarker {
  /**
   * @param {Object} options
   * @param {PgmMap} options.map - SlamMap 实例
   * @param {Object<string,MarkerStyle>} options.styles - 样式集合
   * @param {Array<PointGeometry>} options.geometries - marker 数据
   */
  constructor({ map, styles = {}, geometries = [] }) {
    if (!map?.canvasInstance) throw new Error('MultiMarker: 必须传入 SlamMap 实例')
    this.map = map
    this.styles = styles
    this.geometries = geometries
    this._events = {} // <—— 事件池
    this.instanceId = randomUUID()
    map.registerMarker(this)
    this._renderAllMarkers()
  }

  on(eventName, handler) {
    if (!this._events[eventName]) {
      this._events[eventName] = []
    }
    this._events[eventName].push(handler)
    return this
  }

  off(eventName, handler) {
    if (!this._events[eventName]) return this
    this._events[eventName] = this._events[eventName].filter(h => h !== handler)
    return this
  }

  _emit(eventName, payload) {
    if (!this._events[eventName]) return
    this._events[eventName].forEach(h => h(payload))
  }

  addEvents(marker, eventObject) {
    marker.on('mousedown', e => {
      this._emit('click', {
        ...eventObject,
        fabricEvent: e,
      })
    })

    marker.on('mouseup', e => {
      this._emit('mouseup', {
        ...eventObject,
        fabricEvent: e,
      })
    })

    marker.on('mouseover', e => {
      this._emit('marker:mouseenter', {
        ...eventObject,
        fabricEvent: e,
      })
    })

    marker.on('mouseout', e => {
      this._emit('marker:mouseleave', {
        ...eventObject,
        fabricEvent: e,
      })
    })
  }

  /**
   * 渲染所有 marker
   */
  async _renderAllMarkers() {
    const canvas = this.map.canvasInstance
    if (!canvas) return

    this.geometries.forEach(geo => {
      this._createMarker(canvas, geo)
    })

    canvas.requestRenderAll()
  }

  async _createMarker(canvas, geometry) {
    const { position, content, styleId, id, extraStyle = {} } = geometry
    const style = styleId ? this.styles[styleId] : this.styles.default
    if (!style) throw new Error(`找不到 MarkerStyle: ${styleId || 'default'}`)

    style.apply(extraStyle)

    const {
      src,
      width: targetWidth,
      height: targetHeight,
      color,
      size,
      anchor: { x: anchorX = 0, y: anchorY = 0 },
      strokeColor,
      strokeWidth,
      backgroundColor,
    } = style

    const imgMarker = new fabric.Group([], {
      width: targetWidth,
      height: targetHeight,
      originX: 'center',
      originY: 'center',
      selectable: false,
    })

    let textContent = null
    let textBox = null

    if (src) {
      const img = await new Promise((resolve, reject) => {
        fabric.Image.fromURL(src, resolve)
      })

      const originWidth = img.width
      const originHeight = img.height

      img.set({
        originX: 'center',
        originY: 'center',
        scaleX: targetWidth / originWidth,
        scaleY: targetHeight / originHeight,
      })
      imgMarker.add(img)
    }

    if (content) {
      const { x: dx, y: dy } = style.computeTextOffset() // 整体偏移

      const text = new fabric.Text(`${content}`, {
        originX: 'center',
        originY: 'center',
        fontSize: size,
        fill: color,
        stroke: strokeColor || undefined,
        strokeWidth: strokeWidth || 0,
      })

      if (backgroundColor) {
        const [px, py] = Array.isArray(style.padding) ? style.padding : [0, 0]
        const [rx, ry] = Array.isArray(style.radius) ? style.radius : [0, 0]

        const bg = new fabric.Rect({
          fill: backgroundColor,
          rx,
          ry,
          width: text.width + px * 2,
          height: text.height + py * 2,
          originX: 'center', // 关键：改为 center
          originY: 'center',
          absolutePositioned: true,
        })

        textBox = new fabric.Group([bg, text], {
          left: dx,
          top: dy,
          originX: 'center',
          originY: 'center',
          selectable: false,
          absolutePositioned: true,
        })
      } else {
        // 文字没有背景，直接按偏移
        text.set({
          left: dx,
          top: dy,
          originX: 'center',
          originY: 'center',
          selectable: false,
        })
        textContent = text
      }
    }
    const children = [imgMarker, textBox, textContent].filter(Boolean)
    const marker = new fabric.Group(children, {
      left: position.x + anchorX,
      top: position.y + anchorY,
      originX: 'center',
      originY: 'bottom',
      selectable: false,
    })
    marker.marker_id = id
    marker.style_id = styleId
    marker.style_version = style.version
    marker.geometry = JSON.parse(JSON.stringify(geometry))
    marker.metadata = { id, type: 'MultiMarker' }
    marker.anchor = style.anchor
    marker.instanceId = this.instanceId

    const eventObject = {
      id,
      geometry,
      style,
      marker,
    }

    this.addEvents(marker, eventObject)
    canvas.add(marker)
  }

  async _updateMarker(marker, geometry) {
    const { id, styleId, content, position, extraStyle = {} } = geometry

    const style = styleId ? this.styles[styleId] : this.styles.default
    if (!style) {
      console.warn(`MarkerStyle 未找到: ${styleId || 'default'}`)
      return
    }

    style.apply(extraStyle)

    const canvas = this.map.canvasInstance

    // 旧数据
    const oldGeo = marker?.geometry || {}
    const oldStyleId = marker?.style_id

    // 核心判断：是否需要重建
    const needsRecreate =
      !marker ||
      styleId !== oldStyleId || // 样式变了
      content !== oldGeo.content || // 文本变了
      style.version !== marker?.style_version // 动态样式变了（推荐）

    if (needsRecreate) {
      if (marker) this.remove([id])
      this.geometries.push(geometry)
      return await this._createMarker(canvas, geometry)
    }

    // -------- 位置更新（唯一不重建的部分）--------
    if (
      position &&
      typeof position.x === 'number' &&
      typeof position.y === 'number'
    ) {
      const oldPos = oldGeo.position
      const posChanged =
        !oldPos ||
        oldPos.x !== position.x ||
        oldPos.y !== position.y

      if (posChanged) {
        const { anchor: { x: ax = 0, y: ay = 0 } = {} } = style

        marker.set({
          left: position.x + ax,
          top: position.y + ay,
        })
        // 更新 marker.geometry
        marker.geometry.position = { ...position }

        marker.setCoords()
      }
    }

    return marker
  }

  /**
   * 移除指定 ID 的 marker
   * @param {array<string>} ids - marker id 数组
   * @returns {this}
   */
  remove(ids) {
    if (!ids?.length) return this
    const canvas = this.map.canvasInstance
    if (canvas.getActiveObject()) {
      canvas.discardActiveObject()
    }
    ids.forEach(id => {
      const marker = canvas.getObjects().find(obj => obj.marker_id === id)
      canvas.remove(marker)
      this.geometries = this.geometries.filter(geo => geo.id !== id)
    })

    canvas.requestRenderAll()
    return this
  }

  /**
   * 设置 MultiMarker 图层的样式信息
   * @param {Object<string, MarkerStyle>} styles - 样式表，键是 styleId，值是 MarkerStyle 实例
   * @returns {this}
   */
  setStyles(styles) {
    if (!styles || typeof styles !== 'object') return this

    // 遍历新样式表，将其合并到当前 styles 中
    this.styles = this.styles || {}
    Object.keys(styles).forEach((key) => {
      const style = styles[key]
      if (style instanceof MarkerStyle) {
        this.styles[key] = style
      } else {
        console.warn(`MultiMarker.setStyles: style[${key}] 不是 MarkerStyle 实例，忽略`)
      }
    })

    return this
  }

  /**
   * 更新 MultiMarker 的标注点数据
   * @param {PointGeometry[]} geometries - 标注点数组
   * @returns {this}
   */
  updateGeometries(geometries) {
    if (!Array.isArray(geometries)) return this
    const canvas = this.map.canvasInstance
    this.geometries = this.geometries || []
    geometries.forEach((geo) => {
      const existingIndex = this.geometries.findIndex(g => g.id === geo.id)
      if (existingIndex >= 0) {
        // 已存在，更新 position 和 content
        this.geometries[existingIndex] = {
          ...this.geometries[existingIndex],
          ...geo,
        }
        const marker = canvas.getObjects().find(obj => obj.marker_id === geo.id)

        if (marker) {
          // 这部分逻辑是否可以复用 _createMarker?
          this._updateMarker(marker, geo)
          marker.setCoords()
        }
      } else {
        this.geometries.push(geo)
        this._createMarker(canvas, geo)
      }
    })

    canvas.requestRenderAll()
    return this
  }
}
