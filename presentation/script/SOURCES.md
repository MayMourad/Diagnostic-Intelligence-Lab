# Scientific sources and what each one supports

Checked on 26–27 October 2026 against PubMed, the publisher record or the issuing organisation's page, except where marked **(not fully verified)**. Please re-check links before the forum.

## Used on the slides
| # | Source | Supports | Slide |
|---|---|---|---|
| 1 | Teo ZL, Tham YC, Yu M, et al. **Global prevalence of diabetic retinopathy and projection of burden through 2045: systematic review and meta-analysis.** *Ophthalmology* 2021;128(11):1580–1591. PMID 33940045 · <https://pubmed.ncbi.nlm.nih.gov/33940045/> | DR prevalence **22.27 %** (95 % CI 19.73–25.03) among people with diabetes; **103.12 million** adults with DR in 2020, projected **160.50 million** in 2045; 59 population-based studies | 2 (and notes) |
| 2 | International Diabetes Federation. **IDF Diabetes Atlas — United Arab Emirates country report.** <https://diabetesatlas.org/data-by-location/country/united-arab-emirates/> (underlying source: Sulaiman N, et al. *Sci Rep* 2018;8:6862, doi:10.1038/s41598-018-24312-3) | Adults (20–79) with diabetes in the UAE: **≈ 1.3 million (2024)**, 1.9 million projected for 2050 | 2 |
| 3 | Wilkinson CP, Ferris FL III, Klein RE, et al. **Proposed international clinical diabetic retinopathy and diabetic macular edema disease severity scales.** *Ophthalmology* 2003;110(9):1677–1682. doi:10.1016/S0161-6420(03)00475-5 · PMID 13129861 | The five-level ICDR scale used for the authored reference labels | 4, App. C |
| 4 | Early Treatment Diabetic Retinopathy Study Research Group. **Grading diabetic retinopathy from stereoscopic color fundus photographs — an extension of the modified Airlie House classification (ETDRS Report 10).** *Ophthalmology* 1991. PMID 2062513 · <https://pubmed.ncbi.nlm.nih.gov/2062513/> | Grading foundations behind severity criteria (e.g. the 4-2-1 rule) | 4 |

## Used in the Q&A and appendix only
| # | Source | Supports |
|---|---|---|
| 5 | Abràmoff MD, Lavin PT, Birch M, Shah N, Folk JC. **Pivotal trial of an autonomous AI-based diagnostic system for detection of diabetic retinopathy in primary care offices.** *npj Digital Medicine* 2018;1:39. doi:10.1038/s41746-018-0040-6 | Existing regulated DR-screening AI (IDx-DR): 900 participants; sensitivity 87.2 %, specificity 90.7 %, imageability 96.1 % against Wisconsin Fundus Photograph Reading Center grading. **The trial was funded by the developer; the first author founded the company.** |
| 6 | U.S. Food and Drug Administration. News release, 11 April 2018: FDA permitted marketing of IDx-DR, the first autonomous AI diagnostic system. **(not fully verified — the FDA page could not be opened by our tools; the authorisation date and “first autonomous AI diagnostic system” are confirmed by the peer-reviewed paper above and by several news reports.)** | “First FDA-authorised autonomous AI diagnostic system” statement |
| 7 | World Health Organization Regional Office for Europe. **Promoting diabetic retinopathy screening.** <https://www.who.int/europe/activities/promoting-diabetic-retinopathy-screening> | WHO recommends diabetic-retinopathy screening, with prompt treatment where needed, for all people with diabetes |
| 8 | Goddard K, Roudsari A, Wyatt JC. **Automation bias: a systematic review of frequency, effect mediators, and mitigators.** *J Am Med Inform Assoc* 2012;19(1):121–127. doi:10.1136/amiajnl-2011-000089 · PMC3240751 | Why “blind-first” and human-oversight design matter (over-reliance on automated advice). We quote no figures from it. |
| 9 | Bossuyt PM, Reitsma JB, Bruns DE, et al. **STARD 2015: an updated list of essential items for reporting diagnostic accuracy studies.** *BMJ* 2015;351:h5527. doi:10.1136/bmj.h5527 **(author list from a third-party guide; confirm on bmj.com)** | Reporting standard we would follow for a diagnostic-accuracy study |
| 10 | Collins GS, Moons KGM, Dhiman P, et al. **TRIPOD+AI statement: updated guidance for reporting clinical prediction models that use regression or machine learning methods.** *BMJ* 2024;385:e078378. doi:10.1136/bmj-2023-078378 | Reporting standard for a trained prediction model |

## Datasets researched for the roadmap (nothing downloaded)
IDRiD — Porwal P, et al. *Data* 2018;3(3):25, doi:10.3390/data3030025 (CC BY 4.0 per the challenge site; IEEE DataPort DOI 10.21227/H25W98) · BRSET — PLOS Digital Health 2024, doi:10.1371/journal.pdig.0000454 (PhysioNet credentialed access) · Messidor-2 (ADCIS; research/education use on request) · APTOS 2019 and EyePACS 2015 (Kaggle; rules unverified) · DDR (licence and image count unverified). Details: [`docs/DATASET_PLAN.md`](../../docs/DATASET_PLAN.md).

## Taken from the prototype itself (primary source of truth)
Everything about *what the application does* comes from the published app and its repository: <https://maymourad.github.io/Diagnostic-Intelligence-Lab/> · <https://github.com/MayMourad/Diagnostic-Intelligence-Lab>. The visible text of every section was recorded on the day of capture in `presentation/source/audit/`. Evaluation protocol: `docs/EVALUATION_PROTOCOL.md` · Model card: `docs/MODEL_CARD.md` · Feature matrix and test record: `docs/FEATURE_MATRIX.md`.

## Statements this presentation deliberately does **not** make
* Any sensitivity, specificity, accuracy or AUC for a model — none has been evaluated.
* That the reference labels come from expert graders — they are authored from lesion lists.
* That AI improves clinician accuracy — no evidence from this project.
* That the quality thresholds are clinically validated — they are heuristics tuned on 16 images.
* That the prototype is a medical device, is clinically approved, or is ready for patient care.
* Any UAE or Al Dhafra clinical outcome, partnership or deployment.
