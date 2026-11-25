/* ==========================================================================
   Natural Dhara — Shared Interactive Logic
   Handles: Mobile navigation, Enquiry/Cart Basket, Product qty selectors,
            Contact Enquiry Form submission & pre-fill.
   ========================================================================== */

(function () {
  const CART_KEY = 'natural_dhara_enquiry_cart_v1';

  const CATALOG = {
    '1l-bottle': { id: '1l-bottle', name: '1L Bottle (Kachi Ghani)', price: 210, unit: '1 Litre' },
    '5l-jar': { id: '5l-jar', name: '5L Family Jar (Kachi Ghani)', price: 999, unit: '5 Litres' },
    '15l-tin': { id: '15l-tin', name: '15L Bulk Tin (Kachi Ghani)', price: 2850, unit: '15 Litres' }
  };

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage restrictions
    }
    updateCartUI();
  }

  function formatINR(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN');
  }

  function showToast(message) {
    let toast = document.getElementById('nd-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'nd-toast';
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2600);
  }

  function addToCart(productId, qty) {
    const product = CATALOG[productId];
    if (!product) return;
    const quantity = Math.max(1, parseInt(qty, 10) || 1);
    const cart = getCart();
    const existing = cart.find((item) => item.id === productId);
    if (existing) {
      existing.qty += quantity;
    } else {
      cart.push({ ...product, qty: quantity });
    }
    saveCart(cart);
    showToast(`Added ${quantity} × ${product.name} to Enquiry Bag`);
    openDrawer();
  }

  function updateItemQty(productId, delta) {
    let cart = getCart();
    cart = cart
      .map((item) => (item.id === productId ? { ...item, qty: item.qty + delta } : item))
      .filter((item) => item.qty > 0);
    saveCart(cart);
  }

  function removeItem(productId) {
    const cart = getCart().filter((item) => item.id !== productId);
    saveCart(cart);
  }

  function updateCartUI() {
    const cart = getCart();
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = totalCount;
    });

    const drawerBody = document.getElementById('nd-drawer-body');
    const drawerTotal = document.getElementById('nd-drawer-total');
    const drawerProceed = document.getElementById('nd-drawer-proceed');

    if (drawerTotal) {
      drawerTotal.textContent = formatINR(totalAmount);
    }

    if (drawerProceed) {
      drawerProceed.style.display = cart.length > 0 ? 'inline-flex' : 'none';
    }

    if (drawerBody) {
      if (cart.length === 0) {
        drawerBody.innerHTML = `
          <div class="drawer-empty">
            <p><strong>Your Enquiry Bag is empty.</strong></p>
            <p style="margin-top:0.5rem;">Add our 1L Bottle (₹210), 5L Jar (₹999), or 15L Bulk Tin (₹2850) to request doorstep delivery or bulk pricing in Delhi NCR.</p>
            <a href="products.html" class="btn btn-primary btn-sm" style="margin-top:1rem;">Browse Mustard Oil Packs</a>
          </div>
        `;
      } else {
        drawerBody.innerHTML = cart
          .map(
            (item) => `
          <div class="drawer-item">
            <div class="drawer-item-info">
              <h4>${item.name}</h4>
              <span>${formatINR(item.price)} × ${item.qty} = <strong>${formatINR(item.price * item.qty)}</strong></span>
            </div>
            <div class="drawer-item-controls">
              <button type="button" class="drawer-qty-btn" data-qty-delta="-1" data-id="${item.id}" aria-label="Decrease quantity">-</button>
              <span style="min-width:20px;text-align:center;font-weight:600;">${item.qty}</span>
              <button type="button" class="drawer-qty-btn" data-qty-delta="1" data-id="${item.id}" aria-label="Increase quantity">+</button>
              <button type="button" class="drawer-remove" data-remove-id="${item.id}" aria-label="Remove item">Remove</button>
            </div>
          </div>
        `
          )
          .join('');
      }
    }

    syncContactPrefill();
  }

  function openDrawer() {
    const backdrop = document.getElementById('nd-drawer-backdrop');
    const drawer = document.getElementById('nd-cart-drawer');
    if (backdrop && drawer) {
      backdrop.classList.add('open');
      drawer.classList.add('open');
    }
  }

  function closeDrawer() {
    const backdrop = document.getElementById('nd-drawer-backdrop');
    const drawer = document.getElementById('nd-cart-drawer');
    if (backdrop && drawer) {
      backdrop.classList.remove('open');
      drawer.classList.remove('open');
    }
  }

  function syncContactPrefill() {
    const prefillBox = document.getElementById('contact-cart-prefill');
    const hiddenOrderInput = document.getElementById('order-summary-input');
    const packSelect = document.getElementById('pack-interest');
    if (!prefillBox) return;

    const cart = getCart();
    if (cart.length === 0) {
      prefillBox.style.display = 'none';
      if (hiddenOrderInput) hiddenOrderInput.value = '';
      return;
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const summaryLines = cart.map((item) => `${item.qty} × ${item.name} (${formatINR(item.price * item.qty)})`);
    prefillBox.style.display = 'block';
    prefillBox.innerHTML = `
      <strong>Selected from Enquiry Bag:</strong><br>
      ${summaryLines.join('<br>')}
      <div style="margin-top:0.4rem;"><strong>Estimated Total: ${formatINR(total)}</strong></div>
    `;

    if (hiddenOrderInput) {
      hiddenOrderInput.value = `${summaryLines.join(', ')} | Total: ${formatINR(total)}`;
    }

    if (packSelect && packSelect.value === '') {
      packSelect.value = 'Enquiry Bag Selection';
    }
  }

  function initNavigation() {
    const toggleBtn = document.getElementById('nd-menu-toggle');
    const navLinks = document.getElementById('nd-nav-links');
    if (toggleBtn && navLinks) {
      toggleBtn.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        toggleBtn.setAttribute('aria-expanded', String(isOpen));
      });
    }

    document.querySelectorAll('[data-open-cart]').forEach((btn) => {
      btn.addEventListener('click', openDrawer);
    });

    const backdrop = document.getElementById('nd-drawer-backdrop');
    const closeBtn = document.getElementById('nd-drawer-close');
    if (backdrop) backdrop.addEventListener('click', closeDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    document.addEventListener('click', (e) => {
      const qtyBtn = e.target.closest('[data-qty-delta]');
      if (qtyBtn) {
        updateItemQty(qtyBtn.dataset.id, parseInt(qtyBtn.dataset.qtyDelta, 10));
        return;
      }

      const removeBtn = e.target.closest('[data-remove-id]');
      if (removeBtn) {
        removeItem(removeBtn.dataset.removeId);
        return;
      }

      const cardQtyBtn = e.target.closest('[data-card-qty]');
      if (cardQtyBtn) {
        const container = cardQtyBtn.closest('.qty-action-row');
        const valueEl = container.querySelector('[data-qty-val]');
        let val = parseInt(valueEl.textContent, 10) || 1;
        val = Math.max(1, val + parseInt(cardQtyBtn.dataset.cardQty, 10));
        valueEl.textContent = val;
        return;
      }

      const addBtn = e.target.closest('[data-add-product]');
      if (addBtn) {
        const row = addBtn.closest('.qty-action-row');
        const qtyEl = row ? row.querySelector('[data-qty-val]') : null;
        const qty = qtyEl ? parseInt(qtyEl.textContent, 10) : 1;
        addToCart(addBtn.dataset.addProduct, qty);
      }
    });
  }

  function initContactForm() {
    const form = document.getElementById('nd-enquiry-form');
    const thankYouBox = document.getElementById('nd-thank-you');
    const resetBtn = document.getElementById('nd-new-enquiry-btn');
    if (!form || !thankYouBox) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('full-name');
      const phoneInput = document.getElementById('phone-number');
      const nameErr = document.getElementById('err-name');
      const phoneErr = document.getElementById('err-phone');

      let valid = true;

      if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
        nameErr.classList.add('visible');
        valid = false;
      } else {
        nameErr.classList.remove('visible');
      }

      const cleanedPhone = phoneInput.value.replace(/\D/g, '');
      if (cleanedPhone.length < 10) {
        phoneErr.classList.add('visible');
        valid = false;
      } else {
        phoneErr.classList.remove('visible');
      }

      if (!valid) return;

      const summaryEl = document.getElementById('nd-thank-you-details');
      const selectedPack = document.getElementById('pack-interest')?.value || 'General Enquiry';
      const city = document.getElementById('city-area')?.value || 'Delhi NCR';
      if (summaryEl) {
        summaryEl.textContent = `Reference: ${nameInput.value.trim()} (${city}) — ${selectedPack}`;
      }

      form.style.display = 'none';
      const prefillBox = document.getElementById('contact-cart-prefill');
      if (prefillBox) prefillBox.style.display = 'none';
      thankYouBox.classList.add('visible');

      // Clear cart after enquiry submission
      saveCart([]);
      form.reset();
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        thankYouBox.classList.remove('visible');
        form.style.display = 'block';
        syncContactPrefill();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initContactForm();
    updateCartUI();
  });
})();
