import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("PLP", () => {
    it("pulls the status register from the stack and sets flags", () => {
        const cpu = new MCS6502();
        cpu.push(0x2F);

        cpu.poke(0x200, 0x28); // PLP

        cpu.step();
        cpu.SR.should.equal(0x2F);
    });
});
