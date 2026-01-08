// 统计图表模块 - 可视化数据展示
const ChartSystem = {
    // 颜色配置
    colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        success: '#27AE60',
        warning: '#F39C12',
        danger: '#E74C3C',
        info: '#3498DB',
        muted: '#95A5A6',
        gradient: ['#667eea', '#764ba2', '#E91E63', '#FF5722', '#FFC107', '#4CAF50', '#00BCD4']
    },
    
    // 初始化
    init() {
        console.log('图表系统初始化完成');
    },
    
    // ==================== 折线图 ====================
    
    // 绘制折线图
    drawLineChart(container, data, options = {}) {
        const {
            width = container.clientWidth || 300,
            height = options.height || 200,
            padding = 40,
            showDots = true,
            showArea = true,
            showGrid = true,
            animate = true
        } = options;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="chart-empty">暂无数据</div>';
            return;
        }
        
        const values = data.map(d => d.value);
        const maxValue = Math.max(...values) || 1;
        const minValue = Math.min(...values, 0);
        const range = maxValue - minValue || 1;
        
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        
        // 计算点位置
        const points = data.map((d, i) => ({
            x: padding + (i / (data.length - 1 || 1)) * chartWidth,
            y: height - padding - ((d.value - minValue) / range) * chartHeight,
            ...d
        }));
        
        // 生成路径
        const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;
        
        // 生成网格线
        const gridLines = [];
        if (showGrid) {
            for (let i = 0; i <= 4; i++) {
                const y = padding + (i / 4) * chartHeight;
                gridLines.push(`<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#E0E0E0" stroke-dasharray="4"/>`);
            }
        }
        
        const svg = `
            <svg width="${width}" height="${height}" class="line-chart">
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${this.colors.primary};stop-opacity:0.3"/>
                        <stop offset="100%" style="stop-color:${this.colors.primary};stop-opacity:0"/>
                    </linearGradient>
                </defs>
                
                <!-- 网格 -->
                ${gridLines.join('')}
                
                <!-- 区域填充 -->
                ${showArea ? `<path d="${areaPath}" fill="url(#lineGradient)" class="${animate ? 'chart-animate-area' : ''}"/>` : ''}
                
                <!-- 折线 -->
                <path d="${linePath}" fill="none" stroke="${this.colors.primary}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="${animate ? 'chart-animate-line' : ''}"/>
                
                <!-- 数据点 -->
                ${showDots ? points.map((p, i) => `
                    <circle cx="${p.x}" cy="${p.y}" r="5" fill="white" stroke="${this.colors.primary}" stroke-width="2" class="chart-dot" data-index="${i}"/>
                `).join('') : ''}
                
                <!-- X轴标签 -->
                ${points.filter((_, i) => i % Math.ceil(points.length / 7) === 0 || i === points.length - 1).map(p => `
                    <text x="${p.x}" y="${height - 10}" text-anchor="middle" font-size="11" fill="#888">${p.label || ''}</text>
                `).join('')}
                
                <!-- Y轴标签 -->
                ${[0, 1, 2, 3, 4].map(i => {
                    const value = minValue + (range * (4 - i) / 4);
                    const y = padding + (i / 4) * chartHeight;
                    return `<text x="${padding - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#888">${Math.round(value)}</text>`;
                }).join('')}
            </svg>
        `;
        
        container.innerHTML = svg;
        
        // 添加交互
        this.addChartInteraction(container, points);
    },
    
    // ==================== 柱状图 ====================
    
    drawBarChart(container, data, options = {}) {
        const {
            width = container.clientWidth || 300,
            height = options.height || 200,
            padding = 40,
            barWidth = options.barWidth || 'auto',
            showValues = true,
            animate = true,
            horizontal = false
        } = options;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="chart-empty">暂无数据</div>';
            return;
        }
        
        const values = data.map(d => d.value);
        const maxValue = Math.max(...values) || 1;
        
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        const gap = 8;
        const calculatedBarWidth = barWidth === 'auto' 
            ? (chartWidth - gap * (data.length - 1)) / data.length 
            : barWidth;
        
        const bars = data.map((d, i) => {
            const barHeight = (d.value / maxValue) * chartHeight;
            const x = padding + i * (calculatedBarWidth + gap);
            const y = height - padding - barHeight;
            const color = d.color || this.colors.gradient[i % this.colors.gradient.length];
            
            return { x, y, width: calculatedBarWidth, height: barHeight, color, ...d };
        });
        
        const svg = `
            <svg width="${width}" height="${height}" class="bar-chart">
                <!-- 网格线 -->
                ${[0, 1, 2, 3, 4].map(i => {
                    const y = padding + (i / 4) * chartHeight;
                    return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#E0E0E0" stroke-dasharray="4"/>`;
                }).join('')}
                
                <!-- 柱子 -->
                ${bars.map((bar, i) => `
                    <g class="bar-group" data-index="${i}">
                        <rect x="${bar.x}" y="${animate ? height - padding : bar.y}" 
                              width="${bar.width}" height="${animate ? 0 : bar.height}"
                              fill="${bar.color}" rx="4" ry="4"
                              class="${animate ? 'chart-animate-bar' : ''}"
                              style="--target-y: ${bar.y}px; --target-height: ${bar.height}px; animation-delay: ${i * 0.05}s"/>
                        ${showValues ? `
                            <text x="${bar.x + bar.width / 2}" y="${bar.y - 8}" 
                                  text-anchor="middle" font-size="12" font-weight="600" fill="${bar.color}"
                                  class="${animate ? 'chart-animate-text' : ''}" style="animation-delay: ${i * 0.05 + 0.3}s">
                                ${bar.value}
                            </text>
                        ` : ''}
                    </g>
                `).join('')}
                
                <!-- X轴标签 -->
                ${bars.map(bar => `
                    <text x="${bar.x + bar.width / 2}" y="${height - 10}" 
                          text-anchor="middle" font-size="11" fill="#888">${bar.label || ''}</text>
                `).join('')}
                
                <!-- Y轴标签 -->
                ${[0, 1, 2, 3, 4].map(i => {
                    const value = maxValue * (4 - i) / 4;
                    const y = padding + (i / 4) * chartHeight;
                    return `<text x="${padding - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#888">${Math.round(value)}</text>`;
                }).join('')}
            </svg>
        `;
        
        container.innerHTML = svg;
    },
    
    // ==================== 饼图/环形图 ====================
    
    drawPieChart(container, data, options = {}) {
        const {
            width = container.clientWidth || 200,
            height = options.height || 200,
            innerRadius = options.donut ? 50 : 0,
            outerRadius = Math.min(width, height) / 2 - 20,
            showLabels = true,
            showLegend = true,
            animate = true
        } = options;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="chart-empty">暂无数据</div>';
            return;
        }
        
        const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
        const centerX = width / 2;
        const centerY = height / 2;
        
        let currentAngle = -Math.PI / 2;
        const slices = data.map((d, i) => {
            const angle = (d.value / total) * Math.PI * 2;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle = endAngle;
            
            const color = d.color || this.colors.gradient[i % this.colors.gradient.length];
            const percentage = Math.round((d.value / total) * 100);
            
            // 计算路径
            const x1 = centerX + Math.cos(startAngle) * outerRadius;
            const y1 = centerY + Math.sin(startAngle) * outerRadius;
            const x2 = centerX + Math.cos(endAngle) * outerRadius;
            const y2 = centerY + Math.sin(endAngle) * outerRadius;
            
            const x3 = centerX + Math.cos(endAngle) * innerRadius;
            const y3 = centerY + Math.sin(endAngle) * innerRadius;
            const x4 = centerX + Math.cos(startAngle) * innerRadius;
            const y4 = centerY + Math.sin(startAngle) * innerRadius;
            
            const largeArc = angle > Math.PI ? 1 : 0;
            
            let path;
            if (innerRadius > 0) {
                path = `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
            } else {
                path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            }
            
            // 标签位置
            const labelAngle = startAngle + angle / 2;
            const labelRadius = outerRadius * 0.7;
            const labelX = centerX + Math.cos(labelAngle) * labelRadius;
            const labelY = centerY + Math.sin(labelAngle) * labelRadius;
            
            return { path, color, percentage, labelX, labelY, ...d };
        });
        
        const svg = `
            <svg width="${width}" height="${height}" class="pie-chart">
                <!-- 扇形 -->
                ${slices.map((slice, i) => `
                    <path d="${slice.path}" fill="${slice.color}" 
                          class="pie-slice ${animate ? 'chart-animate-pie' : ''}" 
                          data-index="${i}"
                          style="animation-delay: ${i * 0.1}s"/>
                `).join('')}
                
                <!-- 百分比标签 -->
                ${showLabels ? slices.filter(s => s.percentage >= 5).map(slice => `
                    <text x="${slice.labelX}" y="${slice.labelY}" 
                          text-anchor="middle" dominant-baseline="middle"
                          font-size="12" font-weight="600" fill="white">
                        ${slice.percentage}%
                    </text>
                `).join('') : ''}
                
                <!-- 中心文字（环形图） -->
                ${innerRadius > 0 ? `
                    <text x="${centerX}" y="${centerY}" text-anchor="middle" dominant-baseline="middle">
                        <tspan font-size="24" font-weight="700" fill="#333">${total}</tspan>
                        <tspan x="${centerX}" dy="20" font-size="12" fill="#888">总计</tspan>
                    </text>
                ` : ''}
            </svg>
            
            <!-- 图例 -->
            ${showLegend ? `
                <div class="chart-legend">
                    ${slices.map(slice => `
                        <div class="legend-item">
                            <span class="legend-color" style="background: ${slice.color}"></span>
                            <span class="legend-label">${slice.label}</span>
                            <span class="legend-value">${slice.value}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
        
        container.innerHTML = svg;
    },
    
    // ==================== 进度环 ====================
    
    drawProgressRing(container, value, options = {}) {
        const {
            size = 120,
            strokeWidth = 10,
            color = this.colors.primary,
            bgColor = '#E0E0E0',
            showValue = true,
            label = '',
            animate = true
        } = options;
        
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const progress = Math.min(Math.max(value, 0), 100);
        const offset = circumference - (progress / 100) * circumference;
        
        const svg = `
            <div class="progress-ring-container" style="width: ${size}px; height: ${size}px;">
                <svg width="${size}" height="${size}" class="progress-ring">
                    <!-- 背景环 -->
                    <circle cx="${size / 2}" cy="${size / 2}" r="${radius}"
                            fill="none" stroke="${bgColor}" stroke-width="${strokeWidth}"/>
                    
                    <!-- 进度环 -->
                    <circle cx="${size / 2}" cy="${size / 2}" r="${radius}"
                            fill="none" stroke="${color}" stroke-width="${strokeWidth}"
                            stroke-linecap="round"
                            stroke-dasharray="${circumference}"
                            stroke-dashoffset="${animate ? circumference : offset}"
                            transform="rotate(-90 ${size / 2} ${size / 2})"
                            class="${animate ? 'chart-animate-ring' : ''}"
                            style="--target-offset: ${offset}"/>
                </svg>
                
                ${showValue ? `
                    <div class="progress-ring-value">
                        <span class="progress-ring-number">${Math.round(progress)}%</span>
                        ${label ? `<span class="progress-ring-label">${label}</span>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
        
        container.innerHTML = svg;
    },
    
    // ==================== 热力图（周视图） ====================
    
    drawHeatmap(container, data, options = {}) {
        const {
            cellSize = 14,
            cellGap = 3,
            weeks = 12,
            showLabels = true
        } = options;
        
        const days = ['日', '一', '二', '三', '四', '五', '六'];
        const width = (cellSize + cellGap) * weeks + 40;
        const height = (cellSize + cellGap) * 7 + 30;
        
        // 生成过去N周的日期
        const today = new Date();
        const cells = [];
        
        for (let w = weeks - 1; w >= 0; w--) {
            for (let d = 0; d < 7; d++) {
                const date = new Date(today);
                date.setDate(date.getDate() - (w * 7 + (6 - d)));
                const dateStr = date.toISOString().split('T')[0];
                const value = data[dateStr] || 0;
                
                cells.push({
                    x: 40 + (weeks - 1 - w) * (cellSize + cellGap),
                    y: 20 + d * (cellSize + cellGap),
                    value,
                    date: dateStr,
                    level: this.getHeatLevel(value)
                });
            }
        }
        
        const svg = `
            <svg width="${width}" height="${height}" class="heatmap">
                <!-- 星期标签 -->
                ${showLabels ? days.map((day, i) => `
                    <text x="30" y="${28 + i * (cellSize + cellGap)}" 
                          text-anchor="end" font-size="10" fill="#888">${day}</text>
                `).join('') : ''}
                
                <!-- 热力格子 -->
                ${cells.map(cell => `
                    <rect x="${cell.x}" y="${cell.y}" width="${cellSize}" height="${cellSize}"
                          rx="2" fill="${this.getHeatColor(cell.level)}"
                          class="heatmap-cell" data-date="${cell.date}" data-value="${cell.value}">
                        <title>${cell.date}: ${cell.value}</title>
                    </rect>
                `).join('')}
            </svg>
            
            <!-- 图例 -->
            <div class="heatmap-legend">
                <span>少</span>
                ${[0, 1, 2, 3, 4].map(level => `
                    <span class="heatmap-legend-cell" style="background: ${this.getHeatColor(level)}"></span>
                `).join('')}
                <span>多</span>
            </div>
        `;
        
        container.innerHTML = svg;
    },
    
    getHeatLevel(value) {
        if (value === 0) return 0;
        if (value <= 2) return 1;
        if (value <= 5) return 2;
        if (value <= 10) return 3;
        return 4;
    },
    
    getHeatColor(level) {
        const colors = ['#EBEDF0', '#C6E48B', '#7BC96F', '#239A3B', '#196127'];
        return colors[level] || colors[0];
    },
    
    // ==================== 交互功能 ====================
    
    addChartInteraction(container, points) {
        const dots = container.querySelectorAll('.chart-dot');
        const tooltip = this.createTooltip();
        
        dots.forEach((dot, i) => {
            dot.addEventListener('mouseenter', (e) => {
                const point = points[i];
                tooltip.innerHTML = `
                    <div class="chart-tooltip-label">${point.label || ''}</div>
                    <div class="chart-tooltip-value">${point.value}</div>
                `;
                tooltip.style.display = 'block';
                tooltip.style.left = (e.pageX + 10) + 'px';
                tooltip.style.top = (e.pageY - 30) + 'px';
            });
            
            dot.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        });
    },
    
    createTooltip() {
        let tooltip = document.getElementById('chartTooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'chartTooltip';
            tooltip.className = 'chart-tooltip';
            document.body.appendChild(tooltip);
        }
        return tooltip;
    },
    
    // ==================== 数据生成辅助 ====================
    
    // 生成最近N天的数据
    generateDailyData(days = 7, getValue) {
        const data = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            data.push({
                date: dateStr,
                label: `${date.getMonth() + 1}/${date.getDate()}`,
                value: getValue ? getValue(dateStr) : 0
            });
        }
        
        return data;
    },
    
    // 从任务数据生成统计
    generateTaskStats() {
        const tasks = Storage.getTasks();
        const today = new Date().toISOString().split('T')[0];
        
        // 最近7天完成数
        const dailyCompleted = this.generateDailyData(7, (date) => {
            return tasks.filter(t => t.date === date && t.completed).length;
        });
        
        // 按标签分类
        const tagStats = {};
        tasks.forEach(task => {
            (task.tags || []).forEach(tagId => {
                tagStats[tagId] = (tagStats[tagId] || 0) + 1;
            });
        });
        
        // 转换为饼图数据
        const tagData = Object.entries(tagStats).map(([tagId, count]) => {
            const tag = TaskEnhance?.getTag(tagId) || { name: tagId, color: '#667eea' };
            return {
                label: tag.name,
                value: count,
                color: tag.color
            };
        });
        
        // 完成率
        const totalTasks = tasks.filter(t => t.date === today).length;
        const completedTasks = tasks.filter(t => t.date === today && t.completed).length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        return {
            dailyCompleted,
            tagData,
            completionRate,
            totalTasks,
            completedTasks
        };
    }
};

