# @freechipstore/sdk

FreeChipStore SDK -- logic gate simulator, ALU operations, and binary conversion utilities.

## Installation

```bash
npm install @freechipstore/sdk
```

## Logic Gates

Simulate AND, OR, NOT, NAND, NOR, XOR, XNOR gates with truth table generation.

```typescript
import { LogicGate } from '@freechipstore/sdk';

const and = new LogicGate('AND');
console.log(and.evaluate([true, true]));   // true
console.log(and.evaluate([true, false]));  // false

const xor = new LogicGate('XOR');
console.log(xor.evaluate([true, false, true]));  // false (odd parity)

// Full truth table
const nand = new LogicGate('NAND');
console.log(nand.truthTable);
// {
//   inputs: [[false,false],[false,true],[true,false],[true,true]],
//   output: [true, true, true, false]
// }

// Standalone gate functions
const orFn = LogicGate.get('OR');
console.log(orFn(false, true));  // true
```

## ALU (Arithmetic Logic Unit)

N-bit ALU with carry, overflow, and zero flag detection.

```typescript
import { ALU } from '@freechipstore/sdk';

const alu = new ALU(8);  // 8-bit ALU

// Addition with flags
const sum = alu.add(200, 100);
console.log(sum.result);    // 44 (300 & 0xFF)
console.log(sum.carry);     // true
console.log(sum.overflow);  // true (signed overflow)
console.log(sum.zero);      // false

// Subtraction
const diff = alu.sub(50, 30);
console.log(diff.result);   // 20
console.log(diff.borrow);   // false

// Bitwise operations
console.log(alu.and(0b11001100, 0b10101010));  // 0b10001000 = 136
console.log(alu.or(0b11001100, 0b10101010));   // 0b11101110 = 238
console.log(alu.xor(0b11001100, 0b10101010));  // 0b01100110 = 102
console.log(alu.not(0b11001100));              // 0b00110011 = 51

// Shifts
const shl = alu.shl(0b01000001);
console.log(ALU.toBinary(shl.result, 8));  // "10000010"
console.log(shl.carry);                    // false

const shr = alu.shr(0b01000001);
console.log(ALU.toBinary(shr.result, 8));  // "00100000"
console.log(shr.carry);                    // true (LSB was 1)
```

### Static Helpers

```typescript
ALU.toBinary(255, 8);    // "11111111"
ALU.toHex(255, 8);       // "FF"
ALU.fromBinary('1010');  // 10
```

## Binary Converter

Convert between decimal, binary, hex, IEEE 754, and two's complement.

```typescript
import { BinaryConverter } from '@freechipstore/sdk';

// Decimal <-> Binary
BinaryConverter.decToBin(42, 8);     // "00101010"
BinaryConverter.binToDec('00101010'); // 42

// Decimal <-> Hex
BinaryConverter.decToHex(255);       // "FF"
BinaryConverter.hexToDec('FF');      // 255

// IEEE 754 single-precision
const ieee = BinaryConverter.toIEEE754(3.14);
console.log(ieee.sign);      // 0
console.log(ieee.exponent);  // "10000000"
console.log(ieee.mantissa);  // "10010001111010111000011"

// Two's complement
BinaryConverter.toTwosComplement(-1, 8);   // "11111111"
BinaryConverter.toTwosComplement(-128, 8); // "10000000"
BinaryConverter.toTwosComplement(42, 8);   // "00101010"
```

## API Reference

### `LogicGate`

| Method | Returns | Description |
|--------|---------|-------------|
| `evaluate(inputs)` | `boolean` | Evaluate gate for given boolean inputs |
| `truthTable` | `object` | `{ inputs: boolean[][], output: boolean[] }` |
| `LogicGate.get(type)` | `function` | Standalone `(a, b?) => boolean` |

### `ALU`

| Method | Returns | Description |
|--------|---------|-------------|
| `add(a, b)` | `object` | `{ result, carry, overflow, zero }` |
| `sub(a, b)` | `object` | `{ result, borrow, overflow, zero }` |
| `and/or/xor(a, b)` | `number` | Bitwise result masked to N bits |
| `not(a)` | `number` | Bitwise NOT masked to N bits |
| `shl/shr(a)` | `object` | `{ result, carry }` |
| `ALU.toBinary(n, bits)` | `string` | Binary string representation |
| `ALU.toHex(n, bits)` | `string` | Hex string representation |
| `ALU.fromBinary(s)` | `number` | Parse binary string |

### `BinaryConverter`

| Method | Returns | Description |
|--------|---------|-------------|
| `decToBin(n, bits?)` | `string` | Decimal to binary (supports negative via two's complement) |
| `decToHex(n)` | `string` | Decimal to uppercase hex |
| `binToDec(s)` | `number` | Binary string to decimal |
| `hexToDec(s)` | `number` | Hex string to decimal |
| `toIEEE754(n)` | `object` | `{ sign, exponent, mantissa }` as binary strings |
| `toTwosComplement(n, bits)` | `string` | Signed int to two's complement binary |

## License

MIT
