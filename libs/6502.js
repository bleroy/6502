'use strict';

// Symbols for private fields
const aSymbol = Symbol('a'), xSymbol = Symbol('x'), ySymbol = Symbol('y'),
    spSymbol = Symbol('sp'), pcSymbol = Symbol('pc'), srSymbol = ('sr'),
    memorySymbol = Symbol('memory'), aHandlersSymbol = Symbol('aHandlers'),
    xHandlersSymbol = Symbol('xHandlers'), yHandlersSymbol = Symbol('yHandlers'),
    breakpointsSymbol = Symbol('breakpoints'), valueSymbol = Symbol('value'),
    instructionSetSymbol = Symbol('instructionSet'),
    evaluateInternalSymbol = Symbol('evaluateInternal');

/**
 * Constructs a delegate, which is a list of functions that can be executed as one.
 * It's possible to add to and remove functions from the delegate.
 * @param {Array} array - a list of functions to execute sequentially. Optional.
 */
export const delegate = (...array) => {
    const result = (...args) => {
        array.forEach(h => {
            if (result.filter(h.param)) h(...args);
        });
    };
    /**
     * Adds a function to the delegate.
     * @param {Function} fun - the function to add.
     * @param {Object} param - an optional parameter that the filter function can use
     * to filter out functions. For instance, a breakpoint can use an address on its
     * parameter object.
     */
    result.add = (fun, param = null) => {
        fun.param = param;
        array.push(fun);
    }
    /**
     * Removes the first occurrence of a function from the delegate, if found.
     * @param {Function} fun - the function to remove. 
     */
    result.remove = fun => {
        let i = array.indexOf(fun);
        if (i !== -1) array.splice(i, 1);
    };
    /**
     * A filter function can be added to a delegate so that not all handlers are executed
     * every time. By default, the filter always returns true.
     * @param {Object} param 
     */
    result.filter = (param) => true;
    return result;
};

/**
 * A Number type suitable for representing a 16-bit address.
 */
export class Address extends Number {
    /**
     * Create a new address.
     * @param {Number} value - an integer between 0 and 65535.
     */
    constructor(value) {
        value = value.valueOf();
        if (value > 65535 || value < 0 || !Number.isInteger(value)) {
            throw new RangeError(`Address value ${value} was out of the 0..65535 range.`);
        }
        super(value);
        this[valueSymbol] = value;
    }

    get MSB() { return (this[valueSymbol] >>> 8) & 0xFF; }
    get LSB() { return this[valueSymbol] & 0xFF; }

