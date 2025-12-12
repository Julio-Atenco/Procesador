// ============================================
// SELECTOR DE VISTAS
// ============================================
function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.view-selector button').forEach(b => b.classList.remove('active'));
    
    if (viewName === 'diagram') {
        document.getElementById('viewDiagram').classList.add('active');
        document.getElementById('btnDiagram').classList.add('active');
        setTimeout(() => drawProcessor(), 100);
    } else {
        document.getElementById('viewSimulator').classList.add('active');
        document.getElementById('btnSimulator').classList.add('active');
    }
}