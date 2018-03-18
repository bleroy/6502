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