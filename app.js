const fileInput = document.getElementById('statementFile');
const dashboard = document.getElementById('dashboard');
const statusLabel = document.getElementById('status');
const totalIncomeEl = document.getElementById('totalIncome');
const totalSpendingEl = document.getElementById('totalSpending');
const netCashFlowEl = document.getElementById('netCashFlow');
const transactionCountEl = document.getElementById('transactionCount');
const categoryList = document.getElementById('categoryList');
const adviceList = document.getElementById('adviceList');
const transactionTable = document.getElementById('transactionTable');

const categoryRules = [
  { category: 'Groceries', keywords: ['grocery', 'supermarket', 'aldi', 'walmart', 'tesco'] },
  { category: 'Housing', keywords: ['rent', 'mortgage', 'landlord', 'property'] },
  { category: 'Transport', keywords: ['uber', 'lyft', 'fuel', 'gas station', 'train', 'bus'] },
  { category: 'Dining', keywords: ['restaurant', 'cafe', 'coffee', 'mcdonald', 'takeaway'] },
  { category: 'Shopping', keywords: ['amazon', 'mall', 'clothing', 'store'] },
  { category: 'Utilities', keywords: ['electric', 'water', 'internet', 'utility', 'phone bill'] },
  { category: 'Salary', keywords: ['salary', 'payroll', 'paycheck'] },
  { category: 'Entertainment', keywords: ['netflix', 'spotify', 'cinema', 'game'] }
];

fileInput.addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const transactions = parseCsv(text);

    if (!transactions.length) {
      throw new Error('No valid transactions found in this file.');
    }

    renderDashboard(transactions, file.name);
  } catch (error) {
    dashboard.classList.add('hidden');
    statusLabel.textContent = `Error: ${error.message}`;
    statusLabel.style.color = 'var(--danger)';
  }
});

function parseCsv(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(',').map((header) => header.trim().toLowerCase());
  const dateIndex = headers.indexOf('date');
  const descriptionIndex = headers.indexOf('description');
  const amountIndex = headers.indexOf('amount');
  const categoryIndex = headers.indexOf('category');

  if (dateIndex < 0 || descriptionIndex < 0 || amountIndex < 0) {
    throw new Error('CSV must include date, description, and amount columns.');
  }

  return lines
    .slice(1)
    .map((line) => {
      const cols = line.split(',').map((value) => value.trim());
      const date = cols[dateIndex] || 'Unknown';
      const description = cols[descriptionIndex] || 'No description';
      const amount = Number.parseFloat((cols[amountIndex] || '0').replace(/[^\d.-]/g, ''));
      const explicitCategory = categoryIndex >= 0 ? cols[categoryIndex] : '';

      if (Number.isNaN(amount)) {
        return null;
      }

      const category = explicitCategory || inferCategory(description, amount);
      return { date, description, amount, category };
    })
    .filter(Boolean);
}

function inferCategory(description, amount) {
  const content = description.toLowerCase();
  for (const rule of categoryRules) {
    if (rule.keywords.some((keyword) => content.includes(keyword))) {
      return rule.category;
    }
  }

  return amount >= 0 ? 'Income' : 'Other Spending';
}

function renderDashboard(transactions, fileName) {
  const income = transactions.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
  const spending = transactions.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const netCashFlow = income - spending;

  totalIncomeEl.textContent = formatCurrency(income);
  totalSpendingEl.textContent = formatCurrency(spending);
  netCashFlowEl.textContent = formatCurrency(netCashFlow);
  netCashFlowEl.className = netCashFlow >= 0 ? 'income' : 'spending';
  transactionCountEl.textContent = String(transactions.length);

  renderCategories(transactions, spending);
  renderAdvice(transactions, income, spending, netCashFlow);
  renderTable(transactions);

  statusLabel.textContent = `Loaded ${transactions.length} transactions from ${fileName}.`;
  statusLabel.style.color = 'var(--success)';
  dashboard.classList.remove('hidden');
}

function renderCategories(transactions, totalSpending) {
  const spendingByCategory = new Map();

  transactions.forEach((transaction) => {
    if (transaction.amount >= 0) {
      return;
    }

    const value = Math.abs(transaction.amount);
    const current = spendingByCategory.get(transaction.category) || 0;
    spendingByCategory.set(transaction.category, current + value);
  });

  const sorted = [...spendingByCategory.entries()].sort((a, b) => b[1] - a[1]);
  categoryList.innerHTML = '';

  if (!sorted.length) {
    categoryList.innerHTML = '<li>No spending transactions found.</li>';
    return;
  }

  sorted.forEach(([category, value]) => {
    const pct = totalSpending > 0 ? (value / totalSpending) * 100 : 0;
    const li = document.createElement('li');
    li.textContent = `${category}: ${formatCurrency(value)} (${pct.toFixed(1)}%)`;
    categoryList.appendChild(li);
  });
}

function renderAdvice(transactions, income, spending, netCashFlow) {
  adviceList.innerHTML = '';
  const advice = [];

  const categories = getTopCategories(transactions, 3);
  if (categories[0] && categories[0].percent >= 30) {
    advice.push(
      `Your highest spending category is ${categories[0].name} at ${categories[0].percent.toFixed(
        1
      )}% of spending. Try a monthly cap for this category.`
    );
  }

  if (netCashFlow < 0) {
    advice.push('You are spending more than you earn. Reduce non-essential subscriptions and dining out first.');
  } else {
    advice.push('You have a positive cash flow. Consider automatically moving 10-20% of surplus into savings.');
  }

  const smallPayments = transactions.filter((tx) => tx.amount < 0 && Math.abs(tx.amount) < 15).length;
  if (smallPayments >= 8) {
    advice.push(
      'You have many small transactions. Review impulse spending and set a weekly personal spending limit.'
    );
  }

  const savingsRate = income > 0 ? ((income - spending) / income) * 100 : 0;
  advice.push(`Estimated savings rate: ${Math.max(savingsRate, 0).toFixed(1)}%. Target at least 20% over time.`);

  advice.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    adviceList.appendChild(li);
  });
}

function getTopCategories(transactions, limit) {
  const totals = new Map();
  let totalSpending = 0;

  for (const tx of transactions) {
    if (tx.amount >= 0) {
      continue;
    }

    const spend = Math.abs(tx.amount);
    totalSpending += spend;
    totals.set(tx.category, (totals.get(tx.category) || 0) + spend);
  }

  return [...totals.entries()]
    .map(([name, amount]) => ({
      name,
      amount,
      percent: totalSpending > 0 ? (amount / totalSpending) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

function renderTable(transactions) {
  transactionTable.innerHTML = '';
  transactions.forEach((tx) => {
    const row = document.createElement('tr');
    const amountClass = tx.amount >= 0 ? 'income' : 'spending';

    row.innerHTML = `
      <td>${tx.date}</td>
      <td>${tx.description}</td>
      <td>${tx.category}</td>
      <td class="amount-cell ${amountClass}">${formatCurrency(tx.amount)}</td>
    `;

    transactionTable.appendChild(row);
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}
