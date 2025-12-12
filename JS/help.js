// ============================================
// SISTEMA DE AYUDA - MANUAL DE USUARIO
// ============================================

const helpContent = {
    inicio: {
        title: "🚀 Inicio Rápido",
        content: `
            <h3>¡Bienvenido al Simulador RISC-V!</h3>
            <p>Este simulador te permite escribir y ejecutar código ensamblador RISC-V paso a paso.</p>
            
            <div class="help-steps">
                <div class="help-step">
                    <span class="step-number">1</span>
                    <div class="step-content">
                        <h4>Escribe una instrucción</h4>
                        <code>addi x1, x0, 10</code>
                        <p>Presiona ➕ o Enter</p>
                    </div>
                </div>
                
                <div class="help-step">
                    <span class="step-number">2</span>
                    <div class="step-content">
                        <h4>Ejecuta paso a paso</h4>
                        <p>Haz clic en <strong>▶️ Ejecutar Paso</strong></p>
                        <p>Observa cómo x1 = 10</p>
                    </div>
                </div>
                
                <div class="help-step">
                    <span class="step-number">3</span>
                    <div class="step-content">
                        <h4>Explora el diagrama</h4>
                        <p>Cambia a la vista <strong>📊 Diagrama</strong></p>
                        <p>Ve cómo fluyen los datos</p>
                    </div>
                </div>
            </div>
        `
    },
    
    instrucciones: {
        title: "📝 Agregar Instrucciones",
        content: `
            <h3>Formas de agregar código</h3>
            
            <div class="help-option">
                <h4>✏️ Una por una</h4>
                <p>Escribe en el campo de texto y presiona ➕</p>
                <code>add x3, x1, x2</code>
            </div>
            
            <div class="help-option">
                <h4>📄 Múltiples instrucciones</h4>
                <p>Clic en <strong>📄 Cargar Múltiples</strong></p>
                <pre># Programa de ejemplo
addi x1, x0, 10
addi x2, x0, 20
add x3, x1, x2
sw x3, 0, x0</pre>
                <p>Puedes usar # o // para comentarios</p>
            </div>
            
            <div class="help-option">
                <h4>🗑️ Eliminar</h4>
                <ul>
                    <li>Botón 🗑️ junto a cada instrucción</li>
                    <li><strong>🗑️ Limpiar Todo</strong> para borrar todas</li>
                </ul>
            </div>
        `
    },
    
    controles: {
        title: "🎮 Controles de Ejecución",
        content: `
            <h3>Botones de control</h3>
            
            <table class="help-table">
                <tr>
                    <td><strong>▶️ Ejecutar Paso</strong></td>
                    <td>Ejecuta UNA instrucción a la vez</td>
                </tr>
                <tr>
                    <td><strong>⏩ Ejecutar Todo</strong></td>
                    <td>Ejecuta el programa completo</td>
                </tr>
                <tr>
                    <td><strong>🔄 Reiniciar</strong></td>
                    <td>Limpia registros, memoria y PC</td>
                </tr>
            </table>
            
            <div class="help-tip">
                <strong>💡 Consejo:</strong> Usa "Ejecutar Paso" para aprender. 
                Verás exactamente qué hace cada instrucción.
            </div>
            
            <h4>📍 Program Counter (PC)</h4>
            <p>Indica qué instrucción se ejecutará a continuación.</p>
            <p>El PC avanza automáticamente, excepto en saltos (branch).</p>
        `
    },
    
    componentes: {
        title: "🖥️ Componentes del Procesador",
        content: `
            <h3>Elementos principales</h3>
            
            <div class="component-grid">
                <div class="component-item">
                    <h4>📊 Banco de Registros</h4>
                    <p>32 registros (x0-x31) para datos temporales</p>
                    <p><strong>x0</strong> siempre es 0</p>
                    <p>🔵 Azul = tiene valor | ⚪ Gris = vacío</p>
                    <p><em>💡 Puedes editarlos haciendo clic</em></p>
                </div>
                
                <div class="component-item">
                    <h4>🔧 ALU</h4>
                    <p>Realiza operaciones:</p>
                    <ul>
                        <li>Suma, resta</li>
                        <li>AND, OR, XOR</li>
                        <li>Desplazamientos</li>
                        <li>Comparaciones</li>
                    </ul>
                </div>
                
                <div class="component-item">
                    <h4>💾 Memoria de Datos</h4>
                    <p>Almacena datos del programa</p>
                    <p>Direcciones: 0, 4, 8, 12, ...</p>
                    <p><code>sw x1, 0, x2</code> → guarda</p>
                    <p><code>lw x3, 0, x2</code> → carga</p>
                    <p><em>💡 También editable</em></p>
                </div>
                
                <div class="component-item">
                    <h4>⚙️ Unidad de Control</h4>
                    <p>Genera señales según la instrucción:</p>
                    <ul>
                        <li><strong>RegWrite:</strong> escribir registro</li>
                        <li><strong>MemWrite:</strong> escribir memoria</li>
                        <li><strong>ALUSrc:</strong> usar inmediato</li>
                        <li><strong>Branch:</strong> salto condicional</li>
                    </ul>
                </div>
            </div>
        `
    },
    
    tipos: {
        title: "📚 Tipos de Instrucciones",
        content: `
            <h3>Instrucciones soportadas</h3>
            
            <div class="instruction-type">
                <h4>🟦 Tipo R (Registro-Registro)</h4>
                <pre>add  x1, x2, x3    # x1 = x2 + x3
sub  x1, x2, x3    # x1 = x2 - x3
and  x1, x2, x3    # x1 = x2 & x3
or   x1, x2, x3    # x1 = x2 | x3
xor  x1, x2, x3    # x1 = x2 ^ x3
slt  x1, x2, x3    # x1 = (x2 < x3)</pre>
            </div>
            
            <div class="instruction-type">
                <h4>🟩 Tipo I (Inmediato)</h4>
                <pre>addi  x1, x2, 100  # x1 = x2 + 100
andi  x1, x2, 15   # x1 = x2 & 15
ori   x1, x2, 255  # x1 = x2 | 255
slti  x1, x2, 10   # x1 = (x2 < 10)
slli  x1, x2, 3    # x1 = x2 << 3</pre>
            </div>
            
            <div class="instruction-type">
                <h4>🟨 Load (Cargar)</h4>
                <pre>lw  x1, 0, x2      # x1 = MEM[x2 + 0]
lh  x1, 4, x2      # Half-word
lb  x1, 8, x2      # Byte</pre>
            </div>
            
            <div class="instruction-type">
                <h4>🟧 Store (Guardar)</h4>
                <pre>sw  x1, 0, x2      # MEM[x2 + 0] = x1
sh  x1, 4, x2      # Half-word
sb  x1, 8, x2      # Byte</pre>
            </div>
            
            <div class="instruction-type">
                <h4>🟥 Branch (Saltos)</h4>
                <pre>beq  x1, x2, 3     # Si x1 == x2
bne  x1, x2, -2    # Si x1 != x2
blt  x1, x2, 5     # Si x1 < x2
bge  x1, x2, 1     # Si x1 >= x2</pre>
            </div>
        `
    },
    
    ejemplos: {
        title: "💡 Ejemplos de Código",
        content: `
            <h3>Programas de ejemplo</h3>
            
            <div class="code-example">
                <h4>📊 Suma Simple</h4>
                <pre># Sumar dos números
addi x1, x0, 15
addi x2, x0, 27
add x3, x1, x2
sw x3, 0, x0</pre>
                <button class="btn-copy" data-code="addi x1, x0, 15
addi x2, x0, 27
add x3, x1, x2
sw x3, 0, x0">📋 Copiar</button>
            </div>
            
            <div class="code-example">
                <h4>🔢 Fibonacci</h4>
                <pre># Primeros números Fibonacci
addi x1, x0, 0
addi x2, x0, 1
addi x5, x0, 0
sw x1, 0, x5
addi x5, x5, 4
sw x2, 0, x5
addi x5, x5, 4
add x6, x1, x2
sw x6, 0, x5
add x1, x2, x0
add x2, x6, x0</pre>
                <button class="btn-copy" data-code="addi x1, x0, 0
addi x2, x0, 1
addi x5, x0, 0
sw x1, 0, x5
addi x5, x5, 4
sw x2, 0, x5
addi x5, x5, 4
add x6, x1, x2
sw x6, 0, x5
add x1, x2, x0
add x2, x6, x0">📋 Copiar</button>
            </div>
            
            <div class="code-example">
                <h4>↩️ Loop (Contador)</h4>
                <pre># Cuenta de 0 a 5
addi x1, x0, 0
addi x2, x0, 5
addi x1, x1, 1
blt x1, x2, -1</pre>
                <button class="btn-copy" data-code="addi x1, x0, 0
addi x2, x0, 5
addi x1, x1, 1
blt x1, x2, -1">📋 Copiar</button>
            </div>
            
            <div class="code-example">
                <h4>🔍 Máximo de 3 números</h4>
                <pre># Encontrar el mayor
addi x1, x0, 15
addi x2, x0, 42
addi x3, x0, 28
add x4, x1, x0
bge x4, x2, 2
add x4, x2, x0
bge x4, x3, 2
add x4, x3, x0
sw x4, 0, x0</pre>
                <button class="btn-copy" data-code="addi x1, x0, 15
addi x2, x0, 42
addi x3, x0, 28
add x4, x1, x0
bge x4, x2, 2
add x4, x2, x0
bge x4, x3, 2
add x4, x3, x0
sw x4, 0, x0">📋 Copiar</button>
            </div>
        `
    },
    
    diagrama: {
        title: "🎨 Vista Diagrama",
        content: `
            <h3>Visualización del Datapath</h3>
            
            <p>El diagrama muestra todos los componentes internos del procesador:</p>
            
            <div class="diagram-features">
                <div class="feature-item">
                    <h4>🖱️ Interactivo</h4>
                    <p>Haz clic en cualquier componente para ver su descripción</p>
                </div>
                
                <div class="feature-item">
                    <h4>🌈 Códigos de Color</h4>
                    <ul>
                        <li>🟢 Verde = Componente activo</li>
                        <li>🟡 Amarillo = Seleccionado</li>
                        <li>🔵 Azul = Datos fluyendo</li>
                        <li>⚪ Gris = Inactivo</li>
                    </ul>
                </div>
                
                <div class="feature-item">
                    <h4>⚡ Animaciones</h4>
                    <p>Al ejecutar código, verás:</p>
                    <ul>
                        <li>Datos moviéndose por los buses</li>
                        <li>Componentes iluminándose</li>
                        <li>Valores etiquetados</li>
                        <li>Descripciones paso a paso</li>
                    </ul>
                </div>
                
                <div class="feature-item">
                    <h4>🎛️ Panel de Control</h4>
                    <p>Panel flotante con:</p>
                    <ul>
                        <li>Estado del PC</li>
                        <li>Botones de ejecución</li>
                        <li>Control de velocidad</li>
                        <li>Vista rápida de registros</li>
                    </ul>
                </div>
            </div>
            
            <div class="help-tip">
                <strong>💡 Tip:</strong> Ajusta la velocidad de animación con el deslizador 
                para ver los detalles más claramente.
            </div>
        `
    },
    
    problemas: {
        title: "🐛 Solución de Problemas",
        content: `
            <h3>Preguntas frecuentes</h3>
            
            <div class="faq-item">
                <h4>❓ No pasa nada al ejecutar</h4>
                <ul>
                    <li>✅ Verifica que hayas agregado instrucciones</li>
                    <li>✅ Revisa que el PC no esté al final</li>
                    <li>✅ Usa "Reiniciar" para empezar de nuevo</li>
                </ul>
            </div>
            
            <div class="faq-item">
                <h4>❓ Mi instrucción no se agrega</h4>
                <ul>
                    <li>✅ Sintaxis: <code>operacion destino, fuente1, fuente2</code></li>
                    <li>✅ Registros: x0 a x31</li>
                    <li>✅ Usa comas entre operandos</li>
                </ul>
            </div>
            
            <div class="faq-item">
                <h4>❓ Valores incorrectos</h4>
                <ul>
                    <li>✅ x0 siempre es 0 (no se puede cambiar)</li>
                    <li>✅ Verifica offsets en lw/sw</li>
                    <li>✅ Direcciones de memoria van de 4 en 4</li>
                </ul>
            </div>
            
            <div class="faq-item">
                <h4>❓ Animaciones muy rápidas/lentas</h4>
                <ul>
                    <li>✅ En el diagrama, ajusta el deslizador</li>
                    <li>✅ Rango: 500ms (rápido) - 5000ms (lento)</li>
                </ul>
            </div>
            
            <div class="help-tip">
                <strong>💡 Consejo:</strong> Usa "Ejecutar Paso" en lugar de "Ejecutar Todo" 
                cuando estés depurando o aprendiendo.
            </div>
        `
    },
    
    consejos: {
        title: "💡 Consejos y Trucos",
        content: `
            <h3>Mejora tu experiencia</h3>
            
            <div class="tips-section">
                <h4>🎯 Para Aprender</h4>
                <ul>
                    <li>Empieza con una instrucción a la vez</li>
                    <li>Observa el diagrama mientras ejecutas</li>
                    <li>Lee el log de ejecución</li>
                    <li>Experimenta editando registros manualmente</li>
                </ul>
            </div>
            
            <div class="tips-section">
                <h4>📝 Para Programar</h4>
                <ul>
                    <li>Usa comentarios (# o //) para documentar</li>
                    <li>Prueba tu código incrementalmente</li>
                    <li>Guarda resultados intermedios en memoria</li>
                    <li>Aprovecha x0 como fuente de ceros</li>
                </ul>
            </div>
            
            <div class="tips-section">
                <h4>🔍 Para Depurar</h4>
                <ul>
                    <li>Ejecuta paso a paso, no "Ejecutar Todo"</li>
                    <li>Verifica el PC constantemente</li>
                    <li>Revisa valores en registros después de cada paso</li>
                    <li>Observa los operandos de la ALU</li>
                </ul>
            </div>
            
            <div class="tips-section">
                <h4>⚡ Atajos</h4>
                <ul>
                    <li><kbd>Enter</kbd> para agregar instrucción</li>
                    <li>Clic en registros/memoria para editar</li>
                    <li>Usa el botón de colapsar en el panel</li>
                    <li>Copia ejemplos con el botón 📋</li>
                </ul>
            </div>
        `
    }
};

