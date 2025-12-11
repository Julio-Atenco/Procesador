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

// ============================================
// CÓDIGO DEL DIAGRAMA MEJORADO - VERSIÓN ESPACIADA
// ============================================
const canvas = document.getElementById('processorCanvas');
const ctx = canvas.getContext('2d');
const infoBox = document.getElementById('infoBox');
let hoveredComponent = null;
let selectedComponent = null;

// Canvas más grande para mejor espaciado
canvas.width = 1600;
canvas.height = 900;

const components = {
    // Columna 1: PC y control de flujo (alineados verticalmente)
    pc: { x: 50, y: 100, width: 70, height: 70, label: 'PC', color: '#FFE5B4', type: 'rect' },
    adderPC4: { x: 50, y: 210, width: 70, height: 50, label: '+4', color: '#FFD9B3', type: 'rect' },
    muxPC: { x: 50, y: 320, width: 50, height: 90, label: 'MUX', color: '#E0E0E0', type: 'mux' },
    adderBranch: { x: 40, y: 500, width: 90, height: 50, label: 'Branch\nAdder', color: '#FFD9B3', type: 'rect' },
    
    // Columna 2: Memoria de instrucciones
    instMem: { x: 220, y: 80, width: 140, height: 200, label: 'IM', color: '#FF9800', type: 'memory' },
    
    // Columna 3: Generador de inmediatos (alineado)
    immGen: { x: 220, y: 340, width: 120, height: 80, label: 'Imm Gen', color: '#FFFACD', type: 'rect' },
    
    // Columna 4: Banco de registros (centrado mejor)
    regFile: { x: 450, y: 120, width: 160, height: 200, label: 'RF', color: '#FFB6C1', type: 'regfile' },
    
    // Columna 5: MUX antes de ALU (centrado con ALU)
    muxALU: { x: 700, y: 200, width: 50, height: 100, label: 'MUX', color: '#E0E0E0', type: 'mux' },
    
    // Columna 6: ALU (más centrada)
    alu: { x: 850, y: 180, width: 120, height: 140, label: 'ALU', color: '#90EE90', type: 'alu' },
    
    // Columna 7: Memoria de datos (alineada con ALU)
    dataMem: { x: 1080, y: 120, width: 140, height: 200, label: 'DM', color: '#FFDAB9', type: 'memory' },
    
    // Columna 8: MUX final (centrado con DM)
    muxWB: { x: 1320, y: 200, width: 50, height: 100, label: 'MUX', color: '#E0E0E0', type: 'mux' },
    
    // Fila inferior: Control (más centrado)
    controlUnit: { x: 500, y: 600, width: 300, height: 130, label: 'Control Unit', color: '#FFD700', type: 'control' },
    aluControl: { x: 880, y: 600, width: 100, height: 50, label: 'ALU Ctrl', color: '#D0F0D0', type: 'rect' }
};

const componentInfo = {
    pc: 'Program Counter\n\nMantiene la dirección de la siguiente instrucción.',
    adderPC4: 'Sumador PC+4\n\nCalcula la siguiente dirección secuencial.',
    muxPC: 'Multiplexor PC\n\nSelecciona entre PC+4 o dirección de branch.',
    adderBranch: 'Sumador Branch\n\nCalcula dirección de salto: PC + offset.',
    instMem: 'Memoria de Instrucciones\n\nAlmacena el programa. Solo lectura.',
    immGen: 'Generador de Inmediatos\n\nExtrae y extiende inmediatos de la instrucción.',
    regFile: 'Banco de Registros\n\n32 registros (x0-x31). x0 siempre es 0.',
    muxALU: 'Multiplexor ALU\n\nSelecciona: registro o inmediato.',
    alu: 'ALU\n\nRealiza operaciones aritméticas y lógicas.',
    dataMem: 'Memoria de Datos\n\nPara loads y stores.',
    muxWB: 'Multiplexor Write-Back\n\nSelecciona: ALU o memoria.',
    controlUnit: 'Unidad de Control\n\nGenera todas las señales de control.',
    aluControl: 'Control ALU\n\nDetermina la operación de la ALU.'
};

// ============================================
// FUNCIONES DE DIBUJO BÁSICAS
// ============================================

function drawArrow(x1, y1, x2, y2, color, width) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    
    // Punta de flecha
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowLen = 8;
    const arrowWidth = 5;
    
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
        x2 - arrowLen * Math.cos(angle) - arrowWidth * Math.sin(angle),
        y2 - arrowLen * Math.sin(angle) + arrowWidth * Math.cos(angle)
    );
    ctx.lineTo(
        x2 - arrowLen * Math.cos(angle) + arrowWidth * Math.sin(angle),
        y2 - arrowLen * Math.sin(angle) - arrowWidth * Math.cos(angle)
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function drawBus(x1, y1, x2, y2, color, width = 3) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawRoundRect(x, y, w, h, r, fill, stroke, lineW = 2) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineW;
    ctx.stroke();
}

// ============================================
// DIBUJO DE COMPONENTES
// ============================================

function drawRect(comp, isHovered, isSelected) {
    const stroke = isSelected ? '#FF0000' : isHovered ? '#FF6600' : '#333';
    const lineW = isSelected ? 3 : 2;
    const fill = isSelected ? '#FFD700' : isHovered ? '#FFA500' : comp.color;
    
    drawRoundRect(comp.x, comp.y, comp.width, comp.height, 6, fill, stroke, lineW);
    
    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const lines = comp.label.split('\n');
    const lineHeight = 14;
    const startY = comp.y + comp.height/2 - ((lines.length - 1) * lineHeight / 2);
    
    lines.forEach((line, i) => {
        ctx.fillText(line, comp.x + comp.width/2, startY + i * lineHeight);
    });
}

function drawMemory(comp, isHovered, isSelected) {
    const stroke = isSelected ? '#FF0000' : isHovered ? '#FF6600' : '#333';
    const lineW = isSelected ? 3 : 2;
    const fill = isSelected ? '#FFD700' : isHovered ? '#FFA500' : comp.color;
    
    drawRoundRect(comp.x, comp.y, comp.width, comp.height, 6, fill, stroke, lineW);
    
    // Título
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(comp.label, comp.x + comp.width/2, comp.y + 25);
    
    // Líneas de memoria simplificadas
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
        const y = comp.y + 50 + i * 30;
        ctx.beginPath();
        ctx.moveTo(comp.x + 15, y);
        ctx.lineTo(comp.x + comp.width - 15, y);
        ctx.stroke();
    }
}

function drawRegFile(comp, isHovered, isSelected) {
    const stroke = isSelected ? '#FF0000' : isHovered ? '#FF6600' : '#333';
    const lineW = isSelected ? 3 : 2;
    const fill = isSelected ? '#FFD700' : isHovered ? '#FFA500' : comp.color;
    
    drawRoundRect(comp.x, comp.y, comp.width, comp.height, 6, fill, stroke, lineW);
    
    // Título
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(comp.label, comp.x + comp.width/2, comp.y + 25);
    
    // Puertos
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('a1', comp.x + 10, comp.y + 60);
    ctx.fillText('a2', comp.x + 10, comp.y + 90);
    ctx.fillText('ad', comp.x + 10, comp.y + 120);
    ctx.fillText('wd', comp.x + 10, comp.y + 150);
    ctx.fillText('we', comp.x + 10, comp.y + 180);
    
    ctx.textAlign = 'right';
    ctx.fillText('d1', comp.x + comp.width - 10, comp.y + 60);
    ctx.fillText('d2', comp.x + comp.width - 10, comp.y + 90);
    
    // Mini representación de registros
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    const regW = 25;
    const regH = 12;
    const startX = comp.x + comp.width/2 - 38;
    const startY = comp.y + 50;
    
    for (let i = 0; i < 6; i++) {
        const rx = startX + (i % 3) * 26;
        const ry = startY + Math.floor(i / 3) * 16;
        ctx.strokeRect(rx, ry, regW, regH);
    }
    
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('x0', startX + 12, startY + 9);
    ctx.fillText('x1', startX + 38, startY + 9);
    ctx.fillText('...', startX + 64, startY + 9);
}

