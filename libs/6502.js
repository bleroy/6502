'use strict';

// Symbols for private fields
const aSymbol = Symbol('a'), xSymbol = Symbol('x'), ySymbol = Symbol('y'),
    spSymbol = Symbol('sp'), pcSymbol = Symbol('pc'), srSymbol = ('sr'),
    memorySymbol = Symbol('memory'), aHandlersSymbol = Symbol('aHandlers'),
    xHandlersSymbol = Symbol('xHandlers'), yHandlersSymbol = Symbol('yHandlers'),
    breakpointsSymbol = Symbol('breakpoints'), valueSymbol = Symbol('value'),
    instructionSetSymbol = Symbol('instructionSet');

/**
 * Constructs a delegate, which is a list of functions that can be executed as one.
 * It's possible to add to and remove functions from the delegate.
 * @param {Array} array - a list of functions to execute sequentially. Optional.
 */
export let delegate = (...array) => {
    let result = (...args) => {
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
        return new Address(
            this[memorySymbol][address] |
            (this[memorySymbol][(address + 1) & (zeroPage ? 0xFF : 0xFFFF)] << 8)
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
        let addr = address.valueOf();
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
 * An address mode evaluation callback that always returns an Address.
 * @callback addressModeAddressEvaluation
 * @param {MCS6502} processor - the processor to use to evaluate the address mode.
 * @param {(Number|Address)=} operand - the operand to evaluate.
 * @returns {Address} - the Address result of the evaluation.
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
     * in the context of the provided processor. If there's no ambiguity between evaluating the address or the value,
     * such as for the absolute address mode, only this evaluation has to be defined. Otherwise, such as is the case for
     * indirect addressing, both this and `evaluateAddress` must be defined. If this function returns an address,
     * the actual evaluate method on the address mode object will retrieve the value from that address in the processor's
     * memory.
     * @param {addressModeAddressEvaluation} mode.evaluateAddress - a function that evaluates the operand as an address for this
     * address mode. Whereas the evaluate method can retrieve a byte from memory, this must always return an Address,
     * or be undefined if it's meaningless for this address mode.
     * @param {addressModeDisassembler} mode.disassemble - a function that generates a string representation of the operand
     * for this address mode, to be used by the disassembler.
     */
    constructor({ name, description, evaluate, evaluateAddress, disassemble, bytes }) {
        this.name = name;
        this.description = description;
        this.evaluateInternal = evaluate;
        this.evaluateAddressInternal = evaluateAddress;
        this.disassemble = disassemble;
        this.bytes = bytes;
    }

    /**
     * Evaluates the operand as a byte for this address mode, in the context of the passed-in processor.
     * Instructions that handle Byte data, such as ADC, should call into this to evaluate the operand.
     * @param {MCS6502} cpu - the processor in the context of which this operand should be evaluated. 
     * @param {(Number|Address)=} operand - the operand to evaluate.
     * @returns {Number} - the evaluated result.
     */
    evaluate(cpu, operand) {
        let evaluation = this.evaluateInternal(cpu, operand);
        return evaluation instanceof Address ? cpu.peek(evaluation) : evaluation;
    }

    /**
     * Evaluates the operand as an address for this address mode, in the context of the passed-in processor.
     * Instructions that handle addresses, such as JMP, should call into this to evaluate the operand.
     * @param {MCS6502} cpu - the processor in the context of which this operand should be evaluated.
     * @param {(Number|Address)=} operand - the operand to evaluate.
     * @returns {Address} - the evaluated address.
     */
    evaluateAddress(cpu, operand) {
        let evaluation = this.evaluateInternal(cpu, operand);
        if (!(evaluation instanceof Address)) throw new TypeError('Result of address mode evaluation is not an address');
        return evaluation;
    }
}

/**
 * An object containing implementations for all of a 6502's address modes
 */
export let AddressModes = {
    A: new AddressMode({
        name: 'A',
        description: 'Accumulator',
        evaluate: cpu => cpu.A,
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
        evaluate: (cpu, address) => new Address(address + cpu.X),
        disassemble: address => `${new Address(address).toString()},X`,
        bytes: 2
    }),
    absY: new AddressMode({
        name: 'abs,Y',
        description: 'absolute, Y-indexed',
        evaluate: (cpu, address) => new Address(address + cpu.Y),
        disassemble: address => `${new Address(address).toString()},Y`,
        bytes: 2
    }),
    immediate: new AddressMode({
        name: '#',
        description: 'immediate',
        evaluate: (cpu, operand) => operand,
        disassemble: operand => `#${Byte.toString(operand)}`,
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
        evaluate: (cpu, address) => new Address(cpu.addressAt(address)),
        disassemble: address => `(${new Address(address).toString()})`,
        bytes: 2
    }),
    Xind: new AddressMode({
        name: 'X,ind',
        description: 'X-indexed, indirect',
        evaluate: (cpu, address) => new Address(cpu.addressAt((address + cpu.X) & 0xFF, true)),
        disassemble: address => `(${Byte.toString(address)},X)`,
        bytes: 1
    }),
    indY: new AddressMode({
        name: 'ind,Y',
        description: 'indirect, Y-indexed',
        evaluate: (cpu, address) => new Address(cpu.addressAt(address, true) + cpu.Y),
        disassemble: address => `(${Byte.toString(address)}),Y`,
        bytes: 1
    }),
    rel: new AddressMode({
        name: 'rel',
        description: 'relative',
        evaluate: (cpu, offset) => new Address(cpu.PC + offset),
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
        evaluate: (cpu, address) => new Address((address + cpu.X) & 0xFF),
        disassemble: address => `${Byte.toString(address)},X`,
        bytes: 1
    }),
    zpgY: new AddressMode({
        name: 'zpg,Y',
        description: 'zero page, Y-indexed',
        evaluate: (cpu, address) => new Address((address + cpu.Y) & 0xFF),
        disassemble: address => `${Byte.toString(address)},Y`,
        bytes: 1
    })
}


/**
 * An instruction implementation callback.
 * @callback instructionImplementation
 * @param {MCS6502} cpu - the processor to use to evaluate the address mode.
 * @param {(Number|Address)=} operand - the operand to evaluate.
 * @returns {Number} - the number of cycles used by the instruction.
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
     * Executes the instruction on a processor
     * @param {MCS6502} cpu - the processor on which to execute the instruction
     * @param {(Number|Address)=} operand - the argument to the instruction
     * @returns {Number} - the number of cycles spent executing the instruction
     */
    execute(cpu, operand) {
        return this.implementation(cpu, operand);
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
        let opCode = cpu.peek(address);
        let instruction = cpu.instructionSet.get(opCode);
        if (!instruction || instruction instanceof InvalidInstruction) {
            yield `${address.valueOf().toString(16).toUpperCase().padStart(4, '0')}          *** # Unknown opCode ${Byte.toString(opCode)}`;
            continue;
        }
        let addressMode = instruction.addressMode;
        let operand =
            addressMode.bytes == 0 ? null :
                addressMode.bytes == 1 ? cpu.peek(address + 1) :
                    cpu.addressAt(address + 1);
        let memoryDump = (
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
                let oldA = cpu.A;
                let val = addressMode.evaluate(cpu, operand);
                let sum = oldA + val + (cpu.C ? 1 : 0);
                // console.log(`ADC: A=${oldA}, sum=${sum}`);
                if (cpu.D) {
                    if (((oldA & 0xF) + (val & 0xF) + (cpu.C ? 1 : 0)) > 9) {
                        sum += 6;
                    }
                    if (sum > 0x99) sum += 96;
                    cpu.N = false;
                    cpu.V = false;
                    cpu.C = sum > 0x99;
                }
                else {
                    cpu.N = (sum & 0x80) != 0;
                    cpu.V = !((oldA ^ val) & 0x80) && ((oldA ^ sum) & 0x80);
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
                let value = addressMode.evaluate(cpu, operand);
                cpu.A &= value;
                cpu.setFlags(cpu.A);
            }
        })
    }
}

