# Ejemplos de Validación de Instrucciones

## ✅ INSTRUCCIONES VÁLIDAS

### R-Type (3 registros)
```
add x1, x2, x3      ✓ Correcto
sub x4, x5, x6      ✓ Correcto
and x7, x8, x9      ✓ Correcto
or x10, x11, x12    ✓ Correcto
xor x13, x14, x15   ✓ Correcto
slt x16, x17, x18   ✓ Correcto
sll x19, x20, x21   ✓ Correcto
srl x22, x23, x24   ✓ Correcto
sra x25, x26, x27   ✓ Correcto
```

### I-Type (2 registros + inmediato)
```
addi x1, x0, 10     ✓ Correcto
addi x2, x1, -5     ✓ Correcto
andi x3, x2, 15     ✓ Correcto
ori x4, x3, 7       ✓ Correcto
xori x5, x4, 3      ✓ Correcto
slti x6, x5, 100    ✓ Correcto
slli x7, x6, 2      ✓ Correcto
srli x8, x7, 1      ✓ Correcto
srai x9, x8, 3      ✓ Correcto
```

### Load (1 registro + offset(registro))
```
lw x1, 0(x0)        ✓ Correcto
lh x2, 4(x1)        ✓ Correcto
lb x3, 8(x2)        ✓ Correcto
lhu x4, -4(x3)      ✓ Correcto
lbu x5, 12(x4)      ✓ Correcto
```

### Store (1 registro + offset(registro))
```
sw x1, 0(x0)        ✓ Correcto
sh x2, 4(x1)        ✓ Correcto
sb x3, 8(x2)        ✓ Correcto
sw x4, -4(x3)       ✓ Correcto
```

### Branch (2 registros + inmediato)
```
beq x1, x2, 1       ✓ Correcto
bne x3, x4, 2       ✓ Correcto
blt x5, x6, -1      ✓ Correcto
bge x7, x8, 3       ✓ Correcto
bltu x9, x10, 1     ✓ Correcto
bgeu x11, x12, 2    ✓ Correcto
```

---

## ❌ INSTRUCCIONES INVÁLIDAS

### Mnemónico desconocido
```
fdg x1, x2, x3              ✗ "Instrucción desconocida: fdg"
mul x1, x2, x3              ✗ "Instrucción desconocida: mul"
div x1, x2, x3              ✗ "Instrucción desconocida: div"
```

### Número incorrecto de operandos
```
add x1, x2                  ✗ "ADD requiere 3 operandos: add xd, xs1, xs2"
add x1, x2, x3, x4          ✗ "ADD requiere 3 operandos: add xd, xs1, xs2"
addi x1, x2                 ✗ "ADDI requiere 3 operandos: addi xd, xs1, inmediato"
lw x1                       ✗ "LW requiere 2 operandos: lw xd, offset(xs1)"
```

### Tipo de operando incorrecto (R-Type con inmediato)
```
add x1, x2, 10              ✗ "ADD: El operando 3 debe ser un registro"
sub x1, 5, x3               ✗ "SUB: El operando 2 debe ser un registro"
and 100, x1, x2             ✗ "AND: El operando 1 debe ser un registro"
```

### Tipo de operando incorrecto (I-Type sin inmediato)
```
addi x1, x2, x3             ✗ "ADDI: El tercer operando debe ser un número inmediato"
ori x1, x2, x3              ✗ "ORI: El tercer operando debe ser un número inmediato"
```

### Registros fuera de rango
```
add x32, x1, x2             ✗ "ADD: El registro x32 es inválido"
addi x-1, x0, 10            ✗ Error en parsing
```

### Formato incorrecto en Load/Store
```
lw x1, x2                   ✗ "LW: El segundo operando debe tener formato 'offset(xN)'"
sw x1, x2                   ✗ "SW: El segundo operando debe tener formato 'offset(xN)'"
lw x1 0(x0)                 ✗ Error en parsing (falta coma implícita)
sw x1, 0 x0                 ✗ "SW: El segundo operando debe tener formato 'offset(xN)'"
```

---

## Notas importantes:
- Los registros válidos son: x0 a x31
- Los inmediatos pueden ser positivos o negativos (ej: 10, -5, 0, 1000)
- El formato para Load/Store es: `offset(xN)` donde offset es un número y N es 0-31
- Las instrucciones son insensibles a mayúsculas/minúsculas (ADD, add, Add son iguales)
- Los espacios y comas se normalizan automáticamente
- Las líneas que comienzan con # o // se ignoran cuando se cargan múltiples instrucciones
