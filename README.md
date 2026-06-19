# wasserqualitaet-frontend
The frontend for public display of our water quality forecast.

A web dashboard monitoring water quality in the Neckar river (Stuttgart). It displays daily forecasts, measurement data, locations, and FAQs. Open source project by [Neckarinsel e.V.](https://github.com/neckarinsel-stuttgart)

---

## For Content Editors

All text on the website is stored in JSON files — one per module, one per language. You do not need to touch any code to update content.

### Where the files are

Every module has its content in `public/modules/<module-name>/`:

For English, replace `-de.json` with `-en.json`. Both files must always exist and have the same structure.

### Editing text

Open the relevant JSON file in any text editor. Change the values (the text after the `:` inside `""`). Do not change the keys (the labels before the `:`).