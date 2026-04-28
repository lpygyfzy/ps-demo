<template>
  <div class="canvas-wrapper">
    <!-- 顶部和左侧标尺 -->
    <Ruler 
      :zoom="canvasState.zoom" 
      :canvasWidth="canvasState.width"
      :canvasHeight="canvasState.height"
    />
    
    <!-- 画布容器 -->
    <div 
      ref="scrollContainer"
      class="canvas-container"
      :class="{
        'tool-select': currentTool === ToolType.SELECT,
        'tool-move': currentTool === ToolType.MOVE
      }"
      @wheel="handleWheel"
    >
      <div 
        class="canvas-viewport"
        :style="viewportStyle"
      >
        <canvas ref="canvasRef"></canvas>
      </div>
    </div>

    <!-- 缩放控制 -->
    <div class="zoom-controls">
      <a-button-group size="small">
        <a-button @click="zoomOut" title="缩小">
          <MinusOutlined />
        </a-button>
        <a-button @click="resetZoom" title="重置缩放">
          {{ Math.round(canvasState.zoom * 100) }}%
        </a-button>
        <a-button @click="zoomIn" title="放大">
          <PlusOutlined />
        </a-button>
      </a-button-group>
      <a-button size="small" @click="fitToScreen" title="适应屏幕">
        <ExpandOutlined />
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { fabric } from 'fabric'
import { 
  MinusOutlined, 
  PlusOutlined, 
  ExpandOutlined 
} from '@ant-design/icons-vue'
import Ruler from './Ruler.vue'
import { ToolType } from '../composables/useTools'

const props = defineProps({
  currentTool: {
    type: String,
    default: ToolType.SELECT
  },
  toolSettings: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'canvas-ready', 
  'object-selected', 
  'object-modified',
  'tool-change'
])

// Refs
const canvasRef = ref(null)
const scrollContainer = ref(null)

// 画布实例
let fabricCanvas = null

// 画布状态
const canvasState = reactive({
  zoom: 1,
  width: 800,
  height: 600,
  backgroundColor: '#ffffff',
  selectedObject: null
})

// 视口样式
const viewportStyle = computed(() => ({
  transform: `scale(${canvasState.zoom})`,
  transformOrigin: 'center center',
  width: `${canvasState.width}px`,
  height: `${canvasState.height}px`,
  backgroundColor: canvasState.backgroundColor,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  position: 'absolute',
  left: '50%',
  top: '50%',
  marginLeft: `-${canvasState.width / 2}px`,
  marginTop: `-${canvasState.height / 2}px`
}))

// 历史记录
const history = ref([])
const historyIndex = ref(-1)
const isHistoryAction = ref(false)

/**
 * 初始化 Fabric.js 画布
 * 创建画布实例，绑定事件监听器，初始化历史记录
 * @returns {fabric.Canvas} 画布实例
 */
