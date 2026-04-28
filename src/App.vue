<template>
  <div class="editor-container">
    <!-- 顶部工具栏 -->
    <div class="editor-header">
      <div class="header-title">
        <span class="logo">🎨</span>
        <span>Canvas Editor</span>
      </div>
      <div class="header-actions">
        <a-button-group>
          <a-button @click="handleUndo" :disabled="!canUndo">
            <template #icon><UndoOutlined /></template>
            撤销
          </a-button>
          <a-button @click="handleRedo" :disabled="!canRedo">
            <template #icon><RedoOutlined /></template>
            重做
          </a-button>
        </a-button-group>
        <a-divider type="vertical" />
        <a-button @click="handleExport">
          <template #icon><DownloadOutlined /></template>
          导出
        </a-button>
      </div>
    </div>

    <!-- 主体区域 -->
    <div class="editor-main">
      <!-- 左侧工具栏 -->
      <Toolbar
        :current-tool="currentTool"
        :can-undo="canUndo"
        :can-redo="canRedo"
        :has-selected-object="!!selectedObject"
        @tool-change="handleToolChange"
        @undo="handleUndo"
        @redo="handleRedo"
        @delete="handleDelete"
        @bring-to-front="handleBringToFront"
        @send-to-back="handleSendToBack"
        @export="showExportModal = true"
        @clear="showClearModal = true"
      />

      <!-- 画布区域 -->
      <Canvas
        ref="canvasComponent"
        :current-tool="currentTool"
        :tool-settings="toolSettings"
        @canvas-ready="handleCanvasReady"
        @object-selected="handleObjectSelected"
        @object-modified="handleObjectModified"
      />

      <!-- 右侧属性面板 -->
      <PropertyPanel
        :selected-object="selectedObject"
        :current-tool="currentTool"
        :tool-settings="toolSettings"
        @update:tool-settings="handleToolSettingsUpdate"
        @object-update="handleObjectUpdate"
      />
    </div>

    <!-- 导出模态框 -->
    <a-modal
      v-model:open="showExportModal"
      title="导出图片"
      @ok="handleExportConfirm"
      @cancel="showExportModal = false"
    >
      <div class="export-options">
        <div class="export-preview" v-if="exportPreview">
          <img :src="exportPreview" alt="预览" />
        </div>
        <div class="export-formats">
          <a-radio-group v-model:value="exportFormat" button-style="solid">
            <a-radio-button value="png">PNG</a-radio-button>
            <a-radio-button value="jpeg">JPEG</a-radio-button>
            <a-radio-button value="webp">WebP</a-radio-button>
          </a-radio-group>
        </div>
        <div class="export-quality" v-if="exportFormat !== 'png'">
          <label>图片质量: {{ exportQuality }}%</label>
          <a-slider v-model:value="exportQuality" :min="10" :max="100" :step="5" />
        </div>
      </div>
    </a-modal>

    <!-- 清空确认模态框 -->
    <a-modal
      v-model:open="showClearModal"
      title="确认清空画布"
      :ok-type="'danger'"
      ok-text="确认清空"
      cancel-text="取消"
      @ok="handleClearConfirm"
      @cancel="showClearModal = false"
    >
      <div style="padding: 16px; background-color: #fff7e6; border-radius: 8px; border-left: 4px solid #faad14;">
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 24px; margin-right: 12px;">⚠️</span>
          <strong style="font-size: 16px; color: #d46b08;">警告：此操作不可撤销</strong>
        </div>
        <p style="color: #666; margin: 0; line-height: 1.6;">
          清空画布将删除所有绘制的图形和元素，此操作无法通过撤销功能恢复。<br/>
          请确保您已保存或导出当前画布内容后再继续。
        </p>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import Toolbar from './components/Toolbar.vue'
import Canvas from './components/Canvas.vue'
import PropertyPanel from './components/PropertyPanel.vue'
import { 
  UndoOutlined, 
  RedoOutlined, 
  DownloadOutlined 
} from '@ant-design/icons-vue'

// 组件引用
const canvasComponent = ref(null)

// 状态
const currentTool = ref('select')
const selectedObject = ref(null)
const canUndo = ref(false)
const canRedo = ref(false)

