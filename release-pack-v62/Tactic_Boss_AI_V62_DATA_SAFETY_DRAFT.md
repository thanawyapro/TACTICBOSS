# Google Play Data Safety Draft

This is a draft to help fill Google Play Console. Confirm against the final APK/AAB and your live backend before submission.

## Data collected
- Email address: account authentication via Supabase.
- User IDs: Supabase authenticated user ID.
- App activity: saved tactics, generated tactic inputs/results, rivals, challenge progress, XP, community actions, reward wallet events.
- User-generated content: community tactics and reports.
- Images: screenshot analysis image is processed locally in the current implementation; image previews are not intentionally stored in Supabase.

## Data not collected by current app code
- Precise location.
- Contacts.
- SMS.
- Call logs.
- Health data.
- Financial information.

## Data sharing
- Supabase is used as backend infrastructure.
- If AdMob is later enabled, update this form to declare advertising identifiers/ad interactions as required by Google/AdMob policies.

## Security practices
- Data transmitted over HTTPS.
- Supabase RLS is used for owner-scoped data.
- Account deletion page is included.

## Account deletion URL
Use the public `/delete-account.html` page after deployment.
