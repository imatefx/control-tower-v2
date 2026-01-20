create table team_capacities
(
    id                  uuid                     not null
        primary key,
    user_id             uuid                     not null,
    user_name           varchar(100),
    manager_id          uuid,
    manager_name        varchar(100),
    max_capacity        integer                           default 5,
    current_load        integer                           default 0,
    utilization_percent double precision                  default '0'::double precision,
    skills              varchar(255)[]                    default (ARRAY []::character varying[])::character varying(255)[],
    availability        enum_team_capacities_availability default 'available'::enum_team_capacities_availability,
    unavailable_dates   jsonb                             default '[]'::jsonb,
    created_at          timestamp with time zone not null,
    updated_at          timestamp with time zone not null,
    deleted_at          timestamp with time zone
);

alter table team_capacities
    owner to db1usr;

INSERT INTO public.team_capacities (id, created_at, updated_at, deleted_at, team_name, total_capacity, allocated_capacity, available_capacity, week_start) VALUES ('2cdac315-5d93-44d6-843b-e5e2aa66a858', '2026-01-16 06:31:51.927000 +00:00', '2026-01-16 06:31:51.927000 +00:00', null, 'Capital Credits 2.0', 4, 3, 3, '2025-12-01');
