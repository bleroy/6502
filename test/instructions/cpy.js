import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

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
