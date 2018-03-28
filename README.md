# 6502

A debuggable, instrumentable 6502 processor simulator written in JavaScript with no runtime dependency.

# Project status

The whole 6502 instruction set is implemented. It should be possible to use this to run arbitrary assembly code.

What is not done:

* Timing: the number of cycles for each instruction is not being computed right now, and this would be necessary
  for applications that require precise timing.
* Clock: related to timing, the ability to execute code based on a clock.

# Contribution guide

I appreciate contributions in the form of bug reports, documentation, bug fixes, new features, and general feedback.
The list of things not done above can give you an idea of what's a good contribution, but do give me a heads up so
we avoid duplicated effort.

# Acknowledgements

The following sites and projects were invaluable resources while developing this library:

* [6502 Instruction Set](http://e-tradition.net/bytes/6502/6502_instruction_set.html): a short and handy reference for the 6502 instruction set.
* [6502 Microprocessor](http://nesdev.com/6502.txt): a great 6502 instruction set reference with pseudo-code implementations, made with emulator implementers in mind.
* [SYMON](https://github.com/sethm/symon): a Java implementation of a 6502 computer. Great test suite, lots of which I've translated to JavaScript in this project.
* [MCS 6500 Microcomputer Family Programming Manual](http://archive.6502.org/books/mcs6500_family_programming_manual.pdf): the reference from 1976.
* [De Re Atari](https://www.atariarchives.org/dere/): I haven't even started using this, but it could give you a clue about what's next for this project...
* [Chai Assertion Library](http://www.chaijs.com/api/bdd/): the library I use to implement the tests in this project.
