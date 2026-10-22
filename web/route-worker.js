'use strict';
const t = (text) => text; // worker has no UI dictionary; messages stay in English
// A* on native GTA road connectivity. Runs off the NUI/render thread.
let graphPromise=null,grid=null,graph=null;
const finite=Number.isFinite;
async function load(){if(graphPromise)return graphPromise;graphPromise=(async()=>{const r=await fetch('assets/routing/roads.json');if(!r.ok)throw Error(t("Road network missing"));const g=await r.json(),n=g.positions?.length/3;
if(g.version!==1||!Number.isInteger(n)||n<1||n>100000||g.offsets?.length!==n+1||g.edges?.length>500000||g.flags?.length!==g.edges.length||g.offsets[0]!==0||g.offsets[n]!==g.edges.length||!g.positions.every(v=>finite(v)&&Math.abs(v)<20000)||!g.edges.every(v=>Number.isInteger(v)&&v>=0&&v<n)||!g.offsets.every((v,i)=>Number.isInteger(v)&&v>=0&&v<=g.edges.length&&(!i||v>=g.offsets[i-1]))||!g.flags.every(v=>Number.isInteger(v)&&v>=0&&v<=3))throw Error(t("Invalid road network"));
graph={p:new Float32Array(g.positions),o:new Uint32Array(g.offsets),e:new Uint32Array(g.edges),f:new Uint8Array(g.flags),n};grid=new Map();for(let i=0;i<n;i++){const k=Math.floor(graph.p[i*3]/200)+':'+Math.floor(graph.p[i*3+1]/200);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(i);}return graph;})();return graphPromise;}
const position=id=>({x:graph.p[id*3],y:graph.p[id*3+1],z:graph.p[id*3+2]});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
function nearest(point){
const x=Math.floor(point.x/200),y=Math.floor(point.y/200);let best=null;
for(let radius=1;radius<=4;radius++){for(let yy=y-radius;yy<=y+radius;yy++)for(let xx=x-radius;xx<=x+radius;xx++)for(const a of grid.get(xx+':'+yy)||[]){const p=position(a);for(let e=graph.o[a];e<graph.o[a+1];e++){const b=graph.e[e],q=position(b),dx=q.x-p.x,dy=q.y-p.y,len=dx*dx+dy*dy,t=Math.max(0,Math.min(1,((point.x-p.x)*dx+(point.y-p.y)*dy)/(len||1))),snap={x:p.x+t*dx,y:p.y+t*dy,z:p.z+t*(q.z-p.z)},cost=Math.hypot(snap.x-point.x,snap.y-point.y)+((point.z&&finite(point.z))?Math.min(50,Math.abs(snap.z-point.z))*.6:0);if(!best||cost<best.cost)best={a,b,t,snap,cost,forward:(graph.f[e]&1)!==0,backward:false};}}
if(best&&best.cost<radius*180)break;}
if(!best||best.cost>800)return null;for(let e=graph.o[best.b];e<graph.o[best.b+1];e++)if(graph.e[e]===best.a)best.backward=(graph.f[e]&1)!==0;return best;
}
class Heap{constructor(){this.a=[]}push(id,cost){const a=this.a;let i=a.length;a.push([id,cost]);while(i){const p=(i-1)>>1;if(a[p][1]<=cost)break;a[i]=a[p];i=p;}a[i]=[id,cost];}pop(){const a=this.a,top=a[0],tail=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1][1]<a[c][1])c++;if(tail[1]<=a[c][1])break;a[i]=a[c];i=c;}a[i]=tail;}return top;}}
function plan(start,end,foot){const a=nearest(start),b=nearest(end);if(!a||!b)return {points:[],status:'off-road'};
const n=graph.n,score=new Float64Array(n).fill(Infinity),previous=new Int32Array(n).fill(-1),closed=new Uint8Array(n),heap=new Heap(),goal=new Map();
if(foot||a.backward){score[a.a]=distance(a.snap,position(a.a));heap.push(a.a,score[a.a]+distance(position(a.a),b.snap));}
if(foot||a.forward){score[a.b]=distance(a.snap,position(a.b));heap.push(a.b,score[a.b]+distance(position(a.b),b.snap));}
if(foot||b.forward)goal.set(b.a,distance(position(b.a),b.snap));if(foot||b.backward)goal.set(b.b,distance(position(b.b),b.snap));
let reached=-1,best=Infinity,visited=0;const deadline=performance.now()+350;
while(heap.a.length&&visited<n){const [id,estimate]=heap.pop();if(estimate>=best)break;if(closed[id])continue;closed[id]=1;visited++;
if(visited%512===0&&performance.now()>deadline)return {points:[],status:'busy'};
if(goal.has(id)&&score[id]+goal.get(id)<best){best=score[id]+goal.get(id);reached=id;}
const p=position(id);for(let e=graph.o[id];e<graph.o[id+1];e++){if(!foot&&!(graph.f[e]&1))continue;const to=graph.e[e];if(closed[to])continue;const q=position(to),cost=score[id]+distance(p,q)*(foot&&(graph.f[e]&2)?1.25:1);if(cost<score[to]){score[to]=cost;previous[to]=id;heap.push(to,cost+distance(q,b.snap));}}}
if(reached<0)return {points:[],status:'no-road'};const ids=[];for(let id=reached;id>=0;id=previous[id]){ids.push(id);if(ids.length>n)return {points:[],status:'invalid'};}ids.reverse();
let points=[a.snap,...ids.map(position),b.snap];
// Same road link: avoid going to an endpoint and doubling back along the same segment.
if(a.a===b.a&&a.b===b.b&&(foot||(b.t>=a.t?a.forward:a.backward)))points=[a.snap,b.snap];
if(a.a===b.b&&a.b===b.a&&(foot||(1-b.t>=a.t?a.forward:a.backward)))points=[a.snap,b.snap];
points=points.filter((p,i)=>!i||distance(p,points[i-1])>.15);if(points.length>4096)return {points:[],status:'too-long'};
return {points,status:'ready',source:'road-network',length:points.reduce((d,p,i)=>d+(i?distance(p,points[i-1]):0),0)};}
self.onmessage=async event=>{const job=event.data;if(!Number.isSafeInteger(job?.id)||!['foot','vehicle'].includes(job.mode)||![job.start?.x,job.start?.y,job.end?.x,job.end?.y].every(v=>finite(v)&&Math.abs(v)<20000))return;
try{await load();self.postMessage({id:job.id,...plan(job.start,job.end,job.mode==='foot')});}catch(error){graphPromise=null;self.postMessage({id:job.id,points:[],status:'unavailable'});}};
