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

canvas.width = 1400;
canvas.height = 800;

// Componentes con el nuevo diseño
const components = {
    // Fila superior izquierda
    pc: { x: 30, y: 350, width: 60, height: 60, label: 'PC', color: '#999', type: 'rect' },
    
    // Sumador PC+4
    adderPC4: { x: 120, y: 460, width: 50, height: 50, label: '+', color: '#999', type: 'rect' },
    
    // Multiplexor PC (arriba izquierda)
    muxPC: { x: 120, y: 540, width: 40, height: 80, label: '', color: '#CCC', type: 'mux', 
             inputs: ['0', '1'], hasSelector: true },
    
    // Memoria de Programa (grande, arriba centro)
    instMem: { x: 220, y: 50, width: 200, height: 280, label: 'MEMORIA DE\nPROGRAMA', 
               color: '#999', type: 'memory' },
    
    // Multiplexores superiores (pequeños)
    muxTop1: { x: 450, y: 80, width: 35, height: 60, label: '', color: '#CCC', type: 'mux',
               inputs: ['0', '1'], hasSelector: false },
    muxTop2: { x: 450, y: 160, width: 35, height: 60, label: '', color: '#CCC', type: 'mux',
               inputs: ['0', '1'], hasSelector: false },
    
    // Sign Extend (arriba centro-derecha)
    signExtend: { x: 560, y: 220, width: 110, height: 50, label: 'SIGN EXTEND', 
                  color: '#999', type: 'rect' },
    
    // Banco de Registros (centro)
    regFile: { x: 490, y: 310, width: 180, height: 180, label: 'BANCO DE\nREGISTROS', 
               color: '#999', type: 'regfile' },
    
    // Multiplexor central (derecha del banco de registros)
    muxALU: { x: 700, y: 360, width: 35, height: 60, label: '', color: '#CCC', type: 'mux',
              inputs: ['0', '1'], hasSelector: false },
    
    // ALU (centro-derecha)
    alu: { x: 790, y: 330, width: 80, height: 120, label: 'ALU', color: '#999', type: 'alu' },
    
    // Memoria de Datos (derecha)
    dataMem: { x: 920, y: 240, width: 200, height: 280, label: 'MEMORIA DE\nDATOS', 
               color: '#999', type: 'memory' },
    
    // Multiplexor final (derecha)
    muxWB: { x: 1140, y: 360, width: 35, height: 60, label: '', color: '#CCC', type: 'mux',
             inputs: ['0', '1'], hasSelector: false },
    
    // Unidad de Control (abajo centro)
    controlUnit: { x: 720, y: 630, width: 220, height: 120, label: 'CU', 
                   color: '#999', type: 'control' },
    
    // Componentes de lógica (abajo izquierda)
    andGate: { x: 280, y: 680, width: 50, height: 40, label: 'AND', color: '#999', type: 'rect' },
    notGate: { x: 400, y: 700, width: 50, height: 40, label: 'NOT', color: '#999', type: 'rect' },
    
    // Multiplexor de branch (abajo izquierda)
    muxBranch: { x: 360, y: 660, width: 35, height: 60, label: '', color: '#CCC', type: 'mux',
                 inputs: ['0', '1'], hasSelector: false },
    
    // Orden y Sign Extend (abajo izquierda)
    ordenSignExtend: { x: 200, y: 470, width: 120, height: 50, label: 'ORDEN & SIGN\nEXTEND', 
                       color: '#999', type: 'rect' }
};

const componentInfo = {
    pc: 'Program Counter\n\nContador que mantiene la dirección de la siguiente instrucción a ejecutar.',
    adderPC4: 'Sumador PC+4\n\nIncrementa el PC en 4 para obtener la dirección de la siguiente instrucción secuencial.',
    muxPC: 'Multiplexor PC\n\nSelecciona entre PC+4 (secuencial) o dirección de salto (branch/jump).',
    instMem: 'Memoria de Programa\n\nAlmacena las instrucciones del programa. Es de solo lectura.',
    muxTop1: 'Multiplexor\n\nSelecciona la fuente de datos según señal de control.',
    muxTop2: 'Multiplexor\n\nSelecciona la fuente de datos según señal de control.',
    signExtend: 'Sign Extend\n\nExtiende el inmediato con signo de 12 bits a 32 bits.',
    regFile: 'Banco de Registros\n\n32 registros de propósito general (x0-x31). x0 siempre vale 0.',
    muxALU: 'Multiplexor ALU\n\nSelecciona entre segundo registro o inmediato como operando B de la ALU.',
    alu: 'ALU\n\nUnidad Aritmético-Lógica. Realiza operaciones como suma, resta, AND, OR, etc.',
    dataMem: 'Memoria de Datos\n\nMemoria RAM para instrucciones load/store.',
    muxWB: 'Multiplexor Write-Back\n\nSelecciona entre resultado de ALU o dato de memoria para escribir en registro.',
    controlUnit: 'Unidad de Control (CU)\n\nGenera todas las señales de control según el opcode de la instrucción.',
    andGate: 'Puerta AND\n\nCombina señales de branch y resultado de comparación.',
    notGate: 'Puerta NOT\n\nInvierte señal lógica.',
    muxBranch: 'Multiplexor Branch\n\nSelecciona señal para control de salto.',
    ordenSignExtend: 'Orden & Sign Extend\n\nReordena bits y extiende inmediatos para branches.'
};

