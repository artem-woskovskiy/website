-- CreateEnum
CREATE TYPE "DeviceAuthStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'EXPIRED', 'CONSUMED');

-- AlterTable
ALTER TABLE "Session"
    ADD COLUMN "clientId"   TEXT,
    ADD COLUMN "scope"      TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "deviceName" TEXT,
    ADD COLUMN "platform"   TEXT,
    ADD COLUMN "geoCountry" TEXT;

-- CreateTable
CREATE TABLE "OAuthClient" (
    "id"            TEXT NOT NULL,
    "clientId"      TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "description"   TEXT,
    "iconUrl"       TEXT,
    "redirectUris"  TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowedScopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requirePkce"   BOOLEAN NOT NULL DEFAULT true,
    "isActive"      BOOLEAN NOT NULL DEFAULT true,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceAuthorization" (
    "id"                  TEXT NOT NULL,
    "clientId"            TEXT NOT NULL,
    "userId"              TEXT,
    "codeHash"            TEXT,
    "codeChallenge"       TEXT NOT NULL,
    "codeChallengeMethod" TEXT NOT NULL,
    "redirectUri"         TEXT NOT NULL,
    "scope"               TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status"              "DeviceAuthStatus" NOT NULL DEFAULT 'PENDING',
    "deviceName"          TEXT,
    "platform"            TEXT,
    "ip"                  TEXT,
    "userAgent"           TEXT,
    "geoCountry"          TEXT,
    "expiresAt"           TIMESTAMP(3) NOT NULL,
    "approvedAt"          TIMESTAMP(3),
    "consumedAt"          TIMESTAMP(3),
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OAuthClient_clientId_key" ON "OAuthClient"("clientId");

-- CreateIndex
CREATE INDEX "OAuthClient_isActive_idx" ON "OAuthClient"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceAuthorization_codeHash_key" ON "DeviceAuthorization"("codeHash");

-- CreateIndex
CREATE INDEX "DeviceAuthorization_clientId_idx" ON "DeviceAuthorization"("clientId");

-- CreateIndex
CREATE INDEX "DeviceAuthorization_userId_idx" ON "DeviceAuthorization"("userId");

-- CreateIndex
CREATE INDEX "DeviceAuthorization_status_expiresAt_idx" ON "DeviceAuthorization"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Session_clientId_idx" ON "Session"("clientId");

-- AddForeignKey
ALTER TABLE "Session"
    ADD CONSTRAINT "Session_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "OAuthClient"("clientId")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceAuthorization"
    ADD CONSTRAINT "DeviceAuthorization_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "OAuthClient"("clientId")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceAuthorization"
    ADD CONSTRAINT "DeviceAuthorization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
