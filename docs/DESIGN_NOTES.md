# Design notes — art direction and what was (and was not) studied

## How the references were studied

The reference pages are interactive and JavaScript-heavy. They were read through text extraction only (the fetch tool returns page text and listing metadata, not rendered visuals), so **principles were taken from their stated structure and descriptions, not from pixel-level inspection**. Nothing was copied.

| Reference | Principle taken | Where it appears |
|---|---|---|
| Spline — biotech & medical visualization | Lead with one concrete outcome and one primary action; break a pipeline into a few numbered, named stages; annotate only what aids understanding and offer several viewing angles | Entry statement + single CTA; 5 numbered workbench stages; eye labels appear only in the step that explains them; pointer-controlled rotation |
| Recent — Earth Timeline | Scroll/scrub-linked storytelling where one 3D object carries the narrative | Pinned entry scene: intact eye → section → dive to the retina, camera and labels driven by scroll progress |
| Recent — Apple hardware dimension drawings | Orthographic, monochrome engineering sheets with precise callouts | Hairline leaders, mono captions (`FIG. 06`), the *disc-diameter (DD)* ruler and macular-zone circle on the retinal image, coordinate readout, technical-drawing grid on the Accuracy Lab |
| Recent — Design Office, Fallengrey Studio, AccessGrid nav dropdown | *(Pages could not be summarised by the text fetch.)* Editorial restraint, asymmetric composition and a quiet dropdown were applied from general practice | Large light serif display, asymmetrical copy-left/anatomy-right entry, hairline-ruled sections, the "More" menu |
| Spline community | *(Not inspected in detail.)* | — |

## Identity

* **Mark:** a reticle (open circle + inner arc + four ticks) with one small teal dot — "a finding in a measured field". It contains no letters and no anatomy, so a renamed or broadened product keeps it.
* **Palette (kept):** deep navy `#0A1A2C`, clinical blue `#2F6FB7`, warm ivory `#F7F2E8`, beige `#E9DFCC`, muted teal `#4A9A92`. Two semantic accents added sparingly and only for meaning: brick `#A94632` (missed disease / blocked) and ochre `#8F6614` (borderline / over-referral).
* **Type:** Newsreader (display, light optical-size serif) · Instrument Sans (UI) · IBM Plex Mono (annotations, numerals) · IBM Plex Sans Arabic + Noto Naskh Arabic (Arabic). Hierarchy comes from scale and weight contrast, not from boxes.
* **Surfaces:** no rounded cards, no gradients-as-decoration, no glow, no particles, no stock imagery. Panels are hairline-ruled with 9 px corner ticks; the imaging stage is dark like a clinical workstation; the Lab is a ruled drawing sheet.
* **Data language:** three provenance treatments that cannot be confused — *real* (solid navy), *simulated* (dashed teal, hatched, stamped "SIMULATION"), *learner/educational* (ochre diamond). Missed disease is always brick.
* **Motion:** reveals are informational — annotation layers draw in one at a time, the Duel reveals model → reference → comparison → meaning in sequence, the confusion-matrix squares grow to their counts. All of it is removed under `prefers-reduced-motion`.

## The 3D eye

An original WebGL model (no library, no third-party scene): lathe meshes for sclera, cornea, iris, lens, retina and optic nerve; section faces drawn for sclera → choroid → retina; ciliary body wedge; the retinal lining carries a texture painted by the same code as the teaching images. Anatomy was checked against standard descriptions: layers from outside in are sclera, choroid, retina; the optic disc lies ~15–20° nasal to the fovea (modelled at 19°) and the nerve leaves at the disc; the macula/fovea sits at the posterior pole on the visual axis. Proportions are schematic and labelled "not to scale". Spline was not used: no suitable, legally reusable, verified scene was available and publishing one would add a runtime dependency on an external host.

Performance: ≈ 70 k triangles (estimated from the mesh parameters, not profiled on a GPU), one draw per mesh, DPR capped at 2, rendering paused off-screen and when the tab is hidden, static SVG fallback on any WebGL failure or context loss, and a `?static` switch.