const initCanvas = () => {
  if (!canvasRef.value) return

  fabricCanvas = new fabric.Canvas(canvasRef.value, {
    width: canvasState.width,
    height: canvasState.height,
    backgroundColor: canvasState.backgroundColor,
    selection: true,
    preserveObjectStacking: true
  })

  // 设置绘制模式
  fabricCanvas.isDrawingMode = false
  fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas)
  fabricCanvas.freeDrawingBrush.color = props.toolSettings.penColor || '#000000'
  fabricCanvas.freeDrawingBrush.width = props.toolSettings.penWidth || 2

  // 监听选择事件
  fabricCanvas.on('selection:created', handleSelection)
  fabricCanvas.on('selection:updated', handleSelection)
  fabricCanvas.on('selection:cleared', () => {
    canvasState.selectedObject = null
    emit('object-selected', null)
  })

  // 监听对象修改
  fabricCanvas.on('object:modified', (e) => {
    if (!isHistoryAction.value) {
      saveHistory()
    }
    emit('object-modified', e.target)
  })

  // 监听对象添加
  fabricCanvas.on('object:added', (e) => {
    if (!isHistoryAction.value && e.target) {
      saveHistory()
      // 通知父组件更新撤销/重做按钮状态
      emit('object-modified', e.target)
    }
  })

  // 监听鼠标事件用于绘制形状
  fabricCanvas.on('mouse:down', handleMouseDown)
  fabricCanvas.on('mouse:move', handleMouseMove)
  fabricCanvas.on('mouse:up', handleMouseUp)

  // 监听对象移动/旋转/缩放事件，实时更新属性面板
  fabricCanvas.on('object:moving', (e) => {
    canvasState.selectedObject = e.target
    emit('object-selected', e.target)
  })

  fabricCanvas.on('object:rotating', (e) => {
    canvasState.selectedObject = e.target
    emit('object-selected', e.target)
  })

  fabricCanvas.on('object:scaling', (e) => {
    canvasState.selectedObject = e.target
    emit('object-selected', e.target)
  })

  // 初始化历史
  saveHistory()

  emit('canvas-ready', fabricCanvas)

  return fabricCanvas
}

// 临时对象用于绘制
let tempObject = null
let isDrawing = false
let startPoint = { x: 0, y: 0 }

/**
 * 处理鼠标按下事件
 * 根据当前工具类型开始绘制形状（矩形、圆形）或检测是否点击了已有对象
 * @param {Object} opt - Fabric.js 鼠标事件对象
 */
const handleMouseDown = (opt) => {
  // 如果点击的是已有对象，不触发绘制，让Fabric.js处理选择
  if (opt.target) {
    return
  }
  if (props.currentTool === ToolType.RECT || props.currentTool === ToolType.CIRCLE) {
    isDrawing = true
    const pointer = fabricCanvas.getPointer(opt.e)
    startPoint = { x: pointer.x, y: pointer.y }
    
        if (props.currentTool === ToolType.RECT) {
      tempObject = new fabric.Rect({
        left: pointer.x,
        top: pointer.y,
        width: 0,
        height: 0,
        fill: props.toolSettings.fillColor || '#1890ff',
        stroke: props.toolSettings.strokeColor || '#000000',
        strokeWidth: props.toolSettings.strokeWidth || 2,
        strokeUniform: true,
        originX: 'center',
        originY: 'center',
        hasRotatingPoint: true,
        rotatingPointOffset: 40,
        cornerSize: 10,
        transparentCorners: false,
        cornerColor: '#1890ff',
        cornerStrokeColor: '#ffffff',
        borderColor: '#1890ff',
        borderScaleFactor: 2
      })
    } else if (props.currentTool === ToolType.CIRCLE) {
      tempObject = new fabric.Circle({
        left: pointer.x,
        top: pointer.y,
        radius: 0,
        fill: props.toolSettings.fillColor || '#52c41a',
        stroke: props.toolSettings.strokeColor || '#000000',
        strokeWidth: props.toolSettings.strokeWidth || 2,
        strokeUniform: true,
        originX: 'center',
        originY: 'center',
        hasRotatingPoint: true,
        rotatingPointOffset: 40,
        cornerSize: 10,
        transparentCorners: false,
        cornerColor: '#52c41a',
        cornerStrokeColor: '#ffffff',
        borderColor: '#52c41a',
        borderScaleFactor: 2
      })
    }
    
    fabricCanvas.add(tempObject)
  }
}

/**
 * 处理鼠标移动事件
 * 更新临时形状的尺寸（矩形的长宽、圆形的半径）
 * @param {Object} opt - Fabric.js 鼠标事件对象
 */