// ============================================
// CREAR MODAL DE AYUDA
// ============================================

function createHelpModal() {
    const modal = document.createElement('div');
    modal.id = 'helpModal';
    modal.className = 'help-modal';
    modal.innerHTML = `
        <div class="help-modal-overlay"></div>
        <div class="help-modal-content">
            <div class="help-modal-header">
                <h2>📚 Manual de Usuario - Simulador RISC-V</h2>
                <button class="help-close-btn">✕</button>
            </div>
            
            <div class="help-modal-body">
                <div class="help-sidebar">
                    <button class="help-nav-btn active" data-section="inicio">🚀 Inicio Rápido</button>
                    <button class="help-nav-btn" data-section="instrucciones">📝 Agregar Código</button>
                    <button class="help-nav-btn" data-section="controles">🎮 Controles</button>
                    <button class="help-nav-btn" data-section="componentes">🖥️ Componentes</button>
                    <button class="help-nav-btn" data-section="tipos">📚 Instrucciones</button>
                    <button class="help-nav-btn" data-section="ejemplos">💡 Ejemplos</button>
                    <button class="help-nav-btn" data-section="diagrama">🎨 Diagrama</button>
                    <button class="help-nav-btn" data-section="problemas">🐛 Problemas</button>
                    <button class="help-nav-btn" data-section="consejos">💡 Consejos</button>
                </div>
                
                <div class="help-content-area">
                    <div id="helpContentDisplay"></div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setupHelpListeners();
    showHelpSection('inicio');
}

// ============================================
// CONFIGURAR EVENTOS
// ============================================

function setupHelpListeners() {
    const modal = document.getElementById('helpModal');
    const closeBtn = modal.querySelector('.help-close-btn');
    const overlay = modal.querySelector('.help-modal-overlay');
    const navButtons = modal.querySelectorAll('.help-nav-btn');
    
    // Cerrar modal
    closeBtn.addEventListener('click', closeHelpModal);
    overlay.addEventListener('click', closeHelpModal);
    
    // Navegación
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            showHelpSection(section);
            
            // Actualizar botón activo
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeHelpModal();
        }
    });
}

function showHelpSection(section) {
    const contentDisplay = document.getElementById('helpContentDisplay');
    const sectionData = helpContent[section];
    
    if (sectionData) {
        contentDisplay.innerHTML = `
            <h2>${sectionData.title}</h2>
            ${sectionData.content}
        `;
        
        // Configurar botones de copiar
        setupCopyButtons();
    }
}

function setupCopyButtons() {
    const copyButtons = document.querySelectorAll('.btn-copy');
    copyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const code = btn.dataset.code;
            copyToClipboard(code);
            
            // Mostrar feedback
            const originalText = btn.textContent;
            btn.textContent = '✓ Copiado!';
            btn.style.background = '#48bb78';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        });
    });
}

function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

function openHelpModal() {
    const modal = document.getElementById('helpModal');
    if (!modal) {
        createHelpModal();
    }
    document.getElementById('helpModal').style.display = 'flex';
}

function closeHelpModal() {
    document.getElementById('helpModal').style.display = 'none';
}

// ============================================
// BOTÓN DE AYUDA FLOTANTE
// ============================================

function createHelpButton() {
    const helpBtn = document.createElement('button');
    helpBtn.id = 'floatingHelpBtn';
    helpBtn.className = 'floating-help-btn';
    helpBtn.innerHTML = '❔';
    helpBtn.title = 'Ayuda y Manual de Usuario';
    
    helpBtn.addEventListener('click', openHelpModal);
    
    document.body.appendChild(helpBtn);
}

// ============================================
// ESTILOS CSS
// ============================================

const helpStyles = document.createElement('style');
helpStyles.textContent = `
/* Modal de Ayuda */
.help-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10000;
    justify-content: center;
    align-items: center;
    animation: fadeIn 0.3s ease;
}

