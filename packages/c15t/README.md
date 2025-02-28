# Consent Management System (C15T)

This package contains the database schema and logic for handling consent management in compliance with privacy regulations like GDPR, CCPA, and other international privacy laws.

## Schema Overview

The consent management system is built on a PostgreSQL database with the following key components:

### Core Entities

- **Users**: Individuals interacting with the system, either identified or anonymous
- **Domains**: Sites or applications to which consent applies
- **Consent Purposes**: Different reasons for processing personal data
- **Consent Policies**: Versioned privacy policies shown to users

### Core Processes

- **Consent Collection**: Recording user preferences for data processing
- **Consent Withdrawal**: Tracking when a user revokes their consent
- **Audit Trail**: Maintaining a comprehensive log of all consent-related activities

## Key Terminology

- **Consent**: A record of a user's permission to process their data for specific purposes
- **Withdrawal/Revocation**: When a user revokes a previously granted consent
- **Policy Version**: The specific version of the privacy policy the user agreed to
- **Consent Record**: Evidence that captures how consent was obtained
- **Audit Log**: Immutable record of all actions taken on consent data

## Database Schema

The database schema includes the following tables:

- `users`: Stores user identity information
- `consents`: Core table containing user consent records
- `consent_withdrawals`: Tracks when and why consent was revoked
- `consent_purposes`: Defines different purposes for data processing
- `consent_purpose_junction`: Maps purposes to consent records
- `domains`: Sites or applications to which consent applies
- `consent_policies`: Versioned privacy policy documents
- `consent_records`: Evidence of consent actions (submissions, interactions)
- `geo_locations`: Geographic locations for regulatory compliance
- `consent_geo_locations`: Links consents to geographic locations
- `consent_audit_logs`: Comprehensive audit trail of all consent operations

## Data Integrity

The system maintains data integrity through:

1. Foreign key relationships with cascading deletions where appropriate
2. Constraints ensuring consent status consistency
3. Triggers that automatically:
   - Mark consents as inactive when withdrawn
   - Create audit log entries for key operations

## Usage Guidelines

### Recording Consent

When recording new consent, ensure you:
1. Check if the user already has active consent for the domain
2. Store all required contextual information (IP, timestamp, etc.)
3. Record appropriate evidence in the `consent_records` table

### Withdrawing Consent

When processing a withdrawal request:
1. Create a record in the `consent_withdrawals` table
2. The system will automatically:
   - Set the related consent to inactive
   - Create an audit log entry
   - Maintain the original consent record for compliance purposes

### Querying Active Consent

To determine if a user has given consent:
```sql
SELECT * FROM consents 
WHERE user_id = ? AND domain_id = ? AND is_active = true;
```

## Legal Considerations

This system is designed to help with regulatory compliance but should be reviewed by legal counsel to ensure it meets the specific requirements of your jurisdiction and use case.

## Maintenance

When updating the schema:
1. Add appropriate documentation for new fields
2. Maintain foreign key relationships and constraints
3. Update audit logging for new operations
4. Test cascading behavior to prevent orphaned records 