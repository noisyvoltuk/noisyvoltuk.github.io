---
title: TeensySynth
summary: A pocket two-oscillator subtractive synth on a Teensy 4.0 and Audio Shield, with an LFO, a state-variable filter, two ADSRs, two encoders and a 20×4 LCD.
date: 2026-05-02
hero: ../../assets/projects/teensy-hero.jpg
heroAlt: Placeholder artwork of the TeensySynth with five knobs and a keyboard
gallery:
  - src: ../../assets/projects/teensy-lcd.jpg
    alt: Two encoders, one to pick a parameter and one to set it, with a 20×4 LCD
  - src: ../../assets/projects/teensy-scope.jpg
    alt: The state-variable filter sweeping under the filter envelope
repo: https://github.com/noisyvoltuk/TeensySynth
tags: [teensy, synth, hardware, subtractive]
status: done
featured: true
---

A small, self-contained subtractive synth built on the Teensy Audio Library. It was the warm-up for
[Pisces](/projects/pisces/): the same VCO → VCF → VCA idea, without the Raspberry Pi.

```
VCO1 ─┐
      ├─> Mixer ──> VCF (state-variable) ──> VCA ──> Out
VCO2 ─┘                  ▲                    ▲
LFO ──> (FM into VCOs)   │                    │
                   ADSR1 ┘              ADSR2 ┘
```

## Voice

- **VCO1** is a sine and **VCO2** a detunable sawtooth
- An **LFO** adds vibrato to both oscillators, with adjustable rate and depth
- A **state-variable filter** has cutoff and resonance, swept by its own envelope
- A second **ADSR** shapes the amplitude

## Panel

One encoder picks the parameter and the other sets its value. A 20×4 I2C LCD shows the current page.

*This is placeholder copy. Replace it in `src/content/projects/teensy-synth.md`.*