.help-modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
}

.help-modal-content {
    position: relative;
    background: white;
    border-radius: 15px;
    width: 90%;
    max-width: 1200px;
    height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.3s ease;
}

@keyframes slideUp {
    from {
        transform: translateY(50px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.help-modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px 30px;
    border-radius: 15px 15px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.help-modal-header h2 {
    margin: 0;
    font-size: 24px;
}

.help-close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 24px;
    cursor: pointer;
    transition: all 0.2s;
}

.help-close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: rotate(90deg);
}

.help-modal-body {
    display: flex;
    flex: 1;
    overflow: hidden;
}

.help-sidebar {
    width: 250px;
    background: #f7fafc;
    border-right: 2px solid #e2e8f0;
    padding: 20px 0;
    overflow-y: auto;
}

.help-nav-btn {
    width: 100%;
    padding: 15px 20px;
    border: none;
    background: none;
    text-align: left;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.2s;
    color: #4a5568;
    font-weight: 500;
}

.help-nav-btn:hover {
    background: #edf2f7;
    color: #2d3748;
}

.help-nav-btn.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
}

.help-content-area {
    flex: 1;
    padding: 30px;
    overflow-y: auto;
}

.help-content-area h2 {
    color: #2d3748;
    margin-bottom: 20px;
    font-size: 28px;
}

