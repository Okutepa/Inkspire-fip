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
            console.log("Login response data:", data); // Debug log
            // Ensure the user object includes an id field
            const user = {
                id: data.user.id || data.user.user_id, // Fallback to user_id if id is not present
                name: data.user.name,
                email: data.user.email,
                role: data.user.role
            };
            if (!user.id) {
                console.error("User ID missing in login response:", user);
                throw new Error('User ID missing in login response');
            }
            console.log("Storing user after login:", user); // Debug log
            this.setToken(data.access_token);
            this.setUser(user);
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
        })
        .then(data => {
            console.log("Register response data:", data); // Debug log
            if (data.user) {
                const user = {
                    id: data.user.id || data.user.user_id,
                    name: data.user.name,
                    email: data.user.email,
                    role: data.user.role
                };
                if (!user.id) {
                    console.error("User ID missing in register response:", user);
                    throw new Error('User ID missing in register response');
                }
                console.log("Storing user after registration:", user); // Debug log
                this.setUser(user);
            }
            return data;
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
                console.log("Logout successful, clearing auth data"); // Debug log
                this.clearAuth();
                return { success: true };
            })
            .catch(err => {
                console.error('Logout error:', err);
                this.clearAuth();
                return { success: true, error: err.message };
            });
        } else {
            console.log("No token found, clearing auth data"); // Debug log
            this.clearAuth();
            return Promise.resolve({ success: true });
        }
    },
    
    clearAuth() {
        console.log("Clearing auth data from localStorage"); // Debug log
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },
    
    getToken() {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        console.log("Retrieved token from localStorage:", token); // Debug log
        return token;
    },
    
    setToken(token) {
        console.log("Setting token in localStorage:", token); // Debug log
        localStorage.setItem(AUTH_TOKEN_KEY, token);
    },
    
    getUser() {
        try {
            const userJson = localStorage.getItem(USER_KEY);
            const user = userJson ? JSON.parse(userJson) : null;
            console.log("Retrieved user from localStorage:", user); // Debug log
            return user;
        } catch (e) {
            console.error("Error parsing user from localStorage:", e);
            this.clearAuth();
            return null;
        }
    },
    
    updateUserData(userData) {
        const updatedData = { ...userData };
        if (updatedData.token) {
            delete updatedData.token;
        }
        // Ensure id is preserved if present
        if (!updatedData.id && userData.artist_id) {
            updatedData.id = userData.artist_id;
        }
        console.log("Updating user in localStorage:", updatedData); // Debug log
        localStorage.setItem(USER_KEY, JSON.stringify(updatedData));
    },
    
    setUser(user) {
        const userToStore = {
            id: user.id || user.user_id,
            name: user.name,
            email: user.email,
            role: user.role
        };
        console.log("Setting user in localStorage:", userToStore); // Debug log
        localStorage.setItem(USER_KEY, JSON.stringify(userToStore));
    },
    
    isLoggedIn() {
        const isLoggedIn = !!this.getToken();
        console.log("Is user logged in?", isLoggedIn); // Debug log
        return isLoggedIn;
    },
    
    isAdmin() {
        const user = this.getUser();
        const isAdmin = user && user.role === 'admin';
        console.log("Is user admin?", isAdmin); // Debug log
        return isAdmin;
    },
    
    isArtist() {
        const user = this.getUser();
        const isArtist = user && user.role === 'artist';
        console.log("Is user artist?", isArtist); // Debug log
        return isArtist;
    },
    
    getAuthHeader() {
        const token = this.getToken();
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        console.log("Auth headers:", headers); // Debug log
        return headers;
    },
    
    getCurrentUser() {
        const token = this.getToken();
        
        if (!token) {
            console.log("No token found, user not authenticated"); // Debug log
            return Promise.resolve(null);
        }
        
        return fetch(`${API_BASE_URL}/api/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                console.log("Failed to fetch current user, clearing auth data"); // Debug log
                this.clearAuth();
                throw new Error('Failed to get user info');
            }
            return response.json();
        })
        .then(data => {
            console.log("Fetched current user data:", data); // Debug log
            if (!data || !data.id) {
                console.log("Invalid user data, clearing auth data"); // Debug log
                this.clearAuth();
                return null;
            }
            const user = {
                id: data.id || data.user_id,
                name: data.name,
                email: data.email,
                role: data.role
            };
            if (!user.id) {
                console.error("User ID missing in current user response:", user);
                this.clearAuth();
                return null;
            }
            this.setUser(user);
            return user;
        })
        .catch(err => {
            console.error('Error fetching current user:', err);
            this.clearAuth();
            return null;
        });
    }
};