const handleMouseMove = (opt) => {
  if (!isDrawing || !tempObject) return
  
  const pointer = fabricCanvas.getPointer(opt.e)
  
  if (props.currentTool === ToolType.RECT) {
    const width = Math.abs(pointer.x - startPoint.x)
    const height = Math.abs(pointer.y - startPoint.y)
    const centerX = (pointer.x + startPoint.x) / 2
    const centerY = (pointer.y + startPoint.y) / 2
    
    tempObject.set({
      width: width,
      height: height,
      left: centerX,
      top: centerY
    })
  } else if (props.currentTool === ToolType.CIRCLE) {
    const radius = Math.sqrt(
      Math.pow(pointer.x - startPoint.x, 2) + 
      Math.pow(pointer.y - startPoint.y, 2)
    ) / 2
    const centerX = (pointer.x + startPoint.x) / 2
    const centerY = (pointer.y + startPoint.y) / 2
    
    tempObject.set({
      radius: radius,
      left: centerX,
      top: centerY
    })
  }
  
  fabricCanvas.renderAll()
}

/**
 * 处理鼠标释放事件
 * 完成形状绘制，如果绘制区域太小则删除临时对象
 */
const handleMouseUp = () => {
  if (isDrawing && tempObject) {
    // 如果绘制区域太小，删除临时对象
    const isTooSmall = tempObject.type === 'rect'
      ? (tempObject.width < 5 || tempObject.height < 5)
      : (tempObject.radius && tempObject.radius < 5)
    
    if (isTooSmall) {
      fabricCanvas.remove(tempObject)
    } else {
      fabricCanvas.setActiveObject(tempObject)
      saveHistory()
      // 通知父组件更新选中对象
      canvasState.selectedObject = tempObject
      emit('object-selected', tempObject)
    }
    tempObject = null
    isDrawing = false
  }
}

/**
 * 处理对象选择事件
 * 将选中的对象存储到 canvasState 并通过 emit 通知父组件
 * @param {Object} e - Fabric.js 选择事件对象
 */
const handleSelection = (e) => {
  const selected = e.selected ? e.selected[0] : null
  canvasState.selectedObject = selected
  emit('object-selected', selected)
}

/**
 * 保存当前画布状态到历史记录
 * 用于撤销/重做功能，最多保存50条历史记录
 */
const saveHistory = () => {
  if (isHistoryAction.value) return
  
  const json = fabricCanvas.toJSON()
  
  // 移除超出范围的历史
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }
  
  history.value.push(JSON.stringify(json))
  historyIndex.value = history.value.length - 1
  
  // 限制历史记录数量
  if (history.value.length > 50) {
    history.value.shift()
    historyIndex.value--
  }
}

/**
 * 撤销上一操作
 * 将历史索引减一并恢复对应的画布状态
 */
const undo = () => {
  if (historyIndex.value > 0) {
    historyIndex.value--
    restoreHistory()
  }
}

/**
 * 重做上一撤销的操作
 * 将历史索引加一并恢复对应的画布状态
 */
const redo = () => {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++
    restoreHistory()
  }
}

/**
 * 从历史记录恢复画布状态
 * 异步加载历史 JSON 并重绘画布
 */
const restoreHistory = async () => {
  isHistoryAction.value = true
  const json = JSON.parse(history.value[historyIndex.value])
  
  await fabricCanvas.loadFromJSON(json, () => {
    fabricCanvas.renderAll()
    isHistoryAction.value = false
  })
}

/**
 * 设置画布缩放级别
 * @param {number} zoom - 目标缩放值，范围 0.1 - 5
 */
const setZoom = (zoom) => {
  const clampedZoom = Math.max(0.1, Math.min(5, zoom))
  canvasState.zoom = clampedZoom
}

/**
 * 放大画布
 * 将缩放级别增加 0.1
 */
const zoomIn = () => setZoom(canvasState.zoom + 0.1)

/**
 * 缩小画布
 * 将缩放级别减少 0.1
 */
const zoomOut = () => setZoom(canvasState.zoom - 0.1)

/**
 * 重置缩放到 100%
 */
const resetZoom = () => setZoom(1)

/**
 * 自动适应屏幕
 * 根据画布容器尺寸计算最佳缩放比例，使画布完整显示在屏幕内
 */
