# 设置界面优化指南

## 需要优化的部分

### 1. 拖延监控设置界面优化

在 `app.js` 中找到拖延监控设置的渲染代码，需要将自定义提示语输入框直接放在对应的时间设置下方。

#### 优化前的结构：
```
启动宽限期: [输入框]
预警提前时间: [输入框]
...
（其他设置）
...
自定义预警提示语: [输入框]
自定义超时提示语: [输入框]
```

#### 优化后的结构：
```
启动宽限期: [输入框]
└─ 自定义预警提示语: [输入框]
   提示：在预警阶段播放的语音内容

预警提前时间: [输入框]  
└─ 自定义超时提示语: [输入框]
   提示：超时后播放的语音内容
```

### 2. 低效率监控设置界面优化

在 `app.js` 中找到低效率监控设置的渲染代码，需要在"判定时长"下方添加自定义提示语输入框。

#### 需要添加的结构：
```
判定时长: [输入框] 分钟
└─ 自定义低效率提示语: [输入框]
   提示：判定为低效率时播放的语音内容
   默认值：您已在当前步骤停留{minutes}分钟，可能陷入低效循环，请及时调整
```

## 实现代码示例

### 拖延监控设置 HTML 结构

```html
<div class="setting-group">
    <label class="setting-label">
        <span>启动宽限期（秒）</span>
        <input type="number" 
               value="${ProcrastinationMonitor.settings.gracePeriod}" 
               onchange="ProcrastinationMonitor.updateSetting('gracePeriod', parseInt(this.value))">
    </label>
    
    <!-- 紧接着添加自定义提示语 -->
    <div class="setting-sub-item">
        <label class="setting-label">
            <span>预警阶段提示语</span>
            <textarea 
                placeholder="距离{task}开始还有{seconds}秒，请准备启动步骤：{step}"
                onchange="ProcrastinationMonitor.updateSetting('customPreAlertText', this.value)"
            >${ProcrastinationMonitor.settings.customPreAlertText}</textarea>
        </label>
        <div class="setting-hint">
            💡 可用变量：{task} {step} {seconds}
        </div>
    </div>
</div>

<div class="setting-group">
    <label class="setting-label">
        <span>预警提前时间（秒）</span>
        <input type="number" 
               value="${ProcrastinationMonitor.settings.preAlertTime}" 
               onchange="ProcrastinationMonitor.updateSetting('preAlertTime', parseInt(this.value))">
    </label>
    
    <!-- 紧接着添加自定义提示语 -->
    <div class="setting-sub-item">
        <label class="setting-label">
            <span>超时阶段提示语</span>
            <textarea 
                placeholder="任务{task}已超时，请立即开始执行步骤：{step}"
                onchange="ProcrastinationMonitor.updateSetting('customAlertText', this.value)"
            >${ProcrastinationMonitor.settings.customAlertText}</textarea>
        </label>
        <div class="setting-hint">
            💡 可用变量：{task} {step}
        </div>
    </div>
</div>
```

### 低效率监控设置 HTML 结构

```html
<div class="setting-group">
    <label class="setting-label">
        <span>判定时长（分钟）</span>
        <input type="number" 
               value="${InefficiencyMonitor.settings.thresholdMinutes}" 
               onchange="InefficiencyMonitor.updateSetting('thresholdMinutes', parseInt(this.value))">
    </label>
    
    <!-- 紧接着添加自定义提示语 -->
    <div class="setting-sub-item">
        <label class="setting-label">
            <span>低效率提示语</span>
            <textarea 
                placeholder="您已在当前步骤停留{minutes}分钟，可能陷入低效循环，请及时调整"
                onchange="InefficiencyMonitor.updateSetting('customAlertText', this.value)"
            >${InefficiencyMonitor.settings.customAlertText}</textarea>
        </label>
        <div class="setting-hint">
            💡 可用变量：{minutes}
        </div>
    </div>
</div>
```

## CSS 样式

```css
.setting-group {
    margin-bottom: 24px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 12px;
}

[data-theme="dark"] .setting-group {
    background: rgba(60, 60, 100, 0.3);
}

.setting-sub-item {
    margin-top: 12px;
    margin-left: 20px;
    padding-left: 16px;
    border-left: 3px solid #667eea;
}

.setting-label {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;
    color: #2C3E50;
}

[data-theme="dark"] .setting-label {
    color: #E8E8E8;
}

.setting-label span {
    font-weight: 600;
}

.setting-label input,
.setting-label textarea {
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
}

.setting-label textarea {
    min-height: 80px;
    resize: vertical;
}

[data-theme="dark"] .setting-label input,
[data-theme="dark"] .setting-label textarea {
    background: rgba(40, 40, 70, 0.5);
    border-color: rgba(255, 255, 255, 0.1);
    color: #E8E8E8;
}

.setting-hint {
    font-size: 12px;
    color: #666;
    margin-top: 4px;
    padding: 8px 12px;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 6px;
}

[data-theme="dark"] .setting-hint {
    color: #A0A0A0;
    background: rgba(102, 126, 234, 0.2);
}
```

## 修改步骤

1. 在 `app.js` 中找到 `renderProcrastinationMonitor` 或类似的渲染函数
2. 找到设置面板的 HTML 生成代码
3. 按照上述结构重新组织设置项
4. 确保每个时间设置下方紧跟对应的自定义提示语输入框
5. 添加相应的 CSS 样式到 `main.css`

## 注意事项

- 保持设置项的逻辑分组
- 使用缩进和边框来表示层级关系
- 提供清晰的提示信息和可用变量说明
- 确保输入框的 onchange 事件正确绑定到更新函数

