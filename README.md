# wasserqualitaet-frontend
A web dashboard monitoring water quality in the Neckar river (Stuttgart). It displays daily forecasts, measurement data, locations, and FAQs. Open source project by [Neckarinsel e.V.](https://github.com/neckarinsel-stuttgart)

---

## For Content Editors

All text on the website is stored in JSON files — one per module, one per language. You do not need to touch any code to update content.

### Where the files are

Every module has its content in `public/modules/<module-name>/`:

For English, replace `-de.json` with `-en.json`. Both files must always exist and have the same structure.

### Editing text

Open the relevant JSON file in any text editor. Change the values (the text after the `:` inside `""`). Do not change the keys (the labels before the `:`).

**Example** — changing a navigation label:
```json
{
  "nav": [
    { "label": "Dashboard", "href": "/" },
    { "label": "FAQ", "href": "/faq" }
  ]
}
```
Change `"Dashboard"` to whatever label you need. Leave `"href"` untouched.


---

## For Developers

### Tech stack

- **Vite** — dev server and build tool
- **Vanilla JS (ES modules)**
- **SCSS** — modular per module, compiled by Vite/Sass
- **Chart.js** — measurement charts in the Monitor module
- **Leaflet** — OpenStreetMap in the Locations module
- **Klaro** — cookie consent management
- **Swiper** — Slideshows

### Related repositories

- **API / backend:** [neckarinsel-stuttgart/wasserqualitaet_dashboard_neckar](https://github.com/neckarinsel-stuttgart/wasserqualitaet_dashboard_neckar) — the Python backend that runs the water quality model and serves the API endpoints.

### Setup

```bash
npm install
cp .env.example .env   # then fill in API_BASE (see below)
npm run dev
```

### Environment config

Create `.env` in the project root (it is gitignored). Use `.env.example` as a template:

| Variable | Purpose |
|---|---|
| `API_BASE` | Base URL of the backend API, e.g. `http://localhost:8000` |
| `VITE_DEFAULT_LANG` | Default language when no `?lang=` query param is present (`de` or `en`) |

`API_BASE` is used by the Vite dev server proxy (`vite.config.js`) and by the PHP proxy scripts in `api/`. `VITE_`-prefixed variables are bundled into the client JS by Vite.

> **Note:** During `npm run dev`, Vite's dev-server proxy forwards `/api/*.php` requests directly to `API_BASE` — the PHP files in `api/` are not executed at all. They only run in production.

### API contract

The backend exposes several endpoints. The PHP files in `api/` forward requests from the browser to these routes:

| PHP proxy                                  | Backend route                          | Key response fields                                              |
| --------------------------------------------| ----------------------------------------| ------------------------------------------------------------------|
| `/api/plot-data.php`                       | `GET /plot-data`                       | Historical data for charts                                       |
| `/api/get_current_weather.php`             | `GET /get_current_weather`             | `temperature`, `weather_code`, `water_temperature`, `wind_speed` |
| `/api/get_next_day_weather_prediction.php` | `GET /get_next_day_weather_prediction` | Tomorrow's weather forecast                                      |
| `/api/get_daily_prediction.php`            | `GET /get_daily_prediction`            | `prediction` (boolean), `prediction_date` (ISO date string)      |
| `/api/get_water_temp.php`                  | `GET /get_water_temp`                  | Current water temperature                                        |
| `/api/get_all_predictions.php`             | `GET /get_all_predictions`             | History of past daily predictions                                |
| `/api/download.php`                        | `GET /masterdata`                      | CSV file download of all historical sensor data                  |

The frontend treats every field as optional and falls back when a value is `null`.

### Module system

Each feature is a self-contained module under `src/modules/<name>/`:

```
src/modules/forecast/
  forecast.js       ← exports init(container, data, lang, apiData, forecastData)
  forecast.scss     ← scoped styles, imported by the module JS
public/modules/forecast/
  forecast-de.json  ← German content
  forecast-en.json  ← English content
```

Modules are loaded dynamically in `src/app.js` via the `moduleMap`. To add a module:

1. Create `src/modules/<name>/<name>.js` exporting `init(container, data, lang, apiData, forecastData)`.
2. Create `public/modules/<name>/<name>-de.json` and `<name>-en.json`.
3. Add an entry to the `moduleMap` in `src/app.js`.
4. Place `<div data-module="<name>"></div>` in the relevant HTML file.

To remove a module, reverse the four steps. No other files need changing.

### Adding a page

1. Create the HTML file in the project root (e.g. `about.html`). Copy an existing page as a template and update the `data-module` attributes.
2. Add the page to the `build.rollupOptions.input` map in `vite.config.js`:
   ```js
   about: 'about.html',
   ```

### Language support

The active language is determined by the `?lang=de` / `?lang=en` URL query parameter, falling back to `VITE_DEFAULT_LANG` (default: `de`). To add a new language, create matching `*-<code>.json` files for every module under `public/modules/`.

### Typography

**Font note:** This project uses a commercial typeface. The font is not included in this repository. Replace `$font-serif` in `src/_tokens.scss` with a licensed copy or a free alternative otherwise it will be using the current fallback stack.

### Legal content

Review all legal content with a professional familiar with DSGVO/TMG requirements before going live.

### Build for production

```bash
npm run build
```

Output goes to `dist/`, it already includes `api/`. Also deploy a `.env` file next to `dist/api/` — without it, `api/config.php` has no `API_BASE` to read and the PHP proxies will respond with a 500 error.

## License

MIT — see [LICENSE](LICENSE).

