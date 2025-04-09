import authService from '../services/auth.service.js';

const { createApp } = Vue;
const API_BASE_URL = 'http://localhost:8888/Inkspire-fip/api/public';

const app = createApp({
    data() {
        return {
            user: null,
            activePanel: 'dashboard',
            tattoos: [],
            filteredTattoos: [],
            recentTattoos: [],
            loading: { tattoos: false },
            error: { tattoos: null },
            saving: false,
            showTattooForm: false,
            editingTattoo: null,
            tattooForm: { 
                title: '', 
                description: '', 
                artist_id: '', 
                image: null, 
                imagePreview: null, 
                featured: false 
            },
            tattooSearch: '',
            confirmModal: { 
                show: false, 
                title: '', 
                message: '', 
                onConfirm: null 
            }
        };
    },
    methods: {
        checkAuth() {
            console.log("Checking authentication...");
            if (!authService.isLoggedIn()) {
                console.log("User not logged in, redirecting to login page");
                window.location.href = '../login.html';
                return false;
            }
            
            const user = authService.getUser();
            console.log("User from localStorage:", user);
            
            if (!user || user.role !== 'artist') {
                console.log("User has invalid role, redirecting to home page");
                alert('You do not have permission to access this page');
                window.location.href = '../index.html';
                return false;
            }
            
            this.user = user;
            console.log("Artist authenticated successfully:", this.user);
            return true;
        },
        async logout() {
            await authService.logout();
            window.location.href = '../login.html';
        },
        fetchTattoos() {
            if (!this.user) return;
        
            this.loading.tattoos = true;
            this.error.tattoos = null;
            
            // Add a timestamp to avoid browser caching
            const nocache = new Date().getTime();
            fetch(`${API_BASE_URL}/api/tattoos?nocache=${nocache}`, { 
                headers: authService.getAuthHeader(),
                method: 'GET'
            })
                .then(response => {
                    if (!response.ok) throw new Error('Failed to fetch tattoos');
                    return response.json();
                })
                .then(data => {
                    console.log('Fetched tattoos:', data);
                    const tattoosData = data.data || [];
                    
                    // Process tattoo file paths
                    this.tattoos = tattoosData.map(tattoo => ({
                        ...tattoo,
                        file_path: tattoo.file_path ?
                            `${API_BASE_URL}/storage/tattoos/${tattoo.file_path.split('/').pop()}?t=${nocache}` :
                            "/images/default-tattoo.jpg"
                    }));
                    
                    // Filter tattoos to show only this artist's tattoos
                    this.filteredTattoos = this.tattoos.filter(t => t.artist_id === this.user.id);
                    
                    // Get recent tattoos for the dashboard
                    this.recentTattoos = [...this.filteredTattoos]
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .slice(0, 5);
                    
                    // Pre-set the artist_id in the form
                    this.tattooForm.artist_id = this.user.id;
                    
                    this.loading.tattoos = false;
                })
                .catch(error => {
                    console.error('Error fetching tattoos:', error);
                    this.error.tattoos = 'Failed to load tattoo portfolio. Please try again.';
                    this.loading.tattoos = false;
                });
        },
        resetTattooForm() {
            this.tattooForm = { 
                title: '', 
                description: '', 
                artist_id: this.user ? this.user.id : '', 
                image: null, 
                imagePreview: null, 
                featured: false 
            };
        },
        editTattoo(tattoo) {
            // Verify this tattoo belongs to the current artist
            if (tattoo.artist_id !== this.user.id) return;
            
            this.editingTattoo = tattoo;
            this.tattooForm = { 
                title: tattoo.title, 
                description: tattoo.description || '', 
                artist_id: tattoo.artist_id, 
                image: null, 
                imagePreview: tattoo.file_path, 
                featured: tattoo.featured || false 
            };
            this.showTattooForm = true;
        },
        closeTattooForm() {
            this.showTattooForm = false;
            this.editingTattoo = null;
            this.resetTattooForm();
        },
        handleTattooImageUpload(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                alert('Please select a valid image file (JPEG, PNG, or GIF)');
                e.target.value = ''; // Clear the input
                return;
            }
            
            this.tattooForm.image = file;
            const reader = new FileReader();
            reader.onload = () => this.tattooForm.imagePreview = reader.result;
            reader.readAsDataURL(file);
        },
        async saveTattoo() {
            console.log('Saving tattoo with form data:', this.tattooForm);
            if (!this.tattooForm.title.trim()) {
                alert('Tattoo title is required');
                return;
            }
            
            this.saving = true;
            const formData = new FormData();
            formData.append('title', this.tattooForm.title.trim());
            formData.append('description', this.tattooForm.description.trim());
            formData.append('artist_id', this.user.id); // Always use current artist ID
            formData.append('featured', this.tattooForm.featured ? '1' : '0');
            
            // Include image if provided
            if (this.tattooForm.image) {
                formData.append('file_path', this.tattooForm.image);
                console.log('Uploading new image:', this.tattooForm.image.name);
            }
            
            const url = this.editingTattoo 
                ? `${API_BASE_URL}/api/tattoos/${this.editingTattoo.tattoo_id}` 
                : `${API_BASE_URL}/api/tattoos`;
                
            // For editing, use method spoofing
            const method = this.editingTattoo ? 'POST' : 'POST';
            if (this.editingTattoo) {
                formData.append('_method', 'PUT');
            }
            
            // Log FormData contents
            console.log(`Making ${method} request to ${url}`);
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }
            
            try {
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Authorization': authService.getAuthHeader().Authorization
                    },
                    body: formData
                });
                
                // Check response status
                console.log('Response status:', response.status);
                
                // Get the response text
                const responseText = await response.text();
                console.log('Server response:', responseText);
                
                // Try to parse it as JSON if possible
                let data;
                try {
                    data = JSON.parse(responseText);
                    console.log('Parsed response data:', data);
                } catch (e) {
                    console.log('Response was not valid JSON');
                }
                
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}: ${responseText}`);
                }
                
                console.log('Tattoo saved successfully');
                this.saving = false;
                this.closeTattooForm();
                
                // Force refresh of tattoos data
                this.fetchTattoos();
            } catch (error) {
                console.error('Error saving tattoo:', error);
                alert('Failed to save tattoo. Check console for details.');
                this.saving = false;
            }
        },
        confirmDeleteTattoo(tattoo) {
            // Verify this tattoo belongs to the current artist
            if (tattoo.artist_id !== this.user.id) return;
            
            this.confirmModal = {
                show: true,
                title: 'Delete Tattoo',
                message: `Are you sure you want to delete "${tattoo.title}"?`,
                onConfirm: () => this.deleteTattoo(tattoo.tattoo_id)
            };
        },
        async deleteTattoo(tattooId) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/tattoos/${tattooId}`, {
                    method: 'DELETE',
                    headers: authService.getAuthHeader()
                });
                
                if (!response.ok) {
                    const responseText = await response.text();
                    throw new Error(`Failed to delete tattoo: ${responseText}`);
                }
                
                this.confirmModal.show = false;
                this.fetchTattoos();
            } catch (error) {
                console.error('Error deleting tattoo:', error);
                alert('Failed to delete tattoo. Please try again.');
                this.confirmModal.show = false;
            }
        },
        filterTattoos() {
            const search = this.tattooSearch.toLowerCase();
            this.filteredTattoos = this.tattoos.filter(tattoo => {
                // Only show this artist's tattoos
                if (tattoo.artist_id !== this.user.id) return false;
                
                // Apply search filter
                return tattoo.title.toLowerCase().includes(search) || 
                      (tattoo.description && tattoo.description.toLowerCase().includes(search));
            });
        },
        truncate(text, length) {
            if (!text) return '';
            return text.length > length ? text.substring(0, length) + '...' : text;
        }
    },
    mounted() {
        console.log("Vue app mounted");
        // First check authentication, then fetch data if auth is successful
        if (this.checkAuth()) {
            console.log("Auth check passed, fetching data");
            this.fetchTattoos();
        }
    }
});

app.mount('#admin-app');