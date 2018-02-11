import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
let should = chai.should();

import MCS6502, { disassemble, Instruction, AddressMode, Address, Byte } from '../libs/6502';

class CAT extends Instruction {
    constructor(opCode, addressMode) {
        super({ opCode, addressMode, mnemonic: 'CAT' });
    }
}

let noOperandAddressMode = new AddressMode({
    name: 'mode0',
    description: 'Fake no-operand address mode',
    disassemble: () => '{nope}',
    bytes: 0
});

let byteOperandAddressMode = new AddressMode({
    name: 'mode1',
    description: 'Fake single byte operand address mode',
    disassemble: operand => `#${new Byte(operand).toString()}`,
    bytes: 1
});

let addressOperandAddressMode = new AddressMode({
    name: 'mode2',
    description: 'Fake two-byte operand address mode',
    disassemble: address => `${new Address(address).toString()}`,
    bytes: 2
});

let CATno = new CAT(0x02, noOperandAddressMode);
let CATbyte = new CAT(0x03, byteOperandAddressMode);
let CATaddress = new CAT(0x04, addressOperandAddressMode);

let processor = {
    instructionSet: [null, null, CATno, CATbyte, CATaddress],
    peek: address => processor.memory[address]
}

describe('Disassembler', () => {
    it("Disassembles all lengths of address modes", () => {
        processor.memory = new Uint8Array([
            0x02,
            0x03, 0xFF,
            0x04, 0x34, 0x12,
            0x03, 0x3C,
            0x02,
            0x02,
            0x04, 0x78, 0x56,
            0x02,
            0x03, 0x6D
        ]);

        let gen = disassemble(processor, 0);

        gen.next().value.should.equal("0000 CAT {nope}");
        gen.next().value.should.equal("0001 CAT #$FF");
        gen.next().value.should.equal("0003 CAT $1234");
        gen.next().value.should.equal("0006 CAT #$3C");
        gen.next().value.should.equal("0008 CAT {nope}");
        gen.next().value.should.equal("0009 CAT {nope}");
        gen.next().value.should.equal("000A CAT $5678");
        gen.next().value.should.equal("000D CAT {nope}");
        gen.next().value.should.equal("000E CAT #$6D");
    });
});