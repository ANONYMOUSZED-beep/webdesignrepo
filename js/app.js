// Prototype Storage and Management System
class PrototypeManager {
    constructor() {
        this.prototypes = [];
        this.currentEditId = null;
        this.apiBase = '/api';
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadPrototypes();
        this.renderPrototypes();
        this.updateEmptyState();
    }

    bindEvents() {
        // Modal controls
        document.getElementById('addPrototypeBtn').addEventListener('click', () => this.openAddModal());
        document.getElementById('prototypeForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Search and filter
        document.getElementById('searchInput').addEventListener('input', () => this.filterPrototypes());
        document.getElementById('categoryFilter').addEventListener('change', () => this.filterPrototypes());
        document.getElementById('sortBy').addEventListener('change', () => this.filterPrototypes());
        
        // Close modals when clicking outside
        document.getElementById('prototypeModal').addEventListener('click', (e) => {
            if (e.target.id === 'prototypeModal') this.closeModal();
        });
        document.getElementById('detailModal').addEventListener('click', (e) => {
            if (e.target.id === 'detailModal') this.closeDetailModal();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeDetailModal();
            }
        });
    }

    // API Methods
    async loadPrototypes() {
        try {
            const searchParams = new URLSearchParams();
            const searchTerm = document.getElementById('searchInput')?.value;
            const categoryFilter = document.getElementById('categoryFilter')?.value;
            const sortBy = document.getElementById('sortBy')?.value;

            if (searchTerm) searchParams.append('search', searchTerm);
            if (categoryFilter) searchParams.append('category', categoryFilter);
            if (sortBy) searchParams.append('sortBy', sortBy);

            const response = await fetch(`${this.apiBase}/prototypes?${searchParams}`);
            if (!response.ok) throw new Error('Failed to load prototypes');
            
            this.prototypes = await response.json();
        } catch (error) {
            console.error('Error loading prototypes:', error);
            this.showError('Failed to load prototypes. Please try again.');
            this.prototypes = [];
        }
    }

    async savePrototype(prototypeData) {
        try {
            const response = await fetch(`${this.apiBase}/prototypes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(prototypeData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save prototype');
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving prototype:', error);
            throw error;
        }
    }

    async updatePrototypeAPI(id, updates) {
        try {
            const response = await fetch(`${this.apiBase}/prototypes/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update prototype');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating prototype:', error);
            throw error;
        }
    }

