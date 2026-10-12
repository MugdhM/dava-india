<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally. Health records and profile data are saved only in the current browser's local storage; they are not synced between devices.

View your app in AI Studio: https://ai.studio/apps/8e0226db-4c55-41f1-b24c-39bcc06b4de4

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `GEMINI_API_KEY` in your local environment or in Vercel Project Settings → Environment Variables. Never put a Gemini API key in frontend code or browser-accessible files.
3. Run the app:
   `npm run dev`