    static fromBytes(msb, lsb) {
        return new Address(msb << 8 | lsb);
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
 * Utilities for dealing with bytes
 */
export const Byte = {
    /**
     * Evaluates a number, rejects anything not integer or outside of the -128 to 255 range.
     * @param {Number} value - an integer between -128 and 255.
     * @returns {Number} - the 0-255 byte value of the number.
     */
    fromNumber(value) {
        if (value > 255 || value < -128 || !Number.isInteger(value)) {
            throw new RangeError(`Byte value ${value} was out of the -128..255 range.`);
        }
        return value & 0xFF;
    },

    /**
     * The signed value of the byte, between -128 and 127.
     * @param {Number} value - the byte to evaluate as a signed integer.
     * @returns {Number} - the signed value between -128 and 127.
     */
    signedValue(value) {
        value = Byte.fromNumber(value);
        return value < 128 ? value : value - 256;
    },

    /**
     * The 6502 notation string representation of the value, in 6502 hex format,
     * e.g. $1F, $FF, $08, etc.
     * @param {Number} value - the byte to format.
     * @returns {string} - the 6502 notation string representation of the byte.
     */
    toString(value) {
        value = Byte.fromNumber(value);
        return `$${value.toString(16).toUpperCase().padStart(2, '0')}`;
    }
}

/**
 * A 16-bit address space memory buffer.
 */
export class Ram {
    /**
     * Memory block for use with MCS6502
     * @param {(Array | Uint8Array | Number)} bytes
     * The array to store the memory in, or the number of bytes to reserve
     */
    constructor(bytes = new Uint8Array(65536)) {
        this[memorySymbol] =
            bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    }

    /**
     * Reads an address from memory.
     * @param {Address} address The address in memory at which the address is stored
     * in LSB-MSB foramt.
     * @param {bool} zeroPage If the `zeroPage` flag is set, the address is
     * read from 0-page memory, with wraparound behavior beyond address 0xFF.
     */
    addressAt(address, zeroPage = false) {
        return Address.fromBytes(
            this[memorySymbol][(address + 1) & (zeroPage ? 0xFF : 0xFFFF)],
            this[memorySymbol][address]
        );
    }

    /**
     * Reads a byte from memory.
     * @param {Address} address The address of the byte.
     */
    peek(address) {
        return this[memorySymbol][address.valueOf()];
    }

    /**
     * Writes a byte to memory.
     * @param {Address} address The adress where the byte must be written.
     * @param {Number} bytes The bytes to write to memory. 
     */
    poke(address, ...bytes) {
        const addr = address.valueOf();
        for (let i = 0; i < bytes.length; i++) {
            this[memorySymbol][addr + i] = bytes[i];
        }
    }
}

/**
 * An address mode evaluation callback.
 * @callback addressModeEvaluation
 * @param {MCS6502} processor - the processor to use to evaluate the address mode.
 * @param {(Number|Address)=} operand - the operand to evaluate.
 * @returns {(Number|Address)} - the result of the evaluation.
 */

/**
 * An address mode callback that writes data back.
 * @callback addressModeWriter
 * @param {MCS6502} processor - the processor to use to evaluate the address mode.
 * @param {(Number|Address)=} operand - the operand to evaluate.
 * @param {Number} - the byte to write.
 */

/**
 * A function that generates the string form of an address mode for use by the disassembler.
 * @callback addressModeDisassembler
 * @param {(Number|Address)=} operand - the operand to format.
 * @returns {string} - the disassembled form of the operand for this address mode.
 */

/**
 * A 6502 address mode, modeling the various ways an instruction can refer to memory, registers, or literal data.
 * Most instructions come in various flavors corresponding to different address modes.
 * This class enables the separation of the address mode behavior from the instruction behavior.
 */
export class AddressMode {
    /**
     * Constructs an address mode. See address mode instances for concrete usage.
     * @param {Object} mode - the description and behavior of the address mode.
     * @param {string} mode.name - the name of the address mode.
     * @param {string} mode.description - the description of the address mode.
     * @param {addressModeEvaluation} mode.evaluate - a function that evaluates an operand for this address mode,
     * in the context of the provided processor. If this function returns an address,
     * the actual evaluate method on the address mode object will retrieve the value from that address in the processor's
     * memory.
     * @param {addressModeWriter} mode.write - a function that writes a byte back to the target of the address mode.
     * This parameter is optional, and has a default implementation that evaluates the operand as an address and pokes
     * that memory location with the value.
     * @param {addressModeDisassembler} mode.disassemble - a function that generates a string representation of the operand
     * for this address mode, to be used by the disassembler.
     * @param {Number} mode.bytes - the number of bytes in the operand (0, 1, or 2).
     * @param {bool} mode.evaluatesAsAddress - if true, the operand is evaluated as an address, not as the byte it could point to.
     * Relative address mode uses that as it's only used by instructions that consume addresses.
     */
    constructor({ name, description, evaluate, write, disassemble, bytes, evaluatesAsAddress = false }) {
        this.name = name;
        this.description = description;
        this[evaluateInternalSymbol] = evaluate;
        this.disassemble = disassemble;
        this.bytes = bytes;
        this.write = write || ((cpu, operand, value) => {
            cpu.poke(this.evaluateAddress(cpu, operand), value);
        });
        this.evaluatesAsAddress = evaluatesAsAddress;
    }

    /**
     * Evaluates the operand as a byte for this address mode, in the context of the passed-in processor.
     * Instructions that handle Byte data, such as ADC, should call into this to evaluate the operand.
     * @param {MCS6502} cpu - the processor in the context of which this operand should be evaluated. 
     * @param {(Number|Address)=} operand - the operand to evaluate.
     * @returns {Number|Address} - the evaluated result.
     */
    evaluate(cpu, operand) {
        const evaluation = this[evaluateInternalSymbol](cpu, operand);
        return (evaluation instanceof Address && !this.evaluatesAsAddress) ? cpu.peek(evaluation) : evaluation;
    }

    /**
     * Evaluates the operand as an address for this address mode, in the context of the passed-in processor.
     * Instructions that handle addresses, such as JMP, should call into this to evaluate the operand.
     * @param {MCS6502} cpu - the processor in the context of which this operand should be evaluated.
     * @param {(Number|Address)=} operand - the operand to evaluate.
     * @returns {Address} - the evaluated address if the address mode can evaluate as an address, null otherwise.
     */
    evaluateAddress(cpu, operand) {
        const evaluation = this[evaluateInternalSymbol](cpu, operand);
        return (!(evaluation instanceof Address)) ? null : evaluation;
    }
}

/**
 * An object containing implementations for all of a 6502's address modes
 */
export const AddressModes = {
    A: new AddressMode({
        name: 'A',
        description: 'Accumulator',
        evaluate: cpu => cpu.A,
        write: (cpu, _, value) => { cpu.A = value; },
        disassemble: () => 'A',
        bytes: 0
    }),
    abs: new AddressMode({
        name: 'abs',
        description: 'absolute',
        evaluate: (cpu, address) => new Address(address),
        disassemble: address => new Address(address).toString(),
        bytes: 2
    }),
    absX: new AddressMode({
        name: 'abs,X',
        description: 'absolute, X-indexed',
        evaluate: (cpu, address) => new Address(address + Byte.signedValue(cpu.X)),
        disassemble: address => `${new Address(address).toString()},X`,
        bytes: 2
    }),
    absY: new AddressMode({
        name: 'abs,Y',
        description: 'absolute, Y-indexed',
        evaluate: (cpu, address) => new Address(address + Byte.signedValue(cpu.Y)),
        disassemble: address => `${new Address(address).toString()},Y`,
        bytes: 2
    }),
    immediate: new AddressMode({
        name: '#',
        description: 'immediate',
        evaluate: (cpu, operand) => operand,
        write: () => { throw new Error("Immediate mode cannot write."); },
        disassemble: operand => `#${Byte.toString(operand)}`,
        bytes: 1
    }),
    implied: new AddressMode({
        name: 'impl',
        description: 'implied',
        evaluate: () => null,
        write: () => { throw new Error("Implied mode cannot write."); },
        disassemble: () => '',
        bytes: 0
    }),
    indirect: new AddressMode({
        name: 'ind',
        description: 'indirect',
        evaluate: (cpu, address) => new Address(cpu.addressAt(address)),
        write: (cpu, address, value) => {
            cpu.poke(cpu.addressAt(address), value);
        },
        disassemble: address => `(${new Address(address).toString()})`,
        bytes: 2
    }),
    Xind: new AddressMode({
        name: 'X,ind',
        description: 'X-indexed, indirect',
        evaluate: (cpu, address) => new Address(cpu.addressAt((address + Byte.signedValue(cpu.X)) & 0xFF, true)),
        disassemble: address => `(${Byte.toString(address)},X)`,
        bytes: 1
    }),
    indY: new AddressMode({
        name: 'ind,Y',
        description: 'indirect, Y-indexed',
        evaluate: (cpu, address) => new Address(cpu.addressAt(address, true) + Byte.signedValue(cpu.Y)),
        disassemble: address => `(${Byte.toString(address)}),Y`,
        bytes: 1
    }),
    rel: new AddressMode({
        name: 'rel',
        description: 'relative',
        evaluate: (cpu, offset) => new Address(cpu.PC + Byte.signedValue(offset)),
        evaluatesAsAddress: true,
        write: () => { throw new Error("Relative mode cannot write."); },
        disassemble: offset => `${Byte.toString(offset)}`,
        bytes: 1
    }),
    zpg: new AddressMode({
        name: 'zpg',
        description: 'zero page',
        evaluate: (cpu, address) => new Address(address),
        disassemble: address => `${Byte.toString(address)}`,
        bytes: 1
    }),
    zpgX: new AddressMode({
        name: 'zpg,X',
        description: 'zero page, X-indexed',
        evaluate: (cpu, address) => new Address((address + Byte.signedValue(cpu.X)) & 0xFF),
        disassemble: address => `${Byte.toString(address)},X`,
        bytes: 1
    }),
    zpgY: new AddressMode({
        name: 'zpg,Y',
        description: 'zero page, Y-indexed',
        evaluate: (cpu, address) => new Address((address + Byte.signedValue(cpu.Y)) & 0xFF),
        disassemble: address => `${Byte.toString(address)},Y`,
        bytes: 1
    })
}


/**
 * An instruction implementation callback.
 * @callback instructionImplementation
 * @param {MCS6502} cpu - the processor to use to evaluate the address mode.
 * @param {Number} operand - the operand after evaluation by the address mode (a byte).
 * @param {(Number|Address)=} unevaluatedOperand - when relevant, the unevaluated operand.
 * @returns {Object=} - if a result is provided, it can specify a number of cycles, a new PC
 * address, etc.
 * cycles: a number of cycles spent by a 6502 to execute this instruction
 * PC: a new PC address
 */

/**
* A base class for all 6502 instructions.
*/
export class Instruction {
    /**
     * Constructs a base instruction
     * @param {Object} instr
     * @param {string} instr.mnemonic - the 3-letter mnemonic for the instruction, such as 'JMP'
     * @param {Number} instr.opCode - the operation code for the instruction
     * @param {string}  instr.description - a human-readable description of the instruction
     * @param {instructionImplementation} instr.implementation - the implementation of the instruction
     * @param {AddressMode} instr.addressMode - the address mode
     */
    constructor({ mnemonic, opCode, description, implementation, addressMode = AddressModes.implied }) {
        this.mnemonic = mnemonic;
        this.opCode = opCode;
        this.description = description;
        this.implementation = implementation;
        this.addressMode = addressMode;
    }

    /**
     * Disassembles the instruction for an address and operand
     * @param {(Number|Address)} operand - the operand for the instruction
     * @returns {string} - the disassembled instruction in the form Address Mnemonic Operand
     */
    disassemble(operand) {
        return `${this.mnemonic} ${this.addressMode.disassemble(operand)}`.trim();
    }

    /**
     * A string representation of the instruction
     */
    toString() {
        return `${this.mnemonic} ${this.addressMode.name}`;
    }
}

/**
 * An iterator that disassembles memory one instruction at a time.
 * @param {MCS6502} cpu The processor
 * @param {Address} address The address at which to start disassembling memory
 */
export function* disassemble(cpu, address) {
    while (address < 0xFFFF) {
        const opCode = cpu.peek(address);
        const instruction = cpu.instructionSet.get(opCode);
        if (!instruction || instruction instanceof InvalidInstruction) {
            yield `${address.valueOf().toString(16).toUpperCase().padStart(4, '0')}          *** # Unknown opCode ${Byte.toString(opCode)}`;
            continue;
        }
        const addressMode = instruction.addressMode;
        const operand =
            addressMode.bytes == 0 ? null :
                addressMode.bytes == 1 ? cpu.peek(address + 1) :
                    cpu.addressAt(address + 1);
        const memoryDump = (
            address.toString(16).toUpperCase().padStart(4, '0') + ' ' +
            opCode.toString(16).toUpperCase().padStart(2, '0') + ' ' +
            (addressMode.bytes > 0 ?
                cpu.peek(address + 1).toString(16).toUpperCase().padStart(2, '0') + ' ' +
                (addressMode.bytes > 1 ?
                    cpu.peek(address + 2).toString(16).toUpperCase().padStart(2, '0') :
                    ''
                ) : ''
            )
        ).padEnd(14, ' ');
        yield memoryDump + instruction.disassemble(operand);
        address += 1 + addressMode.bytes;
    }
}

class ADC extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'ADC',
            description: 'Add with carry',
            implementation: (cpu, operand) => {
                const oldA = cpu.A;
                let sum = oldA + operand + (cpu.C ? 1 : 0);
                // console.log(`ADC: A=${oldA}, sum=${sum}`);
                if (cpu.D) {
                    if (((oldA & 0xF) + (operand & 0xF) + (cpu.C ? 1 : 0)) > 9) {
                        sum += 6;
                    }
                    if (sum > 0x99) sum += 0x60;
                    cpu.N = false;
                    cpu.V = false;
                    cpu.C = sum > 0x99;
                }
                else {
                    cpu.N = (sum & 0x80) != 0;
                    cpu.V = !((oldA ^ operand) & 0x80) && ((oldA ^ sum) & 0x80);
                    cpu.C = sum > 0xFF;
                }
                sum &= 0xFF;
                cpu.Z = sum == 0;
                cpu.A = sum;
            }
        });
    }
}

