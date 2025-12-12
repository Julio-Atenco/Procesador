// ============================================
// PANEL DE CONTROL FLOTANTE PARA EL DIAGRAMA
// ============================================
function createDiagramControlPanel() {
if (document.getElementById('diagramControlPanel')) return;
const panel = document.createElement('div');
panel.id = 'diagramControlPanel';
panel.className = 'diagram-control-panel';
panel.innerHTML = `
    <div class="panel-header">
        <h3>⚙️ Control del Simulador</h3>
        <button id="togglePanel" class="btn-toggle">−</button>
    </div>
    
    <div class="panel-content">
        <div class="panel-section">
            <div class="pc-display">
                <span class="pc-label">PC:</span>
                <span id="diagramPC" class="pc-value">0</span>
                <span class="pc-total">/ <span id="diagramTotal">0</span></span>
            </div>
            <div class="instruction-display">
                <strong>Instrucción Actual:</strong>
                <div id="diagramCurrentInstr" class="current-instr">N/A</div>
            </div>
        </div>
        
        <div class="panel-section">
            <h4>🎮 Ejecución</h4>
            <div class="control-buttons-diagram">
                <button id="diagramStepBtn" class="btn-control btn-step" title="Ejecutar siguiente instrucción">
                    ▶️ Paso
                </button>
                <button id="diagramRunBtn" class="btn-control btn-run" title="Ejecutar todas las instrucciones">
                    ⏩ Ejecutar Todo
                </button>
                <button id="diagramPauseBtn" class="btn-control btn-pause" style="display:none;" title="Pausar ejecución">
                    ⏸️ Pausar
                </button>
                <button id="diagramResetBtn" class="btn-control btn-reset" title="Reiniciar procesador">
                    🔄 Reiniciar
                </button>
            </div>
        </div>
        
        <div class="panel-section">
            <h4>⚡ Velocidad de Animación</h4>
            <div class="speed-control-container">
                <input type="range" id="diagramSpeedSlider" min="500" max="5000" value="2000" step="100">
                <div class="speed-labels">
                    <span>Rápido</span>
                    <span id="diagramSpeedValue">2000ms</span>
                    <span>Lento</span>
                </div>
            </div>
        </div>
        
        <div class="panel-section">
            <h4>📊 Registros (Quick View)</h4>
            <div id="diagramQuickRegs" class="quick-registers"></div>
        </div>
        
        
        
        <div class="panel-section">
            <button id="backToSimulator" class="btn-control btn-back">
                ← Volver al Simulador
            </button>
        </div>

        <div class="panel-section collapsible">
            <div id="controlSignalsSection" class="collapsible-content">
            </div>
        </div>
    </div>
`;

document.body.appendChild(panel);
setupDiagramControlListeners();
updateDiagramControlPanel();
updatePanelVisibility();
}
function setupDiagramControlListeners() {
document.getElementById('togglePanel')?.addEventListener('click', () => {
const panel = document.getElementById('diagramControlPanel');
const content = panel.querySelector('.panel-content');
const btn = document.getElementById('togglePanel');
if (content.style.display === 'none') {
        content.style.display = 'block';
        btn.textContent = '−';
        panel.classList.remove('collapsed');
    } else {
        content.style.display = 'none';
        btn.textContent = '+';
        panel.classList.add('collapsed');
    }
});

document.getElementById('diagramStepBtn')?.addEventListener('click', async () => {
    if (processor.pc < processor.instructions.length) {
        await executeInstruction();
        updateDiagramControlPanel();
    } else {
        showNotification('⚠️ No hay más instrucciones', 'warning');
    }
});

let runLoopActive = false;
document.getElementById('diagramRunBtn')?.addEventListener('click', async () => {
    if (processor.isRunning) {
        processor.isRunning = false;
        runLoopActive = false;
        document.getElementById('diagramRunBtn').style.display = 'inline-block';
        document.getElementById('diagramPauseBtn').style.display = 'none';
        showNotification('⏸️ Ejecución pausada', 'info');
        return;
    }
    
    processor.isRunning = true;
    runLoopActive = true;
    document.getElementById('diagramRunBtn').style.display = 'none';
    document.getElementById('diagramPauseBtn').style.display = 'inline-block';
    
    const speed = parseInt(document.getElementById('diagramSpeedSlider').value) || 800;
    
    while (processor.pc < processor.instructions.length && processor.isRunning && runLoopActive) {
        await executeInstruction();
        updateDiagramControlPanel();
        await new Promise(res => setTimeout(res, speed));
    }
    
    processor.isRunning = false;
    runLoopActive = false;
    document.getElementById('diagramRunBtn').style.display = 'inline-block';
    document.getElementById('diagramPauseBtn').style.display = 'none';
    if (processor.pc >= processor.instructions.length) {
        showNotification('✅ Programa completado', 'success');
    }
});

document.getElementById('diagramPauseBtn')?.addEventListener('click', () => {
    processor.isRunning = false;
    document.getElementById('diagramRunBtn').style.display = 'inline-block';
    document.getElementById('diagramPauseBtn').style.display = 'none';
    showNotification('⏸️ Ejecución pausada', 'info');
});

document.getElementById('diagramResetBtn')?.addEventListener('click', () => {
    if (confirm('¿Reiniciar el procesador?')) {
        resetProcessor();
        updateDiagramControlPanel();
        showNotification('🔄 Procesador reiniciado', 'info');
    }
});

document.getElementById('diagramSpeedSlider')?.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    animationConfig.duration = value;
    document.getElementById('diagramSpeedValue').textContent = value + 'ms';
});

