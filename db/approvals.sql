create table approvals
(
    id                uuid                     not null
        primary key,
    deployment_id     uuid                     not null,
    deployment_name   varchar(200),
    product_id        uuid,
    product_name      varchar(200),
    client_id         uuid,
    client_name       varchar(200),
    requested_by      uuid                     not null,
    requested_by_name varchar(100),
    requested_at      timestamp with time zone,
    status            enum_approvals_status default 'pending'::enum_approvals_status,
    reviewed_by       uuid,
    reviewed_by_name  varchar(100),
    reviewed_at       timestamp with time zone,
    comments          text,
    rejection_reason  text,
    created_at        timestamp with time zone not null,
    updated_at        timestamp with time zone not null,
    deleted_at        timestamp with time zone
);

alter table approvals
    owner to db1usr;