const fitToScreen = () => {
  if (!scrollContainer.value) return
  const containerRect = scrollContainer.value.getBoundingClientRect()
  const scaleX = (containerRect.width - 100) / canvasState.width
  const scaleY = (containerRect.height - 100) / canvasState.height
  setZoom(Math.min(scaleX, scaleY, 1))
}

/**
 * 处理鼠标滚轮事件
 * 当按住 Ctrl/Cmd 键时，滚轮可以缩放画布
 * @param {WheelEvent} e - 滚轮事件对象
 */
const handleWheel = (e) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(canvasState.zoom + delta)
  }
}

/**
 * 在画布上添加一个矩形
 * @param {Object} options - 矩形配置选项
 * @returns {fabric.Rect} 创建的矩形对象
 */
const addRect = (options = {}) => {
  const rect = new fabric.Rect({
    left: options.left || 100,
    top: options.top || 100,
    width: options.width || 100,
    height: options.height || 80,
    fill: options.fill || props.toolSettings.fillColor || '#1890ff',
    stroke: options.stroke || props.toolSettings.strokeColor || '',
    strokeWidth: options.strokeWidth || props.toolSettings.strokeWidth || 0,
    angle: options.angle || 0,
    strokeUniform: true,
    originX: 'center',
    originY: 'center',
    hasRotatingPoint: true,
    rotatingPointOffset: 40,
    cornerSize: 10,
    transparentCorners: false,
    cornerColor: '#1890ff',
    cornerStrokeColor: '#ffffff',
    borderColor: '#1890ff',
    borderScaleFactor: 2
  })
  fabricCanvas.add(rect)
  fabricCanvas.setActiveObject(rect)
  fabricCanvas.renderAll()
  saveHistory()
  return rect
}

/**
 * 在画布上添加一个圆形
 * @param {Object} options - 圆形配置选项
 * @returns {fabric.Circle} 创建的圆形对象
 */
const addCircle = (options = {}) => {
  const circle = new fabric.Circle({
    left: options.left || 100,
    top: options.top || 100,
    radius: options.radius || 50,
    fill: options.fill || props.toolSettings.fillColor || '#52c41a',
    stroke: options.stroke || props.toolSettings.strokeColor || '',
    strokeWidth: options.strokeWidth || props.toolSettings.strokeWidth || 0,
    angle: options.angle || 0,
    strokeUniform: true,
    originX: 'center',
    originY: 'center',
    hasRotatingPoint: true,
    rotatingPointOffset: 40,
    cornerSize: 10,
    transparentCorners: false,
    cornerColor: '#52c41a',
    cornerStrokeColor: '#ffffff',
    borderColor: '#52c41a',
    borderScaleFactor: 2
  })
  fabricCanvas.add(circle)
  fabricCanvas.setActiveObject(circle)
  fabricCanvas.renderAll()
  saveHistory()
  return circle
}

/**
 * 删除当前选中的对象
 * 支持删除单个对象或多个选中对象（activeSelection）
 */
const deleteSelected = () => {
  const activeObject = fabricCanvas.getActiveObject()
  if (activeObject) {
    if (activeObject.type === 'activeSelection') {
      activeObject.forEachObject(obj => {
        fabricCanvas.remove(obj)
      })
    } else {
      fabricCanvas.remove(activeObject)
    }
    fabricCanvas.discardActiveObject()
    fabricCanvas.renderAll()
    saveHistory()
  }
}

/**
 * 更新当前选中对象的属性
 * @param {Object} props - 要更新的属性键值对
 */
const updateSelectedObject = (props) => {
  const activeObject = fabricCanvas.getActiveObject()
  if (activeObject) {
    activeObject.set(props)
    activeObject.setCoords()
    fabricCanvas.renderAll()
    // 更新后通知父组件刷新界面
    canvasState.selectedObject = activeObject
    emit('object-selected', activeObject)
  }
}

/**
 * 将选中对象移到图层最顶层
 */