const showExportModal = ref(false)
const showClearModal = ref(false)
const exportFormat = ref('png')
const exportQuality = ref(90)
const exportPreview = ref('')

// 工具设置
const toolSettings = reactive({
  fillColor: '#1890ff',
  strokeColor: '#000000',
  strokeWidth: 2,
  penColor: '#000000',
  penWidth: 2
})

/**
 * 处理全局键盘快捷键事件
 * 支持工具切换、撤销重做、删除等快捷操作
 * 当焦点在输入框等元素上时会忽略快捷键，避免与表单输入冲突
 * @param {KeyboardEvent} e - 键盘事件对象
 */
const handleKeyDown = (e) => {
  // 如果焦点在输入框、文本域等元素上，不触发快捷键
  const activeElement = document.activeElement
  const isInputFocused = activeElement && (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.isContentEditable ||
    activeElement.classList.contains('ant-input') ||
    activeElement.classList.contains('ant-input-number-input') ||
    activeElement.closest('.ant-input-number') ||
    activeElement.closest('.ant-color-picker') ||
    activeElement.closest('.ant-slider')
  )
  
  if (isInputFocused) {
    return
  }
  
  // 工具切换（无修饰键时触发）
  if (!e.ctrlKey && !e.metaKey && !e.altKey) {
    switch (e.key.toLowerCase()) {
      case 'v':
        handleToolChange('select')
        break
      case 'm':
        handleToolChange('move')
        break
      case 'r':
        handleToolChange('rect')
        break
      case 'c':
        handleToolChange('circle')
        break
      case 'p':
        handleToolChange('pen')
        break
      case 'delete':
      case 'backspace':
        if (selectedObject.value) {
          handleDelete()
        }
        break
      case 'escape':
        handleToolChange('select')
        break
    }
  }

  // 撤销/重做（Ctrl/Cmd+Z / Ctrl/Cmd+Y）
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    if (e.shiftKey) {
      handleRedo()
    } else {
      handleUndo()
    }
  }

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
    e.preventDefault()
    handleRedo()
  }

  // 全选（Ctrl/Cmd+A）
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
    e.preventDefault()
  }
}

/**
 * 切换当前激活的工具
 * @param {string} tool - 工具类型 ('select' | 'move' | 'rect' | 'circle' | 'pen')
 */
const handleToolChange = (tool) => {
  currentTool.value = tool
}

/**
 * 画布初始化完成后的回调
 * @param {fabric.Canvas} canvas - Fabric.js 画布实例
 */
const handleCanvasReady = (canvas) => {
  console.log('Canvas ready')
}

/**
 * 处理对象选择事件
 * 将选中的对象复制到 selectedObject 状态中，触发属性面板更新
 * @param {fabric.Object|null} obj - 被选中的对象，null 表示取消选择
 */
const handleObjectSelected = (obj) => {
  // 创建新引用触发响应式更新
  if (obj) {
    selectedObject.value = {
      ...obj,
      // 保留必要的属性
      left: obj.left,
      top: obj.top,
      width: obj.width,
      height: obj.height,
      radius: obj.radius,
      angle: obj.angle,
      fill: obj.fill,
      stroke: obj.stroke,
      strokeWidth: obj.strokeWidth,
      opacity: obj.opacity,
      scaleX: obj.scaleX,
      scaleY: obj.scaleY,
      type: obj.type,
      rx: obj.rx,
      ry: obj.ry
    }
  } else {
    selectedObject.value = null
  }
}

/**
 * 处理对象修改完成事件
 * 每次对象被移动、旋转、缩放等操作后触发，更新撤销/重做状态
 * @param {fabric.Object} obj - 被修改的对象
 */
const handleObjectModified = (obj) => {
  updateHistoryState()
}

/**
 * 更新撤销/重做按钮的可用状态
 * 从 Canvas 组件获取真实的历史记录状态
 */
const updateHistoryState = () => {
  if (canvasComponent.value) {
    const historyState = canvasComponent.value.getHistoryState()
    canUndo.value = historyState.canUndo
    canRedo.value = historyState.canRedo
  }
}

/**
 * 撤销上一操作
 * 调用 Canvas 组件的 undo 方法，并更新撤销/重做状态
 */
const handleUndo = () => {
  if (canvasComponent.value) {
    canvasComponent.value.undo()
    updateHistoryState()
    message.success('已撤销')
  }
}

