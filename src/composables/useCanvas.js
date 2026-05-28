import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { fabric } from 'fabric'
import { ToolType } from './useTools'

/**
 * useCanvas Composable
 * 提供 Fabric.js 画布的完整功能封装，包括绘图、编辑模式、历史管理等
 *
 * @param {Object} options
 * @param {import('vue').Ref} options.canvasRef - 画布 DOM 元素引用
 * @param {import('vue').Ref} options.scrollContainer - 画布容器 DOM 引用
 * @param {Object} options.props - 组件 props（currentTool, toolSettings）
 * @param {Function} options.emit - 组件 emit 函数
 */
export function useCanvas({ canvasRef, scrollContainer, props, emit }) {
  // 画布实例
  let fabricCanvas = null

  // 画布状态
  const canvasState = reactive({
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    selectedObject: null
  })

  // 编辑模式状态
  const isEditMode = ref(false)
  let editingObject = null
  let controlPoints = []
  let editingGroup = null
  let originalFill = undefined

  // 历史记录
  const history = ref([])
  const historyIndex = ref(-1)
  const isHistoryAction = ref(false)

  /**
   * 获取容器尺寸并设置画布大小
   */
  const resizeCanvasToContainer = () => {
    if (!canvasRef.value || !scrollContainer.value) return

    const canvasWrapper = scrollContainer.value.parentElement
    if (!canvasWrapper) return

    const containerRect = canvasWrapper.getBoundingClientRect()

    const canvasWidth = containerRect.width - 24
    const canvasHeight = containerRect.height - 24

    canvasState.width = canvasWidth
    canvasState.height = canvasHeight

    if (fabricCanvas) {
      fabricCanvas.setWidth(canvasWidth)
      fabricCanvas.setHeight(canvasHeight)
      fabricCanvas.renderAll()
    }
  }

  /**
   * 初始化 Fabric.js 画布
   */
  const initCanvas = () => {
    if (!canvasRef.value) return

    resizeCanvasToContainer()

    fabric.Object.prototype.set({
      cornerSize: 8,
      transparentCorners: false,
      cornerColor: '#ffffff',
      cornerStrokeColor: '#1890ff',
      cornerStrokeWidth: 1,
      borderScaleFactor: 1,
      hasRotatingPoint: true,
      rotatingPointOffset: 30,
      padding: 0,
      hasBorder: true,
    })

    fabricCanvas = new fabric.Canvas(canvasRef.value, {
      width: canvasState.width,
      height: canvasState.height,
      backgroundColor: canvasState.backgroundColor,
      selection: true,
      preserveObjectStacking: true
    })

    fabricCanvas.isDrawingMode = false
    fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas)
    fabricCanvas.freeDrawingBrush.color = props.toolSettings.penColor || '#000000'
    fabricCanvas.freeDrawingBrush.width = props.toolSettings.penWidth || 2

    // 监听选择事件
    fabricCanvas.on('selection:created', (e) => {
      if (isEditMode.value) {
        fabricCanvas.discardActiveObject()
        return
      }
      handleSelection(e)
    })
    fabricCanvas.on('selection:updated', (e) => {
      if (isEditMode.value) {
        fabricCanvas.discardActiveObject()
        return
      }
      handleSelection(e)
    })
    fabricCanvas.on('selection:cleared', () => {
      canvasState.selectedObject = null
      emit('object-selected', null)
    })

    // 监听对象修改
    fabricCanvas.on('object:modified', (e) => {
      if (!isHistoryAction.value && !isEditMode.value) {
        saveHistory()
      }
      emit('object-modified', e.target)
    })

    // 监听对象添加
    fabricCanvas.on('object:added', (e) => {
      if (!isHistoryAction.value && e.target && e.target.type !== 'circle') {
        saveHistory()
        emit('object-modified', e.target)
      }
    })

    // 监听鼠标事件用于绘制形状
    fabricCanvas.on('mouse:down', handleMouseDown)
    fabricCanvas.on('mouse:move', handleMouseMove)
    fabricCanvas.on('mouse:up', handleMouseUp)

    // 监听双击事件进入编辑模式
    fabricCanvas.on('mouse:dblclick', handleDoubleClick)

    // 监听对象移动事件
    fabricCanvas.on('object:moving', (e) => {
      canvasState.selectedObject = e.target
      emit('object-selected', e.target)
    })

    // 边界检查
    fabricCanvas.on('object:modified', (e) => {
      const obj = e.target
      if (!obj || isEditMode.value) return

      const canvasWidth = canvasState.width
      const canvasHeight = canvasState.height
      const boundingRect = obj.getBoundingRect()
      const objWidth = boundingRect.width
      const objHeight = boundingRect.height
      const objLeft = boundingRect.left
      const objTop = boundingRect.top

      const maxLeft = canvasWidth - objWidth
      const maxTop = canvasHeight - objHeight

      const newLeft = Math.max(0, Math.min(objLeft, maxLeft))
      const newTop = Math.max(0, Math.min(objTop, maxTop))

      const deltaX = newLeft - objLeft
      const deltaY = newTop - objTop

      if (Math.round(deltaX) !== 0 || Math.round(deltaY) !== 0) {
        obj.set({
          left: obj.left + deltaX,
          top: obj.top + deltaY
        })
        fabricCanvas.renderAll()
      }
    })

    fabricCanvas.on('object:rotating', (e) => {
      canvasState.selectedObject = e.target
      emit('object-selected', e.target)
    })

    fabricCanvas.on('object:scaling', (e) => {
      canvasState.selectedObject = e.target
      emit('object-selected', e.target)
    })

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
   */
  const handleMouseDown = (opt) => {
    if (isEditMode.value) {
      handleEditMouseDown(opt)
      return
    }

    if (opt.target) {
      return
    }
    const drawingTools = [ToolType.RECT, ToolType.CIRCLE, ToolType.TRAPEZOID]
    if (drawingTools.includes(props.currentTool)) {
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
          originY: 'center'
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
          originY: 'center'
        })
      } else if (props.currentTool === ToolType.TRAPEZOID) {
        const initWidth = 100
        const initHeight = 80
        const initTopWidth = initWidth * 0.6
        tempObject = new fabric.Polygon([
          { x: -initTopWidth / 2, y: -initHeight / 2 },
          { x: initTopWidth / 2, y: -initHeight / 2 },
          { x: initWidth / 2, y: initHeight / 2 },
          { x: -initWidth / 2, y: initHeight / 2 }
        ], {
          left: pointer.x,
          top: pointer.y,
          width: initWidth,
          height: initHeight,
          fill: props.toolSettings.fillColor || '#722ed1',
          stroke: props.toolSettings.strokeColor || '#000000',
          strokeWidth: props.toolSettings.strokeWidth || 2,
          strokeUniform: true,
          originX: 'center',
          originY: 'center'
        })
        tempObject.setCoords()
      }

      fabricCanvas.add(tempObject)
    }
  }

  /**
   * 处理编辑模式下的鼠标按下事件
   */
  const handleEditMouseDown = (opt) => {
    const pointer = fabricCanvas.getPointer(opt.e)

    const hitPoint = findHitControlPoint(pointer)
    if (hitPoint) {
      hitPoint.isDragging = true
      hitPoint.startX = pointer.x
      hitPoint.startY = pointer.y
      hitPoint.startObjX = editingObject.left
      hitPoint.startObjY = editingObject.top
      return
    }

    const edgeHit = findHitEdge(pointer)
    if (edgeHit) {
      addControlPointAtEdge(edgeHit.edgeIndex, pointer)
      return
    }

    exitEditMode()
  }

  /**
   * 查找点击的控制点
   */
  const findHitControlPoint = (pointer) => {
    for (let i = 0; i < controlPoints.length; i++) {
      const point = controlPoints[i]
      const dx = point.x - pointer.x
      const dy = point.y - pointer.y
      if (dx * dx + dy * dy < 16 * 16) {
        return point
      }
    }
    return null
  }

  /**
   * 查找点击的边线
   */
  const findHitEdge = (pointer) => {
    const points = getObjectPoints(editingObject)
    if (!points || points.length < 2) return null

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i]
      const p2 = points[(i + 1) % points.length]

      const dist = pointToLineDistance(pointer.x, pointer.y, p1.x, p1.y, p2.x, p2.y)
      if (dist < 10) {
        return { edgeIndex: i, p1, p2 }
      }
    }
    return null
  }

  /**
   * 计算点到线段的距离
   */
  const pointToLineDistance = (px, py, x1, y1, x2, y2) => {
    const A = px - x1
    const B = py - y1
    const C = x2 - x1
    const D = y2 - y1

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1

    if (lenSq !== 0) param = dot / lenSq

    let xx, yy

    if (param < 0) {
      xx = x1
      yy = y1
    } else if (param > 1) {
      xx = x2
      yy = y2
    } else {
      xx = x1 + param * C
      yy = y1 + param * D
    }

    const dx = px - xx
    const dy = py - yy
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * 在边线上添加控制点
   */
  const addControlPointAtEdge = (edgeIndex, pointer) => {
    const points = getObjectPoints(editingObject)
    if (!points) return

    const newPoint = { x: pointer.x, y: pointer.y }
    points.splice(edgeIndex + 1, 0, newPoint)

    updateObjectFromPoints(points)
    saveHistory()
  }

  /**
   * 获取对象的控制点
   */
  const getObjectPoints = (obj) => {
    if (!obj) return null

    switch (obj.type) {
      case 'rect': {
        const { left, top, width, height } = obj
        const scaleX = obj.scaleX || 1
        const scaleY = obj.scaleY || 1
        const actualWidth = width * scaleX
        const actualHeight = height * scaleY
        return [
          { x: left - actualWidth / 2, y: top - actualHeight / 2 },
          { x: left + actualWidth / 2, y: top - actualHeight / 2 },
          { x: left + actualWidth / 2, y: top + actualHeight / 2 },
          { x: left - actualWidth / 2, y: top + actualHeight / 2 }
        ]
      }
      case 'polygon':
      case 'polyline': {
        const scaleX = obj.scaleX || 1
        const scaleY = obj.scaleY || 1
        return obj.points.map(p => ({
          x: obj.left + p.x * scaleX,
          y: obj.top + p.y * scaleY
        }))
      }
      case 'path':
        return extractPathPoints(obj)
      default:
        return null
    }
  }

  /**
   * 从路径中提取点
   */
  const extractPathPoints = (path) => {
    const points = []
    const pathData = path.path
    if (!pathData) return points

    let currentX = 0, currentY = 0
    pathData.forEach(segment => {
      const cmd = segment[0]
      switch (cmd) {
        case 'M':
          currentX = segment[1]
          currentY = segment[2]
          points.push({ x: path.left + currentX, y: path.top + currentY })
          break
        case 'L':
          currentX = segment[1]
          currentY = segment[2]
          points.push({ x: path.left + currentX, y: path.top + currentY })
          break
        case 'C':
          currentX = segment[5]
          currentY = segment[6]
          points.push({ x: path.left + currentX, y: path.top + currentY })
          break
        case 'Q':
          currentX = segment[3]
          currentY = segment[4]
          points.push({ x: path.left + currentX, y: path.top + currentY })
          break
        case 'Z':
          break
      }
    })
    return points
  }

  /**
   * 近似贝塞尔曲线长度
   */
  const approximateBezierLength = (x1, y1, x2, y2, x3, y3, x4, y4) => {
    const steps = 10
    let length = 0
    let prevX = x1, prevY = y1

    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const x = bezierPoint(t, x1, x2, x3, x4)
      const y = bezierPoint(t, y1, y2, y3, y4)
      length += Math.sqrt(Math.pow(x - prevX, 2) + Math.pow(y - prevY, 2))
      prevX = x
      prevY = y
    }

    return length
  }

  /**
   * 贝塞尔曲线点计算
   */
  const bezierPoint = (t, p0, p1, p2, p3) => {
    const t2 = t * t
    const t3 = t2 * t
    const mt = 1 - t
    const mt2 = mt * mt
    const mt3 = mt2 * mt

    return mt3 * p0 + 3 * mt2 * t * p1 + 3 * mt * t2 * p2 + t3 * p3
  }

  /**
   * 从路径数据中提取均匀分布的点
   */
  // eslint-disable-next-line no-unused-vars
  const extractEvenlyDistributedPoints = (pathData, count) => {
    const points = []

    let totalLength = 0
    const segments = []

    let prevX = 0, prevY = 0
    pathData.forEach((segment) => {
      const cmd = segment[0]
      switch (cmd) {
        case 'M':
          prevX = segment[1]
          prevY = segment[2]
          break
        case 'L': {
          const x = segment[1]
          const y = segment[2]
          const length = Math.sqrt(Math.pow(x - prevX, 2) + Math.pow(y - prevY, 2))
          segments.push({ type: 'line', x1: prevX, y1: prevY, x2: x, y2: y, length })
          totalLength += length
          prevX = x
          prevY = y
          break
        }
        case 'C': {
          const x1 = segment[1], y1 = segment[2]
          const x2 = segment[3], y2 = segment[4]
          const x = segment[5], y = segment[6]
          const length = approximateBezierLength(prevX, prevY, x1, y1, x2, y2, x, y)
          segments.push({ type: 'bezier', x1: prevX, y1: prevY, x2: x1, y2: y1, x3: x2, y3: y2, x4: x, y4: y, length })
          totalLength += length
          prevX = x
          prevY = y
          break
        }
      }
    })

    if (totalLength === 0 || segments.length === 0) {
      return points
    }

    for (let i = 0; i < count; i++) {
      const targetLength = (i / (count - 1)) * totalLength
      let currentLength = 0

      for (const segment of segments) {
        if (currentLength + segment.length >= targetLength) {
          const t = (targetLength - currentLength) / segment.length
          let x, y

          if (segment.type === 'line') {
            x = segment.x1 + t * (segment.x2 - segment.x1)
            y = segment.y1 + t * (segment.y2 - segment.y1)
          } else {
            x = bezierPoint(t, segment.x1, segment.x2, segment.x3, segment.x4)
            y = bezierPoint(t, segment.y1, segment.y2, segment.y3, segment.y4)
          }

          points.push({ x, y, t })
          break
        }
        currentLength += segment.length
      }
    }

    return points
  }

  /**
   * 从控制点更新路径
   */
  const updatePathFromControlPoints = () => {
    if (!editingObject || editingObject.type !== 'path') return

    const sortedPoints = [...controlPoints].sort((a, b) => a.index - b.index)

    if (sortedPoints.length < 3) return

    const newPath = []
    newPath.push(['M', sortedPoints[0].x - editingObject.left, sortedPoints[0].y - editingObject.top])

    for (let i = 1; i < sortedPoints.length; i++) {
      const curr = sortedPoints[i]
      newPath.push(['L', curr.x - editingObject.left, curr.y - editingObject.top])
    }

    newPath.push(['Z'])

    editingObject.set({ path: newPath })
    editingObject.setCoords()
  }

  /**
   * 根据点更新对象
   */
  const updateObjectFromPoints = (points) => {
    if (!editingObject || points.length < 3) return

    const minX = Math.min(...points.map(p => p.x))
    const maxX = Math.max(...points.map(p => p.x))
    const minY = Math.min(...points.map(p => p.y))
    const maxY = Math.max(...points.map(p => p.y))

    const width = maxX - minX
    const height = maxY - minY
    const centerX = minX + width / 2
    const centerY = minY + height / 2

    editingObject.set({
      left: centerX,
      top: centerY,
      width: width,
      height: height
    })

    if (editingObject.type === 'polygon' || editingObject.type === 'polyline') {
      editingObject.set({
        points: points.map(p => ({
          x: p.x - centerX,
          y: p.y - centerY
        }))
      })
    }

    fabricCanvas.renderAll()
    updateControlPoints()
  }

  /**
   * 处理鼠标移动事件
   */
  const handleMouseMove = (opt) => {
    if (isEditMode.value) {
      handleEditMouseMove(opt)
      return
    }

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
    } else if (props.currentTool === ToolType.TRAPEZOID) {
      const width = Math.max(Math.abs(pointer.x - startPoint.x), 20)
      const height = Math.max(Math.abs(pointer.y - startPoint.y), 20)
      const centerX = (pointer.x + startPoint.x) / 2
      const centerY = (pointer.y + startPoint.y) / 2
      const topWidth = width * 0.6

      tempObject.set({
        left: centerX,
        top: centerY,
        points: [
          { x: -topWidth / 2, y: -height / 2 },
          { x: topWidth / 2, y: -height / 2 },
          { x: width / 2, y: height / 2 },
          { x: -width / 2, y: height / 2 }
        ],
        width: width,
        height: height
      })
      tempObject.setCoords()
    }

    fabricCanvas.renderAll()
  }

  /**
   * 处理编辑模式下的鼠标移动
   */
  const handleEditMouseMove = (opt) => {
    const pointer = fabricCanvas.getPointer(opt.e)

    const draggingPoint = controlPoints.find(p => p.isDragging)
    if (draggingPoint) {
      const dx = pointer.x - draggingPoint.startX
      const dy = pointer.y - draggingPoint.startY

      draggingPoint.x = draggingPoint.startX + dx
      draggingPoint.y = draggingPoint.startY + dy
      draggingPoint.circle.set({ left: draggingPoint.x, top: draggingPoint.y })

      if (editingObject.type === 'path') {
        updatePathFromControlPoints()
      } else {
        const points = getObjectPoints(editingObject)
        if (points) {
          const index = controlPoints.indexOf(draggingPoint)
          if (index >= 0 && index < points.length) {
            points[index] = { x: draggingPoint.x, y: draggingPoint.y }
            updateObjectFromPoints(points)
          }
        }
      }

      fabricCanvas.renderAll()
      return
    }

    if (findHitControlPoint(pointer)) {
      fabricCanvas.defaultCursor = 'move'
    } else if (findHitEdge(pointer)) {
      fabricCanvas.defaultCursor = 'crosshair'
    } else {
      fabricCanvas.defaultCursor = 'default'
    }
  }

  /**
   * 处理鼠标释放事件
   */
  const handleMouseUp = () => {
    if (isEditMode.value) {
      controlPoints.forEach(p => p.isDragging = false)
      return
    }

    if (isDrawing && tempObject) {
      let isTooSmall = false

      if (tempObject.type === 'rect') {
        isTooSmall = tempObject.width < 5 || tempObject.height < 5
      } else if (tempObject.type === 'circle') {
        isTooSmall = tempObject.radius && tempObject.radius < 5
      } else if (tempObject.type === 'polygon') {
        const bounds = tempObject.getBoundingRect()
        isTooSmall = bounds.width < 5 || bounds.height < 5
      }

      if (isTooSmall) {
        fabricCanvas.remove(tempObject)
      } else {
        fabricCanvas.setActiveObject(tempObject)
        saveHistory()
        canvasState.selectedObject = tempObject
        emit('object-selected', tempObject)
      }
      tempObject = null
      isDrawing = false
    }
  }

  /**
   * 处理双击事件进入编辑模式
   */
  const handleDoubleClick = (opt) => {
    if (!opt.target) return

    const obj = opt.target

    console.log(obj.type)

    enterEditMode(obj)
  }

  /**
   * 进入编辑模式
   */
  const enterEditMode = (obj) => {
    isEditMode.value = true

    fabricCanvas.selection = false

    originalFill = obj.fill

    if (obj.type === 'polygon' || obj.type === 'rect') {
      let path = null

      if (obj.toPath) {
        path = obj.toPath(true)
      } else {
        const points = getObjectPoints(obj)
        if (points && points.length >= 3) {
          const pathData = []
          const center = obj.getCenterPoint() || { x: obj.left, y: obj.top }
          pathData.push(['M', points[0].x - center.x, points[0].y - center.y])
          for (let i = 1; i < points.length; i++) {
            pathData.push(['L', points[i].x - center.x, points[i].y - center.y])
          }
          pathData.push(['Z'])
          path = new fabric.Path(pathData)
        }
      }

      if (path) {
        const center = obj.getCenterPoint() || { x: obj.left, y: obj.top }
        path.set({
          left: center.x,
          top: center.y,
          originX: 'center',
          originY: 'center',
          fill: 'transparent',
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth
        })
        path.setCoords()
        fabricCanvas.remove(obj)
        fabricCanvas.add(path)
        editingObject = path
      } else {
        editingObject = obj
      }
    } else {
      editingObject = obj
    }

    fabricCanvas.discardActiveObject()

    updateControlPoints()
  }

  /**
   * 退出编辑模式
   */
  const exitEditMode = () => {
    isEditMode.value = false

    fabricCanvas.selection = true

    if (editingObject && originalFill !== undefined) {
      editingObject.set({ fill: originalFill })
      originalFill = undefined
    }

    if (editingObject && controlPoints.length > 0) {
      const savedPoints = controlPoints.map(point => ({
        x: point.x,
        y: point.y,
        t: point.t
      }))
      editingObject.set({ __controlPoints: savedPoints })
    }

    controlPoints.forEach(point => {
      if (point.circle) {
        fabricCanvas.remove(point.circle)
      }
    })
    controlPoints = []

    if (editingGroup) {
      fabricCanvas.remove(editingGroup)
      editingGroup = null
    }

    editingObject = null
  }

  /**
   * 更新控制点
   */
  const updateControlPoints = () => {
    controlPoints.forEach(point => {
      if (point.circle) {
        fabricCanvas.remove(point.circle)
      }
    })
    controlPoints = []

    if (editingObject.type === 'path') {
      const pathData = editingObject.path
      if (!pathData) return

      const points = []

      pathData.forEach(segment => {
        if (segment[0] === 'M' || segment[0] === 'L') {
          points.push({
            x: editingObject.left + segment[1],
            y: editingObject.top + segment[2]
          })
        }
      })

      if (pathData[pathData.length - 1][0] !== 'Z' && points.length > 0) {
        points.push(points[0])
      }

      const controlPointCount = Math.min(points.length, 4)

      points.slice(0, controlPointCount).forEach((point, index) => {
        const circle = new fabric.Circle({
          left: point.x,
          top: point.y,
          radius: 8,
          fill: '#1890ff',
          stroke: '#000000',
          strokeWidth: 2,
          selectable: false,
          evented: true,
          originX: 'center',
          originY: 'center',
        })

        controlPoints.push({
          x: point.x,
          y: point.y,
          index: index,
          circle: circle,
          isDragging: false
        })

        fabricCanvas.add(circle)
      })
    }

    fabricCanvas.renderAll()
  }

  /**
   * 判断路径是否是矩形
   */
  // eslint-disable-next-line no-unused-vars
  const isRectanglePath = (pathData) => {
    if (!pathData || pathData.length !== 5) return false

    if (pathData[0][0] !== 'M') return false

    for (let i = 1; i < 4; i++) {
      if (pathData[i][0] !== 'L') return false
    }

    if (pathData[4][0] !== 'Z') return false

    return true
  }

  /**
   * 处理对象选择事件
   */
  const handleSelection = (e) => {
    const selected = e.selected ? e.selected[0] : null
    canvasState.selectedObject = selected
    emit('object-selected', selected)
  }

  /**
   * 保存当前画布状态到历史记录
   */
  const saveHistory = () => {
    if (isHistoryAction.value) return

    const json = fabricCanvas.toJSON()

    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    history.value.push(JSON.stringify(json))
    historyIndex.value = history.value.length - 1

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
   * 从历史记录恢复画布状态
   */
  const restoreHistory = async () => {
    isHistoryAction.value = true
    const json = JSON.parse(history.value[historyIndex.value])

    await fabricCanvas.loadFromJSON(json, () => {
      fabricCanvas.renderAll()
      isHistoryAction.value = false
      exitEditMode()
    })
  }

  /**
   * 在画布上添加一个矩形
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
      originY: 'center'
    })
    fabricCanvas.add(rect)
    fabricCanvas.setActiveObject(rect)
    fabricCanvas.renderAll()
    saveHistory()
    return rect
  }

  /**
   * 在画布上添加一个圆形
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
      originY: 'center'
    })
    fabricCanvas.add(circle)
    fabricCanvas.setActiveObject(circle)
    fabricCanvas.renderAll()
    saveHistory()
    return circle
  }

  /**
   * 删除当前选中的对象
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
   */
  const updateSelectedObject = (props) => {
    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      activeObject.set(props)
      activeObject.setCoords()
      fabricCanvas.renderAll()
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
   */
  const clearCanvas = () => {
    fabricCanvas.clear()
    fabricCanvas.backgroundColor = canvasState.backgroundColor
    fabricCanvas.renderAll()

    history.value = [JSON.stringify(fabricCanvas.toJSON())]
    historyIndex.value = 0

    emit('object-modified', null)
  }

  /**
   * 将画布导出为图片 DataURL
   */
  const exportToImage = (format = 'png') => {
    return fabricCanvas.toDataURL({
      format: format,
      quality: 1
    })
  }

  /**
   * 获取历史记录状态
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

    fabricCanvas.isDrawingMode = false
    fabricCanvas.selection = true

    fabricCanvas.forEachObject(obj => {
      obj.selectable = true
    })

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

    window.addEventListener('resize', resizeCanvasToContainer)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', resizeCanvasToContainer)
  })

  // 返回公共 API（getCanvas 避免与 DOM ref canvasRef 冲突）
  return {
    canvasState,
    isEditMode,
    getCanvas: () => fabricCanvas,
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
    getHistoryState
  }
}
