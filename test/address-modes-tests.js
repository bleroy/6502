import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
let should = chai.should();

import MCS6502, { AddressMode, AddressModes, Address, Byte } from '../libs/6502';

describe('AddressMode', () => {
    describe('constructor', () => {
        it('properly sets properties', () => {
            let parameters = {
                name: "the name",
                description: "the description",
                bytes: 42
            };
            let addressMode = new AddressMode(parameters);

            addressMode.should.include(parameters);
        });
    });

    describe('evaluate', () => {
        it('evaluates addresses from memory', () => {
            let proc = new MCS6502();
            proc.poke(1000, 42);

            let mode = new AddressMode({
                evaluate: (processor, operand) => new Address(operand)
            });

            mode.evaluate(proc, 1000).should.equal(42);
        });

        it('evaluates bytes directly', () => {
            let proc = new MCS6502();

            let mode = new AddressMode({
                evaluate: (processor, operand) => new Byte(operand + 2)
            });

            mode.evaluate(proc, 40).should.equal(42);
        });
    });

    describe('evaluateAddress', () => {
        it('throws if evaluation didn\'t return an address', () => {
            let proc = new MCS6502();

            let mode = new AddressMode({
                evaluate: (processor, operand) => new Byte(0)
            });

            expect(() => {mode.evaluateAddress(proc, 42);})
                .to.throw(TypeError, null, `EvaluateAddress should throw when used with a non-address evaluation.`);
        });

        it('returns the evaluation when it\'s an address', () => {
            let proc = new MCS6502();

            let mode = new AddressMode({
                evaluate: (processor, operand) => new Address(operand)
            });

            mode.evaluateAddress(proc, 1000).should.equal(1000);
        });
    });
});

describe('AddressModes', () => {
    describe('A', () => {
        it('evaluates the value of the accumulator', () => {
            let proc = new MCS6502({ A: 42 });
            AddressModes.A.evaluate(proc).should.equal(42);
        });

        it('disassembles as A', () => {
            AddressModes.A.disassemble().should.equal('A');
        });
    });

    describe('abs', () => {
        it('evaluates as the byte at an absolute address', () => {
            let proc = new MCS6502();
            proc.poke(1000, 42);
            let val = AddressModes.abs.evaluate(proc, 1000);

            (val instanceof Byte).should.be.true;
            val.should.equal(42);
        });

        it('disassembles as $####', () => {
            AddressModes.abs.disassemble(1000).should.equal('$03E8');
        });
    });

    describe('abs,X', () => {
        it('evaluates as the byte at an absolute address, indexed with X', () => {
            let proc = new MCS6502({ X: 30 });
            proc.poke(1000, 42);
            let val = AddressModes.absX.evaluate(proc, 970);

            (val instanceof Byte).should.be.true;
            val.should.equal(42);
        });

        it('disassembles as $####,X\'', () => {
            AddressModes.absX.disassemble(1000).should.equal('$03E8,X');
        });
    });

    describe('abs,Y', () => {
        it('evaluates as the byte at an absolute address, indexed with Y', () => {
            let proc = new MCS6502({ Y: 30 });
            proc.poke(1000, 42);
            let val = AddressModes.absY.evaluate(proc, 970);

            (val instanceof Byte).should.be.true;
            val.should.equal(42);
        });

        it('disassembles as $####,Y', () => {
            AddressModes.absY.disassemble(1000).should.equal('$03E8,Y');
        });
    });

    describe('immediate', () => {
        it('evaluates as the byte passed in', () => {
            let val = AddressModes.immediate.evaluate(null, 42);

            (val instanceof Byte).should.be.true;
            val.should.equal(42);
        });

        it('disassembles as #$##', () => {
            AddressModes.immediate.disassemble(42).should.equal('#$2A');
        });
    });
});