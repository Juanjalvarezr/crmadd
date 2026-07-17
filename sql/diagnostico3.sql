SELECT schemaname, tablename, policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
SELECT id, email, email_confirmed_at FROM auth.users ORDER BY created_at DESC LIMIT 5;
SELECT extract(epoch FROM now()) AS ts;
