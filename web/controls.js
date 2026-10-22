'use strict';
// Native selects remain local value models; only the custom controls receive focus.
window.HudControls=(()=>{
  const widgets=new Map(),ns='http://www.w3.org/2000/svg';
  const labels={
    'preview-scenario':{title:t("PREVIEW SITUATION"),details:{live:['ui-monitor',t("Your session's data")],health:['heart',t("Low health and needs")],fuel:['ui-fuel',t("Low fuel, damaged engine")],radio:['ui-radio',t("Transmitting on channel 12")],night:['ui-contrast',t("Readability in a dark scene")]}},
    'preview-vehicle-kind':{title:t("VEHICLE TYPE"),details:{0:['ui-car',t("Driving on the road")],8:['ui-gauge',t("Motorcycle")],13:['ui-bicycle',t("Speed and stamina")],14:['ui-wave',t("Navigation and nautical speed")],15:['ui-altitude',t("Flight and ground altitude")],16:['ui-altitude',t("Speed and ground altitude")]}},
    'catalog-category':{title:t("FILTER MARKERS"),icons:{'':'ui-map',services:'ui-shield',properties:'ui-pin',activities:'ui-star',vehicles:'ui-car',weapons:'ui-shield',navigation:'ui-map',objects:'ui-inventory',technology:'ui-monitor',people:'ui-voice',missions:'ui-pin'}}
  };
  let hooks={},panel,list,title,counter,opened=null,active=-1,serial=0,closeTimer=null,lastPadAt=0,typeBuffer='',typeAt=0;
  function svg(symbol){const icon=document.createElementNS(ns,'svg'),use=document.createElementNS(ns,'use');icon.classList.add('choice-icon');icon.setAttribute('aria-hidden','true');use.setAttribute('href','#'+symbol);icon.append(use);return icon;}
  function pathIcon(d,className){const icon=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.classList.add(className);path.setAttribute('d',d);icon.append(path);return icon;}
  function options(widget){return [...widget.select.options];}
  function enabled(widget){return options(widget).filter(option=>!option.disabled&&!option.parentElement.disabled);}
  function visible(widget){return !widget.host.hidden&&!widget.trigger.disabled&&widget.trigger.getClientRects().length>0;}
  function metadata(widget,option){const config=labels[widget.select.id]||{};return config.details?.[option?.value]||[config.icons?.[option?.value]||'ui-pin',''];}
  function syncOne(widget){
    const select=widget.select,option=select.options[select.selectedIndex],text=option?.label||t("No choice"),symbol=metadata(widget,option)[0];
    widget.host.hidden=select.hidden;widget.trigger.disabled=select.disabled||enabled(widget).length===0;
    if(widget.text.textContent!==text)widget.text.textContent=text;
    if(widget.icon.firstElementChild.getAttribute('href')!=='#'+symbol)widget.icon.firstElementChild.setAttribute('href','#'+symbol);
    widget.trigger.setAttribute('aria-label',(select.getAttribute('aria-label')||'Choisir')+' : '+text);
    if(opened===widget){
      if(!visible(widget)){close(false);return;}
      for(const row of list.children){const chosen=Number(row.dataset.index)===select.selectedIndex;row.setAttribute('aria-selected',String(chosen));row.classList.toggle('chosen',chosen);}
    }
  }
  function sync(){for(const widget of widgets.values())syncOne(widget);}
  function position(){
    if(!opened)return;
    if(!visible(opened)){close(false);return;}
    const rect=opened.trigger.getBoundingClientRect(),fit=Math.min(innerWidth/1920,innerHeight/1080),unit=Math.max(.55,fit),margin=10*unit;
    const width=Math.min(innerWidth-margin*2,Math.max(rect.width,278*unit)),down=innerHeight-rect.bottom-margin-6*unit,up=rect.top-margin-6*unit;
    const desired=(opened.select.id==='catalog-category'?options(opened).length*38:options(opened).length*52)*unit+82*unit;
    const upwards=down<Math.min(desired,up)&&up>down,space=upwards?up:down;
    panel.style.setProperty('--choice-u',unit+'px');panel.style.width=width+'px';panel.style.maxHeight=Math.max(80,Math.min(480*unit,space))+'px';
    panel.style.left=Math.max(margin,Math.min(innerWidth-width-margin,rect.right-width))+'px';
    panel.style.top=(upwards?Math.max(margin,rect.top-panel.getBoundingClientRect().height-6*unit):rect.bottom+6*unit)+'px';panel.dataset.direction=upwards?'up':'down';
  }
  function setActive(index,scroll=true,sound=true){
    if(!opened)return;
    const option=opened.select.options[index];if(!option||option.disabled||option.parentElement.disabled)return;
    const previous=active;active=index;
    for(const row of list.children)row.classList.toggle('active',Number(row.dataset.index)===index);
    opened.trigger.setAttribute('aria-activedescendant','choice-option-'+index);
    counter.textContent=String(index+1).padStart(2,'0')+' / '+String(opened.select.options.length).padStart(2,'0');
    if(scroll){const row=list.querySelector('[data-index="'+index+'"]');if(row){if(row.offsetTop<list.scrollTop)list.scrollTop=row.offsetTop;else if(row.offsetTop+row.offsetHeight>list.scrollTop+list.clientHeight)list.scrollTop=row.offsetTop+row.offsetHeight-list.clientHeight;}}
    if(sound&&previous!==index)hooks.sound?.('move');
  }
  function move(delta){if(!opened)return;const choices=enabled(opened),index=choices.findIndex(option=>option.index===active);if(choices.length)setActive(choices[((index+delta)%choices.length+choices.length)%choices.length].index);}
  function close(focus=false,sound=false){
    if(!opened)return;
    const widget=opened;opened=null;active=-1;typeBuffer='';serial++;const generation=serial;
    widget.trigger.setAttribute('aria-expanded','false');widget.trigger.removeAttribute('aria-activedescendant');widget.host.classList.remove('expanded');
    panel.setAttribute('aria-hidden','true');panel.style.pointerEvents='none';clearTimeout(closeTimer);
    if(hooks.motionAllowed?.()){
      hooks.animate?.(panel,[{opacity:1,translate:'0 0'},{opacity:0,translate:'0 -3px'}],85);
      closeTimer=setTimeout(()=>{if(generation===serial)panel.hidden=true;},85);
    }else panel.hidden=true;
    if(focus&&visible(widget))widget.trigger.focus({preventScroll:true});if(sound)hooks.sound?.('back');
  }
  function commit(){
    if(!opened||active<0)return;
    const widget=opened,index=active,changed=index!==widget.select.selectedIndex;
    close(true);if(changed){widget.select.selectedIndex=index;widget.select.dispatchEvent(new Event('input',{bubbles:true}));widget.select.dispatchEvent(new Event('change',{bubbles:true}));}
    syncOne(widget);hooks.sound?.('confirm');
  }
  function open(widget,edge){
    syncOne(widget);if(!visible(widget))return;if(opened===widget){close(true);return;}
    close(false);serial++;clearTimeout(closeTimer);opened=widget;active=-1;typeBuffer='';
    panel.hidden=false;panel.setAttribute('aria-hidden','false');panel.style.pointerEvents='auto';widget.host.classList.add('expanded');widget.trigger.setAttribute('aria-expanded','true');
    title.textContent=labels[widget.select.id]?.title||widget.select.getAttribute('aria-label')||t("SELECT");
    list.setAttribute('aria-label',widget.select.getAttribute('aria-label')||'Choix');
    list.replaceChildren(...options(widget).map(option=>{
      const row=document.createElement('div'),copy=document.createElement('span'),name=document.createElement('strong'),[symbol,description]=metadata(widget,option);
      row.className='choice-option';row.id='choice-option-'+option.index;row.dataset.index=option.index;row.setAttribute('role','option');row.setAttribute('aria-disabled',String(option.disabled||!!option.parentElement.disabled));
      name.textContent=option.label;copy.className='choice-copy';copy.append(name);
      if(description){const detail=document.createElement('small');detail.textContent=description;copy.append(detail);}
      row.append(svg(symbol),copy,pathIcon('m5 12 4 4L19 6','choice-check'));
      row.addEventListener('pointermove',()=>{if(active!==option.index)setActive(option.index,false);});
      row.addEventListener('pointerdown',event=>event.preventDefault());
      row.addEventListener('click',()=>{if(option.disabled||option.parentElement.disabled)return;setActive(option.index,false,false);commit();});return row;
    }));
    list.scrollTop=0;syncOne(widget);position();
    const available=enabled(widget),initial=edge==='first'?available[0]?.index:edge==='last'?available[available.length-1]?.index:widget.select.selectedIndex;
    setActive(available.some(option=>option.index===initial)?initial:available[0]?.index,true,false);widget.trigger.focus({preventScroll:true});
    hooks.animate?.(panel,[{opacity:0,translate:panel.dataset.direction==='up'?'0 4px':'0 -4px'},{opacity:1,translate:'0 0'}],135);hooks.sound?.('confirm');
  }
  function triggerFor(id){return widgets.get(typeof id==='string'?id:id?.id)?.trigger||document.getElementById(id);}
  function key(event){
    const widget=[...widgets.values()].find(entry=>entry.trigger===document.activeElement);
    if(!opened){
      if(!widget||!visible(widget)||!['Enter',' ','ArrowDown','ArrowUp','Home','End','F4'].includes(event.key))return false;
      event.preventDefault();if(!event.repeat)open(widget,event.key==='Home'?'first':event.key==='End'?'last':undefined);return true;
    }
    if(event.key==='Tab'){close(false);return false;}
    event.preventDefault();
    if(event.key==='Escape'){close(true,true);return true;}
    if(event.key==='ArrowDown')move(1);else if(event.key==='ArrowUp')move(-1);
    else if(event.key==='Home')setActive(enabled(opened)[0]?.index);
    else if(event.key==='End')setActive(enabled(opened).slice(-1)[0]?.index);
    else if(event.key==='PageDown')move(5);else if(event.key==='PageUp')move(-5);
    else if((event.key==='Enter'||event.key===' ')&&!event.repeat)commit();
    else if(event.key.length===1&&!event.ctrlKey&&!event.altKey&&!event.metaKey){
      const now=performance.now(),normalize=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
      typeBuffer=now-typeAt<700?typeBuffer+event.key:event.key;typeAt=now;
      const repeated=[...typeBuffer].every(char=>char===typeBuffer[0]),prefix=normalize(repeated?typeBuffer[0]:typeBuffer),choices=enabled(opened),offset=choices.findIndex(option=>option.index===active);
      for(let i=1;i<=choices.length;i++){const option=choices[(offset+i)%choices.length];if(normalize(option.label).startsWith(prefix)){setActive(option.index);break;}}
    }
    return true;
  }
  function gamepad(pad,pressed,previous,now){
    const widget=[...widgets.values()].find(entry=>entry.trigger===document.activeElement);
    if(!opened){if(widget&&pressed[0]&&!previous[0]){open(widget);return true;}return false;}
    if(pressed[1]&&!previous[1]){close(true,true);return true;}
    if(pressed[0]&&!previous[0]){commit();return true;}
    if(pressed[3]&&!previous[3]){close(false);return false;}
    if(now-lastPadAt>160){const direction=pressed[13]||pad.axes[1]>.6?1:pressed[12]||pad.axes[1]<-.6?-1:0;if(direction){move(direction);lastPadAt=now;}}
    return true;
  }
  function init(callbacks){
    if(panel)return;hooks=callbacks;
    panel=document.createElement('section');panel.id='hud-choice-panel';panel.className='choice-panel';panel.hidden=true;panel.setAttribute('aria-hidden','true');
    const header=document.createElement('header'),footer=document.createElement('footer');title=document.createElement('span');counter=document.createElement('small');header.append(title,counter);
    list=document.createElement('div');list.id='hud-choice-list';list.className='choice-list';list.setAttribute('role','listbox');footer.textContent=t("↑↓ NAVIGATE · ↵ / A CONFIRM · ESC / B");panel.append(header,list,footer);document.body.append(panel);
    for(const select of document.querySelectorAll('select')){
      const host=document.createElement('span'),trigger=document.createElement('button'),text=document.createElement('span'),icon=svg('ui-pin');
      host.className='custom-choice';host.dataset.control=select.id;trigger.type='button';trigger.className='choice-trigger';trigger.id=select.id+'-trigger';trigger.setAttribute('role','combobox');trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-controls',list.id);trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-autocomplete','none');
      text.className='choice-value';trigger.append(icon,text,pathIcon('m7 10 5 5 5-5','choice-chevron'));host.append(trigger);select.after(host);
      select.dataset.customChoice='true';select.tabIndex=-1;select.setAttribute('aria-hidden','true');
      const widget={select,host,trigger,text,icon};widgets.set(select.id,widget);
      trigger.addEventListener('click',()=>open(widget));select.addEventListener('change',()=>syncOne(widget));
      const observer=new MutationObserver(()=>{syncOne(widget);if(opened===widget){close(false);}});
      observer.observe(select,{attributes:true,attributeFilter:['hidden','disabled','label','value'],childList:true,subtree:true});syncOne(widget);
    }
    document.addEventListener('pointerdown',event=>{if(opened&&!panel.contains(event.target)&&!opened.host.contains(event.target))close(false);},{capture:true});
    document.addEventListener('focusin',event=>{if(opened&&!panel.contains(event.target)&&!opened.host.contains(event.target))close(false);});
    window.addEventListener('resize',()=>close(false));window.addEventListener('blur',()=>close(false));document.addEventListener('visibilitychange',()=>{if(document.hidden)close(false);});
    document.addEventListener('scroll',event=>{if(opened&&!panel.contains(event.target))position();},{capture:true,passive:true});
  }
  return {init,sync,key,gamepad,close,triggerFor};
})();
