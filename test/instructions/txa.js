import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("TXA", () => {
    it("transfers the X register to the A register and sets flags", () => {
        const cpu = new MCS6502({ X: 0x32, A: 0x00 });

        cpu.poke(0x200,
            0x8A, 0x8A, 0x8A); // TXA

        cpu.step();
        cpu.X.should.equal(0x32);
        cpu.A.should.equal(0x32);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;

        cpu.X = 0x00;
        cpu.step();
        cpu.A.should.equal(0x00);
        cpu.Z.should.be.true;
        cpu.N.should.be.false;

        cpu.X = 0xFF;
        cpu.step();
        cpu.A.should.equal(0xFF);
        cpu.Z.should.be.false;
        cpu.N.should.be.true;
    });
});
