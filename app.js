// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered.', reg))
            .catch(err => console.error('Service Worker registration failed.', err));
    });
}

// State Management
let watches = JSON.parse(localStorage.getItem('timepiece_collection')) || [];
let currentEditId = null;

// DOM Elements
const grid = document.getElementById('collection-grid');
const emptyState = document.getElementById('empty-state');
const watchModal = document.getElementById('watch-modal');
const settingsModal = document.getElementById('settings-modal');
const form = document.getElementById('watch-form');
const deleteBtn = document.getElementById('btn-delete');
const themeSelect = document.getElementById('theme-select');

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'system';
    themeSelect.value = savedTheme;
    applyTheme(savedTheme);
    
    // Listen for OS system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (localStorage.getItem('theme') === 'system') {
            applyTheme('system');
        }
    });
}

function changeTheme(themeValue) {
    localStorage.setItem('theme', themeValue);
    applyTheme(themeValue);
}

function applyTheme(themeValue) {
    const isDark = themeValue === 'dark' || 
                  (themeValue === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// Initialization
function init() {
    initTheme();
    renderDashboard();
    renderGrid();
    feather.replace(); // Initialize feather icons on load
}

// Save to LocalStorage
function persistData() {
    localStorage.setItem('timepiece_collection', JSON.stringify(watches));
    renderDashboard();
    renderGrid();
}

// Render Dashboard Statistics
function renderDashboard() {
    document.getElementById('stat-total-watches').innerText = watches.length;
    
    const totalWristTime = watches.reduce((sum, watch) => sum + (watch.wristTime || 0), 0);
    document.getElementById('stat-total-wrist-time').innerText = totalWristTime;

    if (watches.length === 0 || totalWristTime === 0) {
        document.getElementById('stat-most-worn').innerText = 'N/A';
    } else {
        const mostWorn = watches.reduce((prev, current) => (prev.wristTime > current.wristTime) ? prev : current);
        document.getElementById('stat-most-worn').innerText = `${mostWorn.brand} ${mostWorn.model}`;
    }
}

// Render Watch Grid
function renderGrid() {
    grid.innerHTML = '';
    
    if (watches.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }

    // Sort watches: Most recently added first
    const sortedWatches = [...watches].sort((a, b) => b.id - a.id);

    sortedWatches.forEach(watch => {
        const card = document.createElement('div');
        card.className = 'bg-carbon-surface dark:bg-carbon-darkSurface border border-carbon-border dark:border-carbon-darkBorder p-5 flex flex-col h-full transition-colors duration-200 hover:shadow-md';
        
        card.innerHTML = `
            <div class="mb-4">
                <span class="text-xs font-semibold uppercase tracking-wider text-carbon-textSecondary dark:text-carbon-darkTextSecondary">${watch.brand}</span>
                <h3 class="text-xl font-medium mt-1">${watch.model}</h3>
            </div>
            
            <div class="my-4 flex-grow">
                <div class="flex items-end gap-2 mb-2">
                    <span class="text-sm text-carbon-textSecondary dark:text-carbon-darkTextSecondary">Wrist Time:</span>
                    <span class="text-3xl font-light leading-none">${watch.wristTime}</span>
                </div>
                ${watch.notes ? `<p class="text-sm text-carbon-textSecondary dark:text-carbon-darkTextSecondary mt-3 line-clamp-2 border-l-2 border-carbon-border dark:border-carbon-darkBorder pl-2">${watch.notes}</p>` : ''}
            </div>
            
            <div class="mt-auto pt-4 border-t border-carbon-border dark:border-carbon-darkBorder flex gap-3">
                <button onclick="addWristTime(${watch.id})" class="flex-1 bg-carbon-blue text-white px-3 py-2 text-sm font-semibold hover:bg-carbon-blueHover transition-colors flex items-center justify-center gap-2">
                    <i data-feather="plus-circle" class="w-4 h-4"></i>
                    +1 Wear
                </button>
                <button onclick="openWatchModal(${watch.id})" class="bg-transparent border border-carbon-text dark:border-carbon-darkText px-3 py-2 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-carbon-darkBorder transition-colors flex items-center justify-center gap-2" aria-label="Edit Watch">
                    <i data-feather="edit-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });

    // Re-initialize feather icons for newly added HTML
    feather.replace();
}

// Add Wrist Time Action
function addWristTime(id) {
    const watch = watches.find(w => w.id === id);
    if (watch) {
        watch.wristTime += 1;
        persistData();
    }
}

// Modal Management
function openWatchModal(id = null) {
    currentEditId = id;
    form.reset();
    
    if (id) {
        const watch = watches.find(w => w.id === id);
        document.getElementById('modal-title').innerText = 'Edit Timepiece';
        document.getElementById('brand').value = watch.brand;
        document.getElementById('model').value = watch.model;
        document.getElementById('purchaseDate').value = watch.purchaseDate;
        document.getElementById('notes').value = watch.notes || '';
        deleteBtn.classList.remove('hidden');
    } else {
        document.getElementById('modal-title').innerText = 'Add New Timepiece';
        document.getElementById('purchaseDate').valueAsDate = new Date();
        deleteBtn.classList.add('hidden');
    }
    
    watchModal.classList.remove('hidden');
    document.getElementById('brand').focus();
}

function openSettings() {
    settingsModal.classList.remove('hidden');
}

function closeModals() {
    watchModal.classList.add('hidden');
    settingsModal.classList.add('hidden');
    currentEditId = null;
}

// Save (Add or Update) Watch
function saveWatch() {
    const brand = document.getElementById('brand').value.trim();
    const model = document.getElementById('model').value.trim();
    const purchaseDate = document.getElementById('purchaseDate').value;
    const notes = document.getElementById('notes').value.trim();

    if (!brand || !model || !purchaseDate) {
        alert("Please fill in the Brand, Model, and Purchase Date.");
        return;
    }

    if (currentEditId) {
        // Update
        const watchIndex = watches.findIndex(w => w.id === currentEditId);
        watches[watchIndex] = { ...watches[watchIndex], brand, model, purchaseDate, notes };
    } else {
        // Create
        const newWatch = {
            id: Date.now(),
            brand,
            model,
            purchaseDate,
            wristTime: 0,
            notes
        };
        watches.push(newWatch);
    }

    persistData();
    closeModals();
}

// Delete Watch
function deleteWatch() {
    if (confirm('Are you sure you want to remove this timepiece from your collection?')) {
        watches = watches.filter(w => w.id !== currentEditId);
        persistData();
        closeModals();
    }
}

// Run Initialization
init();