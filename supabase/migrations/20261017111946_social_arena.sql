-- Additive beta arena. Never accepts client scores or client elapsed time.
create schema if not exists dangal_private;
revoke all on schema dangal_private from public,anon,authenticated;
create table public.dangal_presence(user_id uuid primary key references public.dangal_profiles(id) on delete cascade,last_seen timestamptz not null default now());
create table public.dangal_matches(
 id uuid primary key default gen_random_uuid(),game text not null check(game in ('zip','maze')),
 puzzle integer not null check(puzzle between 0 and 29),seed integer not null check(seed between 1 and 999999),
 user_a uuid not null references public.dangal_profiles(id),user_b uuid references public.dangal_profiles(id),
 state text not null check(state in ('waiting','invited','active','finished','cancelled')),
 created_at timestamptz not null default now(),starts_at timestamptz,expires_at timestamptz not null,
 winner uuid references public.dangal_profiles(id),check(user_b is null or user_a<>user_b));
create index dangal_matches_a_state on public.dangal_matches(user_a,state,created_at desc);
create index dangal_matches_b_state on public.dangal_matches(user_b,state,created_at desc);
create index dangal_match_queue on public.dangal_matches(game,created_at) where state='waiting';
create table public.dangal_results(match_id uuid references public.dangal_matches(id) on delete cascade,user_id uuid references public.dangal_profiles(id),elapsed_ms integer not null check(elapsed_ms>=0),primary key(match_id,user_id));
create table public.dangal_ratings(user_id uuid primary key references public.dangal_profiles(id) on delete cascade,wins integer not null default 0,played integer not null default 0,total_ms bigint not null default 0);
create table public.dangal_messages(id bigint generated always as identity primary key,match_id uuid not null references public.dangal_matches(id) on delete cascade,sender uuid not null references public.dangal_profiles(id),body text not null check(char_length(body) between 1 and 160),sent_at timestamptz not null default now());
create index dangal_messages_match_id on public.dangal_messages(match_id,id desc);
alter table public.dangal_presence enable row level security;
alter table public.dangal_matches enable row level security;
alter table public.dangal_results enable row level security;
alter table public.dangal_ratings enable row level security;
alter table public.dangal_messages enable row level security;
revoke all on public.dangal_presence,public.dangal_matches,public.dangal_results,public.dangal_ratings,public.dangal_messages from public,anon,authenticated;

create function public.dangal_heartbeat(p_online boolean default true) returns void language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();begin
 if me is null then raise exception 'Sign in required';end if;
 if not exists(select 1 from public.dangal_profiles where id=me) then return;end if;
 if p_online then insert into public.dangal_presence(user_id,last_seen) values(me,clock_timestamp()) on conflict(user_id) do update set last_seen=excluded.last_seen;
 else update public.dangal_presence set last_seen=clock_timestamp()-interval '1 hour' where user_id=me;end if;
end;$$;
create function public.dangal_social_friends() returns table(peer_id uuid,handle text,display_name text,status text,incoming boolean,online boolean) language sql stable security definer set search_path='' as $$
 select f.peer_id,f.handle,f.display_name,f.status,f.incoming,coalesce(p.last_seen>now()-interval '35 seconds',false) from public.dangal_friends() f left join public.dangal_presence p on p.user_id=f.peer_id;
