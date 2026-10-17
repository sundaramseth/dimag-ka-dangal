-- Display metadata only. Authorization always uses auth.uid(), never Google metadata.
alter table public.dangal_profiles
 add column avatar integer not null default -1 check(avatar between -1 and 11),
 add column gender text not null default '' check(gender in ('','woman','man','other','prefer_not')),
 add column country text not null default '' check(country='' or country ~ '^[A-Z]{2}$'),
 add column avatar_url text not null default '' check(length(avatar_url)<=2048),
 add column name_custom boolean not null default false;

create function public.dangal_profile_sync() returns public.dangal_profiles
language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid(); meta jsonb; n text; photo text; h text; counter integer; result public.dangal_profiles;
begin
 if me is null then raise exception 'Sign in required'; end if;
 select raw_user_meta_data into meta from auth.users where id=me;
 n:=left(trim(coalesce(meta->>'full_name',meta->>'name','Explorer')),24);
 if n='' then n:='Explorer'; end if;
 photo:=coalesce(meta->>'avatar_url',meta->>'picture','');
 if photo !~ '^https://' or length(photo)>2048 then photo:=''; end if;
 -- Collision retries also cover a manually claimed generated handle. No email is exposed.
 for counter in 0..8 loop
 h:='hero_'||left(md5(me::text||':'||counter::text),19);
 begin
 insert into public.dangal_profiles(id,handle,display_name,avatar_url) values(me,h,n,photo)
 on conflict(id) do update set avatar_url=excluded.avatar_url,
 display_name=case when not public.dangal_profiles.name_custom and lower(replace(public.dangal_profiles.display_name,' ','')) in ('player','player1','explorer') then excluded.display_name else public.dangal_profiles.display_name end;
 exit;
 exception when unique_violation then if counter=8 then raise;end if;
 end;
 end loop;
 select * into result from public.dangal_profiles where id=me;
 return result;
end;$$;
create function public.dangal_edit_profile(p_handle text,p_name text,p_avatar integer,p_gender text,p_country text)
returns public.dangal_profiles language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid(); result public.dangal_profiles;
begin
 if me is null then raise exception 'Sign in required';end if;
 if p_handle!~'^[a-z0-9_]{3,24}$' or char_length(trim(p_name)) not between 1 and 24 then raise exception 'Use a 3–24 character handle and a 1–24 character name';end if;
 update public.dangal_profiles set handle=p_handle,display_name=trim(p_name),avatar=p_avatar,gender=p_gender,country=p_country,name_custom=true where id=me returning * into result;
 if not found then raise exception 'Profile not ready. Reopen Profile.';end if;
 return result;
end;$$;
revoke execute on function public.dangal_profile_sync(),public.dangal_edit_profile(text,text,integer,text,text) from public,anon;
grant execute on function public.dangal_profile_sync(),public.dangal_edit_profile(text,text,integer,text,text) to authenticated;
-- RLS-scoped change signals; mutation continues through the existing validated RPCs.
grant select on public.dangal_matches to authenticated;
create policy "match participant read" on public.dangal_matches for select to authenticated using((select auth.uid()) in(user_a,user_b));
do $$begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='dangal_matches') then alter publication supabase_realtime add table public.dangal_matches;end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='dangal_profiles') then alter publication supabase_realtime add table public.dangal_profiles;end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='dangal_friendships') then alter publication supabase_realtime add table public.dangal_friendships;end if;
end$$;
