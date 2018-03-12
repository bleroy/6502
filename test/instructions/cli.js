import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("CLI", () => {
    it("clears the interrupt disabled flag", () => {
        const cpu = new MCS6502({ I: true });

        cpu.poke(0x200, 0x58); // CLI
        cpu.step();

        cpu.I.should.be.false;
    });
});
