import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
const should = chai.should();

import MCS6502, { AddressMode, AddressModes, Address, Byte } from '../libs/6502';

describe('AddressMode', () => {
    describe('constructor', () => {
        it('properly sets properties', () => {
            const parameters = {
                name: "the name",
                description: "the description",
                bytes: 42
            };
            const addressMode = new AddressMode(parameters);

            addressMode.should.include(parameters);
        });
    });

    describe('evaluate', () => {
        it('evaluates addresses from memory', () => {
            const proc = new MCS6502();
            proc.poke(1000, 42);

            const mode = new AddressMode({
                evaluate: (processor, operand) => new Address(operand)
            });

            mode.evaluate(proc, 1000).should.equal(42);
        });

        it('evaluates bytes directly', () => {
            const proc = new MCS6502();

            const mode = new AddressMode({
                evaluate: (processor, operand) => operand + 2
            });

            mode.evaluate(proc, 40).should.equal(42);
        });
    });

    describe('evaluateAddress', () => {
        it('throws if evaluation didn\'t return an address', () => {
            const proc = new MCS6502();

            const mode = new AddressMode({
                evaluate: (processor, operand) => 0
            });

            expect(() => {mode.evaluateAddress(proc, 42);})
                .to.throw(TypeError, null, `EvaluateAddress should throw when used with a non-address evaluation.`);
        });

        it('returns the evaluation when it\'s an address', () => {
            const proc = new MCS6502();

            const mode = new AddressMode({
                evaluate: (processor, operand) => new Address(operand)
            });

            mode.evaluateAddress(proc, 1000).should.equal(1000);
        });
    });
});

