/*
  Warnings:

  - You are about to drop the `Course` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Otp" ALTER COLUMN "expiresAt" SET DEFAULT (now() + interval '10 minutes');

-- DropTable
DROP TABLE "public"."Course";

-- CreateTable
CREATE TABLE "public"."Module" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "plan_type" "public"."PlanType" NOT NULL,
    "isCertificationOnCompletion" BOOLEAN NOT NULL DEFAULT false,
    "total_hours" DOUBLE PRECISION NOT NULL,
    "subtitle_available" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "features" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Module" ADD CONSTRAINT "Module_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
