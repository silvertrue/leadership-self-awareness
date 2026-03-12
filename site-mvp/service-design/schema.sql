-- Self Awareness Session schema draft

create table participants (
  participant_id varchar(32) primary key,
  name_ko varchar(100) not null,
  team_name varchar(150) not null,
  group_name varchar(50) not null,
  email varchar(200),
  self_token varchar(120) unique,
  report_token varchar(120) unique,
  is_active boolean not null default true,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp
);

create table peer_assignments (
  assignment_id varchar(40) primary key,
  responder_id varchar(32) not null references participants(participant_id),
  target_id varchar(32) not null references participants(participant_id),
  peer_token varchar(120) not null,
  sequence_no integer not null,
  group_name varchar(50) not null,
  is_active boolean not null default true,
  created_at timestamp not null default current_timestamp,
  unique (responder_id, target_id)
);

create table self_responses (
  participant_id varchar(32) primary key references participants(participant_id),
  strength_1 varchar(50) not null,
  strength_1_comment text not null,
  strength_2 varchar(50) not null,
  strength_2_comment text not null,
  growth_1 varchar(50) not null,
  growth_1_comment text not null,
  growth_2 varchar(50) not null,
  growth_2_comment text not null,
  status varchar(20) not null default 'submitted',
  submitted_at timestamp,
  updated_at timestamp not null default current_timestamp,
  check (strength_1 <> strength_2),
  check (growth_1 <> growth_2)
);

create table peer_responses (
  assignment_id varchar(40) primary key references peer_assignments(assignment_id),
  strength_1 varchar(50) not null,
  strength_1_comment text not null,
  strength_2 varchar(50) not null,
  strength_2_comment text not null,
  growth_1 varchar(50) not null,
  growth_1_comment text not null,
  growth_2 varchar(50) not null,
  growth_2_comment text not null,
  free_message text,
  status varchar(20) not null default 'submitted',
  submitted_at timestamp,
  updated_at timestamp not null default current_timestamp,
  check (strength_1 <> strength_2),
  check (growth_1 <> growth_2)
);

create table peer_submission_batches (
  responder_id varchar(32) primary key references participants(participant_id),
  submitted_at timestamp not null,
  status varchar(20) not null default 'submitted'
);

create table report_runs (
  report_run_id bigserial primary key,
  participant_id varchar(32) not null references participants(participant_id),
  source_self_updated_at timestamp,
  source_peer_updated_at timestamp,
  peer_response_count integer not null default 0,
  report_status varchar(20) not null,
  insight_title text,
  insight_body text,
  report_json jsonb not null,
  html_path text,
  pdf_path text,
  llm_model varchar(100),
  llm_prompt_version varchar(40),
  generated_at timestamp not null default current_timestamp
);

create index idx_peer_assignments_responder on peer_assignments(responder_id);
create index idx_peer_assignments_target on peer_assignments(target_id);
create index idx_report_runs_participant on report_runs(participant_id, generated_at desc);
