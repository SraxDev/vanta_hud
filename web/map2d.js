'use strict';
// The legacy preference/callback names are kept by the bridge for saved profiles.
window.HudMap2D=(()=>{
  const $=id=>document.getElementById(id);
  let hooks={},view,overlay,ctx,panel,status,interaction,manifest,gpu,contextLost=false,baseKey='',insetCamera=null;
  let loading=null,loadGeneration=0,available=false,failed=false,reported=null,reporting=false,reportTimer=0,retryAt=0,failures=0,retryTimer=0,frame=0,lastFrame=0,lastSize='',lastQuality='';
  let data={},settings={},flags={},blips=[],route={points:[]},worldAt=0,lastWorld=null,currentNight=null;
  let fullscreen=false,section='places',selected=null,requestBusy=false,distance=1600,zoomGoal=1600,zoomAnchor=null,azimuth=0,follow=true,focus={x:215,y:-810},miniFocus=null,miniHeading=0,drag=null;
  let held=new Set(),padAxes=[0,0,0,0],padZoom=0,placeIndex=0,placesSignature='',lastOverlayHits=[],lastPlaceDraw=0,helpOpen=false;
  const atlases=new Map(),tints=new Map(),titleCache=new Map();
  const nearBlips=new Map();
  let lastMotion=null,lastMotionAt=0,lastClick=null,roadWorker=null,roadPending=false,roadJob=0,roadKey='',roadPlannedKey='',roadOrigin=null,roadAt=0,roadRoute={points:[]};
  let dirtyUntil=0,motionActive=false,pixelScale=1,areaLabels=[],pointer=null,lastPointerWake=0;
  let cameraState=null,renderStats={backend:'atlas2d',calls:0,triangles:0,width:0,height:0,renderMs:0,baseMs:0,overlayMs:0,frames:0,baseDraws:0,tiles:0},placeFilter='all';
  const hiddenCategories=new Set(),categories=[{name:'Police',sprite:60,ids:[60]},{name:t("Hospital"),sprite:61,ids:[61]},{name:'Garage',sprite:357,ids:[72,357,356,359,410,225]},{name:'Commerce',sprite:52,ids:[52,59]},{name:'Banque',sprite:108,ids:[108]},{name:t("Gas station"),sprite:361,ids:[361]}];
  const visibleCategory=b=>!categories.some(c=>hiddenCategories.has(c.sprite)&&c.ids.includes(b.sprite));
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n)),finite=n=>typeof n==='number'&&Number.isFinite(n),lerp=(a,b,t)=>a+(b-a)*t;
  const isMotion=()=>hooks.motionAllowed?.()!==false;
  const quality=()=>({fps:settings.mapQuality==='low'?30:60,miniFps:settings.mapQuality==='low'?30:60,pixel:settings.mapQuality==='low'?1:Math.min(devicePixelRatio||1,settings.mapQuality==='high'?2:1.5),miniPixel:Math.min(2,Math.max(1.5,devicePixelRatio||1))});
  const validWorld=()=>data.world&&[data.world.x,data.world.y,data.world.z].every(finite);
  const textDistance=n=>finite(n)?n<1000?Math.round(n/10)*10+' M':(n/1000).toLocaleString('fr-FR',{maximumFractionDigits:1})+' KM':'—';
  const rawIconName=s=>({60:t("POLICE"),61:t("HOSPITAL"),357:'GARAGE',72:t("REPAIR"),52:t("SHOP"),59:t("SHOP"),108:t("BANK"),361:t("FUEL"),966:t("FISHING"),967:t("MERCHANT"),73:t("CLOTHES"),71:t("BARBER"),110:t("GUN SHOP"),8:t("MARKER"),225:t("DEALERSHIP"),356:'GARAGE',359:t("HANGAR"),410:t("HARBOUR"),569:t("CITY HALL")})[s]||String((window.HudBlipCatalog||[]).find(item=>item.id===s)?.name||t("PLACE")).replace(/^radar_/,'').replaceAll('_',' ').toUpperCase();
  function iconName(sprite){if(!titleCache.has(sprite))titleCache.set(sprite,rawIconName(sprite));return titleCache.get(sprite);}
  function nightTarget(){const hour=finite(data.world?.hour)?clamp(data.world.hour,0,24):Number((data.clock||'12:00').slice(0,2))||0;const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};return 1-smooth(5.5,7.5,hour)*(1-smooth(18.5,20.5,hour));}
  function report(value){
    if(reporting||reported===value)return;reporting=true;
    Promise.resolve(hooks.reportReady?.(value)).then(result=>{if(result?.ok!==true)throw Error(t("No acknowledgement"));reported=value;}).catch(()=>{clearTimeout(reportTimer);reportTimer=setTimeout(()=>{reported=null;report(available);},1200);}).finally(()=>{reporting=false;if(available!==value)report(available);});
  }
  function setStatus(message){status.textContent=message;status.hidden=!message;}
  function schedule(){if(!frame&&!document.hidden)frame=requestAnimationFrame(tick);}
  function wake(){dirtyUntil=performance.now()+180;schedule();}
  function setTextures(style){if(atlases.has(style))return atlases.get(style);const image=new Image();image.onload=wake;image.src='assets/blips/'+style+'.png';atlases.set(style,image);return image;}
  function nearEnough(blip,world){
    if(!blip.short)return true;const d=Math.hypot(blip.x-world.x,blip.y-world.y),was=nearBlips.get(blip.id)===true;
    const visible=d<(was?760:680);nearBlips.set(blip.id,visible);return visible;
  }
  function safePoint(p){return p&&finite(p.x)&&finite(p.y)&&Math.abs(p.x)<=20000&&Math.abs(p.y)<=20000?{x:p.x,y:p.y,z:finite(p.z)?clamp(p.z,-2000,10000):0}:null;}
  function setBlips(value){
    const ids=new Set();blips=[];
    for(const b of Array.isArray(value)?value.slice(0,1024):[]){const p=safePoint(b);if(!p||!Number.isSafeInteger(b.id)||ids.has(b.id)||!Number.isInteger(b.sprite)||b.sprite<0||b.sprite>1023||!finite(b.alpha)||b.alpha<=0||[0,1,7].includes(b.display))continue;
      ids.add(b.id);blips.push({...p,id:b.id,sprite:b.sprite,kind:Number.isInteger(b.kind)?b.kind:4,alpha:clamp(b.alpha,0,255),display:b.display,mini:b.mini===true,full:b.full===true,short:b.short===true,selectable:b.selectable===true,street:typeof b.street==='string'?b.street.slice(0,160):'',colour:Array.isArray(b.colour)&&b.colour.length===3&&b.colour.every(finite)?b.colour.map(n=>Math.round(clamp(n,0,255))):[255,255,255]});
    }
    blips.sort((a,b)=>a.id-b.id);for(const id of nearBlips.keys())if(!ids.has(id))nearBlips.delete(id);
    if(selected?.id&&!blips.some(b=>b.id===selected.id&&b.full&&b.selectable&&visibleCategory(b))){selected=null;}
    if(fullscreen)paintChrome();wake();
  }
  function setRoute(value){const points=Array.isArray(value?.points)?value.points.slice(0,4096).map(safePoint).filter(Boolean):[];route={points,partial:value?.partial===true,destination:safePoint(value?.destination)};updateRoadRoute();wake();}
  function updateRoadRoute(){
    const end=route.destination,start=safePoint(data.world);
    if(!end||!start||(!fullscreen&&!settings.gps)){roadKey='';roadRoute={points:[]};return;}
    if(data.vehicle&&route.points.length>1&&!route.partial){roadKey='';return;}
    const mode=data.vehicle?'vehicle':'foot',key=end.x.toFixed(1)+':'+end.y.toFixed(1)+':'+mode,now=performance.now();
    if(roadKey!==key){roadKey=key;roadRoute={points:[]};roadOrigin=null;roadAt=0;}
    if(roadPending||now-roadAt<700||roadOrigin&&(roadRoute.status==='ready'||now-roadAt<4000)&&Math.hypot(start.x-roadOrigin.x,start.y-roadOrigin.y)<(data.vehicle?25:5))return;
    try{
      if(!roadWorker){roadWorker=new Worker('route-worker.js');roadWorker.onmessage=event=>{const result=event.data;if(result?.id!==roadJob)return;roadPending=false;if(roadPlannedKey===roadKey){roadRoute={points:Array.isArray(result.points)?result.points.slice(0,4096).map(safePoint).filter(Boolean):[],status:result.status};hooks.routeChanged?.();wake();}updateRoadRoute();};roadWorker.onerror=()=>{roadPending=false;roadAt=performance.now()+5000;roadWorker?.terminate();roadWorker=null;};}
      roadPending=true;roadPlannedKey=key;roadOrigin=start;roadAt=now;roadWorker.postMessage({id:++roadJob,start,end,mode});
    }catch(error){roadPending=false;roadAt=now+5000;console.warn(t("[hud-map] Road computation unavailable"));}
  }
  function setMotion(value){
    const p=safePoint(value);if(!p||!finite(value.heading)||!finite(value.cameraHeading)||!finite(value.sampledAt))return;
    if(lastMotion&&value.sampledAt<lastMotion.sampledAt&&lastMotion.sampledAt-value.sampledAt<10000)return;
    lastMotion={...p,heading:value.heading,cameraHeading:value.cameraHeading,sampledAt:value.sampledAt,vx:finite(value.vx)?clamp(value.vx,-400,400):0,vy:finite(value.vy)?clamp(value.vy,-400,400):0,yawRate:finite(value.yawRate)?clamp(value.yawRate,-360,360):0,speed:finite(value.speed)?clamp(value.speed,0,600):data.world?.speed||0};
    lastMotionAt=performance.now();data={...data,world:{...data.world,...lastMotion}};worldAt=lastMotionAt;updateRoadRoute();if(targetViews().length)wake();return lastMotion;
  }
  function navigationMeta(gps){
    if(!gps||!roadKey||roadRoute.points.length<2||!validWorld())return gps;
    const points=roadRoute.points,world=data.world;let at=0,nearest=Infinity;
    for(let i=0;i<Math.min(points.length,180);i++){const d=Math.hypot(points[i].x-world.x,points[i].y-world.y);if(d<nearest){nearest=d;at=i;}}
    let remaining=0,walk=0,direction='continue',turnDistance;
    for(let i=at+1;i<points.length;i++)remaining+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);
    for(let i=at+1;i<Math.min(points.length-1,at+60);i++){const a=points[Math.max(at,i-2)],b=points[i],c=points[Math.min(points.length-1,i+2)],ux=b.x-a.x,uy=b.y-a.y,vx=c.x-b.x,vy=c.y-b.y;walk+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);if(walk>350)break;if(Math.hypot(ux,uy)>5&&Math.hypot(vx,vy)>5){const angle=Math.atan2(ux*vy-uy*vx,ux*vx+uy*vy)*180/Math.PI;if(Math.abs(angle)>40){direction=Math.abs(angle)>140?'uturn':angle>0?'left':'right';turnDistance=Math.round(walk/10)*10;break;}}}
    return {...gps,remaining:Math.round(remaining),direction:remaining<25?'near':direction,turnDistance,nextStreet:undefined,phase:'active',distanceKind:'road-estimate',estimated:true};
  }
  async function ensure(){
    if(available)return true;if(loading)return loading;if(contextLost||performance.now()<retryAt)return false;setStatus(t("Loading…"));
    const generation=++loadGeneration;let renderer=null,manifestTimer;
    loading=(async()=>{try{
      const controller=new AbortController();manifestTimer=setTimeout(()=>controller.abort(),8000);
      const response=await fetch('assets/map-atlas/atlas.json',{signal:controller.signal});if(!response.ok)throw Error(t("Atlas missing"));manifest=await response.json();clearTimeout(manifestTimer);
      if(manifest.version!==1||manifest.size!==8192||manifest.grid!==8||manifest.tileSize!==1024||manifest.gutter!==2||manifest.overview!=='overview.webp'||!Array.isArray(manifest.tiles)||manifest.tiles.length!==64||new Set(manifest.tiles).size!==64||manifest.tiles.some(p=>typeof p!=='string'||!/^([0-7])-([0-7])\.webp$/.test(p))||!manifest.transform||!['scaleX','scaleY','offsetX','offsetY'].every(key=>finite(manifest.transform[key]))||manifest.transform.scaleX<.00001||manifest.transform.scaleX>.001||manifest.transform.scaleY>-.00001||manifest.transform.scaleY<-.001||Math.abs(manifest.transform.offsetX)>2||Math.abs(manifest.transform.offsetY)>2)throw Error(t("Invalid atlas"));
      if(generation!==loadGeneration||contextLost)return false;
      areaLabels=[];renderer=new HudAtlasMap(view,manifest,()=>{baseKey='';wake();});gpu=renderer;await renderer.init();if(generation!==loadGeneration||contextLost){renderer.destroy();return false;}available=true;failed=false;failures=0;retryAt=0;baseKey='';setStatus('');wake();return true;
    }catch(error){renderer?.destroy();if(generation!==loadGeneration)return false;failed=true;available=false;gpu=null;retryAt=performance.now()+Math.min(60000,2000*2**Math.min(failures++,5));clearTimeout(retryTimer);retryTimer=setTimeout(wake,retryAt-performance.now()+20);console.error('[hud-map2d]',error);setStatus(t("Map unavailable · retrying…"));report(false);view.hidden=overlay.hidden=true;return false;}finally{clearTimeout(manifestTimer);if(generation===loadGeneration)loading=null;}})();return loading;
  }
  function rectFor(element){if(!element||!element.getClientRects().length)return null;const r=element.getBoundingClientRect();return r.width>2&&r.height>2?{x:r.left,y:r.top,width:r.width,height:r.height}:null;}
  function targetViews(){if(fullscreen)return [{full:true,rect:{x:0,y:0,width:innerWidth,height:innerHeight}}];if(!settings.map3d||!validWorld())return [];if(flags.settings&&!flags.editing){const rect=rectFor(document.querySelector('#settings-preview .minimap'));return rect?[{rect,preview:true}]:[];}if(data.visible&&data.mapVisible&&!data.bigmap&&!data.world.nativeRadar&&!flags.menu||flags.editing&&data.visible&&!data.world.nativeRadar){const rect=rectFor($('map-frame'));return rect?[{rect}]:[];}return [];}
  function resize(rect){const q=quality(),pixel=Math.min(fullscreen?q.pixel:q.miniPixel,Math.sqrt(8400000/(rect.width*rect.height)));const key=[rect.x,rect.y,rect.width,rect.height,pixel].join(':');if(key===lastSize)return;lastSize=key;pixelScale=pixel;for(const canvas of [view,overlay]){Object.assign(canvas.style,{left:rect.x+'px',top:rect.y+'px',width:rect.width+'px',height:rect.height+'px',right:'auto',bottom:'auto'});canvas.width=Math.ceil(rect.width*pixel);canvas.height=Math.ceil(rect.height*pixel);}ctx.setTransform(pixel,0,0,pixel,-rect.x*pixel,-rect.y*pixel);renderStats.width=view.width;renderStats.height=view.height;baseKey='';}
  function updateCamera(target,dt){const world=data.world||{x:215,y:-810,z:31,heading:0},age=clamp((performance.now()-worldAt)/1000,0,.08),player={x:world.x+(world.vx||0)*age,y:world.y+(world.vy||0)*age};if(!miniFocus)miniFocus={...player};motionActive=Math.hypot(miniFocus.x-player.x,miniFocus.y-player.y)>.02;const smooth=1-Math.exp(-dt*18);for(const axis of ['x','y'])miniFocus[axis]=lerp(miniFocus[axis],player[axis],smooth);const heading=((finite(world.cameraHeading)?world.cameraHeading:world.heading||0)+(world.yawRate||0)*(lastMotion?clamp((performance.now()-lastMotionAt)/1000,0,.04):Math.min(age,.04)))*Math.PI/180,difference=Math.atan2(Math.sin(heading-miniHeading),Math.cos(heading-miniHeading));miniHeading+=difference*smooth;motionActive=motionActive||Math.abs(difference)>.0005;
    if(follow){motionActive=motionActive||Math.hypot(focus.x-player.x,focus.y-player.y)>.05;for(const axis of ['x','y'])focus[axis]=lerp(focus[axis],player[axis],isMotion()?1-Math.exp(-dt*8):1);}
    if(target.full){const panX=(held.has('ArrowRight')?1:0)-(held.has('ArrowLeft')?1:0)+padAxes[0],panY=(held.has('ArrowDown')?1:0)-(held.has('ArrowUp')?1:0)+padAxes[1];if(panX||panY){pan(panX*dt*300,panY*dt*300,target.rect.height);follow=false;}azimuth+=((held.has('e')?1:0)-(held.has('q')?1:0)+padAxes[2])*dt*1.2;if(padZoom)zoom(Math.exp(padZoom*dt));const before=distance;distance=isMotion()?Math.exp(lerp(Math.log(distance),Math.log(zoomGoal),1-Math.exp(-dt*18))):zoomGoal;if(Math.abs(Math.log(distance/zoomGoal))<.0002)distance=zoomGoal;motionActive=motionActive||distance!==zoomGoal;const camera={cx:focus.x,cy:focus.y,rotation:azimuth,mpp:distance*.9/target.rect.height,rect:target.rect};if(zoomAnchor&&before!==distance){const after=unproject(zoomAnchor.screen.x,zoomAnchor.screen.y,camera);focus.x+=zoomAnchor.world.x-after.x;focus.y+=zoomAnchor.world.y-after.y;camera.cx=focus.x;camera.cy=focus.y;}if(distance===zoomGoal)zoomAnchor=null;return camera;}
    return {cx:miniFocus.x-Math.sin(miniHeading)*35,cy:miniFocus.y+Math.cos(miniHeading)*35,rotation:miniHeading,mpp:(280+clamp(world.speed||0,0,65)*2)/target.rect.height,rect:target.rect};
  }
  function project(p,camera,rect=camera.rect){const dx=(p.x-camera.cx)/camera.mpp,dy=-(p.y-camera.cy)/camera.mpp,c=Math.cos(camera.rotation),s=Math.sin(camera.rotation);return {x:rect.x+rect.width/2+dx*c-dy*s,y:rect.y+rect.height/2+dx*s+dy*c};}
  function unproject(x,y,camera){const r=camera.rect,dx=(x-r.x-r.width/2)*camera.mpp,dy=(y-r.y-r.height/2)*camera.mpp,c=Math.cos(camera.rotation),s=Math.sin(camera.rotation);return {x:camera.cx+dx*c+dy*s,y:camera.cy+dx*s-dy*c,z:0};}
  function visibleBounds(camera){const r=camera.rect,corners=[[r.x,r.y],[r.x+r.width,r.y],[r.x,r.y+r.height],[r.x+r.width,r.y+r.height]].map(p=>unproject(...p,camera));return {x0:Math.min(...corners.map(p=>p.x)),x1:Math.max(...corners.map(p=>p.x)),y0:Math.min(...corners.map(p=>p.y)),y1:Math.max(...corners.map(p=>p.y))};}
  function detailCamera(camera){
    const show=fullscreen&&camera.mpp>5.5&&innerWidth>=1100&&validWorld();
    $('map3d-detail').hidden=!show;panel.classList.toggle('has-detail',show);
    if(!show)return null;const rect=rectFor($('map3d-detail'));if(!rect)return null;
    return {cx:data.world.x,cy:data.world.y,rotation:0,mpp:3.2,rect};
  }
  function drawBase(camera,night){insetCamera=detailCamera(camera);const key=[camera.cx.toFixed(3),camera.cy.toFixed(3),camera.rotation.toFixed(6),camera.mpp.toFixed(6),view.width,view.height,night.toFixed(4),settings.mapQuality,insetCamera?.cx,insetCamera?.cy].join(':');if(key===baseKey)return;const stats=gpu.draw(camera,night,visibleBounds(camera),settings.mapQuality,insetCamera);baseKey=key;renderStats.calls=stats.calls;renderStats.triangles=stats.triangles;renderStats.baseDraws++;}
  function tick(now){frame=0;const views=targetViews();if(!views.length){view.hidden=overlay.hidden=true;lastFrame=0;return;}if(!available){ensure();return;}const q=quality(),fps=fullscreen?q.fps:q.miniFps;if(lastFrame&&now-lastFrame<1000/fps-1){schedule();return;}const dt=clamp((now-(lastFrame||now-16))/1000,.001,.25);lastFrame=now;
    try{const started=performance.now(),target=views[0],rect=target.rect;resize(rect);view.hidden=overlay.hidden=false;const goal=nightTarget();if(currentNight===null)currentNight=goal;currentNight=lerp(currentNight,goal,isMotion()?1-Math.exp(-dt*3):1);cameraState=updateCamera(target,dt);const baseStart=performance.now();drawBase(cameraState,currentNight);renderStats.baseMs=performance.now()-baseStart;const overlayStart=performance.now();ctx.clearRect(rect.x,rect.y,rect.width,rect.height);drawOverlay(target,cameraState,currentNight);if(insetCamera){ctx.clearRect(insetCamera.rect.x,insetCamera.rect.y,insetCamera.rect.width,insetCamera.rect.height);drawOverlay({rect:insetCamera.rect,detail:true},insetCamera,currentNight);}renderStats.overlayMs=performance.now()-overlayStart;renderStats.renderMs=performance.now()-started;renderStats.frames++;if(!reported)report(true);if(fullscreen&&now-lastPlaceDraw>500){paintChrome();lastPlaceDraw=now;}
    }catch(error){failed=true;available=false;gpu?.destroy();gpu=null;baseKey='';retryAt=performance.now()+3000;clearTimeout(retryTimer);retryTimer=setTimeout(wake,3050);report(false);view.hidden=overlay.hidden=true;setStatus(t("Map unavailable · retrying…"));console.error('[hud-map2d]',error);return;}
    const goal=nightTarget();if(now<dirtyUntil||motionActive||Math.abs(currentNight-goal)>.003||held.size||padAxes.some(n=>n!==0)||padZoom||drag)schedule();else lastFrame=0;
  }
  function pan(dx,dy,height=innerHeight){const factor=distance*.9/height,c=Math.cos(azimuth),s=Math.sin(azimuth);focus.x-=factor*(dx*c+dy*s);focus.y+=factor*(-dx*s+dy*c);focus.x=clamp(focus.x,-6000,6500);focus.y=clamp(focus.y,-5000,10000);}
  function zoom(factor,screen){zoomGoal=clamp(zoomGoal*factor,Math.max(850,innerHeight*1.1),18000);if(screen&&cameraState){zoomAnchor={screen,world:unproject(screen.x,screen.y,cameraState)};follow=false;}wake();}
  function centre(){if(!validWorld())return;follow=true;focus={x:data.world.x,y:data.world.y};distance=zoomGoal=1600;zoomAnchor=null;azimuth=0;wake();hooks.sound?.('confirm');}
  function overview(){follow=false;focus={x:-150,y:2100};distance=zoomGoal=13700;zoomAnchor=null;azimuth=0;wake();}
  function pick(x,y){if(!available||!cameraState)return;const r=insetCamera?.rect,inDetail=r&&x>=r.x&&y>=r.y&&x<=r.x+r.width&&y<=r.y+r.height,camera=inDetail?insetCamera:cameraState,hits=inDetail?blips.filter(b=>b.full&&b.selectable&&visibleCategory(b)).map(blip=>({...project(blip,camera),blip})):lastOverlayHits;const nearest=hits.filter(hit=>hit.blip.selectable).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];if(nearest&&Math.hypot(nearest.x-x,nearest.y-y)<20){selectPlace(nearest.blip);return;}const pos=unproject(x,y,camera);if(pos.x< -5500||pos.x>5500||pos.y< -5000||pos.y>8500){selected=null;return;}selected={...pos,name:t("CUSTOM MARKER")};paintChrome();wake();hooks.sound?.('confirm');}

  function tintedSprite(atlas,sprite,colour){
    const key=settings.blipStyle+':'+sprite+':'+colour.join(',');if(tints.has(key))return tints.get(key);
    const canvas=document.createElement('canvas');canvas.width=canvas.height=32;const c=canvas.getContext('2d');c.drawImage(atlas,(sprite%32)*32,Math.floor(sprite/32)*32,32,32,0,0,32,32);c.globalCompositeOperation='multiply';c.fillStyle='rgb('+colour.join(',')+')';c.fillRect(0,0,32,32);c.globalCompositeOperation='destination-in';c.drawImage(atlas,(sprite%32)*32,Math.floor(sprite/32)*32,32,32,0,0,32,32);
    if(tints.size>256)tints.delete(tints.keys().next().value);tints.set(key,canvas);return canvas;
  }
  function drawOverlay(target,camera,night){
    const rect=target.rect;ctx.save();ctx.beginPath();ctx.rect(rect.x,rect.y,rect.width,rect.height);ctx.clip();
    const scale=target.full?Math.min(innerWidth/1920,innerHeight/1080):Math.max(.7,rect.width/280),atlas=setTextures(settings.blipStyle||'classic');
    ctx.lineJoin=ctx.lineCap='round';
      if(target.full){const occupiedLabels=[];ctx.font='600 '+Math.max(10,12*scale)+'px Segoe UI';ctx.textAlign='center';ctx.textBaseline='middle';for(const label of areaLabels){if(camera.mpp<(label.minMpp||0)||camera.mpp>(label.maxMpp||100))continue;const p=project(label,camera,rect);if(!p||p.x<120||p.y<110||p.x>innerWidth-130||p.y>innerHeight-80)continue;if(occupiedLabels.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<130*scale))continue;occupiedLabels.push(p);ctx.lineWidth=3*scale;ctx.strokeStyle=night>.5?'#10252bde':'#d2dddad9';ctx.fillStyle=night>.5?'#b3ccce':'#274248';ctx.strokeText(label.name,p.x,p.y);ctx.fillText(label.name,p.x,p.y);}}
    const path=roadKey&&roadRoute.points.length>1?roadRoute.points:route.points||[];let startIndex=0,firstPoint=null;
    if(!target.full&&validWorld()){let closest=80*80;for(let i=0;i<Math.min(path.length-1,120);i++){const a=path[i],b=path[i+1],dx=b.x-a.x,dy=b.y-a.y,t=clamp(((data.world.x-a.x)*dx+(data.world.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1),x=a.x+t*dx,y=a.y+t*dy,d=(x-data.world.x)**2+(y-data.world.y)**2;if(d<closest){closest=d;startIndex=i+1;firstPoint={x,y,z:0};}}}
    let drawing=false;ctx.beginPath();if(firstPoint){const xy=project(firstPoint,camera,rect);ctx.moveTo(xy.x,xy.y);drawing=true;}for(let i=startIndex;i<path.length;i++){const xy=project(path[i],camera,rect);if(drawing)ctx.lineTo(xy.x,xy.y);else{ctx.moveTo(xy.x,xy.y);drawing=true;}}
    ctx.strokeStyle=night>.5?'#071b24':'#0b273b';ctx.lineWidth=(target.full?8:5)*scale;ctx.stroke();ctx.strokeStyle='#27dcec';ctx.lineWidth=(target.full?4:2.7)*scale;ctx.stroke();
    const world=data.world||{},hits=[];
    const visible=blips.filter(b=>visibleCategory(b)&&(target.full||target.detail?b.full:b.mini)&&b.kind!==7&&(target.full||target.detail||nearEnough(b,world)));
    if(atlas.complete&&atlas.naturalWidth){for(const b of visible){
      if(b.sprite===6||b.sprite===7||b.sprite===8||b.sprite<0||b.sprite>1023)continue;
      const xy=project({...b,z:b.z+5},camera,rect);if(!xy||xy.x<rect.x+9||xy.x>rect.x+rect.width-9||xy.y<rect.y+9||xy.y>rect.y+rect.height-9)continue;
      const size=(target.full?28:21)*scale;ctx.globalAlpha=b.alpha/255;
      if(b.kind!==4&&b.colour&&b.colour.some(n=>n<235)){ctx.drawImage(tintedSprite(atlas,b.sprite,b.colour),xy.x-size/2,xy.y-size/2,size,size);}else ctx.drawImage(atlas,(b.sprite%32)*32,Math.floor(b.sprite/32)*32,32,32,xy.x-size/2,xy.y-size/2,size,size);
      hits.push({x:xy.x,y:xy.y,blip:b});
    }}
    ctx.globalAlpha=1;if(target.full){

      lastOverlayHits=hits;let hover=null;if(pointer&&!drag){let best=20;for(const hit of hits){const d=Math.hypot(hit.x-pointer.x,hit.y-pointer.y);if(d<best){best=d;hover=hit;}}}
      const label=$('map3d-hover');label.hidden=!hover;if(hover){label.textContent=iconName(hover.blip.sprite);label.style.left=clamp(hover.x+16,12,innerWidth-190)+'px';label.style.top=clamp(hover.y-24,85,innerHeight-50)+'px';}
      const metres=distance*.9/rect.height,ideal=metres*100,power=10**Math.floor(Math.log10(ideal)),step=[1,2,5,10].map(n=>n*power).find(n=>n>=ideal)||power*10;
      $('map3d-scale').querySelector('i').style.width=(step/metres)+'px';$('map3d-scale').querySelector('span').textContent='≈ '+textDistance(step);
    }else{
      const x=rect.x+rect.width-16,y=rect.y+16;ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.arc(0,0,11,0,Math.PI*2);ctx.fillStyle='#071821e6';ctx.fill();ctx.rotate(miniHeading);ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(4,3);ctx.lineTo(0,1);ctx.lineTo(-4,3);ctx.closePath();ctx.fillStyle='#effbf4';ctx.fill();ctx.restore();
    }
    const destination=selected||route.destination;if(destination){const xy=project({...destination,z:destination.z+7},camera,rect);if(xy){ctx.beginPath();ctx.arc(xy.x,xy.y,9*scale,0,Math.PI*2);ctx.strokeStyle='#e4f8f2';ctx.lineWidth=2*scale;ctx.stroke();ctx.fillStyle='#21cbdc';ctx.fill();}}
    if(validWorld()){
      const origin=project({...world,z:world.z+6},camera,rect),heading=(world.heading||0)*Math.PI/180,forward=project({x:world.x-Math.sin(heading)*12,y:world.y+Math.cos(heading)*12,z:world.z+6},camera,rect);
      if(origin&&forward){ctx.save();ctx.translate(origin.x,origin.y);ctx.rotate(Math.atan2(forward.y-origin.y,forward.x-origin.x)+Math.PI/2);ctx.beginPath();ctx.moveTo(0,-11*scale);ctx.lineTo(8*scale,9*scale);ctx.lineTo(0,5*scale);ctx.lineTo(-8*scale,9*scale);ctx.closePath();ctx.lineWidth=3*scale;ctx.strokeStyle='#07171e';ctx.stroke();ctx.fillStyle='#f2f7ef';ctx.fill();ctx.restore();}
    }
    ctx.restore();
  }
  function selectPlace(blip){selected={...blip,name:iconName(blip.sprite)};paintChrome();wake();hooks.sound?.('confirm');}
  let navigateAgain=false;
  async function navigate(){
    if(!selected)return;
    if(requestBusy){navigateAgain=true;return;} // A new click during a request is replayed, not lost.
    requestBusy=true;paintChrome();
    try{
      const response=await Promise.race([hooks.waypoint?.({x:selected.x,y:selected.y}),new Promise((_,reject)=>setTimeout(()=>reject(Error(t("The game is not responding."))),4000))]);
      if(!response?.ok)throw Error(response?.error||t("Could not set the marker."));hooks.notice?.(t("The marker has been set on the GPS."),'success');
    }
    catch(error){hooks.notice?.(error.message,'error');}
    finally{requestBusy=false;paintChrome();if(navigateAgain){navigateAgain=false;navigate();}}
  }
  function paintChrome(){
    const wide=cameraState?.mpp>5.5;
    $('map3d-street').textContent=wide?'SAN ANDREAS':data.street||'SAN ANDREAS';$('map3d-clock').textContent=wide?t("Overview"):data.zone||data.clock||'';
    $('map3d-north').querySelector('svg').style.transform='rotate('+(azimuth*180/Math.PI)+'deg)';
    $('map3d-clear').disabled=(!route.destination&&!data.gps)||requestBusy;
    $('map3d-places').hidden=false;paintPlaces();
    document.querySelectorAll('#map3d-place-list button').forEach(button=>button.setAttribute('aria-current',String(Number(button.dataset.id)===selected?.id)));
  }
  function paintPlaces(){
    const query=$('map3d-search').value.trim().toLocaleLowerCase('fr').slice(0,80);
    const filters={services:[60,61,108,569],shops:[52,59,73,71,110,361],transport:[72,357,356,359,410,225]};
    const items=blips.filter(b=>visibleCategory(b)&&(placeFilter==='all'||filters[placeFilter]?.includes(b.sprite))&&b.full&&b.selectable&&b.kind===4&&b.sprite!==8&&(iconName(b.sprite)+' '+(b.street||'')).toLocaleLowerCase('fr').includes(query)).sort((a,b)=>Math.hypot(a.x-(data.world?.x||0),a.y-(data.world?.y||0))-Math.hypot(b.x-(data.world?.x||0),b.y-(data.world?.y||0))||a.id-b.id).slice(0,120);
    const signature=query+':'+placeFilter+':'+items.map(b=>b.id+':'+b.sprite).join(',')+':'+settings.blipStyle;if(signature===placesSignature)return;placesSignature=signature;
    $('map3d-place-count').textContent=String(items.length);
    $('map3d-place-list').replaceChildren(...items.map(blip=>{
      const button=document.createElement('button');button.dataset.id=String(blip.id);const icon=document.createElement('i'),copy=document.createElement('span'),label=document.createElement('strong'),detail=document.createElement('small');
      icon.style.backgroundImage='url("assets/blips/'+settings.blipStyle+'.png")';icon.style.backgroundPosition=-(blip.sprite%32)*32+'px '+(-Math.floor(blip.sprite/32)*32)+'px';label.textContent=iconName(blip.sprite);detail.textContent=blip.street||textDistance(Math.hypot(blip.x-(data.world?.x||0),blip.y-(data.world?.y||0)));copy.append(label,detail);button.append(icon,copy);button.addEventListener('click',()=>{const latest=blips.find(item=>item.id===blip.id);if(latest){selectPlace(latest);navigate();focus={x:latest.x,y:latest.y};follow=false;distance=zoomGoal=1600;zoomAnchor=null;wake();}});return button;
    }));
    if(!items.length){const empty=document.createElement('p');empty.textContent=t("No place");$('map3d-place-list').append(empty);}
  }
  function setSection(){section='places';helpOpen=false;$('map3d-help').hidden=true;$('map3d-places').hidden=false;$('map3d-search').focus();hooks.sound?.('move');}
  function setFullscreen(open){
    fullscreen=open===true;panel.hidden=!fullscreen;document.body.classList.toggle('map3d-open',fullscreen);view.style.zIndex=fullscreen?'15':'2';overlay.style.zIndex=fullscreen?'16':'3';
    held.clear();padAxes=[0,0,0,0];padZoom=0;drag=null;lastClick=null;selected=null;section='map';helpOpen=false;$('map3d-help').hidden=true;pointer=null;$('map3d-hover').hidden=true;lastSize='';baseKey='';lastFrame=0;zoomAnchor=null;zoomGoal=distance;
    if(fullscreen){overview();paintChrome();ensure();wake();$('map3d-close').focus({preventScroll:true});hooks.animate?.(panel,[{opacity:0},{opacity:1}],160);}else{view.hidden=overlay.hidden=true;wake();}
  }
  function key(event){
    if(!fullscreen)return false;
    if(event.key==='Escape'){event.preventDefault();if(helpOpen){helpOpen=false;$('map3d-help').hidden=true;}else hooks.closeMap?.();return true;}
    if(event.key==='Tab'){
      const nodes=[...panel.querySelectorAll('button:not(:disabled),input')].filter(element=>element.getClientRects().length),index=nodes.indexOf(document.activeElement);event.preventDefault();nodes[(index+(event.shiftKey?-1:1)+nodes.length)%nodes.length]?.focus();return true;
    }
    if(event.target instanceof HTMLInputElement)return true;
    const value=event.key.toLowerCase();
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','q','e'].includes(event.key)||['q','e'].includes(value)){event.preventDefault();held.add(event.key.startsWith('Arrow')?event.key:value);wake();}
    else if(value==='+'||value==='='){event.preventDefault();zoom(.84);}else if(value==='-'){event.preventDefault();zoom(1.18);}
    else if(event.key==='Home'){event.preventDefault();centre();}
    else if(event.key==='Enter'&&event.target.tagName!=='BUTTON'){event.preventDefault();navigate();}
    return true;
  }
  function gamepad(pad,pressed,previous){
    if(!fullscreen)return false;
    const axis=index=>Math.abs(pad.axes[index]||0)>.15?pad.axes[index]:0;padAxes=[axis(0),axis(1),axis(2),0];padZoom=(pressed[6]?1:0)-(pressed[7]?1:0);if(padAxes.some(Boolean)||padZoom)wake();
    if(pressed[1]&&!previous[1]){hooks.closeMap?.();}
    if(pressed[0]&&!previous[0]){if(section==='places'&&document.activeElement.closest('#map3d-place-list'))document.activeElement.click();else pick(innerWidth/2,innerHeight/2);}
    if(pressed[2]&&!previous[2])centre();if(pressed[3]&&!previous[3])navigate();
    if(pressed[4]&&!previous[4]||pressed[5]&&!previous[5])setSection();
    if(section==='places'&&(pressed[12]&&!previous[12]||pressed[13]&&!previous[13])){const nodes=[...$('map3d-place-list').querySelectorAll('button')];if(nodes.length){placeIndex=(placeIndex+(pressed[13]?1:nodes.length-1))%nodes.length;nodes[placeIndex].focus();nodes[placeIndex].scrollIntoView({block:'nearest'});}}
    return true;
  }
  function update(nextData,nextSettings,nextFlags){
    data=nextData||{};if(lastMotion&&data.world){const previous=data.world;data={...data,world:{...previous,cameraHeading:lastMotion.cameraHeading,yawRate:lastMotion.yawRate,...(finite(previous.sampledAt)&&lastMotion.sampledAt>previous.sampledAt?lastMotion:{})}};}settings={...nextSettings,mapTheme:'auto'};if(!['classic','cyan','rp'].includes(settings.blipStyle))settings.blipStyle='classic';flags=nextFlags||{};
    const worldChanged=!lastWorld||!data.world||['x','y','z','heading','hour','vx','vy','nativeRadar','supported'].some(key=>lastWorld[key]!==data.world[key]);
    if(worldChanged){lastWorld=data.world;worldAt=lastMotion&&data.world?.sampledAt===lastMotion.sampledAt?lastMotionAt:performance.now();}
    const nextQuality=[data.visible,data.mapVisible,data.bigmap,settings.map3d,settings.blipStyle,settings.mapQuality,settings.mapTheme,settings.scale,settings.offsetX,settings.offsetY,flags.settings,flags.editing,flags.menu,flags.scenario].join(':');if(lastQuality!==nextQuality){lastQuality=nextQuality;worldChanged||wake();}
    updateRoadRoute();setTextures(settings.blipStyle||'classic');if(!settings.map3d&&!fullscreen)report(false);
    if(targetViews().length){ensure();if(worldChanged)wake();}else if(view){view.hidden=overlay.hidden=true;}
  }
  function init(callbacks){
    if(panel)return;hooks=callbacks;view=document.createElement('canvas');view.id='map3d-view';view.hidden=true;overlay=document.createElement('canvas');overlay.id='map3d-markers';overlay.hidden=true;ctx=overlay.getContext('2d');
    panel=document.createElement('section');panel.id='map3d-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',t("Map of San Andreas"));
    panel.innerHTML="<div id=\"map3d-interaction\" aria-hidden=\"true\"></div><div class=\"map3d-address\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"m3 5 6-2 6 3 6-2v15l-6 2-6-3-6 2zM9 3v15M15 6v15\"/></svg><div><strong id=\"map3d-street\"></strong><time id=\"map3d-clock\"></time></div></div>\n<header class=\"map3d-top\"><nav aria-label=\"Map\"><button  aria-label=\"Places\" data-tip=\"Places\" data-map-section=\"places\" aria-selected=\"true\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"10.5\" cy=\"10.5\" r=\"6.5\"/><path d=\"m16 16 5 5\"/></svg></button></nav><button id=\"map3d-help-toggle\" aria-label=\"Controls\" data-tip=\"Controls\" ><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M9.5 9a2.5 2.5 0 1 1 4.4 1.6c-1.4 1-1.9 1.4-1.9 3.4M12 17h.01\"/></svg></button><button id=\"map3d-close\" aria-label=\"Back · Esc\" data-tip=\"Back · Esc\" ><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"m6 6 12 12M18 6 6 18\"/></svg></button></header>\n<p id=\"map3d-status\" role=\"status\"></p><div id=\"map3d-hover\" hidden></div>\n<aside id=\"map3d-places\" hidden><header><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z\"/><circle cx=\"12\" cy=\"10\" r=\"2.5\"/></svg><strong>Places</strong><small id=\"map3d-place-count\"></small></header><div class=\"map3d-search-wrap\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"10.5\" cy=\"10.5\" r=\"6.5\"/><path d=\"m16 16 5 5\"/></svg><input id=\"map3d-search\" aria-label=\"Search for a place\" placeholder=\"Search\" autocomplete=\"off\" spellcheck=\"false\"></div><nav class=\"map3d-filters\" aria-label=\"Place types\"><button  aria-label=\"All\" data-tip=\"All\" data-place-filter=\"all\" aria-pressed=\"true\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5\"/></svg></button><button  aria-label=\"Services\" data-tip=\"Services\" data-place-filter=\"services\" aria-pressed=\"false\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z\"/></svg></button><button  aria-label=\"Shops\" data-tip=\"Shops\" data-place-filter=\"shops\" aria-pressed=\"false\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M5 8h14l1 13H4L5 8Zm3 0V6a4 4 0 0 1 8 0v2\"/></svg></button><button  aria-label=\"Vehicles\" data-tip=\"Vehicles\" data-place-filter=\"transport\" aria-pressed=\"false\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"m5 7 2-4h10l2 4 2 3v8H3v-8l2-3Zm0 0h14M3 12h18M6 18v3m12-3v3M6 15h2m8 0h2\"/></svg></button></nav><div id=\"map3d-place-list\"></div></aside>\n\n<aside id=\"map3d-help\" hidden><div><kbd>Click</kbd><span>Set GPS</span></div><div><kbd>↔ ↕</kbd><span>Move</span></div><div><kbd>Q E</kbd><span>Rotate</span></div><div><kbd>+ −</kbd><span>Zoom</span></div><div class=\"map3d-help-pad\">Sticks · Move / Rotate<br>LT RT · Zoom · A · Marker · Y · Guide</div></aside>\n<footer class=\"map3d-bottom\"><div id=\"map3d-scale\" aria-label=\"Approximate scale\"><i></i><span></span></div></footer>\n<nav class=\"map3d-tools\" aria-label=\"Map view\"><button id=\"map3d-north\" aria-label=\"Face north\" data-tip=\"North\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"m12 3 7 17-7-4-7 4Z\"/></svg><small>N</small></button><div class=\"map3d-zoom\"><button id=\"map3d-zoom-in\" aria-label=\"Zoom in\" data-tip=\"Zoom +\">+</button><button id=\"map3d-zoom-out\" aria-label=\"Zoom out\" data-tip=\"Zoom −\">−</button></div><button id=\"map3d-centre\" aria-label=\"My position\" data-tip=\"My position\" ><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"7\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/><path d=\"M12 1v4m0 14v4M1 12h4m14 0h4\"/></svg></button><button id=\"map3d-overview\" aria-label=\"Overview\" data-tip=\"Overview\" ><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><ellipse cx=\"12\" cy=\"12\" rx=\"4\" ry=\"9\"/><path d=\"M3 12h18\"/></svg></button><button id=\"map3d-clear\" aria-label=\"Clear marker\" data-tip=\"Clear marker\" disabled><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7\"/></svg></button></nav>";
    window.tDom(panel);document.body.append(view,overlay,panel);status=$('map3d-status');interaction=$('map3d-interaction');
    const detail=document.createElement('div');detail.id='map3d-detail';detail.hidden=true;detail.setAttribute('aria-label',t("Zoomed around your position"));panel.append(detail);
    document.querySelectorAll('[data-map-section]').forEach(button=>button.addEventListener('click',()=>setSection(button.dataset.mapSection)));
    $('map3d-close').addEventListener('click',()=>hooks.closeMap?.());$('map3d-centre').addEventListener('click',centre);$('map3d-overview').addEventListener('click',overview);
    $('map3d-zoom-in').addEventListener('click',()=>zoom(.8));$('map3d-zoom-out').addEventListener('click',()=>zoom(1.25));
    $('map3d-clear').addEventListener('click',async()=>{if(requestBusy)return;requestBusy=true;try{const result=await hooks.clearWaypoint?.();if(!result?.ok)throw Error(result?.error||t("Could not clear it."));selected=null;}catch(error){hooks.notice?.(error.message,'error');}finally{requestBusy=false;paintChrome();}});
    $('map3d-search').addEventListener('input',()=>{section='places';paintChrome();});
    document.querySelectorAll('[data-place-filter]').forEach(button=>button.addEventListener('click',()=>{placeFilter=button.dataset.placeFilter;document.querySelectorAll('[data-place-filter]').forEach(node=>node.setAttribute('aria-pressed',String(node===button)));paintPlaces();hooks.sound?.('move');}));
    $('map3d-help-toggle').addEventListener('click',()=>{helpOpen=!helpOpen;$('map3d-help').hidden=!helpOpen;});
    $('map3d-north').addEventListener('click',()=>{azimuth=0;paintChrome();wake();});
    interaction.addEventListener('contextmenu',event=>event.preventDefault());interaction.addEventListener('wheel',event=>{event.preventDefault();zoom(Math.exp(clamp(event.deltaY,-160,160)*.0015),{x:event.clientX,y:event.clientY});},{passive:false});
    interaction.addEventListener('pointerdown',event=>{if(!fullscreen||event.button>2)return;event.preventDefault();interaction.setPointerCapture(event.pointerId);zoomAnchor=null;drag={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,button:event.button};});
    interaction.addEventListener('pointermove',event=>{pointer={x:event.clientX,y:event.clientY};if(!drag){const now=performance.now();if(now-lastPointerWake>70){lastPointerWake=now;wake();}return;}if(drag.id!==event.pointerId)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(drag.button===2||event.shiftKey){azimuth-=dx*.006;}else{pan(dx,dy);follow=false;}wake();drag.x=event.clientX;drag.y=event.clientY;});
    interaction.addEventListener('pointerleave',()=>{pointer=null;$('map3d-hover').hidden=true;});
    const release=event=>{if(!drag||drag.id!==event.pointerId)return;const old=drag;drag=null;if(interaction.hasPointerCapture(event.pointerId))interaction.releasePointerCapture(event.pointerId);if(event.type==='pointerup'&&old.button===0&&Math.hypot(event.clientX-old.startX,event.clientY-old.startY)<5){pick(event.clientX,event.clientY);navigate();}};
    interaction.addEventListener('pointerup',release);interaction.addEventListener('pointercancel',release);interaction.addEventListener('lostpointercapture',release);
    window.addEventListener('keyup',event=>held.delete(event.key.startsWith('Arrow')?event.key:event.key.toLowerCase()));window.addEventListener('blur',()=>{held.clear();padAxes=[0,0,0,0];padZoom=0;drag=null;});
    view.addEventListener('webglcontextlost',event=>{event.preventDefault();loadGeneration++;loading=null;contextLost=true;available=false;gpu?.destroy();gpu=null;report(false);view.hidden=overlay.hidden=true;setStatus(t("Rendering interrupted"));});view.addEventListener('webglcontextrestored',()=>{contextLost=false;failed=false;baseKey='';ensure().then(ready=>{if(ready)wake();});});
    window.addEventListener('resize',()=>{lastSize='';wake();});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;held.clear();padAxes=[0,0,0,0];}else wake();});
  }
  return {init,update,key,gamepad,setFullscreen,isFullscreen:()=>fullscreen,diagnostics:()=>({...renderStats,available,pixelScale,...gpu?.diagnostics(),night:currentNight,contextLost,roadStatus:roadRoute.status,roadPoints:roadRoute.points.length,routePoints:route.points.length,zoom:distance,zoomTarget:zoomGoal,camera:cameraState&&{cx:cameraState.cx,cy:cameraState.cy,mpp:cameraState.mpp,rotation:cameraState.rotation}}),setBlips,setRoute,setMotion,navigationMeta,syncReadiness:()=>{reported=null;report(available);wake();},ensure};
})();
