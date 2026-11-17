# Google OAuth branding submission

Orvulix serves public, prerendered legal pages. The homepage includes links
to them in its initial HTML and in the React footer, without requiring login.
These pages support the branding review; they do not guarantee Google approval.

## Consent screen configuration

In the correct Google Cloud project, open Google Auth Platform > Branding
(or APIs & Services > OAuth consent screen in the older console):

- App name: Orvulix. Keep the name consistent with the public homepage.
- Application home page: https://orvulix.io.vn/
- Application privacy policy: https://orvulix.io.vn/privacy
- Application terms of service: https://orvulix.io.vn/terms
- Set a monitored support email and developer contact address. The public
  legal contact is 99shadow.friend99@gmail.com.
- Register orvulix.io.vn under Authorized domains before submitting. Verify
  domain ownership in Google Search Console using an account permitted to
  manage this OAuth project. Register any additional domains actually used
  by the application's branding links or OAuth configuration.

Authorized domains, OAuth client authorized redirect URIs and JavaScript
origins are separate settings. Configure exact origins and callback URLs
for the actual integration; this PR does not introduce a Google login flow.

## Submission verification

1. After the normal production release, open the homepage, privacy and terms
   URLs in a private browser without signing in. Verify successful responses,
   readable legal content and working homepage legal links with JavaScript off.
2. Confirm the published policy accurately describes the application's actual
   data access and handling. If Google API scopes are added later, review
   their data access, use, sharing and retention disclosures before submission.
3. Save the consent screen URLs and authorized domains in Google Cloud Console.
   Review the requested APIs/scopes and submit through Google's verification
   flow. Sensitive or restricted scopes may require additional verification.

Google Console configuration and domain ownership are external steps. A merged
PR does not establish that they are complete or that branding is approved.

References:

- https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification
- https://support.google.com/cloud/answer/9110914
