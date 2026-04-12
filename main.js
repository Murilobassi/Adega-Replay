/**
 * ADEGA REPLAY — main.js
 * Seguro: sem eval(), sem innerHTML com dados externos,
 * sem event listeners delegados para inputs não confiáveis.
 */

'use strict';

/* ══════════════════════════════════
   DETECÇÃO MOBILE & OTIMIZAÇÕES
══════════════════════════════════ */
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  || (window.innerWidth <= 768);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// No mobile, pausa o vídeo do hero (o global já cobre o fundo)
if (isMobile) {
  document.addEventListener('DOMContentLoaded', () => {
    const heroVideo = document.querySelector('.hero__video');
    if (heroVideo) {
      heroVideo.pause();
      heroVideo.removeAttribute('autoplay');
      heroVideo.style.display = 'none';
    }
  });
}

/* ══════════════════════════════════
   INTRO SPLASH
══════════════════════════════════ */
(function initIntro() {
  const intro = document.getElementById('intro');
  const disc  = document.getElementById('introDisc');
  const sub    = document.getElementById('introSub');
  const slogan = document.getElementById('introSlogan');
  const hint   = document.getElementById('introHint');
  if (!intro || !disc) return;

  // Se já viu a intro nessa sessão, remove imediatamente
  if (sessionStorage.getItem('ar_intro_done') === '1') {
    intro.remove();
    return;
  }

  // Esconde o resto do site durante a intro para revelar depois!
  document.body.classList.add('intro-active');
  document.body.style.overflow = 'hidden';

  function burst() {
    if (hint)   hint.classList.add('gone');
    if (sub)    sub.classList.add('gone');
    if (slogan) slogan.classList.add('gone');

    // FLIP Animation Setup: Calcula onde a logo do header está
    const targetEl = document.querySelector('.nav__logo-img');
    if (!targetEl) return;
    const targetRect = targetEl.getBoundingClientRect();
    const startRect = disc.getBoundingClientRect();
    
    // Calcula viagem do centro da tela para o centro do espaço destino
    const travelX = (targetRect.left + targetRect.width / 2) - (startRect.left + startRect.width / 2);
    const travelY = (targetRect.top + targetRect.height / 2) - (startRect.top + startRect.height / 2);
    
    // Qual escala a bola da intro precisa ficar igual à bola do header?
    const finalScale = targetRect.width / startRect.width;
    
    // Passa esses valores pro CSS
    disc.style.setProperty('--travel-x', `${travelX}px`);
    disc.style.setProperty('--travel-y', `${travelY}px`);
    disc.style.setProperty('--final-scale', finalScale);

    // Dispara animação de expansão e retorno (yo-yo)
    disc.classList.add('yo-yo');

    // Aos 40% (aprox 1300ms de 3200ms), a logo cobre tudo. 
    // O fundo preto do overlay apaga para revelar o vídeo atrás da logo quando ela encolher!
    setTimeout(() => {
        intro.style.background = 'transparent';
    }, 1300);

    // Fim da viagem: logo estacionou no canto, removemos ela do DOM 
    // revelando o verdadeiro header embaixo, e o site todo aparece suave!
    setTimeout(() => {
      intro.remove();
      document.body.classList.remove('intro-active');
      document.body.style.overflow = '';
      sessionStorage.setItem('ar_intro_done', '1');
      // Título Split Text drop down
      document.querySelectorAll('.hero__title .char').forEach(c => c.classList.add('visible'));
    }, 3200);
  }

  intro.addEventListener('click', burst);
  intro.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') burst();
  });
})();




/* ══════════════════════════════════
   CANVAS — PARTÍCULAS
══════════════════════════════════ */
(function initParticles() {
  // Desabilita partículas no mobile para economizar GPU/memória
  if (isMobile || prefersReducedMotion) {
    const c = document.getElementById('particlesCanvas');
    if (c) c.style.display = 'none';
    return;
  }

  const canvas = document.getElementById('particlesCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [];
  const COUNT = 40; // Reduzido de 60

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  function randomParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(Math.random() * 0.4 + 0.1),
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.7 ? '200,16,46' : '245,240,235',
    };
  }

  for (let i = 0; i < COUNT; i++) particles.push(randomParticle());

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.0015;

      if (p.alpha <= 0 || p.y < -10) {
        particles[i] = randomParticle();
        particles[i].y = H + 10;
      }
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ══════════════════════════════════
   HEADER SCROLL
══════════════════════════════════ */
(function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ══════════════════════════════════
   BURGER MENU
══════════════════════════════════ */
(function initBurger() {
  const burger   = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');
  if (!burger || !navLinks) return;

  let isOpen = false;

  function toggle() {
    isOpen = !isOpen;
    burger.classList.toggle('open', isOpen);
    navLinks.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  burger.addEventListener('click', toggle);

  // Fecha ao clicar num link
  navLinks.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      if (isOpen) toggle();
    });
  });

  // Fecha com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) toggle();
  });
})();

