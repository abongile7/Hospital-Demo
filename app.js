const fileInput = document.getElementById('statementFile');
const dashboard = document.getElementById('dashboard');
const statusLabel = document.getElementById('status');
const totalIncomeEl = document.getElementById('totalIncome');
const totalSpendingEl = document.getElementById('totalSpending');
const netCashFlowEl = document.getElementById('netCashFlow');
const savingsRateEl = document.getElementById('savingsRate');
const avgDailySpendEl = document.getElementById('avgDailySpend');
const transactionCountEl = document.getElementById('transactionCount');
const categoryList = document.getElementById('categoryList');
const adviceList = document.getElementById('adviceList');
const transactionTable = document.getElementById('transactionTable');
const topCategoryBar = document.getElementById('topCategoryBar');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const savingsPlanList = document.getElementById('savingsPlanList');

let allTransactions = [];

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

searchInput.addEventListener('input', () => {
  renderTable(getFilteredTransactions(allTransactions));
});

categoryFilter.addEventListener('change', () => {
  renderTable(getFilteredTransactions(allTransactions));
});

function parseCsv(csvText) {
  const rows = parseCsvRows(csvText).filter((row) => row.some((value) => value.trim() !== ''));
  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const dateIndex = headers.indexOf('date');
  const descriptionIndex = headers.indexOf('description');
  const amountIndex = headers.indexOf('amount');
  const categoryIndex = headers.indexOf('category');

  if (dateIndex < 0 || descriptionIndex < 0 || amountIndex < 0) {
    throw new Error('CSV must include date, description, and amount columns.');
  }

  return rows
    .slice(1)
    .map((cols) => {
      const dateRaw = cols[dateIndex] || '';
      const description = (cols[descriptionIndex] || 'No description').trim();
      const amount = parseAmount(cols[amountIndex]);
      const explicitCategory = categoryIndex >= 0 ? (cols[categoryIndex] || '').trim() : '';

      if (Number.isNaN(amount)) {
        return null;
      }

      return {
        date: normalizeDate(dateRaw),
        dateKey: parseDateToKey(dateRaw),
        description,
        amount,
        category: explicitCategory || inferCategory(description, amount)
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.dateKey - b.dateKey);
}

function parseCsvRows(csvText) {
  const normalized = csvText.replace(/\r/g, '');
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];

    if (char === '"') {
      const next = normalized[i + 1];
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(value);
      value = '';
      continue;
    }

    if (char === '\n' && !inQuotes) {
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function parseAmount(value) {
  const text = (value || '').trim();
  if (!text) {
    return Number.NaN;
  }

  const negativeByParentheses = /^\(.*\)$/.test(text);
  const cleaned = text
    .replace(/[,$]/g, '')
    .replace(/[()]/g, '')
    .replace(/\s+/g, '');

  const parsed = Number.parseFloat(cleaned);
  if (Number.isNaN(parsed)) {
    return Number.NaN;
  }

  return negativeByParentheses ? -Math.abs(parsed) : parsed;
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
  allTransactions = transactions;
  const income = transactions.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
  const spending = transactions.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const netCashFlow = income - spending;
  const savingsRate = income > 0 ? (netCashFlow / income) * 100 : 0;
  const daysCovered = getDaysCovered(transactions);

  totalIncomeEl.textContent = formatCurrency(income);
  totalSpendingEl.textContent = formatCurrency(spending);
  netCashFlowEl.textContent = formatCurrency(netCashFlow);
  netCashFlowEl.className = netCashFlow >= 0 ? 'income' : 'spending';
  savingsRateEl.textContent = `${Math.max(savingsRate, 0).toFixed(1)}%`;
  avgDailySpendEl.textContent = formatCurrency(daysCovered ? spending / daysCovered : spending);
  transactionCountEl.textContent = String(transactions.length);

  renderCategories(transactions, spending);
  renderAdvice(transactions, income, spending, netCashFlow, savingsRate, daysCovered);
  renderSavingsPlan(transactions, income, spending);
  populateCategoryFilter(transactions);
  renderTable(getFilteredTransactions(transactions));

  statusLabel.textContent = `Loaded ${transactions.length} transactions from ${fileName}.`;
  statusLabel.style.color = 'var(--success)';
  dashboard.classList.remove('hidden');
}

function populateCategoryFilter(transactions) {
  const existing = new Set(['all']);
  categoryFilter.innerHTML = '<option value="all">All categories</option>';

  transactions
    .map((tx) => tx.category)
    .sort((a, b) => a.localeCompare(b))
    .forEach((category) => {
      if (existing.has(category)) {
        return;
      }

      existing.add(category);
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });
}

function getFilteredTransactions(transactions) {
  const searchValue = searchInput.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;

  return transactions.filter((tx) => {
    const matchesCategory = selectedCategory === 'all' || tx.category === selectedCategory;
    const matchesSearch = !searchValue || tx.description.toLowerCase().includes(searchValue);
    return matchesCategory && matchesSearch;
  });
}

function renderCategories(transactions, totalSpending) {
  const spendingByCategory = new Map();

  transactions.forEach((transaction) => {
    if (transaction.amount >= 0) {
      return;
    }

    const value = Math.abs(transaction.amount);
    spendingByCategory.set(transaction.category, (spendingByCategory.get(transaction.category) || 0) + value);
  });

  const sorted = [...spendingByCategory.entries()].sort((a, b) => b[1] - a[1]);
  categoryList.innerHTML = '';

  if (!sorted.length) {
    categoryList.innerHTML = '<li>No spending transactions found.</li>';
    topCategoryBar.classList.add('hidden');
    return;
  }

  sorted.forEach(([category, value]) => {
    const pct = totalSpending > 0 ? (value / totalSpending) * 100 : 0;
    const li = document.createElement('li');
    li.innerHTML = `<strong>${category}</strong>: ${formatCurrency(value)} <span class="muted">(${pct.toFixed(1)}%)</span>`;
    categoryList.appendChild(li);
  });

  const [topCategory, topAmount] = sorted[0];
  const topPercent = totalSpending > 0 ? (topAmount / totalSpending) * 100 : 0;
  topCategoryBar.classList.remove('hidden');
  topCategoryBar.innerHTML = `
    <p><strong>Top category:</strong> ${topCategory} (${topPercent.toFixed(1)}%)</p>
    <div class="progress-track">
      <div class="progress-fill" style="width: ${Math.min(topPercent, 100).toFixed(1)}%"></div>
    </div>
  `;
}

function renderAdvice(transactions, income, spending, netCashFlow, savingsRate, daysCovered) {
  adviceList.innerHTML = '';
  const advice = [];

  const categories = getTopCategories(transactions, 3);
  if (categories[0] && categories[0].percent >= 30) {
    advice.push(`Your highest spending category is ${categories[0].name} (${categories[0].percent.toFixed(1)}%). Set a cap for it.`);
  }

  if (netCashFlow < 0) {
    advice.push('You are spending more than you earn. Start by cutting discretionary spending by 10%.');
  } else {
    advice.push('You have a positive cash flow. Automatically transfer part of your surplus to savings each payday.');
  }

  const recurring = findRecurringCharges(transactions);
  if (recurring.length) {
    advice.push(`Recurring payments detected (${recurring.slice(0, 3).join(', ')}). Cancel or downgrade unused subscriptions.`);
  }

  const smallPayments = transactions.filter((tx) => tx.amount < 0 && Math.abs(tx.amount) < 15).length;
  if (smallPayments >= 8) {
    advice.push('Many small transactions were found. Set a weekly limit for coffee/snacks or app purchases.');
  }

  if (daysCovered >= 7) {
    const averageDailySpending = spending / daysCovered;
    advice.push(`Average daily spending is ${formatCurrency(averageDailySpending)}. Use this as your daily target benchmark.`);
  }

  advice.push(`Estimated savings rate: ${Math.max(savingsRate, 0).toFixed(1)}%. Long-term target is 20%+.`);

  advice.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    adviceList.appendChild(li);
  });
}

function renderSavingsPlan(transactions, income, spending) {
  savingsPlanList.innerHTML = '';
  const goals = [];
  const topCategories = getTopCategories(transactions, 3);

  topCategories.forEach((category) => {
    const suggestedCut = category.amount * 0.1;
    goals.push(`Reduce ${category.name} by 10% to save about ${formatCurrency(suggestedCut)} per period.`);
  });

  const emergencyFundMonthly = Math.max((income - spending) * 0.5, 0);
  if (emergencyFundMonthly > 0) {
    goals.push(`Move ${formatCurrency(emergencyFundMonthly)} toward emergency savings this month.`);
  } else {
    goals.push('Set a starter emergency fund target of $25 per week until cash flow improves.');
  }

  goals.forEach((goal) => {
    const li = document.createElement('li');
    li.textContent = goal;
    savingsPlanList.appendChild(li);
  });
}

function findRecurringCharges(transactions) {
  const spendingGroups = new Map();

  transactions.forEach((tx) => {
    if (tx.amount >= 0) {
      return;
    }

    const normalizedName = tx.description.toLowerCase().replace(/\d+/g, '').trim();
    const key = `${normalizedName}::${Math.abs(tx.amount).toFixed(2)}`;
    spendingGroups.set(key, (spendingGroups.get(key) || 0) + 1);
  });

  return [...spendingGroups.entries()]
    .filter(([, count]) => count >= 2)
    .map(([key]) => key.split('::')[0])
    .slice(0, 4);
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

function getDaysCovered(transactions) {
  const validKeys = transactions.map((tx) => tx.dateKey).filter((key) => Number.isFinite(key));
  if (!validKeys.length) {
    return 0;
  }

  const min = Math.min(...validKeys);
  const max = Math.max(...validKeys);
  const oneDayMs = 24 * 60 * 60 * 1000;
  return Math.max(Math.round((max - min) / oneDayMs) + 1, 1);
}

function normalizeDate(rawDate) {
  const asDate = new Date(rawDate);
  if (Number.isNaN(asDate.getTime())) {
    return (rawDate || 'Unknown').trim() || 'Unknown';
  }

  return asDate.toISOString().slice(0, 10);
}

function parseDateToKey(rawDate) {
  const value = new Date(rawDate).getTime();
  return Number.isNaN(value) ? Number.POSITIVE_INFINITY : value;
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
