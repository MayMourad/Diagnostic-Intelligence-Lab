# Speaker script — Diagnostic Intelligence Lab · Al Dhafra Health Forum

*Category: Accurate Diagnosis — التشخيص الدقيق · ADNOC Schools — Madinat Zayed.* The same text is in the speaker notes of every slide in the .pptx.

## 1 · Speaker assignments (speaking sections only)
| Speaker | Slides | Words | Target time |
|---|---|---|---|
| **May Ahmed Mourad (Grade 12)** | 1–4 | 341 | 2:10 |
| **Shamsa Faris Almazrouei (Grade 12)** | 5–8 | 396 | 2:25 |
| **Fatima Mohamed Almazrouei (Grade 11)** | 9–12 | 351 | 2:00 |
| **Total** | 1–12 | 1088 | **6:35 + live demo (90–120 s)** |

At a calm 160–170 words per minute the script runs **6.4–6.8 minutes** without the demonstration. These are *speaking* assignments only — nothing here describes who built what. The team can swap sections freely; the hand-over lines are written to work either way.

**Delivery notes:** stand where you can see the screen; slow down on the three bold ideas (*prediction is not proof*, *measured, not claimed*, *the next step is validation*); pause one beat after every “Key line”; speak the numbers as words; whoever is not speaking drives the clicker and keeps the demo laptop ready.

## 2 · Slide-by-slide script

### Slide 01 — Diagnostic Intelligence Lab
**May Ahmed Mourad (Grade 12)** · ~30 s · 87 words

Good morning. We are May, Shamsa and Fatima, from ADNOC Schools, Madinat Zayed, and this is Diagnostic Intelligence Lab, our entry in the Accurate Diagnosis category. Before we trust a diagnosis, we must understand how it was reached. Ours is a student research prototype that asks a harder question than “can AI diagnose?”: when a diagnosis is read from an image, how accurately is it read, and how would anyone know? The eye behind us is a three-dimensional model we built ourselves. A schematic, not a patient.

### Slide 02 — The problem: a prediction is not proof
**May Ahmed Mourad (Grade 12)** · ~40 s · 93 words

Here is the problem. A medical prediction can be wrong, uncertain, or built on a poor image or too little evidence. So the challenge is not producing a label. It is knowing whether the label can be trusted. The scale shows why. About one in five people with diabetes has diabetic retinopathy, roughly one hundred and three million adults in 2020, and the UAE has around one point three million adults with diabetes. Screening at that scale only works if its accuracy is understood. A confident prediction is not necessarily an accurate diagnosis.

### Slide 03 — Our research question
**May Ahmed Mourad (Grade 12)** · ~28 s · 78 words

Our research question is: how accurately is a diagnosis read, and how can we measure that accuracy? Diagnostic Intelligence Lab is an interactive research environment for exactly that. A retinal case enters on the left. The reader inspects the evidence, records an interpretation, and only then compares it with a reference. We then ask how reliable the evidence was, and a human reviews the decision. Every box on this slide is a real module of our published prototype.

### Slide 04 — Why retinal screening?
**May Ahmed Mourad (Grade 12)** · ~32 s · 83 words

Why the retina? A retinal photograph makes disease visible. Lesions can be seen, counted and located, and the screening question is clear: refer, or re-screen. That creates two different errors. A false negative sends disease home. A false positive sends a healthy person to a clinic. Our reference labels follow the ICDR scale. This image is a synthetic teaching illustration drawn by our own code. It is not a patient. Retinal screening is our first use case, not the limit of the platform.

*Hand-over:* Shamsa will now show how the platform lets you inspect the evidence.

### Slide 05 — EvidenceLens
**Shamsa Faris Almazrouei (Grade 12)** · ~35 s · 90 words

Thank you, May. This is EvidenceLens, and it is not a standard image viewer. You can zoom and pan smoothly, switch on anatomical guides such as the optic disc outline and a one-disc-diameter zone around the macula, control layers and their opacity, and compare against a green-channel view. The most important design decision is the locked panel on the right. The reference annotations stay hidden until you lock your interpretation. If you see the answer first, you cannot honestly test your own reading. Good interpretation begins with careful evidence inspection.

> **Key line:** Good interpretation begins with careful evidence inspection.

