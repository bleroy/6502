'use strict';

/**
 * Constructs a delegate, which is a list of functions that can be executed as one.
 * It's possible to add to and remove functions from the delegate.
 * @param {Array} array a list of functions to execute sequentially. Optional.
 */
export let delegate = (array = []) => {
    let result = (...args) => {
        array.forEach(h => h.apply(null, args));
    };
    /**
     * Adds a function to the delegate.
     * @param {Function} fun the function to add.
     */
    result.add = fun => {
        array.push(fun);
    }
    /**
     * Removes the first occurrence of a function from the delegate, if found.
     * @param {Function} fun the function to remove. 
     */
    result.remove = fun => {
        let i = array.indexOf(fun);
        if (i !== -1) array.splice(i, 1);
    };
    return result;
};

let valueSymbol = Symbol('value');

/**
 * A Number type suitable for representing a 16-bit address.
 */
export class Address extends Number {
    /**
     * Create a new address.
     * @param {Number} value an integer between 0 and 65535.
     */
    constructor(value) {
        if (value > 65535 || value < 0 || !Number.isInteger(value)) {
            throw new RangeError(`Address value ${value} was out of the 0..65535 range.`);
        }
        super(value);
        this[valueSymbol] = value;
    }

    /**
     * The Number value of the address.
     */
    valueOf() {
        return this[valueSymbol];
    }

    /**
     * The string representation of the address, in 6502 hex format, e.g. $001F, $FFFF, $081B, etc.
     */
    toString() {
        return `$${this.valueOf().toString(16).toUpperCase().padStart(4, '0')}`;
    }
}

/**
 * A Number type suitable for representing bytes.
 */
export class Byte extends Number {
    /**
     * Create a new bytes.
     * @param {Number} value an integer between -128 and 255.
     */
    constructor(value) {
        if (value > 255 || value < -128 || !Number.isInteger(value)) {
            throw new RangeError(`Byte value ${value} was out of the -128..255 range.`);
        }
        let val = value < 128 ? value : value - 256;
        super(val);
        this[valueSymbol] = val;
    }

    /**
     * The Number value of the byte, between -128 and 127.
     * Essentially, this is the signed value of the byte.
     * This makes it possible to use a byte as if it were a regular number, including correct signed arithmetics.
     */
    valueOf() {
        return this[valueSymbol];
    }

    /**
     * The string representation of the byte, in 6502 hex format, e.g. $1F, $FF, $08, etc.
     */
    toString() {
        return `$${this.value.toString(16).toUpperCase().padStart(2, '0')}`;
    }

    /**
     * The unsigned value of the byte, between 0 and 255.
     */
    get value() {
        return this[valueSymbol] & 0xFF;
    }
}

// Here be dragons...

class AddressMode {
    constructor({name, description, evaluate, disassemble, bytes}) {
        this.name = name;
        this.description = description;
        this.evaluateInternal = evaluate;
        this.disassemble = disassemble;
        this.bytes = bytes;
    }

    evaluate(processor, operand) {
        let evaluation = this.evaluateInternal(processor, operand);
        return evaluation instanceof Address ? processor.peek(evaluation) : evaluation;
    }

    evaluateAddress(processor, operand) {
        let evaluation = this.evaluateInternal(processor, operand);
        if (!(evaluation instanceof Address)) throw new Error('Result of address mode evaluation is not an address');
        return evaluation;
    }
}

let AddressModes = {
    A: new AddressMode({
        name: 'A',
        description: 'Accumulator',
        evaluate: (processor) => processor.A,
        disassemble: () => 'A',
        bytes: 0
    }),
    abs: new AddressMode({
        name: 'abs',
        description: 'absolute',
        evaluate: (processor, address) => new Address(address),
        disassemble: address => hex(address),
        bytes: 2
    }),
    absX: new AddressMode({
        name: 'abs,X',
        description: 'absolute, X-indexed',
        evaluate: (processor, address) => new Address(address + processor.X),
        evaluateAddress: (processor, address) => address + processor.X,
        disassemble: address => `${hex(address)},X`,
        bytes: 2
    }),
    absY: new AddressMode({
        name: 'abs,Y',
        description: 'absolute, Y-indexed',
        evaluate: (processor, address) => new Address(address + processor.Y),
        disassemble: address => `${hex(address)},Y`,
        bytes: 2
    }),
    immediate: new AddressMode({
        name: '#',
        description: 'immediate',
        evaluate: (processor, operand) => operand,
        disassemble: operand => `#${hex(operand)}`,
        bytes: 1
    }),
    implied: new AddressMode({
        name: 'impl',
        description: 'implied',
        evaluate: () => null,
        disassemble: () => '',
        bytes: 0
    }),
    indirect: new AddressMode({
        name: 'ind',
        description: 'indirect',
        evaluate: (processor, address) => new Address(processor.addressAt(address)),
        disassemble: address => `(${hex(address)})`,
        bytes: 2
    }),
    Xind: new AddressMode({
        name: 'X,ind',
        description: 'X-indexed, indirect',
        evaluate: (processor, address) => new Address(processor.addressAt((address + processor.X) & 0xFF)),
        disassemble: address => `(${hex(address)},X)`,
        bytes: 1
    }),
    indY: new AddressMode({
        name: 'ind,Y',
        description: 'indirect, Y-indexed',
        evaluate: (processor, address) => new Address(processor.addressAt(address) + processor.Y),
        disassemble: address => `(${hex(address)}),Y`,
        bytes: 1
    }),
    rel: new AddressMode({
        name: 'rel',
        description: 'relative',
        evaluate: (processor, offset) => new Address(processor.PC + offset),
        disassemble: offset => `${hex(offset)}`,
        bytes: 1
    }),
    zpg: new AddressMode({
        name: 'zpg',
        description: 'zero page',
        evaluate: (processor, address) => new Address(address),
        disassemble: address => `${hex(address)}`,
        bytes: 1
    }),
    zpgX: new AddressMode({
        name: 'zpg,X',
        description: 'zero page, X-indexed',
        evaluate: (processor, address) => new Address((address + processor.X) & 0xFF),
        disassemble: address => `${hex(address)},X`,
        bytes: 1
    }),
    zpgY: new AddressMode({
        name: 'zpg,Y',
        description: 'zero page, Y-indexed',
        evaluate: (processor, address) => new Address((address + processor.Y) & 0xFF),
        disassemble: address => `${hex(address)},Y`,
        bytes: 1
    })
}

