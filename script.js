const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');
const header = document.querySelector('.site-header');
const lightbox = document.querySelector('.lightbox');
const galleryButtons = [...document.querySelectorAll('.gallery-open')];
let activeImage = 0;

function setMenuOpen(isOpen) {
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  navigation.classList.toggle('is-open', isOpen);
  document.body.classList.toggle('menu-open', isOpen);
}

menuButton.addEventListener('click', () => {
  setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
});

navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenuOpen(false);
});

function syncHeader() {
  header.classList.toggle('is-scrolled', window.scrollY > 24);
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? Math.min(window.scrollY / scrollableHeight, 1) : 0;
  header.style.setProperty('--scroll-progress', `${progress * 100}%`);
}

const parallaxImages = [...document.querySelectorAll('.showcase-image, .final-image')];
const visibleParallaxImages = new Set();
const parallaxEnabled = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  && !window.matchMedia('(max-width: 700px)').matches;

function updateParallax() {
  visibleParallaxImages.forEach((image) => {
    const section = image.parentElement;
    const bounds = section.getBoundingClientRect();
    const offset = (bounds.top + bounds.height / 2 - window.innerHeight / 2) * -0.035;
    image.style.transform = `translate3d(0, ${offset}px, 0) scale(1.04)`;
  });
}

if (parallaxEnabled && 'IntersectionObserver' in window) {
  const parallaxObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visibleParallaxImages.add(entry.target);
      else visibleParallaxImages.delete(entry.target);
    });
    updateParallax();
  }, { rootMargin: '15% 0px' });

  parallaxImages.forEach((image) => parallaxObserver.observe(image));
}

let scrollPending = false;
window.addEventListener('scroll', () => {
  if (!scrollPending) {
    window.requestAnimationFrame(() => {
      syncHeader();
      if (parallaxEnabled && visibleParallaxImages.size) updateParallax();
      scrollPending = false;
    });
    scrollPending = true;
  }
}, { passive: true });
syncHeader();

const trackedLinks = [...navigation.querySelectorAll('a[href^="#"]')];
const trackedSections = trackedLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window) {
  const visibleSections = new Set();
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visibleSections.add(entry.target);
      else visibleSections.delete(entry.target);
    });

    const currentSection = [...visibleSections].sort((first, second) => {
      const firstDistance = Math.abs(first.getBoundingClientRect().top - window.innerHeight * 0.35);
      const secondDistance = Math.abs(second.getBoundingClientRect().top - window.innerHeight * 0.35);
      return firstDistance - secondDistance;
    })[0];

    trackedLinks.forEach((link) => {
      const isCurrent = currentSection && document.querySelector(link.getAttribute('href')) === currentSection;
      link.classList.toggle('is-active', Boolean(isCurrent));
      if (isCurrent) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });

  trackedSections.forEach((section) => sectionObserver.observe(section));
}

function showLightboxImage(index) {
  activeImage = (index + galleryButtons.length) % galleryButtons.length;
  const button = galleryButtons[activeImage];
  const image = button.querySelector('img');
  lightbox.querySelector('.lightbox-image').src = image.currentSrc || image.src;
  lightbox.querySelector('.lightbox-image').alt = image.alt;
  lightbox.querySelector('.lightbox-caption').textContent = button.dataset.caption;
}

galleryButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    showLightboxImage(index);
    lightbox.showModal();
  });
});

lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
lightbox.querySelector('.lightbox-prev').addEventListener('click', () => showLightboxImage(activeImage - 1));
lightbox.querySelector('.lightbox-next').addEventListener('click', () => showLightboxImage(activeImage + 1));
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    setMenuOpen(false);
    if (lightbox.open) lightbox.close();
  }
  if (!lightbox.open) return;
  if (event.key === 'ArrowLeft') showLightboxImage(activeImage - 1);
  if (event.key === 'ArrowRight') showLightboxImage(activeImage + 1);
});

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('js-ready');
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.13, rootMargin: '0px 0px -4% 0px' });

  document.querySelectorAll('.section-label, .about-copy, .service-row, .showcase-content, .benefit-row, .gallery-photo, .contact-copy, .contact-map, .final-content').forEach((element) => {
    element.classList.add('reveal');
    observer.observe(element);
  });

  observer.observe(document.querySelector('.about-image'));
}