### Slide 06 — Diagnostic Duel: read, lock, reveal
**Shamsa Faris Almazrouei (Grade 12)** · ~40 s · 99 words · **← switch to the live demo at the end of this slide**

That safeguard leads into the Diagnostic Duel: read, lock, reveal. Read: you observe a synthetic case, decide whether the image can be graded, choose a retinopathy level, and state your confidence. Lock: you cannot change your answer. Reveal: only now does the authored reference appear, with the rule behind it, a table of agreements and disagreements, and what the outcome means. For example, why a false negative is the costly error. To be exact: this is an educational human-versus-reference comparison. No trained diagnostic AI model is involved. The interpretation comes first. The reference comes afterward. Let us show you.

> **Key line:** The interpretation comes first. The reference comes afterward.

### Slide 07 — Reliability under pressure
**Shamsa Faris Almazrouei (Grade 12)** · ~30 s · 81 words

Before judging an interpretation, we judge the evidence. In Quality and Uncertainty, three sliders (blur, brightness and contrast) change the image in real time, and the platform measures sharpness, brightness and contrast directly from the pixels. These are the real measurements for these images. It never invents a confidence score, because there is no model to produce one, and our thresholds are heuristics that have not been clinically validated. If quality is insufficient, the answer is no result: recapture the image.

> **Key line:** Before evaluating an interpretation, we must consider the quality of the evidence.

### Slide 08 — Accuracy Lab: measured, not claimed
**Shamsa Faris Almazrouei (Grade 12)** · ~40 s · 126 words

Quality is one part of reliability. The other is measurement, and this is our technical centrepiece. From four counts, true and false positives and negatives, the Accuracy Laboratory computes sensitivity, specificity, predictive values, ROC area and Wilson confidence intervals, with threshold analysis and error cases. It also protects the evaluation: a file is refused if one patient appears in more than one partition, thresholds are chosen on validation data only, and the test set is used once. Now the honest part, on the right. The real state of the application is that no research model has been evaluated. The matrix here is a diagram, not a result. The platform does not ask you to believe an accuracy claim. It establishes how that claim should be tested.

*Hand-over:* Fatima will explain who stays accountable.

> **Key line:** The platform does not ask users to believe an accuracy claim. It establishes how that claim should be tested.

### Slide 09 — Human oversight and CareBridge
**Fatima Mohamed Almazrouei (Grade 11)** · ~30 s · 91 words

Thank you, Shamsa. A measured claim still needs a responsible human decision. Our workflow is: interpretation, review, approval, and only then a conditional referral draft. In the Review Queue, a reviewer sees discrepancies, for example when an interpretation differs from the reference label. In the approval step, the clinician role must acknowledge any discrepancy, and free text is scanned so identifiers cannot be typed in. CareBridge drafts a referral letter only after a human has approved an eligible disposition. It never decides urgency or treatment. AI-assisted healthcare must preserve human responsibility.

> **Key line:** AI-assisted healthcare must preserve human responsibility for clinical decisions.

### Slide 10 — Responsible AI by design
**Fatima Mohamed Almazrouei (Grade 11)** · ~30 s · 89 words

Responsible AI is built in, not added at the end. Safety: synthetic cases only, no patient uploads, no fabricated AI predictions, and awareness of image quality. Transparency: blind-first reading, defined and attributed reference labels, recorded evaluation provenance, limitations written on the page, and an interface in English and Arabic. Accountability: human approval, records that stay in the browser, leakage checks, review workflows, and a strict separation of references, interpretations and decisions. And to be equally clear: this prototype is not clinically approved and not ready for real patient care.

### Slide 11 — From prototype to clinical research
**Fatima Mohamed Almazrouei (Grade 11)** · ~35 s · 91 words

So what comes next? Today, in teal, is the prototype and its evaluation tools. Phase one: obtain a properly licensed retinal dataset, split by patient into training, validation and test sets. Phase two: train and evaluate a real research model, and document it. Phase three: external validation, with other datasets, subgroups, calibration, image-quality robustness and error analysis. Phase four: clinician-supervised research on performance, workflow, automation bias and human–AI collaboration. Phase five: prospective studies, governance, security and regulation before any real-world use. The next step is not deployment. It is rigorous validation.

> **Key line:** The next step is not deployment. It is rigorous validation.