// 添加图表样式
const chartStyles = document.createElement('style');
chartStyles.textContent = `
    .chart-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 150px;
        color: #888;
        font-size: 14px;
    }
    
    .chart-animate-line {
        stroke-dasharray: 1000;
        stroke-dashoffset: 1000;
        animation: drawLine 1.5s ease forwards;
    }
    
    @keyframes drawLine {
        to { stroke-dashoffset: 0; }
    }
    
    .chart-animate-area {
        opacity: 0;
        animation: fadeIn 0.5s ease 0.5s forwards;
    }
    
    .chart-animate-bar {
        animation: growBar 0.5s ease forwards;
    }
    
    @keyframes growBar {
        to {
            y: var(--target-y);
            height: var(--target-height);
        }
    }
    
    .chart-animate-text {
        opacity: 0;
        animation: fadeIn 0.3s ease forwards;
    }
    
    @keyframes fadeIn {
        to { opacity: 1; }
    }
    
    .chart-animate-pie {
        opacity: 0;
        transform-origin: center;
        animation: popIn 0.3s ease forwards;
    }
    
    @keyframes popIn {
        from { opacity: 0; transform: scale(0.8); }
        to { opacity: 1; transform: scale(1); }
    }
    
    .chart-animate-ring {
        animation: drawRing 1s ease forwards;
    }
    
    @keyframes drawRing {
        to { stroke-dashoffset: var(--target-offset); }
    }
    
    .chart-dot {
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .chart-dot:hover {
        r: 7;
    }
    
    .pie-slice {
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .pie-slice:hover {
        filter: brightness(1.1);
        transform: scale(1.02);
        transform-origin: center;
    }
    
    .chart-tooltip {
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        pointer-events: none;
        z-index: 10000;
        display: none;
    }
    
    .chart-tooltip-label {
        color: #AAA;
        margin-bottom: 2px;
    }
    
    .chart-tooltip-value {
        font-weight: 700;
        font-size: 14px;
    }
    
    .chart-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 12px;
        justify-content: center;
    }
    
    .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
    }
    
    .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 3px;
    }
    
    .legend-label {
        color: #666;
    }
    
    .legend-value {
        font-weight: 600;
        color: #333;
    }
    
    [data-theme="dark"] .legend-label {
        color: #A0A0A0;
    }
    
    [data-theme="dark"] .legend-value {
        color: #E8E8E8;
    }
    
    .progress-ring-container {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
    
    .progress-ring-value {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    
    .progress-ring-number {
        font-size: 24px;
        font-weight: 700;
        color: #333;
    }
    
    [data-theme="dark"] .progress-ring-number {
        color: #E8E8E8;
    }
    
    .progress-ring-label {
        font-size: 11px;
        color: #888;
    }
    
    .heatmap-legend {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 8px;
        font-size: 11px;
        color: #888;
    }
    
    .heatmap-legend-cell {
        width: 12px;
        height: 12px;
        border-radius: 2px;
    }
    
    .heatmap-cell {
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .heatmap-cell:hover {
        stroke: #333;
        stroke-width: 1;
    }
`;
document.head.appendChild(chartStyles);

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    ChartSystem.init();
});

// 导出
window.ChartSystem = ChartSystem;

