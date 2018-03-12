import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("SEI", () => {
    it("sets the carry flag", () => {
        const cpu = new MCS6502({ I: false });

        cpu.poke(0x200, 0x78); // SEI
        cpu.step();

        cpu.I.should.be.true;
    });
});
