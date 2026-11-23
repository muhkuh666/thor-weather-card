# Thor Weather Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://hacs.xyz/docs/faq/custom_repositories)
[![Validate](https://github.com/muhkuh666/thor-weather-card/actions/workflows/validate.yml/badge.svg)](https://github.com/muhkuh666/thor-weather-card/actions/workflows/validate.yml)
[![GitHub release](https://img.shields.io/github/v/release/muhkuh666/thor-weather-card)](https://github.com/muhkuh666/thor-weather-card/releases)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/muhkuh666)

🇩🇪 [Deutsche Anleitung](README.de.md)

⚡ **Your whole weather station on one card.** Thor combines a classic barometer with pressure trend, temperature tiles with min/max, a wind compass with hourly/daily/monthly/yearly means, a wind rose, a UV pyramid, rain totals and the climate days of the year – all from your own sensors, no cloud service needed.

![Preview](https://raw.githubusercontent.com/muhkuh666/thor-weather-card/main/images/preview.png)

## Features

**Now**
- Overview: outdoor temperature, a short forecast from the pressure trend (Zambretti-style: *fair weather*, *rain likely*, *storm possible* …) and chips for feels-like, humidity, dew point, pressure, wind, rain today and UV
- **Barometer** with the classic words *Stormy · Rain · Change · Fair · Very dry*, a golden needle and a **drag pointer showing the pressure 3 hours ago** plus hPa/3 h
- Dial gauges for temperature and humidity with the **min–max range** of the last 24 h on the rim
- Temperature tiles (outdoor, feels-like, indoor, dew point, indoor humidity) with **min/max incl. time** and a temperature-coloured sparkline
- **Feels-like and dew point are computed** automatically (wind chill / heat index, Magnus formula) if you don't have sensors for them
- **UV pyramid** in WHO colours with risk level, protection tip and daily maximum

**Sun**
- **Sun arc** of the day with the current sun position, sunrise, sunset, **day length incl. change vs. yesterday**, solar noon with maximum elevation, elevation and azimuth (computed from your Home Assistant location)
- **UV**: pyramid plus today's UV curve in the WHO bands, **daily UV dose** (SED) and **time until sunburn** for skin types I–VI (your type highlighted)
- **Solar radiation**: current W/m², **clear-sky value** and **clearness** (sunny / partly cloudy / cloudy / overcast), **sunshine duration today** (WMO: ≥ 120 W/m²), **energy today** in kWh/m², daily max – with a daily curve against the clear-sky curve
- **Sunshine hours per day** (7–60 days) and sunshine hours of the year compared with last year
- Works with a radiation sensor (W/m²) or an illuminance sensor (lx, approximated)

**Wind**
- Large compass with arrow, cardinal point, speed, Beaufort with description, the **10‑minute variation arc** and the 10‑minute mean
- **Wind and gusts clearly separated**: comparison bars mean wind vs. gusts, **gustiness** (steady … very gusty) with gust factor, gusts in the compass and in the overview
- **Wind & gusts chart (24 h)**: 10‑minute mean wind as area, 10‑minute max gust as line, Beaufort axis, peak gust marked
- **Direction means for hour, day, month and year** (vector mean, not the wrong arithmetic mean) plus **prevailing direction** and **steadiness**
- **Wind rose** with 16 sectors stacked by Beaufort class, calm percentage in the centre, selectable periods (1 h … 30 days) and switchable between **mean wind and gusts**
- Optional **house image** behind compass and wind rose – same options as the [Helios Compass Card](https://github.com/muhkuh666/helios-compass-card)
- Wind values list: degrees, Beaufort, km/h · m/s · knots · mph, gusts, max gust in 24 h, average speeds
- Wind unit selectable: as sensor, km/h, m/s, kn, mph or Beaufort

**Rain**
- Rain status with animated drops, rain rate and intensity (light / moderate / heavy / very heavy)
- Totals for **today, 24 h, yesterday, week, month, year** and total – all derived from **one** rain counter
- Precipitation per day as a bar chart (7–60 days), last rain and days without rain

**Year**
- **Climate days** since 1 January: summer days (≥ 25 °C), hot days (≥ 30 °C), tropical nights (min ≥ 20 °C), frost days (min < 0 °C), ice days (max < 0 °C), rain days – each **compared with last year to date**
- Tmax/Tmin 24 h and the year's high and low with date
- **Climate chart**: monthly mean temperature and precipitation, this year vs. last year

**Periods (like the Helios Compass Card)**
- Buttons *Today · 1 hr · 8 hrs · 12 hrs · 24 hrs · 3/7/14/30 days · 1 year · Summer · Winter* on wind rose, wind & gusts, precipitation and sunshine hours
- Short periods come from the history, from 7 days on from the long-term statistics; *Summer* = Apr–Sep, *Winter* = Oct–Mar of the last 12 months; 1 year / summer / winter as monthly bars
- The last selection is remembered per chart

**General**
- Tabs (*Now · Sun · Wind · Rain · Year*) or everything stacked, each section can be switched off
- Fully configurable in the **visual card editor**, German and English, light & dark themes
- Click any value to open the Home Assistant *more info* dialog

## Screenshots

| Now | Sun | Wind | Rain | Year |
|---|---|---|---|---|
| <img src="https://raw.githubusercontent.com/muhkuh666/thor-weather-card/main/images/now.png" width="180"> | <img src="https://raw.githubusercontent.com/muhkuh666/thor-weather-card/main/images/sun.png" width="180"> | <img src="https://raw.githubusercontent.com/muhkuh666/thor-weather-card/main/images/wind.png" width="180"> | <img src="https://raw.githubusercontent.com/muhkuh666/thor-weather-card/main/images/rain.png" width="180"> | <img src="https://raw.githubusercontent.com/muhkuh666/thor-weather-card/main/images/year.png" width="180"> |

## Installation

### HACS
1. HACS → ⋮ → *Custom repositories* → `https://github.com/muhkuh666/thor-weather-card`, type **Dashboard**
2. Install *Thor Weather Card*, reload the browser (Ctrl+F5)

### Manual
Copy `thor-weather-card.js` to `config/www/` and add it as a resource: *Settings → Dashboards → ⋮ → Resources* → `/local/thor-weather-card.js` (JavaScript module).

## Configuration

Add the card via *Add card → Thor Weather Card* and pick your sensors in the editor. Minimal YAML:

```yaml
type: custom:thor-weather-card
outdoor_temp_entity: sensor.outdoor_temperature
humidity_entity: sensor.outdoor_humidity
pressure_entity: sensor.relative_pressure
wind_speed_entity: sensor.wind_speed
wind_gust_entity: sensor.wind_gust
wind_direction_entity: sensor.wind_direction
rain_rate_entity: sensor.rain_rate
rain_total_entity: sensor.rain_total
uv_entity: sensor.uv_index
```

Full example:

```yaml
type: custom:thor-weather-card
title: Thor
outdoor_temp_entity: sensor.outdoor_temperature
indoor_temp_entity: sensor.indoor_temperature
humidity_entity: sensor.outdoor_humidity
pressure_entity: sensor.relative_pressure
wind_speed_entity: sensor.wind_speed
wind_gust_entity: sensor.wind_gust
wind_direction_entity: sensor.wind_direction
rain_rate_entity: sensor.rain_rate
rain_total_entity: sensor.rain_total
rain_state_entity: binary_sensor.raining
uv_entity: sensor.uv_index
radiation_entity: sensor.solar_radiation
skin_type: 2
layout: tabs            # tabs | stack
default_tab: now        # now | wind | rain | year
wind_unit: auto         # auto | km/h | m/s | kn | mph | bft
windrose_periods: [today, 1h, 8h, 24h, 7d, 30d, 1y, summer, winter]
windrose_default: 24h
rain_day_threshold: 0.1
image: /local/thor/house.png
image_rotation: -25
image_opacity: 0.55
```

### Sensors

| Option | Description |
|---|---|
| `outdoor_temp_entity` | Outdoor temperature (°C or °F) |
| `feels_like_entity` | Feels-like temperature – *optional, computed otherwise* |
| `indoor_temp_entity` | Indoor temperature |
| `dew_point_entity` | Dew point – *optional, computed otherwise* |
| `humidity_entity` / `indoor_humidity_entity` | Relative humidity outdoor / indoor |
| `pressure_entity` | **Relative** (sea-level) pressure in hPa |
| `wind_speed_entity` / `wind_gust_entity` | Wind speed / gusts (km/h, m/s, kn, mph – converted automatically) |
| `wind_direction_entity` | Degrees 0–360 **or** compass text (N, NNE, NO …) |
| `rain_rate_entity` | Rain rate (mm/h) |
| `rain_total_entity` | Ever-increasing rain counter (`state_class: total_increasing`) – **recommended** |
| `rain_today_entity` | Daily-resetting rain sensor – only if there is no total counter |
| `rain_state_entity` | Optional `binary_sensor` or text sensor ("rain"/"no rain"); otherwise rain rate > 0 |
| `rain_event_entity` | Rain of the current event ("event rain") |
| `rain_week_entity`, `rain_month_entity`, `rain_year_entity` | Station totals – take precedence over the calculation |
| `wind_dir_avg_hour/day/month/year_entity`, `wind_speed_avg_hour/day/month/year_entity` | Ready-made wind means of the station – replace the computed means (useful if the direction is only text like "N") |
| `uv_entity` | UV index |
| `radiation_entity` | Solar radiation in W/m² (a lux sensor also works, approximated) |
| `illuminance_entity` | Illuminance in lx – optional, shown in addition / fallback |
| `sun_entity` | `sun.sun` – only used if Home Assistant has no location |

### Options

| Option | Default | Description |
|---|---|---|
| `layout` | `tabs` | `tabs` or `stack` (all sections one after another) |
| `tabs` | `[now, sun, wind, rain, year]` | Which tabs/sections and in which order |
| `default_tab` | `now` | Tab shown first |
| `show_hero`, `show_gauges`, `show_temps`, `show_uv`, `show_compass`, `show_wind_averages`, `show_windrose`, `show_wind_values`, `show_gust_chart`, `show_sun_arc`, `show_sun_uv`, `show_radiation`, `show_sun_chart`, `show_rain`, `show_rain_chart`, `show_climate_days`, `show_climate_chart` | `true` | Switch individual sections on/off |
| `minmax_mode` | `24h` | Min/max over the last 24 h or `today` (since midnight) |
| `wind_unit` | `auto` | `auto`, `km/h`, `m/s`, `kn`, `mph`, `bft` |
| `windrose_periods` | `[today, 1h, 8h, 24h, 7d, 30d, 1y, summer, winter]` | Period buttons of the wind rose |
| `wind_chart_periods` | `[today, 8h, 24h, 3d, 7d, 30d, 1y]` | Period buttons of the wind & gusts chart |
| `rain_periods` / `sun_periods` | `[7d, 14d, 30d, 1y, summer, winter]` | Period buttons of the precipitation / sunshine chart |
| `windrose_default`, `wind_chart_default`, `rain_default`, `sun_default` | `24h`, `24h`, `14d`, `14d` | Period shown first (the last choice is remembered in the browser) |
| `windrose_mode` | `wind` | Wind rose by `wind` (mean wind) or `gust` |
| `skin_type` | `2` | Skin type I–VI (1–6) for the sunburn time |
| `sunshine_threshold` | `120` | W/m² from which it counts as sunshine (WMO) |
| `rain_day_threshold` | `0.1` | mm from which a day counts as a rain day |
| `pressure_offset` | `0` | hPa added to the reading (altitude correction) |
| `temp_gauge_min` / `temp_gauge_max` | `-25` / `40` | Scale of the temperature gauge (°C) |
| `image`, `image_scale`, `image_rotation`, `image_opacity`, `image_clip` | | House image behind compass & wind rose – north of the image up |
| `language` | `auto` | `auto`, `de`, `en` |
| `refresh_minutes` | `5` | How often the history is reloaded |

### Notes
- **History & statistics:** min/max, sparklines, wind rose and hour/day means come from the recorder history (keep `purge_keep_days` ≥ the longest wind-rose period). Month/year means, rain per day, climate days and the climate chart use the **long-term statistics** – the sensors need a `state_class` (`measurement` for temperature, wind; `total_increasing` for the rain counter). Wind direction sensors with `state_class: measurement_angle` give exact circular hourly means.
- A wind direction given as text (N, NNE …) has no long-term statistics: the wind rose from 7 days on then needs a degree sensor; the direction means can come from the station sensors.
- The forecast text is a simple barometric rule of thumb (pressure level + 3‑hour trend), not a weather service forecast.

## Support

If you like the card, I'd be happy about a coffee ☕

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/muhkuh666)

## License

MIT © muhkuh666
