/**
 * Thor Weather Card – Home Assistant Lovelace Custom Card
 * Wetterstation auf einer Karte: Barometer mit Tendenz, Temperatur-Kacheln mit Min/Max,
 * Wind-Kompass mit Mittelwerten, Windrose, UV-Pyramide, Regen und Klimatage des Jahres.
 * https://github.com/muhkuh666/thor-weather-card
 */
const CARD_VERSION = "1.2.0";

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
  tabs: ["now", "sun", "wind", "rain", "year"],
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
  show_sun_arc: true,
  show_sun_uv: true,
  show_radiation: true,
  show_sun_chart: true,
  show_rain: true,
  show_rain_chart: true,
  show_climate_days: true,
  show_climate_chart: true,
  // Optionen
  minmax_mode: "24h", // 24h | today
  wind_unit: "auto", // auto | km/h | m/s | kn | mph | bft
  windrose_periods: ["today", "1h", "8h", "24h", "7d", "30d", "1y", "summer", "winter"],
  windrose_default: "24h",
  wind_chart_periods: ["today", "8h", "24h", "3d", "7d", "30d", "1y"],
  wind_chart_default: "24h",
  rain_periods: ["7d", "14d", "30d", "1y", "summer", "winter"],
  rain_default: "14d",
  sun_periods: ["7d", "14d", "30d", "1y", "summer", "winter"],
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
const ALL_TABS = ["now", "sun", "wind", "rain", "year"];
const LUX_TO_WM2 = 0.0079; // Näherung Sonnenlicht: 1 W/m² ≈ 127 lx
const MED = [200, 250, 300, 450, 600, 1000]; // minimale Erythemdosis J/m² je Hauttyp I–VI
// Zeiträume wie bei der Helios Compass Card: kurz = Verlauf, ab 7 Tagen = Langzeitstatistik
const RANGES = {
  today: { today: true },
  "1h": { ms: HOUR }, "3h": { ms: 3 * HOUR }, "8h": { ms: 8 * HOUR }, "12h": { ms: 12 * HOUR }, "24h": { ms: DAY }, "3d": { ms: 3 * DAY },
  "7d": { ms: 7 * DAY, stats: true, days: 7 }, "14d": { ms: 14 * DAY, stats: true, days: 14 }, "30d": { ms: 30 * DAY, stats: true, days: 30 },
  "1y": { ms: 365 * DAY, stats: true, year: true },
  summer: { ms: 365 * DAY, stats: true, year: true, months: [4, 5, 6, 7, 8, 9] },
  winter: { ms: 365 * DAY, stats: true, year: true, months: [10, 11, 12, 1, 2, 3] },
};
const DAY_RANGES = ["7d", "14d", "30d", "1y", "summer", "winter"];
const rangeStart = (k) => (RANGES[k]?.today ? new Date().setHours(0, 0, 0, 0) : Date.now() - (RANGES[k]?.ms || DAY));
const inMonths = (t, months) => !months || months.includes(new Date(t).getMonth() + 1);

/* ----------------------------------------------------------------- Texte */

const T = {
  de: {
    r: { today: "Heute", "1h": "1 Std.", "3h": "3 Std.", "8h": "8 Std.", "12h": "12 Std.", "24h": "24 Std.", "3d": "3 Tage", "7d": "7 Tage", "14d": "14 Tage", "30d": "30 Tage", "1y": "1 Jahr", summer: "Sommer", winter: "Winter" },
    r_desc: { summer: "Apr–Sep, letzte 12 Monate", winter: "Okt–Mär, letzte 12 Monate", "1y": "letzte 12 Monate" },
    wind_chart: "Wind & Böen",
    tabs: { now: "Jetzt", sun: "Sonne", wind: "Wind", rain: "Regen", year: "Jahr" },
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
    r: { today: "Today", "1h": "1 hr", "3h": "3 hrs", "8h": "8 hrs", "12h": "12 hrs", "24h": "24 hrs", "3d": "3 days", "7d": "7 days", "14d": "14 days", "30d": "30 days", "1y": "1 year", summer: "Summer", winter: "Winter" },
    r_desc: { summer: "Apr–Sep, last 12 months", winter: "Oct–Mar, last 12 months", "1y": "last 12 months" },
    wind_chart: "Wind & gusts",
    tabs: { now: "Now", sun: "Sun", wind: "Wind", rain: "Rain", year: "Year" },
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
  };
}

