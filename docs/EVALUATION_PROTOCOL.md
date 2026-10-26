# Evaluation protocol — referable diabetic retinopathy (specified, **not executed**)

> Status: **specification only.** No dataset has been downloaded, no model has been trained, and no result exists.
> This document is what a real evaluation must follow; the Accuracy Laboratory (`#/lab`) already implements the statistics, leakage checks and threshold discipline described in §5–§7, and will compute them on a held-out predictions file you supply.

## 1. Task and outcome definitions

| Term | Definition used here |
|---|---|
| Referable DR (positive) | ICDR **moderate NPDR or worse** (grade ≥ 2), **or** suspected diabetic macular oedema (hard exudate within 1 disc diameter of the macular centre) |
| Non-referable (negative) | ICDR grade 0–1 without suspected DME |
| Ungradable | Image quality insufficient for any grade. Reported as a **separate outcome**, never silently dropped or forced into a class |
| Unit of analysis | One eye image; grouped by patient for splitting |

Source for the scale: Wilkinson et al., *Ophthalmology* 2003;110(9):1677–82 (doi:10.1016/S0161-6420(03)00475-5). The 4-2-1 severity rule follows ETDRS-derived criteria (ETDRS Report 10, PMID 2062513).

## 2. Data

1. Choose a public dataset whose licence permits research use (candidates and their grouping caveats are listed in the app under **Lab → Dataset & limits**: APTOS 2019, EyePACS/Kaggle DR 2015, Messidor-2, IDRiD). Verify licence and terms before download. Record the exact version and download date.
2. Reference labels come from the dataset's own graders. Record how many graders and how disagreement was resolved. **Do not** relabel with a model.
3. Document exclusions (corrupt files, missing labels) with counts.

## 3. Splitting — preventing leakage

* Split **by patient**, never by image, wherever any grouping information exists (EyePACS file names carry patient and eye; Messidor-2 pairs eyes per subject). Both eyes of a patient go to the same partition.
* APTOS 2019 publishes no patient identifier: only an image-level split is possible, and the report must say patient-level leakage **cannot be excluded**.
* Three disjoint partitions: **train**, **validation** (model selection and threshold), **test** (touched once). Stratify by reference label. Fix the random seed and publish the manifest (`id, patient_id, split`).
* Remove near-duplicates across partitions (perceptual hash) and record how many were removed.
* Any augmentation is applied **after** splitting and **only to train**.

## 4. Preprocessing and model (specified)

* Crop to the circular field of view; resize to a fixed square (e.g. 512 px); scale-radius normalisation and/or green-channel contrast enhancement; ImageNet mean/std normalisation. The same deterministic preprocessing is used for validation and test.
* Architecture: an ImageNet-pretrained CNN (for example EfficientNet-B0 or ResNet-50) with the classifier replaced by a single-logit head; transfer learning with a frozen-then-unfrozen schedule. Weighted or balanced sampling for class imbalance. Early stopping on **validation** AUC.
* Output: a score in [0, 1] = P(referable). Calibration (temperature scaling) fitted on validation only.
* An explicit **abstain / no-result** output for low-quality images (quality head or quality threshold), reported separately.

## 5. Threshold selection

The operating threshold is fixed **on validation data only**, before the test partition is scored. Two rules are implemented in `js/lib/metrics.js`:

* *Youden*: maximise sensitivity + specificity − 1.
* *Sensitivity target*: highest specificity subject to sensitivity ≥ target (e.g. 0.90) — the usual choice for screening, where a missed case is costlier than an extra referral.

The test partition is then evaluated **once**. The Lab counts test evaluations in a session so repeated peeking is visible.

## 6. Metrics reported

Confusion matrix; **sensitivity**, **specificity**, PPV, NPV, accuracy, balanced accuracy (each with 95 % Wilson intervals where a proportion); ROC curve and AUC; false-negative and false-positive lists with image ids; performance in ungradable images (proportion abstained); calibration plot. Report PPV/NPV **at the intended screening prevalence**, not only the dataset's.

## 7. Integrity checks (implemented)

A predictions file is refused (no statistics shown) when: a patient appears in more than one partition; image ids are duplicated; split names are unknown; scores are outside [0, 1]; labels are not 0/1; there is no test partition; or a partition contains one class. Missing patient ids and a missing validation partition are loud warnings.

## 8. Reporting and limits

Follow STARD 2015 (diagnostic accuracy studies) and TRIPOD+AI (prediction-model reporting). State: dataset, split manifest, preprocessing, model, threshold rule and value, test result with intervals, error analysis, subgroup performance if labels exist, and **limitations** (domain shift, prevalence shift, label noise, single dataset, no external validation). A single-dataset result is not evidence of clinical safety, and nothing here shows that AI assistance improves clinician accuracy — that needs a controlled reader study.

## 9. Predictions file format accepted by the Lab

```csv
id,patient_id,split,reference,score
img-0001,patient-A,train,1,0.91
img-0002,patient-B,val,0,0.12
img-0003,patient-C,test,1,0.77
```

JSON is also accepted: `{ "meta": { "model": "...", "dataset": "...", "split_method": "..." }, "rows": [ … ] }`. Provenance fields are self-reported; the app records the file's SHA-256 so an evaluation can be traced to the exact bytes.
