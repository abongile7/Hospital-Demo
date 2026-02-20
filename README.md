# Bank Statement Advisor

A simple browser app that lets you upload a CSV bank statement, analyze transactions, and get practical savings advice.

## Features
- CSV upload and parsing with support for quoted values.
- Auto-categorization when the `category` field is blank.
- Financial summary: income, spending, net cash flow, savings rate, and average daily spend.
- Spending breakdown by category with top-category progress visualization.
- Personalized advice (cash flow, recurring charges, savings guidance).
- Full transactions table for review with search and category filters.
- Savings plan suggestions based on top spending categories.

## Run locally

Open `index.html` directly in your browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy to Netlify

This repository includes `netlify.toml`, so Netlify can host it as a static site with no build command.

### Manual deploy
1. Create a zip package:
   ```bash
   zip -r bank-statement-advisor.zip index.html app.js styles.css README.md netlify.toml
   ```
2. In Netlify: **Projects** → **Add new project** → **Deploy manually**.
3. Drag and drop the zip file and publish.

### Continuous deploy
1. Push this repository to GitHub/GitLab/Bitbucket.
2. In Netlify: **Add new project** → **Import an existing project**.
3. Select repo and deploy (no build command required).

## CSV format

Use headers:

```csv
date,description,amount,category
2026-01-01,Salary January,2500,Salary
2026-01-02,Rent,-1200,Housing
2026-01-03,"Supermarket, Main Street",-94.30,Groceries
2026-01-04,Coffee Shop,-6.75,
```

Notes:
- `amount` should be positive for income and negative for spending.
- Amounts are displayed in South African Rand (ZAR / R).
- Parentheses amounts are supported (example: `(120.45)` becomes `-120.45`).
- `category` is optional; if blank, the app tries to infer one from description keywords.
