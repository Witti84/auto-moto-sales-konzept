import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {languages,slugs,copy} from '../src/content.mjs';
import handler from '../api/inquiry.mjs';
let pages=0,links=0;
for(const lang of languages)for(const [key,slug]of Object.entries(slugs[lang])){
 const pathname=`/${lang}/${slug}${slug?'/':''}`;
 const file=path.join('dist',pathname,'index.html');const html=fs.readFileSync(file,'utf8');
 assert(html.includes(`<html lang="${lang}-CH">`),file+' language');
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1,file+' H1');
 assert(!html.includes('undefined')&&!html.includes('[object Object]'),file+' unresolved content');
 assert(html.includes('name="description"'),file+' description');
 assert(html.includes('rel="canonical"'),file+' canonical');
 assert(html.includes('name="robots" content="noindex,nofollow"'),file+' draft indexing');
 for(const l of languages)assert(html.includes(`hreflang="${l}-CH"`),file+' hreflang '+l);
 for(const match of html.matchAll(/<script[^>]*type="application\/(?:ld\+json|json)"[^>]*>([\s\S]*?)<\/script>/g))JSON.parse(match[1]);
  const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
 const faq=graph.find(x=>x['@type']==='FAQPage');
 if(['home','direct','broker','faq'].includes(key)){
  assert(faq,file+' FAQ schema');
  const expected=copy[lang].faqs.slice(0,key==='faq'?copy[lang].faqs.length:3);
  assert.equal(faq.mainEntity.length,expected.length,file+' FAQ count');
  for(const [i,[q,a]] of expected.entries()){
   assert(html.includes(`<summary>${q}</summary><p>${a}</p>`),file+' visible FAQ');
   assert.equal(faq.mainEntity[i].name,q);assert.equal(faq.mainEntity[i].acceptedAnswer.text,a);
  }
 }
 const breadcrumb=graph.find(x=>x['@type']==='BreadcrumbList');
 if(/^(auto|moto)/.test(key)){
  assert.equal(breadcrumb.itemListElement.length,3,file+' service hierarchy');
  assert(html.includes('class="wrap service-context"'),file+' service content');
  assert(graph.some(x=>x['@type']==='Service'),file+' service schema');
 }
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,file+' duplicate ids');
 for(const match of html.matchAll(/(?:href|src)="(\/[^"#]*)(?:#[^"]*)?"/g)){
  const target=match[1];if(target.startsWith('/api/'))continue;
  let f=path.join('dist',target);if(target.endsWith('/'))f=path.join(f,'index.html');assert(fs.existsSync(f),file+' missing '+target);links++;
 }
 if(/^(auto|moto)/.test(key)){assert.equal((html.match(/<fieldset data-step=/g)||[]).length,3);assert(html.includes('accept="image/jpeg,image/png,image/webp"'));assert(html.includes('name="signature"'));assert(html.includes('name="consent"'));assert(html.includes('class="review" hidden'));}
 if(key==='contact')assert(html.includes('name="message"'));
 pages++;
}
assert.equal(pages,40);
assert(fs.readFileSync('dist/robots.txt','utf8').includes('Disallow: /'));
const previous=process.env.FORMS_LIVE;delete process.env.FORMS_LIVE;
assert.equal((await handler.fetch(new Request('https://example.test/api/inquiry',{method:'POST'}))).status,503);
assert.equal((await handler.fetch(new Request('https://example.test/api/inquiry'))).status,405);
if(previous!==undefined)process.env.FORMS_LIVE=previous;
console.log(`PASS: ${pages} language pages, ${links} local asset/link references, metadata, JSON-LD, 16 vehicle forms, 4 contact forms; demo endpoint refuses delivery.`);
