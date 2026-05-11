# 3M画板能力增强 - 实现计划

## [ ] Task 1: 安装DXF处理依赖库
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 安装dxf-parser库用于DXF文件解析
  - 安装dxf-writer库用于DXF文件导出
- **Acceptance Criteria Addressed**: AC-5, AC-6
- **Test Requirements**:
  - `programmatic` TR-1.1: 依赖包成功安装到package.json
  - `human-judgement` TR-1.2: 确认package.json中包含dxf-parser和dxf-writer
- **Notes**: 使用npm安装最新稳定版本

## [ ] Task 2: 创建DXF解析工具模块
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 创建src/utils/dxfParser.js模块
  - 实现DXF文件解析函数
  - 将DXF实体转换为Fabric.js对象
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-2.1: 解析测试DXF文件返回正确的实体数量
  - `programmatic` TR-2.2: LINE、CIRCLE、POLYLINE实体正确转换为Fabric对象
- **Notes**: 支持DXF R12和R2000格式，处理图层和颜色信息

## [ ] Task 3: 创建DXF导出工具模块
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 创建src/utils/dxfWriter.js模块
  - 实现Fabric对象到DXF实体的转换
  - 生成标准DXF文件格式
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `programmatic` TR-3.1: 导出的DXF文件可被CAD软件打开
  - `programmatic` TR-3.2: 导出文件包含正确的图形实体信息
- **Notes**: 支持直线、圆、多段线等基本实体

## [ ] Task 4: 实现图形双击编辑模式
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 修改Canvas.vue，添加双击事件监听
  - 实现图形编辑模式状态管理
  - 创建控制点渲染组件
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `human-judgement` TR-4.1: 双击矩形/圆形/路径后进入编辑模式
  - `human-judgement` TR-4.2: 编辑模式下显示控制点和高亮边线
- **Notes**: 使用Fabric.js的group功能管理控制点

## [ ] Task 5: 实现边线点击添加控制点
- **Priority**: P0
- **Depends On**: Task 4
- **Description**: 
  - 实现边线检测算法
  - 添加点击边线时的视觉反馈
  - 实现控制点添加逻辑
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `human-judgement` TR-5.1: 光标悬停在边线上显示添加提示
  - `human-judgement` TR-5.2: 点击边线正确添加新控制点
- **Notes**: 使用Canvas API进行点到线段的距离检测

## [ ] Task 6: 实现控制点拖拽调整
- **Priority**: P0
- **Depends On**: Task 4, Task 5
- **Description**: 
  - 实现控制点拖拽事件处理
  - 更新图形形状跟随控制点移动
  - 处理多边形和路径的重新计算
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `human-judgement` TR-6.1: 拖拽控制点时图形实时更新
  - `human-judgement` TR-6.2: 释放鼠标后图形保持新形状
- **Notes**: 使用requestAnimationFrame优化性能

## [ ] Task 7: 增强钢笔工具路径编辑
- **Priority**: P1
- **Depends On**: Task 4
- **Description**: 
  - 修改钢笔工具绘制逻辑
  - 支持路径节点的显示和编辑
  - 实现贝塞尔曲线控制点编辑
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `human-judgement` TR-7.1: 双击钢笔路径显示所有节点
  - `human-judgement` TR-7.2: 拖拽节点调整路径形状
- **Notes**: 使用Fabric.js的Path对象方法

## [ ] Task 8: 实现梯形工具
- **Priority**: P1
- **Depends On**: None
- **Description**: 
  - 在Toolbar.vue添加梯形工具按钮
  - 实现梯形绘制逻辑
  - 支持梯形的编辑和属性调整
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `human-judgement` TR-8.1: 工具栏显示梯形工具按钮
  - `human-judgement` TR-8.2: 画布上可绘制梯形并编辑
- **Notes**: 梯形通过四边形实现，支持上下底长度调整

## [ ] Task 9: 实现网格显示与对齐功能
- **Priority**: P1
- **Depends On**: None
- **Description**: 
  - 添加网格显示开关
  - 实现网格渲染
  - 实现图形吸附对齐
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `human-judgement` TR-9.1: 网格显示/隐藏切换正常
  - `human-judgement` TR-9.2: 移动图形时自动吸附到网格点
- **Notes**: 使用Fabric.js的GridPattern

## [ ] Task 10: 实现尺寸标注工具
- **Priority**: P2
- **Depends On**: None
- **Description**: 
  - 在Toolbar.vue添加尺寸标注工具按钮
  - 实现标注绘制逻辑
  - 支持标注文字显示
- **Acceptance Criteria Addressed**: AC-8
- **Test Requirements**:
  - `human-judgement` TR-10.1: 工具栏显示尺寸标注工具
  - `human-judgement` TR-10.2: 点击两点显示距离标注
- **Notes**: 使用Fabric.js的Text对象显示尺寸值

## [x] Task 11: 添加导入/导出UI功能
- **Priority**: P1
- **Depends On**: Task 2, Task 3
- **Description**: 
  - 在顶部工具栏添加导入按钮
  - 添加文件选择对话框
  - 支持DXF和PNG格式导出
- **Acceptance Criteria Addressed**: AC-5, AC-6
- **Test Requirements**:
  - `human-judgement` TR-11.1: 导入按钮可点击并选择DXF文件
  - `human-judgement` TR-11.2: 导出菜单包含DXF选项
- **Notes**: 使用HTML5 File API处理文件

## [ ] Task 12: 更新属性面板支持新图形类型
- **Priority**: P1
- **Depends On**: Task 8
- **Description**: 
  - 更新PropertyPanel.vue支持梯形属性
  - 添加控制点数量显示
  - 支持多边形顶点管理
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `human-judgement` TR-12.1: 选中梯形时显示梯形属性
  - `human-judgement` TR-12.2: 选中路径时显示节点数量
- **Notes**: 复用现有属性编辑逻辑