function drawALU(comp, isHovered, isSelected) {
    const stroke = isSelected ? '#FF0000' : isHovered ? '#FF6600' : '#333';
    const lineW = isSelected ? 3 : 2;
    const fill = isSelected ? '#FFD700' : isHovered ? '#FFA500' : comp.color;
    
    // Trapecio
    ctx.beginPath();
    ctx.moveTo(comp.x, comp.y + 20);
    ctx.lineTo(comp.x + comp.width, comp.y);
    ctx.lineTo(comp.x + comp.width, comp.y + comp.height);
    ctx.lineTo(comp.x, comp.y + comp.height - 20);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineW;
    ctx.stroke();
    
    // Label
    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ALU', comp.x + comp.width/2, comp.y + comp.height/2);
}

function drawMux(comp, isHovered, isSelected) {
    const stroke = isSelected ? '#FF0000' : isHovered ? '#FF6600' : '#333';
    const lineW = isSelected ? 3 : 2;
    const fill = isSelected ? '#FFD700' : isHovered ? '#FFA500' : comp.color;
    
    // Trapecio
    ctx.beginPath();
    ctx.moveTo(comp.x, comp.y);
    ctx.lineTo(comp.x + comp.width, comp.y + 15);
    ctx.lineTo(comp.x + comp.width, comp.y + comp.height - 15);
    ctx.lineTo(comp.x, comp.y + comp.height);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineW;
    ctx.stroke();
    
    // Label
    ctx.fillStyle = '#000';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MUX', comp.x + comp.width/2, comp.y + comp.height/2);
    
    // Selectores
    ctx.font = '9px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('0', comp.x + 3, comp.y + 25);
    ctx.fillText('1', comp.x + 3, comp.y + comp.height - 25);
}

function drawControl(comp, isHovered, isSelected) {
    const stroke = isSelected ? '#FF0000' : isHovered ? '#FF6600' : '#333';
    const lineW = isSelected ? 3 : 2;
    const fill = isSelected ? '#FFD700' : isHovered ? '#FFA500' : comp.color;
    
    drawRoundRect(comp.x, comp.y, comp.width, comp.height, 8, fill, stroke, lineW);
    
    // Título
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(comp.label, comp.x + comp.width/2, comp.y + 20);
    
    // Señales (simplificado)
    const signals = ['RegWrite', 'ALUSrc', 'MemWrite', 'MemRead', 'MemToReg', 'Branch'];
    ctx.font = '9px Arial';
    
    signals.forEach((sig, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = comp.x + 20 + col * 80;
        const y = comp.y + 45 + row * 25;
        
        ctx.fillStyle = '#DDD';
        ctx.fillRect(x, y, 65, 16);
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, 65, 16);
        
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText(sig, x + 32, y + 11);
    });
}

// ============================================
// CONEXIONES DEL DATAPATH (CORREGIDAS Y ALINEADAS)
// ============================================

