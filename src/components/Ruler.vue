<template>
  <div class="ruler-container">
    <!-- 角落 -->
    <div class="ruler-corner"></div>
    
    <!-- 水平标尺 -->
    <div class="ruler-horizontal" ref="horizontalRuler">
      <canvas 
        ref="horizontalCanvas" 
        :width="horizontalWidth" 
        :height="24"
        class="ruler-canvas"
      ></canvas>
    </div>
    
    <!-- 垂直标尺 -->
    <div class="ruler-vertical" ref="verticalRuler">
      <canvas 
        ref="verticalCanvas" 
        :width="24" 
        :height="verticalHeight"
        class="ruler-canvas"
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  zoom: {
    type: Number,
    default: 1
  },
  canvasWidth: {
    type: Number,
    default: 800
  },
  canvasHeight: {
    type: Number,
    default: 600
  }
})

const horizontalRuler = ref(null)
const verticalRuler = ref(null)
const horizontalCanvas = ref(null)
const verticalCanvas = ref(null)

const horizontalWidth = ref(800)
const verticalHeight = ref(600)

// 标尺配置
const RULER_SIZE = 24
const RULER_MARK_SIZE = 6
const RULER_TEXT_OFFSET = 8

/**
 * 绘制水平标尺
 * 根据缩放比例在 Canvas 上绘制刻度线和数值
 */
const drawHorizontalRuler = () => {
  const canvas = horizontalCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const width = horizontalWidth.value
  const height = RULER_SIZE
  
  // 清空画布
  ctx.clearRect(0, 0, width, height)
  
  // 背景
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(0, 0, width, height)
  
  // 边框
  ctx.strokeStyle = '#d9d9d9'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, height - 0.5)
  ctx.lineTo(width, height - 0.5)
  ctx.stroke()
  
  // 计算刻度间隔
  const zoom = props.zoom
  let step = 100 // 基础刻度间隔（像素）
  
  if (zoom < 0.5) step = 200
  else if (zoom < 0.75) step = 100
  else if (zoom < 1) step = 50
  else if (zoom >= 2) step = 50
  else if (zoom >= 3) step = 25
  
  const scaledStep = step * zoom
  
  // 绘制刻度
  ctx.fillStyle = '#8c8c8c'
  ctx.strokeStyle = '#8c8c8c'
  ctx.font = '9px -apple-system, BlinkMacSystemFont, sans-serif'
  
  for (let i = 0; i <= props.canvasWidth; i += step) {
    const x = i * zoom
    
    // 主刻度
    ctx.beginPath()
    ctx.moveTo(x, height)
    ctx.lineTo(x, height - RULER_MARK_SIZE)
    ctx.stroke()
    
    // 刻度值
    ctx.fillText(i.toString(), x + 2, RULER_TEXT_OFFSET)
    
    // 辅助刻度
    if (step >= 50) {
      const subStep = step / 5
      for (let j = 1; j < 5; j++) {
        const subX = (i + j * subStep) * zoom
        ctx.beginPath()
        ctx.moveTo(subX, height)
        ctx.lineTo(subX, height - RULER_MARK_SIZE / 2)
        ctx.stroke()
      }
    }
  }
}

/**
 * 绘制垂直标尺
 * 根据缩放比例在 Canvas 上绘制刻度线和数值（垂直显示）
 */
const drawVerticalRuler = () => {
  const canvas = verticalCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const width = RULER_SIZE
  const height = verticalHeight.value
  
  // 清空画布
  ctx.clearRect(0, 0, width, height)
  
  // 背景
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(0, 0, width, height)
  
  // 边框
  ctx.strokeStyle = '#d9d9d9'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(width - 0.5, 0)
  ctx.lineTo(width - 0.5, height)
  ctx.stroke()
  
  // 计算刻度间隔
  const zoom = props.zoom
  let step = 100
  
  if (zoom < 0.5) step = 200
  else if (zoom < 0.75) step = 100
  else if (zoom < 1) step = 50
  else if (zoom >= 2) step = 50
  else if (zoom >= 3) step = 25
  
  const scaledStep = step * zoom
  
  // 绘制刻度
  ctx.fillStyle = '#8c8c8c'
  ctx.strokeStyle = '#8c8c8c'
  ctx.font = '9px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.textAlign = 'right'
  
  for (let i = 0; i <= props.canvasHeight; i += step) {
    const y = i * zoom
    
    // 主刻度
    ctx.beginPath()
    ctx.moveTo(width, y)
    ctx.lineTo(width - RULER_MARK_SIZE, y)
    ctx.stroke()
    
    // 刻度值（垂直显示）
    ctx.save()
    ctx.translate(RULER_TEXT_OFFSET - 2, y + 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(i.toString(), 0, 0)
    ctx.restore()
    
    // 辅助刻度
    if (step >= 50) {
      const subStep = step / 5
      for (let j = 1; j < 5; j++) {
        const subY = (i + j * subStep) * zoom
        ctx.beginPath()
        ctx.moveTo(width, subY)
        ctx.lineTo(width - RULER_MARK_SIZE / 2, subY)
        ctx.stroke()
      }
    }
  }
}

/**
 * 更新标尺尺寸
 * 根据容器尺寸更新水平和垂直标尺的画布大小，然后重绘
 */
const updateRulerSizes = () => {
  if (horizontalRuler.value) {
    horizontalWidth.value = Math.max(horizontalRuler.value.clientWidth, 800)
  }
  if (verticalRuler.value) {
    verticalHeight.value = Math.max(verticalRuler.value.clientHeight, 600)
  }
  
  drawHorizontalRuler()
  drawVerticalRuler()
}

// 监听缩放变化
watch(() => props.zoom, () => {
  updateRulerSizes()
})

watch(() => props.canvasWidth, () => {
  updateRulerSizes()
})

watch(() => props.canvasHeight, () => {
  updateRulerSizes()
})

// 生命周期
onMounted(() => {
  setTimeout(updateRulerSizes, 100)
  window.addEventListener('resize', updateRulerSizes)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateRulerSizes)
})
</script>

<style scoped>
.ruler-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
}

.ruler-corner {
  position: absolute;
  top: 0;
  left: 0;
  width: 24px;
  height: 24px;
  background: #fafafa;
  border-right: 1px solid #d9d9d9;
  border-bottom: 1px solid #d9d9d9;
  z-index: 11;
}

.ruler-horizontal {
  position: absolute;
  top: 0;
  left: 24px;
  right: 0;
  height: 24px;
  background: #fafafa;
  border-bottom: 1px solid #d9d9d9;
  overflow: hidden;
}

.ruler-vertical {
  position: absolute;
  top: 24px;
  left: 0;
  bottom: 0;
  width: 24px;
  background: #fafafa;
  border-right: 1px solid #d9d9d9;
  overflow: hidden;
}

.ruler-canvas {
  display: block;
}
</style>
