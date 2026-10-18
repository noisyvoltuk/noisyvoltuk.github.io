---
title: Four identical OLEDs on one I2C bus
date: 2026-10-12
tags: [raspberry-pi, hardware, synth]
---

SSD1306 boards usually only offer two addresses (`0x3C` and `0x3D`), so four of them can't share a
bus directly. A **TCA9548A** mux at `0x70` fixes it: write a single byte with the channel bit set,
then talk to the display at `0x3C` as normal.

```python
bus.write_byte(0x70, 1 << channel)  # select channel 0–7
```

Remember to deselect (`0x00`) if anything else lives on the same bus.
