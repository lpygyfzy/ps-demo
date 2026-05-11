/**
 * DXF导出工具模块
 * 负责将Fabric.js对象转换为DXF文件
 */
export class DxfWriterUtil {
  constructor() {
    this.writer = null
  }

  /**
   * 创建新的DXF写入器
   */
  createWriter() {
    this.writer = new DxfWriter()
    return this.writer
  }

  /**
   * 将Fabric.js对象数组转换为DXF
   * @param {Array} objects - Fabric.js对象数组
   * @returns {string} DXF文件内容
   */
  convertToDxf(objects) {
    this.createWriter()
    
    objects.forEach(obj => {
      this.convertFabricObject(obj)
    })

    return this.writer.stringify()
  }

  /**
   * 转换单个Fabric对象
   * @param {fabric.Object} obj - Fabric.js对象
   */
  convertFabricObject(obj) {
    if (!obj || obj.type === 'group' || obj.type === 'activeSelection') {
      return
    }

    const layer = obj.name || '0'
    const color = this.getDxfColor(obj.stroke || '#000000')

    switch (obj.type) {
      case 'rect':
        this.convertRect(obj, layer, color)
        break
      case 'circle':
        this.convertCircle(obj, layer, color)
        break
      case 'line':
        this.convertLine(obj, layer, color)
        break
      case 'path':
        this.convertPath(obj, layer, color)
        break
      case 'polygon':
        this.convertPolygon(obj, layer, color)
        break
      case 'polyline':
        this.convertPolyline(obj, layer, color)
        break
      case 'text':
        this.convertText(obj, layer, color)
        break
      case 'arc':
        this.convertArc(obj, layer, color)
        break
      default:
        console.warn('不支持的Fabric对象类型:', obj.type)
    }
  }

  /**
   * 转换矩形
   */
  convertRect(rect, layer, color) {
    const { left, top, width, height } = this.getObjectTransform(rect)
    
    const points = [
      { x: left - width / 2, y: top - height / 2 },
      { x: left + width / 2, y: top - height / 2 },
      { x: left + width / 2, y: top + height / 2 },
      { x: left - width / 2, y: top + height / 2 }
    ]

    this.writer.addPolyline(points, true)
  }

  /**
   * 转换圆形
   */
  convertCircle(circle, layer, color) {
    const { left, top } = this.getObjectTransform(circle)
    const radius = circle.radius * Math.abs(circle.scaleX || 1)

    this.writer.addCircle(left, top, radius)
  }

  /**
   * 转换直线
   */
  convertLine(line, layer, color) {
    const x1 = line.x1 || 0
    const y1 = line.y1 || 0
    const x2 = line.x2 || 0
    const y2 = line.y2 || 0

    this.writer.addLine(x1, y1, x2, y2)
  }

  /**
   * 转换路径
   */
  convertPath(path, layer, color) {
    const pathData = path.path
    
    if (!pathData || !Array.isArray(pathData)) {
      return
    }

    const points = []
    let currentX = 0
    let currentY = 0

    pathData.forEach((segment) => {
      const command = segment[0]
      const values = segment.slice(1)

      switch (command) {
        case 'M':
          currentX = values[0]
          currentY = values[1]
          points.push({ x: currentX, y: currentY })
          break
        case 'L':
          currentX = values[0]
          currentY = values[1]
          points.push({ x: currentX, y: currentY })
          break
        case 'C':
          currentX = values[4]
          currentY = values[5]
          points.push({ x: currentX, y: currentY })
          break
        case 'Q':
          currentX = values[2]
          currentY = values[3]
          points.push({ x: currentX, y: currentY })
          break
        case 'Z':
          break
        default:
          console.warn('不支持的路径命令:', command)
      }
    })

    if (points.length >= 2) {
      const isClosed = pathData.some(s => s[0] === 'Z')
      this.writer.addPolyline(points, isClosed)
    }
  }

  /**
   * 转换多边形
   */
  convertPolygon(polygon, layer, color) {
    const { left, top } = this.getObjectTransform(polygon)
    const scaleX = polygon.scaleX || 1
    const scaleY = polygon.scaleY || 1

    const points = polygon.points.map(point => ({
      x: left + (point.x * scaleX),
      y: top + (point.y * scaleY)
    }))

    this.writer.addPolyline(points, true)
  }

  /**
   * 转换折线
   */
  convertPolyline(polyline, layer, color) {
    const { left, top } = this.getObjectTransform(polyline)
    const scaleX = polyline.scaleX || 1
    const scaleY = polyline.scaleY || 1

    const points = polyline.points.map(point => ({
      x: left + (point.x * scaleX),
      y: top + (point.y * scaleY)
    }))

    this.writer.addPolyline(points, false)
  }

  /**
   * 转换文本
   */
  convertText(text, layer, color) {
    const { left, top } = this.getObjectTransform(text)
    const fontSize = text.fontSize || 20

    this.writer.addText(text.text || '', left, top, fontSize)
  }

  /**
   * 转换圆弧
   */
  convertArc(arc, layer, color) {
    const { left, top } = this.getObjectTransform(arc)
    const radius = arc.radius * Math.abs(arc.scaleX || 1)
    const startAngle = arc.startAngle || 0
    const endAngle = arc.endAngle || 360

    this.writer.addArc(left, top, radius, startAngle, endAngle)
  }

  /**
   * 获取对象的变换后坐标
   */
  getObjectTransform(obj) {
    const center = obj.getCenterPoint() || { x: obj.left || 0, y: obj.top || 0 }
    return {
      left: center.x,
      top: center.y,
      angle: obj.angle || 0
    }
  }

