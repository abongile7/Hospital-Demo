# Bank Statement Advisor

A simple browser app that lets you upload a CSV bank statement, analyze transactions, and get practical savings advice.

## Run locally

Open `index.html` directly in your browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy to Netlify

This repository includes `netlify.toml`, so Netlify can host it as a static site with no build command.

### Recommended for your current Netlify setup (manual deploy)
If your team is **goci** and Git providers are not connected yet, this is the fastest path.

1. In this project folder, create a zip package:
   ```bash
   zip -r bank-statement-advisor.zip index.html app.js styles.css README.md netlify.toml
   ```
2. In Netlify, switch to your **goci** team.
3. Go to **Projects**.
4. Click **Add new project** → **Deploy manually**.
5. Drag and drop `bank-statement-advisor.zip`.
6. Wait for publish, then open the generated `*.netlify.app` URL.

### Continuous deploy (optional, after connecting GitHub/GitLab/Bitbucket)
1. Push this repository to GitHub/GitLab/Bitbucket.
2. In Netlify, click **Add new project** → **Import an existing project**.
3. Select your repository.
4. Keep build settings empty (Netlify reads `netlify.toml`).
5. Click **Deploy site**.

### Netlify CLI deploy (optional)
```bash
npm i -g netlify-cli
netlify login
netlify deploy --dir .
netlify deploy --prod --dir .
```

## Netlify config used by this project

`netlify.toml` is configured as:
- `publish = "."` so your root folder is served directly.
- common security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`

## CSV format

Use headers:

```csv
date,description,amount,category
2026-01-01,Salary January,2500,Salary
2026-01-02,Rent,-1200,Housing
2026-01-03,Supermarket,-94.30,Groceries
2026-01-04,Coffee Shop,-6.75,
```

Notes:
- `amount` should be positive for income and negative for spending.
- `category` is optional; if blank, the app tries to infer one from description keywords.
