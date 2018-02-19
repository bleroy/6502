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

describe("instructions", () => {
    describe("ADC", () => {
        it("agrees 0 + 1 = 1", () => {
            let cpu = new MCS6502();

            cpu.poke(0x200, 0x69, 0x01); // ADC #$01
            cpu.step();
            cpu.A.value.should.equal(1);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.false;
        });

        it("finds 127 + 1 = -128 with overflow", () => {
            let cpu = new MCS6502({A: 0x7F});

            cpu.poke(0x200, 0x69, 0x01); // ADC #$01
            cpu.step();
            cpu.A.value.should.equal(0x80);
            cpu.N.should.be.true;
            cpu.V.should.be.true;
            cpu.Z.should.be.false;
            cpu.C.should.be.false;
        });

        it("agrees -128 + 1 = -127", () => {
            let cpu = new MCS6502({A: 0x80});

            cpu.poke(0x200, 0x69, 0x01); // ADC #$01
            cpu.step();
            cpu.A.value.should.equal(0x81);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.true;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.false;
        });

        it("agrees -1 + 1 = 0", () => {
            let cpu = new MCS6502({A: 0xFF});

            cpu.poke(0x200, 0x69, 0x01); // ADC #$01
            cpu.step();
            cpu.A.value.should.equal(0x00);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.true;
            cpu.C.should.be.true;
        });

        it("agrees 0 - 1 = -1", () => {
            let cpu = new MCS6502();

            cpu.poke(0x200, 0x69, 0xFF); // ADC #$FF
            cpu.step();
            cpu.A.value.should.equal(0xFF);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.true;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.false;
        });

        it("agrees 127 - 1 = 126", () => {
            let cpu = new MCS6502({A: 0x7F});

            cpu.poke(0x200, 0x69, 0xFF); // ADC #$FF
            cpu.step();
            cpu.A.value.should.equal(0x7E);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.true;
        });

        it("finds -128 - 1 = 127 with overflow", () => {
            let cpu = new MCS6502({A: 0x80});

            cpu.poke(0x200, 0x69, 0xFF); // ADC #$FF
            cpu.step();
            cpu.A.value.should.equal(0x7F);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.true;
            cpu.Z.should.be.false;
            cpu.C.should.be.true;
        });

        it("agrees -1 - 1 = -2", () => {
            let cpu = new MCS6502({A: 0xFF});

            cpu.poke(0x200, 0x69, 0xFF); // ADC #$FF
            cpu.step();
            cpu.A.value.should.equal(0xFE);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.true;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.true;
        });
    });
});