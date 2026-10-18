---
title: A detuned saw pad in a few lines of CSound
date: 2026-10-16
tags: [csound, sound-design]
---

Three `vco2` saws a few cents apart, through `moogladder` with an envelope on the cutoff, gives a
pad that's warm without any effects:

```csound
instr Pad
  kenv  madsr 1.5, 0.5, 0.7, 2
  asig  = vco2(0.2, p4) + vco2(0.2, p4 * 1.004) + vco2(0.2, p4 * 0.996)
  aflt  moogladder asig, 400 + kenv * 2400, 0.3
  outs  aflt * kenv, aflt * kenv
endin
```
