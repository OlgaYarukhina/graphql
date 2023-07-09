const loginForm = document.getElementById('login');
const logoutButton = document.getElementById('logout');
const userCredentialInput = document.getElementById('credentials');
const passwordInput = document.getElementById('password');
const errorContainer = document.getElementById('error');
const statisticPage = document.querySelector('.wrapper-statistic');

// Add event listener to the login form
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = userCredentialInput.value;
    const password = passwordInput.value;
    // Encode credentials using base64 encoding
    const credentials = btoa(`${user}:${password}`);


    try {
        const response = await fetch('https://01.kood.tech/api/auth/signin', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${credentials}`,
            },
        });
        if (response.ok) {
            const token = await response.json();
            localStorage.setItem('jwt', token);             // Store the JWT in local storage for future API requests
            deleteError();
            let data = await makeGraphQLRequest();
           creationStatisticPage(data);

        } else {
            const errorData = await response.json();
            displayError(errorData.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        displayError('An error occurred during login.');
    }
});

const  creationStatisticPage = (data) => {
    loginForm.style.display = 'none';
    statisticPage.style.display = "grid";
    // 1. Add data
    const welcome = document.getElementById('wc');
    welcome.textContent = `WELCOME, ${data.data.user[0].attrs.firstName} ${data.data.user[0].attrs.lastName}`
    // 2. XP gragh
    creationGraphXPRation(data.data.user[0].transactions);
    // 3. Audit gragh
   creationGraphAuditRation(data.data.user[0].totalDown, data.data.user[0].totalUp);
}


logoutButton.addEventListener('click', () => {
    localStorage.removeItem('jwt');
    statisticPage.style.display = 'none';
    loginForm.style.display = 'flex';
    userCredentialInput.value ="";
    passwordInput.value ="";
});