function drawConnections() {
    ctx.lineWidth = 2;
    
    // ===== PC -> Instruction Memory =====
    drawBus(120, 135, 220, 135, '#4A90E2', 3);
    
    // ===== PC -> +4 =====
    drawArrow(85, 170, 85, 210, '#666', 2);
    
    // ===== +4 -> MUX PC =====
    drawArrow(85, 260, 85, 320, '#666', 2);
    
    // ===== MUX PC -> PC (feedback loop) =====
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(75, 320);
    ctx.lineTo(75, 290);
    ctx.lineTo(30, 290);
    ctx.lineTo(30, 135);
    ctx.lineTo(50, 135);
    ctx.stroke();
    drawArrow(48, 135, 50, 135, '#666', 2);
    
    // ===== Instruction Memory -> Control Unit (opcode) =====
    ctx.strokeStyle = '#00BFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(290, 280);
    ctx.lineTo(290, 500);
    ctx.lineTo(550, 500);
    ctx.lineTo(550, 600);
    ctx.stroke();
    drawArrow(550, 598, 550, 600, '#00BFFF', 2);
    
    // ===== Instruction Memory -> Register File (rs1, rs2, rd) =====
    // rs1 (a1)
    drawBus(360, 150, 400, 150, '#32CD32', 2);
    drawBus(400, 150, 400, 180, '#32CD32', 2);
    drawBus(400, 180, 450, 180, '#32CD32', 2);
    
    // rs2 (a2)
    drawBus(360, 170, 420, 170, '#32CD32', 2);
    drawBus(420, 170, 420, 210, '#32CD32', 2);
    drawBus(420, 210, 450, 210, '#32CD32', 2);
    
    // rd (ad) - va por arriba para write back
    ctx.strokeStyle = '#9370DB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(360, 190);
    ctx.lineTo(430, 190);
    ctx.lineTo(430, 80);
    ctx.lineTo(490, 80);
    ctx.lineTo(490, 120);
    ctx.stroke();
    drawArrow(490, 118, 490, 120, '#9370DB', 2);
    
    // ===== Instruction Memory -> Imm Gen =====
    ctx.strokeStyle = '#FF8C00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(290, 280);
    ctx.lineTo(290, 310);
    ctx.lineTo(280, 310);
    ctx.lineTo(280, 340);
    ctx.stroke();
    drawArrow(280, 338, 280, 340, '#FF8C00', 2);
    
    // ===== Register File d1 -> ALU (entrada superior) =====
    ctx.strokeStyle = '#32CD32';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(610, 180);
    ctx.lineTo(680, 180);
    ctx.lineTo(680, 220);
    ctx.lineTo(850, 220);
    ctx.stroke();
    drawArrow(848, 220, 850, 220, '#32CD32', 3);
    
    // ===== Register File d2 -> MUX ALU =====
    ctx.strokeStyle = '#32CD32';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(610, 210);
    ctx.lineTo(660, 210);
    ctx.lineTo(660, 270);
    ctx.lineTo(700, 270);
    ctx.stroke();
    drawArrow(698, 270, 700, 270, '#32CD32', 3);
    
    // ===== Imm Gen -> MUX ALU =====
    ctx.strokeStyle = '#FF8C00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(340, 380);
    ctx.lineTo(680, 380);
    ctx.lineTo(680, 280);
    ctx.lineTo(700, 280);
    ctx.stroke();
    drawArrow(698, 280, 700, 280, '#FF8C00', 2);
    
    // ===== MUX ALU -> ALU (entrada inferior) =====
    drawBus(750, 250, 850, 260, '#32CD32', 3);
    
    // ===== ALU -> Data Memory (address) =====
    ctx.strokeStyle = '#DC143C';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(970, 250);
    ctx.lineTo(1050, 250);
    ctx.lineTo(1050, 190);
    ctx.lineTo(1080, 190);
    ctx.stroke();
    drawArrow(1078, 190, 1080, 190, '#DC143C', 3);
    
    // ===== Register d2 -> Data Memory (write data) =====
    ctx.strokeStyle = '#32CD32';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(610, 210);
    ctx.lineTo(640, 210);
    ctx.lineTo(640, 450);
    ctx.lineTo(1050, 450);
    ctx.lineTo(1050, 220);
    ctx.lineTo(1080, 220);
    ctx.stroke();
    drawArrow(1078, 220, 1080, 220, '#32CD32', 2);
    
    // ===== ALU -> MUX WB (opción 0) =====
    ctx.strokeStyle = '#DC143C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(970, 250);
    ctx.lineTo(1300, 250);
    ctx.lineTo(1300, 230);
    ctx.lineTo(1320, 230);
    ctx.stroke();
    drawArrow(1318, 230, 1320, 230, '#DC143C', 2);
    
    // ===== Data Memory -> MUX WB (opción 1) =====
    ctx.strokeStyle = '#9370DB';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(1220, 220);
    ctx.lineTo(1280, 220);
    ctx.lineTo(1280, 270);
    ctx.lineTo(1320, 270);
    ctx.stroke();
    drawArrow(1318, 270, 1320, 270, '#9370DB', 3);
    
    // ===== MUX WB -> Register File (write back - wd) =====
    ctx.strokeStyle = '#9370DB';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(1370, 250);
    ctx.lineTo(1430, 250);
    ctx.lineTo(1430, 60);
    ctx.lineTo(510, 60);
    ctx.lineTo(510, 120);
    ctx.stroke();
    drawArrow(510, 118, 510, 120, '#9370DB', 3);
    
    // ===== SEÑALES DE CONTROL (líneas punteadas) =====
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    
    // Control -> Register File (RegWrite + we)
    ctx.strokeStyle = '#999';
    ctx.beginPath();
    ctx.moveTo(540, 600);
    ctx.lineTo(540, 500);
    ctx.lineTo(530, 500);
    ctx.lineTo(530, 320);
    ctx.stroke();
    drawArrow(530, 322, 530, 320, '#999', 1.5);
    
    // Control -> MUX ALU (ALUSrc)
    ctx.beginPath();
    ctx.moveTo(600, 600);
    ctx.lineTo(600, 550);
    ctx.lineTo(725, 550);
    ctx.lineTo(725, 300);
    ctx.stroke();
    drawArrow(725, 302, 725, 300, '#999', 1.5);
    
    // Control -> Data Memory (MemWrite, MemRead)
    ctx.beginPath();
    ctx.moveTo(660, 600);
    ctx.lineTo(660, 550);
    ctx.lineTo(1150, 550);
    ctx.lineTo(1150, 320);
    ctx.stroke();
    drawArrow(1150, 322, 1150, 320, '#999', 1.5);
    
    // Control -> MUX WB (MemToReg)
    ctx.beginPath();
    ctx.moveTo(720, 630);
    ctx.lineTo(1345, 630);
    ctx.lineTo(1345, 300);
    ctx.stroke();
    drawArrow(1345, 302, 1345, 300, '#999', 1.5);
    
    // Control -> ALU Control (ALUOp)
    ctx.beginPath();
    ctx.moveTo(750, 650);
    ctx.lineTo(880, 650);
    ctx.stroke();
    drawArrow(878, 650, 880, 650, '#999', 1.5);
    
    // ALU Control -> ALU
    ctx.beginPath();
    ctx.moveTo(910, 600);
    ctx.lineTo(910, 320);
    ctx.stroke();
    drawArrow(910, 322, 910, 320, '#999', 1.5);
    
    // Control -> MUX PC (Branch)
    ctx.beginPath();
    ctx.moveTo(500, 650);
    ctx.lineTo(200, 650);
    ctx.lineTo(200, 580);
    ctx.lineTo(85, 580);
    ctx.lineTo(85, 410);
    ctx.stroke();
    drawArrow(85, 412, 85, 410, '#999', 1.5);
    
    // ===== Branch Adder connections =====
    ctx.setLineDash([]);
    
    // Imm Gen -> Branch Adder
    ctx.strokeStyle = '#FF8C00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(280, 420);
    ctx.lineTo(280, 480);
    ctx.lineTo(85, 480);
    ctx.lineTo(85, 500);
    ctx.stroke();
    drawArrow(85, 498, 85, 500, '#FF8C00', 2);
    
    // PC -> Branch Adder
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(85, 260);
    ctx.lineTo(100, 260);
    ctx.lineTo(100, 470);
    ctx.lineTo(95, 470);
    ctx.lineTo(95, 500);
    ctx.stroke();
    drawArrow(95, 498, 95, 500, '#666', 2);
    
    // Branch Adder -> MUX PC
    ctx.beginPath();
    ctx.moveTo(95, 550);
    ctx.lineTo(95, 580);
    ctx.lineTo(85, 580);
    ctx.lineTo(85, 410);
    ctx.stroke();
    drawArrow(85, 412, 85, 410, '#666', 2);
}

// ============================================
// FUNCIÓN PRINCIPAL DE DIBUJO
// ============================================

