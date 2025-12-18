# PgmMap 组件文档

## 概述

`SlamMap` 是基于 `Fabric.js` 的 2D 地图渲染和标注管理库。
它可以：

- 渲染 PGM（P5）地图
- 支持世界坐标 ↔ 像素坐标 ↔ Canvas 坐标转换
- 支持 marker（单点标注）和 polyline（折线）图层
- 提供样式系统（MarkerStyle / PolylineStyle）和事件监听机制
- 提供二次开发扩展接口

## 核心概念

### 1. Marker

- 单个标注点，可以是图片或与文字的组合以及还有背景框的文字组合
- 样式通过 `MarkerStyle` 控制
- 支持事件：click、mouseup、mouseenter、mouseleave

### 2. Polyline

- 单色折线
- 样式通过 `PolylineStyle` 控制
- 支持路径更新和样式更新

### 3. 样式系统

- MarkerStyle：控制 marker 图片、文字、颜色、偏移等
- PolylineStyle：控制折线颜色、宽度、虚线、端点样式
- extraStyle：样式扩展，在更新覆盖物时可以覆盖其默认样式

### 4. 坐标系统

- 世界坐标（World）：以地图左下角为原点，单位：米
- 图像像素坐标（Pixel）：左上原点，单位：像素
- Canvas 坐标（Canvas）：Fabric.js Canvas 坐标，考虑 scale / origin

### 5. 视口重置

默认会监听视口的变化进行 resize 操作，主要的逻辑是监听到视口的改变，重新计算挂载节点宽高并且对canvas 及 pgm 图片进行大小及缩放的重新计算，然后重新以世界坐标转换成 canvas 坐标渲染各各对象的位置

## API 使用示例

### 1. 地图初始化

```js
// 初始化地图加载地图资源文件并挂载到 dom 节点，注意这里是异步调用，后续所有的操作要等待初始化完成，否则拿不到实例
const slamMapInstance = await PgmMap.create(el: HTMLElement, [pgmUrl: string, yamlUrl: string])
```

### 2. 地图覆盖物的初始化

```js
// 1. marker 对象的初始化
const marker = new PgmMap.MultiMarker({
  map: PgmMapInstance,
  styles: {
    [id: string]: new PgmMap.MarkerStyle(MarkerStyleOptions)
  },
  geometries: PointGeometry[]
})

// 2. line 对象的初始化
const line = new PgmMap.MultiPolyline({
  map: PgmMapInstance,
  styles: {
    [id: string]: new PgmMap.PolylineStyle(PolylineStyleOptions)
  },
  geometries: PolylineGeometry[]
})

// 3. 示例
function initMapCover() {
  // ======= strart 对图片与文字组合的 marker 进行初始化 ========
  const defaultPointMarkerStyle = {
    // 点标注的相关样式
    width: 20, // 宽度
    height: 25, // 高度
    anchor: { x: 0, y: 0 }, // 标注点图片的锚点位置
    src: require('@/assets/icons/slam/not.png'), // 标注点图片url或base64地址
    color: '#fff', // 标注点文本颜色
    size: 10, // 标注点文本文字大小
    direction: 'center', // 标注点文本文字相对于标注点图片的方位
    offset: { x: 0, y: 0 }, // 标注点文本文字基于direction方位的偏移属性
    strokeColor: '', // 标注点文本描边颜色
    strokeWidth: 0, // 标注点文本描边宽度
    backgroundColor: null,
    padding: [0, 0],
    radius: [0, 0],
  }
  const pointMarker = new PgmMap.MultiMarker({
    map: this.slamMapInstance,
    styles: {
      wait: new PgmMap.MarkerStyle(defaultPointMarkerStyle),
      success: new PgmMap.MarkerStyle({ ...defaultPointMarkerStyle, src: require('@/assets/icons/slam/been.png') }),
      process: new PgmMap.MarkerStyle({ ...defaultPointMarkerStyle, src: require('@/assets/icons/slam/new.png') }),
    },
    geometries: [],
  })

  const defaultDeviceMarkerStyle = {
    // 点标注的相关样式
    width: 25, // 宽度
    height: 25, // 高度
    anchor: { x: 0, y: 12 }, // 标注点图片的锚点位置
    src: null, // 标注点图片url或base64地址
    color: '#fff', // 标注点文本颜色
    size: 8, // 标注点文本文字大小
    direction: 'top', // 标注点文本文字相对于标注点图片的方位
    offset: { x: 0, y: -12 }, // 标注点文本文字基于direction方位的偏移属性
    strokeColor: '', // 标注点文本描边颜色
    strokeWidth: 0, // 标注点文本描边宽度
    backgroundColor: '#232D76',
    padding: [8, 4],
    radius: [10, 10],
  }

  const deviceMarker = new PgmMap.MultiMarker({
    map: this.slamMapInstance,
    styles: {
      normal: new PgmMap.MarkerStyle({
        ...defaultDeviceMarkerStyle, src: require('@/assets/icons/slam/device-normal.png'),
      }),
      fault: new PgmMap.MarkerStyle({
        ...defaultDeviceMarkerStyle, src: require('@/assets/icons/slam/device-fault.png'),
      }),
    },
    geometries: [],
  })

  const deviceLine = new PgmMap.MultiPolyline({
    map: this.slamMapInstance,
    styles: {
      normal: new PgmMap.PolylineStyle({
        color: '#98A4FF',
        width: 1,
        lineCap: 'round',
      }),
      dash: new PgmMap.PolylineStyle({
        color: '#98A4FF',
        width: 0.6,
        lineCap: 'round',
        dashArray: [5, 5],
      }),
    },
    geometries: [],
  })
}
```

### 3. 覆盖物的更新

```vue
// 覆盖物提供的 updateGeometries 方法，会有2种操作，如果对象存在就更新，否则就新增
marker.updateGeometries([
	{
      id: 要更新的点唯一标识,
      // eslint-disable-next-line no-nested-ternary
      styleId: 'process',
      position: new PgmMap.LatLng(map: PgmMapInstance, [x: number, y: number]),
      content: `1`,
  },
	...n
])

// 这里需要注意的与marker不同的是，会使用新的paths覆盖旧的，如需要更新请使用 moveTo 方法
line.updateGeometries([
	{
        id: 要更新的线唯一标识,
        styleId,
        paths: [new PgmMap.LatLng(map: PgmMapInstance, [x: number, y: number])],
        extraStyle,
  },
	...n
])

// 这个方法会使路径移动
line.moveTo([
  {
    id: `device_line_${this.currentDevice?.deviceId}`,
    styleId: 'normal',
    paths: [new PgmMap.LatLng(map: PgmMapInstance, [x: number, y: number])]
    extraStyle: { color: bgColor },
   },
 ])

```