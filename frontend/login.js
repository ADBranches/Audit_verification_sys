document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  if (user === "admin" && pass === "admin") {
    sessionStorage.setItem("isLoggedIn", "true");
    window.location.href = "transactions.html"; // redirect to View/Add page
  } else {
    document.getElementById("loginResponse").textContent = "Invalid credentials!";
  }
});
