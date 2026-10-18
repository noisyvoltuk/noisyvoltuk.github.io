---
title: Sketching a voice in the Teensy Audio design tool
date: 2026-07-18
tags: [teensy, synth, subtractive]
---

The PJRC Audio System Design Tool lets you wire oscillators, mixers and filters in the browser and
then export the C++ declarations. Wire the modulation (LFO into the waveform's FM input, envelope
into the filter's frequency control) there first; it's much quicker than finding a missing
`AudioConnection` by ear.
