import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("PLA", () => {
    it("pulls the A register from the stack and sets flags", () => {
        const cpu = new MCS6502();
        cpu.push(0xFF);
        cpu.push(0x00);
        cpu.push(0x32);

        cpu.poke(0x200, 0x68, 0x68, 0x68); // PLA

        cpu.step();
        cpu.A.should.equal(0x32);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;

        cpu.step();
        cpu.A.should.equal(0x00);
        cpu.Z.should.be.true;
        cpu.N.should.be.false;

        cpu.step();
        cpu.A.should.equal(0xFF);
        cpu.Z.should.be.false;
        cpu.N.should.be.true;
    });
});
