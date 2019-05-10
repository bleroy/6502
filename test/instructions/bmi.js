import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("BMI", () => {
    it("branches ahead when negative", () => {
        const cpu = new MCS6502();

        cpu.poke(0x200,
            0x30, 0x05,  // BMI $05 ; * = $0202 + $05 ($207)
            0x30, 0x05); // BEQ $05 ; * = $0204 + $05 ($209)

        cpu.step();
        // The processor should have moved ahead without branching
        cpu.PC.should.equal(0x202);

        cpu.N = true;
        cpu.step();
        // Carry was clear, should have branched
        cpu.PC.should.equal(0x209);
    });

    it("branches back when negative", () => {
        const cpu = new MCS6502();

        cpu.poke(0x200,
            0x30, 0xFB,  // BMI $FB ; * = $0202 - $05 ($1FD)
            0x30, 0xFB); // BMI $05 ; * = $0204 - $05 ($1FF)

        cpu.step();
        // The processor should have moved ahead without branching
        cpu.PC.should.equal(0x202);

        cpu.N = true;
        cpu.step();
        // Carry was clear, should have branched
        cpu.PC.should.equal(0x1FF);
    });
});
