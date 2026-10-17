-- Serialize invite acceptance with matchmaking; one live game per participant.
create or replace function public.dangal_accept_match(p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();m public.dangal_matches;begin
 if me is null then raise exception 'Sign in required';end if;
 perform pg_advisory_xact_lock(505040);
 select * into m from public.dangal_matches where id=p_id and user_b=me and state='invited' and expires_at>clock_timestamp() for update;
 if not found then raise exception 'Invitation expired or unavailable';end if;
 if exists(select 1 from public.dangal_matches where id<>p_id and state='active' and(user_a in(m.user_a,m.user_b) or user_b in(m.user_a,m.user_b))) then raise exception 'A player is already in a game';end if;
 update public.dangal_matches set state='cancelled' where id<>p_id and state='waiting' and user_a in(m.user_a,m.user_b);
 update public.dangal_matches set state='active',starts_at=clock_timestamp()+interval '4 seconds',expires_at=clock_timestamp()+interval '184 seconds' where id=p_id;
 return public.dangal_match_state(p_id);
end;$$;
revoke execute on function public.dangal_accept_match(uuid) from public,anon;
grant execute on function public.dangal_accept_match(uuid) to authenticated;
-- JSON pages avoid the Data API's set-returning row cap; UI loads until exhausted.
create function public.dangal_friend_page(p_offset integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 if p_offset<0 then raise exception 'Invalid page';end if;
 return coalesce((select jsonb_agg(to_jsonb(q)) from (select * from public.dangal_social_friends() order by display_name,peer_id offset p_offset limit 200) q),'[]'::jsonb);
end;$$;
revoke execute on function public.dangal_friend_page(integer) from public,anon;
grant execute on function public.dangal_friend_page(integer) to authenticated;
