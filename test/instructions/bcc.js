import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("BCC", () => {
    it("branches ahead when the carry is clear", () => {
        const cpu = new MCS6502({ C: true });

        cpu.poke(0x200,
            0x90, 0x05,  // BCC $05 ; * = $0202 + $05 ($207)
            0x90, 0x05); // BCC $05 ; * = $0204 + $05 ($209)

        cpu.step();
        // The processor should have moved ahead without branching
        cpu.PC.should.equal(0x202);

        cpu.C = false;
        cpu.step();
        // Carry was clear, should have branched
        cpu.PC.should.equal(0x209);
    });

    it("branches back when the carry is clear", () => {
        const cpu = new MCS6502({ C: true });

        cpu.poke(0x200,
            0x90, 0xFB,  // BCC $FB ; * = $0202 - $05 ($1FD)
            0x90, 0xFB); // BCC $05 ; * = $0204 - $05 ($1FF)

        cpu.step();
        // The processor should have moved ahead without branching
        cpu.PC.should.equal(0x202);

        cpu.C = false;
        cpu.step();
        // Carry was clear, should have branched
        cpu.PC.should.equal(0x1FF);
    });
});
