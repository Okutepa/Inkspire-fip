import authService from '../services/auth.service.js';

const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            email: '',
            password: '',
            loading: false,
            error: null,
            success: null
        };
    },
    methods: {
        async login() {
            this.loading = true;
            this.error = null;
            this.success = null;
            try {
                const response = await authService.login(this.email, this.password);
                this.loading = false;
                this.success = "Login successful! Redirecting...";
                const user = response.user;
                setTimeout(() => {
                    // Use absolute paths to prevent path duplication
                    if (user.role === 'admin') {
                        window.location.href = '/Inkspire-fip/frontend/admin/dashboard.html';
                    } else if (user.role === 'artist') {
                        window.location.href = '/Inkspire-fip/frontend/artist/dashboard.html';
                    } else {
                        window.location.href = '/Inkspire-fip/frontend/index.html';
                    }
                }, 1000);
            } catch (error) {
                this.loading = false;
                this.error = 'Invalid email or password. Please try again.';
                console.error('Login error:', error);
            }
        },
        
        // Remove token if it's invalid to prevent redirect loops
        async validateAndClearToken() {
            console.log("Validating token...");
            if (authService.isLoggedIn()) {
                try {
                    // Try to verify the token by making a request
                    const user = await authService.getCurrentUser();
                    console.log("Current user from API:", user);
                    
                    // If we get here, token is valid - proceed with redirect
                    if (user && user.role === 'admin') {
                        console.log("Valid admin token, redirecting...");
                        window.location.href = 'admin/dashboard.html';
                    } else if (user && user.role === 'artist') {
                        console.log("Valid artist token, redirecting...");
                        window.location.href = 'artist/dashboard.html';
                    } else {
                        console.log("Invalid user role, clearing token");
                        authService.clearAuth();
                    }
                } catch (error) {
                    // Token validation failed, clear it
                    console.log("Token validation failed:", error);
                    authService.clearAuth();
                }
            } else {
                console.log("No token found, staying on login page");
            }
        }
    },
    async mounted() {
        console.log("Login page mounted");
        
        // First check if there's a token
        if (authService.isLoggedIn()) {
            try {
                // Try to verify the token by making a request
                const user = await authService.getCurrentUser();
                
                // Only redirect if we got a valid user response
                if (user && user.id) {
                    // Use absolute paths to prevent path duplication
                    if (user.role === 'admin') {
                        window.location.href = '/Inkspire-fip/frontend/admin/dashboard.html';
                    } else if (user.role === 'artist') {
                        window.location.href = '/Inkspire-fip/frontend/artist/dashboard.html';
                    }
                } else {
                    // Invalid user data returned, clear auth
                    authService.clearAuth();
                }
            } catch (error) {
                // API request failed, clear any invalid tokens
                console.error("Token validation failed:", error);
                authService.clearAuth();
            }
        }
    }
});

app.mount('#login-app');