import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("SEC", () => {
    it("sets the carry flag", () => {
        const cpu = new MCS6502({ C: false });

        cpu.poke(0x200, 0x38); // SEC
        cpu.step();

        cpu.C.should.be.true;
    });
});
