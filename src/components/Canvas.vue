<template>
  <div class="canvas-wrapper">
    <!-- 顶部和左侧标尺 -->
    <Ruler 
      :canvas-width="canvasState.width"
      :canvas-height="canvasState.height"
    />
    
    <!-- 画布容器 -->
    <div 
      ref="scrollContainer"
      class="canvas-container"
      :class="{
        'tool-select': currentTool === ToolType.SELECT,
        'tool-move': currentTool === ToolType.MOVE,
        'edit-mode': isEditMode
      }"
    >
      <canvas ref="canvasRef" class="canvas-element"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCanvas } from '../composables/useCanvas'
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

const canvasRef = ref(null)
const scrollContainer = ref(null)

const {
  canvasState,
  isEditMode,
  getCanvas,
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
} = useCanvas({ canvasRef, scrollContainer, props, emit })

defineExpose({
  canvasState,
  canvasRef: getCanvas,
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
})
</script>

<style scoped>
.canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  margin: 10px;
}

.canvas-container {
  position: absolute;
  top: 24px;
  left: 24px;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.canvas-container.edit-mode {
  cursor: crosshair;
}

.canvas-element {
  display: block;
  width: 100%;
  height: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>