// No need to re-declare createApp since it's already available from the Vue import
// Remove this line: const { createApp } = Vue;

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
                posterImage: "images/hero-img.png", // Make sure this file exists
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
            
            // API-related properties
            artists: [],
            tattoos: [], // Ensure this is initialized as an empty array
            apiBaseUrl: 'http://localhost:8888/Inkspire-fip/api/public', // Path to your Lumen API
            loading: {
                artists: false,
                tattoos: false
            },
            error: {
                artists: null,
                tattoos: null
            }
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
        
        // Improved API methods
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
                    // Debug the API response
                    console.log('API Response (artists):', data);
                    
                    // Get data from paginated response
                    const artistsData = data.data || [];
                    
                    // Force use the default images we know exist instead of trying to load from API
                    this.artists = artistsData.map(artist => ({
                        ...artist,
                        photo_path: "images/portfolio-1.jpg" // Use existing image that we know works
                    }));
                    
                    this.loading.artists = false;
                    
                    
                })
                .catch(error => {
                    console.error('Error fetching artists:', error);
                    this.error.artists = 'Failed to load artists. Please try again later.';
                    this.loading.artists = false;
                    // Ensure we set an empty array on error to prevent filter issues
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
                    // Debug the API response
                    console.log('API Response (tattoos):', data);
                    
                    // Get data from paginated response
                    const tattoosData = data.data || [];
                    
                    // Force use the default portfolio images we know exist
                    const portfolioFallbacks = [
                        "images/portfolio-1.jpg",
                        "images/portfolio-2.jpg",
                        "images/portfolio-3.jpg",
                        "images/portfolio-4.jpg",
                        "images/portfolio-5.jpg"
                    ];
                    
                    // Map each tattoo to a known working image
                    this.tattoos = tattoosData.map((tattoo, index) => ({
                        ...tattoo,
                        file_path: portfolioFallbacks[index % portfolioFallbacks.length]
                    }));
                    
                    this.loading.tattoos = false;
                    
                    // Update portfolio images if tattoos are available
                    if (this.tattoos.length > 0) {
                        const tattooImages = this.tattoos.map(tattoo => ({
                            src: tattoo.file_path,
                            alt: tattoo.title || 'Tattoo artwork'
                        }));
                        
                        // Only update if we have tattoo images
                        if (tattooImages.length > 0) {
                            this.portfolioImages = tattooImages;
                        }
                    }
                })
                .catch(error => {
                    console.error('Error fetching tattoos:', error);
                    this.error.tattoos = 'Failed to load portfolio. Please try again later.';
                    this.loading.tattoos = false;
                    // Ensure we set an empty array on error to prevent filter issues
                    this.tattoos = [];
                });
        }
    },
    mounted() {
        // Close menu on resize
        window.addEventListener('resize', () => {
            if (this.menuOpen && window.innerWidth > 768) {
                this.closeMenu();
            }
        });
        
        // Close menu on outside click
        document.addEventListener('click', (e) => {
            const menuBtn = document.querySelector('.menu-btn');
            const navMenu = document.querySelector('.nav-menu');
            if (this.menuOpen && 
                !navMenu.contains(e.target) && 
                !menuBtn.contains(e.target)) {
                this.closeMenu();
            }
        });

        // Feature heading animations
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
        
        // Fetch data from API
        this.fetchArtists();
        this.fetchTattoos();
    }
});

app.mount('#app');