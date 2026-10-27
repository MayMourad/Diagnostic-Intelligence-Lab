# Judge Q&A guide

Rule for every answer: **be exact about what exists**. The project's strongest asset is scientific integrity — never trade it for a better-sounding answer. Keep answers to ~20–30 seconds; offer the appendix slide when useful (A = mathematics, B = dataset integrity, C = status and limits).

> **The honest core (use it whenever the model comes up):** *Diagnostic Intelligence Lab is a research and educational prototype. It establishes mechanisms for evidence inspection, structured interpretation, diagnostic evaluation and human oversight. A trained and clinically evaluated diagnostic AI model has not yet been implemented. Our contribution so far is a transparent environment for investigating diagnostic interpretation, and a method for how a future model's accuracy should be measured. The next steps need appropriately licensed clinical data, model development, external validation and clinician-supervised evaluation.*

**1. Where is the AI model?**
There isn't one yet, and the app says so on its status page. We chose not to train a model on sixteen synthetic drawings, because the result would be meaningless. What we built is the part that must exist *before* any model can be trusted: the evidence-inspection tools, the interpretation workflow, and an evaluation engine that can score a model's predictions from a file the moment one exists. *(Appendix C.)*

**2. What makes this an AI-related innovation?**
It addresses the question AI diagnosis raises but rarely answers visibly: *how do we know it is accurate, and who is accountable?* Innovation here is the framework: blind-first interpretation, measured image quality without invented confidence, leakage-safe evaluation, and human approval — all ready to host a future model. We do not claim a new algorithm.

**3. How does the project relate to accurate diagnosis?**
Accuracy has two halves: reading correctly, and *knowing* how often you do. The Duel measures reading against a reference, EvidenceLens and Quality & Uncertainty examine the evidence, and the Accuracy Laboratory measures sensitivity, specificity and uncertainty properly.

**4. How is diagnostic accuracy measured?**
From a confusion matrix against a reference: sensitivity = TP/(TP+FN), specificity = TN/(TN+FP), predictive values, accuracy, ROC area, with Wilson 95% intervals. The threshold is fixed on validation data, then the test partition is evaluated once. These are implemented and unit-tested; a browser test checks that the on-screen numbers equal an independent recomputation. No real model results exist yet. *(Appendix A.)*

**5. Why did you choose diabetic retinopathy?**
It is a screening problem with a clear question — refer or re-screen — visible evidence (lesions on a retinal photograph), a published severity scale (ICDR), and well-understood costs for each error. It also matters locally: about 1.3 million adults in the UAE have diabetes (IDF Atlas 2024), and about 22% of adults with diabetes worldwide have retinopathy (Teo et al., 2021). It is our first use case, not the platform's limit.

**6. How were the reference labels produced?**
Each synthetic case is generated from an authored list of lesions. The ICDR rules (including the 4-2-1 rule for severe disease and suspected macular oedema) are applied to that list to derive the label, and an automated test re-derives every label independently. So they are consistent by construction — but they are **not** an independent expert panel, and the app states this wherever a label appears.

**7. What prevents data leakage?**
When you load a held-out predictions file, the laboratory refuses to report if any patient appears in more than one partition, if image IDs repeat, or if a partition has one class. If patient IDs are missing it warns loudly that patient-level leakage cannot be excluded. Thresholds are chosen on validation data only, and test evaluations are counted so repeated peeking is visible. *(Appendix B — the screenshot shows a refused file.)*

**8. How do you handle ungradable images?**
As a separate, first-class outcome. Quality is measured from pixels; if it is insufficient, the app gives **no result** and a recapture pathway. In the Duel, calling an ungradable image gradable (or the reverse) is scored and explained separately. Limit: our quality thresholds are heuristics tuned on 16 images, not clinically validated, and a trained model's ability to abstain has not been built.

