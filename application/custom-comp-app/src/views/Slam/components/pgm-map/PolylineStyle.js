export default class PolylineStyle {
  color = '#3777FF'
  width = 3
  borderWidth = 1
  borderColor = '#3777FF'
  eraseColor = '#3777FF'
  lineCap = 'butt'
  dashArray = [0, 0]

  static _versionSeed = 1 // 类级别的全局计数器

  /**
   * @param {Object} options
   * @param {string} [options.color] - 线填充色，支持rgb()，rgba()，#RRGGBB等形式，默认为#3777FF。
   * @param {number} [options.width] - 折线宽度，正整数，单位为像素，指的是地图pitch为0时的屏幕像素大小，如果pitch不为0，实际绘制出来的线宽度与屏幕像素会存在一定误差，默认为3。
   * @param {number} [options.borderWidth] - 边线宽度，非负整数，默认为0，单位为像素，指的是地图pitch为0时的屏幕像素大小，如果pitch不为0，实际绘制出来的线宽度与屏幕像素会存在一定误差，默认为1。
   * @param {string} [options.borderColor] - 边线颜色，支持rgb()，rgba()，#RRGGBB等形式，borderWidth不为0时有效，默认为#3777FF。
   * @param {string} [options.eraseColor] - 擦除线填充色，支持rgb()，rgba()，#RRGGBB等形式，默认为#3777FF。
   * @param {'butt'|'round'|'square'} [options.lineCap] - 线端头方式，可选为butt，round，square，默认为butt。
   * @param {[number, number]} [options.dashArray] - 虚线展示方式，[0, 0]为实线，[10, 10]表示十个像素的实线和十个像素的空白（如此反复）组成的虚线，默认为[0, 0];这里的像素指的是地图pitch为0时的屏幕像素大小，如果pitch不为0，实际绘制出来的线宽度与屏幕像素会存在一定误差。
   */
  constructor(options) {
    const {
      color,
      width,
      borderWidth,
      borderColor,
      eraseColor,
      lineCap,
      dashArray,
    } = options

    if (color != null) this.color = color
    if (width != null) this.width = width
    if (borderWidth != null) this.borderWidth = borderWidth
    if (borderColor != null) this.borderColor = borderColor
    if (eraseColor != null) this.eraseColor = eraseColor
    if (lineCap != null) this.lineCap = lineCap
    if (dashArray != null) this.dashArray = dashArray

    this.version = PolylineStyle._versionSeed++
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
