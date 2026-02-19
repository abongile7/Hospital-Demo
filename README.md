# Bank Statement Advisor

A simple browser app that lets you upload a CSV bank statement, analyzes transactions, and provides spending insights plus savings advice.

## How to run

Open `index.html` directly in your browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

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
- `category` is optional; if left blank, the app tries to infer one from description keywords.