document.getElementById('backToSimulator')?.addEventListener('click', () => {
    showView('simulator');
});
}
function updateDiagramControlPanel() {
document.getElementById('diagramPC').textContent = processor.pc;
document.getElementById('diagramTotal').textContent = processor.instructions.length;
const instrDisplay = document.getElementById('diagramCurrentInstr');
if (processor.pc < processor.instructions.length) {
    instrDisplay.textContent = processor.instructions[processor.pc];
    instrDisplay.style.color = '#2d3748';
} else {
    instrDisplay.textContent = 'Programa finalizado';
    instrDisplay.style.color = '#718096';
}

updateQuickRegisters();
updateQuickControlSignals();
}
function updateQuickRegisters() {
const container = document.getElementById('diagramQuickRegs');
if (!container) return;
const nonZeroRegs = processor.registers
    .map((val, idx) => ({ idx, val }))
    .filter(r => r.val !== 0 && r.idx !== 0)
    .slice(0, 8);

if (nonZeroRegs.length === 0) {
    container.innerHTML = '<div class="no-data">Todos los registros en 0</div>';
    return;
}

container.innerHTML = nonZeroRegs.map(r => `
    <div class="quick-reg">
        <span class="reg-name">x${r.idx}</span>
        <span class="reg-value">${r.val}</span>
    </div>
`).join('');
}
function updateQuickControlSignals() {
const container = document.getElementById('diagramControlSignals');
if (!container) return;
container.innerHTML = Object.entries(processor.controlSignals)
    .map(([signal, value]) => `
        <div class="signal-indicator ${value ? 'active' : 'inactive'}">
            <span class="signal-name">${signal}</span>
            <span class="signal-dot"></span>
        </div>
    `).join('');
    }
function updatePanelVisibility() {
const panel = document.getElementById('diagramControlPanel');
if (!panel) return;
const isDiagramView = document.getElementById('viewDiagram')?.classList.contains('active');
panel.style.display = isDiagramView ? 'block' : 'none';
}
const originalShowView2 = showView;
showView = function(viewName) {
originalShowView2(viewName);
updatePanelVisibility();
if (viewName === 'diagram') {
updateDiagramControlPanel();
}
};
function toggleSection(sectionId) {
const section = document.getElementById(sectionId);
if (!section) return;
const isHidden = section.style.display === 'none';
section.style.display = isHidden ? 'block' : 'none';

const icon = section.previousElementSibling?.querySelector('.toggle-icon');
if (icon) {
    icon.textContent = isHidden ? '▼' : '▶';
}
}
function showNotification(message, type = 'info') {
const notification = document.createElement('div');
notification.className = 'notification notification-${type}';
notification.textContent = message;
notification.style.cssText = `position: fixed; 
top: 20px;
right: 20px;
padding: 15px 25px;
border-radius: 8px;
font-weight: 600;
font-size: 14px;
box-shadow: 0 4px 12px rgba(0,0,0,0.3);
z-index: 20000;
animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.5s forwards;`;

const colors = {
    info: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
    success: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
    warning: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
    error: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)'
};

notification.style.background = colors[type] || colors.info;
notification.style.color = 'white';

document.body.appendChild(notification);

