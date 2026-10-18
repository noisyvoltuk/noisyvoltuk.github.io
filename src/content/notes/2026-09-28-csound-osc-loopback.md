---
title: Keeping CSound out of the UI's way with OSC
date: 2026-09-28
tags: [csound, synth, dotnet]
---

Running CSound as its own service and talking to it over OSC on loopback means a crash or redeploy
of the .NET app never glitches the audio. `OSClisten` in the orchestra plus a tiny UDP client on the
app side is all it takes. A `/ping` → `/pong` pair doubles as a health check.
