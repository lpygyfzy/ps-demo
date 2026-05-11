/**
 * DXF解析工具模块
 * 负责将DXF文件转换为Fabric.js对象
 * 支持基本的DXF R12格式
 */
export class DxfParserUtil {
  constructor() {
  }

  /**
   * 解析DXF文件内容
   * @param {string} dxfContent - DXF文件的文本内容
   * @returns {Object} 解析结果对象
   */
  parse(dxfContent) {
    const lines = dxfContent.split(/\r?\n/)
    const result = {
      entities: [],
      layers: []
    }

    let currentEntity = null
    let section = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (!line) continue

      const code = line
      i++
      const value = lines[i] ? lines[i].trim() : ''

      switch (code) {
        case '0':
          if (value === 'SECTION') {
            section = null
          } else if (value === 'ENDSEC') {
            section = null
          } else if (value === 'LINE' || value === 'CIRCLE' || value === 'ARC' || value === 'POLYLINE' || value === 'VERTEX' || value === 'TEXT') {
            if (currentEntity && currentEntity.type) {
              result.entities.push(currentEntity)
            }
            currentEntity = { type: value }
          } else if (value === 'LAYER') {
            const layer = {}
            this.parseLayer(lines, i, layer)
            result.layers.push(layer)
          }
          break
        case '2':
          if (!section && value === 'ENTITIES') {
            section = 'ENTITIES'
          }
          break
        case '8':
          if (currentEntity) {
            currentEntity.layer = value
          }
          break
        case '10':
          if (currentEntity) {
            currentEntity.x = parseFloat(value) || 0
          }
          break
        case '20':
          if (currentEntity) {
            currentEntity.y = parseFloat(value) || 0
          }
          break
        case '30':
          if (currentEntity) {
            currentEntity.z = parseFloat(value) || 0
          }
          break
        case '11':
          if (currentEntity) {
            currentEntity.x2 = parseFloat(value) || 0
          }
          break
        case '21':
          if (currentEntity) {
            currentEntity.y2 = parseFloat(value) || 0
          }
          break
        case '40':
          if (currentEntity) {
            currentEntity.radius = parseFloat(value) || 0
          }
          break
        case '50':
          if (currentEntity) {
            currentEntity.startAngle = parseFloat(value) || 0
          }
          break
        case '51':
          if (currentEntity) {
            currentEntity.endAngle = parseFloat(value) || 0
          }
          break
        case '70':
          if (currentEntity) {
            currentEntity.flags = parseInt(value) || 0
          }
          break
        case '1':
          if (currentEntity && currentEntity.type === 'TEXT') {
            currentEntity.text = value
          }
          break
        case '41':
          if (currentEntity) {
            currentEntity.height = parseFloat(value) || 20
          }
          break
      }
    }

    if (currentEntity && currentEntity.type) {
      result.entities.push(currentEntity)
    }

