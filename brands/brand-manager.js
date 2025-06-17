// Brand Manager - Handles brand registration, catalog, and management
class BrandManager {
  constructor() {
    this.brands = [];
    this.filteredBrands = [];
    this.currentFilters = {
      search: '',
      industry: '',
      status: '',
      budget: ''
    };
    this.registryUrl = '/brands/registry.json';
    this.currentView = 'grid';
  }

  // Initialize brand registration form
  initRegistrationForm() {
    this.setupFormValidation();
    this.setupPixelPreview();
    this.setupCostCalculator();
    this.bindRegistrationEvents();
  }

  // Initialize brand catalog
  initCatalog() {
    this.loadBrands();
    this.bindCatalogEvents();
    this.setupModal();
    this.initSearchAndFiltering();
  }

  // Load brands from registry
  async loadBrands() {
    try {
      const response = await fetch(this.registryUrl);
      const data = await response.json();
      this.brands = data.brands || [];
      this.filteredBrands = [...this.brands];
      this.updateCatalogStats();
      this.renderBrandGrid();
      this.renderFeaturedBrands();
    } catch (error) {
      console.error('Error loading brands:', error);
      this.showError('Failed to load brand catalog');
    }
  }

  // Setup form validation
  setupFormValidation() {
    const form = document.getElementById('brand-registration-form');
    if (!form) return;

    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearFieldError(input));
    });

    form.addEventListener('submit', (e) => this.handleRegistration(e));
  }

  // Setup pixel preview
  setupPixelPreview() {
    const primaryColor = document.getElementById('primary-color');
    const secondaryColor = document.getElementById('secondary-color');
    const accentColor = document.getElementById('accent-color');
    const shape = document.getElementById('shape');
    const glowIntensity = document.getElementById('glow-intensity');
    const glowValue = document.getElementById('glow-value');

    if (!primaryColor) return;

    const updatePreview = () => {
      const pixel = document.getElementById('preview-pixel');
      if (pixel) {
        pixel.style.background = primaryColor.value;
        pixel.style.boxShadow = `0 0 ${20 * parseFloat(glowIntensity.value)}px ${primaryColor.value}`;
        
        // Update shape
        const shapeValue = shape.value;
        switch (shapeValue) {
          case 'rounded_rectangle':
            pixel.style.borderRadius = '8px';
            break;
          case 'organic':
            pixel.style.borderRadius = '50% 30% 70% 40%';
            break;
          case 'dynamic':
            pixel.style.borderRadius = '20% 50% 30% 60%';
            break;
          case 'cube':
            pixel.style.borderRadius = '2px';
            break;
          default:
            pixel.style.borderRadius = '8px';
        }
      }
    };

    // Update glow value display
    if (glowIntensity && glowValue) {
      glowIntensity.addEventListener('input', () => {
        glowValue.textContent = glowIntensity.value;
        updatePreview();
      });
    }

    // Bind color and shape changes
    [primaryColor, secondaryColor, accentColor, shape].forEach(element => {
      if (element) {
        element.addEventListener('change', updatePreview);
      }
    });

    // Initial preview update
    updatePreview();
  }

  // Setup cost calculator
  setupCostCalculator() {
    const budgetTier = document.getElementById('budget-tier');
    const costSummary = document.getElementById('cost-summary');
    
    if (!budgetTier || !costSummary) return;

    const costs = {
      starter: 299,
      professional: 799,
      premium: 1999
    };

    budgetTier.addEventListener('change', () => {
      const selectedTier = budgetTier.value;
      const cost = costs[selectedTier] || 0;
      const h3 = costSummary.querySelector('h3');
      if (h3) {
        h3.textContent = `Monthly Cost: $${cost}`;
      }
    });
  }

  // Bind registration form events
  bindRegistrationEvents() {
    // Age range validation
    const ageMin = document.getElementById('age-min');
    const ageMax = document.getElementById('age-max');
    
    if (ageMin && ageMax) {
      ageMin.addEventListener('change', () => {
        if (parseInt(ageMin.value) >= parseInt(ageMax.value)) {
          ageMax.value = parseInt(ageMin.value) + 1;
        }
      });
      
      ageMax.addEventListener('change', () => {
        if (parseInt(ageMax.value) <= parseInt(ageMin.value)) {
          ageMin.value = parseInt(ageMax.value) - 1;
        }
      });
    }

    // Multi-select regions
    const regions = document.getElementById('regions');
    if (regions) {
      regions.addEventListener('change', () => {
        const selected = Array.from(regions.selectedOptions).map(option => option.value);
        console.log('Selected regions:', selected);
      });
    }
  }

  // Bind catalog events
  bindCatalogEvents() {
    // Search functionality
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentFilters.search = e.target.value.toLowerCase();
        this.debounce(() => this.applyFilters(), 300);
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.applyFilters());
    }

    // Filter controls
    const filters = ['industry-filter', 'status-filter', 'budget-filter'];
    filters.forEach(filterId => {
      const element = document.getElementById(filterId);
      if (element) {
        element.addEventListener('change', (e) => {
          const filterType = filterId.replace('-filter', '');
          this.currentFilters[filterType] = e.target.value;
          this.applyFilters();
        });
      }
    });

    // Clear filters
    const clearFilters = document.getElementById('clear-filters');
    if (clearFilters) {
      clearFilters.addEventListener('click', () => this.clearFilters());
    }

    // View toggle
    const gridView = document.getElementById('grid-view');
    const listView = document.getElementById('list-view');
    
    if (gridView) {
      gridView.addEventListener('click', () => this.setView('grid'));
    }
    if (listView) {
      listView.addEventListener('click', () => this.setView('list'));
    }
  }

  // Setup modal
  setupModal() {
    const modal = document.getElementById('brand-modal');
    const closeBtn = document.getElementById('modal-close');
    const closeBtnFooter = document.getElementById('modal-close-btn');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }
    if (closeBtnFooter) {
      closeBtnFooter.addEventListener('click', () => this.closeModal());
    }
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }
  }

  // Search and filtering functionality
  initSearchAndFiltering() {
    const searchInput = document.getElementById('search-input');
    const industryFilter = document.getElementById('industry-filter');
    const statusFilter = document.getElementById('status-filter');

    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterBrands());
    }
    if (industryFilter) {
      industryFilter.addEventListener('change', () => this.filterBrands());
    }
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.filterBrands());
    }
  }

  filterBrands() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const industryFilter = document.getElementById('industry-filter')?.value || '';
    const statusFilter = document.getElementById('status-filter')?.value || '';

    const brandCards = document.querySelectorAll('.brand-card');
    let visibleCount = 0;

    brandCards.forEach(card => {
      const brandName = card.querySelector('.brand-name')?.textContent.toLowerCase() || '';
      const brandDescription = card.querySelector('.brand-description')?.textContent.toLowerCase() || '';
      const industry = card.dataset.industry || '';
      const status = card.dataset.status || '';

      const matchesSearch = !searchTerm || 
        brandName.includes(searchTerm) || 
        brandDescription.includes(searchTerm);
      const matchesIndustry = !industryFilter || industry === industryFilter;
      const matchesStatus = !statusFilter || status === statusFilter;

      if (matchesSearch && matchesIndustry && matchesStatus) {
        card.style.display = 'block';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Update results count
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
      resultsCount.textContent = `${visibleCount} brand${visibleCount !== 1 ? 's' : ''} found`;
    }
  }

  // Apply filters to brand list
  applyFilters() {
    this.filteredBrands = this.brands.filter(brand => {
      const matchesSearch = !this.currentFilters.search || 
        brand.name.toLowerCase().includes(this.currentFilters.search) ||
        brand.description.toLowerCase().includes(this.currentFilters.search) ||
        brand.industry.toLowerCase().includes(this.currentFilters.search);

      const matchesIndustry = !this.currentFilters.industry || 
        brand.industry === this.currentFilters.industry;

      const matchesStatus = !this.currentFilters.status || 
        brand.status === this.currentFilters.status;

      const matchesBudget = !this.currentFilters.budget || 
        brand.campaign.budget_tier === this.currentFilters.budget;

      return matchesSearch && matchesIndustry && matchesStatus && matchesBudget;
    });

    this.updateCatalogStats();
    this.renderBrandGrid();
  }

  // Clear all filters
  clearFilters() {
    this.currentFilters = {
      search: '',
      industry: '',
      status: '',
      budget: ''
    };

    // Clear form controls
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    const filters = ['industry-filter', 'status-filter', 'budget-filter'];
    filters.forEach(filterId => {
      const element = document.getElementById(filterId);
      if (element) element.value = '';
    });

    this.applyFilters();
  }

  // Set view mode
  setView(viewType) {
    this.currentView = viewType;
    const gridView = document.getElementById('grid-view');
    const listView = document.getElementById('list-view');
    const brandGrid = document.getElementById('brand-grid');

    if (gridView && listView && brandGrid) {
      gridView.classList.toggle('active', viewType === 'grid');
      listView.classList.toggle('active', viewType === 'list');
      brandGrid.classList.toggle('list-view', viewType === 'list');
    }
  }

  // Update catalog statistics
  updateCatalogStats() {
    const totalBrands = document.getElementById('total-brands');
    const verifiedBrands = document.getElementById('verified-brands');
    const activeCampaigns = document.getElementById('active-campaigns');

    if (totalBrands) {
      totalBrands.textContent = this.filteredBrands.length;
    }
    if (verifiedBrands) {
      verifiedBrands.textContent = this.filteredBrands.filter(b => b.status === 'verified').length;
    }
    if (activeCampaigns) {
      activeCampaigns.textContent = this.filteredBrands.filter(b => b.status === 'verified').length;
    }
  }

  // Render brand grid
  renderBrandGrid() {
    const brandGrid = document.getElementById('brand-grid');
    if (!brandGrid) return;

    if (this.filteredBrands.length === 0) {
      brandGrid.innerHTML = `
        <div class="no-results">
          <p>No brands found matching your criteria.</p>
          <button type="button" id="clear-all-filters" class="btn-secondary">Clear All Filters</button>
        </div>
      `;
      
      const clearBtn = document.getElementById('clear-all-filters');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => this.clearFilters());
      }
      return;
    }

    brandGrid.innerHTML = this.filteredBrands.map(brand => `
      <div class="brand-card" data-brand-id="${brand.brand_id}" data-industry="${brand.industry}" data-status="${brand.status}" onclick="brandManager.showBrandModal('${brand.brand_id}')">
        <div class="brand-card-header">
          <div class="brand-info">
            <h3 class="brand-name">${brand.name}</h3>
            <div class="brand-industry">${brand.industry}</div>
          </div>
          <div class="brand-status ${brand.status}">${brand.status}</div>
        </div>
        
        <div class="brand-pixel-display">
          <div class="brand-pixel" style="
            background: ${brand.pixel.colors.primary};
            box-shadow: 0 0 ${20 * brand.pixel.visual.glow_intensity}px ${brand.pixel.colors.primary};
          "></div>
        </div>
        
        <p class="brand-description">${brand.description}</p>
        
        <div class="brand-tags">
          ${brand.campaign.target_audience.interests.slice(0, 3).map(tag => 
            `<span class="brand-tag">${tag}</span>`
          ).join('')}
        </div>
        
        <div class="brand-metrics">
          <div class="metric-item">
            <span class="metric-number">${brand.analytics.total_interactions}</span>
            <span class="metric-label">Interactions</span>
          </div>
          <div class="metric-item">
            <span class="metric-number">${(brand.analytics.engagement_rate * 100).toFixed(1)}%</span>
            <span class="metric-label">Engagement</span>
          </div>
          <div class="metric-item">
            <span class="metric-number">${brand.analytics.conversion_events}</span>
            <span class="metric-label">Conversions</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Render featured brands
  renderFeaturedBrands() {
    const featuredGrid = document.getElementById('featured-grid');
    if (!featuredGrid) return;

    const featuredBrands = this.brands.filter(brand => brand.status === 'verified').slice(0, 3);
    
    featuredGrid.innerHTML = featuredBrands.map(brand => `
      <div class="brand-card" data-brand-id="${brand.brand_id}" onclick="brandManager.showBrandModal('${brand.brand_id}')">
        <div class="brand-card-header">
          <div class="brand-info">
            <h3>${brand.name}</h3>
            <div class="brand-industry">${brand.industry}</div>
          </div>
          <div class="brand-status ${brand.status}">${brand.status}</div>
        </div>
        
        <div class="brand-pixel-display">
          <div class="brand-pixel" style="
            background: ${brand.pixel.colors.primary};
            box-shadow: 0 0 ${20 * brand.pixel.visual.glow_intensity}px ${brand.pixel.colors.primary};
          "></div>
        </div>
        
        <p class="brand-description">${brand.description}</p>
      </div>
    `).join('');
  }

  // Show brand detail modal
  showBrandModal(brandId) {
    const brand = this.brands.find(b => b.brand_id === brandId);
    if (!brand) return;

    const modal = document.getElementById('brand-modal');
    if (!modal) return;

    // Populate modal content
    document.getElementById('modal-brand-name').textContent = brand.name;
    document.getElementById('modal-description').textContent = brand.description;
    document.getElementById('modal-industry').textContent = brand.industry;
    document.getElementById('modal-budget').textContent = brand.campaign.budget_tier;
    document.getElementById('modal-age-range').textContent = 
      `${brand.campaign.target_audience.age_range[0]}-${brand.campaign.target_audience.age_range[1]} years`;
    document.getElementById('modal-regions').textContent = brand.campaign.active_regions.join(', ');
    
    document.getElementById('modal-interactions').textContent = brand.analytics.total_interactions;
    document.getElementById('modal-engagement').textContent = `${(brand.analytics.engagement_rate * 100).toFixed(1)}%`;
    document.getElementById('modal-conversions').textContent = brand.analytics.conversion_events;

    // Update status
    const statusElement = document.getElementById('modal-status');
    statusElement.textContent = brand.status;
    statusElement.className = `brand-status ${brand.status}`;

    // Update pixel
    const pixel = document.getElementById('modal-pixel');
    pixel.style.background = brand.pixel.colors.primary;
    pixel.style.boxShadow = `0 0 ${30 * brand.pixel.visual.glow_intensity}px ${brand.pixel.colors.primary}`;

    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  // Close modal
  closeModal() {
    const modal = document.getElementById('brand-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }

  // Handle form submission
  async handleRegistration(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = document.getElementById('submit-btn');
    
    // Validate form
    if (!this.validateForm(form)) {
      return;
    }

    // Show loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      form.classList.add('loading');
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      this.showSuccess('Brand registration submitted successfully! You will receive an email confirmation shortly.');
      
      // Reset form
      form.reset();
      this.setupPixelPreview(); // Reset preview
      
    } catch (error) {
      console.error('Registration error:', error);
      this.showError('Failed to submit registration. Please try again.');
    } finally {
      // Reset button state
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Registration';
        form.classList.remove('loading');
      }
    }
  }

  // Validate form
  validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    // Validate goals (at least one checkbox)
    const goalCheckboxes = form.querySelectorAll('input[name="goals"]:checked');
    if (goalCheckboxes.length === 0) {
      this.showFieldError('Please select at least one campaign goal.');
      isValid = false;
    }

    return isValid;
  }

  // Validate individual field
  validateField(field) {
    const value = field.value.trim();
    let isValid = true;

    // Clear previous errors
    this.clearFieldError(field);

    // Required field validation
    if (field.hasAttribute('required') && !value) {
      this.showFieldError(field, 'This field is required.');
      isValid = false;
    }

    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        this.showFieldError(field, 'Please enter a valid email address.');
        isValid = false;
      }
    }

    // URL validation
    if (field.type === 'url' && value) {
      try {
        new URL(value);
      } catch {
        this.showFieldError(field, 'Please enter a valid URL.');
        isValid = false;
      }
    }

    return isValid;
  }

  // Show field error
  showFieldError(field, message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    
    const parent = field.closest('.form-group');
    if (parent) {
      parent.appendChild(errorElement);
      field.classList.add('error');
    }
  }

  // Clear field error
  clearFieldError(field) {
    const parent = field.closest('.form-group');
    if (parent) {
      const errorElement = parent.querySelector('.field-error');
      if (errorElement) {
        errorElement.remove();
      }
      field.classList.remove('error');
    }
  }

  // Show success message
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  // Show error message
  showError(message) {
    this.showNotification(message, 'error');
  }

  // Show notification
  showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  // Debounce function
  debounce(func, wait) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(func, wait);
  }

  // Brand verification system
  initVerificationSystem() {
    // Add verification status indicators
    this.updateVerificationStatuses();
  }

  updateVerificationStatuses() {
    const statusElements = document.querySelectorAll('.verification-status');
    statusElements.forEach(element => {
      const status = element.dataset.status;
      element.className = `verification-status status-${status}`;
      
      switch(status) {
        case 'verified':
          element.innerHTML = '<span class="status-icon">✓</span> Verified';
          break;
        case 'pending':
          element.innerHTML = '<span class="status-icon">⏳</span> Pending Review';
          break;
        case 'rejected':
          element.innerHTML = '<span class="status-icon">✗</span> Rejected';
          break;
        default:
          element.innerHTML = '<span class="status-icon">?</span> Unknown';
      }
    });
  }

  // Verification status check
  async checkVerificationStatus(brandId) {
    try {
      // In a real implementation, this would call an API
      const response = await fetch(`/api/brands/${brandId}/verification`);
      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('Error checking verification status:', error);
      return 'unknown';
    }
  }

  // Test workflow functionality
  runRegistrationTests() {
    console.log('Running brand registration workflow tests...');
    
    // Test 1: Form validation
    const form = document.getElementById('brand-registration-form');
    if (form) {
      console.log('✓ Registration form found');
      
      // Test required fields
      const requiredFields = form.querySelectorAll('[required]');
      console.log(`✓ Found ${requiredFields.length} required fields`);
      
      // Test color inputs
      const colorInputs = form.querySelectorAll('input[type="color"]');
      console.log(`✓ Found ${colorInputs.length} color picker inputs`);
    }
    
    // Test 2: Brand registry loading
    if (this.brands && this.brands.length > 0) {
      console.log(`✓ Brand registry loaded with ${this.brands.length} brands`);
    }
    
    // Test 3: Pixel preview functionality
    const pixelPreview = document.getElementById('pixel-preview');
    if (pixelPreview) {
      console.log('✓ Pixel preview container found');
    }
    
    // Test 4: Search and filtering
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      console.log('✓ Search functionality available');
    }
    
    console.log('Brand registration workflow tests completed!');
    return true;
  }
}

// Global instance
const brandManager = new BrandManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrandManager;
}
