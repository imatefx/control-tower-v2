create table checklist_templates
(
    id          uuid                     not null
        primary key,
    key         varchar(50)              not null
        constraint checklist_templates_key_key4
            unique
        constraint checklist_templates_key_key2
            unique
        unique
        constraint checklist_templates_key_key1
            unique
        constraint checklist_templates_key_key3
            unique
        constraint checklist_templates_key_key5
            unique,
    label       varchar(200)             not null,
    description varchar(500),
    sort_order  integer default 0,
    is_active   boolean default true,
    created_at  timestamp with time zone not null,
    updated_at  timestamp with time zone not null,
    deleted_at  timestamp with time zone
);

alter table checklist_templates
    owner to db1usr;

INSERT INTO public.checklist_templates (id, key, label, description, sort_order, is_active, created_at, updated_at, deleted_at) VALUES ('3dbb8b94-62bb-488a-b40b-21777797fafc', 'requirements', 'Requirements Gathering', null, 1, true, '2026-01-12 14:49:53.073000 +00:00', '2026-01-12 14:49:53.073000 +00:00', null);
INSERT INTO public.checklist_templates (id, key, label, description, sort_order, is_active, created_at, updated_at, deleted_at) VALUES ('484c838e-0ac1-4b55-bc28-5ccb45cc5003', 'design', 'Design & Architecture', null, 2, true, '2026-01-12 14:49:53.124000 +00:00', '2026-01-12 14:49:53.124000 +00:00', null);
INSERT INTO public.checklist_templates (id, key, label, description, sort_order, is_active, created_at, updated_at, deleted_at) VALUES ('3422f918-5612-448d-8d8a-93558cfd1345', 'development', 'Development', null, 3, true, '2026-01-12 14:49:53.183000 +00:00', '2026-01-12 14:49:53.183000 +00:00', null);
INSERT INTO public.checklist_templates (id, key, label, description, sort_order, is_active, created_at, updated_at, deleted_at) VALUES ('ea9ba850-044b-4eb6-97bb-9deb2f832bd6', 'testing', 'Testing', null, 4, true, '2026-01-12 14:49:53.232000 +00:00', '2026-01-12 14:49:53.232000 +00:00', null);
INSERT INTO public.checklist_templates (id, key, label, description, sort_order, is_active, created_at, updated_at, deleted_at) VALUES ('101f6734-3366-4115-8992-df60b2fc3d89', 'documentation', 'Documentation', null, 5, true, '2026-01-12 14:49:53.282000 +00:00', '2026-01-12 14:49:53.282000 +00:00', null);
INSERT INTO public.checklist_templates (id, key, label, description, sort_order, is_active, created_at, updated_at, deleted_at) VALUES ('18829d64-54ad-4470-b274-35475ed33e25', 'training', 'Training', null, 6, true, '2026-01-12 14:49:53.338000 +00:00', '2026-01-12 14:49:53.338000 +00:00', null);
INSERT INTO public.checklist_templates (id, key, label, description, sort_order, is_active, created_at, updated_at, deleted_at) VALUES ('6580ee37-3282-404b-b18f-7e021ef4ea21', 'deployment', 'Deployment', null, 7, true, '2026-01-12 14:49:53.384000 +00:00', '2026-01-12 14:49:53.384000 +00:00', null);
INSERT INTO public.checklist_templates (id, key, label, description, sort_order, is_active, created_at, updated_at, deleted_at) VALUES ('443c9bd4-05dd-43c2-aabb-81028ec87841', 'validation', 'Validation', null, 8, true, '2026-01-12 14:49:53.437000 +00:00', '2026-01-12 14:49:53.437000 +00:00', null);
INSERT INTO public.checklist_templates (id, key, label, description, sort_order, is_active, created_at, updated_at, deleted_at) VALUES ('4a4cf36a-f918-4134-9c39-3ec0cb1407a0', 'handover', 'Handover', null, 9, true, '2026-01-12 14:49:53.487000 +00:00', '2026-01-12 14:49:53.487000 +00:00', null);
