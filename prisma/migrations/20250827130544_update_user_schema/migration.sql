-- AlterTable
ALTER TABLE "public"."Otp" ALTER COLUMN "expiresAt" SET DEFAULT (now() + interval '10 minutes');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "username" TEXT;
