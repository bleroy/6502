import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("DEY", () => {
    it("decrements the Y register and properly sets flags", () => {
        const cpu = new MCS6502({ Y: 0x02 });

        cpu.poke(0x200, 0x88, 0x88, 0x88); // DEY

        cpu.step();
        cpu.Y.should.equal(0x01);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;

        cpu.step();
        cpu.Y.should.equal(0x00);
        cpu.Z.should.be.true;
        cpu.N.should.be.false;

        cpu.step();
        cpu.Y.should.equal(0xFF);
        cpu.Z.should.be.false;
        cpu.N.should.be.true;
    });
});