/** Windrose aus Stundenstatistik (je Stunde Gewicht 1) */
function roseFromHourly(dirRows, spdRows, from, months) {
  const spdBy = new Map((spdRows || []).map((r) => [r.start, r.mean]));
  const sectors = Array.from({ length: 16 }, () => new Array(ROSE_CLASSES.length).fill(0));
  let sx = 0, sy = 0, tot = 0, calm = 0, moving = 0, spdSum = 0, spdN = 0;
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
    sectors[Math.round(norm360(r.mean) / 22.5) % 16][cls]++;
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
    if (changed) this._queueRender();
  }

  connectedCallback() {
    this._timer = setInterval(() => this._hass && this._config && this._fetch(), 60000 * 5);
  }

  disconnectedCallback() {
    clearInterval(this._timer);
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
    const rainId = c.rain_total_entity || c.rain_today_entity;
    const wantClimate = c.show_climate_days || c.show_climate_chart || c.show_rain_chart || c.show_rain;
    const wantWind = (c.show_wind_averages || c.show_windrose || c.show_gust_chart || c.show_wind_values) && (c.wind_direction_entity || c.wind_speed_entity);
    const radId = c[this._radKey()] || "";
    const wantSun = radId && (c.show_sun_chart || c.show_climate_days);
    const [tStats, rStats, wDir, wSpd, sStats, wGust] = await Promise.all([
      wantClimate && c.outdoor_temp_entity ? this._stats([c.outdoor_temp_entity], startLast, now, "day", ["min", "max", "mean"]) : {},
      wantClimate && rainId ? this._stats([rainId], startLast, now, "day", ["change", "max"]) : {},
      wantWind && c.wind_direction_entity ? this._stats([c.wind_direction_entity], now - 366 * DAY, now, "hour", ["mean"]) : {},
      wantWind && c.wind_speed_entity ? this._stats([c.wind_speed_entity], now - 366 * DAY, now, "hour", ["mean"]) : {},
      wantSun ? this._stats([radId], startLast, now, "hour", ["mean"]) : {},
      wantWind && c.wind_gust_entity ? this._stats([c.wind_gust_entity], now - 366 * DAY, now, "hour", ["max", "mean"]) : {},
    ]);
    if (token !== this._token) return;
    this._daily = {
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
    return [...map.values()].sort((a, b) => a.t - b.t);
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
    this._lastRender = Date.now();
    const c = this._config;
    const t = this._t;
    const hasAny = HIST_KEYS.some((k) => c[k]);
    let body = "";
    if (!hasAny) body = `<div class="empty">${esc(t.missing)}</div>`;
    else if (c.layout === "stack") body = c.tabs.map((tab) => this._tabBody(tab)).join("");
    else body = this._tabBody(this._tab);

    const tabs = c.layout === "tabs" && c.tabs.length > 1 && hasAny
      ? `<div class="tabs" role="tablist">${c.tabs.map((k) => `<button class="tab ${k === this._tab ? "on" : ""}" data-tab="${k}" role="tab">${esc(t.tabs[k])}</button>`).join("")}</div>`
      : "";
    const header = c.show_header && (c.title || c.icon)
      ? `<div class="head">${c.icon ? `<ha-icon icon="${esc(c.icon)}"></ha-icon>` : ""}<span class="title">${esc(c.title)}</span>${this._loading && !this._daily ? `<span class="muted small">${esc(t.loading)}</span>` : ""}</div>`
      : "";

    this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card>${header}${tabs}<div class="body">${body}</div></ha-card>`;
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
    this.shadowRoot.querySelectorAll("[data-rmode]").forEach((b) => b.addEventListener("click", (ev) => {
      ev.stopPropagation();
      this._roseMode = b.dataset.rmode;
      this._render();
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
    } else if (tab === "sun") {
      if (c.show_sun_arc) parts.push(this._sunArc());
      if (c.show_sun_uv && c.uv_entity) parts.push(this._uvSun());
      if (c.show_radiation && this._radKey()) parts.push(this._radiation());
      if (c.show_sun_chart && this._radKey()) parts.push(this._sunChart());
    } else if (tab === "wind") {
      if (c.show_compass && c.wind_direction_entity) parts.push(this._compassBlock());
      if (c.show_wind_averages && c.wind_direction_entity) parts.push(this._averages());
      if (c.show_gust_chart && (c.wind_speed_entity || c.wind_gust_entity)) parts.push(this._gustChart());
      if (c.show_windrose && c.wind_direction_entity) parts.push(this._windrose());
      if (c.show_wind_values) parts.push(this._windValues());
    } else if (tab === "rain") {
      if (c.show_rain) parts.push(this._rain());
      if (c.show_rain_chart) parts.push(this._rainChart());
    } else if (tab === "year") {
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
    const fc = this._forecast(pr.p, pr.d);
    const raining = this._isRaining();
    const tk = this._trendKey(pr.d);
    const arrow = tk ? (tk.startsWith("rise") ? (tk === "rise_slow" ? "↗" : "↑") : tk.startsWith("fall") ? (tk === "fall_slow" ? "↘" : "↓") : "→") : "";
    const icon = raining ? "mdi:weather-pouring" : fc === "storm" ? "mdi:weather-lightning-rainy" : fc === "rain" ? "mdi:weather-rainy" : fc === "worse" || fc === "unsettled" ? "mdi:weather-partly-cloudy" : "mdi:weather-sunny";
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

    return `<div class="hero">
      <div class="hero-main" data-more="outdoor_temp_entity">
        <ha-icon class="hero-icon" icon="${icon}" style="color:${raining ? "#38bdf8" : ok(tc) ? tempColor(tc) : "var(--primary-color)"}"></ha-icon>
        <div>
          <div class="hero-temp">${this._fmt(T0)}<span class="u">${esc(unit)}</span></div>
          ${fc ? `<div class="hero-fc">${esc(raining ? t.raining : t.fc[fc])}${tk ? ` <span class="muted">· ${esc(t.pressure)} ${esc(t.trend[tk])}</span>` : ""}</div>` : ""}
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
    if (R0.ms > 30 * DAY || R0.days >= 30) {
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
    s += `<circle cx="${cx}" cy="${cy}" r="${r0}" class="calm"/><text x="${cx}" y="${cy + 1}" class="calm-t">${st ? Math.round(st.calmPct) + "%" : "–"}</text>`;
    const dir = this._val("wind_direction_entity");
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
      ${st ? `<svg viewBox="0 0 300 300" class="rose">${s}</svg>` : `<div class="empty">${esc(this._loading ? t.loading : R0.stats ? t.no_dir_stats : t.nodata)}</div>`}
      <div class="legend center small">${legend}${unit}</div>
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
    if (R0.days) {
      for (let i = R0.days - 1; i >= 0; i--) {
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
.tabs { display:flex; gap:4px; margin: 2px 0 10px; border-bottom: 1px solid var(--divider-color); }
.tab { flex:1; background:none; border:none; padding:8px 4px; cursor:pointer; color: var(--secondary-text-color); font: inherit; font-weight:500; border-bottom: 2px solid transparent; }
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
.chip-l { font-size:.74em; color: var(--secondary-text-color); }
.chip-v { font-size:.92em; font-weight:500; white-space:nowrap; }
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
      show_compass: "Wind-Kompass", show_wind_averages: "Richtungs-Mittel (Stunde/Tag/Monat/Jahr)", show_windrose: "Windrose", show_wind_values: "Windwerte-Liste", show_gust_chart: "Wind & Böen – Verlauf", windrose_mode: "Windrose zeigt",
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
      radiation_entity: "Globalstrahlung in W/m² – ein Lux-Sensor geht auch (genähert umgerechnet).",
      illuminance_entity: "Optional, wird zusätzlich angezeigt; ohne Strahlungssensor als Ersatz genutzt.",
      sunshine_threshold: "WMO: Sonnenschein ab 120 W/m².",
      skin_type: "Für die Sonnenbrandzeit (Fitzpatrick I–VI).",
    },
    sections: { windavg: "Wind-Mittelwerte der Station (optional)", temp: "Temperatur & Luft", wind: "Wind", rain: "Regen", sun: "Sonne & UV", view: "Kopfzeile & Ansicht", parts: "Bereiche", opts: "Optionen", image: "Hausbild (Kompass & Windrose)", advanced: "Erweitert" },
    opts: {
      tabs: "Reiter", stack: "Untereinander", now: "Jetzt", sun: "Sonne", wind: "Wind", rain: "Regen", year: "Jahr",
      wind_m: "Mittelwind", gust_m: "Böen",
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
      show_compass: "Wind compass", show_wind_averages: "Direction means (hour/day/month/year)", show_windrose: "Wind rose", show_wind_values: "Wind values list", show_gust_chart: "Wind & gusts – history", windrose_mode: "Wind rose shows",
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
      radiation_entity: "Global radiation in W/m² – a lux sensor works too (approximated).",
      illuminance_entity: "Optional, shown in addition; used as fallback without a radiation sensor.",
      sunshine_threshold: "WMO: sunshine from 120 W/m².",
      skin_type: "For the sunburn time (Fitzpatrick I–VI).",
    },
    sections: { windavg: "Station wind means (optional)", temp: "Temperature & air", wind: "Wind", rain: "Rain", sun: "UV & sun", view: "Header & view", parts: "Sections", opts: "Options", image: "House image (compass & wind rose)", advanced: "Advanced" },
    opts: {
      tabs: "Tabs", stack: "Stacked", now: "Now", sun: "Sun", wind: "Wind", rain: "Rain", year: "Year",
      wind_m: "Mean wind", gust_m: "Gusts",
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
          { name: "show_gust_chart", selector: bool },
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

          { name: "rain_day_threshold", selector: n(0, 10, 0.1, "mm") },
          { name: "pressure_offset", selector: n(-100, 100, 0.1, "hPa") },
          { name: "temp_gauge_min", selector: n(-60, 20, 1, "°C") },
          { name: "temp_gauge_max", selector: n(10, 60, 1, "°C") },
        ]),
      ]),
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
    this._form.data = { ...DEFAULTS, ...this._config, skin_type: String(this._config.skin_type ?? DEFAULTS.skin_type) };
    this._form.schema = this._schema();
  }

  _changed(ev) {
    ev.stopPropagation();
    const v = ev.detail.value;
    const out = { type: this._config.type || "custom:thor-weather-card" };
    for (const [k, val] of Object.entries(v)) {
      if (k === "type" || val === undefined || val === null || val === "") continue;
      if (k === "skin_type") { if (Number(val) !== DEFAULTS.skin_type) out[k] = Number(val); continue; }
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
