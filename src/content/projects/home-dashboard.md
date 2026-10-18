---
title: Home automation dashboard
summary: One wall-mounted screen for the house. Solar and battery state from the Victron kit, room temperatures, heating, and the odd sensor.
date: 2026-03-10
hero: ../../assets/projects/home-hero.jpg
heroAlt: Placeholder artwork of dashboard tiles showing battery and temperature
gallery:
  - src: ../../assets/projects/home-tablet.jpg
    alt: An old tablet running the dashboard in kiosk mode
  - src: ../../assets/projects/home-solar.jpg
    alt: Battery and PV history read over VE.Direct
repo: https://github.com/noisyvoltuk/vedirectapi
tags: [home-automation, solar, dashboard, dotnet]
status: active
featured: true
---

A single screen in the hallway that answers the questions I actually ask: how full is the battery,
is the heating on, and is it warmer outside than in.

## Pieces

- **Victron VE.Direct reader.** A small API that reads the solar charge controller and battery
  monitor over serial and exposes the values over HTTP.
- **Sensors.** Cheap temperature and humidity sensors in each room.
- **The dashboard.** A static page polling a few endpoints, shown full-screen on an old tablet.

*This is placeholder copy. Replace it in `src/content/projects/home-dashboard.md`.*