// ============================================
// FUNCIONES DE DIBUJO BÁSICAS
// ============================================

// ============================================
// FUNCIONES DE DIBUJO MEJORADAS
// ============================================

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

function drawRect(comp, isHovered, isSelected, isActive) {
    const stroke = isSelected ? '#FF0000' : isActive ? '#00FF00' : isHovered ? '#FF6600' : '#333';
    const lineW = isActive ? 4 : isSelected ? 3 : 2;
    let fill = comp.color;
    
    if (isActive) {
        fill = '#FFFFE0';
        ctx.shadowColor = '#00FF00';
        ctx.shadowBlur = 15;
    } else if (isHovered) {
        fill = '#BBB';
    } else if (isSelected) {
        fill = '#FFD700';
    }
    
    drawRoundRect(comp.x, comp.y, comp.width, comp.height, 4, fill, stroke, lineW);
    ctx.shadowBlur = 0;
    
    // Texto
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

function drawMemory(comp, isHovered, isSelected, isActive) {
    const stroke = isSelected ? '#FF0000' : isActive ? '#00FF00' : isHovered ? '#FF6600' : '#333';
    const lineW = isActive ? 4 : isSelected ? 3 : 2;
    let fill = comp.color;
    
    if (isActive) {
        fill = '#FFFFE0';
        ctx.shadowColor = '#00FF00';
        ctx.shadowBlur = 15;
    } else if (isHovered) {
        fill = '#BBB';
    }
    
    drawRoundRect(comp.x, comp.y, comp.width, comp.height, 4, fill, stroke, lineW);
    ctx.shadowBlur = 0;
    
    // Título centrado
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    
    const lines = comp.label.split('\n');
    const startY = comp.y + 40;
    lines.forEach((line, i) => {
        ctx.fillText(line, comp.x + comp.width/2, startY + i * 18);
    });
}

function drawMux(comp, isHovered, isSelected, isActive) {
    const stroke = isSelected ? '#FF0000' : isActive ? '#00FF00' : isHovered ? '#FF6600' : '#333';
    const lineW = isActive ? 4 : isSelected ? 3 : 2;
    let fill = comp.color;
    
    if (isActive) {
        fill = '#EEEEEE';
        ctx.shadowColor = '#00FF00';
        ctx.shadowBlur = 15;
    } else if (isHovered) {
        fill = '#DDD';
    }
    
    // Trapecio (MUX)
    ctx.beginPath();
    ctx.moveTo(comp.x, comp.y);
    ctx.lineTo(comp.x + comp.width, comp.y + 10);
    ctx.lineTo(comp.x + comp.width, comp.y + comp.height - 10);
    ctx.lineTo(comp.x, comp.y + comp.height);
    ctx.closePath();
    
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineW;
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Etiquetas 0 y 1 a la izquierda
    if (comp.inputs) {
        ctx.fillStyle = '#000';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(comp.inputs[0], comp.x - 3, comp.y + comp.height * 0.3);
        ctx.fillText(comp.inputs[1], comp.x - 3, comp.y + comp.height * 0.7);
    }
    
    // Pequeño triángulo selector en la parte inferior si tiene
    if (comp.hasSelector) {
        const triX = comp.x + comp.width/2;
        const triY = comp.y + comp.height + 3;
        ctx.beginPath();
        ctx.moveTo(triX, triY);
        ctx.lineTo(triX - 4, triY + 6);
        ctx.lineTo(triX + 4, triY + 6);
        ctx.closePath();
        ctx.fillStyle = '#666';
        ctx.fill();
    }
}

function drawALU(comp, isHovered, isSelected, isActive) {
    const stroke = isSelected ? '#FF0000' : isActive ? '#00FF00' : isHovered ? '#FF6600' : '#333';
    const lineW = isActive ? 4 : isSelected ? 3 : 2;
    let fill = comp.color;
    
    if (isActive) {
        fill = '#FFFFE0';
        ctx.shadowColor = '#00FF00';
        ctx.shadowBlur = 15;
    } else if (isHovered) {
        fill = '#BBB';
    }
    
    // Trapecio de ALU
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
    ctx.shadowBlur = 0;
    
    // Etiqueta ALU
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ALU', comp.x + comp.width/2, comp.y + comp.height/2);
}

function drawRegFile(comp, isHovered, isSelected, isActive) {
    const stroke = isSelected ? '#FF0000' : isActive ? '#00FF00' : isHovered ? '#FF6600' : '#333';
    const lineW = isActive ? 4 : isSelected ? 3 : 2;
    let fill = comp.color;
    
    if (isActive) {
        fill = '#FFFFE0';
        ctx.shadowColor = '#00FF00';
        ctx.shadowBlur = 15;
    } else if (isHovered) {
        fill = '#BBB';
    }
    
    drawRoundRect(comp.x, comp.y, comp.width, comp.height, 4, fill, stroke, lineW);
    ctx.shadowBlur = 0;
    
    // Título
    ctx.fillStyle = '#000';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    const lines = comp.label.split('\n');
    const startY = comp.y + 30;
    lines.forEach((line, i) => {
        ctx.fillText(line, comp.x + comp.width/2, startY + i * 16);
    });
    
    // Representación visual de registros (matriz de cuadritos)
    const regStartY = comp.y + 80;
    const regSize = 12;
    const gap = 4;
    const cols = 8;
    const rows = 4;
    
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < rows * cols; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = comp.x + 15 + col * (regSize + gap);
        const y = regStartY + row * (regSize + gap);
        ctx.strokeRect(x, y, regSize, regSize);
    }
}

