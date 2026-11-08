/* Sharing is user initiated; no analytics, tracking parameters or automatic messages. */
(()=>{
 const box=document.querySelector('.ba-share');if(!box)return;
 const canonical=document.querySelector('link[rel="canonical"]')?.href;if(!canonical)return;
 const status=box.querySelector('[data-ba-share-status]'),copy=box.querySelector('[data-ba-copy]'),share=box.querySelector('[data-ba-share]');
 function fallback(){const label=box.querySelector('[data-ba-link-label]');label.hidden=false;const input=label.querySelector('input');input.value=canonical;input.focus();input.select();status.textContent='Select and copy the page link below.';}
 copy.addEventListener('click',async()=>{copy.disabled=true;try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(canonical);status.textContent='Link copied.';}catch{fallback();}finally{copy.disabled=false;}});
 if(typeof navigator.share==='function'){share.hidden=false;share.addEventListener('click',async()=>{try{await navigator.share({title:document.title,url:canonical});status.textContent='Share options opened.';}catch(error){if(error.name==='AbortError')status.textContent='Sharing cancelled.';else fallback();}});}
})();
