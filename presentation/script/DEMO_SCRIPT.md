# Live demonstration script — about 105 seconds

**Open:** <https://maymourad.github.io/Diagnostic-Intelligence-Lab/> · **Switch point:** end of slide 6 (Diagnostic Duel). **Return to:** slide 8 (Accuracy Lab).
**One laptop, one driver.** The driver clicks while the narrator speaks; roles below are suggestions for the team to change. No typing is needed anywhere.

## Before you go on stage (2 minutes, once)
1. **Start from a clean state.** The app remembers what you tried. Open the site → *More ▾ → Dashboard → Erase all local data → Yes, erase*. (Or use a fresh private/incognito window.)
2. **Pre-warm.** Open `#/workbench` once and wait ~10 s so all 16 thumbnails have rendered (they are drawn in a background worker and cached).
3. **Offline fallback ready.** Clone the repo and run `node tools/serve.mjs` → <http://127.0.0.1:4173> (works without internet; only the web fonts fall back to system fonts). Keep the tab open in a second window.
4. **Backup screenshots** are in `presentation/backup-screenshots/` (numbered in demo order) — see the last section.
5. Browser zoom 100 %, full-screen (F11), window ≥ 1400 px wide.

## Case choices (reliable, already tested)
| Purpose | Case | Why |
|---|---|---|
| EvidenceLens (Study Mode) | **C10** | Many visible lesions — the layers look rich and reveal clearly |
| Diagnostic Duel | **C07** | Sparse, mostly peripheral findings → a plausible miss. The reveal teaches *why false negatives matter* |
| Quality & Uncertainty | **C06** | Clean image; the *Defocus* preset gives a clear, measurable change |

> Use **different cases** for EvidenceLens and the Duel: opening reference layers on a case first marks it *practice-only* (that is the app's own safeguard — you may even point it out).

## The sequence

| Time | Who (suggested) | Action (exact clicks) | Say (1–2 sentences) |
|---|---|---|---|
| 0:00 | May | Top bar **Workbench** → click the **C10** thumbnail → lands on **EvidenceLens** | “Sixteen synthetic cases, no labels shown. Every thumbnail carries a measured quality tag, not a diagnosis.” |
| 0:12 | May | Scroll the mouse wheel over the image to zoom; drag to pan; click **Fit** (⤢). Note the **MACULA / DISC / 1 DD** guides | “Smooth zoom and pan, with anatomical guides: optic disc, macula, and a one-disc-diameter zone.” |
| 0:25 | May | Right panel shows **“Reference layers are locked”**. Click **Enter Study Mode (practice only)**, then **Show** | “By default the reference is locked, which is the blind-first principle. Study Mode opens it, and marks this case practice-only.” |
| 0:38 | May | Click any coloured ring on the image → the **Finding** tab opens with the description and **Open source** link | “Every annotation says what it is, why it matters for grading, and who authored it — here, our own lesion list, not an AI.” |
| 0:50 | Shamsa | Click **03 Diagnostic Duel** in the stage bar → switch case with the arrows/dropdown to **C07** | “Now a case we have not seen.” |
| 0:56 | Shamsa | Choose **Gradable** → card **1 · Mild NPDR** → leave confidence **Medium** → read the live “Your screening decision: Routine” | “We read it. A plausible reading: mild. The screening decision follows from it.” |
| 1:05 | Shamsa | Click **Lock interpretation — final** → wait ~6 s while the reveal builds (model seat says *not implemented*) | “Locked. Only now does the authored reference appear. Note the model seat: not implemented. This is human versus reference.” |
| 1:15 | Shamsa | Point at **“Why this label — the rule trace”**, then the red **False negative** panel | “We called a referable case routine. This is the costly error, and the platform explains why — it is exactly what the Accuracy Laboratory is built to measure.” |
| 1:25 | Fatima | Click **04 Quality & uncertainty** (case C06 via the dropdown) → click **Defocus** | “Quality is evidence too. Defocus the image and the measured sharpness falls.” |
| 1:35 | Fatima | Point at the red **Insufficient** gauge and the **No-result pathway** box | “Insufficient quality gives no grade at all. No invented confidence — there is no model.” |
| 1:42 | Fatima | Top bar **Accuracy Lab** → **Evaluation status** | “And the honest status: no research model has been evaluated. The laboratory is ready to evaluate one — that is the next slide.” → **return to the slides (slide 8)** |

**If you have only 60 seconds:** keep rows 0:00 (C10), 0:25 (Study Mode), 0:56 (Duel read + lock), 1:15 (false-negative panel), 1:42 (status). **If you have 30 seconds:** show only the Duel on C07 from read to reveal.

## What can go wrong → what to do
| Problem | Fix |
|---|---|
| No internet / Pages slow | Switch to the local server window (`127.0.0.1:4173`), or the screenshots below |
| Thumbnails blank | Wait ~10 s; they render in the background. Refresh once if needed |
| A case already says **Locked** | You rehearsed it. Use another unseen case, or *Dashboard → Erase all local data* |
| 3D eye on the entry page is slow | Not needed for the demo — start at **Workbench**. (The page falls back to a static drawing automatically) |
| Arabic shows by accident | Click the language button (top right) |

## Backup screenshots (`presentation/backup-screenshots/`, all captured from the live site)
`01-entry` · `02-workbench-case-selection` · `03-evidencelens-blind-first` · `04-evidencelens-layers-after-study-mode` · `05-duel-read` · `06-duel-reveal` · `07-quality-original` · `08-quality-blur` · `09-accuracy-lab-status` · `10-accuracy-lab-simulator` · `11-accuracy-lab-evaluate` · `12-clinician-approval` · `13-review-queue` · `14-carebridge` · `15-responsible-ai` · `16-about-credits`

If the live app fails completely, narrate the same sequence over these images in this order (1–2 sentences each, same wording as above).
