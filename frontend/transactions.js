// Load transactions
async function loadTransactions() {
  const tableBody = document.getElementById("transactionsTableBody");

  try {
    const res = await fetch("http://127.0.0.1:8000/transactions");
    if (!res.ok) {
      const text = await res.text();
      tableBody.innerHTML = `<tr><td colspan="9">❌ Error: ${text}</td></tr>`;
      return;
    }

    const data = await res.json();
    console.log("Transactions data:", data);

    const txs = data.transactions || [];

    tableBody.innerHTML = "";

    if (txs.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9">No transactions found.</td></tr>`;
      document.getElementById("balance").textContent = "Current Balance: 0";
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
      `;
      tableBody.appendChild(row);
    });

    document.getElementById("balance").textContent =
      "Current Balance: " + (data.total_amount_received || 0);

  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="9">❌ Error: ${err.message}</td></tr>`;
  }
}

// Load Members
async function loadMembers() {
  const tableBody = document.getElementById("membersTableBody");

  try {
    const res = await fetch("http://127.0.0.1:8000/members");
    if (!res.ok) {
      const text = await res.text();
      tableBody.innerHTML = `<tr><td colspan="4">❌ Error: ${text}</td></tr>`;
      return;
    }

    let members = await res.json();
    console.log("Members data:", members);

    tableBody.innerHTML = "";

    if (Object.keys(members).length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4">No members found.</td></tr>`;
      return;
    }

    Object.entries(members).forEach(([id, data]) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${id}</td>
        <td>${data.password}</td>
        <td>${data.email || ""}</td> <!-- ✅ show email -->
        <td>
          <button onclick="deleteMember('${id}')">Delete</button>
          <button onclick="modifyMemberPrompt('${id}')">Modify</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="4">❌ Error: ${err.message}</td></tr>`;
  }
}

// Delete Member
async function deleteMember(memberId) {
  if (!confirm(`Delete member ${memberId}?`)) return;
  try {
    const res = await fetch(`http://127.0.0.1:8000/delete_member/${memberId}`, { method: "DELETE" });
    const result = await res.json();
    alert(result.message);
    loadMembers();
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
}

// Modify Member
async function modifyMemberPrompt(memberId) {
  const newId = prompt("Enter new Member ID:", memberId);
  const newPassword = prompt("Enter new Password:");
  if (!newId || !newPassword) return;

  try {
    const res = await fetch(`http://127.0.0.1:8000/modify_member/${memberId}`, {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ new_member_id: newId, new_password: newPassword })
    });
    const result = await res.json();
    alert(result.message);
    loadMembers();
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
}

// ✅ Add Member with email
document.getElementById("addMemberForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const memberId = document.getElementById("newMemberId").value.trim();
  const password = document.getElementById("newMemberPassword").value.trim();
  const email = document.getElementById("newMemberEmail").value.trim(); // ✅ capture email
  const responseBox = document.getElementById("addMemberResponse");

  try {
    const res = await fetch("http://127.0.0.1:8000/add_member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: memberId, password: password, email: email }) // ✅ include email
    });

    const result = await res.json();
    if (!res.ok) {
      responseBox.textContent = "❌ " + (result.detail || JSON.stringify(result));
      return;
    }

    responseBox.textContent = "✅ " + result.message;
    loadMembers(); // refresh members table
  } catch (err) {
    responseBox.textContent = "❌ Error: " + err.message;
  }
});

// ✅ Reset Password
document.getElementById("resetPasswordForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("resetEmail").value.trim();
  const newPassword = document.getElementById("resetNewPassword").value.trim();
  const responseBox = document.getElementById("resetPasswordResponse");

  try {
    const res = await fetch("http://127.0.0.1:8000/reset_password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, new_password: newPassword })
    });

    const result = await res.json();
    if (!res.ok) {
      responseBox.textContent = "❌ " + (result.detail || JSON.stringify(result));
      return;
    }

    responseBox.textContent = "✅ " + result.message;
    loadMembers(); // refresh members table
  } catch (err) {
    responseBox.textContent = "❌ Error: " + err.message;
  }
});

// 🔎 Search Members
function searchMembers() {
  const query = document.getElementById("searchMembersBox").value.toLowerCase();
  const rows = document.querySelectorAll("#membersTableBody tr");
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? "" : "none";
  });
}

// 🔎 Search Transactions
function searchTransactions() {
  const query = document.getElementById("searchTransactionsBox").value.toLowerCase();
  const rows = document.querySelectorAll("#transactionsTableBody tr");
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? "" : "none";
  });
}

// ✅ Withdraw form with phone number
document.getElementById("withdrawForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const txId = "WD-" + Date.now();
  const amount = parseFloat(document.getElementById("withdrawAmount").value.trim());
  const memberId = document.getElementById("withdrawMemberId").value.trim();
  const description = document.getElementById("withdrawDescription").value.trim();
  const phoneNumber = document.getElementById("withdrawPhoneNumber").value.trim(); // ✅ new field
  const responseBox = document.getElementById("withdrawResponse");

  try {
    const res = await fetch("http://127.0.0.1:8000/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction_id: txId,
        amount: -Math.abs(amount),
        member_id: memberId,
        description: description,
        method: "withdraw",
        phone_number: phoneNumber // ✅ include phone number
      })
    });

    if (!res.ok) {
      const text = await res.text();
      responseBox.textContent = "❌ " + text;
      return;
    }

    const result = await res.json();
    responseBox.textContent = "✅ Withdrawal recorded! Transaction ID: " + txId;
    loadTransactions();
  } catch (err) {
    responseBox.textContent = "❌ Error: " + err.message;
  }
});

// ✅ Ensure transactions always load on page start
window.onload = () => {
  loadTransactions();
};