function drawControl(comp, isHovered, isSelected, isActive) {
    const stroke = isSelected ? '#FF0000' : isActive ? '#00FF00' : isHovered ? '#FF6600' : '#333';
    const lineW = isActive ? 4 : isSelected ? 3 : 2;
    let fill = comp.color;
    
    if (isActive) {
        fill = '#FFFFE0';
        ctx.shadowColor = '#00FF00';
        ctx.shadowBlur = 15;
    } else if (isHovered) {
        fill = '#BBB';
    }
    
    drawRoundRect(comp.x, comp.y, comp.width, comp.height, 6, fill, stroke, lineW);
    ctx.shadowBlur = 0;
    
    // Etiqueta
    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(comp.label, comp.x + comp.width/2, comp.y + comp.height/2);
}

// ============================================
// DIBUJAR CONEXIONES CORREGIDAS
// ============================================

function drawConnections() {
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#666';
    
    // ===== 1. PC -> Memoria de Instrucciones (CORREGIDO) =====
    // El PC va horizontalmente directo a la entrada de la memoria
    drawLine(90, 380, 220, 380);
    // Flecha apuntando a la entrada izquierda de la memoria
    drawLine(220, 380, 220, 190);
    drawArrow(220, 192, 220, 190, '#666');
    
    // ===== 2. PC -> Sumador PC+4 =====
    // El PC también baja hacia el sumador
    drawLine(60, 410, 60, 460);
    drawArrow(60, 458, 60, 460, '#666');
    drawLine(60, 460, 145, 460);
    drawLine(145, 460, 145, 460);
    
    // ===== 3. Sumador PC+4 -> MUX PC (entrada 0 - arriba) =====
    drawLine(145, 510, 145, 555);
    
    // ===== 4. MUX PC -> PC (retroalimentación) =====
    // Sale del MUX por abajo, va a la izquierda y sube al PC
    drawLine(130, 620, 130, 650);
    drawLine(130, 650, 10, 650);
    drawLine(10, 650, 10, 380);
    drawLine(10, 380, 30, 380);
    drawArrow(28, 380, 30, 380, '#666');
    
    // ===== 5. Memoria de Instrucciones -> Salidas =====
    // La instrucción sale por abajo de la memoria
    const instMemOutX = 320;
    const instMemCenterX = 320;
    const instMemBottomY = 330;
    
    // Línea principal de salida de la instrucción
    drawLine(instMemCenterX, instMemBottomY, instMemCenterX, 360);
    
    // rs1 -> MUX superior 1
    drawLine(instMemCenterX, 360, 440, 360);
    drawLine(440, 360, 440, 110);
    drawLine(440, 110, 450, 110);
    
    // rs2 -> MUX superior 2  
    drawLine(instMemCenterX, 360, 430, 360);
    drawLine(430, 360, 430, 190);
    drawLine(430, 190, 450, 190);
    
    // rd -> va arriba para write-back
    drawLine(instMemCenterX, 360, 420, 360);
    drawLine(420, 360, 420, 30);
    drawLine(420, 30, 1210, 30);
    drawLine(1210, 30, 1210, 390);
    
    // Inmediato -> Sign Extend (arriba)
    drawLine(360, instMemBottomY, 360, 245);
    drawLine(360, 245, 560, 245);
    drawArrow(558, 245, 560, 245, '#666');
    
    // Instrucción -> Orden & Sign Extend (abajo para branches)
    drawLine(280, instMemBottomY, 280, 495);
    drawLine(280, 495, 320, 495);
    drawArrow(318, 495, 320, 495, '#666');
    
    // Opcode -> Unidad de Control
    drawLine(instMemCenterX, instMemBottomY, instMemCenterX, 600);
    drawLine(instMemCenterX, 600, 720, 600);
    drawLine(720, 600, 720, 630);
    drawArrow(720, 628, 720, 630, '#666');
    
    // ===== 6. MUX superiores -> Banco de Registros =====
    // MUX1 -> Read Register 1 (a1)
    drawLine(485, 110, 500, 110);
    drawLine(500, 110, 500, 335);
    drawLine(500, 335, 490, 335);
    drawArrow(492, 335, 490, 335, '#666');
    
    // MUX2 -> Read Register 2 (a2)
    drawLine(485, 190, 510, 190);
    drawLine(510, 190, 510, 360);
    drawLine(510, 360, 490, 360);
    drawArrow(492, 360, 490, 360, '#666');
    
    // ===== 7. Sign Extend -> MUX ALU (entrada 1 - abajo) =====
    drawLine(670, 245, 685, 245);
    drawLine(685, 245, 685, 405);
    drawLine(685, 405, 700, 405);
    
    // ===== 8. Banco de Registros -> Salidas =====
    // Read Data 1 (d1) -> ALU entrada A
    drawLine(670, 350, 750, 350);
    drawLine(750, 350, 750, 360);
    drawLine(750, 360, 790, 360);
    drawArrow(788, 360, 790, 360, '#666');
    
    // Read Data 2 (d2) -> Bifurcación a dos lugares
    const rd2X = 670;
    const rd2Y = 410;
    drawLine(rd2X, rd2Y, 690, rd2Y);
    
    // Camino 1: d2 -> MUX ALU (entrada 0 - arriba)
    drawLine(690, rd2Y, 690, 375);
    drawLine(690, 375, 700, 375);
    
    // Camino 2: d2 -> Memoria de Datos (Write Data)
    drawLine(690, rd2Y, 690, 540);
    drawLine(690, 540, 905, 540);
    drawLine(905, 540, 905, 410);
    drawLine(905, 410, 920, 410);
    drawArrow(918, 410, 920, 410, '#666');
    
    // ===== 9. MUX ALU -> ALU entrada B =====
    drawLine(735, 390, 755, 390);
    drawLine(755, 390, 755, 420);
    drawLine(755, 420, 790, 420);
    drawArrow(788, 420, 790, 420, '#666');
    
    // ===== 10. ALU -> Salidas =====
    const aluOutX = 870;
    const aluOutY = 390;
    
    // ALU Result -> bifurcación
    drawLine(aluOutX, aluOutY, 895, aluOutY);
    
    // Camino 1: ALU -> Memoria de Datos (Address)
    drawLine(895, aluOutY, 895, 350);
    drawLine(895, 350, 920, 350);
    drawArrow(918, 350, 920, 350, '#666');
    
    // Camino 2: ALU -> MUX WB (entrada 0 - arriba)
    drawLine(895, aluOutY, 1125, aluOutY);
    drawLine(1125, aluOutY, 1125, 375);
    drawLine(1125, 375, 1140, 375);
    
    // ALU Zero flag -> AND gate (para branches)
    drawLine(830, 450, 830, 680);
    drawLine(830, 680, 330, 680);
    drawLine(330, 680, 330, 700);
    drawArrow(330, 698, 330, 700, '#666');
    
    // ===== 11. Memoria de Datos -> MUX WB (entrada 1 - abajo) =====
    drawLine(1120, 380, 1130, 380);
    drawLine(1130, 380, 1130, 405);
    drawLine(1130, 405, 1140, 405);
    
    // ===== 12. MUX WB -> Banco de Registros (Write Data) =====
    drawLine(1175, 390, 1210, 390);
    drawLine(1210, 390, 1210, 440);
    drawLine(1210, 440, 540, 440);
    drawLine(540, 440, 540, 490);
    drawArrow(540, 488, 540, 490, '#666');
    
    // ===== 13. Branch Address Calculation =====
    // Orden & Sign Extend -> Sumador de Branch
    drawLine(200, 495, 170, 495);
    drawLine(170, 495, 170, 530);
    
    // PC -> Sumador de Branch (compartido con el que va a +4)
    drawLine(60, 460, 60, 530);
    drawLine(60, 530, 170, 530);
    
    // Resultado del sumador implícito -> MUX PC (entrada 1 - abajo)
    drawLine(170, 530, 170, 595);
    drawLine(170, 595, 120, 595);
    
    // ===== 14. Branch Control Logic =====
    // AND gate (combina Branch signal + Zero flag)
    // Salida del AND -> MUX que selecciona señal
    drawLine(330, 700, 360, 700);
    drawLine(360, 700, 360, 685);
    
    // NOT gate (para BNE - branch not equal)
    drawLine(395, 720, 450, 720);
    
    // Señal de branch control -> selector del MUX PC
    drawLine(377, 720, 377, 740);
    drawLine(377, 740, 130, 740);
    drawLine(130, 740, 130, 625);
    
    // Línea punteada desde CU hasta el selector del MUX
    ctx.setLineDash([5, 5]);
    drawLine(130, 625, 130, 620);
    ctx.setLineDash([]);
    
    // ===== 15. Señales de Control (líneas punteadas) =====
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#999';
    
    // Control -> RegWrite (Banco de Registros)
    drawLine(740, 630, 740, 590);
    drawLine(740, 590, 580, 590);
    drawLine(580, 590, 580, 490);
    drawArrow(580, 488, 580, 490, '#999');
    
    // Control -> ALUSrc (MUX ALU selector)
    drawLine(800, 630, 800, 570);
    drawLine(800, 570, 717, 570);
    drawLine(717, 570, 717, 425);
    
    // Control -> MemWrite y MemRead (Memoria de Datos)
    drawLine(860, 630, 860, 550);
    drawLine(860, 550, 1020, 550);
    drawLine(1020, 550, 1020, 520);
    drawArrow(1020, 518, 1020, 520, '#999');
    
    // Control -> MemToReg (MUX WB selector)
    drawLine(920, 650, 1157, 650);
    drawLine(1157, 650, 1157, 425);
    
    // Control -> Branch (AND gate)
    drawLine(760, 730, 305, 730);
    drawLine(305, 730, 305, 720);
    drawArrow(305, 718, 305, 720, '#999');
    
    // Control -> ALUOp (señal que controla la operación de la ALU)
    drawLine(830, 630, 830, 560);
    drawLine(830, 560, 830, 450);
    
    ctx.setLineDash([]);
    ctx.strokeStyle = '#666';
}