class AND extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'AND',
            description: 'Bitwise AND with the accumulator',
            implementation: (cpu, operand) => {
                cpu.A &= operand;
                cpu.setFlags(cpu.A);
            }
        })
    }
}

class ASL extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'ASL',
            description: 'Arithmetic shift left',
            implementation: (cpu, operand, unevaluatedOperand) => {
                cpu.C = (operand & 0x80) != 0;
                const shifted = (operand << 1) & 0xFF;
                this.addressMode.write(cpu, unevaluatedOperand, shifted);
                cpu.setFlags(shifted);
            }
        })
    }
}

class BCC extends Instruction {
    constructor() {
        super({
            opCode: 0x90,
            addressMode: AddressModes.rel,
            mnemonic: 'BCC',
            description: 'Branch if carry clear',
            implementation: (cpu, address, c) => {
                if (!cpu.C) {
                    return { PC: address + 2 };
                }
            }
        });
    }
}

class BCS extends Instruction {
    constructor() {
        super({
            opCode: 0xB0,
            addressMode: AddressModes.rel,
            mnemonic: 'BCS',
            description: 'Branch if carry set',
            implementation: (cpu, address, c) => {
                if (cpu.C) {
                    return { PC: address + 2 };
                }
            }
        });
    }
}

class BEQ extends Instruction {
    constructor() {
        super({
            opCode: 0xF0,
            addressMode: AddressModes.rel,
            mnemonic: 'BEQ',
            description: 'Branch if equal to zero',
            implementation: (cpu, address, c) => {
                if (cpu.Z) {
                    return { PC: address + 2 };
                }
            }
        });
    }
}

class BIT extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'BIT',
            description: 'Test bits with the accumulator',
            implementation: (cpu, operand) => {
                cpu.Z = (cpu.A & operand) == 0;
                cpu.N = (operand & 0x80) != 0;
                cpu.V = (operand & 0x40) != 0;
            }
        })
    }
}

class BMI extends Instruction {
    constructor() {
        super({
            opCode: 0x30,
            addressMode: AddressModes.rel,
            mnemonic: 'BMI',
            description: 'Branch if negative',
            implementation: (cpu, address, c) => {
                if (cpu.N) {
                    return { PC: address + 2 };
                }
            }
        });
    }
}

class BNE extends Instruction {
    constructor() {
        super({
            opCode: 0xD0,
            addressMode: AddressModes.rel,
            mnemonic: 'BNE',
            description: 'Branch if not equal to zero',
            implementation: (cpu, address, c) => {
                if (!cpu.Z) {
                    return { PC: address + 2 };
                }
            }
        });
    }
}

class BPL extends Instruction {
    constructor() {
        super({
            opCode: 0x10,
            addressMode: AddressModes.rel,
            mnemonic: 'BPL',
            description: 'Branch if positive',
            implementation: (cpu, address, c) => {
                if (!cpu.N) {
                    return { PC: address + 2 };
                }
            }
        });
    }
}

class BRK extends Instruction {
    constructor() {
        super({
            opCode: 0x00,
            addressMode: AddressModes.implied,
            mnemonic: 'BRK',
            description: 'Force break',
            implementation: cpu => {
                return cpu.interrupt();
            }
        });
    }
}

class BVC extends Instruction {
    constructor() {
        super({
            opCode: 0x50,
            addressMode: AddressModes.rel,
            mnemonic: 'BVC',
            description: 'Branch if overflow clear',
            implementation: (cpu, address, c) => {
                if (!cpu.V) {
                    return { PC: address + 2 };
                }
            }
        });
    }
}

class BVS extends Instruction {
    constructor() {
        super({
            opCode: 0x70,
            addressMode: AddressModes.rel,
            mnemonic: 'BVS',
            description: 'Branch if overflow set',
            implementation: (cpu, address, c) => {
                if (cpu.V) {
                    return { PC: address + 2 };
                }
            }
        });
    }
}

class CLC extends Instruction {
    constructor() {
        super({
            opCode: 0x18,
            addressMode: AddressModes.implied,
            mnemonic: 'CLC',
            description: 'Clear the carry flag',
            implementation: cpu => {
                cpu.C = false;
            }
        });
    }
}

