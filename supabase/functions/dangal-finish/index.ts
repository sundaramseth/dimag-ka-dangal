import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
import {makeZipLevel,zipSolved} from './engine/zip.ts';
import {makeMaze,mazeSolved} from './engine/maze.ts';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Content-Type':'application/json'};
const reply=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers});
 if(req.method!=='POST')return reply(405,{error:'POST required'});
 try{
  const token=req.headers.get('Authorization');if(!token?.startsWith('Bearer '))return reply(401,{error:'Sign in required'});
  const url=Deno.env.get('SUPABASE_URL')!;
  const userClient=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:token}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await userClient.auth.getUser();if(authError||!user)return reply(401,{error:'Sign in again'});
  const raw=await req.text();if(raw.length>6000)return reply(413,{error:'Path too large'});
  const {matchId,path}=JSON.parse(raw);
  if(typeof matchId!=='string'||!Array.isArray(path)||path.length>144||!path.every(Number.isInteger))return reply(400,{error:'Invalid path'});
  const {data:m,error}=await userClient.rpc('dangal_match_state',{p_id:matchId});
  if(error||!m||m.state!=='active'||!['zip','maze'].includes(m.game))return reply(409,{error:'Match no longer active'});
  const solved=m.game==='zip'?zipSolved(makeZipLevel(m.puzzle,m.seed),path):mazeSolved(makeMaze(m.puzzle,m.seed),path);
  if(!solved)return reply(400,{error:'Puzzle is not solved'});
  const admin=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const result=await admin.rpc('dangal_record_finish',{p_id:matchId,p_user:user.id});
  if(result.error)return reply(409,{error:'Result expired or already closed'});
  return reply(200,{verified:true});
 }catch{return reply(400,{error:'Could not validate result'});}
});
