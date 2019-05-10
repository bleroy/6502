import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("ASL", () => {
    it("shifts and sets flags", () => {
        const cpu = new MCS6502();

        cpu.poke(0x7F00, 0x00, 0x01);
        cpu.poke(0x3502, 0x02, 0x44);
        cpu.poke(0x1204, 0x80);

        cpu.poke(0x200,
            0x0E, 0x00, 0x7F, // ASL $7F00
            0x0E, 0x01, 0x7F, // ASL $7F01
            0x0E, 0x02, 0x35, // ASL $3502
            0x0E, 0x03, 0x35, // ASL $3503
            0x0E, 0x04, 0x12  // ASL $1204
        );

        cpu.step(); // ASL $7F00
        cpu.peek(0x7F00).should.equal(0x00);
        cpu.Z.should.be.true;
        cpu.N.should.be.false;
        cpu.C.should.be.false;

        cpu.step(); // ASL $7F01
        cpu.peek(0x7F01).should.equal(0x02);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
        cpu.C.should.be.false;

        cpu.step(); // ASL $3502
        cpu.peek(0x3502).should.equal(0x04);
        cpu.Z.should.be.false;
        cpu.N.should.be.false;
        cpu.C.should.be.false;

        cpu.step(); // ASL $3503
        cpu.peek(0x3503).should.equal(0x88);
        cpu.Z.should.be.false;
        cpu.N.should.be.true;
        cpu.C.should.be.false;

        cpu.step(); // ASL $1204
        cpu.peek(0x1204).should.equal(0x00);
        cpu.Z.should.be.true;
        cpu.N.should.be.false;
        cpu.C.should.be.true;
    });
});