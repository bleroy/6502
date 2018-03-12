import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

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