class CLD extends Instruction {
    constructor() {
        super({
            opCode: 0xD8,
            addressMode: AddressModes.implied,
            mnemonic: 'CLD',
            description: 'Clear the decimal flag',
            implementation: cpu => {
                cpu.D = false;
            }
        });
    }
}

class CLI extends Instruction {
    constructor() {
        super({
            opCode: 0x58,
            addressMode: AddressModes.implied,
            mnemonic: 'CLI',
            description: 'Clear the interrupt disabled flag',
            implementation: cpu => {
                cpu.I = false;
            }
        });
    }
}

class CLV extends Instruction {
    constructor() {
        super({
            opCode: 0xB8,
            addressMode: AddressModes.implied,
            mnemonic: 'CLV',
            description: 'Clear the overflow flag',
            implementation: cpu => {
                cpu.V = false;
            }
        });
    }
}

class CMP extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'CMP',
            description: 'Compare with the accumulator',
            implementation: (cpu, operand) => {
                const diff = (cpu.A - operand) & 0xFF;
                cpu.C = cpu.A >= operand;
                cpu.setFlags(diff);
            }
        })
    }
}

class CPX extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'CPX',
            description: 'Compare with the X register',
            implementation: (cpu, operand) => {
                const diff = (cpu.X - operand) & 0xFF;
                cpu.C = cpu.X >= operand;
                cpu.setFlags(diff);
            }
        })
    }
}

class CPY extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'CPY',
            description: 'Compare with the Y register',
            implementation: (cpu, operand) => {
                const diff = (cpu.Y - operand) & 0xFF;
                cpu.C = cpu.Y >= operand;
                cpu.setFlags(diff);
            }
        })
    }
}

class DEC extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'DEC',
            description: 'Decrement memory',
            implementation: (cpu, operand, unevaluatedOperand) => {
                const val = (operand - 1) & 0xFF;
                addressMode.write(cpu, unevaluatedOperand, val);
                cpu.setFlags(val);
            }
        });
    }
}

class DEX extends Instruction {
    constructor() {
        super({
            opCode: 0xCA,
            addressMode: AddressModes.implied,
            mnemonic: 'DEX',
            description: 'Decrement X',
            implementation: cpu => {
                cpu.X = (cpu.X - 1) & 0xFF;
                cpu.setFlags(cpu.X);
            }
        });
    }
}

class DEY extends Instruction {
    constructor() {
        super({
            opCode: 0x88,
            addressMode: AddressModes.implied,
            mnemonic: 'DEY',
            description: 'Decrement Y',
            implementation: cpu => {
                cpu.Y = (cpu.Y - 1) & 0xFF;
                cpu.setFlags(cpu.Y);
            }
        });
    }
}

class EOR extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'EOR',
            description: 'Bitwise EOR with the accumulator',
            implementation: (cpu, operand) => {
                cpu.A ^= operand;
                cpu.setFlags(cpu.A);
            }
        })
    }
}

class INC extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'INC',
            description: 'Increment memory',
            implementation: (cpu, operand, unevaluatedOperand) => {
                const val = (operand + 1) & 0xFF;
                addressMode.write(cpu, unevaluatedOperand, val);
                cpu.setFlags(val);
            }
        });
    }
}

class INX extends Instruction {
    constructor() {
        super({
            opCode: 0xE8,
            addressMode: AddressModes.implied,
            mnemonic: 'INX',
            description: 'Increment X',
            implementation: cpu => {
                cpu.X = (cpu.X + 1) & 0xFF;
                cpu.setFlags(cpu.X);
            }
        });
    }
}

class INY extends Instruction {
    constructor() {
        super({
            opCode: 0xC8,
            addressMode: AddressModes.implied,
            mnemonic: 'INY',
            description: 'Increment Y',
            implementation: cpu => {
                cpu.Y = (cpu.Y + 1) & 0xFF;
                cpu.setFlags(cpu.Y);
            }
        });
    }
}

class JMP extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'JMP',
            description: 'Jump',
            // Note: this does not implement page boundary bugs of early 6502 processors
            implementation: (_, operand, unevaluatedOperand) => {
                return { PC: unevaluatedOperand };
            }
        })
    }
}

class JSR extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'JSR',
            description: 'Jump to subroutine',
            implementation: (cpu, operand, unevaluatedOperand) => {
                const pc = new Address(cpu.PC);
                cpu.push(pc.MSB);
                cpu.push(pc.LSB);
                return { PC: unevaluatedOperand };
            }
        })
    }
}

class LDA extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'LDA',
            description: 'Load accumulator',
            implementation: (cpu, operand) => {
                cpu.A = operand;
                cpu.setFlags(operand);
            }
        });
    }
}

class LDX extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'LDX',
            description: 'Load the X registry',
            implementation: (cpu, operand) => {
                cpu.X = operand;
                cpu.setFlags(operand);
            }
        });
    }
}

class LDY extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'LDY',
            description: 'Load the Y registry',
            implementation: (cpu, operand) => {
                cpu.Y = operand;
                cpu.setFlags(operand);
            }
        });
    }
}

class LSR extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'LSR',
            description: 'Logical shift right',
            implementation: (cpu, operand, unevaluatedOperand) => {
                cpu.C = (operand & 0x01) != 0;
                const shifted = operand >>> 1;
                this.addressMode.write(cpu, unevaluatedOperand, shifted);
                cpu.setFlags(shifted);
            }
        })
    }
}

class NOP extends Instruction {
    constructor() {
        super({
            opCode: 0xEA,
            addressMode: AddressModes.implied,
            mnemonic: 'NOP',
            description: 'No operation',
            implementation: () => { }
        })
    }
}

class ORA extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'ORA',
            description: 'Bitwise OR with the accumulator',
            implementation: (cpu, operand) => {
                cpu.A |= operand;
                cpu.setFlags(cpu.A);
            }
        })
    }
}

class PHA extends Instruction {
    constructor() {
        super({
            opCode: 0x48,
            addressMode: AddressModes.implied,
            mnemonic: 'PHA',
            description: 'Push the accumulator onto the stack',
            implementation: cpu => {
                cpu.push(cpu.A);
            }
        })
    }
}

class PHP extends Instruction {
    constructor() {
        super({
            opCode: 0x08,
            addressMode: AddressModes.implied,
            mnemonic: 'PHP',
            description: 'Push processor status onto the stack',
            implementation: cpu => {
                // Break flag is always set on the stack value
                cpu.push(cpu.SR | 0x10);
            }
        })
    }
}

class PLA extends Instruction {
    constructor() {
        super({
            opCode: 0x68,
            addressMode: AddressModes.implied,
            mnemonic: 'PLA',
            description: 'Pull the accumulator from the stack',
            implementation: cpu => {
                cpu.A = cpu.pull();
                cpu.setFlags(cpu.A);
            }
        })
    }
}

class PLP extends Instruction {
    constructor() {
        super({
            opCode: 0x28,
            addressMode: AddressModes.implied,
            mnemonic: 'PLP',
            description: 'Pull the processor status from the stack',
            implementation: cpu => {
                cpu.SR = cpu.pull();
            }
        })
    }
}

