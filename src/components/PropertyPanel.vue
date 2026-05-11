<template>
  <div class="property-panel">
    <h3>属性面板</h3>
    
    <div v-if="!selectedObject" class="empty-state">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
      </svg>
      <span>选择对象以编辑属性</span>
    </div>

    <div v-else>
      <!-- 位置和尺寸 -->
      <div class="property-section">
        <div class="section-title">位置和尺寸</div>
        
        <div class="property-row">
          <div class="property-field">
            <label>X</label>
            <a-input-number 
              :value="Math.round(selectedObject.left || 0)" 
              @change="val => updateProperty('left', val)"
              size="small"
              :min="0"
            />
          </div>
          <div class="property-field">
            <label>Y</label>
            <a-input-number 
              :value="Math.round(selectedObject.top || 0)" 
              @change="val => updateProperty('top', val)"
              size="small"
              :min="0"
            />
          </div>
        </div>

        <div class="property-row" v-if="selectedObject.type === 'rect' || selectedObject.type === 'image'">
          <div class="property-field">
            <label>宽度</label>
            <a-input-number 
              :value="Math.round(selectedObject.width * Math.abs(selectedObject.scaleX || 1))" 
              @change="val => updateSize('width', val)"
              size="small"
              :min="1"
            />
          </div>
          <div class="property-field">
            <label>高度</label>
            <a-input-number 
              :value="Math.round(selectedObject.height * Math.abs(selectedObject.scaleY || 1))" 
              @change="val => updateSize('height', val)"
              size="small"
              :min="1"
            />
          </div>
        </div>

        <div class="property-row" v-if="selectedObject.type === 'circle'">
          <div class="property-field">
            <label>半径</label>
            <a-input-number 
              :value="Math.round(selectedObject.radius)" 
              @change="val => updateProperty('radius', val)"
              size="small"
              :min="1"
            />
          </div>
        </div>
      </div>

      <!-- 旋转 -->
      <div class="property-section">
        <div class="section-title">旋转</div>
        <div class="property-row">
          <div class="property-field">
            <label>角度</label>
            <a-input-number 
              :value="Math.round(selectedObject.angle || 0)" 
              @change="val => updateProperty('angle', val)"
              size="small"
              :min="-360"
              :max="360"
            />
          </div>
        </div>
        
        <!-- 翻转按钮 -->
        <div class="flip-buttons">
          <a-button size="small" @click="flipHorizontal" title="水平翻转">
            <template #icon><SwapOutlined /></template>
            水平翻转
          </a-button>
          <a-button size="small" @click="flipVertical" title="垂直翻转">
            <template #icon><SwapOutlined style="transform: rotate(90deg);" /></template>
            垂直翻转
          </a-button>
        </div>
      </div>

      <!-- 外观 -->
      <div class="property-section">
        <div class="section-title">外观</div>
        
        <div class="property-field full-width">
          <label>填充颜色</label>
          <div class="color-picker-row">
            <input 
              type="color" 
              :value="getColorWithoutAlpha(selectedObject.fill)"
              @input="e => updateFillColor(e.target.value)"
              class="color-input"
            />
            <a-input 
              :value="selectedObject.fill || '#000000'"
              @change="e => updateProperty('fill', e.target.value)"
              size="small"
              style="flex: 1;"
            />
          </div>
          <div class="property-field full-width opacity-slider">
            <label>填充透明度 ({{ Math.round((getFillOpacity() * 100)) }}%)</label>
            <a-slider 
              :value="getFillOpacity()"
              @change="val => updateFillOpacity(val)"
              :min="0"
              :max="1"
              :step="0.01"
            />
          </div>
        </div>

        <div class="property-field full-width">
          <label>边框颜色</label>
          <div class="color-picker-row">
            <input 
              type="color" 
              :value="getColorWithoutAlpha(selectedObject.stroke)"
              @input="e => updateStrokeColor(e.target.value)"
              class="color-input"
            />
            <a-input 
              :value="selectedObject.stroke || '#000000'"
              @change="e => updateProperty('stroke', e.target.value)"
              size="small"
              style="flex: 1;"
            />
          </div>
          <div class="property-field full-width opacity-slider">
            <label>边框透明度 ({{ Math.round((getStrokeOpacity() * 100)) }}%)</label>
            <a-slider 
              :value="getStrokeOpacity()"
              @change="val => updateStrokeOpacity(val)"
              :min="0"
              :max="1"
              :step="0.01"
            />
          </div>
        </div>

        <div class="property-field full-width">
          <label>边框宽度</label>
          <a-input-number 
            :value="selectedObject.strokeWidth || 0"
            @change="val => updateProperty('strokeWidth', val)"
            size="small"
            :min="0"
            :max="50"
            style="width: 100%;"
          />
        </div>

        <div class="property-field full-width">
          <label>整体不透明度 ({{ Math.round((selectedObject.opacity || 1) * 100) }}%)</label>
          <a-slider 
            :value="selectedObject.opacity || 1"
            @change="val => updateProperty('opacity', val)"
            :min="0"
            :max="1"
            :step="0.01"
          />
        </div>
      </div>

      <!-- 路径信息（钢笔绘制） -->
      <div class="property-section" v-if="selectedObject.type === 'path'">
        <div class="section-title">路径信息</div>
        <div class="info-row">
          <span class="info-label">路径点数:</span>
          <span class="info-value">{{ pathPoints }}</span>
        </div>
      </div>

      <!-- 对象信息 -->
      <div class="property-section">
        <div class="section-title">对象信息</div>
        <div class="info-row">
          <span class="info-label">类型:</span>
          <span class="info-value">{{ objectTypeName }}</span>
        </div>
      </div>
    </div>

    <!-- 工具设置 -->
    <a-divider>工具设置</a-divider>
    
    <div class="property-section">
      <div class="section-title">默认形状样式</div>
      
      <div class="property-field full-width">
        <label>填充颜色</label>
        <div class="color-picker-row">
          <input 
            type="color" 
            :value="toolSettings.fillColor"
            @input="e => $emit('update:toolSettings', { ...toolSettings, fillColor: e.target.value })"
            class="color-input"
          />
          <a-input 
            :value="toolSettings.fillColor"
            @change="e => $emit('update:toolSettings', { ...toolSettings, fillColor: e.target.value })"
            size="small"
            style="flex: 1;"
          />
        </div>
      </div>

      <div class="property-field full-width">
        <label>边框颜色</label>
        <div class="color-picker-row">
          <input 
            type="color" 
            :value="toolSettings.strokeColor"
            @input="e => $emit('update:toolSettings', { ...toolSettings, strokeColor: e.target.value })"
            class="color-input"
          />
          <a-input 
            :value="toolSettings.strokeColor"
            @change="e => $emit('update:toolSettings', { ...toolSettings, strokeColor: e.target.value })"
            size="small"
            style="flex: 1;"
          />
        </div>
      </div>

      <div class="property-field full-width">
        <label>边框宽度</label>
        <a-input-number 
          :value="toolSettings.strokeWidth"
          @change="val => $emit('update:toolSettings', { ...toolSettings, strokeWidth: val })"
          size="small"
          :min="0"
          :max="50"
          style="width: 100%;"
        />
      </div>
    </div>

    <div class="property-section" v-if="currentTool === 'pen'">
      <div class="section-title">钢笔工具设置</div>
      
      <div class="property-field full-width">
        <label>画笔颜色</label>
        <div class="color-picker-row">
          <input 
            type="color" 
            :value="toolSettings.penColor"
            @input="e => $emit('update:toolSettings', { ...toolSettings, penColor: e.target.value })"
            class="color-input"
          />
          <a-input 
            :value="toolSettings.penColor"
            @change="e => $emit('update:toolSettings', { ...toolSettings, penColor: e.target.value })"
            size="small"
            style="flex: 1;"
          />
        </div>
      </div>

      <div class="property-field full-width">
        <label>画笔宽度</label>
        <a-input-number 
          :value="toolSettings.penWidth"
          @change="val => $emit('update:toolSettings', { ...toolSettings, penWidth: val })"
          size="small"
          :min="1"
          :max="100"
          style="width: 100%;"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { SwapOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  selectedObject: {
    type: Object,
    default: null
  },
  currentTool: {
    type: String,
    default: 'select'
  },
  toolSettings: {
    type: Object,
    default: () => ({
      fillColor: '#1890ff',
      strokeColor: '#000000',
      strokeWidth: 2,
      penColor: '#000000',
      penWidth: 2
    })
  }
})

