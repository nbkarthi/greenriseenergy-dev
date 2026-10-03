/**
 * Greenrise Energy Solutions - Main JavaScript
 * Handles: Navigation, Smooth Scroll, Counter Animation, Form Handling
 */

(function() {
  'use strict';

  // ==========================================
  // DOM Elements
  // ==========================================
  const header = document.querySelector('.header');
  const menuToggle = document.querySelector('.menu-toggle');
  const navMobile = document.querySelector('.nav-mobile');
  const navLinks = document.querySelectorAll('.nav-link');
  const animateElements = document.querySelectorAll('.animate-on-scroll');

  // ==========================================
  // Header Scroll Effect
  // ==========================================
  function handleHeaderScroll() {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  // ==========================================
  // Mobile Navigation Toggle
  // ==========================================
  function toggleMobileMenu() {
    if (menuToggle) {
      menuToggle.classList.toggle('active');
      var expanded = menuToggle.classList.contains('active');
      menuToggle.setAttribute('aria-expanded', expanded);
    }
    if (navMobile) {
      navMobile.classList.toggle('active');
      document.body.style.overflow = navMobile.classList.contains('active') ? 'hidden' : '';
    }
  }

  function closeMobileMenu() {
    if (menuToggle) {
      menuToggle.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
    if (navMobile) {
      navMobile.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // ==========================================
  // Smooth Scroll for Anchor Links
  // ==========================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');

        // Skip if it's just "#"
        if (href === '#') {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          closeMobileMenu();
          return;
        }

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const headerHeight = header.offsetHeight;
          const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          closeMobileMenu();
        }
      });
    });
  }

  // ==========================================
  // Scroll-triggered Animations
  // ==========================================
  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    animateElements.forEach(el => observer.observe(el));
  }

  // ==========================================
  // Form Handling
  // ==========================================
  // Leads POST to the same CRM endpoint campaign/index.html uses. That page's
  // payload only proves name/phone_no/bill_amount/city/source/utm_*/visitor_id/
  // cf-turnstile-response — email and message aren't part of any schema we've
  // seen confirmed, so they're included on the stated understanding that the
  // first real submission's response tells us whether those field names are
  // right. If the API starts rejecting them, that's the signal to fix the names,
  // not a guess made twice.
  //
  // TODO: confirm with a real /api/leads submission that `email` and `message`
  // are the correct field names (or find out they're dropped/rejected and fix
  // them). Do a real submission, check the Network tab response, update this
  // payload if the API disagrees. Tracked here until confirmed.
  const LEADS_API_URL = 'https://app.greenriseenergy.com/api/leads';

  function getVisitorId() {
    let id;
    try {
      id = localStorage.getItem('gr_visitor_id');
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('gr_visitor_id', id);
      }
    } catch (e) {
      id = crypto.randomUUID();
    }
    return id;
  }

  function initContactForm() {
    const form = document.getElementById('contact-form');
    const successPanel = document.getElementById('contact-form-success');
    if (!form) return;

    const submitBtn = document.getElementById('contact-submit-btn');
    const submitLabel = submitBtn ? submitBtn.querySelector('span') : null;

    function resetSubmitBtn() {
      if (submitBtn) submitBtn.disabled = false;
      if (submitLabel) submitLabel.textContent = 'Submit';
    }

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      if (!data.name || !data.email || !data.phone || !data.city || !data.message) {
        showNotification('Please fill in all required fields.', 'error');
        return;
      }

      if (!isValidEmail(data.email)) {
        showNotification('Please enter a valid email address.', 'error');
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      if (submitLabel) submitLabel.textContent = 'Sending...';

      const turnstileToken = form.querySelector('[name="cf-turnstile-response"]')?.value || '';
      const utm = new URLSearchParams(window.location.search);

      const payload = {
        name: data.name,
        phone_no: data.phone,
        bill_amount: null,
        city: data.city,
        email: data.email,
        message: data.message,
        project_type: data['project-type'] || null,
        source: 'website_contact',
        utm_source: utm.get('utm_source') || null,
        utm_medium: utm.get('utm_medium') || null,
        utm_campaign: utm.get('utm_campaign') || null,
        visitor_id: getVisitorId(),
        'cf-turnstile-response': turnstileToken,
      };

      try {
        const response = await fetch(LEADS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          form.hidden = true;
          if (successPanel) successPanel.hidden = false;
        } else if (response.status === 403) {
          showNotification('Human verification failed. Please complete the checkbox and try again.', 'error');
          if (window.turnstile) window.turnstile.reset();
          resetSubmitBtn();
        } else {
          let errorMessage = 'Oops! There was a problem submitting your form.';
          try {
            const errorData = await response.json();
            if (errorData && errorData.detail) {
              if (typeof errorData.detail === 'string') {
                errorMessage = errorData.detail;
              } else if (Array.isArray(errorData.detail)) {
                errorMessage = errorData.detail.map(err => {
                  const field = err.loc && err.loc.length > 0 ? err.loc[err.loc.length - 1] : 'Error';
                  return `${field}: ${err.msg}`;
                }).join('\n');
              }
            }
          } catch (e) {
            // Ignore JSON parse errors and use the default message
          }
          showNotification(errorMessage, 'error');
          resetSubmitBtn();
        }
      } catch (error) {
        showNotification('Oops! There was a network error. Please try again.', 'error');
        resetSubmitBtn();
      }
    });
  }

  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function showNotification(message, type) {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button class="notification-close">&times;</button>
    `;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      padding: 16px 24px;
      background-color: ${type === 'success' ? '#1B4332' : '#B3261E'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 16px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    // Add close button styles
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    `;

    document.body.appendChild(notification);

    // Close functionality
    closeBtn.addEventListener('click', () => notification.remove());

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }

  // ==========================================
  // Active Navigation Link
  // ==========================================
  function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.scrollY;

    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - header.offsetHeight - 100;
      const sectionId = section.getAttribute('id');
      const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLinks.forEach(link => link.classList.remove('active'));
        if (navLink) navLink.classList.add('active');
      }
    });
  }

  // ==========================================
  // Lazy Loading Images
  // ==========================================
  function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  // ==========================================
  // Add Animation Keyframes to DOM
  // ==========================================
  function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      .nav-link.active {
        color: var(--color-primary);
      }

      .nav-link.active::after {
        width: 100%;
      }
    `;
    document.head.appendChild(style);
  }

  // ==========================================
  // Initialize All Functions
  // ==========================================
  function init() {
    // Add animation styles
    addAnimationStyles();

    // Event listeners
    window.addEventListener('scroll', handleHeaderScroll);
    window.addEventListener('scroll', updateActiveNavLink);

    if (menuToggle) {
      menuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Close mobile menu on link click (desktop + mobile nav links)
    navLinks.forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });
    document.querySelectorAll('.nav-mobile-menu .nav-link').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });

    // Close mobile menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMobile && navMobile.classList.contains('active')) {
        closeMobileMenu();
      }
    });

    // Initialize features
    initSmoothScroll();
    initScrollAnimations();
    initContactForm();
    initLazyLoading();

    // Initial scroll check
    handleHeaderScroll();
  }

  // ==========================================
  // Run on DOM Ready
  // ==========================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();