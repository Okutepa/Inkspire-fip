import authService from '../services/auth.service.js';

const { createApp } = Vue;
const API_BASE_URL = 'http://localhost:8888/Inkspire-fip/api/public';

const app = createApp({
    data() {
        return {
            user: null,
            activePanel: 'dashboard',
            artists: [],
            tattoos: [],
            filteredTattoos: [],
            recentTattoos: [],
            loading: { artists: false, tattoos: false },
            error: { artists: null, tattoos: null },
            saving: false,
            showArtistForm: false,
            editingArtist: null,
            artistForm: { name: '', bio: '', photo: null, photoPreview: null },
            showTattooForm: false,
            editingTattoo: null,
            tattooForm: { title: '', description: '', artist_id: '', image: null, imagePreview: null, featured: false },
            tattooSearch: '',
            tattooArtistFilter: 'all',
            confirmModal: { show: false, title: '', message: '', onConfirm: null }
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
            
            if (!user || (user.role !== 'admin' && user.role !== 'artist')) {
                console.log("User has invalid role, redirecting to home page");
                alert('You do not have permission to access this page');
                window.location.href = '../index.html';
                return false;
            }
            
            this.user = user;
            console.log("User authenticated successfully:", this.user);
            return true;
        },
        async logout() {
            await authService.logout();
            window.location.href = '../login.html';
        },
        fetchArtists() {
            if (!this.user) return;
        
            this.loading.artists = true;
            this.error.artists = null;
            
            // Add a timestamp to avoid browser caching
            const nocache = new Date().getTime();
            fetch(`${API_BASE_URL}/api/artists?nocache=${nocache}`, { 
                headers: authService.getAuthHeader(),
                // Using GET method but ensuring fresh data with nocache parameter
                method: 'GET'
            })
                .then(response => {
                    if (!response.ok) throw new Error('Failed to fetch artists');
                    return response.json();
                })
                .then(data => {
                    console.log('Fetched artists:', data);
                    const processedArtists = (data.data || []).map(artist => {
                        if (artist.photo_path) {
                            // Add a cache-busting parameter to image URLs
                            if (!artist.photo_path.startsWith('http')) {
                                const filename = artist.photo_path.split('/').pop();
                                artist.photo_path = `${API_BASE_URL}/storage/artists/${filename}?t=${nocache}`;
                            } else {
                                // If it's already a full URL, add cache parameter
                                artist.photo_path = `${artist.photo_path}?t=${nocache}`;
                            }
                        } else {
                            artist.photo_path = "/images/default-artist.jpg"; // Changed to absolute path
                        }
                        return artist;
                    });
                    this.artists = processedArtists;
                    console.log('Processed artists with fixed photo paths:', this.artists);
                    this.loading.artists = false;
                    if (this.user.role === 'artist') {
                        this.fetchTattoos();
                    }
                })
                .catch(error => {
                    console.error('Error fetching artists:', error);
                    this.error.artists = 'Failed to load artists. Please try again.';
                    this.loading.artists = false;
                });
        },
        fetchTattoos() {
            if (!this.user) return;
        
            this.loading.tattoos = true;
            this.error.tattoos = null;
            fetch(`${API_BASE_URL}/api/tattoos`, { headers: authService.getAuthHeader() })
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
                            `${API_BASE_URL}/storage/tattoos/${tattoo.file_path.split('/').pop()}` :
                            "/images/default-tattoo.jpg"
                    }));
                    if (this.user.role === 'artist') {
                        this.filteredTattoos = this.tattoos.filter(t => t.artist_id === this.user.id);
                        this.recentTattoos = this.filteredTattoos
                            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                            .slice(0, 5);
                        this.tattooForm.artist_id = this.user.id;
                    } else {
                        this.filteredTattoos = [...this.tattoos];
                        this.recentTattoos = [...this.tattoos]
                            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                            .slice(0, 5);
                    }
                    this.loading.tattoos = false;
                })
                .catch(error => {
                    console.error('Error fetching tattoos:', error);
                    this.error.tattoos = 'Failed to load tattoo portfolio. Please try again.';
                    this.loading.tattoos = false;
                });
        },
        resetArtistForm() {
            this.artistForm = { name: '', bio: '', photo: null, photoPreview: null };
        },
        editArtist(artist) {
            console.log('Editing artist:', artist);
            
            // Make a deep copy to prevent reference issues
            this.editingArtist = JSON.parse(JSON.stringify(artist));
            
            // Ensure we have the correct data, with fallbacks for nulls
            this.artistForm = { 
                name: artist.name || '', 
                bio: artist.bio || '', 
                photo: null, // No new photo yet
                photoPreview: artist.photo_path || null // Keep existing photo
            };
            
            console.log('Artist form populated:', this.artistForm);
            this.showArtistForm = true;
        },
        closeArtistForm() {
            this.showArtistForm = false;
            this.editingArtist = null;
            this.resetArtistForm();
        },
        handleArtistPhotoUpload(event) {
            const file = event.target.files[0];
            console.log('Selected artist photo:', file);
            
            if (file) {
                // Validate file type
                const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!validTypes.includes(file.type)) {
                    alert('Please select a valid image file (JPEG, PNG, or GIF)');
                    event.target.value = ''; // Clear the input
                    return;
                }
                
                // Store the file object for later upload
                this.artistForm.photo = file;
                
                // Create a preview URL
                this.artistForm.photoPreview = URL.createObjectURL(file);
                console.log('Created preview URL:', this.artistForm.photoPreview);
            }
        },
        async saveArtist() {
            console.log('Saving artist with form data:', this.artistForm);
            if (!this.artistForm.name.trim()) {
                alert('Artist name is required');
                return;
            }
            this.saving = true;
            const formData = new FormData();
            formData.append('name', this.artistForm.name.trim());
            formData.append('bio', this.artistForm.bio.trim());
            
            // Include photo if a new one was selected
            if (this.artistForm.photo) {
                formData.append('photo', this.artistForm.photo);
                console.log('Uploading new photo:', this.artistForm.photo.name);
            }
            
            // If we're editing, use method spoofing
            const url = this.editingArtist 
                ? `${API_BASE_URL}/api/artists/${this.editingArtist.artist_id}` 
                : `${API_BASE_URL}/api/artists`;
            
            // For editing, we'll use POST with _method=PUT to avoid issues with FormData and PUT requests
            const method = this.editingArtist ? 'POST' : 'POST';
            if (this.editingArtist) {
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
                        // Note: Don't set Content-Type with FormData as the browser will set it with the boundary
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
                
                console.log('Artist saved successfully');
                this.saving = false;
                this.closeArtistForm();
                
                // Force refresh of artists data
                this.fetchArtists();
            } catch (error) {
                console.error('Error saving artist:', error);
                alert('Failed to save artist. Check console for details.');
                this.saving = false;
            }
        },
        confirmDeleteArtist(artist) {
            this.confirmModal = {
                show: true,
                title: 'Delete Artist',
                message: `Are you sure you want to delete ${artist.name}? This will also delete all their tattoos.`,
                onConfirm: () => this.deleteArtist(artist.artist_id)
            };
        },
        async deleteArtist(artistId) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/artists/${artistId}`, {
                    method: 'DELETE',
                    headers: authService.getAuthHeader()
                });
                if (!response.ok) throw new Error('Failed to delete artist');
                this.confirmModal.show = false;
                this.fetchArtists();
                this.fetchTattoos();
            } catch (error) {
                console.error('Error deleting artist:', error);
                alert('Failed to delete artist. Please try again.');
                this.confirmModal.show = false;
            }
        },
        resetTattooForm() {
            this.tattooForm = { 
                title: '', 
                description: '', 
                artist_id: this.user && this.user.role === 'artist' ? this.user.id : '', 
                image: null, 
                imagePreview: null, 
                featured: false 
            };
        },
        editTattoo(tattoo) {
            if (this.user.role === 'artist' && tattoo.artist_id !== this.user.id) return;
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
            this.tattooForm.image = file;
            const reader = new FileReader();
            reader.onload = () => this.tattooForm.imagePreview = reader.result;
            reader.readAsDataURL(file);
        },
        async saveTattoo() {
            this.saving = true;
            const formData = new FormData();
            formData.append('title', this.tattooForm.title);
            formData.append('description', this.tattooForm.description);
            formData.append('artist_id', this.tattooForm.artist_id);
            formData.append('featured', this.tattooForm.featured ? '1' : '0');
            
            // Include image or existing file_path
            if (this.tattooForm.image) {
                formData.append('file_path', this.tattooForm.image);
                console.log('Uploading new image:', this.tattooForm.image.name);
            } else if (this.editingTattoo && this.editingTattoo.file_path) {
                formData.append('file_path', this.editingTattoo.file_path); // Keep existing path
            }
            
            const url = this.editingTattoo 
                ? `${API_BASE_URL}/api/tattoos/${this.editingTattoo.tattoo_id}` 
                : `${API_BASE_URL}/api/tattoos`;
            const method = this.editingTattoo ? 'PUT' : 'POST';
            
            // Log FormData contents
            console.log(`Making ${method} request to ${url}`);
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }
            
            try {
                const response = await fetch(url, {
                    method,
                    headers: authService.getAuthHeader(),
                    body: formData
                });
                
                const responseText = await response.text();
                console.log('Server response:', response.status, responseText);
                
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}: ${responseText}`);
                }
                
                this.saving = false;
                this.closeTattooForm();
                this.fetchTattoos();
            } catch (error) {
                console.error('Error saving tattoo:', error);
                alert('Failed to save tattoo. Check console for details.');
                this.saving = false;
            }
        },
        confirmDeleteTattoo(tattoo) {
            if (this.user.role === 'artist' && tattoo.artist_id !== this.user.id) return;
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
                if (!response.ok) throw new Error('Failed to delete tattoo');
                this.confirmModal.show = false;
                this.fetchTattoos();
            } catch (error) {
                console.error('Error deleting tattoo:', error);
                alert('Failed to delete tattoo. Please try again.');
                this.confirmModal.show = false;
            }
        },
        getArtistName(artistId) {
            if (!artistId) return 'Unknown Artist';
            
            // Convert to number if it's a string
            const id = typeof artistId === 'string' ? parseInt(artistId, 10) : artistId;
            
            const artist = this.artists.find(a => a.artist_id === id);
            return artist ? artist.name : 'Unknown Artist';
        },
        truncate(text, length) {
            if (!text) return '';
            return text.length > length ? text.substring(0, length) + '...' : text;
        },
        filterTattoos() {
            const search = this.tattooSearch.toLowerCase();
            const artistFilter = this.tattooArtistFilter;
            this.filteredTattoos = this.tattoos.filter(tattoo => {
                const matchesSearch = tattoo.title.toLowerCase().includes(search) || 
                                     (tattoo.description && tattoo.description.toLowerCase().includes(search));
                const matchesArtist = this.user.role === 'artist' ? 
                    tattoo.artist_id === this.user.id : 
                    (artistFilter === 'all' || tattoo.artist_id === parseInt(artistFilter));
                return matchesSearch && matchesArtist;
            });
        }
    },
    mounted() {
        console.log("Vue app mounted");
        // First check authentication, then fetch data if auth is successful
        if (this.checkAuth()) {
            console.log("Auth check passed, fetching data");
            this.fetchArtists();
            if (this.user && this.user.role === 'admin') {
                this.fetchTattoos();
            }
        }
    }
});

app.mount('#admin-app');