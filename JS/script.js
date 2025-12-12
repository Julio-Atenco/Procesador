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
// CÓDIGO DEL DIAGRAMA - BASADO EN ESPECIFICACIÓN
// ============================================
const canvas = document.getElementById('processorCanvas');
const ctx = canvas.getContext('2d');
const infoBox = document.getElementById('infoBox');
let hoveredComponent = null;
let selectedComponent = null;

canvas.width = 1600;
canvas.height = 900;

// Componentes organizados según el datapath descrito
const components = {
    // PC y sumador (izquierda)
    pc: { x: 50, y: 120, width: 70, height: 70, label: 'PC', color: '#999', type: 'rect' },
    sumador: { x: 50, y: 250, width: 60, height: 60, label: '+', color: '#999', type: 'circle' },
    
    // Mux D - selecciona PC+4 o salto (debajo del sumador)
    muxD: { x: 50, y: 350, width: 40, height: 80, label: 'MUX D', color: '#CCC', type: 'mux',
            inputs: ['PC+4', 'Salto'], hasSelector: true },
    
    // Memoria de Instrucciones (centro-izquierda arriba)
    instMem: { x: 200, y: 40, width: 200, height: 300, label: 'MEMORIA DE\nINSTRUCCIONES', 
               color: '#999', type: 'memory' },
    
    // Unidad de Control (abajo de memoria de instrucciones)
    controlUnit: { x: 200, y: 380, width: 200, height: 140, label: 'UNIDAD DE\nCONTROL (CU)', 
                   color: '#999', type: 'control' },
    
    // Mux E - selecciona rs2 o rd (derecha de memoria de instrucciones)
    muxE: { x: 450, y: 120, width: 40, height: 80, label: 'MUX E', color: '#CCC', type: 'mux',
            inputs: ['rs2', 'rd'], hasSelector: true },
    
    // Extensor de Signo (derecha del Mux E)
    signExtend: { x: 550, y: 120, width: 130, height: 80, label: 'EXTENSOR\nDE SIGNO', 
                  color: '#999', type: 'rect' },
    
    // Componente Orden y Extensor de Signo para branches (abajo izquierda)
    ordenExtend: { x: 200, y: 580, width: 140, height: 70, label: 'ORDEN &\nEXTEND', 
                   color: '#999', type: 'rect' },
    
    // Banco de Registros (centro)
    regFile: { x: 550, y: 280, width: 200, height: 200, label: 'BANCO DE\nREGISTROS', 
               color: '#999', type: 'regfile' },
    
    // Mux A - selecciona dato2 o inmediato para ALU (derecha del banco)
    muxA: { x: 820, y: 340, width: 40, height: 80, label: 'MUX A', color: '#CCC', type: 'mux',
            inputs: ['Dato2', 'Inm'], hasSelector: true },
    
    // ALU (centro-derecha)
    alu: { x: 920, y: 310, width: 100, height: 140, label: 'ALU', color: '#999', type: 'alu' },
    
    // Memoria de Datos (derecha)
    dataMem: { x: 1100, y: 240, width: 200, height: 300, label: 'MEMORIA\nDE DATOS', 
               color: '#999', type: 'memory' },
    
    // Mux B - selecciona resultado ALU o dato de memoria (derecha de memoria)
    muxB: { x: 1360, y: 340, width: 40, height: 80, label: 'MUX B', color: '#CCC', type: 'mux',
            inputs: ['ALU', 'Mem'], hasSelector: true },
    
    // Componentes de control de saltos (abajo izquierda)
    muxC: { x: 50, y: 580, width: 40, height: 80, label: 'MUX C', color: '#CCC', type: 'mux',
            inputs: ['LSB', '~LSB'], hasSelector: true },
    notGate: { x: 50, y: 700, width: 60, height: 50, label: 'NOT', color: '#999', type: 'rect' },
    andGate: { x: 150, y: 680, width: 60, height: 50, label: 'AND', color: '#999', type: 'rect' }
};

