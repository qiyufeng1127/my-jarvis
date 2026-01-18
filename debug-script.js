// 清空脑子 - 调试和修复脚本
// 在浏览器控制台运行此脚本来诊断和修复问题

console.log('🔍 开始诊断清空脑子组件...');

// 1. 检查 BrainDump 对象
if (typeof BrainDump === 'undefined') {
    console.error('❌ BrainDump 对象未定义！');
} else {
    console.log('✅ BrainDump 对象已加载');
    console.log('📝 任务数量:', BrainDump.items.length);
    console.log('📋 任务列表:', BrainDump.items);
    console.log('👁️ 是否在安排视图:', BrainDump.showArrangedView);
}

// 2. 检查 DOM 元素
const container = document.getElementById('brainDumpBody');
if (!container) {
    console.error('❌ brainDumpBody 容器不存在！');
} else {
    console.log('✅ brainDumpBody 容器存在');
    console.log('📦 容器HTML长度:', container.innerHTML.length);
    
    // 检查操作按钮区域
    const actions = container.querySelector('.brain-dump-actions');
    if (!actions) {
        console.error('❌ 操作按钮区域不存在！');
        console.log('🔧 尝试手动刷新...');
        if (typeof BrainDump !== 'undefined') {
            BrainDump.refresh();
            setTimeout(() => {
                const actionsAfter = container.querySelector('.brain-dump-actions');
                if (actionsAfter) {
                    console.log('✅ 刷新后按钮区域出现了！');
                } else {
                    console.error('❌ 刷新后按钮区域仍然不存在');
                    console.log('📋 容器内容:', container.innerHTML.substring(0, 500));
                }
            }, 500);
        }
    } else {
        console.log('✅ 操作按钮区域存在');
        console.log('🎨 按钮区域样式:', window.getComputedStyle(actions).display);
        console.log('📏 按钮区域位置:', actions.getBoundingClientRect());
        
        // 检查具体按钮
        const aiBtn = actions.querySelector('[onclick*="aiArrange"]');
        if (aiBtn) {
            console.log('✅ AI智能安排按钮存在！');
            console.log('📝 按钮文本:', aiBtn.textContent.trim());
            console.log('🎨 按钮样式:', window.getComputedStyle(aiBtn).display);
            console.log('📏 按钮位置:', aiBtn.getBoundingClientRect());
        } else {
            console.error('❌ AI智能安排按钮不存在');
            console.log('📋 按钮区域HTML:', actions.innerHTML);
        }
    }
}

// 3. 检查滚动容器
const itemsContainer = document.querySelector('.items-container');
if (itemsContainer) {
    console.log('✅ 任务列表容器存在');
    console.log('📏 容器高度:', itemsContainer.offsetHeight);
    console.log('📜 滚动高度:', itemsContainer.scrollHeight);
    console.log('🎨 overflow样式:', window.getComputedStyle(itemsContainer).overflow);
} else {
    console.log('⚠️ 任务列表容器不存在');
}

// 4. 提供修复方案
console.log('\n🔧 修复方案：');
console.log('1. 如果按钮不存在，运行: BrainDump.refresh()');
console.log('2. 如果任务为空，运行: BrainDump.addItem("测试任务")');
console.log('3. 如果滚动卡顿，检查是否有大量DOM元素');
console.log('4. 强制刷新浏览器: Ctrl+Shift+R');

