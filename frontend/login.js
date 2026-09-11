document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  const responseBox = document.getElementById("loginResponse");

  try {
    // ✅ Admin login with 2FA
    if (user === "admin") {
      const res = await fetch("http://127.0.0.1:8000/admin_login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: user, password: pass })
      });

      if (!res.ok) {
        const error = await res.json();
        responseBox.textContent = "❌ " + (error.detail || JSON.stringify(error));
        return;
      }

      const result = await res.json();
      if (result.step === "2fa_required") {
        // Show message, generated code, and an input box for entry
        responseBox.innerHTML = `
          📲 Enter the 2FA code sent to your phone/app.<br>
          <strong>Generated code (simulation): ${result.code}</strong><br><br>
          <input type="text" id="admin2faInput" placeholder="Enter 2FA code">
          <button id="admin2faSubmit">Verify</button>
        `;

        // Attach handler for verification
        document.getElementById("admin2faSubmit").addEventListener("click", async () => {
          const code = document.getElementById("admin2faInput").value.trim();
          if (!code) {
            alert("Please enter the 2FA code.");
            return;
          }

          const verifyRes = await fetch("http://127.0.0.1:8000/admin_verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ member_id: user, code: code })
          });

          if (!verifyRes.ok) {
            const error = await verifyRes.json();
            responseBox.textContent = "❌ " + (error.detail || JSON.stringify(error));
            return;
          }

          const verifyResult = await verifyRes.json();
          responseBox.textContent = "✅ " + (verifyResult.message || JSON.stringify(verifyResult));
          sessionStorage.setItem("isAdminLoggedIn", "true");
          window.location.href = "transactions.html"; // Admin section
        });

        return; // stop here until 2FA is verified
      }
    }

    // ✅ Member login via backend
    const res = await fetch("http://127.0.0.1:8000/member_login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: user, password: pass })
    });

    if (!res.ok) {
      const error = await res.json();
      responseBox.textContent = "❌ " + (error.detail || JSON.stringify(error));
      return;
    }

    const result = await res.json();
    responseBox.textContent = "✅ " + (result.message || JSON.stringify(result));
    sessionStorage.setItem("memberLoggedIn", "true");
    sessionStorage.setItem("memberId", user);
    window.location.href = "index.html"; // Member dashboard
  } catch (err) {
    responseBox.textContent = "❌ Error: " + err.message;
  }
});
