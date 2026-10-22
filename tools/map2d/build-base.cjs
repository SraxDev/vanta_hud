const fs=require('fs'),path=require('path'),crypto=require('crypto'),sharp=require('sharp');
sharp.concurrency(2);sharp.cache({memory:64});
const base=path.resolve(process.argv[2]||path.join(__dirname,'../../web/assets/map3d')),out=path.resolve(__dirname,'../../web/assets/map2d');
const N=2048,HI=16384,tileSize=512,minX=-8192,maxY=10240,extent=16384,step=extent/N;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const rgb=h=>h.match(/../g).map(n=>parseInt(n,16));
const themes={day:{water:'a8cfe7',shore:'c0dff0',beach:'e5dec4',land:'a9c69e',forest:'709c79',hill:'8fae83',urban:'d7dfdc',roof:'f7f9f5',roofEdge:'aabdb9',contour:'6f916e'},night:{water:'122c43',shore:'23485f',beach:'37525b',land:'174047',forest:'11343c',hill:'1a3a43',urban:'1c3045',roof:'344d61',roofEdge:'243e52',contour:'315862'}};
for(const theme of Object.values(themes))for(const key in theme)theme[key]=rgb(theme[key]);
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const bytes=fs.readFileSync(path.join(base,'graphic.bin')),meta=JSON.parse(fs.readFileSync(path.join(base,'graphic.json'))),vc=bytes.readUInt32LE(8),ic=bytes.readUInt32LE(12),v=new Float32Array(bytes.buffer,bytes.byteOffset+16,vc*9),ix=new Uint32Array(bytes.buffer,bytes.byteOffset+16+vc*36,ic);
 const elevation=new Float32Array(N*N).fill(-999),buildings=new Uint8Array(HI*HI),density=Buffer.alloc(N*N);
 function triangle(a,b,c,size,write){
  const scale=size/extent,ax=(v[a*9]-minX)*scale,ay=(maxY+v[a*9+2])*scale,bx=(v[b*9]-minX)*scale,by=(maxY+v[b*9+2])*scale,cx=(v[c*9]-minX)*scale,cy=(maxY+v[c*9+2])*scale;
  const den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(den)<.001)return;
  const x0=clamp(Math.floor(Math.min(ax,bx,cx)),0,size-1),x1=clamp(Math.ceil(Math.max(ax,bx,cx)),0,size-1),y0=clamp(Math.floor(Math.min(ay,by,cy)),0,size-1),y1=clamp(Math.ceil(Math.max(ay,by,cy)),0,size-1);
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const u=((by-cy)*(x+.5-cx)+(cx-bx)*(y+.5-cy))/den,w=((cy-ay)*(x+.5-cx)+(ax-cx)*(y+.5-cy))/den;if(u>=-.001&&w>=-.001&&u+w<=1.001)write(x,y,u,w);}
 }
 let roofTriangles=0;
 for(const group of meta.merged){if(group.material!==1)continue;for(let i=group.start;i<group.start+group.count;i+=3){const a=ix[i],b=ix[i+1],c=ix[i+2];triangle(a,b,c,N,(x,y,u,w)=>{const h=u*v[a*9+1]+w*v[b*9+1]+(1-u-w)*v[c*9+1],at=y*N+x;if(h>elevation[at])elevation[at]=h;});
  if(v[a*9+8]>.5&&Math.abs(v[a*9+4])>.98){roofTriangles++;triangle(a,b,c,HI,(x,y)=>{buildings[y*HI+x]=1;density[(y>>3)*N+(x>>3)]=255;});}
 }}
 console.log('Geography: '+roofTriangles+' roof faces.');
 const source=path.resolve(process.argv[3]||'map3d-source','GTAV-HD-MAP-satellite.jpg');
 const {data:photo}=await sharp(source,{limitInputPixels:2e9}).resize(4096,4096).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const water=new Uint8Array(N*N),forest=Buffer.alloc(N*N),coast=new Uint16Array(N*N).fill(60000),photoW=4096;
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const wx=minX+(x+.5)*step,wy=maxY-(y+.5)*step,u=wx*.00008036094775216652+.45806681043819153,t=1-(wy*.0000803609635368946+.3254379262849232),px=Math.floor(u*photoW),py=Math.floor(t*photoW),at=y*N+x;
  if(px<0||px>=photoW||py<0||py>=photoW){water[at]=1;continue;}const k=(py*photoW+px)*3,r=photo[k],g=photo[k+1],b=photo[k+2];water[at]=b-r>13&&g-r>7&&b-g>5?1:0;forest[at]=!water[at]&&g>r*.94&&g>b*.94&&(r+g+b)/3<115?255:0;
 }
 const seen=new Uint8Array(N*N),clean=Buffer.alloc(N*N),queue=new Int32Array(N*N);
 for(let seed=0;seed<water.length;seed++){if(!water[seed]||seen[seed])continue;let head=0,tail=1;queue[0]=seed;seen[seed]=1;while(head<tail){const at=queue[head++],x=at%N,y=Math.floor(at/N);for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){const xx=x+dx,yy=y+dy;if(xx<0||xx>=N||yy<0||yy>=N)continue;const to=yy*N+xx;if(water[to]&&!seen[to]){seen[to]=1;queue[tail++]=to;}}}if(tail>=160)for(let i=0;i<tail;i++)clean[queue[i]]=255;}
 const filteredWater=await sharp(clean,{raw:{width:N,height:N,channels:1}}).median(3).toColourspace('b-w').raw().toBuffer();if(filteredWater.length!==N*N)throw Error('Canaux eau incorrects');for(let i=0;i<water.length;i++)water[i]=filteredWater[i]>127?1:0;
 const zones=require(path.resolve(process.argv[4]||'road-network-source','zones.json')),city=new Set(['AirP','Alta','Banning','Burton','ChamH','Cypre','Davis','DelPe','DelSol','Downt','DTVine','East_V','EBuro','Elysian','Hawick','Koreat','LMesa','LosPuer','Mirr','Morn','Movie','Murri','PBOX','RANCHO','Richm','Rockf','SKID','Stad','STRAW','Termina','TEXTI','VCana','Vesp','Vine','WVine','ZP_ORT','Paleto','Harmo']),parks=new Uint8Array(N*N);
 for(const zone of zones){const target=city.has(zone.Name)?density:['Golf','LegSqu'].includes(zone.Name)?parks:null;if(!target)continue;for(const b of zone.Bounds){const x0=clamp(Math.floor((b.Minimum.X+8192)/8),0,N-1),x1=clamp(Math.ceil((b.Maximum.X+8192)/8),0,N-1),y0=clamp(Math.floor((10240-b.Maximum.Y)/8),0,N-1),y1=clamp(Math.ceil((10240-b.Minimum.Y)/8),0,N-1);for(let y=y0;y<=y1;y++)target.fill(255,y*N+x0,y*N+x1+1);}}
 const {data:wood}=await sharp(forest,{raw:{width:N,height:N,channels:1}}).median(5).blur(3).toColourspace('b-w').raw().toBuffer({resolveWithObject:true});
 const {data:urban}=await sharp(density,{raw:{width:N,height:N,channels:1}}).blur(8).linear(3,0).blur(2).toColourspace('b-w').raw().toBuffer({resolveWithObject:true});
 if(wood.length!==N*N||urban.length!==N*N)throw Error('Canaux des masques incorrects');
 for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){const at=y*N+x;if(water[at]!==water[at-1]||water[at]!==water[at+1]||water[at]!==water[at-N]||water[at]!==water[at+N])coast[at]=0;}
 for(let y=1;y<N;y++)for(let x=1;x<N;x++){const a=y*N+x;coast[a]=Math.min(coast[a],coast[a-1]+3,coast[a-N]+3,coast[a-N-1]+4);}
 for(let y=N-2;y>=0;y--)for(let x=N-2;x>=0;x--){const a=y*N+x;coast[a]=Math.min(coast[a],coast[a+1]+3,coast[a+N]+3,coast[a+N+1]+4);}
 const labels=JSON.parse(fs.readFileSync(path.join(base,'roads.json'))).labels;
 const manifest={version:1,tileSize,maxZoom:5,extent,origin:{x:minX,y:maxY},themes:['day','night'],labels,tiles:[],source:{model:meta.upstream,geometrySha256:hash(path.join(base,'graphic.bin')),roadSource:JSON.parse(fs.readFileSync(path.join(base,'roads.json'))).source,method:'Offline 2D cartography: semantic terrain, elevation contours and roof footprints. No satellite imagery or 3D model loaded at runtime.'}};
 const roadMeta=JSON.parse(fs.readFileSync(path.join(base,'roads.json'))),roadBytes=fs.readFileSync(path.join(base,'roads.bin')),road=new Float32Array(roadBytes.buffer,roadBytes.byteOffset,roadBytes.byteLength/4),segments=[],grid={};
 for(let i=0;i<road.length/8;i+=6){const j=i*8,k=(i+2)*8;if(road[j+5]!==-1||road[(i+1)*8+5]!==1)continue;const a=[road[j],-road[j+2]],b=[road[k],-road[k+2]],width=road[j+6]*2,kind=road[j+7];if(Math.hypot(a[0]-b[0],a[1]-b[1])<.1)continue;const id=segments.length;segments.push([Math.round(a[0]*10)/10,Math.round(a[1]*10)/10,Math.round(b[0]*10)/10,Math.round(b[1]*10)/10,Math.round(width*10)/10,kind]);for(let yy=Math.floor(Math.min(a[1],b[1])/500);yy<=Math.floor(Math.max(a[1],b[1])/500);yy++)for(let xx=Math.floor(Math.min(a[0],b[0])/500);xx<=Math.floor(Math.max(a[0],b[0])/500);xx++)(grid[xx+':'+yy]??=[]).push(id);}
 fs.writeFileSync(path.join(out,'roads.json'),JSON.stringify({segments,grid,source:roadMeta.source}));
 const interpolate=(array,x,y)=>{const a=Math.floor(x),b=Math.floor(y),dx=x-a,dy=y-b,at=b*N+a;return array[at]*(1-dx)*(1-dy)+array[at+1]*dx*(1-dy)+array[at+N]*(1-dx)*dy+array[at+N+1]*dx*dy;};
 for(const [name,col]of Object.entries({day:themes.day})){
  console.log('Palette '+name);const low=Buffer.alloc(N*N*3);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const at=y*N+x,w=water[at],seaDistance=coast[at]*step/3;let c;
   if(w){const near=clamp(1-seaDistance/110,0,1);c=col.water.map((v,i)=>v+(col.shore[i]-v)*near);}
   else{const h=Math.max(0,elevation[at]),u=parks[at]?0:clamp(urban[at]/170,0,1),f=clamp(wood[at]/255,0,1)*.65,high=clamp((h-150)/550,0,1)*.45;
    c=col.land.map((v,i)=>v+(col.forest[i]-v)*f+(col.hill[i]-v)*high);c=c.map((v,i)=>v+(col.urban[i]-v)*u);
    if(seaDistance<22&&h<18&&u<.4)c=c.map((v,i)=>v+(col.beach[i]-v)*clamp(1-seaDistance/28,0,1));
    if(h>95&&u<.2){const band=Math.abs((h+25)%50-25);if(band<1.25)c=c.map((v,i)=>v+(col.contour[i]-v)*.22);}
    if(parks[at])c=[146,184,139];
   }const p=(y*N+x)*3;low[p]=c[0];low[p+1]=c[1];low[p+2]=c[2];
  }
  const raw=await sharp(low,{raw:{width:N,height:N,channels:3},limitInputPixels:false}).resize(HI,HI).raw().toBuffer();
  for(let y=1;y<HI;y++)for(let x=1;x<HI;x++){const at=y*HI+x;if(!buildings[at])continue;const c=!buildings[at-1]||!buildings[at-HI]?col.roofEdge:col.roof,p=at*3;raw[p]=c[0];raw[p+1]=c[1];raw[p+2]=c[2];}
  let level=raw,size=HI;
  for(let z=5;z>=5;z--){const count=2**z,folder=path.join(out,name);fs.mkdirSync(folder,{recursive:true});let written=0;
   for(let yy=0;yy<count;yy++)for(let xx=0;xx<count;xx++){const tile=Buffer.alloc(tileSize*tileSize*3);for(let row=0;row<tileSize;row++)level.copy(tile,row*tileSize*3,((yy*tileSize+row)*size+xx*tileSize)*3,((yy*tileSize+row)*size+xx*tileSize+tileSize)*3);
    await sharp(tile,{raw:{width:tileSize,height:tileSize,channels:3}}).webp({quality:94,effort:3}).toFile(path.join(folder,`${z}-${xx}-${yy}.webp`));written++;if(name==='day')manifest.tiles.push(`${z}-${xx}-${yy}`);
   }console.log(name+' / '+z+' : '+written+' tiles');
  }
 }
 fs.writeFileSync(path.join(out,'map.json'),JSON.stringify(manifest,null,2));console.log('Done: '+manifest.tiles.length+' tiles per theme.'+segments.length+' segments vectoriels.');
})().catch(e=>{console.error(e);process.exitCode=1;});