const emit = defineEmits(['update:toolSettings', 'object-update'])

/**
 * 计算属性：获取选中对象的中文类型名称
 * 将 Fabric.js 对象类型映射为中文显示
 */
const objectTypeName = computed(() => {
  if (!props.selectedObject) return ''
  const typeMap = {
    'rect': '矩形',
    'circle': '圆形',
    'ellipse': '椭圆',
    'triangle': '三角形',
    'line': '直线',
    'path': '路径',
    'text': '文本',
    'image': '图片',
    'polygon': '多边形',
    'polyline': '折线'
  }
  return typeMap[props.selectedObject.type] || props.selectedObject.type
})

/**
 * 计算属性：获取路径对象的点数
 * 用于钢笔工具绘制的路径显示路径信息
 */
const pathPoints = computed(() => {
  if (!props.selectedObject || props.selectedObject.type !== 'path') return 0
  return props.selectedObject.path ? props.selectedObject.path.length : 0
})

/**
 * 更新选中对象的指定属性
 * @param {string} key - 属性名
 * @param {*} value - 属性值
 */
const updateProperty = (key, value) => {
  emit('object-update', { [key]: value })
}

/**
 * 更新选中对象的尺寸
 * 通过修改 scaleX/scaleY 来实现尺寸变化
 * @param {string} dimension - 'width' 或 'height'
 * @param {number} value - 新的尺寸值
 */
