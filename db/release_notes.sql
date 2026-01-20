create table release_notes
(
    id           uuid                     not null
        primary key,
    product_id   uuid                     not null,
    version      varchar(50)              not null,
    release_date date,
    title        varchar(200),
    summary      text,
    items        jsonb default '[]'::jsonb,
    created_at   timestamp with time zone not null,
    updated_at   timestamp with time zone not null,
    deleted_at   timestamp with time zone,
    template_id  uuid
);

alter table release_notes
    owner to db1usr;

INSERT INTO public.release_notes (id, product_id, version, release_date, title, summary, items, created_at, updated_at, deleted_at, template_id) VALUES ('53df7917-39e7-4a3a-a148-38c2e417c832', '83b238d8-43e1-4f1d-8740-7d7c62c32b49', 'v1', '2025-12-18', null, 'sdfssdf', '[{"id": "4050dd79-c530-421f-9477-bb376cab5d05", "type": "improvement", "title": "gsdfsfg", "visibility": "public", "description": ""}, {"id": "de458454-1b6c-4b18-ab59-20a407b9f3d6", "type": "security", "title": "fdgsdfgsd", "visibility": "public", "description": ""}, {"id": "19fb7233-0a3f-4ae5-ad2d-7df2369f28fd", "type": "performance", "title": "sfdgsdfgsd", "visibility": "public", "description": ""}]', '2025-12-18 06:51:16.473000 +00:00', '2026-01-12 13:52:47.332139 +00:00', null, null);
INSERT INTO public.release_notes (id, product_id, version, release_date, title, summary, items, created_at, updated_at, deleted_at, template_id) VALUES ('7dca9bb0-4d81-4562-90e3-30810397da26', '61eaa2d3-68c8-4f15-a44f-54c11b43d2e4', '1', '2026-01-15', null, 'Publice wifi is ready to go live ', '[{"type": "feature", "title": "Captive Portal ", "description": "A user can successfuly navigate to our own capitve portal and use internet"}]', '2026-01-15 11:39:13.910000 +00:00', '2026-01-15 11:39:13.910000 +00:00', null, null);
INSERT INTO public.release_notes (id, product_id, version, release_date, title, summary, items, created_at, updated_at, deleted_at, template_id) VALUES ('15d025c6-34da-4470-8915-52496ffcb3f8', '5f55d854-02a3-476f-b70a-e6cdd3e88914', '1.0', '2026-01-15', null, 'First release of Configurations', '[{"type": "deprecation", "title": "Accural Config", "description": "Accural config details "}, {"type": "feature", "title": "Allocation", "description": "Allocation config details "}, {"type": "bugfix", "title": "Distribution", "description": "Bugs - 4"}]', '2026-01-15 12:05:48.564000 +00:00', '2026-01-15 12:07:54.356000 +00:00', null, '98df7e52-4598-4366-9a5a-6b6ac75bea1e');