function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawArrow(x1, y1, x2, y2, color) {
    const headlen = 8;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
        x2 - headlen * Math.cos(angle - Math.PI / 6),
        y2 - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        x2 - headlen * Math.cos(angle + Math.PI / 6),
        y2 - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
}

// ============================================
// FUNCIÓN PRINCIPAL DE DIBUJO
// ============================================

function drawProcessor() {
    // Renderer estático simplificado — la animación queda en la sección específica más abajo.
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';

    drawConnections();

    // Dibujar componentes sin lógica de animación aquí (la animación se maneja por el override posterior).
    for (let key in components) {
        const comp = components[key];
        const isHov = hoveredComponent === key;
        const isSel = selectedComponent === key;
        const isActive = false;        // ...existing code...
        // ============================================
        // FUNCIÓN PRINCIPAL: ANIMAR EJECUCIÓN
        // ============================================
        function animateInstructionExecution(instrText, processorState) {
            if (!document.getElementById('viewDiagram').classList.contains('active')) {
                return Promise.resolve();
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
            
            // ahora devuelve la promesa que resuelve cuando termina toda la animación y los datos
            return executeAnimationSequence(animationSequence);
        }
        
        // ============================================
        // EJECUTAR SECUENCIA (ahora devuelve Promise)
        // ============================================
        function executeAnimationSequence(sequence) {
            return new Promise((resolve) => {
                let currentIndex = 0;
                
                function executeNextStep() {
                    if (currentIndex >= sequence.length) {
                        // esperar a que todas las partículas terminen
                        const waitParticles = () => {
                            if (!animationState.dataFlowing || animationState.dataFlowing.length === 0) {
                                // pequeña pausa visual antes de limpiar
                                setTimeout(() => {
                                    animationState.isAnimating = false;
                                    animationState.activeComponents.clear();
                                    animationState.activeBuses = [];
                                    drawProcessor();
                                    resolve();
                                }, 200);
                            } else {
                                requestAnimationFrame(waitParticles);
                            }
                        };
                        // si no hay buses iniciados, resolver inmediatamente
                        waitParticles();
                        return;
                    }
                    
                    const step = sequence[currentIndex];
                    
                    updateStepDescription(step.description);
                    
                    animationState.activeComponents.clear();
                    (step.components || []).forEach(comp => animationState.activeComponents.add(comp));
                    
                    animationState.activeBuses = step.buses || [];
                    
                    if (step.buses) {
                        animateDataFlow(step.buses); // animateDataFlow añade partículas a animationState.dataFlowing
                    }
                    
                    drawProcessor();
                    
                    currentIndex++;
                    setTimeout(executeNextStep, step.delay || 600);
                }
                
                executeNextStep();
            });
        }
        
        // ============================================
        // AUX: sleep
        // ============================================
        function sleep(ms) {
            return new Promise(res => setTimeout(res, ms));
        }
        
        // ============================================
        // SOBRESCRIBIR executeInstruction para esperar animación
        // ============================================
        const originalExecuteInstruction = executeInstruction;
        executeInstruction = async function() {
            const oldPC = processor.pc;
            // ejecutar la lógica de la instrucción (cambia estado)
            originalExecuteInstruction();
            processor.oldPC = oldPC;
            
            // si estamos en la vista del diagrama, animar y esperar a que termine
            if (document.getElementById('viewDiagram')?.classList.contains('active')) {
                const instrText = processor.instructions[oldPC];
                if (instrText) {
                    try {
                        await animateInstructionExecution(instrText, processor);
                    } catch (e) {
                        console.error('Animation error', e);
                    }
                }
            }
        };
        
        // ============================================
        // MODIFICAR runProgram para esperar animación entre instrucciones
        // ============================================
        async function runProgram() {
            processor.isRunning = true;
            while (processor.pc < processor.instructions.length && processor.isRunning) {
                await executeInstruction();
                updateUI();
                // esperar un poco (configurable)
                await sleep(animationConfig.duration || 800);
            }
            processor.isRunning = false;
            updateUI();
        }
        
        // ============================================
        // CONFIGURAR LISTENERS: usar executeInstruction() (async) en panel
        // ============================================
        function setupDiagramControlListeners() {
            // ...existing code...
        
            // Botón Step
            document.getElementById('diagramStepBtn')?.addEventListener('click', async () => {
                if (processor.pc < processor.instructions.length) {
                    await executeInstruction();
                    updateDiagramControlPanel();
                } else {
                    showNotification('⚠️ No hay más instrucciones', 'warning');
                }
            });
            
            // Botón Run
            let runLoopActive = false;
            document.getElementById('diagramRunBtn')?.addEventListener('click', async () => {
                if (processor.isRunning) {
                    // Pausar
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
                const delay = speed;
                
                while (processor.pc < processor.instructions.length && processor.isRunning && runLoopActive) {
                    await executeInstruction();
                    updateDiagramControlPanel();
                    // esperar entre instrucciones (permite ver resultado)
                    await sleep(delay);
                }
                
                processor.isRunning = false;
                runLoopActive = false;
                document.getElementById('diagramRunBtn').style.display = 'inline-block';
                document.getElementById('diagramPauseBtn').style.display = 'none';
                if (processor.pc >= processor.instructions.length) {
                    showNotification('✅ Programa completado', 'success');
                }
            });
        
            // ...existing code...
        }
        // ...existing code...

        if (comp.type === 'mux') drawMux(comp, isHov, isSel, isActive);
        else if (comp.type === 'memory') drawMemory(comp, isHov, isSel, isActive);
        else if (comp.type === 'regfile') drawRegFile(comp, isHov, isSel, isActive);
        else if (comp.type === 'alu') drawALU(comp, isHov, isSel, isActive);
        else if (comp.type === 'control') drawControl(comp, isHov, isSel, isActive);
        else drawRect(comp, isHov, isSel, isActive);
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
        infoBox.innerHTML = `<h3>${comp.label.replace(/\n/g, ' ')}</h3><p style="white-space: pre-line;">${info}</p>`;
    } else {
        infoBox.className = 'info-box default';
        infoBox.innerHTML = '<p>Haz clic en cualquier componente para ver su descripción</p>';
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

console.log('✅ Diagrama limpio estilo profesional cargado');

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
    duration: 2000,
    pulseSpeed: 100,
    dataFlowSpeed: 60,
    highlightDuration: 3000
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
            delay: 1500
        },
        {
            step: 2,
            description: `Decode: Extraer rs1=x${rs1}, rs2=x${rs2}, rd=x${rd}`,
            components: ['instMem', 'controlUnit', 'regFile'],
            buses: [
                { from: 'instMem', to: 'controlUnit', color: '#00BFFF', label: 'opcode' },
                { from: 'instMem', to: 'regFile', color: '#32CD32', label: `rs1=x${rs1}` }
            ],
            delay: 1800
        },
        {
            step: 3,
            description: `Read: x${rs1}=${state.registers[rs1]}, x${rs2}=${state.registers[rs2]}`,
            components: ['regFile', 'alu'],
            buses: [
                { from: 'regFile', to: 'alu', color: '#32CD32', label: `${state.registers[rs1]}` }
            ],
            delay: 1800
        },
        {
            step: 4,
            description: `Execute: ALU calcula resultado = ${state.internals.aluResult}`,
            components: ['alu', 'aluControl'],
            delay: 2000
        },
        {
            step: 5,
            description: `Write Back: x${rd} = ${state.internals.aluResult}`,
            components: ['alu', 'muxWB', 'regFile'],
            buses: [
                { from: 'alu', to: 'muxWB', color: '#DC143C', label: `${state.internals.aluResult}` },
                { from: 'muxWB', to: 'regFile', color: '#9370DB', label: `${state.internals.aluResult}` }
            ],
            delay: 1800
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
            delay: 1500
        },
        {
            step: 2,
            description: `Decode & Generate Immediate: imm=${imm}`,
            components: ['instMem', 'controlUnit', 'immGen', 'regFile'],
            buses: [
                { from: 'instMem', to: 'immGen', color: '#FF8C00', label: `imm=${imm}` }
            ],
            delay: 1800
        },
        {
            step: 3,
            description: `Read: x${rs1}=${state.registers[rs1]}`,
            components: ['regFile', 'alu', 'immGen', 'muxALU'],
            buses: [
                { from: 'regFile', to: 'alu', color: '#32CD32', label: `${state.registers[rs1]}` },
                { from: 'immGen', to: 'muxALU', color: '#FF8C00', label: `${imm}` }
            ],
            delay: 1800
        },
        {
            step: 4,
            description: `Execute: ${state.registers[rs1]} + ${imm} = ${state.internals.aluResult}`,
            components: ['alu', 'aluControl'],
            delay: 2000
        },
        {
            step: 5,
            description: `Write Back: x${rd} = ${state.internals.aluResult}`,
            components: ['alu', 'muxWB', 'regFile'],
            buses: [
                { from: 'alu', to: 'muxWB', color: '#DC143C', label: `${state.internals.aluResult}` },
                { from: 'muxWB', to: 'regFile', color: '#9370DB', label: `${state.internals.aluResult}` }
            ],
            delay: 1800
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
            delay: 1500
        },
        {
            step: 2,
            description: `Calculate Address: ${state.registers[rs1]} + ${offset} = ${addr}`,
            components: ['regFile', 'immGen', 'muxALU', 'alu'],
            buses: [
                { from: 'regFile', to: 'alu', color: '#32CD32', label: `${state.registers[rs1]}` },
                { from: 'immGen', to: 'muxALU', color: '#FF8C00', label: `${offset}` }
            ],
            delay: 2000
        },
        {
            step: 3,
            description: `Memory Read: MEM[${addr}] = ${state.internals.memData}`,
            components: ['alu', 'dataMem'],
            buses: [{ from: 'alu', to: 'dataMem', color: '#DC143C', label: `addr=${addr}` }],
            delay: 2000
        },
        {
            step: 4,
            description: `Write Back: x${rd} = ${state.internals.memData}`,
            components: ['dataMem', 'muxWB', 'regFile'],
            buses: [
                { from: 'dataMem', to: 'muxWB', color: '#9370DB', label: `${state.internals.memData}` },
                { from: 'muxWB', to: 'regFile', color: '#9370DB', label: `${state.internals.memData}` }
            ],
            delay: 1800
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
            delay: 1500
        },
        {
            step: 2,
            description: `Calculate Address: ${state.registers[rs1]} + ${offset} = ${addr}`,
            components: ['regFile', 'immGen', 'alu'],
            buses: [{ from: 'regFile', to: 'alu', color: '#32CD32', label: `${state.registers[rs1]}` }],
            delay: 2000
        },
        {
            step: 3,
            description: `Memory Write: MEM[${addr}] = ${state.registers[rs2]}`,
            components: ['regFile', 'dataMem'],
            buses: [{ from: 'regFile', to: 'dataMem', color: '#32CD32', label: `${state.registers[rs2]}` }],
            delay: 2000
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
            delay: 1500
        },
        {
            step: 2,
            description: `Compare: x${rs1}=${state.registers[rs1]} vs x${rs2}=${state.registers[rs2]}`,
            components: ['regFile', 'alu'],
            delay: 2000
        },
        {
            step: 3,
            description: taken ? `✓ BRANCH TAKEN → PC=${state.pc}` : `✗ NOT TAKEN → PC=${state.pc}`,
            components: taken ? ['adderBranch', 'muxPC', 'pc'] : ['adderPC4', 'muxPC', 'pc'],
            delay: 1800
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
            }, 2000);
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
        setTimeout(executeNextStep, step.delay || 1800);
    }
    
    executeNextStep();
}

