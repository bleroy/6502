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
            const cpu = new MCS6502();
            cpu.poke(1000, 42);

            const mode = new AddressMode({
                evaluate: (cpu, operand) => new Address(operand)
            });

            mode.evaluate(cpu, 1000).should.equal(42);
        });

        it('evaluates bytes directly', () => {
            const cpu = new MCS6502();

            const mode = new AddressMode({
                evaluate: (cpu, operand) => operand + 2
            });

            mode.evaluate(cpu, 40).should.equal(42);
        });
    });

    describe('evaluateAddress', () => {
        it('throws if evaluation didn\'t return an address', () => {
            const cpu = new MCS6502();

            const mode = new AddressMode({
                evaluate: (cpu, operand) => 0
            });

            expect(() => {mode.evaluateAddress(cpu, 42);})
                .to.throw(TypeError, null, `EvaluateAddress should throw when used with a non-address evaluation.`);
        });

        it('returns the evaluation when it\'s an address', () => {
            const cpu = new MCS6502();

            const mode = new AddressMode({
                evaluate: (cpu, operand) => new Address(operand)
            });

            mode.evaluateAddress(cpu, 1000).should.equal(1000);
        });
    });
});

describe('AddressModes', () => {
    describe('Accumulator', () => {
        it('evaluates the value of the accumulator', () => {
            const cpu = new MCS6502({ A: 42 });
            AddressModes.A.evaluate(cpu).should.equal(42);
        });

        it('disassembles as A', () => {
            AddressModes.A.disassemble().should.equal('A');
        });

        it('writes back to A', () => {
            const cpu = new MCS6502();
            AddressModes.A.write(cpu, null, 42);

            cpu.A.should.equal(42);
        });
    });

    describe('Absolute', () => {
        it('evaluates as the byte at an absolute address', () => {
            const cpu = new MCS6502();
            cpu.poke(1000, 42);
            const val = AddressModes.abs.evaluate(cpu, 1000);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('disassembles as $####', () => {
            AddressModes.abs.disassemble(1000).should.equal('$03E8');
        });

        it('writes to memory', () => {
            const cpu = new MCS6502();
            AddressModes.abs.write(cpu, 1000, 42);

            cpu.peek(1000).should.equal(42);
        });
    });

    describe('Absolute, X-indexed', () => {
        it('evaluates as the byte at an absolute address, indexed with X', () => {
            const cpu = new MCS6502({ X: 30 });
            cpu.poke(1000, 42);
            const val = AddressModes.absX.evaluate(cpu, 970);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('disassembles as $####,X\'', () => {
            AddressModes.absX.disassemble(1000).should.equal('$03E8,X');
        });

        it('writes to memory', () => {
            const cpu = new MCS6502({ X: 30 });
            AddressModes.absX.write(cpu, 970, 42);

            cpu.peek(1000).should.equal(42);
        });
    });

    describe('Absolute, Y-indexed', () => {
        it('evaluates as the byte at an absolute address, indexed with Y', () => {
            const cpu = new MCS6502({ Y: 30 });
            cpu.poke(1000, 42);
            const val = AddressModes.absY.evaluate(cpu, 970);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('disassembles as $####,Y', () => {
            AddressModes.absY.disassemble(1000).should.equal('$03E8,Y');
        });

        it('writes to memory', () => {
            const cpu = new MCS6502({ Y: 30 });
            AddressModes.absY.write(cpu, 970, 42);

            cpu.peek(1000).should.equal(42);
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

        it("can't write", () => {
            expect(() => { AddressModes.immediate.write(null, null, null); }).to.throw("cannot write");
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

        it("can't write", () => {
            expect(() => { AddressModes.implied.write(null, null, null); }).to.throw("cannot write");
        });
    });

    describe('Indirect', () => {
        it('evaluates an address as the LSB-MSB address in memory at the address specified', () => {
            const cpu = new MCS6502();
            cpu.poke(1000, 0xD0);
            cpu.poke(1001, 0x07);

            const val = AddressModes.indirect.evaluateAddress(cpu, 1000);

            (val instanceof Address).should.be.true;
            val.should.equal(0x07D0);
        });

        it('disassembles as #$##', () => {
            AddressModes.indirect.disassemble(0x07D0).should.equal('($07D0)');
        });

        it('writes to memory', () => {
            const cpu = new MCS6502();
            cpu.poke(1000, 0xD0);
            cpu.poke(1001, 0x07);

            AddressModes.indirect.write(cpu, 1000, 42);

            cpu.peek(0x07D0).should.equal(42);
        });
    });

    describe('X-indexed, indirect', () => {
        it('evaluates as the byte at the LSB-MSB address pointed to by the 0-page address specified, indexed by X', () => {
            const cpu = new MCS6502({X: 5});
            cpu.poke(0x43, 0x15);
            cpu.poke(0x44, 0x24);
            cpu.poke(0x2415, 42);

            const val = AddressModes.Xind.evaluate(cpu, 0x3E);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('wraps around the 0 page', () => {
            const cpu = new MCS6502({X: 5});
            cpu.poke(0xFF, 0x15);
            cpu.poke(0x00, 0x24);
            cpu.poke(0x2415, 42);

            let val = AddressModes.Xind.evaluate(cpu, 0xFA);

            (val instanceof Address).should.be.false;
            val.should.equal(42);

            cpu.poke(0x01, 0xFE);
            cpu.poke(0x02, 0xCE);
            cpu.poke(0xCEFE, 10);

            val = AddressModes.Xind.evaluate(cpu, 0xFC);

            (val instanceof Address).should.be.false;
            val.should.equal(10);
        });

        it('disassembles as ($##,X)', () => {
            AddressModes.Xind.disassemble(0xD0).should.equal('($D0,X)');
        });

        it('writes to memory', () => {
            const cpu = new MCS6502({X: 5});
            cpu.poke(0x43, 0x15);
            cpu.poke(0x44, 0x24);

            AddressModes.Xind.write(cpu, 0x3E, 42);

            cpu.peek(0x2415).should.equal(42);
        });
    });

    describe('Indirect, Y-indexed', () => {
        it('evaluates as the byte at the Y-indexed LSB-MSB address pointed to by the 0-page address specified', () => {
            const cpu = new MCS6502({Y: 5});
            cpu.poke(0x43, 0x15);
            cpu.poke(0x44, 0x24);
            cpu.poke(0x241A, 42);

            const val = AddressModes.indY.evaluate(cpu, 0x43);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('wraps around the 0 page', () => {
            const cpu = new MCS6502({Y: 5});
            cpu.poke(0xFF, 0x15);
            cpu.poke(0x00, 0x24);
            cpu.poke(0x241A, 42);

            const val = AddressModes.indY.evaluate(cpu, 0xFF);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('disassembles as ($##),Y', () => {
            AddressModes.indY.disassemble(0xD0).should.equal('($D0),Y');
        });

        it('writes to memory', () => {
            const cpu = new MCS6502({Y: 5});
            cpu.poke(0x43, 0x15);
            cpu.poke(0x44, 0x24);

            AddressModes.indY.write(cpu, 0x43, 42);

            cpu.peek(0x241A).should.equal(42);
        });
    });

    describe('Relative', () => {
        it('evaluates as the PC plus the argument for a negative offset', () => {
            const cpu = new MCS6502({PC: 0x202});

            const val = AddressModes.rel.evaluateAddress(cpu, -0x50);

            (val instanceof Address).should.be.true;
            val.should.equal(0x1B2);
        });

        it('evaluates as the PC plus the argument for a positive offset', () => {
            const cpu = new MCS6502({PC: 0x2E2});

            const val = AddressModes.rel.evaluateAddress(cpu, 0x50);

            (val instanceof Address).should.be.true;
            val.should.equal(0x332);
        });

        it('disassembles as $##', () => {
            AddressModes.rel.disassemble(0x50).should.equal('$50');
            AddressModes.rel.disassemble(-0x50).should.equal('$B0');
        });

        it("can't write", () => {
            expect(() => { AddressModes.implied.write(null, null, null); }).to.throw("cannot write");
        });
    });

    describe('Zero page', () => {
        it('evaluates as the byte in page zerobeing pointed to', () => {
            const cpu = new MCS6502();
            cpu.poke(10, 42);
            const val = AddressModes.zpg.evaluate(cpu, 10);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('disassembles as $##', () => {
            AddressModes.zpg.disassemble(0xE8).should.equal('$E8');
        });

        it('writes to memory', () => {
            const cpu = new MCS6502();

            AddressModes.zpg.write(cpu, 10, 42);

            cpu.peek(10).should.equal(42);
        });
    });

    describe('Zero page, X-indexed', () => {
        it('evaluates as the byte at an absolute zero page address, indexed with X', () => {
            const cpu = new MCS6502({ X: 30 });
            cpu.poke(40, 42);
            const val = AddressModes.zpgX.evaluate(cpu, 10);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('wraps around the 0 page', () => {
            const cpu = new MCS6502({X: 5});
            cpu.poke(0x04, 42);

            const val = AddressModes.zpgX.evaluate(cpu, 0xFF);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('disassembles as $##,X\'', () => {
            AddressModes.zpgX.disassemble(0xE8).should.equal('$E8,X');
        });

        it('writes to memory', () => {
            const cpu = new MCS6502({ X: 30 });

            AddressModes.zpgX.write(cpu, 10, 42);

            cpu.peek(40).should.equal(42);
        });
    });

    describe('Zero page, Y-indexed', () => {
        it('evaluates as the byte at an absolute zero page address, indexed with Y', () => {
            const cpu = new MCS6502({ Y: 30 });
            cpu.poke(40, 42);
            const val = AddressModes.zpgY.evaluate(cpu, 10);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('wraps around the 0 page', () => {
            const cpu = new MCS6502({Y: 5});
            cpu.poke(0x04, 42);

            const val = AddressModes.zpgY.evaluate(cpu, 0xFF);

            (val instanceof Address).should.be.false;
            val.should.equal(42);
        });

        it('disassembles as $##,Y', () => {
            AddressModes.zpgY.disassemble(0xE8).should.equal('$E8,Y');
        });

        it('writes to memory', () => {
            const cpu = new MCS6502({ Y: 30 });

            AddressModes.zpgY.write(cpu, 10, 42);

            cpu.peek(40).should.equal(42);
        });
    });
});