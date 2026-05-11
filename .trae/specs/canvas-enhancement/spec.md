# 3M画板能力增强 - 产品需求文档

## Overview
- **Summary**: 基于现有Vue 3 + Fabric.js画布编辑器，增强图形编辑能力，实现类似3M Pattern Editor的高级绘图功能，包括双击添加控制点、多边图形编辑、精确测量和DXF格式支持。
- **Purpose**: 提升画布编辑器的专业性和易用性，使其能够满足工业设计和图案创作的需求。
- **Target Users**: 工业设计师、图案设计师、产品工程师等需要精确绘图的专业用户。

## Goals
- 实现图形双击进入编辑模式，支持在线条上添加控制点
- 增强圆形、矩形（含正方形）、梯形等基础图形的编辑能力
- 优化钢笔工具，支持路径节点编辑
- 添加DXF文件格式的导入/导出支持
- 实现网格对齐和精确测量功能

## Non-Goals (Out of Scope)
- 3D绘图功能
- 多人协作编辑
- 复杂的CAD约束关系
- 渲染引擎重写（继续使用Fabric.js）

## Background & Context
- 现有项目基于Vue 3 + Fabric.js实现了基础绘图功能
- 用户反馈现有图形编辑能力与3M Pattern Editor存在差距
- 核心差距：双击图形后无法在线条上添加点位进行调整
- 需要增强的功能：控制点编辑、多边形编辑、精确测量、DXF支持

## Functional Requirements
- **FR-1**: 图形双击进入编辑模式，显示控制点
- **FR-2**: 在图形边线上点击可添加新的控制点
- **FR-3**: 支持拖拽控制点调整图形形状
- **FR-4**: 支持圆形、矩形、正方形、梯形的高级编辑
- **FR-5**: 钢笔工具路径支持节点编辑和添加
- **FR-6**: DXF文件格式导入支持
- **FR-7**: DXF文件格式导出支持
- **FR-8**: 网格显示与对齐功能
- **FR-9**: 标尺和尺寸标注功能

## Non-Functional Requirements
- **NFR-1**: 控制点响应延迟 < 100ms
- **NFR-2**: 支持1000+个控制点的复杂图形
- **NFR-3**: DXF导入时间 < 5s（100KB文件）
- **NFR-4**: 支持主流浏览器（Chrome, Firefox, Edge）

## Constraints
- **Technical**: 基于Vue 3 + Fabric.js，不引入新的画布引擎
- **Business**: 保持与现有UI风格一致（Ant Design Vue）
- **Dependencies**: 使用dxf-parser和dxf-writer库处理DXF格式

## Assumptions
- 用户熟悉基础绘图工具操作
- 用户需要精确控制图形形状
- 现有代码结构可扩展

## Acceptance Criteria

### AC-1: 图形双击编辑模式
- **Given**: 用户在画布上绘制了一个矩形/圆形/梯形
- **When**: 用户双击该图形
- **Then**: 图形进入编辑模式，显示现有控制点，边线高亮显示
- **Verification**: `human-judgment`
- **Notes**: 双击后工具自动切换为选择模式

### AC-2: 边线添加控制点
- **Given**: 图形处于编辑模式，光标悬停在边线上
- **When**: 用户点击边线任意位置
- **Then**: 在点击位置添加新的控制点，图形形状自动调整
- **Verification**: `human-judgment`
- **Notes**: 控制点添加时应有视觉反馈（如高亮提示）

### AC-3: 控制点拖拽调整
- **Given**: 图形处于编辑模式，鼠标悬停在控制点上
- **When**: 用户拖拽控制点到新位置
- **Then**: 图形形状跟随控制点移动实时更新
- **Verification**: `human-judgment`

### AC-4: 钢笔路径节点编辑
- **Given**: 用户使用钢笔工具绘制了一条路径
- **When**: 用户双击路径进入编辑模式
- **Then**: 显示路径上的所有节点，支持拖拽调整和添加新节点
- **Verification**: `human-judgment`

### AC-5: DXF文件导入
- **Given**: 用户点击导入按钮并选择DXF文件
- **When**: 文件解析完成
- **Then**: DXF中的图形实体（线、圆、多段线等）正确渲染到画布
- **Verification**: `programmatic`
- **Notes**: 支持DXF R12和R2000格式

### AC-6: DXF文件导出
- **Given**: 画布上有绘制的图形
- **When**: 用户选择导出为DXF格式
- **Then**: 生成有效的DXF文件，包含所有图形实体
- **Verification**: `programmatic`

### AC-7: 网格对齐
- **Given**: 启用了网格对齐功能
- **When**: 用户绘制或移动图形
- **Then**: 图形自动吸附到最近的网格点
- **Verification**: `human-judgment`

### AC-8: 尺寸标注
- **Given**: 用户选择尺寸标注工具
- **When**: 用户在图形上点击两个点
- **Then**: 显示两点之间的距离标注
- **Verification**: `human-judgment`

## Open Questions
- [ ] DXF文件中复杂实体（如样条曲线）的处理方式
- [ ] 控制点编辑时的撤销/重做如何实现
- [ ] 梯形工具是否需要单独创建或通过矩形变形实现