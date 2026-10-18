---
title: Pisces
summary: A modular hardware synth on a Raspberry Pi 4, with CSound doing the sound and a physical panel of encoders and OLED displays doing the playing.
date: 2026-06-01
updated: 2026-10-18
hero: ../../assets/projects/pisces-hero.jpg
heroAlt: Placeholder artwork of the Pisces synth's encoders and keyboard
gallery:
  - src: ../../assets/projects/pisces-panel.jpg
    alt: The control panel, with an OLED above each parameter encoder
  - src: ../../assets/projects/pisces-wiring.jpg
    alt: Four SSD1306 OLEDs on one I2C bus through a TCA9548A mux
  - src: ../../assets/projects/pisces-web.jpg
    alt: The Blazor web interface for patches and modules
audio:
  src: /audio/pisces-demo.mp3
  title: Demo arpeggio (placeholder)
repo: https://github.com/noisyvoltuk/Pisces
tags: [csound, raspberry-pi, synth, dotnet, hardware]
status: active
featured: true
---

Pisces is a hardware synthesizer built around **CSound** running on a Raspberry Pi 4. You play it
from a panel of rotary encoders, buttons and little displays, or from a web interface on your phone.

```
VCO → VCF → VCA → FX → OUT
       ↑      ↑
   filter    amp
    ADSR     ADSR      (+ pitch / filter LFOs)
```

## How it works

CSound runs on its own as a systemd service with one master orchestra that is always loaded.
A .NET app talks to it over OSC on the loopback interface, so nothing in the audio path depends
on the UI. Each module has a role (oscillator, filter, envelope, effect) and the selector encoder
steps through them; four parameter encoders then edit that module.

## Hardware

- Raspberry Pi 4 with a HiFiBerry DAC+ Light for I2S audio out
- A 320×240 TFT for the module selector
- Four SSD1306 OLEDs, one beside each parameter encoder, through a TCA9548A I2C mux
- Five push encoders, two buttons (save and load patch), and a USB MIDI keyboard

*This is placeholder copy. Replace it in `src/content/projects/pisces.md`.*