// Here be dragons...
class ASL extends Instruction { }
class BCC extends Instruction { }
class BCS extends Instruction { }
class BEQ extends Instruction { }
class BIT extends Instruction { }
class BMI extends Instruction { }
class BNE extends Instruction { }
class BPL extends Instruction { }

class BRK extends Instruction {
    constructor() {
        super({
            opCode: 0x00,
            addressMode: null,
            mnemonic: 'BRK',
            description: 'Force break',
            implementation: (cpu) => {
                cpu.interrupt();
            }
        });
    }
}

class BVC extends Instruction { }
class BVS extends Instruction { }
class CLC extends Instruction { }
class CLD extends Instruction { }
class CLI extends Instruction { }
class CLV extends Instruction { }
class CMP extends Instruction { }
class CPX extends Instruction { }
class CPY extends Instruction { }
class DEC extends Instruction { }
class DEX extends Instruction { }
class DEY extends Instruction { }
class EOR extends Instruction { }
class INC extends Instruction { }
class INX extends Instruction { }
class INY extends Instruction { }
class JMP extends Instruction { }
class JSR extends Instruction { }

class LDA extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'LDA',
            description: 'Load accumulator',
            implementation: (cpu, operand) => {
                let value = addressMode.evaluate(cpu, operand);
                cpu.A = value;
                cpu.setFlags(value);
            }
        });
    }
}

