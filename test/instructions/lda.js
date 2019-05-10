import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

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
