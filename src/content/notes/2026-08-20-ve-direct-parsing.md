---
title: Parsing Victron VE.Direct text frames
date: 2026-08-20
tags: [solar, home-automation]
---

VE.Direct is a tab-separated `LABEL\tvalue` stream at 19200 baud, one block per second, ending with a
`Checksum` line. The checksum byte makes the sum of every byte in the block equal 0 mod 256. Drop
blocks that fail it and you'll never see a weird spike on the chart again.
