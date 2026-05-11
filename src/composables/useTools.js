import { ref, reactive, computed } from 'vue'

/**
 * 工具类型枚举
 * 定义编辑器支持的所有绘图工具类型
 */
export const ToolType = {
  SELECT: 'select',   // 选择工具
  MOVE: 'move',       // 移动工具
  RECT: 'rect',       // 矩形工具
  CIRCLE: 'circle',   // 圆形工具
  PEN: 'pen',         // 钢笔工具
  TRAPEZOID: 'trapezoid' // 梯形工具
}

/**
 * useTools Composable
 * 提供工具状态管理和切换功能
 */
export function useTools() {
  // 当前工具
  const currentTool = ref(ToolType.SELECT)
  
  // 工具设置
  const toolSettings = reactive({
    // 形状工具设置
    fillColor: '#1890ff',
    strokeColor: '#000000',
    strokeWidth: 2,
    
    // 钢笔工具设置
    penColor: '#000000',
    penWidth: 2,
    
    // 通用设置
    opacity: 1
  })

  /**
   * 计算属性：判断当前是否为绘制工具
   * @returns {boolean}
   */
  const isDrawingTool = computed(() => {
    return [ToolType.RECT, ToolType.CIRCLE, ToolType.PEN].includes(currentTool.value)
  })

  /**
   * 计算属性：判断当前是否为选择工具
   * @returns {boolean}
   */
  const isSelectTool = computed(() => {
    return currentTool.value === ToolType.SELECT
  })

  /**
   * 切换到选择工具
   */
  const selectTool = () => {
    currentTool.value = ToolType.SELECT
  }

  /**
   * 切换到移动工具
   */
  const selectMoveTool = () => {
    currentTool.value = ToolType.MOVE
  }

  /**
   * 切换到矩形工具
   */
  const selectRectTool = () => {
    currentTool.value = ToolType.RECT
  }

  /**
   * 切换到圆形工具
   */
  const selectCircleTool = () => {
    currentTool.value = ToolType.CIRCLE
  }

  /**
   * 切换到钢笔工具
   */
  const selectPenTool = () => {
    currentTool.value = ToolType.PEN
  }

  /**
   * 切换到梯形工具
   */
  const selectTrapezoidTool = () => {
    currentTool.value = ToolType.TRAPEZOID
  }

  /**
   * 更新工具设置
   * @param {string} key - 设置项键名
   * @param {*} value - 设置值
   */
  const updateSettings = (key, value) => {
    toolSettings[key] = value
  }

  /**
   * 重置工具设置为默认值
   */
  const resetSettings = () => {
    toolSettings.fillColor = '#1890ff'
    toolSettings.strokeColor = '#000000'
    toolSettings.strokeWidth = 2
    toolSettings.penColor = '#000000'
    toolSettings.penWidth = 2
    toolSettings.opacity = 1
  }

  return {
    currentTool,
    toolSettings,
    isDrawingTool,
    isSelectTool,
    ToolType,
    selectTool,
    selectMoveTool,
    selectRectTool,
    selectCircleTool,
    selectPenTool,
    selectTrapezoidTool,
    updateSettings,
    resetSettings
  }
}