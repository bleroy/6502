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

    describe('execute', () => {
        it('calls into the instruction\'s implementation', () => {
            let implementationCalled = false;
            let processorName = null;
            let operandValue = null;

            const instruction = new Instruction({
                implementation: (proc, operand) => {
                    implementationCalled = true;
                    processorName = proc.name;
                    operandValue = operand;
                    return 2;
                }
            });

            const cycles = instruction.execute(new MCS6502(), 42);

            implementationCalled.should.be.true;
            processorName.should.equal('6502');
            operandValue.should.equal(42);
            cycles.should.equal(2);
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

describe("instructions", () => {
    describe("LDA", () => {
        it("loads the accumulator", () => {
            const cpu = new MCS6502();

            cpu.poke(0x200,
                0xA9, 0x12, // LDA #$12
                0xA9, 0x00, // LDA #$00
                0xA9, 0x80, // LDA #$80
                0xA9, 0x7F  // LDA #$7F
            );

            cpu.step();
            cpu.A.should.equal(0x012);
            cpu.Z.should.be.false;
            cpu.N.should.be.false;

            cpu.step();
            cpu.A.should.equal(0x00);
            cpu.Z.should.be.true;
            cpu.N.should.be.false;

            cpu.step();
            cpu.A.should.equal(0x80);
            cpu.Z.should.be.false;
            cpu.N.should.be.true;

            cpu.step();
            cpu.A.should.equal(0x7F);
            cpu.Z.should.be.false;
            cpu.N.should.be.false;
        });
    });

    describe("LDX", () => {
        it("loads the X register", () => {
            const cpu = new MCS6502();

            cpu.poke(0x200,
                0xA2, 0x12, // LDX #$12
                0xA2, 0x00, // LDX #$00
                0xA2, 0x80, // LDX #$80
                0xA2, 0x7F  // LDX #$7F
            );

            cpu.step();
            cpu.X.should.equal(0x012);
            cpu.Z.should.be.false;
            cpu.N.should.be.false;

            cpu.step();
            cpu.X.should.equal(0x00);
            cpu.Z.should.be.true;
            cpu.N.should.be.false;

            cpu.step();
            cpu.X.should.equal(0x80);
            cpu.Z.should.be.false;
            cpu.N.should.be.true;

            cpu.step();
            cpu.X.should.equal(0x7F);
            cpu.Z.should.be.false;
            cpu.N.should.be.false;
        });
    });

    describe("LDY", () => {
        it("loads the Y register", () => {
            const cpu = new MCS6502();

            cpu.poke(0x200,
                0xA0, 0x12, // LDY #$12
                0xA0, 0x00, // LDY #$00
                0xA0, 0x80, // LDY #$80
                0xA0, 0x7F  // LDY #$7F
            );

            cpu.step();
            cpu.Y.should.equal(0x012);
            cpu.Z.should.be.false;
            cpu.N.should.be.false;

            cpu.step();
            cpu.Y.should.equal(0x00);
            cpu.Z.should.be.true;
            cpu.N.should.be.false;

            cpu.step();
            cpu.Y.should.equal(0x80);
            cpu.Z.should.be.false;
            cpu.N.should.be.true;

            cpu.step();
            cpu.Y.should.equal(0x7F);
            cpu.Z.should.be.false;
            cpu.N.should.be.false;
        });
    });

    describe("ADC", () => {
        it("agrees 0 + 1 = 1", () => {
            const cpu = new MCS6502();

            cpu.poke(0x200, 0x69, 0x01); // ADC #$01
            cpu.step();
            cpu.A.should.equal(1);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.false;
        });

        it("finds 127 + 1 = -128 with overflow", () => {
            const cpu = new MCS6502({ A: 0x7F });

            cpu.poke(0x200, 0x69, 0x01); // ADC #$01
            cpu.step();
            cpu.A.should.equal(0x80);
            cpu.N.should.be.true;
            cpu.V.should.be.true;
            cpu.Z.should.be.false;
            cpu.C.should.be.false;
        });

        it("agrees -128 + 1 = -127", () => {
            const cpu = new MCS6502({ A: 0x80 });

            cpu.poke(0x200, 0x69, 0x01); // ADC #$01
            cpu.step();
            cpu.A.should.equal(0x81);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.true;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.false;
        });

        it("agrees -1 + 1 = 0", () => {
            const cpu = new MCS6502({ A: 0xFF });

            cpu.poke(0x200, 0x69, 0x01); // ADC #$01
            cpu.step();
            cpu.A.should.equal(0x00);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.true;
            cpu.C.should.be.true;
        });

        it("agrees 0 - 1 = -1", () => {
            const cpu = new MCS6502();

            cpu.poke(0x200, 0x69, 0xFF); // ADC #$FF
            cpu.step();
            cpu.A.should.equal(0xFF);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.true;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.false;
        });

        it("agrees 127 - 1 = 126", () => {
            const cpu = new MCS6502({ A: 0x7F });

            cpu.poke(0x200, 0x69, 0xFF); // ADC #$FF
            cpu.step();
            cpu.A.should.equal(0x7E);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.true;
        });

        it("finds -128 - 1 = 127 with overflow", () => {
            const cpu = new MCS6502({ A: 0x80 });

            cpu.poke(0x200, 0x69, 0xFF); // ADC #$FF
            cpu.step();
            cpu.A.should.equal(0x7F);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.true;
            cpu.Z.should.be.false;
            cpu.C.should.be.true;
        });

        it("agrees -1 - 1 = -2", () => {
            const cpu = new MCS6502({ A: 0xFF });

            cpu.poke(0x200, 0x69, 0xFF); // ADC #$FF
            cpu.step();
            cpu.A.should.equal(0xFE);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.true;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.true;
        });

        it("includes the carry", () => {
            const cpu = new MCS6502({ C: true });

            cpu.poke(0x200, 0x69, 0x01); // ADC #$01
            cpu.step();
            cpu.A.should.equal(0x02);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.false;
        });

        it("finds 1 + 1 = 2 also in decimal", () => {
            const cpu = new MCS6502({ A: 0x01, D: true });

            cpu.poke(0x200, 0x69, 0x01); // ADC #$01
            cpu.step();
            cpu.A.should.equal(0x02);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.false;
        });

        it("finds 49 + 1 = 50 in decimal", () => {
            const cpu = new MCS6502({ A: 0x49, D: true });

            cpu.poke(0x200, 0x69, 0x01); // ADC #$01
            cpu.step();
            cpu.A.should.equal(0x50);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.false;
        });

        it("finds 50 + 1 = 51 in decimal", () => {
            const cpu = new MCS6502({ A: 0x50, D: true });

            cpu.poke(0x200, 0x69, 0x01); // ADC #$01
            cpu.step();
            cpu.A.should.equal(0x51);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.false;
        });

        it("finds 99 + 1 = 0 with a carry in decimal", () => {
            const cpu = new MCS6502({ A: 0x99, D: true });

            cpu.poke(0x200, 0x69, 0x01); // ADC #$01
            cpu.step();
            cpu.A.should.equal(0x00);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.true;
            cpu.C.should.be.true;
        });

        it("finds 0 + 99 = 99 in decimal", () => {
            const cpu = new MCS6502({ D: true });

            cpu.poke(0x200, 0x69, 0x99); // ADC #$99
            cpu.step();
            cpu.A.should.equal(0x99);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.false;
        });

        it("finds 49 + 99 = 48 with carry in decimal", () => {
            const cpu = new MCS6502({ A: 0x49, D: true });

            cpu.poke(0x200, 0x69, 0x99); // ADC #$99
            cpu.step();
            cpu.A.should.equal(0x48);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.true;
        });

        it("finds 50 + 99 = 49 with carry in decimal", () => {
            const cpu = new MCS6502({ A: 0x50, D: true });

            cpu.poke(0x200, 0x69, 0x99); // ADC #$99
            cpu.step();
            cpu.A.should.equal(0x49);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.true;
        });
    });

    describe("SBC", () => {
        it("finds 0 - 1 = -2 when carry is unset", () => {
            const cpu = new MCS6502();

            cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
            cpu.step();
            cpu.A.should.equal(0xFE);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.true;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.false;
        });

        it("finds 127 - 1 = 126 when carry is unset", () => {
            const cpu = new MCS6502({ A: 0x7F });

            cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
            cpu.step();
            cpu.A.should.equal(0x7D);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.true;
        });

        it("finds -128 - 1 = 126 with overflow when carry is unset", () => {
            const cpu = new MCS6502({ A: 0x80 });

            cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
            cpu.step();
            cpu.A.should.equal(0x7E);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.true;
            cpu.Z.should.be.false;
            cpu.C.should.be.true;
        });

        it("finds -1 - 1 = -3 when carry is unset", () => {
            const cpu = new MCS6502({ A: 0xFF });

            cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
            cpu.step();
            cpu.A.should.equal(0xFD);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.true;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.true;
        });

        it("finds 2 - 1 = 0 when carry is unset", () => {
            const cpu = new MCS6502({ A: 0x02 });

            cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
            cpu.step();
            cpu.A.should.equal(0x00);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.true;
            cpu.C.should.be.true;
        });

        it("finds 5 - 1 = 3 when carry is unset", () => {
            const cpu = new MCS6502({ A: 0x05 });

            cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
            cpu.step();
            cpu.A.should.equal(0x03);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.true;
        });

        it("agrees 5 - 1 = 4 when carry is set", () => {
            const cpu = new MCS6502({ A: 0x05, C: true });

            cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
            cpu.step();
            cpu.A.should.equal(0x04);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.true;
        });

        it("agrees 0 - 1 = -1 when carry is set", () => {
            const cpu = new MCS6502({ A: 0x00, C: true });

            cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
            cpu.step();
            cpu.A.should.equal(0xFF);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.true;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.false;
        });

        it("thinks 0 - 1 = 98 when carry is unset in decimal mode", () => {
            const cpu = new MCS6502({ A: 0x00, D: true });

            cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
            cpu.step();
            cpu.A.should.equal(0x98);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.false;
        });

        it("thinks 99 - 1 = 97 when carry is unset in decimal mode", () => {
            const cpu = new MCS6502({ A: 0x99, D: true });

            cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
            cpu.step();
            cpu.A.should.equal(0x97);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.true;
        });

        it("thinks 50 - 1 = 48 when carry is unset in decimal mode", () => {
            const cpu = new MCS6502({ A: 0x50, D: true });

            cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
            cpu.step();
            cpu.A.should.equal(0x48);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.true;
        });

        it("thinks 2 - 1 = 0 when carry is unset in decimal mode", () => {
            const cpu = new MCS6502({ A: 0x02, D: true });

            cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
            cpu.step();
            cpu.A.should.equal(0x00);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.true;
            cpu.C.should.be.true;
        });

        it("thinks 10 - 11 = 98 when carry is unset in decimal mode", () => {
            const cpu = new MCS6502({ A: 0x10, D: true });

            cpu.poke(0x200, 0xE9, 0x11); // SBC #$11
            cpu.step();
            cpu.A.should.equal(0x98);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.false;
        });

        it("thinks 5 - 1 = 4 when carry is set in decimal mode", () => {
            const cpu = new MCS6502({ A: 0x05, D: true, C: true });

            cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
            cpu.step();
            cpu.A.should.equal(0x04);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.true;
        });

        it("thinks 0 - 1 = 99 when carry is set in decimal mode", () => {
            const cpu = new MCS6502({ A: 0x00, D: true, C: true });

            cpu.poke(0x200, 0xE9, 0x01); // SBC #$01
            cpu.step();
            cpu.A.should.equal(0x99);
            cpu.PC.should.equal(0x202);
            cpu.N.should.be.false;
            cpu.V.should.be.false;
            cpu.Z.should.be.false;
            cpu.C.should.be.false;
        });
    });

    describe("ORA", () => {
        it("does bitwise OR operations on the accumulator", () => {
            const cpu = new MCS6502();

            cpu.poke(0x200,
                0x09, 0x00, // ORA #$00
                0x09, 0x11, // ORA #$11
                0x09, 0x22, // ORA #$22
                0x09, 0x44, // ORA #$44
                0x09, 0x88  // ORA #$88
            );

            cpu.step();
            cpu.A.should.equal(0x00);
            cpu.Z.should.be.true;
            cpu.N.should.be.false;

            cpu.step();
            cpu.A.should.equal(0x11);
            cpu.Z.should.be.false;
            cpu.N.should.be.false;

            cpu.step();
            cpu.A.should.equal(0x33);
            cpu.Z.should.be.false;
            cpu.N.should.be.false;

            cpu.step();
            cpu.A.should.equal(0x77);
            cpu.Z.should.be.false;
            cpu.N.should.be.false;

            cpu.step();
            cpu.A.should.equal(0xFF);
            cpu.Z.should.be.false;
            cpu.N.should.be.true;
        });
    });

    describe("AND", () => {
        it("does bitwise AND operations on the accumulator", () => {
            const cpu = new MCS6502();

            cpu.poke(0x200,
                0x29, 0x00, // AND #$00
                0x29, 0x11, // AND #$11
                0x29, 0xAA, // AND #$AA
                0x29, 0xFF, // AND #$FF
                0x29, 0x99, // AND #$99
                0x29, 0x11  // AND #$11
            );

            cpu.step();
            cpu.A.should.equal(0x00);
            cpu.Z.should.be.true;
            cpu.N.should.be.false;

            cpu.step();
            cpu.A.should.equal(0x00);
            cpu.Z.should.be.true;
            cpu.N.should.be.false;

            cpu.A = 0xAA;

            cpu.step();
            cpu.A.should.equal(0xAA);
            cpu.Z.should.be.false;
            cpu.N.should.be.true;

            cpu.step();
            cpu.A.should.equal(0xAA);
            cpu.Z.should.be.false;
            cpu.N.should.be.true;

            cpu.step();
            cpu.A.should.equal(0x88);
            cpu.Z.should.be.false;
            cpu.N.should.be.true;

            cpu.step();
            cpu.A.should.equal(0x00);
            cpu.Z.should.be.true;
            cpu.N.should.be.false;
        });
    });

    describe("EOR", () => {
        it("does bitwise EOR operations on the accumulator", () => {
            const cpu = new MCS6502({ A: 0x88 });

            cpu.poke(0x200,
                0x49, 0x00, // EOR #$00
                0x49, 0xFF, // EOR #$FF
                0x49, 0x33  // EOR #$33
            );

            cpu.step();
            cpu.A.should.equal(0x88);
            cpu.Z.should.be.false;
            cpu.N.should.be.true;

            cpu.step();
            cpu.A.should.equal(0x77);
            cpu.Z.should.be.false;
            cpu.N.should.be.false;

            cpu.step();
            cpu.A.should.equal(0x44);
            cpu.Z.should.be.false;
            cpu.N.should.be.false;
        });
    });

    describe("CMP", () => {
        it("sets zero and carry flags if the bytes are the same", () => {
            const cpu = new MCS6502();

            cpu.poke(0x200,
                0xC9, 0x00, // CMP #$00
                0xC9, 0x01, // CMP #$01
                0xC9, 0x7F, // CMP #$7F
                0xC9, 0xFF  // CMP #$FF
            );

            cpu.step();
            cpu.C.should.be.true;
            cpu.Z.should.be.true;
            cpu.N.should.be.false;

            cpu.A = 0x01;
            cpu.step();
            cpu.C.should.be.true;
            cpu.Z.should.be.true;
            cpu.N.should.be.false;

            cpu.A = 0x7F;
            cpu.step();
            cpu.C.should.be.true;
            cpu.Z.should.be.true;
            cpu.N.should.be.false;

            cpu.A = 0xFF;
            cpu.step();
            cpu.C.should.be.true;
            cpu.Z.should.be.true;
            cpu.N.should.be.false;
        });

        it("sets the carry flag if A is greater than the operand", () => {
            const cpu = new MCS6502({ A: 0x0A });

            cpu.poke(0x200,
                0xC9, 0x08, // CMP #$08
                0xC9, 0x80  // CMP #$80
            );

            cpu.step();
            cpu.C.should.be.true;
            cpu.Z.should.be.false;
            cpu.N.should.be.false;

            cpu.A = 0xFA;
            cpu.step();
            cpu.C.should.be.true;
            cpu.Z.should.be.false;
            cpu.N.should.be.false;
        });

        it("doesn't set the carry flag if A is less than the operand", () => {
            const cpu = new MCS6502({ A: 0x08 });

            cpu.poke(0x200,
                0xC9, 0x0A, // CMP #$0A
                0xC9, 0x80  // CMP #$80
            );

            cpu.step();
            cpu.C.should.be.false;
            cpu.Z.should.be.false;
            cpu.N.should.be.true;

            cpu.A = 0x70;
            cpu.step();
            cpu.C.should.be.false;
            cpu.Z.should.be.false;
            cpu.N.should.be.true;
        });
    });

    describe("CPX", () => {
        it("sets zero and carry flags if the bytes are the same", () => {
            const cpu = new MCS6502();

            cpu.poke(0x200,
                0xE0, 0x00, // CPX #$00
                0xE0, 0x01, // CPX #$01
                0xE0, 0x7F, // CPX #$7F
                0xE0, 0xFF  // CPX #$FF
            );

            cpu.step();
            cpu.C.should.be.true;
            cpu.Z.should.be.true;
            cpu.N.should.be.false;

            cpu.X = 0x01;
            cpu.step();
            cpu.C.should.be.true;
            cpu.Z.should.be.true;
            cpu.N.should.be.false;

            cpu.X = 0x7F;
            cpu.step();
            cpu.C.should.be.true;
            cpu.Z.should.be.true;
            cpu.N.should.be.false;

            cpu.X = 0xFF;
            cpu.step();
            cpu.C.should.be.true;
            cpu.Z.should.be.true;
            cpu.N.should.be.false;
        });

        it("sets the carry flag if X is greater than the operand", () => {
            const cpu = new MCS6502({ X: 0x0A });

            cpu.poke(0x200,
                0xE0, 0x08, // CPX #$08
                0xE0, 0x80  // CPX #$80
            );

            cpu.step();
            cpu.C.should.be.true;
            cpu.Z.should.be.false;
            cpu.N.should.be.false;

            cpu.X = 0xFA;
            cpu.step();
            cpu.C.should.be.true;
            cpu.Z.should.be.false;
            cpu.N.should.be.false;
        });

        it("doesn't set the carry flag if X is less than the operand", () => {
            const cpu = new MCS6502({ X: 0x08 });

            cpu.poke(0x200,
                0xE0, 0x0A, // CPX #$0A
                0xE0, 0x80  // CPX #$80
            );

            cpu.step();
            cpu.C.should.be.false;
            cpu.Z.should.be.false;
            cpu.N.should.be.true;

            cpu.X = 0x70;
            cpu.step();
            cpu.C.should.be.false;
            cpu.Z.should.be.false;
            cpu.N.should.be.true;
        });
    });

    describe("CPY", () => {
        it("sets zero and carry flags if the bytes are the same", () => {
            const cpu = new MCS6502();

            cpu.poke(0x200,
                0xC0, 0x00, // CPY #$00
                0xC0, 0x01, // CPY #$01
                0xC0, 0x7F, // CPY #$7F
                0xC0, 0xFF  // CPY #$FF
            );

            cpu.step();
            cpu.C.should.be.true;
            cpu.Z.should.be.true;
            cpu.N.should.be.false;

            cpu.Y = 0x01;
            cpu.step();
            cpu.C.should.be.true;
            cpu.Z.should.be.true;
            cpu.N.should.be.false;

            cpu.Y = 0x7F;
            cpu.step();
            cpu.C.should.be.true;
            cpu.Z.should.be.true;
            cpu.N.should.be.false;

            cpu.Y = 0xFF;
            cpu.step();
            cpu.C.should.be.true;
            cpu.Z.should.be.true;
            cpu.N.should.be.false;
        });

        it("sets the carry flag if Y is greater than the operand", () => {
            const cpu = new MCS6502({ Y: 0x0A });

            cpu.poke(0x200,
                0xC0, 0x08, // CPY #$08
                0xC0, 0x80  // CPY #$80
            );

            cpu.step();
            cpu.C.should.be.true;
            cpu.Z.should.be.false;
            cpu.N.should.be.false;

            cpu.Y = 0xFA;
            cpu.step();
            cpu.C.should.be.true;
            cpu.Z.should.be.false;
            cpu.N.should.be.false;
        });

        it("doesn't set the carry flag if Y is less than the operand", () => {
            const cpu = new MCS6502({ Y: 0x08 });

            cpu.poke(0x200,
                0xC0, 0x0A, // CPY #$0A
                0xC0, 0x80  // CPY #$80
            );

            cpu.step();
            cpu.C.should.be.false;
            cpu.Z.should.be.false;
            cpu.N.should.be.true;

            cpu.Y = 0x70;
            cpu.step();
            cpu.C.should.be.false;
            cpu.Z.should.be.false;
            cpu.N.should.be.true;
        });
    });

    describe("CLC", () => {
        it("clears the carry flag", () => {
            const cpu = new MCS6502({ C: true });

            cpu.poke(0x200, 0x18); // CLC
            cpu.step();

            cpu.C.should.be.false;
        });
    });

    describe("SEC", () => {
        it("sets the carry flag", () => {
            const cpu = new MCS6502({ C: false });

            cpu.poke(0x200, 0x38); // SEC
            cpu.step();

            cpu.C.should.be.true;
        });
    });

    describe("CLD", () => {
        it("clears the decimal flag", () => {
            const cpu = new MCS6502({ D: true });

            cpu.poke(0x200, 0xD8); // CLD
            cpu.step();

            cpu.D.should.be.false;
        });
    });

    describe("SED", () => {
        it("sets the decimal flag", () => {
            const cpu = new MCS6502({ D: false });

            cpu.poke(0x200, 0xF8); // SED
            cpu.step();

            cpu.D.should.be.true;
        });
    });

    describe("CLI", () => {
        it("clears the interrupt disabled flag", () => {
            const cpu = new MCS6502({ I: true });

            cpu.poke(0x200, 0x58); // CLI
            cpu.step();

            cpu.I.should.be.false;
        });
    });

    describe("SEI", () => {
        it("sets the carry flag", () => {
            const cpu = new MCS6502({ I: false });

            cpu.poke(0x200, 0x78); // SEI
            cpu.step();

            cpu.I.should.be.true;
        });
    });

    describe("CLV", () => {
        it("clears the overflow flag", () => {
            const cpu = new MCS6502({ V: true });

            cpu.poke(0x200, 0xB8); // CLD
            cpu.step();

            cpu.V.should.be.false;
        });
    });
});