function drawProcessor() {
    // Fondo
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Título
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PROCESADOR RISC-V MONOCICLO - DATAPATH', canvas.width / 2, 35);
    
    // Dibujar conexiones primero
    drawConnections();
    
    // Dibujar componentes
    for (let key in components) {
        const comp = components[key];
        const isHov = hoveredComponent === key;
        const isSel = selectedComponent === key;
        
        if (comp.type === 'mux') drawMux(comp, isHov, isSel);
        else if (comp.type === 'memory') drawMemory(comp, isHov, isSel);
        else if (comp.type === 'regfile') drawRegFile(comp, isHov, isSel);
        else if (comp.type === 'alu') drawALU(comp, isHov, isSel);
        else if (comp.type === 'control') drawControl(comp, isHov, isSel);
        else drawRect(comp, isHov, isSel);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

function isPointInComponent(x, y, comp) {
    return x >= comp.x && x <= comp.x + comp.width && 
           y >= comp.y && y <= comp.y + comp.height;
}

function updateInfoBox() {
    if (selectedComponent) {
        const comp = components[selectedComponent];
        const info = componentInfo[selectedComponent];
        infoBox.className = 'info-box selected';
        infoBox.innerHTML = `<h3>${comp.label.replace('\n', ' ')}</h3><p style="white-space: pre-line;">${info}</p>`;
    } else {
        infoBox.className = 'info-box default';
        infoBox.innerHTML = '<p>Haz clic en cualquier componente para ver su descripción detallada</p>';
    }
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let found = null;
    for (let key in components) {
        if (isPointInComponent(x, y, components[key])) {
            found = key;
            break;
        }
    }
    
    if (found !== hoveredComponent) {
        hoveredComponent = found;
        canvas.style.cursor = found ? 'pointer' : 'default';
        drawProcessor();
    }
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let found = null;
    for (let key in components) {
        if (isPointInComponent(x, y, components[key])) {
            found = key;
            break;
        }
    }
    
    selectedComponent = found;
    updateInfoBox();
    drawProcessor();
});

// ============================================
// CÓDIGO DEL SIMULADOR
// ============================================
const processor = {
    registers: Array(32).fill(0),
    memory: Array(256).fill(0),
    pc: 0,
    instructions: ['addi x1, x0, 10', 'addi x2, x0, 20', 'add x3, x1, x2', 'sub x4, x2, x1'],
    controlSignals: {
        RegWrite: false, ALUSrc: false, MemWrite: false,
        MemRead: false, MemToReg: false, Branch: false, ALUOp: '00'
    },
    internals: {
        instruction: '', opcode: 0, rd: 0, rs1: 0, rs2: 0,
        funct3: 0, funct7: 0, imm: 0, aluResult: 0,
        readData1: 0, readData2: 0, memData: 0
    },
    executionLog: [],
    isRunning: false
};

function parseInstruction(instrText) {
    const parts = instrText.trim().toLowerCase().replace(/,/g, '').split(/\s+/);
    const opcode = parts[0];
    const regs = parts.slice(1).map(r => r.startsWith('x') ? parseInt(r.substring(1)) : parseInt(r));
    return { opcode, regs };
}

function getOpcodeValue(mnemonic) {
    const opcodes = {
        'add': 0b0110011, 'sub': 0b0110011, 'and': 0b0110011, 'or': 0b0110011, 'xor': 0b0110011,
        'slt': 0b0110011, 'sltu': 0b0110011, 'sll': 0b0110011, 'srl': 0b0110011, 'sra': 0b0110011,
        'addi': 0b0010011, 'andi': 0b0010011, 'ori': 0b0010011, 'xori': 0b0010011,
        'slti': 0b0010011, 'sltiu': 0b0010011, 'slli': 0b0010011, 'srli': 0b0010011, 'srai': 0b0010011,
        'lw': 0b0000011, 'lh': 0b0000011, 'lb': 0b0000011, 'lhu': 0b0000011, 'lbu': 0b0000011,
        'sw': 0b0100011, 'sh': 0b0100011, 'sb': 0b0100011,
        'beq': 0b1100011, 'bne': 0b1100011, 'blt': 0b1100011, 'bge': 0b1100011,
        'bltu': 0b1100011, 'bgeu': 0b1100011
    };
    return opcodes[mnemonic] || 0;
}

function getFunct3(mnemonic) {
    const funct3Map = {
        'add': 0b000, 'sub': 0b000, 'sll': 0b001, 'slt': 0b010, 'sltu': 0b011,
        'xor': 0b100, 'srl': 0b101, 'sra': 0b101, 'or': 0b110, 'and': 0b111,
        'addi': 0b000, 'slti': 0b010, 'sltiu': 0b011, 'xori': 0b100, 'ori': 0b110,
        'andi': 0b111, 'slli': 0b001, 'srli': 0b101, 'srai': 0b101,
        'lb': 0b000, 'lh': 0b001, 'lw': 0b010, 'lbu': 0b100, 'lhu': 0b101,
        'sb': 0b000, 'sh': 0b001, 'sw': 0b010,
        'beq': 0b000, 'bne': 0b001, 'blt': 0b100, 'bge': 0b101, 'bltu': 0b110, 'bgeu': 0b111
    };
    return funct3Map[mnemonic] || 0;
}

function getFunct7(mnemonic) {
    return ['sub', 'sra', 'srai'].includes(mnemonic) ? 0b0100000 : 0b0000000;
}

function executeALU(op, a, b, funct3, funct7) {
    a = a | 0;
    b = b | 0;
    switch (funct3) {
        case 0b000: return funct7 === 0b0100000 ? a - b : a + b;
        case 0b001: return a << (b & 0x1F);
        case 0b010: return a < b ? 1 : 0;
        case 0b011: return (a >>> 0) < (b >>> 0) ? 1 : 0;
        case 0b100: return a ^ b;
        case 0b101: return funct7 === 0b0100000 ? a >> (b & 0x1F) : a >>> (b & 0x1F);
        case 0b110: return a | b;
        case 0b111: return a & b;
        default: return 0;
    }
}

function executeInstruction() {
    if (processor.pc >= processor.instructions.length) {
        addToLog('⚠ Fin del programa');
        processor.isRunning = false;
        updateUI();
        return;
    }
    const instrText = processor.instructions[processor.pc];
    const { opcode: mnemonic, regs } = parseInstruction(instrText);
    const opcodeValue = getOpcodeValue(mnemonic);
    const funct3 = getFunct3(mnemonic);
    const funct7 = getFunct7(mnemonic);
    let aluResult = 0;
    let logMessage = '';
    let newPC = processor.pc + 1;
    const isRType = opcodeValue === 0b0110011;
    const isIType = opcodeValue === 0b0010011;
    const isLoad = opcodeValue === 0b0000011;
    const isStore = opcodeValue === 0b0100011;
    const isBranch = opcodeValue === 0b1100011;
    if (isRType) {
        const [rd, rs1, rs2] = regs;
        const val1 = processor.registers[rs1];
        const val2 = processor.registers[rs2];
        aluResult = executeALU(mnemonic, val1, val2, funct3, funct7);
        if (rd !== 0) processor.registers[rd] = aluResult;
        logMessage = `${mnemonic.toUpperCase()} x${rd}, x${rs1}, x${rs2} → x${rd} = ${aluResult}`;
        processor.controlSignals = {
            RegWrite: true, ALUSrc: false, MemWrite: false,
            MemRead: false, MemToReg: false, Branch: false, ALUOp: '10'
        };
        processor.internals.readData1 = val1;
        processor.internals.readData2 = val2;
        processor.internals.aluResult = aluResult;
    } else if (isIType) {
        const [rd, rs1, imm] = regs;
        const val1 = processor.registers[rs1];
        aluResult = executeALU(mnemonic, val1, imm, funct3, funct7);
        if (rd !== 0) processor.registers[rd] = aluResult;
        logMessage = `${mnemonic.toUpperCase()} x${rd}, x${rs1}, ${imm} → x${rd} = ${aluResult}`;
        processor.controlSignals = {
            RegWrite: true, ALUSrc: true, MemWrite: false,
            MemRead: false, MemToReg: false, Branch: false, ALUOp: '10'
        };
        processor.internals.readData1 = val1;
        processor.internals.readData2 = imm;
        processor.internals.imm = imm;
        processor.internals.aluResult = aluResult;
    } else if (isLoad) {
        const [rd, rs1, offset = 0] = regs;
        const addr = processor.registers[rs1] + offset;
        const memIndex = Math.floor(addr / 4) % 256;
        const memValue = processor.memory[memIndex];
        if (rd !== 0) processor.registers[rd] = memValue;
        logMessage = `${mnemonic.toUpperCase()} x${rd}, ${offset}(x${rs1}) → x${rd} = MEM[${addr}] = ${memValue}`;
        processor.controlSignals = {
            RegWrite: true, ALUSrc: true, MemWrite: false,
            MemRead: true, MemToReg: true, Branch: false, ALUOp: '00'
        };
        processor.internals.readData1 = processor.registers[rs1];
        processor.internals.imm = offset;
        processor.internals.aluResult = addr;
        processor.internals.memData = memValue;
    } else if (isStore) {
        const [rs2, rs1, offset = 0] = regs;
        const addr = processor.registers[rs1] + offset;
        const memIndex = Math.floor(addr / 4) % 256;
        processor.memory[memIndex] = processor.registers[rs2];
        logMessage = `${mnemonic.toUpperCase()} x${rs2}, ${offset}(x${rs1}) → MEM[${addr}] = ${processor.registers[rs2]}`;
        processor.controlSignals = {
            RegWrite: false, ALUSrc: true, MemWrite: true,
            MemRead: false, MemToReg: false, Branch: false, ALUOp: '00'
        };
        processor.internals.readData1 = processor.registers[rs1];
        processor.internals.readData2 = processor.registers[rs2];
        processor.internals.imm = offset;
        processor.internals.aluResult = addr;
    } else if (isBranch) {
        const [rs1, rs2, offset = 1] = regs;
        const val1 = processor.registers[rs1];
        const val2 = processor.registers[rs2];
        let takeBranch = false;
        switch (funct3) {
            case 0b000: takeBranch = val1 === val2; break;
            case 0b001: takeBranch = val1 !== val2; break;
            case 0b100: takeBranch = val1 < val2; break;
            case 0b101: takeBranch = val1 >= val2; break;
            case 0b110: takeBranch = (val1 >>> 0) < (val2 >>> 0); break;
            case 0b111: takeBranch = (val1 >>> 0) >= (val2 >>> 0); break;
        }
        if (takeBranch) {
            newPC = processor.pc + offset;
            logMessage = `${mnemonic.toUpperCase()} x${rs1}, x${rs2}, ${offset} → SALTO TOMADO (PC = ${newPC})`;
        } else {
            logMessage = `${mnemonic.toUpperCase()} x${rs1}, x${rs2}, ${offset} → SALTO NO TOMADO`;
        }
        processor.controlSignals = {
            RegWrite: false, ALUSrc: false, MemWrite: false,
            MemRead: false, MemToReg: false, Branch: true, ALUOp: '01'
        };
        processor.internals.readData1 = val1;
        processor.internals.readData2 = val2;
        processor.internals.imm = offset;
    }
    processor.pc = newPC;
    addToLog(`[${processor.pc - 1}] ${logMessage}`);
    updateUI();
}

function stepExecution() {
    if (processor.pc < processor.instructions.length) executeInstruction();
}

function runProgram() {
    processor.isRunning = true;
    const runInterval = setInterval(() => {
        if (processor.pc < processor.instructions.length && processor.isRunning) {
            executeInstruction();
        } else {
            processor.isRunning = false;
            clearInterval(runInterval);
            updateUI();
        }
    }, 500);
}

function resetProcessor() {
    processor.registers = Array(32).fill(0);
    processor.memory = Array(256).fill(0);
    processor.pc = 0;
    processor.executionLog = [];
    processor.isRunning = false;
    processor.controlSignals = {
        RegWrite: false, ALUSrc: false, MemWrite: false,
        MemRead: false, MemToReg: false, Branch: false, ALUOp: '00'
    };
    processor.internals = {
        instruction: '', opcode: 0, rd: 0, rs1: 0, rs2: 0,
        funct3: 0, funct7: 0, imm: 0, aluResult: 0,
        readData1: 0, readData2: 0, memData: 0
    };
    updateUI();
}

function addInstruction(instruction) {
    if (instruction.trim()) {
        processor.instructions.push(instruction.trim());
        updateInstructionList();
    }
}

function addMultipleInstructions(instructionsText) {
    if (!instructionsText.trim()) return;
    
    // Separar por líneas y filtrar líneas vacías
    const lines = instructionsText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#') && !line.startsWith('//'));
    
    // Agregar cada instrucción válida
    lines.forEach(line => {
        if (line) {
            processor.instructions.push(line);
        }
    });
    
    updateInstructionList();
    addToLog(`✓ Se agregaron ${lines.length} instrucciones`);
}

function clearAllInstructions() {
    processor.instructions = [];
    processor.pc = 0;
    updateInstructionList();
    updateUI();
    addToLog('🗑️ Todas las instrucciones fueron eliminadas');
}

function deleteInstruction(index) {
    processor.instructions.splice(index, 1);
    if (processor.pc >= processor.instructions.length) processor.pc = 0;
    updateInstructionList();
    updateUI();
}

function addToLog(message) {
    processor.executionLog.push(message);
    updateExecutionLog();
}

// ============================================
// FUNCIONES PARA EDITAR REGISTROS Y MEMORIA
// ============================================
function updateRegisterValue(index, value) {
    if (index === 0) return; // x0 no se puede modificar
    const numValue = parseInt(value) || 0;
    processor.registers[index] = numValue;
    updateUI();
}

function updateMemoryValue(index, value) {
    const numValue = parseInt(value) || 0;
    processor.memory[index] = numValue;
    updateUI();
}

// ============================================
// FUNCIONES DE ACTUALIZACIÓN DE UI
// ============================================
function updateUI() {
    updateRegisterBank();
    updateMemoryBank();
    updateControlSignals();
    updateALU();
    updatePCInfo();
    updateInstructionList();
}

function updateInstructionList() {
    const listContainer = document.getElementById('instructionList');
    listContainer.innerHTML = '';
    processor.instructions.forEach((instr, index) => {
        const item = document.createElement('div');
        item.className = 'instruction-item' + (index === processor.pc ? ' active' : '');
        item.innerHTML = `
            <span class="instruction-index">${index}:</span>
            <span class="instruction-text">${instr}</span>
            <button class="delete-btn" onclick="deleteInstruction(${index})">🗑️</button>
        `;
        listContainer.appendChild(item);
    });
}

function updateRegisterBank() {
    const container = document.getElementById('registerBank');
    container.innerHTML = '';
    processor.registers.forEach((value, index) => {
        const regDiv = document.createElement('div');
        let className = 'register ';
        if (index === 0) className += 'zero';
        else if (value !== 0) className += 'active';
        else className += 'inactive';
        regDiv.className = className;
        
        if (index === 0) {
            // x0 siempre es 0 y no se puede editar
            regDiv.innerHTML = `
                <div class="register-name">x${index}</div>
                <div class="register-value">${value}</div>
            `;
        } else {
            // Registros editables
            regDiv.innerHTML = `
                <div class="register-name">x${index}</div>
                <input type="number" class="register-value-input" value="${value}" 
                       onchange="updateRegisterValue(${index}, this.value)" 
                       onclick="this.select()">
            `;
        }
        container.appendChild(regDiv);
    });
}

function updateMemoryBank() {
    const container = document.getElementById('memoryBank');
    container.innerHTML = '';
    for (let i = 0; i < 32; i++) {
        const value = processor.memory[i];
        const memDiv = document.createElement('div');
        memDiv.className = 'memory-cell ' + (value !== 0 ? 'active' : 'inactive');
        memDiv.innerHTML = `
            <div class="memory-address">[${i * 4}]</div>
            <input type="number" class="memory-value-input" value="${value}" 
                   onchange="updateMemoryValue(${i}, this.value)" 
                   onclick="this.select()">
        `;
        container.appendChild(memDiv);
    }
}

function updateControlSignals() {
    const container = document.getElementById('controlSignals');
    container.innerHTML = '';
    Object.entries(processor.controlSignals).forEach(([signal, value]) => {
        const signalDiv = document.createElement('div');
        signalDiv.className = 'control-signal ' + (value ? 'active' : 'inactive');
        signalDiv.innerHTML = `
            <div class="signal-name">${signal}</div>
            <div class="signal-value">${value.toString()}</div>
        `;
        container.appendChild(signalDiv);
    });
}

function updateALU() {
    document.getElementById('aluOperandA').textContent = processor.internals.readData1;
    document.getElementById('aluOperandB').textContent = processor.internals.readData2 || processor.internals.imm;
    document.getElementById('aluResult').textContent = processor.internals.aluResult;
}

function updatePCInfo() {
    document.getElementById('pcValue').textContent = processor.pc;
    document.getElementById('currentInstruction').textContent = 
        processor.pc < processor.instructions.length ? processor.instructions[processor.pc] : 'N/A';
}

function updateExecutionLog() {
    const logContainer = document.getElementById('executionLog');
    if (processor.executionLog.length === 0) {
        logContainer.innerHTML = '<div class="log-empty">No hay ejecuciones todavía...</div>';
    } else {
        logContainer.innerHTML = processor.executionLog.map(entry => `<div class="log-entry">${entry}</div>`).join('');
        logContainer.scrollTop = logContainer.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('stepBtn').addEventListener('click', stepExecution);
    document.getElementById('runBtn').addEventListener('click', runProgram);
    document.getElementById('resetBtn').addEventListener('click', resetProcessor);
    
    document.getElementById('addInstructionBtn').addEventListener('click', () => {
        const input = document.getElementById('newInstructionInput');
        addInstruction(input.value);
        input.value = '';
    });
    
    document.getElementById('newInstructionInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const input = document.getElementById('newInstructionInput');
            addInstruction(input.value);
            input.value = '';
        }
    });
    
    // Botón para cargar múltiples instrucciones
    document.getElementById('loadMultipleBtn').addEventListener('click', () => {
        const modal = document.getElementById('multipleInstructionsModal');
        modal.style.display = 'flex';
    });
    
    document.getElementById('closeModalBtn').addEventListener('click', () => {
        const modal = document.getElementById('multipleInstructionsModal');
        modal.style.display = 'none';
    });
    
    document.getElementById('addMultipleBtn').addEventListener('click', () => {
        const textarea = document.getElementById('multipleInstructionsText');
        addMultipleInstructions(textarea.value);
        textarea.value = '';
        document.getElementById('multipleInstructionsModal').style.display = 'none';
    });
    
    document.getElementById('clearAllBtn').addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres eliminar todas las instrucciones?')) {
            clearAllInstructions();
        }
    });
    
    updateUI();
});

