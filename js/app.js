-NoNewline

// 加载拖延面板
App.loadProcrastinationPanel = function() {
    const container = document.getElementById("procrastinationPanelBody");
    if (!container) return;
    
    fetch("components/procrastination-panel.html")
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const content = doc.querySelector(".procrastination-container");
            if (content) {
                container.innerHTML = content.innerHTML;
                setTimeout(function() { Canvas.reapplyBackground("procrastinationPanel"); }, 10);
            }
        })
        .catch(err => console.error("加载拖延面板失败:", err));
};

// 加载低效率面�?App.loadInefficiencyPanel = function() {
    const container = document.getElementById("inefficiencyPanelBody");
    if (!container) return;
    
    fetch("components/inefficiency-panel.html")
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const content = doc.querySelector(".inefficiency-container");
            if (content) {
                container.innerHTML = content.innerHTML;
                setTimeout(function() { Canvas.reapplyBackground("inefficiencyPanel"); }, 10);
            }
        })
        .catch(err => console.error("加载低效率面板失�?", err));
};

