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
    drawLine(310, 340, 310, 550);
    drawLine(310, 550, 200, 550);
    drawLine(200, 550, 200, 580);
    drawArrow(200, 578, 200, 580, '#666');
    
    // ===== 12. Mux E -> Extensor Signo =====
    drawLine(490, 160, 550, 160);
    drawArrow(548, 160, 550, 160, '#666');
    
    // ===== 13. fun7 -> Extensor Signo (concatenación) =====
    //Arreglar
    drawLine(400, 115, 515, 115);
    drawLine(515, 115, 515, 155);
    drawArrow(515, 135, 515, 155, '#666');
    
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
    drawLine(1020, 380, 1060, 380);
    drawLine(1060, 380, 1060, 200);
    drawLine(1060, 200, 1320, 200);
    drawLine(1320, 200, 1320, 365);
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
    drawLine(100, 470, 100, 420)
    drawLine(100, 420, 92, 430);
    
    // Control -> Mux E
    drawLine(400, 420, 470, 420);
    drawLine(470, 420, 470, 205);
    
    
    // Control -> Mux C
    drawLine(200, 480, 110, 480);
    drawLine(110, 480, 110, 625);
    drawLine(110, 625, 95, 625);
    
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
{ from: 'regFile', to: 'alu', color: '#95E1D3', label: `d1=${state.registers[rs1]}` },
{ from: 'regFile', to: 'muxA', color: '#F38181', label: `d2=${state.registers[rs2]}` }
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
{ from: 'instMem', to: 'signExtend', color: '#6BCB77', label: 'concat fun7' }
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
'alu|muxB': [[1020,380], [1060,380], [1060,200], [1320,200], [1320,365], [1360,365]],
'alu|muxC': [[970,450], [970,550], [90,550], [90,590]],
'dataMem|muxB': [[1300,390], [1330,390], [1330,395], [1360,395]],
'muxB|regFile': [[1400,380], [1480,380], [1480,50], [700,50], [700,280]],
'muxC|andGate': [[90,660], [90,680], [150,680], [150,690]],
'ordenExtend|sumador': [[270,615], [270,770], [80,770], [80,310]],
'ordenExtend|muxD': [[340,615], [340,750], [30,750], [30,400], [50,400]],
'sumador|muxD': [[80,310], [80,360], [70,360]],
'muxD|pc': [[70,430], [70,800], [20,800], [20,155], [50,155]],
'andGate|muxD': [[210,705], [250,705], [250,480], [80,480], [80,435]],
'instMem|signExtend':[[400,115],[515,115],[515,160]]
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