$$;
create function dangal_private.close_match(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare m public.dangal_matches;ra integer;rb integer;w uuid;begin
 select * into m from public.dangal_matches where id=p_id for update;
 if m.state<>'active' then return;end if;
 select elapsed_ms into ra from public.dangal_results where match_id=p_id and user_id=m.user_a;
 select elapsed_ms into rb from public.dangal_results where match_id=p_id and user_id=m.user_b;
 if (ra is null or rb is null) and m.expires_at>clock_timestamp() then return;end if;
 if ra is null and rb is null then update public.dangal_matches set state='cancelled' where id=p_id;return;end if;
 if ra is null then w:=m.user_b;elsif rb is null then w:=m.user_a;elsif ra<rb then w:=m.user_a;elsif rb<ra then w:=m.user_b;end if;
 update public.dangal_matches set state='finished',winner=w where id=p_id;
 insert into public.dangal_ratings(user_id,wins,played,total_ms) values(m.user_a,case when w=m.user_a then 1 else 0 end,1,coalesce(ra,180000)),(m.user_b,case when w=m.user_b then 1 else 0 end,1,coalesce(rb,180000)) on conflict(user_id) do update set wins=public.dangal_ratings.wins+excluded.wins,played=public.dangal_ratings.played+1,total_ms=public.dangal_ratings.total_ms+excluded.total_ms;
end;$$;
revoke execute on function dangal_private.close_match(uuid) from public,anon,authenticated;
create function public.dangal_match_state(p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();m public.dangal_matches;begin
 if me is null then raise exception 'Sign in required';end if;
 select * into m from public.dangal_matches where id=p_id and me in(user_a,user_b);
 if not found then raise exception 'Match not found';end if;
 perform dangal_private.close_match(p_id);
 select * into m from public.dangal_matches where id=p_id;
 return to_jsonb(m)||jsonb_build_object('server_now',clock_timestamp(),'players',(select jsonb_agg(jsonb_build_object('id',p.id,'name',p.display_name,'handle',p.handle,'elapsed_ms',r.elapsed_ms)) from public.dangal_profiles p left join public.dangal_results r on r.user_id=p.id and r.match_id=m.id where p.id in(m.user_a,m.user_b)));
end;$$;
create function public.dangal_match_inbox() returns jsonb language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();begin
 if me is null then raise exception 'Sign in required';end if;
 update public.dangal_matches set state='cancelled' where me in(user_a,user_b) and state in('waiting','invited') and expires_at<clock_timestamp();
 return coalesce((select jsonb_agg(public.dangal_match_state(id)) from (select id from public.dangal_matches where me in(user_a,user_b) and state in('waiting','invited','active') order by created_at desc limit 8) q),'[]'::jsonb);
end;$$;
create function public.dangal_queue(p_game text,p_peer uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();m public.dangal_matches;begin
 if me is null or not exists(select 1 from public.dangal_profiles where id=me) then raise exception 'Choose your handle first';end if;
 if p_game not in('zip','maze') then raise exception 'Invalid game';end if;
 perform pg_advisory_xact_lock(505040);
 update public.dangal_matches set state='cancelled' where state in('waiting','invited') and expires_at<clock_timestamp();
 select * into m from public.dangal_matches where me in(user_a,user_b) and state in('waiting','active') order by created_at desc limit 1;
 if found then return public.dangal_match_state(m.id);end if;
 if (select count(*) from public.dangal_matches where user_a=me and created_at>now()-interval '1 hour')>=30 then raise exception 'Match limit reached; try later';end if;
 if p_peer is not null then
  if p_peer=me or not exists(select 1 from public.dangal_friendships where user_a=least(me,p_peer) and user_b=greatest(me,p_peer) and status='accepted') then raise exception 'Invite accepted friends only';end if;
  if not exists(select 1 from public.dangal_presence where user_id=p_peer and last_seen>now()-interval '35 seconds') then raise exception 'Friend is offline';end if;
  if exists(select 1 from public.dangal_matches where me in(user_a,user_b) and state='invited' and expires_at>now()) then raise exception 'An invite is already pending';end if;
  insert into public.dangal_matches(game,puzzle,seed,user_a,user_b,state,expires_at) values(p_game,floor(random()*20)::int,1+floor(random()*999998)::int,me,p_peer,'invited',clock_timestamp()+interval '45 seconds') returning * into m;
 else
  select q.* into m from public.dangal_matches q join public.dangal_presence p on p.user_id=q.user_a where q.state='waiting' and q.game=p_game and q.user_a<>me and q.expires_at>clock_timestamp() and p.last_seen>now()-interval '35 seconds' order by q.created_at limit 1 for update of q;
  if found then update public.dangal_matches set user_b=me,state='active',starts_at=clock_timestamp()+interval '4 seconds',expires_at=clock_timestamp()+interval '184 seconds' where id=m.id returning * into m;
  else insert into public.dangal_matches(game,puzzle,seed,user_a,state,expires_at) values(p_game,floor(random()*20)::int,1+floor(random()*999998)::int,me,'waiting',clock_timestamp()+interval '90 seconds') returning * into m;end if;
 end if;
 return public.dangal_match_state(m.id);
end;$$;
create function public.dangal_accept_match(p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();begin
 if me is null then raise exception 'Sign in required';end if;
 update public.dangal_matches set state='active',starts_at=clock_timestamp()+interval '4 seconds',expires_at=clock_timestamp()+interval '184 seconds' where id=p_id and user_b=me and state='invited' and expires_at>clock_timestamp();
 if not found then raise exception 'Invitation expired or unavailable';end if;
 return public.dangal_match_state(p_id);
end;$$;
create function public.dangal_leave_match(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin if auth.uid() is null then raise exception 'Sign in required';end if;update public.dangal_matches set state='cancelled' where id=p_id and auth.uid() in(user_a,user_b) and state in('waiting','invited','active');end;$$;
create function public.dangal_record_finish(p_id uuid,p_user uuid) returns void language plpgsql security definer set search_path='' as $$
declare m public.dangal_matches;begin
 -- Only service_role can execute; Edge Function verifies JWT and solved path first.
 select * into m from public.dangal_matches where id=p_id for update;
 if m.state<>'active' or p_user not in(m.user_a,m.user_b) or m.starts_at>clock_timestamp() or m.expires_at<clock_timestamp() then raise exception 'Match is not accepting results';end if;
 insert into public.dangal_results(match_id,user_id,elapsed_ms) values(p_id,p_user,greatest(0,extract(epoch from(clock_timestamp()-m.starts_at))*1000)::int) on conflict do nothing;
 perform dangal_private.close_match(p_id);
end;$$;
revoke all on function public.dangal_record_finish(uuid,uuid) from public,anon,authenticated;
grant execute on function public.dangal_record_finish(uuid,uuid) to service_role;
create function public.dangal_chat(p_id uuid,p_text text default null,p_before bigint default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();m public.dangal_matches;begin
 if me is null then raise exception 'Sign in required';end if;
 select * into m from public.dangal_matches where id=p_id and me in(user_a,user_b) for update;
 if not found or m.user_b is null then raise exception 'Match chat unavailable';end if;
 if p_text is not null then
  if char_length(trim(p_text)) not between 1 and 160 then raise exception 'Use 1–160 characters';end if;
  if m.created_at<now()-interval '1 day' then raise exception 'This match chat has closed';end if;
  if (select count(*) from public.dangal_messages where sender=me and sent_at>now()-interval '10 seconds')>=6 then raise exception 'Please slow down';end if;
  if (select count(*) from public.dangal_messages where match_id=p_id)>=200 then raise exception 'Match chat limit reached';end if;
  insert into public.dangal_messages(match_id,sender,body) values(p_id,me,trim(p_text));
 end if;
 return coalesce((select jsonb_agg(to_jsonb(q) order by q.id) from(select x.id,x.sender,p.display_name as name,x.body,x.sent_at from public.dangal_messages x join public.dangal_profiles p on p.id=x.sender where x.match_id=p_id and (p_before is null or x.id<p_before) order by x.id desc limit 50) q),'[]'::jsonb);
end;$$;
create function public.dangal_rankings(p_friends boolean default false,p_offset integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare me uuid:=auth.uid();begin
 if me is null then raise exception 'Sign in required';end if;
 if p_offset<0 then raise exception 'Invalid page';end if;
 return coalesce((with board as(select row_number() over(order by coalesce(r.wins,0) desc,coalesce(r.total_ms,0),p.id) as position,p.id,p.handle,p.display_name as name,coalesce(r.wins,0) as wins,coalesce(r.played,0) as played,p.id=me as is_self from public.dangal_profiles p left join public.dangal_ratings r on r.user_id=p.id where not p_friends or p.id=me or exists(select 1 from public.dangal_friendships f where f.user_a=least(me,p.id) and f.user_b=greatest(me,p.id) and f.status='accepted')) select jsonb_agg(to_jsonb(q) order by q.position) from (select * from board where (not p_friends and(position<=50 or is_self)) or (p_friends and position>p_offset and position<=p_offset+200)) q),'[]'::jsonb);
end;$$;
-- Explicit callable surface, no implicit anonymous execution.
do $$declare f record;begin for f in select p.oid::regprocedure as name from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('dangal_heartbeat','dangal_social_friends','dangal_match_state','dangal_match_inbox','dangal_queue','dangal_accept_match','dangal_leave_match','dangal_chat','dangal_rankings') loop execute format('revoke execute on function %s from public,anon',f.name);execute format('grant execute on function %s to authenticated',f.name);end loop;end$$;
