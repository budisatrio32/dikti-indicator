-- CreateTable
CREATE TABLE "iku_targets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_email" TEXT NOT NULL,
    "iku_code" TEXT NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "iku_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "iku_targets_user_email_idx" ON "iku_targets"("user_email");

-- CreateIndex
CREATE UNIQUE INDEX "iku_targets_user_email_iku_code_key" ON "iku_targets"("user_email", "iku_code");