    return result
  }

  /**
   * 解析图层定义
   */
  parseLayer(lines, i, layer) {
    let j = i
    while (j < lines.length) {
      const code = lines[j].trim()
      j++
      const value = lines[j] ? lines[j].trim() : ''

      switch (code) {
        case '2':
          layer.name = value
          break
        case '70':
          layer.flags = parseInt(value) || 0
          break
        case '62':
          layer.color = parseInt(value) || 7
          break
        case '0':
          if (value === 'ENDTAB') {
            return
          }
          break
      }
      j++
    }
  }

  /**
   * 将DXF实体转换为Fabric.js对象
   * @param {Object} dxfData - 解析后的DXF数据
   * @returns {Array} Fabric.js对象数组
   */
  convertToFabricObjects(dxfData) {
    const objects = []
    
    if (!dxfData.entities || !Array.isArray(dxfData.entities)) {
      return objects
    }

    dxfData.entities.forEach(entity => {
      const fabricObj = this.convertEntity(entity)
      if (fabricObj) {
        objects.push(fabricObj)
      }
    })

    return objects
  }

  /**
   * 转换单个DXF实体
   * @param {Object} entity - DXF实体对象
   * @returns {fabric.Object|null} Fabric.js对象
   */
  convertEntity(entity) {
    switch (entity.type) {
      case 'LINE':
        return this.convertLine(entity)
      case 'CIRCLE':
        return this.convertCircle(entity)
      case 'ARC':
        return this.convertArc(entity)
      case 'POLYLINE':
        return this.convertPolyline(entity)
      case 'TEXT':
        return this.convertText(entity)
      default:
        console.warn('不支持的DXF实体类型:', entity.type)
        return null
    }
  }

  /**
   * 转换LINE实体
   */
  convertLine(entity) {
    return new fabric.Line([
      entity.x || 0, entity.y || 0,
      entity.x2 || 0, entity.y2 || 0
    ], {
      stroke: this.getColor(entity.color),
      strokeWidth: 1,
      name: entity.layer || '0',
      opacity: 1
    })
  }

  /**
   * 转换CIRCLE实体
   */
  convertCircle(entity) {
    return new fabric.Circle({
      left: entity.x || 0,
      top: -(entity.y || 0),
      radius: entity.radius || 10,
      fill: 'transparent',
      stroke: this.getColor(entity.color),
      strokeWidth: 1,
      name: entity.layer || '0',
      originX: 'center',
      originY: 'center'
    })
  }

  /**
   * 转换ARC实体
   */
  convertArc(entity) {
    return new fabric.Arc({
      left: entity.x || 0,
      top: -(entity.y || 0),
      radius: entity.radius || 10,
      startAngle: entity.startAngle || 0,
      endAngle: entity.endAngle || 360,
      fill: 'transparent',
      stroke: this.getColor(entity.color),
      strokeWidth: 1,
      name: entity.layer || '0',
      originX: 'center',
      originY: 'center'
    })
  }

  /**
   * 转换POLYLINE实体
   */
  convertPolyline(entity) {
    const isClosed = entity.flags && (entity.flags & 1) !== 0
    
    const points = []
    if (entity.vertices) {
      entity.vertices.forEach(v => {
        points.push({
          x: v.x,
          y: -v.y
        })
      })
    } else {
      points.push({ x: entity.x || 0, y: -(entity.y || 0) })
      points.push({ x: entity.x2 || entity.x || 0, y: -(entity.y2 || entity.y || 0) })
    }

    if (points.length < 2) return null

    const options = {
      fill: isClosed ? this.getColor(entity.color, true) : 'transparent',
      stroke: this.getColor(entity.color),
      strokeWidth: 1,
      name: entity.layer || '0'
    }

    if (isClosed) {
      return new fabric.Polygon(points, options)
    } else {
      return new fabric.Polyline(points, options)
    }
  }

  /**
   * 转换TEXT实体
   */
  convertText(entity) {
    return new fabric.Text(entity.text || '', {
      left: entity.x || 0,
      top: -(entity.y || 0),
      fontSize: entity.height || 20,
      fill: this.getColor(entity.color),
      name: entity.layer || '0',
      originX: 'left',
      originY: 'top'
    })
  }

  /**
   * 将DXF颜色码转换为CSS颜色
   */
  getColor(colorIndex, isFill = false) {
    if (colorIndex === undefined || colorIndex === null) {
      return isFill ? 'transparent' : '#000000'
    }

    const colorMap = {
      0: '#000000',
      1: '#FF0000',
      2: '#00FF00',
      3: '#FFFF00',
      4: '#0000FF',
      5: '#FF00FF',
      6: '#00FFFF',
      7: '#FFFFFF',
      8: '#808080',
      9: '#800000',
      10: '#808000',
      11: '#800080',
      12: '#008080',
      13: '#000080',
      14: '#FF8000',
      15: '#FF8080',
      256: '#000000'
    }

    return colorMap[colorIndex] || '#000000'
  }

  /**
   * 从文件加载并解析DXF
   * @param {File} file - DXF文件对象
   * @returns {Promise<Array>} Fabric.js对象数组
   */
  async loadFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const dxfData = this.parse(e.target.result)
          const objects = this.convertToFabricObjects(dxfData)
          resolve(objects)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }
      
      reader.readAsText(file)
    })
  }
}

export const dxfParser = new DxfParserUtil()