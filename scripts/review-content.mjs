// Inspect core article prose only; shared disclosures and navigation are expected.
export function repeatedReviewSentences(reviews) {
 const seen=new Map();
 for(const review of reviews){
  const inReview=new Set();
  for(const paragraph of review.sections.flatMap(section=>section.paragraphs)){
   for(const sentence of paragraph.split(/(?<=[.!?])\s+/u)){
    const normalized=sentence.toLowerCase().replace(/[‘’]/g,"'").replace(/\s+/g,' ').trim();
    if((normalized.match(/[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*/gu)??[]).length<20||inReview.has(normalized))continue;
    inReview.add(normalized);
    const entries=seen.get(normalized)??[];
    entries.push(`${review.brandSlug}/${review.modelSlug}`);
    seen.set(normalized,entries);
   }
  }
 }
 return [...seen].filter(([,reviews])=>reviews.length>1).map(([sentence,reviews])=>({sentence,reviews}));
}
