const { createApp } = Vue;

const app = createApp({
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
                posterImage: "images/hero-img.jpg",
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
            currentIndex: 0 // Start at the first image
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
    }
});

app.mount('#app');