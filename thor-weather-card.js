/**
 * Thor Weather Card – Home Assistant Lovelace Custom Card
 * Wetterstation auf einer Karte: Barometer mit Tendenz, Temperatur-Kacheln mit Min/Max,
 * Wind-Kompass mit Mittelwerten, Windrose, UV-Pyramide, Regen und Klimatage des Jahres.
 * https://github.com/muhkuh666/thor-weather-card
 */
const CARD_VERSION = "1.8.0";

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

const DEFAULTS = {
  // Sensoren – Temperatur & Luft
  outdoor_temp_entity: "",
  feels_like_entity: "",
  indoor_temp_entity: "",
  dew_point_entity: "",
  humidity_entity: "",
  indoor_humidity_entity: "",
  pressure_entity: "",
  // Wind
  wind_speed_entity: "",
  wind_gust_entity: "",
  wind_direction_entity: "",
  // Regen
  rain_rate_entity: "",
  rain_total_entity: "",
  rain_today_entity: "",
  rain_state_entity: "",
  rain_event_entity: "",
  rain_week_entity: "",
  rain_month_entity: "",
  rain_year_entity: "",
  // fertige Mittelwerte der Station (optional, haben Vorrang)
  wind_dir_avg_hour_entity: "",
  wind_dir_avg_day_entity: "",
  wind_dir_avg_month_entity: "",
  wind_dir_avg_year_entity: "",
  wind_speed_avg_hour_entity: "",
  wind_speed_avg_day_entity: "",
  wind_speed_avg_month_entity: "",
  wind_speed_avg_year_entity: "",
  // Sonne
  uv_entity: "",
  radiation_entity: "",
  illuminance_entity: "",
  sun_entity: "sun.sun",
  // Kopf & Ansicht
  title: "Thor",
  icon: "mdi:weather-lightning-rainy",
  show_header: true,
  layout: "tabs", // tabs | stack
  default_tab: "now", // now | wind | rain | year
  tabs: ["now", "forecast", "sun", "pollen", "wind", "rain", "year", "climate", "air", "home"],
  language: "auto",
  // Bereiche
  show_hero: true,
  show_gauges: true,
  show_temps: true,
  show_uv: true,
  show_compass: true,
  show_wind_averages: true,
  show_windrose: true,
  show_wind_values: true,
  show_gust_chart: true,
  windrose_mode: "wind", // wind | gust
  windrose_metric: "freq", // freq | speed | bft
  show_rose_metric_switch: true,
  show_rose_now: true,
  show_rose_sun: true,
  show_rose_moon: true,
  // Prognose
  forecast_model: "zambretti", // zambretti | simple
  hemisphere: "auto", // auto | north | south
  weather_entity: "",
  show_zambretti: true,
  show_pressure_chart: true,
  show_risks: true,
  show_weather_forecast: true,
  forecast_hours: 12,
  forecast_days: 7,
  // Farben
  accent_color: "#f5a623",
  wind_color: "#3b8fd9",
  gust_color: "#e8590c",
  needle_color: "#e8735a",
  show_sun_arc: true,
  show_sun_uv: true,
  show_radiation: true,
  show_sun_chart: true,
  show_rain: true,
  show_rain_chart: true,
  show_climate_days: true,
  show_climate_chart: true,
  // Pollen
  pollen_entities: [],
  pollen_auto: true,
  pollen_allergies: [],
  pollen_scale: "auto", // auto | dwd | upi | ppm
  pollen_show_empty: false,
  pollen_area: "city", // city | rural
  pollen_history_days: 30,
  show_pollen: true,
  show_pollen_history: true,
  // Auswertungen
  climate_years: 10,
  show_records: true,
  show_stripes: true,
  show_calendar: true,
  show_vegetation: true,
  show_degree_days: true,
  show_indoor_climate: true,
  show_water_balance: true,
  show_night_frost: true,
  show_bio: true,
  show_rain_analysis: true,
  show_season: true,
  season_type: "meteo", // meteo | astro
  show_season_chip: true,
  show_bft_scale: true,
  heating_indoor: 20,
  heating_limit: 15,
  cooling_base: 18,
  mold_frsi: 0.7,
  // Optionen
  minmax_mode: "24h", // 24h | today
  wind_unit: "auto", // auto | km/h | m/s | kn | mph | bft
  windrose_periods: ["today", "1h", "8h", "24h", "7d", "30d", "season", "1y", "summer", "winter"],
  windrose_default: "24h",
  wind_chart_periods: ["today", "8h", "24h", "3d", "7d", "30d", "season", "1y"],
  wind_chart_default: "24h",
  rain_periods: ["7d", "14d", "30d", "season", "1y", "summer", "winter"],
  rain_default: "14d",
  sun_periods: ["7d", "14d", "30d", "season", "1y", "summer", "winter"],
  sun_default: "14d",
  skin_type: 2,
  sunshine_threshold: 120,
  rain_day_threshold: 0.1,
  pressure_offset: 0,
  temp_gauge_min: -25,
  temp_gauge_max: 40,
  // Hausbild (wie Helios Compass)
  image: "",
  image_scale: 0.8,
  image_rotation: 0,
  image_opacity: 0.55,
  image_clip: true,
  refresh_minutes: 5,
};

const ENTITY_KEYS = Object.keys(DEFAULTS).filter((k) => k.endsWith("_entity"));
const HIST_KEYS = ENTITY_KEYS.filter((k) => k !== "sun_entity");
const ALL_TABS = ["now", "forecast", "sun", "pollen", "wind", "rain", "year", "climate", "air", "home"];
const satVap = (T) => 6.112 * Math.exp((17.62 * T) / (243.12 + T)); // hPa
const absHum = (T, rh) => (216.7 * ((rh / 100) * satVap(T))) / (273.15 + T); // g/m³
// Pollen: DWD-Skala 0–3 in halben Stufen
const POLLEN_COLORS = ["#4caf50", "#9ccc65", "#ffeb3b", "#ffc107", "#ff9800", "#f4511e", "#c62828"];
const POLLEN_WORDS = { none: 0, keine: 0, kein: 0, "very low": 0.5, "sehr gering": 0.5, low: 1, gering: 1, niedrig: 1, moderate: 2, medium: 2, mittel: 2, "mäßig": 2, high: 3, hoch: 3, "very high": 3, "sehr hoch": 3 };
const LUX_TO_WM2 = 0.0079; // Näherung Sonnenlicht: 1 W/m² ≈ 127 lx
const MED = [200, 250, 300, 450, 600, 1000]; // minimale Erythemdosis J/m² je Hauttyp I–VI
// Zeiträume wie bei der Helios Compass Card: kurz = Verlauf, ab 7 Tagen = Langzeitstatistik
const RANGES = {
  today: { today: true },
  "1h": { ms: HOUR }, "3h": { ms: 3 * HOUR }, "8h": { ms: 8 * HOUR }, "12h": { ms: 12 * HOUR }, "24h": { ms: DAY }, "3d": { ms: 3 * DAY },
  "7d": { ms: 7 * DAY, stats: true, days: 7 }, "14d": { ms: 14 * DAY, stats: true, days: 14 }, "30d": { ms: 30 * DAY, stats: true, days: 30 },
  season: { season: true, stats: true },
  "1y": { ms: 365 * DAY, stats: true, year: true },
  summer: { ms: 365 * DAY, stats: true, year: true, months: [4, 5, 6, 7, 8, 9] },
  winter: { ms: 365 * DAY, stats: true, year: true, months: [10, 11, 12, 1, 2, 3] },
};
const DAY_RANGES = ["7d", "14d", "30d", "season", "1y", "summer", "winter"];
let SEASON_SOUTH = false;

/** Meteorologische Jahreszeit: 0 Frühling, 1 Sommer, 2 Herbst, 3 Winter (Südhalbkugel vertauscht) */
function metSeason(t, south) {
  const d = new Date(t), m = d.getMonth(), y = d.getFullYear();
  const q = m >= 2 && m <= 4 ? 0 : m >= 5 && m <= 7 ? 1 : m >= 8 && m <= 10 ? 2 : 3;
  const sm = [2, 5, 8, 11][q];
  const sy = q === 3 && m < 2 ? y - 1 : y;
  const start = new Date(sy, sm, 1).getTime(), end = new Date(sy, sm + 3, 1).getTime();
  return { idx: south ? (q + 2) % 4 : q, start, end };
}

/** Tagundnachtgleichen und Sonnenwenden nach Meeus (Kap. 27), k: 0 März, 1 Juni, 2 Sept., 3 Dez. */
const SEASON_TERMS = [[485, 324.96, 1934.136], [203, 337.23, 32964.467], [199, 342.08, 20.186], [182, 27.85, 445267.112], [156, 73.14, 45036.886], [136, 171.52, 22518.443], [77, 222.54, 65928.934], [74, 296.72, 3034.906], [70, 243.58, 9037.513], [58, 119.81, 33718.147], [52, 297.17, 150.678], [50, 21.02, 2281.226], [45, 247.54, 29929.562], [44, 325.15, 31555.956], [29, 60.93, 4443.417], [18, 155.12, 67555.328], [17, 288.79, 4562.452], [16, 198.04, 62894.029], [14, 199.76, 31436.921], [12, 95.39, 14577.848], [12, 287.11, 31931.756], [12, 320.81, 34777.259], [9, 227.73, 1222.114], [8, 15.45, 16859.074]];
function seasonEvent(year, k) {
  const Y = (year - 2000) / 1000;
  const c = [[2451623.80984, 365242.37404, 0.05169, -0.00411, -0.00057], [2451716.56767, 365241.62603, 0.00325, 0.00888, -0.0003], [2451810.21715, 365242.01767, -0.11575, 0.00337, 0.00078], [2451900.05952, 365242.74049, -0.06223, -0.00823, 0.00032]][k];
  const jde0 = c[0] + c[1] * Y + c[2] * Y * Y + c[3] * Y ** 3 + c[4] * Y ** 4;
  const T = (jde0 - 2451545) / 36525;
  const W = 35999.373 * T - 2.47;
  const dl = 1 + 0.0334 * Math.cos(rad(W)) + 0.0007 * Math.cos(rad(2 * W));
  const S = SEASON_TERMS.reduce((a, [A, B, C]) => a + A * Math.cos(rad(B + C * T)), 0);
  const jde = jde0 + (0.00001 * S) / dl;
  return (jde - 2440587.5) * 86400000 - 69000; // TT → UTC (≈ 69 s)
}
const SEASON_ICON = ["mdi:flower-tulip", "mdi:white-balance-sunny", "mdi:leaf-maple", "mdi:snowflake"];
const SEASON_COLOR = ["#7cb342", "#f59e0b", "#d97706", "#60a5fa"];
const BFT_COLORS = ["#3d6fe0", "#4f8ff7", "#5fb4ff", "#5ad8f5", "#5ef0c8", "#5aec96", "#55e055", "#86ea4e", "#c3ec4a", "#f2ee45", "#f5c03f", "#f2873a", "#ef3b2e"];

const rangeStart = (k) => (RANGES[k]?.today ? new Date().setHours(0, 0, 0, 0) : RANGES[k]?.season ? metSeason(Date.now(), SEASON_SOUTH).start : Date.now() - (RANGES[k]?.ms || DAY));
const inMonths = (t, months) => !months || months.includes(new Date(t).getMonth() + 1);

/* ----------------------------------------------------------------- Texte */

const T = {
  de: {
    season_title: "Jahreszeit", seasons: ["Frühling", "Sommer", "Herbst", "Winter"], bft_title: "Beaufort-Skala",
    sea: { met: "meteorologisch", astro: "astronomisch", south: "Südhalbkugel", day: "Tag", until: "bis", left: "noch {n} Tage", next: "{s} beginnt", in_days: "in {n} Tagen",
      events: ["Frühlings-Tagundnachtgleiche", "Sommersonnenwende", "Herbst-Tagundnachtgleiche", "Wintersonnenwende"],
      sofar: "{s} bisher – gegen denselben Zeitraum der {n} Vorjahre", warmer: "Wärmer als üblich", colder: "Kälter als üblich", normal: "Im Rahmen des Üblichen",
      table: "Jahreszeiten im Vergleich", running: "(läuft)", anom_hint: "±K = Abweichung vom Mittel derselben Jahreszeit an deiner Station." },
    r: { today: "Heute", "1h": "1 Std.", "3h": "3 Std.", "8h": "8 Std.", "12h": "12 Std.", "24h": "24 Std.", "3d": "3 Tage", "7d": "7 Tage", "14d": "14 Tage", "30d": "30 Tage", "1y": "1 Jahr", summer: "Sommer", winter: "Winter", season: "Jahreszeit" },
    r_desc: { season: "laufende meteorologische Jahreszeit", summer: "Apr–Sep, letzte 12 Monate", winter: "Okt–Mär, letzte 12 Monate", "1y": "letzte 12 Monate" },
    wind_chart: "Wind & Böen",
    z: ["Beständig schön", "Schönes Wetter", "Wird schön", "Schön, wird unbeständiger", "Schön, vereinzelt Schauer", "Recht schön, Besserung", "Recht schön, anfangs Schauer möglich", "Recht schön, später Schauer",
      "Anfangs Schauer, dann Besserung", "Wechselhaft, Besserung", "Recht schön, Schauer wahrscheinlich", "Eher unbeständig, später aufklarend", "Unbeständig, wahrscheinlich Besserung", "Schauer mit Aufheiterungen",
      "Schauer, wird unbeständiger", "Wechselhaft, etwas Regen", "Unbeständig, kurze schöne Abschnitte", "Unbeständig, später Regen", "Unbeständig, etwas Regen", "Meist sehr unbeständig",
      "Zeitweise Regen, Verschlechterung", "Zeitweise Regen, sehr unbeständig", "Häufig Regen", "Regen, sehr unbeständig", "Stürmisch, evtl. Besserung", "Stürmisch, viel Regen"],
    fc_title: "Lokale Prognose", fc_model: "Modell", fc_next: "für die nächsten ~12 Stunden", fc_inputs: "Eingangswerte", season: "Jahreszeit", season_s: "Sommerhalbjahr", season_w: "Winterhalbjahr",
    wind_corr: "Windkorrektur", trend3h: "Tendenz 3 h", fc_need: "Für die Prognose wird ein Luftdruck-Sensor gebraucht.",
    press_chart: "Luftdruck – 24 h & Trend", press_extra: "Trend +6 h",
    risks: "Hinweise", risk: { nfrost: "Frost heute Nacht", pollen: "Pollen", fog: "Nebel", frost: "Frost / Glätte", dew: "Tau", storm: "Sturm", heat: "Hitze", uv: "UV", thunder: "Gewitterneigung", none: "Keine Auffälligkeiten" },
    lvl: ["gering", "möglich", "wahrscheinlich", "hoch"],
    wx_hourly: "Stündlich", wx_daily: "Täglich", wx_from: "Vorhersage von", wx_none: "Keine Vorhersage – Wetter-Entität im Editor wählen (z. B. DWD, Met.no).",
    sm: { sun: "Sonne", moon: "Mond", el: "Höhe", lit: "beleuchtet", below: "unter dem Horizont", phases: ["Neumond", "zunehmende Sichel", "erstes Viertel", "zunehmender Mond", "Vollmond", "abnehmender Mond", "letztes Viertel", "abnehmende Sichel"] },
    rose_now: "Jetzt", rose_metric: { freq: "Häufigkeit", speed: "Geschwindigkeit", bft: "Stärke (Bft)" }, rose_avg_hint: "Ø je Richtung · Linie = Maximum · Deckkraft = Häufigkeit",
    pollen: "Pollenflug", pollen_hist: "Pollen-Verlauf", pollen_top: "Am stärksten", pollen_mine: "deine Allergene", pollen_free: "Heute und in den nächsten Tagen kein Pollenflug.",
    pollen_none: "Keine Pollen-Sensoren gefunden – z. B. die Integration „DWD Pollenflug“ (HACS) installieren oder Sensoren im Editor wählen.",
    pollen_src: "Quelle: Pollen-Sensoren (z. B. Deutscher Wetterdienst), Einschätzung aus deinen Wetterdaten.",
    pollen_lvl: ["keine", "keine bis gering", "gering", "gering bis mittel", "mittel", "mittel bis hoch", "hoch"],
    today_cap: "Heute", tomorrow: "Morgen", in2days: "Übermorgen",
    pw: { title: "Lokale Einschätzung", rain_now: "Es regnet – Regen wäscht Pollen aus der Luft, gerade weniger Belastung.", rain_today: "Heute {mm} mm Regen – die Luft ist pollenärmer.",
      humid: "Hohe Luftfeuchte – Pollen werden schwer und sinken ab.", dry_wind: "Trocken und windig – Pollen werden weit verteilt, Belastung eher höher.", wind: "Kräftiger Wind verteilt Pollen stärker.",
      cold: "Kühle Luft – Pflanzen geben wenig Pollen ab.", air_city: "Lüften in der Stadt am besten früh morgens (ca. 6–8 Uhr).", air_rural: "Lüften auf dem Land am besten abends (ca. 19–24 Uhr).",
      trend_up: "Morgen wird es stärker.", trend_down: "Morgen wird es schwächer.", trend_same: "Morgen ähnlich wie heute." },
    rec: { title: "Rekorde & Extreme", since: "Messung seit", tmax: "Höchste Temperatur", tmin: "Tiefste Temperatur", warm_day: "Wärmster Tag (Ø)", cold_day: "Kältester Tag (Ø)", wet_day: "Nassester Tag", wet_month: "Nassester Monat",
      gust: "Stärkste Böe", p_hi: "Höchster Luftdruck", p_lo: "Tiefster Luftdruck", sun_day: "Sonnigster Tag", this_day: "Dieser Tag in früheren Jahren:", year1: "Jahr", years: "Jahre", day_hi: "Rekordhoch", day_lo: "Rekordtief", today: "Heute",
      new_hi: "Neuer Tagesrekord – so warm war es an diesem Tag noch nie!", new_lo: "Neuer Tagesrekord – so kalt war es an diesem Tag noch nie!", months: "Monatsrekorde", rain_day_s: "Regen/Tag mm" },
    stripes: { title: "Klimastreifen & Jahresvergleich", hint: "Jeder Streifen ein Monat: blau = kälter, rot = wärmer als der Durchschnitt dieses Monats an deiner Station", vs: "ggü. Ø der Vorjahre",
      cmp: "Jahre im Vergleich", ytd: "Bis heute (gleicher Zeitraum)", full: "Ganzes Jahr", partial: "unvollständiges Jahr (Messbeginn oder Lücken)" },
    cal: { title: "Kalender", temp: "Temperatur", sun: "Sonne" },
    veg: { title: "Vegetation & Garten", hint: "nach DWD", gts: "Grünlandtemperatur\u00adsumme", start: "Vegetationsbeginn", not_yet: "noch nicht", days_vs: "T. ggü. Vj.", last_frost: "Letzter Frost (Frühjahr)", first_frost: "Erster Frost (Herbst)",
      frost_free: "Frostfreie Zeit", gdd: "Wachstumsgradtage (>5 °C)", d: "Tage", curve: "Grünlandtemperatursumme bis Mai" },
    dd: { title: "Heiz- & Kühlgradtage", g: "Gradtagzahl", vs_prev: "ggü. Vorjahr bis heute", heat_days: "Heiztage", cdd: "Kühlgradtage", season: "Heizperiode ab 1. Juli", prev: "Vorjahr",
      less: "Das Wetter hat bisher {p} % weniger Heizbedarf verursacht als im Vorjahr.", more: "Das Wetter hat bisher {p} % mehr Heizbedarf verursacht als im Vorjahr.",
      hint: "Gradtagzahl G{ti}/{tb} nach VDI 3807: Summe (Innentemperatur − Tagesmittel) an Tagen unter {tb} °C. Wetterbereinigter Vergleich für deinen Verbrauch." },
    air: { title: "Lüften & Schimmelrisiko", need: "Dafür werden Innentemperatur und Luftfeuchte innen gebraucht.", v_dry: "Jetzt lüften lohnt sich – Außenluft ist {d} g/m³ trockener", v_some: "Lüften trocknet etwas", v_wet: "Lieber nicht lüften – Außenluft bringt {d} g/m³ mehr Feuchte", v_none: "Lüften ändert die Feuchte kaum", v_unknown: "Außenwerte fehlen",
      after: "Außenluft hätte drinnen etwa {rh} % relative Feuchte.", ah_in: "Abs. Feuchte innen", ah_out: "Abs. Feuchte außen", dew_in: "Taupunkt innen", wall: "Kälteste Wandstelle", mold: "Schimmelrisiko", comfort: "Behaglichkeit", cf: ["behaglich", "noch behaglich", "unbehaglich"],
      hint: "Wandtemperatur geschätzt mit Temperaturfaktor fRsi = {f} (DIN 4108-2). Ab 80 % Feuchte an der Wand kann Schimmel wachsen." },
    wb: { title: "Garten-Wasserbilanz", no_need: "Kein Gießen nötig", water: "Gießen empfohlen: etwa {l} l/m²", rain_coming: "Trocken, aber {mm} mm Regen sind angesagt – abwarten", winter: "Defizit, aber Winterhalbjahr – Gießen meist unnötig",
      basis: "Bilanz 7 Tage {b} mm (Verdunstung {et} mm)", bal: "Bilanz", fc: "Regen angesagt (2 Tage)", et: "Verdunstung ET₀", cum: "Bilanz kumuliert" },
    nf: { title: "Nachtfrost", method: "Taupunkt-Methode", est: "Tiefstwert 2 m", ground: "Bodennähe", sky: "Himmel nachts", clear: "klar", calm: "schwach", windy: "windig", model: "Vorhersage (Tiefst)", last: "Letzte Nacht",
      lvl: ["Kein Frost erwartet", "Bodenfrost möglich", "Frost erwartet", "Strenger Frost erwartet"], car: "Autoscheiben morgens wahrscheinlich gefroren", plants: "Empfindliche Pflanzen schützen", pipes: "Außenleitungen und Gartenwasser entleeren", ice: "Glätte möglich – nasse Flächen frieren" },
    bio: { short: ["keine", "gering", "mäßig", "stark"], title: "Biowetter", lvl: ["kaum Einfluss", "geringe Belastung", "mäßige Belastung", "starke Belastung"], c_circ: "Kreislauf", c_head: "Kopfschmerz", c_resp: "Atemwege", c_joint: "Gelenke",
      f_press: "Luftdruck {d} hPa in 24 h", f_temp: "Temperatursprung {d} K zum Vortag", f_heat: "Wärmebelastung", f_sultry: "Schwüle", f_cold: "Kältereiz", f_damp: "Nasskalte Luft",
      calm: "Ruhige Wetterlage ohne besondere Reize.", note: "Einschätzung nach meteorologischen Faustregeln, keine medizinische Aussage." },
    ra: { title: "Regen-Analyse", dwd: "Starkregen nach DWD-Schwellen", dry_now: "Trocken seit", dry_max: "Längste Trockenzeit", wet_max: "Längste Regenserie", until: "bis", heavy: "Starkregen", events: "Ereignisse", max1: "Max. 1 Stunde", max6: "Max. 6 Stunden",
      recent: "Letzte Regenereignisse", cls: ["", "Starkregen", "Unwetter", "extrem"], need: "Für Ereignisse wird ein Regen-Zähler (Gesamt) mit Langzeitstatistik gebraucht." },
    tabs: { now: "Jetzt", forecast: "Prognose", sun: "Sonne", pollen: "Pollen", climate: "Klima", air: "Lüften", home: "Haus & Garten", wind: "Wind", rain: "Regen", year: "Jahr" },
    sunrise: "Aufgang", sunset: "Untergang", daylength: "Tageslänge", noon: "Sonnenhöchststand", elevation: "Höhe", azimuth: "Azimut",
    vs_yesterday: "zu gestern", below_horizon: "Nacht", next_rise: "Nächster Aufgang",
    uv_curve: "UV heute", uv_dose: "UV-Dosis heute", sed: "SED", burn: "Sonnenbrand nach (ungeschützt)", skin: "Hauttyp", no_burn: "kein Risiko",
    rad_title: "Sonnenstrahlung", rad_now: "Jetzt", clear_sky: "Klarhimmel", clearness: "Klarheit", sunshine: "Sonnenschein heute", energy: "Energie heute", rad_max: "Max heute",
    sky: ["trüb", "bewölkt", "leicht bewölkt", "sonnig"],
    sun_days_title: "Sonnenstunden", sun_hours: "Sonnenstunden", day_curve: "Tagesverlauf",
    outdoor: "Außen", feels: "Gefühlt", indoor: "Innen", dew: "Taupunkt", humidity: "Luftfeuchte", indoor_hum: "Feuchte innen",
    pressure: "Luftdruck", temperature: "Temperatur", min: "Min", max: "Max", last24: "letzte 24 h", today: "heute",
    computed: "berechnet",
    baro: ["Sturm", "Regen", "wechselhaft", "schön", "trocken"],
    trend: { rise_fast: "steigt stark", rise: "steigt", rise_slow: "steigt leicht", steady: "gleichbleibend", fall_slow: "fällt leicht", fall: "fällt", fall_fast: "fällt stark" },
    fc: {
      storm: "Sturm oder Unwetter möglich", rain: "Regen wahrscheinlich", worse: "Wetter verschlechtert sich", unsettled: "Unbeständig",
      better: "Wetter bessert sich", fair: "Schönes Wetter", fine: "Beständig schön", dry: "Trocken und stabil",
    },
    in3h: "in 3 h",
    uv: "UV-Index", uv_risk: ["niedrig", "mäßig", "hoch", "sehr hoch", "extrem"],
    uv_tip: ["Kein Schutz nötig", "Mittags Schatten suchen, Sonnencreme", "Hut, Sonnenbrille, LSF 30+", "Mittags drinnen bleiben, LSF 50+", "Ungeschützt meiden – Sonnenbrand in Minuten"],
    uv_max: "Tagesmax", radiation: "Strahlung",
    wind: "Wind", gusts: "Böen", direction: "Richtung", calm: "still", beaufort: "Beaufort",
    bft: ["Windstille", "leiser Zug", "leichte Brise", "schwache Brise", "mäßige Brise", "frische Brise", "starker Wind", "steifer Wind", "stürmischer Wind", "Sturm", "schwerer Sturm", "orkanartiger Sturm", "Orkan"],
    avg: { hour: "Stunde", day: "Tag", month: "Monat", year: "Jahr" },
    avg_title: "Windrichtung – Mittel & Hauptrichtung", mean_dir: "Mittel", main_dir: "Hauptrichtung", steadiness: "Beständigkeit",
    rose: "Windrose", rose_calm: "Windstille", rose_top: "Häufigste Richtung", nodata: "Noch keine Daten",
    gust_chart: "Wind & Böen – 24 h", gustiness: "Böigkeit", gust_factor: "Böenfaktor", mean_wind: "Mittelwind", gust_peak: "Spitzenböe",
    gusty: ["gleichmäßig", "leicht böig", "böig", "stark böig"], rose_by: "Windrose nach", wind_mode: "Wind", gust_mode: "Böen",
    wind_values: "Windwerte", knots: "Knoten", gusts_kn: "Böen (Knoten)", avg_speed: "Ø Geschwindigkeit", variability: "Schwankung 10 min",
    rain: "Regen", raining: "Es regnet", dry_now: "Kein Regen", rate: "Regenrate", rain_today: "Heute", rain_24h: "24 h", rain_yesterday: "Gestern",
    rain_week: "Woche", rain_event: "Regenereignis", rain_month: "Monat", rain_year: "Jahr", rain_total: "Gesamt", rain_days_title: "Niederschlag",
    days_dry: "Tage ohne Regen", day_dry: "Tag ohne Regen", intensity: ["leicht", "mäßig", "stark", "sehr stark"], last_rain: "Letzter Regen",
    climate: "Klimatage", vs_last: "zum Vorjahr",
    cd: { summer: "Sommertage", hot: "Heiße Tage", tropical: "Tropennächte", frost: "Frosttage", ice: "Eistage", rain: "Regentage", sun: "Sonnenstunden" },
    cd_help: { summer: "Tmax ≥ 25 °C", hot: "Tmax ≥ 30 °C", tropical: "Tmin ≥ 20 °C", frost: "Tmin < 0 °C", ice: "Tmax < 0 °C", rain: "Regen ≥ {t} mm", sun: "seit 1. Januar" },
    tmax24: "Tmax 24 h", tmin24: "Tmin 24 h", year_max: "Jahreshöchstwert", year_min: "Jahrestiefstwert",
    climate_chart: "Klimadiagramm", this_year: "dieses Jahr", last_year: "Vorjahr", temp_mean: "Ø Temperatur", precip: "Niederschlag",
    months: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
    no_stats: "Keine Langzeitstatistik – der Sensor braucht eine state_class.",
    no_dir_stats: "Keine Langzeitstatistik der Windrichtung – dafür ist ein Sensor in Grad mit state_class nötig (Text wie „N“ reicht nur bis 3 Tage).",
    missing: "Bitte mindestens einen Sensor im Karten-Editor wählen.",
    loading: "Lade Verlauf …", ago: "vor {n}",
  },
  en: {
    season_title: "Season", seasons: ["Spring", "Summer", "Autumn", "Winter"], bft_title: "Beaufort scale",
    sea: { met: "meteorological", astro: "astronomical", south: "southern hemisphere", day: "day", until: "until", left: "{n} days left", next: "{s} starts", in_days: "in {n} days",
      events: ["March equinox", "June solstice", "September equinox", "December solstice"],
      sofar: "{s} so far – vs. the same period of {n} earlier years", warmer: "Warmer than usual", colder: "Colder than usual", normal: "Within the usual range",
      table: "Seasons compared", running: "(running)", anom_hint: "±K = deviation from the mean of the same season at your station." },
    r: { today: "Today", "1h": "1 hr", "3h": "3 hrs", "8h": "8 hrs", "12h": "12 hrs", "24h": "24 hrs", "3d": "3 days", "7d": "7 days", "14d": "14 days", "30d": "30 days", "1y": "1 year", summer: "Summer", winter: "Winter", season: "Season" },
    r_desc: { season: "current meteorological season", summer: "Apr–Sep, last 12 months", winter: "Oct–Mar, last 12 months", "1y": "last 12 months" },
    wind_chart: "Wind & gusts",
    z: ["Settled fine", "Fine weather", "Becoming fine", "Fine, becoming less settled", "Fine, possible showers", "Fairly fine, improving", "Fairly fine, possible showers early", "Fairly fine, showery later",
      "Showery early, improving", "Changeable, mending", "Fairly fine, showers likely", "Rather unsettled, clearing later", "Unsettled, probably improving", "Showery, bright intervals",
      "Showery, becoming less settled", "Changeable, some rain", "Unsettled, short fine intervals", "Unsettled, rain later", "Unsettled, some rain", "Mostly very unsettled",
      "Occasional rain, worsening", "Rain at times, very unsettled", "Rain at frequent intervals", "Rain, very unsettled", "Stormy, may improve", "Stormy, much rain"],
    fc_title: "Local forecast", fc_model: "Model", fc_next: "for the next ~12 hours", fc_inputs: "Inputs", season: "Season", season_s: "summer half", season_w: "winter half",
    wind_corr: "Wind correction", trend3h: "Trend 3 h", fc_need: "The forecast needs a pressure sensor.",
    press_chart: "Pressure – 24 h & trend", press_extra: "trend +6 h",
    risks: "Alerts", risk: { nfrost: "Frost tonight", pollen: "Pollen", fog: "Fog", frost: "Frost / ice", dew: "Dew", storm: "Storm", heat: "Heat", uv: "UV", thunder: "Thunderstorm tendency", none: "Nothing notable" },
    lvl: ["low", "possible", "likely", "high"],
    wx_hourly: "Hourly", wx_daily: "Daily", wx_from: "Forecast from", wx_none: "No forecast – pick a weather entity in the editor (e.g. Met.no).",
    sm: { sun: "Sun", moon: "Moon", el: "elevation", lit: "lit", below: "below the horizon", phases: ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"] },
    rose_now: "Now", rose_metric: { freq: "Frequency", speed: "Speed", bft: "Force (Bft)" }, rose_avg_hint: "Ø per direction · line = maximum · opacity = frequency",
    pollen: "Pollen", pollen_hist: "Pollen history", pollen_top: "Strongest", pollen_mine: "your allergens", pollen_free: "No pollen today or in the next days.",
    pollen_none: "No pollen sensors found – e.g. install the \"DWD Pollenflug\" integration (HACS) or pick sensors in the editor.",
    pollen_src: "Source: pollen sensors (e.g. German Weather Service), assessment from your weather data.",
    pollen_lvl: ["none", "none to low", "low", "low to moderate", "moderate", "moderate to high", "high"],
    today_cap: "Today", tomorrow: "Tomorrow", in2days: "Day after",
    pw: { title: "Local assessment", rain_now: "It is raining – rain washes pollen out of the air, lower exposure right now.", rain_today: "{mm} mm of rain today – the air holds less pollen.",
      humid: "High humidity – pollen gets heavy and settles.", dry_wind: "Dry and windy – pollen spreads widely, exposure rather higher.", wind: "Strong wind spreads pollen further.",
      cold: "Cool air – plants release little pollen.", air_city: "In town, air rooms early in the morning (about 6–8 am).", air_rural: "In the countryside, air rooms in the evening (about 7 pm–midnight).",
      trend_up: "Tomorrow gets stronger.", trend_down: "Tomorrow gets weaker.", trend_same: "Tomorrow similar to today." },
    rec: { title: "Records & extremes", since: "Data since", tmax: "Highest temperature", tmin: "Lowest temperature", warm_day: "Warmest day (Ø)", cold_day: "Coldest day (Ø)", wet_day: "Wettest day", wet_month: "Wettest month",
      gust: "Strongest gust", p_hi: "Highest pressure", p_lo: "Lowest pressure", sun_day: "Sunniest day", this_day: "This day in earlier years:", year1: "year", years: "years", day_hi: "Record high", day_lo: "Record low", today: "Today",
      new_hi: "New daily record – never this warm on this day!", new_lo: "New daily record – never this cold on this day!", months: "Monthly records", rain_day_s: "Rain/day mm" },
    stripes: { title: "Climate stripes & year comparison", hint: "Each stripe one month: blue = colder, red = warmer than the average of that month at your station", vs: "vs. Ø earlier years",
      cmp: "Years compared", ytd: "Year to date (same period)", full: "Whole year", partial: "incomplete year (start of records or gaps)" },
    cal: { title: "Calendar", temp: "Temperature", sun: "Sun" },
    veg: { title: "Vegetation & garden", hint: "per DWD", gts: "Grassland temperature sum", start: "Start of vegetation", not_yet: "not yet", days_vs: "days vs. last year", last_frost: "Last frost (spring)", first_frost: "First frost (autumn)",
      frost_free: "Frost-free period", gdd: "Growing degree days (>5 °C)", d: "days", curve: "Grassland temperature sum until May" },
    dd: { title: "Heating & cooling degree days", g: "Degree days", vs_prev: "vs. last year to date", heat_days: "Heating days", cdd: "Cooling degree days", season: "season from 1 July", prev: "last year",
      less: "So far the weather caused {p} % less heating demand than last year.", more: "So far the weather caused {p} % more heating demand than last year.",
      hint: "Degree days G{ti}/{tb} (VDI 3807): sum of (indoor temperature − daily mean) on days below {tb} °C. Weather-normalised comparison for your consumption." },
    air: { title: "Ventilation & mould risk", need: "This needs indoor temperature and indoor humidity.", v_dry: "Airing pays off now – outdoor air is {d} g/m³ drier", v_some: "Airing dries a little", v_wet: "Better not air – outdoor air adds {d} g/m³ moisture", v_none: "Airing hardly changes humidity", v_unknown: "Outdoor values missing",
      after: "Outdoor air would be about {rh} % relative humidity inside.", ah_in: "Abs. humidity in", ah_out: "Abs. humidity out", dew_in: "Dew point indoors", wall: "Coldest wall spot", mold: "Mould risk", comfort: "Comfort", cf: ["comfortable", "still comfortable", "uncomfortable"],
      hint: "Wall temperature estimated with temperature factor fRsi = {f} (DIN 4108-2). Above 80 % humidity at the wall mould can grow." },
    wb: { title: "Garden water balance", no_need: "No watering needed", water: "Watering recommended: about {l} l/m²", rain_coming: "Dry, but {mm} mm of rain is forecast – wait", winter: "Deficit, but winter half-year – watering rarely needed",
      basis: "Balance 7 days {b} mm (evaporation {et} mm)", bal: "Balance", fc: "Rain forecast (2 days)", et: "Evaporation ET₀", cum: "Cumulative balance" },
    nf: { title: "Night frost", method: "dew point method", est: "Minimum 2 m", ground: "Near ground", sky: "Sky at night", clear: "clear", calm: "light", windy: "windy", model: "Forecast (min)", last: "Last night",
      lvl: ["No frost expected", "Ground frost possible", "Frost expected", "Severe frost expected"], car: "Car windows likely frozen in the morning", plants: "Protect sensitive plants", pipes: "Drain outdoor pipes and garden water", ice: "Black ice possible – wet surfaces freeze" },
    bio: { short: ["none", "low", "moderate", "strong"], title: "Biometeorology", lvl: ["hardly any effect", "low strain", "moderate strain", "strong strain"], c_circ: "Circulation", c_head: "Headache", c_resp: "Airways", c_joint: "Joints",
      f_press: "Pressure {d} hPa in 24 h", f_temp: "Temperature jump {d} K vs. yesterday", f_heat: "Heat stress", f_sultry: "Sultriness", f_cold: "Cold stimulus", f_damp: "Cold and damp air",
      calm: "Calm weather without particular stimuli.", note: "Assessment based on meteorological rules of thumb, not medical advice." },
    ra: { title: "Rain analysis", dwd: "Heavy rain per DWD thresholds", dry_now: "Dry for", dry_max: "Longest dry spell", wet_max: "Longest wet spell", until: "until", heavy: "Heavy rain", events: "events", max1: "Max. 1 hour", max6: "Max. 6 hours",
      recent: "Recent rain events", cls: ["", "heavy rain", "severe", "extreme"], need: "Rain events need a rain counter (total) with long-term statistics." },
    tabs: { now: "Now", forecast: "Forecast", sun: "Sun", pollen: "Pollen", climate: "Climate", air: "Airing", home: "Home & garden", wind: "Wind", rain: "Rain", year: "Year" },
    sunrise: "Sunrise", sunset: "Sunset", daylength: "Day length", noon: "Solar noon", elevation: "Elevation", azimuth: "Azimuth",
    vs_yesterday: "vs. yesterday", below_horizon: "night", next_rise: "Next sunrise",
    uv_curve: "UV today", uv_dose: "UV dose today", sed: "SED", burn: "Sunburn after (unprotected)", skin: "Skin type", no_burn: "no risk",
    rad_title: "Solar radiation", rad_now: "Now", clear_sky: "Clear sky", clearness: "Clearness", sunshine: "Sunshine today", energy: "Energy today", rad_max: "Max today",
    sky: ["overcast", "cloudy", "partly cloudy", "sunny"],
    sun_days_title: "Sunshine hours", sun_hours: "Sunshine hours", day_curve: "Daily curve",
    outdoor: "Outdoor", feels: "Feels like", indoor: "Indoor", dew: "Dew point", humidity: "Humidity", indoor_hum: "Indoor humidity",
    pressure: "Pressure", temperature: "Temperature", min: "Min", max: "Max", last24: "last 24 h", today: "today",
    computed: "computed",
    baro: ["Stormy", "Rain", "Change", "Fair", "Very dry"],
    trend: { rise_fast: "rising fast", rise: "rising", rise_slow: "rising slowly", steady: "steady", fall_slow: "falling slowly", fall: "falling", fall_fast: "falling fast" },
    fc: {
      storm: "Storm or severe weather possible", rain: "Rain likely", worse: "Weather getting worse", unsettled: "Unsettled",
      better: "Weather improving", fair: "Fair weather", fine: "Settled fine weather", dry: "Dry and stable",
    },
    in3h: "in 3 h",
    uv: "UV index", uv_risk: ["low", "moderate", "high", "very high", "extreme"],
    uv_tip: ["No protection needed", "Seek shade at midday, sunscreen", "Hat, sunglasses, SPF 30+", "Stay inside at midday, SPF 50+", "Avoid being unprotected – burns in minutes"],
    uv_max: "Daily max", radiation: "Radiation",
    wind: "Wind", gusts: "Gusts", direction: "Direction", calm: "calm", beaufort: "Beaufort",
    bft: ["Calm", "Light air", "Light breeze", "Gentle breeze", "Moderate breeze", "Fresh breeze", "Strong breeze", "Near gale", "Gale", "Strong gale", "Storm", "Violent storm", "Hurricane force"],
    avg: { hour: "Hour", day: "Day", month: "Month", year: "Year" },
    avg_title: "Wind direction – mean & prevailing", mean_dir: "Mean", main_dir: "Prevailing", steadiness: "Steadiness",
    rose: "Wind rose", rose_calm: "Calm", rose_top: "Most frequent", nodata: "No data yet",
    gust_chart: "Wind & gusts – 24 h", gustiness: "Gustiness", gust_factor: "Gust factor", mean_wind: "Mean wind", gust_peak: "Peak gust",
    gusty: ["steady", "slightly gusty", "gusty", "very gusty"], rose_by: "Wind rose by", wind_mode: "Wind", gust_mode: "Gusts",
    wind_values: "Wind values", knots: "Knots", gusts_kn: "Gusts (knots)", avg_speed: "Ø speed", variability: "Variation 10 min",
    rain: "Rain", raining: "Raining", dry_now: "No rain", rate: "Rain rate", rain_today: "Today", rain_24h: "24 h", rain_yesterday: "Yesterday",
    rain_week: "Week", rain_event: "Rain event", rain_month: "Month", rain_year: "Year", rain_total: "Total", rain_days_title: "Precipitation",
    days_dry: "days without rain", day_dry: "day without rain", intensity: ["light", "moderate", "heavy", "very heavy"], last_rain: "Last rain",
    climate: "Climate days", vs_last: "vs. last year",
    cd: { summer: "Summer days", hot: "Hot days", tropical: "Tropical nights", frost: "Frost days", ice: "Ice days", rain: "Rain days", sun: "Sunshine hours" },
    cd_help: { summer: "Tmax ≥ 25 °C", hot: "Tmax ≥ 30 °C", tropical: "Tmin ≥ 20 °C", frost: "Tmin < 0 °C", ice: "Tmax < 0 °C", rain: "Rain ≥ {t} mm", sun: "since 1 January" },
    tmax24: "Tmax 24 h", tmin24: "Tmin 24 h", year_max: "Year high", year_min: "Year low",
    climate_chart: "Climate chart", this_year: "this year", last_year: "last year", temp_mean: "Ø temperature", precip: "Precipitation",
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    no_stats: "No long-term statistics – the sensor needs a state_class.",
    no_dir_stats: "No long-term statistics for wind direction – this needs a sensor in degrees with a state_class (text like \"N\" only works up to 3 days).",
    missing: "Please pick at least one sensor in the card editor.",
    loading: "Loading history …", ago: "{n} ago",
  },
};

const CARD_DE = ["N", "NNO", "NO", "ONO", "O", "OSO", "SO", "SSO", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
const CARD_EN = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
const CARD_MAP = (() => {
  const m = {};
  CARD_DE.forEach((c, i) => (m[c] = i * 22.5));
  CARD_EN.forEach((c, i) => (m[c] = i * 22.5));
  Object.assign(m, { NORTH: 0, NORD: 0, EAST: 90, OST: 90, SOUTH: 180, SÜD: 180, SUED: 180, WEST: 270 });
  return m;
})();

const BFT_KMH = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118];
const ROSE_CLASSES = [1, 6, 12, 20, 29, 39]; // km/h: Bft 1, 2, 3, 4, 5, 6+
const ROSE_COLORS = ["#7dd3fc", "#38bdf8", "#22c55e", "#eab308", "#f97316", "#dc2626"];
const UV_COLORS = ["#3ea72d", "#3ea72d", "#3ea72d", "#fff300", "#fff300", "#fff300", "#f18b00", "#f18b00", "#e53210", "#e53210", "#e53210", "#b567a4"];
const SPEED_TO_KMH = { "km/h": 1, kmh: 1, "m/s": 3.6, ms: 3.6, kn: 1.852, kt: 1.852, knots: 1.852, mph: 1.609344, "ft/s": 1.09728 };

/* --------------------------------------------------------------- Helfer */

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const num = (v) => {
  if (v === null || v === undefined || v === "") return NaN;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};
const ok = Number.isFinite;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rad = (d) => (d * Math.PI) / 180;
const norm360 = (d) => ((d % 360) + 360) % 360;
const pt = (cx, cy, r, deg) => [cx + r * Math.sin(rad(deg)), cy - r * Math.cos(rad(deg))];
const f1 = (n) => Math.round(n * 10) / 10;

function arcPath(cx, cy, r, a0, a1) {
  const [x0, y0] = pt(cx, cy, r, a0);
  const [x1, y1] = pt(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${large} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`;
}

function wedge(cx, cy, r0, r1, a0, a1) {
  const [x0, y0] = pt(cx, cy, r1, a0);
  const [x1, y1] = pt(cx, cy, r1, a1);
  const [x2, y2] = pt(cx, cy, r0, a1);
  const [x3, y3] = pt(cx, cy, r0, a0);
  return `M${x0.toFixed(2)},${y0.toFixed(2)} A${r1},${r1} 0 0 1 ${x1.toFixed(2)},${y1.toFixed(2)} L${x2.toFixed(2)},${y2.toFixed(2)} A${r0},${r0} 0 0 0 ${x3.toFixed(2)},${y3.toFixed(2)} Z`;
}

function parseDir(v) {
  const n = num(v);
  if (ok(n)) return norm360(n);
  if (typeof v !== "string") return NaN;
  const k = v.trim().toUpperCase();
  return k in CARD_MAP ? CARD_MAP[k] : NaN;
}

function beaufort(kmh) {
  if (!ok(kmh)) return NaN;
  const i = BFT_KMH.findIndex((l) => kmh < l);
  return i === -1 ? 12 : i;
}

function tempColor(c) {
  const stops = [[-15, [106, 90, 205]], [-5, [59, 130, 246]], [2, [96, 165, 250]], [10, [52, 211, 153]], [18, [163, 230, 53]], [24, [251, 191, 36]], [30, [249, 115, 22]], [36, [220, 38, 38]]];
  if (!ok(c)) return "#888";
  if (c <= stops[0][0]) return `rgb(${stops[0][1]})`;
  for (let i = 1; i < stops.length; i++) {
    if (c <= stops[i][0]) {
      const [t0, a] = stops[i - 1];
      const [t1, b] = stops[i];
      const f = (c - t0) / (t1 - t0);
      return `rgb(${a.map((x, j) => Math.round(x + (b[j] - x) * f)).join(",")})`;
    }
  }
  return `rgb(${stops[stops.length - 1][1]})`;
}

function dewPointC(t, rh) {
  if (!ok(t) || !ok(rh) || rh <= 0) return NaN;
  const a = 17.62, b = 243.12;
  const g = Math.log(rh / 100) + (a * t) / (b + t);
  return (b * g) / (a - g);
}

function feelsLikeC(t, rh, kmh) {
  if (!ok(t)) return NaN;
  if (t <= 10 && ok(kmh) && kmh > 4.8) {
    const v = Math.pow(kmh, 0.16);
    return 13.12 + 0.6215 * t - 11.37 * v + 0.3965 * t * v;
  }
  if (t >= 27 && ok(rh)) {
    const f = t * 1.8 + 32;
    const hi = -42.379 + 2.04901523 * f + 10.14333127 * rh - 0.22475541 * f * rh - 0.00683783 * f * f - 0.05481717 * rh * rh + 0.00122874 * f * f * rh + 0.00085282 * f * rh * rh - 0.00000199 * f * f * rh * rh;
    return (hi - 32) / 1.8;
  }
  return t;
}

/** Zeitgewichtete Statistik einer Stufenfunktion zwischen start und end */
function stepSegments(points, start, end) {
  const out = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const t0 = Math.max(p.t, start);
    const t1 = Math.min(i + 1 < points.length ? points[i + 1].t : end, end);
    if (t1 > t0 && ok(p.v)) out.push({ t0, t1, v: p.v });
  }
  return out;
}

function valueAt(points, t) {
  let lo = 0, hi = points.length - 1, res = NaN;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (points[m].t <= t) { res = points[m].v; lo = m + 1; } else hi = m - 1;
  }
  return res;
}

/** Wind auswerten: Vektormittel, Hauptrichtung, Rose */
function windStats(dirPts, spdPts, start, end) {
  const segs = stepSegments(dirPts, start, end);
  const sectors = Array.from({ length: 16 }, () => new Array(ROSE_CLASSES.length).fill(0));
  let sx = 0, sy = 0, tot = 0, calm = 0, spdSum = 0, spdW = 0;
  const ss = new Array(16).fill(0), sw = new Array(16).fill(0), smx = new Array(16).fill(NaN);
  let j = 0; // Zeiger in spdPts: erster Punkt mit t > aktueller Zeit
  for (const s of segs) {
    // Segment an Geschwindigkeits-Wechseln aufteilen
    let t = s.t0;
    while (t < s.t1) {
      while (j < spdPts.length && spdPts[j].t <= t) j++;
      const next = j < spdPts.length && spdPts[j].t < s.t1 ? spdPts[j].t : s.t1;
      const w = next - t;
      const sp = j > 0 ? spdPts[j - 1].v : NaN;
      tot += w;
      if (ok(sp)) { spdSum += sp * w; spdW += w; }
      if (ok(sp) && sp < ROSE_CLASSES[0]) calm += w;
      else {
        sx += Math.sin(rad(s.v)) * w;
        sy += Math.cos(rad(s.v)) * w;
        const sec = Math.round(s.v / 22.5) % 16;
        let cls = ok(sp) ? ROSE_CLASSES.length - 1 - [...ROSE_CLASSES].reverse().findIndex((l) => sp >= l) : 0;
        if (cls >= ROSE_CLASSES.length || cls < 0) cls = 0;
        sectors[sec][cls] += w;
        if (ok(sp)) { ss[sec] += sp * w; sw[sec] += w; smx[sec] = ok(smx[sec]) ? Math.max(smx[sec], sp) : sp; }
      }
      t = next;
    }
  }
  if (!tot) return null;
  const moving = tot - calm;
  const mean = moving > 0 ? norm360((Math.atan2(sx, sy) * 180) / Math.PI) : NaN;
  const R = moving > 0 ? Math.hypot(sx, sy) / moving : NaN;
  const secTot = sectors.map((c) => c.reduce((a, b) => a + b, 0));
  const top = secTot.indexOf(Math.max(...secTot));
  return {
    total: tot,
    calmPct: (calm / tot) * 100,
    sectors: sectors.map((c) => c.map((v) => (v / tot) * 100)),
    secPct: secTot.map((v) => (v / tot) * 100),
    mean, R, top: secTot[top] > 0 ? top : -1,
    avgSpeed: spdW ? spdSum / spdW : NaN,
    secAvg: ss.map((v, i) => (sw[i] ? v / sw[i] : NaN)), secMax: smx,
  };
}

/** Windrose aus Stundenstatistik (je Stunde Gewicht 1) */
function roseFromHourly(dirRows, spdRows, from, months) {
  const spdBy = new Map((spdRows || []).map((r) => [r.start, r.mean]));
  const sectors = Array.from({ length: 16 }, () => new Array(ROSE_CLASSES.length).fill(0));
  let sx = 0, sy = 0, tot = 0, calm = 0, moving = 0, spdSum = 0, spdN = 0;
  const ss = new Array(16).fill(0), sn = new Array(16).fill(0), smx = new Array(16).fill(NaN);
  for (const r of dirRows || []) {
    if (r.start < from || !inMonths(r.start, months) || !ok(r.mean)) continue;
    const sp = spdBy.get(r.start);
    tot++;
    if (ok(sp)) { spdSum += sp; spdN++; }
    if (ok(sp) && sp < ROSE_CLASSES[0]) { calm++; continue; }
    moving++;
    sx += Math.sin(rad(r.mean)); sy += Math.cos(rad(r.mean));
    let cls = 0;
    if (ok(sp)) for (let i = 0; i < ROSE_CLASSES.length; i++) if (sp >= ROSE_CLASSES[i]) cls = i;
    const sec = Math.round(norm360(r.mean) / 22.5) % 16;
    sectors[sec][cls]++;
    if (ok(sp)) { ss[sec] += sp; sn[sec]++; smx[sec] = ok(smx[sec]) ? Math.max(smx[sec], sp) : sp; }
  }
  if (!tot) return null;
  const secTot = sectors.map((c) => c.reduce((a, b) => a + b, 0));
  const top = secTot.indexOf(Math.max(...secTot));
  return {
    total: tot * HOUR, calmPct: (calm / tot) * 100,
    sectors: sectors.map((c) => c.map((v) => (v / tot) * 100)),
    secPct: secTot.map((v) => (v / tot) * 100),
    mean: moving ? norm360((Math.atan2(sx, sy) * 180) / Math.PI) : NaN, R: moving ? Math.hypot(sx, sy) / moving : NaN,
    top: secTot[top] > 0 ? top : -1, avgSpeed: spdN ? spdSum / spdN : NaN,
    secAvg: ss.map((v, i) => (sn[i] ? v / sn[i] : NaN)), secMax: smx,
  };
}

/** Mittel aus Stundenstatistik (für Monat/Jahr) */
function windStatsFromHourly(dirRows, spdRows) {
  const spdBy = new Map((spdRows || []).map((r) => [r.start, r.mean]));
  let sx = 0, sy = 0, n = 0, spdSum = 0, spdN = 0;
  const sec = new Array(16).fill(0);
  for (const r of dirRows || []) {
    const d = r.mean;
    if (!ok(d)) continue;
    const sp = spdBy.get(r.start);
    if (ok(sp)) { spdSum += sp; spdN++; }
    if (ok(sp) && sp < ROSE_CLASSES[0]) continue;
    sx += Math.sin(rad(d)); sy += Math.cos(rad(d)); n++;
    sec[Math.round(norm360(d) / 22.5) % 16]++;
  }
  if (!n && !spdN) return null;
  const top = sec.indexOf(Math.max(...sec));
  return { mean: n ? norm360((Math.atan2(sx, sy) * 180) / Math.PI) : NaN, R: n ? Math.hypot(sx, sy) / n : NaN, top: sec[top] ? top : -1, avgSpeed: spdN ? spdSum / spdN : NaN };
}

function minMax(points, start, end, live) {
  let mn = null, mx = null;
  const consider = (t, v) => {
    if (!ok(v) || t < start || t > end) return;
    if (!mn || v < mn.v) mn = { t, v };
    if (!mx || v > mx.v) mx = { t, v };
  };
  // Wert zu Beginn des Fensters zählt mit
  const v0 = valueAt(points, start);
  if (ok(v0)) consider(start, v0);
  for (const p of points) consider(p.t, p.v);
  if (live && ok(live.v)) consider(live.t, live.v);
  return { min: mn, max: mx };
}

/* ------------------------------------------------------------ Zambretti */

// Negretti & Zambra (1915), Umsetzung nach dem bekannten „beteljuice“-Algorithmus
const Z_WIND = { N: 6, NNE: 5, NE: 5, ENE: 2, E: -0.5, ESE: -2, SE: -5, SSE: -8.5, S: -12, SSW: -10, SW: -6, WSW: -4.5, W: -3, WNW: -0.5, NW: 1.5, NNW: 3 };
const Z_RISE = [25, 25, 25, 24, 24, 19, 16, 12, 11, 9, 8, 6, 5, 2, 1, 1, 0, 0, 0, 0, 0, 0];
const Z_STEADY = [25, 25, 25, 25, 25, 25, 23, 23, 22, 18, 15, 13, 10, 4, 1, 1, 0, 0, 0, 0, 0, 0];
const Z_FALL = [25, 25, 25, 25, 25, 25, 25, 25, 23, 23, 21, 20, 17, 14, 7, 3, 1, 1, 1, 0, 0, 0];
const Z_ICON = (i) => (i <= 1 ? "mdi:weather-sunny" : i <= 5 ? "mdi:weather-partly-cloudy" : i <= 14 ? "mdi:weather-partly-rainy" : i <= 21 ? "mdi:weather-rainy" : i <= 23 ? "mdi:weather-pouring" : "mdi:weather-lightning-rainy");

/** p = Luftdruck auf Meereshöhe (hPa), trend = 1 steigt, 2 fällt, 0 gleich; dir in Grad oder NaN */
function zambretti(p, trend, dir, month, south) {
  const top = 1050, bottom = 950, range = top - bottom, k = range / 22;
  let z = p;
  if (ok(dir)) {
    const d = south ? norm360(dir + 180) : dir;
    z += (Z_WIND[CARD_EN[Math.round(norm360(d) / 22.5) % 16]] / 100) * range;
  }
  const summer = south ? month >= 10 || month <= 3 : month >= 4 && month <= 9;
  if (summer) z += trend === 1 ? (7 / 100) * range : trend === 2 ? -(7 / 100) * range : 0;
  if (z >= top) z = top - 1;
  const opt = clamp(Math.floor((z - bottom) / k), 0, 21);
  const idx = (trend === 1 ? Z_RISE : trend === 2 ? Z_FALL : Z_STEADY)[opt];
  return { idx, letter: String.fromCharCode(65 + idx), opt, summer, adjusted: z };
}

const hexToRgb = (h) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(h || "").trim());
  return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : null;
};
const rgbToHex = (a) => "#" + a.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");
const COLOR_KEYS = ["accent_color", "wind_color", "gust_color", "needle_color"];
const WX_ICON = { "clear-night": "mdi:weather-night", cloudy: "mdi:weather-cloudy", exceptional: "mdi:alert-circle-outline", fog: "mdi:weather-fog", hail: "mdi:weather-hail", lightning: "mdi:weather-lightning", "lightning-rainy": "mdi:weather-lightning-rainy", partlycloudy: "mdi:weather-partly-cloudy", pouring: "mdi:weather-pouring", rainy: "mdi:weather-rainy", snowy: "mdi:weather-snowy", "snowy-rainy": "mdi:weather-snowy-rainy", sunny: "mdi:weather-sunny", windy: "mdi:weather-windy", "windy-variant": "mdi:weather-windy-variant" };

/* ------------------------------------------------------ Sonnenstand (NOAA) */

function solarParams(t) {
  const jd = t / 86400000 + 2440587.5;
  const T = (jd - 2451545) / 36525;
  const L0 = norm360(280.46646 + T * (36000.76983 + T * 0.0003032));
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C = Math.sin(rad(M)) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * T) + Math.sin(rad(3 * M)) * 0.000289;
  const lam = L0 + C - 0.00569 - 0.00478 * Math.sin(rad(125.04 - 1934.136 * T));
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(rad(125.04 - 1934.136 * T));
  const decl = (Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lam))) * 180) / Math.PI;
  const y = Math.tan(rad(eps / 2)) ** 2;
  const eqt = 4 * ((y * Math.sin(2 * rad(L0)) - 2 * e * Math.sin(rad(M)) + 4 * e * y * Math.sin(rad(M)) * Math.cos(2 * rad(L0)) - 0.5 * y * y * Math.sin(4 * rad(L0)) - 1.25 * e * e * Math.sin(2 * rad(M))) * 180) / Math.PI;
  return { decl, eqt };
}

function solarPos(t, lat, lon) {
  const { decl, eqt } = solarParams(t);
  const d = new Date(t);
  const utcMin = d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60;
  const tst = (((utcMin + eqt + 4 * lon) % 1440) + 1440) % 1440;
  const ha = tst / 4 - 180;
  const cz = Math.sin(rad(lat)) * Math.sin(rad(decl)) + Math.cos(rad(lat)) * Math.cos(rad(decl)) * Math.cos(rad(ha));
  const zen = (Math.acos(clamp(cz, -1, 1)) * 180) / Math.PI;
  let az = (Math.atan2(Math.sin(rad(ha)), Math.cos(rad(ha)) * Math.sin(rad(lat)) - Math.tan(rad(decl)) * Math.cos(rad(lat))) * 180) / Math.PI + 180;
  return { el: 90 - zen, az: norm360(az) };
}

/** Auf-/Untergang und Mittag für den lokalen Tag von t (ms) */
function sunTimes(t, lat, lon) {
  const day = new Date(t);
  day.setHours(12, 0, 0, 0);
  const { decl, eqt } = solarParams(day.getTime());
  const utc0 = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate());
  const noonMin = 720 - 4 * lon - eqt;
  const cosH = Math.cos(rad(90.833)) / (Math.cos(rad(lat)) * Math.cos(rad(decl))) - Math.tan(rad(lat)) * Math.tan(rad(decl));
  const noon = utc0 + noonMin * 60000;
  if (cosH > 1) return { noon, polar: "night" };
  if (cosH < -1) return { noon, polar: "day" };
  const H = (Math.acos(cosH) * 180) / Math.PI;
  return { noon, rise: noon - H * 4 * 60000, set: noon + H * 4 * 60000 };
}

/** Mondposition und -phase nach dem SunCalc-Verfahren (V. Agafonkin, BSD-Lizenz) */
function moonPos(t, lat, lon) {
  const R = Math.PI / 180, e = R * 23.4397;
  const d = t / 86400000 - 0.5 + 2440588 - 2451545;
  const ra = (l, b) => Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
  const dec = (l, b) => Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
  const L = R * (218.316 + 13.176396 * d), M = R * (134.963 + 13.064993 * d), F = R * (93.272 + 13.22935 * d);
  const ml = L + R * 6.289 * Math.sin(M), mb = R * 5.128 * Math.sin(F), dist = 385001 - 20905 * Math.cos(M);
  const m = { ra: ra(ml, mb), dec: dec(ml, mb) };
  const phi = R * lat, lw = R * -lon;
  const H = R * (280.16 + 360.9856235 * d) - lw - m.ra;
  let h = Math.asin(Math.sin(phi) * Math.sin(m.dec) + Math.cos(phi) * Math.cos(m.dec) * Math.cos(H));
  const hh = h < 0 ? 0 : h;
  h += 0.0002967 / Math.tan(hh + 0.00312536 / (hh + 0.08901179)); // Refraktion
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(m.dec) * Math.cos(phi));
  // Beleuchtung
  const SM = R * (357.5291 + 0.98560028 * d);
  const C = R * (1.9148 * Math.sin(SM) + 0.02 * Math.sin(2 * SM) + 0.0003 * Math.sin(3 * SM));
  const sl = SM + C + R * 102.9372 + Math.PI;
  const s = { ra: ra(sl, 0), dec: dec(sl, 0) };
  const sdist = 149598000;
  const ph = Math.acos(Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra));
  const inc = Math.atan2(sdist * Math.sin(ph), dist - sdist * Math.cos(ph));
  const ang = Math.atan2(Math.cos(s.dec) * Math.sin(s.ra - m.ra), Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra));
  return { az: norm360((az * 180) / Math.PI + 180), el: (h * 180) / Math.PI, frac: (1 + Math.cos(inc)) / 2, phase: 0.5 + (0.5 * inc * (ang < 0 ? -1 : 1)) / Math.PI };
}

/** Klarhimmel-Globalstrahlung nach Haurwitz (W/m²) */
function clearSky(el) {
  const cz = Math.sin(rad(el));
  return cz > 0.01 ? 1098 * cz * Math.exp(-0.057 / cz) : 0;
}

/* ================================================================= Karte */

class ThorWeatherCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._tab = null;
    this._sel = {};
    this._roseMode = null;
    this._roseMetric = null;
    this._fc = {};
    this._fcUnsubs = [];
    this._fcFor = null;
    this._hist = {};
    this._daily = null;
    this._hourly = null;
    this._lastFetch = 0;
    this._lastStats = 0;
    this._token = 0;
    this._loading = false;
    this._renderQueued = false;
    this._lastRender = 0;
    this._lastStates = {};
  }

  static getStubConfig(hass) {
    const ids = Object.keys(hass?.states || {});
    const pick = (...res) => {
      for (const re of res) {
        const f = ids.find((e) => re.test(e));
        if (f) return f;
      }
      return undefined;
    };
    const cfg = {
      outdoor_temp_entity: pick(/^sensor\..*(outdoor|outside|aussen|außen).*temp/i, /^sensor\..*temperature$/),
      humidity_entity: pick(/^sensor\..*(outdoor|outside|aussen).*humid/i, /^sensor\..*humidity$/),
      pressure_entity: pick(/^sensor\..*(rel|sea).*pressure/i, /^sensor\..*pressure/i, /^sensor\..*luftdruck/i),
      wind_speed_entity: pick(/^sensor\..*wind_speed$/i, /^sensor\..*windspeed/i),
      wind_gust_entity: pick(/^sensor\..*gust/i, /^sensor\..*boe/i),
      wind_direction_entity: pick(/^sensor\..*wind_dir(ection)?$/i, /^sensor\..*winddir/i),
      rain_rate_entity: pick(/^sensor\..*rain_rate/i, /^sensor\..*regenrate/i),
      rain_total_entity: pick(/^sensor\..*(total|yearly)_rain/i, /^sensor\..*rain_total/i),
      uv_entity: pick(/^sensor\..*uv(_index)?$/i),
    };
    Object.keys(cfg).forEach((k) => cfg[k] === undefined && delete cfg[k]);
    return cfg;
  }

  static getConfigElement() {
    return document.createElement("thor-weather-card-editor");
  }

  setConfig(config) {
    const c = { ...DEFAULTS, ...config };
    c.tabs = (Array.isArray(c.tabs) && c.tabs.length ? c.tabs : DEFAULTS.tabs).filter((t) => ALL_TABS.includes(t));
    if (!c.tabs.length) c.tabs = [...DEFAULTS.tabs];
    const lists = { windrose_periods: Object.keys(RANGES), wind_chart_periods: Object.keys(RANGES), rain_periods: DAY_RANGES, sun_periods: DAY_RANGES };
    for (const [k, allowed] of Object.entries(lists)) {
      // alte Angaben wie "14d" bleiben gültig
      c[k] = (Array.isArray(c[k]) && c[k].length ? c[k] : DEFAULTS[k]).filter((p) => allowed.includes(p));
      if (!c[k].length) c[k] = [...DEFAULTS[k]];
    }
    c.refresh_minutes = clamp(num(c.refresh_minutes) || 5, 1, 60);
    c.rain_day_threshold = Math.max(0, ok(num(c.rain_day_threshold)) ? num(c.rain_day_threshold) : 0.1);
    const old = this._config;
    this._config = c;
    if (!this._tab || !c.tabs.includes(this._tab) || (old && old.default_tab !== c.default_tab)) this._tab = c.tabs.includes(c.default_tab) ? c.default_tab : c.tabs[0];
    for (const [sel, list, def] of [["rose", "windrose_periods", "windrose_default"], ["wind", "wind_chart_periods", "wind_chart_default"], ["rain", "rain_periods", "rain_default"], ["sun", "sun_periods", "sun_default"]]) {
      const cur = this._sel[sel] ?? this._load(sel);
      const defChanged = old && old[def] !== c[def];
      this._sel[sel] = !defChanged && c[list].includes(cur) ? cur : c[list].includes(c[def]) ? c[def] : c[list][Math.min(2, c[list].length - 1)];
    }
    if (!this._roseMode || (old && old.windrose_mode !== c.windrose_mode)) this._roseMode = c.windrose_mode === "gust" ? "gust" : "wind";
    if (!this._roseMetric || (old && old.windrose_metric !== c.windrose_metric)) {
      const m = !old ? this._load("rmetric") : null;
      this._roseMetric = c.show_rose_metric_switch && ["freq", "speed", "bft"].includes(m) ? m : ["freq", "speed", "bft"].includes(c.windrose_metric) ? c.windrose_metric : "freq";
    }
    for (const k of COLOR_KEYS) if (!hexToRgb(c[k])) c[k] = DEFAULTS[k];
    for (const k of ["pollen_entities", "pollen_allergies"]) c[k] = Array.isArray(c[k]) ? c[k].filter(Boolean) : c[k] ? [c[k]] : [];
    SEASON_SOUTH = c.hemisphere === "south";
    c.climate_years = clamp(Math.round(num(c.climate_years) || 10), 2, 30);
    for (const k of ["ycmp", "calY", "calM"]) if (this._sel[k] === undefined) this._sel[k] = this._load(k);
    c.pollen_history_days = clamp(Math.round(num(c.pollen_history_days) || 30), 7, 90);
    c.forecast_hours = clamp(Math.round(num(c.forecast_hours) || 12), 4, 48);
    c.forecast_days = clamp(Math.round(num(c.forecast_days) || 7), 2, 14);
    const entChanged = !old || ENTITY_KEYS.some((k) => old[k] !== c[k]);
    if (entChanged) {
      this._hist = {};
      this._daily = null;
      this._hourly = null;
      this._lastFetch = 0;
      this._lastStats = 0;
    }
    if (this._hass && entChanged) this._fetch();
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (!this._config) return;
    this._subscribeForecast();
    if (this._config.hemisphere === "auto") SEASON_SOUTH = num(hass.config?.latitude) < 0;
    if (first) {
      this._render();
      this._fetch();
      return;
    }
    if (Date.now() - this._lastFetch > this._config.refresh_minutes * 60000) this._fetch();
    let changed = false;
    for (const k of ENTITY_KEYS) {
      const id = this._config[k];
      if (!id) continue;
      const st = hass.states[id];
      if (st !== this._lastStates[id]) {
        this._lastStates[id] = st;
        changed = true;
      }
    }
    for (const id of this._pollenIds()) {
      const st = hass.states[id];
      if (st !== this._lastStates[id]) { this._lastStates[id] = st; changed = true; }
    }
    if (changed) this._queueRender();
  }

  connectedCallback() {
    this._timer = setInterval(() => this._hass && this._config && this._fetch(), 60000 * 5);
    if (this._hass && this._config) this._subscribeForecast();
  }

  disconnectedCallback() {
    clearInterval(this._timer);
    this._unsubForecast();
  }

  _unsubForecast() {
    for (const u of this._fcUnsubs) { try { u(); } catch (e) { /* egal */ } }
    this._fcUnsubs = [];
    this._fcFor = null;
  }

  /** Vorhersage einer Wetter-Entität abonnieren (stündlich + täglich) */
  _subscribeForecast() {
    const id = this._config?.weather_entity || "";
    if (this._fcFor === id) return;
    this._unsubForecast();
    this._fcFor = id;
    this._fc = {};
    if (!id || !this._hass?.connection?.subscribeMessage) return;
    for (const type of ["hourly", "daily"]) {
      this._hass.connection
        .subscribeMessage((m) => {
          if (this._fcFor !== id) return;
          this._fc[type] = m?.forecast || [];
          this._queueRender();
        }, { type: "weather/subscribe_forecast", forecast_type: type, entity_id: id })
        .then((u) => (this._fcFor === id ? this._fcUnsubs.push(u) : u()))
        .catch(() => {});
    }
  }

  getCardSize() {
    return this._config?.layout === "stack" ? 18 : 9;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  _queueRender() {
    if (this._renderQueued) return;
    this._renderQueued = true;
    const wait = Math.max(0, 1000 - (Date.now() - this._lastRender));
    setTimeout(() => {
      this._renderQueued = false;
      this._render();
    }, wait);
  }

  /* ------------------------------------------------------------ Sprache */

  get _lang() {
    const l = this._config?.language;
    if (l === "de" || l === "en") return l;
    const h = (this._hass?.locale?.language || this._hass?.language || navigator.language || "de").toLowerCase();
    return h.startsWith("de") ? "de" : "en";
  }

  get _t() {
    return T[this._lang];
  }

  _fmt(v, d = 1) {
    if (!ok(v)) return "–";
    return new Intl.NumberFormat(this._lang === "de" ? "de-DE" : "en-US", { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: Math.abs(v) >= 10000 }).format(v);
  }

  _time(t) {
    if (!t) return "";
    return new Date(t).toLocaleTimeString(this._lang === "de" ? "de-DE" : "en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  _date(t, opts = { day: "2-digit", month: "2-digit" }) {
    return new Date(t).toLocaleDateString(this._lang === "de" ? "de-DE" : "en-GB", opts);
  }

  _cardinal(deg) {
    if (!ok(deg)) return "–";
    return (this._lang === "de" ? CARD_DE : CARD_EN)[Math.round(norm360(deg) / 22.5) % 16];
  }

  /* ------------------------------------------------------------ Zustände */

  _state(key) {
    const id = this._config[key];
    return id ? this._hass?.states?.[id] : undefined;
  }

  _unit(key) {
    return (this._state(key)?.attributes?.unit_of_measurement || "").trim();
  }

  _val(key) {
    const st = this._state(key);
    if (!st) return NaN;
    if (key === "wind_direction_entity" || key.startsWith("wind_dir_avg_")) return parseDir(st.state);
    let v = num(st.state);
    if (key === "pressure_entity" && ok(v)) v += num(this._config.pressure_offset) || 0;
    return v;
  }

  _isF(key) {
    return /F/i.test(this._unit(key));
  }

  /** Temperatur in °C (für Schwellen und Berechnungen) */
  _toC(v, key = "outdoor_temp_entity") {
    return this._isF(key) ? (v - 32) / 1.8 : v;
  }

  _fromC(v, key = "outdoor_temp_entity") {
    return this._isF(key) ? v * 1.8 + 32 : v;
  }

  _tempUnit(key = "outdoor_temp_entity") {
    return this._unit(key) || "°C";
  }

  _kmhFactor(key) {
    const u = this._unit(key).toLowerCase().replace(/\s/g, "");
    return SPEED_TO_KMH[u] ?? 1;
  }

  _kmh(key) {
    const v = this._val(key);
    return ok(v) ? v * this._kmhFactor(key) : NaN;
  }

  _rainMm(v) {
    const u = this._unit("rain_total_entity") || this._unit("rain_today_entity") || this._unit("rain_rate_entity");
    return /^in/i.test(u) ? v * 25.4 : v;
  }

  _rainUnit() {
    const u = this._unit("rain_total_entity") || this._unit("rain_today_entity") || this._unit("rain_rate_entity");
    return /^in/i.test(u) ? "in" : "mm";
  }

  /** Geschwindigkeit (km/h) in Anzeigeeinheit */
  _speed(kmh, unitOverride) {
    const c = this._config;
    let u = unitOverride || c.wind_unit;
    if (u === "auto") u = this._unit("wind_speed_entity") || "km/h";
    if (!ok(kmh)) return { v: "–", u };
    if (u === "bft") return { v: String(beaufort(kmh)), u: "Bft" };
    const f = SPEED_TO_KMH[u.toLowerCase()] ?? 1;
    const v = kmh / f;
    return { v: this._fmt(v, v < 10 ? 1 : 0), u };
  }

  /* --------------------------------------------------------- Datenabruf */

  _points(raw, key) {
    const isDir = key === "wind_direction_entity";
    const off = key === "pressure_entity" ? num(this._config.pressure_offset) || 0 : 0;
    return (raw || [])
      .map((p) => {
        const s = p.s ?? p.state;
        let v = isDir ? parseDir(s) : num(s);
        if (ok(v) && off) v += off;
        return { t: (p.lu ?? p.lc ?? Date.parse(p.last_updated || p.last_changed) / 1000) * 1000, v };
      })
      .filter((p) => ok(p.t))
      .sort((a, b) => a.t - b.t);
  }

  async _history(ids, start, end) {
    ids = [...new Set(ids.filter(Boolean))];
    if (!ids.length) return {};
    return this._hass.callWS({
      type: "history/history_during_period",
      start_time: new Date(start).toISOString(),
      end_time: new Date(end).toISOString(),
      entity_ids: ids,
      minimal_response: true,
      no_attributes: true,
      significant_changes_only: false,
    });
  }

  async _stats(ids, start, end, period, types) {
    ids = [...new Set(ids.filter(Boolean))];
    if (!ids.length) return {};
    try {
      const r = await this._hass.callWS({
        type: "recorder/statistics_during_period",
        start_time: new Date(start).toISOString(),
        end_time: new Date(end).toISOString(),
        statistic_ids: ids,
        period,
        types,
      });
      for (const id of Object.keys(r || {})) {
        r[id] = (r[id] || []).map((x) => ({ ...x, start: typeof x.start === "number" ? x.start : Date.parse(x.start) }));
      }
      return r || {};
    } catch (e) {
      return {};
    }
  }

  /** Sonne und Mond für die Windrose */
  _sunMoon() {
    const c = this._config;
    const loc = this._loc();
    const now = Date.now();
    const out = {};
    if (c.show_rose_sun) {
      const p = this._sunNow();
      if (p && ok(p.az)) out.sun = p;
    }
    if (c.show_rose_moon && loc) out.moon = moonPos(now, loc.lat, loc.lon);
    return out;
  }

  _moonIcon(cx, cy, r, m) {
    // beleuchteter Teil: Rand-Halbkreis + Terminator-Ellipse; zunehmend rechts hell (Nordhalbkugel)
    const waxing = m.phase < 0.5;
    const lightRight = this._south() ? !waxing : waxing;
    const k = m.frac;
    const rx = Math.abs(2 * k - 1) * r;
    const top = `${cx},${(cy - r).toFixed(2)}`, bot = `${cx},${(cy + r).toFixed(2)}`;
    const s1 = lightRight ? 1 : 0;
    const s2 = k > 0.5 ? s1 : 1 - s1;
    const lit = k < 0.02 ? "" : k > 0.98 ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#f1f0e6"/>` : `<path d="M${top} A${r},${r} 0 0 ${s1} ${bot} A${rx.toFixed(2)},${r} 0 0 ${s2} ${top} Z" fill="#f1f0e6"/>`;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#4b5563"/>${lit}<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#9ca3af" stroke-width=".8"/>`;
  }

  _sunMoonMarks(sm, cx, cy, rr) {
    const t = this._t;
    let s = "";
    const mark = (p, draw, label) => {
      const up = p.el >= 0;
      const [x, y] = pt(cx, cy, rr, p.az);
      const [lx, ly] = pt(cx, cy, rr - 14, p.az);
      s += `<line x1="${cx}" y1="${cy}" x2="${lx.toFixed(1)}" y2="${ly.toFixed(1)}" stroke="${label === "sun" ? "#f59e0b" : "#9ca3af"}" stroke-width="1" stroke-dasharray="2 3" opacity="${up ? 0.7 : 0.3}"/>`;
      s += `<g opacity="${up ? 1 : 0.45}"><title>${esc(label === "sun" ? t.sm.sun : t.sm.moon)} · ${Math.round(p.az)}° ${this._cardinal(p.az)} · ${esc(t.sm.el)} ${this._fmt(p.el, 1)}°${up ? "" : ` (${esc(t.sm.below)})`}</title>${draw(x, y, up)}</g>`;
    };
    if (sm.sun) mark(sm.sun, (x, y, up) => {
      let rays = "";
      for (let k = 0; k < 8; k++) { const [a1, b1] = pt(x, y, 8.5, k * 45), [a2, b2] = pt(x, y, 12, k * 45); rays += `<line x1="${a1.toFixed(1)}" y1="${b1.toFixed(1)}" x2="${a2.toFixed(1)}" y2="${b2.toFixed(1)}" stroke="#f59e0b" stroke-width="1.6" stroke-linecap="round"/>`; }
      return `${up ? rays : ""}<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.5" fill="${up ? "#fbbf24" : "none"}" stroke="#f59e0b" stroke-width="1.6" ${up ? "" : 'stroke-dasharray="2 2"'}/>`;
    }, "sun");
    if (sm.moon) mark(sm.moon, (x, y, up) => `${this._moonIcon(+x.toFixed(1), +y.toFixed(1), 7, sm.moon)}${up ? "" : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8.5" fill="none" stroke="#9ca3af" stroke-dasharray="2 2"/>`}`, "moon");
    return s;
  }

  _sunMoonLine(sm) {
    const t = this._t;
    if (!sm.sun && !sm.moon) return "";
    const part = (p, icon, name, extra) => `<span><ha-icon icon="${icon}"></ha-icon>${esc(name)} <b>${Math.round(p.az)}° ${this._cardinal(p.az)}</b> · ${esc(t.sm.el)} ${this._fmt(p.el, 1)}°${p.el < 0 ? ` <span class="muted">(${esc(t.sm.below)})</span>` : ""}${extra || ""}</span>`;
    const ph = sm.moon ? Math.round(sm.moon.phase * 8) % 8 : 0;
    return `<div class="rnow smline">
      ${sm.sun ? part(sm.sun, "mdi:white-balance-sunny", t.sm.sun) : ""}
      ${sm.moon ? part(sm.moon, ["mdi:moon-new", "mdi:moon-waxing-crescent", "mdi:moon-first-quarter", "mdi:moon-waxing-gibbous", "mdi:moon-full", "mdi:moon-waning-gibbous", "mdi:moon-last-quarter", "mdi:moon-waning-crescent"][ph], t.sm.moon, ` · ${esc(t.sm.phases[ph])} ${Math.round(sm.moon.frac * 100)} % ${esc(t.sm.lit)}`) : ""}
    </div>`;
  }

  /** Geschwindigkeit (km/h) als Zahl in Anzeigeeinheit (bei Beaufort in km/h) */
  _speedNum(kmh) {
    let u = this._config.wind_unit;
    if (u === "auto") u = this._unit("wind_speed_entity") || "km/h";
    if (u === "bft") u = "km/h";
    return kmh / (SPEED_TO_KMH[u.toLowerCase()] ?? 1);
  }

  /** Zeile mit aktuellem Wind über der Windrose */
  _roseNow() {
    const t = this._t;
    const dir = this._val("wind_direction_entity");
    const kmh = this._kmh("wind_speed_entity");
    const gust = this._kmh("wind_gust_entity");
    if (!ok(kmh) && !ok(dir)) return "";
    const s = this._speed(kmh), g = this._speed(gust);
    return `<div class="rnow">
      <span><ha-icon icon="mdi:compass-outline"></ha-icon>${esc(t.rose_now)}: <b>${ok(dir) ? this._cardinal(dir) : "–"}</b>${ok(dir) ? ` ${Math.round(dir)}°` : ""}</span>
      ${ok(kmh) ? `<span><i style="background:var(--thor-blue)"></i><b>${s.v} ${esc(s.u)}</b> · ${beaufort(kmh)} Bft · ${esc(t.bft[beaufort(kmh)])}</span>` : ""}
      ${ok(gust) ? `<span><i style="background:var(--thor-gust)"></i>${esc(t.gusts)} <b>${g.v} ${esc(g.u)}</b> · ${beaufort(gust)} Bft</span>` : ""}
    </div>`;
  }

  /** längster Zeitraum, der aus dem Roh-Verlauf kommt (Wind) */
  _rawWindMs() {
    const c = this._config;
    const lists = [...(c.show_windrose ? c.windrose_periods : []), ...(c.show_gust_chart ? c.wind_chart_periods : [])];
    return Math.max(DAY, ...lists.filter((k) => !RANGES[k].stats).map((k) => (RANGES[k].today ? DAY : RANGES[k].ms)));
  }

  _key(k) {
    return `thor-weather-card:${this._config?.title || ""}:${k}`;
  }

  _load(k) {
    try { return localStorage.getItem(this._key(k)); } catch (e) { return null; }
  }

  _save(k, v) {
    try { localStorage.setItem(this._key(k), v); } catch (e) { /* ignorieren */ }
  }

  _rangeButtons(sel, list) {
    const t = this._t;
    if (list.length < 2) return "";
    return `<div class="pbtns">${list.map((k) => `<button class="pbtn ${k === this._sel[sel] ? "on" : ""}" data-range="${sel}:${k}" ${t.r_desc[k] ? `title="${esc(t.r_desc[k])}"` : ""}>${esc(t.r[k])}</button>`).join("")}</div>`;
  }

  _rangeTitle(k) {
    const t = this._t;
    return `${t.r[k]}${t.r_desc[k] ? ` <span class="muted">(${esc(t.r_desc[k])})</span>` : ""}`;
  }

  async _fetch() {
    if (!this._hass || !this._config || this._loading) return;
    const c = this._config;
    const token = ++this._token;
    this._loading = true;
    this._lastFetch = Date.now();
    const now = Date.now();
    const midnight = new Date().setHours(0, 0, 0, 0);
    const start24 = Math.min(now - DAY - HOUR, midnight);
    try {
      const short = HIST_KEYS.filter((k) => !k.startsWith("wind_")).map((k) => c[k]);
      const windIds = [c.wind_speed_entity, c.wind_gust_entity, c.wind_direction_entity];
      const [h1, h2] = await Promise.all([
        this._history(short, start24, now),
        this._history(windIds, now - this._rawWindMs(), now),
      ]);
      if (token !== this._token) return;
      const hist = {};
      for (const k of HIST_KEYS) {
        const id = c[k];
        if (!id) continue;
        const raw = (k.startsWith("wind_") ? h2 : h1)?.[id];
        hist[k] = this._points(raw, k);
      }
      this._hist = hist;
      const pIds = c.show_pollen_history && c.tabs.includes("pollen") ? this._pollenIds() : [];
      if (pIds.length) {
        try {
          const ph = await this._history(pIds, now - c.pollen_history_days * DAY, now);
          const out = {};
          for (const id of pIds) out[id] = (ph?.[id] || []).map((p) => ({ t: (p.lu ?? p.lc ?? Date.parse(p.last_updated || p.last_changed) / 1000) * 1000, v: this._pollenLevel(p.s ?? p.state, this._hass.states[id]) })).filter((p) => ok(p.t)).sort((a, b) => a.t - b.t);
          this._pollenHist = out;
        } catch (e) { /* ohne Verlauf */ }
      }
      if (now - this._lastStats > HOUR || !this._daily) await this._fetchStats(token);
    } catch (e) {
      // Verlauf nicht verfügbar – Karte zeigt Live-Werte
      console.warn("thor-weather-card:", e);
    } finally {
      if (token === this._token) this._loading = false;
      else this._loading = false;
    }
    this._render();
  }

  async _fetchStats(token) {
    const c = this._config;
    const now = Date.now();
    const y = new Date().getFullYear();
    const startLast = new Date(y - 1, 0, 1).getTime();
    const wantLong = c.tabs.some((k) => k === "climate" || k === "home") || c.show_rain_analysis;
    const startHist = wantLong ? Math.min(startLast, new Date(y - c.climate_years + 1, 0, 1).getTime()) : startLast;
    const rainId = c.rain_total_entity || c.rain_today_entity;
    const wantClimate = c.show_climate_days || c.show_climate_chart || c.show_rain_chart || c.show_rain || wantLong;
    const wantWind = (c.show_wind_averages || c.show_windrose || c.show_gust_chart || c.show_wind_values) && (c.wind_direction_entity || c.wind_speed_entity);
    const radId = c[this._radKey()] || "";
    const wantSun = radId && (c.show_sun_chart || c.show_climate_days);
    const [tStats, rStats, wDir, wSpd, sStats, wGust] = await Promise.all([
      wantClimate && c.outdoor_temp_entity ? this._stats([c.outdoor_temp_entity], startHist, now, "day", ["min", "max", "mean"]) : {},
      wantClimate && rainId ? this._stats([rainId], startHist, now, "day", ["change", "max"]) : {},
      wantWind && c.wind_direction_entity ? this._stats([c.wind_direction_entity], now - 366 * DAY, now, "hour", ["mean"]) : {},
      wantWind && c.wind_speed_entity ? this._stats([c.wind_speed_entity], now - 366 * DAY, now, "hour", ["mean"]) : {},
      wantSun ? this._stats([radId], startLast, now, "hour", ["mean"]) : {},
      wantWind && c.wind_gust_entity ? this._stats([c.wind_gust_entity], now - 366 * DAY, now, "hour", ["max", "mean"]) : {},
    ]);
    const [xGust, xWind, xPress, xRainH] = wantLong
      ? await Promise.all([
          c.wind_gust_entity ? this._stats([c.wind_gust_entity], startHist, now, "day", ["max"]) : {},
          c.wind_speed_entity ? this._stats([c.wind_speed_entity], startHist, now, "day", ["mean", "max"]) : {},
          c.pressure_entity ? this._stats([c.pressure_entity], startHist, now, "day", ["min", "max"]) : {},
          c.show_rain_analysis && c.rain_total_entity ? this._stats([c.rain_total_entity], now - 366 * DAY, now, "hour", ["change"]) : {},
        ])
      : [{}, {}, {}, {}];
    if (token !== this._token) return;
    const po = num(c.pressure_offset) || 0;
    this._rainHourly = (xRainH[c.rain_total_entity] || []).filter((r) => ok(r.change) && r.change >= 0).map((r) => ({ start: r.start, v: this._rainMm(r.change) }));
    this._daily = {
      gust: xGust[c.wind_gust_entity] || [],
      wind: xWind[c.wind_speed_entity] || [],
      press: (xPress[c.pressure_entity] || []).map((r) => ({ start: r.start, min: ok(r.min) ? r.min + po : NaN, max: ok(r.max) ? r.max + po : NaN })),
      temp: tStats[c.outdoor_temp_entity] || [],
      rain: (rStats[rainId] || []).map((r) => ({ start: r.start, v: ok(r.change) && c.rain_total_entity ? r.change : r.max })),
    };
    const f = this._kmhFactor("wind_speed_entity");
    this._hourly = {
      dir: wDir[c.wind_direction_entity] || [],
      spd: (wSpd[c.wind_speed_entity] || []).map((r) => ({ ...r, mean: ok(r.mean) ? r.mean * f : r.mean })),
      gust: (wGust[c.wind_gust_entity] || []).map((r) => {
        const fg = this._kmhFactor("wind_gust_entity");
        const v = ok(r.max) ? r.max : r.mean;
        return { start: r.start, mean: ok(v) ? v * fg : NaN };
      }),
    };
    const rk = this._radKey();
    this._sunHourly = (sStats[radId] || []).map((r) => ({ start: r.start, w: this._radW(r.mean, rk) })).filter((r) => ok(r.w));
    this._lastStats = now;
  }

  /* ---------------------------------------------------------- Ableitungen */

  _live(key) {
    const st = this._state(key);
    if (!st) return null;
    return { t: Date.parse(st.last_updated) || Date.now(), v: this._val(key) };
  }

  _series(key) {
    return this._hist[key] || [];
  }

  _windowStart() {
    return this._config.minmax_mode === "today" ? new Date().setHours(0, 0, 0, 0) : Date.now() - DAY;
  }

  _pressureTrend() {
    const p = this._val("pressure_entity");
    const pts = this._series("pressure_entity");
    if (!ok(p) || !pts.length) return { p, d: NaN, old: NaN };
    const old = valueAt(pts, Date.now() - 3 * HOUR);
    return { p, old, d: ok(old) ? p - old : NaN };
  }

  _trendKey(d) {
    if (!ok(d)) return null;
    if (d >= 3.5) return "rise_fast";
    if (d >= 1.5) return "rise";
    if (d >= 0.5) return "rise_slow";
    if (d > -0.5) return "steady";
    if (d > -1.5) return "fall_slow";
    if (d > -3.5) return "fall";
    return "fall_fast";
  }

  _zambretti() {
    const pr = this._pressureTrend();
    if (!ok(pr.p)) return null;
    const trend = !ok(pr.d) ? 0 : pr.d >= 1.6 ? 1 : pr.d <= -1.6 ? 2 : 0;
    const loc = this._loc();
    const hemi = this._config.hemisphere;
    const south = hemi === "south" || (hemi === "auto" && loc && loc.lat < 0);
    const dir = this._val("wind_direction_entity");
    const kmh = this._kmh("wind_speed_entity");
    const useDir = ok(dir) && !(ok(kmh) && kmh < 1);
    const z = zambretti(pr.p, trend, useDir ? dir : NaN, new Date().getMonth() + 1, south);
    return { ...z, p: pr.p, d: pr.d, trend, dir: useDir ? dir : NaN, south, text: this._t.z[z.idx], icon: Z_ICON(z.idx) };
  }

  _forecast(p, d) {
    if (!ok(p)) return null;
    const k = this._trendKey(d);
    if (k === "fall_fast") return "storm";
    if (k === "fall" || k === "fall_slow") return p < 1005 ? "rain" : p < 1015 ? "worse" : "unsettled";
    if (k === "rise_fast" || k === "rise") return p > 1015 ? "fair" : "better";
    if (k === "rise_slow") return p > 1020 ? "fine" : "better";
    // gleichbleibend oder unbekannt: nach Niveau
    if (p < 990) return "rain";
    if (p < 1005) return "unsettled";
    if (p < 1020) return "fair";
    if (p < 1035) return "fine";
    return "dry";
  }

  _windStats(ms, gust = false) {
    const now = Date.now();
    const dir = this._series("wind_direction_entity").slice();
    const sk = gust && this._config.wind_gust_entity ? "wind_gust_entity" : "wind_speed_entity";
    const spd = this._series(sk).map((p) => ({ t: p.t, v: p.v * this._kmhFactor(sk) }));
    const ld = this._live("wind_direction_entity");
    if (ld && ok(ld.v) && (!dir.length || dir[dir.length - 1].t < ld.t)) dir.push(ld);
    if (!dir.length) return null;
    return windStats(dir, spd, now - ms, now);
  }

  _windHourlyStats(ms) {
    if (!this._hourly?.dir?.length) return null;
    const from = Date.now() - ms;
    return windStatsFromHourly(this._hourly.dir.filter((r) => r.start >= from), this._hourly.spd.filter((r) => r.start >= from));
  }

  _rainToday() {
    const c = this._config;
    if (c.rain_today_entity) return this._rainMm(this._val("rain_today_entity"));
    if (!c.rain_total_entity) return NaN;
    return this._rainSince(new Date().setHours(0, 0, 0, 0));
  }

  _rainSince(from) {
    const pts = this._series("rain_total_entity").slice();
    const live = this._live("rain_total_entity");
    if (live && ok(live.v)) pts.push(live);
    if (!pts.length) return NaN;
    let prev = valueAt(pts, from);
    let sum = 0;
    for (const p of pts) {
      if (p.t <= from || !ok(p.v)) continue;
      if (ok(prev) && p.v >= prev) sum += p.v - prev;
      prev = p.v;
    }
    return this._rainMm(sum);
  }

  /** Tägliche Werte: Temperatur (°C) und Regen (mm), heute live ergänzt */
  _days() {
    const d = this._daily;
    if (!d) return null;
    if (this._daysCache && this._daysCache.at === this._renderAt) return this._daysCache.v;
    const map = new Map();
    const key = (t) => new Date(t).setHours(0, 0, 0, 0);
    for (const r of d.temp) {
      const k = key(r.start);
      map.set(k, { ...(map.get(k) || {}), t: k, min: this._toC(r.min), max: this._toC(r.max), mean: this._toC(r.mean) });
    }
    for (const r of d.rain) {
      const k = key(r.start);
      map.set(k, { ...(map.get(k) || { t: k }), rain: this._rainMm(r.v) });
    }
    // heute live
    const today = key(Date.now());
    const e = map.get(today) || { t: today };
    const mm = minMax(this._series("outdoor_temp_entity"), today, Date.now(), this._live("outdoor_temp_entity"));
    if (mm.min) e.min = Math.min(ok(e.min) ? e.min : Infinity, this._toC(mm.min.v));
    if (mm.max) e.max = Math.max(ok(e.max) ? e.max : -Infinity, this._toC(mm.max.v));
    const rt = this._rainToday();
    if (ok(rt)) e.rain = rt;
    map.set(today, e);
    const v = [...map.values()].sort((a, b) => a.t - b.t);
    this._daysCache = { at: this._renderAt, v };
    return v;
  }

  _climate(days, year, until) {
    const c = this._config;
    const out = { summer: 0, hot: 0, tropical: 0, frost: 0, ice: 0, rain: 0, maxDay: null, minDay: null, hasT: false, hasR: false };
    for (const d of days) {
      const dt = new Date(d.t);
      if (dt.getFullYear() !== year) continue;
      if (until && (dt.getMonth() > until.getMonth() || (dt.getMonth() === until.getMonth() && dt.getDate() > until.getDate()))) continue;
      if (ok(d.max)) {
        out.hasT = true;
        if (d.max >= 25) out.summer++;
        if (d.max >= 30) out.hot++;
        if (d.max < 0) out.ice++;
        if (!out.maxDay || d.max > out.maxDay.v) out.maxDay = { t: d.t, v: d.max };
      }
      if (ok(d.min)) {
        if (d.min >= 20) out.tropical++;
        if (d.min < 0) out.frost++;
        if (!out.minDay || d.min < out.minDay.v) out.minDay = { t: d.t, v: d.min };
      }
      if (ok(d.rain)) {
        out.hasR = true;
        if (d.rain >= c.rain_day_threshold) out.rain++;
      }
    }
    return out;
  }

  /* ------------------------------------------------------------- Rendern */

  _render() {
    if (!this._config) return;
    this._renderAt = Date.now() + Math.random();
    this._lastRender = Date.now();
    const c = this._config;
    const t = this._t;
    const hasAny = HIST_KEYS.some((k) => c[k]);
    let body = "";
    if (!hasAny) body = `<div class="empty">${esc(t.missing)}</div>`;
    else if (c.layout === "stack") body = c.tabs.map((tab) => this._tabBody(tab)).join("");
    else body = this._tabBody(this._tab);

    const tabList = !this._hass ? c.tabs : c.tabs.filter((k) => (k !== "pollen" || this._pollenIds().length || (c.pollen_entities || []).length) && (k !== "air" || c.show_indoor_climate));
    if (this._hass && !tabList.includes(this._tab) && tabList.length) this._tab = tabList[0];
    const tabs = c.layout === "tabs" && tabList.length > 1 && hasAny
      ? `<div class="tabs" role="tablist">${tabList.map((k) => `<button class="tab ${k === this._tab ? "on" : ""}" data-tab="${k}" role="tab">${esc(t.tabs[k])}</button>`).join("")}</div>`
      : "";
    const header = c.show_header && (c.title || c.icon)
      ? `<div class="head">${c.icon ? `<ha-icon icon="${esc(c.icon)}"></ha-icon>` : ""}<span class="title">${esc(c.title)}</span>${this._loading && !this._daily ? `<span class="muted small">${esc(t.loading)}</span>` : ""}</div>`
      : "";

    const vars = `--thor-accent:${c.accent_color};--thor-blue:${c.wind_color};--thor-gust:${c.gust_color};--thor-needle:${c.needle_color};`;
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card style="${vars}">${header}${tabs}<div class="body">${body}</div></ha-card>`;
    const tb = this.shadowRoot.querySelector(".tabs"), on = tb?.querySelector(".tab.on");
    if (tb && on && (on.offsetLeft < tb.scrollLeft || on.offsetLeft + on.offsetWidth > tb.scrollLeft + tb.clientWidth)) tb.scrollLeft = on.offsetLeft - 20;
    this.shadowRoot.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => {
      this._tab = b.dataset.tab;
      this._render();
    }));
    this.shadowRoot.querySelectorAll("[data-range]").forEach((b) => b.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const [sel, val] = b.dataset.range.split(":");
      this._sel[sel] = val;
      this._save(sel, val);
      this._render();
    }));
    this.shadowRoot.querySelectorAll("[data-rmetric]").forEach((b) => b.addEventListener("click", (ev) => {
      ev.stopPropagation();
      this._roseMetric = b.dataset.rmetric;
      this._save("rmetric", this._roseMetric);
      this._render();
    }));
    this.shadowRoot.querySelectorAll("[data-rmode]").forEach((b) => b.addEventListener("click", (ev) => {
      ev.stopPropagation();
      this._roseMode = b.dataset.rmode;
      this._render();
    }));
    this.shadowRoot.querySelectorAll("[data-pollen]").forEach((el) => el.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: el.dataset.pollen }, bubbles: true, composed: true }));
    }));
    this.shadowRoot.querySelectorAll("[data-more]").forEach((el) => el.addEventListener("click", () => {
      const id = c[el.dataset.more];
      if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
    }));
  }

  _tabBody(tab) {
    const c = this._config;
    const parts = [];
    const t = this._t;
    const stacked = c.layout === "stack";
    if (tab === "now") {
      if (c.show_hero) parts.push(this._hero());
      if (c.show_gauges) parts.push(this._gauges());
      if (c.show_temps) parts.push(this._temps());
      if (c.show_uv && c.uv_entity) parts.push(this._uv());
    } else if (tab === "forecast") {
      if (c.show_zambretti) parts.push(this._zambrettiPanel());
      if (c.show_pressure_chart && c.pressure_entity) parts.push(this._pressureChart());
      if (c.show_risks) parts.push(this._risks());
      if (c.show_night_frost && c.outdoor_temp_entity) parts.push(this._nightFrost());
      if (c.show_bio) parts.push(this._bio());
      if (c.show_weather_forecast) parts.push(this._weatherForecast());
    } else if (tab === "climate") {
      if (c.show_records) parts.push(this._records());
      if (c.show_stripes) parts.push(this._stripes());
      if (c.show_calendar) parts.push(this._calendar());
    } else if (tab === "home") {
      if (c.show_vegetation && c.outdoor_temp_entity) parts.push(this._vegetation());
      if (c.show_degree_days && c.outdoor_temp_entity) parts.push(this._degreeDays());
      // ohne eigenen Reiter „Lüften“ bleibt der Abschnitt wie bisher hier
      if (c.show_indoor_climate && !c.tabs.includes("air")) parts.push(this._indoorClimate());
      if (c.show_water_balance && (c.rain_total_entity || c.rain_today_entity)) parts.push(this._waterBalance());
    } else if (tab === "air") {
      if (c.show_indoor_climate) parts.push(this._indoorClimate());
    } else if (tab === "pollen") {
      if (c.show_pollen) parts.push(this._pollen());
      if (c.show_pollen_history) parts.push(this._pollenHistory());
    } else if (tab === "sun") {
      if (c.show_sun_arc) parts.push(this._sunArc());
      if (c.show_sun_uv && c.uv_entity) parts.push(this._uvSun());
      if (c.show_radiation && this._radKey()) parts.push(this._radiation());
      if (c.show_sun_chart && this._radKey()) parts.push(this._sunChart());
    } else if (tab === "wind") {
      if (c.show_compass && c.wind_direction_entity) parts.push(this._compassBlock());
      if (c.show_bft_scale && (c.wind_speed_entity || c.wind_gust_entity)) parts.push(this._bftScale());
      if (c.show_wind_averages && c.wind_direction_entity) parts.push(this._averages());
      if (c.show_gust_chart && (c.wind_speed_entity || c.wind_gust_entity)) parts.push(this._gustChart());
      if (c.show_windrose && c.wind_direction_entity) parts.push(this._windrose());
      if (c.show_wind_values) parts.push(this._windValues());
    } else if (tab === "rain") {
      if (c.show_rain) parts.push(this._rain());
      if (c.show_rain_chart) parts.push(this._rainChart());
      if (c.show_rain_analysis) parts.push(this._rainAnalysis());
    } else if (tab === "year") {
      if (c.show_season) parts.push(this._season());
      if (c.show_climate_days) parts.push(this._climateDays());
      if (c.show_climate_chart) parts.push(this._climateChart());
    }
    const inner = parts.filter(Boolean).join("");
    if (!inner) return "";
    return stacked ? `<div class="stack-sec"><div class="sec-title">${esc(t.tabs[tab])}</div>${inner}</div>` : inner;
  }

  /* ---------------------------------------------------------------- Jetzt */

  _hero() {
    const c = this._config;
    const t = this._t;
    const T0 = this._val("outdoor_temp_entity");
    if (!ok(T0) && !c.pressure_entity) return "";
    const rh = this._val("humidity_entity");
    const kmh = this._kmh("wind_speed_entity");
    const tc = this._toC(T0);
    const feels = c.feels_like_entity ? this._val("feels_like_entity") : this._fromC(feelsLikeC(tc, rh, kmh));
    const dew = c.dew_point_entity ? this._val("dew_point_entity") : this._fromC(dewPointC(tc, rh));
    const pr = this._pressureTrend();
    const zb = c.forecast_model === "zambretti" ? this._zambretti() : null;
    const fc = this._forecast(pr.p, pr.d);
    const raining = this._isRaining();
    const tk = this._trendKey(pr.d);
    const arrow = tk ? (tk.startsWith("rise") ? (tk === "rise_slow" ? "↗" : "↑") : tk.startsWith("fall") ? (tk === "fall_slow" ? "↘" : "↓") : "→") : "";
    const icon = raining ? "mdi:weather-pouring" : zb ? zb.icon : fc === "storm" ? "mdi:weather-lightning-rainy" : fc === "rain" ? "mdi:weather-rainy" : fc === "worse" || fc === "unsettled" ? "mdi:weather-partly-cloudy" : "mdi:weather-sunny";
    const unit = this._tempUnit();
    const chips = [];
    if (ok(feels) && (c.feels_like_entity || Math.abs(feels - T0) >= 0.5)) chips.push(this._chip("mdi:thermometer-lines", t.feels, `${this._fmt(feels)} ${unit}`, c.feels_like_entity ? "feels_like_entity" : ""));
    if (ok(rh)) chips.push(this._chip("mdi:water-percent", t.humidity, `${this._fmt(rh, 0)} %`, "humidity_entity"));
    if (ok(dew)) chips.push(this._chip("mdi:water-thermometer", t.dew, `${this._fmt(dew)} ${unit}`, c.dew_point_entity ? "dew_point_entity" : ""));
    if (ok(pr.p)) chips.push(this._chip("mdi:gauge", t.pressure, `${this._fmt(pr.p, 1)} hPa ${arrow}`, "pressure_entity"));
    if (ok(kmh)) {
      const s = this._speed(kmh);
      const dir = this._val("wind_direction_entity");
      chips.push(this._chip("mdi:weather-windy", t.wind, `${ok(dir) ? this._cardinal(dir) + " " : ""}${s.v} ${s.u} · ${beaufort(kmh)} Bft`, "wind_speed_entity"));
    }
    const gk = this._kmh("wind_gust_entity");
    if (ok(gk)) {
      const s = this._speed(gk);
      chips.push(this._chip("mdi:weather-windy-variant", t.gusts, `${s.v} ${s.u} · ${beaufort(gk)} Bft`, "wind_gust_entity"));
    }
    const rt = this._rainToday();
    if (ok(rt)) chips.push(this._chip("mdi:weather-rainy", `${t.rain} ${t.today}`, `${this._fmt(rt)} ${this._rainUnit()}`, c.rain_today_entity ? "rain_today_entity" : "rain_total_entity"));
    const uv = this._val("uv_entity");
    if (ok(uv)) chips.push(this._chip("mdi:sun-wireless", t.uv, `${this._fmt(uv, 0)} · ${t.uv_risk[this._uvLevel(uv)]}`, "uv_entity"));
    if (c.show_season_chip) chips.push(this._seasonChip());
    if (c.show_pollen && c.tabs.includes("pollen")) {
      const pd = this._pollenData();
      const base = pd.some((d) => d.mine) ? pd.filter((d) => d.mine) : pd;
      const mx = base.filter((d) => ok(d.today)).sort((a, b) => b.today - a.today)[0];
      if (mx) chips.push(this._chip("mdi:flower-pollen", t.pollen, mx.today > 0 ? `${this._pollenDesc(mx.today)} · ${mx.name}` : this._pollenDesc(0)));
    }

    return `<div class="hero">
      <div class="hero-main" data-more="outdoor_temp_entity">
        <ha-icon class="hero-icon" icon="${icon}" style="color:${raining ? "#38bdf8" : ok(tc) ? tempColor(tc) : "var(--primary-color)"}"></ha-icon>
        <div>
          <div class="hero-temp">${this._fmt(T0)}<span class="u">${esc(unit)}</span></div>
          ${fc ? `<div class="hero-fc">${esc(raining ? t.raining : zb ? zb.text : t.fc[fc])}${tk ? ` <span class="muted">· ${esc(t.pressure)} ${esc(t.trend[tk])}</span>` : ""}</div>` : ""}
        </div>
      </div>
      <div class="chips">${chips.join("")}</div>
    </div>`;
  }

  _chip(icon, label, value, key) {
    return `<div class="chip" ${key ? `data-more="${key}"` : ""}><ha-icon icon="${icon}"></ha-icon><div><div class="chip-l">${esc(label)}</div><div class="chip-v">${esc(value)}</div></div></div>`;
  }

  _isRaining() {
    const st = this._state("rain_state_entity");
    if (st) {
      const s = String(st.state).toLowerCase();
      if (["on", "true", "rain", "raining", "regen", "ja", "yes"].includes(s)) return true;
      if (["off", "false", "dry", "trocken", "kein regen", "no", "nein"].includes(s)) return false;
      const n = num(s);
      if (ok(n)) return n > 0;
      return !/kein|no |dry|trocken/.test(s);
    }
    const r = this._val("rain_rate_entity");
    return ok(r) && r > 0;
  }

  _gauges() {
    const c = this._config;
    const t = this._t;
    const g = [];
    const pr = this._pressureTrend();
    if (ok(pr.p)) g.push(this._barometer(pr));
    const T0 = this._val("outdoor_temp_entity");
    if (ok(T0)) {
      const isF = this._isF("outdoor_temp_entity");
      const mn = this._fromC(num(c.temp_gauge_min));
      const mx = this._fromC(num(c.temp_gauge_max));
      const segs = [[this._fromC(0), "#5b8fd6"], [this._fromC(15), "transparent"], [this._fromC(26), "#4caf50"], [mx, "#ef7d3c"]];
      const mm = minMax(this._series("outdoor_temp_entity"), this._windowStart(), Date.now(), this._live("outdoor_temp_entity"));
      g.push(this._gauge({ key: "outdoor_temp_entity", title: `${t.temperature} ${isF ? "°F" : "°C"}`, min: mn, max: mx, value: T0, segs, step: isF ? 10 : 5, label: isF ? 20 : 10, unit: this._tempUnit(), dec: 1, range: mm.min && mm.max ? [mm.min.v, mm.max.v] : null }));
    }
    const rh = this._val("humidity_entity");
    if (ok(rh)) {
      const mm = minMax(this._series("humidity_entity"), this._windowStart(), Date.now(), this._live("humidity_entity"));
      g.push(this._gauge({ key: "humidity_entity", title: t.humidity, min: 0, max: 100, value: rh, segs: [[30, "#ef7d3c"], [40, "transparent"], [60, "#4caf50"], [70, "transparent"], [100, "#5b8fd6"]], step: 5, label: 10, unit: "%", dec: 0, range: mm.min && mm.max ? [mm.min.v, mm.max.v] : null }));
    }
    if (!g.length) return "";
    return `<div class="gauges">${g.join("")}</div>`;
  }

  _gauge({ key, title, min, max, value, segs, step, label, unit, dec, range }) {
    const cx = 100, cy = 100, r = 78;
    const A = (v) => -120 + (240 * (clamp(v, min, max) - min)) / (max - min);
    let s = "";
    let from = min;
    for (const [to, col] of segs) {
      if (col !== "transparent") s += `<path d="${arcPath(cx, cy, r - 6, A(from), A(Math.min(to, max)))}" stroke="${col}" stroke-width="12" fill="none" opacity="0.85"/>`;
      from = to;
    }
    s += `<path d="${arcPath(cx, cy, r, -120, 120)}" stroke="var(--thor-dial)" stroke-width="2" fill="none"/>`;
    if (range) s += `<path d="${arcPath(cx, cy, r + 5, A(range[0]), Math.max(A(range[1]), A(range[0]) + 0.5))}" stroke="var(--primary-color)" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>`;
    const first = Math.ceil(min / step) * step;
    for (let v = first; v <= max + 1e-9; v += step) {
      const major = Math.abs(v / label - Math.round(v / label)) < 1e-6;
      const [x0, y0] = pt(cx, cy, r, A(v));
      const [x1, y1] = pt(cx, cy, r - (major ? 12 : 6), A(v));
      s += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="var(--thor-dial)" stroke-width="${major ? 1.6 : 0.8}"/>`;
      if (major) {
        const [tx, ty] = pt(cx, cy, r - 24, A(v));
        s += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" class="gl">${Math.round(v)}</text>`;
      }
    }
    s += `<text x="${cx}" y="${cy + 30}" class="gt">${esc(title)}</text>`;
    s += this._needle(cx, cy, r - 10, A(value));
    s += `<rect x="${cx - 32}" y="${cy + 42}" width="64" height="20" rx="5" class="gbox"/><text x="${cx}" y="${cy + 52.5}" class="gv">${this._fmt(value, dec)} ${esc(unit)}</text>`;
    return `<div class="gauge" data-more="${key}"><svg viewBox="0 8 200 160">${s}</svg></div>`;
  }

  _needle(cx, cy, len, a, color = "var(--thor-needle)") {
    const [x, y] = pt(cx, cy, len, a);
    const [bx1, by1] = pt(cx, cy, 5, a - 90);
    const [bx2, by2] = pt(cx, cy, 5, a + 90);
    const [tx, ty] = pt(cx, cy, 16, a + 180);
    return `<g class="needle"><path d="M${bx1.toFixed(1)},${by1.toFixed(1)} L${x.toFixed(1)},${y.toFixed(1)} L${bx2.toFixed(1)},${by2.toFixed(1)} L${tx.toFixed(1)},${ty.toFixed(1)} Z" fill="${color}"/><circle cx="${cx}" cy="${cy}" r="9" class="hub"/><circle cx="${cx}" cy="${cy}" r="4" class="hub2"/></g>`;
  }

  _barometer(pr) {
    const t = this._t;
    const min = 950, max = 1050;
    const cx = 100, cy = 100, r = 78;
    const A = (v) => -120 + (240 * (clamp(v, min, max) - min)) / (max - min);
    const zones = [[950, 975, "#e57373"], [975, 995, "#90a4d4"], [995, 1015, "#d8d3a8"], [1015, 1035, "#9fd1b0"], [1035, 1050, "#c8e6c9"]];
    let s = zones.map(([a, b, col]) => `<path d="${arcPath(cx, cy, r - 6, A(a), A(b))}" stroke="${col}" stroke-width="12" fill="none" opacity="0.55"/>`).join("");
    s += `<path d="${arcPath(cx, cy, r, -120, 120)}" stroke="var(--thor-dial)" stroke-width="2" fill="none"/>`;
    for (let v = 950; v <= 1050; v += 5) {
      const major = v % 25 === 0;
      const [x0, y0] = pt(cx, cy, r, A(v));
      const [x1, y1] = pt(cx, cy, r - (major ? 12 : 6), A(v));
      s += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="var(--thor-dial)" stroke-width="${major ? 1.6 : 0.8}"/>`;
    }
    const words = [[962, 0], [985, 1], [1005, 2], [1025, 3], [1043, 4]];
    for (const [v, i] of words) {
      const [tx, ty] = pt(cx, cy, r - 25, A(v));
      s += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" class="gw">${esc(t.baro[i])}</text>`;
    }
    s += `<text x="${cx}" y="${cy - 24}" class="gt">${esc(t.pressure)}</text>`;
    // Schleppzeiger: Stand vor 3 h
    if (ok(pr.old)) {
      const [x0, y0] = pt(cx, cy, r + 2, A(pr.old));
      const [x1, y1] = pt(cx, cy, r - 16, A(pr.old));
      s += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#c9a227" stroke-width="3" stroke-linecap="round" opacity="0.85"><title>${esc(t.trend.steady)} – 3 h: ${this._fmt(pr.old, 1)} hPa</title></line>`;
    }
    s += this._needle(cx, cy, r - 10, A(pr.p), "url(#thor-gold)");
    const tk = this._trendKey(pr.d);
    const dTxt = ok(pr.d) ? `${pr.d > 0 ? "+" : ""}${this._fmt(pr.d, 1)} hPa / 3 h` : "";
    s += `<text x="${cx}" y="${cy + 50}" class="gv big">${this._fmt(pr.p, 1)}</text>`;
    if (dTxt) s += `<text x="${cx}" y="${cy + 64}" class="gl ${tk && tk.startsWith("fall") ? "neg" : tk && tk.startsWith("rise") ? "pos" : ""}">${esc(dTxt)}</text>`;
    const defs = `<defs><linearGradient id="thor-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4d27a"/><stop offset="0.5" stop-color="#c9971c"/><stop offset="1" stop-color="#8a6510"/></linearGradient></defs>`;
    return `<div class="gauge" data-more="pressure_entity"><svg viewBox="0 8 200 160">${defs}${s}</svg></div>`;
  }

  _temps() {
    const c = this._config;
    const t = this._t;
    const tiles = [];
    const rh = this._val("humidity_entity");
    const kmh = this._kmh("wind_speed_entity");
    const mk = (key, name, icon, valOverride, pts, computed) => {
      const live = valOverride !== undefined ? { t: Date.now(), v: valOverride } : this._live(key);
      if (!live || !ok(live.v)) return;
      const ws = this._windowStart();
      const mm = minMax(pts, ws, Date.now(), live);
      const unit = this._tempUnit(key === "humidity_entity" || key === "indoor_humidity_entity" ? key : key) || "°C";
      tiles.push(this._tile({ key: computed ? "" : key, name, icon, v: live.v, unit, mm, pts, ws, computed, isHum: /humid/.test(key) }));
    };
    if (c.outdoor_temp_entity) mk("outdoor_temp_entity", t.outdoor, "mdi:thermometer", undefined, this._series("outdoor_temp_entity"));
    if (c.feels_like_entity) mk("feels_like_entity", t.feels, "mdi:thermometer-lines", undefined, this._series("feels_like_entity"));
    else if (c.outdoor_temp_entity && (c.wind_speed_entity || c.humidity_entity)) {
      const tc = this._toC(this._val("outdoor_temp_entity"));
      const fl = this._fromC(feelsLikeC(tc, rh, kmh));
      // Verlauf berechnen (aus Temperatur + Wind/Feuchte zum jeweiligen Zeitpunkt)
      const hPts = this._series("humidity_entity");
      const wPts = this._series("wind_speed_entity").map((p) => ({ t: p.t, v: p.v * this._kmhFactor("wind_speed_entity") }));
      const pts = this._series("outdoor_temp_entity").map((p) => ({ t: p.t, v: this._fromC(feelsLikeC(this._toC(p.v), valueAt(hPts, p.t), valueAt(wPts, p.t))) }));
      mk("outdoor_temp_entity", t.feels, "mdi:thermometer-lines", fl, pts, true);
    }
    if (c.indoor_temp_entity) mk("indoor_temp_entity", t.indoor, "mdi:home-thermometer", undefined, this._series("indoor_temp_entity"));
    if (c.dew_point_entity) mk("dew_point_entity", t.dew, "mdi:water-thermometer", undefined, this._series("dew_point_entity"));
    else if (c.outdoor_temp_entity && c.humidity_entity) {
      const hPts = this._series("humidity_entity");
      const pts = this._series("outdoor_temp_entity").map((p) => ({ t: p.t, v: this._fromC(dewPointC(this._toC(p.v), valueAt(hPts, p.t))) })).filter((p) => ok(p.v));
      mk("outdoor_temp_entity", t.dew, "mdi:water-thermometer", this._fromC(dewPointC(this._toC(this._val("outdoor_temp_entity")), rh)), pts, true);
    }
    if (c.indoor_humidity_entity) mk("indoor_humidity_entity", t.indoor_hum, "mdi:water-percent", undefined, this._series("indoor_humidity_entity"));
    if (!tiles.length) return "";
    return `<div class="tiles">${tiles.join("")}</div>
      <div class="muted small center">${esc(t.min)}/${esc(t.max)}: ${esc(c.minmax_mode === "today" ? t.today : t.last24)}</div>`;
  }

  _tile({ key, name, icon, v, unit, mm, pts, ws, computed, isHum }) {
    const u = isHum ? "%" : unit;
    const col = isHum ? "#38bdf8" : tempColor(this._toC(v, key || "outdoor_temp_entity"));
    return `<div class="tile" ${key ? `data-more="${key}"` : ""}>
      <div class="tile-h"><span>${esc(name)}</span><ha-icon icon="${icon}" style="color:${col}"></ha-icon></div>
      <div class="tile-v" ${computed ? `title="${esc(this._t.computed)}"` : ""}>${computed ? `<span class="approx">≈</span>` : ""}${this._fmt(v, isHum ? 0 : 1)}<span class="u">${esc(u)}</span></div>
      <div class="mm">
        <div><div class="mm-l">${esc(this._t.min)}</div><div>${mm.min ? `${this._fmt(mm.min.v, isHum ? 0 : 1)} ${esc(u)}` : "–"}</div><div class="muted">${mm.min ? this._time(mm.min.t) : ""}</div></div>
        <div class="r"><div class="mm-l">${esc(this._t.max)}</div><div>${mm.max ? `${this._fmt(mm.max.v, isHum ? 0 : 1)} ${esc(u)}` : "–"}</div><div class="muted">${mm.max ? this._time(mm.max.t) : ""}</div></div>
      </div>
      ${this._spark(pts, ws, key, isHum, v)}
    </div>`;
  }

  _spark(pts, from, key, isHum, live) {
    const now = Date.now();
    const p = pts.filter((x) => x.t >= from && ok(x.v));
    const v0 = valueAt(pts, from);
    if (ok(v0)) p.unshift({ t: from, v: v0 });
    if (ok(live)) p.push({ t: now, v: live });
    if (p.length < 2) return `<div class="spark"></div>`;
    const W = 200, H = 38;
    let lo = Math.min(...p.map((x) => x.v)), hi = Math.max(...p.map((x) => x.v));
    if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
    const X = (t) => ((t - from) / (now - from)) * W;
    const Y = (v) => H - 2 - ((v - lo) / (hi - lo)) * (H - 6);
    let d = "";
    p.forEach((q, i) => {
      if (i) d += ` L${X(q.t).toFixed(1)},${Y(p[i - 1].v).toFixed(1)}`;
      d += `${i ? " L" : "M"}${X(q.t).toFixed(1)},${Y(q.v).toFixed(1)}`;
    });
    const id = `g${Math.random().toString(36).slice(2, 8)}`;
    let stops = "";
    if (isHum) stops = `<stop offset="0" stop-color="#38bdf8"/><stop offset="1" stop-color="#38bdf8"/>`;
    else {
      for (let i = 0; i <= 4; i++) {
        const v = hi - ((hi - lo) * i) / 4;
        stops += `<stop offset="${i / 4}" stop-color="${tempColor(this._toC(v, key || "outdoor_temp_entity"))}"/>`;
      }
    }
    const zero = !isHum && lo < this._fromC(0, key || "outdoor_temp_entity") && hi > this._fromC(0, key || "outdoor_temp_entity")
      ? `<line x1="0" x2="${W}" y1="${Y(this._fromC(0, key || "outdoor_temp_entity")).toFixed(1)}" y2="${Y(this._fromC(0, key || "outdoor_temp_entity")).toFixed(1)}" stroke="var(--secondary-text-color)" stroke-dasharray="2 3" stroke-width="0.6" opacity="0.6"/>`
      : "";
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient></defs>
      <path d="${d} L${W},${H} L0,${H} Z" fill="url(#${id})" opacity="0.35"/>
      <path d="${d}" fill="none" stroke="url(#${id})" stroke-width="1.6" vector-effect="non-scaling-stroke"/>${zero}
    </svg>`;
  }

  _uvLevel(uv) {
    if (uv < 3) return 0;
    if (uv < 6) return 1;
    if (uv < 8) return 2;
    if (uv < 11) return 3;
    return 4;
  }

  _uv() {
    const t = this._t;
    const uv = this._val("uv_entity");
    if (!ok(uv)) return "";
    const lvl = this._uvLevel(uv);
    const mm = minMax(this._series("uv_entity"), new Date().setHours(0, 0, 0, 0), Date.now(), this._live("uv_entity"));
    const rows = 12;
    let s = "";
    for (let i = 0; i < rows; i++) {
      const y = 112 - i * 9;
      const half = 78 - i * 6.2;
      const on = i === 0 || uv >= i;
      s += `<rect x="${(90 - half).toFixed(1)}" y="${y}" width="${(half * 2).toFixed(1)}" height="7" rx="1.5" fill="${on ? UV_COLORS[i] : "var(--thor-off)"}"/>`;
      if (i > 0 && i % 2 === 0) s += `<text x="${(90 + half + 6).toFixed(1)}" y="${y + 4}" class="gl" text-anchor="start">${i}</text>`;
    }
    if (mm.max && mm.max.v > uv) {
      const i = Math.min(11, Math.round(mm.max.v));
      const y = 112 - i * 9;
      const half = 78 - i * 6.2;
      s += `<rect x="${(90 - half).toFixed(1)}" y="${y}" width="${(half * 2).toFixed(1)}" height="7" rx="1.5" fill="none" stroke="${UV_COLORS[i]}" stroke-width="1.5" stroke-dasharray="3 2"/>`;
    }
    const rad = this._val("radiation_entity");
    return `<div class="panel uvp" data-more="uv_entity">
      <svg viewBox="0 0 200 124" class="pyr">${s}</svg>
      <div class="uvinfo">
        <div class="panel-t">${esc(t.uv)}</div>
        <div class="uv-v" style="color:${UV_COLORS[Math.min(11, Math.round(uv))]}">${this._fmt(uv, uv < 10 ? 1 : 0)}</div>
        <div class="uv-r">${esc(t.uv_risk[lvl])}</div>
        <div class="muted small">${esc(t.uv_tip[lvl])}</div>
        ${mm.max && mm.max.v > 0 ? `<div class="small">${esc(t.uv_max)}: <b>${this._fmt(mm.max.v, 1)}</b> <span class="muted">${this._time(mm.max.t)}</span></div>` : ""}
        ${ok(rad) ? `<div class="small" data-more="radiation_entity">${esc(t.radiation)}: <b>${this._fmt(rad, 0)}</b> ${esc(this._unit("radiation_entity"))}</div>` : ""}
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------ Prognose */

  _zambrettiPanel() {
    const t = this._t;
    const z = this._zambretti();
    if (!z) return `<div class="panel"><div class="panel-t">${esc(t.fc_title)}</div><div class="empty">${esc(t.fc_need)}</div></div>`;
    const tk = this._trendKey(z.d);
    // Skala A–Z: A = beständig schön … Z = stürmisch
    let scale = "";
    for (let i = 0; i < 26; i++) {
      const col = i <= 5 ? "#f59e0b" : i <= 14 ? "#94a3b8" : i <= 23 ? "#3b82f6" : "#7c3aed";
      scale += `<span class="zs ${i === z.idx ? "on" : ""}" style="background:${col}" title="${String.fromCharCode(65 + i)} – ${esc(t.z[i])}"></span>`;
    }
    const corr = ok(z.dir) ? Z_WIND[CARD_EN[Math.round(norm360(z.south ? z.dir + 180 : z.dir) / 22.5) % 16]] : NaN;
    const chips = [
      this._chip("mdi:gauge", t.pressure, `${this._fmt(z.p, 1)} hPa`, "pressure_entity"),
      this._chip(z.trend === 1 ? "mdi:trending-up" : z.trend === 2 ? "mdi:trending-down" : "mdi:trending-neutral", t.trend3h, ok(z.d) ? `${z.d > 0 ? "+" : ""}${this._fmt(z.d, 1)} hPa · ${t.trend[tk]}` : "–", "pressure_entity"),
      this._chip("mdi:compass-outline", t.wind_corr, ok(z.dir) ? `${this._cardinal(z.dir)} · ${corr > 0 ? "+" : ""}${this._fmt(corr, 1)} hPa` : "–", "wind_direction_entity"),
      this._chip("mdi:calendar-range", t.season, z.summer ? t.season_s : t.season_w),
    ];
    return `<div class="panel">
      <div class="panel-t row"><span>${esc(t.fc_title)}</span><span class="small muted">${esc(t.fc_model)}: Zambretti</span></div>
      <div class="zmain">
        <ha-icon icon="${z.icon}"></ha-icon>
        <div><div class="ztext">${esc(z.text)}</div><div class="small muted">${esc(t.fc_next)}</div></div>
        <div class="zletter" title="Zambretti">${z.letter}</div>
      </div>
      <div class="zscale">${scale}</div>
      <div class="zscale-l small muted"><span>A · ${esc(t.z[0])}</span><span>Z · ${esc(t.z[25])}</span></div>
      <div class="panel-t small" style="margin-top:8px">${esc(t.fc_inputs)}</div>
      <div class="chips ex">${chips.join("")}</div>
    </div>`;
  }

  _pressureChart() {
    const t = this._t;
    const now = Date.now(), from = now - DAY, to = now + 6 * HOUR;
    const pts = this._series("pressure_entity").slice();
    const live = this._val("pressure_entity");
    if (ok(live)) pts.push({ t: now, v: live });
    const seg = pts.filter((p) => p.t >= from && ok(p.v));
    const v0 = valueAt(pts, from);
    if (ok(v0)) seg.unshift({ t: from, v: v0 });
    if (seg.length < 2) return "";
    // Trend: lineare Regression der letzten 3 Stunden
    const last = seg.filter((p) => p.t >= now - 3 * HOUR);
    let slope = NaN, icpt = NaN;
    if (last.length >= 2) {
      const n = last.length, mx = last.reduce((a, p) => a + p.t, 0) / n, my = last.reduce((a, p) => a + p.v, 0) / n;
      let nu = 0, den = 0;
      for (const p of last) { nu += (p.t - mx) * (p.v - my); den += (p.t - mx) ** 2; }
      slope = den ? nu / den : 0;
      icpt = my - slope * mx;
    }
    const fut = ok(slope) ? icpt + slope * to : NaN;
    const vals = [...seg.map((p) => p.v), fut].filter(ok);
    let lo = Math.floor(Math.min(...vals) - 1), hi = Math.ceil(Math.max(...vals) + 1);
    if (hi - lo < 6) { const m = (hi + lo) / 2; lo = Math.floor(m - 3); hi = Math.ceil(m + 3); }
    const W = 320, H = 130, L = 34, top = 8, bot = 16;
    const X = (tt) => L + ((tt - from) / (to - from)) * (W - L);
    const Y = (v) => top + (1 - (v - lo) / (hi - lo)) * (H - top - bot);
    let s = "";
    const step = hi - lo > 20 ? 5 : hi - lo > 10 ? 2 : 1;
    for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) s += `<line x1="${L}" x2="${W}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="grid"/><text x="${L - 3}" y="${Y(v).toFixed(1)}" class="al" text-anchor="end">${v}</text>`;
    s += `<rect x="${X(now).toFixed(1)}" y="${top}" width="${(W - X(now)).toFixed(1)}" height="${H - top - bot}" fill="var(--thor-accent)" opacity=".07"/>`;
    let d = "";
    seg.forEach((p, i) => { if (i) d += `L${X(p.t).toFixed(1)},${Y(seg[i - 1].v).toFixed(1)} `; d += `${i ? "L" : "M"}${X(p.t).toFixed(1)},${Y(p.v).toFixed(1)} `; });
    s += `<path d="${d}" fill="none" stroke="#c9971c" stroke-width="1.8"/>`;
    if (ok(fut)) {
      const col = slope * 3 * HOUR <= -1.6 ? "#e05252" : slope * 3 * HOUR >= 1.6 ? "#2e9d5b" : "var(--secondary-text-color)";
      s += `<line x1="${X(now - 3 * HOUR).toFixed(1)}" y1="${Y(icpt + slope * (now - 3 * HOUR)).toFixed(1)}" x2="${X(to).toFixed(1)}" y2="${Y(fut).toFixed(1)}" stroke="${col}" stroke-width="1.6" stroke-dasharray="4 3"/>`;
      s += `<text x="${(W - 4).toFixed(1)}" y="${(Y(fut) - 7).toFixed(1)}" class="bl" text-anchor="end">${this._fmt(fut, 1)}</text>`;
    }
    s += `<line x1="${X(now).toFixed(1)}" x2="${X(now).toFixed(1)}" y1="${top}" y2="${H - bot}" stroke="var(--thor-accent)" stroke-dasharray="3 2"/>`;
    s += `<line x1="${L}" x2="${W}" y1="${H - bot}" y2="${H - bot}" class="axis"/>`;
    for (let h = -24; h <= 6; h += 6) s += `<text x="${clamp(X(now + h * HOUR), L + 14, W - 14).toFixed(1)}" y="${H - 3}" class="bl muted">${h === 0 ? this._time(now) : `${h > 0 ? "+" : ""}${h} h`}</text>`;
    return `<div class="panel" data-more="pressure_entity"><div class="panel-t row"><span>${esc(t.press_chart)}</span>${ok(fut) ? `<span class="small muted">${esc(t.press_extra)}: <b>${this._fmt(fut, 1)} hPa</b></span>` : ""}</div>
      <svg viewBox="0 0 ${W} ${H}" class="bars">${s}</svg></div>`;
  }

  _dewC() {
    if (this._config.dew_point_entity) return this._toC(this._val("dew_point_entity"), "dew_point_entity");
    return dewPointC(this._toC(this._val("outdoor_temp_entity")), this._val("humidity_entity"));
  }

  _risks() {
    const t = this._t;
    const items = [];
    const T0 = this._toC(this._val("outdoor_temp_entity"));
    const rh = this._val("humidity_entity");
    const kmh = this._kmh("wind_speed_entity");
    const gust = this._kmh("wind_gust_entity");
    const td = this._dewC();
    const spread = ok(T0) && ok(td) ? T0 - td : NaN;
    const pos = this._sunNow();
    const night = pos && ok(pos.el) ? pos.el < 0 : new Date().getHours() < 7 || new Date().getHours() > 18;
    const pr = this._pressureTrend();
    const add = (key, lvl, icon, detail) => items.push({ key, lvl, icon, detail });
    const unit = this._tempUnit();
    // Nebel: kleine Taupunktdifferenz, wenig Wind
    if (ok(spread)) {
      const calmish = !ok(kmh) || kmh < 8;
      const lvl = spread < 1 && calmish ? 3 : spread < 2 && (!ok(kmh) || kmh < 12) ? 2 : spread < 3 && calmish ? 1 : 0;
      if (lvl) add("fog", lvl, "mdi:weather-fog", `T − Td ${this._fmt(spread, 1)} K${ok(kmh) ? ` · ${this._speed(kmh).v} ${this._speed(kmh).u}` : ""}`);
    }
    // Frost / Glätte
    if (ok(T0)) {
      const lvl = T0 <= 0 && ok(td) && td <= 0 ? 3 : T0 <= 1 ? 2 : T0 <= 3 && (night || (ok(td) && td < 0)) ? 1 : 0;
      if (lvl) add("frost", lvl, "mdi:snowflake-alert", `${this._fmt(this._fromC(T0), 1)} ${unit}${ok(td) ? ` · Td ${this._fmt(this._fromC(td), 1)} ${unit}` : ""}`);
    }
    // Tau (nachts, Taupunkt fast erreicht, über 0 °C)
    if (ok(spread) && night && T0 > 0 && spread < 2) add("dew", spread < 1 ? 2 : 1, "mdi:water-outline", `T − Td ${this._fmt(spread, 1)} K`);
    // Sturm: Böen oder starker Druckfall
    const sLvl = Math.max(ok(gust) ? (gust >= 89 ? 3 : gust >= 62 ? 2 : gust >= 50 ? 1 : 0) : 0, ok(pr.d) ? (pr.d <= -6 ? 3 : pr.d <= -3.5 ? 2 : pr.d <= -2.5 ? 1 : 0) : 0);
    if (sLvl) add("storm", sLvl, "mdi:weather-windy", [ok(gust) ? `${t.gusts} ${this._speed(gust).v} ${this._speed(gust).u}` : "", ok(pr.d) ? `${pr.d > 0 ? "+" : ""}${this._fmt(pr.d, 1)} hPa/3 h` : ""].filter(Boolean).join(" · "));
    // Gewitterneigung (Faustregel): warm-feucht und fallender Druck
    if (ok(T0) && ok(td) && T0 >= 20 && td >= 15 && ok(pr.d) && pr.d < -1) add("thunder", td >= 18 && pr.d < -2 ? 2 : 1, "mdi:weather-lightning", `Td ${this._fmt(this._fromC(td), 1)} ${unit} · ${this._fmt(pr.d, 1)} hPa/3 h`);
    // Hitze
    const feels = this._config.feels_like_entity ? this._toC(this._val("feels_like_entity"), "feels_like_entity") : feelsLikeC(T0, rh, kmh);
    if (ok(feels) && feels >= 27) add("heat", feels >= 38 ? 3 : feels >= 32 ? 2 : 1, "mdi:thermometer-alert", `${t.feels} ${this._fmt(this._fromC(feels), 1)} ${unit}`);
    const uv = this._val("uv_entity");
    if (this._config.show_night_frost) {
      const nf = this._nightFrostCalc();
      const h = new Date().getHours();
      if (nf && (h >= 12 || h < 4) && nf.ground <= 0) add("nfrost", nf.est <= -5 ? 3 : nf.est <= 0 ? 2 : 1, "mdi:weather-night", `${this._t.nf.est} ${this._fmt(this._fromC(nf.est), 1)} · ${this._t.nf.ground} ${this._fmt(this._fromC(nf.ground), 1)} ${this._tempUnit()}`);
    }
    {
      const pd = this._pollenData();
      const base = pd.some((d) => d.mine) ? pd.filter((d) => d.mine) : pd;
      const hi = base.filter((d) => ok(d.today) && d.today >= 1.5).sort((a, b) => b.today - a.today);
      if (hi.length) add("pollen", hi[0].today >= 3 ? 3 : hi[0].today >= 2 ? 2 : 1, "mdi:flower-pollen", hi.slice(0, 3).map((d) => `${d.name} ${this._pollenDesc(d.today)}`).join(" · "));
    }
    if (ok(uv) && uv >= 6) add("uv", uv >= 11 ? 3 : uv >= 8 ? 2 : 1, "mdi:sun-wireless", `UV ${this._fmt(uv, 1)}`);
    const cols = ["#94a3b8", "#eab308", "#f97316", "#dc2626"];
    const body = items.length
      ? items.sort((a, b) => b.lvl - a.lvl).map((i) => `<div class="risk" style="border-left-color:${cols[i.lvl]}"><ha-icon icon="${i.icon}" style="color:${cols[i.lvl]}"></ha-icon><div><div><b>${esc(t.risk[i.key])}</b> · ${esc(t.lvl[i.lvl])}</div><div class="small muted">${esc(i.detail)}</div></div></div>`).join("")
      : `<div class="risk" style="border-left-color:#2e9d5b"><ha-icon icon="mdi:check-circle-outline" style="color:#2e9d5b"></ha-icon><div>${esc(t.risk.none)}</div></div>`;
    return `<div class="panel"><div class="panel-t">${esc(t.risks)}</div><div class="risks">${body}</div></div>`;
  }

  _weatherForecast() {
    const c = this._config;
    const t = this._t;
    if (!c.weather_entity) return `<div class="panel"><div class="empty small">${esc(t.wx_none)}</div></div>`;
    const st = this._hass?.states?.[c.weather_entity];
    const legacy = st?.attributes?.forecast;
    const hourly = (this._fc.hourly || []).filter((f) => Date.parse(f.datetime) >= Date.now() - HOUR).slice(0, c.forecast_hours);
    const daily = (this._fc.daily || legacy || []).slice(0, c.forecast_days);
    const pu = st?.attributes?.precipitation_unit || "mm";
    const wu = st?.attributes?.wind_speed_unit || "km/h";
    const name = st?.attributes?.friendly_name || c.weather_entity;
    const col = (f, label) => `<div class="wxc">
      <div class="small muted">${esc(label)}</div>
      <ha-icon icon="${WX_ICON[f.condition] || "mdi:weather-cloudy"}"></ha-icon>
      <div><b>${this._fmt(num(f.temperature), 0)}°</b>${ok(num(f.templow)) ? ` <span class="muted">${this._fmt(num(f.templow), 0)}°</span>` : ""}</div>
      ${ok(num(f.precipitation)) && num(f.precipitation) > 0 ? `<div class="small" style="color:#3b82f6">${this._fmt(num(f.precipitation), 1)} ${esc(pu)}</div>` : `<div class="small muted">–</div>`}
      ${ok(num(f.precipitation_probability)) ? `<div class="small muted">${Math.round(num(f.precipitation_probability))} %</div>` : ""}
      ${ok(num(f.wind_speed)) ? `<div class="small muted">${ok(num(f.wind_bearing)) ? this._cardinal(num(f.wind_bearing)) + " " : ""}${this._fmt(num(f.wind_speed), 0)}</div>` : ""}
    </div>`;
    const h = hourly.map((f) => col(f, this._time(Date.parse(f.datetime)))).join("");
    const d = daily.map((f) => col(f, new Date(Date.parse(f.datetime)).toLocaleDateString(this._lang === "de" ? "de-DE" : "en-GB", { weekday: "short" }))).join("");
    if (!h && !d) return `<div class="panel"><div class="panel-t">${esc(t.wx_from)} ${esc(name)}</div><div class="empty">${esc(t.loading)}</div></div>`;
    return `<div class="panel" data-more="weather_entity">
      <div class="panel-t row"><span>${esc(t.wx_from)} ${esc(name)}</span><span class="small muted">${esc(wu)}</span></div>
      ${h ? `<div class="panel-t small">${esc(t.wx_hourly)}</div><div class="wxrow">${h}</div>` : ""}
      ${d ? `<div class="panel-t small" style="margin-top:6px">${esc(t.wx_daily)}</div><div class="wxrow">${d}</div>` : ""}
    </div>`;
  }

  /* -------------------------------------------------------------- Pollen */

  /** Pollen-Sensoren: konfiguriert oder automatisch (DWD Pollenflug: sensor.pollenflug_*) */
  _pollenIds() {
    const c = this._config;
    if (Array.isArray(c.pollen_entities) && c.pollen_entities.length) return c.pollen_entities.filter((id) => this._hass?.states?.[id]);
    if (!c.pollen_auto) return [];
    return Object.keys(this._hass?.states || {}).filter((id) => /^sensor\.pollenflug_/.test(id)).sort();
  }

  /** Wert auf DWD-Skala 0–3 (halbe Stufen) bringen */
  _pollenLevel(v, st) {
    if (v === undefined || v === null || v === "" || v === "unknown" || v === "unavailable") return NaN;
    const s = String(v).trim().toLowerCase();
    if (s in POLLEN_WORDS) return POLLEN_WORDS[s];
    const m = /^(\d(?:[.,]\d)?)\s*-\s*(\d(?:[.,]\d)?)$/.exec(s); // „1-2“ → 1,5
    if (m) return (num(m[1]) + num(m[2])) / 2;
    const n = num(s);
    if (!ok(n)) return NaN;
    let scale = this._config.pollen_scale;
    if (scale === "auto") {
      const u = (st?.attributes?.unit_of_measurement || "").toLowerCase();
      scale = /upi|index/.test(u) || n > 3 ? (n > 5 ? "ppm" : "upi") : "dwd";
    }
    if (scale === "upi") return clamp(Math.round(((n * 3) / 5) * 2) / 2, 0, 3); // Google UPI 0–5
    if (scale === "ppm") return n < 10 ? 0.5 : n < 50 ? 1 : n < 200 ? 2 : 3; // grobe Stückzahl-Klassen
    return clamp(Math.round(n * 2) / 2, 0, 3);
  }

  _pollenName(id) {
    const st = this._hass?.states?.[id];
    let n = st?.attributes?.friendly_name || id.replace(/^sensor\./, "");
    n = n.replace(/^pollenflug[\s_:-]*/i, "").replace(/[\s_]+\d+$/, "").replace(/_/g, " ").trim();
    return n.charAt(0).toUpperCase() + n.slice(1);
  }

  _pollenIcon(name) {
    const n = name.toLowerCase();
    if (/birke|erle|hasel|esche|eiche|buche|pappel|ulme|weide|platane|baum|tree|birch|alder|hazel|ash|oak|olive|cypress|zypresse/.test(n)) return "mdi:tree";
    if (/gr[aä]s|graeser|roggen|rye|grass/.test(n)) return "mdi:grass";
    return "mdi:flower-pollen";
  }

  _pollenData() {
    return this._pollenIds().map((id) => {
      const st = this._hass.states[id];
      const a = st.attributes || {};
      const name = this._pollenName(id);
      const today = this._pollenLevel(st.state, st);
      const tomorrow = this._pollenLevel(a.state_tomorrow ?? a.tomorrow ?? a.forecast_tomorrow, st);
      const in2 = this._pollenLevel(a.state_in_2_days ?? a.day_after_tomorrow ?? a.state_day_after_tomorrow, st);
      const mine = (this._config.pollen_allergies || []).includes(id);
      return { id, name, icon: this._pollenIcon(name), today, tomorrow, in2, mine, max: Math.max(...[today, tomorrow, in2].filter(ok), -1) };
    });
  }

  _pollenDesc(v) {
    if (!ok(v)) return "–";
    return this._t.pollen_lvl[Math.round(v * 2)] || "–";
  }

  _pollenChip(v, small) {
    if (!ok(v)) return `<span class="pl na">–</span>`;
    const i = Math.round(v * 2);
    return `<span class="pl ${small ? "s" : ""}" style="background:${POLLEN_COLORS[i]};color:${i >= 5 ? "#fff" : "#222"}" title="${esc(this._pollenDesc(v))}">${small ? "" : esc(this._pollenDesc(v))}</span>`;
  }

  /** Lokale Einschätzung aus Wetterdaten: Regen wäscht aus, Wind und Trockenheit verstärken */
  _pollenWeather() {
    const t = this._t;
    const notes = [];
    const rh = this._val("humidity_entity");
    const kmh = this._kmh("wind_speed_entity");
    const T0 = this._toC(this._val("outdoor_temp_entity"));
    const rt = this._rainToday();
    if (this._isRaining()) notes.push(["mdi:weather-pouring", t.pw.rain_now, -1]);
    else if (ok(rt) && rt >= 2) notes.push(["mdi:weather-rainy", t.pw.rain_today.replace("{mm}", this._fmt(rt, 1)), -1]);
    if (ok(rh) && rh >= 85) notes.push(["mdi:water-percent", t.pw.humid, -1]);
    if (ok(rh) && rh < 55 && ok(kmh) && kmh >= 15 && (!ok(T0) || T0 >= 10)) notes.push(["mdi:weather-windy", t.pw.dry_wind, 1]);
    else if (ok(kmh) && kmh >= 20) notes.push(["mdi:weather-windy", t.pw.wind, 1]);
    if (ok(T0) && T0 < 5) notes.push(["mdi:snowflake", t.pw.cold, -1]);
    return notes;
  }

  _pollen() {
    const c = this._config;
    const t = this._t;
    const data = this._pollenData();
    if (!data.length) return `<div class="panel"><div class="panel-t">${esc(t.pollen)}</div><div class="empty small">${esc(t.pollen_none)}</div></div>`;
    const base = data.some((d) => d.mine) ? data.filter((d) => d.mine) : data;
    const dayMax = (k) => { const v = base.map((d) => d[k]).filter(ok); return v.length ? Math.max(...v) : NaN; };
    const days = [["today", t.today_cap], ["tomorrow", t.tomorrow], ["in2", t.in2days]];
    const top = base.filter((d) => ok(d.today) && d.today > 0).sort((a, b) => b.today - a.today).slice(0, 3);
    const summary = days.map(([k, l]) => {
      const v = Math.max(...base.map((d) => d[k]).filter(ok));
      const vv = ok(v) && v >= 0 ? v : NaN;
      return `<div class="psum"><div class="small muted">${esc(l)}</div>${this._pollenChip(vv)}</div>`;
    }).join("");
    let rows = data.slice();
    if (!c.pollen_show_empty) rows = rows.filter((d) => d.max > 0 || d.mine);
    rows.sort((a, b) => (b.mine - a.mine) || (b.today || 0) - (a.today || 0) || (b.max - a.max) || a.name.localeCompare(b.name));
    const table = rows.length
      ? `<div class="ptable"><div class="prow ph"><span></span><span></span>${days.map(([, l]) => `<span class="small muted">${esc(l)}</span>`).join("")}</div>
        ${rows.map((d) => `<div class="prow ${d.mine ? "mine" : ""}" data-pollen="${esc(d.id)}">
          <ha-icon icon="${d.icon}"></ha-icon><span class="pn">${esc(d.name)}${d.mine ? " ★" : ""}</span>
          ${this._pollenChip(d.today)}${this._pollenChip(d.tomorrow)}${this._pollenChip(d.in2)}
        </div>`).join("")}</div>`
      : `<div class="small muted">${esc(t.pollen_free)}</div>`;
    const notes = this._pollenWeather();
    const tip = c.pollen_area === "rural" ? t.pw.air_rural : t.pw.air_city;
    const trendTxt = (() => {
      const a = dayMax("today"), b = dayMax("tomorrow");
      if (!ok(a) || !ok(b)) return "";
      return b > a ? t.pw.trend_up : b < a ? t.pw.trend_down : t.pw.trend_same;
    })();
    return `<div class="panel">
      <div class="panel-t row"><span>${esc(t.pollen)}${data.some((d) => d.mine) ? ` <span class="small muted">· ${esc(t.pollen_mine)}</span>` : ""}</span>${top.length ? `<span class="small muted">${esc(t.pollen_top)}: <b>${top.map((d) => esc(d.name)).join(", ")}</b></span>` : ""}</div>
      <div class="psums">${summary}</div>
      ${trendTxt ? `<div class="small center" style="margin:4px 0 8px">${esc(trendTxt)}</div>` : ""}
      ${table}
      <div class="panel-t small" style="margin-top:10px">${esc(t.pw.title)}</div>
      <div class="pnotes">${notes.map(([i, txt, eff]) => `<div class="pnote ${eff > 0 ? "up" : "down"}"><ha-icon icon="${i}"></ha-icon><span>${esc(txt)}</span></div>`).join("")}
        <div class="pnote"><ha-icon icon="mdi:window-open-variant"></ha-icon><span>${esc(tip)}</span></div></div>
      <div class="small muted" style="margin-top:6px">${esc(t.pollen_src)}</div>
    </div>`;
  }

  /** Verlauf der letzten Wochen als Heatmap (Pollenart × Tag) */
  _pollenHistory() {
    const t = this._t;
    const data = this._pollenData().filter((d) => d.max > 0 || d.mine || this._config.pollen_show_empty);
    const days = this._config.pollen_history_days;
    if (!data.length || !this._pollenHist) return "";
    const today = new Date().setHours(0, 0, 0, 0);
    const cols = [];
    for (let i = days - 1; i >= 0; i--) cols.push(new Date(today - i * DAY + 12 * HOUR).setHours(0, 0, 0, 0));
    const rows = data.map((d) => {
      const pts = this._pollenHist[d.id] || [];
      const cells = cols.map((day) => {
        let mx = NaN;
        const v0 = valueAt(pts, day);
        if (ok(v0)) mx = v0;
        for (const p of pts) if (p.t >= day && p.t < day + DAY && ok(p.v)) mx = ok(mx) ? Math.max(mx, p.v) : p.v;
        if (day === today && ok(d.today)) mx = d.today;
        const i = ok(mx) ? Math.round(mx * 2) : -1;
        return `<span class="hm" style="background:${i >= 0 ? POLLEN_COLORS[i] : "var(--thor-off)"}" title="${esc(d.name)} · ${this._date(day)}: ${esc(this._pollenDesc(mx))}"></span>`;
      }).join("");
      return `<div class="hrow"><span class="pn small">${esc(d.name)}</span><div class="hcells" style="grid-template-columns:repeat(${days},1fr)">${cells}</div></div>`;
    }).join("");
    const lbl = [0, Math.floor(days / 2), days - 1].map((i) => `<span>${this._date(cols[i])}</span>`).join("");
    const legend = [0, 2, 4, 6].map((i) => `<span><i style="background:${POLLEN_COLORS[i]}"></i>${esc(t.pollen_lvl[i])}</span>`).join("");
    return `<div class="panel"><div class="panel-t">${esc(t.pollen_hist)} · ${days} ${this._lang === "de" ? "Tage" : "days"}</div>
      <div class="hmap">${rows}<div class="hrow"><span></span><div class="hlbl small muted">${lbl}</div></div></div>
      <div class="legend center small">${legend}</div></div>`;
  }

  /* =========================================================== Auswertungen */

  /** Tageswerte inkl. Wind, Druck, Sonne – für Klima, Haus & Garten */
  _daysX() {
    if (this._daysXCache && this._daysXCache.at === this._renderAt) return this._daysXCache.v;
    const base = this._days();
    if (!base) return null;
    const map = new Map(base.map((d) => [d.t, { ...d }]));
    const key = (t) => new Date(t).setHours(0, 0, 0, 0);
    const put = (rows, fn) => {
      for (const r of rows || []) {
        const k = key(r.start);
        const e = map.get(k) || { t: k };
        fn(e, r);
        map.set(k, e);
      }
    };
    const fg = this._kmhFactor("wind_gust_entity"), fw = this._kmhFactor("wind_speed_entity");
    put(this._daily?.gust, (e, r) => { if (ok(r.max)) e.gust = r.max * fg; });
    put(this._daily?.wind, (e, r) => { if (ok(r.mean)) e.wind = r.mean * fw; if (ok(r.max)) e.windMax = r.max * fw; });
    put(this._daily?.press, (e, r) => { if (ok(r.min)) e.pmin = r.min; if (ok(r.max)) e.pmax = r.max; });
    if (this._radKey() && this._sunHourly) for (const [k, s] of this._sunDays()) { const e = map.get(k) || { t: k }; e.sun = s.h; e.sunKwh = s.kwh; map.set(k, e); }
    const v = [...map.values()].sort((a, b) => a.t - b.t);
    this._daysXCache = { at: this._renderAt, v };
    return v;
  }

  _md(t) {
    const d = new Date(t);
    return d.getMonth() * 100 + d.getDate();
  }

  _yearsOf(days) {
    return [...new Set(days.map((d) => new Date(d.t).getFullYear()))].sort((a, b) => a - b);
  }

  _tC(v) {
    return `${this._fmt(this._fromC(v), 1)} ${this._tempUnit()}`;
  }

  _noLong() {
    return `<div class="empty small">${esc(this._loading ? this._t.loading : this._t.no_stats)}</div>`;
  }

  /* --------------------------------------------------- Rekorde & Extreme */

  _records() {
    const t = this._t;
    const days = this._daysX();
    if (!days || !days.some((d) => ok(d.max))) return `<div class="panel"><div class="panel-t">${esc(t.rec.title)}</div>${this._noLong()}</div>`;
    const today = new Date().setHours(0, 0, 0, 0);
    const first = days.find((d) => ok(d.max) || ok(d.rain));
    const best = (fn, cmp) => days.reduce((b, d) => { const v = fn(d); return ok(v) && (!b || cmp(v, b.v)) ? { t: d.t, v } : b; }, null);
    const tiles = [];
    const tile = (icon, col, label, v, date, key) => tiles.push(`<div class="rec" ${key ? `data-more="${key}"` : ""}><ha-icon icon="${icon}" style="color:${col}"></ha-icon><div><div class="small muted">${esc(label)}</div><div class="rv2">${v}</div><div class="small muted">${date ? this._date(date, { day: "2-digit", month: "2-digit", year: "numeric" }) : ""}</div></div></div>`);
    const hi = best((d) => d.max, (a, b) => a > b), lo = best((d) => d.min, (a, b) => a < b);
    if (hi) tile("mdi:thermometer-high", "#dc2626", t.rec.tmax, this._tC(hi.v), hi.t, "outdoor_temp_entity");
    if (lo) tile("mdi:thermometer-low", "#2563eb", t.rec.tmin, this._tC(lo.v), lo.t, "outdoor_temp_entity");
    const wmx = best((d) => d.mean, (a, b) => a > b), cmx = best((d) => d.mean, (a, b) => a < b);
    if (wmx) tile("mdi:weather-sunny", "#f97316", t.rec.warm_day, this._tC(wmx.v), wmx.t);
    if (cmx) tile("mdi:snowflake", "#60a5fa", t.rec.cold_day, this._tC(cmx.v), cmx.t);
    const wet = best((d) => d.rain, (a, b) => a > b);
    if (wet && wet.v > 0) tile("mdi:weather-pouring", "#3b82f6", t.rec.wet_day, `${this._fmt(wet.v, 1)} mm`, wet.t);
    // nassester Monat
    const months = new Map();
    for (const d of days) if (ok(d.rain)) { const dt = new Date(d.t); const k = dt.getFullYear() * 12 + dt.getMonth(); months.set(k, (months.get(k) || 0) + d.rain); }
    let wm = null;
    for (const [k, v] of months) if (!wm || v > wm.v) wm = { k, v };
    if (wm && wm.v > 0) tile("mdi:calendar-month", "#1d4ed8", t.rec.wet_month, `${this._fmt(wm.v, 0)} mm`, null), (tiles[tiles.length - 1] = tiles[tiles.length - 1].replace('<div class="small muted"></div></div></div>', `<div class="small muted">${t.months[wm.k % 12]} ${Math.floor(wm.k / 12)}</div></div></div>`));
    const g = best((d) => d.gust, (a, b) => a > b);
    if (g) { const s = this._speed(g.v); tile("mdi:weather-windy-variant", "#e8590c", t.rec.gust, `${s.v} ${s.u} · ${beaufort(g.v)} Bft`, g.t, "wind_gust_entity"); }
    const ph = best((d) => d.pmax, (a, b) => a > b), pl = best((d) => d.pmin, (a, b) => a < b);
    if (ph) tile("mdi:gauge-full", "#2e9d5b", t.rec.p_hi, `${this._fmt(ph.v, 1)} hPa`, ph.t, "pressure_entity");
    if (pl) tile("mdi:gauge-empty", "#7c3aed", t.rec.p_lo, `${this._fmt(pl.v, 1)} hPa`, pl.t, "pressure_entity");
    const sunB = best((d) => d.sun, (a, b) => a > b);
    if (sunB && sunB.v > 0) tile("mdi:sun-clock", "#f59e0b", t.rec.sun_day, `${this._fmt(sunB.v, 1)} h`, sunB.t);

    // Dieser Kalendertag in früheren Jahren
    const md = this._md(today);
    const same = days.filter((d) => this._md(d.t) === md && d.t !== today);
    const td = days.find((d) => d.t === today) || {};
    let dayRec = "";
    if (same.length) {
      const sh = same.reduce((b, d) => (ok(d.max) && (!b || d.max > b.max) ? d : b), null);
      const sl = same.reduce((b, d) => (ok(d.min) && (!b || d.min < b.min) ? d : b), null);
      const newHi = sh && ok(td.max) && td.max > sh.max, newLo = sl && ok(td.min) && td.min < sl.min;
      dayRec = `<div class="drec">
        <div class="panel-t small">${esc(t.rec.this_day)} ${this._date(today)} · ${same.length} ${esc(same.length === 1 ? t.rec.year1 : t.rec.years)}</div>
        <div class="chips ex">
          ${sh ? this._chip("mdi:arrow-up-bold", t.rec.day_hi, `${this._tC(sh.max)} (${new Date(sh.t).getFullYear()})`) : ""}
          ${sl ? this._chip("mdi:arrow-down-bold", t.rec.day_lo, `${this._tC(sl.min)} (${new Date(sl.t).getFullYear()})`) : ""}
          ${ok(td.max) ? this._chip("mdi:calendar-today", t.rec.today, `${this._tC(td.min)} … ${this._tC(td.max)}`) : ""}
        </div>
        ${newHi || newLo ? `<div class="badge-rec">🏆 ${esc(newHi ? t.rec.new_hi : t.rec.new_lo)}</div>` : ""}
      </div>`;
    }
    // Monatsrekorde
    const mrows = t.months.map((mn, m) => {
      const ds = days.filter((d) => new Date(d.t).getMonth() === m);
      if (!ds.length) return "";
      const a = ds.reduce((b, d) => (ok(d.max) && (!b || d.max > b.max) ? d : b), null);
      const b2 = ds.reduce((b, d) => (ok(d.min) && (!b || d.min < b.min) ? d : b), null);
      const r = ds.reduce((b, d) => (ok(d.rain) && (!b || d.rain > b.rain) ? d : b), null);
      const gg = ds.reduce((b, d) => (ok(d.gust) && (!b || d.gust > b.gust) ? d : b), null);
      const y = (d) => `<span class="muted"> ’${String(new Date(d.t).getFullYear()).slice(2)}</span>`;
      return `<tr class="${m === new Date().getMonth() ? "cur" : ""}"><td>${mn}</td>
        <td style="color:${a ? tempColor(a.max) : ""}">${a ? `${this._fmt(this._fromC(a.max), 1)}${y(a)}` : "–"}</td>
        <td style="color:${b2 ? tempColor(b2.min) : ""}">${b2 ? `${this._fmt(this._fromC(b2.min), 1)}${y(b2)}` : "–"}</td>
        <td>${r && r.rain > 0 ? `${this._fmt(r.rain, 1)}${y(r)}` : "–"}</td>
        ${days.some((d) => ok(d.gust)) ? `<td>${gg ? `${this._speed(gg.gust).v}${y(gg)}` : "–"}</td>` : ""}</tr>`;
    }).join("");
    const hasG = days.some((d) => ok(d.gust));
    return `<div class="panel">
      <div class="panel-t row"><span>${esc(t.rec.title)}</span><span class="small muted">${esc(t.rec.since)} ${first ? this._date(first.t, { month: "2-digit", year: "numeric" }) : "–"}</span></div>
      <div class="recs">${tiles.join("")}</div>
      ${dayRec}
      <div class="panel-t small" style="margin-top:10px">${esc(t.rec.months)}</div>
      <table class="rtab"><thead><tr><th></th><th>${esc(t.max)} ${esc(this._tempUnit())}</th><th>${esc(t.min)} ${esc(this._tempUnit())}</th><th>${esc(t.rec.rain_day_s)}</th>${hasG ? `<th>${esc(t.gusts)} ${esc(this._speed(10).u)}</th>` : ""}</tr></thead><tbody>${mrows}</tbody></table>
    </div>`;
  }

  /* ------------------------------------------ Klimastreifen & Jahresvergleich */

  _stripes() {
    const t = this._t;
    const days = this._daysX();
    if (!days || !days.some((d) => ok(d.mean))) return `<div class="panel"><div class="panel-t">${esc(t.stripes.title)}</div>${this._noLong()}</div>`;
    // Monatsmittel und Abweichung zum Mittel desselben Kalendermonats
    const mm = new Map();
    for (const d of days) {
      if (!ok(d.mean)) continue;
      const dt = new Date(d.t);
      const k = dt.getFullYear() * 12 + dt.getMonth();
      const e = mm.get(k) || { s: 0, n: 0 };
      e.s += d.mean; e.n++;
      mm.set(k, e);
    }
    const keys = [...mm.keys()].sort((a, b) => a - b).filter((k) => mm.get(k).n >= 10);
    const clim = Array.from({ length: 12 }, (_, m) => {
      const v = keys.filter((k) => k % 12 === m).map((k) => mm.get(k).s / mm.get(k).n);
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN;
    });
    const anom = keys.map((k) => ({ k, a: mm.get(k).s / mm.get(k).n - clim[k % 12], n: keys.filter((x) => x % 12 === k % 12).length }));
    const maxA = Math.max(1.5, ...anom.map((x) => Math.abs(x.a)));
    const col = (a) => {
      const f = clamp(a / maxA, -1, 1);
      const c0 = [247, 247, 247], c1 = f > 0 ? [178, 24, 43] : [33, 102, 172];
      return `rgb(${c0.map((v, i) => Math.round(v + (c1[i] - v) * Math.abs(f))).join(",")})`;
    };
    const W = 320, H = 46;
    const bw = W / Math.max(1, anom.length);
    let s = anom.map((x, i) => `<rect x="${(i * bw).toFixed(2)}" y="0" width="${(bw + 0.3).toFixed(2)}" height="${H}" fill="${x.n > 1 ? col(x.a) : "#ddd"}"><title>${t.months[x.k % 12]} ${Math.floor(x.k / 12)}: ${x.a > 0 ? "+" : ""}${this._fmt(x.a, 1)} K</title></rect>`).join("");
    const yearsLbl = anom.map((x, i) => (x.k % 12 === 0 ? `<text x="${(i * bw + 1).toFixed(1)}" y="${H + 9}" class="bl muted" text-anchor="start">${Math.floor(x.k / 12)}</text>` : "")).join("");
    // Jahresvergleich: bis heute (gleicher Zeitraum) oder ganzes Jahr
    const mode = this._sel.ycmp || "ytd";
    const now = new Date();
    const years = this._yearsOf(days).slice(-8).reverse();
    const thr = this._config.rain_day_threshold;
    const rows = years.map((y) => {
      const ds = days.filter((d) => {
        const dt = new Date(d.t);
        if (dt.getFullYear() !== y) return false;
        if (mode === "ytd") return dt.getMonth() < now.getMonth() || (dt.getMonth() === now.getMonth() && dt.getDate() <= now.getDate());
        return true;
      });
      const T = ds.filter((d) => ok(d.mean));
      const mean = T.length ? T.reduce((a, d) => a + d.mean, 0) / T.length : NaN;
      const rain = ds.filter((d) => ok(d.rain)).reduce((a, d) => a + d.rain, 0);
      const hasR = ds.some((d) => ok(d.rain));
      const sun = ds.filter((d) => ok(d.sun)).reduce((a, d) => a + d.sun, 0);
      const hasS = ds.some((d) => ok(d.sun));
      return {
        y, n: ds.length, mean, rain: hasR ? rain : NaN, sun: hasS ? sun : NaN,
        hot: ds.filter((d) => d.max >= 25).length, frost: ds.filter((d) => d.min < 0).length, wet: ds.filter((d) => d.rain >= thr).length,
        tmax: Math.max(...ds.map((d) => d.max).filter(ok)), tmin: Math.min(...ds.map((d) => d.min).filter(ok)),
      };
    }).filter((r) => r.n > 0);
    const others = rows.filter((r) => r.y !== now.getFullYear() && ok(r.mean));
    const avg = (k) => { const v = others.map((r) => r[k]).filter(ok); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN; };
    const cur = rows.find((r) => r.y === now.getFullYear());
    const dT = cur && ok(avg("mean")) ? cur.mean - avg("mean") : NaN;
    const dR = cur && ok(avg("rain")) && avg("rain") > 0 ? (cur.rain / avg("rain") - 1) * 100 : NaN;
    const hasSun = rows.some((r) => ok(r.sun));
    const tbl = rows.map((r) => `<tr class="${r.y === now.getFullYear() ? "cur" : ""}"><td>${r.y}${r.n < (mode === "ytd" ? 300 : 360) && r.y !== now.getFullYear() ? `<span class="muted">*</span>` : ""}</td>
      <td style="color:${tempColor(r.mean)}">${this._fmt(this._fromC(r.mean), 1)}</td><td>${ok(r.tmax) ? this._fmt(this._fromC(r.tmax), 1) : "–"}</td><td>${ok(r.tmin) ? this._fmt(this._fromC(r.tmin), 1) : "–"}</td>
      <td>${ok(r.rain) ? this._fmt(r.rain, 0) : "–"}</td>${hasSun ? `<td>${ok(r.sun) ? this._fmt(r.sun, 0) : "–"}</td>` : ""}<td>${r.hot}</td><td>${r.frost}</td><td>${r.wet}</td></tr>`).join("");
    const btn = (k, l) => `<button class="pbtn ${mode === k ? "on" : ""}" data-range="ycmp:${k}">${esc(l)}</button>`;
    return `<div class="panel">
      <div class="panel-t">${esc(t.stripes.title)}</div>
      <svg viewBox="0 0 ${W} ${H + 12}" class="stripes">${s}${yearsLbl}</svg>
      <div class="small muted center">${esc(t.stripes.hint)}</div>
      ${cur && ok(dT) ? `<div class="chips ex">
        ${this._chip("mdi:thermometer", `${now.getFullYear()} ${t.stripes.vs}`, `${dT > 0 ? "+" : ""}${this._fmt(dT, 1)} K`)}
        ${ok(dR) ? this._chip("mdi:weather-rainy", `${t.rain} ${t.stripes.vs}`, `${dR > 0 ? "+" : ""}${this._fmt(dR, 0)} %`) : ""}
      </div>` : ""}
      <div class="panel-t small" style="margin-top:10px">${esc(t.stripes.cmp)}</div>
      <div class="tscroll"><table class="rtab"><thead><tr><th></th><th>Ø ${esc(this._tempUnit())}</th><th>${esc(t.max)}</th><th>${esc(t.min)}</th><th>${esc(t.rain)} mm</th>${hasSun ? `<th>☀ h</th>` : ""}<th title="${esc(t.cd.summer)}">≥25°</th><th title="${esc(t.cd.frost)}">❄</th><th title="${esc(t.cd.rain)}">☂</th></tr></thead><tbody>${tbl}</tbody></table></div>
      <div class="pbtns">${btn("ytd", t.stripes.ytd)}${btn("full", t.stripes.full)}</div>
      ${rows.some((r) => r.n < 300 && r.y !== now.getFullYear()) ? `<div class="small muted">* ${esc(t.stripes.partial)}</div>` : ""}
    </div>`;
  }

  /* ------------------------------------------------------ Kalender-Heatmap */

  _calendar() {
    const t = this._t;
    const days = this._daysX();
    if (!days || !days.length) return `<div class="panel"><div class="panel-t">${esc(t.cal.title)}</div>${this._noLong()}</div>`;
    const years = this._yearsOf(days).slice(-5);
    const y = years.includes(Number(this._sel.calY)) ? Number(this._sel.calY) : years[years.length - 1];
    const metrics = [["temp", t.cal.temp], ["rain", t.rain], ...(days.some((d) => ok(d.sun)) ? [["sun", t.cal.sun]] : []), ...(days.some((d) => ok(d.gust) || ok(d.windMax)) ? [["wind", t.wind]] : [])];
    const m = metrics.some(([k]) => k === this._sel.calM) ? this._sel.calM : "temp";
    const byDay = new Map(days.map((d) => [d.t, d]));
    const jan1 = new Date(y, 0, 1);
    const off = (jan1.getDay() + 6) % 7; // Montag = 0
    const cs = 6.2, gap = 1, L = 16, T0 = 12;
    let s = "";
    const val = (d) => (m === "temp" ? d?.mean : m === "rain" ? d?.rain : m === "sun" ? d?.sun : (d?.gust ?? d?.windMax));
    const color = (v) => {
      if (!ok(v)) return "var(--thor-off)";
      if (m === "temp") return tempColor(v);
      if (m === "rain") return v < 0.1 ? "rgba(127,127,127,.12)" : ["#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8", "#1e3a8a"][v < 1 ? 0 : v < 5 ? 1 : v < 10 ? 2 : v < 20 ? 3 : 4];
      if (m === "sun") return v < 0.5 ? "rgba(127,127,127,.12)" : ["#fef3c7", "#fde68a", "#fbbf24", "#f59e0b", "#d97706"][v < 2 ? 0 : v < 4 ? 1 : v < 7 ? 2 : v < 10 ? 3 : 4];
      return ROSE_COLORS[ROSE_CLASSES.reduce((k, l, j) => (v >= l ? j : k), 0)];
    };
    const fmtV = (v) => (!ok(v) ? "–" : m === "temp" ? this._tC(v) : m === "rain" ? `${this._fmt(v, 1)} mm` : m === "sun" ? `${this._fmt(v, 1)} h` : `${this._speed(v).v} ${this._speed(v).u}`);
    const end = new Date(y, 11, 31).getTime();
    let lastMonth = -1;
    for (let tt = jan1.getTime(), i = 0; tt <= end; tt = new Date(tt + DAY + 12 * HOUR).setHours(0, 0, 0, 0), i++) {
      const idx = i + off, w = Math.floor(idx / 7), dow = idx % 7;
      const x = L + w * (cs + gap), yy = T0 + dow * (cs + gap);
      const d = byDay.get(tt);
      const fut = tt > Date.now();
      s += `<rect x="${x.toFixed(1)}" y="${yy.toFixed(1)}" width="${cs}" height="${cs}" rx="1.2" fill="${fut ? "transparent" : color(val(d))}" ${fut ? 'stroke="var(--divider-color)" stroke-width=".4"' : ""}><title>${this._date(tt)}: ${fmtV(val(d))}</title></rect>`;
      const mo = new Date(tt).getMonth();
      if (mo !== lastMonth && new Date(tt).getDate() <= 7) { s += `<text x="${x.toFixed(1)}" y="8" class="bl muted" text-anchor="start">${t.months[mo]}</text>`; lastMonth = mo; }
    }
    ["Mo", "Mi", "Fr"].forEach((l, i) => (s += `<text x="0" y="${(T0 + i * 2 * (cs + gap) + cs - 1).toFixed(1)}" class="bl muted" text-anchor="start">${this._lang === "de" ? l : ["M", "W", "F"][i]}</text>`));
    const W = L + 54 * (cs + gap), H = T0 + 7 * (cs + gap);
    const legendVals = m === "temp" ? [-10, 0, 10, 20, 30] : m === "rain" ? [0.5, 2, 7, 15, 25] : m === "sun" ? [1, 3, 5, 8, 11] : [3, 8, 15, 25, 45];
    const legend = legendVals.map((v) => `<span><i style="background:${color(v)}"></i>${m === "temp" ? `${this._fmt(this._fromC(v), 0)}°` : m === "wind" ? this._speed(v).v : v}</span>`).join("");
    const btns = `<div class="pbtns">${years.map((yy) => `<button class="pbtn ${yy === y ? "on" : ""}" data-range="calY:${yy}">${yy}</button>`).join("")}</div>
      <div class="pbtns">${metrics.map(([k, l]) => `<button class="pbtn ${k === m ? "on" : ""}" data-range="calM:${k}">${esc(l)}</button>`).join("")}</div>`;
    return `<div class="panel"><div class="panel-t">${esc(t.cal.title)} ${y}</div>
      <div class="tscroll"><svg viewBox="0 0 ${W} ${H}" class="cal" style="min-width:${Math.round(W * 1.15)}px">${s}</svg></div>
      <div class="legend center small">${legend}${m === "rain" ? " mm" : m === "sun" ? " h" : m === "wind" ? ` ${esc(this._speed(1).u)} (${esc(t.gusts)})` : ""}</div>${btns}</div>`;
  }

  /* ------------------------------------------------------------- Vegetation */

  _vegYear(days, y, until) {
    let gts = 0, gdd = 0, vegStart = null, lastFrost = null, firstFrost = null, vegDays = 0;
    const curve = [];
    for (const d of days) {
      const dt = new Date(d.t);
      if (dt.getFullYear() !== y || (until && d.t > until)) continue;
      const m = dt.getMonth();
      if (ok(d.mean)) {
        if (d.mean > 0) gts += d.mean * (m === 0 ? 0.5 : m === 1 ? 0.75 : 1);
        if (d.mean > 5) { gdd += d.mean - 5; vegDays++; }
        if (!vegStart && gts >= 200) vegStart = d.t;
        curve.push({ doy: Math.floor((d.t - new Date(y, 0, 1)) / DAY), v: gts });
      }
      if (ok(d.min) && d.min < 0) {
        if (m < 6) lastFrost = d.t;
        else if (!firstFrost) firstFrost = d.t;
      }
    }
    const frostFree = lastFrost && firstFrost ? Math.round((firstFrost - lastFrost) / DAY) - 1 : NaN;
    return { gts, gdd, vegStart, lastFrost, firstFrost, frostFree, vegDays, curve };
  }

  _vegetation() {
    const t = this._t;
    const days = this._daysX();
    if (!days || !days.some((d) => ok(d.mean))) return `<div class="panel"><div class="panel-t">${esc(t.veg.title)}</div>${this._noLong()}</div>`;
    const now = new Date();
    const y = now.getFullYear();
    const cur = this._vegYear(days, y);
    const sameDayLast = new Date(y - 1, now.getMonth(), now.getDate(), 23, 59).getTime();
    const prev = this._vegYear(days, y - 1, sameDayLast);
    const prevFull = this._vegYear(days, y - 1);
    const hasPrev = prev.curve.length > 30;
    const dfmt = (x) => (x ? this._date(x) : "–");
    const diffDays = cur.vegStart && prevFull.vegStart ? Math.round(((cur.vegStart - new Date(y, 0, 1)) - (prevFull.vegStart - new Date(y - 1, 0, 1))) / DAY) : NaN;
    const tiles = [
      this._chip("mdi:sprout", t.veg.gts, `${this._fmt(cur.gts, 0)} °C${hasPrev ? ` · ${esc(t.last_year)} ${this._fmt(prev.gts, 0)}` : ""}`),
      this._chip("mdi:flower-tulip", t.veg.start, cur.vegStart ? `${dfmt(cur.vegStart)}${ok(diffDays) ? ` (${diffDays > 0 ? "+" : ""}${diffDays} ${t.veg.days_vs})` : ""}` : `${t.veg.not_yet} (${this._fmt(cur.gts, 0)}/200)`),
      this._chip("mdi:snowflake-melt", t.veg.last_frost, dfmt(cur.lastFrost)),
      this._chip("mdi:snowflake-alert", t.veg.first_frost, now.getMonth() >= 6 ? dfmt(cur.firstFrost) : `${esc(t.last_year)}: ${dfmt(prevFull.firstFrost)}`),
      this._chip("mdi:calendar-check", t.veg.frost_free, ok(cur.frostFree) ? `${cur.frostFree} ${t.veg.d}` : ok(prevFull.frostFree) ? `${esc(t.last_year)}: ${prevFull.frostFree} ${t.veg.d}` : "–"),
      this._chip("mdi:leaf", t.veg.gdd, `${this._fmt(cur.gdd, 0)} K·d · ${cur.vegDays} ${t.veg.d}`),
    ];
    // GTS-Kurve bis Mitte Mai, Linie 200
    const W = 320, H = 110, L = 28, top = 8, bot = 16, maxDoy = 150;
    const mx = Math.max(250, ...cur.curve.filter((p) => p.doy <= maxDoy).map((p) => p.v), ...prevFull.curve.filter((p) => p.doy <= maxDoy).map((p) => p.v));
    const X = (doy) => L + (doy / maxDoy) * (W - L), Y = (v) => top + (1 - v / mx) * (H - top - bot);
    const path = (c) => c.filter((p) => p.doy <= maxDoy).map((p, i) => `${i ? "L" : "M"}${X(p.doy).toFixed(1)},${Y(p.v).toFixed(1)}`).join(" ");
    let s = `<line x1="${L}" x2="${W}" y1="${Y(200).toFixed(1)}" y2="${Y(200).toFixed(1)}" stroke="#2e9d5b" stroke-dasharray="4 3"/><text x="${L + 2}" y="${(Y(200) - 4).toFixed(1)}" class="bl" text-anchor="start" fill="#2e9d5b">200 · ${esc(t.veg.start)}</text>`;
    const vs = mx > 800 ? 400 : mx > 400 ? 200 : 100;
    for (let v = 0; v <= mx; v += vs) s += `<text x="${L - 3}" y="${Y(v).toFixed(1)}" class="al" text-anchor="end">${v}</text>`;
    [0, 31, 59, 90, 120].forEach((doy, i) => (s += `<text x="${X(doy + 14).toFixed(1)}" y="${H - 3}" class="bl muted">${t.months[i]}</text>`));
    if (prevFull.curve.length) s += `<path d="${path(prevFull.curve)}" fill="none" stroke="#7cb342" stroke-width="1.4" stroke-dasharray="4 3" opacity=".7"/>`;
    if (cur.curve.length) s += `<path d="${path(cur.curve)}" fill="none" stroke="#2e7d32" stroke-width="2"/>`;
    s += `<line x1="${L}" x2="${W}" y1="${H - bot}" y2="${H - bot}" class="axis"/>`;
    return `<div class="panel"><div class="panel-t row"><span>${esc(t.veg.title)} ${y}</span><span class="small muted">${esc(t.veg.hint)}</span></div>
      <div class="chips ex">${tiles.join("")}</div>
      <div class="panel-t small" style="margin-top:8px">${esc(t.veg.curve)}</div>
      <svg viewBox="0 0 ${W} ${H}" class="bars">${s}</svg>
      <div class="legend center small"><span><i style="background:#2e7d32"></i>${y}</span><span><i class="dash" style="background:repeating-linear-gradient(90deg,#7cb342 0 4px,transparent 4px 7px)"></i>${y - 1}</span></div>
    </div>`;
  }

  /* --------------------------------------------------------------- Gradtage */

  _degreeDays() {
    const t = this._t;
    const days = this._daysX();
    if (!days || !days.some((d) => ok(d.mean))) return `<div class="panel"><div class="panel-t">${esc(t.dd.title)}</div>${this._noLong()}</div>`;
    const c = this._config;
    const ti = num(c.heating_indoor) || 20, tb = num(c.heating_limit) || 15, cb = num(c.cooling_base) || 18;
    const now = new Date();
    // Heizperiode 1.7.–30.6.
    const sY = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    const season = (y0, until) => {
      const from = new Date(y0, 6, 1).getTime(), to = until ?? new Date(y0 + 1, 6, 1).getTime();
      const months = Array.from({ length: 12 }, () => ({ g: 0, cdd: 0, hd: 0, n: 0 }));
      let g = 0, cdd = 0, hd = 0, n = 0;
      for (const d of days) {
        if (d.t < from || d.t >= to || !ok(d.mean)) continue;
        const mi = (new Date(d.t).getMonth() + 6) % 12;
        n++; months[mi].n++;
        if (d.mean < tb) { g += ti - d.mean; hd++; months[mi].g += ti - d.mean; months[mi].hd++; }
        if (d.mean > cb) { cdd += d.mean - cb; months[mi].cdd += d.mean - cb; }
      }
      return { g, cdd, hd, n, months };
    };
    const curS = season(sY);
    const lastSameDay = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() + 1).getTime();
    const prevS = season(sY - 1, lastSameDay);
    const prevFull = season(sY - 1);
    const pct = prevS.n > 20 && prevS.g > 0 ? (curS.g / prevS.g - 1) * 100 : NaN;
    const mOrder = [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5];
    const W = 320, H = 120, padB = 16, top = 12;
    const mx = Math.max(50, ...curS.months.map((m) => m.g), ...prevFull.months.map((m) => m.g));
    const bw = W / 12;
    let s = "";
    mOrder.forEach((mo, i) => {
      const a = prevFull.months[i].g, b = curS.months[i].g;
      const x = i * bw;
      if (a > 0) s += `<rect x="${(x + bw * 0.12).toFixed(1)}" y="${(H - padB - (a / mx) * (H - padB - top)).toFixed(1)}" width="${(bw * 0.36).toFixed(1)}" height="${((a / mx) * (H - padB - top)).toFixed(1)}" fill="#f97316" opacity=".3" rx="1.5"><title>${t.months[mo]} ${esc(t.dd.prev)}: ${this._fmt(a, 0)} Kd</title></rect>`;
      if (b > 0) s += `<rect x="${(x + bw * 0.5).toFixed(1)}" y="${(H - padB - (b / mx) * (H - padB - top)).toFixed(1)}" width="${(bw * 0.36).toFixed(1)}" height="${((b / mx) * (H - padB - top)).toFixed(1)}" fill="#ea580c" rx="1.5"><title>${t.months[mo]}: ${this._fmt(b, 0)} Kd</title></rect>`;
      s += `<text x="${(x + bw / 2).toFixed(1)}" y="${H - 3}" class="bl muted">${t.months[mo]}</text>`;
    });
    s += `<line x1="0" x2="${W}" y1="${H - padB}" y2="${H - padB}" class="axis"/>`;
    const chips = [
      this._chip("mdi:radiator", `${t.dd.g} ${sY}/${String(sY + 1).slice(2)}`, `${this._fmt(curS.g, 0)} Kd`),
      this._chip("mdi:compare-horizontal", t.dd.vs_prev, ok(pct) ? `${pct > 0 ? "+" : ""}${this._fmt(pct, 0)} % (${this._fmt(prevS.g, 0)} Kd)` : "–"),
      this._chip("mdi:calendar-today", t.dd.heat_days, `${curS.hd} ${t.veg.d}`),
      this._chip("mdi:snowflake-thermometer", t.dd.cdd, `${this._fmt(curS.cdd, 0)} Kd${prevFull.n > 300 ? ` · ${esc(t.last_year)} ${this._fmt(prevFull.cdd, 0)}` : ""}`),
    ];
    return `<div class="panel"><div class="panel-t row"><span>${esc(t.dd.title)}</span><span class="small muted">G${ti}/${tb} · ${esc(t.dd.season)}</span></div>
      <div class="chips ex">${chips.join("")}</div>
      ${ok(pct) ? `<div class="small center" style="margin:6px 0">${esc(pct < 0 ? t.dd.less : t.dd.more).replace("{p}", this._fmt(Math.abs(pct), 0))}</div>` : ""}
      <svg viewBox="0 0 ${W} ${H}" class="bars">${s}</svg>
      <div class="legend center small"><span><i style="background:#ea580c"></i>${sY}/${String(sY + 1).slice(2)}</span><span><i style="background:#f97316;opacity:.35"></i>${sY - 1}/${String(sY).slice(2)}</span></div>
      <div class="small muted">${esc(t.dd.hint.replaceAll("{ti}", ti).replaceAll("{tb}", tb))}</div></div>`;
  }

  /* --------------------------------------------------- Lüften & Schimmelrisiko */

  _indoorClimate() {
    const t = this._t;
    const c = this._config;
    const Ti = this._toC(this._val("indoor_temp_entity"), "indoor_temp_entity");
    const RHi = this._val("indoor_humidity_entity");
    const To = this._toC(this._val("outdoor_temp_entity"));
    const RHo = this._val("humidity_entity");
    if (!ok(Ti) || !ok(RHi)) return `<div class="panel"><div class="panel-t">${esc(t.air.title)}</div><div class="empty small">${esc(t.air.need)}</div></div>`;
    const AHi = absHum(Ti, RHi), AHo = ok(To) && ok(RHo) ? absHum(To, RHo) : NaN;
    // Was hätte Außenluft drinnen für eine relative Feuchte?
    const rhIfVent = ok(AHo) ? clamp((AHo / absHum(Ti, 100)) * 100, 0, 100) : NaN;
    const dAH = ok(AHo) ? AHo - AHi : NaN;
    let verdict, vcls;
    if (!ok(dAH)) { verdict = t.air.v_unknown; vcls = ""; }
    else if (dAH <= -1.5) { verdict = t.air.v_dry.replace("{d}", this._fmt(-dAH, 1)); vcls = "good"; }
    else if (dAH < -0.5) { verdict = t.air.v_some; vcls = "ok"; }
    else if (dAH > 0.5) { verdict = t.air.v_wet.replace("{d}", this._fmt(dAH, 1)); vcls = "bad"; }
    else { verdict = t.air.v_none; vcls = ""; }
    const td = dewPointC(Ti, RHi);
    // Wandoberfläche nach DIN 4108-2: fRsi = 0,7
    const fr = clamp(num(c.mold_frsi) || 0.7, 0.5, 0.95);
    const Tsi = ok(To) ? To + fr * (Ti - To) : NaN;
    const rhWall = ok(Tsi) ? clamp((AHi / absHum(Tsi, 100)) * 100, 0, 100) : NaN;
    const mold = !ok(rhWall) ? -1 : rhWall >= 80 ? 3 : rhWall >= 70 ? 2 : rhWall >= 60 ? 1 : 0;
    const comfort = Ti >= 19 && Ti <= 24 && RHi >= 35 && RHi <= 65 ? 0 : Ti >= 17 && Ti <= 26 && RHi >= 30 && RHi <= 70 ? 1 : 2;
    // Behaglichkeitsdiagramm
    const W = 200, H = 150, L = 24, top = 6, bot = 18;
    const X = (T) => L + ((clamp(T, 14, 30) - 14) / 16) * (W - L - 4), Y = (rh) => top + (1 - (clamp(rh, 10, 90) - 10) / 80) * (H - top - bot);
    let s = `<rect x="${X(17)}" y="${Y(70)}" width="${X(26) - X(17)}" height="${Y(30) - Y(70)}" fill="#facc15" opacity=".18" rx="4"/>
      <rect x="${X(19)}" y="${Y(65)}" width="${X(24) - X(19)}" height="${Y(35) - Y(65)}" fill="#22c55e" opacity=".25" rx="4"/>`;
    for (let T = 14; T <= 30; T += 4) s += `<text x="${X(T)}" y="${H - 4}" class="bl muted">${this._fmt(this._fromC(T, "indoor_temp_entity"), 0)}°</text>`;
    for (let rh = 20; rh <= 80; rh += 20) s += `<text x="${L - 3}" y="${Y(rh)}" class="al" text-anchor="end">${rh}%</text>`;
    // Spur der letzten 24 h
    const tp = this._series("indoor_temp_entity"), hp = this._series("indoor_humidity_entity");
    if (tp.length && hp.length) {
      for (let k = 24; k >= 1; k--) {
        const tt = Date.now() - k * HOUR;
        const a = this._toC(valueAt(tp, tt), "indoor_temp_entity"), b = valueAt(hp, tt);
        if (ok(a) && ok(b)) s += `<circle cx="${X(a).toFixed(1)}" cy="${Y(b).toFixed(1)}" r="1.8" fill="var(--thor-blue)" opacity="${(0.15 + 0.5 * (1 - k / 24)).toFixed(2)}"/>`;
      }
    }
    s += `<circle cx="${X(Ti).toFixed(1)}" cy="${Y(RHi).toFixed(1)}" r="5" fill="var(--thor-accent)" stroke="#fff" stroke-width="1.5"/>`;
    s += `<line x1="${L}" x2="${W}" y1="${H - bot}" y2="${H - bot}" class="axis"/>`;
    const lv = ["#2e9d5b", "#eab308", "#f97316", "#dc2626"];
    return `<div class="panel"><div class="panel-t">${esc(t.air.title)}</div>
      <div class="vent ${vcls}"><ha-icon icon="mdi:window-open-variant"></ha-icon><div><b>${esc(verdict)}</b>${ok(rhIfVent) ? `<div class="small muted">${esc(t.air.after.replace("{rh}", this._fmt(rhIfVent, 0)))}</div>` : ""}</div></div>
      <div class="air2">
        <svg viewBox="0 0 ${W} ${H}" class="comfort">${s}</svg>
        <div class="chips">
          ${this._chip("mdi:home-thermometer", t.indoor, `${this._fmt(this._fromC(Ti, "indoor_temp_entity"), 1)} ${this._tempUnit("indoor_temp_entity")} · ${this._fmt(RHi, 0)} %`, "indoor_humidity_entity")}
          ${this._chip("mdi:water", t.air.ah_in, `${this._fmt(AHi, 1)} g/m³`)}
          ${ok(AHo) ? this._chip("mdi:water-outline", t.air.ah_out, `${this._fmt(AHo, 1)} g/m³`) : ""}
          ${this._chip("mdi:water-thermometer", t.air.dew_in, `${this._fmt(this._fromC(td, "indoor_temp_entity"), 1)} ${this._tempUnit("indoor_temp_entity")}`)}
          ${ok(Tsi) ? this._chip("mdi:wall", t.air.wall, `${this._fmt(this._fromC(Tsi, "indoor_temp_entity"), 1)} ${this._tempUnit("indoor_temp_entity")} · ${this._fmt(rhWall, 0)} %`) : ""}
          ${mold >= 0 ? `<div class="chip"><ha-icon icon="mdi:bacteria-outline" style="color:${lv[mold]}"></ha-icon><div><div class="chip-l">${esc(t.air.mold)}</div><div class="chip-v" style="color:${lv[mold]}">${esc(t.lvl[mold])}</div></div></div>` : ""}
          <div class="chip"><ha-icon icon="mdi:sofa-outline" style="color:${lv[comfort * 1.5 | 0]}"></ha-icon><div><div class="chip-l">${esc(t.air.comfort)}</div><div class="chip-v">${esc(t.air.cf[comfort])}</div></div></div>
        </div>
      </div>
      <div class="small muted">${esc(t.air.hint.replace("{f}", this._fmt(fr, 2)))}</div></div>`;
  }

  /* ----------------------------------------------------- Garten-Wasserbilanz */

  _et0(d) {
    // Makkink, wenn Strahlung vorhanden, sonst Hargreaves-Samani (FAO-56)
    if (!ok(d.mean)) return NaN;
    if (ok(d.sunKwh) && d.sunKwh > 0) {
      const Rs = d.sunKwh * 3.6; // MJ/m²
      const T = d.mean;
      const es = 0.6108 * Math.exp((17.27 * T) / (T + 237.3));
      const delta = (4098 * es) / (T + 237.3) ** 2;
      return Math.max(0, 0.61 * (delta / (delta + 0.066)) * (Rs / 2.45) - 0.12);
    }
    if (!ok(d.max) || !ok(d.min)) return NaN;
    const lat = rad(this._loc()?.lat ?? 51);
    const J = Math.floor((d.t - new Date(new Date(d.t).getFullYear(), 0, 0)) / DAY);
    const dr = 1 + 0.033 * Math.cos((2 * Math.PI * J) / 365), dec = 0.409 * Math.sin((2 * Math.PI * J) / 365 - 1.39);
    const ws = Math.acos(clamp(-Math.tan(lat) * Math.tan(dec), -1, 1));
    const Ra = ((24 * 60) / Math.PI) * 0.082 * dr * (ws * Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.sin(ws));
    return Math.max(0, 0.0023 * (d.mean + 17.8) * Math.sqrt(Math.max(0, d.max - d.min)) * Ra * 0.408);
  }

  _waterBalance() {
    const t = this._t;
    const days = this._daysX();
    if (!days) return `<div class="panel"><div class="panel-t">${esc(t.wb.title)}</div>${this._noLong()}</div>`;
    const n = 30;
    const today = new Date().setHours(0, 0, 0, 0);
    const byDay = new Map(days.map((d) => [d.t, d]));
    const list = [];
    for (let i = n; i >= 1; i--) {
      const k = new Date(today - i * DAY + 12 * HOUR).setHours(0, 0, 0, 0);
      const d = byDay.get(k) || { t: k };
      list.push({ t: k, rain: ok(d.rain) ? d.rain : NaN, et: this._et0(d) });
    }
    if (!list.some((x) => ok(x.et))) return `<div class="panel"><div class="panel-t">${esc(t.wb.title)}</div>${this._noLong()}</div>`;
    const bal = (k) => list.slice(-k).reduce((a, x) => a + (ok(x.rain) ? x.rain : 0) - (ok(x.et) ? x.et : 0), 0);
    const b7 = bal(7), b14 = bal(14), b30 = bal(30);
    const et7 = list.slice(-7).reduce((a, x) => a + (ok(x.et) ? x.et : 0), 0);
    // Regen laut Vorhersage (2 Tage)
    const fcRain = (this._fc?.daily || []).slice(0, 2).reduce((a, f) => a + (ok(num(f.precipitation)) ? num(f.precipitation) : 0), 0);
    const deficit = Math.max(0, -b7);
    let advice, acls;
    if (deficit < 8) { advice = t.wb.no_need; acls = "good"; }
    else if (fcRain >= deficit * 0.7) { advice = t.wb.rain_coming.replace("{mm}", this._fmt(fcRain, 0)); acls = "ok"; }
    else { advice = t.wb.water.replace("{l}", this._fmt(clamp(Math.round(deficit / 5) * 5, 10, 30), 0)); acls = "bad"; }
    const cool = new Date().getMonth() <= 2 || new Date().getMonth() >= 10;
    if (cool && deficit >= 8) { advice = t.wb.winter; acls = "ok"; }
    // Diagramm
    const W = 320, H = 130, mid = 72, sc = 4;
    const bw = W / n;
    let s = `<line x1="0" x2="${W}" y1="${mid}" y2="${mid}" class="axis"/>`;
    let cum = 0, d = "";
    const mxAbs = Math.max(10, ...list.map((x) => Math.max(ok(x.rain) ? x.rain : 0, ok(x.et) ? x.et : 0)));
    const k = Math.min(sc, 50 / mxAbs);
    list.forEach((x, i) => {
      const xx = i * bw;
      if (ok(x.rain) && x.rain > 0) s += `<rect x="${(xx + bw * 0.15).toFixed(1)}" y="${(mid - x.rain * k).toFixed(1)}" width="${(bw * 0.7).toFixed(1)}" height="${(x.rain * k).toFixed(1)}" fill="#3b82f6" rx="1"><title>${this._date(x.t)}: ${this._fmt(x.rain, 1)} mm</title></rect>`;
      if (ok(x.et) && x.et > 0) s += `<rect x="${(xx + bw * 0.15).toFixed(1)}" y="${mid}" width="${(bw * 0.7).toFixed(1)}" height="${(x.et * k).toFixed(1)}" fill="#f97316" opacity=".75" rx="1"><title>${this._date(x.t)}: ET₀ ${this._fmt(x.et, 1)} mm</title></rect>`;
      cum += (ok(x.rain) ? x.rain : 0) - (ok(x.et) ? x.et : 0);
      d += `${i ? "L" : "M"}${(xx + bw / 2).toFixed(1)},${clamp(mid - cum * (k / 2), 4, H - 14).toFixed(1)} `;
      if (i % 7 === 2) s += `<text x="${(xx + bw / 2).toFixed(1)}" y="${H - 2}" class="bl muted">${new Date(x.t).getDate()}.</text>`;
    });
    s += `<path d="${d}" fill="none" stroke="#2e7d32" stroke-width="1.8"/>`;
    return `<div class="panel"><div class="panel-t row"><span>${esc(t.wb.title)}</span><span class="small muted">ET₀ ${days.some((x) => ok(x.sunKwh)) ? "Makkink" : "Hargreaves"}</span></div>
      <div class="vent ${acls}"><ha-icon icon="mdi:watering-can-outline"></ha-icon><div><b>${esc(advice)}</b><div class="small muted">${esc(t.wb.basis.replace("{b}", `${b7 > 0 ? "+" : ""}${this._fmt(b7, 1)}`).replace("{et}", this._fmt(et7, 1)))}</div></div></div>
      <div class="chips ex">
        ${this._chip("mdi:calendar-week", `${t.wb.bal} 7 ${t.veg.d}`, `${b7 > 0 ? "+" : ""}${this._fmt(b7, 1)} mm`)}
        ${this._chip("mdi:calendar-range", `${t.wb.bal} 14 ${t.veg.d}`, `${b14 > 0 ? "+" : ""}${this._fmt(b14, 1)} mm`)}
        ${this._chip("mdi:calendar-month", `${t.wb.bal} 30 ${t.veg.d}`, `${b30 > 0 ? "+" : ""}${this._fmt(b30, 1)} mm`)}
        ${fcRain > 0 ? this._chip("mdi:weather-rainy", t.wb.fc, `${this._fmt(fcRain, 1)} mm`, "weather_entity") : ""}
      </div>
      <svg viewBox="0 0 ${W} ${H}" class="bars">${s}</svg>
      <div class="legend center small"><span><i style="background:#3b82f6"></i>${esc(t.rain)}</span><span><i style="background:#f97316"></i>${esc(t.wb.et)}</span><span><i style="background:#2e7d32"></i>${esc(t.wb.cum)}</span></div></div>`;
  }

  /* ------------------------------------------------------------- Nachtfrost */

  _nightFrostCalc() {
    const now = new Date();
    const T = this._toC(this._val("outdoor_temp_entity"));
    const td = this._dewC();
    if (!ok(T)) return null;
    const kmh = this._kmh("wind_speed_entity");
    // Bewölkung: Vorhersage der Nacht, sonst Klarheit des Nachmittags
    let clear = NaN;
    const hourly = this._fc?.hourly || [];
    const night = hourly.filter((f) => { const h = new Date(Date.parse(f.datetime)).getHours(); const dt = Date.parse(f.datetime) - Date.now(); return dt > 0 && dt < 18 * HOUR && (h >= 21 || h <= 7); });
    if (night.length) clear = night.filter((f) => ["clear-night", "sunny", "partlycloudy"].includes(f.condition)).length / night.length;
    else if (this._radKey()) {
      const loc = this._loc();
      const pts = this._radSeries().filter((p) => p.t > Date.now() - 4 * HOUR);
      if (loc && pts.length) {
        const r = pts.map((p) => { const cs = clearSky(solarPos(p.t, loc.lat, loc.lon).el); return cs > 80 ? p.v / cs : NaN; }).filter(ok);
        if (r.length) clear = clamp(r.reduce((a, b) => a + b, 0) / r.length, 0, 1);
      }
    }
    // Abkühlung: klar & windstill stark, bewölkt/windig schwach
    const calm = !ok(kmh) || kmh < 8;
    const cl = ok(clear) ? clear : 0.5;
    const drop = (calm ? 1 : ok(kmh) && kmh > 20 ? 0.35 : 0.65) * (0.35 + 0.65 * cl);
    // Basis Taupunkt-Methode: Tmin ≈ Td − k (klar) … Td + 1 (bedeckt), nie über aktueller Temperatur
    let est = ok(td) ? td - 2.5 * drop + 1 * (1 - drop) : T - 6 * drop;
    const fcMin = night.length ? Math.min(...night.map((f) => num(f.temperature)).filter(ok)) : NaN;
    const fcMinC = ok(fcMin) && /F/.test(this._hass?.states?.[this._config.weather_entity]?.attributes?.temperature_unit || "") ? (fcMin - 32) / 1.8 : fcMin;
    if (ok(fcMinC)) est = (est + fcMinC) / 2;
    est = Math.min(est, T);
    const ground = est - (1 + 2.5 * drop);
    // letzte Nacht gemessen (18–9 Uhr)
    const n0 = new Date(now); n0.setHours(18, 0, 0, 0); if (now.getHours() < 18) n0.setDate(n0.getDate() - 1);
    const lastNight = minMax(this._series("outdoor_temp_entity"), n0.getTime(), Math.min(Date.now(), n0.getTime() + 15 * HOUR), null).min;
    return { est, ground, clear, calm, fcMin: fcMinC, lastNight, td };
  }

  _nightFrost() {
    const t = this._t;
    const r = this._nightFrostCalc();
    if (!r) return "";
    const lvl = r.est <= -5 ? 3 : r.est <= 0 ? 2 : r.ground <= 0 ? 1 : 0;
    const lv = ["#2e9d5b", "#eab308", "#f97316", "#dc2626"];
    const warn = [];
    if (r.ground <= 0 && ok(r.td) && r.td <= 0.5) warn.push(["mdi:car-defrost-front", t.nf.car]);
    if (r.ground <= 2) warn.push(["mdi:flower-outline", t.nf.plants]);
    if (r.est <= -5) warn.push(["mdi:pipe-leak", t.nf.pipes]);
    if (r.est <= 1 && this._rainToday() > 0) warn.push(["mdi:road-variant", t.nf.ice]);
    const u = this._tempUnit();
    return `<div class="panel"><div class="panel-t row"><span>${esc(t.nf.title)}</span><span class="small muted">${esc(t.nf.method)}</span></div>
      <div class="vent" style="border-left-color:${lv[lvl]}"><ha-icon icon="${lvl ? "mdi:snowflake-alert" : "mdi:weather-night"}" style="color:${lv[lvl]}"></ha-icon><div>
        <b>${esc(t.nf.lvl[lvl])}</b>
        <div class="small muted">${esc(t.nf.est)}: <b>${this._fmt(this._fromC(r.est), 1)} ${esc(u)}</b> · ${esc(t.nf.ground)}: <b>${this._fmt(this._fromC(r.ground), 1)} ${esc(u)}</b></div></div></div>
      <div class="chips ex">
        ${this._chip("mdi:weather-night", t.nf.sky, ok(r.clear) ? `${Math.round(r.clear * 100)} % ${t.nf.clear}` : "–")}
        ${this._chip("mdi:weather-windy", t.wind, r.calm ? t.nf.calm : t.nf.windy, "wind_speed_entity")}
        ${ok(r.fcMin) ? this._chip("mdi:crystal-ball", t.nf.model, `${this._fmt(this._fromC(r.fcMin), 1)} ${u}`, "weather_entity") : ""}
        ${r.lastNight ? this._chip("mdi:history", t.nf.last, `${this._fmt(r.lastNight.v, 1)} ${u} · ${this._time(r.lastNight.t)}`, "outdoor_temp_entity") : ""}
      </div>
      ${warn.length ? `<div class="pnotes" style="margin-top:6px">${warn.map(([i, x]) => `<div class="pnote up"><ha-icon icon="${i}"></ha-icon><span>${esc(x)}</span></div>`).join("")}</div>` : ""}
    </div>`;
  }

  /* ---------------------------------------------------------------- Biowetter */

  _bio() {
    const t = this._t;
    const now = Date.now();
    const pp = this._series("pressure_entity");
    const p = this._val("pressure_entity");
    const p24 = valueAt(pp, now - DAY);
    const dp24 = ok(p) && ok(p24) ? p - p24 : NaN;
    const pr = this._pressureTrend();
    const T = this._toC(this._val("outdoor_temp_entity"));
    const rh = this._val("humidity_entity");
    const kmh = this._kmh("wind_speed_entity");
    const td = this._dewC();
    const feels = this._config.feels_like_entity ? this._toC(this._val("feels_like_entity"), "feels_like_entity") : feelsLikeC(T, rh, kmh);
    const days = this._days() || [];
    const today = new Date().setHours(0, 0, 0, 0);
    const yd = days.find((d) => d.t === new Date(today - 12 * HOUR).setHours(0, 0, 0, 0));
    const tdNow = days.find((d) => d.t === today);
    const dTmax = yd && tdNow && ok(yd.max) && ok(tdNow.max) ? tdNow.max - yd.max : NaN;
    const L = (v, a, b, c) => (!ok(v) ? 0 : v >= c ? 3 : v >= b ? 2 : v >= a ? 1 : 0);
    const f = [];
    const pLvl = L(Math.abs(dp24), 4, 8, 12), p3 = L(Math.abs(pr.d), 2, 3.5, 6);
    if (pLvl || p3) f.push(t.bio.f_press.replace("{d}", `${dp24 > 0 ? "+" : ""}${this._fmt(dp24, 1)}`));
    const tLvl = L(Math.abs(dTmax), 4, 6, 9);
    if (tLvl) f.push(t.bio.f_temp.replace("{d}", `${dTmax > 0 ? "+" : ""}${this._fmt(dTmax, 1)}`));
    const heat = L(feels, 26, 32, 38), sultry = L(td, 16, 18, 21), cold = L(-feels, 0, 5, 12);
    if (heat) f.push(t.bio.f_heat);
    if (sultry) f.push(t.bio.f_sultry);
    if (cold) f.push(t.bio.f_cold);
    const damp = ok(T) && T < 10 && ok(rh) && rh >= 85 ? (rh >= 95 ? 2 : 1) : 0;
    if (damp) f.push(t.bio.f_damp);
    const pollen = (() => { const pd = this._pollenData(); const b = pd.some((d) => d.mine) ? pd.filter((d) => d.mine) : pd; const m = Math.max(...b.map((d) => d.today).filter(ok), 0); return m >= 2.5 ? 2 : m >= 1.5 ? 1 : 0; })();
    const cats = [
      ["mdi:heart-pulse", t.bio.c_circ, Math.max(heat, sultry, tLvl, Math.min(2, pLvl))],
      ["mdi:head-flash-outline", t.bio.c_head, Math.max(pLvl, p3, Math.min(2, tLvl))],
      ["mdi:lungs", t.bio.c_resp, Math.max(cold, pollen)],
      ["mdi:human-handsdown", t.bio.c_joint, Math.max(damp, cold > 0 && pr.d < -1 ? 2 : 0, p3 && T < 10 ? 1 : 0)],
    ];
    const lv = ["#2e9d5b", "#eab308", "#f97316", "#dc2626"];
    const overall = Math.max(...cats.map((x) => x[2]));
    return `<div class="panel"><div class="panel-t row"><span>${esc(t.bio.title)}</span><span class="small" style="color:${lv[overall]}"><b>${esc(t.bio.lvl[overall])}</b></span></div>
      <div class="bios">${cats.map(([i, l, v]) => `<div class="bio"><ha-icon icon="${i}" style="color:${lv[v]}"></ha-icon><div class="small">${esc(l)}</div><div class="bbar"><span style="width:${(v / 3) * 100}%;background:${lv[v]}"></span></div><div class="small" style="color:${lv[v]}">${esc(t.bio.short[v])}</div></div>`).join("")}</div>
      ${f.length ? `<div class="pnotes" style="margin-top:6px">${f.map((x) => `<div class="pnote"><ha-icon icon="mdi:information-outline"></ha-icon><span>${esc(x)}</span></div>`).join("")}</div>` : `<div class="small muted" style="margin-top:6px">${esc(t.bio.calm)}</div>`}
      <div class="small muted" style="margin-top:6px">${esc(t.bio.note)}</div></div>`;
  }

  /* ---------------------------------------------------------- Regen-Analyse */

  _rainAnalysis() {
    const t = this._t;
    const c = this._config;
    const days = this._daysX();
    const hourly = this._rainHourly || [];
    if (!days && !hourly.length) return "";
    const thr = c.rain_day_threshold;
    const y = new Date().getFullYear();
    // Trocken-/Regenperioden aus Tageswerten
    const spells = (yy) => {
      let dry = 0, wet = 0, bestDry = { n: 0 }, bestWet = { n: 0 }, curDry = 0;
      for (const d of (days || []).filter((x) => new Date(x.t).getFullYear() === yy && ok(x.rain))) {
        if (d.rain < thr) { dry++; wet = 0; if (dry > bestDry.n) bestDry = { n: dry, end: d.t }; }
        else { wet++; dry = 0; if (wet > bestWet.n) bestWet = { n: wet, end: d.t }; }
        curDry = dry;
      }
      return { bestDry, bestWet, curDry };
    };
    const sp = spells(y);
    // Ereignisse aus Stundensummen: Regen getrennt durch ≥ 6 trockene Stunden
    const ev = [];
    let cur = null;
    for (const h of hourly) {
      if (h.v >= 0.1) {
        if (cur && h.start - cur.end <= 6 * HOUR) { cur.end = h.start + HOUR; cur.sum += h.v; cur.max = Math.max(cur.max, h.v); cur.hours.push(h); }
        else { cur = { start: h.start, end: h.start + HOUR, sum: h.v, max: h.v, hours: [h] }; ev.push(cur); }
      }
    }
    for (const e of ev) {
      let m6 = 0;
      for (const h of e.hours) m6 = Math.max(m6, e.hours.filter((x) => x.start >= h.start && x.start < h.start + 6 * HOUR).reduce((a, x) => a + x.v, 0));
      e.max6 = m6;
      e.cls = e.max >= 40 || m6 >= 60 ? 3 : e.max >= 25 || m6 >= 35 ? 2 : e.max >= 15 || m6 >= 20 ? 1 : 0;
    }
    const yearEv = ev.filter((e) => new Date(e.start).getFullYear() === y);
    const heavy = yearEv.filter((e) => e.cls >= 1);
    const maxH = hourly.filter((h) => new Date(h.start).getFullYear() === y).reduce((b, h) => (!b || h.v > b.v ? h : b), null);
    const max6 = yearEv.reduce((b, e) => (!b || e.max6 > b.max6 ? e : b), null);
    const recent = ev.filter((e) => e.sum >= 0.5).slice(-8).reverse();
    const cls = t.ra.cls;
    const ccol = ["#93c5fd", "#f59e0b", "#f97316", "#dc2626"];
    const rows = recent.map((e) => `<div class="evrow"><span class="evd">${this._date(e.start)} ${this._time(e.start)}</span><span>${Math.round((e.end - e.start) / HOUR)} h</span><b>${this._fmt(e.sum, 1)} mm</b><span class="muted">max ${this._fmt(e.max, 1)} mm/h</span>${e.cls ? `<span class="evc" style="background:${ccol[e.cls]}">${esc(cls[e.cls])}</span>` : "<span></span>"}</div>`).join("");
    return `<div class="panel"><div class="panel-t row"><span>${esc(t.ra.title)} ${y}</span><span class="small muted">${esc(t.ra.dwd)}</span></div>
      <div class="chips ex">
        ${this._chip("mdi:weather-sunny-off", t.ra.dry_now, `${sp.curDry} ${t.veg.d}`)}
        ${sp.bestDry.n ? this._chip("mdi:weather-sunny", t.ra.dry_max, `${sp.bestDry.n} ${t.veg.d} · ${t.ra.until} ${this._date(sp.bestDry.end)}`) : ""}
        ${sp.bestWet.n ? this._chip("mdi:weather-rainy", t.ra.wet_max, `${sp.bestWet.n} ${t.veg.d} · ${t.ra.until} ${this._date(sp.bestWet.end)}`) : ""}
        ${hourly.length ? this._chip("mdi:weather-pouring", t.ra.heavy, `${heavy.length} · ${yearEv.length} ${t.ra.events}`) : ""}
        ${maxH && maxH.v > 0 ? this._chip("mdi:speedometer", t.ra.max1, `${this._fmt(maxH.v, 1)} mm · ${this._date(maxH.start)}`) : ""}
        ${max6 && max6.max6 > 0 ? this._chip("mdi:timer-sand", t.ra.max6, `${this._fmt(max6.max6, 1)} mm · ${this._date(max6.start)}`) : ""}
      </div>
      ${rows ? `<div class="panel-t small" style="margin-top:8px">${esc(t.ra.recent)}</div><div class="evlist">${rows}</div>` : hourly.length ? "" : `<div class="small muted">${esc(t.ra.need)}</div>`}
    </div>`;
  }

  /* -------------------------------------------------------------- Jahreszeit */

  _south() {
    const h = this._config.hemisphere;
    const loc = this._loc();
    return h === "south" || (h === "auto" && !!loc && loc.lat < 0);
  }

  /** Aktuelle Jahreszeiten (meteorologisch + astronomisch) */
  _seasonInfo(now = Date.now()) {
    const south = this._south();
    const met = metSeason(now, south);
    // astronomisch: letzte und nächste Tagundnachtgleiche/Sonnenwende
    const y = new Date(now).getFullYear();
    const ev = [];
    for (const yy of [y - 1, y, y + 1]) for (let k = 0; k < 4; k++) ev.push({ t: seasonEvent(yy, k), k });
    ev.sort((a, b) => a.t - b.t);
    const i = ev.findIndex((e) => e.t > now);
    const cur = ev[i - 1], next = ev[i];
    // März-Ereignis = Frühling (Norden) bzw. Herbst (Süden)
    const astroIdx = (k) => (south ? (k + 2) % 4 : k);
    return { met, astro: { idx: astroIdx(cur.k), start: cur.t, end: next.t, nextIdx: astroIdx(next.k), nextK: next.k }, south };
  }

  _seasonChip() {
    const t = this._t;
    const s = this._seasonInfo();
    const left = Math.ceil((s.met.end - Date.now()) / DAY);
    return this._chip(SEASON_ICON[s.met.idx], t.season_title, `${t.seasons[s.met.idx]} · ${t.sea.left.replace("{n}", left)}`);
  }

  _season() {
    const t = this._t;
    const c = this._config;
    const now = Date.now();
    const s = this._seasonInfo(now);
    const main = c.season_type === "astro" ? { idx: s.astro.idx, start: s.astro.start, end: s.astro.end } : s.met;
    const other = c.season_type === "astro" ? s.met : s.astro;
    const col = SEASON_COLOR[main.idx];
    const pct = clamp((now - main.start) / (main.end - main.start), 0, 1);
    const dayN = Math.floor((now - main.start) / DAY) + 1, dayTot = Math.round((main.end - main.start) / DAY);
    const evName = t.sea.events[s.astro.nextK];
    // Tageslänge und Änderung
    const loc = this._loc();
    let dl = "";
    if (loc) {
      const a = sunTimes(now, loc.lat, loc.lon), b = sunTimes(now - DAY, loc.lat, loc.lon);
      if (a.rise && b.rise) {
        const d = (a.set - a.rise) - (b.set - b.rise);
        dl = this._chip("mdi:timer-sand", t.daylength, `${this._dur(a.set - a.rise)} (${d >= 0 ? "+" : "−"}${this._fmt(Math.abs(d) / 60000, 1)} min)`);
      }
    }
    // bisherige Jahreszeit gegen dieselbe Jahreszeit früherer Jahre (gleicher Zeitraum)
    const days = this._daysX();
    let cmp = "", table = "";
    if (days && days.length) {
      const stats = (from, to) => {
        const ds = days.filter((d) => d.t >= from && d.t < to);
        const T = ds.filter((d) => ok(d.mean));
        return {
          n: ds.length,
          mean: T.length ? T.reduce((a, d) => a + d.mean, 0) / T.length : NaN,
          rain: ds.some((d) => ok(d.rain)) ? ds.reduce((a, d) => a + (ok(d.rain) ? d.rain : 0), 0) : NaN,
          sun: ds.some((d) => ok(d.sun)) ? ds.reduce((a, d) => a + (ok(d.sun) ? d.sun : 0), 0) : NaN,
          frost: ds.filter((d) => d.min < 0).length, summer: ds.filter((d) => d.max >= 25).length,
          tmax: Math.max(...ds.map((d) => d.max).filter(ok)), tmin: Math.min(...ds.map((d) => d.min).filter(ok)),
        };
      };
      const sm = s.met;
      const sofar = now - sm.start;
      const curS = stats(sm.start, now + 1);
      const prev = [];
      for (let k = 1; k <= 30; k++) {
        const st = new Date(sm.start); st.setFullYear(st.getFullYear() - k);
        const s0 = st.getTime();
        if (s0 < days[0].t - 20 * DAY) break;
        const r = stats(s0, s0 + sofar);
        if (r.n > sofar / DAY * 0.7 && ok(r.mean)) prev.push(r);
      }
      const avg = (k) => { const v = prev.map((r) => r[k]).filter(ok); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN; };
      if (prev.length && ok(curS.mean)) {
        const dT = curS.mean - avg("mean");
        const dR = ok(curS.rain) && avg("rain") > 0 ? (curS.rain / avg("rain") - 1) * 100 : NaN;
        const dS = ok(curS.sun) && avg("sun") > 0 ? (curS.sun / avg("sun") - 1) * 100 : NaN;
        const word = dT >= 1 ? t.sea.warmer : dT <= -1 ? t.sea.colder : t.sea.normal;
        cmp = `<div class="panel-t small" style="margin-top:10px">${esc(t.sea.sofar.replace("{s}", t.seasons[sm.idx]).replace("{n}", prev.length))}</div>
          <div class="small" style="margin-bottom:4px"><b>${esc(word)}</b></div>
          <div class="chips ex">
            ${this._chip("mdi:thermometer", `Ø ${t.temperature}`, `${this._tC(curS.mean)} (${dT > 0 ? "+" : ""}${this._fmt(dT, 1)} K)`)}
            ${ok(curS.rain) ? this._chip("mdi:weather-rainy", t.rain, `${this._fmt(curS.rain, 0)} mm${ok(dR) ? ` (${dR > 0 ? "+" : ""}${this._fmt(dR, 0)} %)` : ""}`) : ""}
            ${ok(curS.sun) ? this._chip("mdi:sun-clock", t.sun_hours, `${this._fmt(curS.sun, 0)} h${ok(dS) ? ` (${dS > 0 ? "+" : ""}${this._fmt(dS, 0)} %)` : ""}`) : ""}
            ${this._chip(sm.idx === 1 ? "mdi:weather-sunny" : "mdi:snowflake", sm.idx === 1 ? t.cd.summer : t.cd.frost, `${sm.idx === 1 ? curS.summer : curS.frost} (Ø ${this._fmt(avg(sm.idx === 1 ? "summer" : "frost"), 0)})`)}
          </div>`;
      }
      // Tabelle der letzten meteorologischen Jahreszeiten
      const rows = [];
      let st = sm.start;
      for (let k = 0; k < 9; k++) {
        const info = metSeason(st, s.south);
        const r = stats(info.start, Math.min(info.end, now + 1));
        if (r.n < 20) break;
        const same = [];
        for (let j = 1; j <= 30; j++) {
          const d0 = new Date(info.start); d0.setFullYear(d0.getFullYear() - j);
          const i2 = metSeason(d0.getTime() + DAY, s.south);
          const rr = stats(i2.start, i2.end);
          if (rr.n >= 80 && ok(rr.mean)) same.push(rr.mean);
          else if (i2.start < days[0].t) break;
        }
        const anom = same.length && r.n >= 80 ? r.mean - same.reduce((a, b) => a + b, 0) / same.length : NaN;
        const yl = info.idx === 3 ? `${new Date(info.start).getFullYear()}/${String(new Date(info.start).getFullYear() + 1).slice(2)}` : new Date(info.start).getFullYear();
        rows.push(`<tr class="${k === 0 ? "cur" : ""}"><td><ha-icon icon="${SEASON_ICON[info.idx]}" style="--mdc-icon-size:16px;color:${SEASON_COLOR[info.idx]}"></ha-icon> ${esc(t.seasons[info.idx])} ${yl}${k === 0 ? ` <span class="muted">${esc(t.sea.running)}</span>` : ""}</td>
          <td style="color:${tempColor(r.mean)}">${this._fmt(this._fromC(r.mean), 1)}</td>
          <td style="color:${!ok(anom) ? "" : anom > 0 ? "#dc2626" : "#2563eb"}">${ok(anom) ? `${anom > 0 ? "+" : ""}${this._fmt(anom, 1)}` : "–"}</td>
          <td>${ok(r.tmax) ? this._fmt(this._fromC(r.tmax), 1) : "–"}</td><td>${ok(r.tmin) ? this._fmt(this._fromC(r.tmin), 1) : "–"}</td>
          <td>${ok(r.rain) ? this._fmt(r.rain, 0) : "–"}</td>${days.some((d) => ok(d.sun)) ? `<td>${ok(r.sun) ? this._fmt(r.sun, 0) : "–"}</td>` : ""}</tr>`);
        st = info.start - DAY;
      }
      if (rows.length > 1) table = `<div class="panel-t small" style="margin-top:10px">${esc(t.sea.table)}</div>
        <div class="tscroll"><table class="rtab"><thead><tr><th></th><th>Ø ${esc(this._tempUnit())}</th><th>±K</th><th>${esc(t.max)}</th><th>${esc(t.min)}</th><th>${esc(t.rain)} mm</th>${days.some((d) => ok(d.sun)) ? "<th>☀ h</th>" : ""}</tr></thead><tbody>${rows.join("")}</tbody></table></div>
        <div class="small muted">${esc(t.sea.anom_hint)}</div>`;
    }
    // Jahresring: vier Jahreszeiten mit Zeiger
    const R = 46, cx = 56, cy = 56;
    const yStart = new Date(new Date(now).getFullYear(), 0, 1).getTime(), yLen = new Date(new Date(now).getFullYear() + 1, 0, 1).getTime() - yStart;
    const ang = (tt) => (((tt - yStart) / yLen) * 360 + 360) % 360;
    let ring = "";
    for (let m = 0; m < 12; m++) {
      const a0 = (m / 12) * 360, a1 = ((m + 1) / 12) * 360;
      const idx = metSeason(new Date(new Date(now).getFullYear(), m, 15).getTime(), s.south).idx;
      ring += `<path d="${arcPath(cx, cy, R, a0 + 0.8, a1 - 0.8)}" stroke="${SEASON_COLOR[idx]}" stroke-width="12" fill="none" opacity="${idx === s.met.idx ? 1 : 0.35}"/>`;
      const [tx, ty] = pt(cx, cy, R + 12, (a0 + a1) / 2);
      if (m % 3 === 0) ring += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" class="bl muted" style="dominant-baseline:central">${t.months[m]}</text>`;
    }
    for (let k = 0; k < 4; k++) {
      const e = seasonEvent(new Date(now).getFullYear(), k);
      const [x0, y0] = pt(cx, cy, R - 8, ang(e)), [x1, y1] = pt(cx, cy, R + 7, ang(e));
      ring += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="var(--primary-text-color)" stroke-width="1.2" opacity=".6"><title>${esc(t.sea.events[k])} ${this._date(e)}</title></line>`;
    }
    const [hx, hy] = pt(cx, cy, R - 4, ang(now));
    ring += `<line x1="${cx}" y1="${cy}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="var(--thor-accent)" stroke-width="2.5" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="4" fill="var(--thor-accent)"/>`;
    const dfull = (x) => `${this._date(x)} ${this._time(x)}`;
    return `<div class="panel">
      <div class="panel-t row"><span>${esc(t.season_title)}</span><span class="small muted">${esc(c.season_type === "astro" ? t.sea.astro : t.sea.met)}${s.south ? ` · ${esc(t.sea.south)}` : ""}</span></div>
      <div class="season">
        <svg viewBox="-18 -12 148 136" class="sring">${ring}</svg>
        <div class="sinfo">
          <div class="sname" style="color:${col}"><ha-icon icon="${SEASON_ICON[main.idx]}"></ha-icon>${esc(t.seasons[main.idx])}</div>
          <div class="small muted">${this._date(main.start)} – ${this._date(main.end - DAY)} · ${esc(t.sea.day)} ${dayN}/${dayTot}</div>
          <div class="sbar"><span style="width:${(pct * 100).toFixed(1)}%;background:${col}"></span></div>
          <div class="small">${esc(c.season_type === "astro" ? t.sea.met : t.sea.astro)}: <b>${esc(t.seasons[other.idx])}</b>${other.end ? ` ${esc(t.sea.until)} ${this._date(other.end)}` : ""}</div>
        </div>
      </div>
      <div class="chips ex">
        ${this._chip(SEASON_ICON[(main.idx + 1) % 4], t.sea.next.replace("{s}", t.seasons[(main.idx + 1) % 4]), t.sea.in_days.replace("{n}", Math.ceil((main.end - now) / DAY)))}
        ${this._chip(s.astro.nextK % 2 ? "mdi:weather-sunset" : "mdi:scale-balance", evName, dfull(s.astro.end))}
        ${dl}
      </div>
      ${cmp}${table}
    </div>`;
  }

  /* ---------------------------------------------------------- Beaufort-Säulen */

  /** Beaufort mit Nachkommastelle (Lage innerhalb der Stufe) */
  _bftFrac(kmh) {
    if (!ok(kmh)) return NaN;
    const b = beaufort(kmh);
    if (b >= 12) return 12;
    const lo = b === 0 ? 0 : BFT_KMH[b - 1], hi = BFT_KMH[b];
    return b + clamp((kmh - lo) / (hi - lo), 0, 0.999);
  }

  _bftScale() {
    const t = this._t;
    const c = this._config;
    const kmh = this._kmh("wind_speed_entity");
    const gust = this._kmh("wind_gust_entity");
    if (!ok(kmh) && !ok(gust)) return "";
    const max24 = (key) => {
      const f = this._kmhFactor(key);
      const mm = minMax(this._series(key).map((p) => ({ t: p.t, v: p.v * f })), Date.now() - DAY, Date.now(), { t: Date.now(), v: this._kmh(key) });
      return mm.max;
    };
    const cols = [];
    const H = 260, top = 18, bot = 8, segH = (H - top - bot) / 13, colW = 30;
    const Y = (b) => H - bot - b * segH; // b = 0…13 (Unterkante Stufe b)
    const column = (x, label, v, mx, color) => {
      let s = "";
      for (let b = 0; b <= 12; b++) {
        s += `<rect x="${x}" y="${(Y(b + 1)).toFixed(1)}" width="${colW}" height="${(segH - 1).toFixed(1)}" fill="${BFT_COLORS[b]}" ${ok(v) && beaufort(v) === b ? 'stroke="var(--primary-text-color)" stroke-width="1.2"' : 'opacity="0.9"'}><title>${b} Bft · ${esc(t.bft[b])}</title></rect>`;
        s += `<text x="${x + colW + 4}" y="${(Y(b) - segH / 2).toFixed(1)}" class="al" text-anchor="start" style="dominant-baseline:central">${b}</text>`;
      }
      s += `<text x="${x + colW / 2}" y="10" class="bl" style="font-weight:600">${esc(label)}</text>`;
      if (mx && ok(mx.v)) {
        const ym = Y(this._bftFrac(mx.v));
        s += `<line x1="${x - 3}" x2="${x + colW + 3}" y1="${ym.toFixed(1)}" y2="${ym.toFixed(1)}" stroke="var(--primary-text-color)" stroke-width="1.2" stroke-dasharray="3 2"><title>${esc(t.max)} 24 h: ${this._speed(mx.v).v} ${this._speed(mx.v).u} · ${this._time(mx.t)}</title></line>`;
      }
      if (ok(v)) {
        const yv = Y(this._bftFrac(v));
        s += `<path d="M${x - 9},${(yv - 6).toFixed(1)} L${x - 1},${yv.toFixed(1)} L${x - 9},${(yv + 6).toFixed(1)} Z" fill="${color}" stroke="var(--card-background-color,#fff)" stroke-width="1"/>`;
        s += `<rect x="${x}" y="${(yv - 1.2).toFixed(1)}" width="${colW}" height="2.4" fill="${color}"/>`;
      }
      return s;
    };
    let svg = column(14, t.mean_wind, kmh, max24("wind_speed_entity"), "var(--thor-blue)");
    if (c.wind_gust_entity) svg += column(76, t.gusts, gust, max24("wind_gust_entity"), "var(--thor-gust)");
    const W = c.wind_gust_entity ? 124 : 62;
    const bw = beaufort(kmh), bg = beaufort(gust);
    const legend = BFT_COLORS.map((col, b) => {
      const lo = b === 0 ? 0 : BFT_KMH[b - 1], hi = BFT_KMH[b];
      const r = this._config.wind_unit === "bft" ? "" : `${this._speed(lo).v}${hi ? `–${this._speed(hi).v}` : "+"}`;
      const mark = [b === bw ? `<i class="bm" style="background:var(--thor-blue)"></i>` : "", b === bg ? `<i class="bm" style="background:var(--thor-gust)"></i>` : ""].join("");
      return `<div class="bl2 ${b === bw || b === bg ? "on" : ""}"><span class="bsw" style="background:${col}">${b}</span><span>${esc(t.bft[b])}</span><span class="muted">${r}</span>${mark}</div>`;
    }).reverse().join("");
    return `<div class="panel"><div class="panel-t row"><span>${esc(t.bft_title)}</span><span class="small muted">${this._config.wind_unit === "bft" ? "" : esc(this._speed(1).u)}</span></div>
      <div class="bftw"><svg viewBox="0 0 ${W} ${H}" class="bftsvg" style="max-width:${W * 1.25}px">${svg}</svg><div class="bleg small">${legend}</div></div>
      <div class="legend small center"><span><i style="background:var(--thor-blue)"></i>${esc(t.mean_wind)}</span>${c.wind_gust_entity ? `<span><i style="background:var(--thor-gust)"></i>${esc(t.gusts)}</span>` : ""}<span><i class="dash grey"></i>${esc(t.max)} 24 h</span></div></div>`;
  }

  /* --------------------------------------------------------------- Sonne */

  _loc() {
    const cf = this._hass?.config;
    if (cf && ok(num(cf.latitude)) && ok(num(cf.longitude))) return { lat: num(cf.latitude), lon: num(cf.longitude) };
    return null;
  }

  _radKey() {
    const c = this._config;
    return c.radiation_entity ? "radiation_entity" : c.illuminance_entity ? "illuminance_entity" : "";
  }

  /** Strahlungswert eines Sensors in W/m² (Lux werden genähert umgerechnet) */
  _radW(v, key) {
    if (!ok(v)) return NaN;
    return /lx|lux/i.test(this._unit(key)) ? v * LUX_TO_WM2 : v;
  }

  _radSeries() {
    const k = this._radKey();
    if (!k) return [];
    const pts = this._series(k).map((p) => ({ t: p.t, v: this._radW(p.v, k) }));
    const l = this._live(k);
    if (l && ok(l.v)) pts.push({ t: Date.now(), v: this._radW(l.v, k) });
    return pts;
  }

  _dur(ms) {
    const m = Math.round(Math.abs(ms) / 60000);
    return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")} h`;
  }

  _sunNow() {
    const loc = this._loc();
    if (loc) return solarPos(Date.now(), loc.lat, loc.lon);
    const a = this._state("sun_entity")?.attributes;
    return a ? { el: num(a.elevation), az: num(a.azimuth) } : null;
  }

  _sunArc() {
    const t = this._t;
    const loc = this._loc();
    const now = Date.now();
    const pos = this._sunNow();
    if (!loc && !pos) return "";
    let svg = "", info = [];
    if (loc) {
      const st = sunTimes(now, loc.lat, loc.lon);
      const sy = sunTimes(now - DAY, loc.lat, loc.lon);
      const W = 320, H = 130, top = 14, hor = 96;
      const d0 = new Date(now).setHours(0, 0, 0, 0), d1 = d0 + DAY;
      const X = (tt) => ((tt - d0) / (d1 - d0)) * W;
      const maxEl = Math.max(10, solarPos(st.noon, loc.lat, loc.lon).el);
      const minEl = -Math.max(10, Math.min(30, maxEl / 2));
      const Y = (el) => (el >= 0 ? hor - (el / maxEl) * (hor - top) : hor + (el / minEl) * (H - hor - 4));
      let d = "", dDay = "";
      for (let tt = d0; tt <= d1; tt += 10 * 60000) {
        const el = solarPos(tt, loc.lat, loc.lon).el;
        d += `${d ? "L" : "M"}${X(tt).toFixed(1)},${Y(el).toFixed(1)} `;
        if (el >= 0) dDay += `${dDay ? "L" : "M"}${X(tt).toFixed(1)},${Y(el).toFixed(1)} `;
      }
      svg += `<defs><linearGradient id="thor-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fcd34d" stop-opacity=".45"/><stop offset="1" stop-color="#fcd34d" stop-opacity="0"/></linearGradient></defs>`;
      if (st.rise && st.set) svg += `<path d="${dDay} L${X(st.set).toFixed(1)},${hor} L${X(st.rise).toFixed(1)},${hor} Z" fill="url(#thor-sky)"/>`;
      svg += `<path d="${d}" fill="none" stroke="var(--secondary-text-color)" stroke-width="1" stroke-dasharray="3 3" opacity=".6"/>`;
      if (dDay) svg += `<path d="${dDay}" fill="none" stroke="#f59e0b" stroke-width="2.2"/>`;
      svg += `<line x1="0" x2="${W}" y1="${hor}" y2="${hor}" class="axis"/>`;
      for (let h = 0; h <= 24; h += 6) svg += `<text x="${Math.min(W - 8, Math.max(8, (h / 24) * W)).toFixed(1)}" y="${H - 2}" class="bl muted">${String(h).padStart(2, "0")}</text>`;
      if (st.rise) svg += `<circle cx="${X(st.rise).toFixed(1)}" cy="${hor}" r="2.5" fill="#f59e0b"/>`;
      if (st.set) svg += `<circle cx="${X(st.set).toFixed(1)}" cy="${hor}" r="2.5" fill="#f97316"/>`;
      const pe = pos.el;
      svg += `<circle cx="${X(now).toFixed(1)}" cy="${Y(pe).toFixed(1)}" r="${pe >= 0 ? 8 : 6}" fill="${pe >= 0 ? "#fbbf24" : "#64748b"}" stroke="${pe >= 0 ? "#f59e0b" : "#475569"}" stroke-width="2" ${pe >= 0 ? 'class="sunglow"' : ""}/>`;
      svg = `<svg viewBox="0 0 ${W} ${H}" class="sunarc">${svg}</svg>`;
      if (st.rise) {
        const len = st.set - st.rise;
        const diff = sy.rise ? len - (sy.set - sy.rise) : NaN;
        info.push(this._chip("mdi:weather-sunset-up", t.sunrise, this._time(st.rise)));
        info.push(this._chip("mdi:weather-sunset-down", t.sunset, this._time(st.set)));
        info.push(this._chip("mdi:timer-sand", t.daylength, `${this._dur(len)}${ok(diff) ? ` (${diff >= 0 ? "+" : "−"}${Math.round(Math.abs(diff) / 60000)} min)` : ""}`));
      }
      info.push(this._chip("mdi:weather-sunny", t.noon, `${this._time(st.noon)} · ${this._fmt(maxEl, 1)}°`));
    }
    if (pos && ok(pos.el)) {
      info.push(this._chip("mdi:angle-acute", t.elevation, pos.el >= 0 ? `${this._fmt(pos.el, 1)}°` : `${this._fmt(pos.el, 1)}° · ${t.below_horizon}`, "sun_entity"));
      info.push(this._chip("mdi:compass-outline", t.azimuth, `${this._fmt(pos.az, 0)}° · ${this._cardinal(pos.az)}`, "sun_entity"));
    }
    return `<div class="panel">${svg}<div class="chips ex">${info.join("")}</div></div>`;
  }

  _uvSun() {
    const t = this._t;
    const c = this._config;
    const uv = this._val("uv_entity");
    if (!ok(uv)) return "";
    const d0 = new Date().setHours(0, 0, 0, 0);
    const pts = this._series("uv_entity").slice();
    pts.push({ t: Date.now(), v: uv });
    // Dosis: UVI × 0,025 W/m² → J/m²; 1 SED = 100 J/m²
    let dose = 0;
    for (const sg of stepSegments(pts, d0, Date.now())) dose += Math.max(0, sg.v) * 0.025 * ((sg.t1 - sg.t0) / 1000);
    const sed = dose / 100;
    const sk = clamp(Math.round(num(c.skin_type) || 2), 1, 6);
    const burn = MED.map((m, i) => {
      const min = uv > 0.2 ? m / (uv * 0.025 * 60) : Infinity;
      const txt = !ok(min) || min > 600 ? t.no_burn : min >= 60 ? `${Math.floor(min / 60)} h ${Math.round(min % 60)} min` : `${Math.round(min)} min`;
      return `<div class="skin ${i + 1 === sk ? "on" : ""}"><span class="sk sk${i + 1}"></span><span>${["I", "II", "III", "IV", "V", "VI"][i]}</span><b>${esc(txt)}</b></div>`;
    }).join("");
    // UV-Kurve heute
    const loc = this._loc();
    const st = loc ? sunTimes(Date.now(), loc.lat, loc.lon) : null;
    const from = st?.rise ? st.rise - HOUR : d0 + 5 * HOUR;
    const to = st?.set ? st.set + HOUR : d0 + 21 * HOUR;
    const W = 320, H = 90, top = 6, bot = 14;
    const mx = Math.max(3, ...pts.filter((p) => p.t >= d0).map((p) => p.v).filter(ok));
    const X = (tt) => ((tt - from) / (to - from)) * W;
    const Y = (v) => top + (1 - v / mx) * (H - top - bot);
    let bands = "";
    [[0, 3], [3, 6], [6, 8], [8, 11], [11, 20]].forEach(([a, b], i) => {
      if (a >= mx) return;
      bands += `<rect x="0" width="${W}" y="${Y(Math.min(b, mx)).toFixed(1)}" height="${(Y(a) - Y(Math.min(b, mx))).toFixed(1)}" fill="${["#3ea72d", "#fff300", "#f18b00", "#e53210", "#b567a4"][i]}" opacity=".12"/>`;
    });
    let d = "";
    const seg = pts.filter((p) => p.t >= from && p.t <= to && ok(p.v));
    const v0 = valueAt(pts, from);
    if (ok(v0)) seg.unshift({ t: from, v: v0 });
    seg.forEach((p, i) => {
      if (i) d += `L${X(p.t).toFixed(1)},${Y(seg[i - 1].v).toFixed(1)} `;
      d += `${i ? "L" : "M"}${X(p.t).toFixed(1)},${Y(p.v).toFixed(1)} `;
    });
    const nowX = X(Date.now());
    let ticks = "";
    for (let h = Math.ceil((from - d0) / HOUR / 3) * 3; h * HOUR + d0 <= to; h += 3) ticks += `<text x="${X(d0 + h * HOUR).toFixed(1)}" y="${H - 2}" class="bl muted">${String(h).padStart(2, "0")}</text>`;
    const curve = `<svg viewBox="0 0 ${W} ${H}" class="bars">${bands}${d ? `<path d="${d} L${X(seg[seg.length - 1].t).toFixed(1)},${H - bot} L${X(seg[0].t).toFixed(1)},${H - bot} Z" fill="#a855f7" opacity=".18"/><path d="${d}" fill="none" stroke="#a855f7" stroke-width="1.8"/>` : ""}${nowX > 0 && nowX < W ? `<line x1="${nowX.toFixed(1)}" x2="${nowX.toFixed(1)}" y1="${top}" y2="${H - bot}" stroke="var(--thor-accent)" stroke-dasharray="3 2"/>` : ""}<line x1="0" x2="${W}" y1="${H - bot}" y2="${H - bot}" class="axis"/>${ticks}</svg>`;
    return `${this._uv()}
      <div class="panel">
        <div class="panel-t row"><span>${esc(t.uv_curve)}</span><span class="small muted">${esc(t.uv_dose)}: <b>${this._fmt(sed, 1)} ${t.sed}</b> (${this._fmt(dose / 1000, 2)} kJ/m²)</span></div>
        ${curve}
        <div class="panel-t small" style="margin-top:8px">${esc(t.burn)} · ${esc(t.skin)}</div>
        ${uv > 0.2 ? `<div class="skins">${burn}</div>` : `<div class="small muted">${esc(t.no_burn)}</div>`}
      </div>`;
  }

  _sunshine(pts, from, to) {
    const thr = num(this._config.sunshine_threshold) || 120;
    let sun = 0, wh = 0, mx = null;
    for (const sg of stepSegments(pts, from, to)) {
      const h = (sg.t1 - sg.t0) / HOUR;
      if (sg.v >= thr) sun += sg.t1 - sg.t0;
      wh += Math.max(0, sg.v) * h;
    }
    for (const p of pts) if (p.t >= from && p.t <= to && ok(p.v) && (!mx || p.v > mx.v)) mx = p;
    return { sun, kwh: wh / 1000, max: mx };
  }

  _radiation() {
    const t = this._t;
    const k = this._radKey();
    const raw = this._val(k);
    if (!ok(raw)) return "";
    const w = this._radW(raw, k);
    const pts = this._radSeries();
    const d0 = new Date().setHours(0, 0, 0, 0);
    const today = this._sunshine(pts, d0, Date.now());
    const pos = this._sunNow();
    const loc = this._loc();
    const cs = pos && ok(pos.el) ? clearSky(pos.el) : NaN;
    const ratio = ok(cs) && pos.el > 5 && cs > 50 ? clamp(w / cs, 0, 1.3) : NaN;
    const sky = ok(ratio) ? t.sky[ratio < 0.15 ? 0 : ratio < 0.4 ? 1 : ratio < 0.7 ? 2 : 3] : "";
    const isLux = /lx|lux/i.test(this._unit(k));
    const tiles = [];
    const tile = (l, v, icon) => tiles.push(`<div class="rtile"><ha-icon icon="${icon}"></ha-icon><div class="rl2">${esc(l)}</div><div class="rv">${v}</div></div>`);
    tile(t.rad_now, `${this._fmt(w, 0)} <span class="u">W/m²</span>`, "mdi:white-balance-sunny");
    if (ok(cs) && cs > 0) tile(t.clear_sky, `${this._fmt(cs, 0)} <span class="u">W/m²</span>`, "mdi:weather-sunny");
    if (ok(ratio)) tile(t.clearness, `${Math.round(ratio * 100)} <span class="u">%</span>`, "mdi:weather-partly-cloudy");
    tile(t.sunshine, this._dur(today.sun), "mdi:sun-clock");
    tile(t.energy, `${this._fmt(today.kwh, 2)} <span class="u">kWh/m²</span>`, "mdi:solar-power-variant");
    if (today.max && today.max.v > 0) tile(t.rad_max, `${this._fmt(today.max.v, 0)} <span class="u">W/m² · ${this._time(today.max.t)}</span>`, "mdi:arrow-collapse-up");
    if (isLux || this._config.illuminance_entity) {
      const lx = this._config.illuminance_entity ? this._val("illuminance_entity") : raw;
      if (ok(lx)) tile(this._lang === "de" ? "Helligkeit" : "Illuminance", `${this._fmt(lx, 0)} <span class="u">lx</span>`, "mdi:brightness-5");
    }
    // Tagesverlauf mit Klarhimmel-Kurve
    let chart = "";
    if (pts.length > 1) {
      const st = loc ? sunTimes(Date.now(), loc.lat, loc.lon) : null;
      const from = st?.rise ? st.rise - HOUR : d0 + 5 * HOUR;
      const to = st?.set ? st.set + HOUR : d0 + 21 * HOUR;
      const W = 320, H = 110, top = 8, bot = 14;
      const csMax = loc ? clearSky(solarPos(st.noon, loc.lat, loc.lon).el) : 0;
      const mx = Math.max(100, csMax, ...pts.filter((p) => p.t >= from).map((p) => p.v).filter(ok)) * 1.05;
      const X = (tt) => ((tt - from) / (to - from)) * W;
      const Y = (v) => top + (1 - v / mx) * (H - top - bot);
      let d = "";
      const seg = pts.filter((p) => p.t >= from && p.t <= Math.min(to, Date.now()) && ok(p.v));
      const v0 = valueAt(pts, from);
      if (ok(v0)) seg.unshift({ t: from, v: v0 });
      seg.forEach((p, i) => { d += `${i ? "L" : "M"}${X(p.t).toFixed(1)},${Y(p.v).toFixed(1)} `; });
      let csd = "";
      if (loc) for (let tt = from; tt <= to; tt += 10 * 60000) csd += `${csd ? "L" : "M"}${X(tt).toFixed(1)},${Y(clearSky(solarPos(tt, loc.lat, loc.lon).el)).toFixed(1)} `;
      const thr = num(this._config.sunshine_threshold) || 120;
      let ticks = "";
      for (let h = Math.ceil((from - d0) / HOUR / 3) * 3; h * HOUR + d0 <= to; h += 3) ticks += `<text x="${X(d0 + h * HOUR).toFixed(1)}" y="${H - 2}" class="bl muted">${String(h).padStart(2, "0")}</text>`;
      const nowX = X(Date.now());
      chart = `<svg viewBox="0 0 ${W} ${H}" class="bars">
        <defs><linearGradient id="thor-rad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f59e0b" stop-opacity=".55"/><stop offset="1" stop-color="#fcd34d" stop-opacity=".1"/></linearGradient></defs>
        <line x1="0" x2="${W}" y1="${Y(thr).toFixed(1)}" y2="${Y(thr).toFixed(1)}" stroke="#f59e0b" stroke-width=".6" stroke-dasharray="1 3"/>
        ${csd ? `<path d="${csd}" fill="none" stroke="var(--secondary-text-color)" stroke-dasharray="4 3" stroke-width="1"/>` : ""}
        ${d && seg.length > 1 ? `<path d="${d} L${X(seg[seg.length - 1].t).toFixed(1)},${H - bot} L${X(seg[0].t).toFixed(1)},${H - bot} Z" fill="url(#thor-rad)"/><path d="${d}" fill="none" stroke="#f59e0b" stroke-width="1.6"/>` : ""}
        ${nowX > 0 && nowX < W ? `<line x1="${nowX.toFixed(1)}" x2="${nowX.toFixed(1)}" y1="${top}" y2="${H - bot}" stroke="var(--thor-accent)" stroke-dasharray="3 2"/>` : ""}
        <line x1="0" x2="${W}" y1="${H - bot}" y2="${H - bot}" class="axis"/>${ticks}</svg>
        <div class="legend center small"><span><i style="background:#f59e0b"></i>${esc(t.rad_title)}</span>${csd ? `<span><i class="dash grey"></i>${esc(t.clear_sky)}</span>` : ""}<span><i class="dot"></i>${this._lang === "de" ? "Sonnenschein ab" : "Sunshine from"} ${thr} W/m²</span></div>`;
    }
    return `<div class="panel" data-more="${k}">
      <div class="panel-t row"><span>${esc(t.rad_title)}</span>${sky ? `<span class="small muted">${esc(sky)}</span>` : ""}</div>
      <div class="rtiles">${tiles.join("")}</div>
      ${chart ? `<div class="panel-t small" style="margin-top:8px">${esc(t.day_curve)}</div>${chart}` : ""}
    </div>`;
  }

  /** Sonnenstunden + Energie je Tag aus Stundenstatistik, heute live */
  _sunDays() {
    const thr = num(this._config.sunshine_threshold) || 120;
    const map = new Map();
    const key = (tt) => new Date(tt).setHours(0, 0, 0, 0);
    for (const r of this._sunHourly || []) {
      const k = key(r.start);
      const e = map.get(k) || { t: k, h: 0, kwh: 0 };
      if (r.w >= thr) e.h += 1;
      e.kwh += Math.max(0, r.w) / 1000;
      map.set(k, e);
    }
    const today = key(Date.now());
    const s = this._sunshine(this._radSeries(), today, Date.now());
    map.set(today, { t: today, h: s.sun / HOUR, kwh: s.kwh });
    return map;
  }

  _sunChart() {
    const c = this._config;
    const t = this._t;
    if (!this._sunHourly) return "";
    const map = this._sunDays();
    const rk = this._sel.sun;
    const { items } = this._periodBars(rk, (d) => map.get(d)?.h);
    if (!items.some((x) => x.has)) return "";
    let kwh = 0;
    const first = items[0].t;
    for (const [d, e] of map) if (d >= first && inMonths(d, RANGES[rk].months)) kwh += e.kwh;
    const sum = items.reduce((a, b) => a + b.v, 0);
    const fmt = (v, short) => (short ? this._fmt(v, v < 10 ? 1 : 0) : `${this._fmt(v, 1)} h`);
    return `<div class="panel"><div class="panel-t row"><span>${esc(t.sun_days_title)} · ${this._rangeTitle(rk)}</span><span class="small muted"><b>${this._fmt(sum, 0)} h</b> · ${this._fmt(kwh, 1)} kWh/m²</span></div>
      ${this._barChart(items, "#f59e0b", fmt)}
      ${this._rangeButtons("sun", c.sun_periods)}</div>`;
  }

  /* ---------------------------------------------------------------- Wind */

  _houseImage(cx, cy, r, clipId) {
    const c = this._config;
    if (!c.image) return "";
    let url = String(c.image);
    if (this._hass?.hassUrl && /^\/(local|media|api)\//.test(url)) url = this._hass.hassUrl(url);
    const size = 2 * r * clamp(num(c.image_scale) || 0.8, 0.1, 2);
    const clip = c.image_clip ? `clip-path="url(#${clipId})"` : "";
    return `<defs><clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>
      <g ${clip}><image href="${esc(url)}" x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" opacity="${clamp(num(c.image_opacity) ?? 0.55, 0, 1)}" transform="rotate(${num(c.image_rotation) || 0} ${cx} ${cy})"/></g>`;
  }

  _compassRing(cx, cy, r, small) {
    const lab = this._lang === "de" ? CARD_DE : CARD_EN;
    let s = `<circle cx="${cx}" cy="${cy}" r="${r}" class="ring"/>`;
    for (let i = 0; i < (small ? 8 : 16); i++) {
      const a = i * (small ? 45 : 22.5);
      const main = a % 90 === 0;
      const [x0, y0] = pt(cx, cy, r, a);
      const [x1, y1] = pt(cx, cy, r - (main ? 7 : 4), a);
      s += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" class="tick"/>`;
      if (main || !small) {
        const [tx, ty] = pt(cx, cy, r + (small ? 8 : 10), a);
        s += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" class="${main ? "card-main" : "card-sub"}">${lab[Math.round(a / 22.5)]}</text>`;
      }
    }
    return s;
  }

  _arrow(cx, cy, r, deg, color, w = 9) {
    // Pfeil am Rand, zeigt zur Mitte (Wind kommt aus dieser Richtung)
    const [tx, ty] = pt(cx, cy, r - w * 2.2, deg);
    const [b1x, b1y] = pt(cx, cy, r + 2, deg - (w * 40) / r);
    const [b2x, b2y] = pt(cx, cy, r + 2, deg + (w * 40) / r);
    const [mx, my] = pt(cx, cy, r - w * 0.6, deg);
    return `<path d="M${tx.toFixed(1)},${ty.toFixed(1)} L${b1x.toFixed(1)},${b1y.toFixed(1)} L${mx.toFixed(1)},${my.toFixed(1)} L${b2x.toFixed(1)},${b2y.toFixed(1)} Z" fill="${color}" stroke="rgba(0,0,0,.25)" stroke-width="0.6"/>`;
  }

  _compassBlock() {
    const t = this._t;
    const dir = this._val("wind_direction_entity");
    const kmh = this._kmh("wind_speed_entity");
    const gust = this._kmh("wind_gust_entity");
    const cx = 110, cy = 110, r = 84;
    let s = this._houseImage(cx, cy, r - 2, "thor-cclip");
    s += this._compassRing(cx, cy, r, false);
    // Schwankungsbereich der letzten 10 Minuten
    const ws = this._windStats(10 * 60000);
    const spread = this._dirSpread(10 * 60000);
    if (spread && spread.width > 2) s += `<path d="${arcPath(cx, cy, r - 3, spread.from, spread.from + spread.width)}" stroke="var(--thor-accent)" stroke-width="6" fill="none" opacity="0.35" stroke-linecap="round"/>`;
    if (ws && ok(ws.mean)) s += this._arrow(cx, cy, r, ws.mean, "var(--thor-blue)", 6);
    if (ok(dir)) s += this._arrow(cx, cy, r, dir, "var(--thor-accent)", 10);
    const sp = this._speed(kmh);
    const bf = beaufort(kmh);
    const g = this._speed(gust);
    s += `<text x="${cx}" y="${cy - 18}" class="c-dir">${ok(dir) ? this._cardinal(dir) : "–"}</text>
      <text x="${cx}" y="${cy + 2}" class="c-deg">${ok(dir) ? Math.round(dir) + "°" : ""}</text>
      <text x="${cx}" y="${cy + 26}" class="c-spd">${sp.v}<tspan class="c-u" dx="3">${esc(sp.u)}</tspan></text>
      ${ok(gust) ? `<text x="${cx}" y="${cy + 48}" class="c-gust">${esc(t.gusts)} ${g.v} ${esc(g.u)}</text>` : ""}`;
    return `<div class="panel compass" data-more="wind_direction_entity">
      <svg viewBox="0 0 220 220" class="cmp">${s}</svg>
      <div class="cinfo">
        <div class="panel-t">${esc(t.wind)}</div>
        <div class="big">${ok(bf) ? `${bf} <span class="u">Bft</span>` : "–"}</div>
        <div>${ok(bf) ? esc(t.bft[bf]) : ""}</div>
        ${this._windBars(kmh, gust)}
        ${spread && spread.width > 2 ? `<div class="small muted">${esc(t.variability)}: ±${Math.round(spread.width / 2)}°</div>` : ""}
        <div class="legend small"><span><i style="background:var(--thor-accent)"></i>${esc(t.direction)}</span>${ws && ok(ws.mean) ? `<span><i style="background:var(--thor-blue)"></i>Ø 10 min</span>` : ""}</div>
      </div>
    </div>`;
  }

  _gustInfo(ms = 10 * 60000) {
    // Böenfaktor = Spitzenböe / Mittelwind im Zeitraum
    const now = Date.now();
    const fw = this._kmhFactor("wind_speed_entity"), fg = this._kmhFactor("wind_gust_entity");
    const w = this._series("wind_speed_entity").map((p) => ({ t: p.t, v: p.v * fw }));
    const g = this._series("wind_gust_entity").map((p) => ({ t: p.t, v: p.v * fg }));
    let sum = 0, tot = 0;
    for (const sg of stepSegments(w, now - ms, now)) { sum += sg.v * (sg.t1 - sg.t0); tot += sg.t1 - sg.t0; }
    const mean = tot ? sum / tot : this._kmh("wind_speed_entity");
    const mm = minMax(g, now - ms, now, { t: now, v: this._kmh("wind_gust_entity") });
    const peak = mm.max?.v;
    const factor = ok(mean) && mean >= 3 && ok(peak) ? peak / mean : NaN;
    return { mean, peak, factor, level: !ok(factor) ? -1 : factor < 1.3 ? 0 : factor < 1.6 ? 1 : factor < 2 ? 2 : 3 };
  }

  _windBars(kmh, gust) {
    const t = this._t;
    if (!ok(kmh) && !ok(gust)) return "";
    const top = Math.max(20, ...[kmh, gust].filter(ok)) * 1.15;
    const bar = (label, v, cls) => {
      if (!ok(v)) return "";
      const s = this._speed(v);
      return `<div class="wbar"><span>${esc(label)}</span><div class="wtrack"><div class="wfill ${cls}" style="width:${clamp((v / top) * 100, 1, 100).toFixed(1)}%"></div></div><b>${s.v} ${esc(s.u)}</b><span class="muted">${beaufort(v)} Bft</span></div>`;
    };
    const gi = this._config.wind_gust_entity ? this._gustInfo() : null;
    return `<div class="wbars">${bar(t.mean_wind, kmh, "w")}${bar(t.gusts, gust, "g")}</div>
      ${gi && gi.level >= 0 ? `<div class="small">${esc(t.gustiness)}: <b>${esc(t.gusty[gi.level])}</b> <span class="muted">· ${esc(t.gust_factor)} ${this._fmt(gi.factor, 1)}</span></div>` : ""}`;
  }

  /** Wind/Böen in Intervalle: Wind = Mittel, Böen = Maximum */
  _windBins(rk) {
    const c = this._config;
    const R0 = RANGES[rk];
    const now = Date.now(), from = rangeStart(rk);
    const bins = [];
    if (!R0.stats) {
      const fw = this._kmhFactor("wind_speed_entity"), fg = this._kmhFactor("wind_gust_entity");
      const w = this._series("wind_speed_entity").map((p) => ({ t: p.t, v: p.v * fw }));
      const g = c.wind_gust_entity ? this._series("wind_gust_entity").map((p) => ({ t: p.t, v: p.v * fg })) : [];
      const span = now - from;
      const B = Math.max(60000, Math.round(span / 144 / 60000) * 60000);
      const n = Math.ceil(span / B);
      for (let i = 0; i < n; i++) bins.push({ t: from + i * B, acc: 0, dur: 0, w: NaN, g: NaN });
      for (const sg of stepSegments(w, from, now)) {
        for (let tt = sg.t0; tt < sg.t1;) {
          const i = Math.min(n - 1, Math.floor((tt - from) / B));
          const end = Math.min(sg.t1, from + (i + 1) * B);
          bins[i].acc += sg.v * (end - tt); bins[i].dur += end - tt; tt = end;
        }
      }
      bins.forEach((b) => (b.w = b.dur ? b.acc / b.dur : NaN));
      for (const sg of stepSegments(g, from, now)) {
        const i0 = Math.floor((sg.t0 - from) / B), i1 = Math.min(n - 1, Math.floor((sg.t1 - 1 - from) / B));
        for (let i = i0; i <= i1; i++) bins[i].g = ok(bins[i].g) ? Math.max(bins[i].g, sg.v) : sg.v;
      }
      return { bins, unit: B };
    }
    // Statistik: stündlich, ab 30 Tagen täglich zusammengefasst
    const gBy = new Map((this._hourly?.gust || []).map((r) => [r.start, r.mean]));
    const rows = new Map();
    for (const r of this._hourly?.spd || []) if (r.start >= from && inMonths(r.start, R0.months)) rows.set(r.start, { t: r.start, w: r.mean, g: gBy.get(r.start) ?? NaN });
    for (const r of this._hourly?.gust || []) if (r.start >= from && inMonths(r.start, R0.months) && !rows.has(r.start)) rows.set(r.start, { t: r.start, w: NaN, g: r.mean });
    let list = [...rows.values()].sort((a, b) => a.t - b.t);
    const factors = list.map((b) => (ok(b.g) && ok(b.w) && b.w >= 5 ? b.g / b.w : NaN)).filter(ok);
    if (Date.now() - from > 31 * DAY) {
      const byDay = new Map();
      for (const b of list) {
        const k = new Date(b.t).setHours(0, 0, 0, 0);
        const e = byDay.get(k) || { t: k, s: 0, n: 0, g: NaN };
        if (ok(b.w)) { e.s += b.w; e.n++; }
        if (ok(b.g)) e.g = ok(e.g) ? Math.max(e.g, b.g) : b.g;
        byDay.set(k, e);
      }
      list = [...byDay.values()].map((e) => ({ t: e.t, w: e.n ? e.s / e.n : NaN, g: e.g }));
      return { bins: list, unit: DAY, factors };
    }
    return { bins: list, unit: HOUR, factors };
  }

  _gustChart() {
    const c = this._config;
    const t = this._t;
    const rk = this._sel.wind;
    const R0 = RANGES[rk];
    const { bins, unit, factors } = this._windBins(rk);
    const wb = bins.map((b) => b.w), gb = bins.map((b) => b.g);
    const all = [...wb, ...gb].filter(ok);
    const head = `<div class="panel-t row"><span>${esc(t.wind_chart)} · ${this._rangeTitle(rk)}</span><span class="small muted">${this._lang === "de" ? "Achse" : "axis"}: Beaufort</span></div>`;
    if (!all.length) return `<div class="panel">${head}<div class="empty">${esc(this._loading ? t.loading : R0.stats ? t.no_stats : t.nodata)}</div>${this._rangeButtons("wind", c.wind_chart_periods)}</div>`;
    const n = bins.length;
    const W = 320, H = 130, L = 26, top = 8, bot = 16;
    const mxKmh = Math.max(12, ...all) * 1.1;
    const X = (i) => L + ((i + 0.5) / n) * (W - L);
    const Y = (v) => top + (1 - v / mxKmh) * (H - top - bot);
    let s = "";
    for (let b = 1; b < BFT_KMH.length; b++) {
      const v = BFT_KMH[b - 1];
      if (v > mxKmh) break;
      if (v < 6 && mxKmh > 40) continue;
      s += `<line x1="${L}" x2="${W}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="grid"/><text x="${L - 3}" y="${Y(v).toFixed(1)}" class="al" text-anchor="end">${b}</text>`;
    }
    // Lücken (z. B. Sommer/Winter) als Trennlinie
    for (let i = 1; i < n; i++) if (bins[i].t - bins[i - 1].t > unit * 3) s += `<line x1="${((X(i) + X(i - 1)) / 2).toFixed(1)}" x2="${((X(i) + X(i - 1)) / 2).toFixed(1)}" y1="${top}" y2="${H - bot}" stroke="var(--secondary-text-color)" stroke-dasharray="2 2" opacity=".5"/>`;
    const path = (arr) => {
      let d = "", pen = false;
      arr.forEach((v, i) => {
        if (!ok(v)) { pen = false; return; }
        d += `${pen ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)} `;
        pen = true;
      });
      return d;
    };
    const dw = path(wb), dg = path(gb);
    if (dw) {
      const idx = wb.map((v, i) => (ok(v) ? i : -1)).filter((i) => i >= 0);
      s += `<path d="${dw} L${X(idx[idx.length - 1]).toFixed(1)},${H - bot} L${X(idx[0]).toFixed(1)},${H - bot} Z" fill="var(--thor-blue)" opacity=".22"/><path d="${dw}" fill="none" stroke="var(--thor-blue)" stroke-width="${n > 200 ? 1.2 : 1.8}"/>`;
    }
    if (dg) s += `<path d="${dg}" fill="none" stroke="var(--thor-gust)" stroke-width="1.1" opacity=".95"/>`;
    const gi = gb.reduce((b, v, i) => (ok(v) && (b < 0 || v > gb[b]) ? i : b), -1);
    if (gi >= 0) s += `<circle cx="${X(gi).toFixed(1)}" cy="${Y(gb[gi]).toFixed(1)}" r="3" fill="var(--thor-gust)"/><text x="${clamp(X(gi), L + 20, W - 20).toFixed(1)}" y="${(Y(gb[gi]) - 7).toFixed(1)}" class="bl">${this._speed(gb[gi]).v}</text>`;
    s += `<line x1="${L}" x2="${W}" y1="${H - bot}" y2="${H - bot}" class="axis"/>`;
    const long = unit >= DAY || (bins.length && bins[n - 1].t - bins[0].t > 2 * DAY);
    for (let k = 0; k <= 4; k++) {
      const i = Math.min(n - 1, Math.round((k / 4) * (n - 1)));
      const tt = bins[i].t;
      const lbl = long ? this._date(tt) : this._time(tt);
      s += `<text x="${clamp(X(i), L + 14, W - 14).toFixed(1)}" y="${H - 3}" class="bl muted">${lbl}</text>`;
    }
    // Kennzahlen über den Zeitraum
    const wv = wb.filter(ok), gv = gb.filter(ok);
    const mean = wv.length ? wv.reduce((a, b) => a + b, 0) / wv.length : NaN;
    const wmax = wv.length ? Math.max(...wv) : NaN;
    const peak = gi >= 0 ? gb[gi] : NaN;
    const fs = (factors || bins.map((b) => (ok(b.g) && ok(b.w) && b.w >= 5 ? b.g / b.w : NaN)).filter(ok)).slice().sort((a, b) => a - b);
    const factor = fs.length ? fs[Math.floor(fs.length / 2)] : NaN;
    const level = !ok(factor) ? -1 : factor < 1.3 ? 0 : factor < 1.6 ? 1 : factor < 2 ? 2 : 3;
    const sm = this._speed(wmax), sg = this._speed(peak), sa = this._speed(mean);
    const res = unit >= DAY ? (this._lang === "de" ? "Tag" : "day") : unit >= HOUR ? (this._lang === "de" ? "Stunde" : "hour") : `${Math.round(unit / 60000)} min`;
    return `<div class="panel">${head}
      <svg viewBox="0 0 ${W} ${H}" class="bars">${s}</svg>
      <div class="legend center small"><span><i style="background:var(--thor-blue)"></i>${esc(t.mean_wind)} (Ø ${esc(res)})</span>${dg ? `<span><i style="background:var(--thor-gust)"></i>${esc(t.gusts)} (max ${esc(res)})</span>` : ""}</div>
      <div class="chips ex">
        ${ok(mean) ? this._chip("mdi:weather-windy", `Ø ${t.mean_wind}`, `${sa.v} ${sa.u}`, "wind_speed_entity") : ""}
        ${ok(wmax) ? this._chip("mdi:arrow-up-bold-outline", `${t.mean_wind} ${t.max}`, `${sm.v} ${sm.u} · ${beaufort(wmax)} Bft`, "wind_speed_entity") : ""}
        ${ok(peak) ? this._chip("mdi:weather-windy-variant", t.gust_peak, `${sg.v} ${sg.u} · ${beaufort(peak)} Bft${gi >= 0 ? ` · ${long ? this._date(bins[gi].t) : this._time(bins[gi].t)}` : ""}`, "wind_gust_entity") : ""}
        ${level >= 0 ? this._chip("mdi:chart-bell-curve-cumulative", t.gustiness, `${t.gusty[level]} · ${this._fmt(factor, 1)}`) : ""}
      </div>
      ${this._rangeButtons("wind", c.wind_chart_periods)}</div>`;
  }

  _dirSpread(ms) {
    const now = Date.now();
    const pts = this._series("wind_direction_entity");
    const vals = pts.filter((p) => p.t >= now - ms && ok(p.v)).map((p) => p.v);
    const v0 = valueAt(pts, now - ms);
    if (ok(v0)) vals.push(v0);
    const l = this._val("wind_direction_entity");
    if (ok(l)) vals.push(l);
    if (vals.length < 2) return null;
    // kleinster Bogen, der alle Richtungen enthält
    const s = [...new Set(vals.map((v) => norm360(v)))].sort((a, b) => a - b);
    if (s.length < 2) return null;
    let gap = 0, gi = 0;
    for (let i = 0; i < s.length; i++) {
      const g = i + 1 < s.length ? s[i + 1] - s[i] : s[0] + 360 - s[i];
      if (g > gap) { gap = g; gi = i; }
    }
    const from = s[(gi + 1) % s.length];
    return { from, width: 360 - gap };
  }

  _averages() {
    const t = this._t;
    const items = [
      ["hour", this._windStats(HOUR)],
      ["day", this._windStats(DAY)],
      ["month", this._windHourlyStats(30 * DAY)],
      ["year", this._windHourlyStats(365 * DAY)],
    ].map(([k, st]) => {
      // fertige Mittelwerte der Station haben Vorrang
      const d = this._val(`wind_dir_avg_${k}_entity`);
      const sp = this._kmh(`wind_speed_avg_${k}_entity`);
      if (!ok(d) && !ok(sp)) return [k, st];
      const o = { ...(st || { top: -1, R: NaN }) };
      if (ok(d)) o.mean = d;
      if (ok(sp)) o.avgSpeed = sp;
      return [k, o];
    });
    const cells = items.map(([k, st]) => {
      const cx = 60, cy = 60, r = 40;
      let s = this._houseImage(cx, cy, r - 1, `thor-a-${k}`);
      s += this._compassRing(cx, cy, r, true);
      if (st && st.top >= 0) s += `<path d="${wedge(cx, cy, r - 14, r - 1, st.top * 22.5 - 11.25, st.top * 22.5 + 11.25)}" fill="var(--thor-blue)" opacity="0.55"/>`;
      if (st && ok(st.mean)) s += this._arrow(cx, cy, r, st.mean, "var(--thor-accent)", 6);
      const sp = this._speed(st?.avgSpeed);
      s += `<text x="${cx}" y="${cy - 4}" class="m-dir">${st && ok(st.mean) ? this._cardinal(st.mean) : "–"}</text>
        <text x="${cx}" y="${cy + 12}" class="m-spd">${st ? `${sp.v} ${esc(sp.u)}` : ""}</text>`;
      return `<div class="avg">
        <div class="avg-t">${esc(t.avg[k])}</div>
        <svg viewBox="0 0 120 120">${s}</svg>
        <div class="avg-s">${st && ok(st.mean) ? `${esc(t.mean_dir)} <b>${Math.round(st.mean)}°</b>` : `<span class="muted">${esc(t.nodata)}</span>`}</div>
        ${st && st.top >= 0 ? `<div class="avg-s">${esc(t.main_dir)} <b>${this._cardinal(st.top * 22.5)}</b></div>` : ""}
        ${st && ok(st.R) ? `<div class="avg-s muted">${esc(t.steadiness)} ${Math.round(st.R * 100)} %</div>` : ""}
      </div>`;
    });
    return `<div class="panel"><div class="panel-t">${esc(t.avg_title)}</div>
      <div class="avgs">${cells.join("")}</div>
      <div class="legend small center"><span><i style="background:var(--thor-accent)"></i>${esc(t.mean_dir)}</span><span><i style="background:var(--thor-blue)"></i>${esc(t.main_dir)}</span></div>
    </div>`;
  }

  _windrose() {
    const c = this._config;
    const t = this._t;
    const rk = this._sel.rose;
    const R0 = RANGES[rk];
    const gustMode = this._roseMode === "gust" && !!c.wind_gust_entity;
    const st = R0.stats
      ? roseFromHourly(this._hourly?.dir, gustMode ? this._hourly?.gust : this._hourly?.spd, rangeStart(rk), R0.months)
      : this._windStats(Date.now() - rangeStart(rk), gustMode);
    const cx = 150, cy = 150, R = 112, r0 = 16;
    let s = this._houseImage(cx, cy, R, "thor-rclip");
    let maxPct = 0;
    if (st) maxPct = Math.max(...st.secPct);
    const scale = maxPct > 0 ? (R - r0) / maxPct : 0;
    // Ringe
    const ringStep = maxPct > 40 ? 10 : maxPct > 20 ? 5 : maxPct > 8 ? 2 : 1;
    const nRings = Math.floor(maxPct / ringStep);
    const every = nRings > 4 ? Math.ceil(nRings / 3) : 1;
    for (let k = 1; k <= nRings; k++) {
      const p = k * ringStep;
      const rr = r0 + p * scale;
      s += `<circle cx="${cx}" cy="${cy}" r="${rr.toFixed(1)}" class="rring"/>`;
      if (k % every === 0 || k === nRings) {
        const [lx, ly] = pt(cx, cy, rr, 101.25);
        s += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" class="rl">${p}%</text>`;
      }
    }
    const metric = this._roseMetric || "freq";
    const spdMode = metric !== "freq" && st && st.secAvg;
    if (spdMode) {
      // Radius = Ø Geschwindigkeit (bzw. Beaufort) je Richtung, Bogen = Maximum, Deckkraft = Häufigkeit
      s = this._houseImage(cx, cy, R, "thor-rclip");
      const val = (kmh) => (metric === "bft" ? beaufort(kmh) : this._speedNum(kmh));
      const vals = [...st.secAvg, ...st.secMax].filter(ok).map(val);
      let top;
      if (metric === "bft") top = Math.max(3, Math.min(12, Math.max(0, ...vals) + 1));
      else {
        const m = Math.max(1, ...vals);
        const sp_ = m > 40 ? 10 : m > 16 ? 5 : m > 6 ? 2 : 1;
        top = Math.ceil((m * 1.05) / sp_) * sp_;
      }
      const sc = (R - r0) / top;
      const stepR = metric === "bft" ? (top > 8 ? 2 : 1) : top / 4;
      for (let v = stepR; v <= top + 1e-9; v += stepR) {
        const rr = r0 + v * sc;
        s += `<circle cx="${cx}" cy="${cy}" r="${rr.toFixed(1)}" class="rring"/>`;
        const [lx, ly] = pt(cx, cy, rr, 101.25);
        s += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" class="rl">${metric === "bft" ? `${v}` : this._fmt(v, v % 1 ? 1 : 0)}</text>`;
      }
      s += this._compassRing(cx, cy, R + 2, false);
      const maxPct = Math.max(...st.secPct, 0.0001);
      for (let i = 0; i < 16; i++) {
        const a = i * 22.5, av = st.secAvg[i], mx = st.secMax[i];
        if (!ok(av)) continue;
        const cls = ROSE_CLASSES.reduce((k, l, j) => (av >= l ? j : k), 0);
        const rb = r0 + Math.max(0.15, val(av)) * sc;
        const sp = this._speed(av), sm = this._speed(mx);
        s += `<path d="${wedge(cx, cy, r0, rb, a - 9.5, a + 9.5)}" fill="${ROSE_COLORS[cls]}" opacity="${(0.35 + 0.65 * (st.secPct[i] / maxPct)).toFixed(2)}" stroke="var(--card-background-color,#fff)" stroke-width="0.6"><title>${this._cardinal(a)} · Ø ${sp.v} ${sp.u} (${beaufort(av)} Bft) · max ${sm.v} ${sm.u} (${beaufort(mx)} Bft) · ${this._fmt(st.secPct[i], 1)} %</title></path>`;
        if (ok(mx)) s += `<path d="${arcPath(cx, cy, r0 + val(mx) * sc, a - 9.5, a + 9.5)}" stroke="var(--thor-gust)" stroke-width="2" fill="none"/>`;
      }
    } else {
    s += this._compassRing(cx, cy, R + 2, false);
    if (st) {
      for (let i = 0; i < 16; i++) {
        let acc = 0;
        const a = i * 22.5;
        st.sectors[i].forEach((v, ci) => {
          if (v <= 0) return;
          const ra = r0 + acc * scale, rb = r0 + (acc + v) * scale;
          s += `<path d="${wedge(cx, cy, ra, rb, a - 9.5, a + 9.5)}" fill="${ROSE_COLORS[ci]}" stroke="var(--card-background-color,#fff)" stroke-width="0.6"><title>${this._cardinal(a)} · ${this._fmt(v, 1)} %</title></path>`;
          acc += v;
        });
      }
    }
    }
    s += `<circle cx="${cx}" cy="${cy}" r="${r0}" class="calm"/><text x="${cx}" y="${cy + 1}" class="calm-t">${st ? Math.round(st.calmPct) + "%" : "–"}</text>`;
    const dir = this._val("wind_direction_entity");
    const sm = this._sunMoon();
    s += this._sunMoonMarks(sm, cx, cy, R - 13);
    if (ok(dir)) s += this._arrow(cx, cy, R + 2, dir, "var(--thor-accent)", 8);

    const legend = ROSE_CLASSES.map((lo, i) => {
      const hi = ROSE_CLASSES[i + 1];
      const pct = st ? st.sectors.reduce((a, sec) => a + sec[i], 0) : 0;
      const lbl = c.wind_unit === "bft" ? `${i + 1}${hi ? "" : "+"} Bft` : `${this._speed(lo).v}${hi ? `–${this._speed(hi).v}` : "+"}`;
      return `<span class="lg"><i style="background:${ROSE_COLORS[i]}"></i>${esc(lbl)} <b>${this._fmt(pct, 0)}%</b></span>`;
    }).join("");
    const unit = c.wind_unit === "bft" ? "" : ` <span class="muted">(${esc(this._speed(1).u)})</span>`;
    const btns = this._rangeButtons("rose", c.windrose_periods);
    return `<div class="panel">
      <div class="panel-t row"><span>${esc(t.rose)}${gustMode ? ` · <span style="color:var(--thor-gust)">${esc(t.gust_mode)}</span>` : ""}</span>${st && st.top >= 0 ? `<span class="small muted">${esc(t.rose_top)}: <b>${this._cardinal(st.top * 22.5)}</b> · ${esc(t.rose_calm)} ${Math.round(st.calmPct)} %</span>` : ""}</div>
      ${c.show_rose_now ? this._roseNow() : ""}
      ${st ? `<svg viewBox="0 0 300 300" class="rose">${s}</svg>` : `<div class="empty">${esc(this._loading ? t.loading : R0.stats ? t.no_dir_stats : t.nodata)}</div>`}
      ${this._sunMoonLine(sm)}
      ${spdMode ? "" : `<div class="legend center small">${legend}${unit}</div>`}
      ${spdMode ? `<div class="small muted center">${esc(t.rose_avg_hint)}${metric === "speed" ? ` · ${esc(this._speed(1).u)}` : " · Bft"}</div>` : ""}
      ${c.show_rose_metric_switch ? `<div class="pbtns">${["freq", "speed", "bft"].map((m) => `<button class="pbtn ${m === metric ? "on" : ""}" data-rmetric="${m}">${esc(t.rose_metric[m])}</button>`).join("")}</div>` : ""}
      ${R0.stats || R0.months ? `<div class="small muted center">${this._rangeTitle(rk)} · ${this._lang === "de" ? "aus Stundenmitteln" : "from hourly means"}</div>` : ""}
      ${btns}
      ${c.wind_gust_entity ? `<div class="pbtns"><span class="small muted">${esc(t.rose_by)}</span><button class="pbtn ${!gustMode ? "on" : ""}" data-rmode="wind">${esc(t.wind_mode)}</button><button class="pbtn ${gustMode ? "on gust" : ""}" data-rmode="gust">${esc(t.gust_mode)}</button></div>` : ""}
    </div>`;
  }

  _windValues() {
    const t = this._t;
    const dir = this._val("wind_direction_entity");
    const kmh = this._kmh("wind_speed_entity");
    const gust = this._kmh("wind_gust_entity");
    if (!ok(dir) && !ok(kmh) && !ok(gust)) return "";
    const day = this._windStats(DAY);
    const month = this._windHourlyStats(30 * DAY);
    const rows = [];
    const row = (icon, l, v, key) => rows.push(`<div class="vrow" ${key ? `data-more="${key}"` : ""}><ha-icon icon="${icon}"></ha-icon><span>${esc(l)}</span><b>${v}</b></div>`);
    if (ok(dir)) row("mdi:compass-outline", t.direction, `${Math.round(dir)}° · ${this._cardinal(dir)}`, "wind_direction_entity");
    if (ok(kmh)) {
      const s = this._speed(kmh, this._config.wind_unit === "bft" ? "km/h" : undefined);
      row("mdi:weather-windy", t.wind, `${beaufort(kmh)} Bft · ${esc(t.bft[beaufort(kmh)])} · ${s.v} ${esc(s.u)}`, "wind_speed_entity");
      row("mdi:sail-boat", t.knots, `${this._fmt(kmh / 1.852, 1)} kn`, "wind_speed_entity");
    }
    if (ok(gust)) {
      const s = this._speed(gust, this._config.wind_unit === "bft" ? "km/h" : undefined);
      row("mdi:weather-windy-variant", t.gusts, `${beaufort(gust)} Bft · ${s.v} ${esc(s.u)}`, "wind_gust_entity");
      row("mdi:flag-variant-outline", t.gusts_kn, `${this._fmt(gust / 1.852, 1)} kn`, "wind_gust_entity");
    }
    const mx = minMax(this._series("wind_gust_entity").map((p) => ({ t: p.t, v: p.v * this._kmhFactor("wind_gust_entity") })), Date.now() - DAY, Date.now(), ok(gust) ? { t: Date.now(), v: gust } : null);
    if (mx.max && mx.max.v > 0) {
      const s = this._speed(mx.max.v, this._config.wind_unit === "bft" ? "km/h" : undefined);
      row("mdi:arrow-up-bold-outline", `${t.gusts} ${t.max} 24 h`, `${s.v} ${esc(s.u)} · ${this._time(mx.max.t)}`, "wind_gust_entity");
    }
    if (day && ok(day.avgSpeed)) { const s = this._speed(day.avgSpeed); row("mdi:chart-bell-curve", `${t.avg_speed} ${t.avg.day}`, `${s.v} ${esc(s.u)}`); }
    if (month && ok(month.avgSpeed)) { const s = this._speed(month.avgSpeed); row("mdi:chart-bell-curve", `${t.avg_speed} ${t.avg.month}`, `${s.v} ${esc(s.u)}`); }
    if (day && day.top >= 0) row("mdi:compass", `${t.main_dir} ${t.avg.day}`, this._cardinal(day.top * 22.5));
    if (month && month.top >= 0) row("mdi:compass", `${t.main_dir} ${t.avg.month}`, this._cardinal(month.top * 22.5));
    return `<div class="panel"><div class="panel-t">${esc(t.wind_values)}</div><div class="vlist">${rows.join("")}</div></div>`;
  }

  /* --------------------------------------------------------------- Regen */

  _rain() {
    const c = this._config;
    const t = this._t;
    const raining = this._isRaining();
    const rate = this._val("rain_rate_entity");
    const u = this._rainUnit();
    const toU = (mm) => (u === "in" ? mm / 25.4 : mm);
    const dec = u === "in" ? 2 : 1;
    const days = this._days();
    const today = new Date().setHours(0, 0, 0, 0);
    const sumFrom = (from) => (days ? days.filter((d) => d.t >= from && ok(d.rain)).reduce((a, d) => a + d.rain, 0) : NaN);
    const now = new Date();
    const weekStart = new Date(today - ((now.getDay() + 6) % 7) * DAY).setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
    const yesterday = days?.find((d) => d.t === new Date(today - DAY / 2).setHours(0, 0, 0, 0));
    const tiles = [];
    const tile = (l, v, key, icon = "mdi:weather-rainy") => tiles.push(`<div class="rtile" ${key ? `data-more="${key}"` : ""}><ha-icon icon="${icon}"></ha-icon><div class="rl2">${esc(l)}</div><div class="rv">${ok(v) ? `${this._fmt(toU(v), dec)} <span class="u">${u}</span>` : "–"}</div></div>`);
    const rtoday = this._rainToday();
    const totalKey = c.rain_total_entity ? "rain_total_entity" : c.rain_today_entity ? "rain_today_entity" : "";
    tile(t.rain_today, rtoday, totalKey);
    if (c.rain_total_entity) tile(t.rain_24h, this._rainSince(Date.now() - DAY), totalKey, "mdi:clock-outline");
    if (yesterday && ok(yesterday.rain)) tile(t.rain_yesterday, yesterday.rain, totalKey, "mdi:calendar-arrow-left");
    const sensorOr = (key, computed) => (c[key] ? this._rainMm(this._val(key)) : computed);
    if (c.rain_event_entity) tile(t.rain_event, this._rainMm(this._val("rain_event_entity")), "rain_event_entity", "mdi:weather-pouring");
    if (days || c.rain_week_entity) tile(t.rain_week, sensorOr("rain_week_entity", days ? sumFrom(weekStart) : NaN), c.rain_week_entity ? "rain_week_entity" : totalKey, "mdi:calendar-week");
    if (days || c.rain_month_entity) tile(t.rain_month, sensorOr("rain_month_entity", days ? sumFrom(monthStart) : NaN), c.rain_month_entity ? "rain_month_entity" : totalKey, "mdi:calendar-month");
    if (days || c.rain_year_entity) tile(t.rain_year, sensorOr("rain_year_entity", days ? sumFrom(yearStart) : NaN), c.rain_year_entity ? "rain_year_entity" : totalKey, "mdi:calendar-blank");
    if (c.rain_total_entity) tile(t.rain_total, this._rainMm(this._val("rain_total_entity")), totalKey, "mdi:sigma");
    let lastRain = "";
    if (days) {
      const wet = [...days].reverse().find((d) => ok(d.rain) && d.rain >= c.rain_day_threshold);
      if (wet) {
        const n = Math.round((today - wet.t) / DAY);
        lastRain = n === 0 ? t.today : `${this._date(wet.t)} · ${n} ${esc(n === 1 ? t.day_dry : t.days_dry)}`;
      }
    }
    const intens = ok(rate) && rate > 0 ? t.intensity[this._rainMm(rate) < 2.5 ? 0 : this._rainMm(rate) < 10 ? 1 : this._rainMm(rate) < 50 ? 2 : 3] : "";
    const drops = raining ? Array.from({ length: 7 }, (_, i) => `<i style="left:${8 + i * 12}%;animation-delay:${(i * 0.23).toFixed(2)}s"></i>`).join("") : "";
    return `<div class="panel rainp">
      <div class="rstat ${raining ? "wet" : ""}" ${c.rain_rate_entity ? `data-more="rain_rate_entity"` : c.rain_state_entity ? `data-more="rain_state_entity"` : ""}>
        <div class="drops">${drops}</div>
        <ha-icon icon="${raining ? "mdi:weather-pouring" : "mdi:weather-cloudy"}"></ha-icon>
        <div>
          <div class="big">${esc(raining ? t.raining : t.dry_now)}</div>
          ${ok(rate) ? `<div>${esc(t.rate)}: <b>${this._fmt(rate, dec)} ${esc(this._unit("rain_rate_entity") || u + "/h")}</b>${intens ? ` · ${esc(intens)}` : ""}</div>` : ""}
          ${lastRain ? `<div class="small muted">${esc(t.last_rain)}: ${lastRain}</div>` : ""}
        </div>
      </div>
      <div class="rtiles">${tiles.join("")}</div>
    </div>`;
  }

  /** Werte je Tag (7–30 Tage) oder je Monat (1 Jahr / Sommer / Winter) */
  _periodBars(rk, dayValue) {
    const R0 = RANGES[rk];
    const today = new Date().setHours(0, 0, 0, 0);
    const items = [];
    const nDays = R0.days || (R0.season ? Math.round((today - new Date(rangeStart(rk)).setHours(0, 0, 0, 0)) / DAY) + 1 : 0);
    if (nDays) {
      for (let i = nDays - 1; i >= 0; i--) {
        const d = new Date(today - i * DAY + 12 * HOUR).setHours(0, 0, 0, 0);
        const v = dayValue(d);
        items.push({ t: d, v: ok(v) ? v : 0, has: ok(v), wk: [0, 6].includes(new Date(d).getDay()), label: `${new Date(d).getDate()}.`, title: this._date(d) });
      }
      return { items, monthly: false };
    }
    const now = new Date();
    for (let m = 11; m >= 0; m--) {
      const s0 = new Date(now.getFullYear(), now.getMonth() - m, 1);
      if (!inMonths(s0.getTime(), R0.months)) continue;
      const s1 = new Date(s0.getFullYear(), s0.getMonth() + 1, 1);
      let sum = 0, has = false, nDays = 0;
      for (let d = s0.getTime(); d < s1.getTime() && d <= today; d = new Date(d + DAY + 12 * HOUR).setHours(0, 0, 0, 0)) {
        const v = dayValue(d);
        if (ok(v)) { sum += v; has = true; nDays++; }
      }
      items.push({ t: s0.getTime(), v: sum, has, nDays, label: this._t.months[s0.getMonth()], title: `${this._t.months[s0.getMonth()]} ${s0.getFullYear()}` });
    }
    return { items, monthly: true };
  }

  _barChart(items, color, fmt, colorFn) {
    const n = items.length;
    const W = 320, H = 120, padB = 18, padT = 14;
    const mx = Math.max(1, ...items.map((x) => x.v));
    const bw = W / n;
    let s = "";
    items.forEach((d, i) => {
      const h = (d.v / mx) * (H - padB - padT);
      const x = i * bw;
      if (d.wk) s += `<rect x="${x}" y="0" width="${bw}" height="${H - padB}" class="wkend"/>`;
      if (d.v > 0) {
        s += `<rect x="${(x + bw * 0.15).toFixed(1)}" y="${(H - padB - h).toFixed(1)}" width="${(bw * 0.7).toFixed(1)}" height="${Math.max(1, h).toFixed(1)}" rx="2" fill="${colorFn ? colorFn(d) : color}"><title>${esc(d.title)}: ${fmt(d.v)}</title></rect>`;
        if (n <= 14 || d.v >= mx * 0.3) s += `<text x="${(x + bw / 2).toFixed(1)}" y="${(H - padB - h - 3).toFixed(1)}" class="bl">${fmt(d.v, true)}</text>`;
      }
      const every = n > 21 ? 7 : n > 14 ? 2 : 1;
      if ((n - 1 - i) % every === 0) s += `<text x="${(x + bw / 2).toFixed(1)}" y="${H - 5}" class="bl muted">${esc(d.label)}</text>`;
    });
    s += `<line x1="0" x2="${W}" y1="${H - padB}" y2="${H - padB}" class="axis"/>`;
    return `<svg viewBox="0 0 ${W} ${H}" class="bars">${s}</svg>`;
  }

  _rainChart() {
    const c = this._config;
    const t = this._t;
    const days = this._days();
    const rk = this._sel.rain;
    const head = `<div class="panel-t row"><span>${esc(t.rain_days_title)} · ${this._rangeTitle(rk)}</span>`;
    if (!days) return c.rain_total_entity || c.rain_today_entity ? `<div class="panel">${head}</div><div class="empty">${esc(this._loading ? t.loading : t.no_stats)}</div></div>` : "";
    const byDay = new Map(days.map((d) => [d.t, d.rain]));
    const { items, monthly } = this._periodBars(rk, (d) => byDay.get(d));
    if (!items.some((x) => x.has)) return "";
    const u = this._rainUnit();
    const toU = (mm) => (u === "in" ? mm / 25.4 : mm);
    const thr = c.rain_day_threshold;
    const fmt = (v, short) => (short ? this._fmt(toU(v), v < 10 ? 1 : 0) : `${this._fmt(toU(v), 1)} ${u}`);
    const sum = items.reduce((a, b) => a + b.v, 0);
    let wet = 0;
    const from = monthly ? items[0]?.t : items[0]?.t;
    for (const d of days) if (d.t >= from && inMonths(d.t, RANGES[rk].months) && ok(d.rain) && d.rain >= thr) wet++;
    return `<div class="panel">${head}<span class="small muted"><b>${this._fmt(toU(sum), 1)} ${u}</b> · ${wet} ${esc(t.cd.rain)}</span></div>
      ${this._barChart(items, "#3b82f6", fmt, monthly ? null : (d) => (d.v >= thr ? "#3b82f6" : "#93c5fd"))}
      ${this._rangeButtons("rain", c.rain_periods)}</div>`;
  }

  /* ---------------------------------------------------------------- Jahr */

  _climateDays() {
    const c = this._config;
    const t = this._t;
    const days = this._days();
    const now = new Date();
    const y = now.getFullYear();
    const items = [];
    const tileC = (k, icon, color, v, prev) => {
      const delta = ok(prev) ? v - prev : NaN;
      items.push(`<div class="ctile" title="${esc(t.cd_help[k].replace("{t}", this._fmt(c.rain_day_threshold, 1)))}">
        <ha-icon icon="${icon}" style="color:${color}"></ha-icon>
        <div class="cl">${esc(t.cd[k])}</div>
        <div class="cv">${ok(v) ? v : "–"}</div>
        ${ok(delta) ? `<div class="cd ${delta > 0 ? "pos" : delta < 0 ? "neg" : ""}">${delta > 0 ? "+" : ""}${delta} <span class="muted">${esc(t.vs_last)}</span></div>` : `<div class="cd muted">${esc(t.cd_help[k].replace("{t}", this._fmt(c.rain_day_threshold, 1)))}</div>`}
      </div>`);
    };
    let cur = null, prev = null;
    if (days) {
      cur = this._climate(days, y);
      const lastYearDate = new Date(y - 1, now.getMonth(), now.getDate());
      prev = this._climate(days, y - 1, lastYearDate);
      if (!prev.hasT && !prev.hasR) prev = null;
    }
    if (c.outdoor_temp_entity) {
      tileC("summer", "mdi:weather-sunny", "#f59e0b", cur?.hasT ? cur.summer : NaN, prev?.hasT ? prev.summer : NaN);
      tileC("hot", "mdi:fire", "#dc2626", cur?.hasT ? cur.hot : NaN, prev?.hasT ? prev.hot : NaN);
      tileC("tropical", "mdi:weather-night", "#a855f7", cur?.hasT ? cur.tropical : NaN, prev?.hasT ? prev.tropical : NaN);
      tileC("frost", "mdi:snowflake", "#60a5fa", cur?.hasT ? cur.frost : NaN, prev?.hasT ? prev.frost : NaN);
      tileC("ice", "mdi:snowflake-variant", "#1d4ed8", cur?.hasT ? cur.ice : NaN, prev?.hasT ? prev.ice : NaN);
    }
    if (c.rain_total_entity || c.rain_today_entity) tileC("rain", "mdi:weather-pouring", "#3b82f6", cur?.hasR ? cur.rain : NaN, prev?.hasR ? prev.rain : NaN);
    if (this._radKey() && this._sunHourly?.length) {
      const sd = [...this._sunDays().values()];
      const until = new Date(y - 1, now.getMonth(), now.getDate(), 23, 59).getTime();
      const hy = sd.filter((d) => new Date(d.t).getFullYear() === y).reduce((a, d) => a + d.h, 0);
      const prevD = sd.filter((d) => new Date(d.t).getFullYear() === y - 1 && d.t <= until);
      const hp = prevD.length > 200 ? prevD.reduce((a, d) => a + d.h, 0) : NaN;
      tileC("sun", "mdi:sun-clock", "#f59e0b", Math.round(hy), ok(hp) ? Math.round(hp) : NaN);
    }
    if (!items.length) return "";
    // Extremwerte
    const ex = [];
    const unit = this._tempUnit();
    const mm = minMax(this._series("outdoor_temp_entity"), Date.now() - DAY, Date.now(), this._live("outdoor_temp_entity"));
    if (mm.max) ex.push(this._chip("mdi:thermometer-chevron-up", t.tmax24, `${this._fmt(mm.max.v)} ${unit} · ${this._time(mm.max.t)}`, "outdoor_temp_entity"));
    if (mm.min) ex.push(this._chip("mdi:thermometer-chevron-down", t.tmin24, `${this._fmt(mm.min.v)} ${unit} · ${this._time(mm.min.t)}`, "outdoor_temp_entity"));
    if (cur?.maxDay) ex.push(this._chip("mdi:arrow-collapse-up", `${t.year_max} ${y}`, `${this._fmt(this._fromC(cur.maxDay.v))} ${unit} · ${this._date(cur.maxDay.t)}`));
    if (cur?.minDay) ex.push(this._chip("mdi:arrow-collapse-down", `${t.year_min} ${y}`, `${this._fmt(this._fromC(cur.minDay.v))} ${unit} · ${this._date(cur.minDay.t)}`));
    const note = !days && !this._loading ? `<div class="muted small center">${esc(t.no_stats)}</div>` : "";
    return `<div class="panel"><div class="panel-t row"><span>${esc(t.climate)} ${y}</span></div>
      <div class="ctiles">${items.join("")}</div>${note}
      ${ex.length ? `<div class="chips ex">${ex.join("")}</div>` : ""}</div>`;
  }

  _climateChart() {
    const t = this._t;
    const days = this._days();
    if (!days || !this._config.outdoor_temp_entity) return "";
    const y = new Date().getFullYear();
    const agg = (year) => {
      const m = Array.from({ length: 12 }, () => ({ s: 0, n: 0, r: 0, rn: 0 }));
      for (const d of days) {
        const dt = new Date(d.t);
        if (dt.getFullYear() !== year) continue;
        const e = m[dt.getMonth()];
        const mean = ok(d.mean) ? d.mean : ok(d.min) && ok(d.max) ? (d.min + d.max) / 2 : NaN;
        if (ok(mean)) { e.s += mean; e.n++; }
        if (ok(d.rain)) { e.r += d.rain; e.rn++; }
      }
      return m.map((e) => ({ t: e.n ? e.s / e.n : NaN, r: e.rn ? e.r : NaN }));
    };
    const cur = agg(y), prev = agg(y - 1);
    if (!cur.some((m) => ok(m.t)) && !prev.some((m) => ok(m.t))) return "";
    const W = 340, H = 170, L = 30, Rr = 30, top = 10, bot = 22;
    const cw = (W - L - Rr) / 12;
    const temps = [...cur, ...prev].map((m) => m.t).filter(ok);
    let tlo = Math.min(0, Math.floor(Math.min(...temps) / 5) * 5), thi = Math.max(20, Math.ceil(Math.max(...temps) / 5) * 5);
    const rains = [...cur, ...prev].map((m) => m.r).filter(ok);
    const rhi = Math.max(50, Math.ceil(Math.max(0, ...rains) / 25) * 25);
    const Y = (v) => top + (1 - (v - tlo) / (thi - tlo)) * (H - top - bot);
    const YR = (v) => top + (1 - v / rhi) * (H - top - bot);
    const X = (i) => L + cw * i + cw / 2;
    const unit = this._tempUnit();
    let s = "";
    for (let v = tlo; v <= thi; v += 5) {
      s += `<line x1="${L}" x2="${W - Rr}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="${v === 0 ? "axis" : "grid"}"/><text x="${L - 4}" y="${Y(v).toFixed(1)}" class="al" text-anchor="end">${Math.round(this._fromC(v))}</text>`;
    }
    for (let v = 0; v <= rhi; v += rhi / 4) s += `<text x="${W - Rr + 4}" y="${YR(v).toFixed(1)}" class="al rain" text-anchor="start">${Math.round(v)}</text>`;
    prev.forEach((m, i) => { if (ok(m.r) && m.r > 0) s += `<rect x="${(L + cw * i + cw * 0.52).toFixed(1)}" y="${YR(m.r).toFixed(1)}" width="${(cw * 0.33).toFixed(1)}" height="${(H - bot - YR(m.r)).toFixed(1)}" fill="#3b82f6" opacity="0.25" rx="1.5"><title>${t.months[i]} ${y - 1}: ${this._fmt(m.r, 0)} mm</title></rect>`; });
    cur.forEach((m, i) => { if (ok(m.r) && m.r > 0) s += `<rect x="${(L + cw * i + cw * 0.15).toFixed(1)}" y="${YR(m.r).toFixed(1)}" width="${(cw * 0.37).toFixed(1)}" height="${(H - bot - YR(m.r)).toFixed(1)}" fill="#3b82f6" opacity="0.75" rx="1.5"><title>${t.months[i]} ${y}: ${this._fmt(m.r, 0)} mm</title></rect>`; });
    const line = (arr, dash, op) => {
      let d = "";
      arr.forEach((m, i) => { if (ok(m.t)) d += `${d && ok(arr[i - 1]?.t) ? "L" : "M"}${X(i).toFixed(1)},${Y(m.t).toFixed(1)} `; });
      return d ? `<path d="${d}" fill="none" stroke="#ef4444" stroke-width="2" ${dash ? 'stroke-dasharray="4 3"' : ""} opacity="${op}"/>` : "";
    };
    s += line(prev, true, 0.55) + line(cur, false, 1);
    cur.forEach((m, i) => { if (ok(m.t)) s += `<circle cx="${X(i).toFixed(1)}" cy="${Y(m.t).toFixed(1)}" r="2.6" fill="${tempColor(m.t)}" stroke="#ef4444" stroke-width="1"><title>${t.months[i]} ${y}: ${this._fmt(this._fromC(m.t))} ${unit}</title></circle>`; });
    t.months.forEach((mn, i) => (s += `<text x="${X(i).toFixed(1)}" y="${H - 7}" class="al" text-anchor="middle">${mn}</text>`));
    return `<div class="panel"><div class="panel-t">${esc(t.climate_chart)}</div>
      <svg viewBox="0 0 ${W} ${H}" class="cchart">${s}</svg>
      <div class="legend center small">
        <span><i style="background:#ef4444"></i>${esc(t.temp_mean)} ${y}</span>
        <span><i class="dash"></i>${esc(t.last_year)}</span>
        <span><i style="background:#3b82f6"></i>${esc(t.precip)} (${this._rainUnit() === "in" ? "mm" : "mm"})</span>
      </div></div>`;
  }
}

/* ---------------------------------------------------------------- Stil */

const STYLE = `
:host { --thor-accent: #f5a623; --thor-blue: #3b8fd9; --thor-gust: #e8590c; --thor-needle: #e8735a; --thor-dial: var(--secondary-text-color); --thor-off: rgba(127,127,127,.18); }
ha-card { padding: 12px 14px 14px; overflow: hidden; }
.head { display:flex; align-items:center; gap:8px; font-size:1.15em; font-weight:500; margin-bottom:6px; }
.head ha-icon { color: var(--thor-accent); }
.title { flex:1; }
.muted { color: var(--secondary-text-color); }
.small { font-size: .82em; }
.center { text-align:center; }
.big { font-size: 1.35em; font-weight: 600; }
.u { font-size: .55em; font-weight: 400; margin-left: 3px; color: var(--secondary-text-color); }
.empty { padding: 18px; text-align:center; color: var(--secondary-text-color); }
.tabs { display:flex; flex-wrap:wrap; gap:2px; margin: 2px 0 10px; border-bottom: 1px solid var(--divider-color); }
.tabs::-webkit-scrollbar { display:none; }
.tab { flex:1 0 auto; white-space:nowrap; background:none; border:none; padding:8px 8px; cursor:pointer; color: var(--secondary-text-color); font: inherit; font-weight:500; border-bottom: 2px solid transparent; }
.tab.on { color: var(--primary-text-color); border-bottom-color: var(--thor-accent); }
.body { display:flex; flex-direction:column; gap:12px; }
.stack-sec { display:flex; flex-direction:column; gap:12px; }
.sec-title { font-weight:600; color: var(--secondary-text-color); text-transform: uppercase; font-size:.78em; letter-spacing:.06em; margin-top:4px; }
.panel { border: 1px solid var(--divider-color); border-radius: 12px; padding: 10px 12px; }
.panel-t { font-weight: 500; margin-bottom: 6px; }
.panel-t.row { display:flex; justify-content:space-between; align-items:baseline; gap:8px; flex-wrap:wrap; }
[data-more] { cursor: pointer; }
/* Hero */
.hero { display:flex; flex-wrap:wrap; gap:12px; align-items:center; }
.hero-main { display:flex; align-items:center; gap:10px; min-width: 190px; flex: 1 1 200px; }
.hero-icon { --mdc-icon-size: 54px; }
.hero-temp { font-size: 2.7em; font-weight: 300; line-height: 1; }
.hero-temp .u { font-size: .4em; }
.hero-fc { margin-top: 4px; font-weight: 500; }
.chips { display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap:6px; flex: 2 1 300px; }
.chips.ex { margin-top: 10px; }
.chip { display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:10px; background: var(--secondary-background-color, rgba(127,127,127,.08)); }
.chip ha-icon { --mdc-icon-size: 20px; color: var(--thor-blue); }
.chip > div { min-width:0; }
.chip-l { font-size:.74em; color: var(--secondary-text-color); overflow-wrap:anywhere; hyphens:manual; }
.chip-v { font-size:.92em; font-weight:500; }
.bl[text-anchor="start"] { text-anchor:start; } .bl[text-anchor="end"] { text-anchor:end; }
/* Gauges */
.gauges { display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:6px; }
.gauge svg { width:100%; height:auto; display:block; }
.gl { font-size: 9px; fill: var(--secondary-text-color); text-anchor: middle; dominant-baseline: central; }
.gl.neg { fill: #e05252; } .gl.pos { fill: #2e9d5b; }
.gw { font-size: 9.5px; fill: var(--primary-text-color); text-anchor: middle; dominant-baseline: central; }
.gt { font-size: 10px; fill: var(--secondary-text-color); text-anchor: middle; }
.gv { font-size: 11px; fill: var(--primary-text-color); text-anchor: middle; dominant-baseline: central; font-weight: 600; }
.gv.big { font-size: 15px; }
.gbox { fill: var(--secondary-background-color, rgba(127,127,127,.12)); stroke: var(--divider-color); }
.hub { fill: var(--card-background-color, #fff); stroke: var(--divider-color); stroke-width: 1.5; filter: drop-shadow(0 1px 1.5px rgba(0,0,0,.35)); }
.hub2 { fill: var(--secondary-text-color); opacity:.35; }
.needle path { filter: drop-shadow(0 1px 1px rgba(0,0,0,.3)); transition: transform .6s; }
/* Temperatur-Kacheln */
.tiles { display:grid; grid-template-columns: repeat(auto-fit, minmax(112px, 1fr)); gap:8px; }
.tile { border:1px solid var(--divider-color); border-radius:12px; padding:10px 10px 0; display:flex; flex-direction:column; overflow:hidden; }
.tile-h { display:flex; justify-content:space-between; align-items:center; font-weight:500; gap:6px; }
.tile-h span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.tile-v { font-size: 1.75em; font-weight: 300; text-align:center; margin: 6px 0; }
.approx { font-size: .6em; color: var(--secondary-text-color); margin-right: 2px; }
.mm { display:flex; justify-content:space-between; font-size:.85em; line-height:1.35; }
.mm .r { text-align:right; }
.mm-l { font-weight:600; }
.spark { width: calc(100% + 20px); margin: 6px -10px 0; height: 38px; display:block; }
/* UV */
.uvp { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
.pyr { flex: 1 1 180px; max-width: 240px; height:auto; }
.uvinfo { flex: 1 1 140px; display:flex; flex-direction:column; gap:3px; }
.uv-v { font-size: 2.2em; font-weight: 600; line-height:1; text-shadow: 0 0 1px rgba(0,0,0,.4); }
.uv-r { font-weight: 600; text-transform: capitalize; }
/* Wind */
.compass { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.cmp { flex: 1 1 200px; max-width: 280px; height:auto; }
.cinfo { flex: 1 1 140px; display:flex; flex-direction:column; gap:4px; }
.ring { fill: none; stroke: var(--thor-blue); stroke-width: 2; }
.tick { stroke: var(--thor-blue); stroke-width: 1.2; }
.card-main { font-size: 12px; font-weight: 700; fill: var(--thor-blue); text-anchor: middle; dominant-baseline: central; }
.card-sub { font-size: 7px; fill: var(--secondary-text-color); text-anchor: middle; dominant-baseline: central; }
.c-dir { font-size: 26px; font-weight: 700; text-anchor: middle; dominant-baseline: central; fill: var(--primary-text-color); paint-order: stroke; stroke: var(--card-background-color,#fff); stroke-width: 3px; }
.c-deg { font-size: 11px; text-anchor: middle; dominant-baseline: central; fill: var(--secondary-text-color); paint-order: stroke; stroke: var(--card-background-color,#fff); stroke-width: 3px; }
.c-spd { font-size: 24px; text-anchor: middle; dominant-baseline: central; fill: var(--primary-text-color); paint-order: stroke; stroke: var(--card-background-color,#fff); stroke-width: 3px; }
.c-u { font-size: 11px; fill: var(--secondary-text-color); }
.avgs { display:grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap:8px; }
.avg { text-align:center; border:1px solid var(--divider-color); border-radius: 10px; padding: 6px; }
.avg svg { width:100%; max-width:150px; height:auto; }
.avg-t { font-weight:500; font-size:.9em; }
.avg-s { font-size:.8em; white-space:nowrap; }
.m-dir { font-size: 16px; font-weight: 700; text-anchor: middle; dominant-baseline: central; fill: var(--primary-text-color); paint-order: stroke; stroke: var(--card-background-color,#fff); stroke-width: 3px; }
.m-spd { font-size: 10px; text-anchor: middle; dominant-baseline: central; fill: var(--primary-text-color); paint-order: stroke; stroke: var(--card-background-color,#fff); stroke-width: 3px; }
.rose { width:100%; max-width: 380px; height:auto; display:block; margin: 0 auto; }
.rring { fill:none; stroke: var(--divider-color); stroke-dasharray: 2 3; }
.rl { font-size: 8px; fill: var(--secondary-text-color); }
.calm { fill: var(--card-background-color, #fff); stroke: var(--thor-blue); stroke-width: 1.2; }
.calm-t { font-size: 9px; text-anchor: middle; dominant-baseline: central; fill: var(--primary-text-color); font-weight: 600; }
.legend { display:flex; flex-wrap:wrap; gap:6px 12px; margin-top: 6px; }
.legend.center { justify-content:center; }
.legend i { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:4px; vertical-align:-1px; }
.legend i.dash { background: repeating-linear-gradient(90deg, #ef4444 0 4px, transparent 4px 7px); height:3px; vertical-align: 2px; }
.lg { white-space: nowrap; }
.pbtns { display:flex; justify-content:center; gap:6px; flex-wrap:wrap; margin-top:8px; }
.pbtn { border:1px solid var(--divider-color); background:none; color: var(--primary-text-color); border-radius: 8px; padding: 4px 10px; cursor:pointer; font: inherit; font-size:.85em; }
.pbtn.on { border-color: var(--thor-accent); color: var(--thor-accent); font-weight: 600; }
.vlist { display:flex; flex-direction:column; }
.vrow { display:grid; grid-template-columns: 26px 1fr auto; align-items:center; gap:8px; padding: 5px 0; border-bottom: 1px solid var(--divider-color); font-size:.92em; }
.vrow:last-child { border-bottom: none; }
.vrow ha-icon { --mdc-icon-size: 20px; color: var(--thor-blue); }
.vrow b { font-weight: 500; text-align:right; }
/* Regen */
.rstat { position:relative; display:flex; align-items:center; gap:12px; padding: 8px; border-radius: 10px; overflow:hidden; }
.rstat ha-icon { --mdc-icon-size: 48px; color: var(--secondary-text-color); }
.rstat.wet { background: linear-gradient(180deg, rgba(56,189,248,.18), transparent); }
.rstat.wet ha-icon { color: #38bdf8; }
.drops { position:absolute; inset:0; pointer-events:none; }
.drops i { position:absolute; top:-12px; width:2px; height:10px; border-radius:2px; background: rgba(56,189,248,.7); animation: fall 1.1s linear infinite; }
@keyframes fall { to { transform: translateY(120px); opacity: 0; } }
.rtiles { display:grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap:6px; margin-top: 8px; }
.rtile { border:1px solid var(--divider-color); border-radius:10px; padding:6px 8px; }
.rtile ha-icon { --mdc-icon-size: 18px; color: var(--thor-blue); }
.rl2 { font-size:.78em; color: var(--secondary-text-color); }
.rv { font-size: 1.15em; font-weight: 500; }
.bars, .cchart { width:100%; height:auto; display:block; }
.wkend { fill: var(--secondary-text-color); opacity: .06; }
.bl { font-size: 8px; text-anchor: middle; fill: var(--primary-text-color); }
.bl.muted { fill: var(--secondary-text-color); }
.axis { stroke: var(--secondary-text-color); stroke-width: .8; opacity: .7; }
.grid { stroke: var(--divider-color); stroke-width: .6; }
.al { font-size: 8.5px; fill: var(--secondary-text-color); dominant-baseline: central; }
.al.rain { fill: #3b82f6; }
.c-gust { font-size: 11px; text-anchor: middle; dominant-baseline: central; fill: var(--thor-gust); font-weight: 600; paint-order: stroke; stroke: var(--card-background-color,#fff); stroke-width: 3px; }
.wbars { display:flex; flex-direction:column; gap:4px; margin: 4px 0 2px; }
.wbar { display:grid; grid-template-columns: 70px 1fr auto auto; align-items:center; gap:6px; font-size:.82em; }
.wbar b { font-weight:600; white-space:nowrap; }
.wtrack { height:8px; border-radius:4px; background: var(--thor-off); overflow:hidden; }
.wfill { height:100%; border-radius:4px; }
.wfill.w { background: var(--thor-blue); } .wfill.g { background: var(--thor-gust); }
.pbtn.on.gust { border-color: var(--thor-gust); color: var(--thor-gust); }
/* Prognose */
.zmain { display:flex; align-items:center; gap:12px; }
.zmain ha-icon { --mdc-icon-size: 56px; color: var(--thor-accent); }
.ztext { font-size: 1.3em; font-weight: 600; line-height: 1.2; }
.zletter { margin-left:auto; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.3em; border:2px solid var(--thor-accent); color: var(--thor-accent); flex:none; }
.zscale { display:flex; gap:2px; margin-top:12px; }
.zs { flex:1; height:8px; border-radius:2px; opacity:.35; }
.zs.on { opacity:1; transform: scaleY(1.9); box-shadow: 0 0 0 1px var(--primary-text-color); }
.zscale-l { display:flex; justify-content:space-between; margin-top:4px; }
.risks { display:grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap:6px; }
.risk { display:flex; gap:8px; align-items:center; padding:6px 8px; border-radius:8px; border-left:4px solid; background: var(--secondary-background-color, rgba(127,127,127,.08)); }
.wxrow { display:flex; gap:6px; overflow-x:auto; padding-bottom:4px; }
.wxc { flex: 0 0 58px; text-align:center; border:1px solid var(--divider-color); border-radius:10px; padding:5px 2px; display:flex; flex-direction:column; align-items:center; gap:1px; font-size:.9em; }
.wxc ha-icon { --mdc-icon-size: 26px; color: var(--thor-blue); }
.rnow { display:flex; flex-wrap:wrap; justify-content:center; gap:4px 14px; font-size:.85em; margin-bottom:4px; }
.rnow ha-icon { --mdc-icon-size: 16px; color: var(--thor-blue); vertical-align:-3px; margin-right:3px; }
.smline ha-icon { color: #f59e0b !important; }
.smline span + span ha-icon { color: #9ca3af !important; }
.rnow i { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:4px; vertical-align:-1px; }
/* Pollen */
.psums { display:grid; grid-template-columns: repeat(3, 1fr); gap:6px; }
.psum { text-align:center; display:flex; flex-direction:column; gap:3px; align-items:stretch; }
.pl { display:inline-block; border-radius:6px; padding:3px 6px; font-size:.78em; font-weight:600; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.pl.na { background: var(--thor-off); color: var(--secondary-text-color); }
.ptable { display:flex; flex-direction:column; gap:3px; margin-top:4px; }
.prow { display:grid; grid-template-columns: 22px minmax(70px, 1.1fr) 1fr 1fr 1fr; gap:5px; align-items:center; cursor:pointer; padding:2px 0; }
.prow.ph { cursor:default; }
.prow ha-icon { --mdc-icon-size: 18px; color: #7cb342; }
.prow.mine .pn { font-weight:700; }
.pn { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:.9em; }
.pnotes { display:flex; flex-direction:column; gap:4px; }
.pnote { display:flex; gap:8px; align-items:center; font-size:.86em; padding:4px 8px; border-radius:8px; background: var(--secondary-background-color, rgba(127,127,127,.08)); }
.pnote ha-icon { --mdc-icon-size: 18px; color: var(--thor-blue); flex:none; }
.pnote.up ha-icon { color: #f97316; } .pnote.down ha-icon { color: #2e9d5b; }
.hmap { display:flex; flex-direction:column; gap:2px; }
.hrow { display:grid; grid-template-columns: 80px 1fr; gap:6px; align-items:center; }
.hcells { display:grid; gap:1px; }
.hm { height:12px; border-radius:2px; }
.hlbl { display:flex; justify-content:space-between; }
/* Auswertungen */
.recs { display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap:6px; }
.rec { display:flex; gap:8px; align-items:center; padding:6px 8px; border-radius:10px; border:1px solid var(--divider-color); }
.rec ha-icon { --mdc-icon-size: 24px; flex:none; }
.rv2 { font-weight:600; }
.drec { margin-top:10px; }
.badge-rec { margin-top:6px; padding:6px 10px; border-radius:8px; background: linear-gradient(90deg, rgba(245,166,35,.25), transparent); font-weight:600; }
.tscroll { overflow-x:auto; }
.rtab { width:100%; border-collapse:collapse; font-size:.82em; }
.rtab th { font-weight:500; color: var(--secondary-text-color); text-align:right; padding:3px 4px; white-space:nowrap; }
.rtab td { text-align:right; padding:3px 4px; border-top:1px solid var(--divider-color); white-space:nowrap; }
.rtab td:first-child, .rtab th:first-child { text-align:left; }
.rtab tr.cur td { font-weight:600; background: rgba(245,166,35,.08); }
.stripes, .cal { width:100%; height:auto; display:block; }
.vent { display:flex; gap:10px; align-items:center; padding:8px 10px; border-radius:10px; border-left:4px solid var(--divider-color); background: var(--secondary-background-color, rgba(127,127,127,.08)); margin-bottom:6px; }
.vent ha-icon { --mdc-icon-size: 30px; flex:none; color: var(--thor-blue); }
.vent.good { border-left-color:#2e9d5b; } .vent.good ha-icon { color:#2e9d5b; }
.vent.ok { border-left-color:#eab308; } .vent.ok ha-icon { color:#eab308; }
.vent.bad { border-left-color:#f97316; } .vent.bad ha-icon { color:#f97316; }
.air2 { display:grid; grid-template-columns: minmax(160px, 1fr) 1.4fr; gap:8px; align-items:start; }
@media (max-width: 480px) { .air2 { grid-template-columns: 1fr; } }
.air2 .chips { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
.comfort { width:100%; height:auto; }
.bios { display:grid; grid-template-columns: repeat(4, 1fr); gap:6px; }
.bio { text-align:center; display:flex; flex-direction:column; align-items:center; gap:3px; border:1px solid var(--divider-color); border-radius:10px; padding:6px 4px; }
.bio ha-icon { --mdc-icon-size: 26px; }
.bbar { width:80%; height:6px; border-radius:3px; background: var(--thor-off); overflow:hidden; }
.bbar span { display:block; height:100%; border-radius:3px; }
.evlist { display:flex; flex-direction:column; gap:3px; }
.evrow { display:grid; grid-template-columns: 1.4fr .5fr .8fr 1.2fr auto; gap:6px; align-items:center; font-size:.82em; padding:3px 0; border-bottom:1px solid var(--divider-color); }
.evc { padding:1px 6px; border-radius:6px; color:#fff; font-size:.85em; white-space:nowrap; }
/* Jahreszeit */
.season { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
.sring { width:140px; height:auto; flex:none; }
.sinfo { flex:1 1 180px; display:flex; flex-direction:column; gap:4px; }
.sname { display:flex; align-items:center; gap:6px; font-size:1.5em; font-weight:600; }
.sname ha-icon { --mdc-icon-size: 30px; }
.sbar { height:8px; border-radius:4px; background: var(--thor-off); overflow:hidden; }
.sbar span { display:block; height:100%; border-radius:4px; }
/* Beaufort */
.bftw { display:flex; gap:12px; align-items:flex-start; }
.bftsvg { flex:0 0 auto; width:40%; height:auto; }
.bleg { flex:1; display:flex; flex-direction:column; gap:1px; }
.bl2 { display:grid; grid-template-columns: 22px 1fr auto 12px; gap:6px; align-items:center; padding:1px 4px; border-radius:6px; }
.bl2.on { background: var(--secondary-background-color, rgba(127,127,127,.1)); font-weight:600; }
.bsw { text-align:center; border-radius:4px; font-size:.85em; color:#222; font-weight:600; }
.bm { display:inline-block; width:8px; height:8px; border-radius:50%; margin-left:1px; }
/* Sonne */
.sunarc { width:100%; height:auto; display:block; }
.sunglow { filter: drop-shadow(0 0 5px rgba(251,191,36,.9)); }
.skins { display:grid; grid-template-columns: repeat(auto-fill, minmax(124px, 1fr)); gap:5px; }
.skin { display:flex; align-items:center; gap:5px; border:1px solid var(--divider-color); border-radius:8px; padding:4px 6px; font-size:.8em; }
.skin b { margin-left:auto; font-weight:500; white-space:nowrap; }
.skin.on { border-color: var(--thor-accent); box-shadow: inset 0 0 0 1px var(--thor-accent); }
.sk { width:12px; height:12px; border-radius:50%; flex:none; border:1px solid rgba(0,0,0,.15); }
.sk1 { background:#f9e1d0; } .sk2 { background:#ecc4a1; } .sk3 { background:#d6a37c; } .sk4 { background:#a97850; } .sk5 { background:#7a4f2c; } .sk6 { background:#3f2a1d; }
.legend i.dash.grey { background: repeating-linear-gradient(90deg, var(--secondary-text-color) 0 4px, transparent 4px 7px); }
.legend i.dot { background: repeating-linear-gradient(90deg, #f59e0b 0 1px, transparent 1px 4px); height:3px; vertical-align: 2px; }
/* Klimatage */
.ctiles { display:grid; grid-template-columns: repeat(auto-fill, minmax(105px, 1fr)); gap:6px; }
.ctile { border:1px solid var(--divider-color); border-radius:10px; padding:8px; display:flex; flex-direction:column; gap:2px; }
.ctile ha-icon { --mdc-icon-size: 22px; }
.cl { font-size:.8em; color: var(--secondary-text-color); }
.cv { font-size: 1.6em; font-weight: 500; line-height: 1.1; }
.cd { font-size: .72em; }
.cd.pos { color: #e05252; } .cd.neg { color: #2e9d5b; }
`;

/* ============================================================== Editor */

const ED = {
  de: {
    labels: {
      outdoor_temp_entity: "Außentemperatur", feels_like_entity: "Gefühlte Temperatur", indoor_temp_entity: "Innentemperatur", dew_point_entity: "Taupunkt",
      humidity_entity: "Luftfeuchte außen", indoor_humidity_entity: "Luftfeuchte innen", pressure_entity: "Luftdruck (relativ)",
      wind_speed_entity: "Windgeschwindigkeit", wind_gust_entity: "Windböen", wind_direction_entity: "Windrichtung",
      rain_rate_entity: "Regenrate", rain_total_entity: "Regen-Zähler (Gesamt)", rain_today_entity: "Regen heute (täglich zurückgesetzt)", rain_state_entity: "Regen-Status", rain_event_entity: "Regenereignis (Event Rain)",
      rain_week_entity: "Niederschlag Woche", rain_month_entity: "Niederschlag Monat", rain_year_entity: "Niederschlag Jahr",
      wind_dir_avg_hour_entity: "Richtung Stundenmittel", wind_dir_avg_day_entity: "Richtung Tagesmittel", wind_dir_avg_month_entity: "Richtung Monatsmittel", wind_dir_avg_year_entity: "Richtung Jahresmittel",
      wind_speed_avg_hour_entity: "Geschw. Stundenmittel", wind_speed_avg_day_entity: "Geschw. Tagesmittel", wind_speed_avg_month_entity: "Geschw. Monatsmittel", wind_speed_avg_year_entity: "Geschw. Jahresmittel",
      uv_entity: "UV-Index", radiation_entity: "Sonnenstrahlung (W/m²)", illuminance_entity: "Helligkeit (lx)", sun_entity: "Sonnen-Entität",
      show_sun_arc: "Sonnenbogen & Tageslänge", show_sun_uv: "UV-Kurve, Dosis & Sonnenbrandzeit", show_radiation: "Strahlung & Sonnenschein", show_sun_chart: "Sonnenstunden je Tag",
      skin_type: "Hauttyp", sunshine_threshold: "Sonnenschein ab",
      title: "Titel", icon: "Symbol", show_header: "Kopfzeile", layout: "Layout", default_tab: "Start-Reiter", tabs: "Reiter / Abschnitte", language: "Sprache",
      show_hero: "Übersicht (Jetzt)", show_gauges: "Zeigerinstrumente", show_temps: "Temperatur-Kacheln", show_uv: "UV-Pyramide",
      show_compass: "Wind-Kompass", show_wind_averages: "Richtungs-Mittel (Stunde/Tag/Monat/Jahr)", show_windrose: "Windrose", show_wind_values: "Windwerte-Liste", windrose_metric: "Windrose: Darstellung", show_rose_metric_switch: "Windrose: Umschalter Häufigkeit/Geschw./Stärke", show_rose_now: "Windrose: aktueller Wind", show_rose_sun: "Windrose: Sonnenposition", show_rose_moon: "Windrose: Mondposition",
      weather_entity: "Wetter-Entität (Vorhersage)", forecast_model: "Prognosemodell", hemisphere: "Halbkugel", forecast_hours: "Stunden in der Vorhersage", forecast_days: "Tage in der Vorhersage",
      show_zambretti: "Lokale Prognose (Zambretti)", show_pressure_chart: "Luftdruck-Trend", show_risks: "Hinweise (Nebel, Frost, Sturm …)", show_weather_forecast: "Vorhersage der Wetter-Entität",
      show_season: "Jahreszeit (Reiter Jahr)", show_season_chip: "Jahreszeit in der Übersicht", show_bft_scale: "Beaufort-Säulen (Wind & Böen)", season_type: "Jahreszeit zählt",
      show_records: "Rekorde & Extreme", show_stripes: "Klimastreifen & Jahresvergleich", show_calendar: "Kalender-Heatmap", show_vegetation: "Vegetation & Garten", show_degree_days: "Heiz- & Kühlgradtage",
      show_indoor_climate: "Lüften & Schimmelrisiko", show_water_balance: "Garten-Wasserbilanz", show_night_frost: "Nachtfrost-Prognose", show_bio: "Biowetter", show_rain_analysis: "Regen-Analyse",
      climate_years: "Jahre für Klima-Auswertungen", heating_indoor: "Innentemperatur (Gradtage)", heating_limit: "Heizgrenze", cooling_base: "Kühlgrenze", mold_frsi: "Temperaturfaktor Wand (fRsi)",
      pollen_entities: "Pollen-Sensoren", pollen_allergies: "Deine Allergene (hervorheben)", pollen_scale: "Skala der Sensoren", pollen_area: "Wohnlage (Lüftungstipp)",
      pollen_history_days: "Pollen-Verlauf", pollen_auto: "DWD-Pollenflug automatisch finden", pollen_show_empty: "Pollen ohne Flug zeigen", show_pollen: "Pollenflug", show_pollen_history: "Pollen-Verlauf (Heatmap)",
      accent_color: "Akzent", wind_color: "Wind", gust_color: "Böen", needle_color: "Zeiger", show_gust_chart: "Wind & Böen – Verlauf", windrose_mode: "Windrose zeigt",
      show_rain: "Regen-Status & Summen", show_rain_chart: "Regen je Tag", show_climate_days: "Klimatage", show_climate_chart: "Klimadiagramm",
      minmax_mode: "Min/Max-Zeitraum", wind_unit: "Windeinheit", windrose_periods: "Zeiträume Windrose", windrose_default: "Windrose: Start",
      wind_chart_periods: "Zeiträume Wind & Böen", wind_chart_default: "Wind & Böen: Start", rain_periods: "Zeiträume Niederschlag", rain_default: "Niederschlag: Start",
      sun_periods: "Zeiträume Sonnenstunden", sun_default: "Sonnenstunden: Start",
      rain_day_threshold: "Regentag ab", pressure_offset: "Luftdruck-Korrektur",
      temp_gauge_min: "Temperatur-Skala von", temp_gauge_max: "Temperatur-Skala bis",
      image: "Hausbild (optional, z. B. /local/thor/haus.png)", image_scale: "Bildgröße", image_rotation: "Drehung (Norden des Bildes nach oben)", image_opacity: "Bild-Deckkraft", image_clip: "Bild rund auf den Kompass zuschneiden",
      refresh_minutes: "Verlauf aktualisieren alle",
    },
    helpers: {
      feels_like_entity: "Leer = wird aus Temperatur, Wind und Feuchte berechnet.",
      dew_point_entity: "Leer = wird aus Temperatur und Feuchte berechnet.",
      pressure_entity: "Relativer Luftdruck (auf Meereshöhe) – passend zu den Barometer-Wörtern.",
      rain_total_entity: "Fortlaufender Zähler (total_increasing) – daraus werden Tag, Woche, Monat, Jahr und Regentage berechnet.",
      rain_today_entity: "Optional – Tageswert der Station hat Vorrang vor der Berechnung.",
      rain_week_entity: "Optional – sonst aus dem Gesamt-Zähler berechnet (gilt auch für Monat/Jahr).",
      wind_dir_avg_hour_entity: "Ersetzen die berechneten Mittel – sinnvoll, wenn die Windrichtung nur als Text (N, NO …) vorliegt.",
      rain_state_entity: "Optional: binary_sensor oder Text-Sensor („Regen“ / „kein Regen“). Sonst zählt Regenrate > 0.",
      wind_direction_entity: "Grad (0–360) oder Himmelsrichtung (N, NNO, …).",
      show_wind_averages: "Monat/Jahr kommen aus der Langzeitstatistik von Home Assistant.",
      show_climate_days: "Aus der Langzeitstatistik seit 1. Januar – mit Vergleich zum Vorjahr.",
      rain_day_threshold: "DWD: Niederschlagstag ab 0,1 mm, Regentag oft ab 1 mm.",
      pressure_offset: "Wird zum Messwert addiert (z. B. für Höhenkorrektur).",
      image_rotation: "Positiv = im Uhrzeigersinn. Tipp: In Google Maps ist Norden oben – so soll dein Haus liegen.",
      tabs: "Bei „Untereinander“ werden diese Abschnitte nacheinander gezeigt.",
      climate_years: "So weit zurück wird die Langzeitstatistik gelesen (Rekorde, Klimastreifen, Kalender).",
      mold_frsi: "0,7 = Mindestwert nach DIN 4108-2; Altbau eher 0,6, gut gedämmt 0,8–0,9.",
      heating_limit: "Tage mit Tagesmittel darunter zählen als Heiztage (G20/15 nach VDI 3807).",
      pollen_entities: "Leer = alle Sensoren der Integration „DWD Pollenflug“ (sensor.pollenflug_…) automatisch.",
      pollen_allergies: "Diese Pollen stehen oben, sind fett und bestimmen die Gesamtbelastung und die Hinweise.",
      forecast_model: "Zambretti: klassisches Barometer-Modell aus Luftdruck, 3-h-Tendenz, Windrichtung und Jahreszeit – am besten für die nächsten 12 h.",
      weather_entity: "Optional – zeigt zusätzlich die Vorhersage z. B. von DWD oder Met.no.",
      radiation_entity: "Globalstrahlung in W/m² – ein Lux-Sensor geht auch (genähert umgerechnet).",
      illuminance_entity: "Optional, wird zusätzlich angezeigt; ohne Strahlungssensor als Ersatz genutzt.",
      sunshine_threshold: "WMO: Sonnenschein ab 120 W/m².",
      skin_type: "Für die Sonnenbrandzeit (Fitzpatrick I–VI).",
    },
    sections: { analysis: "Auswertungen", pollen: "Pollenflug", forecast: "Prognose", colors: "Farben", windavg: "Wind-Mittelwerte der Station (optional)", temp: "Temperatur & Luft", wind: "Wind", rain: "Regen", sun: "Sonne & UV", view: "Kopfzeile & Ansicht", parts: "Bereiche", opts: "Optionen", image: "Hausbild (Kompass & Windrose)", advanced: "Erweitert" },
    opts: {
      climate: "Klima", air: "Lüften & Schimmel", home: "Haus & Garten",
      tabs: "Reiter", stack: "Untereinander", now: "Jetzt", sun: "Sonne", wind: "Wind", rain: "Regen", year: "Jahr",
      s_meteo: "Meteorologisch (1. März, 1. Juni …)", s_astro: "Astronomisch (Tagundnachtgleiche, Sonnenwende)",
      p_ppm: "Pollen/m³", p_city: "Stadt", p_rural: "Land", pollen: "Pollen",
      wind_m: "Mittelwind", gust_m: "Böen", m_freq: "Häufigkeit", m_speed: "Geschwindigkeit", m_bft: "Stärke (Beaufort)", forecast: "Prognose",
      simple: "Einfach (Druck + Tendenz)", auto_loc: "Automatisch (Standort)", north: "Nordhalbkugel", south: "Südhalbkugel",
      skins: ["I – sehr hell", "II – hell", "III – mittel", "IV – oliv", "V – braun", "VI – dunkel"],
      lang_auto: "Automatisch (HA-Sprache)", de: "Deutsch", en: "English", h24: "Letzte 24 Stunden", today: "Seit Mitternacht", auto: "Wie Sensor",
    },
  },
  en: {
    labels: {
      outdoor_temp_entity: "Outdoor temperature", feels_like_entity: "Feels-like temperature", indoor_temp_entity: "Indoor temperature", dew_point_entity: "Dew point",
      humidity_entity: "Outdoor humidity", indoor_humidity_entity: "Indoor humidity", pressure_entity: "Pressure (relative)",
      wind_speed_entity: "Wind speed", wind_gust_entity: "Wind gusts", wind_direction_entity: "Wind direction",
      rain_rate_entity: "Rain rate", rain_total_entity: "Rain counter (total)", rain_today_entity: "Rain today (daily reset)", rain_state_entity: "Rain state", rain_event_entity: "Rain event (event rain)",
      rain_week_entity: "Rain week", rain_month_entity: "Rain month", rain_year_entity: "Rain year",
      wind_dir_avg_hour_entity: "Direction hourly mean", wind_dir_avg_day_entity: "Direction daily mean", wind_dir_avg_month_entity: "Direction monthly mean", wind_dir_avg_year_entity: "Direction yearly mean",
      wind_speed_avg_hour_entity: "Speed hourly mean", wind_speed_avg_day_entity: "Speed daily mean", wind_speed_avg_month_entity: "Speed monthly mean", wind_speed_avg_year_entity: "Speed yearly mean",
      uv_entity: "UV index", radiation_entity: "Solar radiation (W/m²)", illuminance_entity: "Illuminance (lx)", sun_entity: "Sun entity",
      show_sun_arc: "Sun arc & day length", show_sun_uv: "UV curve, dose & sunburn time", show_radiation: "Radiation & sunshine", show_sun_chart: "Sunshine hours per day",
      skin_type: "Skin type", sunshine_threshold: "Sunshine from",
      title: "Title", icon: "Icon", show_header: "Header", layout: "Layout", default_tab: "Start tab", tabs: "Tabs / sections", language: "Language",
      show_hero: "Overview (now)", show_gauges: "Dial gauges", show_temps: "Temperature tiles", show_uv: "UV pyramid",
      show_compass: "Wind compass", show_wind_averages: "Direction means (hour/day/month/year)", show_windrose: "Wind rose", show_wind_values: "Wind values list", windrose_metric: "Wind rose: display", show_rose_metric_switch: "Wind rose: frequency/speed/force switch", show_rose_now: "Wind rose: current wind", show_rose_sun: "Wind rose: sun position", show_rose_moon: "Wind rose: moon position",
      weather_entity: "Weather entity (forecast)", forecast_model: "Forecast model", hemisphere: "Hemisphere", forecast_hours: "Hours in forecast", forecast_days: "Days in forecast",
      show_zambretti: "Local forecast (Zambretti)", show_pressure_chart: "Pressure trend", show_risks: "Alerts (fog, frost, storm …)", show_weather_forecast: "Weather entity forecast",
      show_season: "Season (Year tab)", show_season_chip: "Season in overview", show_bft_scale: "Beaufort columns (wind & gusts)", season_type: "Season counts",
      show_records: "Records & extremes", show_stripes: "Climate stripes & year comparison", show_calendar: "Calendar heatmap", show_vegetation: "Vegetation & garden", show_degree_days: "Heating & cooling degree days",
      show_indoor_climate: "Ventilation & mould risk", show_water_balance: "Garden water balance", show_night_frost: "Night frost forecast", show_bio: "Biometeorology", show_rain_analysis: "Rain analysis",
      climate_years: "Years for climate analyses", heating_indoor: "Indoor temperature (degree days)", heating_limit: "Heating limit", cooling_base: "Cooling base", mold_frsi: "Wall temperature factor (fRsi)",
      pollen_entities: "Pollen sensors", pollen_allergies: "Your allergens (highlight)", pollen_scale: "Sensor scale", pollen_area: "Area (airing tip)",
      pollen_history_days: "Pollen history", pollen_auto: "Find DWD Pollenflug automatically", pollen_show_empty: "Show pollen without flight", show_pollen: "Pollen", show_pollen_history: "Pollen history (heatmap)",
      accent_color: "Accent", wind_color: "Wind", gust_color: "Gusts", needle_color: "Needle", show_gust_chart: "Wind & gusts – history", windrose_mode: "Wind rose shows",
      show_rain: "Rain state & totals", show_rain_chart: "Rain per day", show_climate_days: "Climate days", show_climate_chart: "Climate chart",
      minmax_mode: "Min/max period", wind_unit: "Wind unit", windrose_periods: "Wind rose periods", windrose_default: "Wind rose: start",
      wind_chart_periods: "Wind & gusts periods", wind_chart_default: "Wind & gusts: start", rain_periods: "Precipitation periods", rain_default: "Precipitation: start",
      sun_periods: "Sunshine periods", sun_default: "Sunshine: start",
      rain_day_threshold: "Rain day from", pressure_offset: "Pressure correction",
      temp_gauge_min: "Temperature scale from", temp_gauge_max: "Temperature scale to",
      image: "House image (optional, e.g. /local/thor/house.png)", image_scale: "Image size", image_rotation: "Rotation (image north up)", image_opacity: "Image opacity", image_clip: "Crop image to the compass circle",
      refresh_minutes: "Refresh history every",
    },
    helpers: {
      feels_like_entity: "Empty = computed from temperature, wind and humidity.",
      dew_point_entity: "Empty = computed from temperature and humidity.",
      pressure_entity: "Relative (sea-level) pressure – matches the barometer words.",
      rain_total_entity: "Ever-increasing counter (total_increasing) – day, week, month, year and rain days are derived from it.",
      rain_today_entity: "Optional – the station's daily value takes precedence over the calculation.",
      rain_week_entity: "Optional – otherwise computed from the total counter (also month/year).",
      wind_dir_avg_hour_entity: "Replace the computed means – useful if the wind direction is only text (N, NE …).",
      rain_state_entity: "Optional: binary_sensor or text sensor (\"rain\" / \"no rain\"). Otherwise rain rate > 0 counts.",
      wind_direction_entity: "Degrees (0–360) or compass point (N, NNE, …).",
      show_wind_averages: "Month/year come from Home Assistant long-term statistics.",
      show_climate_days: "From long-term statistics since 1 January – compared with last year.",
      rain_day_threshold: "WMO: precipitation day from 0.1 mm, rain day often from 1 mm.",
      pressure_offset: "Added to the reading (e.g. altitude correction).",
      image_rotation: "Positive = clockwise. Tip: in Google Maps north is up – that is how your house should be aligned.",
      tabs: "With \"stacked\" these sections are shown one after another.",
      climate_years: "How far back long-term statistics are read (records, stripes, calendar).",
      mold_frsi: "0.7 = minimum per DIN 4108-2; old buildings ~0.6, well insulated 0.8–0.9.",
      heating_limit: "Days with a daily mean below count as heating days (G20/15, VDI 3807).",
      pollen_entities: "Empty = all sensors of the \"DWD Pollenflug\" integration (sensor.pollenflug_…) automatically.",
      pollen_allergies: "These are listed first, in bold, and drive the overall level and alerts.",
      forecast_model: "Zambretti: classic barometer model from pressure, 3 h trend, wind direction and season – best for the next 12 h.",
      weather_entity: "Optional – additionally shows the forecast of e.g. Met.no.",
      radiation_entity: "Global radiation in W/m² – a lux sensor works too (approximated).",
      illuminance_entity: "Optional, shown in addition; used as fallback without a radiation sensor.",
      sunshine_threshold: "WMO: sunshine from 120 W/m².",
      skin_type: "For the sunburn time (Fitzpatrick I–VI).",
    },
    sections: { analysis: "Analyses", pollen: "Pollen", forecast: "Forecast", colors: "Colors", windavg: "Station wind means (optional)", temp: "Temperature & air", wind: "Wind", rain: "Rain", sun: "UV & sun", view: "Header & view", parts: "Sections", opts: "Options", image: "House image (compass & wind rose)", advanced: "Advanced" },
    opts: {
      climate: "Climate", air: "Airing & mould", home: "Home & garden",
      tabs: "Tabs", stack: "Stacked", now: "Now", sun: "Sun", wind: "Wind", rain: "Rain", year: "Year",
      s_meteo: "Meteorological (1 March, 1 June …)", s_astro: "Astronomical (equinox, solstice)",
      p_ppm: "Grains/m³", p_city: "Town", p_rural: "Countryside", pollen: "Pollen",
      wind_m: "Mean wind", gust_m: "Gusts", m_freq: "Frequency", m_speed: "Speed", m_bft: "Force (Beaufort)", forecast: "Forecast",
      simple: "Simple (pressure + trend)", auto_loc: "Automatic (location)", north: "Northern hemisphere", south: "Southern hemisphere",
      skins: ["I – very fair", "II – fair", "III – medium", "IV – olive", "V – brown", "VI – dark"],
      lang_auto: "Automatic (HA language)", de: "Deutsch", en: "English", h24: "Last 24 hours", today: "Since midnight", auto: "Same as sensor",
    },
  },
};

class ThorWeatherCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
  }

  _l() {
    const l = this._config?.language;
    if (l === "de" || l === "en") return ED[l];
    const h = (this._hass?.locale?.language || this._hass?.language || "de").toLowerCase();
    return h.startsWith("de") ? ED.de : ED.en;
  }

  _schema() {
    const L = this._l();
    const o = L.opts;
    const sel = (pairs, multiple = false) => ({ select: { mode: multiple ? "list" : "dropdown", multiple, options: pairs.map(([value, label]) => ({ value, label })) } });
    const ent = (domain = "sensor") => ({ entity: { domain } });
    const bool = { boolean: {} };
    const n = (min, max, step, unit, mode = "box") => ({ number: { min, max, step, mode, ...(unit ? { unit_of_measurement: unit } : {}) } });
    const grid = (schema) => ({ name: "", type: "grid", schema });
    const sec = (name, icon, schema, expanded = false) => ({ name, type: "expandable", flatten: true, expanded, title: L.sections[name], icon, schema });
    const tabOpts = ALL_TABS.map((k) => [k, o[k]]);
    const TL = T[this._l() === ED.de ? "de" : "en"];
    const periods = Object.keys(RANGES).map((p) => [p, TL.r[p] + (TL.r_desc[p] ? ` (${TL.r_desc[p]})` : "")]);
    const dayPeriods = DAY_RANGES.map((p) => [p, TL.r[p] + (TL.r_desc[p] ? ` (${TL.r_desc[p]})` : "")]);
    return [
      sec("temp", "mdi:thermometer", [
        { name: "outdoor_temp_entity", selector: ent() },
        grid([{ name: "feels_like_entity", selector: ent() }, { name: "dew_point_entity", selector: ent() }]),
        grid([{ name: "indoor_temp_entity", selector: ent() }, { name: "humidity_entity", selector: ent() }]),
        grid([{ name: "indoor_humidity_entity", selector: ent() }, { name: "pressure_entity", selector: ent() }]),
      ], true),
      sec("wind", "mdi:weather-windy", [
        { name: "wind_direction_entity", selector: ent() },
        grid([{ name: "wind_speed_entity", selector: ent() }, { name: "wind_gust_entity", selector: ent() }]),
      ]),
      sec("windavg", "mdi:compass-rose", [
        grid([{ name: "wind_dir_avg_hour_entity", selector: ent() }, { name: "wind_speed_avg_hour_entity", selector: ent() }]),
        grid([{ name: "wind_dir_avg_day_entity", selector: ent() }, { name: "wind_speed_avg_day_entity", selector: ent() }]),
        grid([{ name: "wind_dir_avg_month_entity", selector: ent() }, { name: "wind_speed_avg_month_entity", selector: ent() }]),
        grid([{ name: "wind_dir_avg_year_entity", selector: ent() }, { name: "wind_speed_avg_year_entity", selector: ent() }]),
      ]),
      sec("rain", "mdi:weather-pouring", [
        { name: "rain_total_entity", selector: ent() },
        grid([{ name: "rain_rate_entity", selector: ent() }, { name: "rain_today_entity", selector: ent() }]),
        { name: "rain_state_entity", selector: { entity: { domain: ["binary_sensor", "sensor"] } } },
        { name: "rain_event_entity", selector: ent() },
        grid([{ name: "rain_week_entity", selector: ent() }, { name: "rain_month_entity", selector: ent() }]),
        { name: "rain_year_entity", selector: ent() },
      ]),
      sec("sun", "mdi:sun-wireless", [
        grid([{ name: "uv_entity", selector: ent() }, { name: "radiation_entity", selector: ent() }]),
        grid([{ name: "illuminance_entity", selector: ent() }, { name: "sun_entity", selector: { entity: { domain: "sun" } } }]),
        grid([
          { name: "skin_type", selector: sel(o.skins.map((l, i) => [String(i + 1), l])) },
          { name: "sunshine_threshold", selector: n(10, 400, 10, "W/m²") },
        ]),
      ]),
      sec("forecast", "mdi:crystal-ball", [
        { name: "weather_entity", selector: { entity: { domain: "weather" } } },
        grid([
          { name: "forecast_model", selector: sel([["zambretti", "Zambretti"], ["simple", o.simple]]) },
          { name: "hemisphere", selector: sel([["auto", o.auto_loc], ["north", o.north], ["south", o.south]]) },
          { name: "forecast_hours", selector: n(4, 48, 1, "h") },
          { name: "forecast_days", selector: n(2, 14, 1, this._l() === ED.de ? "Tage" : "days") },
        ]),
        grid([
          { name: "show_zambretti", selector: bool }, { name: "show_pressure_chart", selector: bool },
          { name: "show_risks", selector: bool }, { name: "show_weather_forecast", selector: bool },
        ]),
      ]),
      sec("analysis", "mdi:chart-box-outline", [
        grid([
          { name: "show_records", selector: bool }, { name: "show_stripes", selector: bool },
          { name: "show_calendar", selector: bool }, { name: "show_vegetation", selector: bool },
          { name: "show_degree_days", selector: bool }, { name: "show_indoor_climate", selector: bool },
          { name: "show_water_balance", selector: bool }, { name: "show_night_frost", selector: bool },
          { name: "show_bio", selector: bool }, { name: "show_rain_analysis", selector: bool },
          { name: "show_season", selector: bool }, { name: "show_season_chip", selector: bool },
          { name: "show_bft_scale", selector: bool },
        ]),
        grid([
          { name: "season_type", selector: sel([["meteo", o.s_meteo], ["astro", o.s_astro]]) },
          { name: "climate_years", selector: n(2, 30, 1, this._l() === ED.de ? "Jahre" : "years") },
          { name: "heating_indoor", selector: n(15, 24, 0.5, "°C") },
          { name: "heating_limit", selector: n(10, 18, 0.5, "°C") },
          { name: "cooling_base", selector: n(15, 26, 0.5, "°C") },
          { name: "mold_frsi", selector: n(0.5, 0.95, 0.01, null) },
        ]),
      ]),
      sec("pollen", "mdi:flower-pollen", [
        { name: "pollen_entities", selector: { entity: { domain: "sensor", multiple: true } } },
        { name: "pollen_allergies", selector: { entity: { domain: "sensor", multiple: true } } },
        grid([
          { name: "pollen_scale", selector: sel([["auto", o.auto], ["dwd", "DWD 0–3"], ["upi", "Google UPI 0–5"], ["ppm", o.p_ppm]]) },
          { name: "pollen_area", selector: sel([["city", o.p_city], ["rural", o.p_rural]]) },
          { name: "pollen_history_days", selector: n(7, 90, 1, this._l() === ED.de ? "Tage" : "days") },
          { name: "pollen_auto", selector: bool },
          { name: "pollen_show_empty", selector: bool },
          { name: "show_pollen", selector: bool },
          { name: "show_pollen_history", selector: bool },
        ]),
      ]),
      sec("view", "mdi:page-layout-header", [
        grid([{ name: "title", selector: { text: {} } }, { name: "icon", selector: { icon: {} } }]),
        grid([
          { name: "layout", selector: sel([["tabs", o.tabs], ["stack", o.stack]]) },
          { name: "default_tab", selector: sel(tabOpts) },
          { name: "language", selector: sel([["auto", o.lang_auto], ["de", o.de], ["en", o.en]]) },
          { name: "show_header", selector: bool },
        ]),
        { name: "tabs", selector: sel(tabOpts, true) },
      ]),
      sec("parts", "mdi:view-dashboard-outline", [
        grid([
          { name: "show_hero", selector: bool }, { name: "show_gauges", selector: bool },
          { name: "show_temps", selector: bool }, { name: "show_uv", selector: bool },
          { name: "show_compass", selector: bool }, { name: "show_wind_averages", selector: bool },
          { name: "show_windrose", selector: bool }, { name: "show_wind_values", selector: bool },
          { name: "show_gust_chart", selector: bool }, { name: "show_rose_now", selector: bool },
          { name: "show_rose_metric_switch", selector: bool },
          { name: "show_rose_sun", selector: bool }, { name: "show_rose_moon", selector: bool },
          { name: "show_sun_arc", selector: bool }, { name: "show_sun_uv", selector: bool },
          { name: "show_radiation", selector: bool }, { name: "show_sun_chart", selector: bool },
          { name: "show_rain", selector: bool }, { name: "show_rain_chart", selector: bool },
          { name: "show_climate_days", selector: bool }, { name: "show_climate_chart", selector: bool },
        ]),
      ]),
      sec("opts", "mdi:tune-variant", [
        grid([
          { name: "minmax_mode", selector: sel([["24h", o.h24], ["today", o.today]]) },
          { name: "wind_unit", selector: sel([["auto", o.auto], ["km/h", "km/h"], ["m/s", "m/s"], ["kn", "kn"], ["mph", "mph"], ["bft", "Beaufort"]]) },
        ]),
        { name: "windrose_periods", selector: sel(periods, true) },
        { name: "wind_chart_periods", selector: sel(periods, true) },
        { name: "rain_periods", selector: sel(dayPeriods, true) },
        { name: "sun_periods", selector: sel(dayPeriods, true) },
        grid([
          { name: "windrose_default", selector: sel(periods) },
          { name: "wind_chart_default", selector: sel(periods) },
          { name: "rain_default", selector: sel(dayPeriods) },
          { name: "sun_default", selector: sel(dayPeriods) },
          { name: "windrose_mode", selector: sel([["wind", o.wind_m], ["gust", o.gust_m]]) },
          { name: "windrose_metric", selector: sel([["freq", o.m_freq], ["speed", o.m_speed], ["bft", o.m_bft]]) },

          { name: "rain_day_threshold", selector: n(0, 10, 0.1, "mm") },
          { name: "pressure_offset", selector: n(-100, 100, 0.1, "hPa") },
          { name: "temp_gauge_min", selector: n(-60, 20, 1, "°C") },
          { name: "temp_gauge_max", selector: n(10, 60, 1, "°C") },
        ]),
      ]),
      sec("colors", "mdi:palette", [grid(COLOR_KEYS.map((k) => ({ name: k, selector: { color_rgb: {} } })))]),
      sec("image", "mdi:home-outline", [
        { name: "image", selector: { text: {} } },
        { name: "image_scale", selector: n(0.2, 1.6, 0.05, null, "slider") },
        { name: "image_rotation", selector: n(-180, 180, 0.5, "°", "slider") },
        { name: "image_opacity", selector: n(0, 1, 0.05, null, "slider") },
        { name: "image_clip", selector: bool },
      ]),
      sec("advanced", "mdi:cog", [{ name: "refresh_minutes", selector: n(1, 60, 1, "min") }]),
    ];
  }

  _render() {
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => this._l().labels[s.name] ?? s.title ?? s.name;
      this._form.computeHelper = (s) => this._l().helpers[s.name];
      this._form.addEventListener("value-changed", (ev) => this._changed(ev));
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    const data = { ...DEFAULTS, ...this._config, skin_type: String(this._config.skin_type ?? DEFAULTS.skin_type) };
    for (const k of COLOR_KEYS) data[k] = hexToRgb(data[k]) || hexToRgb(DEFAULTS[k]);
    this._form.data = data;
    this._form.schema = this._schema();
  }

  _changed(ev) {
    ev.stopPropagation();
    const v = ev.detail.value;
    const out = { type: this._config.type || "custom:thor-weather-card" };
    for (const [k, val] of Object.entries(v)) {
      if (k === "type" || val === undefined || val === null || val === "") continue;
      if (k === "skin_type") { if (Number(val) !== DEFAULTS.skin_type) out[k] = Number(val); continue; }
      if (COLOR_KEYS.includes(k)) { const h = Array.isArray(val) ? rgbToHex(val) : val; if (String(h).toLowerCase() !== DEFAULTS[k]) out[k] = h; continue; }
      if (JSON.stringify(val) === JSON.stringify(DEFAULTS[k])) continue;
      out[k] = val;
    }
    this._config = out;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: out }, bubbles: true, composed: true }));
  }
}

if (!customElements.get("thor-weather-card")) {
  customElements.define("thor-weather-card", ThorWeatherCard);
  customElements.define("thor-weather-card-editor", ThorWeatherCardEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "thor-weather-card",
  name: "Thor Weather Card",
  description: "Weather station card: barometer with trend, temperature tiles, wind compass & wind rose, UV, rain and climate days.",
  preview: true,
  documentationURL: "https://github.com/muhkuh666/thor-weather-card",
});

console.info(`%c THOR-WEATHER-CARD %c v${CARD_VERSION} `, "background:#f5a623;color:#000;font-weight:700", "background:#3b8fd9;color:#fff");
