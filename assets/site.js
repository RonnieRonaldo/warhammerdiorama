const production = ['warhammerdiorama.com','www.warhammerdiorama.com'].includes(location.hostname);
const consent = document.querySelector('#consent');
const key = 'statistik-einwilligung';
const id = 'G-Y2P58QHJ71';
let choice;
try { choice = localStorage.getItem(key); } catch {}
let started=false;
function enableAnalytics(){
  if(!production || started) return;
  started=true;
  window.dataLayer=window.dataLayer || [];
  function gtag(){window.dataLayer.push(arguments);}
  gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  gtag('js',new Date());
  gtag('config',id,{allow_google_signals:false,allow_ad_personalization_signals:false});
  const script=document.createElement('script');
  script.async=true;
  script.src='https://www.googletagmanager.com/gtag/js?id='+id;
  document.head.append(script);
}
if(choice==='yes') enableAnalytics();
if(production && !choice) consent.showModal();
document.querySelector('[data-consent-open]').onclick=()=>consent.showModal();
consent.querySelectorAll('[data-choice]').forEach(button=>button.onclick=()=>{
  choice=button.dataset.choice;
  try {localStorage.setItem(key,choice);} catch {}
  window['ga-disable-'+id]=choice!=='yes';
  if(choice==='yes') enableAnalytics();
  consent.close();
  if(started && choice==='no') location.reload();
});
const embers=document.createElement('div');
embers.className='embers';
embers.setAttribute('aria-hidden','true');
for(let i=0;i<14;i++){
  const spark=document.createElement('i');
  spark.style.cssText='--x:'+(i%4===0?2+i%4:82+(i*7)%17)+'%;--y:'+((i*19)%92)+'%;--t:'+(5+i%4)+'s;--d:-'+(i*.83)+'s';
  embers.append(spark);
}
document.body.append(embers);
const form=document.querySelector('#contact');
if(form){
  if(new URLSearchParams(location.search).get('thema')==='download') form.elements.thema.value='Hilfe beim Download';
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const button=form.querySelector('button');
    const status=document.querySelector('#feedback');
    button.disabled=true;status.textContent='Nachricht wird gesendet …';
    try {
      const response=await fetch(form.action,{method:'POST',body:new FormData(form),headers:{Accept:'application/json'}});
      const result=await response.json();
      if(!response.ok || !result.success) throw Error();
      form.reset();status.textContent='Danke! Deine Nachricht wurde versendet.';
    }catch{status.textContent='Die Nachricht konnte nicht versendet werden. Bitte versuche es erneut.';}
    finally{button.disabled=false;}
  });
}
if('IntersectionObserver' in window){
  document.documentElement.classList.add('js');
  const main=document.querySelector('main');
  const lower=document.querySelector('.zone');
  const observer=new IntersectionObserver(entries=>{
    if(entries.some(entry=>entry.isIntersecting)){
      main.classList.add('below');observer.disconnect();
    }
  },{rootMargin:'160px'});
  observer.observe(lower);
}
