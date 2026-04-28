# Canvas Editor 使用文档

## 一、项目概述

**Canvas Editor** 是一个基于 Vue 3 和 Fabric.js 的在线画布编辑器应用，提供基础的绘图功能，支持矩形、圆形绘制、自由画笔、对象操作、图层管理等功能。

## 二、技术栈

| 技术             | 版本      | 用途         |
| -------------- | ------- | ---------- |
| Vue 3          | ^3.4.21 | 前端框架       |
| Fabric.js      | ^5.3.0  | Canvas 图形库 |
| Ant Design Vue | ^4.1.2  | UI 组件库     |
| Vite           | ^5.1.6  | 构建工具       |

## 三、运行命令

```bash
# 安装依赖
npm install

# 开发模式（默认端口 5173）
npm run dev

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

## 四、功能列表

### 4.1 绘图工具

| 工具   | 快捷键 | 功能说明        |
| ---- | --- | ----------- |
| 选择工具 | V   | 选择和移动画布上的对象 |
| 移动工具 | M   | 移动对象位置      |
| 矩形工具 | R   | 绘制矩形        |
| 圆形工具 | C   | 绘制圆形        |
| 钢笔工具 | P   | 自由绘制路径      |

### 4.2 对象操作

| 操作   | 说明                       |
| ---- | ------------------------ |
| 删除   | Delete/Backspace 键删除选中对象 |
| 置顶   | 将选中对象移到图层最顶层             |
| 置底   | 将选中对象移到图层最底层             |
| 水平翻转 | 水平镜像翻转对象                 |
| 垂直翻转 | 垂直镜像翻转对象                 |

### 4.3 画布控制

| 操作   | 说明                                  |
| ---- | ----------------------------------- |
| 缩放   | Ctrl/Cmd + 滚轮缩放画布                   |
| 适应屏幕 | 自动调整缩放使画布完整显示                       |
| 撤销   | Ctrl/Cmd + Z                        |
| 重做   | Ctrl/Cmd + Y / Ctrl/Cmd + Shift + Z |

### 4.4 导出功能

支持导出为 PNG、JPEG、WebP 格式，可调节图片质量。

## 五、组件结构

```
src/
├── components/
│   ├── Canvas.vue        # 核心画布组件（Fabric.js 封装）
│   ├── PropertyPanel.vue # 右侧属性面板（对象属性编辑）
│   ├── Toolbar.vue       # 左侧工具栏（工具选择）
│   └── Ruler.vue         # 标尺组件（画布坐标显示）
├── composables/
│   ├── useCanvas.js      # 画布逻辑封装（可复用）
│   └── useTools.js       # 工具状态管理（可复用）
├── assets/
│   └── styles.css        # 全局样式
├── App.vue               # 主应用组件
└── main.js               # 入口文件
```

## 六、API 参考

### 6.1 Canvas.vue 暴露的方法

通过 ref 调用 Canvas 组件的方法：

```javascript
const canvasComponent = ref(null)

// 添加矩形
canvasComponent.value.addRect({
  left: 100,
  top: 100,
  width: 100,
  height: 80,
  fill: '#1890ff'
})

// 添加圆形
canvasComponent.value.addCircle({
  left: 100,
  top: 100,
  radius: 50,
  fill: '#52c41a'
})

// 删除选中对象
canvasComponent.value.deleteSelected()

// 更新选中对象属性
canvasComponent.value.updateSelectedObject({
  fill: '#ff0000',
  strokeWidth: 2
})

// 图层操作
canvasComponent.value.bringToFront()   // 置顶
canvasComponent.value.sendToBack()     // 置底

// 导出图片
canvasComponent.value.exportToImage('png')

// 撤销/重做
canvasComponent.value.undo()
canvasComponent.value.redo()

// 缩放控制
canvasComponent.value.zoomIn()
canvasComponent.value.zoomOut()
canvasComponent.value.resetZoom()
canvasComponent.value.fitToScreen()

