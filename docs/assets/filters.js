const form = document.querySelector('#filters');
const cards = [...document.querySelectorAll('.review-card')];
const count = document.querySelector('#review-count');
const empty = document.querySelector('#empty-state');
const query = new URLSearchParams(location.search);
for (const name of ['brand','price','use','q']) {
  const control = form.elements.namedItem(name);
  const value = query.get(name);
  if (value !== null && (control.tagName !== 'SELECT' || [...control.options].some(o=>o.value===value))) control.value = value;
}
function filter(updateUrl = true) {
  const values = Object.fromEntries(new FormData(form));
  const [min,max] = values.price ? values.price.split('-').map(Number) : [0,Infinity];
  const words = values.q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  let visible = 0;
  for (const card of cards) {
    const price = Number(card.dataset.price);
    const matches = (!values.brand || card.dataset.brand === values.brand) && (!values.use || card.dataset.use === values.use) && price >= min && price < max && words.every(word=>card.dataset.search.includes(word));
    card.hidden = !matches;
    if (matches) visible++;
  }
  count.textContent = `${visible} REVIEW${visible===1?'':'S'} IN THE GARAGE`;
  empty.hidden = visible > 0;
  if (updateUrl) {
    const url = new URL(location.href);
    for (const name of ['brand','price','use','q']) {
      if (values[name]) url.searchParams.set(name,values[name]); else url.searchParams.delete(name);
    }
    history.replaceState(null,'',url);
  }
}
form.addEventListener('input',()=>filter());
form.addEventListener('change',()=>filter());
form.addEventListener('submit',event=>event.preventDefault());
form.addEventListener('reset',()=>queueMicrotask(()=>filter()));
document.querySelector('#reset-empty').addEventListener('click',()=>form.reset());
window.addEventListener('popstate',()=>location.reload());
filter(false);
