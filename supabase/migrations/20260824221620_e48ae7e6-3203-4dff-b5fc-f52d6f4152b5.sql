REVOKE EXECUTE ON FUNCTION public.are_connected(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.are_connected(uuid, uuid) TO authenticated;