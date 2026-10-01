const state={events:[],flash:[],impact:[],latest:[],moving:[],sections:[],categories:[],future:[],market:{},home:{},topic:'Top',revision:0,depth:14,initialized:false,refreshInFlight:false,searchMode:false,query:'',searchTimer:null,suggestTimer:null,searchAbort:null,suggestAbort:null,searchSeq:0,suggestSeq:0,tickerTimer:null,stackIndex:0,stackTimer:null,session:localStorage.getItem('aetheria-session')||(crypto.randomUUID?crypto.randomUUID():String(Date.now())),scrollY:0,lastVisit:Number(localStorage.getItem('aetheria-last-visit')||0),composing:false,intelligenceStatus:null};
localStorage.setItem('aetheria-session',state.session);try{history.scrollRestoration='manual'}catch{}
window.addEventListener('pagehide',()=>{try{localStorage.setItem('aetheria-last-visit',String(Date.now()/1000))}catch{}});
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),num=v=>Number.isFinite(Number(v))?Number(v):0;
const validUrl=u=>{try{if(typeof u!=='string'||!/^https?:\/\//i.test(u.trim()))return false;const x=new URL(u.trim());return ['http:','https:'].includes(x.protocol)&&!!x.hostname}catch{return false}};
function dateOf(ts){const n=num(ts);return n?new Date(n*1000):null}
function age(ts){const d=dateOf(ts);if(!d)return'—';const m=Math.max(0,Math.floor((Date.now()-d.getTime())/60000));if(m<1)return'now';if(m<60)return`${m}m`;if(m<1440)return`${Math.floor(m/60)}h`;return`${Math.floor(m/1440)}d`}
function exactTime(ts){const d=dateOf(ts);return d?`${d.toLocaleDateString([],{day:'2-digit',month:'short',year:'numeric'})} · ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`:'Publication time unavailable'}
function futureTime(ts,known=true){const d=dateOf(ts);if(!d)return'Date unavailable';const date=d.toLocaleDateString([],{day:'2-digit',month:'short',year:'numeric'});return known?`${date} · ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`:date}
function pct(v){return Math.max(0,Math.min(100,Math.round(num(v)*100)))}
function sourceLine(e){return(e?.source_domains||[]).slice(0,2).join(' · ')||e?.domain||'Independent source'}
function articleAnchor(e,label=null,cls='headline-link'){const text=label===null?(e?.title||''):label;return validUrl(e?.url)?`<a class="${cls}" href="${esc(e.url)}" target="_blank" rel="noopener noreferrer" data-open="${esc(e.id||'')}">${esc(text)}</a>`:esc(text)}
function originalLink(e,label='↗'){return validUrl(e?.url)?`<a class="original-link" href="${esc(e.url)}" target="_blank" rel="noopener noreferrer" data-open="${esc(e.id||'')}">${esc(label)}</a>`:''}
function imageBlock(e,cls='story-image',loading='lazy'){
  if(validUrl(e?.image_url))return`<div class="${cls}"><img src="${esc(e.image_url)}" alt="" loading="${loading}" decoding="async" fetchpriority="${loading==='eager'?'high':'low'}" referrerpolicy="no-referrer" onerror="const p=this.closest('.news-row');if(p){p.classList.add('no-image');this.parentElement.remove()}else{this.parentElement.classList.add('fallback')}"></div>`;
  if(cls==='stack-media')return`<div class="${cls} stack-fallback"><div class="media-accent-box"><span class="fallback-brand">AETHERIA</span><span class="fallback-topic">${esc(e?.topic||'WORLD')}</span><span class="fallback-status">${esc(e?.status||'LIVE')}</span></div></div>`;
  return '';
}
function preconnectImages(items){const origins=new Set();(items||[]).forEach(e=>{if(!validUrl(e?.image_url))return;try{origins.add(new URL(e.image_url).origin)}catch{}});origins.forEach(origin=>{if(document.head.querySelector(`link[data-aetheria-origin="${CSS.escape(origin)}"]`))return;const l=document.createElement('link');l.rel='preconnect';l.href=origin;l.dataset.aetheriaOrigin=origin;document.head.appendChild(l)})}
function preloadImages(items){preconnectImages(items);(items||[]).slice(0,4).forEach(e=>{if(validUrl(e?.image_url)){const im=new Image();im.decoding='async';im.fetchPriority='low';im.src=e.image_url}})}
function telemetry(eventId,action,value=1){if(!eventId)return;fetch('/api/telemetry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event_id:eventId,action,value,session:state.session}),keepalive:true}).catch(()=>{})}
function persistUi(){try{sessionStorage.setItem('aetheria-ui',JSON.stringify({topic:state.topic,depth:state.depth,scrollY:Math.round(window.scrollY),stackIndex:state.stackIndex}))}catch{}}
function readingStore(){try{return JSON.parse(localStorage.getItem('aetheria-reading-memory')||'{}')}catch{return{}}}
function saveReading(eid,lastSeen,title){try{const m=readingStore();m[eid]={lastSeen:num(lastSeen),title:String(title||'').slice(0,220),readAt:Date.now()};const keys=Object.keys(m).sort((a,b)=>(m[b].readAt||0)-(m[a].readAt||0)).slice(0,300);const keep={};keys.forEach(k=>keep[k]=m[k]);localStorage.setItem('aetheria-reading-memory',JSON.stringify(keep))}catch{}}
function renderReadingMemory(e){const box=$('readingMemory');if(!box)return;const m=readingStore()[e?.id];if(!m){box.hidden=true;box.innerHTML='';return}const changed=num(e?.last_seen)>num(m.lastSeen);box.hidden=false;box.innerHTML=`<span>READING MEMORY</span><b>You read this ${new Date(m.readAt).toLocaleDateString([], {day:'numeric',month:'short'})}.</b>${changed?`<p>${age(e.last_seen)} since then · the living story has new activity.</p>`:`<p>This story has not changed since your last read.</p>`}`;}
function restoreUi(){try{const x=JSON.parse(sessionStorage.getItem('aetheria-ui')||'null');if(!x)return;if(typeof x.topic==='string')state.topic=x.topic;if([5,14,30].includes(Number(x.depth)))state.depth=Number(x.depth);if(Number.isFinite(Number(x.stackIndex)))state.stackIndex=Math.max(0,Number(x.stackIndex));state.scrollY=Number(x.scrollY)||0}catch{}}
function cacheBootstrap(d){try{sessionStorage.setItem('aetheria-bootstrap',JSON.stringify({version:d.version,revision:d.revision,latest:(d.latest||[]).slice(0,800),events:(d.events||[]).slice(0,1200),flash:(d.flash||[]).slice(0,12),impact:(d.impact||[]).slice(0,25),moving:(d.moving||[]).slice(0,18),sections:d.sections||[],categories:d.categories||[],future:d.future||[],market:d.market||{},home:d.home||{},state:d.state||{},cached_at:Date.now()}))}catch{}}
function hydrateCached(){try{const d=JSON.parse(sessionStorage.getItem('aetheria-bootstrap')||'null');if(!d||!Array.isArray(d.latest)||!d.latest.length)return false;Object.assign(state,{revision:num(d.revision),events:d.events||[],flash:d.flash||[],impact:d.impact||[],latest:d.latest||[],moving:d.moving||[],sections:d.sections||[],future:d.future||[],market:d.market||{},home:d.home||{},categories:d.categories||[],serverState:d.state||{},initialized:true});$('liveLabel').textContent='UPDATING';$('liveDot').className='live-check';render();return true}catch{return false}}
function renderCategories(){
  const preferred=['India','World','Markets','Business','Technology','Legal','Geopolitics','Sports','Entertainment','Local'];
  const map=new Map((state.categories||[]).map(c=>[c.id,c]));
  const all=[{id:'Top',label:'Top',count:0},...preferred.map(id=>map.get(id)).filter(Boolean),(state.categories||[]).filter(c=>!preferred.includes(c.id)&&!['Top'].includes(c.id)).slice(0,6)];
  const container=$('topics');
  if(!container)return;
  const existingBtns=container.querySelectorAll('.topic-btn');
  const existingTopics=Array.from(existingBtns).map(b=>b.dataset.topic);
  const newTopics=all.map(c=>c.id);
  if(existingBtns.length===all.length&&existingTopics.every((t,i)=>t===newTopics[i])){
    existingBtns.forEach(b=>{
      const isActive=state.topic===b.dataset.topic&&!state.searchMode;
      b.classList.toggle('active',isActive);
    });
    return;
  }
  container.innerHTML=all.map(c=>`<button class="topic-btn ${state.topic===c.id&&!state.searchMode?'active':''}" data-topic="${esc(c.id)}"><span>${esc(c.label)}</span>${num(c.count)?`<small>${num(c.count).toLocaleString()}</small>`:''}</button>`).join('');
  container.querySelectorAll('.topic-btn').forEach(b=>{
    b.onclick=()=>{
      if(state.topic===b.dataset.topic&&!state.searchMode)return;
      state.topic=b.dataset.topic;
      state.searchMode=false;
      state.query='';
      $('search').value='';
      $('clearSearch').classList.remove('show');
      hideSuggestions();
      state.depth=14;
      state.stackIndex=0;
      persistUi();
      container.querySelectorAll('.topic-btn').forEach(x=>x.classList.toggle('active',x===b));
      try{b.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'})}catch{}
      const hv=$('homeView');
      if(hv){
        hv.classList.remove('view-transition');
        void hv.offsetWidth;
        hv.classList.add('view-transition');
      }
      render();
      const catBar=$('categoryBar');
      if(catBar&&window.scrollY>catBar.offsetTop+40){
        window.scrollTo({top:catBar.offsetTop,behavior:'smooth'});
      }
    };
  });
  renderCategoriesDrawer();
}
function renderCategoriesDrawer(){
  const grid=$('categoriesGrid');if(!grid)return;
  const cats=state.categories||[];
  const filter=String($('categoriesFilter')?.value||'').trim().toLowerCase();
  const filtered=filter?cats.filter(c=>(c.label||'').toLowerCase().includes(filter)||(c.id||'').toLowerCase().includes(filter)):cats;
  grid.innerHTML=filtered.map(c=>`
    <button class="cat-drawer-item ${state.topic===c.id&&!state.searchMode?'active':''}" data-cat="${esc(c.id)}">
      <span>${esc(c.label)}</span>
      <span class="cat-drawer-count">${num(c.count).toLocaleString()}</span>
    </button>
  `).join('');
  grid.querySelectorAll('.cat-drawer-item').forEach(b=>{
    b.onclick=()=>{
      state.topic=b.dataset.cat;
      state.searchMode=false;
      state.query='';
      $('search').value='';
      $('clearSearch').classList.remove('show');
      toggleCategories(false);
      state.depth=14;
      state.stackIndex=0;
      persistUi();
      render();
      window.scrollTo({top:0,behavior:'smooth'});
    };
  });
}
function toggleCategories(open){
  const d=$('categoriesDrawer');if(!d)return;
  d.classList.toggle('open',open);
  d.setAttribute('aria-hidden',open?'false':'true');
  if(open){
    renderCategoriesDrawer();
    setTimeout(()=>{$('categoriesFilter')?.focus()},100);
  }
}
function isFresh(e){const t=num(e?.last_seen||e?.published);if(!t)return true;return(Date.now()/1000-t)<=1209600}
function topicFilter(e){if(!isFresh(e))return false;return state.topic==='Top'||state.topic==='All'||e.topic===state.topic}
function trustChip(e){const s=String(e?.status||'DEVELOPING').toUpperCase();const label=s==='CONFIRMED'?'CORROBORATED':s;return`<span class="truth truth-${s.toLowerCase()}">${esc(label)}</span>`}
function stackItems(){let items=(state.home?.stack||[]).filter(topicFilter);if(!items.length)items=(state.latest||[]).filter(topicFilter).slice(0,10);return items.slice(0,10)}
function impactLabel(v){const p=pct(v);if(p>=70)return'HIGH';if(p>=40)return'ELEVATED';if(p>=20)return'MODERATE';return'LOW'}
function evidenceLabel(v){const p=pct(v);if(p>=75)return'Strong';if(p>=50)return'Moderate';if(p>=30)return'Mixed';return'Low'}
function stackCard(e,pos,originalIndex){
  const conf=pct(e?.intelligence?.confidence),impact=pct(e?.intelligence?.impact);
  const active=pos===0;
  const layer=Math.min(pos,9);
  const isDisputed = e?.status === 'DISPUTED' || (e?.conflicts||[]).length > 0;
  const srcCount=num(e.sources)||1;
  const offCount=num(e.source_tiers?.official)||0;
  const whyParts=(e.why_matters||e.india_lens_reasons||e.life_impact||[]).slice(0,2).filter(Boolean);
  const whyText=whyParts.join(' · ')||'';
  const evidenceLine=[
    `${srcCount} report${srcCount===1?'':'s'}`,
    offCount?`${offCount} official`:'',
    `${evidenceLabel(e?.intelligence?.confidence)} evidence`,
    e.status?String(e.status).charAt(0)+String(e.status).slice(1).toLowerCase():''
  ].filter(Boolean).join(' · ');
  const impLine=impact>=20?`Impact: ${impactLabel(e?.intelligence?.impact)}`:''
  const contextLabel=isDisputed?'CONTEXT & DISPUTE':(e.india_lens_reasons?.length?'INDIA LENS':'AETHERIA READ');
  const contextText=isDisputed
    ?'Source reports contain conflicting claims. Read with caution.'
    :(e.life_impact||e.why_matters||e.india_lens_reasons||[]).slice(0,2).join(' · ')||'Observed story activity across the source set.';
  return`<article class="stack-card ${active?'active':''}" data-stack="${originalIndex}" style="--pos:${layer};--z:${100-layer};--opacity:${active?1:Math.max(.24,1-layer*.08)}"><div class="stack-copy"><div class="stack-kicker"><span class="status-dot"></span>${trustChip(e)}<em>${esc(e.topic||'WORLD')}</em><time>${age(e.last_seen||e.published)}</time></div><h2>${articleAnchor(e)}</h2>${e.description?`<p class="lead-summary">${esc(e.description)}</p>`:''}<p class="stack-evidence-text">${esc(evidenceLine)}${impLine?` · ${impLine}`:''}</p>${whyText?`<div class="stack-why"><span>Why it matters</span><span>${esc(whyText)}</span></div>`:''}<div class="stack-ai"><b>${contextLabel}</b><span>${esc(contextText)}</span></div><div class="lead-actions">${validUrl(e?.url)?`<a class="read-btn" href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">Read original ↗</a>`:`<span class="read-btn disabled">Original unavailable</span>`}<span class="source-chip">${esc(sourceLine(e))}${srcCount>1?` · ${srcCount} sources`:''}</span></div></div>${imageBlock(e,'stack-media',active?'eager':'lazy')} </article>`;
}
function formatMarket(v,symbol){const n=num(v);if(!n)return'—';if(['USD/INR','EUR/INR','GBP/INR','AED/INR'].includes(String(symbol||'')))return n.toFixed(2);if(String(symbol||'').startsWith('JPY/INR'))return n.toFixed(4);return n.toLocaleString(undefined,{maximumFractionDigits:2})}
function renderMarket(){
  const tapeEl=$("marketGroups");
  const deskContainer=$("marketDeskContainer");
  const deskZone=$("marketDeskZone");
  const mSec=$("marketSection");
  const groups=state.market?.groups||[];

  const isTop=state.topic==='Top'||state.topic==='All';
  const isMarketTab=state.topic==='Markets';

  const obsLabel=$("marketObservedLabel");
  if(obsLabel&&state.market?.at){
    const a=age(state.market.at);
    obsLabel.textContent=a==='now'||a==='—'?'LIVE':`LIVE · ${a}`;
  }

  // 1. Home / Top view: compact single-row ribbon ticker
  if(isTop){
    if(deskZone) deskZone.hidden=true;
    if(mSec) mSec.hidden=false;

    const fullBtn=$('marketFullLink');
    if(fullBtn){
      fullBtn.style.display='inline-flex';
      fullBtn.onclick=()=>{
        state.topic='Markets';
        state.searchMode=false;
        state.depth=14;
        state.stackIndex=0;
        persistUi();
        render();
        window.scrollTo({top:0,behavior:'smooth'});
      };
    }

    if(tapeEl){
      if(!groups.length){
        tapeEl.innerHTML='<div class="empty-state">Market data is syncing…</div>';
      } else {
        const allItems=[];
        groups.forEach(g=>(g.items||[]).forEach(it=>allItems.push(it)));
        const prioritySymbols=['NIFTY 50','SENSEX','USD/INR','BRENT CRUDE','GOLD','SILVER','S&P 500','NASDAQ'];
        const chosen=[];
        prioritySymbols.forEach(sym=>{
          const match=allItems.find(it=>String(it.symbol||it.label||'').toUpperCase()===sym.toUpperCase()||String(it.label||'').toUpperCase().includes(sym.toUpperCase())||String(it.symbol||'').toUpperCase().includes(sym.toUpperCase()));
          if(match&&!chosen.some(x=>x.symbol===match.symbol))chosen.push(match);
        });
        if(chosen.length<6){
          allItems.forEach(it=>{if(chosen.length<8&&!chosen.some(x=>x.symbol===it.symbol))chosen.push(it);});
        }

        tapeEl.innerHTML=chosen.map(x=>{
          const name=esc(x.label||x.symbol||'Quote');
          if(x.available===false||x.price==null){
            return `<div class="market-tape-item"><span class="tape-name">${name}</span><span class="tape-price">—</span><span class="tape-badge flat">Closed</span></div>`;
          }
          const changeNum = x.change_num != null ? Number(x.change_num) : (x.change != null && x.price != null && x.previous_close ? Number(x.price) - Number(x.previous_close) : (x.change != null && x.price != null ? Number(x.price) * Number(x.change) : null));
          const changePct = x.change != null ? Number(x.change) * 100 : null;
          let changeText = '—';
          let changeClass = 'flat';
          if (changePct != null || changeNum != null) {
            const isUp = (changeNum != null ? changeNum >= 0 : changePct >= 0);
            changeClass = isUp ? 'up' : 'down';
            const numStr = changeNum != null ? `${isUp ? '+' : ''}${changeNum.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '';
            const pctStr = changePct != null ? `${isUp ? '+' : ''}${changePct.toFixed(2)}%` : '';
            if (numStr && pctStr) changeText = `${isUp ? '▲' : '▼'} ${numStr} (${pctStr})`;
            else if (pctStr) changeText = `${isUp ? '▲' : '▼'} ${pctStr}`;
            else if (numStr) changeText = `${isUp ? '▲' : '▼'} ${numStr}`;
          }
          return `<div class="market-tape-item"><span class="tape-name">${name}</span><span class="tape-price">${formatMarket(x.price,x.symbol)}</span><span class="tape-badge ${changeClass}">${changeText}</span></div>`;
        }).join('');
      }
    }
    return;
  }

  // 2. Dedicated Markets Page: Professional Solid Market Desk (NO GLASS, Tabbed, High-Contrast, Mobile-friendly)
  if(isMarketTab && deskContainer){
    if(mSec) mSec.hidden=true;
    if(deskZone) deskZone.hidden=false;

    if(!groups.length){
      deskContainer.innerHTML='<div class="empty-state">Market data is currently syncing.</div>';
      return;
    }

    if(!state.marketTab||!groups.some(g=>g.id===state.marketTab))state.marketTab=groups[0]?.id||'india';
    const tabs=groups.map(g=>`<button class="market-tab-btn ${state.marketTab===g.id?'active':''}" data-tab="${esc(g.id)}">${esc(g.label)}</button>`).join('');
    const activeGroup=groups.find(g=>g.id===state.marketTab)||groups[0];
    const items=(activeGroup?.items||[]).map(x=>{
      const name=esc(x.label||x.symbol||'Quote');
      const curr=esc(x.currency||'');
      if(x.available===false||x.price==null){
        return`<div class="market-card unavailable"><div class="m-card-header"><span class="m-card-name">${name}</span><small class="m-card-curr">${curr}</small></div><div class="m-card-body"><strong class="m-card-price">—</strong><span class="m-card-status">Closed / Syncing</span></div></div>`;
      }
      const changeNum = x.change_num != null ? Number(x.change_num) : (x.change != null && x.price != null && x.previous_close ? Number(x.price) - Number(x.previous_close) : (x.change != null && x.price != null ? Number(x.price) * Number(x.change) : null));
      const changePct = x.change != null ? Number(x.change) * 100 : null;

      let changeText = '—';
      let changeClass = 'flat';
      if (changePct != null || changeNum != null) {
        const isUp = (changeNum != null ? changeNum >= 0 : changePct >= 0);
        changeClass = isUp ? 'up' : 'down';
        const numStr = changeNum != null ? `${isUp ? '+' : ''}${changeNum.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '';
        const pctStr = changePct != null ? `${isUp ? '+' : ''}${changePct.toFixed(2)}%` : '';
        if (numStr && pctStr) changeText = `${isUp ? '▲' : '▼'} ${numStr} (${pctStr})`;
        else if (pctStr) changeText = `${isUp ? '▲' : '▼'} ${pctStr}`;
        else if (numStr) changeText = `${isUp ? '▲' : '▼'} ${numStr}`;
      }
      return`<div class="market-card"><div class="m-card-header"><span class="m-card-name">${name}</span><span class="m-card-curr">${curr}</span></div><div class="m-card-body"><strong class="m-card-price">${formatMarket(x.price,x.symbol)}</strong><span class="m-card-badge ${changeClass}">${changeText}</span></div></div>`;
    }).join('');

    deskContainer.innerHTML=`
      <div class="market-desk-head">
        <div class="desk-title-group">
          <span class="m-desk-dot"></span>
          <h2>MARKET PULSE</h2>
          <span class="m-desk-live">LIVE DESK</span>
        </div>
        <div class="m-desk-meta">${esc(activeGroup?.source||'Real-time quotes')}</div>
      </div>
      <div class="market-tabs">${tabs}</div>
      <div class="market-active-grid">${items}</div>
    `;

    deskContainer.querySelectorAll('.market-tab-btn').forEach(b=>b.onclick=()=>{
      state.marketTab=b.dataset.tab;
      renderMarket();
    });
    return;
  }

  if(mSec) mSec.hidden=true;
  if(deskZone) deskZone.hidden=true;
}

function renderFlash(){const a=[...(state.home?.flash||state.flash||[])].filter(isFresh).sort((x,y)=>num(y.flash_score)-num(x.flash_score)||num(y.last_seen)-num(x.last_seen)).slice(0,4);const rail=$('flashRail');if(!rail)return;rail.hidden=!a.length;rail.style.display=a.length?'grid':'none';if(!a.length)return;$('flashCount').textContent=a.length||'';$('flashList').innerHTML=a.map(e=>`<article class="flash-item" data-event="${esc(e.id)}"><span class="flash-time">${age(e.last_seen||e.published)}</span><strong>${articleAnchor(e)}</strong><span class="flash-topic">${esc(e.topic||'WORLD')}</span>${originalLink(e)}</article>`).join('');wireStoryRows('flashList')}
function renderStack(){const items=stackItems();$('stackCount').textContent=items.length?`${items.length} stories`:'';if(state.stackIndex>=items.length)state.stackIndex=0;const order=items.length?[...items.slice(state.stackIndex),...items.slice(0,state.stackIndex)]:[];$('storyStack').innerHTML=order.map((e,pos)=>stackCard(e,pos,(state.stackIndex+pos)%Math.max(1,items.length))).join('')||'<div class="empty-state">No verified story stack is available.</div>';updateStackControls(items);preloadImages(order.slice(1,3));if(state.stackTimer)clearInterval(state.stackTimer);if(items.length>1)state.stackTimer=setInterval(()=>moveStack(1),9000);const active=items[state.stackIndex];renderStackInsight(active)}
function updateStackControls(items){
  const cur=items.length?state.stackIndex+1:0;
  const tot=items.length;
  $('stackPosition').textContent=tot?`${String(cur).padStart(2,'0')} / ${String(tot).padStart(2,'0')}`:'00 / 00';
  $('stackDots').innerHTML=items.map((_,i)=>`<button aria-label="Story ${i+1}" class="${i===state.stackIndex?'active':''}" data-stack-dot="${i}"></button>`).join('');
  $('stackDots').querySelectorAll('button').forEach(b=>b.onclick=()=>{state.stackIndex=num(b.dataset.stackDot);persistUi();renderStack()});
  $('stackPrev').disabled=items.length<2;
  $('stackNext').disabled=items.length<2;
}
function moveStack(dir){const items=stackItems();if(items.length<2)return;state.stackIndex=(state.stackIndex+dir+items.length)%items.length;persistUi();renderStack();telemetry(items[state.stackIndex].id,'stack')}
function renderStackInsight(e){if(!e){$('stackInsight').innerHTML='';return}const reasons=(e.why_matters||e.india_lens_reasons||[]).slice(0,3);$('stackInsight').innerHTML=`<span>${e.status==='CONFIRMED'?'CORROBORATED BY SOURCES':e.status==='DISPUTED'?'CONFLICTING REPORTS':'DEVELOPING SIGNAL'}</span><b>${esc(reasons.join(' · ')||'Observed across the current source set')}</b>`}
function analysisHint(e){const s=e.signals||{},parts=[];if(num(s.india)>=.45)parts.push('India exposure');if(num(s.financial)>=.45)parts.push('Money / markets');if(num(s.supply_chain)>=.45)parts.push('Trade / supply');if(num(s.geopolitical)>=.45)parts.push('Policy / security');if(num(s.social)>=.45)parts.push('Public / safety');if(e.local_relevance)parts.push('Local relevance');return (parts.length?parts:(e.personal_relevance||e.why_matters||[])).slice(0,2).join(' · ')||'Aetheria Read available'}
function renderHappening(items){
  const isTop=state.topic==='Top'||state.topic==='All';
  const label=$('happeningPanelTitle');
  if(label){
    const deskNames={'India':'INDIA WIRE','Markets':'MARKET WIRE','World':'GLOBAL DISPATCH','Business':'BUSINESS WIRE','Technology':'TECH WIRE','Geopolitics':'STRATEGIC WIRE','Sports':'SPORTS WIRE','Entertainment':'CULTURE WIRE','Local':'LOCAL WIRE','Legal':'LEGAL WIRE'};
    label.textContent=isTop?'INDIA NOW':(deskNames[state.topic]||`${state.topic.toUpperCase()} WIRE`);
  }
  let a;
  if(isTop){
    a=(items||[]).filter(topicFilter).slice(0,8);
    if(!a.length)a=(state.latest||[]).filter(e=>isFresh(e)&&(e.topic==='India'||num(e.signals?.india)>=.45)).slice(0,8);
  }else{
    a=(state.latest||[]).filter(topicFilter).slice(0,8);
  }
  $('indiaNowCount').textContent=a.length||'—';
  $('happeningList').innerHTML=a.map(e=>`<article class="live-story" data-event="${esc(e.id)}"><time>${age(e.last_seen||e.published)}</time><div><h3>${articleAnchor(e)}</h3><p>${esc(e.topic||'WORLD')} · ${esc(sourceLine(e))}</p><small class="mini-read"><b>Aetheria Read</b> ${esc(analysisHint(e))}</small></div>${originalLink(e)}</article>`).join('')||'<div class="empty-state">No live updates for this wire.</div>';wireStoryRows('happeningList')}
function renderIndia(items){
  const isTop=state.topic==='Top'||state.topic==='All';
  const t=$('insightIndiaTitle');
  if(t)t.textContent=isTop?'INDIA LENS':`${state.topic.toUpperCase()} PERSPECTIVE`;
  let a=(items||[]).filter(topicFilter).slice(0,6);
  if(!a.length&&!isTop)a=(state.latest||[]).filter(topicFilter).slice(0,6);
  $('indiaList').innerHTML=a.map((e,i)=>`<article class="lens-story" data-event="${esc(e.id)}"><span class="lens-rank">${String(i+1).padStart(2,'0')}</span><div><h3>${articleAnchor(e)}</h3><p>${esc((e.india_lens_reasons||[]).slice(0,3).join(' · ')||e.topic||'World')} · ${age(e.last_seen||e.published)}</p><small class="mini-read"><b>Aetheria Read</b> ${esc(analysisHint(e))}</small></div>${originalLink(e)}</article>`).join('')||'<div class="empty-state">No stories in this view.</div>';wireStoryRows('indiaList')}
function renderImpact(items){
  const isTop=state.topic==='Top'||state.topic==='All';
  const t=$('insightImpactTitle');
  if(t)t.textContent=isTop?'IMPACT':`${state.topic.toUpperCase()} TRANSMISSION`;
  let a=(items||[]).filter(topicFilter).slice(0,6);
  if(!a.length&&!isTop)a=(state.latest||[]).filter(e=>topicFilter(e)&&num(e.intelligence?.impact)>=.35).slice(0,6);
  $('impactList').innerHTML=a.map(e=>{
    const s=e.signals||{},c=[];
    if(num(s.india)>=.45)c.push('India');
    if(num(s.financial)>=.45)c.push('Markets');
    if(num(s.supply_chain)>=.45)c.push('Trade');
    if(num(s.geopolitical)>=.45)c.push('Geopolitics');
    const il=impactLabel(e.intelligence?.impact);
    const ilClass=il==='HIGH'?'impact-high':il==='ELEVATED'?'impact-elevated':'impact-moderate';
    return`<article class="impact-story" data-event="${esc(e.id)}"><div class="impact-level ${ilClass}">${il}</div><div><h3>${articleAnchor(e)}</h3><p>${esc(c.join(' · ')||e.topic||'Global')} · ${age(e.last_seen||e.published)}</p><small class="mini-read"><b>Aetheria Read</b> ${esc(analysisHint(e))}</small></div>${originalLink(e)}</article>`
  }).join('')||'<div class="empty-state">No strong transmission signal detected yet.</div>';wireStoryRows('impactList')}
function renderAiPulse(){const h=state.home||{},m=h.metrics||{},pressure=h.pressure||[];const languages=new Set((state.events||[]).flatMap(e=>e.languages||[]));$('aiModeLabel').textContent='LOCAL · EVIDENCE-GROUNDED';$('aiPulse').innerHTML=`<div class="ai-rail-metrics"><div><b>${num(m.events_24h).toLocaleString()}</b><span>living events</span></div><div><b>${num(m.reports_24h).toLocaleString()}</b><span>linked reports</span></div><div><b>${languages.size||0}</b><span>languages</span></div><div><b>${num(m.disputed)}</b><span>disputed</span></div></div><div class="ai-rail-read"><strong>${num(m.disputed)?`${num(m.disputed)} story${num(m.disputed)===1?'':'ies'} with conflicting reports`:num(m.flash)?`${num(m.flash)} flash development${num(m.flash)===1?'':'s'} are being isolated from the main flow`:'Aetheria is comparing source activity before surfacing the next update.'}</strong><span>${num(m.events_24h).toLocaleString()} living events · ${num(m.reports_24h).toLocaleString()} linked reports · ${languages.size||0} languages · evidence-first local analysis</span></div>`;$('pressureList').innerHTML=pressure.map(x=>`<div class="pressure-item"><span>${esc(x.label)}</span><i><b style="width:${pct(x.score)}%"></b></i><em>${pct(x.score)}</em></div>`).join('')||'<span class="pressure-empty">No measurable pressure signal yet.</span>'}
function row(e){
  const hasImg=validUrl(e?.image_url);
  const sig=e.signals||{};
  const parts=[];
  if(num(sig.india)>=.45)parts.push('India exposure');
  if(num(sig.financial)>=.45)parts.push('Money / costs');
  if(num(sig.supply_chain)>=.45)parts.push('Prices / availability');
  if(num(sig.geopolitical)>=.45)parts.push('Policy / security');
  if(num(sig.social)>=.45)parts.push('Safety / public life');
  const hint=(parts.length?parts:(e.personal_relevance||e.why_matters||e.india_lens_reasons||[])).slice(0,2).join(' · ');
  return`<article class="news-row ${hasImg?'':'no-image'}" data-event="${esc(e.id)}">${hasImg?imageBlock(e,'row-thumb','lazy'):''}<div class="news-main"><div class="news-top"><span class="tag">${esc(e.topic||'WORLD')}</span>${trustChip(e)}<span class="age">${age(e.last_seen||e.published)}</span></div><h3 class="news-title">${articleAnchor(e)}</h3><div class="news-meta"><span>${esc(sourceLine(e))}</span>${num(e.sources)>1?`<span>· ${num(e.sources)} sources</span>`:''}${(e.languages||[]).length?`<span>· ${(e.languages||[]).slice(0,2).map(esc).join(' · ')}</span>`:''}</div>${hint?`<p class="row-analysis"><b>Aetheria</b> ${esc(hint)}</p>`:''}</div>${originalLink(e)}</article>`;
}
function renderFeed(){const a=(state.latest||[]).filter(topicFilter).slice(0,state.depth);$('feed').innerHTML=a.map(row).join('')||'<div class="empty-state">No verified latest activity in this view.</div>';$('loadMore').hidden=state.depth>=Math.min(120,(state.latest||[]).filter(topicFilter).length);wireStoryRows('feed');preloadImages(a.slice(0,3))}
function renderReadNext(){
  const stackIds=new Set(stackItems().map(e=>e.id));
  const feedItems=(state.latest||[]).filter(topicFilter).slice(0,state.depth);
  const feedIds=new Set(feedItems.map(e=>e.id));
  const a=(state.latest||[]).filter(topicFilter).filter(e=>!stackIds.has(e.id)&&!feedIds.has(e.id)).slice(0,6);
  $('readNextCount').textContent=a.length||'—';
  $('readNextList').innerHTML=a.map(e=>`<article class="read-next" data-event="${esc(e.id)}"><time>${age(e.last_seen||e.published)}</time><div><h3>${articleAnchor(e)}</h3><p>${esc(e.topic||'WORLD')} · ${esc(sourceLine(e))}</p></div></article>`).join('')||'<div class="empty-state">No additional stories queued.</div>';
  wireStoryRows('readNextList');
}
function renderEmerging(){const a=(state.home?.emerging||[]).filter(topicFilter);$('emergingList').innerHTML=a.map(e=>`<article class="emerging-row" data-event="${esc(e.id)}"><span class="emerging-dot"></span><div><small>${trustChip(e)} · ${age(e.last_seen||e.published)}</small><h3>${articleAnchor(e)}</h3><p>${num(e.sources)||1} source${num(e.sources)===1?'':'s'} · ${(e.india_lens_reasons||[]).slice(0,2).map(esc).join(' · ')}</p></div>${originalLink(e)}</article>`).join('')||'<div class="empty-state">No emerging signal above the discovery threshold.</div>';wireStoryRows('emergingList')}
function renderNext(){const n=state.home?.now,f=state.home?.next;$('nowContext').innerHTML=n?`<article data-event="${esc(n.id)}"><b>${articleAnchor(n)}</b><span>${esc(n.status||'DEVELOPING')} · ${age(n.last_seen||n.published)} · ${pct(n.intelligence?.confidence)}% confidence</span></article>`:'<div class="empty-state">No moving event surfaced.</div>';$('nextContext').innerHTML=f?`<article>${validUrl(f.url)?`<a href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">${esc(f.title)}</a>`:esc(f.title)}<span>${esc(f.horizon)} · ${futureTime(f.start_ts,f.time_known)} · ${esc(f.category||'World')}</span></article>`:'<div class="empty-state">No verified scheduled event available.</div>';wireStoryRows('nowContext')}
function renderDesks(){const sections=(state.sections||[]).filter(s=>Array.isArray(s.events)&&s.events.length);const fallback=[['Finance & Markets',new Set(['Finance','Markets','Economy','Business','Commodities','Energy'])],['India & Current Affairs',new Set(['India','Politics','Local','Education','Health'])],['Legal & Judiciary',new Set(['Legal','Supreme Court','Judiciary','Law'])],['World & Geopolitics',new Set(['Geopolitics','World'])],['Technology & Science',new Set(['Technology','AI','Science','Space'])],['Sports',new Set(['Sports'])],['Entertainment & Culture',new Set(['Entertainment','Culture'])]];const data=sections.length?sections:fallback.map(([label,topics])=>({label,events:(state.latest||[]).filter(e=>topics.has(e.topic)).slice(0,4)}));$('deskGrid').innerHTML=data.map((s,i)=>{const rows=(s.events||[]).slice(0,4);const cls=s.label.includes('Entertainment')?' entertainment':'',accent=s.label.includes('Finance')?'finance':s.label.includes('India')?'india':s.label.includes('Legal')?'legal':s.label.includes('World')?'world':s.label.includes('Technology')?'technology':s.label.includes('Sports')?'sports':'culture';return`<article class="desk ${accent}${cls}"><div class="desk-head"><h2>${esc(s.label)}</h2><span>${rows.length}</span></div>${rows.map(e=>`<div class="desk-story" data-event="${esc(e.id)}"><time>${age(e.last_seen||e.published)}</time><h3>${articleAnchor(e)}</h3><p>${esc(e.topic||'World')} · ${esc(sourceLine(e))}</p><small class="mini-read"><b>Aetheria Read</b> ${esc(analysisHint(e))}</small></div>`).join('')||'<div class="empty-state">No verified stories in this desk.</div>'}</article>`}).join('');wireStoryRows('deskGrid')}
function showReturn(){const prev=state.lastVisit;if(!prev||Date.now()/1000-prev<600)return;const changed=(state.latest||[]).filter(e=>num(e.last_seen||e.published)>prev).slice(0,4);if(!changed.length)return;$('returnTitle').textContent=`${changed.length} updates since your last visit`;$('returnList').innerHTML=changed.map(e=>`<button data-event="${esc(e.id)}"><time>${age(e.last_seen||e.published)}</time><span>${esc(e.title)}</span></button>`).join('');$('returnStrip').hidden=false;wireStoryRows('returnList')}
function applyState(s){const live=num(s.healthy_sources)>0;$('liveLabel').textContent=s.fetching_sources?'UPDATING':live?'LIVE':'CHECKING';$('liveDot').className=s.fetching_sources?'live-check':live?'live-ok':'live-warn';if($('editionDate'))$('editionDate').textContent=new Date().toLocaleDateString([],{day:'2-digit',month:'short',year:'numeric'});if($('tickerBtn')&&s.engine_error)$('tickerBtn').title=`Engine: ${s.engine_error}`}
function render(){
  renderCategories();
  if(state.searchMode){$('homeView').hidden=true;$('searchView').hidden=false;renderSearch();return}
  $('homeView').hidden=false;$('searchView').hidden=true;
  const isTop=state.topic==='Top'||state.topic==='All';
  const deskHeaders={'India':'India Intelligence · National Monitor','Markets':'Markets & Capital · Global Transmission','World':'World Desk · Geopolitics & Global Affairs','Business':'Business & Commerce · Industry Monitor','Technology':'Technology & Innovation · Systems & AI','Geopolitics':'Geopolitics & Defense · Strategic Analysis','Sports':'Sports Desk · Competitions & Records','Entertainment':'Entertainment & Culture Desk','Local':'Local & Regional Wire · Ground Signals','Legal':'Legal Intelligence · Supreme Court & Judiciary Monitor'};
  $('viewTitle').textContent=isTop?'What matters right now':(deskHeaders[state.topic]||`${state.topic} Desk · Intelligence`);
  const secLabel=$('latestSectionLabel');if(secLabel)secLabel.textContent=isTop?'LATEST':`${state.topic.toUpperCase()} CHRONICLE`;
  const secSub=$('latestSubLabel');if(secSub)secSub.textContent=isTop?'CHRONOLOGICAL':'VERIFIED STREAM';
  const heading=$('latestHeading');if(heading)heading.textContent=isTop?'What just happened':`Latest ${state.topic} Coverage`;
  const subheading=$('latestSubheading');if(subheading)subheading.textContent=isTop?'Fresh event activity, with Aetheria analysis available on every story.':`Verified intelligence in ${state.topic}, organized chronologically.`;
  const mSec=$('marketSection');
  const deskZone=$('marketDeskZone');
  if(state.topic==='Markets'){
    if(mSec) mSec.hidden=true;
    if(deskZone) deskZone.hidden=false;
    renderMarket();
  } else if(isTop||state.topic==='Business'){
    if(mSec) mSec.hidden=false;
    if(deskZone) deskZone.hidden=true;
    renderMarket();
  } else {
    if(mSec) mSec.hidden=true;
    if(deskZone) deskZone.hidden=true;
  }
  renderFlash();renderStack();
  const h=state.home||{};
  renderHappening(h.happening||[]);
  renderIndia(h.india_lens||[]);
  renderImpact(h.impact||[]);
  renderAiPulse();
  renderFeed();
  renderReadNext();
  renderEmerging();
  renderNext();
  renderDesks();
  showReturn();
}
async function getJSON(url,signal=null,ms=7000){const c=new AbortController();const t=setTimeout(()=>c.abort(),ms);if(signal)signal.addEventListener('abort',()=>c.abort(),{once:true});try{const r=await fetch(url,{signal:c.signal,cache:'no-store'});if(!r.ok)throw new Error(`${r.status}`);return await r.json()}finally{clearTimeout(t)}}
async function loadMarket(){
  try{
    const m=await getJSON("/api/market",null,6500);
    if(m&&m.groups&&m.groups.length){
      state.market=m;
      renderMarket();
    }
  }catch(e){}
}
async function refresh(){if(state.refreshInFlight)return;state.refreshInFlight=true;try{const d=await getJSON('/api/bootstrap',null,7000);const changed=!state.initialized||num(d.revision)!==num(state.revision);const y=window.scrollY;Object.assign(state,{revision:num(d.revision),events:d.events||[],flash:d.flash||[],impact:d.impact||[],latest:d.latest||[],moving:d.moving||[],sections:d.sections||[],future:d.future||[],market:d.market||{},home:d.home||{},categories:d.categories||[]});applyState(d.state||{});cacheBootstrap(d);startTicker();if(changed&&!state.searchMode)render();if(!state.initialized)render();if(changed&&state.initialized)requestAnimationFrame(()=>window.scrollTo({top:y,behavior:'auto'}));state.initialized=true;if(!state.market?.groups?.length)loadMarket();checkRadars();}catch(e){if(!state.initialized){$('liveLabel').textContent='CHECKING';$('tickerBtn').textContent='Waiting for verified reports…'}}finally{state.refreshInFlight=false}}
function startTicker(){if(state.tickerTimer)clearInterval(state.tickerTimer);state.tickerIndex=0;const tick=()=>{const a=(state.latest||[]).filter(topicFilter).slice(0,12);if(!a.length){$('tickerBtn').textContent='Waiting for verified reports…';$('tickerBtn').dataset.event='';return}const e=a[state.tickerIndex%a.length];state.tickerIndex++;$('tickerBtn').textContent=e.title;$('tickerBtn').dataset.event=e.id};tick();state.tickerTimer=setInterval(tick,8000)}
function wireStoryRows(id){$(id)?.querySelectorAll('[data-event]').forEach(x=>{x.onclick=e=>{if(e.target.closest('a'))return;openStory(x.dataset.event)}})}
function renderSearch(){
  const rows=(state.events||[]).slice(0,60);
  $('searchTitle').textContent=state.query?`Search · “${state.query}”`:'Results';
  if(!rows.length){
    $('searchResults').innerHTML='<div class="empty-state">No matching verified events.</div>';
    return;
  }
  $('searchResults').innerHTML=rows.map(e=>{
    const destUrl=validUrl(e.url)?e.url:validUrl(e.primary_url)?e.primary_url:'#';
    return `<article class="search-item" data-event="${esc(e.id)}">
      <a class="search-main-link" href="${esc(destUrl)}" ${destUrl!=='#'?'target="_blank" rel="noopener noreferrer"':''}>
        <div class="news-top"><span class="tag">${esc(e.topic||'WORLD')}</span>${trustChip(e)}<span class="age">${age(e.last_seen||e.published)}</span></div>
        <h3 class="news-title">${esc(e.title)}</h3>
        <div class="news-meta"><span>${esc(sourceLine(e))}</span>${num(e.sources)>1?`<span>· ${num(e.sources)} sources</span>`:''}</div>
        ${e.summary?`<p class="row-analysis">${esc(e.summary)}</p>`:''}
      </a>
      <button class="search-read-btn" data-open-read="${esc(e.id)}" title="Open in-depth Aetheris Read analysis">
        <span>Aetheris Read</span> ↗
      </button>
    </article>`;
  }).join('');
  $('searchResults').querySelectorAll('[data-open-read]').forEach(b=>{
    b.onclick=e=>{
      e.stopPropagation();
      openStory(b.dataset.openRead);
    };
  });
}
function hideSuggestions(){$('searchSuggestions').hidden=true;$('searchSuggestions').innerHTML=''}
function renderSuggestions(items){if(!items?.length){hideSuggestions();return}$('searchSuggestions').hidden=false;$('searchSuggestions').innerHTML=items.slice(0,7).map(e=>`<button class="suggest-item" data-suggest-id="${esc(e.id||'')}"><span>${esc(e.topic||'WORLD')}</span><b>${esc(e.title||'')}</b><time>${age(e.last_seen)}</time></button>`).join('');$('searchSuggestions').querySelectorAll('button').forEach(b=>b.onclick=()=>{const id=b.dataset.suggestId;hideSuggestions();if(id)openStory(id)})}
function runSuggest(q){const raw=String(q??'');const term=raw.trim();const seq=++state.suggestSeq;if(term.length<1){hideSuggestions();return}if(state.suggestAbort)state.suggestAbort.abort();state.suggestAbort=new AbortController();clearTimeout(state.suggestTimer);state.suggestTimer=setTimeout(async()=>{try{const d=await getJSON(`/api/suggest?q=${encodeURIComponent(term)}`,state.suggestAbort.signal,4000);if(seq!==state.suggestSeq||$('search').value!==raw)return;renderSuggestions(d.results||[])}catch(e){if(e.name!=='AbortError'&&seq===state.suggestSeq)hideSuggestions()}},140)}
async function runSearch(q){const input=$('search');const raw=String(q??'');const term=raw.trim();const seq=++state.searchSeq;state.query=term;if(term.length<2){state.searchMode=false;state.events=[];$('clearSearch').classList.toggle('show',term.length>0);hideSuggestions();if(state.initialized)render();return}state.searchMode=true;$('clearSearch').classList.add('show');if(state.searchAbort)state.searchAbort.abort();state.searchAbort=new AbortController();try{const d=await getJSON(`/api/search?q=${encodeURIComponent(term)}`,state.searchAbort.signal,6000);if(seq!==state.searchSeq||$('search').value!==raw)return;state.events=d.results||[];const pos=input.selectionStart;render();requestAnimationFrame(()=>{if(document.activeElement===input&&input.value===raw){try{input.setSelectionRange(pos,pos)}catch{}}})}catch(e){if(e.name!=='AbortError'&&seq===state.searchSeq)toast('Search could not be completed')}}
function clearSearch(){state.searchMode=false;state.query='';state.events=[];$('search').value='';$('clearSearch').classList.remove('show');hideSuggestions();render()}
let activeStoryId='';
function renderEvidence(e,d){const x=d.evidence||{},st=x.state||e.status||'DEVELOPING',conf=pct(e.intelligence?.confidence),langs=(x.languages||[]).filter(Boolean).slice(0,7).join(' · ')||'—',conflicts=x.conflicts||[];$('modalEvidence').innerHTML=`<div class="truth-state truth-${st.toLowerCase()}"><b>${esc(st)}</b><span>${num(x.independent_sources)} independent sources</span></div><div><b>${num(x.reports)}</b><span>reports</span></div><div><b>${num(x.official)}</b><span>official</span></div><div><b>${conf}%</b><span>confidence</span></div><div><b>${esc(langs)}</b><span>languages</span></div>${conflicts.length?`<div class="evidence-warning"><b>CONFLICT</b><span>${conflicts.map(c=>esc(c.sources)).join(' · ')}</span></div>`:''}`}
function renderAiBox(d){const local=d?.local_ai||null;$('modalAi').hidden=!local;if(!local){$('modalAi').innerHTML='';return}$('modalAi').innerHTML=`<span>AETHERIA INTELLIGENCE · LOCAL EVIDENCE ENGINE</span><b>${esc(local.summary||'Observed event synthesis is available.')}</b><p><strong>Why surfaced:</strong> ${esc(local.why||'Fresh event activity')}</p><p><strong>Evidence:</strong> ${esc(local.evidence_note||'Evidence drawn from the linked source set.')}</p><p><strong>Uncertainty:</strong> ${esc(local.uncertainty||'No additional uncertainty note is available.')}</p>`}
async function openStory(id){if(!id)return;activeStoryId=id;telemetry(id,'open');$('storyModal').classList.add('open');$('storyModal').setAttribute('aria-hidden','false');$('modalTitle').textContent='Loading…';$('modalSummary').textContent='';$('modalEvidence').innerHTML='';$('modalContext').innerHTML='';$('modalImpact').innerHTML='';$('modalTimeline').innerHTML='';$('modalRelated').innerHTML='';$('modalFuture').innerHTML='';$('modalAi').innerHTML='';$('modalAi').hidden=true;$('knowledgeGapBody').hidden=true;$('knowledgeGapBody').innerHTML='';$('modalSources').innerHTML='';try{const d=await getJSON(`/api/event/${encodeURIComponent(id)}`);const e=d.event||{},src=d.sources||[],ctx=d.context||{};$('modalKicker').textContent=`LIVING STORY · ${e.topic||'WORLD'}`;$('modalTitle').textContent=e.title||'Untitled story';$('modalPublished').textContent=e.primary_published?`Published ${exactTime(e.primary_published)}`:'Publication time unavailable';renderReadingMemory(e);saveReading(e.id,e.last_seen||e.primary_published,e.title);updateModalFollowBtn(e.id);$('modalFollowBtn').onclick=()=>{toggleFollow(e.id);updateModalFollowBtn(e.id)};renderEvidence(e,d);const vals={"WHY IT MATTERS":(ctx.why||[]).join(' · ')||'Fresh event activity',"INDIA LENS":(e.india_lens_reasons||[]).join(' · ')||'No direct India signal',"LIFE / LOCAL":(e.life_impact||e.personal_relevance||[]).slice(0,3).join(' · ')||'No measured personal or local pathway',"LAST CHANGE":ctx.latest_change||'No additional change note',"SOURCE MIX":`${num(e.sources)||0} linked reports · ${num(e.source_tiers?.official)||0} official`};$('modalContext').innerHTML=Object.entries(vals).map(([k,v])=>`<div><span>${k}</span><b>${esc(v)}</b></div>`).join('');$('modalSummary').textContent=e.summary||e.primary_description||'No article summary is available; source reports remain the primary evidence.';const personal=(e.personal_relevance||[]);$('modalPersonal').innerHTML=personal.length?`<div class="personal-head"><span>RELEVANCE LENS</span><em>Observed pathways</em></div><p>${esc(personal.join(' · '))}</p>`:'';renderAiBox(d);$('modalImpact').innerHTML=renderImpactDetail(d.impact_channels);$('modalTimeline').innerHTML=renderTimeline(d.timeline);$('modalRelated').innerHTML=renderRelated(d.related);$('modalFuture').innerHTML=renderFutureDetail(d.future_watch);$('modalSourceCount').textContent=`${src.length} report${src.length===1?'':'s'}`;$('modalSources').innerHTML=src.map(a=>{const u=validUrl(a.canonical_url)?`<a href="${esc(a.canonical_url)}" target="_blank" rel="noopener noreferrer">↗</a>`:'';const t=validUrl(a.canonical_url)?`<a href="${esc(a.canonical_url)}" target="_blank" rel="noopener noreferrer">${esc(a.title||'Source report')}</a>`:esc(a.title||'Source report');return`<div class="source-report"><i></i><div><h3>${t}</h3><p>${esc(a.domain||'source')} · ${a.published?`Published ${esc(exactTime(a.published))}`:'publication time unavailable'} · ${esc(a.tier||'publisher')} · ${esc(a.language||'')}</p></div>${u}</div>`}).join('')||'<div class="empty-state">No linked source reports.</div>';wireStoryRows('modalRelated')}catch(e){$('modalTitle').textContent='Story unavailable';$('modalSummary').textContent='The event could not be loaded. Please try again.'}}
function closeStory(){$('storyModal').classList.remove('open');$('storyModal').setAttribute('aria-hidden','true');activeStoryId=''}
async function openKnowledgeGap(){if(!activeStoryId)return;$('knowledgeBtn').disabled=true;$('knowledgeBtn').textContent='Building context…';try{const d=await getJSON(`/api/knowledge-gap/${encodeURIComponent(activeStoryId)}`);const b=d.background||[];$('knowledgeGapBody').hidden=false;$('knowledgeGapBody').innerHTML=`<p>${esc(d.gap||'This story can be easier to follow with the surrounding context.')}</p>${b.length?`<div class="gap-links">${b.map(x=>`<button data-event="${esc(x.id)}">${esc(x.title)}</button>`).join('')}</div>`:'<small>No earlier related event is available in the retained story history.</small>'}`;wireStoryRows('knowledgeGapBody')}catch{$('knowledgeGapBody').hidden=false;$('knowledgeGapBody').innerHTML='<p>Background context is not available for this story yet.</p>'}finally{$('knowledgeBtn').disabled=false;$('knowledgeBtn').textContent='Give me the missing context'}}
function radarStore(){try{return JSON.parse(localStorage.getItem('aetheria-radars')||'[]')}catch{return[]}}
function saveRadars(rows){try{localStorage.setItem('aetheria-radars',JSON.stringify(rows))}catch{}}
function inboxStore(){try{return JSON.parse(localStorage.getItem('aetheria-inbox')||'[]')}catch{return[]}}
function saveInbox(rows){try{localStorage.setItem('aetheria-inbox',JSON.stringify(rows.slice(0,60)))}catch{}}
function renderRadar(){const rows=radarStore();$('radarCount').textContent=rows.length;$('radarList').innerHTML=rows.map((r,i)=>`<div class="radar-row"><div><b>${esc(r.query)}</b><small>last checked ${r.checked?new Date(r.checked).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):'—'} · ${num(r.unread)} new</small></div><button data-radar-remove="${i}">×</button></div>`).join('')||'<div class="empty-state">No topics are being watched yet.</div>';$('radarList').querySelectorAll('[data-radar-remove]').forEach(b=>b.onclick=()=>{const a=radarStore();a.splice(num(b.dataset.radarRemove),1);saveRadars(a);renderRadar()})}
async function checkRadars(){const a=radarStore();if(!a.length)return;for(const r of a){try{const d=await getJSON(`/api/search?q=${encodeURIComponent(r.query)}`,null,4500);const hits=(d.results||[]).filter(x=>num(x.score)>=55);const latest=hits[0];const last=Number(r.lastSeen||0);if(latest&&last===0){r.lastSeen=num(latest.last_seen)||Date.now()/1000;r.checked=Date.now();continue}const meaningful=latest&&((num(latest.sources)>=2)||(num(latest.source_tiers?.official)>0)||(num(latest.score)>=72));if(meaningful&&num(latest.last_seen)>last){const inbox=inboxStore();const exists=inbox.some(x=>x.event_id===latest.id&&x.radar===r.query);if(!exists){inbox.unshift({event_id:latest.id,radar:r.query,title:latest.title,topic:latest.topic,at:latest.last_seen,score:latest.score});r.unread=num(r.unread)+1;saveInbox(inbox);toast(`Radar update · ${r.query}`)}}r.lastSeen=Math.max(last,num(latest?.last_seen));r.checked=Date.now()}catch{r.checked=Date.now()}}saveRadars(a);renderRadar();renderInboxCount()}
function addRadar(){const q=$('radarInput').value.trim();if(q.length<2){toast('Enter a topic, company or country');return}const a=radarStore();if(!a.some(x=>x.query.toLowerCase()===q.toLowerCase()))a.push({query:q,created:Date.now(),checked:0,lastSeen:0,unread:0});saveRadars(a);$('radarInput').value='';renderRadar();checkRadars();toast(`Watching ${q}`)}
function renderInboxCount(){const count=inboxStore().length;$('inboxCount').textContent=count;const badge=$('bnavInsightsBadge');if(badge){if(count>0){badge.hidden=false;badge.textContent=count}else{badge.hidden=true}}}
function renderInbox(){const rows=inboxStore();$('inboxCount').textContent=rows.length;$('inboxList').innerHTML=rows.map(r=>`<button class="inbox-row" data-event="${esc(r.event_id)}"><span>${esc(r.radar||'Radar')}</span><b>${esc(r.title)}</b><small>${esc(r.topic||'World')} · ${age(r.at)} · relevance ${Math.round(num(r.score))}</small></button>`).join('')||'<div class="empty-state">Your inbox is clear.</div>';wireStoryRows('inboxList')}
function clearInbox(){saveInbox([]);const a=radarStore().map(r=>({...r,unread:0}));saveRadars(a);renderInbox();renderRadar()}
function todayIndia(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
async function runReplay(){const d=$('replayDate').value;if(!d)return;const out=await getJSON(`/api/replay?date=${encodeURIComponent(d)}`,null,8000);$('replaySummary').textContent=out.available?`${num(out.count)} living events recorded · ${esc(out.timezone||'Asia/Kolkata')}`:(out.error||'No retained events were found for this day.');$('replayList').innerHTML=(out.events||[]).map(e=>`<article class="replay-row" data-event="${esc(e.id)}"><time>${e.replay_time?new Date(e.replay_time*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'—'}</time><div><h3>${articleAnchor(e)}</h3><p>${esc(e.topic||'World')} · ${trustChip(e)} · ${num(e.sources)||1} report${num(e.sources)===1?'':'s'}</p></div></article>`).join('')||'<div class="empty-state">No retained story activity for this date.</div>';wireStoryRows('replayList')}
async function loadSystem(){try{const[d,src,eng]=await Promise.all([getJSON('/api/diagnostics',null,5000),getJSON('/api/sources',null,5000),getJSON('/api/intelligence/status',null,5000)]);$('onlineCount').textContent=d.sources?.online??'—';$('checkingCount').textContent=d.sources?.fetching??'—';$('errorCount').textContent=d.sources?.errors??'—';$('sourceRatio').textContent=`${d.sources?.online||0}/${d.sources?.total||0} online`;$('feedState').textContent=d.sources?.online?'LIVE':'—';$('discoveryState').textContent=d.discovery?.online?`LIVE · ${d.discovery.online}`:'—';$('intelligenceState').textContent=eng.mode==='LOCAL_DETERMINISTIC'?'LOCAL ENGINE':'—';state.intelligenceStatus=eng;$('sourceList').innerHTML=(src.sources||[]).map(x=>`<div class="source"><span>${validUrl(x.url)?`<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.name)}</a>`:esc(x.name)}</span><small>${esc(x.state||'waiting')} · ${esc(x.language||'en')}</small><i class="${x.state==='error'?'error':x.state==='fetching'?'checking':x.state==='online'?'online':''}"></i></div>`).join('')}catch{toast('System status is temporarily unavailable')}}
function toggleDrawer(open){$('systemDrawer').classList.toggle('open',open);$('systemDrawer').setAttribute('aria-hidden',open?'false':'true');if(open)loadSystem()}
function toggleRadar(open){$('radarDrawer').classList.toggle('open',open);$('radarDrawer').setAttribute('aria-hidden',open?'false':'true');if(open)renderRadar()}
function toggleInbox(open){$('inboxDrawer').classList.toggle('open',open);$('inboxDrawer').setAttribute('aria-hidden',open?'false':'true');if(open)renderInbox()}
function toggleReplay(open){$('replayModal').classList.toggle('open',open);$('replayModal').setAttribute('aria-hidden',open?'false':'true')}
function toast(t){const x=$('toast');x.textContent=t;x.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>x.classList.remove('show'),1800)}
/* ==================== AETHERIA FOLLOW UP STORE & ENGINE ==================== */
function followStore(){
  try{return JSON.parse(localStorage.getItem('aetheria-follows')||'[]')}catch{return[]}
}
function saveFollows(rows){
  try{localStorage.setItem('aetheria-follows',JSON.stringify(rows))}catch{}
}
function isFollowed(eid){
  return followStore().includes(eid);
}
function updateModalFollowBtn(eid){
  const btn=$('modalFollowBtn');
  const txt=$('modalFollowText');
  if(!btn||!txt)return;
  const followed=isFollowed(eid);
  btn.classList.toggle('active',followed);
  txt.textContent=followed?'✓ Following':'+ Follow Event';
}
async function toggleFollow(eid){
  if(!eid)return;
  const list=followStore();
  const index=list.indexOf(eid);
  const willFollow=index<0;
  if(willFollow){
    list.unshift(eid);
  }else{
    list.splice(index,1);
  }
  saveFollows(list);
  updateModalFollowBtn(eid);
  toast(willFollow?'Following event — Aetheria is monitoring':'Unfollowed event');
  try{
    await fetch('/api/follow',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({session:state.session,event_id:eid,action:willFollow?'follow':'unfollow'})
    });
  }catch{}
  loadFollowUp();
}

let followUpData = null;
let activeFollowTab = 'all';

async function loadFollowUp(){
  const fIds=followStore();
  try{
    const d=await getJSON(`/api/follow-up?session=${encodeURIComponent(state.session)}&followed_ids=${encodeURIComponent(fIds.join(','))}`);
    followUpData=d;
    renderFollowUpView();
    const badge=$('bnavFollowBadge');
    if(badge){
      const unread=d.digest?.count||0;
      badge.hidden=unread===0;
    }
  }catch(e){
    const listEl=$('followUpList');
    if(listEl)listEl.innerHTML='<div class="empty-state">Unable to load followed events right now.</div>';
  }
}

function renderFollowUpView(){
  if(!followUpData)return;
  const d=followUpData;
  const digest=d.digest||{};
  
  if($('digestChangesCount')) $('digestChangesCount').textContent = `${num(digest.count)} update${num(digest.count)===1?'':'s'}`;
  if($('digestSummarySentence')) $('digestSummarySentence').textContent = digest.summary_sentence||'Since you last checked, no new changes were detected.';
  if($('digestReassurance')) $('digestReassurance').textContent = digest.trailing_sentence||"Nothing else important changed in the stories you're following.";
  
  const listEl=$('digestList');
  if(listEl){
    if((digest.items||[]).length){
      listEl.innerHTML=digest.items.map((it,idx)=>`
        <li class="digest-item">
          <span class="digest-num">${idx+1}</span>
          <div>
            <strong data-event="${esc(it.id)}">${esc(it.title)}</strong>
            <span> — ${esc(it.delta||'New development observed.')}</span>
          </div>
        </li>
      `).join('');
      wireStoryRows('digestList');
    } else {
      listEl.innerHTML='';
    }
  }

  const allList=[...(d.revived||[]), ...(d.active||[]), ...(d.quiet||[])];
  if($('countFollowAll')) $('countFollowAll').textContent=allList.length;
  if($('countFollowActive')) $('countFollowActive').textContent=(d.active||[]).length;
  if($('countFollowQuiet')) $('countFollowQuiet').textContent=(d.quiet||[]).length;
  if($('countFollowRevived')) $('countFollowRevived').textContent=(d.revived||[]).length;
  if($('countFollowSuggest')) $('countFollowSuggest').textContent=(d.suggestions||[]).length;

  const mainListEl=$('followUpList');
  if(!mainListEl)return;

  if(activeFollowTab==='suggestions'){
    const sug=d.suggestions||[];
    if(!sug.length){
      mainListEl.innerHTML='<div class="empty-state">No new suggestions at this moment.</div>';
      return;
    }
    mainListEl.innerHTML=sug.map(s=>`
      <div class="suggestion-card">
        <div class="suggestion-kicker"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> AETHERIA SUGGESTS · HIGH MOMENTUM</div>
        <h3 data-event="${esc(s.id)}">${esc(s.title)}</h3>
        <p class="why-reason"><strong>Why follow?</strong> ${esc(s.why_suggest)}</p>
        <p style="font-size:12px;color:var(--muted);margin:0 0 12px;">${esc(s.summary)}</p>
        <div>
          <button class="btn-follow-suggest" data-follow-eid="${esc(s.id)}">+ Follow Story</button>
          <button class="btn-dismiss-suggest" data-dismiss-eid="${esc(s.id)}">Dismiss</button>
        </div>
      </div>
    `).join('');
    mainListEl.querySelectorAll('[data-follow-eid]').forEach(b=>b.onclick=()=>{toggleFollow(b.dataset.followEid);b.closest('.suggestion-card').remove()});
    mainListEl.querySelectorAll('[data-dismiss-eid]').forEach(b=>b.onclick=()=>{b.closest('.suggestion-card').remove()});
    wireStoryRows('followUpList');
    return;
  }

  let displayItems=[];
  if(activeFollowTab==='all') displayItems=allList;
  else if(activeFollowTab==='active') displayItems=d.active||[];
  else if(activeFollowTab==='quiet') displayItems=d.quiet||[];
  else if(activeFollowTab==='revived') displayItems=d.revived||[];

  if(!displayItems.length){
    mainListEl.innerHTML=`<div class="empty-state">${activeFollowTab==='all'?'You are not following any stories yet. Check SUGGESTED to follow important events.':`No stories currently in ${activeFollowTab.toUpperCase()} status.`}</div>`;
    return;
  }

  mainListEl.innerHTML=displayItems.map(it=>{
    let badgeClass='lifecycle-active';
    let badgeText='🔴 DEVELOPING';
    let subText=`Updated ${age(it.last_seen)} ago`;

    if(it.lifecycle==='REVIVED'){
      badgeClass='lifecycle-revived';
      badgeText='🔵 STORY REVIVED';
      subText=`Revived after ${it.revived_gap_days||'several'} days quiet`;
    } else if(it.lifecycle==='QUIET'){
      badgeClass='lifecycle-quiet';
      badgeText='🟡 QUIET — STILL IMPORTANT';
      const baselineStr = it.expected_interval_days ? ` (natural cycle: ~${it.expected_interval_days}d)` : '';
      subText=`No developments for ${it.days_quiet||1}d${baselineStr} · Relative attention ${it.coverage_drop_pct ? '↓ ' + it.coverage_drop_pct + '%' : 'steady'}`;
    } else if(it.lifecycle==='EMERGING'){
      badgeClass='lifecycle-active';
      badgeText='⚪ EMERGING';
      subText=`Initial reporting detected ${age(it.first_seen)} ago`;
    } else if(it.lifecycle==='RESOLVED'){
      badgeClass='lifecycle-active';
      badgeText='🟢 RESOLVED';
      subText=`Outcome verified`;
    }

    const attentionText = it.attention ? `<span class="follow-dim-pill">ATTENTION: ${esc(it.attention)}</span>` : '';
    const importanceText = it.importance ? `<span class="follow-dim-pill importance-${esc(String(it.importance).toLowerCase())}">IMPORTANCE: ${esc(it.importance)}</span>` : '';

    return `
      <article class="followup-card" data-event="${esc(it.id)}">
        <div class="followup-badge-row">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span class="lifecycle-badge ${badgeClass}">${badgeText}</span>
            ${attentionText}
            ${importanceText}
          </div>
          <span class="followup-card-time">${esc(subText)}</span>
        </div>
        <h3 data-open-event="${esc(it.id)}">${esc(it.title)}</h3>
        <div class="followup-delta-box">
          <span class="delta-label">What changed?</span>
          <p class="delta-content">${esc(it.what_changed||'Latest development verified across independent reporting.')}</p>
        </div>
        <div class="followup-why-box">
          <b>Previous state:</b> <span>${esc(it.previous_state||'Baseline monitoring.')}</span>
        </div>
        <div class="followup-why-box">
          <b>Why Aetheria is still monitoring:</b> <span>${esc(it.why_monitoring||'Underlying event remains unresolved.')}</span>
        </div>
        <div class="followup-actions">
          <button class="btn-read-history" data-open-event="${esc(it.id)}">Read Story &amp; Evidence ↗</button>
          <button class="btn-unfollow" data-unfollow-eid="${esc(it.id)}">Stop Following</button>
        </div>
      </article>
    `;
  }).join('');

  mainListEl.querySelectorAll('[data-open-event]').forEach(b=>b.onclick=()=>openStory(b.dataset.openEvent));
  mainListEl.querySelectorAll('[data-unfollow-eid]').forEach(b=>b.onclick=()=>toggleFollow(b.dataset.unfollowEid));
}

function toggleFollowUp(open){
  const m=$('followUpModal');
  if(!m)return;
  m.classList.toggle('open',open);
  m.setAttribute('aria-hidden',open?'false':'true');
  if(open){
    loadFollowUp();
  }
}

$('refresh').onclick=()=>{toast('Refreshing the world model…');refresh()};$('systemBtn').onclick=()=>toggleDrawer(true);$('drawerClose').onclick=()=>toggleDrawer(false);$('drawerBackdrop').onclick=()=>toggleDrawer(false);$('modalClose').onclick=closeStory;$('modalBackdrop').onclick=closeStory;$('knowledgeBtn').onclick=openKnowledgeGap;$('tickerBtn').onclick=()=>{const id=$('tickerBtn').dataset.event;if(id)openStory(id)};$('loadMore').onclick=()=>{state.depth=Math.min(120,state.depth+10);persistUi();renderFeed()};$('clearSearch').onclick=clearSearch;$('search').addEventListener('compositionstart',()=>state.composing=true);$('search').addEventListener('compositionend',e=>{state.composing=false;runSuggest(e.target.value);runSearch(e.target.value)});$('search').addEventListener('input',e=>{if(state.composing)return;const raw=String(e.currentTarget.value??'');runSuggest(raw);clearTimeout(state.searchTimer);state.searchTimer=setTimeout(()=>{if($('search').value===raw)runSearch(raw)},220)});$('search').addEventListener('focus',()=>{if($('search').value.trim())runSuggest($('search').value)});$('search').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();hideSuggestions();runSearch(e.target.value)}if(e.key==='Escape')hideSuggestions()});document.addEventListener('click',e=>{if(!$('searchShell').contains(e.target))hideSuggestions()});document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();$('search').focus()}if(e.key==='Escape'){if($('storyModal').classList.contains('open'))closeStory();else if($('categoriesDrawer')?.classList.contains('open'))toggleCategories(false);else if($('followUpModal')?.classList.contains('open'))toggleFollowUp(false);else if($('replayModal').classList.contains('open'))toggleReplay(false);else if($('radarDrawer').classList.contains('open'))toggleRadar(false);else if($('inboxDrawer').classList.contains('open'))toggleInbox(false);else if($('systemDrawer').classList.contains('open'))toggleDrawer(false)}});$('theme').onclick=()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='light'?'dark':'light';localStorage.setItem('aetheria-theme',document.documentElement.dataset.theme)};document.querySelectorAll('#depthSwitch button').forEach(b=>b.onclick=()=>{state.depth=num(b.dataset.depth);document.querySelectorAll('#depthSwitch button').forEach(x=>x.classList.toggle('active',x===b));persistUi();renderFeed()});$('stackPrev').onclick=()=>moveStack(-1);$('stackNext').onclick=()=>moveStack(1);$('storyStack').addEventListener('pointerdown',e=>{const x=e.clientX;const up=ev=>{const dx=ev.clientX-x;if(Math.abs(dx)>35)moveStack(dx<0?1:-1);document.removeEventListener('pointerup',up)};document.addEventListener('pointerup',up)});$('radarBtn')?.addEventListener('click',()=>toggleRadar(true));$('radarBackdrop')?.addEventListener('click',()=>toggleRadar(false));$('radarClose')?.addEventListener('click',()=>toggleRadar(false));$('radarAddBtn')?.addEventListener('click',addRadar);$('radarInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')addRadar()});$('inboxBtn')?.addEventListener('click',()=>toggleInbox(true));$('inboxBackdrop')?.addEventListener('click',()=>toggleInbox(false));$('inboxClose')?.addEventListener('click',()=>toggleInbox(false));$('clearInbox')?.addEventListener('click',clearInbox);$('replayBtn')?.addEventListener('click',()=>{toggleReplay(true);if(!$('replayDate').value)$('replayDate').value=todayIndia();runReplay()});$('replayBackdrop')?.addEventListener('click',()=>toggleReplay(false));$('replayClose')?.addEventListener('click',()=>toggleReplay(false));$('replayRun')?.addEventListener('click',runReplay);
$('categoriesClose')?.addEventListener('click',()=>toggleCategories(false));
$('categoriesBackdrop')?.addEventListener('click',()=>toggleCategories(false));
$('categoriesFilter')?.addEventListener('input',e=>renderCategoriesDrawer(e.target.value));
$('followUpClose')?.addEventListener('click',()=>toggleFollowUp(false));$('followUpBackdrop')?.addEventListener('click',()=>toggleFollowUp(false));
$('followUpTabs')?.querySelectorAll('.followup-tab-btn').forEach(btn=>{
  btn.onclick=()=>{
    activeFollowTab=btn.dataset.ftab;
    $('followUpTabs').querySelectorAll('.followup-tab-btn').forEach(b=>b.classList.toggle('active',b===btn));
    renderFollowUpView();
  };
});
/* HisabKitab / Aetheria Command Dock wiring (5 destinations: home, categories, followup, replay, more) */
document.querySelectorAll('.bnav-item').forEach(b=>b.onclick=()=>{
  const nav=b.dataset.nav;
  document.querySelectorAll('.bnav-item').forEach(x=>x.classList.toggle('active',x===b));
  if(nav==='home'){if(state.searchMode)clearSearch();state.topic='Top';state.stackIndex=0;persistUi();render();window.scrollTo({top:0,behavior:'smooth'})}
  if(nav==='categories')toggleCategories(true);
  if(nav==='radar')toggleRadar(true);
  if(nav==='followup')toggleFollowUp(true);
  if(nav==='replay'){toggleReplay(true);if(!$('replayDate').value)$('replayDate').value=todayIndia();runReplay()}
  if(nav==='more')toggleDrawer(true);
});
/* V24: Brand click always resets to home */
$('brandHome').addEventListener('click',e=>{e.preventDefault();if(state.searchMode)clearSearch();state.topic='Top';state.stackIndex=0;persistUi();render();window.scrollTo({top:0,behavior:'smooth'});document.querySelectorAll('.bnav-item').forEach(x=>x.classList.toggle('active',x.dataset.nav==='home'))});
const savedTheme=localStorage.getItem('aetheria-theme');if(savedTheme)document.documentElement.dataset.theme=savedTheme;restoreUi();hydrateCached();loadMarket();renderInboxCount();loadFollowUp();setInterval(refresh,7000);setInterval(async()=>{try{const m=await getJSON("/api/market",null,6500);state.market=m;renderMarket()}catch{}},120000);setInterval(checkRadars,60000);setInterval(loadFollowUp,60000);setInterval(()=>{$('clock').textContent=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})},1000);startTicker();refresh();