describe('AddressModes', () => {
    describe('Accumulator', () => {
        it('evaluates the value of the accumulator', () => {
            const proc = new MCS6502({ A: 42 });
            AddressModes.A.evaluate(proc).should.equal(42);
        });

        it('disassembles as A', () => {
            AddressModes.A.disassemble().should.equal('A');
        });
    });

    describe('Absolute', () => {
        it('evaluates as the byte at an absolute address', () => {
            const proc = new MCS6502();
            proc.poke(1000, 42);
            const val = AddressModes.abs.evaluate(proc, 1000);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('disassembles as $####', () => {
            AddressModes.abs.disassemble(1000).should.equal('$03E8');
        });
    });

    describe('Absolute, X-indexed', () => {
        it('evaluates as the byte at an absolute address, indexed with X', () => {
            const proc = new MCS6502({ X: 30 });
            proc.poke(1000, 42);
            const val = AddressModes.absX.evaluate(proc, 970);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('disassembles as $####,X\'', () => {
            AddressModes.absX.disassemble(1000).should.equal('$03E8,X');
        });
    });

    describe('Absolute, Y-indexed', () => {
        it('evaluates as the byte at an absolute address, indexed with Y', () => {
            const proc = new MCS6502({ Y: 30 });
            proc.poke(1000, 42);
            const val = AddressModes.absY.evaluate(proc, 970);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('disassembles as $####,Y', () => {
            AddressModes.absY.disassemble(1000).should.equal('$03E8,Y');
        });
    });

    describe('Immediate', () => {
        it('evaluates as the byte passed in', () => {
            const val = AddressModes.immediate.evaluate(null, 42);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('disassembles as #$##', () => {
            AddressModes.immediate.disassemble(42).should.equal('#$2A');
        });
    });

    describe('Implied', () => {
        it('evaluates as null', () => {
            const val = AddressModes.implied.evaluate();

            expect(val).to.be.null;
        });

        it('disassembles as an empty string', () => {
            AddressModes.implied.disassemble().should.equal('');
        });
    });

    describe('Indirect', () => {
        it('evaluates an address as the LSB-MSB address in memory at the address specified', () => {
            const proc = new MCS6502();
            proc.poke(1000, 0xD0);
            proc.poke(1001, 0x07);

            const val = AddressModes.indirect.evaluateAddress(proc, 1000);

            (val instanceof Address).should.be.true;
            val.should.equal(0x07D0);
        });

        it('disassembles as #$##', () => {
            AddressModes.indirect.disassemble(0x07D0).should.equal('($07D0)');
        });
    });

    describe('X-indexed, indirect', () => {
        it('evaluates as the byte at the LSB-MSB address pointed to by the 0-page address specified, indexed by X', () => {
            const proc = new MCS6502({X: 5});
            proc.poke(0x43, 0x15);
            proc.poke(0x44, 0x24);
            proc.poke(0x2415, 42);

            const val = AddressModes.Xind.evaluate(proc, 0x3E);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('wraps around the 0 page', () => {
            const proc = new MCS6502({X: 5});
            proc.poke(0xFF, 0x15);
            proc.poke(0x00, 0x24);
            proc.poke(0x2415, 42);

            let val = AddressModes.Xind.evaluate(proc, 0xFA);

            (val instanceof Address).should.be.false;
            val.should.equal(42);

            proc.poke(0x01, 0xFE);
            proc.poke(0x02, 0xCE);
            proc.poke(0xCEFE, 10);

            val = AddressModes.Xind.evaluate(proc, 0xFC);

            (val instanceof Address).should.be.false;
            val.should.equal(10);
        });

        it('disassembles as ($##,X)', () => {
            AddressModes.Xind.disassemble(0xD0).should.equal('($D0,X)');
        });
    });

    describe('Indirect, Y-indexed', () => {
        it('evaluates as the byte at the Y-indexed LSB-MSB address pointed to by the 0-page address specified', () => {
            const proc = new MCS6502({Y: 5});
            proc.poke(0x43, 0x15);
            proc.poke(0x44, 0x24);
            proc.poke(0x241A, 42);

            const val = AddressModes.indY.evaluate(proc, 0x43);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('wraps around the 0 page', () => {
            const proc = new MCS6502({Y: 5});
            proc.poke(0xFF, 0x15);
            proc.poke(0x00, 0x24);
            proc.poke(0x241A, 42);

            const val = AddressModes.indY.evaluate(proc, 0xFF);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('disassembles as ($##),Y', () => {
            AddressModes.indY.disassemble(0xD0).should.equal('($D0),Y');
        });
    });

    describe('Relative', () => {
        it('evaluates as the PC plus the argument for a negative offset', () => {
            const proc = new MCS6502({PC: 0x202});

            const val = AddressModes.rel.evaluateAddress(proc, -0x50);

            (val instanceof Address).should.be.true;
            val.should.equal(0x1B2);
        });

        it('evaluates as the PC plus the argument for a positive offset', () => {
            const proc = new MCS6502({PC: 0x2E2});

            const val = AddressModes.rel.evaluateAddress(proc, 0x50);

            (val instanceof Address).should.be.true;
            val.should.equal(0x332);
        });

        it('disassembles as $##', () => {
            AddressModes.rel.disassemble(0x50).should.equal('$50');
            AddressModes.rel.disassemble(-0x50).should.equal('$B0');
        });
    });

    describe('Zero page', () => {
        it('evaluates as the byte in page zerobeing pointed to', () => {
            const proc = new MCS6502();
            proc.poke(10, 42);
            const val = AddressModes.zpg.evaluate(proc, 10);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('disassembles as $##', () => {
            AddressModes.zpg.disassemble(0xE8).should.equal('$E8');
        });
    });

    describe('Zero page, X-indexed', () => {
        it('evaluates as the byte at an absolute zero page address, indexed with X', () => {
            const proc = new MCS6502({ X: 30 });
            proc.poke(40, 42);
            const val = AddressModes.zpgX.evaluate(proc, 10);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('wraps around the 0 page', () => {
            const proc = new MCS6502({Y: 5});
            proc.poke(0x04, 42);

            const val = AddressModes.zpgY.evaluate(proc, 0xFF);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('disassembles as $##,X\'', () => {
            AddressModes.zpgX.disassemble(0xE8).should.equal('$E8,X');
        });
    });

    describe('Zero page, Y-indexed', () => {
        it('evaluates as the byte at an absolute zero page address, indexed with Y', () => {
            const proc = new MCS6502({ Y: 30 });
            proc.poke(40, 42);
            const val = AddressModes.zpgY.evaluate(proc, 10);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('wraps around the 0 page', () => {
            const proc = new MCS6502({X: 5});
            proc.poke(0x04, 42);

            const val = AddressModes.zpgX.evaluate(proc, 0xFF);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('disassembles as $##,Y', () => {
            AddressModes.zpgY.disassemble(0xE8).should.equal('$E8,Y');
        });
    });
});