// ============================================
// ANIMACIÓN DE FLUJO DE DATOS
// ============================================
function animateDataFlow(buses) {
    // Mapa de rutas predefinidas que reflejan las mismas coordenadas usadas
    // en `drawConnections`. Cada entrada es un array de puntos [x,y].
    const pathMap = {
        'pc|instMem': [[60,380],[220,380],[220,190],[320,190]],
        'instMem|controlUnit': [[320,330],[320,600],[720,600],[830,690]],
        'instMem|regFile': [[320,360],[440,360],[440,110],[500,110],[500,335],[580,400]],
        'instMem|signExtend': [[320,330],[360,330],[360,245],[560,245],[615,245]],
        'regFile|alu': [[580,400],[670,350],[750,350],[750,360],[790,360],[830,390]],
        'alu|muxWB': [[830,390],[895,390],[1125,390],[1125,375],[1140,375],[1157.5,390]],
        'muxWB|regFile': [[1157.5,390],[1210,390],[1210,440],[540,440],[540,490],[580,400]],
        'signExtend|muxALU': [[615,245],[670,245],[685,245],[685,405],[700,405],[717.5,390]],
        'alu|dataMem': [[830,390],[895,390],[895,350],[920,350],[1020,380]],
        'regFile|dataMem': [[580,400],[690,410],[690,540],[905,540],[905,410],[920,410],[1020,380]],
        'dataMem|muxWB': [[1020,380],[1120,380],[1130,380],[1130,405],[1140,405],[1157.5,390]]
    };

    function resolveName(name) {
        const map = { immGen: 'signExtend', immgen: 'signExtend', aluControl: 'alu', adderBranch: 'ordenSignExtend' };
        return map[name] || name;
    }

    function getPathForBus(from, to) {
        const f = resolveName(from);
        const t = resolveName(to);
        const key = `${f}|${t}`;

        const fromComp = components[f];
        const toComp = components[t];

        const fromCenter = fromComp ? [fromComp.x + fromComp.width / 2, fromComp.y + fromComp.height / 2] : null;
        const toCenter = toComp ? [toComp.x + toComp.width / 2, toComp.y + toComp.height / 2] : null;

        if (pathMap[key]) {
            // asegurar que el primer y último punto coincidan con los centros reales
            const pts = pathMap[key].map(p => ({ x: p[0], y: p[1] }));
            if (fromCenter) pts.unshift({ x: fromCenter[0], y: fromCenter[1] });
            if (toCenter) pts.push({ x: toCenter[0], y: toCenter[1] });
            return pts;
        }

        // Fallback: línea recta entre centros
        if (fromCenter && toCenter) return [{ x: fromCenter[0], y: fromCenter[1] }, { x: toCenter[0], y: toCenter[1] }];
        return [];
    }

    buses.forEach((bus, index) => {
        setTimeout(() => {
            const path = getPathForBus(bus.from, bus.to);
            if (!path || path.length < 2) return;

            const id = Date.now().toString(36) + Math.random().toString(36).slice(2,8);

            animationState.dataFlowing.push({
                id,
                path, // array of {x,y}
                segmentIndex: 0,
                segmentProgress: 0,
                currentX: path[0].x,
                currentY: path[0].y,
                color: bus.color,
                label: bus.label,
                speed: 0.015 + (bus.speed || 0)
            });

            animateParticleById(id);
        }, index * 400);
    });
}