/* ══════════════════════════════════
   CARROSSEIS
══════════════════════════════════ */
/* ══════════════════════════════════
   CARROSSEIS (INFINITOS E CONTÍNUOS)
══════════════════════════════════ */
(function initCarousels() {
  const SPEED = isMobile ? 0.8 : 1.0; // Ajustado para 0.8 no mobile
  
  const tracks = document.querySelectorAll('.carousel__track');
  if (!tracks.length) return;

  const instances = [];

  function setupTrack(track) {
    const originalItems = [...track.children];
    if (!originalItems.length) return;

    // Marca itens originais para poder identificá-los depois
    originalItems.forEach(item => item.setAttribute('data-original', 'true'));

    // Garante que o conteúdo seja suficiente para preencher a tela + loop
    function cloneUntilFill() {
      const containerWidth = track.parentElement.getBoundingClientRect().width;
      let currentWidth = track.scrollWidth;
      
      while (currentWidth < containerWidth * 2 || track.children.length < originalItems.length * 2) {
        originalItems.forEach(item => {
          const clone = item.cloneNode(true);
          clone.removeAttribute('data-original');
          track.appendChild(clone);
        });
        currentWidth = track.scrollWidth;
      }
    }

    cloneUntilFill();

    const gapPx = parseFloat(getComputedStyle(track).gap) || 16;
    const totalWidth = track.scrollWidth;
    const itemCount = track.children.length;
    const originalCount = originalItems.length;
    
    const threshold = (totalWidth + gapPx) / (itemCount / originalCount);

    instances.push({
      el: track,
      x: 0,
      threshold: threshold,
      originalItems: originalItems
    });
  }

  tracks.forEach(setupTrack);

  function animate() {
    instances.forEach(ins => {
      ins.x += SPEED;
      if (ins.x >= ins.threshold) {
        ins.x -= ins.threshold;
      }
      ins.el.style.transform = `translateX(-${ins.x}px)`;
    });
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  // Recalcula em resize SEM recarregar a página
  // Usa debounce longo + ignora resizes pequenos (barras do navegador mobile)
  let resizeTimer;
  let lastWidth = window.innerWidth;
  
  window.addEventListener('resize', () => {
    // Ignora mudanças apenas na altura (barra de endereço mobile)
    const newWidth = window.innerWidth;
    if (Math.abs(newWidth - lastWidth) < 50) return;
    lastWidth = newWidth;

    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Re-mede os thresholds sem recarregar
      instances.forEach(ins => {
        // Remove clones antigos
        const allItems = [...ins.el.children];
        allItems.forEach(item => {
          if (!item.hasAttribute('data-original')) {
            item.remove();
          }
        });

        // Re-clona
        const containerWidth = ins.el.parentElement.getBoundingClientRect().width;
        let currentWidth = ins.el.scrollWidth;
        while (currentWidth < containerWidth * 2 || ins.el.children.length < ins.originalItems.length * 2) {
          ins.originalItems.forEach(item => {
            const clone = item.cloneNode(true);
            clone.removeAttribute('data-original');
            ins.el.appendChild(clone);
          });
          currentWidth = ins.el.scrollWidth;
        }

        // Re-calcula threshold
        const gapPx = parseFloat(getComputedStyle(ins.el).gap) || 16;
        const totalWidth = ins.el.scrollWidth;
        const itemCount = ins.el.children.length;
        const originalCount = ins.originalItems.length;
        ins.threshold = (totalWidth + gapPx) / (itemCount / originalCount);
        ins.x = 0;
      });
    }, 800);
  }, { passive: true });
})();

/* ══════════════════════════════════
   REVEAL ON SCROLL
══════════════════════════════════ */
(function initReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
})();

/* ══════════════════════════════════
   CONTADORES ANIMADOS (STATS)
══════════════════════════════════ */
(function initCounters() {
  const counters = document.querySelectorAll('.stat-card__num[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el      = entry.target;
      const target  = parseFloat(el.dataset.count);
      const dec     = parseInt(el.dataset.dec || '0');
      const dur     = 1800; // ms
      const start   = performance.now();

      function tick(now) {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / dur, 1);
        // ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const value  = eased * target;
        el.textContent = dec > 0 ? value.toFixed(dec) : Math.floor(value).toString();
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = dec > 0 ? target.toFixed(dec) : target.toString();
      }
      requestAnimationFrame(tick);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
})();

/* ══════════════════════════════════
   BACK TO TOP
══════════════════════════════════ */
(function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ══════════════════════════════════
   ACTIVE NAV LINK
══════════════════════════════════ */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav__link[href^="#"]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav__link[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
})();

