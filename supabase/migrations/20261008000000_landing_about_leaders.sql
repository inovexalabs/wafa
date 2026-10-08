-- The About section now has written vision/mission copy, six values, and a
-- leaderMessages list (chairman + CEO) replacing the single chairmanMessage.
-- Saved content overrides the API defaults, so drop fields that still hold
-- the original untouched placeholders and let the new defaults show through.
-- Anything a superadmin has already edited is left alone.

update public.landing_content
set content = content #- '{about,vision}'
where content->'about'->>'vision' like 'A placeholder vision statement.%';

update public.landing_content
set content = content #- '{about,mission}'
where content->'about'->>'mission' like 'A placeholder mission statement.%';

update public.landing_content
set content = content #- '{about,values}'
where content->'about'->'values' = '[
  {"title": "Transparency", "text": "Every ledger, receipt, and decision stays visible to the members it affects."},
  {"title": "Trust", "text": "We grow only as fast as the trust between members allows."},
  {"title": "Community", "text": "We are for all — every member matters, every contribution counts."}
]'::jsonb;

update public.landing_content
set content = content #- '{about,chairmanMessage}'
where content->'about'->'chairmanMessage'->>'message' like 'A placeholder message from the chairman.%';
