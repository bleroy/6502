import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("LSR", () => {
    it("shifts and sets flags", () => {
        const cpu = new MCS6502();

        cpu.poke(0x200, 0x4A, 0x4A, 0x4A, 0x4A, 0x4A, 0x4A); // LSR A

        cpu.step();
        cpu.A.should.equal(0x00);
        cpu.Z.should.be.true;
        cpu.N.should.be.false;
        cpu.C.should.be.false;

        cpu.A = 0x01;
        cpu.step();
        cpu.A.should.equal(0x00);
        cpu.Z.should.be.true;
        cpu.N.should.be.false;
        cpu.C.should.be.true;

        cpu.A = 0x02;
        cpu.step();
        cpu.A.should.equal(0x01);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
        cpu.C.should.be.false;

        cpu.A = 0x44;
        cpu.step();
        cpu.A.should.equal(0x22);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
        cpu.C.should.be.false;

        cpu.A = 0x80;
        cpu.step();
        cpu.A.should.equal(0x40);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
        cpu.C.should.be.false;

        cpu.A = 0x02;
        cpu.C = true;
        cpu.step();
        cpu.A.should.equal(0x01);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
        cpu.C.should.be.false;
    });
});