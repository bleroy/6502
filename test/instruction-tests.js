import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502, { Instruction, AddressModes, Address } from '../libs/6502';

describe('Instruction', () => {
    describe('constructor', () => {
        it('properly sets properties', () => {
            const parameters = {
                mnemonic: "ABC",
                opCode: 42,
                description: "the description",
                implementation: (proc, operand) => 3,
                addressMode: AddressModes.A
            };
            const instruction = new Instruction(parameters);

            instruction.should.include(parameters);
        });
    });

    describe('disassemble', () => {
        it("disassembles instructions to source code", () => {
            const instruction = new Instruction({
                mnemonic: 'ABC',
                addressMode: AddressModes.indirect
            });
            const disassembled = instruction.disassemble(0x423F);

            disassembled.should.equal('ABC ($423F)');
        });
    });
});
