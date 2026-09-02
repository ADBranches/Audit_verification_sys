// Redirect if not logged in
if (sessionStorage.getItem("isLoggedIn") !== "true") {
  window.location.href = "login.html";
}

let transactionsCache = [];

async function loadTransactions() {
  try {
    const res = await fetch("http://127.0.0.1:8000/transactions");
    const result = await res.json();
    transactionsCache = result.transactions;
    renderTable(transactionsCache);
  } catch (err) {
    alert("Error loading transactions: " + err.message);
  }
}

function renderTable(data) {
  const tbody = document.getElementById("transactionsBody");
  tbody.innerHTML = "";
  if (data.length === 0) {
    tbody.innerHTML = "<tr><td colspan='7'>No transactions found</td></tr>";
    return;
  }
  data.forEach(tx => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${tx.transaction_id}</td>
      <td>${tx.amount}</td>
      <td>${tx.member_id}</td>
      <td>${tx.description}</td>
      <td>${tx.created_at}</td>
      <td>${tx.method}</td>
      <td>${tx.hash}</td>
    `;
    tbody.appendChild(row);
  });
}

document.getElementById("searchBox").addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = transactionsCache.filter(tx =>
    tx.transaction_id.toLowerCase().includes(query) ||
    tx.member_id.toLowerCase().includes(query) ||
    tx.description.toLowerCase().includes(query) ||
    tx.created_at.toLowerCase().includes(query)
  );
  renderTable(filtered);
});

document.getElementById("transactionForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    transaction_id: document.getElementById("transaction_id").value,
    amount: parseFloat(document.getElementById("amount").value),
    member_id: document.getElementById("member_id").value,
    description: document.getElementById("description").value
  };

  try {
    const res = await fetch("http://127.0.0.1:8000/record", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(data)
    });
    const result = await res.json();
    document.getElementById("recordResponse").textContent = JSON.stringify(result, null, 2);
    loadTransactions();
  } catch (err) {
    document.getElementById("recordResponse").textContent = "Error: " + err.message;
  }
});

function logout() {
  sessionStorage.removeItem("isLoggedIn");
  window.location.href = "login.html";
}

loadTransactions();
