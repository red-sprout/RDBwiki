update public.documents
set content = replace(content, E'\n<!-- reference-depth-v2 -->\n', E'\n'),
    updated_at = now()
where position('<!-- reference-depth-v2 -->' in content) > 0;