class ROL extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'ROL',
            description: 'Rotate left',
            implementation: (cpu, operand, unevaluatedOperand) => {
                const rotated = ((operand << 1) | (cpu.C ? 1 : 0)) & 0xFF;
                cpu.C = (operand & 0x80) != 0;
                this.addressMode.write(cpu, unevaluatedOperand, rotated);
                cpu.setFlags(rotated);
            }
        })
    }
}

class ROR extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'ROR',
            description: 'Rotate right',
            implementation: (cpu, operand, unevaluatedOperand) => {
                const rotated = ((operand >>> 1) | (cpu.C ? 0x80 : 0)) & 0xFF;
                cpu.C = (operand & 0x01) != 0;
                this.addressMode.write(cpu, unevaluatedOperand, rotated);
                cpu.setFlags(rotated);
            }
        })
    }
}

class RTI extends Instruction {
    constructor() {
        super({
            opCode: 0x40,
            addressMode: AddressModes.implied,
            mnemonic: 'RTI',
            description: 'Return from interrupt',
            implementation: cpu => {
                cpu.SR = cpu.pull();
                const lsb = cpu.pull();
                const msb = cpu.pull();
                cpu.PC = Address.fromBytes(msb, lsb);
            }
        })
    }
}

class RTS extends Instruction {
    constructor() {
        super({
            opCode: 0x60,
            addressMode: AddressModes.implied,
            mnemonic: 'RTS',
            description: 'Return from subroutine',
            implementation: cpu => {
                const lsb = cpu.pull();
                const msb = cpu.pull();
                cpu.PC = Address.fromBytes(msb, lsb);
            }
        })
    }
}

class SBC extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'SBC',
            description: 'Subtract with carry',
            implementation: (cpu, operand) => {
                const oldA = cpu.A;
                let diff = (oldA - operand - (cpu.C ? 0 : 1)) & 0xFFF;
                // console.log(`SBC: A=${oldA}, sum=${sum}`);
                if (cpu.D) {
                    if (((oldA & 0xF) - (cpu.C ? 0 : 1)) < (operand & 0x0F)) {
                        diff -= 6;
                    }
                    if (diff > 0x99) diff -= 0x60;
                    cpu.N = false;
                    cpu.V = false;
                }
                else {
                    cpu.N = (diff & 0x80) != 0;
                    cpu.V = ((oldA ^ operand) & 0x80) && ((oldA ^ diff) & 0x80);
                }
                cpu.C = diff < 0x100;
                diff &= 0xFF;
                cpu.Z = diff == 0;
                cpu.A = diff;
            }
        });
    }
}

class SEC extends Instruction {
    constructor() {
        super({
            opCode: 0x38,
            addressMode: AddressModes.implied,
            mnemonic: 'SEC',
            description: 'Sets the carry flag',
            implementation: cpu => {
                cpu.C = true;
            }
        });
    }
}

class SED extends Instruction {
    constructor() {
        super({
            opCode: 0xF8,
            addressMode: AddressModes.implied,
            mnemonic: 'SED',
            description: 'Sets the decimal flag',
            implementation: cpu => {
                cpu.D = true;
            }
        });
    }
}

class SEI extends Instruction {
    constructor() {
        super({
            opCode: 0x78,
            addressMode: AddressModes.implied,
            mnemonic: 'SEI',
            description: 'Sets the interrupt disable flag',
            implementation: cpu => {
                cpu.I = true;
            }
        });
    }
}

class STA extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'STA',
            description: 'Store accumulator',
            implementation: (cpu, _, unevaluatedOperand) => {
                this.addressMode.write(cpu, unevaluatedOperand, cpu.A);
            }
        });
    }
}

class STX extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'STX',
            description: 'Store X',
            implementation: (cpu, _, unevaluatedOperand) => {
                this.addressMode.write(cpu, unevaluatedOperand, cpu.X);
            }
        });
    }
}

class STY extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'STY',
            description: 'Store Y',
            implementation: (cpu, _, unevaluatedOperand) => {
                this.addressMode.write(cpu, unevaluatedOperand, cpu.Y);
            }
        });
    }
}

class TAX extends Instruction {
    constructor() {
        super({
            opCode: 0xAA,
            addressMode: AddressModes.implied,
            mnemonic: 'TAX',
            description: 'Transfer A to X',
            implementation: (cpu, operand) => {
                cpu.X = cpu.A;
                cpu.setFlags(cpu.X);
            }
        });
    }
}

class TAY extends Instruction {
    constructor() {
        super({
            opCode: 0xA8,
            addressMode: AddressModes.implied,
            mnemonic: 'TAY',
            description: 'Transfer A to Y',
            implementation: (cpu, operand) => {
                cpu.Y = cpu.A;
                cpu.setFlags(cpu.Y);
            }
        });
    }
}

class TSX extends Instruction {
    constructor() {
        super({
            opCode: 0xBA,
            addressMode: AddressModes.implied,
            mnemonic: 'TSX',
            description: 'Transfer SP to X',
            implementation: (cpu, operand) => {
                cpu.X = cpu.SP;
                cpu.setFlags(cpu.X);
            }
        });
    }
}

class TXA extends Instruction {
    constructor() {
        super({
            opCode: 0x8A,
            addressMode: AddressModes.implied,
            mnemonic: 'TXA',
            description: 'Transfer X to A',
            implementation: (cpu, operand) => {
                cpu.A = cpu.X;
                cpu.setFlags(cpu.A);
            }
        });
    }
}

class TXS extends Instruction {
    constructor() {
        super({
            opCode: 0x9A,
            addressMode: AddressModes.implied,
            mnemonic: 'TXS',
            description: 'Transfer X to SP',
            implementation: (cpu, operand) => {
                cpu.SP = cpu.X;
            }
        });
    }
}

class TYA extends Instruction {
    constructor() {
        super({
            opCode: 0x98,
            addressMode: AddressModes.implied,
            mnemonic: 'TYA',
            description: 'Transfer Y to A',
            implementation: (cpu, operand) => {
                cpu.A = cpu.Y;
                cpu.setFlags(cpu.A);
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
            implementation: (cpu, operand) => {
                throw new Error(`OpCode ${opCode} does not correspond to any instruction on the ${cpu.name} processor.`);
            }
        });
    }
}

const NoInstruction = new InvalidInstruction();

/**
 * An instruction set
 */
export class InstructionSet {
    /**
     * Builds a new instruction set with the provided instructions.
     * @param {Instruction[]} instructions The instructions to add to the set
     */
    constructor(...instructions) {
        this[instructionSetSymbol] = new Array(256);
        for (let instruction of instructions) {
            this[instructionSetSymbol][instruction.opCode] = instruction;
        }
    }

