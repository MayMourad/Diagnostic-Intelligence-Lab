# Diagnostic Intelligence Lab *(provisional title)*

[![CI](https://github.com/MayMourad/diagnostic-intelligence-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/MayMourad/diagnostic-intelligence-lab/actions/workflows/ci.yml)

A student research prototype on **how accurately a diagnosis is read from an image** — starting with *referable diabetic retinopathy* in retinal fundus images. Bilingual (English / العربية, RTL), runs entirely in the browser, no accounts, no uploads, no tracking.

**Team:** May Ahmed Mourad (G12) · Shamsa Faris Almazrouei (G12) · Fatima Mohamed Almazrouei (G12) — ADNOC Schools, Madinat Zayed. A student project: no endorsement by ADNOC or ADNOC Schools is implied.

> **Not a medical device. Not clinical advice.** All images are synthetic teaching illustrations. **No research model is implemented**, so nothing in the app is a model prediction.

## Run it

```bash
node tools/serve.mjs        # → http://127.0.0.1:4173   (Node ≥ 22, zero dependencies)
node --test "tests/*.test.mjs"   # unit tests
node tools/e2e.mjs          # 35 browser tests in real Chrome (needs Chrome or Edge installed)
```

ES modules cannot load from `file://`, so a static server is required. The only third-party request is the Google Fonts stylesheet (typefaces); delete the three `<link>` lines in `index.html` to run with system fonts and **zero** external requests.

## The three environments

| | Route | What it is |
|---|---|---|
| **A · Immersive Entry** | `#/` | One original WebGL eye (anatomical section, scroll-linked), the product statement, **Enter Diagnostic Lab** → guided dive into the retina. Static SVG fallback; honours reduced motion. |
| **B · Diagnostic Workbench** | `#/workbench` | 01 case selection · 02 **EvidenceLens** (zoom/pan, layered reference annotations, opacity, draggable before/after, lesion panels with source links, quality indicators, reference-vs-model panel) · 03 **Diagnostic Duel** · 04 quality & uncertainty + **Reliability Stress Test** · 05 clinician approval |
| **C · Accuracy Laboratory** | `#/lab` | Evaluation status · import held-out predictions (leakage checks, validation-only threshold, test result, provenance export) · threshold explorer · error cases · **educational simulator** (stamped) · dataset & limits |
| Supporting | `#/dashboard` `#/review` `#/carebridge` `#/responsible` `#/about` | Local progress & audit trail · reviewer tools · referral letters from approved dispositions · responsible-AI page · credits |

## Honest status

| Capability | Status |
|---|---|
| Research inference model | **Not implemented** (no data, weights or compute). Slot exists: `getModel()` in `js/features/shared.js`. |
| Metrics engine (confusion matrix, sens/spec, PPV/NPV, AUC, Wilson CIs, threshold selection, leakage checks) | **Implemented**, unit-tested, usable on a predictions file you supply |
| Real model evaluation results | **None.** The Lab says so. |
| Diagnostic Duel | **Implemented as Human vs Reference** (never "Human vs AI"); scoring is educational |
| Teaching cases | **Synthetic**: 16 images drawn by code; each reference label is *derived from the case's own lesion list* under ICDR and re-checked by a test — it is **not** an independent expert panel |
| Annotations | Drawn from the same lesion list that generated the image; never produced by AI |
| Stress test | Real pixel transforms and measured quality; **no model response** (none exists) |
| Simulator | **Synthetic**, labelled and stamped; never mixed with real or learner data |
| Arabic text | Complete, but **not yet proof-read** by a clinical translator |

**Slide deck:** [`presentation/Diagnostic-Intelligence-Lab.pptx`](presentation/Diagnostic-Intelligence-Lab.pptx) (12 slides built from real screenshots; slide previews in `presentation/render/`). Rebuild on Windows with PowerPoint: `node presentation/build-spec.mjs` then `./presentation/render-deck.ps1 -SpecPath presentation/spec.json -Out presentation/Diagnostic-Intelligence-Lab.pptx -PngDir presentation/render`.

Next step toward real results: [`docs/DATASET_PLAN.md`](docs/DATASET_PLAN.md).

Design notes: [`docs/DESIGN_NOTES.md`](docs/DESIGN_NOTES.md) · Protocol: [`docs/EVALUATION_PROTOCOL.md`](docs/EVALUATION_PROTOCOL.md) · Model card: [`docs/MODEL_CARD.md`](docs/MODEL_CARD.md) · Feature matrix & test results: [`docs/FEATURE_MATRIX.md`](docs/FEATURE_MATRIX.md)

## Run it from GitHub

```bash
git clone <repo-url> && cd <repo>
node tools/serve.mjs      # open http://127.0.0.1:4173
```

The app is a static site (no build step, no dependencies), so once the repository is public it can also be served by GitHub Pages: *Settings → Pages → Deploy from branch → `main` / root*. All asset paths are relative and routing uses the URL hash, so it works under a sub-path.

## Renaming

Everything name-related — title, Arabic title, school, students — lives in [`js/brand.js`](js/brand.js). The mark is a text-free reticle-and-scale symbol, and the platform is not named after a specialty, so a final brand needs no layout change.

## Layout

```
index.html            shell            css/   base · entry · workbench · lab · pages
js/brand.js           naming           js/i18n.js, store.js, ui.js, render.js, main.js
js/lib/               fundus (plan + ICDR reference rules) · fundus-paint · imageops · quality · metrics · privacy · rng · render-worker
js/data/              cases (teaching set) · references (lesion taxonomy + sources)
js/features/          entry · eye3d · workbench · lens · viewer · duel · reliability · lab · charts · dashboard · review · carebridge · responsible · about · shared
tests/                unit (metrics, ICDR consistency, i18n parity, privacy)      tools/  server · CDP driver · e2e · screenshot scripts
```

## Licence

MIT for the source code and original text (see `LICENSE`). Third-party research images are never committed (`data/real/` is git-ignored); any dataset used later keeps its own licence and attribution.

## Privacy

No analytics, accounts or uploads. Records live in `localStorage` on the device and can be exported or erased from the Dashboard. Free-text fields that can leave the page (approval notes, referral summaries) are scanned for identifier patterns and blocked. A predictions file you load is held in memory only for the session.
