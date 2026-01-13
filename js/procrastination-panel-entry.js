// 增强版拖延监控面板入口
// 在监控面板中添加ADHD增强版功能入口

(function() {
    // 等待App加载完成
    var checkApp = setInterval(function() {
        if (typeof App !== 'undefined' && App.renderProcrastinationContent) {
            clearInterval(checkApp);
            
            // 保存原有的渲染函数
            var originalRender = App.renderProcrastinationContent.bind(App);
            
            // 覆盖渲染函数，添加增强版入口
            App.renderProcrastinationContent = function() {
                var content = originalRender();
                
                // 增强版功能入口HTML
                var enhancedEntry = 
                    '<div class="enhanced-monitor-entry" style="' +
                        'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);' +
                        'border-radius: 16px;' +
                        'padding: 20px;' +
                        'margin-bottom: 20px;' +
                        'color: white;' +
                        'box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);' +
                    '">' +
                        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:15px;">' +
                            '<span style="font-size:32px;">🧠</span>' +
                            '<div>' +
                                '<div style="font-size:18px;font-weight:700;">ADHD增强版监控</div>' +
                                '<div style="font-size:13px;opacity:0.9;">专业提示词 · AI启动步骤 · 梯度问责</div>' +
                            '</div>' +
                        '</div>' +
                        '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
                            '<button onclick="ProcrastinationEnhanced.showSettingsPanel()" style="' +
                                'padding: 10px 20px;' +
                                'background: rgba(255,255,255,0.2);' +
                                'border: 2px solid rgba(255,255,255,0.3);' +
                                'border-radius: 10px;' +
                                'color: white;' +
                                'font-size: 14px;' +
                                'font-weight: 600;' +
                                'cursor: pointer;' +
                            '">' +
                                '⚙️ 设置提示词' +
                            '</button>' +
                            '<button onclick="ProcrastinationEnhanced.testCountdown(10)" style="' +
                                'padding: 10px 20px;' +
                                'background: rgba(255,255,255,0.2);' +
                                'border: 2px solid rgba(255,255,255,0.3);' +
                                'border-radius: 10px;' +
                                'color: white;' +
                                'font-size: 14px;' +
                                'font-weight: 600;' +
                                'cursor: pointer;' +
                            '">' +
                                '🧪 测试倒计时' +
                            '</button>' +
                            '<button onclick="ProcrastinationEnhanced.testAlert()" style="' +
                                'padding: 10px 20px;' +
                                'background: rgba(255,255,255,0.2);' +
                                'border: 2px solid rgba(255,255,255,0.3);' +
                                'border-radius: 10px;' +
                                'color: white;' +
                                'font-size: 14px;' +
                                'font-weight: 600;' +
                                'cursor: pointer;' +
                            '">' +
                                '🚨 测试警报' +
                            '</button>' +
                        '</div>' +
                        '<div style="margin-top:15px;padding-top:15px;border-top:1px solid rgba(255,255,255,0.2);">' +
                            '<div style="font-size:12px;opacity:0.8;margin-bottom:8px;">✨ 功能特点：</div>' +
                            '<div style="display:flex;flex-wrap:wrap;gap:8px;">' +
                                '<span style="padding:4px 10px;background:rgba(255,255,255,0.15);border-radius:12px;font-size:12px;">🔊 语音倒计时</span>' +
                                '<span style="padding:4px 10px;background:rgba(255,255,255,0.15);border-radius:12px;font-size:12px;">🚨 全屏警报</span>' +
                                '<span style="padding:4px 10px;background:rgba(255,255,255,0.15);border-radius:12px;font-size:12px;">🤖 AI启动步骤</span>' +
                                '<span style="padding:4px 10px;background:rgba(255,255,255,0.15);border-radius:12px;font-size:12px;">📈 梯度问责</span>' +
                                '<span style="padding:4px 10px;background:rgba(255,255,255,0.15);border-radius:12px;font-size:12px;">📝 自定义提示词</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
                
                // 在procrastination-container开始后插入
                content = content.replace(
                    '<div class="procrastination-container">',
                    '<div class="procrastination-container">' + enhancedEntry
                );
                
                return content;
            };
            
            // 刷新面板
            if (App.loadMonitorPanel) {
                setTimeout(function() {
                    App.loadMonitorPanel();
                }, 100);
            }
            
            console.log('增强版拖延监控面板入口已添加');
        }
    }, 500);
})();

