import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

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