const updateSize = (dimension, value) => {
  if (!props.selectedObject) return
  
  const scale = dimension === 'width' ? 'scaleX' : 'scaleY'
  const originalValue = dimension === 'width' ? props.selectedObject.width : props.selectedObject.height
  
  if (originalValue > 0) {
    const newScale = value / originalValue
    updateProperty(scale, newScale)
  }
}

/**
 * 水平翻转选中对象
 * 通过取反 scaleX 实现水平镜像
 */
const flipHorizontal = () => {
  if (!props.selectedObject) return
  const currentScaleX = props.selectedObject.scaleX || 1
  updateProperty('scaleX', -currentScaleX)
}

/**
 * 垂直翻转选中对象
 * 通过取反 scaleY 实现垂直镜像
 */
const flipVertical = () => {
  if (!props.selectedObject) return
  const currentScaleY = props.selectedObject.scaleY || 1
  updateProperty('scaleY', -currentScaleY)
}

/**
 * 从颜色值中提取纯颜色部分（去除透明度）
 * @param {string} color - 颜色值（支持 rgba 和 hex）
 * @returns {string} 纯颜色值（hex格式）
 */
const getColorWithoutAlpha = (color) => {
  if (!color) return '#000000'
  
  if (color.startsWith('rgba')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0')
      const g = parseInt(match[2]).toString(16).padStart(2, '0')
      const b = parseInt(match[3]).toString(16).padStart(2, '0')
      return `#${r}${g}${b}`
    }
  }
  
  if (color.startsWith('rgb')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)/)
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0')
      const g = parseInt(match[2]).toString(16).padStart(2, '0')
      const b = parseInt(match[3]).toString(16).padStart(2, '0')
      return `#${r}${g}${b}`
    }
  }
  
  if (color.startsWith('#') && color.length === 9) {
    return color.substring(0, 7)
  }
  
  if (color.startsWith('#') && color.length === 5) {
    return color.substring(0, 4)
  }
  
  return color
}

/**
 * 从颜色值中提取透明度
 * @param {string} color - 颜色值
 * @returns {number} 透明度值（0-1）
 */
