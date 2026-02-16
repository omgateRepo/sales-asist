-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add role and tenant_id to users
ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'company_admin';
ALTER TABLE "users" ADD COLUMN "tenant_id" UUID;

-- Backfill: existing users become platform_admin
UPDATE "users" SET "role" = 'platform_admin', "is_super_admin" = true;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
