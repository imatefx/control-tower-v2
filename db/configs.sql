create table configs
(
    id         uuid                     not null
        primary key,
    key        varchar(100)             not null
        constraint configs_key_key4
            unique
        constraint configs_key_key2
            unique
        unique
        constraint configs_key_key1
            unique
        constraint configs_key_key3
            unique
        constraint configs_key_key5
            unique,
    value      jsonb,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

alter table configs
    owner to db1usr;

INSERT INTO public.configs (id, key, value, created_at, updated_at) VALUES ('5270c850-ebd8-4b8c-baa8-15abfc1a31bd', 'docTypes', '[{"key": "productGuide", "label": "Product Guide", "order": 1}, {"key": "releaseNotes", "label": "Release Notes", "order": 2}, {"key": "demoScript", "label": "Demo Script", "order": 3}, {"key": "testCases", "label": "Test Cases", "order": 4}, {"key": "productionChecklist", "label": "Production Checklist", "order": 5}]', '2026-01-12 13:47:36.598000 +00:00', '2026-01-12 13:47:36.598000 +00:00');
INSERT INTO public.configs (id, key, value, created_at, updated_at) VALUES ('1e9b3b0a-6f9c-4d06-8edb-111218f2686b', 'deploymentDocTypes', '[{"key": "runbook", "label": "Runbook", "order": 1}, {"key": "releaseNotesLink", "label": "Release Notes Link", "order": 2}, {"key": "qaReport", "label": "QA Report", "order": 3}]', '2026-01-12 13:47:36.843000 +00:00', '2026-01-12 13:47:36.843000 +00:00');
