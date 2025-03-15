// js/main.js
const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            menuOpen: false // Tracks menu state
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
    }
});

app.mount('#app');