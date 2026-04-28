<template>
  <div class="toolbar">
    <!-- 选择工具 -->
    <a-tooltip title="选择工具 (V)" position="right">
      <button 
        class="tool-btn" 
        :class="{ active: currentTool === 'select' }"
        @click="$emit('tool-change', 'select')"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
          <path d="M13 13l6 6"/>
        </svg>
      </button>
    </a-tooltip>

    <!-- 移动工具 -->
    <a-tooltip title="移动工具 (M)" position="right">
      <button 
        class="tool-btn" 
        :class="{ active: currentTool === 'move' }"
        @click="$emit('tool-change', 'move')"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"/>
        </svg>
      </button>
    </a-tooltip>

    <a-divider style="margin: 8px 0;" />

    <!-- 矩形工具 -->
    <a-tooltip title="矩形工具 (R)" position="right">
      <button 
        class="tool-btn" 
        :class="{ active: currentTool === 'rect' }"
        @click="$emit('tool-change', 'rect')"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
      </button>
    </a-tooltip>

    <!-- 圆形工具 -->
    <a-tooltip title="圆形工具 (C)" position="right">
      <button 
        class="tool-btn" 
        :class="{ active: currentTool === 'circle' }"
        @click="$emit('tool-change', 'circle')"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
      </button>
    </a-tooltip>

    <!-- 钢笔工具 -->
    <a-tooltip title="钢笔工具 (P)" position="right">
      <button 
        class="tool-btn" 
        :class="{ active: currentTool === 'pen' }"
        @click="$emit('tool-change', 'pen')"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
      </button>
    </a-tooltip>

    <a-divider style="margin: 8px 0;" />

    <!-- 撤销 -->
    <a-tooltip title="撤销 (Ctrl+Z)" position="right">
      <button 
        class="tool-btn" 
        :class="{ disabled: !canUndo }"
        :disabled="!canUndo"
        @click="$emit('undo')"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
        </svg>
      </button>
    </a-tooltip>

    <!-- 重做 -->
    <a-tooltip title="重做 (Ctrl+Y)" position="right">
      <button 
        class="tool-btn" 
        :class="{ disabled: !canRedo }"
        :disabled="!canRedo"
        @click="$emit('redo')"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/>
        </svg>
      </button>
    </a-tooltip>

    <a-divider style="margin: 8px 0;" />

    <!-- 删除 -->
    <a-tooltip title="删除 (Delete)" position="right">
      <button 
        class="tool-btn" 
        :class="{ disabled: !hasSelectedObject }"
        :disabled="!hasSelectedObject"
        @click="$emit('delete')"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
      </button>
    </a-tooltip>

    <!-- 置顶 -->
    <a-tooltip title="置顶" position="right">
      <button 
        class="tool-btn" 
        :class="{ disabled: !hasSelectedObject }"
        :disabled="!hasSelectedObject"
        @click="$emit('bring-to-front')"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 5h18v2H3zm4 6h10v2H7zm-4 6h18v2H3z"/>
        </svg>
      </button>
    </a-tooltip>

    <!-- 置底 -->
    <a-tooltip title="置底" position="right">
      <button 
        class="tool-btn" 
        :class="{ disabled: !hasSelectedObject }"
        :disabled="!hasSelectedObject"
        @click="$emit('send-to-back')"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 5h18v2H3zm4 6h10v2H7zm-4 6h18v2H3z" transform="rotate(180 12 12)"/>
        </svg>
      </button>
    </a-tooltip>

    <a-divider style="margin: 8px 0;" />

    <!-- 导出 -->
    <a-tooltip title="导出图片" position="right">
      <button class="tool-btn" @click="$emit('export')">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
      </button>
    </a-tooltip>

    <!-- 清空画布 -->
    <a-tooltip title="清空画布" position="right">
      <button class="tool-btn" @click="$emit('clear')">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </a-tooltip>
  </div>
</template>

<script setup>
/**
 * Toolbar 组件 - 左侧工具栏
 * 提供绘图工具选择、撤销重做、图层管理和导出等功能
 */

defineProps({
  /**
   * 当前选中的工具类型
   * @type {string}
   * @default 'select'
   */
  currentTool: {
    type: String,
    default: 'select'
  },
  
  /**
   * 是否可以撤销
   * @type {boolean}
   * @default false
   */
  canUndo: {
    type: Boolean,
    default: false
  },
  
  /**
   * 是否可以重做
   * @type {boolean}
   * @default false
   */
  canRedo: {
    type: Boolean,
    default: false
  },
  
  /**
   * 是否有选中的对象
   * @type {boolean}
   * @default false
   */
  hasSelectedObject: {
    type: Boolean,
    default: false
  }
})

/**
 * 工具栏触发的事件
 * @event tool-change - 工具切换事件
 * @event undo - 撤销操作事件
 * @event redo - 重做操作事件
 * @event delete - 删除选中对象事件
 * @event bring-to-front - 置顶操作事件
 * @event send-to-back - 置底操作事件
 * @event export - 导出图片事件
 * @event clear - 清空画布事件
 */
defineEmits([
  'tool-change',
  'undo',
  'redo',
  'delete',
  'bring-to-front',
  'send-to-back',
  'export',
  'clear'
])
</script>

<style scoped>
.toolbar {
  width: 56px;
  background: #ffffff;
  border-right: 1px solid #d9d9d9;
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 4px;
}

.tool-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  background: transparent;
  color: #595959;
  padding: 0;
}

.tool-btn:hover {
  background: #f5f5f5;
  color: #1890ff;
}

.tool-btn.active {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.tool-btn svg {
  width: 20px;
  height: 20px;
}

.tool-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.tool-btn.disabled:hover {
  background: transparent;
  color: #595959;
}
</style>
