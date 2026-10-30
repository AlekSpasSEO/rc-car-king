import assert from 'node:assert/strict';
import test from 'node:test';
import {repeatedReviewSentences} from './review-content.mjs';

const shared='The complete package still needs a compatible battery and charger, so compare the equipment you already own before choosing this vehicle.';
const review=(modelSlug,paragraphs)=>({brandSlug:'example',modelSlug,sections:[{paragraphs}]});

test('detects shared filler even when model-specific paragraph leads differ',()=>{
 const result=repeatedReviewSentences([
  review('buggy',[`This buggy has rear-wheel drive. ${shared}`]),
  review('crawler',[`This crawler has portal axles. ${shared.replace('package','PACKAGE')}`])
 ]);
 assert.equal(result.length,1);
 assert.deepEqual(result[0].reviews,['example/buggy','example/crawler']);
});

test('permits short common phrases and repetition within one review',()=>{
 assert.deepEqual(repeatedReviewSentences([
  review('buggy',[shared,shared,'Follow the supplied manual.']),
  review('crawler',['Follow the supplied manual. A different model needs its own equipment analysis.'])
 ]),[]);
});
