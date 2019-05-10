import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("PHA", () => {
    it("pushes the A register onto the stack", () => {
        const cpu = new MCS6502({ A: 0x3A });

        cpu.poke(0x200, 0x48); // PHA

        cpu.step();
        cpu.SP.should.equal(0xFE);
        cpu.stackPeek().should.equal(0x3A);
    });
});
