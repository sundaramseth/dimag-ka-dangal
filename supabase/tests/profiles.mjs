import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';import assert from 'node:assert/strict';
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);
for(const n of ['202610160001_friends.sql','20261017111946_social_arena.sql'])await db.exec(readFileSync(new URL('../migrations/'+n,import.meta.url),'utf8'));
// PGlite has no logical replication. Publication membership is verified on hosted Postgres.
const sql=readFileSync(new URL('../migrations/20261017191604_adventure_profiles.sql',import.meta.url),'utf8');await db.exec(sql.slice(0,sql.indexOf('do $$begin')));
const a='20000000-0000-4000-8000-000000000001',b='20000000-0000-4000-8000-000000000002';
await db.query('insert into auth.users values($1,$2),($3,$4)',[a,{full_name:'Google Tester',avatar_url:'https://example.test/avatar.png'},b,{name:'Other Tester'}]);
async function as(id,q){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');return db.query(q);}
const own=(await as(a,'select (public.dangal_profile_sync()).*')).rows[0];assert.equal(own.display_name,'Google Tester');assert.equal(own.avatar_url,'https://example.test/avatar.png');assert.match(own.handle,/^hero_[a-z0-9]{19}$/);
await as(b,'select public.dangal_profile_sync()');assert.equal((await as(a,'select count(*)::int as n from dangal_profiles')).rows[0].n,1);
await as(a,"select public.dangal_edit_profile('new_handle','New Name',3,'man','IN')");const saved=(await as(a,'select (public.dangal_profile_sync()).*')).rows[0];assert.equal(saved.display_name,'New Name');assert.equal(saved.country,'IN');assert.equal(saved.avatar,3);
await assert.rejects(as(a,"select public.dangal_edit_profile('new_handle','New Name',90,'man','IN')"));await assert.rejects(as(a,"select public.dangal_edit_profile('new_handle','New Name',3,'man','INVALID')"));
await db.exec('reset role;set role anon');await assert.rejects(db.query('select public.dangal_profile_sync()'));
await db.close();console.log('PASS Google display bootstrap, unique handle, own-row RLS, custom-name preservation, avatar/country checks, anonymous denial.');