// ============================================
// SISTEMA DE ANIMACIÓN DEL DIAGRAMA
// Agregar después de todo el código existente
// ============================================

// Configuración de animación
const animationConfig = {
    duration: 800,
    pulseSpeed: 50,
    dataFlowSpeed: 30,
    highlightDuration: 1500
};

// Estado de animación
const animationState = {
    activeComponents: new Set(),
    activeBuses: [],
    dataFlowing: [],
    currentStep: 0,
    isAnimating: false
};

// ============================================
// FUNCIÓN PRINCIPAL: ANIMAR EJECUCIÓN
// ============================================
function animateInstructionExecution(instrText, processorState) {
    if (!document.getElementById('viewDiagram').classList.contains('active')) {
        return;
    }

    animationState.isAnimating = true;
    animationState.activeComponents.clear();
    animationState.activeBuses = [];
    animationState.dataFlowing = [];
    
    const { opcode, regs } = parseInstruction(instrText);
    const opcodeValue = getOpcodeValue(opcode);
    
    const isRType = opcodeValue === 0b0110011;
    const isIType = opcodeValue === 0b0010011;
    const isLoad = opcodeValue === 0b0000011;
    const isStore = opcodeValue === 0b0100011;
    const isBranch = opcodeValue === 0b1100011;
    
    let animationSequence = [];
    
    if (isRType) {
        animationSequence = getRTypeAnimationSequence(regs, processorState);
    } else if (isIType) {
        animationSequence = getITypeAnimationSequence(regs, processorState);
    } else if (isLoad) {
        animationSequence = getLoadAnimationSequence(regs, processorState);
    } else if (isStore) {
        animationSequence = getStoreAnimationSequence(regs, processorState);
    } else if (isBranch) {
        animationSequence = getBranchAnimationSequence(regs, processorState);
    }
    
    executeAnimationSequence(animationSequence);
}

