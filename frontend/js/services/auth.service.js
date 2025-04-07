// js/services/auth.service.js
const AUTH_TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';
const API_BASE_URL = 'http://localhost:8888/Inkspire-fip/api/public';

const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
};

export default {
    login(email, password) {
        return fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || 'Login failed');
                });
            }
            return response.json();
        })
        .then(data => {
            if (!data.access_token || !data.user) {
                throw new Error('Invalid response format');
            }
            this.setToken(data.access_token);
            this.setUser(data.user);
            return data;
        });
    },
    
    register(name, email, password, role = 'artist') {
        return fetch(`${API_BASE_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, role })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Registration failed');
            }
            return response.json();
        });
    },
    
    logout() {
        const token = this.getToken();
        
        if (token) {
            return fetch(`${API_BASE_URL}/api/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(() => {
                this.clearAuth();
                return { success: true };
            })
            .catch(err => {
                console.error('Logout error:', err);
                this.clearAuth();
                return { success: true, error: err.message };
            });
        } else {
            this.clearAuth();
            return Promise.resolve({ success: true });
        }
    },
    
    clearAuth() {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },
    
    getToken() {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    },
    
    setToken(token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
    },
    
    getUser() {
        try {
            const userJson = localStorage.getItem(USER_KEY);
            return userJson ? JSON.parse(userJson) : null;
        } catch (e) {
            this.clearAuth(); // Clear invalid data
            return null;
        }
    },
    
    setUser(user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    
    isLoggedIn() {
        return !!this.getToken();
    },
    
    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },
    
    isArtist() {
        const user = this.getUser();
        return user && user.role === 'artist';
    },
    
    getAuthHeader() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    },
    
    // Fetch the current user information from the server
    getCurrentUser() {
        const token = this.getToken();
        
        if (!token) {
            return Promise.resolve(null);
        }
        
        return fetch(`${API_BASE_URL}/api/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to get user info');
            }
            return response.json();
        })
        .then(data => {
            // Update the stored user data with the latest from server
            this.setUser(data);
            return data;
        })
        .catch(err => {
            console.error('Error fetching current user:', err);
            return null;
        });
    }
};