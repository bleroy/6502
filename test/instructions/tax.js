import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("TAX", () => {
    it("transfers the accumulator to the X register and sets flags", () => {
        const cpu = new MCS6502({ A: 0x32, X: 0x00 });

        cpu.poke(0x200,
            0xAA, 0xAA, 0xAA); // TAX

        cpu.step();
        cpu.A.should.equal(0x32);
        cpu.X.should.equal(0x32);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;

        cpu.A = 0x00;
        cpu.step();
        cpu.X.should.equal(0x00);
        cpu.Z.should.be.true;
        cpu.N.should.be.false;

        cpu.A = 0xFF;
        cpu.step();
        cpu.X.should.equal(0xFF);
        cpu.Z.should.be.false;
        cpu.N.should.be.true;
    });
});
