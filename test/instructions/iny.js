import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("INY", () => {
    it("increments the Y register and properly sets flags", () => {
        const cpu = new MCS6502({ Y: 0x7F });

        cpu.poke(0x200, 0xC8, 0xC8, 0xC8); // INY

        cpu.step();
        cpu.Y.should.equal(0x80);
        cpu.Z.should.be.false;
        cpu.N.should.be.true;

        cpu.Y = 0xFF;
        cpu.step();
        cpu.Y.should.equal(0x00);
        cpu.Z.should.be.true;
        cpu.N.should.be.false;

        cpu.step();
        cpu.Y.should.equal(0x01);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
    });
});
