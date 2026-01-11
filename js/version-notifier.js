// 版本更新通知系统
const VersionNotifier = {
    currentVersion: '3.1.1',
    lastVersion: null,
    
    // 初始化
    init() {
        this.lastVersion = localStorage.getItem('adhd-last-version');
        
        // 如果版本不同，显示更新通知
        if (this.lastVersion !== this.currentVersion) {
            setTimeout(() => {
                this.showUpdateNotification();
            }, 1000);
            
            // 保存当前版本
            localStorage.setItem('adhd-last-version', this.currentVersion);
        }
    },
    
    // 显示更新通知
    showUpdateNotification() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay update-notification-modal';
        modal.id = 'updateNotificationModal';
        
        const updates = this.getUpdateContent();
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 16px 16px 0 0;">
                    <span class="modal-icon" style="font-size: 48px;">🎉</span>
                    <h2 style="color: white; margin: 12px 0 8px 0;">欢迎使用 v${this.currentVersion}</h2>
                    <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">本次更新带来了全新的功能体验</p>
                </div>
                <div class="modal-body" style="padding: 24px; max-height: 60vh; overflow-y: auto;">
                    ${updates}
                </div>
                <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid #eee;">
                    <button class="modal-btn btn-confirm" onclick="VersionNotifier.closeUpdateNotification()" style="width: 100%; padding: 12px; font-size: 16px;">
                        开始体验 🚀
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    },
    
    // 获取更新内容
    getUpdateContent() {
        const version = this.currentVersion;
        
        // 根据版本返回不同的更新内容
        if (version === '3.1.1') {
            return `
                <div class="update-section">
                    <h3 style="color: #667eea; margin-bottom: 16px; font-size: 18px;">✨ 新增功能</h3>
                    
                    <div class="update-item">
                        <div class="update-item-icon">🔊</div>
                        <div class="update-item-content">
                            <h4>循环语音警报系统</h4>
                            <p>拖延监控和低效率监控现在支持循环播放自定义语音提示，帮助您及时回归任务</p>
                            <ul>
                                <li>支持自定义提示语内容</li>
                                <li>可配置循环播放间隔</li>
                                <li>使用浏览器原生语音合成</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="update-item">
                        <div class="update-item-icon">💰</div>
                        <div class="update-item-content">
                            <h4>金币暂停功能</h4>
                            <p>支付10金币可暂停语音提醒30分钟，给您专注工作的时间</p>
                            <ul>
                                <li>暂停时长：30分钟</li>
                                <li>超时后自动恢复提醒</li>
                                <li>清晰显示暂停结束时间</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="update-item">
                        <div class="update-item-icon">📱</div>
                        <div class="update-item-content">
                            <h4>移动端自定义导航</h4>
                            <p>现在可以自由选择底部导航栏显示的功能，打造专属您的工作台</p>
                            <ul>
                                <li>从12个功能中选择最多5个</li>
                                <li>配置自动保存</li>
                                <li>支持一键恢复默认</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="update-item">
                        <div class="update-item-icon">🤖</div>
                        <div class="update-item-content">
                            <h4>Kiki 智能问候优化</h4>
                            <p>减少不必要的重复问候，只在真正需要时提醒您</p>
                            <ul>
                                <li>仅在新的一天且有任务时问候</li>
                                <li>周一自动发送每周规划提醒</li>
                                <li>显著降低干扰频率</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="update-section" style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #eee;">
                    <h3 style="color: #667eea; margin-bottom: 16px; font-size: 18px;">🎯 快速开始</h3>
                    <div class="quick-start-tips">
                        <div class="tip-item">
                            <span class="tip-number">1</span>
                            <span>移动端点击"更多" → "自定义布局"配置导航栏</span>
                        </div>
                        <div class="tip-item">
                            <span class="tip-number">2</span>
                            <span>在拖延/低效率监控设置中启用语音警报</span>
                        </div>
                        <div class="tip-item">
                            <span class="tip-number">3</span>
                            <span>首次使用需点击任意按钮激活语音权限</span>
                        </div>
                    </div>
                </div>
                
                <div class="update-footer" style="margin-top: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; color: #666; font-size: 14px;">
                        💡 查看详细文档：<a href="NEW_FEATURES_GUIDE.md" target="_blank" style="color: #667eea;">新功能使用指南</a>
                    </p>
                </div>
            `;
        }
        
        return '<p>欢迎使用新版本！</p>';
    },
    
    // 关闭更新通知
    closeUpdateNotification() {
        const modal = document.getElementById('updateNotificationModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    },
    
    // 手动显示更新日志
    showChangelog() {
        this.showUpdateNotification();
    }
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    VersionNotifier.init();
});

// 导出
window.VersionNotifier = VersionNotifier;

