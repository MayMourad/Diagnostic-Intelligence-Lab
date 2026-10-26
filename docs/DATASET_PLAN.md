# Dataset plan — from teaching illustrations to a real held-out evaluation

> Status (2026-10-27): **plan only. Nothing has been downloaded, installed or trained.** Details below were read from the official pages on 2026-10-26; items marked *unverified* could not be confirmed. Re-check licences and sizes on the day you download.

## Why this is not done yet
* **IDRiD, Messidor-2, BRSET, Kaggle sets all sit behind an account, a request form or credentialing.** Creating accounts and entering credentials has to be done by a person (the project team), not by an automated assistant.
* **This machine has no Python or GPU.** Python + a CPU PyTorch build would be needed (separate downloads; versions and sizes to be confirmed when installing).
* Training on synthetic drawings would be meaningless, so no model was trained.

## Recommended first dataset — IDRiD (CC BY 4.0)
| Item | Detail |
|---|---|
| Source | IEEE DataPort, DOI 10.21227/H25W98 (<https://ieee-dataport.org/open-access/indian-diabetic-retinopathy-image-dataset-idrid>); described at <https://idrid.grand-challenge.org/Data/> |
| Licence | CC BY 4.0 per the challenge site (attribution required). The DataPort page itself names none — keep both URLs in the acknowledgements |
| `Disease Grading.zip` | 202.57 MB — 516 images (413 train / 103 test); `IDRiD_DiseaseGrading_TrainingLabels.csv`, `…_TestingLabels.csv`; DR grade 0–4, DME risk 0–2 |
| `Localization.zip` | 202.67 MB — optic-disc and fovea centres for the same 516 images |
| `Segmentation.zip` | 557.25 MB — 81 images with pixel masks (microaneurysms, haemorrhages, hard/soft exudates, optic disc) |
| Access | Free IEEE DataPort login. The page also says "requires a subscription" — *unreconciled; confirm when logging in* |
| Cite | Porwal P. et al., *Data* 2018;3(3):25, doi:10.3390/data3030025 |

**Known limits:** only 103 test images (wide intervals); no patient IDs (image-level split only — leakage cannot be excluded); no validation split (carve a stratified one from train, fixed seed); no ungradable label (the model cannot learn to abstain).

**Referable mapping to confirm with the team:** referable = DR ≥ 2 **or** DME risk 2 (exudate within 1 disc diameter of the macular centre — the Messidor definition IDRiD follows; this reading is ours, not stated on the page).

## Other candidates
| Dataset | What was verified | Why not first |
|---|---|---|
| BRSET (PhysioNet) | 16,266 images, 8,524 patients, `patient_id` and ICDR grades included; PhysioNet Credentialed Health Data License; CITI training + data-use agreement required | Credentialing may not be open to a school team and takes time. Best option for patient-level splits if obtainable |
| Messidor-2 (ADCIS) | 1,748 images / 874 exams (1,058 PNG + 690 JPG); free for research and education; no redistribution; request form → personal link valid 7 days | Ships **without** grades (third-party grades exist separately). Total size not stated |
| APTOS 2019, EyePACS 2015 (Kaggle) | Image counts only (≈ 3.7 k, ≈ 35 k) | Rules/sizes unreadable without a Kaggle session; re-hosts give conflicting licences. APTOS has no patient IDs |
| DDR | Lesion masks exist | Image count (≈ 10 k vs 13,673) and licence conflict between sources — *unverified* |

## Steps once data is in hand (each download/install needs the team's explicit go-ahead)
1. Place data under `data/real/` (git-ignored; never commit third-party images).
2. Create a split manifest (`id, patient_id|blank, split`) — image-level, stratified, fixed seed.
3. Fine-tune an ImageNet-pretrained ResNet-18 or EfficientNet-B0 on CPU (expect hours; measure and report the real time).
4. Fix the threshold on the validation partition; score the 103 test images **once**.
5. Export `predictions.csv` in the format in `docs/EVALUATION_PROTOCOL.md` §9 and load it in **Accuracy Lab → Evaluate**. Report the result whatever it is, with its intervals and limits.
6. Optionally add IDRiD as a second case source in the Workbench: real images with the 81 expert masks drawn as reference annotations (labelled *expert, not AI*), with attribution. The 16 synthetic cases stay as the offline default.
7. Update the model card, the Responsible-AI page and the deck from "not implemented" to the measured facts.
