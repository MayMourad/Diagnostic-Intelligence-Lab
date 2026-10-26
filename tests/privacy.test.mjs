import test from 'node:test';
import assert from 'node:assert/strict';
import { scanIdentifiers } from '../js/lib/privacy.js';

test('flags e-mail, Emirates ID, phone numbers, long numbers, DOB and MRN patterns', () => {
  assert.equal(scanIdentifiers('contact jane.doe@example.com').at(0).kind, 'email');
  assert.ok(scanIdentifiers('EID 784-1990-1234567-1').some((f) => f.kind === 'emirates-id'));
  assert.ok(scanIdentifiers('call +971 50 123 4567 today').some((f) => f.kind === 'phone'));
  assert.ok(scanIdentifiers('ref 1234567890').some((f) => f.kind === 'long-number'));
  assert.ok(scanIdentifiers('DOB: 12/03/1980').some((f) => f.kind === 'date-of-birth'));
  assert.ok(scanIdentifiers('MRN: AB-12345').some((f) => f.kind === 'mrn'));
});
test('clinical prose and short numbers are not flagged', () => {
  assert.deepEqual(scanIdentifiers('Moderate NPDR, 6 microaneurysms, 2 blot haemorrhages within 3 DD; rescreen in 12 months.'), []);
  assert.deepEqual(scanIdentifiers(''), []);
});
