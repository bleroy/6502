import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

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
