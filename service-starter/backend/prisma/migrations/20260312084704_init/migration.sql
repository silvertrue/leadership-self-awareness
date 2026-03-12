-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('not_started', 'draft', 'submitted');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('waiting_self', 'waiting_peer', 'ready', 'exported');

-- CreateTable
CREATE TABLE "participants" (
    "participant_id" VARCHAR(32) NOT NULL,
    "name_ko" VARCHAR(100) NOT NULL,
    "team_name" VARCHAR(150) NOT NULL,
    "group_name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(200),
    "self_token" VARCHAR(120),
    "report_token" VARCHAR(120),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("participant_id")
);

-- CreateTable
CREATE TABLE "peer_assignments" (
    "assignment_id" VARCHAR(40) NOT NULL,
    "responder_id" VARCHAR(32) NOT NULL,
    "target_id" VARCHAR(32) NOT NULL,
    "peer_token" VARCHAR(120) NOT NULL,
    "sequence_no" INTEGER NOT NULL,
    "group_name" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "peer_assignments_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateTable
CREATE TABLE "self_responses" (
    "participant_id" VARCHAR(32) NOT NULL,
    "strength_1" VARCHAR(50) NOT NULL,
    "strength_1_comment" TEXT NOT NULL,
    "strength_2" VARCHAR(50) NOT NULL,
    "strength_2_comment" TEXT NOT NULL,
    "growth_1" VARCHAR(50) NOT NULL,
    "growth_1_comment" TEXT NOT NULL,
    "growth_2" VARCHAR(50) NOT NULL,
    "growth_2_comment" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'submitted',
    "submitted_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "self_responses_pkey" PRIMARY KEY ("participant_id")
);

-- CreateTable
CREATE TABLE "peer_responses" (
    "assignment_id" VARCHAR(40) NOT NULL,
    "strength_1" VARCHAR(50) NOT NULL,
    "strength_1_comment" TEXT NOT NULL,
    "strength_2" VARCHAR(50) NOT NULL,
    "strength_2_comment" TEXT NOT NULL,
    "growth_1" VARCHAR(50) NOT NULL,
    "growth_1_comment" TEXT NOT NULL,
    "growth_2" VARCHAR(50) NOT NULL,
    "growth_2_comment" TEXT NOT NULL,
    "free_message" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'submitted',
    "submitted_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "peer_responses_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateTable
CREATE TABLE "peer_submission_batches" (
    "responder_id" VARCHAR(32) NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'submitted',

    CONSTRAINT "peer_submission_batches_pkey" PRIMARY KEY ("responder_id")
);

-- CreateTable
CREATE TABLE "report_runs" (
    "report_run_id" BIGSERIAL NOT NULL,
    "participant_id" VARCHAR(32) NOT NULL,
    "source_self_updated_at" TIMESTAMP(3),
    "source_peer_updated_at" TIMESTAMP(3),
    "peer_response_count" INTEGER NOT NULL DEFAULT 0,
    "report_status" "ReportStatus" NOT NULL,
    "insight_title" TEXT,
    "insight_body" TEXT,
    "report_json" JSONB NOT NULL,
    "html_path" TEXT,
    "pdf_path" TEXT,
    "llm_model" VARCHAR(100),
    "llm_prompt_version" VARCHAR(40),
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_runs_pkey" PRIMARY KEY ("report_run_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "participants_self_token_key" ON "participants"("self_token");

-- CreateIndex
CREATE UNIQUE INDEX "participants_report_token_key" ON "participants"("report_token");

-- CreateIndex
CREATE INDEX "peer_assignments_responder_id_idx" ON "peer_assignments"("responder_id");

-- CreateIndex
CREATE INDEX "peer_assignments_target_id_idx" ON "peer_assignments"("target_id");

-- CreateIndex
CREATE UNIQUE INDEX "peer_assignments_responder_id_target_id_key" ON "peer_assignments"("responder_id", "target_id");

-- CreateIndex
CREATE INDEX "report_runs_participant_id_generated_at_idx" ON "report_runs"("participant_id", "generated_at" DESC);

-- AddForeignKey
ALTER TABLE "peer_assignments" ADD CONSTRAINT "peer_assignments_responder_id_fkey" FOREIGN KEY ("responder_id") REFERENCES "participants"("participant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_assignments" ADD CONSTRAINT "peer_assignments_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "participants"("participant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "self_responses" ADD CONSTRAINT "self_responses_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("participant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_responses" ADD CONSTRAINT "peer_responses_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "peer_assignments"("assignment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_submission_batches" ADD CONSTRAINT "peer_submission_batches_responder_id_fkey" FOREIGN KEY ("responder_id") REFERENCES "participants"("participant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_runs" ADD CONSTRAINT "report_runs_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("participant_id") ON DELETE RESTRICT ON UPDATE CASCADE;
