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
const modal = document.getElementById('watch-modal');
const form = document.getElementById('watch-form');
const deleteBtn = document.getElementById('btn-delete');

// Initialization
function init() {
    renderDashboard();
    renderGrid();
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
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    // Sort watches: Most recently added first (by ID)
    const sortedWatches = [...watches].sort((a, b) => b.id - a.id);

    sortedWatches.forEach(watch => {
        const card = document.createElement('div');
        card.className = 'bg-carbon-surface border border-carbon-border p-5 shadow-sm flex flex-col h-full transition-shadow hover:shadow-md';
        
        card.innerHTML = `
            <div class="mb-4">
                <span class="text-xs font-semibold uppercase tracking-wider text-carbon-textSecondary">${watch.brand}</span>
                <h3 class="text-xl font-medium text-carbon-text mt-1">${watch.model}</h3>
            </div>
            
            <div class="my-4 flex-grow">
                <div class="flex items-end gap-2 mb-2">
                    <span class="text-sm text-carbon-textSecondary">Wrist Time:</span>
                    <span class="text-3xl font-light leading-none text-carbon-text">${watch.wristTime}</span>
                </div>
                ${watch.notes ? `<p class="text-sm text-carbon-textSecondary mt-3 line-clamp-2 border-l-2 border-carbon-border pl-2">${watch.notes}</p>` : ''}
            </div>
            
            <div class="mt-auto pt-4 border-t border-carbon-border flex gap-3">
                <button onclick="addWristTime(${watch.id})" class="flex-1 bg-carbon-blue text-white px-3 py-2 text-sm font-semibold hover:bg-carbon-blueHover transition-colors flex items-center justify-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    +1 Wrist Time
                </button>
                <button onclick="openModal(${watch.id})" class="bg-transparent border border-carbon-dark text-carbon-dark px-3 py-2 text-sm font-semibold hover:bg-gray-100 transition-colors">
                    Edit/Notes
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
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
function openModal(id = null) {
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
    
    modal.classList.remove('hidden');
    document.getElementById('brand').focus();
}

function closeModal() {
    modal.classList.add('hidden');
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
    closeModal();
}

// Delete Watch
function deleteWatch() {
    if (confirm('Are you sure you want to remove this timepiece from your collection?')) {
        watches = watches.filter(w => w.id !== currentEditId);
        persistData();
        closeModal();
    }
}

// Run Initialization
init();