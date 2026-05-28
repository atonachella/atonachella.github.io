// Ensure DOM is fully loaded before running scripts
document.addEventListener('DOMContentLoaded', () => {
    
    const exploreBtn = document.getElementById('explore-btn');
    const servicesSection = document.getElementById('services');

    // Smooth scroll navigation example
    if (exploreBtn && servicesSection) {
        exploreBtn.addEventListener('click', () => {
            servicesSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

// Contact Email Action Handler
    const emailLink = document.getElementById('contact-email');
    if (emailLink) {
        emailLink.addEventListener('click', (e) => {
            console.log("📬 Redirecting user to secure email client link...");
        });
    }

    console.log("🚀 Futuristic AI Architecture System Online.");
});