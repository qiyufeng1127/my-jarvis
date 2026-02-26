# 紧急任务系统实现文档

## 系统概述

已成功实现基于活动监控的紧急任务系统，替代原有的每日生存成本扣除机制。

## 核心功能

### 1. 活动监控服务 (`activityMonitorService.ts`)
- 监控用户是否在时间轴上添加任务
- 1小时无活动自动触发紧急任务
- 每5分钟检查一次活动状态
- 可自定义不活动阈值

### 2. 紧急任务库 (`emergencyTaskStore.ts`)
- 支持自定义紧急任务
- 任务频率设置：每天/每两天/每周/自定义天数
- 每个任务包含：
  - 标题和描述
  - 完成奖励金币
  - 失败惩罚金币
  - 图片验证关键词（可选）
  - 启用/禁用状态

### 3. 任务触发机制
- 从符合频率条件的任务中随机抽取
- 支持任务替换（换一个任务）
- 记录任务历史（完成/失败/跳过）

### 4. 用户界面
- **紧急任务管理器** (`EmergencyTaskManager.tsx`)：添加、编辑、删除紧急任务
- **紧急任务弹窗** (`EmergencyTaskModal.tsx`)：显示当前任务，支持完成验证和替换
- **紧急任务触发器** (`EmergencyTaskTrigger.tsx`)：监听触发事件，自动显示弹窗

### 5. 集成点
- 在 `App.tsx` 中启动活动监控服务
- 在 `taskStore.ts` 中记录用户添加任务的活动
- 在 `GameSystemPanel.tsx` 中添加紧急任务库入口

## 使用流程

1. 用户在游戏系统面板中打开"🚨 紧急任务库"
2. 添加自己的紧急任务（如：洗碗、整理书桌、做俯卧撑等）
3. 设置任务频率和奖惩金币
4. 系统自动监控用户活动
5. 1小时无活动时，随机抽取一个符合条件的任务
6. 弹窗显示任务，用户可以：
   - 完成任务（拍照验证）
   - 换一个任务
   - 放弃任务（扣金币）

## 技术特点

- 完全本地化，无需后端
- 使用 Zustand 进行状态管理
- 支持任务频率智能判断
- 集成百度AI图片识别验证
- 实时活动监控和事件驱动

## 文件清单

- `src/services/activityMonitorService.ts` - 活动监控服务
- `src/stores/emergencyTaskStore.ts` - 紧急任务状态管理
- `src/components/emergency/EmergencyTaskManager.tsx` - 任务管理界面
- `src/components/emergency/EmergencyTaskModal.tsx` - 任务弹窗
- `src/components/emergency/EmergencyTaskTrigger.tsx` - 触发器组件