.help-content-area h3 {
    color: #4c51bf;
    margin-top: 25px;
    margin-bottom: 15px;
    font-size: 22px;
}

.help-content-area h4 {
    color: #4a5568;
    margin-top: 20px;
    margin-bottom: 10px;
    font-size: 18px;
}

.help-content-area p {
    color: #4a5568;
    line-height: 1.8;
    margin-bottom: 15px;
}

.help-content-area ul {
    color: #4a5568;
    line-height: 1.8;
    margin-left: 25px;
    margin-bottom: 15px;
}

.help-content-area code {
    background: #f7fafc;
    padding: 3px 8px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    color: #ffffffff;
    font-size: 14px;
}

.help-content-area pre {
    background: #2d3748;
    color: #48bb78;
    padding: 15px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 15px 0;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.6;
}

.help-content-area kbd {
    background: #edf2f7;
    border: 1px solid #cbd5e0;
    border-radius: 4px;
    padding: 2px 6px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    box-shadow: 0 2px 0 rgba(0,0,0,0.1);
}

/* Componentes especiales */
.help-steps {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin: 20px 0;
}

.help-step {
    display: flex;
    align-items: flex-start;
    gap: 15px;
    padding: 20px;
    background: #f7fafc;
    border-radius: 10px;
    border-left: 4px solid #4c51bf;
}

