-- Migration generated by C15T (2023-01-01T00:00:00.000Z)
-- Database type: mysql
-- Description: Automatically generated schema migration
-- 
-- Wrapped in a transaction for atomicity
-- To roll back this migration, use the ROLLBACK section below

START TRANSACTION;

-- MIGRATION
CREATE TABLE IF NOT EXISTS "user" (
  "id" VARCHAR(255) NOT NULL PRIMARY KEY,
  "isIdentified" TINYINT(1) NOT NULL,
  "externalId" text,
  "identityProvider" text,
  "lastIpAddress" text,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  "userTimezone" text
);

CREATE TABLE IF NOT EXISTS "purpose" (
  "id" VARCHAR(255) NOT NULL PRIMARY KEY,
  "code" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" VARCHAR(255) NOT NULL,
  "isEssential" TINYINT(1) NOT NULL,
  "dataCategory" text,
  "legalBasis" text,
  "isActive" TINYINT(1) NOT NULL,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "domain" (
  "id" VARCHAR(255) NOT NULL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL UNIQUE,
  "description" VARCHAR(255),
  "allowedOrigins" text,
  "isVerified" TINYINT(1) NOT NULL,
  "isActive" TINYINT(1) NOT NULL,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME
);

CREATE TABLE IF NOT EXISTS "geoLocation" (
  "id" VARCHAR(255) NOT NULL PRIMARY KEY,
  "countryCode" text NOT NULL,
  "countryName" text NOT NULL,
  "regionCode" text,
  "regionName" text,
  "regulatoryZones" text,
  "createdAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "consentPolicy" (
  "id" VARCHAR(255) NOT NULL PRIMARY KEY,
  "version" text NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "effectiveDate" date NOT NULL,
  "expirationDate" date,
  "content" text NOT NULL,
  "contentHash" text NOT NULL,
  "isActive" TINYINT(1) NOT NULL,
  "createdAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "consent" (
  "id" VARCHAR(255) NOT NULL PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user" ("id"),
  "domainId" text NOT NULL REFERENCES "domain" ("id"),
  "purposeIds" text NOT NULL,
  "policyId" text REFERENCES "consentPolicy" ("id"),
  "status" text NOT NULL,
  "withdrawalReason" text,
  "ipAddress" text,
  "userAgent" text,
  "metadata" JSON,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME,
  "expiresAt" DATETIME
);

CREATE TABLE IF NOT EXISTS "purposeJunction" (
  "id" VARCHAR(255) NOT NULL PRIMARY KEY,
  "consentId" text NOT NULL REFERENCES "consent" ("id"),
  "purposeId" text NOT NULL REFERENCES "purpose" ("id"),
  "status" text NOT NULL,
  "metadata" JSON,
  "createdAt" DATETIME NOT NULL,
  "updatedAt" DATETIME
);

CREATE TABLE IF NOT EXISTS "consentGeoLocation" (
  "id" VARCHAR(255) NOT NULL PRIMARY KEY,
  "consentId" text NOT NULL REFERENCES "consent" ("id"),
  "ip" text NOT NULL,
  "country" text,
  "region" text,
  "city" text,
  "latitude" integer,
  "longitude" integer,
  "timezone" text,
  "createdAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "record" (
  "id" VARCHAR(255) NOT NULL PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user" ("id"),
  "consentId" text REFERENCES "consent" ("id"),
  "actionType" text NOT NULL,
  "details" text,
  "createdAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "withdrawal" (
  "id" VARCHAR(255) NOT NULL PRIMARY KEY,
  "consentId" text NOT NULL REFERENCES "consent" ("id"),
  "userId" text NOT NULL REFERENCES "user" ("id"),
  "withdrawalReason" text,
  "withdrawalMethod" text NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "metadata" JSON,
  "createdAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "auditLog" (
  "id" VARCHAR(255) NOT NULL PRIMARY KEY,
  "entityType" text NOT NULL,
  "entityId" text NOT NULL,
  "actionType" text NOT NULL,
  "userId" text REFERENCES "user" ("id"),
  "ipAddress" text,
  "userAgent" text,
  "changes" text,
  "metadata" JSON,
  "createdAt" DATETIME NOT NULL,
  "eventTimezone" text NOT NULL
);

COMMIT;

-- ROLLBACK
-- Uncomment the section below to roll back this migration
/*
START TRANSACTION;

DROP TABLE IF EXISTS "auditLog";

DROP TABLE IF EXISTS "withdrawal";

DROP TABLE IF EXISTS "record";

DROP TABLE IF EXISTS "consentGeoLocation";

DROP TABLE IF EXISTS "purposeJunction";

DROP TABLE IF EXISTS "consent";

DROP TABLE IF EXISTS "consentPolicy";

DROP TABLE IF EXISTS "geoLocation";

DROP TABLE IF EXISTS "domain";

DROP TABLE IF EXISTS "purpose";

DROP TABLE IF EXISTS "user";

COMMIT;
*/