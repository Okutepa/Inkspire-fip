const { createApp } = Vue;
const API_BASE_URL = 'http://localhost:8888/Inkspire-fip/api/public';

const app = createApp({
    data() {
        return {
            menuOpen: false,
            artistId: null,
            artist: null,
            artistWorks: [],
            loading: true,
            loadingWorks: true,
            error: null,
            errorWorks: null
        };
    },
    methods: {
        toggleMenu() {
            this.menuOpen = !this.menuOpen;
            document.body.style.overflow = this.menuOpen ? 'hidden' : 'auto';
        },
        closeMenu() {
            if (this.menuOpen) {
                this.menuOpen = false;
                document.body.style.overflow = 'auto';
            }
        },
        getArtistIdFromUrl() {
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('id');
            
            if (!id) {
                this.error = 'Artist ID not provided. Please select an artist from the home page.';
                this.loading = false;
                return null;
            }
            
            return id;
        },
        async fetchArtist() {
            try {
                const response = await fetch(`${API_BASE_URL}/api/artists/${this.artistId}`);
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch artist data (status: ${response.status})`);
                }
                
                const data = await response.json();
                
                // Process photo path
                if (data.photo_path) {
                    if (!data.photo_path.startsWith('http')) {
                        const filename = data.photo_path.split('/').pop();
                        data.photo_path = `${API_BASE_URL}/storage/artists/${filename}`;
                    }
                } else {
                    data.photo_path = "images/default-artist.jpg";
                }
                
                this.artist = data;
                console.log('Artist data loaded:', this.artist);
                
            } catch (error) {
                console.error('Error fetching artist:', error);
                this.error = `Failed to load artist information: ${error.message}`;
            } finally {
                this.loading = false;
            }
        },
        async fetchArtistWorks() {
            try {
                this.loadingWorks = true;
                
                // Using the getByArtist endpoint we implemented
                const response = await fetch(`${API_BASE_URL}/api/artists/${this.artistId}/tattoos`);
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch artist works (status: ${response.status})`);
                }
                
                const tattoos = await response.json();
                
                // Process tattoo image paths
                this.artistWorks = tattoos.map(tattoo => {
                    if (tattoo.file_path) {
                        if (!tattoo.file_path.startsWith('http')) {
                            const filename = tattoo.file_path.split('/').pop();
                            tattoo.file_path = `${API_BASE_URL}/storage/tattoos/${filename}`;
                        }
                    } else {
                        tattoo.file_path = "images/default-tattoo.jpg";
                    }
                    return tattoo;
                });
                
                console.log('Artist works loaded:', this.artistWorks);
                
            } catch (error) {
                console.error('Error fetching artist works:', error);
                this.errorWorks = `Failed to load artist works: ${error.message}`;
            } finally {
                this.loadingWorks = false;
            }
        },
        initAnimation() {
            // Add any custom animations here using GSAP if needed
            gsap.from('.artist-image', {
                opacity: 0,
                x: -50,
                duration: 1,
                ease: 'power3.out'
            });
            
            gsap.from('.artist-info', {
                opacity: 0,
                x: 50,
                duration: 1,
                delay: 0.3,
                ease: 'power3.out'
            });
            
            gsap.from('.work-item', {
                opacity: 0,
                y: 30,
                stagger: 0.1,
                duration: 0.8,
                delay: 0.5,
                ease: 'power2.out'
            });
        }
    },
    async mounted() {
        // Close menu on resize
        window.addEventListener('resize', () => {
            if (this.menuOpen && window.innerWidth > 768) {
                this.closeMenu();
            }
        });
        
        // Get artist ID from URL
        this.artistId = this.getArtistIdFromUrl();
        
        if (this.artistId) {
            // Fetch artist data
            await this.fetchArtist();
            
            // If artist data loaded successfully, fetch their works
            if (this.artist && !this.error) {
                await this.fetchArtistWorks();
                
                // Initialize animations after data is loaded
                this.$nextTick(() => {
                    this.initAnimation();
                });
            }
        }
    }
});

app.mount('#artist-bio-app');