const bringToFront = () => {
  const activeObject = fabricCanvas.getActiveObject()
  if (activeObject) {
    activeObject.bringToFront()
    fabricCanvas.renderAll()
    saveHistory()
  }
}

/**
 * 将选中对象移到图层最底层
 */
const sendToBack = () => {
  const activeObject = fabricCanvas.getActiveObject()
  if (activeObject) {
    activeObject.sendToBack()
    fabricCanvas.renderAll()
    saveHistory()
  }
}

/**
 * 清空画布上所有对象
 * 清空后重置历史记录，使其成为无法撤销的操作
 */
const clearCanvas = () => {
  fabricCanvas.clear()
  fabricCanvas.backgroundColor = canvasState.backgroundColor
  fabricCanvas.renderAll()
  
  // 直接设置历史记录为空画布状态，使清空操作无法撤销
  // 历史记录只有一条（空画布），historyIndex = 0，所以 canUndo = false
  history.value = [JSON.stringify(fabricCanvas.toJSON())]
  historyIndex.value = 0
  
  // 通知父组件更新撤销/重做按钮状态
  emit('object-modified', null)
}

/**
 * 将画布导出为图片 DataURL
 * @param {string} format - 图片格式 ('png' | 'jpeg' | 'webp')
 * @returns {string} 图片的 DataURL
 */
const exportToImage = (format = 'png') => {
  return fabricCanvas.toDataURL({
    format: format,
    quality: 1,
    multiplier: 1 / canvasState.zoom
  })
}

/**
 * 获取历史记录状态
 * @returns {Object} { canUndo, canRedo }
 */
const getHistoryState = () => {
  return {
    canUndo: historyIndex.value > 0,
    canRedo: historyIndex.value < history.value.length - 1
  }
}

// 监听工具变化
watch(() => props.currentTool, (newTool) => {
  if (!fabricCanvas) return
  
  // 退出绘制模式
  fabricCanvas.isDrawingMode = false
  
  // 允许所有工具都能选择对象（除了钢笔工具在绘制时）
  fabricCanvas.selection = true
  
  // 设置所有对象都可选
  fabricCanvas.forEachObject(obj => {
    obj.selectable = true
  })
  
  // 如果选择钢笔工具，进入自由绘制模式
  if (newTool === ToolType.PEN) {
    fabricCanvas.isDrawingMode = true
    fabricCanvas.freeDrawingBrush.color = props.toolSettings.penColor
    fabricCanvas.freeDrawingBrush.width = props.toolSettings.penWidth
  }
})

// 监听钢笔设置变化
watch(() => props.toolSettings.penColor, (newColor) => {
  if (fabricCanvas && fabricCanvas.isDrawingMode) {
    fabricCanvas.freeDrawingBrush.color = newColor
  }
})

watch(() => props.toolSettings.penWidth, (newWidth) => {
  if (fabricCanvas && fabricCanvas.isDrawingMode) {
    fabricCanvas.freeDrawingBrush.width = newWidth
  }
})

// 生命周期
onMounted(() => {
  nextTick(() => {
    initCanvas()
  })
})

// 暴露属性和方法
defineExpose({
  canvasState,
  canvasRef: () => fabricCanvas,
  addRect,
  addCircle,
  deleteSelected,
  updateSelectedObject,
  bringToFront,
  sendToBack,
  clearCanvas,
  exportToImage,
  undo,
  redo,
  getHistoryState,
  setZoom,
  zoomIn,
  zoomOut,
  resetZoom,
  fitToScreen
})
</script>

<style scoped>
.canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.canvas-container {
  position: absolute;
  top: 24px;
  left: 24px;
  right: 0;
  bottom: 0;
  overflow: auto;
  background: var(--canvas-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.canvas-viewport {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.zoom-controls {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 100;
}

.zoom-level {
  font-size: 14px;
  color: #595959;
  min-width: 50px;
  text-align: center;
}
</style>
