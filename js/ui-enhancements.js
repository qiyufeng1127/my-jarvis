// UI优化辅助函数
const UIEnhancements = {
    init() {
        this.initCalendarToggle();
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
