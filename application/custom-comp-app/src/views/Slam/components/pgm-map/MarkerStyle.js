/**
 * @typedef {Object} MarkerStyle
 * @property {number} [width] - 图片宽度
 * @property {number} [height] - 图片高度
 * @property {{x:number,y:number}} [anchor] - 锚点
 * @property {string} [src] - 图片地址/base64
 * @property {string} [color] - 文字颜色
 * @property {number} [size] - 文字大小
 * @property {'top'|'bottom'|'left'|'right'} [direction] - 文字方向
 * @property {{x:number,y:number}} [offset] - 偏移
 * @property {string} [strokeColor] - 文字描边颜色
 * @property {number} [strokeWidth] - 文字描边宽度
 * @property {string} [backgroundColor] - 文字背景色
 * @property {[px: number, py: number]} [padding] - 文字框 padding
 * @property {[rx: number, ry: number]} [radius] - 文字框内圆角
 * @property {number} [version] - 文字框内圆角
 * @property {Function} [computeTextOffset] - 文字偏移计算
 * @property {Function} [apply] - 扩展样式计算
 */
export default class MarkerStyle {
  static _versionSeed = 1 // 类级别的全局计数器

  /**
   * @param {Object} options
   * @param {number} [options.width] - 图片宽度
   * @param {number} [options.height] - 图片高度
   * @param {{x:number,y:number}} [options.anchor] - 锚点, 默认以图标底部为基点
   * @param {string} [options.src] - 图片地址/base64
   * @param {string} [options.color] - 文字颜色
   * @param {number} [options.size] - 文字大小
   * @param {'top'|'bottom'|'left'|'right' |'center'} [options.direction] - 文字方向
   * @param {{x:number,y:number}} [options.offset] - 偏移
   * @param {string} [options.strokeColor] - 文字描边颜色
   * @param {number} [options.strokeWidth] - 文字描边宽度
   * @param {string} [options.backgroundColor] - 文字背景色
   * @param {[px: number, py: number]} [options.padding] - 文字框 padding
   * @param {[rx: number, ry: number]} [options.radius] - 文字框内圆角
   */
  constructor(options = {}) {
    this.width = options.width ?? 32
    this.height = options.height ?? 32
    this.anchor = options.anchor ?? { x: this.width / 2, y: this.height / 2 }
    this.src = options.src ?? null
    this.color = options.color ?? '#000'
    this.size = options.size ?? 14
    this.direction = options.direction ?? 'center'
    this.offset = options.offset ?? { x: 0, y: 0 }
    this.strokeColor = options.strokeColor ?? '#fff'
    this.strokeWidth = options.strokeWidth ?? 0
    this.backgroundColor = options.backgroundColor ?? null
    this.padding = options.padding ?? [0, 0]
    this.radius = options.radius ?? [0, 0]

    this.version = MarkerStyle._versionSeed++
  }

  /**
   * 根据方向和偏移计算文字最终偏移
   * @returns {{x:number, y:number}}
   */
  computeTextOffset() {
    const { direction = 'center', offset = { x: 0, y: 0 }, width, height } = this
    let dx = offset.x
    let dy = offset.y

    switch (direction) {
      case 'top': dy -= height / 2; break
      case 'bottom': dy += height / 2; break
      case 'left': dx -= width / 2; break
      case 'right': dx += width / 2; break
      default: break
    }
    return { x: dx, y: dy }
  }

  apply(extra = {}) {
    let changed = false

    for (const key in extra) {
      if (!Object.prototype.hasOwnProperty.call(this, key)) continue

      const oldVal = this[key]
      const newVal = extra[key]

      if (oldVal !== newVal) {
        this[key] = newVal
        changed = true
      }
    }

    if (changed) this.version++
  }
}
