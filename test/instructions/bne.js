import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("BNE", () => {
    it("branches ahead when not equal to zero", () => {
        const cpu = new MCS6502({ Z: true });

        cpu.poke(0x200,
            0xD0, 0x05,  // BNE $05 ; * = $0202 + $05 ($207)
            0xD0, 0x05); // BNE $05 ; * = $0204 + $05 ($209)

        cpu.step();
        // The processor should have moved ahead without branching
        cpu.PC.should.equal(0x202);

        cpu.Z = false;
        cpu.step();
        // Carry was clear, should have branched
        cpu.PC.should.equal(0x209);
    });

    it("branches back when not equal to zero", () => {
        const cpu = new MCS6502({ Z: true });

        cpu.poke(0x200,
            0xD0, 0xFB,  // BNE $FB ; * = $0202 - $05 ($1FD)
            0xD0, 0xFB); // BNE $05 ; * = $0204 - $05 ($1FF)

        cpu.step();
        // The processor should have moved ahead without branching
        cpu.PC.should.equal(0x202);

        cpu.Z = false;
        cpu.step();
        // Carry was clear, should have branched
        cpu.PC.should.equal(0x1FF);
    });
});