    /**
     * Retrieves an instruction from its opcode.
     * @param {Number} opCode The opcode of the instruction to fetch.
     * @returns {Instruction} The instruction with the provided opcode.
     */
    get(opCode) { return this[instructionSetSymbol][opCode] || NoInstruction; }
}

const mcs6502InstructionSet = new InstructionSet(
    new BRK(),
    new ORA({ opCode: 0x01, addressMode: AddressModes.Xind }),
    new ORA({ opCode: 0x05, addressMode: AddressModes.zpg }),
    new ASL({ opCode: 0x06, addressMode: AddressModes.zpg }),
    new PHP(),
    new ORA({ opCode: 0x09, addressMode: AddressModes.immediate }),
    new ASL({ opCode: 0x0A, addressMode: AddressModes.A }),
    new ORA({ opCode: 0x0D, addressMode: AddressModes.abs }),
    new ASL({ opCode: 0x0E, addressMode: AddressModes.abs }),
    new BPL({ opCode: 0x10, addressMode: AddressModes.rel }),
    new ORA({ opCode: 0x11, addressMode: AddressModes.indY }),
    new ORA({ opCode: 0x15, addressMode: AddressModes.zpgX }),
    new ASL({ opCode: 0x16, addressMode: AddressModes.zpgX }),
    new CLC(),
    new ORA({ opCode: 0x19, addressMode: AddressModes.absY }),
    new ORA({ opCode: 0x1D, addressMode: AddressModes.absX }),
    new ASL({ opCode: 0x1E, addressMode: AddressModes.absX }),
    new JSR({ opCode: 0x20, addressMode: AddressModes.abs }),
    new AND({ opCode: 0x21, addressMode: AddressModes.Xind }),
    new BIT({ opCode: 0x24, addressMode: AddressModes.zeroPage }),
    new AND({ opCode: 0x25, addressMode: AddressModes.zeroPage }),
    new ROL({ opCode: 0x26, addressMode: AddressModes.zeroPage }),
    new PLP(),
    new AND({ opCode: 0x29, addressMode: AddressModes.immediate }),
    new ROL({ opCode: 0x2A, addressMode: AddressModes.A }),
    new BIT({ opCode: 0x2C, addressMode: AddressModes.abs }),
    new AND({ opCode: 0x2D, addressMode: AddressModes.abs }),
    new ROL({ opCode: 0x2E, addressMode: AddressModes.abs }),
    new BMI({ opCode: 0x30, addressMode: AddressModes.rel }),
    new AND({ opCode: 0x31, addressMode: AddressModes.indY }),
    new AND({ opCode: 0x35, addressMode: AddressModes.zpgX }),
    new ROL({ opCode: 0x36, addressMode: AddressModes.zpgX }),
    new SEC(),
    new AND({ opCode: 0x39, addressMode: AddressModes.absY }),
    new AND({ opCode: 0x3D, addressMode: AddressModes.absX }),
    new ROL({ opCode: 0x3E, addressMode: AddressModes.absX }),
    new RTI(),
    new EOR({ opCode: 0x41, addressMode: AddressModes.Xind }),
    new EOR({ opCode: 0x45, addressMode: AddressModes.zpg }),
    new LSR({ opCode: 0x46, addressMode: AddressModes.zpg }),
    new PHA(),
    new EOR({ opCode: 0x49, addressMode: AddressModes.immediate }),
    new LSR({ opCode: 0x4A, addressMode: AddressModes.A }),
    new JMP({ opCode: 0x4C, addressMode: AddressModes.abs }),
    new EOR({ opCode: 0x4D, addressMode: AddressModes.abs }),
    new LSR({ opCode: 0x4E, addressMode: AddressModes.abs }),
    new BVC({ opCode: 0x50, addressMode: AddressModes.rel }),
    new EOR({ opCode: 0x51, addressMode: AddressModes.indY }),
    new EOR({ opCode: 0x55, addressMode: AddressModes.zpgX }),
    new LSR({ opCode: 0x56, addressMode: AddressModes.zpgX }),
    new CLI(),
    new EOR({ opCode: 0x59, addressMode: AddressModes.absY }),
    new EOR({ opCode: 0x5D, addressMode: AddressModes.absX }),
    new LSR({ opCode: 0x5E, addressMode: AddressModes.absX }),
    new RTS(),
    new ADC({ opCode: 0x61, addressMode: AddressModes.Xind }),
    new ADC({ opCode: 0x65, addressMode: AddressModes.zpg }),
    new ROR({ opCode: 0x66, addressMode: AddressModes.zpg }),
    new PLA(),
    new ADC({ opCode: 0x69, addressMode: AddressModes.immediate }),
    new ROR({ opCode: 0x6A, addressMode: AddressModes.A }),
    new JMP({ opCode: 0x6C, addressMode: AddressModes.indirect }),
    new ADC({ opCode: 0x6D, addressMode: AddressModes.abs }),
    new ROR({ opCode: 0x6E, addressMode: AddressModes.abs }),
    new BVS({ opCode: 0x70, addressMode: AddressModes.rel }),
    new ADC({ opCode: 0x71, addressMode: AddressModes.indY }),
    new ADC({ opCode: 0x75, addressMode: AddressModes.zpgX }),
    new ROR({ opCode: 0x76, addressMode: AddressModes.zpgX }),
    new SEI(),
    new ADC({ opCode: 0x79, addressMode: AddressModes.absY }),
    new ADC({ opCode: 0x7D, addressMode: AddressModes.absX }),
    new ROR({ opCode: 0x7E, addressMode: AddressModes.absX }),
    new STA({ opCode: 0x81, addressMode: AddressModes.Xind }),
    new STY({ opCode: 0x84, addressMode: AddressModes.zpg }),
    new STA({ opCode: 0x85, addressMode: AddressModes.zpg }),
    new STX({ opCode: 0x86, addressMode: AddressModes.zpg }),
    new DEY(),
    new TXA(),
    new STY({ opCode: 0x8C, addressMode: AddressModes.abs }),
    new STA({ opCode: 0x8D, addressMode: AddressModes.abs }),
    new STX({ opCode: 0x8E, addressMode: AddressModes.abs }),
    new BCC({ opCode: 0x90, addressMode: AddressModes.rel }),
    new STA({ opCode: 0x91, addressMode: AddressModes.indY }),
    new STY({ opCode: 0x94, addressMode: AddressModes.zpgX }),
    new STA({ opCode: 0x95, addressMode: AddressModes.zpgX }),
    new STX({ opCode: 0x96, addressMode: AddressModes.zpgY }),
    new TYA(),
    new STA({ opCode: 0x99, addressMode: AddressModes.absY }),
    new TXS(),
    new STA({ opCode: 0x9D, addressMode: AddressModes.absX }),
    new LDY({ opCode: 0xA0, addressMode: AddressModes.immediate }),
    new LDA({ opCode: 0xA1, addressMode: AddressModes.Xind }),
    new LDX({ opCode: 0xA2, addressMode: AddressModes.immediate }),
    new LDY({ opCode: 0xA4, addressMode: AddressModes.zpg }),
    new LDA({ opCode: 0xA5, addressMode: AddressModes.zpg }),
    new LDX({ opCode: 0xA6, addressMode: AddressModes.zpg }),
    new TAY(),
    new LDA({ opCode: 0xA9, addressMode: AddressModes.immediate }),
    new TAX(),
    new LDY({ opCode: 0xAC, addressMode: AddressModes.abs }),
    new LDA({ opCode: 0xAD, addressMode: AddressModes.abs }),
    new LDX({ opCode: 0xAE, addressMode: AddressModes.abs }),
    new BCS({ opCode: 0xB0, addressMode: AddressModes.rel }),
    new LDA({ opCode: 0xB1, addressMode: AddressModes.indY }),
    new LDY({ opCode: 0xB4, addressMode: AddressModes.zpgX }),
    new LDA({ opCode: 0xB5, addressMode: AddressModes.zpgX }),
    new LDX({ opCode: 0xB6, addressMode: AddressModes.zpgY }),
    new CLV(),
    new LDA({ opCode: 0xB9, addressMode: AddressModes.absY }),
    new TSX(),
    new LDY({ opCode: 0xBC, addressMode: AddressModes.absX }),
    new LDA({ opCode: 0xBD, addressMode: AddressModes.absX }),
    new LDX({ opCode: 0xBE, addressMode: AddressModes.absY }),
    new CPY({ opCode: 0xC0, addressMode: AddressModes.immediate }),
    new CMP({ opCode: 0xC1, addressMode: AddressModes.Xind }),
    new CPY({ opCode: 0xC4, addressMode: AddressModes.zpg }),
    new CMP({ opCode: 0xC5, addressMode: AddressModes.zpg }),
    new DEC({ opCode: 0xC6, addressMode: AddressModes.zpg }),
    new INY(),
    new CMP({ opCode: 0xC9, addressMode: AddressModes.immediate }),
    new DEX(),
    new CPY({ opCode: 0xCC, addressMode: AddressModes.abs }),
    new CMP({ opCode: 0xCD, addressMode: AddressModes.abs }),
    new DEC({ opCode: 0xCE, addressMode: AddressModes.abs }),
    new BNE({ opCode: 0xD0, addressMode: AddressModes.rel }),
    new CMP({ opCode: 0xD1, addressMode: AddressModes.indY }),
    new CMP({ opCode: 0xD5, addressMode: AddressModes.zpgX }),
    new DEC({ opCode: 0xD6, addressMode: AddressModes.zpgX }),
    new CLD(),
    new CMP({ opCode: 0xD9, addressMode: AddressModes.absY }),
    new CMP({ opCode: 0xDD, addressMode: AddressModes.absX }),
    new DEC({ opCode: 0xDE, addressMode: AddressModes.absX }),
    new CPX({ opCode: 0xE0, addressMode: AddressModes.immediate }),
    new SBC({ opCode: 0xE1, addressMode: AddressModes.Xind }),
    new CPX({ opCode: 0xE4, addressMode: AddressModes.zpg }),
    new SBC({ opCode: 0xE5, addressMode: AddressModes.zpg }),
    new INC({ opCode: 0xE6, addressMode: AddressModes.zpg }),
    new INX(),
    new SBC({ opCode: 0xE9, addressMode: AddressModes.immediate }),
    new NOP(),
    new CPX({ opCode: 0xEC, addressMode: AddressModes.abs }),
    new SBC({ opCode: 0xED, addressMode: AddressModes.abs }),
    new INC({ opCode: 0xEE, addressMode: AddressModes.abs }),
    new BEQ({ opCode: 0xF0, addressMode: AddressModes.rel }),
    new SBC({ opCode: 0xF1, addressMode: AddressModes.indY }),
    new SBC({ opCode: 0xF5, addressMode: AddressModes.zpgX }),
    new INC({ opCode: 0xF6, addressMode: AddressModes.zpgX }),
    new SED(),
    new SBC({ opCode: 0xF9, addressMode: AddressModes.absY }),
    new SBC({ opCode: 0xFD, addressMode: AddressModes.absX }),
    new INC({ opCode: 0xFE, addressMode: AddressModes.absX })
);

/**
 * A 6502 processor emulator
 */
export default class MCS6502 {
    /**
     * Build a new 6502 processor
     * @param {object} settings 
     */
    constructor({
        memory = new Ram(),
        A = 0, X = 0, Y = 0, SP = 0xFF, PC = 0x200,
        N = false, V = false, B = false, D = false,
        I = false, Z = false, C = false,
        instructionSet = mcs6502InstructionSet
    } = {}) {

        this[memorySymbol] = memory;
        this[aSymbol] = A;
        this[xSymbol] = X;
        this[ySymbol] = Y;
        this[spSymbol] = SP;
        this[pcSymbol] = PC;
        this[srSymbol] = 0x20 | (N ? 0x80 : 0) | (V ? 0x40 : 0) | (B ? 0x10 : 0)
            | (D ? 0x08 : 0) | (I ? 0x04 : 0) | (Z ? 0x02 : 0) | (C ? 0x01 : 0);

        this[aHandlersSymbol] = delegate();
        this[xHandlersSymbol] = delegate();
        this[yHandlersSymbol] = delegate();
        const breakpoints = delegate();
        breakpoints.filter = (param) => {
            const predicate = param.predicate || (() => true);
            return ((!param.address || this.pc === param.address) && predicate(param));
        };
        this[breakpointsSymbol] = breakpoints
        this[instructionSetSymbol] = instructionSet;
    }

