// Loads header
const loadHeader = async () => {
    try {
      // Get header 
      const response = await fetch('./components/header.html');

      // Set the header element with HTML text
      const headerHTML = await response.text();
      document.getElementById('header').innerHTML = headerHTML;

      // Load the script
      const script = document.createElement('script');
      script.textContent = `
        const removeSignInButtons = () => {
          const elements = [...document.getElementsByClassName("signin-button")];
          elements.forEach(element => {
            element.style.display = "none";
          });
        };
        if (localStorage.getItem("isAuthenicated")) {
            removeSignInButtons();
        }
      `;
      document.body.appendChild(script);
    } catch (error) {
      console.error('Error loading header:', error);
    }
  };

loadHeader();