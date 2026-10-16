-- Authenticated friends only. No service key in mobile, no public email directory.
create table public.dangal_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 handle text not null unique check (handle ~ '^[a-z0-9_]{3,24}$'),
 display_name text not null check (char_length(display_name) between 1 and 24),
 created_at timestamptz not null default now()
);
create table public.dangal_friendships (
 user_a uuid not null references public.dangal_profiles(id) on delete cascade,
 user_b uuid not null references public.dangal_profiles(id) on delete cascade,
 requester uuid not null references public.dangal_profiles(id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','accepted')),
 created_at timestamptz not null default now(),
 primary key(user_a,user_b), check(user_a<user_b),check(requester in (user_a,user_b))
);
create table public.dangal_request_events(actor uuid not null references auth.users(id) on delete cascade,created_at timestamptz not null default now());
create index dangal_request_actor_time on public.dangal_request_events(actor,created_at);
alter table public.dangal_profiles enable row level security;
alter table public.dangal_friendships enable row level security;
alter table public.dangal_request_events enable row level security;
revoke all on public.dangal_profiles,public.dangal_friendships,public.dangal_request_events from anon,authenticated;
grant select on public.dangal_profiles,public.dangal_friendships to authenticated;
create policy "own profile" on public.dangal_profiles for select to authenticated using (id=(select auth.uid()));
create policy "participants only" on public.dangal_friendships for select to authenticated using ((select auth.uid()) in (user_a,user_b));

create function public.dangal_set_profile(p_handle text,p_name text) returns void language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();begin
 if me is null then raise exception 'Sign in required';end if;
 if p_handle!~'^[a-z0-9_]{3,24}$' or char_length(p_name) not between 1 and 24 then raise exception 'Use a 3–24 character handle (letters, numbers, underscore) and a short name';end if;
 insert into public.dangal_profiles(id,handle,display_name) values(me,p_handle,p_name) on conflict(id) do update set handle=excluded.handle,display_name=excluded.display_name;
end;$$;
create function public.dangal_request_friend(p_handle text) returns void language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();peer uuid;begin
 if me is null then raise exception 'Sign in required';end if;
 if not exists(select 1 from public.dangal_profiles where id=me) then raise exception 'Choose your handle first';end if;
 select id into peer from public.dangal_profiles where handle=p_handle;
 if peer is null then raise exception 'Handle not found';end if;
 if peer=me then raise exception 'Choose another player';end if;
 -- Lock the actor profile to serialize concurrent sends and enforce the hourly limit.
 perform 1 from public.dangal_profiles where id=me for update;
 if (select count(*) from public.dangal_request_events where actor=me and created_at>now()-interval '1 hour')>=10 then raise exception 'Request limit reached. Try later.';end if;
 if exists(select 1 from public.dangal_friendships where user_a=least(me,peer) and user_b=greatest(me,peer)) then raise exception 'Already friends or request pending';end if;
 insert into public.dangal_friendships(user_a,user_b,requester) values(least(me,peer),greatest(me,peer),me);
 insert into public.dangal_request_events(actor) values(me);
end;$$;
create function public.dangal_accept_friend(p_peer uuid) returns void language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();begin
 if me is null then raise exception 'Sign in required';end if;
 update public.dangal_friendships set status='accepted' where user_a=least(me,p_peer) and user_b=greatest(me,p_peer) and requester=p_peer and status='pending';
 if not found then raise exception 'Incoming request not found';end if;
end;$$;
create function public.dangal_remove_friend(p_peer uuid) returns void language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();begin
 if me is null then raise exception 'Sign in required';end if;
 delete from public.dangal_friendships where user_a=least(me,p_peer) and user_b=greatest(me,p_peer);
end;$$;
create function public.dangal_friends() returns table(peer_id uuid,handle text,display_name text,status text,incoming boolean) language sql stable security definer set search_path='' as $$
 select p.id,p.handle,p.display_name,f.status,f.requester<>auth.uid() from public.dangal_friendships f join public.dangal_profiles p on p.id=case when f.user_a=auth.uid() then f.user_b else f.user_a end where auth.uid() in (f.user_a,f.user_b) order by f.created_at desc;
$$;
revoke execute on function public.dangal_set_profile(text,text),public.dangal_request_friend(text),public.dangal_accept_friend(uuid),public.dangal_remove_friend(uuid),public.dangal_friends() from public,anon;
grant execute on function public.dangal_set_profile(text,text),public.dangal_request_friend(text),public.dangal_accept_friend(uuid),public.dangal_remove_friend(uuid),public.dangal_friends() to authenticated;
