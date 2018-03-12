import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("TYA", () => {
    it("transfers the Y register to the A register and sets flags", () => {
        const cpu = new MCS6502({ Y: 0x32, A: 0x00 });

        cpu.poke(0x200,
            0x98, 0x98, 0x98); // TYA

        cpu.step();
        cpu.Y.should.equal(0x32);
        cpu.A.should.equal(0x32);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;

        cpu.Y = 0x00;
        cpu.step();
        cpu.A.should.equal(0x00);
        cpu.Z.should.be.true;
        cpu.N.should.be.false;

        cpu.Y = 0xFF;
        cpu.step();
        cpu.A.should.equal(0xFF);
        cpu.Z.should.be.false;
        cpu.N.should.be.true;
    });
});