// 清空画布
canvasComponent.value.clearCanvas()
```

### 6.2 Props 和 Events

**Canvas 组件:**

```vue
<Canvas
  :current-tool="currentTool"    <!-- 当前工具类型 -->
  :tool-settings="toolSettings"  <!-- 工具设置 -->
  @canvas-ready="handler"        <!-- 画布初始化完成 -->
  @object-selected="handler"     <!-- 对象被选中 -->
  @object-modified="handler"     <!-- 对象被修改 -->
/>
```

**PropertyPanel 组件:**

```vue
<PropertyPanel
  :selected-object="selectedObject"  <!-- 选中的对象 -->
  :current-tool="currentTool"        <!-- 当前工具 -->
  :tool-settings="toolSettings"     <!-- 工具设置 -->
  @object-update="handler"          <!-- 对象属性更新 -->
  @update:tool-settings="handler"   <!-- 工具设置更新 -->
/>
```

## 七、数据结构

### 7.1 工具设置 (toolSettings)

```javascript
{
  fillColor: '#1890ff',    // 填充颜色
  strokeColor: '#000000',  // 边框颜色
  strokeWidth: 2,          // 边框宽度（像素）
  penColor: '#000000',     // 钢笔颜色
  penWidth: 2              // 钢笔宽度（像素）
}
```

### 7.2 对象属性

支持的对象类型: `rect`, `circle`, `ellipse`, `triangle`, `line`, `path`, `text`, `image`, `polygon`, `polyline`

**通用属性:**

- `left`, `top` - 位置坐标
- `angle` - 旋转角度（度）
- `scaleX`, `scaleY` - 缩放比例（负值表示翻转）
- `fill` - 填充颜色
- `stroke` - 边框颜色
- `strokeWidth` - 边框宽度
- `opacity` - 不透明度（0-1）

**矩形特有属性:**

- `width` - 宽度
- `height` - 高度

**圆形特有属性:**

- `radius` - 半径

## 八、快捷键汇总

| 快捷键                  | 功能             |
| -------------------- | -------------- |
| V                    | 切换到选择工具        |
| M                    | 切换到移动工具        |
| R                    | 切换到矩形工具        |
| C                    | 切换到圆形工具        |
| P                    | 切换到钢笔工具        |
| Delete/Backspace     | 删除选中对象         |
| Escape               | 退出当前工具，切换到选择工具 |
| Ctrl/Cmd + Z         | 撤销操作           |
| Ctrl/Cmd + Y         | 重做操作           |
| Ctrl/Cmd + Shift + Z | 重做操作           |
| Ctrl/Cmd + 滚轮        | 缩放画布           |

## 九、组件说明

### 9.1 Canvas.vue

核心画布组件，基于 Fabric.js 封装，负责：

- 画布初始化和渲染
- 鼠标事件处理（绘制、选择、移动）
- 对象创建和管理
- 历史记录管理（撤销/重做）
- 图层管理（置顶/置底）
- 画布导出

### 9.2 PropertyPanel.vue

右侧属性面板，负责：

- 显示选中对象的属性
- 编辑对象位置、尺寸、旋转角度
- 设置填充颜色、边框颜色和宽度
- 调整不透明度
- 翻转操作（水平/垂直）

### 9.3 Toolbar.vue

左侧工具栏，提供：

- 工具选择按钮
- 撤销/重做按钮
- 删除、置顶、置底按钮
- 导出和清空按钮

### 9.4 Ruler.vue

标尺组件，显示：

- 水平标尺（X轴）
- 垂直标尺（Y轴）
- 根据缩放比例动态调整刻度

## 十、Composables

### 10.1 useCanvas.js

画布逻辑封装，提供：

- 画布初始化和配置
- 对象创建方法（矩形、圆形、路径）
- 画布操作（缩放、平移）
- 历史记录管理
- 对象操作（删除、更新、图层）
- 导出功能

### 10.2 useTools.js

工具状态管理，提供：

- 当前工具状态
- 工具设置（颜色、宽度等）
- 工具切换方法
- 工具类型枚举

