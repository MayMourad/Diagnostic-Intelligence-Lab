# Al Dhafra Health Forum — presentation pack

**Diagnostic Intelligence Lab** · category *Accurate Diagnosis — التشخيص الدقيق* · ADNOC Schools — Madinat Zayed
May Ahmed Mourad (G12) · Shamsa Faris Almazrouei (G12) · Fatima Mohamed Almazrouei (G11)
Live prototype: <https://maymourad.github.io/Diagnostic-Intelligence-Lab/>

| Deliverable | File |
|---|---|
| Editable PowerPoint — 12 main slides + 3 appendix, speaker notes on every slide, fade transitions | [`Diagnostic-Intelligence-Lab-AlDhafra.pptx`](Diagnostic-Intelligence-Lab-AlDhafra.pptx) |
| Matching PDF | [`Diagnostic-Intelligence-Lab-AlDhafra.pdf`](Diagnostic-Intelligence-Lab-AlDhafra.pdf) |
| Speaker script — assignments, slide-by-slide, continuous, 4-min and 2.5-min cuts | [`script/SPEAKER_SCRIPT.md`](script/SPEAKER_SCRIPT.md) |
| Live-demonstration script (≈105 s) with reset steps and fallbacks | [`script/DEMO_SCRIPT.md`](script/DEMO_SCRIPT.md) |
| Judge Q&A guide (16 questions + follow-ups) | [`script/JUDGE_QA.md`](script/JUDGE_QA.md) |
| Scientific sources and the claims we do *not* make | [`script/SOURCES.md`](script/SOURCES.md) |
| Backup screenshots for the demo, numbered in order, captured from the live site | [`backup-screenshots/`](backup-screenshots/) |
| Editable source that generates everything | [`source/`](source/) |
| Slide previews (PNG, rendered from the .pptx) | [`preview/`](preview/) |

## Integrity rules this pack follows
* Every screenshot and retinal image is a capture or export of the **published** app (`source/capture.mjs`); nothing is mocked up. The app's visible text on the day of capture is saved in `source/audit/`.
* The only numbers shown that are not the app's own are three cited statistics (Teo 2021; IDF Atlas) — see `script/SOURCES.md`.
* **No model results, accuracy, sensitivity or specificity are shown.** The slide-8 confusion matrix is a labelled diagram; the live state shown beside it says “No research model has been evaluated”.
* Diagnostic Duel is always described as **human interpretation versus an authored reference**. The reference labels are authored from lesion lists, not by expert graders.
* The QR code is generated from the exact URL and **verified by decoding it** (`source/make-qr.mjs`).

## Fonts
The site uses Newsreader, Instrument Sans and IBM Plex Mono. The deck uses **Georgia / Calibri / Consolas** instead: they ship with Microsoft Office, so the file looks identical on any judge's or venue's computer, with no embedding or installation. If you install the three web fonts on the presenting laptop, select all text and switch fonts to match the site exactly.

## Rebuild
```bash
node presentation/source/capture.mjs                 # audit + screenshots from the live site (≈ 25 min; software WebGL)
QR_TOOLS=<path>/node_modules node presentation/source/make-qr.mjs    # needs: npm i qrcode jsqr pngjs (outside the repo)
node presentation/source/build-deck.mjs              # → source/spec.json (slides + notes from source/script.mjs)
node presentation/source/make-docs.mjs               # → script/SPEAKER_SCRIPT.md
# Windows + PowerPoint:
./presentation/source/render-deck.ps1 -SpecPath presentation/source/spec.json -Out presentation/Diagnostic-Intelligence-Lab-AlDhafra.pptx -PdfOut presentation/Diagnostic-Intelligence-Lab-AlDhafra.pdf -PngDir presentation/preview
```
