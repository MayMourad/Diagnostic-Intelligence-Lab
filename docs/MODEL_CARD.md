# Model card — Diagnostic Intelligence Lab (provisional title)

**There is no model.** This card exists so the absence is documented rather than implied.

| Field | Value |
|---|---|
| Model | **None implemented.** No weights, no training run, no inference code. |
| Intended task (future) | Binary screening score for referable diabetic retinopathy from a retinal fundus image |
| Why not implemented | This machine has no Python environment, no GPU and no labelled research dataset; downloading one needs licence review. Training a toy model on 16 synthetic drawings would be meaningless and misleading, so it was not done. |
| What the app does instead | Diagnostic Duel runs as **Human vs Reference**. Every place that would show a prediction shows "not implemented". The stress test shows pixel effects only. |
| Plug-in point | `js/features/shared.js → getModel()` currently returns `null`. A real adapter (e.g. ONNX Runtime Web + a registered weights file, with version, training data and a metrics record) would return an object there; the UI already has the slots (Duel model seat, EvidenceLens comparison column, stress-test response block). |
| Evaluation | None. The Lab computes exact statistics on a held-out predictions file **you** supply and reports its provenance. |
| Simulated numbers | The Lab's simulator draws random scores from two Gaussians. It is stamped "SIMULATION" on every chart and is never shown beside real results. |
| Out of scope | Any clinical use. This is not a medical device. |

## If a model is added later, the card must record

Training data and its licence · split manifest and leakage controls · preprocessing · architecture and weights hash · threshold rule and value · test results with intervals and the number of test evaluations performed · subgroup performance · ungradable-image behaviour · calibration · known failure cases (link the error list) · monitoring plan · who is accountable.
