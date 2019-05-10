import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("TAY", () => {
    it("transfers the accumulator to the Y register and sets flags", () => {
        const cpu = new MCS6502({ A: 0x32, Y: 0x00 });

        cpu.poke(0x200,
            0xA8, 0xA8, 0xA8); // TAY

        cpu.step();
        cpu.A.should.equal(0x32);
        cpu.Y.should.equal(0x32);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;

        cpu.A = 0x00;
        cpu.step();
        cpu.Y.should.equal(0x00);
        cpu.Z.should.be.true;
        cpu.N.should.be.false;

        cpu.A = 0xFF;
        cpu.step();
        cpu.Y.should.equal(0xFF);
        cpu.Z.should.be.false;
        cpu.N.should.be.true;
    });
});
