const app = Vue.createApp({
    data() {
        return {
            menuOpen: false,
            aboutSection: {
                heading: "ABOUT THE TEAM",
                tagline: "At INKSPIRED, you're not a client; you're the muse.",
                description: "INKSPIRED isn't just a brand, it's where your story gets its edge. We're rebels with needles, turning skin into art that screams you. Founded on the belief that every tattoo is a chapter, we craft ink that's as bold as you are. Your vibe, your vision—our crew makes it real.",
                images: [
                    { src: "images/about-1.jpg", alt: "INKSPIRE Team" },
                    { src: "images/about-2.jpg", alt: "Tattoo Artist Working" }
                ]
            },
            videoSection: {
                heading: "OUR WORK",
                posterImage: "images/hero-img.png",
                videoSrc: "video/inkspired.mp4",
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
            map: null
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
                if (video) video.play();
                ScrollTrigger.refresh();
            });
        },
        resetVideo() {
            this.videoSection.isPlaying = false;
            ScrollTrigger.refresh();
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
                    if (!response.ok) throw new Error(`Failed to fetch artists: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    this.artists = (data.data || []).map(artist => ({
                        ...artist,
                        photo_path: artist.photo_path ? `${this.apiBaseUrl}/storage/artists/${artist.photo_path.split('/').pop()}` : "images/default-artist.jpg"
                    }));
                    this.loading.artists = false;
                    this.$nextTick(() => this.setupArtistsAnimations());
                })
                .catch(error => {
                    console.error('Error fetching artists:', error);
                    this.error.artists = 'Failed to load artists. Please try again later.';
                    this.loading.artists = false;
                    this.artists = [];
                });
        },
        async fetchTattoos() {
            this.loading.tattoos = true;
            this.error.tattoos = null;
            const nocache = new Date().getTime();
            try {
                const response = await fetch(`${this.apiBaseUrl}/api/tattoos?nocache=${nocache}`);
                if (!response.ok) throw new Error(`Failed to fetch tattoos: ${response.status}`);
                const firstPageData = await response.json();
                let allTattoos = [...(firstPageData.data || [])];
                const lastPage = firstPageData.last_page || 1;
                if (lastPage > 1) {
                    for (let page = 2; page <= lastPage; page++) {
                        const pageResponse = await fetch(`${this.apiBaseUrl}/api/tattoos?page=${page}&nocache=${nocache}`);
                        if (!pageResponse.ok) throw new Error(`Failed to fetch tattoos page ${page}`);
                        const pageData = await pageResponse.json();
                        if (pageData.data && pageData.data.length > 0) allTattoos = [...allTattoos, ...pageData.data];
                    }
                }
                this.tattoos = allTattoos.map(tattoo => ({
                    ...tattoo,
                    file_path: tattoo.file_path ? `${this.apiBaseUrl}/storage/tattoos/${tattoo.file_path.split('/').pop()}?t=${nocache}` : "images/default-tattoo.jpg"
                }));
                this.loading.tattoos = false;
                if (this.tattoos.length > 0) {
                    let featuredTattoos = this.tattoos.filter(tattoo => tattoo.featured);
                    if (featuredTattoos.length === 0) featuredTattoos = this.tattoos;
                    this.portfolioImages = featuredTattoos.map(tattoo => ({
                        src: tattoo.file_path,
                        alt: tattoo.title || 'Tattoo artwork'
                    }));
                }
                this.$nextTick(() => this.setupPortfolioAnimations());
            } catch (error) {
                console.error('Error fetching tattoos:', error);
                this.error.tattoos = 'Failed to load portfolio. Please try again later.';
                this.loading.tattoos = false;
                this.tattoos = [];
            }
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
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.contactForm)
                });
                if (!response.ok) throw new Error('Failed to submit form');
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
            this.$nextTick(() => {
                if (this.showMap && !this.map) this.initMap();
                else if (this.map) this.map.invalidateSize();
                ScrollTrigger.refresh();
            });
        },
        initMap() {
            const mapContainer = document.getElementById('map');
            if (!mapContainer) return console.error('Map container not found!');
            this.map = L.map('map', { center: [42.985, -81.245], zoom: 13, zoomControl: true });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.map);
            L.marker([42.985, -81.245]).addTo(this.map).bindPopup('Inkspire Studio').openPopup();
            this.map.invalidateSize();
        },
        setupPortfolioAnimations() {
            const portfolioSection = document.querySelector('.portfolio-section');
            const portfolioHeading = document.querySelector('.portfolio-section .heading h2');
            if (typeof SplitText !== 'undefined') {
                const portfolioSplit = new SplitText(portfolioHeading, { type: "lines", linesClass: "lineChild" });
                gsap.from(portfolioSplit.lines, {
                    yPercent: 100,
                    opacity: 0,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: portfolioSection,
                        start: "top 80%",
                        toggleActions: "play reverse none none"
                    }
                });
            } else {
                gsap.from(portfolioHeading, {
                    y: 50,
                    opacity: 0,
                    duration: 0.8,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: portfolioSection,
                        start: "top 80%",
                        toggleActions: "play reverse none none"
                    }
                });
            }
            document.querySelectorAll('.carousel-image img').forEach(img => {
                img.addEventListener('mouseenter', () => gsap.to(img, { scale: 1.05, duration: 0.3 }));
                img.addEventListener('mouseleave', () => gsap.to(img, { scale: 1, duration: 0.3 }));
            });
        },
        setupArtistsAnimations() {
            const artistsSection = document.querySelector('.artists-section');
            const artistsHeading = document.querySelector('.artists-section .heading h2');
            if (typeof SplitText !== 'undefined') {
                const artistsSplit = new SplitText(artistsHeading, { type: "lines", linesClass: "lineChild" });
                gsap.from(artistsSplit.lines, {
                    yPercent: 100,
                    opacity: 0,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: artistsSection,
                        start: "top 80%",
                        toggleActions: "play reverse none none"
                    }
                });
            } else {
                gsap.from(artistsHeading, {
                    y: 50,
                    opacity: 0,
                    duration: 0.8,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: artistsSection,
                        start: "top 80%",
                        toggleActions: "play reverse none none"
                    }
                });
            }
            gsap.from(".artist-profile", {
                opacity: 0,
                y: 50,
                duration: 1,
                stagger: 0.2,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: artistsSection,
                    start: "top 80%",
                    end: "bottom 60%",
                    scrub: true
                }
            });
        }
    },
    mounted() {
        // Register GSAP Plugins
        gsap.registerPlugin(ScrollTrigger);

        // Initialize Lenis for smooth scrolling
        let lenis = null;
        if (typeof window.Lenis === 'undefined') {
            console.warn('Lenis is not available. Make sure it is properly loaded.');
        } else {
            lenis = new window.Lenis({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                direction: 'vertical',
                gestureDirection: 'vertical',
                smooth: true,
                mouseMultiplier: 1,
                smoothTouch: false,
                touchMultiplier: 2,
                infinite: false,
            });

            // Integrate Lenis with GSAP's ticker
            gsap.ticker.add((time) => {
                lenis.raf(time * 1000);
            });

            // Update ScrollTrigger on Lenis scroll
            lenis.on('scroll', ScrollTrigger.update);

            // Configure ScrollTrigger to use Lenis as the scroller
            ScrollTrigger.scrollerProxy(document.body, {
                scrollTop(value) {
                    if (arguments.length) {
                        lenis.scrollTo(value);
                    }
                    return lenis.scroll;
                },
                getBoundingClientRect() {
                    return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
                },
            });

            // Navigation Smooth Scrolling
            document.querySelectorAll('.nav-menu a').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('href').substring(1);
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) lenis.scrollTo(targetElement);
                    this.closeMenu();
                });
            });
        }

        // Check if SplitText is available
        const hasSplitText = typeof SplitText !== 'undefined';

        // Hero Section Animations
        gsap.from(".hero-logo", { opacity: 0, y: -50, duration: 1, ease: "power2.out" });
        gsap.from(".hero-tagline", { opacity: 0, y: 50, duration: 1, ease: "power2.out", delay: 0.5 });
        gsap.to(".hero-image img", {
            scale: 1.1,
            scrollTrigger: {
                trigger: ".hero",
                start: "top top",
                end: "bottom top",
                scrub: true
            }
        });

        // About Section Animations
        const aboutSection = document.querySelector('.about');
        const aboutHeading = document.querySelector('.about .heading h2');
        if (hasSplitText) {
            const aboutSplit = new SplitText(aboutHeading, { type: "lines", linesClass: "lineChild" });
            gsap.from(aboutSplit.lines, {
                yPercent: 100,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: aboutSection,
                    start: "top 80%",
                    toggleActions: "play reverse none none"
                }
            });
        } else {
            gsap.from(aboutHeading, {
                y: 50,
                opacity: 0,
                duration: 0.8,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: aboutSection,
                    start: "top 80%",
                    toggleActions: "play reverse none none"
                }
            });
        }
        gsap.from(".about-img div:first-child img", {
            x: -100,
            opacity: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: aboutSection,
                start: "top 80%",
                toggleActions: "play reverse none none"
            }
        });
        gsap.from(".about-img #second-img img", {
            x: 100,
            opacity: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: aboutSection,
                start: "top 80%",
                toggleActions: "play reverse none none"
            }
        });
        gsap.from(".about-text", {
            opacity: 0,
            y: 50,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: aboutSection,
                start: "top 80%",
                toggleActions: "play reverse none none"
            }
        });

        // Video Section Animations
        const videoSection = document.querySelector('.video-reel');
        if (hasSplitText) {
            const videoHeading = document.querySelector('.video-reel .heading h2');
            const videoSplit = new SplitText(videoHeading, { type: "lines", linesClass: "lineChild" });
            gsap.from(videoSplit.lines, {
                yPercent: 100,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: videoSection,
                    start: "top 80%",
                    toggleActions: "play reverse none none"
                }
            });
        }
        gsap.from(".video-poster", {
            opacity: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: videoSection,
                start: "top 80%",
                toggleActions: "play reverse none none"
            }
        });

        // Features Section Animations - FIXED
        const featuresSection = document.querySelector('.features-section');
        if (featuresSection) {
            // Heading top animation - coming from left
            gsap.fromTo(".features-section .heading-top", 
                { x: -200, opacity: 0 },
                { 
                    x: 0, 
                    opacity: 1, 
                    duration: 1, 
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: featuresSection,
                        start: "top 80%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
            
            // Heading bottom animation - coming from right
            gsap.fromTo(".features-section .heading-bottom", 
                { x: 200, opacity: 0 },
                { 
                    x: 0, 
                    opacity: 1, 
                    duration: 1, 
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: featuresSection,
                        start: "top 80%",
                        toggleActions: "play none none reverse"
                    }
                }
            );

            // Feature cards animation
            gsap.from(".feature-card", {
                opacity: 0,
                y: 50,
                duration: 1,
                stagger: 0.2,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: featuresSection,
                    start: "top 80%",
                    end: "bottom 60%",
                    toggleActions: "play none none reverse"
                }
            });
        }

        // Booking Section Animations
        const bookingSection = document.querySelector('.booking-section');
        if (hasSplitText) {
            const bookingHeading = document.querySelector('.booking-section .heading h2');
            const bookingSplit = new SplitText(bookingHeading, { type: "lines", linesClass: "lineChild" });
            gsap.from(bookingSplit.lines, {
                yPercent: 100,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: bookingSection,
                    start: "top 80%",
                    toggleActions: "play reverse none none"
                }
            });
        }
        gsap.from(".form input, .form textarea", {
            opacity: 0,
            y: 20,
            duration: 0.5,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: bookingSection,
                start: "top 80%",
                toggleActions: "play none none none"
            }
        });

        // Fetch Dynamic Data
        this.fetchArtists();
        this.fetchTattoos();

        // Refresh ScrollTrigger to ensure proper calculations
        ScrollTrigger.refresh();
    }
});

app.mount('#app');