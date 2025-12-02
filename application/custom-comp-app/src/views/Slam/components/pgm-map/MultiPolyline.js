/**
 * PolylineGeometry 表示单个 polyline 的几何信息
 * @typedef {Object} PolylineGeometry
 * @property {string} [id] - 折线图形数据的标志信息，不可重复，若id重复后面的id会被重新分配一个新id，若没有会随机生成一个。
 * @property {string} [styleId] - 对应MultiPolylineStyleHash中的样式id，如果样式表中没有包含geometry指定的styleId，则该geometry会以默认样式绘制。
 * @property {Array<LatLng> | LatLng[][]} [paths] - 折线的位置信息，可以传入[latLng1, latLng2, latLng3]。
 * @property {Array<string>} [rainbowPaths] - 多颜色折线的信息，若传入该属性，其优先级高于paths。
 * 数据格式：[{path: [latLng1, latLng2, latLng3], color: ‘#FFFFFF’, borderColor: ‘#FFFFFF’},
 * {path: [latLng3, latLng4, latLng5], color: ‘#000000’, borderColor: ‘#000000’}]，
 * 数组中每个对象包含一个path和对应填充颜色以及边线颜色，对于连续的线，
 * 需要保证后一个对象中path的起点是前一个对象中path的终点，颜色可选填，支持rgb()，rgba()，#RRGGBB等形式，默认为styleId对应的样式对象中的颜色配置。
 * @property {Object} [properties] - 折线的属性数据。
 */
import { fabric } from 'fabric-with-erasing'
import { randomUUID } from '@/components/SlamMap/utils'

export default class MultiPolyline {
  /**
   * @param {Object} options
   * @param {string} [options.id]
   * @param {PgmMap} options.map - SlamMap 实例
   * @param {Object<string, PolylineStyle>} [options.styles] 样式集合，要求有 id
   * @param {Array<PolylineGeometry>} [options.geometries] 初始化 geometry
   */
  constructor(options = {}) {
    const { id = crypto.randomUUID(), map, styles = {}, geometries = [] } = options

    if (!map?.canvasInstance) throw new Error('MultiMarker: 必须传入 SlamMap 实例')
    this.id = id
    this.map = map
    this.styles = styles
    this.geometries = geometries
    this.instanceId = randomUUID()
    map.registerPolyline(this)
    this._renderAll()
  }

  _renderAll() {
    const canvas = this.map.canvasInstance
    if (!canvas) return

    this.geometries.forEach(geo => {
      this._createPolyline(canvas, geo)
    })

    canvas.requestRenderAll()
  }

  _createPolyline(canvas, geometry) {
    const { paths, styleId, id, extraStyle = {} } = geometry
    const style = styleId ? this.styles[styleId] : this.styles.default
    if (!style) throw new Error(`找不到 PolylineStyle: ${styleId || 'default'}`)

    style.apply(extraStyle)

    const points = paths.map(path => ({x: path.x, y: path.y}))
    const polyline = new fabric.Polyline(points, {
      fill: '',
      stroke: style.color,
      strokeWidth: style.width,
      strokeDashArray: style.dashArray,
      strokeLineCap: style.lineCap,
    })

    polyline.polyline_id = id
    polyline.style_id = styleId
    polyline.style_version = style.version
    polyline.geometry = JSON.parse(JSON.stringify(geometry))
    polyline.metadata = { id, type: 'MultiPolyline' }
    polyline.instanceId = this.instanceId
    canvas.add(polyline)
  }

  /**
   * 更新多边形数据, 默认位置按最新的 geometry 中的 paths 更新
   * @param polyline
   * @param geometry
   * @private
   */
  _updatePolyline(polyline, geometry) {
    const { paths: newPaths, styleId, id, extraStyle = {} } = geometry
    const style = styleId ? this.styles[styleId] : this.styles.default
    if (!style) throw new Error(`找不到 PolylineStyle: ${styleId || 'default'}`)
    const oldPaths = polyline.geometry.paths || []
    style.apply(extraStyle)
    const pathChanged =
      oldPaths.length !== newPaths.length ||
      oldPaths.some((p, i) => p.x !== newPaths[i].x || p.y !== newPaths[i].y)

    if (pathChanged) {
      const points = newPaths.map(path => ({x: path.x, y: path.y}))
      polyline.set({ points })
      polyline.geometry.paths = geometry.paths.map(p => ({ ...p }))
    }

    if (styleId && styleId !== polyline.style_id || style.version !== polyline.style_version) {
      // 样式更新
      polyline.set({
        stroke: style.color,
        strokeWidth: style.width,
        strokeDashArray: style.dashArray,
        strokeLineCap: style.lineCap,
      })

      polyline.style_id = styleId
      polyline.style_version = style.version
    }
  }

  /**
   * 更新多边形数据，如果geometry的id存在于集合中，会更新对id的数据，如果之前不存在于集合中，会作为新的多边形添加到集合中；如果参数为null或undefined不会做任何处理。
   * @param geometry
   * @returns {MultiPolyline}
   */
  updateGeometries(geometry) {
    return this.add(geometry)
  }

  /**
   * 向图层中添加多边形，如果geometry的id已经存在集合中，则该geometry不会被重复添加，如果geometry没有id或者id不存在于集合中会被添加到集合，
   * 没有id的geometry会被赋予一个唯一id；如果要添加到集合中的多边形存在重复id，这些多边形会被重新分配id；如果参数为null或undefined不会做任何处理。
   * @param geometries
   * @returns {MultiPolyline}
   */
  add(geometries) {
    if (!geometries?.length) return this
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
        const polyline = canvas.getObjects().find(obj => obj.polyline_id === geo.id)

        if (polyline) {
          // 这部分逻辑是否可以复用 _createMarker?
          this._updatePolyline(polyline, geo)
          polyline.setCoords()
          polyline._setPositionDimensions({})
          polyline.dirty = true
        }
      } else {
        this.geometries.push(geo)
        // 创建新的多边形
        this._createPolyline(canvas, geo)
      }
    })

    canvas.requestRenderAll()
    return this
  }

  /**
   * 移除指定id的多边形，如果参数为null或undefined不会做任何处理。
   * @param ids
   * @returns {MultiPolyline}
   */
  remove(ids) {
    if (!ids?.length) return this
    const canvas = this.map.canvasInstance
    ids.forEach(id => {
      const polyline = canvas.getObjects().find(obj => obj.polyline_id === id)
      canvas.remove(polyline)
    })

    canvas.requestRenderAll()
    return this
  }

  moveTo(geometries) {
    if (!geometries?.length) return this

    geometries.forEach((geometry) => {
      const oldGeometry = this.geometries.find(geo => geo.id === geometry.id)
      if (oldGeometry) {
        const oldPaths = oldGeometry.paths
        oldGeometry.paths = [...geometry.paths, ...oldPaths]
      }
    })

    this.updateGeometries(this.geometries)
  }
}