class LDX extends Instruction { }
class LDY extends Instruction { }
class LSR extends Instruction { }
class NOP extends Instruction { }
class ORA extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'ORA',
            description: 'Bitwise OR with the accumulator',
            implementation: (cpu, operand) => {
                let value = addressMode.evaluate(cpu, operand);
                cpu.A |= value;
                cpu.setFlags(cpu.A);
            }
        })
    }
}
class PHA extends Instruction { }
class PHP extends Instruction { }
class PLA extends Instruction { }
class PLP extends Instruction { }
class ROL extends Instruction { }
class ROR extends Instruction { }
class RTI extends Instruction { }
class RTS extends Instruction { }
class SBC extends Instruction { }
class SEC extends Instruction { }
class SED extends Instruction { }
class SEI extends Instruction { }

class STA extends Instruction {
    constructor({ opCode, addressMode }) {
        super({
            opCode, addressMode,
            mnemonic: 'STA',
            description: 'Store accumulator',
            implementation: (cpu, operand) => {
                cpu.poke(addressMode.evaluateAddress(cpu, operand), cpu.A);
            }
        });
    }
}
class STX extends Instruction { }
class STY extends Instruction { }
class TAX extends Instruction { }
class TAY extends Instruction { }
class TSX extends Instruction { }
class TXA extends Instruction { }
class TXS extends Instruction { }
class TYA extends Instruction { }

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

let NoInstruction = new InvalidInstruction();

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

