import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
let should = chai.should();

import MCS6502, { } from '../libs/6502';

describe('Interruptions', () => {
    it('can trigger interruptions', () => {
        let cpu = new MCS6502();

        // Set the IRQ vector
        cpu.poke(0xFFFE, 0x34);
        cpu.poke(0xFFFF, 0x12);

        cpu.interrupt();

        cpu.I.should.be.true;
        cpu.B.should.be.true;
        cpu.SR.should.equal(0x34);
        cpu.PC.should.equal(0x1234);
        cpu.pull().should.equal(0x30);
        cpu.pull().should.equal(0x01);
        cpu.pull().should.equal(0x02);
    });
});
        

        // // Create an IRQ vector at $1234
        // cpu.poke(0x1234,
        //     0xA9, 0x33,  // LDA #$33
        //     0x69, 0x01); // ADC #$01

        // // Put some code at $0200
        // cpu.poke(0x0200,
        //     0x18,        // CLC
        //     0xA9, 0x01,  // LDA #$00
        //     0x69, 0x01); // ADC #$01
        
        // cpu.PC = 0x0200;
        // cpu.step();
        
        // cpu.PC.should.equal(0x201);
        // cpu.A.should.equal(0x00);
