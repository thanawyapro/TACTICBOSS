# Web Operations Playbook

## Daily

- Check Netlify deploy status and errors.
- Check Supabase authentication/database health and usage.
- Review account deletion requests and user support messages.
- Confirm signup, login, tactic generation, and cloud save using a test account.

## Weekly

- Export or verify a Supabase backup.
- Review active users, retention, failed actions, and AI analysis usage.
- Update Meta Center content.
- Fix the highest-impact user issue before adding a new feature.

## Release discipline

- Never edit production directly.
- Test changes on a staging Netlify site and separate Supabase project.
- Every release must include source, Netlify build, SQL migration, test report, rollback notes, and checksums.
- Keep the previous working Netlify deploy available for instant rollback.

## Immediate next product work after launch

1. Real Vision AI through a protected backend/Edge Function.
2. Error monitoring and product analytics.
3. Secure web payments and entitlement verification.
4. Community tactics and referral growth only after stability and retention are proven.