.step-number {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 20px;
    flex-shrink: 0;
}

.step-content h4 {
    margin: 0 0 10px 0;
}

.help-option {
    background: #f7fafc;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 15px;
    border-left: 4px solid #4c51bf;
}

.help-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
}

.help-table td {
    padding: 12px;
    border-bottom: 1px solid #e2e8f0;
}

.help-table td:first-child {
    font-weight: 600;
    color: #4c51bf;
}

.help-tip {
    background: #ebf8ff;
    border-left: 4px solid #4299e1;
    padding: 15px;
    border-radius: 8px;
    margin: 20px 0;
}

.component-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.component-item {
    background: #f7fafc;
    padding: 20px;
    border-radius: 10px;
    border-top: 4px solid #4c51bf;
}

.component-item h4 {
    margin-top: 0;
}

.instruction-type {
    margin-bottom: 25px;
}

.instruction-type h4 {
    margin-bottom: 10px;
}

.code-example {
    background: #f7fafc;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
    position: relative;
}

.code-example h4 {
    margin-top: 0;
    margin-bottom: 15px;
}

.btn-copy {
    position: absolute;
    top: 15px;
    right: 15px;
    padding: 8px 16px;
    background: #4c51bf;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s;
}

.btn-copy:hover {
    background: #434190;
    transform: translateY(-2px);
}

