import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("INX", () => {
    it("increments the X register and properly sets flags", () => {
        const cpu = new MCS6502({ X: 0x7F });

        cpu.poke(0x200, 0xE8, 0xE8, 0xE8); // INX

        cpu.step();
        cpu.X.should.equal(0x80);
        cpu.Z.should.be.false;
        cpu.N.should.be.true;

        cpu.X = 0xFF;
        cpu.step();
        cpu.X.should.equal(0x00);
        cpu.Z.should.be.true;
        cpu.N.should.be.false;

        cpu.step();
        cpu.X.should.equal(0x01);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
    });
});
