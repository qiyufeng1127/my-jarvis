// 画布拖拽系统
const Canvas = {
    components: {},
    activeComponent: null,
    isDragging: false,
    isResizing: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
    startWidth: 0,
    startHeight: 0,

    init() {
        this.loadPositions();
        this.bindEvents();
        this.initColorPickers();
    },

    loadPositions() {
        const positions = Storage.getComponentPositions();
        const self = this;
        document.querySelectorAll('.draggable-component').forEach(function(comp) {
            const id = comp.id;
            if (positions[id]) {
                comp.style.left = positions[id].left + 'px';
                comp.style.top = positions[id].top + 'px';
                comp.style.width = positions[id].width + 'px';
                comp.style.height = positions[id].height + 'px';
                if (positions[id].bgColor && positions[id].bgColor !== '#ffffff') {
                    // 延迟应用背景色，等待组件内容加载完成
                    setTimeout(function() {
                        self.setComponentBackground(comp, positions[id].bgColor);
                    }, 150);
                }
            }
            self.components[id] = comp;
        });
    },

    bindEvents() {
        const self = this;
        document.querySelectorAll('.draggable-component').forEach(function(comp) {
            const header = comp.querySelector('.component-header');
            const resizeHandle = comp.querySelector('.resize-handle');

            // 拖拽开始
            header.addEventListener('mousedown', function(e) {
                if (e.target.classList.contains('component-btn') || e.target.classList.contains('color-picker')) return;
                self.startDrag(e, comp);
            });

            // 调整大小
            resizeHandle.addEventListener('mousedown', function(e) {
                self.startResize(e, comp);
            });

            // 最小化按钮
            const minBtn = comp.querySelector('.btn-minimize');
            if (minBtn) {
                minBtn.addEventListener('click', function() {
                    self.toggleMinimize(comp);
            });
            }

            // 最大化按钮
            const maxBtn = comp.querySelector('.btn-maximize');
            if (maxBtn) {
                maxBtn.addEventListener('click', function() {
                    self.toggleMaximize(comp);
            });
            }
        });

        // 全局鼠标事件
        document.addEventListener('mousemove', function(e) {
            self.onMouseMove(e);
        });
        document.addEventListener('mouseup', function() {
            self.onMouseUp();
        });
    },

    initColorPickers() {
        const self = this;
        document.querySelectorAll('.draggable-component').forEach(function(comp) {
            const picker = comp.querySelector('.color-picker');
            const pickerBtn = comp.querySelector('.color-picker-btn');
            
            // 调色盘按钮点击触发颜色选择器
            if (pickerBtn && picker) {
                pickerBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    picker.click();
                });
            }
            
            if (picker) {
                picker.addEventListener('input', function(e) {
                    self.setComponentBackground(comp, e.target.value);
                    self.savePosition(comp);
                });
                picker.addEventListener('change', function(e) {
                    self.setComponentBackground(comp, e.target.value);
                    self.savePosition(comp);
            });
            }
        });
    },

    setComponentBackground(comp, color) {
        const body = comp.querySelector('.component-body');
        const header = comp.querySelector('.component-header');
        if (!body) return;
        
        // 计算亮度
        const brightness = this.getColorBrightness(color);
        const isDark = brightness < 128;
        const textColor = isDark ? '#FFFFFF' : '#333333';
        const textColorMuted = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
        const textColorLight = isDark ? 'rgba(255,255,255,0.5)' : '#999999';
        const borderColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)';
        const inputBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)';
        const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)';
        const buttonBg = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)';
        
        // 设置整个组件的背景色（包括header）
        comp.style.setProperty('background', color, 'important');
        
        // 设置header背景为透明，与组件统一
        if (header) {
            header.style.setProperty('background', 'transparent', 'important');
            header.style.setProperty('border-color', borderColor, 'important');
            
            // 设置header内的标题颜色
            const title = header.querySelector('.component-title');
            if (title) {
                title.style.setProperty('color', textColor, 'important');
            }
        }
        
        // 设置组件body的背景为透明
        body.style.setProperty('background', 'transparent', 'important');
        body.style.setProperty('color', textColor, 'important');
        
        // 保存颜色信息到组件的data属性
        comp.dataset.bgColor = color;
        comp.dataset.isDark = isDark ? 'true' : 'false';
        
        // 更新颜色选择器的值
        const picker = comp.querySelector('.color-picker');
        if (picker) picker.value = color;
        
        // 获取所有需要更新样式的子元素
        const allElements = body.querySelectorAll('*');
        
        allElements.forEach(function(el) {
            const tagName = el.tagName.toLowerCase();
            const classList = el.className || '';
            
            // 时间轴容器
            if (classList.includes('timeline-container')) {
                el.style.setProperty('background', 'transparent', 'important');
            }
            
            // 日历区域
            if (classList.includes('calendar-section')) {
                el.style.setProperty('background', isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)', 'important');
                el.style.setProperty('border-color', borderColor, 'important');
            }
            
            // 日历月份标题
            if (classList.includes('calendar-month')) {
                el.style.setProperty('color', textColor, 'important');
            }
            
            // 日历导航按钮
            if (classList.includes('calendar-nav-btn')) {
                el.style.setProperty('background', buttonBg, 'important');
                el.style.setProperty('color', textColorMuted, 'important');
            }
            
            // 星期标签
            if (classList.includes('weekday-label')) {
                el.style.setProperty('color', textColorMuted, 'important');
            }
            
            // 日历日期
            if (classList.includes('calendar-day')) {
                if (!classList.includes('today') && !classList.includes('selected')) {
                    el.style.setProperty('color', classList.includes('other-month') ? textColorLight : textColor, 'important');
                    el.style.setProperty('background', 'transparent', 'important');
                }
            }
            
            // 添加事件按钮
            if (classList.includes('add-event-btn')) {
                el.style.setProperty('background', isDark ? '#FFFFFF' : '#333333', 'important');
                el.style.setProperty('color', isDark ? '#333333' : '#FFFFFF', 'important');
            }
            
            // 时间轴区域
            if (classList.includes('timeline-section')) {
                el.style.setProperty('background', 'transparent', 'important');
            }
            
            // 时间标签
            if (classList.includes('time-label')) {
                el.style.setProperty('color', textColorLight, 'important');
            }
            
            // 时间槽
            if (classList.includes('time-slot')) {
                el.style.setProperty('border-color', borderColor, 'important');
            }
            
            // 事件卡片 - 不覆盖已有的自定义颜色
            if (classList.includes('event-card')) {
                // 检查是否有自定义颜色（通过data-task-id判断是时间轴卡片）
                if (!el.getAttribute('data-task-id')) {
                    el.style.setProperty('background', cardBg, 'important');
                    el.style.setProperty('box-shadow', '0px 2px 6px ' + (isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)'), 'important');
                }
                // 有data-task-id的卡片保留其自定义颜色，不做修改
            }
            
            // 检查元素是否在有自定义颜色的事件卡片内
            var isInsideCustomCard = el.closest('.event-card[data-task-id]') !== null;
            
            // 事件标题 - 跳过自定义卡片内的元素
            if (classList.includes('event-title') && !isInsideCustomCard) {
                el.style.setProperty('color', textColor, 'important');
            }
            
            // 事件时间 - 跳过自定义卡片内的元素
            if (classList.includes('event-time') && !isInsideCustomCard) {
                el.style.setProperty('color', textColorMuted, 'important');
            }
            
            // 事件地点 - 跳过自定义卡片内的元素
            if (classList.includes('event-location') && !isInsideCustomCard) {
                el.style.setProperty('color', textColorLight, 'important');
            }
            
            // 事件标签 - 跳过自定义卡片内的元素
            if (classList.includes('event-tag') && !isInsideCustomCard) {
                el.style.setProperty('background', buttonBg, 'important');
                el.style.setProperty('color', textColorMuted, 'important');
            }
            
            // 事件详情 - 跳过自定义卡片内的元素
            if (classList.includes('event-details') && !isInsideCustomCard) {
                el.style.setProperty('border-color', borderColor, 'important');
            }
            
            // 事件详情标签 - 跳过自定义卡片内的元素
            if (classList.includes('event-detail-label') && !isInsideCustomCard) {
                el.style.setProperty('color', textColorLight, 'important');
            }
            
            // 事件详情值 - 跳过自定义卡片内的元素
            if (classList.includes('event-detail-value') && !isInsideCustomCard) {
                el.style.setProperty('color', textColor, 'important');
            }
            
            // 展开按钮 - 跳过自定义卡片内的元素
            if (classList.includes('event-expand-btn') && !isInsideCustomCard) {
                el.style.setProperty('color', textColorLight, 'important');
            }
            
            // 颜色按钮 - 跳过自定义卡片内的元素
            if (classList.includes('event-color-btn') && !isInsideCustomCard) {
                el.style.setProperty('color', textColorLight, 'important');
            }
            
            // 金币徽章 - 跳过自定义卡片内的元素
            if (classList.includes('event-coin-badge') && !isInsideCustomCard) {
                el.style.setProperty('color', textColor, 'important');
            }
            
            // 间隙添加链接
            if (classList.includes('gap-add-link')) {
                el.style.setProperty('color', isDark ? '#87CEEB' : '#4A90E2', 'important');
            }
            
            // 当前时间标签
            if (classList.includes('current-time-label')) {
                el.style.setProperty('background', color, 'important');
            }
            
            // 容器类元素 - 设置透明背景
            if (classList.includes('-container') && !classList.includes('timeline-container') || 
                classList.includes('-header') && !classList.includes('component-header') && !classList.includes('calendar-header') ||
                classList.includes('-scroll') ||
                classList.includes('-track') ||
                classList.includes('-grid') && !classList.includes('calendar-grid') ||
                classList.includes('-tags') ||
                classList.includes('-stats') ||
                classList.includes('-chart') ||
                classList.includes('-summary') ||
                classList.includes('-progress') ||
                classList.includes('-achievements')) {
                el.style.setProperty('background', 'transparent', 'important');
                el.style.setProperty('color', textColor, 'important');
            }
            
            // 卡片类元素
            if (classList.includes('-card') && !classList.includes('event-card') || 
                classList.includes('-section') && !classList.includes('calendar-section') && !classList.includes('timeline-section') ||
                classList.includes('-item') ||
                classList.includes('stat-card') ||
                classList.includes('summary-item')) {
                el.style.setProperty('background', cardBg, 'important');
                el.style.setProperty('color', textColor, 'important');
                el.style.setProperty('box-shadow', '0 2px 6px ' + (isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)'), 'important');
            }
            
            // 输入框和文本域
            if (tagName === 'input' || tagName === 'textarea') {
                if (!classList.includes('color-picker')) {
                    el.style.setProperty('background', inputBg, 'important');
                    el.style.setProperty('color', textColor, 'important');
                    el.style.setProperty('border-color', borderColor, 'important');
                }
            }
            
            // 按钮
            if (tagName === 'button' && !classList.includes('ai-parse-btn') && !classList.includes('task-complete-btn') && 
                !classList.includes('event-action-btn') && !classList.includes('add-event-btn') && !classList.includes('calendar-day') &&
                !classList.includes('color-picker-btn')) {
                el.style.setProperty('background', buttonBg, 'important');
                el.style.setProperty('color', textColor, 'important');
                el.style.setProperty('border-color', borderColor, 'important');
            }
            
            // 标签类
            if ((classList.includes('-tag') || classList.includes('preset-tag')) && !classList.includes('event-tag')) {
                el.style.setProperty('background', buttonBg, 'important');
                el.style.setProperty('color', textColor, 'important');
            }
            
            // 标题和标签文字
            if (classList.includes('-title') && !classList.includes('event-title') || 
                classList.includes('-label') && !classList.includes('event-detail-label') && !classList.includes('time-label') && !classList.includes('weekday-label') ||
                classList.includes('-value') && !classList.includes('event-detail-value') ||
                classList.includes('-text') ||
                classList.includes('-content') ||
                classList.includes('-date')) {
                el.style.setProperty('color', textColor, 'important');
            }
            
            // 次要文字
            if (classList.includes('-hint') || classList.includes('-desc')) {
                el.style.setProperty('color', textColorMuted, 'important');
            }
            
            // 消息气泡特殊处理
            if (classList.includes('message-bubble')) {
                if (el.closest('.message.system')) {
                    el.style.setProperty('background', isDark ? 'rgba(255,182,193,0.3)' : 'rgba(255,182,193,0.3)', 'important');
                } else if (el.closest('.message.user')) {
                    el.style.setProperty('background', isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)', 'important');
                }
                el.style.setProperty('color', textColor, 'important');
            }
            
            // 聊天输入区域
            if (classList.includes('chat-input-area')) {
                el.style.setProperty('background', 'transparent', 'important');
                el.style.setProperty('border-color', borderColor, 'important');
            }
            
            if (classList.includes('input-wrapper')) {
                el.style.setProperty('background', buttonBg, 'important');
            }
            
            // 进度条容器
            if (classList.includes('progress-bar-container') || classList.includes('energy-bar')) {
                el.style.setProperty('background', isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)', 'important');
            }
            
            // 情绪标签特殊处理 - 保持原有颜色但调整
            if (classList.includes('emotion-tag')) {
                if (!classList.includes('happy') && !classList.includes('calm') && 
                    !classList.includes('anxious') && !classList.includes('sad') && !classList.includes('angry')) {
                    el.style.setProperty('background', buttonBg, 'important');
                    el.style.setProperty('color', textColor, 'important');
                }
            }
            
            // 记忆卡片保持边框颜色
            if (classList.includes('memory-card')) {
                el.style.setProperty('background', cardBg, 'important');
                el.style.setProperty('color', textColor, 'important');
            }
            
            // 成就徽章
            if (classList.includes('achievement-badge')) {
                el.style.setProperty('background', cardBg, 'important');
            }
            
            // h3标题
            if (tagName === 'h3') {
                el.style.setProperty('color', textColor, 'important');
            }
            
            // span和div的默认颜色
            if ((tagName === 'span' || tagName === 'div' || tagName === 'p') && !el.style.color) {
                el.style.setProperty('color', textColor, 'important');
            }
        });
        
        // 特殊处理：API Key按钮
        const apiKeyBtn = body.querySelector('.api-key-btn');
        if (apiKeyBtn) {
            apiKeyBtn.style.setProperty('opacity', isDark ? '0.8' : '0.6', 'important');
        }
        
        // 特殊处理：间隙添加按钮
        const gapBtns = body.querySelectorAll('.gap-add-btn');
        gapBtns.forEach(function(btn) {
            btn.style.setProperty('background', cardBg, 'important');
            btn.style.setProperty('border-color', borderColor, 'important');
            btn.style.setProperty('color', textColorMuted, 'important');
        });
    },

    getColorBrightness(color) {
        // 支持多种颜色格式
        let r, g, b;
        
        if (color.startsWith('#')) {
        const hex = color.replace('#', '');
            if (hex.length === 3) {
                r = parseInt(hex[0] + hex[0], 16);
                g = parseInt(hex[1] + hex[1], 16);
                b = parseInt(hex[2] + hex[2], 16);
            } else {
                r = parseInt(hex.substr(0, 2), 16);
                g = parseInt(hex.substr(2, 2), 16);
                b = parseInt(hex.substr(4, 2), 16);
            }
        } else if (color.startsWith('rgb')) {
            const match = color.match(/\d+/g);
            if (match) {
                r = parseInt(match[0]);
                g = parseInt(match[1]);
                b = parseInt(match[2]);
            }
        } else {
            return 255; // 默认返回亮色
        }
        
        // 使用感知亮度公式
        return (r * 299 + g * 587 + b * 114) / 1000;
    },

    startDrag(e, comp) {
        this.isDragging = true;
        this.activeComponent = comp;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.startLeft = comp.offsetLeft;
        this.startTop = comp.offsetTop;
        comp.classList.add('dragging');
        comp.style.zIndex = 100;
    },

    startResize(e, comp) {
        e.preventDefault();
        e.stopPropagation();
        this.isResizing = true;
        this.activeComponent = comp;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.startWidth = comp.offsetWidth;
        this.startHeight = comp.offsetHeight;
        comp.classList.add('dragging');
    },

    onMouseMove(e) {
        if (this.isDragging && this.activeComponent) {
            const dx = e.clientX - this.startX;
            const dy = e.clientY - this.startY;
            this.activeComponent.style.left = Math.max(0, this.startLeft + dx) + 'px';
            this.activeComponent.style.top = Math.max(0, this.startTop + dy) + 'px';
        }

        if (this.isResizing && this.activeComponent) {
            const dx = e.clientX - this.startX;
            const dy = e.clientY - this.startY;
            const newWidth = Math.max(280, this.startWidth + dx);
            const newHeight = Math.max(200, this.startHeight + dy);
            this.activeComponent.style.width = newWidth + 'px';
            this.activeComponent.style.height = newHeight + 'px';
        }
    },

    onMouseUp() {
        if (this.activeComponent) {
            this.activeComponent.classList.remove('dragging');
            this.activeComponent.style.zIndex = '';
            this.savePosition(this.activeComponent);
        }
        this.isDragging = false;
        this.isResizing = false;
        this.activeComponent = null;
    },

    savePosition(comp) {
        const picker = comp.querySelector('.color-picker');
        const position = {
            left: comp.offsetLeft,
            top: comp.offsetTop,
            width: comp.offsetWidth,
            height: comp.offsetHeight,
            bgColor: picker ? picker.value : '#ffffff'
        };
        Storage.saveComponentPosition(comp.id, position);
    },

    toggleMinimize(comp) {
        const body = comp.querySelector('.component-body');
        const isMinimized = body.style.display === 'none';
        body.style.display = isMinimized ? 'flex' : 'none';
        comp.querySelector('.resize-handle').style.display = isMinimized ? 'block' : 'none';
        if (!isMinimized) {
            comp.dataset.prevHeight = comp.style.height;
            comp.style.height = 'auto';
        } else {
            comp.style.height = comp.dataset.prevHeight || '300px';
        }
    },

    toggleMaximize(comp) {
        if (comp.dataset.maximized === 'true') {
            // 恢复原始大小
            comp.style.left = comp.dataset.origLeft;
            comp.style.top = comp.dataset.origTop;
            comp.style.width = comp.dataset.origWidth;
            comp.style.height = comp.dataset.origHeight;
            comp.dataset.maximized = 'false';
        } else {
            // 保存原始大小并最大化
            comp.dataset.origLeft = comp.style.left;
            comp.dataset.origTop = comp.style.top;
            comp.dataset.origWidth = comp.style.width;
            comp.dataset.origHeight = comp.style.height;
            comp.style.left = '20px';
            comp.style.top = '60px';
            comp.style.width = 'calc(100vw - 40px)';
            comp.style.height = 'calc(100vh - 80px)';
            comp.dataset.maximized = 'true';
        }
    },
    
    // 重新应用背景色（在组件内容更新后调用）
    reapplyBackground(compId) {
        const comp = document.getElementById(compId);
        if (comp && comp.dataset.bgColor) {
            this.setComponentBackground(comp, comp.dataset.bgColor);
        }
    },
    
    // 重新应用背景色，但不影响事件卡片的颜色
    reapplyBackgroundExceptCards(compId) {
        const comp = document.getElementById(compId);
        if (comp && comp.dataset.bgColor) {
            // 先保存所有事件卡片的当前样式
            const eventCards = comp.querySelectorAll('.event-card[data-task-id]');
            const savedStyles = [];
            eventCards.forEach(function(card) {
                savedStyles.push({
                    element: card,
                    style: card.getAttribute('style')
                });
            });
            
            // 应用背景色
            this.setComponentBackground(comp, comp.dataset.bgColor);
            
            // 恢复事件卡片的样式
            savedStyles.forEach(function(item) {
                if (item.style) {
                    item.element.setAttribute('style', item.style);
                }
            });
        }
    },
    
    // 重新应用所有组件的背景色
    reapplyAllBackgrounds() {
        const self = this;
        document.querySelectorAll('.draggable-component').forEach(function(comp) {
            if (comp.dataset.bgColor && comp.dataset.bgColor !== '#ffffff') {
                self.setComponentBackground(comp, comp.dataset.bgColor);
            }
        });
    }
};

// 导出
window.Canvas = Canvas;