    async deletePrototypeAPI(id) {
        try {
            const response = await fetch(`${this.apiBase}/prototypes/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete prototype');
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting prototype:', error);
            throw error;
        }
    }

    // Prototype CRUD Operations
    async addPrototype(prototypeData) {
        try {
            this.showLoading(true);
            const prototype = await this.savePrototype(prototypeData);
            await this.loadPrototypes();
            this.renderPrototypes();
            this.updateEmptyState();
            this.showSuccess('Prototype added successfully!');
            return prototype;
        } catch (error) {
            this.showError(error.message);
            throw error;
        } finally {
            this.showLoading(false);
        }
    }

    async updatePrototype(id, updates) {
        try {
            this.showLoading(true);
            await this.updatePrototypeAPI(id, updates);
            await this.loadPrototypes();
            this.renderPrototypes();
            this.showSuccess('Prototype updated successfully!');
        } catch (error) {
            this.showError(error.message);
            throw error;
        } finally {
            this.showLoading(false);
        }
    }

    async deletePrototype(id) {
        if (confirm('Are you sure you want to delete this prototype? This action cannot be undone.')) {
            try {
                this.showLoading(true);
                await this.deletePrototypeAPI(id);
                await this.loadPrototypes();
                this.renderPrototypes();
                this.updateEmptyState();
                this.closeDetailModal();
                this.showSuccess('Prototype deleted successfully!');
            } catch (error) {
                this.showError(error.message);
            } finally {
                this.showLoading(false);
            }
        }
    }

    // Modal Management
    openAddModal() {
        this.currentEditId = null;
        document.getElementById('modalTitle').textContent = 'Add New Prototype';
        document.getElementById('prototypeForm').reset();
        document.getElementById('prototypeModal').classList.add('active');
    }

    openEditModal(id) {
        const prototype = this.prototypes.find(p => p._id === id);
        if (!prototype) return;

        this.currentEditId = id;
        document.getElementById('modalTitle').textContent = 'Edit Prototype';
        
        // Populate form
        document.getElementById('prototypeTitle').value = prototype.title;
        document.getElementById('prototypeDescription').value = prototype.description || '';
        document.getElementById('figmaUrl').value = prototype.figmaUrl;
        document.getElementById('prototypeCategory').value = prototype.category;
        document.getElementById('prototypeTags').value = prototype.tags ? prototype.tags.join(', ') : '';
        
        document.getElementById('prototypeModal').classList.add('active');
    }

    closeModal() {
        document.getElementById('prototypeModal').classList.remove('active');
        this.currentEditId = null;
    }

    openDetailModal(id) {
        const prototype = this.prototypes.find(p => p._id === id);
        if (!prototype) return;

        this.currentEditId = id;
        
        // Populate detail modal
        document.getElementById('detailTitle').textContent = prototype.title;
        document.getElementById('detailDescription').textContent = prototype.description || 'No description provided.';
        
        // Render tags
        const tagsContainer = document.getElementById('detailTags');
        tagsContainer.innerHTML = '';
        if (prototype.tags && prototype.tags.length > 0) {
            prototype.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag.trim();
                tagsContainer.appendChild(tagElement);
            });
        }
        
        // Embed Figma prototype
        const figmaFrame = document.getElementById('figmaFrame');
        const embedUrl = this.convertToEmbedUrl(prototype.figmaUrl);
        figmaFrame.src = embedUrl;
        
        document.getElementById('detailModal').classList.add('active');
    }

    closeDetailModal() {
        document.getElementById('detailModal').classList.remove('active');
        document.getElementById('figmaFrame').src = '';
        this.currentEditId = null;
    }

    // Form Handling
    async handleFormSubmit(e) {
        e.preventDefault();
        
        const prototypeData = {
            title: document.getElementById('prototypeTitle').value.trim(),
            description: document.getElementById('prototypeDescription').value.trim(),
            figmaUrl: document.getElementById('figmaUrl').value.trim(),
            category: document.getElementById('prototypeCategory').value,
            tags: document.getElementById('prototypeTags').value
        };

        // Validate required fields
        if (!prototypeData.title || !prototypeData.figmaUrl) {
            this.showError('Please fill in all required fields.');
            return;
        }

        // Validate Figma URL
        if (!this.isValidFigmaUrl(prototypeData.figmaUrl)) {
            this.showError('Please enter a valid Figma URL.');
            return;
        }

        try {
            if (this.currentEditId) {
                await this.updatePrototype(this.currentEditId, prototypeData);
            } else {
                await this.addPrototype(prototypeData);
            }
            
            this.closeModal();
        } catch (error) {
            // Error already handled in the CRUD methods
        }
    }

    // URL Validation and Conversion
    isValidFigmaUrl(url) {
        return url.includes('figma.com') && (url.includes('/proto/') || url.includes('/file/'));
    }

    convertToEmbedUrl(figmaUrl) {
        // Convert Figma URL to embeddable format
        if (figmaUrl.includes('/proto/')) {
            return figmaUrl.replace('/proto/', '/embed?embed_host=share&url=') + '&chrome=DOCUMENTATION';
        } else if (figmaUrl.includes('/file/')) {
            return figmaUrl.replace('/file/', '/embed?embed_host=share&url=') + '&chrome=DOCUMENTATION';
        }
        return figmaUrl;
    }

    // Rendering Methods
    renderPrototypes() {
        const grid = document.getElementById('prototypesGrid');
        const filteredPrototypes = this.getFilteredPrototypes();
        
        grid.innerHTML = '';
        
        filteredPrototypes.forEach(prototype => {
            const card = this.createPrototypeCard(prototype);
            grid.appendChild(card);
        });
    }

    createPrototypeCard(prototype) {
        const card = document.createElement('div');
        card.className = 'prototype-card';
        card.addEventListener('click', () => this.openDetailModal(prototype._id));
        
        const embedUrl = this.convertToEmbedUrl(prototype.figmaUrl);
        const formattedDate = new Date(prototype.createdAt).toLocaleDateString();
        
        card.innerHTML = `
            <div class="prototype-preview">
                <iframe src="${embedUrl}" width="100%" height="100%" frameborder="0"></iframe>
                <div class="preview-overlay">
                    <i class="fas fa-eye"></i>
                </div>
            </div>
            <div class="prototype-info">
                <h3 class="prototype-title">${this.escapeHtml(prototype.title)}</h3>
                <p class="prototype-description">
                    ${prototype.description ? this.escapeHtml(prototype.description) : 'No description provided.'}
                </p>
                <div class="prototype-meta">
                    <span class="prototype-category">${this.getCategoryDisplayName(prototype.category)}</span>
                    <span class="prototype-date">${formattedDate}</span>
                </div>
                ${prototype.tags && prototype.tags.length > 0 ? `
                    <div class="prototype-tags">
                        ${prototype.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        return card;
    }

    // Filtering and Searching
    getFilteredPrototypes() {
        // Since filtering is now done server-side, just return the prototypes
        return [...this.prototypes];
    }

    async filterPrototypes() {
        await this.loadPrototypes();
        this.renderPrototypes();
        this.updateEmptyState();
    }

    // Utility Methods
    updateEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const hasPrototypes = this.prototypes.length > 0;
        const hasFilteredResults = this.getFilteredPrototypes().length > 0;
        
        if (!hasPrototypes) {
            emptyState.style.display = 'block';
            emptyState.querySelector('h3').textContent = 'No prototypes yet';
            emptyState.querySelector('p').textContent = 'Start building your design portfolio by adding your first Figma prototype!';
        } else if (!hasFilteredResults) {
            emptyState.style.display = 'block';
            emptyState.querySelector('h3').textContent = 'No matching prototypes';
            emptyState.querySelector('p').textContent = 'Try adjusting your search or filter criteria.';
        } else {
            emptyState.style.display = 'none';
        }
    }

    getCategoryDisplayName(category) {
        const categories = {
            'mobile-app': 'Mobile App',
            'web-app': 'Web App',
            'website': 'Website',
            'ui-kit': 'UI Kit',
            'other': 'Other'
        };
        return categories[category] || category;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // UI Feedback Methods
    showLoading(show) {
        const existingLoader = document.querySelector('.loading-overlay');
        if (show && !existingLoader) {
            const loader = document.createElement('div');
            loader.className = 'loading-overlay';
            loader.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading...</p>
                </div>
            `;
            document.body.appendChild(loader);
        } else if (!show && existingLoader) {
            existingLoader.remove();
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Global Functions (called from HTML)
let prototypeManager;

function openAddModal() {
    prototypeManager.openAddModal();
}

function closeModal() {
    prototypeManager.closeModal();
}

function editPrototype() {
    if (prototypeManager.currentEditId) {
        prototypeManager.closeDetailModal();
        prototypeManager.openEditModal(prototypeManager.currentEditId);
    }
}

function deletePrototype() {
    if (prototypeManager.currentEditId) {
        prototypeManager.deletePrototype(prototypeManager.currentEditId);
    }
}

function closeDetailModal() {
    prototypeManager.closeDetailModal();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    prototypeManager = new PrototypeManager();
});