let mcs6502InstructionSet = new InstructionSet(
    new BRK({ opCode: 0x00, addressMode: AddressModes.implied }),
    new ORA({ opCode: 0x01, addressMode: AddressModes.Xind }),
    new ORA({ opCode: 0x05, addressMode: AddressModes.zpg }),
    new ASL({ opCode: 0x06, addressMode: AddressModes.zpg }),
    new PHP({ opCode: 0x08, addressMode: AddressModes.implied }),
    new ORA({ opCode: 0x09, addressMode: AddressModes.immediate }),
    new ASL({ opCode: 0x0A, addressMode: AddressModes.A }),
    new ORA({ opCode: 0x0D, addressMode: AddressModes.abs }),
    new ASL({ opCode: 0x0E, addressMode: AddressModes.abs }),
    new BPL({ opCode: 0x10, addressMode: AddressModes.rel }),
    new ORA({ opCode: 0x11, addressMode: AddressModes.indY }),
    new ORA({ opCode: 0x15, addressMode: AddressModes.zpgX }),
    new ASL({ opCode: 0x16, addressMode: AddressModes.zpgX }),
    new CLC({ opCode: 0x18, addressMode: AddressModes.implied }),
    new ORA({ opCode: 0x19, addressMode: AddressModes.absY }),
    new ORA({ opCode: 0x1D, addressMode: AddressModes.absX }),
    new ASL({ opCode: 0x1E, addressMode: AddressModes.absX }),
    new JSR({ opCode: 0x20, addressMode: AddressModes.abs }),
    new AND({ opCode: 0x21, addressMode: AddressModes.Xind }),
    new BIT({ opCode: 0x24, addressMode: AddressModes.zeroPage }),
    new AND({ opCode: 0x25, addressMode: AddressModes.zeroPage }),
    new ROL({ opCode: 0x26, addressMode: AddressModes.zeroPage }),
    new PLP({ opCode: 0x28, addressMode: AddressModes.implied }),
    new AND({ opCode: 0x29, addressMode: AddressModes.immediate }),
    new ROL({ opCode: 0x2A, addressMode: AddressModes.A }),
    new BIT({ opCode: 0x2C, addressMode: AddressModes.abs }),
    new AND({ opCode: 0x2D, addressMode: AddressModes.abs }),
    new ROL({ opCode: 0x2E, addressMode: AddressModes.abs }),
    new BMI({ opCode: 0x30, addressMode: AddressModes.rel }),
    new AND({ opCode: 0x31, addressMode: AddressModes.indY }),
    new AND({ opCode: 0x35, addressMode: AddressModes.zpgX }),
    new ROL({ opCode: 0x36, addressMode: AddressModes.zpgX }),
    new SEC({ opCode: 0x38, addressMode: AddressModes.implied }),
    new AND({ opCode: 0x39, addressMode: AddressModes.absY }),
    new AND({ opCode: 0x3D, addressMode: AddressModes.absX }),
    new ROL({ opCode: 0x3E, addressMode: AddressModes.absX }),
    new RTI({ opCode: 0x40, addressMode: AddressModes.implied }),
    new EOR({ opCode: 0x41, addressMode: AddressModes.Xind }),
    new EOR({ opCode: 0x45, addressMode: AddressModes.zpg }),
    new LSR({ opCode: 0x46, addressMode: AddressModes.zpg }),
    new PHA({ opCode: 0x48, addressMode: AddressModes.implied }),
    new EOR({ opCode: 0x49, addressMode: AddressModes.immediate }),
    new LSR({ opCode: 0x4A, addressMode: AddressModes.A }),
    new JMP({ opCode: 0x4C, addressMode: AddressModes.abs }),
    new EOR({ opCode: 0x4D, addressMode: AddressModes.abs }),
    new LSR({ opCode: 0x4E, addressMode: AddressModes.abs }),
    new BVC({ opCode: 0x50, addressMode: AddressModes.rel }),
    new EOR({ opCode: 0x51, addressMode: AddressModes.indY }),
    new EOR({ opCode: 0x55, addressMode: AddressModes.zpgX }),
    new LSR({ opCode: 0x56, addressMode: AddressModes.zpgX }),
    new CLI({ opCode: 0x58, addressMode: AddressModes.implied }),
    new EOR({ opCode: 0x59, addressMode: AddressModes.absY }),
    new EOR({ opCode: 0x5D, addressMode: AddressModes.absX }),
    new LSR({ opCode: 0x5E, addressMode: AddressModes.absX }),
    new RTS({ opCode: 0x60, addressMode: AddressModes.implied }),
    new ADC({ opCode: 0x61, addressMode: AddressModes.Xind }),
    new ADC({ opCode: 0x65, addressMode: AddressModes.zpg }),
    new ROR({ opCode: 0x66, addressMode: AddressModes.zpg }),
    new PLA({ opCode: 0x68, addressMode: AddressModes.implied }),
    new ADC({ opCode: 0x69, addressMode: AddressModes.immediate }),
    new ROR({ opCode: 0x6A, addressMode: AddressModes.A }),
    new JMP({ opCode: 0x6C, addressMode: AddressModes.indirect }),
    new ADC({ opCode: 0x6D, addressMode: AddressModes.abs }),
    new ROR({ opCode: 0x6E, addressMode: AddressModes.abs }),
    new BVS({ opCode: 0x70, addressMode: AddressModes.rel }),
    new ADC({ opCode: 0x71, addressMode: AddressModes.indY }),
    new ADC({ opCode: 0x75, addressMode: AddressModes.zpgX }),
    new ROR({ opCode: 0x76, addressMode: AddressModes.zpgX }),
    new SEI({ opCode: 0x78, addressMode: AddressModes.implied }),
    new ADC({ opCode: 0x79, addressMode: AddressModes.absY }),
    new ADC({ opCode: 0x7D, addressMode: AddressModes.absX }),
    new ROR({ opCode: 0x7E, addressMode: AddressModes.absX }),
    new STA({ opCode: 0x81, addressMode: AddressModes.Xind }),
    new STY({ opCode: 0x84, addressMode: AddressModes.zpg }),
    new STA({ opCode: 0x85, addressMode: AddressModes.zpg }),
    new STX({ opCode: 0x86, addressMode: AddressModes.zpg }),
    new DEY({ opCode: 0x88, addressMode: AddressModes.implied }),
    new TXA({ opCode: 0x8A, addressMode: AddressModes.implied }),
    new STY({ opCode: 0x8C, addressMode: AddressModes.abs }),
    new STA({ opCode: 0x8D, addressMode: AddressModes.abs }),
    new STX({ opCode: 0x8E, addressMode: AddressModes.abs }),
    new BCC({ opCode: 0x90, addressMode: AddressModes.rel }),
    new STA({ opCode: 0x91, addressMode: AddressModes.indY }),
    new STY({ opCode: 0x94, addressMode: AddressModes.zpgX }),
    new STA({ opCode: 0x95, addressMode: AddressModes.zpgX }),
    new STX({ opCode: 0x96, addressMode: AddressModes.zpgY }),
    new TYA({ opCode: 0x98, addressMode: AddressModes.implied }),
    new STA({ opCode: 0x99, addressMode: AddressModes.absY }),
    new TXS({ opCode: 0x9A, addressMode: AddressModes.impl }),
    new STA({ opCode: 0x9D, addressMode: AddressModes.absX }),
    new LDY({ opCode: 0xA0, addressMode: AddressModes.immediate }),
    new LDA({ opCode: 0xA1, addressMode: AddressModes.Xind }),
    new LDX({ opCode: 0xA2, addressMode: AddressModes.immediate }),
    new LDY({ opCode: 0xA4, addressMode: AddressModes.zpg }),
    new LDA({ opCode: 0xA5, addressMode: AddressModes.zpg }),
    new LDX({ opCode: 0xA6, addressMode: AddressModes.zpg }),
    new TAY({ opCode: 0xA8, addressMode: AddressModes.implied }),
    new LDA({ opCode: 0xA9, addressMode: AddressModes.immediate }),
    new TAX({ opCode: 0xAA, addressMode: AddressModes.implied }),
    new LDY({ opCode: 0xAC, addressMode: AddressModes.abs }),
    new LDA({ opCode: 0xAD, addressMode: AddressModes.abs }),
    new LDX({ opCode: 0xAE, addressMode: AddressModes.abs }),
    new BCS({ opCode: 0xB0, addressMode: AddressModes.rel }),
    new LDA({ opCode: 0xB1, addressMode: AddressModes.indY }),
    new LDY({ opCode: 0xB4, addressMode: AddressModes.zpgX }),
    new LDA({ opCode: 0xB5, addressMode: AddressModes.zpgX }),
    new LDX({ opCode: 0xB6, addressMode: AddressModes.zpgY }),
    new CLV({ opCode: 0xB8, addressMode: AddressModes.impl }),
    new LDA({ opCode: 0xB9, addressMode: AddressModes.absY }),
    new TSX({ opCode: 0xBA, addressMode: AddressModes.impl }),
    new LDY({ opCode: 0xBC, addressMode: AddressModes.absX }),
    new LDA({ opCode: 0xBD, addressMode: AddressModes.absX }),
    new LDX({ opCode: 0xBE, addressMode: AddressModes.absY }),
    new CPY({ opCode: 0xC0, addressMode: AddressModes.immediate }),
    new CMP({ opCode: 0xC1, addressMode: AddressModes.Xind }),
    new CPY({ opCode: 0xC4, addressMode: AddressModes.zpg }),
    new CMP({ opCode: 0xC5, addressMode: AddressModes.zpg }),
    new DEC({ opCode: 0xC6, addressMode: AddressModes.zpg }),
    new INY({ opCode: 0xC8, addressMode: AddressModes.implied }),
    new CMP({ opCode: 0xC9, addressMode: AddressModes.immediate }),
    new DEX({ opCode: 0xCA, addressMode: AddressModes.implied }),
    new CPY({ opCode: 0xCC, addressMode: AddressModes.abs }),
    new CMP({ opCode: 0xCD, addressMode: AddressModes.abs }),
    new DEC({ opCode: 0xCE, addressMode: AddressModes.abs }),
    new BNE({ opCode: 0xD0, addressMode: AddressModes.rel }),
    new CMP({ opCode: 0xD1, addressMode: AddressModes.indY }),
    new CMP({ opCode: 0xD5, addressMode: AddressModes.zpgX }),
    new DEC({ opCode: 0xD6, addressMode: AddressModes.zpgX }),
    new CLD({ opCode: 0xD8, addressMode: AddressModes.implied }),
    new CMP({ opCode: 0xD9, addressMode: AddressModes.absY }),
    new CMP({ opCode: 0xDD, addressMode: AddressModes.absX }),
    new DEC({ opCode: 0xDE, addressMode: AddressModes.absX }),
    new CPX({ opCode: 0xE0, addressMode: AddressModes.immediate }),
    new SBC({ opCode: 0xE1, addressMode: AddressModes.Xind }),
    new CPX({ opCode: 0xE4, addressMode: AddressModes.zpg }),
    new SBC({ opCode: 0xE5, addressMode: AddressModes.zpg }),
    new INC({ opCode: 0xE6, addressMode: AddressModes.zpg }),
    new INX({ opCode: 0xE8, addressMode: AddressModes.impl }),
    new SBC({ opCode: 0xE9, addressMode: AddressModes.immediate }),
    new NOP({ opCode: 0xEA, addressMode: AddressModes.implied }),
    new CPX({ opCode: 0xEC, addressMode: AddressModes.abs }),
    new SBC({ opCode: 0xED, addressMode: AddressModes.abs }),
    new INC({ opCode: 0xEE, addressMode: AddressModes.abs }),
    new BEQ({ opCode: 0xF0, addressMode: AddressModes.rel }),
    new SBC({ opCode: 0xF1, addressMode: AddressModes.indY }),
    new SBC({ opCode: 0xF5, addressMode: AddressModes.zpgX }),
    new INC({ opCode: 0xF6, addressMode: AddressModes.zpgX }),
    new SED({ opCode: 0xF8, addressMode: AddressModes.impl }),
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
        let breakpoints = delegate();
        breakpoints.filter = (param) => {
            let predicate = param.predicate || (() => true);
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
        let opCode = this.peek(this.PC);
        let instruction = this[instructionSetSymbol].get(opCode);
        let bytes = instruction.addressMode.bytes;
        let operand = bytes == 0 ? null
            : bytes == 1 ? this.peek(this.PC + 1)
                : this.addressAt(this.PC + 1);
        // console.log(`Executing ${instruction.mnemonic} with operand ${operand}, then skipping ${1 + instruction.addressMode.bytes}`);
        instruction.implementation(this, operand);
        this.PC += 1 + instruction.addressMode.bytes;
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
        this.push((this.PC >>> 8) & 0xFF);
        this.push(this.PC & 0xFF);
        this.B = true;
        this.push(this.SR);
        this.I = true;
        this.PC = this.interruptVector;
    }

    get interruptVector() {
        return this.addressAt(0xFFFE);
    }
    set interruptVector(value) {
        this.poke(0xFFFE, value & 0xFF, (value >>> 8) & 0xFF);
    }
}