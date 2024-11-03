/**
 * IsValidatedPromise - Checks if the user is authenicated
 * @returns {Promise} - Promise that resolves if the user is authenicated, rejects otherwise
 */
async function isValidatedPromise() {
  return new Promise(async (resolve, reject) => {
    const response = await fetch(`${API_URL}/api/auth/check-token`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
    });
    if (response.ok)
      resolve();
    else
      reject();
  });
}

/**
 * GetUserPromise - Checks if the user is authenicated and gets the user data
 * @returns {Promise} - Promise that resolves with the user data if the user is authenicated, rejects otherwise
 */
async function GetUserPromise() {
  return new Promise(async (resolve, reject) => {
    const response = await fetch(`${API_URL}/api/auth/user`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    if (response.ok)
      resolve(response.json());
    else
      reject();
  });
}

/**
 * This gets userInformation if the user is authenicated
 * otherwise, it redirects to the login page
 */
async function validateAndGetUser() {
  return isValidatedPromise()
  .then(async () => {
      // Resolve 1
      // If user authenicated
      return await GetUserPromise()
        .then(async (data) => {
            // Resolve 2
            // If able to get user
            return data;
          }, async () => {
            // Reject 2
            // If unable to get user
            window.location.href = 'index.html';
          }
        )
    }, 
    async () => {
      // Reject 1
      // If user not authenicated, navigate to login
      window.location.href = 'index.html';
    }
  );
}

/**
* Gets user data and uses that data to check the role of the user
* @returns {Promise<bool>} - Promise that resolves if the user is an admin, rejects otherwise
*/
async function isAdmin() {
  let userData = await validateAndGetUser();
  return userData.user.role === "admin";
};

// Loads header
async function loadHeader() {
  try {
    
    // Get header 
    const response = await fetch('./components/header.html');

    // Set the header element with HTML text
    const headerString = await response.text();

    const parser = new DOMParser();
    const headerHTML = parser.parseFromString(headerString, 'text/html');
    const isAdminUser = await isAdmin();
    const authButtons = headerHTML.getElementsByClassName("auth-button");
    const logOutButton = headerHTML.getElementById("logout-button");
    if (!isAdminUser)
      headerHTML.getElementById("adminDashboard").style.display = "none";
    
    // If user is authenicated, hide the sign in buttons
    await isValidatedPromise().then(() => {
      Object.values(authButtons).forEach(element => {
        element.style.display = "none";
      });

    },
    () => {
      logOutButton.style.display = "none";
    }

  );

    const headerElement = headerHTML.getElementById('header');
    document.getElementById('header').innerHTML = headerElement.innerHTML;


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

export {  validateAndGetUser, loadHeader, isAdmin, isValidatedPromise, GetUserPromise};