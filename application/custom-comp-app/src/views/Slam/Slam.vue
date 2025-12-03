<template>
  <div class="slam-map-wrap">
    <div
      ref="pgmElRef"
      class="pgm-map-container"
    ></div>
    <div class="pcd-map-container"></div>
  </div>
</template>

<script setup>
import { nextTick, ref, useTemplateRef } from 'vue'
import PgmMap from './components/pgm-map/PgmMap.js'
import sourceData from './data/point/point.json'

const pointData = [sourceData[0], sourceData[300], sourceData[800]].map(
  (item, index) => {
    return {
      nodeStatus: index,
      id: item['%time'],
      pointId: `${index + 1}`,
      poseData: {
        pos_x: item['field.pose.pose.position.x'],
        pos_y: item['field.pose.pose.position.y'],
      },
    }
  },
)

const pgmUrl = new URL(
  './data/pgm/rBnWgWkWf5SAQWxfAA9Cfeh1MFg120.pgm',
  import.meta.url,
).href
const yamlUrl = new URL(
  './data/pgm/rBnWgWkWf4eAdN9rAAAAbTpkbUE14.yaml',
  import.meta.url,
).href

const pgmEl = useTemplateRef('pgmElRef')
let slamMapInstance = null
let pointMarker = null
let deviceMarker = null
let deviceLine = null
let pollingTimer = null
let nextIndex = 0

const stopPolling = ref(false)

function getIconPath(name) {
  return new URL(`../../assets/slam/${name}.png`, import.meta.url).href
}

function initMapCover() {
  const defaultPointMarkerStyle = {
    // 点标注的相关样式
    width: 20, // 宽度
    height: 25, // 高度
    anchor: { x: 0, y: 0 }, // 标注点图片的锚点位置
    src: getIconPath('not'), // 标注点图片url或base64地址
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
  pointMarker = new PgmMap.MultiMarker({
    map: slamMapInstance,
    styles: {
      wait: new PgmMap.MarkerStyle(defaultPointMarkerStyle),
      success: new PgmMap.MarkerStyle({
        ...defaultPointMarkerStyle,
        src: getIconPath('been'),
      }),
      process: new PgmMap.MarkerStyle({
        ...defaultPointMarkerStyle,
        src: getIconPath('new'),
      }),
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

  deviceMarker = new PgmMap.MultiMarker({
    map: slamMapInstance,
    styles: {
      normal: new PgmMap.MarkerStyle({
        ...defaultDeviceMarkerStyle,
        src: getIconPath('device-normal'),
      }),
      fault: new PgmMap.MarkerStyle({
        ...defaultDeviceMarkerStyle,
        src: getIconPath('device-fault'),
      }),
    },
    geometries: [],
  })

  deviceLine = new PgmMap.MultiPolyline({
    map: slamMapInstance,
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

async function renderMap(el) {
  try {
    slamMapInstance = await PgmMap.create(el, [pgmUrl, yamlUrl])
    initMapCover()
    return Promise.resolve(true)
  } catch (e) {
    console.error('地图初始化失败')
    console.log(e)
    return Promise.reject(false)
  }
}

function setPoints(data) {
  if (!data || !Array.isArray(data)) return
  pointMarker?.updateGeometries(
    data.map((item) => {
      if (typeof item.poseData === 'string') {
        item.poseData = JSON.parse(item.poseData)
      }
      return {
        id: item.id,

        styleId:
          item.nodeStatus === 1
            ? 'process'
            : item.nodeStatus === 2
              ? 'success'
              : 'wait',
        position: new PgmMap.LatLng(slamMapInstance, [
          item.poseData.pos_x,
          item.poseData.pos_y,
        ]),
        content: `${item.pointId}`,
      }
    }),
  )
}

function setDeviceMarker(id, deviceName, position, extraStyle) {
  const pos = position.filter(Boolean)
  if (!pos.length) return
  deviceMarker?.updateGeometries([
    {
      id: `device_marker_${id}`,
      styleId: 'normal',
      position: new PgmMap.LatLng(slamMapInstance, pos),
      content: deviceName || '',
      extraStyle,
    },
  ])
}

async function mockDataPolling() {
  if (stopPolling.value) return
  try {
    const totalLength = sourceData.length
    if (nextIndex >= totalLength) {
      return
    }
    const data = sourceData[nextIndex]
    data.posX = data['field.pose.pose.position.x']
    data.posY = data['field.pose.pose.position.y']
    if (data) {
      const { posX, posY } = data
      setDeviceMarker(`111`, '小狗1号', [posX, posY])

      deviceLine.moveTo([
        {
          id: `device_line_111`,
          styleId: 'normal',
          paths: [new PgmMap.LatLng(slamMapInstance, [posX, posY])],
        },
      ])
    }
  } catch (err) {
    console.error('轮询出错', err)
  }
  // 延迟后继续下一轮
  pollingTimer = setTimeout(() => {
    nextIndex += 1
    mockDataPolling()
  }, 100)
}

nextTick(async () => {
  try {
    await renderMap(pgmEl.value)
    setPoints(pointData)
    mockDataPolling()
  } catch (e) {
    console.log(e)
  }
})
</script>

<style lang="less" scoped>
.slam-map-wrap {
  width: 100%;
  height: 100%;
  padding: 24px;
  background-color: #17181a;
}
.pgm-map-container {
  width: 100%;
  height: 512px;
  background-color: #cdcdcd;
  border-radius: 16px;
  overflow: hidden;
}
</style>
