
async function testLogin() {
    try {
        console.log('Attempting login...');
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password'
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Login success:', data);
        } else {
            console.log('Login failed with status:', response.status);
            const text = await response.text();
            console.log('Body:', text);
        }
    } catch (error: any) {
        console.log('Login failed (network/other):', error.message);
    }
}

testLogin();
