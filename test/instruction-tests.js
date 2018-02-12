import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
let should = chai.should();

import MCS6502, { Instruction, AddressModes, Address, Byte } from '../libs/6502';

describe('Instruction', () => {
    describe('constructor', () => {
        it('properly sets properties', () => {
            let parameters = {
                mnemonic: "ABC",
                opCode: 42,
                description: "the description",
                implementation: (proc, operand) => 3,
                addressMode: AddressModes.A
            };
            let instruction = new Instruction(parameters);

            instruction.should.include(parameters);
        });
    });

    describe('execute', () => {
        it('calls into the instruction\'s implementation', () => {
            let implementationCalled = false;
            let processorName = null;
            let operandValue = null;

            let instruction = new Instruction({
                implementation: (proc, operand) => {
                    implementationCalled = true;
                    processorName = proc.name;
                    operandValue = operand;
                    return 2;
                }
            });

            let cycles = instruction.execute(new MCS6502(), new Byte(42));

            implementationCalled.should.be.true;
            processorName.should.equal('6502');
            operandValue.should.equal(42);
            cycles.should.equal(2);
        });
    });

    describe('disassemble', () => {
        let instruction = new Instruction({
            mnemonic: 'ABC',
            addressMode: AddressModes.indirect
        });
        let disassembled = instruction.disassemble(0x423F);

        disassembled.should.equal('ABC ($423F)');
    });
});