    /**
     * 6502
     */
    get name() {
        return '6502';
    }

    /**
     * The 6502's accumulator register.
     */
    get A() {
        return this[aSymbol];
    }
    set A(value) {
        this[aSymbol] = value;
        this[aHandlersSymbol].call(value);
    }
    /**
     * Adds a change handler for changes of the A register.
     * @param {Function} handler A change handler that gets called with the new value of A.
     */
    addAChange(handler) {
        this[aHandlersSymbol].add(handler);
    }
    /**
     * Removes a handler from change notifications on the A register.
     * @param {Function} handler The handler to remove
     */
    removeAChange(handler) {
        this[aHandlersSymbol].remove(handler);
    }

    /**
     * The 6502's X register
     */
    get X() {
        return this[xSymbol];
    }
    set X(value) {
        this[xSymbol] = value;
        this[xHandlersSymbol].call(value);
    }
    /**
     * Adds a change handler for changes of the X register.
     * @param {Function} handler A change handler that gets called with the new value of X.
     */
    addXChange(handler) {
        this[xHandlersSymbol].add(handler);
    }
    /**
     * Removes a handler from change notifications on the X register.
     * @param {Function} handler The handler to remove
     */
    removeXChange(handler) {
        this[xHandlersSymbol].remove(handler);
    }

    get Y() {
        return this[ySymbol];
    }
    set Y(value) {
        this[ySymbol] = value;
        this[yHandlersSymbol].call(value);
    }
    /**
     * Adds a change handler for changes of the Y register.
     * @param {Function} handler A change handler that gets called with the new value of Y.
     */
    addYChange(handler) {
        this[yHandlersSymbol].add(handler);
    }
    /**
     * Removes a handler from change notifications on the Y register.
     * @param {Function} handler The handler to remove
     */
    removeYChange(handler) {
        this[yHandlersSymbol].remove(handler);
    }

