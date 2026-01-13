// 增强版任务表单模块
const TaskFormEnhanced = {
    // 临时存储
    tempSubsteps: [],
    tempAttachments: [],
    tempAnalysis: null,
    
    // 显示增强版添加任务表单
    show() {
        // 移除已存在的表单
        var existingModal = document.getElementById("eventFormModal");
        if (existingModal) existingModal.remove();
        
        const now = new Date();
        const defaultTime = now.getHours().toString().padStart(2, "0") + ":" + (Math.ceil(now.getMinutes() / 30) * 30).toString().padStart(2, "0");
        
        // 初始化临时存储
        this.tempSubsteps = [];
        this.tempAttachments = [];
        this.tempAnalysis = null;
        
        const modal = document.createElement("div");
        modal.className = "event-form-modal";
        modal.id = "eventFormModal";
        modal.innerHTML = `
            <div class="event-form event-form-enhanced">
                <div class="event-form-header">
                    <div class="event-form-title">📝 添加新任务</div>
                    <button class="event-form-close" onclick="App.closeEventForm()">×</button>
                </div>
                <div class="event-form-body">
                    <!-- 任务名称 + AI拆解按钮 -->
                    <div class="event-form-group">
                        <label class="event-form-label">任务名称</label>
                        <div class="event-form-title-row">
                            <input type="text" class="event-form-input" id="eventTitleInput" placeholder="输入任务名称...">
                            <button class="ai-breakdown-btn" onclick="TaskFormEnhanced.aiBreakdown()" title="AI智能拆解任务">🤖 AI拆解</button>
                        </div>
                    </div>
                    <!-- 时间设置 -->
                    <div class="event-form-row">
                        <div class="event-form-group">
                            <label class="event-form-label">开始时间</label>
                            <input type="time" class="event-form-input" id="eventStartInput" value="${defaultTime}">
                        </div>
                        <div class="event-form-group">
                            <label class="event-form-label">结束时间</label>
                            <input type="time" class="event-form-input" id="eventEndInput">
                        </div>
                    </div>
                    <!-- 子步骤区域 -->
                    <div class="event-form-group">
                        <div class="event-form-label-row">
                            <label class="event-form-label">子步骤</label>
                            <button class="add-substep-btn" onclick="TaskFormEnhanced.addSubstep()">➕ 添加子步骤</button>
                        </div>
                        <div class="substeps-container" id="substepsContainer">
                            <div class="substeps-empty">暂无子步骤，点击上方按钮添加或使用AI拆解</div>
                        </div>
                    </div>
                    <!-- 备注 -->
                    <div class="event-form-group">
                        <label class="event-form-label">备注（可选）</label>
                        <textarea class="event-form-textarea" id="eventNotesInput" placeholder="输入备注信息..." rows="3"></textarea>
                    </div>
                    <!-- 附件 -->
                    <div class="event-form-group">
                        <label class="event-form-label">附件（可选）</label>
                        <div class="attachments-container" id="attachmentsContainer">
                            <div class="attachments-list" id="attachmentsList"></div>
                            <div class="attachment-actions">
                                <button class="attachment-btn" onclick="TaskFormEnhanced.addFile()" title="添加文件">📁 文件</button>
                                <button class="attachment-btn" onclick="TaskFormEnhanced.addImage()" title="添加图片">🖼️ 图片</button>
                                <button class="attachment-btn" onclick="TaskFormEnhanced.addLink()" title="添加链接">🔗 链接</button>
                            </div>
                            <input type="file" id="fileAttachmentInput" style="display:none" multiple accept="*/*" onchange="TaskFormEnhanced.handleFile(event)">
                            <input type="file" id="imageAttachmentInput" style="display:none" multiple accept="image/*,video/*" onchange="TaskFormEnhanced.handleImage(event)">
                        </div>
                    </div>
                    <!-- AI智能分析按钮 -->
                    <div class="event-form-group">
                        <button class="ai-analyze-btn" onclick="TaskFormEnhanced.aiAnalyze()">
                            ✨ AI智能分析（一键设置标签、验证方式、金币、精力）
                        </button>
                    </div>
                    <!-- AI分析结果预览 -->
                    <div class="ai-analysis-preview" id="aiAnalysisPreview" style="display:none;">
                        <div class="analysis-item"><span class="analysis-label">🏷️ 标签:</span><span id="previewTags">-</span></div>
                        <div class="analysis-item"><span class="analysis-label">✅ 验证方式:</span><span id="previewVerify">-</span></div>
                        <div class="analysis-item"><span class="analysis-label">🪙 金币:</span><span id="previewCoins">5</span></div>
                        <div class="analysis-item"><span class="analysis-label">⚡ 精力:</span><span id="previewEnergy">2</span></div>
                    </div>
                </div>
                <div class="event-form-actions">
                    <button class="event-form-btn cancel" onclick="App.closeEventForm()">取消</button>
                    <button class="event-form-btn submit" onclick="TaskFormEnhanced.submit()">添加任务</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(function() { modal.classList.add("show"); }, 10);
        document.getElementById("eventTitleInput").focus();
    },
    
    // 添加子步骤
    addSubstep() {
        const container = document.getElementById("substepsContainer");
        const emptyMsg = container.querySelector(".substeps-empty");
        if (emptyMsg) emptyMsg.remove();
        
        const stepId = "substep_" + Date.now();
        
        this.tempSubsteps.push({
            id: stepId,
            title: "",
            completed: false
        });
        
        const stepDiv = document.createElement("div");
        stepDiv.className = "substep-item";
        stepDiv.id = stepId;
        stepDiv.innerHTML = `
            <input type="checkbox" class="substep-checkbox" onchange="TaskFormEnhanced.toggleSubstep('${stepId}')">
            <input type="text" class="substep-input" placeholder="输入步骤内容..." onchange="TaskFormEnhanced.updateSubstep('${stepId}', this.value)">
            <button class="substep-delete" onclick="TaskFormEnhanced.deleteSubstep('${stepId}')" title="删除">×</button>
        `;
        
        container.appendChild(stepDiv);
        stepDiv.querySelector(".substep-input").focus();
    },
    
    // 更新子步骤
    updateSubstep(stepId, value) {
        const step = this.tempSubsteps.find(s => s.id === stepId);
        if (step) step.title = value;
    },
    
    // 切换子步骤完成状态
    toggleSubstep(stepId) {
        const step = this.tempSubsteps.find(s => s.id === stepId);
        if (step) step.completed = !step.completed;
    },
    
    // 删除子步骤
    deleteSubstep(stepId) {
        this.tempSubsteps = this.tempSubsteps.filter(s => s.id !== stepId);
        const stepEl = document.getElementById(stepId);
        if (stepEl) stepEl.remove();
        
        if (this.tempSubsteps.length === 0) {
            const container = document.getElementById("substepsContainer");
            container.innerHTML = '<div class="substeps-empty">暂无子步骤，点击上方按钮添加或使用AI拆解</div>';
        }
    },
    
    // AI拆解任务
    async aiBreakdown() {
        const titleInput = document.getElementById("eventTitleInput");
        const title = titleInput.value.trim();
        
        if (!title) {
            if (typeof Settings !== 'undefined') {
                Settings.showToast('warning', '请先输入任务名称', '');
            }
            titleInput.focus();
            return;
        }
        
        const btn = document.querySelector(".ai-breakdown-btn");
        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ 拆解中...";
        btn.disabled = true;
        
        try {
            const steps = await AIService.breakdownTask({ title: title });
            
            if (steps && steps.length > 0) {
                this.tempSubsteps = [];
                const container = document.getElementById("substepsContainer");
                container.innerHTML = "";
                
                for (let i = 0; i < steps.length; i++) {
                    const step = steps[i];
                    const stepId = "substep_" + Date.now() + "_" + i;
                    
                    this.tempSubsteps.push({
                        id: stepId,
                        title: step.title,
                        duration: step.duration || 10,
                        tip: step.tip || "",
                        completed: false
                    });
                    
                    const stepDiv = document.createElement("div");
                    stepDiv.className = "substep-item";
                    stepDiv.id = stepId;
                    stepDiv.innerHTML = `
                        <input type="checkbox" class="substep-checkbox" onchange="TaskFormEnhanced.toggleSubstep('${stepId}')">
                        <input type="text" class="substep-input" value="${step.title.replace(/"/g, '&quot;')}" onchange="TaskFormEnhanced.updateSubstep('${stepId}', this.value)">
                        ${step.duration ? '<span class="substep-duration">' + step.duration + '分钟</span>' : ''}
                        <button class="substep-delete" onclick="TaskFormEnhanced.deleteSubstep('${stepId}')" title="删除">×</button>
                    `;
                    
                    container.appendChild(stepDiv);
                }
                
                if (typeof Settings !== 'undefined') {
                    Settings.showToast('success', 'AI拆解完成', '已生成 ' + steps.length + ' 个子步骤');
                }
            }
        } catch (e) {
            console.error("AI拆解失败:", e);
            if (typeof Settings !== 'undefined') {
                Settings.showToast('error', 'AI拆解失败', '请检查网络连接');
            }
        }
        
        btn.innerHTML = originalText;
        btn.disabled = false;
    },
    
    // 添加文件
    addFile() {
        document.getElementById("fileAttachmentInput").click();
    },
    
    // 添加图片
    addImage() {
        document.getElementById("imageAttachmentInput").click();
    },
    
    // 添加链接
    addLink() {
        const url = prompt("请输入链接地址:", "https://");
        if (url && url !== "https://") {
            const name = prompt("请输入链接名称:", "链接");
            this.tempAttachments.push({
                type: "link",
                name: name || "链接",
                url: url
            });
            this.renderAttachments();
        }
    },
    
    // 处理文件
    handleFile(event) {
        const files = event.target.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // 读取文件为 base64
            const reader = new FileReader();
            reader.onload = (e) => {
                this.tempAttachments.push({
                    type: "file",
                    name: file.name,
                    size: file.size,
                    fileType: file.type,
                    data: e.target.result
                });
                this.renderAttachments();
            };
            reader.readAsDataURL(file);
        }
        event.target.value = "";
    },
    
    // 处理图片
    handleImage(event) {
        const files = event.target.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = (e) => {
                this.tempAttachments.push({
                    type: file.type.startsWith("video/") ? "video" : "image",
                    name: file.name,
                    size: file.size,
                    fileType: file.type,
                    data: e.target.result
                });
                this.renderAttachments();
            };
            reader.readAsDataURL(file);
        }
        event.target.value = "";
    },
    
    // 渲染附件列表
    renderAttachments() {
        const container = document.getElementById("attachmentsList");
        if (!container) return;
        
        if (this.tempAttachments.length === 0) {
            container.innerHTML = "";
            return;
        }
        
        let html = "";
        for (let i = 0; i < this.tempAttachments.length; i++) {
            const att = this.tempAttachments[i];
            const icon = att.type === "link" ? "🔗" : 
                        att.type === "image" ? "🖼️" : 
                        att.type === "video" ? "🎬" : "📄";
            const sizeStr = att.size ? " (" + this.formatSize(att.size) + ")" : "";
            
            html += `
                <div class="attachment-item">
                    <span class="attachment-icon">${icon}</span>
                    <span class="attachment-name">${att.name}${sizeStr}</span>
                    <button class="attachment-delete" onclick="TaskFormEnhanced.deleteAttachment(${i})">×</button>
                </div>
            `;
        }
        container.innerHTML = html;
    },
    
    // 格式化文件大小
    formatSize(bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    },
    
    // 删除附件
    deleteAttachment(index) {
        this.tempAttachments.splice(index, 1);
        this.renderAttachments();
    },
    
    // AI智能分析
    async aiAnalyze() {
        const titleInput = document.getElementById("eventTitleInput");
        const notesInput = document.getElementById("eventNotesInput");
        const title = titleInput.value.trim();
        const notes = notesInput ? notesInput.value.trim() : "";
        
        if (!title) {
            if (typeof Settings !== 'undefined') {
                Settings.showToast('warning', '请先输入任务名称', '');
            }
            titleInput.focus();
            return;
        }
        
        const btn = document.querySelector(".ai-analyze-btn");
        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ AI分析中...";
        btn.disabled = true;
        
        try {
            // 尝试调用AI分析
            let analysis = null;
            if (typeof AIService !== 'undefined' && AIService.analyzeTask) {
                analysis = await AIService.analyzeTask(title, notes, this.tempSubsteps);
            }
            
            if (!analysis) {
                // 使用本地智能推测
                analysis = {
                    tags: this.guessTaskTags(title),
                    verifyMethod: "完成打卡",
                    coins: this.estimateCoins(title),
                    energyCost: this.estimateEnergy(title)
                };
            }
            
            this.tempAnalysis = analysis;
            
            const preview = document.getElementById("aiAnalysisPreview");
            if (preview) {
                preview.style.display = "block";
                document.getElementById("previewTags").textContent = analysis.tags ? analysis.tags.join(", ") : "-";
                document.getElementById("previewVerify").textContent = analysis.verifyMethod || "完成打卡";
                document.getElementById("previewCoins").textContent = analysis.coins || 5;
                document.getElementById("previewEnergy").textContent = analysis.energyCost || 2;
            }
            
            if (typeof Settings !== 'undefined') {
                Settings.showToast('success', 'AI分析完成', '已智能设置任务属性');
            }
        } catch (e) {
            console.error("AI分析失败:", e);
            // 使用默认值
            this.tempAnalysis = {
                tags: this.guessTaskTags(title),
                verifyMethod: "完成打卡",
                coins: this.estimateCoins(title),
                energyCost: 2
            };
            
            const preview = document.getElementById("aiAnalysisPreview");
            if (preview) {
                preview.style.display = "block";
                document.getElementById("previewTags").textContent = this.tempAnalysis.tags.join(", ");
                document.getElementById("previewVerify").textContent = this.tempAnalysis.verifyMethod;
                document.getElementById("previewCoins").textContent = this.tempAnalysis.coins;
                document.getElementById("previewEnergy").textContent = this.tempAnalysis.energyCost;
            }
            
            if (typeof Settings !== 'undefined') {
                Settings.showToast('info', '使用智能推测', '已根据任务名称推测属性');
            }
        }
        
        btn.innerHTML = originalText;
        btn.disabled = false;
    },
    
    // 猜测任务标签
    guessTaskTags(title) {
        const tags = [];
        const t = title.toLowerCase();
        
        if (t.includes("工作") || t.includes("会议") || t.includes("报告") || t.includes("项目") || t.includes("客户")) {
            tags.push("💼 工作");
        }
        if (t.includes("学习") || t.includes("看书") || t.includes("课程") || t.includes("练习") || t.includes("复习")) {
            tags.push("📚 学习");
        }
        if (t.includes("运动") || t.includes("健身") || t.includes("跑步") || t.includes("锻炼") || t.includes("瑜伽")) {
            tags.push("💪 健康");
        }
        if (t.includes("打扫") || t.includes("整理") || t.includes("洗") || t.includes("做饭") || t.includes("收拾")) {
            tags.push("🏠 家务");
        }
        if (t.includes("休息") || t.includes("放松") || t.includes("娱乐") || t.includes("游戏") || t.includes("电影")) {
            tags.push("🎮 休闲");
        }
        if (t.includes("购物") || t.includes("买") || t.includes("超市")) {
            tags.push("🛒 购物");
        }
        
        if (tags.length === 0) tags.push("📌 其他");
        return tags;
    },
    
    // 估算金币
    estimateCoins(title) {
        const t = title.toLowerCase();
        if (t.includes("重要") || t.includes("紧急") || t.includes("项目") || t.includes("deadline")) return 10;
        if (t.includes("会议") || t.includes("报告") || t.includes("演讲")) return 8;
        if (t.includes("学习") || t.includes("运动") || t.includes("健身")) return 6;
        if (t.includes("休息") || t.includes("放松")) return 3;
        return 5;
    },
    
    // 估算精力消耗
    estimateEnergy(title) {
        const t = title.toLowerCase();
        if (t.includes("运动") || t.includes("健身") || t.includes("跑步")) return 4;
        if (t.includes("会议") || t.includes("演讲") || t.includes("项目")) return 3;
        if (t.includes("学习") || t.includes("工作")) return 2;
        if (t.includes("休息") || t.includes("放松")) return -2; // 恢复精力
        return 2;
    },
    
    // 提交表单
    submit() {
        const title = document.getElementById("eventTitleInput").value.trim();
        const startTime = document.getElementById("eventStartInput").value;
        const endTime = document.getElementById("eventEndInput").value;
        const notes = document.getElementById("eventNotesInput").value.trim();
        
        if (!title) {
            alert("请输入任务名称");
            return;
        }
        
        if (!startTime) {
            alert("请选择开始时间");
            return;
        }
        
        // 过滤有效的子步骤
        const validSubsteps = this.tempSubsteps.filter(s => s.title && s.title.trim());
        
        // 构建任务对象
        const task = {
            title: title,
            date: App.formatDate(App.currentDate),
            startTime: startTime,
            endTime: endTime || App.addMinutes(startTime, 30),
            notes: notes || null,
            substeps: validSubsteps.length > 0 ? validSubsteps.map(s => ({
                title: s.title,
                duration: s.duration || 10,
                tip: s.tip || '',
                completed: s.completed || false
            })) : null,
            attachments: this.tempAttachments.length > 0 ? this.tempAttachments : null,
            // 使用AI分析结果或默认值
            tags: this.tempAnalysis ? this.tempAnalysis.tags : [],
            verifyMethod: this.tempAnalysis ? this.tempAnalysis.verifyMethod : null,
            coins: this.tempAnalysis ? this.tempAnalysis.coins : 5,
            energyCost: this.tempAnalysis ? this.tempAnalysis.energyCost : 2
        };
        
        App.addTaskToTimeline(task);
        App.closeEventForm();
        App.addChatMessage("system", "✅ 已添加任务「" + title + "」 " + startTime + (validSubsteps.length > 0 ? "\n包含 " + validSubsteps.length + " 个子步骤" : ""), "📝");
    }
};

// 导出
window.TaskFormEnhanced = TaskFormEnhanced;

