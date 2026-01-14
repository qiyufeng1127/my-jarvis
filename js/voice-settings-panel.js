// 语音设置可视化面板
// 提供统一的语音设置界面

const VoiceSettingsPanel = {
    // 渲染设置面板
    render() {
        const VS = window.UnifiedVoiceSystem;
        if (!VS) return '<div class="voice-error">语音系统未加载</div>';
        
        const settings = VS.settings;
        const voices = VS.getChineseVoices();
        
        return `
            <div class="voice-settings-container">
                <!-- 主开关 -->
                <div class="voice-main-toggle">
                    <div class="toggle-info">
                        <span class="toggle-icon">${VS.isEnabled ? '🔊' : '🔇'}</span>
                        <div class="toggle-text">
                            <div class="toggle-title">语音助手</div>
                            <div class="toggle-desc">${VS.isEnabled ? '已开启 - 语音识别和播报均已启用' : '已关闭'}</div>
                        </div>
                    </div>
                    <button class="voice-toggle-btn ${VS.isEnabled ? 'active' : ''}" onclick="VoiceSettingsPanel.toggleVoice()">
                        ${VS.isEnabled ? 'ON' : 'OFF'}
                    </button>
                </div>

                <!-- 语音风格设置 -->
                <div class="voice-section">
                    <div class="section-header">
                        <span class="section-icon">🎙️</span>
                        <span class="section-title">语音风格</span>
                    </div>
                    <div class="section-content">
                        <div class="voice-select-group">
                            <label>选择语音</label>
                            <select id="voiceSelect" onchange="VoiceSettingsPanel.changeVoice(this.value)">
                                ${voices.length === 0 ? '<option value="">无可用中文语音</option>' : ''}
                                ${voices.map(v => `
                                    <option value="${v.name}" ${settings.voiceName === v.name ? 'selected' : ''}>
                                        ${v.name} ${v.localService ? '(本地)' : '(在线)'}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="voice-slider-group">
                            <label>语速: <span id="rateValue">${settings.voiceRate.toFixed(1)}</span></label>
                            <input type="range" min="0.5" max="2" step="0.1" value="${settings.voiceRate}" 
                                onchange="VoiceSettingsPanel.updateSlider('voiceRate', this.value, 'rateValue')">
                        </div>
                        
                        <div class="voice-slider-group">
                            <label>音调: <span id="pitchValue">${settings.voicePitch.toFixed(1)}</span></label>
                            <input type="range" min="0.5" max="2" step="0.1" value="${settings.voicePitch}" 
                                onchange="VoiceSettingsPanel.updateSlider('voicePitch', this.value, 'pitchValue')">
                        </div>
                        
                        <div class="voice-slider-group">
                            <label>音量: <span id="volumeValue">${Math.round(settings.voiceVolume * 100)}%</span></label>
                            <input type="range" min="0" max="1" step="0.1" value="${settings.voiceVolume}" 
                                onchange="VoiceSettingsPanel.updateSlider('voiceVolume', this.value, 'volumeValue', true)">
                        </div>
                        
                        <button class="voice-test-btn" onclick="VoiceSettingsPanel.testVoice()">
                            🔊 测试语音
                        </button>
                    </div>
                </div>

                <!-- 触发点设置 -->
                <div class="voice-section">
                    <div class="section-header">
                        <span class="section-icon">⏰</span>
                        <span class="section-title">语音触发点</span>
                    </div>
                    <div class="section-content">
                        ${this.renderTriggerItem('taskPreStart', '任务即将开始', `提前 ${settings.preStartMinutes} 分钟提醒`, settings.taskPreStart)}
                        ${this.renderTriggerItem('taskStart', '任务正式开始', '任务开始时播报', settings.taskStart)}
                        ${this.renderTriggerItem('taskEndCountdown', '任务结束倒计时', `结束前 ${settings.endCountdownMinutes} 分钟提醒`, settings.taskEndCountdown)}
                        ${this.renderTriggerItem('taskComplete', '任务完成', '完成时播放庆祝', settings.taskComplete)}
                        ${this.renderTriggerItem('procrastinationWarning', '拖延预警', `${settings.procrastinationGrace}秒宽限期，${settings.procrastinationWarningAt}秒时预警`, settings.procrastinationWarning)}
                        ${this.renderTriggerItem('hourlyProgress', '每小时进度', `每 ${settings.hourlyInterval} 分钟询问进度`, settings.hourlyProgress)}
                    </div>
                </div>

                <!-- 时间设置 -->
                <div class="voice-section">
                    <div class="section-header">
                        <span class="section-icon">⚙️</span>
                        <span class="section-title">时间设置</span>
                    </div>
                    <div class="section-content">
                        <div class="time-setting-item">
                            <label>提前提醒时间</label>
                            <div class="time-input-group">
                                <input type="number" min="1" max="30" value="${settings.preStartMinutes}" 
                                    onchange="VoiceSettingsPanel.updateSetting('preStartMinutes', parseInt(this.value))">
                                <span>分钟</span>
                            </div>
                        </div>
                        
                        <div class="time-setting-item">
                            <label>结束倒计时提醒</label>
                            <div class="time-input-group">
                                <input type="number" min="1" max="30" value="${settings.endCountdownMinutes}" 
                                    onchange="VoiceSettingsPanel.updateSetting('endCountdownMinutes', parseInt(this.value))">
                                <span>分钟</span>
                            </div>
                        </div>
                        
                        <div class="time-setting-item">
                            <label>拖延宽限期</label>
                            <div class="time-input-group">
                                <input type="number" min="30" max="300" value="${settings.procrastinationGrace}" 
                                    onchange="VoiceSettingsPanel.updateSetting('procrastinationGrace', parseInt(this.value))">
                                <span>秒</span>
                            </div>
                        </div>
                        
                        <div class="time-setting-item">
                            <label>拖延预警时间</label>
                            <div class="time-input-group">
                                <input type="number" min="5" max="60" value="${settings.procrastinationWarningAt}" 
                                    onchange="VoiceSettingsPanel.updateSetting('procrastinationWarningAt', parseInt(this.value))">
                                <span>秒</span>
                            </div>
                        </div>
                        
                        <div class="time-setting-item">
                            <label>进度询问间隔</label>
                            <div class="time-input-group">
                                <input type="number" min="30" max="120" value="${settings.hourlyInterval}" 
                                    onchange="VoiceSettingsPanel.updateSetting('hourlyInterval', parseInt(this.value))">
                                <span>分钟</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 自定义语音文本 -->
                <div class="voice-section">
                    <div class="section-header">
                        <span class="section-icon">✏️</span>
                        <span class="section-title">自定义语音文本</span>
                        <button class="section-toggle" onclick="VoiceSettingsPanel.toggleSection(this)">展开</button>
                    </div>
                    <div class="section-content collapsed" id="customTextsSection">
                        ${this.renderTextEditor('preStart', '任务即将开始', settings.texts.preStart, '{task}, {minutes}')}
                        ${this.renderTextEditor('taskStart', '任务正式开始', settings.texts.taskStart, '{task}')}
                        ${this.renderTextEditor('endCountdown', '结束倒计时', settings.texts.endCountdown, '{task}, {minutes}')}
                        ${this.renderTextEditor('taskComplete', '任务完成', settings.texts.taskComplete, '{task}')}
                        ${this.renderTextEditor('procrastinationWarning', '拖延预警', settings.texts.procrastinationWarning, '{seconds}')}
                        ${this.renderTextEditor('procrastinationAlert', '拖延警报', settings.texts.procrastinationAlert, '{task}')}
                        ${this.renderTextEditor('hourlyProgress', '每小时进度', settings.texts.hourlyProgress, '{task}, {hours}')}
                        
                        <button class="voice-reset-btn" onclick="VoiceSettingsPanel.resetTexts()">
                            🔄 恢复默认文本
                        </button>
                    </div>
                </div>

                <!-- 语音指令说明 -->
                <div class="voice-section">
                    <div class="section-header">
                        <span class="section-icon">🎤</span>
                        <span class="section-title">语音指令</span>
                    </div>
                    <div class="section-content">
                        <div class="voice-commands-list">
                            <div class="command-item">
                                <span class="command-text">"当前任务" / "什么任务"</span>
                                <span class="command-desc">查询当前任务</span>
                            </div>
                            <div class="command-item">
                                <span class="command-text">"下一个任务" / "下一个"</span>
                                <span class="command-desc">查询下一个任务</span>
                            </div>
                            <div class="command-item">
                                <span class="command-text">"还有多久"</span>
                                <span class="command-desc">查询剩余时间</span>
                            </div>
                            <div class="command-item">
                                <span class="command-text">"完成" / "已完成"</span>
                                <span class="command-desc">标记任务完成</span>
                            </div>
                            <div class="command-item">
                                <span class="command-text">"开始" / "启动"</span>
                                <span class="command-desc">确认开始任务</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 状态显示 -->
                <div class="voice-status">
                    <div class="status-item">
                        <span class="status-icon">${VS.isListening ? '🎤' : '🔇'}</span>
                        <span class="status-text">语音识别: ${VS.isListening ? '监听中' : '已关闭'}</span>
                    </div>
                    <div class="status-item">
                        <span class="status-icon">${VS.currentTask ? '📋' : '💤'}</span>
                        <span class="status-text">当前任务: ${VS.currentTask ? VS.currentTask.title : '无'}</span>
                    </div>
                    <div class="status-item">
                        <span class="status-icon">${VS.isProcrastinationActive ? '⏱️' : '✅'}</span>
                        <span class="status-text">拖延监控: ${VS.isProcrastinationActive ? `倒计时 ${VS.procrastinationSeconds}秒` : '未激活'}</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    // 渲染触发点开关项
    renderTriggerItem(key, title, desc, enabled) {
        return `
            <div class="trigger-item">
                <div class="trigger-info">
                    <div class="trigger-title">${title}</div>
                    <div class="trigger-desc">${desc}</div>
                </div>
                <label class="switch">
                    <input type="checkbox" ${enabled ? 'checked' : ''} 
                        onchange="VoiceSettingsPanel.updateSetting('${key}', this.checked)">
                    <span class="slider"></span>
                </label>
            </div>
        `;
    },
    
    // 渲染文本编辑器
    renderTextEditor(key, title, value, variables) {
        return `
            <div class="text-editor-item">
                <div class="text-editor-header">
                    <span class="text-editor-title">${title}</span>
                    <span class="text-editor-vars">变量: ${variables}</span>
                </div>
                <div class="text-editor-input">
                    <input type="text" value="${this.escapeHtml(value)}" 
                        onchange="VoiceSettingsPanel.updateText('${key}', this.value)">
                    <button class="text-test-btn" onclick="VoiceSettingsPanel.testText('${key}')">🔊</button>
                </div>
            </div>
        `;
    },
    
    // 切换语音开关
    toggleVoice() {
        const VS = window.UnifiedVoiceSystem;
        if (VS) {
            VS.toggle();
            this.refresh();
        }
    },
    
    // 更改语音
    changeVoice(voiceName) {
        const VS = window.UnifiedVoiceSystem;
        if (VS) {
            VS.updateSetting('voiceName', voiceName);
            VS.selectedVoice = VS.availableVoices.find(v => v.name === voiceName);
        }
    },
    
    // 更新滑块设置
    updateSlider(key, value, displayId, isPercent = false) {
        const VS = window.UnifiedVoiceSystem;
        if (VS) {
            const numValue = parseFloat(value);
            VS.updateSetting(key, numValue);
            
            const display = document.getElementById(displayId);
            if (display) {
                display.textContent = isPercent ? `${Math.round(numValue * 100)}%` : numValue.toFixed(1);
            }
        }
    },
    
    // 更新设置
    updateSetting(key, value) {
        const VS = window.UnifiedVoiceSystem;
        if (VS) {
            VS.updateSetting(key, value);
            this.refresh();
        }
    },
    
    // 更新文本
    updateText(key, value) {
        const VS = window.UnifiedVoiceSystem;
        if (VS) {
            VS.updateSetting(`texts.${key}`, value);
        }
    },
    
    // 测试语音
    testVoice() {
        const VS = window.UnifiedVoiceSystem;
        if (VS) {
            VS.testVoice();
        }
    },
    
    // 测试特定文本
    testText(key) {
        const VS = window.UnifiedVoiceSystem;
        if (VS) {
            const text = VS.settings.texts[key];
            // 替换变量为示例值
            const testText = text
                .replace('{task}', '示例任务')
                .replace('{minutes}', '5')
                .replace('{seconds}', '20')
                .replace('{hours}', '1')
                .replace('{time}', '14:30')
                .replace('{status}', '进行中');
            VS.speak(testText);
        }
    },
    
    // 重置文本
    resetTexts() {
        if (confirm('确定要恢复默认语音文本吗？')) {
            const VS = window.UnifiedVoiceSystem;
            if (VS) {
                VS.settings.texts = {
                    preStart: "距离{task}开始还有{minutes}分钟，请准备好",
                    taskStart: "{task}现在开始，加油！",
                    endCountdown: "还有{minutes}分钟，{task}就要结束了",
                    taskComplete: "太棒了！{task}已完成！",
                    procrastinationWarning: "还有{seconds}秒钟启动哦，准备好了吗？",
                    procrastinationAlert: "时间到了！请立即开始{task}！",
                    hourlyProgress: "已经过去{hours}小时了，{task}进展如何？",
                    currentTaskQuery: "当前任务是{task}，{status}",
                    nextTaskQuery: "下一个任务是{task}，将于{time}开始"
                };
                VS.saveSettings();
                this.refresh();
            }
        }
    },
    
    // 切换展开/收起
    toggleSection(btn) {
        const section = btn.closest('.voice-section').querySelector('.section-content');
        if (section) {
            section.classList.toggle('collapsed');
            btn.textContent = section.classList.contains('collapsed') ? '展开' : '收起';
        }
    },
    
    // 刷新面板
    refresh() {
        const container = document.getElementById('voiceSettingsBody');
        if (container) {
            container.innerHTML = this.render();
        }
    },
    
    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // 初始化
    init() {
        // 监听语音进度检查事件
        document.addEventListener('voiceProgressCheck', (e) => {
            this.showProgressDialog(e.detail.task);
        });
        
        // 监听语音任务完成事件
        document.addEventListener('voiceTaskComplete', (e) => {
            // 触发App的任务完成逻辑
            if (typeof App !== 'undefined' && e.detail.task) {
                const task = e.detail.task;
                Storage.updateTask(task.id, { completed: true });
                App.loadTimeline();
                App.updateGameStatus();
            }
        });
        
        console.log('语音设置面板初始化完成');
    },
    
    // 显示进度对话框
    showProgressDialog(task) {
        if (!task) return;
        
        let dialog = document.getElementById('voiceProgressDialog');
        if (dialog) dialog.remove();
        
        dialog = document.createElement('div');
        dialog.id = 'voiceProgressDialog';
        dialog.className = 'voice-progress-dialog';
        dialog.innerHTML = `
            <div class="progress-dialog-content">
                <div class="progress-dialog-header">
                    <span class="progress-icon">📊</span>
                    <span class="progress-title">进度检查</span>
                    <button class="progress-close" onclick="VoiceSettingsPanel.closeProgressDialog()">×</button>
                </div>
                <div class="progress-dialog-body">
                    <div class="progress-task-name">${task.title}</div>
                    <div class="progress-question">当前进展如何？</div>
                    <div class="progress-options">
                        <button class="progress-option smooth" onclick="VoiceSettingsPanel.reportProgress('smooth')">
                            😊 进展顺利
                        </button>
                        <button class="progress-option stuck" onclick="VoiceSettingsPanel.reportProgress('stuck')">
                            😰 遇到卡点
                        </button>
                        <button class="progress-option slow" onclick="VoiceSettingsPanel.reportProgress('slow')">
                            🐢 进度较慢
                        </button>
                    </div>
                    <div class="progress-note">
                        <label>完成了什么？（可选）</label>
                        <textarea id="progressNote" placeholder="简单记录一下..."></textarea>
                    </div>
                </div>
                <div class="progress-dialog-footer">
                    <button class="progress-submit" onclick="VoiceSettingsPanel.submitProgress()">
                        ✅ 提交
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
        
        setTimeout(() => dialog.classList.add('show'), 10);
    },
    
    // 关闭进度对话框
    closeProgressDialog() {
        const dialog = document.getElementById('voiceProgressDialog');
        if (dialog) {
            dialog.classList.remove('show');
            setTimeout(() => dialog.remove(), 300);
        }
    },
    
    // 报告进度
    reportProgress(status) {
        document.querySelectorAll('.progress-option').forEach(btn => {
            btn.classList.remove('selected');
        });
        event.target.classList.add('selected');
        this.currentProgressStatus = status;
    },
    
    // 提交进度
    submitProgress() {
        const note = document.getElementById('progressNote')?.value || '';
        const status = this.currentProgressStatus || 'smooth';
        
        const VS = window.UnifiedVoiceSystem;
        if (VS) {
            let response = '';
            switch (status) {
                case 'smooth':
                    response = '太棒了，继续保持！';
                    break;
                case 'stuck':
                    response = '遇到困难很正常，试试换个角度思考，或者休息一下';
                    break;
                case 'slow':
                    response = '慢一点也没关系，重要的是保持前进';
                    break;
            }
            VS.speak(response);
        }
        
        // 记录进度
        if (note && typeof App !== 'undefined') {
            App.addChatMessage('system', `📝 进度记录: ${note}`, '📝');
        }
        
        this.closeProgressDialog();
    }
};

// 导出
window.VoiceSettingsPanel = VoiceSettingsPanel;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => VoiceSettingsPanel.init(), 2000);
});