### Slide 12 — Intelligence requires evidence
**Fatima Mohamed Almazrouei (Grade 11)** · ~25 s · 80 words · **all three say “Thank you” together**

To close: the future of diagnostic AI should not be judged by how confidently it predicts, but by how reliably its accuracy can be demonstrated. EvidenceLens makes evidence visible. Diagnostic Duel makes interpretation measurable. Quality and Uncertainty shows how reliable the evidence is. The Accuracy Laboratory shows how performance must be tested. And human oversight keeps accountability where it belongs. Intelligence requires evidence. The prototype is live: scan the code. Thank you. We would be glad to take your questions.

## 3 · Continuous script (read straight through)

**MAY AHMED MOURAD (GRADE 12)**

*[Slide 1]* Good morning. We are May, Shamsa and Fatima, from ADNOC Schools, Madinat Zayed, and this is Diagnostic Intelligence Lab, our entry in the Accurate Diagnosis category. Before we trust a diagnosis, we must understand how it was reached. Ours is a student research prototype that asks a harder question than “can AI diagnose?”: when a diagnosis is read from an image, how accurately is it read, and how would anyone know? The eye behind us is a three-dimensional model we built ourselves. A schematic, not a patient.

*[Slide 2]* Here is the problem. A medical prediction can be wrong, uncertain, or built on a poor image or too little evidence. So the challenge is not producing a label. It is knowing whether the label can be trusted. The scale shows why. About one in five people with diabetes has diabetic retinopathy, roughly one hundred and three million adults in 2020, and the UAE has around one point three million adults with diabetes. Screening at that scale only works if its accuracy is understood. A confident prediction is not necessarily an accurate diagnosis.

*[Slide 3]* Our research question is: how accurately is a diagnosis read, and how can we measure that accuracy? Diagnostic Intelligence Lab is an interactive research environment for exactly that. A retinal case enters on the left. The reader inspects the evidence, records an interpretation, and only then compares it with a reference. We then ask how reliable the evidence was, and a human reviews the decision. Every box on this slide is a real module of our published prototype.

*[Slide 4]* Why the retina? A retinal photograph makes disease visible. Lesions can be seen, counted and located, and the screening question is clear: refer, or re-screen. That creates two different errors. A false negative sends disease home. A false positive sends a healthy person to a clinic. Our reference labels follow the ICDR scale. This image is a synthetic teaching illustration drawn by our own code. It is not a patient. Retinal screening is our first use case, not the limit of the platform.

*[hand-over to Shamsa — Shamsa takes the clicker]*


**SHAMSA FARIS ALMAZROUEI (GRADE 12)**

*[Slide 5]* Thank you, May. This is EvidenceLens, and it is not a standard image viewer. You can zoom and pan smoothly, switch on anatomical guides such as the optic disc outline and a one-disc-diameter zone around the macula, control layers and their opacity, and compare against a green-channel view. The most important design decision is the locked panel on the right. The reference annotations stay hidden until you lock your interpretation. If you see the answer first, you cannot honestly test your own reading. Good interpretation begins with careful evidence inspection.

*[Slide 6]* That safeguard leads into the Diagnostic Duel: read, lock, reveal. Read: you observe a synthetic case, decide whether the image can be graded, choose a retinopathy level, and state your confidence. Lock: you cannot change your answer. Reveal: only now does the authored reference appear, with the rule behind it, a table of agreements and disagreements, and what the outcome means. For example, why a false negative is the costly error. To be exact: this is an educational human-versus-reference comparison. No trained diagnostic AI model is involved. The interpretation comes first. The reference comes afterward. Let us show you.

*[LIVE DEMONSTRATION — see DEMO_SCRIPT.md. Return to slide 8 afterwards.]*

*[Slide 7]* Before judging an interpretation, we judge the evidence. In Quality and Uncertainty, three sliders (blur, brightness and contrast) change the image in real time, and the platform measures sharpness, brightness and contrast directly from the pixels. These are the real measurements for these images. It never invents a confidence score, because there is no model to produce one, and our thresholds are heuristics that have not been clinically validated. If quality is insufficient, the answer is no result: recapture the image.

