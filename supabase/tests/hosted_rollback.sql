-- Run only in the dedicated development project. No emails or persistent test users.
-- Every synthetic auth row and friendship is rolled back, including on assertion failure.
begin;
insert into auth.users(id) values
 ('dd040000-0000-4000-8000-000000000001'),
 ('dd040000-0000-4000-8000-000000000002'),
 ('dd040000-0000-4000-8000-000000000003');
select set_config('request.jwt.claim.sub','dd040000-0000-4000-8000-000000000001',true);
set local role authenticated;
select public.dangal_set_profile('dangal_test_a_040','Test A');
reset role;
select set_config('request.jwt.claim.sub','dd040000-0000-4000-8000-000000000002',true);
set local role authenticated;
select public.dangal_set_profile('dangal_test_b_040','Test B');
reset role;
select set_config('request.jwt.claim.sub','dd040000-0000-4000-8000-000000000003',true);
set local role authenticated;
select public.dangal_set_profile('dangal_test_c_040','Test C');
reset role;
select set_config('request.jwt.claim.sub','dd040000-0000-4000-8000-000000000001',true);
set local role authenticated;
select public.dangal_request_friend('dangal_test_b_040');
do $$begin
 if (select count(*) from public.dangal_profiles)<>1 then raise exception 'Profile isolation failed';end if;
 if not exists(select 1 from public.dangal_friends() where handle='dangal_test_b_040' and status='pending' and incoming=false) then raise exception 'Outgoing request missing';end if;
 begin
  perform public.dangal_accept_friend('dd040000-0000-4000-8000-000000000002');
  raise exception 'Sender accepted own request';
 exception when raise_exception then
  if sqlerrm='Sender accepted own request' then raise;end if;
 end;
end$$;
reset role;
select set_config('request.jwt.claim.sub','dd040000-0000-4000-8000-000000000003',true);
set local role authenticated;
do $$begin
 if exists(select 1 from public.dangal_friendships) then raise exception 'Third-party friendship leak';end if;
 begin
  update public.dangal_friendships set status='accepted';
  raise exception 'Direct write allowed';
 exception when insufficient_privilege then null;end;
end$$;
select public.dangal_remove_friend('dd040000-0000-4000-8000-000000000001');
reset role;
select set_config('request.jwt.claim.sub','dd040000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$begin
 if not exists(select 1 from public.dangal_friends() where incoming and status='pending') then raise exception 'Incoming request missing';end if;
end$$;
select public.dangal_accept_friend('dd040000-0000-4000-8000-000000000001');
do $$begin
 if not exists(select 1 from public.dangal_friends() where status='accepted') then raise exception 'Accept failed';end if;
end$$;
select public.dangal_remove_friend('dd040000-0000-4000-8000-000000000001');
do $$begin
 if exists(select 1 from public.dangal_friends()) then raise exception 'Remove failed';end if;
end$$;
reset role;
set local role anon;
do $$begin
 begin
  perform public.dangal_request_friend('dangal_test_b_040');
  raise exception 'Anonymous RPC allowed';
 exception when insufficient_privilege then null;end;
 begin
  perform 1 from public.dangal_profiles;
  raise exception 'Anonymous profile read allowed';
 exception when insufficient_privilege then null;end;
end$$;
reset role;
rollback;
select 'PASS: hosted transaction request, recipient accept, isolation, direct-write denial, removal, anonymous denial; all test rows rolled back' as result;