// ============================================
// SECUENCIAS DE ANIMACIÓN
// ============================================

function getRTypeAnimationSequence(regs, state) {
    const [rd, rs1, rs2] = regs;
    return [
        {
            step: 1,
            description: `Fetch: Leer instrucción desde PC=${state.pc}`,
            components: ['pc', 'instMem'],
            buses: [
                { from: 'pc', to: 'instMem', color: '#4A90E2', label: `PC=${state.pc}` }
            ],
            delay: 500
        },
        {
            step: 2,
            description: `Decode: Extraer rs1=x${rs1}, rs2=x${rs2}, rd=x${rd}`,
            components: ['instMem', 'controlUnit', 'regFile'],
            buses: [
                { from: 'instMem', to: 'controlUnit', color: '#00BFFF', label: 'opcode' },
                { from: 'instMem', to: 'regFile', color: '#32CD32', label: `rs1=x${rs1}` }
            ],
            delay: 600
        },
        {
            step: 3,
            description: `Read: x${rs1}=${state.registers[rs1]}, x${rs2}=${state.registers[rs2]}`,
            components: ['regFile', 'alu'],
            buses: [
                { from: 'regFile', to: 'alu', color: '#32CD32', label: `${state.registers[rs1]}` }
            ],
            delay: 600
        },
        {
            step: 4,
            description: `Execute: ALU calcula resultado = ${state.internals.aluResult}`,
            components: ['alu', 'aluControl'],
            delay: 700
        },
        {
            step: 5,
            description: `Write Back: x${rd} = ${state.internals.aluResult}`,
            components: ['alu', 'muxWB', 'regFile'],
            buses: [
                { from: 'alu', to: 'muxWB', color: '#DC143C', label: `${state.internals.aluResult}` },
                { from: 'muxWB', to: 'regFile', color: '#9370DB', label: `${state.internals.aluResult}` }
            ],
            delay: 600
        }
    ];
}

function getITypeAnimationSequence(regs, state) {
    const [rd, rs1, imm] = regs;
    return [
        {
            step: 1,
            description: `Fetch: Leer instrucción desde PC=${state.pc}`,
            components: ['pc', 'instMem'],
            buses: [{ from: 'pc', to: 'instMem', color: '#4A90E2', label: `PC=${state.pc}` }],
            delay: 500
        },
        {
            step: 2,
            description: `Decode & Generate Immediate: imm=${imm}`,
            components: ['instMem', 'controlUnit', 'immGen', 'regFile'],
            buses: [
                { from: 'instMem', to: 'immGen', color: '#FF8C00', label: `imm=${imm}` }
            ],
            delay: 600
        },
        {
            step: 3,
            description: `Read: x${rs1}=${state.registers[rs1]}`,
            components: ['regFile', 'alu', 'immGen', 'muxALU'],
            buses: [
                { from: 'regFile', to: 'alu', color: '#32CD32', label: `${state.registers[rs1]}` },
                { from: 'immGen', to: 'muxALU', color: '#FF8C00', label: `${imm}` }
            ],
            delay: 600
        },
        {
            step: 4,
            description: `Execute: ${state.registers[rs1]} + ${imm} = ${state.internals.aluResult}`,
            components: ['alu', 'aluControl'],
            delay: 700
        },
        {
            step: 5,
            description: `Write Back: x${rd} = ${state.internals.aluResult}`,
            components: ['alu', 'muxWB', 'regFile'],
            buses: [
                { from: 'alu', to: 'muxWB', color: '#DC143C', label: `${state.internals.aluResult}` },
                { from: 'muxWB', to: 'regFile', color: '#9370DB', label: `${state.internals.aluResult}` }
            ],
            delay: 600
        }
    ];
}

function getLoadAnimationSequence(regs, state) {
    const [rd, rs1, offset] = regs;
    const addr = state.internals.aluResult;
    return [
        {
            step: 1,
            description: `Fetch: Leer instrucción`,
            components: ['pc', 'instMem'],
            buses: [{ from: 'pc', to: 'instMem', color: '#4A90E2', label: `PC=${state.pc}` }],
            delay: 500
        },
        {
            step: 2,
            description: `Calculate Address: ${state.registers[rs1]} + ${offset} = ${addr}`,
            components: ['regFile', 'immGen', 'muxALU', 'alu'],
            buses: [
                { from: 'regFile', to: 'alu', color: '#32CD32', label: `${state.registers[rs1]}` },
                { from: 'immGen', to: 'muxALU', color: '#FF8C00', label: `${offset}` }
            ],
            delay: 700
        },
        {
            step: 3,
            description: `Memory Read: MEM[${addr}] = ${state.internals.memData}`,
            components: ['alu', 'dataMem'],
            buses: [{ from: 'alu', to: 'dataMem', color: '#DC143C', label: `addr=${addr}` }],
            delay: 700
        },
        {
            step: 4,
            description: `Write Back: x${rd} = ${state.internals.memData}`,
            components: ['dataMem', 'muxWB', 'regFile'],
            buses: [
                { from: 'dataMem', to: 'muxWB', color: '#9370DB', label: `${state.internals.memData}` },
                { from: 'muxWB', to: 'regFile', color: '#9370DB', label: `${state.internals.memData}` }
            ],
            delay: 600
        }
    ];
}