    /**
     * The 6502's program counter register, a 16 bit address.
     */
    get PC() {
        return this[pcSymbol];
    }
    set PC(value) {
        this[pcSymbol] = value;
        this[breakpointsSymbol].call(this);
    }
    /**
     * Adds a conditional breakpoint for a specific address
     * @param {Address} address The address at which to break
     * @param {Function} predicate A function that receives the processor, and returns true if the breakpoint handler should be called
     * @param {Function} handler The handler function for the breakpoint 
     */
    addBreakpoint(address, predicate, handler) {
        this[breakpointsSymbol].add(handler, { address, predicate });
    }
    /**
     * Adds a breakpoint for a specific address
     * @param {Address} address The address at which to break
     * @param {Function} handler The handler function for the breakpoint
     */
    addAddressBreakpoint(address, handler) {
        this[breakpointsSymbol].add(handler, { address });
    }
    /**
     * Adds a conditional breakpoint
     * @param {Function} predicate A function that receives the processor, and returns true if the breakpoint handler should be called
     * @param {Function} handler The handler function for the breakpoint 
     */
    addConditionalBreakpoint(predicate, handler) {
        this[breakpointsSymbol].add(handler, { predicate });
    }
    // TODO: remove breakpoint

    /**
     * The 6502's stack pointer, a single byte pointer to memory page 1
     */
    get SP() {
        return this[spSymbol];
    }
    set SP(value) {
        this[spSymbol] = value;
    }

    /**
     * Pushes a byte onto the stack
     * @param {Number} value The byte to push
     */
    push(value) {
        this.poke(0x100 | this.SP, value);
        this.SP = (this.SP - 1) & 0xFF;
    }
    /**
     * Pulls a byte from the stack
     * @returns {Number} the byte that was last pushed onto the stack
     */
    pull() {
        this.SP = (this.SP + 1) & 0xFF;
        return this.peek(0x100 | this.SP);
    }
    /**
     * Inspects the latest value pushed to the stack without moving the stack pointer
     * @returns {Number} the byte that was last pushed onto the stack
     */
    stackPeek() {
        return this.peek(0x100 | ((this.SP + 1) & 0xFF));
    }

    /**
     * The 6502's status register, a combination of C, Z, I, D, B, V, and N
     */
    get SR() {
        return this[srSymbol];
    }
    set SR(value) {
        this[srSymbol] = (value & 0xFF) | 0x20;
    }
    /**
     * The 6502's carry bit
     */
    get C() {
        return (this[srSymbol] & 0x01) != 0;
    }
    set C(value) {
        if (value) this[srSymbol] |= 0x01;
        else this[srSymbol] &= 0xFE;
    }
    /**
     * The 6502's zero bit
     */
    get Z() {
        return (this[srSymbol] & 0x02) != 0;
    }
    set Z(value) {
        if (value) this[srSymbol] |= 0x02;
        else this[srSymbol] &= 0xFD;
    }
    /**
     * The 6502's interrupt bit. If set to true, disables interrupt requests (IRQ).
     */
    get I() {
        return (this[srSymbol] & 0x04) != 0;
    }
    set I(value) {
        if (value) this[srSymbol] |= 0x04;
        else this[srSymbol] &= 0xFB;
    }
    /**
     * The 6502's decimal bit.
     * If set to true, arithmetic operations are done in binary-coded decimal (BCD).
     */
    get D() {
        return (this[srSymbol] & 0x08) != 0;
    }
    set D(value) {
        if (value) this[srSymbol] |= 0x08;
        else this[srSymbol] &= 0xF7;
    }
    /**
     * The 6502's break bit.
     * If set to true, an interruption is triggered.
     */
    get B() {
        return (this[srSymbol] & 0x10) != 0;
    }
    set B(value) {
        if (value) this[srSymbol] |= 0x10;
        else this[srSymbol] &= 0xEF;
        // TODO interrupt
    }
    /**
     * The 6502's overflow bit.
     */
    get V() {
        return (this[srSymbol] & 0x40) != 0;
    }
    set V(value) {
        if (value) this[srSymbol] |= 0x40;
        else this[srSymbol] &= 0xBF;
    }
    /**
     * The 6502's negative bit.
     */
    get N() {
        return (this[srSymbol] & 0x80) != 0;
    }
    set N(value) {
        if (value) this[srSymbol] |= 0x80;
        else this[srSymbol] &= 0x7F;
    }

    /**
     * Sets the Z and N flags to reflect the passed-in value
     * @param {Number} value The value to set flags from
     */
    setFlags(value) {
        this.Z = value == 0;
        this.N = (value & 0x80) !== 0;
    }

    /**
     * Reads an address from memory
     * @param {Address} pointer The address where to look for an address
     * @param {bool} zeroPage If true, the address is constrained to page 0
     * even if the address points at the boundary of the page.
     * @returns {Address} The address read from memory
     */
    addressAt(pointer, zeroPage = false) {
        return this[memorySymbol].addressAt(pointer, zeroPage);
    }

    /**
     * Returns the byte at the provided address in memory
     * @param {Address} address The address at which to look
     * @returns {Number} the byte read from memory
     */
    peek(address) {
        return this[memorySymbol].peek(address);
    }
    /**
     * Writes bytes to memory
     * @param {Address} address The address at which to write
     * @param {Number} bytes The bytes to write
     */
    poke(address, ...bytes) {
        this[memorySymbol].poke(address, ...bytes);
    }

    /**
     * Executes the instruction at the PC, then moves PC to the next instruction
     */
    step() {
        const opCode = this.peek(this.PC);
        const instruction = this[instructionSetSymbol].get(opCode);
        const bytes = instruction.addressMode ? instruction.addressMode.bytes : 0;
        const unevaluatedOperand = bytes == 0 ? null
            : bytes == 1 ? this.peek(this.PC + 1)
                : this.addressAt(this.PC + 1);
        const operand = instruction.addressMode.evaluate(this, unevaluatedOperand);
        // console.log(`Executing ${instruction.mnemonic} at ${new Address(this.PC).toString()} with operand ${unevaluatedOperand}, evaluated by ${instruction.addressMode.description} mode to ${operand}, then skipping ${1 + instruction.addressMode.bytes}`);
        let instructionResult = instruction.implementation(this, operand, unevaluatedOperand);
        if (instructionResult && instructionResult.PC) this.PC = instructionResult.PC;
        else this.PC += 1 + bytes;
    }

    /**
     * The 6502's instruction set, as an array indexed by opCode
     */
    get instructionSet() { return this[instructionSetSymbol]; }

    /**
     * Triggers a 6502 interrupt, which sets the IRQ prevention bit,
     * then loads the program counter with the address at $FFFE.
     */
    interrupt() {
        this.PC++;
        const pc = new Address(this.PC);
        this.push(pc.MSB);
        this.push(pc.LSB);
        this.B = true;
        this.push(this.SR);
        this.I = true;
        return { PC: this.interruptVector };
    }

    get interruptVector() {
        return this.addressAt(0xFFFE);
    }
    set interruptVector(value) {
        const address = new Address(value);
        this.poke(0xFFFE, address.LSB, address.MSB);
    }
}