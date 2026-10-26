# Feature-completion matrix, test results and capability status

Legend — **Implemented**: working and tested · **Simulated**: a clearly labelled educational stand-in · **Future**: not built.
Everything below was verified by running the app in headless Chrome (`tools/e2e.mjs`) and by unit tests (`tests/`); screenshots in `screenshots/` are captures of the running app (`tools/shots.mjs`).

## 1 · Branding
| Requirement | Status | Evidence |
|---|---|---|
| Retire "NourDx AI"; temporary title **Diagnostic Intelligence Lab** | Implemented | Single source `js/brand.js`; test asserts the old name appears nowhere in the DOM or source |
| Student names (May Ahmed Mourad, Shamsa Faris Almazrouei, Fatima Mohamed Almazrouei — G12) and ADNOC Schools – Madinat Zayed | Implemented | Entry page, footer, About, referral-letter footer, deck; no ADNOC branding used, non-endorsement stated |
| Specialty-independent, rename-safe identity | Implemented | Text-free reticle mark; name/school/students in one file |

## 2 · Diagnostic accuracy
| Requirement | Status | Notes |
|---|---|---|
| Genuine research inference model | **Future — not implemented** | No dataset, weights, Python or GPU on the machine; slot `getModel()` returns `null`; every empty state says "not implemented"; no scanning animation |
| Five distinct things kept apart (prediction · reference label · clinician interpretation · reference annotations · approved disposition) | Implemented | Provenance ledger on Lens, Approval, Review |
| Patient-level leakage control, validation-only thresholds, independent test partition | Implemented (engine) | `js/lib/metrics.js`; unit + browser tests (leaky file is refused; threshold unchanged when test labels flip) |
| Sensitivity, specificity, confusion matrix, other metrics from genuine outputs | Implemented for **user-supplied held-out predictions**; **no real model results exist** | Browser test recomputes independently and matches the display exactly |
| Educational labels never treated as predictions | Implemented | Reference label = authored from lesion list; duel is Human vs Reference |

## 3 · Diagnostic Duel
Present blind image · record interpretation · lock · reveal model **only if it exists** (it does not → "not implemented") · reveal reference · agreements/disagreements · FP/FN explanation · learner record — **Implemented**, 8 steps. Scoring is educational with 95 % Wilson intervals and an explicit "not validated clinical performance" caveat; it never claims AI improves clinicians. Practice-only handling when reference layers were opened first.

## 4 · Diagnostic Accuracy Lab
| Item | Status |
|---|---|
| Confusion matrix · sensitivity/specificity · FP/FN counts · threshold exploration · error-case inspection · model limitations · evaluation provenance · dataset information | Implemented (real data path) |
| Synthetic-metrics simulator | **Simulated** — dashed/hatched/stamped, never co-rendered with real data |
| Provenance export (SHA-256 of the file, declared metadata, threshold rule, test-evaluation counter) | Implemented |

## 5 · EvidenceLens
Zoom/pan (wheel, pinch, keys, buttons) · layered reference annotations with staged reveal · opacity · draggable before/after (plain|annotated, colour|green-channel) · lesion panels with ICDR/ETDRS source links · image-quality indicators measured from pixels · reference-vs-model panel — **Implemented**. Annotations are drawn from the case's lesion list and say so; no segmentation masks are fabricated.

## 6 · Reliability Stress Test
Blur/brightness/contrast with live preview and live measured quality — **Implemented**. Explicit **no-result pathway** — Implemented. Model response to the transformed image — **Future**; the UI says why none is shown and never invents a confidence.

## 7–9 · Design, 3D, journey
| Item | Status | Notes |
|---|---|---|
| Premium editorial design system, custom clinical visualisations, restrained motion | Implemented | See `docs/DESIGN_NOTES.md` (references were read as text only — stated there) |
| One signature 3D anatomical experience | Implemented — **original WebGL**, not Spline | Static SVG fallback, reduced-motion, pause off-screen, blank-canvas self-check; anatomy checked (nasal disc, layer order). Spline not used: no verified reusable scene |
| Guided transition into the Workbench | Implemented | Iris-open dive; instant under reduced motion |
| A · Entry / B · Workbench / C · Accuracy Laboratory | Implemented | |
| Dashboard, Review Queue (reviewer tools), CareBridge referrals, Responsible-AI page, About | Implemented | CareBridge only for approved refer dispositions; identifier guard blocks print/download |
| Bilingual EN/AR with RTL | Implemented | ≈ 420 strings per language with a parity test; Arabic not yet proof-read clinically |

## 10 · Presentation
12 slides, built from real screenshots of this app — `presentation/Diagnostic-Intelligence-Lab.pptx` (rendered previews in `presentation/render/`). Slides carry honest status labels; no mock-ups of unimplemented features.

## Test results (final run)
| Suite | Result |
|---|---|
| Unit tests (`node --test "tests/*.test.mjs"`) | **31 / 31 pass** — metrics (hand-checked tables, AUC, Wilson, thresholds, leakage), ICDR rule re-derivation for all 16 cases, outcome classification, learner statistics, i18n parity, identifier scanner |
| Browser e2e (`node tools/e2e.mjs`, real Chrome) | **35 / 35 pass** — routes in EN and AR without console errors or missing strings; no horizontal overflow at 390 px and 820 px; WebGL actually paints; static fallback; reduced motion; zoom/pan/compare; blind→reveal flows; every duel outcome; persistence; stress test and no-result; approval gates and identifier guard; CareBridge; held-out import (leakage blocked; displayed statistics equal an independent recomputation); Arabic RTL and unmirrored anatomy; keyboard menu |
| GitHub Actions (clean Ubuntu runner, software WebGL) | **31 / 31 unit and 35 / 35 browser pass** after making timing-sensitive checks poll instead of sleep (the first CI run was 32 / 35 for that reason alone) |
| Raw record | `docs/TEST_RESULTS.json` |

Bugs found *by* these tests and fixed: swapped "ungradable" outcome classification, SVG `class` arrays rendered as one token (broke every chart style), `null` rendered as the text "null" in four places, a mobile overflow on the Responsible-AI page, and a label column that ran under the entry copy.

## Not verified / known limits
* No real-device, real-GPU, Safari or Firefox testing (headless Chrome with software WebGL only).
* No screen-reader or formal accessibility audit.
* Arabic copy written by the build, not proof-read by a clinical translator.
* Image-quality bands are heuristics tuned on the 16 teaching images; they are not validated gradability criteria.
* The teaching images are synthetic and easier/cleaner than real fundus photographs.
* Google Fonts is the one external request (removable).