  /**
   * 将CSS颜色转换为DXF颜色索引
   */
  getDxfColor(color) {
    if (!color || color === 'transparent') {
      return 7
    }

    const colorMap = {
      '#000000': 0,
      '#FF0000': 1,
      '#00FF00': 2,
      '#FFFF00': 3,
      '#0000FF': 4,
      '#FF00FF': 5,
      '#00FFFF': 6,
      '#FFFFFF': 7
    }

    return colorMap[color.trim().toLowerCase()] || 7
  }

  /**
   * 导出为DXF文件
   */
  exportToFile(objects, filename = 'drawing.dxf') {
    const dxfContent = this.convertToDxf(objects)
    
    const blob = new Blob([dxfContent], { type: 'application/dxf' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * 从Fabric画布导出
   */
  exportFromCanvas(canvas, filename = 'drawing.dxf') {
    const objects = canvas.getObjects().filter(obj => obj.type !== 'activeSelection')
    this.exportToFile(objects, filename)
  }
}

/**
 * 简化版DXF写入器
 */
class DxfWriter {
  constructor() {
    this.lines = []
    this.header()
    this.tables()
    this.entities()
  }

  header() {
    this.lines.push('0')
    this.lines.push('SECTION')
    this.lines.push('2')
    this.lines.push('HEADER')
    this.lines.push('9')
    this.lines.push('$INSUNITS')
    this.lines.push('70')
    this.lines.push('1')
    this.lines.push('0')
    this.lines.push('ENDSEC')
  }

  tables() {
    this.lines.push('0')
    this.lines.push('SECTION')
    this.lines.push('2')
    this.lines.push('TABLES')
    
    this.lines.push('0')
    this.lines.push('TABLE')
    this.lines.push('2')
    this.lines.push('LAYER')
    this.lines.push('70')
    this.lines.push('2')
    
    this.lines.push('0')
    this.lines.push('LTYPE')
    this.lines.push('2')
    this.lines.push('CONTINUOUS')
    this.lines.push('70')
    this.lines.push('0')
    this.lines.push('3')
    this.lines.push('Solid line')
    this.lines.push('72')
    this.lines.push('65')
    this.lines.push('73')
    this.lines.push('0')
    this.lines.push('40')
    this.lines.push('0.0')
    
    this.lines.push('0')
    this.lines.push('ENDTAB')
    this.lines.push('0')
    this.lines.push('ENDSEC')
  }

  entities() {
    this.lines.push('0')
    this.lines.push('SECTION')
    this.lines.push('2')
    this.lines.push('ENTITIES')
  }

  addLine(x1, y1, x2, y2) {
    this.lines.push('0')
    this.lines.push('LINE')
    this.lines.push('8')
    this.lines.push('0')
    this.lines.push('10')
    this.lines.push(x1.toString())
    this.lines.push('20')
    this.lines.push(y1.toString())
    this.lines.push('30')
    this.lines.push('0.0')
    this.lines.push('11')
    this.lines.push(x2.toString())
    this.lines.push('21')
    this.lines.push(y2.toString())
    this.lines.push('31')
    this.lines.push('0.0')
  }

  addCircle(x, y, radius) {
    this.lines.push('0')
    this.lines.push('CIRCLE')
    this.lines.push('8')
    this.lines.push('0')
    this.lines.push('10')
    this.lines.push(x.toString())
    this.lines.push('20')
    this.lines.push(y.toString())
    this.lines.push('30')
    this.lines.push('0.0')
    this.lines.push('40')
    this.lines.push(radius.toString())
  }

  addArc(x, y, radius, startAngle, endAngle) {
    this.lines.push('0')
    this.lines.push('ARC')
    this.lines.push('8')
    this.lines.push('0')
    this.lines.push('10')
    this.lines.push(x.toString())
    this.lines.push('20')
    this.lines.push(y.toString())
    this.lines.push('30')
    this.lines.push('0.0')
    this.lines.push('40')
    this.lines.push(radius.toString())
    this.lines.push('50')
    this.lines.push(startAngle.toString())
    this.lines.push('51')
    this.lines.push(endAngle.toString())
  }

  addPolyline(points, isClosed) {
    if (!points || points.length < 2) return
    
    this.lines.push('0')
    this.lines.push('POLYLINE')
    this.lines.push('8')
    this.lines.push('0')
    this.lines.push('66')
    this.lines.push('1')
    this.lines.push('70')
    this.lines.push(isClosed ? '1' : '0')
    
    points.forEach(point => {
      this.lines.push('0')
      this.lines.push('VERTEX')
      this.lines.push('8')
      this.lines.push('0')
      this.lines.push('10')
      this.lines.push(point.x.toString())
      this.lines.push('20')
      this.lines.push(point.y.toString())
      this.lines.push('30')
      this.lines.push('0.0')
    })
    
    this.lines.push('0')
    this.lines.push('SEQEND')
  }

  addText(text, x, y, height) {
    this.lines.push('0')
    this.lines.push('TEXT')
    this.lines.push('8')
    this.lines.push('0')
    this.lines.push('10')
    this.lines.push(x.toString())
    this.lines.push('20')
    this.lines.push(y.toString())
    this.lines.push('30')
    this.lines.push('0.0')
    this.lines.push('40')
    this.lines.push(height.toString())
    this.lines.push('1')
    this.lines.push(text)
  }

  stringify() {
    this.lines.push('0')
    this.lines.push('ENDSEC')
    this.lines.push('0')
    this.lines.push('EOF')
    
    return this.lines.join('\n')
  }
}

export const dxfWriter = new DxfWriterUtil()