import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../../libs/6502';

describe("JSR", () => {
    it("pushes the program counter onto the stack before jumping to the address provided", () => {
        const cpu = new MCS6502();

        cpu.poke(0x200, 0x20, 0x00, 0x34); // JSR $3400

        cpu.step();
        cpu.PC.should.equal(0x3400);
        cpu.peek(0x1FF).should.equal(0x02);
        cpu.peek(0x1FE).should.equal(0x00);
    });
});