/* ══════════════════════════════════
   SPLIT TEXT — HERO TITLE
══════════════════════════════════ */
(function initSplitText() {
  const rows = document.querySelectorAll('.hero__title-row');
  if (!rows.length) return;

  let charIndex = 0;
  rows.forEach((row) => {
    const text = row.textContent.trim();
    row.textContent = '';
    [...text].forEach((char) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.setProperty('--ci', charIndex);
      row.appendChild(span);
      charIndex++;
    });
    charIndex += 3;
  });

  // Só auto-dispara em visitas subsequentes (intro já foi vista)
  if (sessionStorage.getItem('ar_intro_done') === '1') {
    setTimeout(() => {
      document.querySelectorAll('.hero__title .char').forEach(c => c.classList.add('visible'));
    }, 350);
  }
  // Caso contrário, initIntro() vai acionar o reveal após o clique
})();

/* ══════════════════════════════════
   MOUSE PARALLAX — HERO
══════════════════════════════════ */
(function initHeroParallax() {
  if ('ontouchstart' in window) return;

  const hero = document.querySelector('.hero');
  if (!hero) return;

  const video   = hero.querySelector('.hero__video');
  const content = hero.querySelector('.hero__content');
  const glow1   = hero.querySelector('.hero__glow--1');
  const glow2   = hero.querySelector('.hero__glow--2');

  let mx = 0, my = 0, cx = 0, cy = 0;

  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    mx = (e.clientX - r.left)  / r.width  - 0.5;
    my = (e.clientY - r.top)   / r.height - 0.5;
  });

  hero.addEventListener('mouseleave', () => { mx = 0; my = 0; });

  (function tick() {
    cx += (mx - cx) * 0.055;
    cy += (my - cy) * 0.055;

    if (video)   video.style.transform   = `scale(1.1) translate(${cx * 24}px, ${cy * 16}px)`;
    if (content) content.style.transform = `translate(${cx * -11}px, ${cy * -7}px)`;
    if (glow1)   glow1.style.transform   = `translateX(calc(-50% + ${cx * 55}px)) translateY(${cy * 40}px)`;
    if (glow2)   glow2.style.transform   = `translate(${cx * -35}px, ${cy * -22}px)`;

    requestAnimationFrame(tick);
  })();
})();

/* ══════════════════════════════════
   BOTÕES MAGNÉTICOS
══════════════════════════════════ */
(function initMagneticButtons() {
  if ('ontouchstart' in window) return;

  document.querySelectorAll('.btn--primary, .btn--lg, .btn--whatsapp, .nav__link--cta').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const r  = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width  / 2);
      const dy = e.clientY - (r.top  + r.height / 2);
      btn.style.transition = 'transform 0.12s ease';
      btn.style.transform  = `translate(${dx * 0.32}px, ${dy * 0.32}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transition = 'transform 0.65s cubic-bezier(0.23, 1, 0.32, 1)';
      btn.style.transform  = 'translate(0, 0)';
    });

    btn.addEventListener('transitionend', () => {
      if (btn.style.transform === 'translate(0, 0)') btn.style.transform = '';
    });
  });
})();

/* ══════════════════════════════════
   3D TILT — CARDS
══════════════════════════════════ */
(function initCardTilt() {
  if ('ontouchstart' in window) return;

  document.querySelectorAll('.carousel__item, .loja-card, .review-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r  = card.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
      const dy = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
      const lift = card.classList.contains('carousel__item') ? '-8px' : '-5px';
      card.style.transition = 'transform 0.1s ease, box-shadow 0.25s, border-color 0.25s';
      card.style.transform  = `perspective(900px) rotateX(${-dy * 9}deg) rotateY(${dx * 9}deg) translateY(${lift}) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.65s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.35s, border-color 0.35s';
      card.style.transform  = '';
    });
  });
})();

/* ══════════════════════════════════
   FILM GRAIN OVERLAY
══════════════════════════════════ */
(function initFilmGrain() {
  // Film grain é extremamente pesado no mobile — desabilita
  if (isMobile || prefersReducedMotion) return;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = [
    'position:fixed', 'inset:0', 'width:100%', 'height:100%',
    'z-index:9997', 'pointer-events:none',
    'opacity:0.038', 'mix-blend-mode:overlay'
  ].join(';');
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = Math.round(window.innerWidth  * 0.55);
    H = canvas.height = Math.round(window.innerHeight * 0.55);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  const INTERVAL = 70;
  let last = 0;

  (function grain(ts) {
    if (ts - last > INTERVAL) {
      const img  = ctx.createImageData(W, H);
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        data[i] = data[i + 1] = data[i + 2] = v;
        data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      last = ts;
    }
    requestAnimationFrame(grain);
  })(0);
})();