*[Slide 8]* Quality is one part of reliability. The other is measurement, and this is our technical centrepiece. From four counts, true and false positives and negatives, the Accuracy Laboratory computes sensitivity, specificity, predictive values, ROC area and Wilson confidence intervals, with threshold analysis and error cases. It also protects the evaluation: a file is refused if one patient appears in more than one partition, thresholds are chosen on validation data only, and the test set is used once. Now the honest part, on the right. The real state of the application is that no research model has been evaluated. The matrix here is a diagram, not a result. The platform does not ask you to believe an accuracy claim. It establishes how that claim should be tested.

*[hand-over to Fatima — Fatima takes the clicker]*


**FATIMA MOHAMED ALMAZROUEI (GRADE 11)**

*[Slide 9]* Thank you, Shamsa. A measured claim still needs a responsible human decision. Our workflow is: interpretation, review, approval, and only then a conditional referral draft. In the Review Queue, a reviewer sees discrepancies, for example when an interpretation differs from the reference label. In the approval step, the clinician role must acknowledge any discrepancy, and free text is scanned so identifiers cannot be typed in. CareBridge drafts a referral letter only after a human has approved an eligible disposition. It never decides urgency or treatment. AI-assisted healthcare must preserve human responsibility.

*[Slide 10]* Responsible AI is built in, not added at the end. Safety: synthetic cases only, no patient uploads, no fabricated AI predictions, and awareness of image quality. Transparency: blind-first reading, defined and attributed reference labels, recorded evaluation provenance, limitations written on the page, and an interface in English and Arabic. Accountability: human approval, records that stay in the browser, leakage checks, review workflows, and a strict separation of references, interpretations and decisions. And to be equally clear: this prototype is not clinically approved and not ready for real patient care.

*[Slide 11]* So what comes next? Today, in teal, is the prototype and its evaluation tools. Phase one: obtain a properly licensed retinal dataset, split by patient into training, validation and test sets. Phase two: train and evaluate a real research model, and document it. Phase three: external validation, with other datasets, subgroups, calibration, image-quality robustness and error analysis. Phase four: clinician-supervised research on performance, workflow, automation bias and human–AI collaboration. Phase five: prospective studies, governance, security and regulation before any real-world use. The next step is not deployment. It is rigorous validation.

*[Slide 12]* To close: the future of diagnostic AI should not be judged by how confidently it predicts, but by how reliably its accuracy can be demonstrated. EvidenceLens makes evidence visible. Diagnostic Duel makes interpretation measurable. Quality and Uncertainty shows how reliable the evidence is. The Accuracy Laboratory shows how performance must be tested. And human oversight keeps accountability where it belongs. Intelligence requires evidence. The prototype is live: scan the code. Thank you. We would be glad to take your questions.


## 4 · Shortened versions

### 4-minute version (generated: the first four sentences of each slide + its key line)
**May Ahmed Mourad (Grade 12).** *Slide 1:* Good morning. We are May, Shamsa and Fatima, from ADNOC Schools, Madinat Zayed, and this is Diagnostic Intelligence Lab, our entry in the Accurate Diagnosis category. Before we trust a diagnosis, we must understand how it was reached. Ours is a student research prototype that asks a harder question than “can AI diagnose?” *Slide 2:* Here is the problem. A medical prediction can be wrong, uncertain, or built on a poor image or too little evidence. So the challenge is not producing a label. It is knowing whether the label can be trusted. *Slide 3:* Our research question is: how accurately is a diagnosis read, and how can we measure that accuracy? Diagnostic Intelligence Lab is an interactive research environment for exactly that. A retinal case enters on the left. The reader inspects the evidence, records an interpretation, and only then compares it with a reference. *Slide 4:* Why the retina? A retinal photograph makes disease visible. Lesions can be seen, counted and located, and the screening question is clear: refer, or re-screen. That creates two different errors.

