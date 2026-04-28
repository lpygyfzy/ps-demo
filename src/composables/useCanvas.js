import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { fabric } from 'fabric'

/**
 * useCanvas Composable
 * 提供 Fabric.js 画布的完整功能封装
 * @param {Ref<HTMLCanvasElement>} canvasRef - 画布 DOM 元素的引用
 */
export function useCanvas(canvasRef) {
  // 画布实例
  const fabricCanvas = ref(null)
  
  // 画布状态
  const canvasState = reactive({
    zoom: 1,
    width: 800,
    height: 600,
    panX: 0,
    panY: 0,
    backgroundColor: '#ffffff',
    selectedObject: null
  })

  // 历史记录（用于撤销/重做）
  const history = ref([])
  const historyIndex = ref(-1)
  const isHistoryAction = ref(false)

  /**
   * 初始化 Fabric.js 画布
   * 创建画布实例并绑定事件监听器
   * @returns {fabric.Canvas} 画布实例
   */
  const initCanvas = () => {
    if (!canvasRef.value) return

    fabricCanvas.value = new fabric.Canvas(canvasRef.value, {
      width: canvasState.width,
      height: canvasState.height,
      backgroundColor: canvasState.backgroundColor,
      selection: true,
      preserveObjectStacking: true
    })

    // 监听选择事件
    fabricCanvas.value.on('selection:created', handleSelection)
    fabricCanvas.value.on('selection:updated', handleSelection)
    fabricCanvas.value.on('selection:cleared', () => {
      canvasState.selectedObject = null
    })

    // 监听对象修改
    fabricCanvas.value.on('object:modified', () => {
      if (!isHistoryAction.value) {
        saveHistory()
      }
    })

    fabricCanvas.value.on('object:added', () => {
      if (!isHistoryAction.value) {
        saveHistory()
      }
    })

    // 初始化历史
    saveHistory()

    return fabricCanvas.value
  }

  /**
   * 处理选择事件
   * @param {Object} e - Fabric.js 事件对象
   */
  const handleSelection = (e) => {
    const selected = e.selected ? e.selected[0] : null
    canvasState.selectedObject = selected
  }

  /**
   * 保存当前状态到历史记录
   */
  const saveHistory = () => {
    if (isHistoryAction.value) return
    
    const json = fabricCanvas.value.toJSON()
    
    // 移除超出范围的历史
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }
    
    history.value.push(json)
    historyIndex.value = history.value.length - 1
    
    // 限制历史记录数量
    if (history.value.length > 50) {
      history.value.shift()
      historyIndex.value--
    }
  }

  /**
   * 撤销上一操作
   */
  const undo = () => {
    if (historyIndex.value > 0) {
      historyIndex.value--
      restoreHistory()
    }
  }

  /**
   * 重做上一撤销的操作
   */
  const redo = () => {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      restoreHistory()
    }
  }

  /**
   * 从历史记录恢复状态
   */
  const restoreHistory = async () => {
    isHistoryAction.value = true
    const json = history.value[historyIndex.value]
    
    await fabricCanvas.value.loadFromJSON(json, () => {
      fabricCanvas.value.renderAll()
      isHistoryAction.value = false
    })
  }

  /**
   * 在画布上添加矩形
   * @param {Object} options - 矩形配置选项
   * @returns {fabric.Rect}
   */
  const addRect = (options = {}) => {
    const rect = new fabric.Rect({
      left: options.left || 100,
      top: options.top || 100,
      width: options.width || 100,
      height: options.height || 80,
      fill: options.fill || '#1890ff',
      stroke: options.stroke || '',
      strokeWidth: options.strokeWidth || 0,
      angle: options.angle || 0,
      ...options
    })
    fabricCanvas.value.add(rect)
    fabricCanvas.value.setActiveObject(rect)
    fabricCanvas.value.renderAll()
    return rect
  }

  /**
   * 在画布上添加圆形
   * @param {Object} options - 圆形配置选项
   * @returns {fabric.Circle}
   */
  const addCircle = (options = {}) => {
    const circle = new fabric.Circle({
      left: options.left || 100,
      top: options.top || 100,
      radius: options.radius || 50,
      fill: options.fill || '#52c41a',
      stroke: options.stroke || '',
      strokeWidth: options.strokeWidth || 0,
      angle: options.angle || 0,
      ...options
    })
    fabricCanvas.value.add(circle)
    fabricCanvas.value.setActiveObject(circle)
    fabricCanvas.value.renderAll()
    return circle
  }

  /**
   * 进入自由绘制模式
   * @param {Object} options - 绘制设置 { color, width }
   * @returns {fabric.PencilBrush}
   */
  const addFreeDrawing = (options = {}) => {
    fabricCanvas.value.isDrawingMode = true
    fabricCanvas.value.freeDrawingBrush.color = options.color || '#000000'
    fabricCanvas.value.freeDrawingBrush.width = options.width || 2
    return fabricCanvas.value.freeDrawingBrush
  }

  /**
   * 退出自由绘制模式
   */
  const exitFreeDrawing = () => {
    fabricCanvas.value.isDrawingMode = false
  }

  /**
   * 获取当前自由绘制设置
   * @returns {Object} { color, width }
   */
  const getFreeDrawingSettings = () => {
    return {
      color: fabricCanvas.value.freeDrawingBrush.color,
      width: fabricCanvas.value.freeDrawingBrush.width
    }
  }

  /**
   * 设置画布缩放级别
   * @param {number} zoom - 缩放值
   */
  const setZoom = (zoom) => {
    const clampedZoom = Math.max(0.1, Math.min(5, zoom))
    canvasState.zoom = clampedZoom
    fabricCanvas.value.setZoom(clampedZoom)
    fabricCanvas.value.setDimensions({
      width: canvasState.width * clampedZoom,
      height: canvasState.height * clampedZoom
    })
    fabricCanvas.value.renderAll()
  }

  /**
   * 放大画布
   */
  const zoomIn = () => setZoom(canvasState.zoom + 0.1)

  /**
   * 缩小画布
   */
  const zoomOut = () => setZoom(canvasState.zoom - 0.1)

  /**
   * 重置缩放到 100%
   */
  const resetZoom = () => setZoom(1)

  /**
   * 删除当前选中的对象
   */
  const deleteSelected = () => {
    const activeObject = fabricCanvas.value.getActiveObject()
    if (activeObject) {
      if (activeObject.type === 'activeSelection') {
        activeObject.forEachObject(obj => {
          fabricCanvas.value.remove(obj)
        })
      } else {
        fabricCanvas.value.remove(activeObject)
      }
      fabricCanvas.value.discardActiveObject()
      fabricCanvas.value.renderAll()
      saveHistory()
    }
  }

  /**
   * 更新选中对象的属性
   * @param {Object} props - 属性键值对
   */
  const updateSelectedObject = (props) => {
    const activeObject = fabricCanvas.value.getActiveObject()
    if (activeObject) {
      activeObject.set(props)
      activeObject.setCoords()
      fabricCanvas.value.renderAll()
    }
  }

  /**
   * 将选中对象移到最顶层
   */
  const bringToFront = () => {
    const activeObject = fabricCanvas.value.getActiveObject()
    if (activeObject) {
      activeObject.bringToFront()
      fabricCanvas.value.renderAll()
      saveHistory()
    }
  }

  /**
   * 将选中对象移到最底层
   */
  const sendToBack = () => {
    const activeObject = fabricCanvas.value.getActiveObject()
    if (activeObject) {
      activeObject.sendToBack()
      fabricCanvas.value.renderAll()
      saveHistory()
    }
  }

  /**
   * 清空画布
   */
  const clearCanvas = () => {
    fabricCanvas.value.clear()
    fabricCanvas.value.backgroundColor = canvasState.backgroundColor
    fabricCanvas.value.renderAll()
    saveHistory()
  }

  /**
   * 导出为图片
   * @param {string} format - 图片格式
   * @returns {string} DataURL
   */
  const exportToImage = (format = 'png') => {
    return fabricCanvas.value.toDataURL({
      format: format,
      quality: 1,
      multiplier: 1 / canvasState.zoom
    })
  }

  /**
   * 获取画布中心点坐标
   * @returns {Object} { x, y }
   */
  const getCanvasCenter = () => {
    return {
      x: fabricCanvas.value.width / 2,
      y: fabricCanvas.value.height / 2
    }
  }

  /**
   * 销毁画布实例
   */
  const dispose = () => {
    if (fabricCanvas.value) {
      fabricCanvas.value.dispose()
      fabricCanvas.value = null
    }
  }

  return {
    fabricCanvas,
    canvasState,
    initCanvas,
    addRect,
    addCircle,
    addFreeDrawing,
    exitFreeDrawing,
    getFreeDrawingSettings,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    deleteSelected,
    updateSelectedObject,
    bringToFront,
    sendToBack,
    clearCanvas,
    exportToImage,
    getCanvasCenter,
    undo,
    redo,
    dispose
  }
}