const componentInfo = {
    pc: 'Program Counter (PC)\n\nRegistro que almacena la dirección de la instrucción actual. Se actualiza en cada ciclo.',
    sumador: 'Sumador\n\nCalcula la nueva dirección del PC. Suma el PC actual con 4 (siguiente instrucción) o con el offset de salto.',
    muxD: 'Multiplexor D\n\nSelecciona entre:\n- PC+4 (instrucción secuencial)\n- Dirección de salto (cuando se cumple condición de branch)',
    instMem: 'Memoria de Instrucciones\n\nAlmacena el programa. Es de solo lectura.\nEnvía la instrucción actual que incluye: opcode, rs1, rs2, rd, fun3, fun7 e inmediato.',
    controlUnit: 'Unidad de Control (CU)\n\nInterpreta el opcode, fun3 y fun7.\nGenera todas las señales de control para los multiplexores y componentes.',
    muxE: 'Multiplexor E\n\nSelecciona entre:\n- rs2 (para instrucciones Load)\n- rd (para instrucciones Store)\nLa salida va al extensor de signo.',
    signExtend: 'Extensor de Signo\n\nRecibe el resultado del Mux E concatenado con fun7.\nExtiende el valor a 32 bits manteniendo el signo.',
    ordenExtend: 'Orden & Extensor (Branches)\n\nPrepara el offset para instrucciones de salto.\nReordena bits y extiende con signo para calcular dirección destino.',
    regFile: 'Banco de Registros\n\n32 registros de propósito general (x0-x31).\nx0 siempre es 0.\nPuertos: rs1, rs2 (lectura) y rd (escritura).',
    muxA: 'Multiplexor A\n\nSelecciona el segundo operando de la ALU:\n- Dato 2 del banco (instrucciones R, B)\n- Inmediato extendido (instrucciones I, L, S)',
    alu: 'ALU (Unidad Aritmético-Lógica)\n\nRealiza operaciones:\n- Aritméticas: suma, resta\n- Lógicas: AND, OR, XOR\n- Comparaciones: <, >=\nEl bit LSB indica resultado de comparación.',
    dataMem: 'Memoria de Datos\n\nMemoria RAM del programa.\nPuerto ad: dirección (de la ALU)\nPuerto di: dato a escribir (dato 2)\nSalida: dato leído (para Load)',
    muxB: 'Multiplexor B (Write-Back)\n\nSelecciona qué escribir en el registro destino:\n- Resultado de la ALU (R, I)\n- Dato leído de memoria (L)',
    muxC: 'Multiplexor C\n\nSelecciona para control de branch:\n- LSB normal (BEQ, BLT, BLTU)\n- LSB invertido por NOT (BNE, BGE, BGEU)',
    notGate: 'Compuerta NOT\n\nInvierte el bit LSB de la ALU.\nPermite implementar branches con condición negada (ej: BNE).',
    andGate: 'Compuerta AND\n\nCombina:\n- Señal Branch de la CU\n- Resultado del Mux C\nSolo permite salto si ambas son 1.'
};

// ============================================
// FUNCIONES DE DIBUJO BÁSICAS
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