function animateParticleById(id) {
    const particle = animationState.dataFlowing.find(p => p.id === id);
    if (!particle) return;

    const path = particle.path;
    const seg = particle.segmentIndex;
    const a = path[seg];
    const b = path[seg + 1];
    if (!a || !b) {
        // terminado
        const idx = animationState.dataFlowing.findIndex(p => p.id === id);
        if (idx !== -1) animationState.dataFlowing.splice(idx, 1);
        drawProcessor();
        return;
    }

    particle.segmentProgress += particle.speed;
    if (particle.segmentProgress > 1) particle.segmentProgress = 1;

    particle.currentX = a.x + (b.x - a.x) * particle.segmentProgress;
    particle.currentY = a.y + (b.y - a.y) * particle.segmentProgress;

    drawProcessor();

    if (particle.segmentProgress < 1) {
        requestAnimationFrame(() => animateParticleById(id));
    } else {
        // avanzar al siguiente segmento
        particle.segmentIndex++;
        particle.segmentProgress = 0;
        if (particle.segmentIndex >= path.length - 1) {
            // finalizado
            setTimeout(() => {
                const idx = animationState.dataFlowing.findIndex(p => p.id === id);
                if (idx !== -1) animationState.dataFlowing.splice(idx, 1);
                drawProcessor();
            }, 800);
        } else {
            requestAnimationFrame(() => animateParticleById(id));
        }
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
    
    // --- NUEVO: dibujar trazos iluminados siguiendo las partículas ---
    animationState.dataFlowing.forEach(particle => {
        const path = particle.path;
        if (!path || path.length < 2) return;
        
        ctx.save();
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        
        // Empezar en el primer punto del path
        ctx.moveTo(path[0].x, path[0].y);
        
        // Dibujar segmentos completos hasta el segmento actual
        for (let i = 0; i < particle.segmentIndex; i++) {
            const p = path[i + 1];
            if (p) ctx.lineTo(p.x, p.y);
        }
        
        // Dibujar el segmento parcial actual (hasta la posición de la partícula)
        const segA = path[particle.segmentIndex];
        const segB = path[particle.segmentIndex + 1];
        if (segA && segB) {
            const t = particle.segmentProgress;
            const ix = segA.x + (segB.x - segA.x) * t;
            const iy = segA.y + (segB.y - segA.y) * t;
            ctx.lineTo(ix, iy);
        }
        
        ctx.stroke();
        ctx.restore();
    });
    // --- FIN NUEVO ---
    
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
                    <input type="range" id="diagramSpeedSlider" min="500" max="5000" value="2000" step="100">
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