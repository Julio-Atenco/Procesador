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

// ============================================
// FUNCIÓN DE VALIDACIÓN DE INSTRUCCIONES
// ============================================
function validateInstruction(instrText) {
    if (!instrText || !instrText.trim()) {
        return { valid: false, error: 'La instrucción no puede estar vacía' };
    }

    const originalText = instrText.trim();
    const parts = originalText.toLowerCase().replace(/,/g, ' ').split(/\s+/).filter(p => p.length > 0);
    
    if (parts.length === 0) {
        return { valid: false, error: 'Instrucción vacía o inválida' };
    }

    const mnemonic = parts[0];

    // Definir tipos de instrucciones válidas
    const validInstructions = {
        // R-Type (3 registros): add, sub, and, or, xor, slt, sltu, sll, srl, sra
        rType: ['add', 'sub', 'and', 'or', 'xor', 'slt', 'sltu', 'sll', 'srl', 'sra'],
        // I-Type (2 registros + inmediato): addi, andi, ori, xori, slti, sltiu, slli, srli, srai
        iType: ['addi', 'andi', 'ori', 'xori', 'slti', 'sltiu', 'slli', 'srli', 'srai'],
        // Load (1 registro + offset(registro)): lw, lh, lb, lhu, lbu
        load: ['lw', 'lh', 'lb', 'lhu', 'lbu'],
        // Store (1 registro + offset(registro)): sw, sh, sb
        store: ['sw', 'sh', 'sb'],
        // Branch (2 registros + inmediato): beq, bne, blt, bge, bltu, bgeu
        branch: ['beq', 'bne', 'blt', 'bge', 'bltu', 'bgeu']
    };

    // Verificar si la instrucción es válida
    const allValidInstructions = [
        ...validInstructions.rType,
        ...validInstructions.iType,
        ...validInstructions.load,
        ...validInstructions.store,
        ...validInstructions.branch
    ];

    if (!allValidInstructions.includes(mnemonic)) {
        return { valid: false, error: `Instrucción desconocida: "${mnemonic}". Instrucciones válidas: ${allValidInstructions.join(', ')}` };
    }

    // Validar cantidad de operandos
    const operands = parts.slice(1);

    // R-Type: debe tener exactamente 3 registros (rd, rs1, rs2)
    if (validInstructions.rType.includes(mnemonic)) {
        if (operands.length !== 3) {
            return { valid: false, error: `${mnemonic.toUpperCase()} requiere 3 operandos: ${mnemonic} xd, xs1, xs2` };
        }
        // Validar que todos sean registros
        for (let i = 0; i < 3; i++) {
            if (!operands[i].startsWith('x') || isNaN(parseInt(operands[i].substring(1)))) {
                return { valid: false, error: `${mnemonic.toUpperCase()}: El operando ${i + 1} debe ser un registro (ej: x1, x2)` };
            }
            const regNum = parseInt(operands[i].substring(1));
            if (regNum < 0 || regNum > 31) {
                return { valid: false, error: `${mnemonic.toUpperCase()}: El registro x${regNum} es inválido. Los registros válidos son x0 a x31` };
            }
        }
    }

    // I-Type: debe tener 2 registros (rd, rs1) y 1 inmediato
    else if (validInstructions.iType.includes(mnemonic)) {
        if (operands.length !== 3) {
            return { valid: false, error: `${mnemonic.toUpperCase()} requiere 3 operandos: ${mnemonic} xd, xs1, inmediato` };
        }
        // Primer operando debe ser registro
        if (!operands[0].startsWith('x') || isNaN(parseInt(operands[0].substring(1)))) {
            return { valid: false, error: `${mnemonic.toUpperCase()}: El primer operando debe ser un registro (ej: x1)` };
        }
        const rdNum = parseInt(operands[0].substring(1));
        if (rdNum < 0 || rdNum > 31) {
            return { valid: false, error: `${mnemonic.toUpperCase()}: El registro x${rdNum} es inválido` };
        }

        // Segundo operando debe ser registro
        if (!operands[1].startsWith('x') || isNaN(parseInt(operands[1].substring(1)))) {
            return { valid: false, error: `${mnemonic.toUpperCase()}: El segundo operando debe ser un registro (ej: x2)` };
        }
        const rs1Num = parseInt(operands[1].substring(1));
        if (rs1Num < 0 || rs1Num > 31) {
            return { valid: false, error: `${mnemonic.toUpperCase()}: El registro x${rs1Num} es inválido` };
        }

        // Tercer operando debe ser inmediato (número)
        if (isNaN(parseInt(operands[2]))) {
            return { valid: false, error: `${mnemonic.toUpperCase()}: El tercer operando debe ser un número inmediato, no un registro` };
        }
    }

    // Load: debe tener 1 registro y offset(registro)
    else if (validInstructions.load.includes(mnemonic)) {
        if (operands.length !== 2) {
            return { valid: false, error: `${mnemonic.toUpperCase()} requiere 2 operandos: ${mnemonic} xd, offset(xs1)` };
        }
        // Primer operando debe ser registro
        if (!operands[0].startsWith('x') || isNaN(parseInt(operands[0].substring(1)))) {
            return { valid: false, error: `${mnemonic.toUpperCase()}: El primer operando debe ser un registro (ej: x1)` };
        }
        const rdNum = parseInt(operands[0].substring(1));
        if (rdNum < 0 || rdNum > 31) {
            return { valid: false, error: `${mnemonic.toUpperCase()}: El registro x${rdNum} es inválido` };
        }

        // Segundo operando debe tener formato offset(registro)
        const offsetMatch = operands[1].match(/^(-?\d+)\(x(\d+)\)$/);
        if (!offsetMatch) {
            return { valid: false, error: `${mnemonic.toUpperCase()}: El segundo operando debe tener formato "offset(xN)", ej: 0(x1) o 4(x2)` };
        }
        const offsetReg = parseInt(offsetMatch[2]);
        if (offsetReg < 0 || offsetReg > 31) {
            return { valid: false, error: `${mnemonic.toUpperCase()}: El registro x${offsetReg} es inválido` };
        }
    }

    // Store: debe tener 1 registro y offset(registro)
    else if (validInstructions.store.includes(mnemonic)) {
        if (operands.length !== 2) {
            return { valid: false, error: `${mnemonic.toUpperCase()} requiere 2 operandos: ${mnemonic} xs2, offset(xs1)` };
        }
        // Primer operando debe ser registro
        if (!operands[0].startsWith('x') || isNaN(parseInt(operands[0].substring(1)))) {
            return { valid: false, error: `${mnemonic.toUpperCase()}: El primer operando debe ser un registro (ej: x1)` };
        }
        const rs2Num = parseInt(operands[0].substring(1));
        if (rs2Num < 0 || rs2Num > 31) {
            return { valid: false, error: `${mnemonic.toUpperCase()}: El registro x${rs2Num} es inválido` };
        }

        // Segundo operando debe tener formato offset(registro)
        const offsetMatch = operands[1].match(/^(-?\d+)\(x(\d+)\)$/);
        if (!offsetMatch) {
            return { valid: false, error: `${mnemonic.toUpperCase()}: El segundo operando debe tener formato "offset(xN)", ej: 0(x1) o 4(x2)` };
        }
        const offsetReg = parseInt(offsetMatch[2]);
        if (offsetReg < 0 || offsetReg > 31) {
            return { valid: false, error: `${mnemonic.toUpperCase()}: El registro x${offsetReg} es inválido` };
        }
    }

    // Branch: debe tener 2 registros (rs1, rs2) y 1 inmediato
    else if (validInstructions.branch.includes(mnemonic)) {
        if (operands.length !== 3) {
            return { valid: false, error: `${mnemonic.toUpperCase()} requiere 3 operandos: ${mnemonic} xs1, xs2, inmediato` };
        }
        // Primer y segundo operandos deben ser registros
        for (let i = 0; i < 2; i++) {
            if (!operands[i].startsWith('x') || isNaN(parseInt(operands[i].substring(1)))) {
                return { valid: false, error: `${mnemonic.toUpperCase()}: El operando ${i + 1} debe ser un registro (ej: x1)` };
            }
            const regNum = parseInt(operands[i].substring(1));
            if (regNum < 0 || regNum > 31) {
                return { valid: false, error: `${mnemonic.toUpperCase()}: El registro x${regNum} es inválido` };
            }
        }
        // Tercer operando debe ser inmediato
        if (isNaN(parseInt(operands[2]))) {
            return { valid: false, error: `${mnemonic.toUpperCase()}: El tercer operando debe ser un número inmediato` };
        }
    }

    return { valid: true, error: null };
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
    const validation = validateInstruction(instruction);
    
    if (!validation.valid) {
        // Mostrar notificación de error
        showErrorNotification(validation.error);
        addToLog(`❌ Error: ${validation.error}`);
        return;
    }

    if (instruction.trim()) {
        processor.instructions.push(instruction.trim());
        updateInstructionList();
        addToLog(`✓ Instrucción agregada: ${instruction.trim()}`);
    }
}
function addMultipleInstructions(instructionsText) {
    if (!instructionsText.trim()) return;
    const lines = instructionsText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#') && !line.startsWith('//'));

    let successCount = 0;
    let errorCount = 0;

    lines.forEach(line => {
        if (line) {
            const validation = validateInstruction(line);
            if (validation.valid) {
                processor.instructions.push(line);
                successCount++;
            } else {
                errorCount++;
                addToLog(`❌ Error en línea "${line}": ${validation.error}`);
                showErrorNotification(`Error en línea: ${line}\n${validation.error}`);
            }
        }
    });

    updateInstructionList();
    addToLog(`✓ Se agregaron ${successCount} instrucciones${errorCount > 0 ? ` (${errorCount} errores)` : ''}`);
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
signalDiv.innerHTML = `<div class="signal-name">${signal}</div><div class="signal-value">${value.toString()}</div>`;
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

// ============================================
// FUNCIÓN PARA MOSTRAR NOTIFICACIONES DE ERROR
// ============================================
function showErrorNotification(message) {
    // Crear contenedor de notificación si no existe
    let notificationContainer = document.getElementById('errorNotificationContainer');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'errorNotificationContainer';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(notificationContainer);
    }

    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.style.cssText = `
        background-color: #ff4444;
        color: white;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        font-family: Arial, sans-serif;
        font-size: 14px;
        animation: slideIn 0.3s ease-in-out;
        word-wrap: break-word;
        white-space: pre-wrap;
    `;
    
    notification.innerHTML = `
        <strong>❌ Error:</strong><br>${message}
    `;

    notificationContainer.appendChild(notification);

    // Auto-eliminar la notificación después de 5 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in-out';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Añadir estilos para las animaciones de notificación
if (!document.getElementById('notificationStyles')) {
    const style = document.createElement('style');
    style.id = 'notificationStyles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
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