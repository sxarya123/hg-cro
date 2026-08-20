(() => {
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const modal=document.getElementById('modal'),backdrop=document.getElementById('backdrop'),closeBtn=document.getElementById('closeBtn');
  const hero=document.getElementById('hero'),final=document.getElementById('final'),mobileCta=document.getElementById('mobileCta');

  const reveals=[...document.querySelectorAll('.reveal')];
  // Stagger from the top of each section so every block runs its own rhythm
  // instead of inheriting a delay from whatever came before it on the page.
  const seenPerSection=new Map();
  reveals.forEach(el=>{
    const section=el.closest('section, .ticker')||document.body;
    const position=seenPerSection.get(section)||0;
    seenPerSection.set(section,position+1);
    el.style.transitionDelay=Math.min(position*80,320)+'ms';
  });
  if(reduce||!('IntersectionObserver'in window)) reveals.forEach(x=>x.classList.add('in'));
  else{
    const ro=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');ro.unobserve(e.target)}}),{threshold:0,rootMargin:'0px 0px -12%'});
    reveals.forEach(x=>ro.observe(x));
  }

  // Eased in-page scrolling. A global `scroll-behavior:smooth` also captures every
  // programmatic scroll, which makes normal scrolling feel like it stutters.
  const headerOffset=()=>innerWidth<=980?92:102;
  const easeInOutCubic=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  let glideFrame=0;
  const cancelGlide=()=>{if(glideFrame){cancelAnimationFrame(glideFrame);glideFrame=0}};
  ['wheel','touchstart','keydown'].forEach(type=>addEventListener(type,cancelGlide,{passive:true}));

  function glideTo(target,duration=720){
    if(!target)return;
    cancelGlide();
    const maxScroll=document.documentElement.scrollHeight-innerHeight;
    const end=Math.max(0,Math.min(maxScroll,target.getBoundingClientRect().top+scrollY-headerOffset()-10));
    if(reduce){scrollTo(0,end);return}
    const start=scrollY,distance=end-start;
    if(Math.abs(distance)<2)return;
    const startedAt=performance.now();
    const step=now=>{
      const progress=Math.min(1,(now-startedAt)/duration);
      scrollTo(0,start+distance*easeInOutCubic(progress));
      glideFrame=progress<1?requestAnimationFrame(step):0;
    };
    glideFrame=requestAnimationFrame(step);
  }

  document.getElementById('browseBtn').onclick=()=>glideTo(document.getElementById('board'));
  document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
    const id=link.getAttribute('href').slice(1);
    const target=id&&document.getElementById(id);
    if(!target)return;
    event.preventDefault();
    glideTo(target);
    history.replaceState(null,'','#'+id);
  }));

  // Scale the panel down until it fits, so the request never needs a scrollbar.
  function fitModal(){
    const natural=modal.offsetHeight; // layout height, unaffected by the scale transform
    if(!natural)return;
    const fit=Math.min(1,(innerHeight-16)/natural);
    modal.style.setProperty('--fit',fit.toFixed(4));
  }
  function openModal(){
    modal.classList.add('open');backdrop.classList.add('open');
    modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');
    fitModal();syncCategoryUrl();
    setTimeout(()=>closeBtn.focus(),220);
  }
  function closeModal(){
    closeCategoryMenu();
    modal.classList.remove('open');backdrop.classList.remove('open');
    modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');
    syncCategoryUrl();
  }
  document.querySelectorAll('.js-open').forEach(btn=>btn.onclick=openModal);
  closeBtn.onclick=closeModal;backdrop.onclick=()=>{if(!document.getElementById('detailModal')?.classList.contains('open')&&!document.getElementById('contactModal')?.classList.contains('open'))closeModal()};
  addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))closeModal()});
  addEventListener('resize',fitModal);
  addEventListener('load',fitModal);
  window.visualViewport?.addEventListener('resize',fitModal);

  // Every game is requested with the same criteria, so the fields stay as authored in the
  // markup. Only the artwork changes: transparent art for the picker, key art for the banner.
  const gameArt={
    'Whiteout Survival':'../assets/images/games/artwork/whiteout-survival-characters.png',
    'Kingshot':'../assets/images/games/artwork/kingshot-characters.png',
    'Albion Online':'../assets/images/games/artwork/albion-online-characters.png',
    'Call of Dragons':'../assets/images/games/artwork/call-of-dragons-characters.png',
    'Last War':'../assets/images/games/artwork/last-war-survival-characters.png',
    'Rise of Kingdoms':'../assets/images/games/artwork/rise-of-kingdoms-characters.png'
  };
  const gameBanners={
    'Whiteout Survival':'../assets/images/wanted/whiteout-survival-request-banner.jpg',
    'Kingshot':'../assets/images/games/logos/kingshot-logo.jpeg',
    'Albion Online':'../assets/images/games/logos/albion-online-logo.jpeg',
    'Call of Dragons':'../assets/images/games/logos/call-of-dragons-logo.jpg',
    'Last War':'../assets/images/games/logos/last-war-survival-logo.jpeg',
    'Rise of Kingdoms':'../assets/images/games/logos/rise-of-kingdoms-logo.jpeg'
  };
  const gameSlug=name=>name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const category=document.getElementById('category'),formHero=document.getElementById('formHero');
  const catCtrl=document.getElementById('categoryCtrl'),catBtn=document.getElementById('categoryBtn');
  const catMenu=document.getElementById('categoryMenu'),catName=document.getElementById('categoryName');
  const catLogo=document.getElementById('categoryLogo');
  const catOpts=[...catMenu.querySelectorAll('.cat-opt')];
  const heroImg=document.getElementById('formHeroImg'),heroBg=document.getElementById('formHeroBg');

  function applyBanner(){
    const game=category.value,banner=gameBanners[game];
    heroImg.src=banner;heroBg.src=banner;
    heroImg.alt=game+' key art';
    // Whiteout Survival keeps its purpose-made banner; the rest use their key art.
    formHero.classList.toggle('is-art',game!=='Whiteout Survival');
    fitModal();
  }

  // Keeps the open request shareable: ?categoryGame=<game slug>
  function syncCategoryUrl(){
    try{
      const url=new URL(location.href);
      if(modal.classList.contains('open'))url.searchParams.set('categoryGame',gameSlug(category.value));
      else url.searchParams.delete('categoryGame');
      history.replaceState(null,'',url);
    }catch(e){/* replaceState is unavailable on some file:// contexts */}
  }

  function setCategory(value,{updateUrl=true}={}){
    if(!gameArt[value])return;
    category.value=value;
    catName.textContent=value;
    catLogo.src=gameArt[value];
    catOpts.forEach(opt=>opt.setAttribute('aria-selected',String(opt.dataset.value===value)));
    applyBanner();
    if(updateUrl)syncCategoryUrl();
  }

  const highlightOpt=i=>catOpts.forEach((opt,x)=>{
    opt.classList.toggle('focus',x===i);
    if(x===i)opt.focus();
  });
  function openCategoryMenu(){
    catMenu.classList.add('open');catBtn.setAttribute('aria-expanded','true');
    const current=catOpts.findIndex(opt=>opt.dataset.value===category.value);
    highlightOpt(current<0?0:current);
  }
  function closeCategoryMenu(){
    catMenu.classList.remove('open');catBtn.setAttribute('aria-expanded','false');
    catOpts.forEach(opt=>opt.classList.remove('focus'));
  }
  const menuOpen=()=>catMenu.classList.contains('open');

  catBtn.addEventListener('click',()=>menuOpen()?closeCategoryMenu():openCategoryMenu());
  catOpts.forEach(opt=>opt.addEventListener('click',()=>{
    setCategory(opt.dataset.value);closeCategoryMenu();catBtn.focus();
  }));
  catCtrl.addEventListener('keydown',e=>{
    const current=catOpts.findIndex(opt=>opt.classList.contains('focus'));
    if(e.key==='Escape'&&menuOpen()){e.stopPropagation();closeCategoryMenu();catBtn.focus();return}
    if(e.key==='Tab'){closeCategoryMenu();return}
    if(!menuOpen()){
      if(e.key==='ArrowDown'||e.key==='ArrowUp'||e.key==='Enter'||e.key===' '){e.preventDefault();openCategoryMenu()}
      return;
    }
    if(e.key==='ArrowDown'){e.preventDefault();highlightOpt(Math.min(catOpts.length-1,current+1))}
    else if(e.key==='ArrowUp'){e.preventDefault();highlightOpt(Math.max(0,current-1))}
    else if(e.key==='Home'){e.preventDefault();highlightOpt(0)}
    else if(e.key==='End'){e.preventDefault();highlightOpt(catOpts.length-1)}
    else if(e.key==='Enter'||e.key===' '){e.preventDefault();catOpts[current<0?0:current]?.click()}
  });
  catCtrl.addEventListener('focusout',e=>{if(!catCtrl.contains(e.relatedTarget))closeCategoryMenu()});
  document.addEventListener('pointerdown',e=>{if(menuOpen()&&!catCtrl.contains(e.target))closeCategoryMenu()});

  setCategory('Whiteout Survival',{updateUrl:false});

  // Deep link: open the request straight into the requested game.
  const requestedGame=new URLSearchParams(location.search).get('categoryGame');
  if(requestedGame){
    const match=Object.keys(gameArt).find(name=>gameSlug(name)===gameSlug(requestedGame));
    if(match){setCategory(match,{updateUrl:false});openModal()}
  }

  const form=document.getElementById('wantedForm'),error=document.getElementById('formError');
  form.onsubmit=e=>{
    e.preventDefault();
    const filled=[...form.querySelectorAll('.ctrl input,.ctrl textarea')].some(el=>el.value.trim()!=='');
    if(!filled){error.classList.add('show');return}
    error.classList.remove('show');
    document.getElementById('formState').style.display='none';
    document.getElementById('success').classList.add('show');
    document.getElementById('requestId').textContent='HG-WANTED-'+Math.floor(1000+Math.random()*9000);
    fitModal();
  };
  document.getElementById('doneBtn').onclick=()=>{
    closeModal();
    setTimeout(()=>{
      form.reset();setCategory('Whiteout Survival',{updateUrl:false});
      document.getElementById('formState').style.display='';
      document.getElementById('success').classList.remove('show');
      fitModal();
    },300)
  };

  let heroVisible=true,finalVisible=false;
  const updateMobile=()=>mobileCta.classList.toggle('show',innerWidth<=700&&!heroVisible&&!finalVisible);
  if('IntersectionObserver'in window){
    new IntersectionObserver(e=>{heroVisible=e[0].isIntersecting;updateMobile()},{threshold:.08}).observe(hero);
    new IntersectionObserver(e=>{finalVisible=e[0].isIntersecting;updateMobile()},{threshold:.1}).observe(final);
  }
  addEventListener('resize',updateMobile);

  // Structured marketplace data. A WordPress/API payload can replace this array later.
  const wantedRequests=window.heavenGuardianWantedRequests||[
    {
      id:'HG-WR-WOS-2106',game:'Whiteout Survival',status:'open',
      headline:'S1–S50 · 200M+ Power',
      description:'VIP 12+, Furnace 30+, T10/T11, strong SSR lineup and transfer passes.',
      budget:'€500–€900',postedAt:'2026-08-18',
      criteria:[
        {label:'State Group',value:'S1–S50'},{label:'Power',value:'200M+'},
        {label:'VIP',value:'12+'},{label:'Furnace',value:'30+'},
        {label:'Troops',value:'T10 / T11'},{label:'Transfer Passes',value:'Required'}
      ],
      note:'Looking for a younger state-group account with strong VIP, troop tier, heroes and enough transfer flexibility.',
      matchedProductUrl:null
    },
    {
      id:'HG-WR-AO-3188',game:'Albion Online',status:'open',
      headline:'Europe · 1B+ Fame',
      description:'High combat progression, 250M+ Silver and developed islands.',
      budget:'€600–€900',postedAt:'2026-08-16',
      criteria:[
        {label:'Server',value:'Europe'},{label:'Total Fame',value:'1B+'},
        {label:'Silver',value:'250M+'},{label:'Combat Progression',value:'High'},
        {label:'Developed Islands',value:'Required'}
      ],
      note:'Buyer prefers Europe server, meaningful combat progress, developed islands and enough Silver to avoid rebuilding the economy from zero.',
      matchedProductUrl:null
    },
    {
      id:'HG-WR-KS-1042',game:'Kingshot',status:'matched',
      headline:'VIP 11+ · TG 7+',
      description:'T11 preferred, strong SSR lineup and transfer passes.',
      budget:'€700–€1,200',postedAt:'2026-08-14',
      criteria:[
        {label:'VIP',value:'11+'},{label:'Town Center',value:'TG 7+'},
        {label:'Troops',value:'T11 preferred'},{label:'SSR Lineup',value:'Strong'},
        {label:'Transfer Passes',value:'Required'}
      ],
      note:'Buyer requested a transferable Kingshot account with strong progression and enough transfer passes to move safely.',
      matchedProductUrl:null
    },
    {
      id:'HG-WR-COD-4117',game:'Call of Dragons',status:'open',
      headline:'Endgame account',
      description:'Strong heroes, established artifacts and competitive progression.',
      budget:'Fair offer',postedAt:'2026-08-12',
      criteria:[
        {label:'Progression',value:'Endgame'},{label:'Heroes',value:'Strong roster'},
        {label:'Artifacts',value:'Established'},{label:'Competitive Readiness',value:'Required'}
      ],
      note:'Competitive endgame-focused account wanted. Strong hero and artifact quality matters more than cosmetic extras.',
      matchedProductUrl:null
    }
  ];

  const detailModal=document.getElementById('detailModal');
  const detailClose=document.getElementById('detailClose');
  const contactModal=document.getElementById('contactModal');
  const contactClose=document.getElementById('contactClose');
  const contactCancel=document.getElementById('contactCancel');
  const showSold=document.getElementById('showSold');
  const liveCount=document.getElementById('liveCount');
  const requestList=document.querySelector('.request-list');
  const filters=[...document.querySelectorAll('.filter')];
  const copyFeedback=document.getElementById('copyFeedback');
  let activeFilter='all';
  let activeRequest=null;
  let originRow=null;
  let copyFeedbackTimer=0;

  const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  })[char]);
  const dispatchWantedEvent=(name,request)=>{
    window.dispatchEvent(new CustomEvent(name,{detail:{request_id:request.id,game:request.game}}));
  };
  const formatPosted=date=>new Intl.DateTimeFormat('en-US',{
    month:'long',day:'numeric',year:'numeric',timeZone:'UTC'
  }).format(new Date(date+'T00:00:00Z'));
  const requestAge=date=>{
    const posted=new Date(date+'T00:00:00Z');
    const days=Math.max(0,Math.floor((Date.now()-posted.getTime())/86400000));
    if(days===0)return 'Today';
    return days===1?'1d':days+'d';
  };

  function visibleRequests(){
    const requests=wantedRequests.filter(request=>{
      if(activeFilter==='matched')return request.status==='matched';
      if(activeFilter==='open')return request.status==='open';
      const gameMatches=activeFilter==='all'||request.game===activeFilter;
      return gameMatches&&(request.status==='open'||showSold.checked);
    });
    return activeFilter==='matched'?requests:requests.sort((a,b)=>(a.status==='matched')-(b.status==='matched'));
  }

  function renderBoard(){
    const openCount=wantedRequests.filter(request=>request.status==='open').length;
    liveCount.textContent=openCount+' '+(openCount===1?'buyer is':'buyers are')+' looking right now';
    const requests=visibleRequests();
    if(!requests.length){
      requestList.innerHTML='<div class="request-list-empty">No requests match this view.</div>';
      return;
    }
    requestList.innerHTML=requests.map((request,index)=>`
      <div class="request-row" role="button" tabindex="0" style="--row:${index}"
           data-request-id="${escapeHtml(request.id)}" data-status="${escapeHtml(request.status)}"
           aria-label="View ${escapeHtml(request.status)} request ${escapeHtml(request.id)} for ${escapeHtml(request.game)}">
        <div class="request-row-main">
          <span class="status ${request.status==='matched'?'matched':''}">${request.status==='matched'?'Matched':'Open'}</span>
          <span class="game">${escapeHtml(request.game)}</span>
          <span class="criteria"><strong>${escapeHtml(request.headline)}</strong>${escapeHtml(request.description)}<span class="view-details">VIEW DETAILS <span class="arrow">→</span></span></span>
          <span class="budget">${escapeHtml(request.budget)}</span>
          <span class="age">${escapeHtml(requestAge(request.postedAt))}</span>
          ${request.status==='matched'?'<span class="sold-note">✓ A matching account was found for this request.</span>':''}
        </div>
      </div>`).join('');
    requestList.querySelectorAll('.request-row').forEach(row=>{
      const request=wantedRequests.find(item=>item.id===row.dataset.requestId);
      row.addEventListener('click',()=>openDetail(request,row));
      row.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();openDetail(request,row)}
      });
    });
  }

  filters.forEach(button=>{
    button.setAttribute('aria-pressed',String(button.classList.contains('active')));
    button.addEventListener('click',()=>{
    activeFilter=button.dataset.filter;
    filters.forEach(item=>{
      const active=item===button;
      item.classList.toggle('active',active);
      item.setAttribute('aria-pressed',String(active));
    });
    if(activeFilter==='matched')showSold.checked=true;
    renderBoard();
    });
  });
  showSold.addEventListener('change',()=>{
    if(!showSold.checked&&activeFilter==='matched'){
      activeFilter='all';
      filters.forEach(item=>{
        const active=item.dataset.filter==='all';
        item.classList.toggle('active',active);
        item.setAttribute('aria-pressed',String(active));
      });
    }
    renderBoard();
  });

  function getFocusable(dialog){
    return [...dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
      .filter(element=>element.offsetParent!==null);
  }
  function focusDialog(dialog,preferred){
    setTimeout(()=>{(preferred||getFocusable(dialog)[0]||dialog).focus()},reduce?0:180);
  }
  function trapFocus(event,dialog){
    if(event.key!=='Tab')return;
    const focusable=getFocusable(dialog);
    if(!focusable.length){event.preventDefault();dialog.focus();return}
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  }

  function openDetail(request,row){
    if(!request)return;
    activeRequest=request;
    originRow=row;
    const matched=request.status==='matched';
    detailModal.classList.toggle('is-matched',matched);
    detailModal.classList.toggle('has-product',Boolean(request.matchedProductUrl));
    document.getElementById('detailStatus').textContent=matched?'Matched request':'Open request';
    document.getElementById('detailTitle').textContent=request.headline;
    document.getElementById('detailId').textContent=request.id;
    document.getElementById('detailGame').textContent=request.game;
    document.getElementById('detailBudget').textContent=request.budget;
    document.getElementById('detailCriteria').innerHTML=request.criteria.map(item=>
      '<div class="detail-criterion"><span>'+escapeHtml(item.label)+'</span><strong>'+escapeHtml(item.value)+'</strong></div>'
    ).join('');
    document.getElementById('detailNote').textContent=request.note;
    document.getElementById('detailPosted').textContent=formatPosted(request.postedAt);
    const productLink=document.getElementById('matchedProductLink');
    if(request.matchedProductUrl)productLink.href=request.matchedProductUrl;
    else productLink.removeAttribute('href');
    detailModal.querySelector('.detail-scroll').scrollTop=0;
    detailModal.classList.add('open');
    detailModal.setAttribute('aria-hidden','false');
    backdrop.classList.add('open');
    document.body.classList.add('modal-open');
    focusDialog(detailModal,detailClose);
    dispatchWantedEvent(matched?'wanted_request_matched_viewed':'wanted_request_viewed',request);
  }

  function closeDetail({restoreFocus=true}={}){
    detailModal.classList.remove('open');
    detailModal.setAttribute('aria-hidden','true');
    if(!contactModal.classList.contains('open')&&!modal.classList.contains('open')){
      backdrop.classList.remove('open');
      document.body.classList.remove('modal-open');
    }
    if(restoreFocus&&originRow)focusDialog(detailModal,originRow);
  }

  function openContact(){
    if(!activeRequest||activeRequest.status!=='open')return;
    dispatchWantedEvent('wanted_request_seller_cta_clicked',activeRequest);
    document.getElementById('contactRequestId').textContent=activeRequest.id;
    detailModal.classList.remove('open');
    detailModal.setAttribute('aria-hidden','true');
    contactModal.classList.add('open');
    contactModal.setAttribute('aria-hidden','false');
    copyFeedback.classList.remove('show');
    backdrop.classList.add('open');
    focusDialog(contactModal,document.getElementById('copyRequestMessage'));
  }

  function returnToDetail(){
    contactModal.classList.remove('open');
    contactModal.setAttribute('aria-hidden','true');
    detailModal.classList.add('open');
    detailModal.setAttribute('aria-hidden','false');
    focusDialog(detailModal,document.getElementById('sellerCta'));
  }

  function closeContactFlow(){
    contactModal.classList.remove('open');
    contactModal.setAttribute('aria-hidden','true');
    backdrop.classList.remove('open');
    document.body.classList.remove('modal-open');
    if(originRow)focusDialog(contactModal,originRow);
  }

  function requestMessage(request){
    return `Hi heaven_joe,

I have an account that may match this wanted request.

Request ID: ${request.id}
Game: ${request.game}
Budget: ${request.budget}
Target: ${request.headline}

I would like Heaven Guardian to review my account for this buyer request.`;
  }

  async function copyRequestMessage(){
    if(!activeRequest)return;
    const message=requestMessage(activeRequest);
    try{
      let copied=false;
      if(navigator.clipboard&&window.isSecureContext){
        try{await navigator.clipboard.writeText(message);copied=true}catch(error){/* use the DOM fallback below */}
      }
      if(!copied){
        const textarea=document.createElement('textarea');
        textarea.value=message;textarea.setAttribute('readonly','');
        textarea.style.cssText='position:fixed;opacity:0;pointer-events:none';
        document.body.appendChild(textarea);textarea.select();
        copied=document.execCommand('copy');textarea.remove();
      }
      if(!copied)throw new Error('Clipboard copy failed');
      clearTimeout(copyFeedbackTimer);
      copyFeedback.classList.add('show');
      copyFeedbackTimer=setTimeout(()=>copyFeedback.classList.remove('show'),2000);
      dispatchWantedEvent('wanted_request_message_copied',activeRequest);
    }catch(error){
      copyFeedback.textContent='Unable to copy — please try again';
      copyFeedback.classList.add('show');
      clearTimeout(copyFeedbackTimer);
      copyFeedbackTimer=setTimeout(()=>{
        copyFeedback.classList.remove('show');
        copyFeedback.textContent='✓ Request message copied';
      },2000);
    }
  }

  detailClose.addEventListener('click',()=>closeDetail());
  document.getElementById('sellerCta').addEventListener('click',openContact);
  contactClose.addEventListener('click',returnToDetail);
  contactCancel.addEventListener('click',returnToDetail);
  document.getElementById('copyRequestMessage').addEventListener('click',copyRequestMessage);
  document.getElementById('openDiscord').addEventListener('click',()=>{
    if(activeRequest)dispatchWantedEvent('wanted_request_discord_opened',activeRequest);
  });

  backdrop.addEventListener('click',()=>{
    if(contactModal.classList.contains('open'))returnToDetail();
    else if(detailModal.classList.contains('open'))closeDetail();
  });
  addEventListener('keydown',event=>{
    if(contactModal.classList.contains('open')){
      if(event.key==='Escape'){event.preventDefault();returnToDetail()}
      else trapFocus(event,contactModal);
    }else if(detailModal.classList.contains('open')){
      if(event.key==='Escape'){event.preventDefault();closeDetail()}
      else trapFocus(event,detailModal);
    }
  });

  renderBoard();

})();
