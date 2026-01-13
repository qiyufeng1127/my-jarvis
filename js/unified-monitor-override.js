// Override loadMonitorPanel to use UnifiedMonitor
(function() {
    var checkApp = setInterval(function() {
        if (typeof App !== 'undefined' && typeof UnifiedMonitor !== 'undefined') {
            clearInterval(checkApp);
            
            // Override loadMonitorPanel
            App.loadMonitorPanel = function() {
                var container = document.getElementById("monitorBody");
                if (!container) return;
                
                // Use UnifiedMonitor to render
                container.innerHTML = UnifiedMonitor.render();
                
                // Reapply background
                setTimeout(function() { 
                    if (typeof Canvas !== 'undefined' && Canvas.reapplyBackground) {
                        Canvas.reapplyBackground('monitorPanel'); 
                    }
                }, 10);
            };
            
            // Refresh panel
            App.loadMonitorPanel();
            
            console.log('Monitor panel upgraded to UnifiedMonitor');
        }
    }, 500);
})();

