// ---------------- LOGIN ENFORCEMENT ----------------

// Check if member is logged in
if (!sessionStorage.getItem("memberLoggedIn")) {
  window.location.href = "member_login.html";
} else {
  // Check auto logout
  const logoutAt = sessionStorage.getItem("logoutAt");
  if (logoutAt && Date.now() > parseInt(logoutAt)) {
    alert("Session expired. Please log in again.");
    sessionStorage.removeItem("memberLoggedIn");
    sessionStorage.removeItem("memberId");
    sessionStorage.removeItem("logoutAt");
    window.location.href = "member_login.html";
  }
}

// ---------------- MOBILE MONEY HANDLER ----------------

document.getElementById("mobileMoneyForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const network = document.getElementById("network").value;
  const phoneNumber = document.getElementById("phoneNumber").value.trim();
  const amount = parseFloat(document.getElementById("mmAmount").value.trim());
  const memberId = document.getElementById("mmMemberId").value.trim();
  const description = document.getElementById("mmDescription").value; // dropdown value
  const responseBox = document.getElementById("mobileMoneyResponse");

  try {
    // Step 1: Mimic PIN prompt
    responseBox.textContent = `📲 ${network} is requesting your PIN... Please enter your PIN on your phone.`;

    // Step 2: Simulate short delay before backend call
    setTimeout(async () => {
      try {
        const res = await fetch(`${window.AUDIT_APP_CONFIG.apiBaseUrl}/mobile_money`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            member_id: memberId,
            amount: amount,
            phone_number: phoneNumber,
            description: description,
            network: network
          })
        });

        if (!res.ok) {
          const error = await res.json();
          responseBox.textContent = "❌ " + error.detail;
          return;
        }

        const result = await res.json();
        responseBox.textContent = "✅ " + result.transaction.network + " payment recorded!";
      } catch (err) {
        responseBox.textContent = "❌ Error: " + err.message;
      }
    }, 3000); // 3 second delay to mimic PIN entry
  } catch (err) {
    responseBox.textContent = "❌ Error: " + err.message;
  }
});

// ---------------- TRANSACTION VERIFICATION ----------------

document.getElementById("verifyForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const txId = document.getElementById("verify_id").value.trim();
  const responseBox = document.getElementById("verifyResponse");

  try {
    const res = await fetch(`${window.AUDIT_APP_CONFIG.apiBaseUrl}/transactions`);
    if (!res.ok) {
      const error = await res.json();
      responseBox.textContent = "❌ " + error.detail;
      return;
    }

    const data = await res.json();
    const txs = data.transactions || [];
    const found = txs.find(tx => tx.transaction_id === txId);

    if (found) {
      responseBox.textContent = "✅ Transaction found:\n" + JSON.stringify(found, null, 2);
    } else {
      responseBox.textContent = "❌ Transaction not found.";
    }
  } catch (err) {
    responseBox.textContent = "❌ Error: " + err.message;
  }
});
