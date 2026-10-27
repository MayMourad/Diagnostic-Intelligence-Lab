// Prints presentation/script/SPEAKER_SCRIPT.md from script.mjs (so the notes in the .pptx and the printed script can never drift apart).
//   node presentation/source/make-docs.mjs
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCRIPT, SPEAKERS, words } from './script.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const tot = (who) => SCRIPT.filter((s) => s.who === who).reduce((a, s) => a + words(s.say), 0);
const secs = (who) => SCRIPT.filter((s) => s.who === who).reduce((a, s) => a + s.sec, 0);
const allWords = SCRIPT.reduce((a, s) => a + words(s.say), 0);
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const rangeOf = (who) => { const ns = SCRIPT.filter((s) => s.who === who).map((s) => s.n); return `${ns[0]}–${ns[ns.length - 1]}`; };

// 4-minute cut: first four sentences of every slide plus its key line, so the notes never drift from the full script
const sentences = (t) => t.match(/[^.?!]+[.?!]+(?:[”"])?/g).map((x) => x.trim());
const cut = (s) => { const ss = sentences(s.say); const keep = ss.slice(0, 4); if (s.key && !keep.includes(s.key)) keep.push(s.key); if (s.n === 12) keep.push(ss[ss.length - 2], ss[ss.length - 1]); return [...new Set(keep)].join(' '); };
const short4Words = SCRIPT.reduce((a, s) => a + words(cut(s)), 0);
const short4 = ['may', 'shamsa', 'fatima'].map((w) => `**${SPEAKERS[w]}.** ` + SCRIPT.filter((s) => s.who === w).map((s) => `*Slide ${s.n}:* ${cut(s)}`).join(' ')).join('\n\n') + `\n\n*(${short4Words} words ≈ ${(short4Words / 165).toFixed(1)} minutes at 165 wpm; keep the live demo to its 60-second version.)*`;

let md = `# Speaker script — Diagnostic Intelligence Lab · Al Dhafra Health Forum

*Category: Accurate Diagnosis — التشخيص الدقيق · ADNOC Schools — Madinat Zayed.* The same text is in the speaker notes of every slide in the .pptx.

## 1 · Speaker assignments (speaking sections only)
| Speaker | Slides | Words | Target time |
|---|---|---|---|
${['may', 'shamsa', 'fatima'].map((w) => `| **${SPEAKERS[w]}** | ${rangeOf(w)} | ${tot(w)} | ${mmss(secs(w))} |`).join('\n')}
| **Total** | 1–12 | ${allWords} | **${mmss(SCRIPT.reduce((a, s) => a + s.sec, 0))} + live demo (90–120 s)** |

At a calm 160–170 words per minute the script runs **${(allWords / 170).toFixed(1)}–${(allWords / 160).toFixed(1)} minutes** without the demonstration. These are *speaking* assignments only — nothing here describes who built what. The team can swap sections freely; the hand-over lines are written to work either way.

**Delivery notes:** stand where you can see the screen; slow down on the three bold ideas (*prediction is not proof*, *measured, not claimed*, *the next step is validation*); pause one beat after every “Key line”; speak the numbers as words; whoever is not speaking drives the clicker and keeps the demo laptop ready.

## 2 · Slide-by-slide script
`;
for (const s of SCRIPT) {
  md += `\n### Slide ${String(s.n).padStart(2, '0')} — ${s.title}\n**${SPEAKERS[s.who]}** · ~${s.sec} s · ${words(s.say)} words${s.demo ? ' · **← switch to the live demo at the end of this slide**' : ''}${s.all ? ' · **all three say “Thank you” together**' : ''}\n\n${s.say}\n${s.next ? `\n*Hand-over:* ${s.next}\n` : ''}${s.key ? `\n> **Key line:** ${s.key}\n` : ''}`;
}
md += `\n## 3 · Continuous script (read straight through)\n`;
let last = '';
for (const s of SCRIPT) {
  if (s.who !== last) { md += `\n**${SPEAKERS[s.who].toUpperCase()}**\n\n`; last = s.who; }
  md += `*[Slide ${s.n}]* ${s.say}\n\n`;
  if (s.n === 4) md += `*[hand-over to Shamsa — Shamsa takes the clicker]*\n\n`;
  if (s.n === 8) md += `*[hand-over to Fatima — Fatima takes the clicker]*\n\n`;
  if (s.n === 6) md += `*[LIVE DEMONSTRATION — see DEMO_SCRIPT.md. Return to slide 8 afterwards.]*\n\n`;
}
md += `
## 4 · Shortened versions

### 4-minute version (generated: the first four sentences of each slide + its key line)
${short4}

### 2.5-minute emergency version (six beats, two per speaker; show slides 1, 2, 6, 8, 10, 12 only)
1. **May:** “We are May, Shamsa and Fatima from ADNOC Schools, Madinat Zayed. Before we trust a diagnosis, we must understand how it was reached.” *(slide 1)*
2. **May:** “A confident prediction is not necessarily an accurate diagnosis. Screening only works if its accuracy is understood.” *(slide 2)*
3. **Shamsa:** “Our Diagnostic Duel lets you read a synthetic retinal case, lock your interpretation, and only then see the authored reference. No AI model is involved.” *(slide 6 — 30 s of demo)*
4. **Shamsa:** “The Accuracy Laboratory computes sensitivity, specificity and confidence intervals, and refuses leaky data. No research model has been evaluated: it shows how a claim should be tested.” *(slide 8)*
5. **Fatima:** “Every decision stays human, every limit is stated, and the prototype is not clinically approved.” *(slide 10)*
6. **Fatima:** “The next step is not deployment. It is rigorous validation. Intelligence requires evidence. Scan the code to try it. Thank you.” *(slide 12)*

## 5 · Pronunciation and phrasing cheat-sheet
ICDR *“eye-see-dee-ar”* (International Clinical Diabetic Retinopathy scale) · ETDRS *“ee-tee-dee-ar-ess”* · NPDR *“non-proliferative D-R”* · fundus *“FUN-dus”* · macula *“MAK-yoo-la”* · Wilson interval *“Wilson confidence interval”* · AUC *“area under the curve”* · PPV/NPV *“positive / negative predictive value”* · IDF *“International Diabetes Federation”*.
`;
writeFileSync(resolve(root, 'presentation/script/SPEAKER_SCRIPT.md'), md);
console.log(`SPEAKER_SCRIPT.md written · ${allWords} words · may ${tot('may')} / shamsa ${tot('shamsa')} / fatima ${tot('fatima')}`);
