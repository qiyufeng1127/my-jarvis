// UI优化辅助函数
const UIEnhancements = {
    init() {
        this.initCalendarToggle();
        this.initSmartInputColors();
    },
    
    // 初始化日历展开/收缩功能
    initCalendarToggle() {
        // 等待DOM加载完成
        setTimeout(() => {
            const calendarSections = document.querySelectorAll('.calendar-section');
            calendarSections.forEach(section => {
                const header = section.querySelector('.calendar-header');
                if (header) {
                    // 默认收缩状态
                    section.classList.add('collapsed');
                    
                    // 点击切换
                    header.addEventListener('click', (e) => {
                        // 避免点击导航按钮时触发
                        if (e.target.classList.contains('calendar-nav-btn')) return;
                        
                        section.classList.toggle('collapsed');
                        section.classList.toggle('expanded');
                    });
                }
            });
        }, 500);
    },
    
    // 初始化智能对话颜色
    initSmartInputColors() {
        // 监听组件背景色变化
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const comp = mutation.target;
                    if (comp.id === 'smartInput' && comp.dataset.bgColor) {
                        this.updateSmartInputColors(comp);
                    }
                }
            });
        });
        
        // 观察智能对话组件
        setTimeout(() => {
            const smartInput = document.getElementById('smartInput');
            if (smartInput) {
                observer.observe(smartInput, { attributes: true });
                // 初始化时也更新一次
                if (smartInput.dataset.bgColor) {
                    this.updateSmartInputColors(smartInput);
                }
            }
        }, 1000);
    },
    
    // 更新智能对话颜色
    updateSmartInputColors(comp) {
        const bgColor = comp.dataset.bgColor;
        if (!bgColor || !window.Canvas) return;
        
        const contrastColor = window.Canvas.getContrastColor(bgColor);
        const complementColor = window.Canvas.getComplementaryColor(contrastColor);
        const inputComplementColor = window.Canvas.getComplementaryColor(complementColor);
        
        // 设置CSS变量
        comp.style.setProperty('--ai-bubble-color', contrastColor);
        comp.style.setProperty('--user-bubble-color', complementColor);
        comp.style.setProperty('--input-bg-color', inputComplementColor);
    }
};

// 在页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        UIEnhancements.init();
    });
} else {
    UIEnhancements.init();
}

// 导出
window.UIEnhancements = UIEnhancements;

