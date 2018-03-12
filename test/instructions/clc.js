import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("CLC", () => {
    it("clears the carry flag", () => {
        const cpu = new MCS6502({ C: true });

        cpu.poke(0x200, 0x18); // CLC
        cpu.step();

        cpu.C.should.be.false;
    });
});