**9. What is the purpose of Diagnostic Duel?**
To make interpretation measurable and to teach the cost of errors. You read blind, lock, then see the authored reference with the rule behind it. It reduces anchoring in the educational reading. It is a human-versus-reference comparison — **not** human versus AI — and its score is educational, not validated clinical performance.

**10. How is EvidenceLens different from a standard image viewer?**
A viewer shows pixels. EvidenceLens also controls *when* evidence is revealed (reference locked until you commit), shows authored annotations as layers with sources and authorship, measures disc-diameter distances and a macular zone, compares a green-channel view, reports measured image quality, and sets reference and model output side by side without merging them — the model column honestly says “not implemented”.

**11. What does the Quality & Uncertainty module measure?**
Sharpness (focus), brightness, contrast, illumination evenness and field coverage — computed from the pixels — plus an uncertainty register of what limits confidence in a case. The stress test lets you blur, darken or change contrast and see the measurements move. It never shows a model confidence for a degraded image, because there is no model.

**12. How would you train a diagnostic model?**
Per our written protocol: a licensed dataset, a **patient-level** split into train/validation/test, documented preprocessing, an ImageNet-pretrained CNN with transfer learning, threshold chosen on validation data, test evaluated once, plus calibration and an abstain output. We have researched candidate datasets (IDRiD, BRSET, Messidor-2, others) and their licences, but have not downloaded or trained anything. *(docs/EVALUATION_PROTOCOL.md, docs/DATASET_PLAN.md.)*

**13. How would you validate the system?**
Beyond the held-out test: external datasets from other cameras and sites, subgroup analysis, calibration, robustness to image quality and error analysis; then clinician-supervised studies of performance, workflow and automation bias; then prospective evaluation with governance and regulatory review. Reporting would follow STARD and TRIPOD+AI.

**14. How does it differ from existing retinal-screening AI?**
Existing systems are diagnostic products. IDx-DR was the first FDA-authorised autonomous AI diagnostic system for diabetic retinopathy (2018); its pivotal trial enrolled 900 people and reported 87.2% sensitivity and 90.7% specificity against a reading-centre reference (Abràmoff et al., 2018 — a trial funded by the developer). We are not competing with that: we make no diagnostic claim. We build the transparent *environment* for examining interpretation and evaluating any such system.

**15. How could this eventually be applied in Al Dhafra?**
Most realistically as a **training and evaluation sandbox** for clinicians and students: practising retinal interpretation, understanding false negatives, and learning how a screening tool should be evaluated. Any use with real patients would need local clinical partners, licensed and ethically approved data, validation on the local population, and regulatory approval — none of which we have claimed or started.

**16. What are the project's current limitations?**
No trained model; no real patient data; sixteen synthetic images that are cleaner than real photographs; reference labels authored by us rather than by expert graders; quality thresholds not clinically validated; Arabic text not yet proof-read by a clinical translator; tested only in headless Chrome and not yet audited for accessibility; not a medical device. All of this is stated in the app's Responsible AI page.

## Likely follow-ups
* **“Why not just use a public AI model?”** — Then we would be quoting someone else's accuracy. Our point is the measurement and accountability layer that any model, ours or others', would need.
* **“Is the Arabic complete?”** — The interface is fully bilingual and kept in sync by an automated test; clinical proof-reading is still to do.
* **“Can I try it?”** — Yes: https://maymourad.github.io/Diagnostic-Intelligence-Lab/ — no account, nothing uploaded, data stays in your browser.
* **“Who owns the code?”** — Open source (MIT) on GitHub under the team's account.
* **“What did each of you do?”** — Answer for yourselves, in your own words; this document does not assign development roles.

## Words to avoid
“Our AI detects…”, “accuracy of X%” (we have none), “clinically proven”, “expert-labelled” (our labels are authored), “human versus AI”, “diagnoses”. **Use instead:** “research prototype”, “authored reference”, “human-versus-reference”, “not yet evaluated”, “measured, not claimed”.
