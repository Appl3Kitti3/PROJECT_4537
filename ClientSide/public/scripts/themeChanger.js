// This enables light and dark mode for the website
const theme = localStorage.getItem("colorMode");
if (theme === "light") {
  document.body.setAttribute("data-bs-theme", "light");
} else {
  document.body.setAttribute("data-bs-theme", "dark");
}