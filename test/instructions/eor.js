import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

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
