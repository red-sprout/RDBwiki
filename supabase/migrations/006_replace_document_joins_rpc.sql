create or replace function public.replace_document_joins(
  p_document_id uuid,
  p_tag_ids uuid[] default '{}',
  p_official_docs jsonb default '[]'::jsonb
)
returns void
language plpgsql
set search_path = public
as $$
begin
  delete from public.document_tags
  where document_id = p_document_id;

  insert into public.document_tags (document_id, tag_id)
  select p_document_id, tag_id
  from unnest(coalesce(p_tag_ids, '{}')) as tag_id
  on conflict do nothing;

  delete from public.official_docs
  where document_id = p_document_id;

  insert into public.official_docs (document_id, dbms, title, url, note, version)
  select
    p_document_id,
    coalesce(nullif(trim(item->>'dbms'), ''), 'General'),
    trim(item->>'title'),
    trim(item->>'url'),
    nullif(trim(coalesce(item->>'note', '')), ''),
    nullif(trim(coalesce(item->>'version', '')), '')
  from jsonb_array_elements(coalesce(p_official_docs, '[]'::jsonb)) as item
  where trim(item->>'title') <> ''
    and trim(item->>'url') <> '';
end;
$$;
