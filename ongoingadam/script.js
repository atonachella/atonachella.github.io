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

    console.log("🚀 Futuristic AI Architecture System Online.");
});