
# AUREVIA — Vercel Deployment

## Deploy
1. Upload this folder to GitHub (repository root should contain `vercel.json`, `api/`, `backend/`, `frontend/`, `data/`, `storage/`).
2. Import the GitHub repository into Vercel.
3. Vercel should detect the Python function through `api/index.py`.
4. Add environment variable `AUREVIA_SESSION_SECRET` to a strong random value.
5. Optional Google login: add `GOOGLE_CLIENT_ID` and configure that OAuth client for your Vercel domain.

## Important deployment behavior
Vercel is a serverless hosting platform. Its filesystem is not a persistent Windows laptop disk. Therefore the local
`Downloads/Aurevia Files` behavior is available when AUREVIA is run locally on a user's laptop, but a deployed Vercel
instance cannot silently write files into the visitor's laptop Downloads folder. The browser must download a file
through the normal download flow.

For a production persistent database/storage system, use a hosted database/object-storage service rather than the
bundled SQLite/local storage demo.
