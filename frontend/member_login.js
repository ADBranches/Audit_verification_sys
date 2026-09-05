document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const memberId = document.getElementById("memberId").value.trim();
  const password = document.getElementById("password").value.trim();
  const responseBox = document.getElementById("loginResponse");

  try {
    const res = await fetch("http://127.0.0.1:8000/member_login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ member_id: memberId, password: password })
    });

    if (!res.ok) {
      const error = await res.json();
      responseBox.textContent = "❌ " + error.detail; // shows attempts or lockout message
      return;
    }

    const result = await res.json();
    responseBox.textContent = "✅ " + result.message;

    // Save login state
    sessionStorage.setItem("memberLoggedIn", "true");
    sessionStorage.setItem("memberId", memberId);

    // Set auto logout after 30 minutes
    const logoutTime = Date.now() + (30 * 60 * 1000);
    sessionStorage.setItem("logoutAt", logoutTime);

    window.location.href = "index.html";
  } catch (err) {
    responseBox.textContent = "❌ Error: " + err.message;
  }
});
