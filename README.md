# AUREVIA — Private Fault-Tolerant File Storage

AUREVIA is a local-first distributed object-storage demo. It keeps replicated copies in four storage nodes and also saves every uploaded file to the laptop's `Downloads/Aurevia Files` folder.

## New private-access features

- Email/password account creation and sign-in.
- Gmail addresses can be used for the email/password account.
- Optional **Continue with Google** OAuth sign-in.
- Authenticated API/session protection for stored objects, nodes, activity and uploads.
- Sign-out button in the UI.
- Every upload is copied to the current laptop user's `Downloads/Aurevia Files` folder.
- The upload result shows the exact local path where the file was saved.

## Start on Windows

Run `RUN_VAULT.bat` (do not double-click `index.html`) and open `http://127.0.0.1:8000`.

On first use, choose **Create an account** and set an email + password (minimum 6 characters). After that, sign in normally.

## Optional Google Sign-In setup

Google Sign-In needs a Google OAuth **Web application Client ID**. Put it in the Windows environment before starting the app:

```bat
set GOOGLE_CLIENT_ID=YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com
set AUREVIA_SESSION_SECRET=use-a-long-random-secret
RUN_VAULT.bat
```

In Google Cloud, configure the OAuth client as a Web application and add your local origin (for example `http://127.0.0.1:8000`) to the allowed JavaScript origins. Without `GOOGLE_CLIENT_ID`, email/password sign-in still works normally.

## Local file location

Uploaded files are saved here on Windows:

`C:\Users\<YourWindowsUser>\Downloads\Aurevia Files\`

The exact path returned by the server is displayed after every upload.

## Important

AUREVIA is designed as a local laptop/hackathon demo. Keep it bound to `127.0.0.1` unless you intentionally configure a secure deployment with HTTPS and appropriate production authentication/session settings.


## Verified build

The email/password sign-up and sign-in flow, session cookie, protected dashboard APIs, and laptop-local upload copy have been tested. Uploaded files are copied by the local server into the Windows user's `Downloads\Aurevia Files` folder and the exact path is shown after upload.


## Vercel
This repository includes `vercel.json`, `api/index.py`, and a root `requirements.txt` for Vercel deployment. See `VERCEL_DEPLOY.md`.
