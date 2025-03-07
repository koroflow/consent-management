-- Migration number: 0001 	 2025-03-06T13:22:19.714Z
-- Migration generated by C15T (2023-01-01T00:00:00.000Z)
-- Database type: sqlite
-- Description: Automatically generated schema migration

CREATE TABLE IF NOT EXISTS "user" (
  "id" text NOT NULL PRIMARY KEY,
  "isIdentified" integer NOT NULL,
  "externalId" text,
  "identityProvider" text,
  "lastIpAddress" text,
  "createdAt" date NOT NULL,
  "updatedAt" date NOT NULL,
  "userTimezone" text
);

CREATE TABLE IF NOT EXISTS "purpose" (
  "id" text NOT NULL PRIMARY KEY,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "isEssential" integer NOT NULL,
  "dataCategory" text,
  "legalBasis" text,
  "isActive" integer NOT NULL,
  "createdAt" date NOT NULL,
  "updatedAt" date NOT NULL
);

CREATE TABLE IF NOT EXISTS "domain" (
  "id" text NOT NULL PRIMARY KEY,
  "name" text NOT NULL UNIQUE,
  "description" text,
  "allowedOrigins" text,
  "isVerified" integer NOT NULL,
  "isActive" integer NOT NULL,
  "createdAt" date NOT NULL,
  "updatedAt" date
);

CREATE TABLE IF NOT EXISTS "geoLocation" (
  "id" text NOT NULL PRIMARY KEY,
  "countryCode" text NOT NULL,
  "countryName" text NOT NULL,
  "regionCode" text,
  "regionName" text,
  "regulatoryZones" text,
  "createdAt" date NOT NULL
);

CREATE TABLE IF NOT EXISTS "consentPolicy" (
  "id" text NOT NULL PRIMARY KEY,
  "version" text NOT NULL,
  "name" text NOT NULL,
  "effectiveDate" date NOT NULL,
  "expirationDate" date,
  "content" text NOT NULL,
  "contentHash" text NOT NULL,
  "isActive" integer NOT NULL,
  "createdAt" date NOT NULL
);

CREATE TABLE IF NOT EXISTS "consent" (
  "id" text NOT NULL PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user" ("id"),
  "domainId" text NOT NULL REFERENCES "domain" ("id"),
  "purposeIds" text NOT NULL REFERENCES "purpose" ("id"),
  "metadata" text, -- stored as JSON
  "policyId" text REFERENCES "consentPolicy" ("id"),
  "ipAddress" text,
  "userAgent" text,
  "status" text NOT NULL,
  "withdrawalReason" text,
  "givenAt" date NOT NULL,
  "validUntil" date,
  "isActive" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "purposeJunction" (
  "id" text NOT NULL PRIMARY KEY,
  "consentId" text NOT NULL REFERENCES "consent" ("id"),
  "purposeId" text NOT NULL REFERENCES "purpose" ("id"),
  "status" text NOT NULL,
  "metadata" text, -- stored as JSON
  "createdAt" date NOT NULL,
  "updatedAt" date
);

CREATE TABLE IF NOT EXISTS "consentGeoLocation" (
  "id" text NOT NULL PRIMARY KEY,
  "consentId" text NOT NULL REFERENCES "consent" ("id"),
  "ip" text NOT NULL,
  "country" text,
  "region" text,
  "city" text,
  "latitude" integer,
  "longitude" integer,
  "timezone" text,
  "createdAt" date NOT NULL
);

CREATE TABLE IF NOT EXISTS "record" (
  "id" text NOT NULL PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user" ("id"),
  "consentId" text REFERENCES "consent" ("id"),
  "actionType" text NOT NULL,
  "details" text,
  "createdAt" date NOT NULL
);

CREATE TABLE IF NOT EXISTS "withdrawal" (
  "id" text NOT NULL PRIMARY KEY,
  "consentId" text NOT NULL REFERENCES "consent" ("id"),
  "userId" text NOT NULL REFERENCES "user" ("id"),
  "withdrawalReason" text,
  "withdrawalMethod" text NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "metadata" text, -- stored as JSON
  "createdAt" date NOT NULL
);

CREATE TABLE IF NOT EXISTS "auditLog" (
  "id" text NOT NULL PRIMARY KEY,
  "entityType" text NOT NULL,
  "entityId" text NOT NULL,
  "actionType" text NOT NULL,
  "userId" text REFERENCES "user" ("id"),
  "ipAddress" text,
  "userAgent" text,
  "changes" text,
  "metadata" text, -- stored as JSON
  "createdAt" date NOT NULL,
  "eventTimezone" text NOT NULL
);