/**
 * 重做上一撤销的操作
 * 调用 Canvas 组件的 redo 方法，并更新撤销/重做状态
 */
const handleRedo = () => {
  if (canvasComponent.value) {
    canvasComponent.value.redo()
    updateHistoryState()
    message.success('已重做')
  }
}

/**
 * 删除当前选中的对象
 * 调用 Canvas 组件的 deleteSelected 方法，并清空选中状态
 */
const handleDelete = () => {
  if (canvasComponent.value && selectedObject.value) {
    canvasComponent.value.deleteSelected()
    selectedObject.value = null
    message.success('已删除')
  }
}

/**
 * 将选中对象移到图层最顶层
 * 调用 Canvas 组件的 bringToFront 方法
 */
const handleBringToFront = () => {
  if (canvasComponent.value) {
    canvasComponent.value.bringToFront()
    message.success('已置顶')
  }
}

/**
 * 将选中对象移到图层最底层
 * 调用 Canvas 组件的 sendToBack 方法
 */
const handleSendToBack = () => {
  if (canvasComponent.value) {
    canvasComponent.value.sendToBack()
    message.success('已置底')
  }
}

/**
 * 更新工具设置
 * @param {Object} settings - 新的工具设置对象
 */
const handleToolSettingsUpdate = (settings) => {
  Object.assign(toolSettings, settings)
}

/**
 * 处理对象属性更新
 * 将属性更新应用到 Canvas 中的选中对象，并刷新属性面板显示
 * @param {Object} props - 要更新的属性键值对
 */
const handleObjectUpdate = (props) => {
  if (canvasComponent.value) {
    canvasComponent.value.updateSelectedObject(props)
    // 强制更新 selectedObject，触发属性面板刷新
    const activeObj = canvasComponent.value.canvasRef()?.getActiveObject()
    if (activeObj) {
      selectedObject.value = {
        ...activeObj,
        left: activeObj.left,
        top: activeObj.top,
        width: activeObj.width,
        height: activeObj.height,
        radius: activeObj.radius,
        angle: activeObj.angle,
        fill: activeObj.fill,
        stroke: activeObj.stroke,
        strokeWidth: activeObj.strokeWidth,
        opacity: activeObj.opacity,
        scaleX: activeObj.scaleX,
        scaleY: activeObj.scaleY,
        type: activeObj.type,
        rx: activeObj.rx,
        ry: activeObj.ry
      }
    }
  }
}

/**
 * 打开导出图片预览模态框
 * 生成当前画布的 DataURL 并显示预览
 */
const handleExport = () => {
  if (canvasComponent.value) {
    const dataUrl = canvasComponent.value.exportToImage(exportFormat.value)
    exportPreview.value = dataUrl
    showExportModal.value = true
  }
}

/**
 * 确认导出图片
 * 创建下载链接触发图片下载，然后关闭模态框
 */
const handleExportConfirm = () => {
  if (canvasComponent.value) {
    const dataUrl = canvasComponent.value.exportToImage(exportFormat.value)
    
    // 创建下载链接
    const link = document.createElement('a')
    link.download = `canvas-image.${exportFormat.value}`
    link.href = dataUrl
    link.click()
    
    showExportModal.value = false
    message.success('图片导出成功')
  }
}

/**
 * 确认清空画布
 * 调用 Canvas 组件的 clearCanvas 方法并关闭确认模态框
 */
const handleClearConfirm = () => {
  if (canvasComponent.value) {
    canvasComponent.value.clearCanvas()
    selectedObject.value = null
    showClearModal.value = false
    message.success('画布已清空')
  }
}

// 生命周期
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #f0f2f5;
}

.editor-header {
  height: 48px;
  background: #ffffff;
  border-bottom: 1px solid #d9d9d9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.logo {
  font-size: 24px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 导出模态框样式 */
.export-options {
  padding: 16px 0;
}

.export-preview {
  text-align: center;
  margin-bottom: 16px;
}

.export-preview img {
  max-width: 100%;
  max-height: 300px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.export-formats {
  text-align: center;
  margin-bottom: 16px;
}

.export-quality {
  padding: 0 16px;
}

.export-quality label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: #595959;
}
</style>
