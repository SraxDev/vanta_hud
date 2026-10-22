'use strict';
// Stock-world atlas. World coordinates and icon drawing remain independent of artwork.
window.HudAtlasMap=class {
  constructor(canvas,meta,invalidate){
    const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,preserveDrawingBuffer:true,powerPreference:'default'});
    if(!gl)throw Error("Map rendering unavailable");
    this.gl=gl;this.canvas=canvas;this.meta=meta;this.invalidate=invalidate;
    this.cache=new Map();this.pending=new Set();this.wanted=[];this.failures=new Map();this.running=0;this.epoch=0;this.disposed=false;
    this.maxTiles=20;this.clock=0;this.base=null;
    const vertex=`precision highp float;attribute vec2 aCorner;uniform vec4 uBounds,uUV;uniform vec2 uCenter,uRotation,uScale;varying vec2 vUV;
      void main(){vec2 p=mix(uBounds.xy,uBounds.zw,aCorner),d=p-uCenter;gl_Position=vec4((d.x*uRotation.x+d.y*uRotation.y)*uScale.x,(-d.x*uRotation.y+d.y*uRotation.x)*uScale.y,0.,1.);vUV=mix(uUV.xy,uUV.zw,aCorner);}`;
    const fragment=`precision highp float;uniform sampler2D uImage;uniform float uNight;varying vec2 vUV;
      void main(){vec3 c=texture2D(uImage,vUV).rgb;float hi=max(c.r,max(c.g,c.b)),lo=min(c.r,min(c.g,c.b));
      float water=smoothstep(.025,.13,c.b-c.r)*smoothstep(.015,.10,c.g-c.r);
      float paper=smoothstep(.73,.95,lo)*(1.-smoothstep(.08,.25,hi-lo));
      float arterial=smoothstep(.85,.97,c.r)*smoothstep(.81,.94,c.g)*smoothstep(.56,.76,c.b);
      vec3 day=mix(c,vec3(c.r*.48,c.g*.63,c.b*.90),water*.72);
      vec3 dark=vec3(.035,.085,.105)+c*vec3(.14,.27,.28);
      dark=mix(dark,vec3(.018,.075,.125)+c.b*vec3(.015,.055,.085),water);
      dark=mix(dark,vec3(.49,.65,.73),max(paper*.90,arterial*.76));
      gl_FragColor=vec4(mix(day,dark,uNight),1.);}`;
    const p=gl.createProgram();for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);gl.deleteShader(s);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));this.program=p;
    this.uniforms=Object.fromEntries(['uBounds','uUV','uCenter','uRotation','uScale','uImage','uNight'].map(n=>[n,gl.getUniformLocation(p,n)]));this.attribute=gl.getAttribLocation(p,'aCorner');this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]),gl.STATIC_DRAW);
    gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);
  }
  async init(){
    const image=await this.load(this.meta.overview);if(this.disposed){image.close?.();return;}
    this.base=this.texture(image,true);image.close?.();
  }
  async load(file){
    // Paths are selected from a validated local manifest, never from NUI callbacks.
    if(file!==this.meta.overview&&!this.meta.tiles.includes(file))throw Error("Image not allowed");
    return new Promise((resolve,reject)=>{
      const image=new Image(),timer=setTimeout(()=>finish(Error("Map loading timed out")),10000);
      const finish=error=>{clearTimeout(timer);image.onload=image.onerror=null;if(error){image.src='';reject(error);}else resolve(image);};
      image.onload=()=>finish(image.naturalWidth===(file===this.meta.overview?2048:1028)&&image.naturalHeight===image.naturalWidth?null:Error("Invalid map dimensions"));
      image.onerror=()=>finish(Error("Map image missing or unreadable: "+file));image.src='assets/map-atlas/'+file;
    });
  }
  texture(image,mipmap){
    const gl=this.gl,t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,mipmap?gl.LINEAR_MIPMAP_LINEAR:gl.LINEAR);if(mipmap)gl.generateMipmap(gl.TEXTURE_2D);
    if(gl.isContextLost()){gl.deleteTexture(t);throw Error("Graphics context lost");}
    if(gl.getError()!==gl.NO_ERROR){gl.deleteTexture(t);throw Error("Could not upload the map graphics");}
    return t;
  }
  uvToWorld(u,v){const t=this.meta.transform;return [(u-t.offsetX)/t.scaleX,(v-t.offsetY)/t.scaleY];}
  worldToUV(x,y){const t=this.meta.transform;return [x*t.scaleX+t.offsetX,y*t.scaleY+t.offsetY];}
  required(camera){
    const density=this.meta.size*this.meta.transform.scaleX*camera.mpp/(this.canvas.width/(camera.viewportWidth||camera.rect.width));
    if(density>=3.3)return [];
    const r=camera.rect,c=Math.cos(camera.rotation),s=Math.sin(camera.rotation),uv=[];
    for(const [x,y]of [[-1,-1],[1,-1],[1,1],[-1,1]]){const dx=x*r.width*.5*camera.mpp,dy=y*r.height*.5*camera.mpp;uv.push(this.worldToUV(camera.cx+dx*c+dy*s,camera.cy+dx*s-dy*c));}
    const n=this.meta.grid,clip=v=>Math.max(0,Math.min(n-1,v)),x0=clip(Math.floor(Math.min(...uv.map(p=>p[0]))*n)),x1=clip(Math.floor(Math.max(...uv.map(p=>p[0]))*n)),y0=clip(Math.floor(Math.min(...uv.map(p=>p[1]))*n)),y1=clip(Math.floor(Math.max(...uv.map(p=>p[1]))*n));
    const centre=this.worldToUV(camera.cx,camera.cy),items=[];
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)items.push({key:`${x}-${y}.webp`,x,y,d:Math.hypot(x+.5-centre[0]*n,y+.5-centre[1]*n)});
    return items.sort((a,b)=>a.d-b.d).slice(0,this.maxTiles);
  }
  pump(){
    while(!this.disposed&&this.running<2){const item=this.wanted.find(p=>!this.cache.has(p.key)&&!this.pending.has(p.key)&&(!this.failures.has(p.key)||performance.now()-this.failures.get(p.key)>30000));if(!item)return;
      const epoch=this.epoch;this.pending.add(item.key);this.running++;
      this.load(item.key).then(image=>{
        if(this.disposed||epoch!==this.epoch){image.close?.();return;}
        // A stale request is discarded when the view has moved elsewhere.
        if(!this.wanted.some(p=>p.key===item.key)){image.close?.();return;}
        while(this.cache.size>=this.maxTiles){const list=[...this.cache].sort((a,b)=>a[1].used-b[1].used),victim=list.find(([key])=>!this.wanted.some(p=>p.key===key))||list[0];this.gl.deleteTexture(victim[1].texture);this.cache.delete(victim[0]);}
        this.cache.set(item.key,{texture:this.texture(image,false),used:++this.clock});image.close?.();this.invalidate();
      }).catch(error=>{if(!this.disposed){this.failures.set(item.key,performance.now());console.warn("[hud-map] Deferred detail",item.key,error.message);}}).finally(()=>{this.pending.delete(item.key);this.running--;this.pump();});
    }
  }
  quad(texture,bounds,uv){const gl=this.gl,u=this.uniforms;gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform4fv(u.uBounds,bounds);gl.uniform4fv(u.uUV,uv);gl.drawArrays(gl.TRIANGLES,0,6);this.calls++;}
  surface(camera,night,viewport){
    const gl=this.gl,u=this.uniforms;gl.viewport(...viewport);gl.scissor(...viewport);gl.uniform2f(u.uCenter,camera.cx,camera.cy);gl.uniform2f(u.uRotation,Math.cos(camera.rotation),Math.sin(camera.rotation));gl.uniform2f(u.uScale,2/(camera.mpp*camera.rect.width),2/(camera.mpp*camera.rect.height));gl.uniform1f(u.uNight,night);
    // A full cached base always covers the viewport, including outside the stock map.
    const r=camera.rect,half=Math.hypot(r.width,r.height)*camera.mpp;
    const a=[camera.cx-half,camera.cy+half],b=[camera.cx+half,camera.cy-half];
    this.quad(this.base,[...a,...b],[...this.worldToUV(...a),...this.worldToUV(...b)]);
    const wanted=this.required(camera),n=this.meta.grid,pad=(this.meta.gutter||0)/(this.meta.tileSize+2*(this.meta.gutter||0));
    for(const item of wanted){const tile=this.cache.get(item.key);if(!tile)continue;tile.used=++this.clock;this.quad(tile.texture,[...this.uvToWorld(item.x/n,item.y/n),...this.uvToWorld((item.x+1)/n,(item.y+1)/n)],[pad,pad,1-pad,1-pad]);}
    return wanted;
  }
  draw(camera,night,bounds,quality,inset){
    const gl=this.gl;this.maxTiles=quality==='low'?10:20;gl.useProgram(this.program);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.enableVertexAttribArray(this.attribute);gl.vertexAttribPointer(this.attribute,2,gl.FLOAT,false,8,0);gl.activeTexture(gl.TEXTURE0);gl.uniform1i(this.uniforms.uImage,0);gl.enable(gl.SCISSOR_TEST);this.calls=0;
    const ratio=this.canvas.width/camera.rect.width,scale=this.canvas.height/camera.rect.height;
    const wanted=this.surface({...camera,viewportWidth:camera.rect.width},night,[0,0,this.canvas.width,this.canvas.height]);
    if(inset){const r=inset.rect;wanted.push(...this.surface({...inset,viewportWidth:camera.rect.width},night,[Math.round((r.x-camera.rect.x)*ratio),Math.round((camera.rect.y+camera.rect.height-r.y-r.height)*scale),Math.round(r.width*ratio),Math.round(r.height*scale)]));}
    this.wanted=[...new Map(wanted.map(p=>[p.key,p])).values()].slice(0,this.maxTiles);
    while(this.cache.size>this.maxTiles){const victim=[...this.cache].sort((a,b)=>a[1].used-b[1].used)[0];gl.deleteTexture(victim[1].texture);this.cache.delete(victim[0]);}
    this.pump();
    gl.disable(gl.SCISSOR_TEST);gl.disableVertexAttribArray(this.attribute);
    return {calls:this.calls,triangles:this.calls*2};
  }
  diagnostics(){return {cachedTiles:this.cache.size,loadingTiles:this.running,queuedTiles:this.wanted.filter(p=>!this.cache.has(p.key)&&!this.pending.has(p.key)).length,failedTiles:this.failures.size};}
  destroy(){if(this.disposed)return;this.disposed=true;this.epoch++;for(const t of this.cache.values())this.gl.deleteTexture(t.texture);this.cache.clear();if(this.base)this.gl.deleteTexture(this.base);this.gl.deleteBuffer(this.buffer);this.gl.deleteProgram(this.program);}
};
