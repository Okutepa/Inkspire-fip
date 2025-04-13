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
            loading: { 
                tattoos: false, 
                profile: false
            },
            error: { 
                tattoos: null, 
                profile: null
            },
            saving: false,
            showTattooForm: false,
            editingTattoo: null,
            tattooForm: { 
                title: '', 
                description: '', 
                style: '',
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
            },
            profileForm: {
                name: '',
                bio: '',
                experience: 0,
                specialties: [],
                photo: null,
                photoPreview: null,
                social: {
                    instagram: '',
                    twitter: '',
                    facebook: ''
                }
            },
            newSpecialty: '',
            savingProfile: false,
            profileUpdated: false,
            notification: {
                show: false,
                type: 'success',
                message: '',
                timeout: null
            },
            styleFilter: '',
            profileCompletionItems: {
                name: { label: 'Name', completed: false },
                photo: { label: 'Profile Photo', completed: false },
                bio: { label: 'Bio', completed: false },
                experience: { label: 'Experience', completed: false },
                specialties: { label: 'Specialties', completed: false },
                social: { label: 'Social Media', completed: false }
            }
        };
    },
    computed: {
        profileCompletionPercentage() {
            this.updateProfileCompletionStatus();
            const total = Object.keys(this.profileCompletionItems).length;
            const completed = Object.values(this.profileCompletionItems).filter(item => item.completed).length;
            return Math.round((completed / total) * 100);
        },
        incompleteProfileItems() {
            return Object.entries(this.profileCompletionItems)
                .filter(([key, item]) => !item.completed)
                .map(([key, item]) => item.label);
        }
    },
    methods: {
        updateProfileCompletionStatus() {
            if (this.user) {
                this.profileCompletionItems.name.completed = Boolean(this.user.name && this.user.name.trim().length > 0);
                this.profileCompletionItems.photo.completed = Boolean(this.user.photo_path && !this.user.photo_path.includes('default-artist.jpg'));
                this.profileCompletionItems.bio.completed = Boolean(this.user.bio && this.user.bio.trim().length >= 50);
                this.profileCompletionItems.experience.completed = Boolean(this.user.experience && this.user.experience > 0);
                const specialtiesArray = Array.isArray(this.user.specialties) ? this.user.specialties : [];
                this.profileCompletionItems.specialties.completed = specialtiesArray.length >= 2;
                const social = this.user.social || {};
                this.profileCompletionItems.social.completed = Boolean(
                    (social.instagram && social.instagram.trim()) || 
                    (social.twitter && social.twitter.trim()) || 
                    (social.facebook && social.facebook.trim())
                );
            }
        },
        checkAuth() {
            console.log("Checking authentication...");
            if (!authService.isLoggedIn()) {
                console.log("User not logged in, redirecting to login page");
                window.location.href = '../login.html';
                return false;
            }
            
            const user = authService.getUser();
            console.log("User from localStorage:", user);
            console.log("User ID from localStorage:", user ? user.id : 'undefined', "Type:", user ? typeof user.id : 'undefined');
            
            if (!user || user.role !== 'artist') {
                console.log("User has invalid role, redirecting to home page");
                alert('You do not have permission to access this page');
                window.location.href = '../index.html';
                return false;
            }
            
            if (!user.id && !user.user_id) {
                console.error("User ID is missing from localStorage:", user);
                alert('Invalid user data. Please log in again.');
                authService.logout();
                window.location.href = '../login.html';
                return false;
            }
            
            user.id = user.id || user.user_id;
            this.user = user;
            console.log("Artist authenticated successfully:", this.user);
            console.log("Assigned user ID:", this.user.id);
            return true;
        },
        async logout() {
            await authService.logout();
            window.location.href = '../login.html';
        },
        loadProfileData() {
            this.loading.profile = true;
            this.error.profile = null;
            const apiUrl = `${API_BASE_URL}/api/artist/me`;
            
            fetch(apiUrl, { 
                headers: authService.getAuthHeader(),
                method: 'GET'
            })
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 404) {
                            this.error.profile = 'Artist profile not found. Please contact an admin to create your profile.';
                            return null;
                        }
                        throw new Error('Failed to load profile data');
                    }
                    return response.json();
                })
                .then(data => {
                    this.loading.profile = false;
                    
                    if (data) {
                        console.log('Fetched profile data:', data);
                        console.log('Fetched artist ID:', data.id || data.artist_id);
                        const nocache = new Date().getTime();
                        let photoPath = data.photo_path;
                        if (photoPath && !photoPath.startsWith('http')) {
                            const filename = photoPath.split('/').pop();
                            photoPath = `${API_BASE_URL}/storage/artists/${filename}?t=${nocache}`;
                        } else if (photoPath) {
                            photoPath = `${photoPath}?t=${nocache}`;
                        }
                        
                        const updatedUser = {
                            ...this.user,
                            ...data,
                            id: data.id || data.artist_id, // Ensure id is set
                            photo_path: photoPath || this.user.photo_path
                        };
                        this.user = updatedUser;
                        console.log("Updated user after API:", this.user);
                        console.log("Updated user ID:", this.user.id);
                        
                        try {
                            this.user.specialties = data.specialties && typeof data.specialties === 'string' 
                                ? JSON.parse(data.specialties) 
                                : data.specialties || [];
                        } catch (e) {
                            console.error('Error parsing specialties:', e);
                            this.user.specialties = [];
                        }
                        
                        try {
                            this.user.social = data.social && typeof data.social === 'string' 
                                ? JSON.parse(data.social) 
                                : data.social || { instagram: '', twitter: '', facebook: '' };
                        } catch (e) {
                            console.error('Error parsing social data:', e);
                            this.user.social = { instagram: '', twitter: '', facebook: '' };
                        }
                        
                        authService.updateUserData(this.user);
                        this.profileForm.name = this.user.name || '';
                        this.profileForm.bio = this.user.bio || '';
                        this.profileForm.experience = this.user.experience || 0;
                        this.profileForm.specialties = this.user.specialties || [];
                        this.profileForm.social = this.user.social || {
                            instagram: '',
                            twitter: '',
                            facebook: ''
                        };
                        this.updateProfileCompletionStatus();
                    } else {
                        this.profileForm.name = this.user.name || '';
                        this.profileForm.bio = '';
                        this.profileForm.experience = 0;
                        this.profileForm.specialties = [];
                        this.profileForm.social = { instagram: '', twitter: '', facebook: '' };
                    }
                })
                .catch(err => {
                    console.error('Error loading profile:', err);
                    this.loading.profile = false;
                    if (!this.error.profile) {
                        this.error.profile = 'Failed to load profile data. Please try again.';
                    }
                    this.profileForm.name = this.user.name || '';
                    this.profileForm.bio = this.user.bio || '';
                    this.profileForm.experience = this.user.experience || 0;
                    this.profileForm.specialties = this.user.specialties || [];
                    this.profileForm.social = this.user.social || {
                        instagram: '',
                        twitter: '',
                        facebook: ''
                    };
                });
        },
        handleProfilePhotoUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                this.showNotification('error', 'Please select a valid image file (JPEG, PNG, or GIF)');
                event.target.value = '';
                return;
            }
            this.profileForm.photo = file;
            const reader = new FileReader();
            reader.onload = e => this.profileForm.photoPreview = e.target.result;
            reader.readAsDataURL(file);
        },
        addSpecialty() {
            if (!this.newSpecialty.trim()) return;
            if (!this.profileForm.specialties.includes(this.newSpecialty.trim())) {
                this.profileForm.specialties.push(this.newSpecialty.trim());
            }
            this.newSpecialty = '';
        },
        removeSpecialty(index) {
            this.profileForm.specialties.splice(index, 1);
        },
        validateProfileForm() {
            let errors = [];
            if (!this.profileForm.name.trim()) {
                errors.push('Name is required');
            }
            if (!this.profileForm.bio.trim()) {
                errors.push('Bio is required');
            } else if (this.profileForm.bio.trim().length < 50) {
                errors.push('Bio should be at least 50 characters long');
            }
            if (!this.profileForm.experience) {
                errors.push('Years of experience is required');
            }
            if (this.profileForm.specialties.length < 2) {
                errors.push('Please add at least 2 specialties');
            }
            const hasSocial = Boolean(
                (this.profileForm.social.instagram && this.profileForm.social.instagram.trim()) || 
                (this.profileForm.social.twitter && this.profileForm.social.twitter.trim()) || 
                (this.profileForm.social.facebook && this.profileForm.social.facebook.trim())
            );
            if (!hasSocial) {
                errors.push('Please add at least one social media profile');
            }
            return errors;
        },
        async saveProfile() {
            console.log('Saving profile with form data:', this.profileForm);
            const validationErrors = this.validateProfileForm();
            if (validationErrors.length > 0) {
                this.showNotification('error', validationErrors[0]);
                return;
            }
            this.savingProfile = true;
            const formData = new FormData();
            formData.append('name', this.profileForm.name.trim());
            formData.append('bio', this.profileForm.bio.trim());
            formData.append('experience', this.profileForm.experience || 0);
            formData.append('specialties', JSON.stringify(this.profileForm.specialties));
            formData.append('social', JSON.stringify(this.profileForm.social));
            if (this.profileForm.photo) {
                formData.append('photo', this.profileForm.photo);
                console.log('Uploading new photo:', this.profileForm.photo.name);
            }
            const apiUrl = `${API_BASE_URL}/api/artist/me`;
            formData.append('_method', 'PUT');
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': authService.getAuthHeader().Authorization
                    },
                    body: formData
                });
                const responseText = await response.text();
                console.log('Server response:', responseText);
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (e) {
                    console.log('Response was not valid JSON');
                }
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}: ${responseText}`);
                }
                const updatedUser = { 
                    ...this.user,
                    name: this.profileForm.name,
                    bio: this.profileForm.bio,
                    experience: this.profileForm.experience,
                    specialties: this.profileForm.specialties,
                    social: this.profileForm.social
                };
                if (this.profileForm.photoPreview && this.profileForm.photo) {
                    updatedUser.photo_path = this.profileForm.photoPreview;
                }
                this.user = updatedUser;
                authService.updateUserData(updatedUser);
                this.updateProfileCompletionStatus();
                this.savingProfile = false;
                this.profileUpdated = true;
                this.showNotification('success', 'Profile updated successfully');
                if (this.profileCompletionPercentage === 100) {
                    setTimeout(() => {
                        this.showNotification('success', '🎉 Congratulations! Your profile is now 100% complete.');
                    }, 2000);
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                this.showNotification('error', 'Failed to update profile. Please try again.');
                this.savingProfile = false;
            }
        },
        showNotification(type, message) {
            if (this.notification.timeout) clearTimeout(this.notification.timeout);
            this.notification = {
                show: true,
                type: type,
                message: message,
                timeout: setTimeout(() => this.notification.show = false, 5000)
            };
        },
        fetchTattoos() {
            if (!this.user) return;
            this.loading.tattoos = true;
            this.error.tattoos = null;
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
                    this.tattoos = tattoosData.map(tattoo => ({
                        ...tattoo,
                        file_path: tattoo.file_path ?
                            `${API_BASE_URL}/storage/tattoos/${tattoo.file_path.split('/').pop()}?t=${nocache}` :
                            "/images/default-tattoo.jpg"
                    }));
                    this.filteredTattoos = this.tattoos.filter(t => t.artist_id === this.user.id);
                    this.recentTattoos = [...this.filteredTattoos]
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .slice(0, 5);
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
                style: '',
                image: null, 
                imagePreview: null, 
                featured: false 
            };
        },
        editTattoo(tattoo) {
            if (tattoo.artist_id !== this.user.id) return;
            this.editingTattoo = tattoo;
            this.tattooForm = { 
                title: tattoo.title, 
                description: tattoo.description || '', 
                style: tattoo.style || '',
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
            const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                this.showNotification('error', 'Please select a valid image file (JPEG, PNG, or GIF)');
                e.target.value = '';
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
                this.showNotification('error', 'Tattoo title is required');
                return;
            }
            this.saving = true;
            const formData = new FormData();
            formData.append('title', this.tattooForm.title.trim());
            formData.append('description', this.tattooForm.description.trim());
            const artistId = parseInt(this.user.id, 10);
            if (isNaN(artistId)) {
                console.error('Invalid artist_id:', this.user.id);
                this.showNotification('error', 'Invalid artist ID. Please contact support.');
                this.saving = false;
                return;
            }
            formData.append('artist_id', artistId);
            formData.append('style', this.tattooForm.style || '');
            formData.append('featured', this.tattooForm.featured ? '1' : '0');
            if (this.tattooForm.image) {
                formData.append('file_path', this.tattooForm.image);
            }
            const url = this.editingTattoo 
                ? `${API_BASE_URL}/api/tattoos/${this.editingTattoo.tattoo_id}` 
                : `${API_BASE_URL}/api/tattoos`;
            const method = this.editingTattoo ? 'POST' : 'POST';
            if (this.editingTattoo) formData.append('_method', 'PUT');
            try {
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Authorization': authService.getAuthHeader().Authorization
                    },
                    body: formData
                });
                const responseText = await response.text();
                console.log('Server response:', responseText);
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}: ${responseText}`);
                }
                this.saving = false;
                this.closeTattooForm();
                this.showNotification('success', 'Tattoo saved successfully');
                this.fetchTattoos();
            } catch (error) {
                console.error('Error saving tattoo:', error);
                this.showNotification('error', 'Failed to save tattoo. Check console for details.');
                this.saving = false;
            }
        },
        confirmDeleteTattoo(tattoo) {
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
                this.showNotification('success', 'Tattoo deleted successfully');
                this.fetchTattoos();
            } catch (error) {
                console.error('Error deleting tattoo:', error);
                this.showNotification('error', 'Failed to delete tattoo. Please try again.');
                this.confirmModal.show = false;
            }
        },
        filterTattoos() {
            const search = this.tattooSearch.toLowerCase();
            const styleFilter = this.styleFilter;
            this.filteredTattoos = this.tattoos.filter(tattoo => {
                if (tattoo.artist_id !== this.user.id) return false;
                const matchesSearch = tattoo.title.toLowerCase().includes(search) || 
                                     (tattoo.description && tattoo.description.toLowerCase().includes(search));
                const matchesStyle = !styleFilter || tattoo.style === styleFilter;
                return matchesSearch && matchesStyle;
            });
        },
        truncate(text, length) {
            if (!text) return '';
            return text.length > length ? text.substring(0, length) + '...' : text;
        }
    },
    mounted() {
        console.log("Vue app mounted");
        if (this.checkAuth()) {
            console.log("Auth check passed, fetching data");
            this.loadProfileData();
            this.fetchTattoos();
        }
    }
});

app.mount('#admin-app');