.diagram-features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.feature-item {
    background: #f7fafc;
    padding: 20px;
    border-radius: 10px;
}

.feature-item h4 {
    margin-top: 0;
}

.faq-item {
    background: #f7fafc;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 15px;
    border-left: 4px solid #ed8936;
}

.faq-item h4 {
    margin-top: 0;
    color: #c05621;
}

.tips-section {
    background: #f7fafc;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 15px;
}

.tips-section h4 {
    margin-top: 0;
    color: #4c51bf;
}

/* Botón flotante de ayuda */
.floating-help-btn {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    font-size: 28px;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
    z-index: 9999;
}

.floating-help-btn:hover {
    transform: translateY(-5px) scale(1.1);
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.6);
}

/* Scrollbar personalizado */
.help-sidebar::-webkit-scrollbar,
.help-content-area::-webkit-scrollbar {
    width: 8px;
}

.help-sidebar::-webkit-scrollbar-track,
.help-content-area::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

.help-sidebar::-webkit-scrollbar-thumb,
.help-content-area::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 10px;
}

.help-sidebar::-webkit-scrollbar-thumb:hover,
.help-content-area::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
}

/* Responsive */
@media (max-width: 768px) {
    .help-modal-content {
        width: 100%;
        height: 100vh;
        border-radius: 0;
    }
    
    .help-modal-body {
        flex-direction: column;
    }
    
    .help-sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 2px solid #e2e8f0;
        max-height: 200px;
        display: flex;
        overflow-x: auto;
        overflow-y: hidden;
    }
    
    .help-nav-btn {
        white-space: nowrap;
        flex-shrink: 0;
    }
    
    .floating-help-btn {
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        font-size: 24px;
    }
    
    .component-grid,
    .diagram-features {
        grid-template-columns: 1fr;
    }
}
`;

// Inyectar estilos
document.head.appendChild(helpStyles);

// ============================================
// INICIALIZAR AL CARGAR LA PÁGINA
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    createHelpButton();
});

console.log('✅ Sistema de ayuda cargado correctamente');