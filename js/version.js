// 版本管理
const AppVersion = {
    // 当前版本号 - 每次更新时修改这里
    current: '3.1.9',
    
    // 更新日期
    updateDate: '2026-01-18',
    
    // 版本历史
    history: [
        {
            version: '3.1.9',
            date: '2026-01-18',
            changes: [
                '紧急修复：强制显示清空脑子按钮',
                '修复设置面板太大无法滚动的问题',
                '缩小设置项字体和间距，适配手机屏幕',
                '确保版本号正确显示'
            ]
        },
        {
            version: '3.1.8',
            date: '2026-01-18',
            changes: [
                '修复清空脑子按钮不显示的问题',
                '优化滚动性能，解决卡顿',
                '添加版本号显示功能'
            ]
        },
        {
            version: '3.1.7',
            date: '2026-01-17',
            changes: [
                '优化任务拆分逻辑',
                '添加时间段选择功能',
                '修复日历布局问题'
            ]
        },
        {
            version: '3.1.6',
            date: '2026-01-16',
            changes: [
                '添加AI智能安排功能',
                '优化动线规划',
                '改进习惯学习系统'
            ]
        }
    ],
    
    // 获取当前版本
    getCurrent() {
        return this.current;
    },
    
    // 获取完整版本信息
    getInfo() {
        return {
            version: this.current,
            updateDate: this.updateDate,
            buildTime: this.updateDate
        };
    },
    
    // 获取最新更新内容
    getLatestChanges() {
        return this.history[0];
    },
    
    // 检查是否有新版本（用于未来的自动更新）
    checkUpdate() {
        // 这里可以添加检查远程版本的逻辑
        return {
            hasUpdate: false,
            latestVersion: this.current
        };
    }
};

// 导出到全局
window.AppVersion = AppVersion;

