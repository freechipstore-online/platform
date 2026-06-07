/**
 * FreeChipStore Logic Simulator SDK
 * Logic gates, ALU, binary converters
 */

export type GateType = 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR' | 'XNOR';

const GATE_FNS: Record<GateType, (inputs: boolean[]) => boolean> = {
  AND:  (inputs) => inputs.every(Boolean),
  OR:   (inputs) => inputs.some(Boolean),
  NOT:  (inputs) => !inputs[0],
  NAND: (inputs) => !inputs.every(Boolean),
  NOR:  (inputs) => !inputs.some(Boolean),
  XOR:  (inputs) => inputs.filter(Boolean).length % 2 === 1,
  XNOR: (inputs) => inputs.filter(Boolean).length % 2 === 0,
};

export class LogicGate {
  readonly type: GateType;

  constructor(type: GateType) {
    if (!(type in GATE_FNS)) throw new Error(`Unknown gate type: ${type}`);
    this.type = type;
  }

  /** Evaluate gate for given inputs */
  evaluate(inputs: boolean[]): boolean {
    if (this.type === 'NOT' && inputs.length !== 1) {
      throw new Error('NOT gate requires exactly 1 input');
    }
    if (this.type !== 'NOT' && inputs.length < 2) {
      throw new Error(`${this.type} gate requires at least 2 inputs`);
    }
    return GATE_FNS[this.type](inputs);
  }

  /** Generate full truth table for 1 input (NOT) or 2 inputs (all others) */
  get truthTable(): { inputs: boolean[][]; output: boolean[] } {
    if (this.type === 'NOT') {
      const combos: boolean[][] = [[false], [true]];
      return {
        inputs: combos,
        output: combos.map(c => this.evaluate(c)),
      };
    }
    const combos: boolean[][] = [
      [false, false], [false, true], [true, false], [true, true],
    ];
    return {
      inputs: combos,
      output: combos.map(c => this.evaluate(c)),
    };
  }

  /** Get a standalone gate function */
  static get(type: GateType): (a: boolean, b?: boolean) => boolean {
    return (a: boolean, b?: boolean) => {
      if (type === 'NOT') return GATE_FNS.NOT([a]);
      if (b === undefined) throw new Error(`${type} requires two inputs`);
      return GATE_FNS[type]([a, b]);
    };
  }
}

export class ALU {
  readonly bits: number;
  private readonly mask: number;
  private readonly signBit: number;
  private readonly maxSigned: number;
  private readonly minSigned: number;

  constructor(bits: number = 8) {
    if (bits < 1 || bits > 32) throw new Error('Bits must be 1-32');
    this.bits = bits;
    this.mask = (bits === 32) ? 0xFFFFFFFF : (1 << bits) - 1;
    this.signBit = 1 << (bits - 1);
    this.maxSigned = this.signBit - 1;
    this.minSigned = -this.signBit;
  }

  /** Interpret unsigned value as signed in this ALU's bit width */
  private toSigned(v: number): number {
    v = v & this.mask;
    return (v & this.signBit) ? v - (1 << this.bits) : v;
  }

  add(a: number, b: number): { result: number; carry: boolean; overflow: boolean; zero: boolean } {
    a = a & this.mask;
    b = b & this.mask;
    const raw = a + b;
    const result = raw & this.mask;
    const carry = raw > this.mask;
    // Overflow: both operands same sign, result different sign
    const signA = !!(a & this.signBit);
    const signB = !!(b & this.signBit);
    const signR = !!(result & this.signBit);
    const overflow = (signA === signB) && (signR !== signA);
    return { result, carry, overflow, zero: result === 0 };
  }

  sub(a: number, b: number): { result: number; borrow: boolean; overflow: boolean; zero: boolean } {
    a = a & this.mask;
    b = b & this.mask;
    const raw = a - b;
    const result = raw & this.mask;
    const borrow = raw < 0;
    const signA = !!(a & this.signBit);
    const signB = !!(b & this.signBit);
    const signR = !!(result & this.signBit);
    const overflow = (signA !== signB) && (signR !== signA);
    return { result, borrow, overflow, zero: result === 0 };
  }

  and(a: number, b: number): number {
    return (a & b) & this.mask;
  }

  or(a: number, b: number): number {
    return (a | b) & this.mask;
  }

  xor(a: number, b: number): number {
    return (a ^ b) & this.mask;
  }

  not(a: number): number {
    return (~a) & this.mask;
  }

  shl(a: number): { result: number; carry: boolean } {
    a = a & this.mask;
    const carry = !!(a & this.signBit);
    const result = (a << 1) & this.mask;
    return { result, carry };
  }

  shr(a: number): { result: number; carry: boolean } {
    a = a & this.mask;
    const carry = !!(a & 1);
    const result = (a >>> 1) & this.mask;
    return { result, carry };
  }

  static toBinary(n: number, bits: number): string {
    return (n >>> 0).toString(2).padStart(bits, '0').slice(-bits);
  }

  static toHex(n: number, bits: number): string {
    const hexDigits = Math.ceil(bits / 4);
    return (n >>> 0).toString(16).toUpperCase().padStart(hexDigits, '0').slice(-hexDigits);
  }

  static fromBinary(s: string): number {
    return parseInt(s, 2);
  }
}

export class BinaryConverter {
  static decToBin(n: number, bits: number = 8): string {
    if (n < 0) return BinaryConverter.toTwosComplement(n, bits);
    return (n >>> 0).toString(2).padStart(bits, '0').slice(-bits);
  }

  static decToHex(n: number): string {
    if (n < 0) return (n >>> 0).toString(16).toUpperCase();
    return n.toString(16).toUpperCase();
  }

  static binToDec(s: string): number {
    return parseInt(s, 2);
  }

  static hexToDec(s: string): number {
    return parseInt(s, 16);
  }

  /**
   * Convert a number to IEEE 754 single-precision representation.
   */
  static toIEEE754(n: number): { sign: number; exponent: string; mantissa: string } {
    const buf = new ArrayBuffer(4);
    new Float32Array(buf)[0] = n;
    const bits = new Uint32Array(buf)[0];

    const sign = (bits >>> 31) & 1;
    const exponentBits = (bits >>> 23) & 0xFF;
    const mantissaBits = bits & 0x7FFFFF;

    return {
      sign,
      exponent: exponentBits.toString(2).padStart(8, '0'),
      mantissa: mantissaBits.toString(2).padStart(23, '0'),
    };
  }

  /**
   * Convert a signed integer to two's complement binary string.
   */
  static toTwosComplement(n: number, bits: number): string {
    if (n >= 0) return n.toString(2).padStart(bits, '0').slice(-bits);
    // Two's complement: invert and add 1
    const positive = Math.abs(n);
    const mask = (bits === 32) ? 0xFFFFFFFF : (1 << bits) - 1;
    const tc = ((~positive) + 1) & mask;
    return tc.toString(2).padStart(bits, '0');
  }
}
