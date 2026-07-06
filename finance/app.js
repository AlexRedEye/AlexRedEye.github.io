const fileInput = document.querySelector("#fileInput");
const searchInput = document.querySelector("#searchInput");
const accountFilter = document.querySelector("#accountFilter");
const flowFilter = document.querySelector("#flowFilter");
const emptyState = document.querySelector("#emptyState");
const dashboard = document.querySelector("#dashboard");

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

let transactions = [];

fileInput.addEventListener("change", async (event) => {
  const files = Array.from(event.target.files || []);
  const loaded = await Promise.all(files.map(readCsvFile));
  transactions = loaded.flat().sort((a, b) => b.date - a.date);
  syncAccountFilter(transactions);
  render();
});

[searchInput, accountFilter, flowFilter].forEach((control) => {
  control.addEventListener("input", render);
});

async function readCsvFile(file) {
  const text = await file.text();
  const rows = parseCsv(text);

  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim());
  const accountName = file.name.replace(/\.csv$/i, "");

  return rows.slice(1).flatMap((row, index) => {
    if (row.every((cell) => !cell.trim())) {
      return [];
    }

    const record = Object.fromEntries(headers.map((header, headerIndex) => [header, row[headerIndex] || ""]));
    const normalized = normalizeRecord(record, accountName, index + 2);
    return normalized ? [normalized] : [];
  });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== "\r") {
      value += char;
    }
  }

  if (value.length || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function normalizeRecord(record, account, lineNumber) {
  const dateText = record["Transaction Date"] || record["Posting Date"] || record.Date;
  const amount = parseAmount(record.Amount);
  const date = parseDate(dateText);

  if (!date || Number.isNaN(amount)) {
    return null;
  }

  const description = cleanDescription(record.Description || record.Memo || "Unknown");
  const sourceType = record.Type || record.Details || "";
  const category = normalizeCategory(record.Category, sourceType, description);
  const flow = classifyFlow(amount, sourceType, description, category);
  const merchant = normalizeMerchant(description);

  return {
    id: `${account}-${lineNumber}`,
    account,
    date,
    dateText: dateFormatter.format(date),
    month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    description,
    merchant,
    category,
    sourceType: sourceType || "Uncategorized",
    amount,
    flow,
    searchable: `${account} ${description} ${merchant} ${category} ${sourceType}`.toLowerCase(),
  };
}

function normalizeMerchant(description) {
  const cleaned = cleanDescription(description).toUpperCase();
  const compacted = cleaned
    .replace(/\b(POS DEBIT|RECURRING CARD PURCHASE|CARD PURCHASE|ONLINE PAYMENT|ACH TRANS|WEB ID|PPD ID)\b/g, " ")
    .replace(/\b\d{2}\/\d{2}\b/g, " ")
    .replace(/\b[A-Z]{2}-[A-Z0-9]{8,}\b/g, " ")
    .replace(/\b[A-Z]{2}\b\s*$/g, " ")
    .replace(/\b\d{3,}\b/g, " ")
    .replace(/[*#_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const merchantRules = [
    [/WAL MART|WALMART|WM SUPERCENTER/, "Walmart"],
    [/AMAZON|AMZN/, "Amazon"],
    [/UBER/, "Uber"],
    [/SHELL OIL|SHELL/, "Shell"],
    [/TACO BELL/, "Taco Bell"],
    [/STEAMGAMES|STEAM PURCHASE|STEAM/, "Steam"],
    [/APPLE\.COM|APPLE COM|APPLE/, "Apple"],
    [/ROBINHOOD|RH BROKERAGE/, "Robinhood"],
    [/DOORDASH|DD DOORDASH/, "DoorDash"],
    [/ZELLE PAYMENT TO BEBE/, "Zelle to Bebe"],
    [/ZELLE PAYMENT TO MAMI/, "Zelle to Mami"],
    [/YSI.*RENT|RENT PROSPER/, "Rent"],
    [/SQUARE ENIX/, "Square Enix"],
    [/OCULUS/, "Oculus"],
    [/DOLLAR TREE/, "Dollar Tree"],
    [/FIVE GUYS/, "Five Guys"],
    [/7 ELEVEN/, "7-Eleven"],
    [/KO FI\.COM|KO FI COM/, "Ko-fi"],
  ];

  const matched = merchantRules.find(([pattern]) => pattern.test(compacted));
  if (matched) {
    return matched[1];
  }

  return titleCase(compacted.split(/\s{2,}|\sORLANDO\b|\sFL\b|\sCA\b|\sWA\b|\sTX\b/)[0] || "Unknown");
}

function titleCase(value) {
  return String(value || "Unknown")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseAmount(value) {
  const cleaned = String(value || "").replace(/[$,\s]/g, "");
  if (!cleaned) {
    return Number.NaN;
  }
  return Number(cleaned);
}

function parseDate(value) {
  const match = String(value || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) {
    return null;
  }

  const [, month, day, year] = match.map(Number);
  return new Date(year, month - 1, day);
}

function cleanDescription(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCategory(category, type, description) {
  const trimmed = String(category || "").trim();
  if (trimmed) {
    return trimmed;
  }

  const haystack = `${type} ${description}`.toLowerCase();
  if (haystack.includes("payroll") || haystack.includes("ach_credit")) return "Income";
  if (haystack.includes("zelle") || haystack.includes("quickpay")) return "Zelle";
  if (haystack.includes("chase card") || haystack.includes("loan_pmt") || haystack.includes("payment thank you")) return "Card Payment";
  if (haystack.includes("live oak bank") || haystack.includes("rocket savings")) return "Savings Transfer";
  if (haystack.includes("robinhood") || haystack.includes("brokerage")) return "Investing";
  if (haystack.includes("fee")) return "Fees";
  if (haystack.includes("deposit") || haystack.includes("credit")) return "Deposits";
  if (haystack.includes("uber")) return "Travel";
  if (haystack.includes("walmart") || haystack.includes("wal-mart") || haystack.includes("supercenter")) return "Groceries";
  if (haystack.includes("taco bell") || haystack.includes("doordash")) return "Food & Drink";
  if (haystack.includes("steam") || haystack.includes("oculus") || haystack.includes("square enix")) return "Entertainment";
  if (haystack.includes("rent")) return "Rent";
  return "Uncategorized";
}

function classifyFlow(amount, type, description, category) {
  const haystack = `${type} ${description} ${category}`.toLowerCase();
  const transferSignals = [
    "payment thank you",
    "payment to chase card",
    "loan_pmt",
    "cash redemption",
    "savings transfer",
    "live oak bank",
    "rocket savings",
    "rh brokerage deposit",
    "robinhood.com",
    "zelle payment",
  ];

  if (transferSignals.some((signal) => haystack.includes(signal))) {
    return "transfer";
  }

  return amount >= 0 ? "income" : "expense";
}

function syncAccountFilter(rows) {
  const selected = accountFilter.value;
  const accounts = [...new Set(rows.map((row) => row.account))].sort();
  accountFilter.innerHTML = '<option value="all">All accounts</option>';

  accounts.forEach((account) => {
    const option = document.createElement("option");
    option.value = account;
    option.textContent = account;
    accountFilter.append(option);
  });

  if (accounts.includes(selected)) {
    accountFilter.value = selected;
  }
}

function render() {
  const rows = getVisibleTransactions();
  const hasRows = transactions.length > 0;

  emptyState.classList.toggle("hidden", hasRows);
  dashboard.classList.toggle("hidden", !hasRows);

  if (!hasRows) {
    return;
  }

  renderMetrics(rows);
  renderBiggestSpend(rows);
  renderMonthlyChart(rows);
  renderRankList("#categoryList", summarize(rows.filter((row) => row.flow === "expense"), "category"), "expense");
  renderRankList("#merchantList", summarize(rows.filter((row) => row.flow === "expense"), "merchant"), "expense", 8);
  renderRankList("#accountList", summarize(rows, "account"), "net");
  renderTransactions(rows);
  renderMeta(rows);
}

function getVisibleTransactions() {
  const search = searchInput.value.trim().toLowerCase();
  const account = accountFilter.value;
  const flow = flowFilter.value;

  return transactions.filter((transaction) => {
    if (account !== "all" && transaction.account !== account) return false;
    if (flow !== "all" && transaction.flow !== flow) return false;
    if (search && !transaction.searchable.includes(search)) return false;
    return true;
  });
}

function renderMetrics(rows) {
  const income = sumByFlow(rows, "income");
  const expenses = Math.abs(sumByFlow(rows, "expense"));
  const net = income - expenses;

  document.querySelector("#incomeMetric").textContent = currency.format(income);
  document.querySelector("#expenseMetric").textContent = currency.format(expenses);
  document.querySelector("#netMetric").textContent = currency.format(net);
  document.querySelector("#countMetric").textContent = rows.length.toLocaleString();
}

function renderBiggestSpend(rows) {
  const expenses = rows.filter((row) => row.flow === "expense");
  const biggest = summarize(expenses, "merchant")[0];
  const biggestCategory = summarize(expenses.filter((row) => row.category !== "Uncategorized"), "category")[0];
  const name = document.querySelector("#biggestSpendName");
  const detail = document.querySelector("#biggestSpendDetail");
  const amount = document.querySelector("#biggestSpendAmount");
  const categoryName = document.querySelector("#biggestCategoryName");
  const categoryDetail = document.querySelector("#biggestCategoryDetail");
  const categoryAmount = document.querySelector("#biggestCategoryAmount");

  if (!biggest) {
    name.textContent = "No expenses found";
    detail.textContent = "Change filters or load expense transactions.";
    amount.textContent = currency.format(0);
    categoryName.textContent = "No expenses found";
    categoryDetail.textContent = "Change filters or load expense transactions.";
    categoryAmount.textContent = currency.format(0);
    return;
  }

  name.textContent = biggest.label;
  detail.textContent = `${biggest.count} transaction${biggest.count === 1 ? "" : "s"} matched the current filters.`;
  amount.textContent = currency.format(Math.abs(biggest.amount));

  if (!biggestCategory) {
    categoryName.textContent = "No known category";
    categoryDetail.textContent = "Categorize more transactions to use this.";
    categoryAmount.textContent = currency.format(0);
    return;
  }

  categoryName.textContent = biggestCategory.label;
  categoryDetail.textContent = `${biggestCategory.count} known transaction${biggestCategory.count === 1 ? "" : "s"} in this category.`;
  categoryAmount.textContent = currency.format(Math.abs(biggestCategory.amount));
}

function sumByFlow(rows, flow) {
  return rows
    .filter((row) => row.flow === flow)
    .reduce((total, row) => total + row.amount, 0);
}

function renderMonthlyChart(rows) {
  const byMonth = new Map();

  rows.forEach((row) => {
    const current = byMonth.get(row.month) || { month: row.month, income: 0, expenses: 0, net: 0 };
    if (row.flow === "income") current.income += row.amount;
    if (row.flow === "expense") current.expenses += Math.abs(row.amount);
    current.net += row.flow === "expense" ? row.amount : row.flow === "income" ? row.amount : 0;
    byMonth.set(row.month, current);
  });

  const monthly = [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
  const largest = Math.max(1, ...monthly.map((row) => Math.max(row.income, row.expenses)));
  const chart = document.querySelector("#monthlyChart");
  chart.innerHTML = "";

  monthly.forEach((row) => {
    chart.append(createBarRow(`${row.month} in`, row.income, row.income / largest, "income"));
    chart.append(createBarRow(`${row.month} out`, row.expenses, row.expenses / largest, "expense"));
  });
}

function createBarRow(label, amount, widthRatio, tone) {
  const row = document.createElement("div");
  row.className = "bar-row";
  row.innerHTML = `
    <span class="bar-label"></span>
    <div class="track"><div class="fill ${tone}" style="width: ${Math.max(widthRatio * 100, amount ? 2 : 0)}%"></div></div>
    <span class="amount"></span>
  `;
  row.querySelector(".bar-label").textContent = label;
  row.querySelector(".amount").textContent = currency.format(amount);
  return row;
}

function summarize(rows, key) {
  const map = new Map();
  rows.forEach((row) => {
    const label = row[key] || "Uncategorized";
    const current = map.get(label) || { label, amount: 0, count: 0 };
    current.amount += row.amount;
    current.count += 1;
    map.set(label, current);
  });

  return [...map.values()].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
}

function renderRankList(selector, items, tone, limit = 10) {
  const list = document.querySelector(selector);
  const visible = items.slice(0, limit);
  const largest = Math.max(1, ...visible.map((item) => Math.abs(item.amount)));
  list.innerHTML = "";

  if (!visible.length) {
    list.innerHTML = '<p class="muted">No matching transactions.</p>';
    return;
  }

  visible.forEach((item) => {
    const row = document.createElement("div");
    const amount = tone === "expense" ? Math.abs(item.amount) : item.amount;
    row.className = "rank-row";
    row.innerHTML = `
      <span class="rank-label"></span>
      <div class="track"><div class="fill ${tone === "expense" ? "expense" : ""}" style="width: ${(Math.abs(item.amount) / largest) * 100}%"></div></div>
      <span class="amount"></span>
    `;
    row.querySelector(".rank-label").textContent = `${item.label} (${item.count})`;
    row.querySelector(".amount").textContent = currency.format(amount);
    list.append(row);
  });
}

function renderTransactions(rows) {
  const table = document.querySelector("#transactionTable");
  table.innerHTML = "";

  rows.slice(0, 500).forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td class="numeric"></td>
      <td><span class="flow-pill"></span></td>
    `;
    const cells = tr.querySelectorAll("td");
    cells[0].textContent = row.dateText;
    cells[1].textContent = row.account;
    cells[2].textContent = row.description;
    cells[3].textContent = row.category;
    cells[4].textContent = row.sourceType;
    cells[5].textContent = currency.format(row.amount);
    const pill = tr.querySelector(".flow-pill");
    pill.textContent = row.flow;
    pill.classList.add(row.flow);
    table.append(tr);
  });
}

function renderMeta(rows) {
  const dates = rows.map((row) => row.date).sort((a, b) => a - b);
  const expenseTotal = Math.abs(sumByFlow(rows, "expense"));
  const accounts = new Set(rows.map((row) => row.account));

  document.querySelector("#visibleRows").textContent = `${rows.length.toLocaleString()} shown, table capped at 500`;
  document.querySelector("#categoryTotal").textContent = currency.format(expenseTotal);
  document.querySelector("#accountCount").textContent = `${accounts.size} account${accounts.size === 1 ? "" : "s"}`;

  if (dates.length) {
    document.querySelector("#dateRange").textContent = `${dateFormatter.format(dates[0])} to ${dateFormatter.format(dates[dates.length - 1])}`;
  } else {
    document.querySelector("#dateRange").textContent = "No matching dates";
  }
}
