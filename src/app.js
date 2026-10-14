'use strict';
const settings=JSON.parse(document.getElementById('page-data').textContent);
const t=settings.copy;
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
const menu=$('.menu-toggle'),nav=$('#navigation');
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open')){menu.click();menu.focus()}});
const progress=$('.scroll-progress');let scrollScheduled=false;
addEventListener('scroll',()=>{if(scrollScheduled)return;scrollScheduled=true;requestAnimationFrame(()=>{const distance=document.documentElement.scrollHeight-innerHeight;progress.style.width=`${distance>0?scrollY/distance*100:0}%`;scrollScheduled=false})},{passive:true});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
if('IntersectionObserver' in window&&!reduced.matches){document.documentElement.classList.add('js-observe');const observer=new IntersectionObserver(entries=>entries.forEach(x=>{if(x.isIntersecting){x.target.classList.remove('pending');observer.unobserve(x.target)}}),{threshold:0.06});$$('.reveal-on-scroll').forEach(x=>{x.classList.add('pending');observer.observe(x)});}
// Intro is progressive enhancement: content is always present and never waits for it.
const intro=$('#intro'),shell=$('#page-shell'),skip=$('#skip-intro');let introTimer,closeTimer,previousFocus;
function endIntro(){clearTimeout(introTimer);intro.classList.add('leaving');shell.inert=false;document.body.style.overflow='';try{sessionStorage.setItem('ams-intro-seen','1')}catch{}clearTimeout(closeTimer);closeTimer=setTimeout(()=>{intro.hidden=true;intro.classList.remove('running','leaving');(previousFocus&&previousFocus!==document.body?previousFocus:$('#main')).focus({preventScroll:true})},reduced.matches?0:450)}
function playIntro(force=false){if(reduced.matches)return;let seen=false;try{seen=sessionStorage.getItem('ams-intro-seen')==='1'}catch{}if(!force&&(seen||document.body.dataset.page!=='home'))return;clearTimeout(closeTimer);clearTimeout(introTimer);previousFocus=document.activeElement;intro.hidden=false;intro.classList.remove('running','leaving');shell.inert=true;document.body.style.overflow='hidden';skip.focus({preventScroll:true});requestAnimationFrame(()=>requestAnimationFrame(()=>intro.classList.add('running')));introTimer=setTimeout(endIntro,3200)}
skip?.addEventListener('click',endIntro);intro?.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();endIntro()}if(e.key==='Tab'){e.preventDefault();skip.focus()}});$$('.replay-intro').forEach(b=>{if(reduced.matches)b.hidden=true;else b.addEventListener('click',()=>playIntro(true))});
function animateHero(){if(!reduced.matches)$('.hero-art')?.classList.add('hero-awake')}
const introImage=$('.intro-car');if(introImage?.complete&&introImage.naturalWidth)animateHero();else introImage?.addEventListener('load',animateHero,{once:true});
for(const form of $$('form.vehicle-form,form.contact-form')){
 form.noValidate=true;
 const steps=$$('[data-step]',form),review=$('.review',form.parentElement),summary=$('.summary-list',review),fileInput=$('input[type=file]',form),photoError=$('#photo-error',form);let current=0,photos=[],urls=[],sending=false,processing=false;
 const date=$('input[name=date]',form);if(date){const now=new Date();date.value=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10)}
 function valid(container){if(processing)return false;for(const el of $$('input,select,textarea',container)){if(el.type==='file')continue;if(el.required&&['text','tel','textarea'].includes(el.type)){el.setCustomValidity(el.value.trim()?'':t.choose);el.addEventListener('input',()=>el.setCustomValidity(''),{once:true})}if(!el.checkValidity()){el.reportValidity();el.focus();return false}}return true;}
 function step(n,focus=true){current=Math.min(steps.length-1,Math.max(0,n));steps.forEach((f,i)=>f.hidden=i!==current);$$('.steps li',form).forEach((li,i)=>{li.classList.toggle('active',i===current);li.classList.toggle('done',i<current);if(i===current)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current')});if(focus)$('legend',steps[current]).focus({preventScroll:true});}
 $$('[data-next]',form).forEach(b=>b.addEventListener('click',()=>{if(valid(steps[current]))step(current+1)}));$$('[data-back]',form).forEach(b=>b.addEventListener('click',()=>step(current-1)));
 function renderPhotos(){urls.forEach(URL.revokeObjectURL);urls=[];const root=$('.photos',form);root.replaceChildren();photos.forEach((file,i)=>{const item=document.createElement('div');item.className='photo-thumb';const img=document.createElement('img');const url=URL.createObjectURL(file);urls.push(url);img.src=url;img.alt=file.name;const name=document.createElement('span');name.textContent=file.name;const remove=document.createElement('button');remove.type='button';remove.textContent=t.remove;remove.setAttribute('aria-label',`${t.remove}: ${file.name}`);remove.addEventListener('click',()=>{photos.splice(i,1);renderPhotos()});item.append(img,name,remove);root.append(item)})}
 async function preparePhoto(file){
  const url=URL.createObjectURL(file);const img=new Image();
  try{img.src=url;await img.decode();if(!img.naturalWidth||!img.naturalHeight)throw Error('image');
   const canvas=document.createElement('canvas');const scale=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight));
   canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
   const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
   let blob;for(let attempt=0;attempt<8;attempt++){
    blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.8));if(!blob)throw Error('encode');
    if(blob.size<=190*1024)break;
    const smaller=document.createElement('canvas');smaller.width=Math.max(1,Math.round(canvas.width*.8));smaller.height=Math.max(1,Math.round(canvas.height*.8));smaller.getContext('2d').drawImage(canvas,0,0,smaller.width,smaller.height);canvas.width=smaller.width;canvas.height=smaller.height;ctx.drawImage(smaller,0,0);
   }
   if(blob.size>190*1024)throw Error('size');
   return new File([blob],file.name.replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg'});
  }finally{URL.revokeObjectURL(url)}
 }
 fileInput?.addEventListener('change',async()=>{
  const incoming=[...fileInput.files];fileInput.value='';if(!incoming.length)return;
  photoError.textContent='';
  if(photos.length+incoming.length>15||incoming.some(f=>f.size>20*1024*1024||!['image/jpeg','image/png','image/webp'].includes(f.type))){photoError.textContent=t.photoError;return}
  processing=true;fileInput.disabled=true;const status=$('.photo-status',form);status.textContent=t.photoProcessing;
  const buttons=$$('button',form);buttons.forEach(b=>b.disabled=true);
  try{const prepared=[];for(const file of incoming)prepared.push(await preparePhoto(file));photos.push(...prepared);renderPhotos();status.textContent=`${photos.length} ${t.fileCount}`}
  catch{photoError.textContent=t.photoError;status.textContent=''}
  finally{processing=false;fileInput.disabled=false;buttons.forEach(b=>b.disabled=false)}
 });

 function data(){const d=new FormData(form);d.delete('photos');photos.forEach(f=>d.append('photos',f));d.set('kind',form.dataset.kind);d.set('locale',form.dataset.locale);return d;}
 form.addEventListener('submit',e=>{e.preventDefault();if(steps.length&&current<steps.length-1){if(valid(steps[current]))step(current+1);return}if(steps.length){for(let i=0;i<steps.length;i++){const invalid=$$('input,select,textarea',steps[i]).find(x=>x.type!=='file'&&!x.checkValidity());if(invalid){step(i);invalid.reportValidity();return}}}if(!valid(steps.length?steps[current]:form))return;summary.replaceChildren();const d=data();for(const [key,label]of Object.entries(settings.fields)){const values=d.getAll(key).filter(v=>typeof v==='string'&&v.trim());if(!values.length)continue;const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=values.join(', ');div.append(dt,dd);summary.append(div)}if(photos.length){const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=t.photos;dd.textContent=`${photos.length} ${t.fileCount}`;div.append(dt,dd);summary.append(div)}form.hidden=true;review.hidden=false;review.focus({preventScroll:true});});
 $('[data-edit]',review)?.addEventListener('click',()=>{review.hidden=true;form.hidden=false;if(steps.length)step(current);else $('input',form).focus()});
 $('[data-send]',review)?.addEventListener('click',async e=>{if(sending||settings.demo)return;sending=true;e.currentTarget.disabled=true;const status=$('.status',review);status.className='status';status.textContent='…';try{const response=await fetch('/api/inquiry',{method:'POST',body:data(),signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('delivery');const result=await response.json();if(result.ok!==true)throw Error('delivery');status.textContent=t.success;$$('button',review).forEach(b=>b.disabled=true);form.reset();photos=[];urls.forEach(URL.revokeObjectURL)}catch{status.textContent=t.error;status.className='status error';e.currentTarget.disabled=false}finally{sending=false}});
}