**Shamsa Faris Almazrouei (Grade 12).** *Slide 5:* Thank you, May. This is EvidenceLens, and it is not a standard image viewer. You can zoom and pan smoothly, switch on anatomical guides such as the optic disc outline and a one-disc-diameter zone around the macula, control layers and their opacity, and compare against a green-channel view. The most important design decision is the locked panel on the right. Good interpretation begins with careful evidence inspection. *Slide 6:* That safeguard leads into the Diagnostic Duel: read, lock, reveal. Read: you observe a synthetic case, decide whether the image can be graded, choose a retinopathy level, and state your confidence. Lock: you cannot change your answer. Reveal: only now does the authored reference appear, with the rule behind it, a table of agreements and disagreements, and what the outcome means. The interpretation comes first. The reference comes afterward. *Slide 7:* Before judging an interpretation, we judge the evidence. In Quality and Uncertainty, three sliders (blur, brightness and contrast) change the image in real time, and the platform measures sharpness, brightness and contrast directly from the pixels. These are the real measurements for these images. It never invents a confidence score, because there is no model to produce one, and our thresholds are heuristics that have not been clinically validated. Before evaluating an interpretation, we must consider the quality of the evidence. *Slide 8:* Quality is one part of reliability. The other is measurement, and this is our technical centrepiece. From four counts, true and false positives and negatives, the Accuracy Laboratory computes sensitivity, specificity, predictive values, ROC area and Wilson confidence intervals, with threshold analysis and error cases. It also protects the evaluation: a file is refused if one patient appears in more than one partition, thresholds are chosen on validation data only, and the test set is used once. The platform does not ask users to believe an accuracy claim. It establishes how that claim should be tested.

**Fatima Mohamed Almazrouei (Grade 11).** *Slide 9:* Thank you, Shamsa. A measured claim still needs a responsible human decision. Our workflow is: interpretation, review, approval, and only then a conditional referral draft. In the Review Queue, a reviewer sees discrepancies, for example when an interpretation differs from the reference label. AI-assisted healthcare must preserve human responsibility for clinical decisions. *Slide 10:* Responsible AI is built in, not added at the end. Safety: synthetic cases only, no patient uploads, no fabricated AI predictions, and awareness of image quality. Transparency: blind-first reading, defined and attributed reference labels, recorded evaluation provenance, limitations written on the page, and an interface in English and Arabic. Accountability: human approval, records that stay in the browser, leakage checks, review workflows, and a strict separation of references, interpretations and decisions. *Slide 11:* So what comes next? Today, in teal, is the prototype and its evaluation tools. Phase one: obtain a properly licensed retinal dataset, split by patient into training, validation and test sets. Phase two: train and evaluate a real research model, and document it. The next step is not deployment. It is rigorous validation. *Slide 12:* To close: the future of diagnostic AI should not be judged by how confidently it predicts, but by how reliably its accuracy can be demonstrated. EvidenceLens makes evidence visible. Diagnostic Duel makes interpretation measurable. Quality and Uncertainty shows how reliable the evidence is. Thank you. We would be glad to take your questions.

*(714 words ≈ 4.3 minutes at 165 wpm; keep the live demo to its 60-second version.)*

### 2.5-minute emergency version (six beats, two per speaker; show slides 1, 2, 6, 8, 10, 12 only)
1. **May:** “We are May, Shamsa and Fatima from ADNOC Schools, Madinat Zayed. Before we trust a diagnosis, we must understand how it was reached.” *(slide 1)*
2. **May:** “A confident prediction is not necessarily an accurate diagnosis. Screening only works if its accuracy is understood.” *(slide 2)*
3. **Shamsa:** “Our Diagnostic Duel lets you read a synthetic retinal case, lock your interpretation, and only then see the authored reference. No AI model is involved.” *(slide 6 — 30 s of demo)*
4. **Shamsa:** “The Accuracy Laboratory computes sensitivity, specificity and confidence intervals, and refuses leaky data. No research model has been evaluated: it shows how a claim should be tested.” *(slide 8)*
5. **Fatima:** “Every decision stays human, every limit is stated, and the prototype is not clinically approved.” *(slide 10)*
6. **Fatima:** “The next step is not deployment. It is rigorous validation. Intelligence requires evidence. Scan the code to try it. Thank you.” *(slide 12)*

## 5 · Pronunciation and phrasing cheat-sheet
ICDR *“eye-see-dee-ar”* (International Clinical Diabetic Retinopathy scale) · ETDRS *“ee-tee-dee-ar-ess”* · NPDR *“non-proliferative D-R”* · fundus *“FUN-dus”* · macula *“MAK-yoo-la”* · Wilson interval *“Wilson confidence interval”* · AUC *“area under the curve”* · PPV/NPV *“positive / negative predictive value”* · IDF *“International Diabetes Federation”*.
