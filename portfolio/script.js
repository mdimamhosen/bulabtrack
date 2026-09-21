(() => {
  const state = {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    isMobile: window.matchMedia('(max-width: 768px)').matches,
  };

  if (window.gsap) {
    gsap.registerPlugin(ScrollTrigger);
  }

  function toSection(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: state.reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }

  function initLoader() {
    document.body.classList.add('ready');
  }

  function closeArrival() {
    const arrival = document.getElementById('arrival');
    if (!arrival) return;
    arrival.setAttribute('aria-hidden', 'true');
    arrival.style.pointerEvents = 'none';
    if (!window.gsap || state.reducedMotion) {
      arrival.style.display = 'none';
      return;
    }
    const tl = gsap.timeline({ onComplete: () => (arrival.style.display = 'none') });
    tl.to('.arrival-panels span:first-child', { xPercent: -100, duration: 1.1, ease: 'power3.inOut' }, 0)
      .to('.arrival-panels span:last-child', { xPercent: 100, duration: 1.1, ease: 'power3.inOut' }, 0)
      .to('#arrival .arrival-content', { opacity: 0, y: -30, duration: 0.5 }, 0);
  }

  function initEntrance() {
    const enter = document.getElementById('enter-site');
    const skip = document.getElementById('skip-intro');
    enter?.addEventListener('click', closeArrival);
    skip?.addEventListener('click', closeArrival);
  }

  function initNavigation() {
    const toggle = document.getElementById('plan-toggle');
    const overlay = document.getElementById('floor-plan-overlay');
    const close = document.querySelector('.overlay-close');
    const navButtons = overlay?.querySelectorAll('[data-target]') || [];

    const closeOverlay = () => {
      overlay.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle?.addEventListener('click', () => {
      overlay.hidden = !overlay.hidden;
      toggle.setAttribute('aria-expanded', String(!overlay.hidden));
    });

    close?.addEventListener('click', closeOverlay);

    navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        toSection(btn.dataset.target);
        closeOverlay();
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.hidden) closeOverlay();
    });
  }

  function setRoom(roomId) {
    document.querySelectorAll('[data-room-highlight]').forEach((rect) => rect.classList.remove('active'));
    const map = {
      entrance: 'gallery',
      hero: 'gallery',
      gallery: 'gallery',
      office: 'office',
      engine: 'engine',
      library: 'library',
      about: 'about',
      rooftop: 'rooftop',
      contact: 'contact',
    };
    const key = map[roomId] || roomId;
    const target = document.querySelector(`[data-room-highlight="${key}"]`);
    if (target) target.classList.add('active');
  }

  function initFloorPlan() {
    const rooms = document.querySelectorAll('.room, header.room-hero');
    if (!window.gsap || state.reducedMotion) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setRoom(entry.target.id);
          });
        },
        { threshold: 0.45 }
      );
      rooms.forEach((r) => observer.observe(r));
      return;
    }

    rooms.forEach((room) => {
      ScrollTrigger.create({
        trigger: room,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => setRoom(room.id),
        onEnterBack: () => setRoom(room.id),
      });
    });
  }

  function initHero() {
    if (!window.gsap || state.reducedMotion) return;
    gsap.from('#facade-svg .stroke-layer *', {
      drawSVG: 0,
      duration: 1.2,
      stagger: 0.03,
      ease: 'power1.out',
    });
    gsap.from('.room-hero h2 span', { yPercent: 40, opacity: 0, duration: 0.9, stagger: 0.09 });
    gsap.from('.hero-role, .hero-desc', { y: 20, opacity: 0, duration: 0.7, delay: 0.3 });
  }

  function initGallery() {
    if (!window.gsap || state.reducedMotion) return;
    gsap.utils.toArray('.project').forEach((card) => {
      gsap.from(card, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        scrollTrigger: { trigger: card, start: 'top 88%' },
      });
    });
  }

  function initProjects() {
    const projects = document.querySelectorAll('.project');
    projects.forEach((project) => {
      project.addEventListener('mouseenter', () => project.classList.add('active'));
      project.addEventListener('mouseleave', () => project.classList.remove('active'));
    });
  }

  function initExperience() {
    if (!window.gsap || state.reducedMotion) return;
    gsap.from('.beam', {
      scaleY: 0,
      transformOrigin: 'top',
      duration: 1,
      scrollTrigger: { trigger: '#office', start: 'top 70%' },
    });
    gsap.from('.timeline-wrap li', {
      x: 60,
      opacity: 0,
      stagger: 0.16,
      duration: 0.7,
      scrollTrigger: { trigger: '.timeline-wrap', start: 'top 75%' },
    });
  }

  function initEngineRoom() {
    if (!window.gsap || state.reducedMotion) return;
    gsap.from('#engine-svg .nodes rect, #engine-svg .nodes text', {
      opacity: 0,
      y: 12,
      duration: 0.6,
      stagger: 0.04,
      scrollTrigger: { trigger: '#engine', start: 'top 70%' },
    });

    const packetPath = document.querySelector('#engine-svg .links path:last-child');
    if (packetPath) {
      const len = packetPath.getTotalLength();
      gsap.fromTo(
        '#data-packet',
        { x: 0 },
        {
          motionPath: {
            path: '#engine-svg .links path',
            align: '#engine-svg .links path',
            autoRotate: false,
            alignOrigin: [0.5, 0.5],
          },
          duration: 4.8,
          repeat: -1,
          ease: 'none',
          modifiers: {
            x: (value) => value,
          },
          scrollTrigger: {
            trigger: '#engine',
            start: 'top 90%',
            toggleActions: 'play pause resume pause',
          },
        }
      );
      if (!window.MotionPathPlugin) {
        gsap.to('#data-packet', {
          cx: 610,
          duration: 1.8,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
          scrollTrigger: {
            trigger: '#engine',
            start: 'top 90%',
            toggleActions: 'play pause resume pause',
          },
        });
      }
    }
  }

  function initTechLibrary() {
    if (!window.gsap || state.reducedMotion) return;
    gsap.from('.stack-group', {
      y: 45,
      opacity: 0,
      stagger: 0.1,
      duration: 0.8,
      scrollTrigger: { trigger: '#library', start: 'top 75%' },
    });
  }

  function initAbout() {
    if (!window.gsap || state.reducedMotion) return;
    gsap.from('.about-statement', {
      opacity: 0,
      y: 45,
      duration: 0.8,
      scrollTrigger: { trigger: '#about', start: 'top 72%' },
    });
    gsap.from('.principles li', {
      x: -30,
      opacity: 0,
      stagger: 0.14,
      duration: 0.65,
      scrollTrigger: { trigger: '.principles', start: 'top 82%' },
    });
  }

  function initRooftop() {
    if (!window.gsap || state.reducedMotion) return;
    gsap.from('#rooftop-svg circle', {
      scale: 0.75,
      opacity: 0,
      transformOrigin: 'center',
      stagger: 0.08,
      duration: 0.8,
      scrollTrigger: { trigger: '#rooftop', start: 'top 76%' },
    });
    gsap.to('#rooftop-svg path', {
      strokeDasharray: '8 12',
      strokeDashoffset: 100,
      repeat: -1,
      duration: 8,
      ease: 'none',
      scrollTrigger: { trigger: '#rooftop', start: 'top 90%', toggleActions: 'play pause resume pause' },
    });
  }

  function initContact() {
    const door = document.getElementById('contact-door');
    const panel = door?.querySelector('.door-panel');
    const links = document.getElementById('contact-links');
    if (!door || !panel || !links) return;

    door.addEventListener('mouseenter', () => {
      if (state.reducedMotion || !window.gsap) return;
      gsap.to(panel, { rotateY: -10, duration: 0.35 });
    });

    door.addEventListener('mouseleave', () => {
      if (state.reducedMotion || !window.gsap) return;
      gsap.to(panel, { rotateY: 0, duration: 0.35 });
    });

    door.addEventListener('click', () => {
      const expanded = door.getAttribute('aria-expanded') === 'true';
      door.setAttribute('aria-expanded', String(!expanded));
      links.hidden = expanded;
      if (!window.gsap || state.reducedMotion) return;
      gsap.to(panel, { rotateY: expanded ? 0 : -34, transformPerspective: 700, duration: 0.8, ease: 'power2.out' });
      gsap.fromTo(
        '#contact-links > *',
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, delay: expanded ? 0 : 0.15 }
      );
    });
  }

  function initCursor() {
    const cursor = document.getElementById('architectural-cursor');
    if (!cursor || state.isMobile || state.reducedMotion) {
      cursor?.remove();
      return;
    }
    const label = cursor.querySelector('.cursor-label');
    window.addEventListener('mousemove', (e) => {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    });
    document.querySelectorAll('[data-cursor]').forEach((item) => {
      item.addEventListener('mouseenter', () => (label.textContent = item.dataset.cursor || ''));
      item.addEventListener('mouseleave', () => (label.textContent = ''));
    });
  }

  function initResponsiveAnimations() {
    if (!window.gsap || state.reducedMotion) return;

    ScrollTrigger.create({
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        const stages = document.querySelectorAll('.transform-stage');
        const progress = self.progress;
        stages.forEach((s) => s.classList.remove('active'));
        const index = progress < 0.25 ? 0 : progress < 0.5 ? 1 : progress < 0.75 ? 2 : 3;
        stages[index]?.classList.add('active');
      },
    });

    gsap.utils.toArray('.room').forEach((room) => {
      const light = room.querySelector('.room-light');
      if (!light) return;
      gsap.to(light, {
        opacity: 1,
        duration: 1,
        scrollTrigger: { trigger: room, start: 'top 70%', toggleActions: 'play reverse play reverse' },
      });
    });

    if (!state.isMobile) {
      gsap.to('.room-hero .hero-svg-wrap', {
        yPercent: -10,
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
      });
    }
  }

  function initReducedMotion() {
    if (!state.reducedMotion) return;
    document.body.classList.add('reduced-motion');
    const arrival = document.getElementById('arrival');
    if (arrival) arrival.style.display = 'none';
  }

  function initToggles() {
    const blueprint = document.getElementById('blueprint-toggle');
    const theme = document.getElementById('theme-toggle');

    blueprint?.addEventListener('click', () => {
      const active = document.body.classList.toggle('blueprint');
      blueprint.setAttribute('aria-pressed', String(active));
      blueprint.textContent = active ? 'NORMAL MODE' : 'BLUEPRINT';
    });

    theme?.addEventListener('click', () => {
      const active = document.body.classList.toggle('night');
      theme.setAttribute('aria-pressed', String(active));
    });
  }

  function initRoomScroll() {
    if (!window.gsap || state.reducedMotion) return;
    gsap.from('#gallery', {
      clipPath: 'inset(0 0 100% 0)',
      duration: 1.2,
      ease: 'power2.out',
      scrollTrigger: { trigger: '#gallery', start: 'top 88%' },
    });
  }

  function initApp() {
    initLoader();
    initReducedMotion();
    initEntrance();
    initNavigation();
    initFloorPlan();
    initHero();
    initGallery();
    initProjects();
    initExperience();
    initEngineRoom();
    initTechLibrary();
    initAbout();
    initRooftop();
    initContact();
    initCursor();
    initResponsiveAnimations();
    initRoomScroll();
    initToggles();
  }

  document.addEventListener('DOMContentLoaded', initApp);
})();