function drawCircle(x, y, r, fill, stroke, lineW = 2) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
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
    
    if (comp.type === 'circle') {
        const centerX = comp.x + comp.width / 2;
        const centerY = comp.y + comp.height / 2;
        const radius = Math.min(comp.width, comp.height) / 2;
        drawCircle(centerX, centerY, radius, fill, stroke, lineW);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(comp.label, centerX, centerY);
    } else {
        drawRoundRect(comp.x, comp.y, comp.width, comp.height, 4, fill, stroke, lineW);
        ctx.shadowBlur = 0;
        
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
    
    // Etiqueta del MUX en el centro
    ctx.fillStyle = '#000';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(comp.label, comp.x + comp.width/2, comp.y + comp.height/2);
    
    // Etiquetas de entrada a la izquierda
    if (comp.inputs) {
        ctx.font = '9px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(comp.inputs[0], comp.x - 5, comp.y + comp.height * 0.3);
        ctx.fillText(comp.inputs[1], comp.x - 5, comp.y + comp.height * 0.7);
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
// DIBUJAR CONEXIONES SEGÚN ESPECIFICACIÓN
// ============================================

function drawConnections() {
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#666';
    
    // ===== 1. PC -> Memoria de Instrucciones =====
    drawLine(85, 155, 200, 155);
    drawArrow(198, 155, 200, 155, '#666');
    
    // ===== 2. PC -> Sumador =====
    drawLine(85, 190, 85, 250);
    drawLine(85, 250, 80, 250);
    drawArrow(82, 250, 80, 250, '#666');
    
    // ===== 3. Constante 4 -> Sumador =====
    ctx.fillStyle = '#2196F3';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('4', 35, 280);
    drawLine(45, 280, 80, 280);
    drawArrow(78, 280, 80, 280, '#666');
    
    // ===== 4. Sumador -> Mux D (entrada 0 - PC+4) =====
    drawLine(80, 310, 80, 360);
    drawLine(80, 360, 70, 360);
    
    // ===== 5. Orden & Extend -> Sumador (para branches) =====
    drawLine(270, 615, 270, 770);
    drawLine(270, 770, 80, 770);
    drawLine(80, 770, 80, 310);
    
    // ===== 6. Orden & Extend -> Mux D (entrada 1 - Salto) =====
    drawLine(340, 615, 340, 750);
    drawLine(340, 750, 30, 750);
    drawLine(30, 750, 30, 400);
    drawLine(30, 400, 50, 400);
    
    // ===== 7. Mux D -> PC =====
    drawLine(70, 430, 70, 800);
    drawLine(70, 800, 20, 800);
    drawLine(20, 800, 20, 155);
    drawLine(20, 155, 50, 155);
    drawArrow(48, 155, 50, 155, '#666');
    
    // ===== 8. Memoria Instrucciones -> Unidad Control (opcode, fun3, fun7) =====
    drawLine(300, 340, 300, 380);
    drawArrow(300, 378, 300, 380, '#666');
    
    // ===== 9. Memoria Instrucciones -> Banco Registros (rs1, rs2) =====
    drawLine(400, 240, 550, 240);
    drawLine(550, 240, 550, 320);
    drawArrow(550, 318, 550, 320, '#666');
    
    // ===== 10. Memoria Instrucciones -> Mux E (rs2 y rd) =====
    drawLine(400, 160, 450, 160);
    drawArrow(448, 160, 450, 160, '#666');
    
    // ===== 11. Memoria Instrucciones -> Orden & Extend =====
    drawLine(300, 340, 300, 550);
    drawLine(300, 550, 200, 550);
    drawLine(200, 550, 200, 580);
    drawArrow(200, 578, 200, 580, '#666');
    
    // ===== 12. Mux E -> Extensor Signo =====
    drawLine(490, 160, 550, 160);
    drawArrow(548, 160, 550, 160, '#666');
    
    // ===== 13. fun7 -> Extensor Signo (concatenación) =====
    ctx.font = '10px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('fun7', 490, 110);
    drawLine(520, 115, 615, 115);
    drawLine(615, 115, 615, 120);
    drawArrow(615, 118, 615, 120, '#666');
    
    // ===== 14. Extensor Signo -> Mux A (entrada 1 - inmediato) =====
    drawLine(680, 160, 780, 160);
    drawLine(780, 160, 780, 395);
    drawLine(780, 395, 820, 395);
    
    // ===== 15. Banco Registros -> ALU (dato 1) =====
    drawLine(750, 340, 800, 340);
    drawLine(800, 340, 800, 340);
    drawLine(800, 340, 920, 340);
    drawArrow(918, 340, 920, 340, '#666');
    
    // ===== 16. Banco Registros -> Mux A (dato 2, entrada 0) =====
    drawLine(750, 410, 790, 410);
    drawLine(790, 410, 790, 365);
    drawLine(790, 365, 820, 365);
    
    // ===== 17. Banco Registros -> Memoria Datos (di - dato a escribir) =====
    drawLine(750, 440, 1050, 440);
    drawLine(1050, 440, 1050, 430);
    drawLine(1050, 430, 1100, 430);
    drawArrow(1098, 430, 1100, 430, '#666');
    
    // ===== 18. Mux A -> ALU (segundo operando) =====
    drawLine(860, 380, 890, 380);
    drawLine(890, 380, 890, 410);
    drawLine(890, 410, 920, 410);
    drawArrow(918, 410, 920, 410, '#666');
    
    // ===== 19. ALU -> Memoria Datos (ad - dirección) =====
    drawLine(1020, 360, 1070, 360);
    drawLine(1070, 360, 1070, 350);
    drawLine(1070, 350, 1100, 350);
    drawArrow(1098, 350, 1100, 350, '#666');
    
    // ===== 20. ALU -> Mux B (entrada 0 - resultado ALU) =====
    drawLine(1020, 380, 1320, 380);
    drawLine(1320, 380, 1320, 365);
    drawLine(1320, 365, 1360, 365);
    
    // ===== 21. ALU -> Mux C (LSB para control de branches) =====
    drawLine(970, 450, 970, 550);
    drawLine(970, 550, 90, 550);
    drawLine(90, 550, 90, 590);
    
    // ===== 22. Memoria Datos -> Mux B (entrada 1 - dato leído) =====
    drawLine(1300, 390, 1330, 390);
    drawLine(1330, 390, 1330, 395);
    drawLine(1330, 395, 1360, 395);
    
    // ===== 23. Mux B -> Banco Registros (write back) =====
    drawLine(1400, 380, 1480, 380);
    drawLine(1480, 380, 1480, 50);
    drawLine(1480, 50, 700, 50);
    drawLine(700, 50, 700, 280);
    drawArrow(700, 278, 700, 280, '#666');
    
    // ===== 24. Mux C -> AND Gate =====
    drawLine(90, 660, 90, 680);
    drawLine(90, 680, 150, 680);
    drawLine(150, 680, 150, 690);
    drawArrow(150, 688, 150, 690, '#666');
    
    // ===== 25. Mux C -> NOT Gate =====
    drawLine(70, 610, 70, 700);
    drawLine(70, 700, 50, 700);
    drawLine(50, 700, 50, 720);
    drawArrow(50, 718, 50, 720, '#666');
    
    // ===== 26. NOT -> entrada alternativa del Mux C =====
    drawLine(80, 750, 80, 640);
    
    // ===== 27. AND Gate -> Mux D (selector) =====
    drawLine(210, 705, 250, 705);
    drawLine(250, 705, 250, 480);
    drawLine(250, 480, 80, 480);
    drawLine(80, 480, 80, 435);
    
    // ===== SEÑALES DE CONTROL (líneas punteadas) =====
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#999';
    
    // Control -> Mux A
    drawLine(380, 450, 840, 450);
    drawLine(840, 450, 840, 425);
    
    // Control -> Mux B
    drawLine(380, 460, 1380, 460);
    drawLine(1380, 460, 1380, 425);
    
    // Control -> Mux D
    drawLine(200, 470, 100, 470);
    drawLine(100, 470, 100, 435);
    
    // Control -> Mux E
    drawLine(350, 380, 350, 100);
    drawLine(350, 100, 470, 100);
    drawLine(470, 100, 470, 205);
    
    // Control -> Mux C
    drawLine(200, 480, 110, 480);
    drawLine(110, 480, 110, 625);
    
    // Control -> Banco Registros (RegWrite)
    drawLine(400, 440, 650, 440);
    drawLine(650, 440, 650, 480);
    
    // Control -> Memoria Datos (MemWrite, MemRead)
    drawLine(400, 430, 1200, 430);
    drawLine(1200, 430, 1200, 540);
    
    // Control -> AND (Branch signal)
    drawLine(200, 490, 180, 490);
    drawLine(180, 490, 180, 690);
    drawArrow(182, 690, 180, 690, '#999');
    
    // Control -> ALU (ALUOp)
    drawLine(400, 470, 970, 470);
    drawLine(970, 470, 970, 450);
    
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
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';

    drawConnections();

    // Dibujar componentes
    for (let key in components) {
        const comp = components[key];
        const isHov = hoveredComponent === key;
        const isSel = selectedComponent === key;
        const isActive = animationState ? animationState.activeComponents.has(key) : false;
        
        if (comp.type === 'mux') drawMux(comp, isHov, isSel, isActive);
        else if (comp.type === 'memory') drawMemory(comp, isHov, isSel, isActive);
        else if (comp.type === 'regfile') drawRegFile(comp, isHov, isSel, isActive);
        else if (comp.type === 'alu') drawALU(comp, isHov, isSel, isActive);
        else if (comp.type === 'control') drawControl(comp, isHov, isSel, isActive);
        else if (comp.type === 'circle') drawRect(comp, isHov, isSel, isActive);
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
const lines = instructionsText.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#') && !line.startsWith('//'));

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
function updateRegisterValue(index, value) {
if (index === 0) return;
const numValue = parseInt(value) || 0;
processor.registers[index] = numValue;
updateUI();
}
function updateMemoryValue(index, value) {
const numValue = parseInt(value) || 0;
processor.memory[index] = numValue;
updateUI();
}
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
item.innerHTML = `<span class='instruction-index'>${index}:</span>
                <span class='instruction-text'>${instr}</span>
                <button class='delete-btn' onclick='deleteInstruction(${index})'>🗑️</button>`;
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
        regDiv.innerHTML = `
            <div class="register-name">x${index}</div>
            <div class="register-value">${value}</div>
        `;
    } else {
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
memDiv.innerHTML = `<div class="memory-address">[${i * 4}]</div><input type="number" class="memory-value-input" value="${value}" onchange="updateMemoryValue(${i}, this.value)" onclick="this.select()">`;
container.appendChild(memDiv);
}
}

function updateControlSignals() {
const container = document.getElementById('controlSignals');
container.innerHTML = '';
Object.entries(processor.controlSignals).forEach(([signal, value]) => {
const signalDiv = document.createElement('div');
signalDiv.className = 'control-signal ' + (value ? 'active' : 'inactive');
signalDiv.innerHTML = '<div class="signal-name">${signal}</div><div class="signal-value">${value.toString()}</div>';
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
// ============================================
const animationConfig = {
duration: 2000,
pulseSpeed: 100,
dataFlowSpeed: 60,
highlightDuration: 3000
};
const animationState = {
activeComponents: new Set(),
activeBuses: [],
dataFlowing: [],
currentStep: 0,
isAnimating: false
};
// ============================================
// SECUENCIAS DE ANIMACIÓN - BASADAS EN ESPECIFICACIÓN
// ============================================

function getRTypeAnimationSequence(regs, state) {
const [rd, rs1, rs2] = regs;
return [
{
step: 1,
description: `🔵 PC envía dirección ${state.pc} a Memoria de Instrucciones`,
components: ['pc', 'instMem'],
buses: [{ from: 'pc', to: 'instMem', color: '#4A90E2', label: `PC=${state.pc}` }],
delay: 1200
},
{
step: 2,
description: `📋 Decodificación: rs1=x${rs1}, rs2=x${rs2}, rd=x${rd}. CU detecta tipo R`,
components: ['instMem', 'controlUnit', 'regFile'],
buses: [
{ from: 'instMem', to: 'controlUnit', color: '#FF6B6B', label: 'opcode' },
{ from: 'instMem', to: 'regFile', color: '#4ECDC4', label: rs1,rs2 }
],
delay: 1500
},
{
step: 3,
description: `📖 Banco lee dato1=${state.registers[rs1]} (x${rs1}) y dato2=${state.registers[rs2]} (x${rs2})`,
components: ['regFile', 'muxA'],
buses: [
{ from: 'regFile', to: 'alu', color: '#95E1D3', label: `d1=${state.registers[rs1]}` }
],
delay: 1500
},
{
step: 4,
description: '🔄 Mux A selecciona dato2 (no inmediato). CU controla selección',
components: ['muxA', 'alu', 'controlUnit'],
buses: [
{ from: 'muxA', to: 'alu', color: '#F38181', label: `d2=${state.registers[rs2]}` }
],
delay: 1500
},
{
step: 5,
description: `🧮 ALU calcula: ${state.registers[rs1]} ⊕ ${state.registers[rs2]} = ${state.internals.aluResult}`,
components: ['alu'],
delay: 1800
},
{
step: 6,
description: `💾 Mux B selecciona resultado ALU (no memoria). Write-back a x${rd}`,
components: ['alu', 'muxB', 'regFile'],
buses: [
{ from: 'alu', to: 'muxB', color: '#AA96DA', label: `${state.internals.aluResult}` },
{ from: 'muxB', to: 'regFile', color: '#FCBAD3', label: `→ x${rd}` }
],
delay: 1500
},
{
step: 7,
description: '🔢 Actualizar PC: PC+4 → Mux D → PC',
components: ['sumador', 'muxD', 'pc'],
delay: 1200
}
];
}

function getITypeAnimationSequence(regs, state) {
const [rd, rs1, imm] = regs;
return [
{
step: 1,
description: `🔵 PC=${state.pc} → Memoria de Instrucciones`,
components: ['pc', 'instMem'],
buses: [{ from: 'pc', to: 'instMem', color: '#4A90E2', label: `${state.pc}` }],
delay: 1200
},
{
step: 2,
description: `📋 Decodificación tipo I: rs1=x${rs1}, rd=x${rd}, inmediato=${imm}`,
components: ['instMem', 'controlUnit', 'muxE', 'signExtend'],
buses: [
{ from: 'instMem', to: 'controlUnit', color: '#FF6B6B', label: 'opcode' },
{ from: 'instMem', to: 'muxE', color: '#FFD93D', label: 'rs2/rd' },
{ from: 'muxE', to: 'signExtend', color: '#6BCB77', label: 'concat fun7' }
],
delay: 1500
},
{
step: 3,
description: `🔢 Extensor de signo: inmediato ${imm} extendido a 32 bits`,
components: ['signExtend', 'muxA'],
buses: [
{ from: 'signExtend', to: 'muxA', color: '#FFD93D', label: `${imm}` }
],
delay: 1500
},
{
step: 4,
description: `📖 Banco lee x${rs1}=${state.registers[rs1]}`,
components: ['regFile', 'alu'],
buses: [
{ from: 'regFile', to: 'alu', color: '#95E1D3', label: `${state.registers[rs1]}` }
],
delay: 1500
},
{
step: 5,
description: '🔄 Mux A selecciona inmediato (CU activa ALUSrc)',
components: ['muxA', 'alu', 'controlUnit'],
buses: [
{ from: 'muxA', to: 'alu', color: '#FFD93D', label: `${imm}` }
],
delay: 1500
},
{
step: 6,
description: `🧮 ALU: ${state.registers[rs1]} + ${imm} = ${state.internals.aluResult}`,
components: ['alu'],
delay: 1800
},
{
step: 7,
description: `💾 Mux B → resultado ALU → x${rd}=${state.internals.aluResult}`,
components: ['alu', 'muxB', 'regFile'],
buses: [
{ from: 'alu', to: 'muxB', color: '#AA96DA', label: `${state.internals.aluResult}` },
{ from: 'muxB', to: 'regFile', color: '#FCBAD3', label: `→ x${rd}` }
],
delay: 1500
},
{
step: 8,
description: '🔢 PC+4 → siguiente instrucción',
components: ['sumador', 'muxD', 'pc'],
delay: 1200
}
];
}
function getLoadAnimationSequence(regs, state) {
const [rd, rs1, offset] = regs;
const addr = state.internals.aluResult;
const memData = state.internals.memData;
return [
    {
        step: 1,
        description: `🔵 Fetch: PC=${state.pc}`,
        components: ['pc', 'instMem'],
        buses: [{ from: 'pc', to: 'instMem', color: '#4A90E2', label: `${state.pc}` }],
        delay: 1200
    },
    {
        step: 2,
        description: `📋 Decode tipo L: rs1=x${rs1}, offset=${offset}. Mux E selecciona rs2`,
        components: ['instMem', 'controlUnit', 'muxE', 'signExtend'],
        buses: [
            { from: 'instMem', to: 'muxE', color: '#FFD93D', label: 'rs2' },
            { from: 'muxE', to: 'signExtend', color: '#6BCB77', label: '+fun7' }
        ],
        delay: 1500
    },
    {
        step: 3,
        description: `🧮 ALU calcula dirección: x${rs1} + offset = ${addr}`,
        components: ['regFile', 'signExtend', 'muxA', 'alu'],
        buses: [
            { from: 'regFile', to: 'alu', color: '#95E1D3', label: `${state.registers[rs1]}` },
            { from: 'signExtend', to: 'muxA', color: '#FFD93D', label: `${offset}` },
            { from: 'muxA', to: 'alu', color: '#FFD93D', label: `${offset}` }
        ],
        delay: 1800
    },
    {
        step: 4,
        description: `💾 Leer de memoria: MEM[${addr}] = ${memData}`,
        components: ['alu', 'dataMem'],
        buses: [
            { from: 'alu', to: 'dataMem', color: '#AA96DA', label: `ad=${addr}` }
        ],
        delay: 1800
    },
    {
        step: 5,
        description: `🔄 Mux B selecciona dato de memoria (CU activa MemToReg)`,
        components: ['dataMem', 'muxB', 'controlUnit'],
        buses: [
            { from: 'dataMem', to: 'muxB', color: '#4ECDC4', label: `${memData}` }
        ],
        delay: 1500
    },
    {
        step: 6,
        description: `✅ Write-back: x${rd} = ${memData}`,
        components: ['muxB', 'regFile'],
        buses: [
            { from: 'muxB', to: 'regFile', color: '#FCBAD3', label: `→ x${rd}` }
        ],
        delay: 1500
    },
    {
        step: 7,
        description: `🔢 PC+4`,
        components: ['sumador', 'muxD', 'pc'],
        delay: 1200
    }
];
}
function getStoreAnimationSequence(regs, state) {
const [rs2, rs1, offset] = regs;
const addr = state.internals.aluResult;
const dataToStore = state.registers[rs2];
return [
    {
        step: 1,
        description: `🔵 Fetch instrucción tipo S`,
        components: ['pc', 'instMem'],
        buses: [{ from: 'pc', to: 'instMem', color: '#4A90E2', label: `${state.pc}` }],
        delay: 1200
    },
    {
        step: 2,
        description: `📋 Decode: rs1=x${rs1}, rs2=x${rs2}, offset=${offset}. Mux E selecciona rd`,
        components: ['instMem', 'controlUnit', 'muxE', 'signExtend'],
        buses: [
            { from: 'instMem', to: 'muxE', color: '#FFD93D', label: 'rd' },
            { from: 'muxE', to: 'signExtend', color: '#6BCB77', label: '+fun7' }
        ],
        delay: 1500
    },
    {
        step: 3,
        description: `🧮 ALU calcula dirección: x${rs1} + ${offset} = ${addr}`,
        components: ['regFile', 'signExtend', 'muxA', 'alu'],
        buses: [
            { from: 'regFile', to: 'alu', color: '#95E1D3', label: `${state.registers[rs1]}` },
            { from: 'signExtend', to: 'muxA', color: '#FFD93D', label: `${offset}` }
        ],
        delay: 1800
    },
    {
        step: 4,
        description: `📤 Banco envía dato2=x${rs2}=${dataToStore} a memoria (puerto di)`,
        components: ['regFile', 'dataMem'],
        buses: [
            { from: 'regFile', to: 'dataMem', color: '#F38181', label: `di=${dataToStore}` }
        ],
        delay: 1500
    },
    {
        step: 5,
        description: `💾 Escribir en memoria: MEM[${addr}] ← ${dataToStore}. CU activa MemWrite`,
        components: ['alu', 'dataMem', 'controlUnit'],
        buses: [
            { from: 'alu', to: 'dataMem', color: '#AA96DA', label: `ad=${addr}` }
        ],
        delay: 1800
    },
    {
        step: 6,
        description: `🔢 PC+4 (no hay write-back en Store)`,
        components: ['sumador', 'muxD', 'pc'],
        delay: 1200
    }
];
}
function getBranchAnimationSequence(regs, state) {
const [rs1, rs2, offset] = regs;
const taken = state.pc !== (state.oldPC || state.pc - 1) + 1;
return [
    {
        step: 1,
        description: `🔵 Fetch instrucción Branch`,
        components: ['pc', 'instMem'],
        buses: [{ from: 'pc', to: 'instMem', color: '#4A90E2', label: `${state.pc - (taken ? offset : 0)}` }],
        delay: 1200
    },
    {
        step: 2,
        description: `📋 Decode: comparar x${rs1} vs x${rs2}`,
        components: ['instMem', 'controlUnit', 'ordenExtend'],
        buses: [
            { from: 'instMem', to: 'controlUnit', color: '#FF6B6B', label: 'opcode, fun3' },
            { from: 'instMem', to: 'ordenExtend', color: '#FFD93D', label: 'offset' }
        ],
        delay: 1500
    },
    {
        step: 3,
        description: `📖 Leer x${rs1}=${state.registers[rs1]}, x${rs2}=${state.registers[rs2]}`,
        components: ['regFile', 'alu'],
        buses: [
            { from: 'regFile', to: 'alu', color: '#95E1D3', label: `${state.registers[rs1]}, ${state.registers[rs2]}` }
        ],
        delay: 1500
    },
    {
        step: 4,
        description: `🧮 ALU compara: ${state.registers[rs1]} vs ${state.registers[rs2]}`,
        components: ['alu', 'muxC', 'notGate'],
        delay: 1800
    },
    {
        step: 5,
        description: `⚙️ Control de salto: Mux C → ${taken ? 'NOT' : 'directo'} → AND con Branch`,
        components: ['muxC', taken ? 'notGate' : null, 'andGate', 'controlUnit'].filter(Boolean),
        delay: 1500
    },
    {
        step: 6,
        description: taken ? 
            `✅ SALTO TOMADO: Orden&Extend prepara offset, Mux D selecciona nueva dirección` :
            `❌ NO TOMADO: Mux D selecciona PC+4`,
        components: taken ? ['ordenExtend', 'sumador', 'muxD', 'pc'] : ['sumador', 'muxD', 'pc'],
        delay: 1500
    },
    {
        step: 7,
        description: `🔢 Nuevo PC = ${state.pc}`,
        components: ['pc'],
        delay: 1200
    }
];
}
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

return executeAnimationSequence(animationSequence);
}
// ============================================
// EJECUTAR SECUENCIA (devuelve Promise)
// ============================================
function executeAnimationSequence(sequence) {
return new Promise((resolve) => {
let currentIndex = 0;
function executeNextStep() {
        if (currentIndex >= sequence.length) {
            const waitParticles = () => {
                if (!animationState.dataFlowing || animationState.dataFlowing.length === 0) {
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
            waitParticles();
            return;
        }
        
        const step = sequence[currentIndex];
        
        updateStepDescription(step.description);
        
        animationState.activeComponents.clear();
        (step.components || []).forEach(comp => animationState.activeComponents.add(comp));
        
        animationState.activeBuses = step.buses || [];
        
        if (step.buses) {
            animateDataFlow(step.buses);
        }
        
        drawProcessor();
        
        currentIndex++;
        setTimeout(executeNextStep, step.delay || 600);
    }
    
    executeNextStep();
});
}
// ============================================
// ACTUALIZAR DESCRIPCIÓN
// ============================================
function updateStepDescription(description) {
const existingBox = document.querySelector('.step-description-box');
if (existingBox) existingBox.remove();
const box = document.createElement('div');
box.className = 'step-description-box';
box.innerHTML = `${description}`;
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
    font-weight: 600;
`;
document.body.appendChild(box);
}
// ============================================
// ANIMACIÓN DE FLUJO DE DATOS
// ============================================
function animateDataFlow(buses) {
const pathMap = {
'pc|instMem': [[85,155], [200,155]],
'instMem|controlUnit': [[300,340], [300,380]],
'instMem|regFile': [[400,240], [550,240], [550,320]],
'instMem|muxE': [[400,160], [450,160]],
'instMem|ordenExtend': [[300,340], [300,550], [200,550], [200,580]],
'muxE|signExtend': [[490,160], [550,160]],
'signExtend|muxA': [[680,160], [780,160], [780,395], [820,395]],
'regFile|alu': [[750,340], [800,340], [920,340]],
'regFile|muxA': [[750,410], [790,410], [790,365], [820,365]],
'regFile|dataMem': [[750,440], [1050,440], [1050,430], [1100,430]],
'muxA|alu': [[860,380], [890,380], [890,410], [920,410]],
'alu|dataMem': [[1020,360], [1070,360], [1070,350], [1100,350]],
'alu|muxB': [[1020,380], [1320,380], [1320,365], [1360,365]],
'alu|muxC': [[970,450], [970,550], [90,550], [90,590]],
'dataMem|muxB': [[1300,390], [1330,390], [1330,395], [1360,395]],
'muxB|regFile': [[1400,380], [1480,380], [1480,50], [700,50], [700,280]],
'muxC|andGate': [[90,660], [90,680], [150,680], [150,690]],
'ordenExtend|sumador': [[270,615], [270,770], [80,770], [80,310]],
'ordenExtend|muxD': [[340,615], [340,750], [30,750], [30,400], [50,400]],
'sumador|muxD': [[80,310], [80,360], [70,360]],
'muxD|pc': [[70,430], [70,800], [20,800], [20,155], [50,155]],
'andGate|muxD': [[210,705], [250,705], [250,480], [80,480], [80,435]]
};
function resolveName(name) {
    const map = { 
        immGen: 'signExtend', 
        immgen: 'signExtend', 
        aluControl: 'alu', 
        adderBranch: 'ordenExtend',
        muxWB: 'muxB',
        muxALU: 'muxA',
        muxPC: 'muxD',
        adderPC4: 'sumador',
        muxBranch: 'muxC',
        ordenSignExtend: 'ordenExtend'
    };
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
        const pts = pathMap[key].map(p => ({ x: p[0], y: p[1] }));
        if (fromCenter) pts.unshift({ x: fromCenter[0], y: fromCenter[1] });
        if (toCenter) pts.push({ x: toCenter[0], y: toCenter[1] });
        return pts;
    }

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
            path,
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
    particle.segmentIndex++;
    particle.segmentProgress = 0;
    if (particle.segmentIndex >= path.length - 1) {
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
// SOBRESCRIBIR drawProcessor PARA INCLUIR ANIMACIONES
// ============================================
const originalDrawProcessor = drawProcessor;
drawProcessor = function() {
ctx.fillStyle = '#FAFAFA';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#2C3E50';
ctx.font = 'bold 24px Arial';
ctx.textAlign = 'center';

if (animationState.isAnimating) {
    ctx.globalAlpha = 0.3;
}
drawConnections();
ctx.globalAlpha = 1.0;

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
    
    ctx.moveTo(path[0].x, path[0].y);
    
    for (let i = 0; i < particle.segmentIndex; i++) {
        const p = path[i + 1];
        if (p) ctx.lineTo(p.x, p.y);
    }
    
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

for (let key in components) {
    const comp = components[key];
    const isHov = hoveredComponent === key;
    const isSel = selectedComponent === key;
    const isActive = animationState.activeComponents.has(key);
    
    const originalColor = comp.color;
    if (isActive) {
        comp.color = '#FFFFE0';
        ctx.shadowColor = '#00FF00';
        ctx.shadowBlur = 20;
    }
    
    if (comp.type === 'mux') drawMux(comp, isHov, isSel, isActive);
    else if (comp.type === 'memory') drawMemory(comp, isHov, isSel, isActive);
    else if (comp.type === 'regfile') drawRegFile(comp, isHov, isSel, isActive);
    else if (comp.type === 'alu') drawALU(comp, isHov, isSel, isActive);
    else if (comp.type === 'control') drawControl(comp, isHov, isSel, isActive);
    else if (comp.type === 'circle') drawRect(comp, isHov, isSel, isActive);
    else drawRect(comp, isHov, isSel, isActive);
    
    ctx.shadowBlur = 0;
    comp.color = originalColor;
}

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
// SOBRESCRIBIR executeInstruction para esperar animación
// ============================================
const originalExecuteInstruction = executeInstruction;
executeInstruction = async function() {
const oldPC = processor.pc;
originalExecuteInstruction();
processor.oldPC = oldPC;
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
            <h4 onclick="toggleSection('controlSignalsSection')">
                🎛️ Señales de Control
                <span class="toggle-icon">▼</span>
            </h4>
            <div id="controlSignalsSection" class="collapsible-content">
                <div id="diagramControlSignals" class="control-signals-mini"></div>
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

