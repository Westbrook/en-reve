if (new URLSearchParams(location.search).has("progress-report")) {
  const a = document.createElement("a");
  a.className = "progress-return";
  a.href = "http://127.0.0.1:4177";
  a.textContent = "Progress Report";
  document.body.append(a);
}