function getStoreAnimationSequence(regs, state) {
    const [rs2, rs1, offset] = regs;
    const addr = state.internals.aluResult;
    return [
        {
            step: 1,
            description: `Fetch: Leer instrucción`,
            components: ['pc', 'instMem'],
            buses: [{ from: 'pc', to: 'instMem', color: '#4A90E2', label: `PC=${state.pc}` }],
            delay: 500
        },
        {
            step: 2,
            description: `Calculate Address: ${state.registers[rs1]} + ${offset} = ${addr}`,
            components: ['regFile', 'immGen', 'alu'],
            buses: [{ from: 'regFile', to: 'alu', color: '#32CD32', label: `${state.registers[rs1]}` }],
            delay: 700
        },
        {
            step: 3,
            description: `Memory Write: MEM[${addr}] = ${state.registers[rs2]}`,
            components: ['regFile', 'dataMem'],
            buses: [{ from: 'regFile', to: 'dataMem', color: '#32CD32', label: `${state.registers[rs2]}` }],
            delay: 700
        }
    ];
}

function getBranchAnimationSequence(regs, state) {
    const [rs1, rs2, offset] = regs;
    const taken = state.pc !== (state.oldPC || state.pc - 1) + 1;
    return [
        {
            step: 1,
            description: `Fetch: Leer instrucción`,
            components: ['pc', 'instMem'],
            delay: 500
        },
        {
            step: 2,
            description: `Compare: x${rs1}=${state.registers[rs1]} vs x${rs2}=${state.registers[rs2]}`,
            components: ['regFile', 'alu'],
            delay: 700
        },
        {
            step: 3,
            description: taken ? `✓ BRANCH TAKEN → PC=${state.pc}` : `✗ NOT TAKEN → PC=${state.pc}`,
            components: taken ? ['adderBranch', 'muxPC', 'pc'] : ['adderPC4', 'muxPC', 'pc'],
            delay: 600
        }
    ];
}

// ============================================
// EJECUTAR SECUENCIA
// ============================================
function executeAnimationSequence(sequence) {
    let currentIndex = 0;
    
    function executeNextStep() {
        if (currentIndex >= sequence.length) {
            setTimeout(() => {
                animationState.isAnimating = false;
                animationState.activeComponents.clear();
                animationState.activeBuses = [];
                drawProcessor();
            }, 800);
            return;
        }
        
        const step = sequence[currentIndex];
        
        updateStepDescription(step.description);
        
        animationState.activeComponents.clear();
        step.components.forEach(comp => animationState.activeComponents.add(comp));
        
        animationState.activeBuses = step.buses || [];
        
        if (step.buses) {
            animateDataFlow(step.buses);
        }
        
        drawProcessor();
        
        currentIndex++;
        setTimeout(executeNextStep, step.delay || 600);
    }
    
    executeNextStep();
}

// ============================================
// ANIMACIÓN DE FLUJO DE DATOS
// ============================================
function animateDataFlow(buses) {
    buses.forEach((bus, index) => {
        setTimeout(() => {
            const fromComp = components[bus.from];
            const toComp = components[bus.to];
            
            if (!fromComp || !toComp) return;
            
            const fromX = fromComp.x + fromComp.width / 2;
            const fromY = fromComp.y + fromComp.height / 2;
            const toX = toComp.x + toComp.width / 2;
            const toY = toComp.y + toComp.height / 2;
            
            animationState.dataFlowing.push({
                fromX, fromY, toX, toY,
                currentX: fromX,
                currentY: fromY,
                color: bus.color,
                label: bus.label,
                progress: 0,
                speed: 0.05
            });
            
            animateParticle(animationState.dataFlowing.length - 1);
        }, index * 200);
    });
}

function animateParticle(index) {
    const particle = animationState.dataFlowing[index];
    if (!particle || particle.progress >= 1) return;
    
    particle.progress += particle.speed;
    particle.currentX = particle.fromX + (particle.toX - particle.fromX) * particle.progress;
    particle.currentY = particle.fromY + (particle.toY - particle.fromY) * particle.progress;
    
    drawProcessor();
    
    if (particle.progress < 1) {
        requestAnimationFrame(() => animateParticle(index));
    } else {
        setTimeout(() => {
            animationState.dataFlowing.splice(index, 1);
            drawProcessor();
        }, 300);
    }
}

