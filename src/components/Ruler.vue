<template>
  <div class="ruler-container">
    <!-- 角落 -->
    <div class="ruler-corner"></div>
    
    <!-- 水平标尺 -->
    <div class="ruler-horizontal" ref="horizontalRuler">
      <canvas 
        ref="horizontalCanvas" 
        class="ruler-canvas"
      ></canvas>
    </div>
    
    <!-- 垂直标尺 -->
    <div class="ruler-vertical" ref="verticalRuler">
      <canvas 
        ref="verticalCanvas" 
        class="ruler-canvas"
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  canvasWidth: {
    type: Number,
    default: 800
  },
  canvasHeight: {
    type: Number,
    default: 600
  },
  toolbarWidth: {
    type: Number,
    default: 48
  },
  toolbarHeight: {
    type: Number,
    default: 48
  }
})

const horizontalRuler = ref(null)
const verticalRuler = ref(null)
const horizontalCanvas = ref(null)
const verticalCanvas = ref(null)

const RULER_SIZE = 24
const RULER_MARK_SIZE = 6
const RULER_TEXT_OFFSET = 8

/**
 * 绘制水平标尺
 */
const drawHorizontalRuler = () => {
  const canvas = horizontalCanvas.value
  if (!canvas || !horizontalRuler.value) return
  
  const containerWidth = horizontalRuler.value.clientWidth
  canvas.width = containerWidth
  canvas.height = RULER_SIZE
  
  const ctx = canvas.getContext('2d')
  
  // 清空画布
  ctx.clearRect(0, 0, containerWidth, RULER_SIZE)
  
  // 背景
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(0, 0, containerWidth, RULER_SIZE)
  
  // 边框
  ctx.strokeStyle = '#d9d9d9'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, RULER_SIZE - 0.5)
  ctx.lineTo(containerWidth, RULER_SIZE - 0.5)
  ctx.stroke()
  
  // 绘制刻度
  ctx.fillStyle = '#8c8c8c'
  ctx.strokeStyle = '#8c8c8c'
  ctx.font = '9px -apple-system, BlinkMacSystemFont, sans-serif'
  
  const step = 50
  const maxValue = props.canvasWidth || Math.floor(containerWidth / step) * step
  
  for (let i = 0; i <= maxValue; i += step) {
    const x = (i / maxValue) * containerWidth
    
    // 主刻度
    ctx.beginPath()
    ctx.moveTo(x, RULER_SIZE)
    ctx.lineTo(x, RULER_SIZE - RULER_MARK_SIZE)
    ctx.stroke()
    
    // 刻度值
    ctx.fillText(i.toString(), x + 2, RULER_TEXT_OFFSET)
  }
}

/**
 * 绘制垂直标尺
 */
const drawVerticalRuler = () => {
  const canvas = verticalCanvas.value
  if (!canvas || !verticalRuler.value) return
  
  const containerHeight = verticalRuler.value.clientHeight
  canvas.width = RULER_SIZE
  canvas.height = containerHeight
  
  const ctx = canvas.getContext('2d')
  
  // 清空画布
  ctx.clearRect(0, 0, RULER_SIZE, containerHeight)
  
  // 背景
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(0, 0, RULER_SIZE, containerHeight)
  
  // 边框
  ctx.strokeStyle = '#d9d9d9'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(RULER_SIZE - 0.5, 0)
  ctx.lineTo(RULER_SIZE - 0.5, containerHeight)
  ctx.stroke()
  
  // 绘制刻度
  ctx.fillStyle = '#8c8c8c'
  ctx.strokeStyle = '#8c8c8c'
  ctx.font = '9px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.textAlign = 'right'
  
  const step = 50
  const maxValue = props.canvasHeight || Math.floor(containerHeight / step) * step
  
  for (let i = 0; i <= maxValue; i += step) {
    const y = (i / maxValue) * containerHeight
    
    // 主刻度
    ctx.beginPath()
    ctx.moveTo(RULER_SIZE, y)
    ctx.lineTo(RULER_SIZE - RULER_MARK_SIZE, y)
    ctx.stroke()
    
    // 刻度值（垂直显示）
    ctx.save()
    ctx.translate(RULER_TEXT_OFFSET - 2, y + 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(i.toString(), 0, 0)
    ctx.restore()
  }
}

/**
 * 更新标尺
 */
const updateRuler = () => {
  drawHorizontalRuler()
  drawVerticalRuler()
}

// 监听画布尺寸变化
watch(() => props.canvasWidth, updateRuler)
watch(() => props.canvasHeight, updateRuler)

// 生命周期
onMounted(async () => {
  await nextTick()
  updateRuler()
  window.addEventListener('resize', updateRuler)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateRuler)
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
  height: 24px;
  background: #fafafa;
}

.ruler-vertical {
  position: absolute;
  top: 24px;
  left: 0;
  width: 24px;
  background: #fafafa;
}

.ruler-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>