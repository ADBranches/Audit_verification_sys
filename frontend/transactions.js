// Load transactions when page opens
async function loadTransactions() {
  const tableBody = document.getElementById("transactionsTableBody");

  try {
    const res = await fetch("http://127.0.0.1:8000/transactions");
    if (!res.ok) {
      const error = await res.json();
      tableBody.innerHTML = `<tr><td colspan="9">❌ Error: ${error.detail}</td></tr>`;
      return;
    }

    const data = await res.json();
    const txs = data.transactions || [];

    tableBody.innerHTML = "";

    if (txs.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9">No transactions found.</td></tr>`;
      return;
    }

    txs.forEach(tx => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${tx.transaction_id || ""}</td>
        <td>${tx.amount || ""}</td>
        <td>${tx.member_id || ""}</td>
        <td>${tx.description || ""}</td>
        <td>${tx.date_time || ""}</td>
        <td>${tx.method || ""}</td>
        <td>${tx.network || ""}</td>
        <td>${tx.phone_number || ""}</td>
        <td>${tx.hash || ""}</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="9">❌ Error: ${err.message}</td></tr>`;
  }
}

// Handle Manual Transaction form
document.getElementById("addTransactionForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const txId = document.getElementById("transactionId").value.trim();
  const amount = parseFloat(document.getElementById("amount").value.trim());
  const memberId = document.getElementById("memberId").value.trim();
  const description = document.getElementById("description").value.trim();
  const responseBox = document.getElementById("transactionsResponse");

  try {
    const res = await fetch("http://127.0.0.1:8000/transactions", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        transaction_id: txId,
        amount: amount,
        member_id: memberId,
        description: description,
        method: "manual"
      })
    });

    if (!res.ok) {
      const error = await res.json();
      responseBox.textContent = "❌ " + error.detail;
      return;
    }

    const result = await res.json();
    responseBox.textContent = "✅ Manual transaction added!";
    loadTransactions();
  } catch (err) {
    responseBox.textContent = "❌ Error: " + err.message;
  }
});

// Load transactions on page start
window.onload = loadTransactions;
