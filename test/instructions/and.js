import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

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