class Instruction {
    constructor({mnemonic, opCode, description, implementation, addressMode = AddressModes.implied, cycles}) {
        this.mnemonic = mnemonic;
        this.opCode = opCode;
        this.description = description;
        this.implementation = implementation;
        this.addressMode = addressMode;
        this.cycles = cycles;
    }

    execute(processor) {
        this.implementation(processor);
    }

    disassemble(address, operand) {
        return `${address.toString(16).toUpperCase()} ${this.mnemonic} ${this.addressMode.disassemble(operand)}`;
    }
}

class BRK extends Instruction {
    constructor() {
        super({
            opCode: 0x00,
            addressMode: null,
            mnemonic: 'BRK',
            description: 'Force break',
            implementation: (processor) => {
                processor.push(processor.PC + 2);
                processor.push(processor.SR);
                processor.interrupt();
            }
        });
    }
}

class ADC extends Instruction {
    constructor({opCode, addressMode}) {
        super({
            opCode, addressMode,
            mnemonic: 'ADC',
            description: 'Add with carry',
            implementation: (processor, operand) => {
                let oldA = new Byte(processor.A);
                let sum = oldA + (processor.C ? 1 : 0) + addressMode.evaluate(processor, operand);
                processor.A = sum & 0xFF;
                processor.C = sum > (processor.D ? 99 : 255);
                processor.Z = processor.A == 0;
                processor.V = sum > 127 || sum < -128;
                processor.N = processor.A & 0x80 != 0;
            }
        });
    }
}

class LDA extends Instruction {
    constructor({opCode, addressMode}) {
        super({
            opCode, addressMode,
            mnemonic: 'LDA',
            description: 'Load accumulator',
            implementation: (processor, operand) => {
                let value = addressMode.evaluate(processor, operand);
                processor.A = value;
                processor.Z = value == 0;
                processor.N = value & 0x80 != 0;
            }
        });
    }
}

class STA extends Instruction {
    constructor({opCode, addressMode}) {
        super({
            opCode, addressMode,
            mnemonic: 'STA',
            description: 'Store accumulator',
            implementation: (processor, operand) => {
                processor.poke(addressMode.evaluateAddress(processor, operand), processor.A); 
            }
        });
    }
}

class InvalidInstruction extends Instruction {
    constructor(opCode) {
        super({
            opCode,
            addressMode: null,
            mnemonic: 'N/A',
            description: 'Invalid instruction',
            implementation: (processor, operand) => {
                throw new Error(`OpCode ${opCode} does not correspond to any instruction on the ${processor.name} processor.`);
            }
        });
    }
}

export default class MCS6502 {
    constructor({memory = new Uint8Array(65536), 
        A = 0, X = 0, Y = 0, SP = 0, PC = 0, 
        N = false, V = false, B = false, D = false, I = false, Z = false, C = false}) {
        this.memory = memory;
        this.a = A;
        this.x = X;
        this.y = Y;
        this.sp = SP;
        this.pc = PC;

        this.aHandlers = delegate();
        this.xHandlers = delegate();
        this.yHandlers = delegate();
        this.breakpoints = delegate();
    }

    static get instructionSet() {
        return [
            /* 00 */ new BRK(),
            /* 01 */ 
        ];
    }

    get name() {
        return '6502';
    }

    get A() {
        return this.a;
    }
    set A(value) {
        this.a = value;
        this.aHandlers.call(value);
    }
    addAChange(handler) {
        this.aHandlers.push(handler);
    }
    removeAChange(handler) {
        this.aHandlers.remove(handler);
    }

    get X() {
        return this.x;
    }
    set X(value) {
        this.X = value;
        this.xHandlers.call(value);
    }
    addXChange(handler) {
        this.xHandlers.push(handler);
    }
    removeXChange(handler) {
        this.xHandlers.remove(handler);
    }

    get Y() {
        return this.y;
    }
    set Y(value) {
        this.y = value;
        this.yHandlers.call(value);
    }
    addYChange(handler) {
        this.yHandlers.push(handler);
    }
    removeYChange(handler) {
        this.yHandlers.remove(handler);
    }

    get SR() {}
    set SR(value) {}

    addressAt(pointer) {
        return this.memory[pointer] + 256 * this.memory[pointer + 1];
    }

    peek(address) {
        return this.memory[address];
    }
    poke(address, value) {
        this.memory[address] = value;
        // TODO: add event handlers
    }

    push(value) {}
    pop() {}

    interrupt() {}
}