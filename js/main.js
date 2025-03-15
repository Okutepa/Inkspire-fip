(() => {
    // Selecting DOM Elements
const menuBtn = document.querySelector('.menu-btn');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-menu ul li a');
const body = document.body;

// Flag to track menu state
let menuOpen = false;

// Toggle menu function
function toggleMenu() {
    if(!menuOpen) {
        // Open menu
        menuBtn.classList.add('open');
        navMenu.classList.add('open');
        body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
        menuOpen = true;
    } else {
        // Close menu
        menuBtn.classList.remove('open');
        navMenu.classList.remove('open');
        body.style.overflow = 'auto'; // Re-enable scrolling
        menuOpen = false;
    }
}

// Event Listeners
menuBtn.addEventListener('click', toggleMenu);

// Close menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        // Only toggle if menu is open
        if(menuOpen) {
            toggleMenu();
        }
    });
});

// Close menu on window resize (optional - improves user experience)
window.addEventListener('resize', () => {
    if(menuOpen && window.innerWidth > 768) {
        toggleMenu();
    }
});

// Close menu when clicking outside the nav (optional - improves user experience)
document.addEventListener('click', (e) => {
    // Check if menu is open and click is outside nav and menu button
    if(menuOpen && 
       !navMenu.contains(e.target) && 
       !menuBtn.contains(e.target)) {
        toggleMenu();
    }
});
})();