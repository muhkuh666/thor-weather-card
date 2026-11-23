# Thor Weather Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://hacs.xyz/docs/faq/custom_repositories)
[![Validate](https://github.com/muhkuh666/thor-weather-card/actions/workflows/validate.yml/badge.svg)](https://github.com/muhkuh666/thor-weather-card/actions/workflows/validate.yml)
[![GitHub release](https://img.shields.io/github/v/release/muhkuh666/thor-weather-card)](https://github.com/muhkuh666/thor-weather-card/releases)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/muhkuh666)

🇬🇧 [English](README.md)

⚡ **Die ganze Wetterstation auf einer Karte.** Thor vereint ein klassisches Barometer mit Drucktendenz, Temperatur-Kacheln mit Min/Max, einen Wind-Kompass mit Stunden-/Tages-/Monats-/Jahresmittel, eine Windrose, eine UV-Pyramide, Regensummen und die Klimatage des Jahres – alles aus deinen eigenen Sensoren, ohne Cloud-Dienst.

![Vorschau](https://raw.githubusercontent.com/muhkuh666/thor-weather-card/main/images/preview.png)

## Funktionen

**Jetzt**
- Übersicht: Außentemperatur, Kurzprognose aus der Drucktendenz (nach Zambretti-Art: *Schönes Wetter*, *Regen wahrscheinlich*, *Sturm möglich* …) und Chips für gefühlte Temperatur, Luftfeuchte, Taupunkt, Luftdruck, Wind, Regen heute und UV
- **Barometer** mit den klassischen Wörtern *Sturm · Regen · wechselhaft · schön · trocken*, goldenem Zeiger und **Schleppzeiger mit dem Luftdruck von vor 3 Stunden** samt hPa/3 h
- Zeigerinstrumente für Temperatur und Luftfeuchte mit dem **Min–Max-Bereich** der letzten 24 h am Rand
- Temperatur-Kacheln (außen, gefühlt, innen, Taupunkt, Feuchte innen) mit **Min/Max inkl. Uhrzeit** und temperaturfarbigem Verlauf
- **Gefühlte Temperatur und Taupunkt werden berechnet** (Windchill / Hitzeindex, Magnus-Formel), wenn du dafür keine Sensoren hast
- **UV-Pyramide** in WHO-Farben mit Risikostufe, Schutz-Tipp und Tagesmaximum

**Prognose**
- **Lokale Prognose mit dem Zambretti-Modell** (Negretti & Zambra): Luftdruck, 3-Stunden-Tendenz, Windrichtung und Jahreszeit ergeben eine von 26 Prognosen von *A – Beständig schön* bis *Z – Stürmisch, viel Regen*, mit Skala und allen Eingangswerten; wird auch in der Übersicht genutzt
- **Luftdruck-Diagramm 24 h mit Trend**, 6 Stunden in die Zukunft verlängert
- **Hinweise**: Nebel, Frost / Glätte, Tau, Sturm (Böen oder schneller Druckfall), Gewitterneigung, Hitze und UV – jeweils mit Stufe und den Werten dahinter
- Optional die **Vorhersage einer Wetter-Entität** (z. B. DWD, Met.no): stündlich und täglich mit Temperatur, Niederschlag, Wahrscheinlichkeit und Wind

**Jahreszeit**
- Aktuelle **meteorologische** und **astronomische** Jahreszeit (Tagundnachtgleichen und Sonnenwenden auf die Minute, nach Meeus), Jahresring mit Fortschritt, Tage bis zur nächsten Jahreszeit, Änderung der Tageslänge
- Die laufende Jahreszeit **gegen denselben Zeitraum früherer Jahre** (Temperatur, Regen, Sonne, Frost-/Sommertage) und eine Tabelle **Jahreszeiten im Vergleich** mit Abweichungen
- Jahreszeit-Chip in der Übersicht und Zeitraum-Knopf **Jahreszeit** für Windrose, Wind & Böen, Niederschlag und Sonnenstunden

**Klima** *(aus deiner Langzeitstatistik, bis zu 30 Jahre zurück)*
- **Rekorde & Extreme**: höchste/tiefste Temperatur, wärmster/kältester Tag, nassester Tag und Monat, stärkste Böe, höchster/tiefster Luftdruck, sonnigster Tag – dazu **dieser Kalendertag in früheren Jahren** mit 🏆, wenn heute ein neuer Rekord fällt, und eine Tabelle der **Monatsrekorde**
- **Klimastreifen** deiner eigenen Station (jeder Monat gegen sein Mittel) und **Jahresvergleich** – bis heute (fair) oder ganze Jahre: Mittel, Extreme, Regen, Sonne, Sommer-/Frost-/Regentage
- **Kalender-Heatmap**: das ganze Jahr Tag für Tag für Temperatur, Regen, Sonne oder Böen, Jahre wählbar

**Haus & Garten**
- **Vegetation**: Grünlandtemperatursumme und Vegetationsbeginn (DWD, 200 °C) gegen Vorjahr, letzter Frost im Frühjahr und erster im Herbst, frostfreie Zeit, Wachstumsgradtage
- **Heiz- & Kühlgradtage** (G20/15, VDI 3807) je Monat der Heizperiode gegen die Vorsaison – „das Wetter hat 4 % weniger Heizbedarf verursacht“
- **Lüften & Schimmelrisiko**: absolute Feuchte innen gegen außen („jetzt lüften lohnt sich“), Taupunkt innen, geschätzte kälteste Wandstelle (fRsi) mit Schimmelrisiko, Behaglichkeitsdiagramm mit Spur der letzten 24 h
- **Garten-Wasserbilanz**: Regen minus Verdunstung (ET₀ nach Makkink aus dem Strahlungssensor, sonst Hargreaves) über 7/14/30 Tage mit Gießempfehlung, die angesagten Regen berücksichtigt

**Mehr in Prognose & Regen**
- **Nachtfrost-Prognose** (Taupunkt-Methode, Himmel und Wind, kombiniert mit der Vorhersage der Wetter-Entität): Tiefstwert in 2 m und in Bodennähe, Hinweise zu Auto, Pflanzen, Leitungen, Glätte
- **Biowetter**: Kreislauf, Kopfschmerz, Atemwege, Gelenke aus Druck- und Temperatursprüngen, Wärme, Schwüle, Kältereiz, nasskalter Luft und Pollen
- **Regen-Analyse**: Starkregen nach DWD-Schwellen (1 h / 6 h), letzte Regenereignisse mit Dauer und Intensität, längste Trocken- und Regenperioden

**Pollen**
- Funktioniert direkt mit **[DWD Pollenflug](https://github.com/mampfes/hacs_dwd_pollenflug)** (Sensoren werden automatisch gefunden); andere Quellen (Google Pollen UPI 0–5, Pollen/m³, Text-Stufen) werden auf dieselbe Skala 0–3 umgerechnet
- Heute, morgen und übermorgen je Pollenart, Gesamtbelastung und Trend; **deine Allergene** werden hervorgehoben und bestimmen Gesamtbelastung, Übersicht und Hinweise
- **Lokale Einschätzung aus deiner Station**: Regen wäscht Pollen aus, hohe Feuchte lässt sie absinken, trockener Wind verteilt sie – dazu ein Lüftungstipp für Stadt oder Land
- **Pollen-Verlauf** als Heatmap (7–90 Tage)

**Sonne**
- **Himmelskompass**: eigener Kompass nur für Sonne und Mond (mit deinem Hausbild) – Sonnenbahn mit Stundenpunkten und Auf-/Untergang, Mondbogen mit Mondauf-/-untergang, Sonnenbahnen am 21.6. / 21.12., Höhenringe 30°/60°
- **Sonne & Mond** wie bei einer Horizont-Karte: Sonnen- und Mondbahn über den Tag mit Nacht- und Dämmerungsfläche, Auf- und Untergang, Morgen- und Abenddämmerung (bürgerlich, nautisch oder astronomisch), Sonnenhöchststand, Azimut und Höhenwinkel von Sonne ☉ und Mond ☽, Mondaufgang/-untergang, Mondphase mit Bild und Beleuchtung
- **Sonnenbogen** des Tages mit aktuellem Sonnenstand, Auf- und Untergang, **Tageslänge inkl. Änderung zu gestern**, Sonnenhöchststand mit Höhe, aktuelle Höhe und Azimut (aus dem Standort von Home Assistant berechnet)
- **UV**: Pyramide plus UV-Kurve des Tages in den WHO-Stufen, **UV-Tagesdosis** (SED) und **Zeit bis zum Sonnenbrand** für Hauttyp I–VI (dein Typ hervorgehoben)
- **Sonnenstrahlung**: aktuelle W/m², **Klarhimmel-Wert** und **Klarheit** (sonnig / leicht bewölkt / bewölkt / trüb), **Sonnenscheindauer heute** (WMO: ≥ 120 W/m²), **Energie heute** in kWh/m², Tagesmaximum – mit Tagesverlauf gegen die Klarhimmel-Kurve
- **Sonnenstunden je Tag** (7–60 Tage) und Sonnenstunden des Jahres im Vergleich zum Vorjahr
- Funktioniert mit Strahlungssensor (W/m²) oder Helligkeitssensor (lx, genähert)

**Wind**
- Großer Kompass mit Pfeil, Himmelsrichtung, Geschwindigkeit, Beaufort mit Bezeichnung, **Schwankungsbogen der letzten 10 Minuten** und 10-Minuten-Mittel
- **Beaufort-Säulen** für Mittelwind und Böen (0–12 in den klassischen Farben) mit aktuellem Wert, 24-h-Maximum und Legende mit Bezeichnung und Geschwindigkeitsbereich
- **Wind und Böen klar getrennt**: Vergleichsbalken Mittelwind gegen Böen, **Böigkeit** (gleichmäßig … stark böig) mit Böenfaktor, Böen im Kompass und in der Übersicht
- **Diagramm Wind & Böen (24 h)**: Mittelwind (10-Minuten-Mittel) als Fläche, Böen (10-Minuten-Maximum) als Linie, Beaufort-Achse, Spitzenböe markiert
- **Richtungsmittel für Stunde, Tag, Monat und Jahr** (Vektormittel – nicht das falsche arithmetische Mittel) plus **Hauptrichtung** und **Beständigkeit**
- **Windrose** in der Karte umschaltbar zwischen **Häufigkeit**, **Geschwindigkeit** und **Stärke (Beaufort)** – Geschwindigkeit/Stärke zeigen das Mittel je Richtung, das Maximum als Bogen und die Häufigkeit als Deckkraft; aktueller Wind, Böen und Beaufort stehen immer über der Rose
- **Himmelskarte von Sonne und Mond** auf Windrose und Wind-Kompass (wie bei der Helios Compass Card): Rand = Horizont, Mitte = Zenit; Tagesbahn der Sonne mit Stundenpunkten und Auf-/Untergangszeit, laufender bzw. nächster Mondbogen mit Stundenpunkten und Mondauf-/-untergang, Sonne und Mond (in echter Phase) an ihrer tatsächlichen Himmelsposition, optional die Sonnenbahnen am 21.6. / 21.12.; Azimut, Höhe, Mondphase und Beleuchtung unter der Rose
- 16 Sektoren, gestapelt nach Beaufort-Klassen, Windstille in der Mitte, wählbaren Zeiträumen (1 Stunde … 30 Tage) und umschaltbar zwischen **Mittelwind und Böen**
- Optional **Hausbild** hinter Kompass und Windrose – gleiche Optionen wie bei der [Helios Compass Card](https://github.com/muhkuh666/helios-compass-card)
- Windwerte-Liste: Grad, Beaufort, km/h · m/s · Knoten · mph, Böen, stärkste Böe der letzten 24 h, Durchschnittsgeschwindigkeiten
- Windeinheit wählbar: wie Sensor, km/h, m/s, kn, mph oder Beaufort

**Regen**
- Regen-Status mit animierten Tropfen, Regenrate und Intensität (leicht / mäßig / stark / sehr stark)
- Summen für **heute, 24 h, gestern, Woche, Monat, Jahr** und gesamt – alles aus **einem** Regen-Zähler berechnet
- Niederschlag je Tag als Balkendiagramm (7–60 Tage), letzter Regen und Tage ohne Regen

**Jahr**
- **Klimatage** seit 1. Januar: Sommertage (≥ 25 °C), Heiße Tage (≥ 30 °C), Tropennächte (Tmin ≥ 20 °C), Frosttage (Tmin < 0 °C), Eistage (Tmax < 0 °C), Regentage – jeweils **im Vergleich zum Vorjahr bis zum selben Datum**
- Tmax/Tmin 24 h sowie Jahreshöchst- und -tiefstwert mit Datum
- **Klimadiagramm**: Monatsmittel der Temperatur und Niederschlag, dieses Jahr gegen Vorjahr

**Zeiträume (wie bei der Helios Compass Card)**
- Knöpfe *Heute · 1 Std. · 8 Std. · 12 Std. · 24 Std. · 3/7/14/30 Tage · 1 Jahr · Sommer · Winter* an Windrose, Wind & Böen, Niederschlag und Sonnenstunden
- Kurze Zeiträume kommen aus dem Verlauf, ab 7 Tagen aus der Langzeitstatistik; *Sommer* = Apr–Sep, *Winter* = Okt–Mär der letzten 12 Monate; 1 Jahr / Sommer / Winter als Monatsbalken
- Die letzte Auswahl wird je Diagramm gemerkt

**Allgemein**
- Reiter (*Jetzt · Prognose · Sonne · Pollen · Wind · Regen · Jahr · Klima · Haus & Garten*), scrollbar – der Pollen-Reiter erscheint nur, wenn es Pollen-Sensoren gibt
- **Jede Option** ist im grafischen Editor einstellbar, inkl. Farben (Akzent, Wind, Böen, Zeiger) oder alles untereinander, jeder Bereich abschaltbar
- Komplett im **grafischen Karten-Editor** einstellbar, Deutsch und Englisch, helles & dunkles Theme
- Klick auf einen Wert öffnet den *Mehr-Infos*-Dialog von Home Assistant

## Screenshots

| Jetzt | Prognose | Sonne | Pollen | Wind | Regen | Jahr | Klima | Haus |
|---|---|---|---|---|---|---|---|---|
| <img src="https://raw.githubusercontent.com/muhkuh666/thor-weather-card/main/images/now.png" width="180"> | <img src="https://raw.githubusercontent.com/muhkuh666/thor-weather-card/main/images/forecast.png" width="180"> | <img src="https://raw.githubusercontent.com/muhkuh666/thor-weather-card/main/images/sun.png" width="180"> | <img src="https://raw.githubusercontent.com/muhkuh666/thor-weather-card/main/images/pollen.png" width="180"> | <img src="https://raw.githubusercontent.com/muhkuh666/thor-weather-card/main/images/wind.png" width="180"> | <img src="https://raw.githubusercontent.com/muhkuh666/thor-weather-card/main/images/rain.png" width="180"> | <img src="https://raw.githubusercontent.com/muhkuh666/thor-weather-card/main/images/year.png" width="180"> | <img src="https://raw.githubusercontent.com/muhkuh666/thor-weather-card/main/images/climate.png" width="180"> | <img src="https://raw.githubusercontent.com/muhkuh666/thor-weather-card/main/images/home.png" width="180"> |

## Benachrichtigungen (Blueprints)

| Blueprint | Was er macht | Import |
|---|---|---|
| Frost | Warnung am Abend, wenn heute Nacht Frost wahrscheinlich ist (Taupunkt-Methode), und wenn es friert | [![Import](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2Fmuhkuh666%2Fthor-weather-card%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fmuhkuh666%2Fthor_frost.yaml) |
| Sturm | Böen über einer Grenze (Standard 62 km/h) und optional schneller Druckfall | [![Import](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2Fmuhkuh666%2Fthor-weather-card%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fmuhkuh666%2Fthor_storm.yaml) |
| Regen | Regenbeginn nach trockener Phase, Starkregen ab einer Regenrate | [![Import](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2Fmuhkuh666%2Fthor-weather-card%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fmuhkuh666%2Fthor_rain.yaml) |
| Pollen | Morgens Meldung zu deinen Allergenen, abends Vorhersage für morgen | [![Import](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2Fmuhkuh666%2Fthor-weather-card%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fmuhkuh666%2Fthor_pollen.yaml) |

## Installation

### HACS
1. HACS → ⋮ → *Benutzerdefinierte Repositories* → `https://github.com/muhkuh666/thor-weather-card`, Typ **Dashboard**
2. *Thor Weather Card* installieren, Browser neu laden (Strg+F5)

### Manuell
`thor-weather-card.js` nach `config/www/` kopieren und als Ressource eintragen: *Einstellungen → Dashboards → ⋮ → Ressourcen* → `/local/thor-weather-card.js` (JavaScript-Modul).

## Konfiguration

Karte über *Karte hinzufügen → Thor Weather Card* einfügen und die Sensoren im Editor auswählen. Minimal-YAML:

```yaml
type: custom:thor-weather-card
outdoor_temp_entity: sensor.aussentemperatur
humidity_entity: sensor.luftfeuchtigkeit
pressure_entity: sensor.luftdruck_relativ
wind_speed_entity: sensor.windgeschwindigkeit
wind_gust_entity: sensor.windboen
wind_direction_entity: sensor.windrichtung
rain_rate_entity: sensor.regenrate
rain_total_entity: sensor.gesamtniederschlag
uv_entity: sensor.uv_index
```

Vollständiges Beispiel:

```yaml
type: custom:thor-weather-card
title: Thor
outdoor_temp_entity: sensor.aussentemperatur
indoor_temp_entity: sensor.innentemperatur
humidity_entity: sensor.luftfeuchtigkeit
pressure_entity: sensor.luftdruck_relativ
wind_speed_entity: sensor.windgeschwindigkeit
wind_gust_entity: sensor.windboen
wind_direction_entity: sensor.windrichtung
rain_rate_entity: sensor.regenrate
rain_total_entity: sensor.gesamtniederschlag
rain_state_entity: sensor.regen
uv_entity: sensor.uv_index
radiation_entity: sensor.sonnenstrahlung
skin_type: 2
layout: tabs            # tabs | stack
default_tab: now        # now | wind | rain | year
wind_unit: auto         # auto | km/h | m/s | kn | mph | bft
windrose_periods: [today, 1h, 8h, 24h, 7d, 30d, season, 1y, summer, winter]
windrose_default: 24h
rain_day_threshold: 0.1
image: /local/thor/haus.png
image_rotation: -25
image_opacity: 0.55
```

### Sensoren

| Option | Beschreibung |
|---|---|
| `outdoor_temp_entity` | Außentemperatur (°C oder °F) |
| `feels_like_entity` | Gefühlte Temperatur – *optional, sonst berechnet* |
| `indoor_temp_entity` | Innentemperatur |
| `dew_point_entity` | Taupunkt – *optional, sonst berechnet* |
| `humidity_entity` / `indoor_humidity_entity` | Relative Luftfeuchte außen / innen |
| `pressure_entity` | **Relativer** Luftdruck (auf Meereshöhe) in hPa |
| `wind_speed_entity` / `wind_gust_entity` | Windgeschwindigkeit / Böen (km/h, m/s, kn, mph – wird automatisch umgerechnet) |
| `wind_direction_entity` | Grad 0–360 **oder** Himmelsrichtung als Text (N, NNO, NO …) |
| `rain_rate_entity` | Regenrate (mm/h) |
| `rain_total_entity` | Fortlaufender Regen-Zähler (`state_class: total_increasing`) – **empfohlen** |
| `rain_today_entity` | Täglich zurückgesetzter Regen-Sensor – nur wenn es keinen Gesamt-Zähler gibt |
| `rain_state_entity` | Optional `binary_sensor` oder Text-Sensor („Regen“/„kein Regen“); sonst zählt Regenrate > 0 |
| `rain_event_entity` | Regen des aktuellen Ereignisses („Event Rain“) |
| `rain_week_entity`, `rain_month_entity`, `rain_year_entity` | Summen der Station – haben Vorrang vor der Berechnung |
| `wind_dir_avg_hour/day/month/year_entity`, `wind_speed_avg_hour/day/month/year_entity` | Fertige Wind-Mittelwerte der Station – ersetzen die berechneten Mittel (sinnvoll, wenn die Richtung nur als Text wie „N“ vorliegt) |
| `uv_entity` | UV-Index |
| `radiation_entity` | Sonnenstrahlung in W/m² (ein Lux-Sensor geht auch, genähert) |
| `illuminance_entity` | Helligkeit in lx – optional, zusätzlich angezeigt / als Ersatz |
| `sun_entity` | `sun.sun` – nur genutzt, wenn Home Assistant keinen Standort hat |

### Optionen

| Option | Standard | Beschreibung |
|---|---|---|
| `layout` | `tabs` | `tabs` (Reiter) oder `stack` (alles untereinander) |
| `tabs` | `[now, forecast, sun, pollen, wind, rain, year, climate, air, home]` | Welche Reiter/Abschnitte in welcher Reihenfolge |
| `default_tab` | `now` | Start-Reiter |
| `show_hero`, `show_gauges`, `show_temps`, `show_uv`, `show_compass`, `show_wind_averages`, `show_windrose`, `show_wind_values`, `show_gust_chart`, `show_sun_arc`, `show_sun_uv`, `show_radiation`, `show_sun_chart`, `show_rain`, `show_rain_chart`, `show_climate_days`, `show_climate_chart` | `true` | Einzelne Bereiche ein-/ausblenden |
| `minmax_mode` | `24h` | Min/Max über die letzten 24 h oder `today` (seit Mitternacht) |
| `wind_unit` | `auto` | `auto`, `km/h`, `m/s`, `kn`, `mph`, `bft` |
| `windrose_periods` | `[today, 1h, 8h, 24h, 7d, 30d, season, 1y, summer, winter]` | Zeitraum-Knöpfe der Windrose |
| `wind_chart_periods` | `[today, 8h, 24h, 3d, 7d, 30d, season, 1y]` | Zeitraum-Knöpfe von Wind & Böen |
| `rain_periods` / `sun_periods` | `[7d, 14d, 30d, season, 1y, summer, winter]` | Zeitraum-Knöpfe von Niederschlag / Sonnenstunden |
| `windrose_default`, `wind_chart_default`, `rain_default`, `sun_default` | `24h`, `24h`, `14d`, `14d` | Start-Zeitraum (die letzte Auswahl merkt sich der Browser) |
| `show_season`, `show_season_chip`, `show_bft_scale` | `true` | Jahreszeit (Reiter Jahr), Jahreszeit in der Übersicht, Beaufort-Säulen |
| `season_type` | `meteo` | Vorrangige Jahreszeit: `meteo` (1. März, 1. Juni …) oder `astro` (Tagundnachtgleiche/Sonnenwende) |
| `climate_years` | `10` | Jahre Langzeitstatistik für Rekorde, Klimastreifen, Kalender (2–30) |
| `show_records`, `show_stripes`, `show_calendar`, `show_vegetation`, `show_degree_days`, `show_indoor_climate`, `show_water_balance`, `show_night_frost`, `show_bio`, `show_rain_analysis` | `true` | Auswertungen ein/aus |
| `heating_indoor` / `heating_limit` / `cooling_base` | `20` / `15` / `18` | Gradtagzahl G20/15 und Kühlgradtage (°C) |
| `mold_frsi` | `0.7` | Temperaturfaktor der Wand für das Schimmelrisiko (DIN 4108-2: 0,7) |
| `pollen_entities` | auto | Pollen-Sensoren – leer = alle `sensor.pollenflug_*` (DWD Pollenflug) |
| `pollen_allergies` | | Deine Allergene – hervorgehoben, bestimmen die Gesamtbelastung |
| `pollen_scale` | `auto` | `auto`, `dwd` (0–3), `upi` (0–5), `ppm` (Pollen/m³) |
| `pollen_area` | `city` | `city` (Stadt) oder `rural` (Land) – Lüftungstipp |
| `pollen_history_days` | `30` | Tage in der Pollen-Heatmap (7–90) |
| `pollen_auto`, `pollen_show_empty`, `show_pollen`, `show_pollen_history` | `true`, `false`, `true`, `true` | Automatisch finden, Pollen ohne Flug zeigen, Bereiche |
| `weather_entity` | | Wetter-Entität, deren Vorhersage im Reiter *Prognose* erscheint |
| `forecast_model` | `zambretti` | `zambretti` oder `simple` (nur Druck + Tendenz) |
| `hemisphere` | `auto` | `auto` (aus Standort), `north`, `south` – für Zambretti |
| `forecast_hours` / `forecast_days` | `12` / `7` | Länge der stündlichen / täglichen Vorhersage |
| `show_zambretti`, `show_pressure_chart`, `show_risks`, `show_weather_forecast` | `true` | Bereiche im Reiter *Prognose* |
| `windrose_metric` | `freq` | Windrose zeigt `freq` (Häufigkeit), `speed` (Geschwindigkeit) oder `bft` (Stärke) |
| `show_moon_arc` | `true` | Mond im Bereich *Sonne & Mond* |
| `twilight` | `civil` | Dämmerung: `civil` (bürgerlich, −6°), `nautical` (nautisch, −12°), `astronomical` (astronomisch, −18°) |
| `show_rose_sun`, `show_rose_moon` | `true` | Sonne / Mond (Position und Bahn) auf der Windrose |
| `show_rose_solstices` | `true` | Sonnenbahnen am 21.6. und 21.12. |
| `show_sky_compass` | `true` | Eigener Himmelskompass im Reiter *Sonne* |
| `sky_on_compass` | `true` | Sonne & Mond auch auf dem Wind-Kompass |
| `show_rose_metric_switch`, `show_rose_now` | `true` | Umschalter in der Karte / aktueller Wind über der Rose |
| `accent_color`, `wind_color`, `gust_color`, `needle_color` | | Farben (Hex) |
| `windrose_mode` | `wind` | Windrose nach `wind` (Mittelwind) oder `gust` (Böen) |
| `skin_type` | `2` | Hauttyp I–VI (1–6) für die Sonnenbrandzeit |
| `sunshine_threshold` | `120` | Ab wie viel W/m² Sonnenschein zählt (WMO) |
| `rain_day_threshold` | `0.1` | Ab wie viel mm ein Tag als Regentag zählt |
| `pressure_offset` | `0` | hPa, die zum Messwert addiert werden (Höhenkorrektur) |
| `temp_gauge_min` / `temp_gauge_max` | `-25` / `40` | Skala des Temperatur-Instruments (°C) |
| `image`, `image_scale`, `image_rotation`, `image_opacity`, `image_clip` | | Hausbild hinter Kompass & Windrose – Norden des Bildes nach oben |
| `language` | `auto` | `auto`, `de`, `en` |
| `refresh_minutes` | `5` | Wie oft der Verlauf neu geladen wird |

### Hinweise
- **Verlauf & Statistik:** Min/Max, Verlaufskurven, Windrose sowie Stunden-/Tagesmittel kommen aus dem Recorder-Verlauf (`purge_keep_days` mindestens so groß wie der längste Windrosen-Zeitraum). Monats-/Jahresmittel, Regen je Tag, Klimatage und Klimadiagramm nutzen die **Langzeitstatistik** – die Sensoren brauchen eine `state_class` (`measurement` für Temperatur und Wind, `total_increasing` für den Regen-Zähler). Windrichtungs-Sensoren mit `state_class: measurement_angle` liefern exakte (kreisförmige) Stundenmittel.
- Eine Windrichtung als Text (N, NNO …) hat keine Langzeitstatistik: Die Windrose ab 7 Tagen braucht dann einen Grad-Sensor; die Richtungsmittel können aus den Stationssensoren kommen.
- Der Prognose-Text ist eine einfache Barometer-Faustregel (Druckniveau + 3-Stunden-Tendenz), keine Wetterdienst-Vorhersage.

## Unterstützung

Wenn dir die Karte gefällt, freue ich mich über einen Kaffee ☕

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/muhkuh666)

## Lizenz

MIT © muhkuh666
