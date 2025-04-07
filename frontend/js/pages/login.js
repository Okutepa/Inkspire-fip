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
                    if (user.role === 'admin') {
                        window.location.href = 'frontend/admin/dashboard.html';
                    } else if (user.role === 'artist') {
                        window.location.href = 'frontend/artist/dashboard.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 1000);
            } catch (error) {
                this.loading = false;
                this.error = 'Invalid email or password. Please try again.';
                console.error('Login error:', error);
            }
        },
        checkAuth() {
            if (authService.isLoggedIn()) {
                const user = authService.getUser();
                if (user.role === 'admin') {
                    window.location.href = 'frontend/admin/dashboard.html';
                } else if (user.role === 'artist') {
                    window.location.href = 'frontend/artist/dashboard.html';
                }
            }
        }
    },
    mounted() {
        this.checkAuth();
    }
});

app.mount('#login-app');