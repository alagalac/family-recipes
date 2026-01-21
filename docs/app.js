// Register service worker for PWA support
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
        console.log('Service Worker registration failed:', err);
    });
}

// Get recipes data from embedded JSON
const recipesData = JSON.parse(document.getElementById('recipes-data').textContent);

// DOM elements
const searchInput = document.getElementById('recipe-search');
const searchClearBtn = document.getElementById('search-clear-btn');
const cookingModeBtn = document.getElementById('cooking-mode-btn');
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const navDrawer = document.getElementById('nav-drawer');
const navElement = document.querySelector('nav.recipe-nav');

// Move nav into drawer
if (navElement) {
    const navDrawerContent = navElement.cloneNode(true);
    navDrawer.appendChild(navDrawerContent);
    navElement.remove();
}

// Search functionality
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    // Show/hide clear button
    searchClearBtn.style.display = query ? 'block' : 'none';
    
    if (!query) {
        // Show all recipes
        document.querySelectorAll('.recipe').forEach(recipe => {
            recipe.style.display = '';
            recipe.classList.remove('search-match');
        });
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = '';
        });
        return;
    }
    
    // Filter recipes
    const matchedRecipeIds = new Set();
    recipesData.forEach(recipe => {
        const titleMatch = recipe.title.toLowerCase().includes(query);
        const ingredientMatch = recipe.ingredients.toLowerCase().includes(query);
        
        if (titleMatch || ingredientMatch) {
            matchedRecipeIds.add(recipe.id);
        }
    });
    
    // Update visibility
    document.querySelectorAll('.recipe').forEach(recipe => {
        const recipeId = recipe.id;
        if (matchedRecipeIds.has(recipeId)) {
            recipe.style.display = '';
            recipe.classList.add('search-match');
        } else {
            recipe.style.display = 'none';
        }
    });
    
    // Show sections only if they have visible recipes
    document.querySelectorAll('.section').forEach(section => {
        const visibleRecipes = section.querySelectorAll('.recipe:not([style*="display: none"])');
        section.style.display = visibleRecipes.length > 0 ? '' : 'none';
    });
});

// Clear search
searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchClearBtn.style.display = 'none';
    searchInput.dispatchEvent(new Event('input'));
    searchInput.focus();
});

// Cooking mode functionality
let cookingModeActive = localStorage.getItem('cookingMode') === 'true';
let wakeLock = null;

// Update cooking mode button appearance
function updateCookingModeButton() {
    if (cookingModeActive) {
        cookingModeBtn.classList.add('cooking-mode-active');
        cookingModeBtn.querySelector('.btn-icon').textContent = '🔅';
        cookingModeBtn.querySelector('.btn-text').textContent = ' Cooking Mode On';
    } else {
        cookingModeBtn.classList.remove('cooking-mode-active');
        cookingModeBtn.querySelector('.btn-icon').textContent = '🔆';
        cookingModeBtn.querySelector('.btn-text').textContent = ' Cooking Mode';
    }
}

// Apply cooking mode CSS
function applyCookingMode() {
    if (cookingModeActive) {
        document.body.classList.add('cooking-mode');
    } else {
        document.body.classList.remove('cooking-mode');
    }
}

// Request wake lock
async function requestWakeLock() {
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake lock acquired');
        wakeLock.addEventListener('release', () => {
            console.log('Wake lock released');
        });
    } catch (err) {
        console.log('Wake lock request failed:', err);
    }
}

// Release wake lock
function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release().then(() => {
            wakeLock = null;
            console.log('Wake lock released');
        });
    }
}

// Reacquire wake lock on visibility change
document.addEventListener('visibilitychange', async () => {
    if (cookingModeActive && document.visibilityState === 'visible') {
        await requestWakeLock();
    }
});

// Cooking mode button handler
cookingModeBtn.addEventListener('click', async () => {
    cookingModeActive = !cookingModeActive;
    localStorage.setItem('cookingMode', cookingModeActive);
    updateCookingModeButton();
    applyCookingMode();
    
    if (cookingModeActive && 'wakeLock' in navigator) {
        await requestWakeLock();
    } else {
        releaseWakeLock();
    }
});

// Initialize cooking mode on page load
if (cookingModeActive) {
    updateCookingModeButton();
    applyCookingMode();
    if ('wakeLock' in navigator) {
        requestWakeLock();
    }
}

// Menu toggle for mobile
menuToggleBtn.addEventListener('click', () => {
    const isOpen = navDrawer.classList.toggle('nav-drawer-open');
    menuToggleBtn.setAttribute('aria-expanded', isOpen);
});

// Close menu when clicking on a recipe link
navDrawer.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
        navDrawer.classList.remove('nav-drawer-open');
        menuToggleBtn.setAttribute('aria-expanded', false);
        
        // Handle scroll offset for fixed header
        const href = e.target.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const targetElement = document.querySelector(href);
            if (targetElement) {
                const headerHeight = 70; // Height of fixed header
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                // Update URL without triggering navigation
                window.history.pushState(null, null, href);
            }
        }
    }
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-drawer') && !e.target.closest('.menu-toggle-btn')) {
        navDrawer.classList.remove('nav-drawer-open');
        menuToggleBtn.setAttribute('aria-expanded', false);
    }
});

// Install prompt handling for PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Could show an install button here
});

window.addEventListener('appinstalled', () => {
    console.log('App installed');
    deferredPrompt = null;
});

// Handle scroll to recipe on page load or hash change
function scrollToRecipe() {
    const hash = window.location.hash;
    if (hash) {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            const targetElement = document.querySelector(hash);
            if (targetElement) {
                const headerHeight = 70; // Height of fixed header
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }
}

// Handle hash changes
window.addEventListener('hashchange', scrollToRecipe);

// Handle initial page load with hash
document.addEventListener('DOMContentLoaded', scrollToRecipe);
