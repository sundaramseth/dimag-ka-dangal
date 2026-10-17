-- Dedicated development project only. No email, sessions or retained rows.
begin;
insert into auth.users(id) values('dd050000-0000-4000-8000-000000000001'),('dd050000-0000-4000-8000-000000000002'),('dd050000-0000-4000-8000-000000000003');
select set_config('request.jwt.claim.sub','dd050000-0000-4000-8000-000000000001',true);set local role authenticated;
select public.dangal_set_profile('review_a_050','Review A');select public.dangal_heartbeat(true);
select set_config('dangal.test_match',(public.dangal_queue('zip')->>'id'),true);
reset role;select set_config('request.jwt.claim.sub','dd050000-0000-4000-8000-000000000002',true);set local role authenticated;
select public.dangal_set_profile('review_b_050','Review B');select public.dangal_heartbeat(true);
do $$declare m jsonb;begin m:=public.dangal_queue('zip');if m->>'id'<>current_setting('dangal.test_match') or m->>'state'<>'active' then raise exception 'Pairing failed';end if;end$$;
select public.dangal_chat(current_setting('dangal.test_match')::uuid,'Good game!');
reset role;select set_config('request.jwt.claim.sub','dd050000-0000-4000-8000-000000000003',true);set local role authenticated;
select public.dangal_set_profile('review_c_050','Review C');
do $$begin
 begin perform public.dangal_match_state(current_setting('dangal.test_match')::uuid);raise exception 'Third party accessed match';exception when raise_exception then if sqlerrm='Third party accessed match' then raise;end if;end;
 begin perform public.dangal_chat(current_setting('dangal.test_match')::uuid,'intrusion');raise exception 'Third party accessed chat';exception when raise_exception then if sqlerrm='Third party accessed chat' then raise;end if;end;
 begin perform public.dangal_record_finish(current_setting('dangal.test_match')::uuid,auth.uid());raise exception 'Client forged result';exception when insufficient_privilege then null;end;
end$$;
reset role;select set_config('request.jwt.claim.sub','dd050000-0000-4000-8000-000000000001',true);set local role authenticated;
do $$declare messages jsonb;begin messages:=public.dangal_chat(current_setting('dangal.test_match')::uuid);if messages->0->>'body'<>'Good game!' then raise exception 'Chat missing';end if;end$$;
reset role;
update public.dangal_matches set starts_at=now()-interval '5 seconds' where id=current_setting('dangal.test_match')::uuid;
-- Simulates the trusted post-validation writer only; not a live JWT/Edge end-to-end test.
select public.dangal_record_finish(current_setting('dangal.test_match')::uuid,'dd050000-0000-4000-8000-000000000001');
select public.dangal_record_finish(current_setting('dangal.test_match')::uuid,'dd050000-0000-4000-8000-000000000002');
select set_config('request.jwt.claim.sub','dd050000-0000-4000-8000-000000000001',true);set local role authenticated;
do $$declare m jsonb;begin m:=public.dangal_match_state(current_setting('dangal.test_match')::uuid);if m->>'state'<>'finished' then raise exception 'Finalization failed';end if;if not exists(select 1 from jsonb_array_elements(public.dangal_rankings(false)) x where x->>'id'=auth.uid()::text and (x->>'played')::int=1) then raise exception 'Ranking failed';end if;end$$;
reset role;set local role anon;
do $$begin begin perform public.dangal_match_inbox();raise exception 'Anonymous match API';exception when insufficient_privilege then null;end;end$$;
reset role;rollback;
select 'PASS hosted arena: matching, private chat, participant isolation, client result denial, trusted finalization and rankings. All synthetic rows rolled back.' as result;