// ============================================
// ACTUALIZAR DESCRIPCIÓN
// ============================================
function updateStepDescription(description) {
    const existingBox = document.querySelector('.step-description-box');
    if (existingBox) existingBox.remove();
    
    const box = document.createElement('div');
    box.className = 'step-description-box';
    box.innerHTML = `<strong>🔄</strong> ${description}`;
    box.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 30px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        font-size: 16px;
        z-index: 10000;
        animation: slideDown 0.3s ease;
        max-width: 80%;
        text-align: center;
    `;
    document.body.appendChild(box);
}

// ============================================
// SOBRESCRIBIR drawProcessor PARA INCLUIR ANIMACIONES
// ============================================
const originalDrawProcessor = drawProcessor;
drawProcessor = function() {
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PROCESADOR RISC-V MONOCICLO - DATAPATH', canvas.width / 2, 35);
    
    if (animationState.isAnimating) {
        ctx.globalAlpha = 0.3;
    }
    drawConnections();
    ctx.globalAlpha = 1.0;
    
    // Dibujar buses activos con brillo
    animationState.activeBuses.forEach(bus => {
        const fromComp = components[bus.from];
        const toComp = components[bus.to];
        if (!fromComp || !toComp) return;
        
        const fromX = fromComp.x + fromComp.width / 2;
        const fromY = fromComp.y + fromComp.height / 2;
        const toX = toComp.x + toComp.width / 2;
        const toY = toComp.y + toComp.height / 2;
        
        ctx.strokeStyle = bus.color;
        ctx.lineWidth = 5;
        ctx.shadowColor = bus.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
        ctx.shadowBlur = 0;
    });
    
    // Dibujar componentes
    for (let key in components) {
        const comp = components[key];
        const isHov = hoveredComponent === key;
        const isSel = selectedComponent === key;
        const isActive = animationState.activeComponents.has(key);
        
        // Modificar funciones de dibujo para aceptar isActive
        const originalColor = comp.color;
        if (isActive) {
            comp.color = '#FFFFE0'; // Color más brillante cuando está activo
            ctx.shadowColor = '#00FF00';
            ctx.shadowBlur = 20;
        }
        
        if (comp.type === 'mux') drawMux(comp, isHov, isSel);
        else if (comp.type === 'memory') drawMemory(comp, isHov, isSel);
        else if (comp.type === 'regfile') drawRegFile(comp, isHov, isSel);
        else if (comp.type === 'alu') drawALU(comp, isHov, isSel);
        else if (comp.type === 'control') drawControl(comp, isHov, isSel);
        else drawRect(comp, isHov, isSel);
        
        ctx.shadowBlur = 0;
        comp.color = originalColor;
    }
    
    // Dibujar partículas de datos
    animationState.dataFlowing.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(particle.currentX, particle.currentY, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(particle.label, particle.currentX, particle.currentY);
    });
};

// ============================================
// MODIFICAR executeInstruction
// ============================================
const originalExecuteInstruction = executeInstruction;
executeInstruction = function() {
    const oldPC = processor.pc;
    originalExecuteInstruction();
    processor.oldPC = oldPC;
    
    if (document.getElementById('viewDiagram')?.classList.contains('active')) {
        const instrText = processor.instructions[oldPC];
        if (instrText) {
            animateInstructionExecution(instrText, processor);
        }
    }
};

// Agregar CSS de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translate(-50%, -20px);
            opacity: 0;
        }
        to {
            transform: translate(-50%, 0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

console.log('✅ Sistema de animación del diagrama cargado correctamente');

// ============================================
// PANEL DE CONTROL FLOTANTE PARA EL DIAGRAMA
// ============================================

function createDiagramControlPanel() {
    // Verificar si ya existe
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
            <!-- Información del PC -->
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
            
            <!-- Botones de Control -->
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
            
            <!-- Control de Velocidad -->
            <div class="panel-section">
                <h4>⚡ Velocidad de Animación</h4>
                <div class="speed-control-container">
                    <input type="range" id="diagramSpeedSlider" min="200" max="2000" value="800" step="100">
                    <div class="speed-labels">
                        <span>Rápido</span>
                        <span id="diagramSpeedValue">800ms</span>
                        <span>Lento</span>
                    </div>
                </div>
            </div>
            
            <!-- Registros Rápidos -->
            <div class="panel-section">
                <h4>📊 Registros (Quick View)</h4>
                <div id="diagramQuickRegs" class="quick-registers"></div>
            </div>
            
            <!-- Estado de Señales de Control -->
            <div class="panel-section collapsible">
                <h4 onclick="toggleSection('controlSignalsSection')">
                    🎛️ Señales de Control
                    <span class="toggle-icon">▼</span>
                </h4>
                <div id="controlSignalsSection" class="collapsible-content">
                    <div id="diagramControlSignals" class="control-signals-mini"></div>
                </div>
            </div>
            
            <!-- Botón para volver al simulador -->
            <div class="panel-section">
                <button id="backToSimulator" class="btn-control btn-back">
                    ← Volver al Simulador
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // Event Listeners
    setupDiagramControlListeners();
    
    // Actualizar información inicial
    updateDiagramControlPanel();
    
    // Mostrar/ocultar según la vista
    updatePanelVisibility();
}

// ============================================
// CONFIGURAR EVENT LISTENERS
// ============================================
function setupDiagramControlListeners() {
    // Botón de contraer/expandir
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
    
    // Botón Step
    document.getElementById('diagramStepBtn')?.addEventListener('click', () => {
        if (processor.pc < processor.instructions.length) {
            executeInstruction();
            updateDiagramControlPanel();
        } else {
            showNotification('⚠️ No hay más instrucciones', 'warning');
        }
    });
    
    // Botón Run
    let runIntervalId = null;
    document.getElementById('diagramRunBtn')?.addEventListener('click', () => {
        if (processor.isRunning) {
            // Pausar
            processor.isRunning = false;
            clearInterval(runIntervalId);
            document.getElementById('diagramRunBtn').style.display = 'inline-block';
            document.getElementById('diagramPauseBtn').style.display = 'none';
            showNotification('⏸️ Ejecución pausada', 'info');
            return;
        }
        
        processor.isRunning = true;
        document.getElementById('diagramRunBtn').style.display = 'none';
        document.getElementById('diagramPauseBtn').style.display = 'inline-block';
        
        const speed = parseInt(document.getElementById('diagramSpeedSlider').value) || 800;
        
        runIntervalId = setInterval(() => {
            if (processor.pc < processor.instructions.length && processor.isRunning) {
                executeInstruction();
                updateDiagramControlPanel();
            } else {
                processor.isRunning = false;
                clearInterval(runIntervalId);
                document.getElementById('diagramRunBtn').style.display = 'inline-block';
                document.getElementById('diagramPauseBtn').style.display = 'none';
                if (processor.pc >= processor.instructions.length) {
                    showNotification('✅ Programa completado', 'success');
                }
            }
        }, speed);
    });
    
    // Botón Pause
    document.getElementById('diagramPauseBtn')?.addEventListener('click', () => {
        processor.isRunning = false;
        document.getElementById('diagramRunBtn').style.display = 'inline-block';
        document.getElementById('diagramPauseBtn').style.display = 'none';
        showNotification('⏸️ Ejecución pausada', 'info');
    });
    
    // Botón Reset
    document.getElementById('diagramResetBtn')?.addEventListener('click', () => {
        if (confirm('¿Reiniciar el procesador?')) {
            resetProcessor();
            updateDiagramControlPanel();
            showNotification('🔄 Procesador reiniciado', 'info');
        }
    });
    
    // Control de velocidad
    document.getElementById('diagramSpeedSlider')?.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        animationConfig.duration = value;
        document.getElementById('diagramSpeedValue').textContent = value + 'ms';
    });
    
    // Botón volver al simulador
    document.getElementById('backToSimulator')?.addEventListener('click', () => {
        showView('simulator');
    });
}

// ============================================
// ACTUALIZAR PANEL DE CONTROL
// ============================================
function updateDiagramControlPanel() {
    // Actualizar PC
    document.getElementById('diagramPC').textContent = processor.pc;
    document.getElementById('diagramTotal').textContent = processor.instructions.length;
    
    // Actualizar instrucción actual
    const instrDisplay = document.getElementById('diagramCurrentInstr');
    if (processor.pc < processor.instructions.length) {
        instrDisplay.textContent = processor.instructions[processor.pc];
        instrDisplay.style.color = '#2d3748';
    } else {
        instrDisplay.textContent = 'Programa finalizado';
        instrDisplay.style.color = '#718096';
    }
    
    // Actualizar registros (mostrar solo los no-cero)
    updateQuickRegisters();
    
    // Actualizar señales de control
    updateQuickControlSignals();
}

// ============================================
// ACTUALIZAR VISTA RÁPIDA DE REGISTROS
// ============================================
function updateQuickRegisters() {
    const container = document.getElementById('diagramQuickRegs');
    if (!container) return;
    
    const nonZeroRegs = processor.registers
        .map((val, idx) => ({ idx, val }))
        .filter(r => r.val !== 0 && r.idx !== 0)
        .slice(0, 8); // Mostrar máximo 8
    
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

// ============================================
// ACTUALIZAR SEÑALES DE CONTROL
// ============================================
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

// ============================================
// MOSTRAR/OCULTAR PANEL SEGÚN VISTA
// ============================================
function updatePanelVisibility() {
    const panel = document.getElementById('diagramControlPanel');
    if (!panel) return;
    
    const isDiagramView = document.getElementById('viewDiagram')?.classList.contains('active');
    panel.style.display = isDiagramView ? 'block' : 'none';
}

// Modificar showView para actualizar visibilidad del panel
const originalShowView2 = showView;
showView = function(viewName) {
    originalShowView2(viewName);
    updatePanelVisibility();
    if (viewName === 'diagram') {
        updateDiagramControlPanel();
    }
};

// ============================================
// TOGGLE DE SECCIONES COLAPSABLES
// ============================================
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

// ============================================
// SISTEMA DE NOTIFICACIONES
// ============================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 20000;
        animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.5s forwards;
    `;
    
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

// ============================================
// CSS PARA EL PANEL DE CONTROL
// ============================================
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
    
    /* Responsive */
    @media (max-width: 768px) {
        .diagram-control-panel {
            width: calc(100% - 40px);
            right: 20px;
            left: 20px;
        }
    }
    
    /* Scrollbar personalizado */
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
    }
`;
document.head.appendChild(panelStyles);

// ============================================
// INICIALIZAR PANEL AL CARGAR
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        createDiagramControlPanel();
    }, 200);
});

// También crear el panel cuando cambiamos a la vista de diagrama por primera vez
const originalShowView3 = showView;
showView = function(viewName) {
    originalShowView3(viewName);
    if (viewName === 'diagram' && !document.getElementById('diagramControlPanel')) {
        createDiagramControlPanel();
    }
};

console.log('✅ Panel de control del diagrama cargado correctamente');