document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. THREE.JS MAGICAL SNOWY ARCTIC & INTERACTIVE PHYSICS
    // ==========================================
    let scene, camera, renderer;
    let snowParticles, frostCrystal1, frostCrystal2, sparkleSystem;
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    let mouseHasEntered = false;

    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let scrollPercent = 0;

    const flakeCount = window.innerWidth < 768 ? 2200 : 5000;
    const flakePositions = new Float32Array(flakeCount * 3);
    const flakeSizes    = new Float32Array(flakeCount);
    const flakeVelocities = [];

    // Wind gust state
    let windX = 0, windTarget = 0;
    let windTimer = 0;

    // Interactive Sparkle Particles setup
    const maxSparkles = 350;
    const sparklePositions = new Float32Array(maxSparkles * 3);
    const sparkleVelocities = [];
    const sparkleLifes = new Float32Array(maxSparkles);
    let sparkleIndex = 0;

    function initWebGL() {
        const canvas = document.getElementById('webgl-canvas');
        if (!canvas || typeof THREE === 'undefined') return;

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 25;

        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // --- ARCTIC LIGHTING ---
        const ambientLight = new THREE.AmbientLight(0x0f172a, 2.5);
        scene.add(ambientLight);

        const cyanLight = new THREE.PointLight(0x00f2fe, 4, 70);
        cyanLight.position.set(15, 20, 10);
        scene.add(cyanLight);

        const emeraldLight = new THREE.PointLight(0x00ffcc, 3.5, 70);
        emeraldLight.position.set(-15, 15, 10);
        scene.add(emeraldLight);

        // --- ENDLESS MAGICAL SNOWFALL PARTICLES ---
        const snowGeo = new THREE.BufferGeometry();
        const colors = new Float32Array(flakeCount * 3);

        const colorPureWhite = new THREE.Color(0xffffff);
        const colorIceCyan   = new THREE.Color(0xe0f7fa);
        const colorSoftBlue  = new THREE.Color(0xbae6fd);
        const colorFrostGlow = new THREE.Color(0xa5f3fc); // extra ice blue

        for (let i = 0; i < flakeCount * 3; i += 3) {
            const fi = i / 3;
            // Spread flakes across a wide deep field
            flakePositions[i]     = (Math.random() - 0.5) * 160;
            flakePositions[i + 1] = (Math.random() - 0.5) * 140;
            flakePositions[i + 2] = (Math.random() - 0.5) * 120;

            // Z-depth-based sizing: flakes closer to camera are bigger
            const depth = (flakePositions[i + 2] + 60) / 120; // 0 far, 1 close
            flakeSizes[fi] = 0.18 + depth * 0.65; // 0.18 to 0.83

            flakeVelocities.push({
                // Heavier near-camera flakes fall faster (depth-layered)
                speedY:    0.04 + depth * 0.22 + Math.random() * 0.14,
                swaySpeed: 0.5  + Math.random() * 2.0,
                swayAmp:   0.04 + Math.random() * 0.20, // broader sway
                offset:    Math.random() * Math.PI * 2,
                // Individual turbulence factors
                turbX:     (Math.random() - 0.5) * 0.012,
                turbY:     (Math.random() - 0.5) * 0.006,
                vx: 0, vy: 0
            });

            const r = Math.random();
            const col = r > 0.8 ? colorSoftBlue
                      : r > 0.55 ? colorFrostGlow
                      : r > 0.3  ? colorIceCyan
                      : colorPureWhite;
            colors[i] = col.r; colors[i+1] = col.g; colors[i+2] = col.b;
        }

        snowGeo.setAttribute('position', new THREE.BufferAttribute(flakePositions, 3));
        snowGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

        snowParticles = new THREE.Points(snowGeo, new THREE.PointsMaterial({
            size: 0.55, vertexColors: true, transparent: true,
            opacity: 0.92, blending: THREE.AdditiveBlending,
            sizeAttenuation: true  // particles farther away appear smaller
        }));
        scene.add(snowParticles);

        // --- MULTI-COLOR CURSOR SPARKLE SYSTEM ---
        const sparkleGeo    = new THREE.BufferGeometry();
        const sparkleColors = new Float32Array(maxSparkles * 3);

        for (let i = 0; i < maxSparkles * 3; i += 3) {
            sparklePositions[i] = 9999; sparklePositions[i+1] = 9999; sparklePositions[i+2] = 9999;
            sparkleVelocities.push({ x: 0, y: 0, z: 0 });
            sparkleLifes[i / 3] = 0;
            sparkleColors[i] = 1; sparkleColors[i+1] = 1; sparkleColors[i+2] = 1;
        }

        sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3));
        sparkleGeo.setAttribute('color',    new THREE.BufferAttribute(sparkleColors,    3));

        sparkleSystem = new THREE.Points(sparkleGeo, new THREE.PointsMaterial({
            size: 1.1, vertexColors: true, transparent: true,
            opacity: 1.0, blending: THREE.AdditiveBlending
        }));
        scene.add(sparkleSystem);

        // --- FLOATING FROST CRYSTALS ---
        const crystalMat = new THREE.MeshPhysicalMaterial({
            color: 0xe0f7fa, transmission: 0.9, ior: 1.5,
            roughness: 0.05, specularIntensity: 2.5,
            transparent: true, opacity: 0.8, flatShading: true
        });

        frostCrystal1 = new THREE.Mesh(new THREE.OctahedronGeometry(3.5, 0), crystalMat);
        frostCrystal1.position.set(17, 6, -2);
        scene.add(frostCrystal1);

        frostCrystal2 = new THREE.Mesh(new THREE.IcosahedronGeometry(3, 0), crystalMat);
        frostCrystal2.position.set(-17, -8, 2);
        scene.add(frostCrystal2);

        // --- ANIMATION LOOP ---
        const clock = new THREE.Clock();

        const animate = () => {
            requestAnimationFrame(animate);
            const t = clock.getElapsedTime();

            targetX += (mouseX - targetX) * 0.05;
            targetY += (mouseY - targetY) * 0.05;

            // Mouse World coordinates for 3D Snow Repulsion
            const mouseWorldX = targetX * 45;
            const mouseWorldY = -targetY * 35;

            // Endless Snowfall Physics with enhanced wind, turbulence & mouse repulsion
            if (snowParticles) {
                const posArr = snowParticles.geometry.attributes.position.array;

                // Wind gust system — slowly shifts direction every 4-8 seconds
                windTimer += 0.003;
                windTarget = Math.sin(windTimer * 0.7) * 0.06 + Math.cos(windTimer * 0.4) * 0.03;
                windX += (windTarget - windX) * 0.008; // smooth inertia

                for (let i = 0; i < flakeCount; i++) {
                    const idx = i * 3;
                    const vel = flakeVelocities[i];

                    // Fall Y — scroll-speed boosts fall in storm effect
                    posArr[idx + 1] -= vel.speedY + (scrollVelocity * 0.008);

                    // Sway X: natural arc + global wind gust + per-particle turbulence
                    posArr[idx] += Math.sin(t * vel.swaySpeed + vel.offset) * vel.swayAmp
                                 + windX
                                 + vel.turbX * Math.sin(t * 3.1 + vel.offset);

                    // Micro Y-turbulence (buoyancy/air pocket effect)
                    posArr[idx + 1] += vel.turbY * Math.cos(t * 2.4 + vel.offset);

                    // Mouse / Touch Repulsion — only when mouse is on screen
                    if (mouseHasEntered) {
                        const dx = posArr[idx]     - mouseWorldX;
                        const dy = posArr[idx + 1] - mouseWorldY;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < 26) {
                            const force = (26 - dist) / 26;
                            posArr[idx]     += (dx / (dist || 1)) * force * 1.4;
                            posArr[idx + 1] += (dy / (dist || 1)) * force * 1.2;
                        }
                    }

                    // Reset to Sky when falling past bottom
                    if (posArr[idx + 1] < -70) {
                        posArr[idx + 1] = 70;
                        posArr[idx]     = (Math.random() - 0.5) * 160;
                        posArr[idx + 2] = (Math.random() - 0.5) * 120;
                    }
                }

                snowParticles.geometry.attributes.position.needsUpdate = true;
            }

            // Update Cursor Sparkle Bursts
            if (sparkleSystem) {
                const sPos = sparkleSystem.geometry.attributes.position.array;
                for (let i = 0; i < maxSparkles; i++) {
                    if (sparkleLifes[i] > 0) {
                        const idx = i * 3;
                        const v = sparkleVelocities[i];
                        sPos[idx] += v.x;
                        sPos[idx + 1] += v.y;
                        sPos[idx + 2] += v.z;
                        v.y -= 0.01; // gravity drop
                        sparkleLifes[i] -= 0.02;

                        if (sparkleLifes[i] <= 0) {
                            sPos[idx] = 9999;
                        }
                    }
                }
                sparkleSystem.geometry.attributes.position.needsUpdate = true;
            }

            // Rotate Frost Crystals
            if (frostCrystal1) {
                frostCrystal1.rotation.x = t * 0.3;
                frostCrystal1.rotation.y = t * 0.4;
                frostCrystal1.position.y = 6 + Math.sin(t * 1.2) * 0.6 + (scrollPercent * 6);
            }

            if (frostCrystal2) {
                frostCrystal2.rotation.x = t * -0.25;
                frostCrystal2.rotation.z = t * 0.35;
                frostCrystal2.position.y = -8 + Math.cos(t * 1.4) * 0.6 - (scrollPercent * 6);
            }

            camera.position.z = 25 - (scrollPercent * 6);

            renderer.render(scene, camera);
        };

        animate();

        // Spawn Sparkle Burst on Mouse Move / Touch / Click
        function triggerSparkles(x, y, count = 5) {
            const worldX = (x / window.innerWidth - 0.5) * 45;
            const worldY = -(y / window.innerHeight - 0.5) * 35;

            for (let k = 0; k < count; k++) {
                const idx = sparkleIndex * 3;
                sparklePositions[idx] = worldX + (Math.random() - 0.5) * 2;
                sparklePositions[idx + 1] = worldY + (Math.random() - 0.5) * 2;
                sparklePositions[idx + 2] = (Math.random() - 0.5) * 10;

                sparkleVelocities[sparkleIndex] = {
                    x: (Math.random() - 0.5) * 0.3,
                    y: (Math.random() - 0.5) * 0.3 + 0.1,
                    z: (Math.random() - 0.5) * 0.2
                };
                sparkleLifes[sparkleIndex] = 1.0;
                sparkleIndex = (sparkleIndex + 1) % maxSparkles;
            }
        }

        window.addEventListener('mousemove', (e) => {
            mouseHasEntered = true;
            triggerSparkles(e.clientX, e.clientY, 2);
        });
        window.addEventListener('mouseleave', () => {
            mouseHasEntered = false; // hide repulsion when cursor leaves window
        });
        window.addEventListener('touchmove', (e) => {
            if (e.touches[0]) triggerSparkles(e.touches[0].clientX, e.touches[0].clientY, 3);
        });
        window.addEventListener('click', (e) => triggerSparkles(e.clientX, e.clientY, 15));

        // Window Resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    initWebGL();

    // ==========================================
    // 2. DYNAMIC 102-FRAME SCROLL CANVAS ENGINE (10-30 FPS)
    // ==========================================
    const totalFrames = 102;
    const frameImages = [];
    let loadedFramesCount = 0;
    let currentFrame = 0;
    let targetFrame = 0;
    let isUserScrolling = false;
    let scrollTimeout = null;

    const frameCanvas = document.getElementById('scroll-frame-canvas');
    const ctx = frameCanvas ? frameCanvas.getContext('2d') : null;

    // Preload 102 SVG Frames from extracted archive (GitHub Pages relative path compliant)
    for (let i = 0; i < totalFrames; i++) {
        const img = new Image();
        const paddedIndex = String(i).padStart(3, '0');
        img.src = `./assets/frames/no_need_the_kid_just_the_dynam_${paddedIndex}.svg`;
        img.onload = () => {
            loadedFramesCount++;
            if (i === 0 || loadedFramesCount === 1) drawFrame(0);
        };
        img.onerror = (e) => {
            console.warn(`Frame ${paddedIndex} failed to load:`, e);
        };
        frameImages.push(img);
    }

    function drawFrame(frameIdx) {
        if (!frameCanvas || !ctx) return;
        const validIdx = Math.max(0, Math.min(totalFrames - 1, Math.floor(frameIdx)));
        const img = frameImages[validIdx];

        if (!img || !img.complete) return;

        const imgWidth = img.naturalWidth || img.width || 1280;
        const imgHeight = img.naturalHeight || img.height || 720;

        frameCanvas.width = window.innerWidth;
        frameCanvas.height = window.innerHeight;

        const hRatio = frameCanvas.width / imgWidth;
        const vRatio = frameCanvas.height / imgHeight;
        const ratio = Math.max(hRatio, vRatio);

        const centerShift_x = (frameCanvas.width - imgWidth * ratio) / 2;
        const centerShift_y = (frameCanvas.height - imgHeight * ratio) / 2;

        ctx.clearRect(0, 0, frameCanvas.width, frameCanvas.height);
        ctx.drawImage(img, 0, 0, imgWidth, imgHeight,
                      centerShift_x, centerShift_y, imgWidth * ratio, imgHeight * ratio);
    }

    // Smooth Frame Animation Loop strictly bound to scroll position
    function updateFrameLoop() {
        requestAnimationFrame(updateFrameLoop);

        // Smooth Lerp Scrubbing STRICTLY on Scroll
        currentFrame += (targetFrame - currentFrame) * 0.18;

        drawFrame(currentFrame);
    }

    requestAnimationFrame(updateFrameLoop);

    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    const progressBar = document.getElementById('scroll-progress');
    const trackerItems = document.querySelectorAll('.tracker-item');
    const sections = document.querySelectorAll('.scroll-section, section');

    // Native Scroll Event Listener
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        
        scrollPercent = Math.max(0, Math.min(1, currentScrollY / maxScroll));
        scrollVelocity = currentScrollY - lastScrollY;
        lastScrollY = currentScrollY;

        // Map scroll percentage directly to frame sequence index (0 to 101)
        targetFrame = scrollPercent * (totalFrames - 1);

        isUserScrolling = true;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isUserScrolling = false;
        }, 150);

        // Top Scroll Progress Line (1-2px)
        if (progressBar) {
            progressBar.style.width = `${scrollPercent * 100}%`;
        }

        // Parallax Floating Elements Shift
        document.querySelectorAll('[data-parallax]').forEach(el => {
            const speed = parseFloat(el.getAttribute('data-parallax'));
            el.style.transform = `translateY(${currentScrollY * speed}px)`;
        });

        // Navbar scrolled state
        const navbar = document.getElementById('navbar');
        if (navbar) {
            if (currentScrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });

    // Kinetic Tracker Section Highlight with ScrollTrigger
    sections.forEach(sec => {
        const id = sec.getAttribute('id');
        if (!id) return;
        ScrollTrigger.create({
            trigger: sec,
            start: 'top 50%',
            end: 'bottom 50%',
            onToggle: self => {
                if (self.isActive) {
                    trackerItems.forEach(item => {
                        if (item.getAttribute('data-section') === id) {
                            item.classList.add('active');
                        } else {
                            item.classList.remove('active');
                        }
                    });
                }
            }
        });
    });

    // Tracker Click Handler
    trackerItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-section');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Custom Magnetic Cursor (skip custom cursor effects if user prefers or as clean layout refinement)
    // We keep the spotlight shader but remove mouse-tracking circle element to keep the tone recruiter-focused
    const cursor = document.getElementById('custom-cursor');
    const cursorBlur = document.getElementById('cursor-blur');
    if (cursor) cursor.style.display = 'none';
    if (cursorBlur) cursorBlur.style.display = 'none';

    document.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        const y = e.clientY;

        mouseX = (x / window.innerWidth - 0.5);
        mouseY = (y / window.innerHeight - 0.5);

        // Spotlight Shader tracking over glass cards remains for subtle premium micro-interaction
        document.querySelectorAll('.glass-card').forEach(card => {
            const rect = card.getBoundingClientRect();
            const cardX = x - rect.left;
            const cardY = y - rect.top;
            card.style.setProperty('--mouse-x', `${cardX}px`);
            card.style.setProperty('--mouse-y', `${cardY}px`);
        });
    });

    // ==========================================
    // 4. MAGICAL GSAP SCROLL REVEALS & MOTION
    // ==========================================
    if (!prefersReducedMotion) {
        // Hero Reveal
        gsap.fromTo('#hero .name', 
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.2 }
        );
        gsap.fromTo('#hero .greeting, #hero .headline, #hero .hero-desc, #hero .hero-cta',
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.08, delay: 0.4 }
        );

        // Light Parallax on Hero scroll-away
        gsap.to('#hero .hero-content', {
            scrollTrigger: {
                trigger: '#hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true
            },
            y: -30,
            opacity: 0,
            ease: 'none'
        });

        // Section Entrances
        sections.forEach(sec => {
            if (sec.id === 'hero') return; // Skip hero section since it reveals on page load
            const heading = sec.querySelector('.section-title');
            const reveals = sec.querySelectorAll('.scroll-reveal:not(.section-title), .scroll-3d-card');
            const staggers = sec.querySelectorAll('.stagger-item, .stagger-chip, .chip');

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: sec,
                    start: 'top 78%', // triggered around 75-78% viewport
                    toggleActions: 'play none none none',
                    once: true
                }
            });

            if (heading) {
                tl.fromTo(heading, 
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
                );
            }

            if (reveals.length > 0) {
                tl.fromTo(reveals,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.06 },
                    heading ? '-=0.45' : '0'
                );
            }

            if (staggers.length > 0) {
                tl.fromTo(staggers,
                    { opacity: 0, y: 16 },
                    { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.05 },
                    reveals.length > 0 ? '-=0.4' : (heading ? '-=0.3' : '0')
                );
            }
        });

        // Experience Timeline Connector Line Drawing
        gsap.fromTo('.timeline-line', 
            { height: '0%' },
            { 
                height: '100%',
                ease: 'none',
                scrollTrigger: {
                    trigger: '.timeline',
                    start: 'top 65%',
                    end: 'bottom 65%',
                    scrub: true
                }
            }
        );

        // Section Divider Glyphs drift
        gsap.to('.section-divider span', {
            y: 'random(-4, 4)',
            x: 'random(-3, 3)',
            rotation: 'random(-6, 6)',
            duration: 'random(4, 6)',
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            stagger: 0.2
        });
    } else {
        // Fallback for prefers-reduced-motion: instantly show all elements
        gsap.set('.scroll-reveal, .scroll-3d-card, .stagger-item, .stagger-chip, .chip, .section-title, #hero .name, #hero .greeting, #hero .headline, #hero .hero-desc, #hero .hero-cta', { opacity: 1, y: 0 });
        gsap.set('.timeline-line', { height: '100%' });
    }

    // Frost shimmer sweep — triggers on section entry
    const sectionSweepObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const section = entry.target;
                section.classList.remove('frost-sweep');
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => section.classList.add('frost-sweep'));
                });
            }
        });
    }, { threshold: 0.18 });

    sections.forEach(sec => sectionSweepObserver.observe(sec));

    // ==========================================
    // 5. TYPEWRITER EFFECT (REFINED ROLES)
    // ==========================================
    const roles = [
        "Software Engineer",
        "Tech Lead",
        "Security Researcher"
    ];

    const typeWriterElement = document.getElementById('typewriter');

    function initTypewriter() {
        if (!typeWriterElement) return;

        if (prefersReducedMotion) {
            typeWriterElement.textContent = roles[0];
            return;
        }

        let roleIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typingSpeed = 80;

        function type() {
            const currentRole = roles[roleIndex];

            if (isDeleting) {
                typeWriterElement.textContent = currentRole.substring(0, charIndex - 1);
                charIndex--;
                typingSpeed = 40;
            } else {
                typeWriterElement.textContent = currentRole.substring(0, charIndex + 1);
                charIndex++;
                typingSpeed = 80;
            }

            if (!isDeleting && charIndex === currentRole.length) {
                isDeleting = true;
                typingSpeed = 1600; // Natural pause
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
                typingSpeed = 300;
            }

            setTimeout(type, typingSpeed);
        }

        setTimeout(type, 1000);
    }

    initTypewriter();

    // ==========================================
    // 6. INTERACTIVE CLI TERMINAL (ROOT SHELL)
    // ==========================================
    const terminalDrawer = document.getElementById('terminal-drawer');
    const terminalToggle = document.getElementById('terminal-toggle');
    const terminalClose = document.getElementById('terminal-close');
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');

    if (terminalToggle) {
        terminalToggle.addEventListener('click', () => {
            if (terminalDrawer) {
                terminalDrawer.classList.toggle('active');
                if (terminalDrawer.classList.contains('active') && terminalInput) {
                    terminalInput.focus();
                }
            }
        });
    }

    if (terminalClose) {
        terminalClose.addEventListener('click', () => {
            if (terminalDrawer) terminalDrawer.classList.remove('active');
        });
    }

    if (terminalDrawer && terminalInput) {
        terminalDrawer.addEventListener('click', () => {
            terminalInput.focus();
        });
    }

    const commands = {
        help: `Available Commands:
 - <span class="cmd-highlight">whoami</span>     : Summary profile of Midhun M
 - <span class="cmd-highlight">about</span>      : About Me & Education
 - <span class="cmd-highlight">experience</span> : Leadership & Experience roles
 - <span class="cmd-highlight">projects</span>   : Featured Projects (Asthra AI, Breach Checker)
 - <span class="cmd-highlight">skills</span>     : Technical Stack & Capabilities
 - <span class="cmd-highlight">contact</span>    : Links & Contact information
 - <span class="cmd-highlight">clear</span>      : Clear shell output`,

        whoami: `Midhun M — Engineering Student, Developer, and Tech Leader.
General Secretary of ASET College Union | IEDC Tech Lead | Founder of NovusTech.`,

        about: `Currently serving as General Secretary of the ASET College Union and IEDC Tech Lead at ASET Palakkad.
Education: B.Tech in Computer Science Engineering @ Ahalia School of Engineering & Technology (2023-2027).`,

        experience: `Leadership & Experience:
 - [2025–2026] General Secretary, College Union @ ASET
 - [Aug 2025–Present] Technical Lead @ IEDC ASET
 - Founder @ NovusTech`,

        projects: `Featured Projects:
 1. Asthra AI (Dec 2025) : AI-powered documentation system for PDF reports, patent drafts & certificates. [Flutter, Python, AI]
 2. BREACH CHECKER (Dec 2025) : Full-stack credential breach auditing tool. [Full-stack, Security, OSINT]`,

        skills: `Technical Arsenal:
 - Tech Stack: React.js, Node.js, Flutter, Python, FastAPI, Java, HTML/CSS
 - Core Capabilities: Leadership, Cybersecurity, Hardware / ESP32, OSINT, Public Speaking, Project Management
 - Achievements: National Level Hackathon Winner (Mohandas Eng. College), Certified Penetration Tester, SIH Prelims Participant`,

        contact: `Contact Midhun M:
 - LinkedIn: https://www.linkedin.com/in/techwithmidhun/
 - GitHub: https://github.com/Midhun-M-git`
    };

    if (terminalInput) {
        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const rawCmd = terminalInput.value.trim();
                const cmd = rawCmd.toLowerCase();
                terminalInput.value = '';

                if (!rawCmd) return;

                const promptLine = document.createElement('div');
                promptLine.className = 'terminal-line';
                promptLine.innerHTML = `<span class="prompt-text">midhun@root:~$</span> ${escapeHtml(rawCmd)}`;
                terminalOutput.appendChild(promptLine);

                if (cmd === 'clear') {
                    terminalOutput.innerHTML = '';
                    return;
                }

                const response = document.createElement('div');
                response.className = 'terminal-response';

                if (commands[cmd]) {
                    response.innerHTML = commands[cmd];
                } else {
                    response.innerHTML = `<span style="color:#f43f5e">zsh: command not found: ${escapeHtml(rawCmd)}. Type <span class="cmd-highlight">help</span> for commands.</span>`;
                }

                terminalOutput.appendChild(response);

                const terminalBody = document.getElementById('terminal-body');
                if (terminalBody) terminalBody.scrollTop = terminalBody.scrollHeight;
            }
        });
    }

    function escapeHtml(text) {
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
});