setTimeout(() => {
    notification.remove();
}, 3000);
}
const panelStyles = document.createElement('style');
panelStyles.textContent = `
.diagram-control-panel {
position: fixed;
right: 20px;
top: 100px;
width: 320px;
background: white;
border-radius: 12px;
box-shadow: 0 8px 24px rgba(0,0,0,0.15);
z-index: 1000;
overflow: hidden;
transition: all 0.3s ease;
}
.diagram-control-panel.collapsed {
    width: 200px;
}

.panel-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.panel-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}

.btn-toggle {
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.btn-toggle:hover {
    background: rgba(255,255,255,0.3);
}

.panel-content {
    padding: 15px;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
}

.panel-section {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #e2e8f0;
}

.panel-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
}

.panel-section h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #4c51bf;
    display: flex;
    align-items: center;
    gap: 8px;
}

.panel-section.collapsible h4 {
    cursor: pointer;
    user-select: none;
    justify-content: space-between;
}

.toggle-icon {
    font-size: 12px;
    transition: transform 0.3s;
}

.pc-display {
    background: #f7fafc;
    padding: 12px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
}

.pc-label {
    font-weight: 600;
    color: #4a5568;
}

.pc-value {
    font-size: 24px;
    font-weight: bold;
    color: #4c51bf;
    font-family: 'Courier New', monospace;
}

.pc-total {
    color: #718096;
    font-size: 14px;
}

.instruction-display {
    background: #ebf4ff;
    padding: 10px;
    border-radius: 6px;
}

.instruction-display strong {
    display: block;
    font-size: 11px;
    color: #4a5568;
    margin-bottom: 5px;
}

.current-instr {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    color: #2d3748;
    font-weight: 600;
}

.control-buttons-diagram {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.btn-control {
    padding: 10px;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    color: white;
}

.btn-step {
    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
}

.btn-step:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
}

.btn-run {
    background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
}

.btn-run:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(66, 153, 225, 0.4);
}

.btn-pause {
    background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
    grid-column: 1 / -1;
}

.btn-pause:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(237, 137, 54, 0.4);
}

.btn-reset {
    background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
    grid-column: 1 / -1;
}

.btn-reset:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(245, 101, 101, 0.4);
}

.btn-back {
    background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
    grid-column: 1 / -1;
}

.btn-back:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(113, 128, 150, 0.4);
}

.speed-control-container input[type="range"] {
    width: 100%;
    margin: 10px 0;
}

.speed-labels {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #718096;
}

.speed-labels span:nth-child(2) {
    color: #4c51bf;
    font-weight: bold;
}

.quick-registers {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
}

.quick-reg {
    background: #f7fafc;
    padding: 8px;
    border-radius: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
}

.quick-reg .reg-name {
    font-weight: 600;
    color: #4a5568;
}

.quick-reg .reg-value {
    font-family: 'Courier New', monospace;
    color: #2d3748;
    font-weight: bold;
}

.no-data {
    text-align: center;
    color: #718096;
    font-size: 12px;
    padding: 10px;
    font-style: italic;
}

.control-signals-mini {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
}

.signal-indicator {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 8px;
    border-radius: 4px;
    font-size: 11px;
}

.signal-indicator.active {
    background: #c6f6d5;
    color: #22543d;
}

.signal-indicator.inactive {
    background: #f7fafc;
    color: #718096;
}

.signal-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
}

.collapsible-content {
    overflow: hidden;
    transition: all 0.3s ease;
}

@keyframes slideInRight {
    from {
        transform: translateX(100px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes fadeOut {
    to {
        opacity: 0;
        transform: translateX(50px);
    }
}

@media (max-width: 768px) {
    .diagram-control-panel {
        width: calc(100% - 40px);
        right: 20px;
        left: 20px;
    }
}

.panel-content::-webkit-scrollbar {
    width: 6px;
}

.panel-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

.panel-content::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 10px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
}`;
document.head.appendChild(panelStyles);
document.addEventListener('DOMContentLoaded', () => {
setTimeout(() => {
createDiagramControlPanel();
}, 200);
});
const originalShowView3 = showView;
showView = function(viewName) {
originalShowView3(viewName);
if (viewName === 'diagram' && !document.getElementById('diagramControlPanel')) {
createDiagramControlPanel();
}
};
const animStyle = document.createElement('style');
animStyle.textContent = `@keyframes slideDown {from{transform: translate(-50%, -20px);opacity: 0;}to{transform: translate(-50%, 0);opacity: 1;}}`;
document.head.appendChild(animStyle);

