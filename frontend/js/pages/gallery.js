const app = Vue.createApp({
    data() {
        return {
            menuOpen: false,
            tattoos: [],
            filteredTattoos: [],
            displayedTattoos: [], // Currently displayed tattoos
            apiBaseUrl: 'http://localhost:8888/Inkspire-fip/api/public',
            loading: {
                tattoos: true,
                more: false // For loading more tattoos
            },
            error: {
                tattoos: null
            },
            contactForm: {
                name: '',
                email: '',
                phone: '',
                message: ''
            },
            formSubmitting: false,
            formError: null,
            formSuccess: false,
            showMap: false,
            map: null, // To store the Leaflet map instance
            activeFilter: 'all',
            styles: [], // Will store unique tattoo styles
            itemsPerPage: 6, // Number of items to show initially and on each "load more"
            currentPage: 1, // Track how many pages we've loaded
            hasMore: false // Whether there are more items to load
        };
    },
    watch: {
        showMap(newVal) {
            if (newVal) {
                this.$nextTick(() => {
                    if (!this.map) {
                        this.initMap();
                    } else {
                        this.map.invalidateSize();
                    }
                });
            }
        }
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
        async fetchTattoos() {
            this.loading.tattoos = true;
            this.error.tattoos = null;
            const nocache = new Date().getTime();
            
            try {
                // First, fetch the first page to get pagination info
                const response = await fetch(`${this.apiBaseUrl}/api/tattoos?nocache=${nocache}`);
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch tattoos: ${response.status}`);
                }
                
                const firstPageData = await response.json();
                console.log('API Response (tattoos page 1):', firstPageData);
                
                // Initialize array with first page data
                let allTattoos = [...(firstPageData.data || [])];
                
                // Check if there are additional pages
                const lastPage = firstPageData.last_page || 1;
                console.log(`Total pages of tattoos: ${lastPage}`);
                
                // Fetch additional pages if needed
                if (lastPage > 1) {
                    for (let page = 2; page <= lastPage; page++) {
                        console.log(`Fetching tattoos page ${page} of ${lastPage}`);
                        const pageResponse = await fetch(`${this.apiBaseUrl}/api/tattoos?page=${page}&nocache=${nocache}`);
                        
                        if (!pageResponse.ok) {
                            throw new Error(`Failed to fetch tattoos page ${page}`);
                        }
                        
                        const pageData = await pageResponse.json();
                        console.log(`Fetched page ${page} with ${pageData.data?.length || 0} tattoos`);
                        
                        // Add this page's tattoos to our collection
                        if (pageData.data && pageData.data.length > 0) {
                            allTattoos = [...allTattoos, ...pageData.data];
                        }
                    }
                }
                
                console.log(`Total tattoos fetched across all pages: ${allTattoos.length}`);
                
                // Process all tattoos
                this.tattoos = allTattoos.map(tattoo => ({
                    ...tattoo,
                    file_path: tattoo.file_path ? 
                        `${this.apiBaseUrl}/storage/tattoos/${tattoo.file_path.split('/').pop()}?t=${nocache}` : 
                        "images/default-tattoo.jpg"
                }));
                
                // Extract all unique styles
                const stylesSet = new Set();
                this.tattoos.forEach(tattoo => {
                    if (tattoo.style && tattoo.style.trim() !== '') {
                        stylesSet.add(tattoo.style.trim());
                    }
                });
                this.styles = Array.from(stylesSet);
                console.log("Available styles:", this.styles);
                
                // Initialize filtered tattoos with all tattoos
                this.filteredTattoos = [...this.tattoos];
                
                // Load initial set of tattoos
                this.resetPagination();
                
                this.loading.tattoos = false;
                
                // Initialize animations after data is loaded
                this.$nextTick(() => {
                    this.initGalleryAnimations();
                });
                
            } catch (error) {
                console.error('Error fetching tattoos:', error);
                this.error.tattoos = 'Failed to load gallery. Please try again later.';
                this.loading.tattoos = false;
                this.tattoos = [];
            }
        },
        resetPagination() {
            this.currentPage = 1;
            this.displayedTattoos = this.filteredTattoos.slice(0, this.itemsPerPage);
            this.hasMore = this.filteredTattoos.length > this.itemsPerPage;
        },
        loadMoreTattoos() {
            this.loading.more = true;
            
            // Simulate network delay for smoother experience
            setTimeout(() => {
                const nextPage = this.currentPage + 1;
                const startIndex = this.currentPage * this.itemsPerPage;
                const endIndex = nextPage * this.itemsPerPage;
                const newItems = this.filteredTattoos.slice(startIndex, endIndex);
                
                this.displayedTattoos = [...this.displayedTattoos, ...newItems];
                this.currentPage = nextPage;
                this.hasMore = this.filteredTattoos.length > this.displayedTattoos.length;
                this.loading.more = false;
                
                // Animate the newly added items
                this.$nextTick(() => {
                    this.animateNewItems(startIndex);
                });
            }, 500);
        },
        filterGallery(style) {
            this.activeFilter = style;
            
            if (style === 'all') {
                this.filteredTattoos = [...this.tattoos];
            } else {
                this.filteredTattoos = this.tattoos.filter(tattoo => 
                    tattoo.style && tattoo.style.trim() === style
                );
            }
            
            // Reset pagination when filter changes
            this.resetPagination();
            
            // Re-run animations for the initial items
            this.$nextTick(() => {
                this.animateGalleryItems();
            });
        },
        initGalleryAnimations() {
            gsap.from('.heading h2', {
                opacity: 0,
                y: 30,
                duration: 0.8,
                ease: 'power2.out'
            });
            
            this.animateGalleryItems();
        },
        animateGalleryItems() {
            // Clear any existing animations
            gsap.killTweensOf('.gallery-item');
            
            // Animate all visible gallery items
            gsap.fromTo('.gallery-item',
                { opacity: 0, y: 30 },
                { 
                    opacity: 1, 
                    y: 0, 
                    stagger: 0.05, 
                    duration: 0.5, 
                    ease: 'power1.out' 
                }
            );
        },
        animateNewItems(startIndex) {
            // Target only the newly added items
            const newItems = document.querySelectorAll(`.gallery-item:nth-child(n+${startIndex + 1})`);
            
            gsap.fromTo(newItems,
                { opacity: 0, y: 30 },
                { 
                    opacity: 1, 
                    y: 0, 
                    stagger: 0.05, 
                    duration: 0.5, 
                    ease: 'power1.out' 
                }
            );
        },
        async submitContactForm() {
            if (this.formSubmitting) return;

            if (!this.contactForm.name || !this.contactForm.email || !this.contactForm.phone) {
                this.formError = 'Please fill in all required fields (Name, Email, Phone).';
                return;
            }

            this.formSubmitting = true;
            this.formError = null;
            this.formSuccess = false;

            try {
                const response = await fetch(`${this.apiBaseUrl}/api/contact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.contactForm)
                });

                if (!response.ok) {
                    throw new Error('Failed to submit form');
                }

                const data = await response.json();
                console.log('Form submitted successfully:', data);
                this.formSuccess = true;
                this.contactForm = { name: '', email: '', phone: '', message: '' };
            } catch (error) {
                console.error('Error submitting form:', error);
                this.formError = 'Failed to submit the form. Please try again later.';
            } finally {
                this.formSubmitting = false;
            }
        },
        toggleMap() {
            this.showMap = !this.showMap;
        },
        initMap() {
            const mapContainer = document.getElementById('map');
            if (!mapContainer) {
                console.error('Map container not found!');
                return;
            }

            console.log('Initializing map...');
            this.map = L.map('map', {
                center: [42.985, -81.245],
                zoom: 13,
                zoomControl: true
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.map);

            L.marker([42.985, -81.245]).addTo(this.map)
                .bindPopup('Inkspire Studio')
                .openPopup();

            this.map.invalidateSize();
            console.log('Map initialized and size adjusted');
        }
    },
    mounted() {
        // Close menu on window resize
        window.addEventListener('resize', () => {
            if (this.menuOpen && window.innerWidth > 768) {
                this.closeMenu();
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            const menuBtn = document.querySelector('.menu-btn');
            const navMenu = document.querySelector('.nav-menu');
            if (this.menuOpen && 
                !navMenu.contains(e.target) && 
                !menuBtn.contains(e.target)) {
                this.closeMenu();
            }
        });

        // Fetch tattoos data
        this.fetchTattoos();
    }
});

app.mount('#app');