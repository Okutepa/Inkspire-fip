const app = Vue.createApp({
    data() {
        return {
            menuOpen: false,
            aboutSection: {
                heading: "ABOUT THE TEAM",
                tagline: "At INKSPIRED, you're not a client; you're the muse.",
                description: "INKSPIRED isn't just a brand, it's where your story gets its edge. We're rebels with needles, turning skin into art that screams you. Founded on the belief that every tattoo is a chapter, we craft ink that's as bold as you are. Your vibe, your vision—our crew makes it real.",
                images: [
                    { src: "images/about-img-1.png", alt: "INKSPIRE Team" },
                    { src: "images/about-img-2.png", alt: "Tattoo Artist Working" }
                ]
            },
            videoSection: {
                heading: "OUR WORK",
                posterImage: "images/hero-img.png",
                videoSrc: "videos/team-showcase.mp4",
                isPlaying: false
            },
            featureCards: [
                { title: "Team of skilled Tattoo artists", image: "images/feature-img.png" },
                { title: "High-quality inks and materials", image: "images/feature-img-2.png" },
                { title: "Individual approach to everyone", image: "images/feature-img-3.png" },
                { title: "Individual approach to everyone", image: "images/feature-img-3.png" },
                { title: "Individual approach to everyone", image: "images/feature-img-3.png" },
            ],
            portfolioImages: [
                { src: "images/portfolio-1.jpg", alt: "Tattoo Artwork 1" },
                { src: "images/portfolio-2.jpg", alt: "Tattoo Artwork 2" },
                { src: "images/portfolio-3.jpg", alt: "Tattoo Artwork 3" },
                { src: "images/portfolio-4.jpg", alt: "Tattoo Artwork 4" },
                { src: "images/portfolio-5.jpg", alt: "Tattoo Artwork 5" }
            ],
            currentIndex: 0,
            artists: [],
            tattoos: [],
            apiBaseUrl: 'http://localhost:8888/Inkspire-fip/api/public',
            loading: {
                artists: false,
                tattoos: false
            },
            error: {
                artists: null,
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
            map: null // To store the Leaflet map instance
        };
    },
    watch: {
        showMap(newVal) {
            console.log('showMap changed to:', newVal);
            if (newVal) {
                this.$nextTick(() => {
                    if (!this.map) {
                        console.log('Initializing map...');
                        this.initMap();
                    } else {
                        console.log('Map already initialized, refreshing size...');
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
        playVideo() {
            this.videoSection.isPlaying = true;
            this.$nextTick(() => {
                const video = document.getElementById('team-video');
                if (video) {
                    video.play();
                }
            });
        },
        resetVideo() {
            this.videoSection.isPlaying = false;
        },
        animateFeatureHeadings() {
            const topHeading = document.querySelector('.features-section .heading-top');
            const bottomHeading = document.querySelector('.features-section .heading-bottom');
            
            if (topHeading && bottomHeading) {
                if (window.innerWidth >= 1025) {
                    gsap.fromTo(topHeading, 
                        { x: 100, opacity: 0 }, 
                        { x: 0, opacity: 1, duration: 1, ease: "power2.out" }
                    );
                    gsap.fromTo(bottomHeading, 
                        { x: -100, opacity: 0 }, 
                        { x: 0, opacity: 1, duration: 1, ease: "power2.out", delay: 0.3 }
                    );
                } else {
                    gsap.fromTo(topHeading, 
                        { opacity: 0 }, 
                        { opacity: 1, duration: 1, ease: "power2.out" }
                    );
                    gsap.fromTo(bottomHeading, 
                        { opacity: 0 }, 
                        { opacity: 1, duration: 1, ease: "power2.out", delay: 0.3 }
                    );
                }
            }
        },
        nextSlide() {
            this.currentIndex = (this.currentIndex + 1) % this.portfolioImages.length;
        },
        prevSlide() {
            this.currentIndex = (this.currentIndex - 1 + this.portfolioImages.length) % this.portfolioImages.length;
        },
        fetchArtists() {
            this.loading.artists = true;
            this.error.artists = null;
            
            fetch(`${this.apiBaseUrl}/api/artists`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch artists: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('API Response (artists):', data);
                    const artistsData = data.data || [];
                    this.artists = artistsData.map(artist => ({
                        ...artist,
                        photo_path: artist.photo_path ? 
                            `${this.apiBaseUrl}/storage/artists/${artist.photo_path.split('/').pop()}` : 
                            "images/default-artist.jpg"
                    }));
                    this.loading.artists = false;
                })
                .catch(error => {
                    console.error('Error fetching artists:', error);
                    this.error.artists = 'Failed to load artists. Please try again later.';
                    this.loading.artists = false;
                    this.artists = [];
                });
        },
        fetchTattoos() {
            this.loading.tattoos = true;
            this.error.tattoos = null;
            
            fetch(`${this.apiBaseUrl}/api/tattoos`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch tattoos: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('API Response (tattoos):', data);
                    const tattoosData = data.data || [];
                    this.tattoos = tattoosData.map(tattoo => ({
                        ...tattoo,
                        file_path: tattoo.file_path ? 
                            `${this.apiBaseUrl}/storage/tattoos/${tattoo.file_path.split('/').pop()}` : 
                            "images/default-tattoo.jpg"
                    }));
                    this.loading.tattoos = false;
                    if (this.tattoos.length > 0) {
                        const tattooImages = this.tattoos.map(tattoo => ({
                            src: tattoo.file_path,
                            alt: tattoo.title || 'Tattoo artwork'
                        }));
                        if (tattooImages.length > 0) {
                            this.portfolioImages = tattooImages;
                        }
                    }
                })
                .catch(error => {
                    console.error('Error fetching tattoos:', error);
                    this.error.tattoos = 'Failed to load portfolio. Please try again later.';
                    this.loading.tattoos = false;
                    this.tattoos = [];
                });
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
        window.addEventListener('resize', () => {
            if (this.menuOpen && window.innerWidth > 768) {
                this.closeMenu();
            }
        });

        document.addEventListener('click', (e) => {
            const menuBtn = document.querySelector('.menu-btn');
            const navMenu = document.querySelector('.nav-menu');
            if (this.menuOpen && 
                !navMenu.contains(e.target) && 
                !menuBtn.contains(e.target)) {
                this.closeMenu();
            }
        });

        const featuresObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateFeatureHeadings();
                    featuresObserver.disconnect();
                }
            });
        }, { threshold: 0.2 });

        const featuresSection = document.querySelector('.features-section');
        if (featuresSection) {
            featuresObserver.observe(featuresSection);
        }

        this.fetchArtists();
        this.fetchTattoos();
    }
});

app.mount('#app');