// Optional multipart webhook adapter. Disabled until an approved receiver is configured.
const MAX_BYTES=3.5*1024*1024;
export default {async fetch(request){
 const reply=(status,error)=>Response.json({ok:status===200,...(error?{error}:{})},{status,headers:{'Cache-Control':'no-store'}});
 if(request.method!=='POST')return reply(405,'method_not_allowed');
 if(process.env.FORMS_LIVE!=='true'||!process.env.FORMS_WEBHOOK)return reply(503,'preview_only');
 const origin=request.headers.get('origin');
 if(!origin||origin!==new URL(request.url).origin)return reply(403,'origin');
 if(Number(request.headers.get('content-length')||0)>MAX_BYTES)return reply(413,'too_large');
 if(!request.headers.get('content-type')?.startsWith('multipart/form-data'))return reply(415,'content_type');
 try{
  const reader=request.body.getReader();const chunks=[];let bytes=0;
  while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>MAX_BYTES){await reader.cancel();return reply(413,'too_large')}chunks.push(value)}
  const buffer=new Uint8Array(bytes);let offset=0;for(const c of chunks){buffer.set(c,offset);offset+=c.byteLength}
  const data=await new Response(buffer,{headers:{'Content-Type':request.headers.get('content-type')}}).formData();
  if(data.get('website'))return reply(400,'invalid_request');
  const kind=data.get('kind');if(!['contact','autoDirect','motoDirect','autoBroker','motoBroker'].includes(kind)||!['de','fr','it','en'].includes(data.get('locale')))return reply(400,'invalid_request');
  const required=['fname','lname','email','phone','consent',...(kind==='contact'?['message']:['brand','model','vehicleType','firstRegistration','mileage','price',...(kind.startsWith('auto')?['transmission','fuel']:[])])];
  if(required.some(k=>typeof data.get(k)!=='string'||!data.get(k).trim()))return reply(400,'required_fields');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.get('email')))return reply(400,'email');
  for(const [key,val]of data){if(typeof val==='string'&&val.length>5000)return reply(400,'field_too_long');}
  for(const key of ['mileage','price','power','cc','year']){const value=data.get(key);if(value&&( !Number.isFinite(Number(value))||Number(value)<0||Number(value)>999999999))return reply(400,'numeric_value')}
  const photos=data.getAll('photos');if(photos.length>15||photos.reduce((s,f)=>s+(f.size||0),0)>3*1024*1024||photos.some(f=>typeof f==='string'||!['image/jpeg','image/png','image/webp'].includes(f.type)))return reply(400,'photos');
  const url=new URL(process.env.FORMS_WEBHOOK);if(url.protocol!=='https:')return reply(503,'receiver_not_configured');
  const upstream=await fetch(url,{method:'POST',body:data,headers:process.env.FORMS_WEBHOOK_TOKEN?{Authorization:`Bearer ${process.env.FORMS_WEBHOOK_TOKEN}`}:{},signal:AbortSignal.timeout(15000),redirect:'error'});
  return upstream.ok?reply(200):reply(502,'delivery_failed');
 }catch{return reply(502,'delivery_failed')}
}};
