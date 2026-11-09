/* M.Sc. Yoga Science study notes — shared page behaviour.
   Works on every paper page and on the hub. All saved state stays in this browser. */
(function(){
  var doc=document.documentElement, body=document.body;
  function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function set(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function $(id){return document.getElementById(id)}

  /* ---------- light / dark switch ---------- */
  var SUN='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.3 4.3l1.6 1.6M18.1 18.1l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.3 19.7l1.6-1.6M18.1 5.9l1.6-1.6"/></svg>';
  var MOON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/></svg>';
  var mq=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):null;
  function theme(){return doc.getAttribute('data-theme')||(mq&&mq.matches?'dark':'light')}
  function paintTheme(){
    var t=theme(), btn=$('themeBtn');
    if(btn){btn.innerHTML=t==='dark'?SUN:MOON;btn.setAttribute('aria-label',t==='dark'?'Switch to light':'Switch to dark');}
    var m=document.querySelector('meta[name="theme-color"]');
    if(m)m.setAttribute('content',t==='dark'?'#0d0f12':'#f4f5f7');
  }
  if($('themeBtn'))$('themeBtn').addEventListener('click',function(){
    var t=theme()==='dark'?'light':'dark';
    doc.setAttribute('data-theme',t);set('msc-theme',t);paintTheme();
  });
  if(mq&&mq.addEventListener)mq.addEventListener('change',paintTheme);
  paintTheme();

  /* ---------- days to the exam ---------- */
  var exam=new Date(body.dataset.exam||'2026-11-25T09:00:00+05:30');
  var days=Math.ceil((exam-new Date())/864e5);
  document.querySelectorAll('[data-days]').forEach(function(el){el.textContent=days>0?days:'0'});

  /* ---------- hub page: show progress of each paper ---------- */
  var prog={};try{prog=JSON.parse(get('msc-progress')||'{}')}catch(e){}
  document.querySelectorAll('[data-prog]').forEach(function(el){
    var p=prog[el.dataset.prog], txt=el.querySelector('.pgt'), bar=el.querySelector('.track i');
    if(!p||!p.all){if(txt)txt.textContent='Not started';return;}
    if(txt)txt.textContent=p.done+' of '+p.all+' learned';
    if(bar)bar.style.width=(p.done/p.all*100)+'%';
  });

  var KEY=body.dataset.key;
  var cards=[].slice.call(document.querySelectorAll('article.card'));
  if(!KEY||!cards.length)return;

  /* ---------- paper page ---------- */
  var store={};try{store=JSON.parse(get(KEY)||'{}')}catch(e){}
  function save(){set(KEY,JSON.stringify(store))}
  function unitNo(c){return c.dataset.u.slice(1)}
  function label(c){return 'Unit '+unitNo(c)+' · '+c.dataset.lab}
  function unitName(u){var s=$(u);return s?(s.dataset.name||''):''}
  function esc(t){return String(t).replace(/[&<>"]/g,function(ch){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]})}

  // the list of points in each unit head
  document.querySelectorAll('.inunit').forEach(function(ul){
    cards.filter(function(c){return c.dataset.u===ul.dataset.list}).forEach(function(c){
      var li=document.createElement('li');
      li.innerHTML='<a href="#'+c.id+'"><span class="tick" data-tick="'+c.id+'">✓</span><span class="lab">'+esc(c.dataset.lab)+'</span><span>'+esc(c.dataset.short)+'</span></a>';
      ul.appendChild(li);
    });
  });

  // the Units sheet (table of contents)
  var units=[];cards.forEach(function(c){if(units.indexOf(c.dataset.u)<0)units.push(c.dataset.u)});
  var list=$('sheetList');
  if(list){
    var h='';
    units.forEach(function(u){
      var cs=cards.filter(function(c){return c.dataset.u===u});
      h+='<div class="uhd"><span>Unit '+u.slice(1)+' · '+esc(unitName(u))+'</span><span data-up="'+u+'"></span></div>';
      cs.forEach(function(c){
        h+='<a href="#'+c.id+'" data-row="'+c.id+'"><span class="tick" data-tick="'+c.id+'">✓</span><span class="lab">'+esc(c.dataset.lab)+'</span><span>'+esc(c.dataset.short)+'</span></a>';
      });
    });
    if($('exam'))h+='<div class="uhd"><span>At the end</span></div><a href="#exam"><span class="lab">List</span><span>Learn these first</span></a>';
    list.innerHTML=h;
  }

  function update(){
    var done=0,first=null;
    cards.forEach(function(c){
      var on=!!store[c.id];c.classList.toggle('done',on);
      var b=c.querySelector('.learn');if(b)b.textContent=on?'Learned':'I learned this';
      document.querySelectorAll('[data-tick="'+c.id+'"]').forEach(function(t){t.classList.toggle('ok',on)});
      var row=document.querySelector('[data-row="'+c.id+'"]');if(row)row.classList.toggle('isdone',on);
      if(on)done++;else if(!first)first=c;
    });
    if($('nDone'))$('nDone').textContent=done;
    if($('nAll'))$('nAll').textContent=cards.length;
    if($('pbar'))$('pbar').style.width=(done/cards.length*100)+'%';
    document.querySelectorAll('[data-up]').forEach(function(el){
      var u=el.dataset.up,cs=cards.filter(function(c){return c.dataset.u===u}),n=cs.filter(function(c){return store[c.id]}).length;
      el.textContent=n+' / '+cs.length;
      var a=el.closest('a');if(a)a.classList.toggle('full',n===cs.length);
    });
    var nb=$('nextBtn'),nt=$('nextTxt');
    if(nb&&nt){
      if(first){nb.href='#'+first.id;nt.textContent='Next: '+label(first);}
      else{nb.href=$('exam')?'#exam':'#top';nt.textContent='All learned · revise';}
    }
    // tell the hub how far this paper is
    var all={};try{all=JSON.parse(get('msc-progress')||'{}')}catch(e){}
    all[KEY]={done:done,all:cards.length};set('msc-progress',JSON.stringify(all));
  }
  cards.forEach(function(c){
    var b=c.querySelector('.learn');
    if(b)b.addEventListener('click',function(){store[c.id]=!store[c.id];save();update();});
  });

  // sheet open / close, and the All / To learn filter
  function openSheet(){body.classList.add('sheet-open');var s=$('sheet');if(s)s.setAttribute('aria-hidden','false');}
  function closeSheet(){body.classList.remove('sheet-open');var s=$('sheet');if(s)s.setAttribute('aria-hidden','true');}
  if($('tocBtn'))$('tocBtn').addEventListener('click',openSheet);
  if($('sheetClose'))$('sheetClose').addEventListener('click',closeSheet);
  if($('scrim'))$('scrim').addEventListener('click',closeSheet);
  if(list)list.addEventListener('click',function(e){if(e.target.closest('a'))closeSheet();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeSheet();});
  var HKEY=KEY+':hide';
  function setHide(on){
    body.classList.toggle('hide-done',on);set(HKEY,on?'1':'0');
    document.querySelectorAll('[data-filter]').forEach(function(b){b.classList.toggle('on',(b.dataset.filter==='todo')===on)});
  }
  document.querySelectorAll('[data-filter]').forEach(function(b){
    b.addEventListener('click',function(){setHide(b.dataset.filter==='todo')});
  });
  setHide(get(HKEY)==='1');

  // "you are here" in the top bar
  var locB=document.querySelector('#loc b'),locS=document.querySelector('#loc span');
  var paper=body.dataset.paper?'Paper '+body.dataset.paper:'';
  function setLoc(el){
    if(!locB||!locS)return;
    if(el.matches('article.card')){locB.textContent=label(el);locS.textContent=el.dataset.short;}
    else if(el.classList.contains('unit')){locB.textContent=paper+' · Unit '+el.id.slice(1);locS.textContent=el.dataset.name||'';}
    else if(el.id==='exam'){locB.textContent=paper;locS.textContent='Learn these first';}
    else{locB.textContent=paper;locS.textContent='Start';}
  }
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)setLoc(e.target)})},{rootMargin:'-70px 0px -72% 0px'});
    document.querySelectorAll('#top,.unit,article.card,#exam').forEach(function(el){io.observe(el)});
  }

  // a drawing wider than the phone: let it scroll sideways instead of shrinking the words
  document.querySelectorAll('figure svg[viewBox]').forEach(function(svg){
    var w=parseFloat((svg.getAttribute('viewBox')||'').split(/[\s,]+/)[2]);
    if(w>420){svg.style.minWidth=Math.round(w*.82)+'px';svg.closest('figure').classList.add('wide');}
  });

  update();
})();
