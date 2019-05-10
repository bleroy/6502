import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("BCS", () => {
    it("branches ahead when the carry is set", () => {
        const cpu = new MCS6502();

        cpu.poke(0x200,
            0xB0, 0x05,  // BCS $05 ; * = $0202 + $05 ($207)
            0xB0, 0x05); // BCS $05 ; * = $0204 + $05 ($209)

        cpu.step();
        // The processor should have moved ahead without branching
        cpu.PC.should.equal(0x202);

        cpu.C = true;
        cpu.step();
        // Carry was clear, should have branched
        cpu.PC.should.equal(0x209);
    });

    it("branches back when the carry is set", () => {
        const cpu = new MCS6502();

        cpu.poke(0x200,
            0xB0, 0xFB,  // BCS $FB ; * = $0202 - $05 ($1FD)
            0xB0, 0xFB); // BCS $05 ; * = $0204 - $05 ($1FF)

        cpu.step();
        // The processor should have moved ahead without branching
        cpu.PC.should.equal(0x202);

        cpu.C = true;
        cpu.step();
        // Carry was clear, should have branched
        cpu.PC.should.equal(0x1FF);
    });
});
