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
            if (!this.user) return; // Make sure user is loaded before fetching
            
            this.loading.artists = true;
            this.error.artists = null;
            fetch(`${API_BASE_URL}/api/artists`, { headers: authService.getAuthHeader() })
                .then(response => {
                    if (!response.ok) throw new Error('Failed to fetch artists');
                    return response.json();
                })
                .then(data => {
                    console.log('Fetched artists:', data);
                    this.artists = data.data || [];
                    this.loading.artists = false;
                    if (this.user.role === 'artist') {
                        this.fetchTattoos(); // Ensure artist tattoos are filtered after artists load
                    }
                })
                .catch(error => {
                    console.error('Error fetching artists:', error);
                    this.error.artists = 'Failed to load artists. Please try again.';
                    this.loading.artists = false;
                });
        },
        fetchTattoos() {
            if (!this.user) return; // Make sure user is loaded before fetching
            
            this.loading.tattoos = true;
            this.error.tattoos = null;
            fetch(`${API_BASE_URL}/api/tattoos`, { headers: authService.getAuthHeader() })
                .then(response => {
                    if (!response.ok) throw new Error('Failed to fetch tattoos');
                    return response.json();
                })
                .then(data => {
                    console.log('Fetched tattoos:', data);
                    this.tattoos = data.data || [];
                    if (this.user.role === 'artist') {
                        this.filteredTattoos = this.tattoos.filter(t => t.artist_id === this.user.id);
                        this.recentTattoos = this.filteredTattoos
                            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                            .slice(0, 5);
                        this.tattooForm.artist_id = this.user.id; // Lock artist_id for artists
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
            this.editingArtist = artist;
            this.artistForm = { name: artist.name, bio: artist.bio || '', photo: null, photoPreview: artist.photo_path };
            this.showArtistForm = true;
        },
        closeArtistForm() {
            this.showArtistForm = false;
            this.editingArtist = null;
            this.resetArtistForm();
        },
        handleArtistPhotoUpload(e) {
            const file = e.target.files[0];
            if (!file) return;
            this.artistForm.photo = file;
            const reader = new FileReader();
            reader.onload = () => this.artistForm.photoPreview = reader.result;
            reader.readAsDataURL(file);
        },
        async saveArtist() {
            this.saving = true;
            const formData = new FormData();
            formData.append('name', this.artistForm.name);
            formData.append('bio', this.artistForm.bio);
            if (this.artistForm.photo) formData.append('photo', this.artistForm.photo);
            
            const url = this.editingArtist 
                ? `${API_BASE_URL}/api/artists/${this.editingArtist.artist_id}` 
                : `${API_BASE_URL}/api/artists`;
            
            const method = this.editingArtist ? 'PUT' : 'POST';
            
            try {
                const response = await fetch(url, {
                    method,
                    headers: authService.getAuthHeader(),
                    body: formData
                });
                if (!response.ok) throw new Error('Failed to save artist');
                this.saving = false;
                this.closeArtistForm();
                this.fetchArtists();
            } catch (error) {
                console.error('Error saving artist:', error);
                alert('Failed to save artist. Please try again.');
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
            if (this.tattooForm.image) formData.append('file_path', this.tattooForm.image);
            const url = this.editingTattoo ? `${API_BASE_URL}/api/tattoos/${this.editingTattoo.tattoo_id}` : `${API_BASE_URL}/api/tattoos`;
            const method = this.editingTattoo ? 'PUT' : 'POST';
            try {
                const response = await fetch(url, {
                    method,
                    headers: authService.getAuthHeader(),
                    body: formData
                });
                if (!response.ok) throw new Error('Failed to save tattoo');
                this.saving = false;
                this.closeTattooForm();
                this.fetchTattoos();
            } catch (error) {
                console.error('Error saving tattoo:', error);
                alert('Failed to save tattoo. Please try again.');
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
            const artist = this.artists.find(a => a.artist_id === artistId);
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