import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

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