const getOpacityFromColor = (color) => {
  if (!color) return 1
  
  if (color.startsWith('rgba')) {
    const match = color.match(/rgba?\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/)
    if (match) {
      return parseFloat(match[1])
    }
  }
  
  if (color.startsWith('#') && color.length === 9) {
    const alpha = parseInt(color.substring(7, 9), 16) / 255
    return alpha
  }
  
  if (color.startsWith('#') && color.length === 5) {
    const alpha = parseInt(color.substring(4, 5).repeat(2), 16) / 255
    return alpha
  }
  
  return 1
}

/**
 * 获取填充颜色的透明度
 */
const getFillOpacity = () => {
  if (!props.selectedObject) return 1
  return getOpacityFromColor(props.selectedObject.fill)
}

/**
 * 获取边框颜色的透明度
 */
const getStrokeOpacity = () => {
  if (!props.selectedObject) return 1
  return getOpacityFromColor(props.selectedObject.stroke)
}

/**
 * 更新填充颜色（保持原有透明度）
 * @param {string} color - 新的颜色值
 */
const updateFillColor = (color) => {
  if (!props.selectedObject) return
  
  const currentOpacity = getFillOpacity()
  const newColor = hexToRgba(color, currentOpacity)
  updateProperty('fill', newColor)
}

/**
 * 更新边框颜色（保持原有透明度）
 * @param {string} color - 新的颜色值
 */
const updateStrokeColor = (color) => {
  if (!props.selectedObject) return
  
  const currentOpacity = getStrokeOpacity()
  const newColor = hexToRgba(color, currentOpacity)
  updateProperty('stroke', newColor)
}

/**
 * 更新填充颜色透明度
 * @param {number} opacity - 新的透明度值（0-1）
 */
const updateFillOpacity = (opacity) => {
  if (!props.selectedObject) return
  
  const currentColor = props.selectedObject.fill
  const baseColor = getColorWithoutAlpha(currentColor)
  const newColor = hexToRgba(baseColor, opacity)
  updateProperty('fill', newColor)
}

/**
 * 更新边框颜色透明度
 * @param {number} opacity - 新的透明度值（0-1）
 */
const updateStrokeOpacity = (opacity) => {
  if (!props.selectedObject) return
  
  const currentColor = props.selectedObject.stroke
  const baseColor = getColorWithoutAlpha(currentColor)
  const newColor = hexToRgba(baseColor, opacity)
  updateProperty('stroke', newColor)
}

/**
 * 将 hex 颜色转换为 rgba 格式
 * @param {string} hex - hex颜色值
 * @param {number} alpha - 透明度（0-1）
 * @returns {string} rgba颜色值
 */
const hexToRgba = (hex, alpha = 1) => {
  if (!hex.startsWith('#')) return hex
  
  let r, g, b
  
  if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16)
    g = parseInt(hex.substring(3, 5), 16)
    b = parseInt(hex.substring(5, 7), 16)
  } else if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16)
    g = parseInt(hex[2] + hex[2], 16)
    b = parseInt(hex[3] + hex[3], 16)
  } else {
    return hex
  }
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
</script>

<style scoped>
.property-panel {
  width: 280px;
  background: #ffffff;
  border-left: 1px solid #d9d9d9;
  padding: 16px;
  overflow-y: auto;
  max-height: 100%;
}

.property-panel h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #262626;
}

.property-section {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.property-section:last-of-type {
  border-bottom: none;
}

.section-title {
  font-size: 12px;
  font-weight: 500;
  color: #8c8c8c;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.property-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.property-field {
  flex: 1;
}

.property-field.full-width {
  margin-bottom: 12px;
}

.property-field label {
  display: block;
  font-size: 12px;
  color: #595959;
  margin-bottom: 4px;
}

.color-picker-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-input {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  background: none;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: 2px;
}

.flip-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
}

.info-label {
  color: #8c8c8c;
}

.opacity-slider {
  margin-top: 8px;
  margin-bottom: 0;
}

.opacity-slider label {
  font-size: 11px;
  color: #8c8c8c;
}

.info-value {
  color: #262626;
  font-weight: 500;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #8c8c8c;
  text-align: center;
}

.empty-state svg {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}
</style>
