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

* [http://e-tradition.net/bytes/6502/6502_instruction_set.html](6502 Instruction Set): a short and handy reference for the 6502 instruction set.
* [http://nesdev.com/6502.txt](6502 Microprocessor): a great 6502 instruction set reference with pseudo-code implementations, made with emulator implementers in mind.
* [https://github.com/sethm/symon](SYMON): a Java implementation of a 6502 computer. Great test suite, lots of which I've translated to JavaScript in this project.
* [http://archive.6502.org/books/mcs6500_family_programming_manual.pdf](MCS 6500 Microcomputer Family Programming Manual): the reference from 1976.
* [https://www.atariarchives.org/dere/](De Re Atari): I haven't even started using this, but it could give you a clue about what's next for this project...
* [http://www.chaijs.com/api/bdd/](Chai Assertion Library): the library I use to implement the tests in this project.
