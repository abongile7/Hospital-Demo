# Bank Statement Advisor

A simple browser app that lets you upload a CSV bank statement, analyze transactions, and get practical savings advice.

## Run locally

Open `index.html` directly in your browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy to Netlify

This repository includes `netlify.toml`, so Netlify can host it as a static site without a build command.

### Fastest deploy (no GitHub connection required)
Use this if your Netlify account is not connected to GitHub/GitLab/Bitbucket.

1. In this project folder, create a zip of the site files:
   ```bash
   zip -r bank-statement-advisor.zip index.html app.js styles.css README.md netlify.toml
   ```
2. In Netlify, go to **Projects**.
3. Click **Add new project** → **Deploy manually**.
4. Drag and drop `bank-statement-advisor.zip`.
5. Netlify will publish instantly and provide a live URL.

### Continuous deploy (recommended for updates)
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
