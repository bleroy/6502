import 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502 from '../libs/6502';

describe('stack', () => {
    it('can push and pull', () => {
        const cpu = new MCS6502();

        cpu.push(0x13);
        cpu.pull().should.equal(0x13);

        cpu.push(0x12);
        cpu.pull().should.equal(0x12);

        for (let i = 0; i <= 0xFF; i++) {
            cpu.push(i);
        }

        for (let i = 0xFF; i >= 0; i--) {
            cpu.pull().should.equal(i);
        }
    });

    it('pushes to page 1', () => {
        const cpu = new MCS6502();

        cpu.SP.should.equal(0xFF);
        cpu.peek(0x1FF).should.equal(0x00);

        cpu.push(0x06);
        cpu.SP.should.equal(0xFE);
        cpu.peek(0x1FF).should.equal(0x06);

        cpu.push(0x05);
        cpu.SP.should.equal(0xFD);
        cpu.peek(0x1FF).should.equal(0x06);
        cpu.peek(0x1FE).should.equal(0x05);

        cpu.push(0x04);
        cpu.SP.should.equal(0xFC);
        cpu.peek(0x1FF).should.equal(0x06);
        cpu.peek(0x1FE).should.equal(0x05);
        cpu.peek(0x1FD).should.equal(0x04);

        cpu.push(0x03);
        cpu.SP.should.equal(0xFB);
        cpu.peek(0x1FF).should.equal(0x06);
        cpu.peek(0x1FE).should.equal(0x05);
        cpu.peek(0x1FD).should.equal(0x04);
        cpu.peek(0x1FC).should.equal(0x03);

        cpu.push(0x02);
        cpu.SP.should.equal(0xFA);
        cpu.peek(0x1FF).should.equal(0x06);
        cpu.peek(0x1FE).should.equal(0x05);
        cpu.peek(0x1FD).should.equal(0x04);
        cpu.peek(0x1FC).should.equal(0x03);
        cpu.peek(0x1FB).should.equal(0x02);

        cpu.push(0x01);
        cpu.SP.should.equal(0xF9);
        cpu.peek(0x1FF).should.equal(0x06);
        cpu.peek(0x1FE).should.equal(0x05);
        cpu.peek(0x1FD).should.equal(0x04);
        cpu.peek(0x1FC).should.equal(0x03);
        cpu.peek(0x1FB).should.equal(0x02);
        cpu.peek(0x1FA).should.equal(0x01);
    });

    it('wraps pushes around the stack top', () => {
        const cpu = new MCS6502({SP: 0x01});

        cpu.push(0x01);
        cpu.peek(0x101).should.equal(0x01);
        cpu.SP.should.equal(0x00);

        cpu.push(0x02);
        cpu.peek(0x100).should.equal(0x02);
        cpu.SP.should.equal(0xFF);

        cpu.push(0x03);
        cpu.peek(0x1FF).should.equal(0x03);
        cpu.SP.should.equal(0xFE);
    });

    it('pulls from stack memory', () => {
        const cpu = new MCS6502({SP: 0xF9});
        cpu.poke(0x1FF, 0x06);
        cpu.poke(0x1FE, 0x05);
        cpu.poke(0x1FD, 0x04);
        cpu.poke(0x1FC, 0x03);
        cpu.poke(0x1FB, 0x02);
        cpu.poke(0x1FA, 0x01);

        cpu.pull().should.equal(0x01);
        cpu.SP.should.equal(0xFA);

        cpu.pull().should.equal(0x02);
        cpu.SP.should.equal(0xFB);

        cpu.pull().should.equal(0x03);
        cpu.SP.should.equal(0xFC);

        cpu.pull().should.equal(0x04);
        cpu.SP.should.equal(0xFD);

        cpu.pull().should.equal(0x05);
        cpu.SP.should.equal(0xFE);

        cpu.pull().should.equal(0x06);
        cpu.SP.should.equal(0xFF);
    });

    it('wraps pulls around the bottom of the stack', () => {
        const cpu = new MCS6502({SP: 0xFE});
        cpu.poke(0x1FF, 0x01);
        cpu.poke(0x100, 0x02);
        cpu.poke(0x101, 0x03);
        cpu.poke(0x102, 0x04);

        cpu.pull().should.equal(0x01);
        cpu.SP.should.equal(0xFF);

        cpu.pull().should.equal(0x02);
        cpu.SP.should.equal(0x00);

        cpu.pull().should.equal(0x03);
        cpu.SP.should.equal(0x01);

        cpu.pull().should.equal(0x04);
        cpu.SP.should.equal(0x02);
    });

    it('can peek into the stack', () => {
        const cpu = new MCS6502({SP: 0x01});

        cpu.push(0x01);
        cpu.stackPeek().should.equal(0x01);
        cpu.SP.should.equal(0x00);

        cpu.push(0x02);
        cpu.stackPeek().should.equal(0x02);
        cpu.SP.should.equal(0xFF);

        cpu.push(0x03);
        cpu.stackPeek().should.equal(0x03);
        cpu.SP.should.equal(0xFE);

        cpu.push(0x04);
        cpu.stackPeek().should.equal(0x04);
        cpu.SP.should.equal(0xFD);        
        cpu.stackPeek().should.equal(0x04);
        cpu.SP.should.equal(0xFD);        
        cpu.stackPeek().should.equal(0x04);
        cpu.SP.should.equal(0xFD);        
    });
});
