document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. THREE.JS MAGICAL SNOWY ARCTIC ENGINE
    // ==========================================
    let scene, camera, renderer;
    let snowParticles, auroraMesh, frostCrystal1, frostCrystal2;
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;

    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let scrollPercent = 0;

    const flakeCount = window.innerWidth < 768 ? 1200 : 2800;
    const flakePositions = new Float32Array(flakeCount * 3);
    const flakeVelocities = [];

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

        // Northern Lights Cyan Light
        const cyanLight = new THREE.PointLight(0x00f2fe, 4, 70);
        cyanLight.position.set(15, 20, 10);
        scene.add(cyanLight);

        // Aurora Emerald Light
        const emeraldLight = new THREE.PointLight(0x00ffcc, 3.5, 70);
        emeraldLight.position.set(-15, 15, 10);
        scene.add(emeraldLight);

        // --- ENDLESS MAGICAL SNOWFALL PARTICLES ---
        const snowGeo = new THREE.BufferGeometry();
        const colors = new Float32Array(flakeCount * 3);

        const colorPureWhite = new THREE.Color(0xffffff);
        const colorIceCyan = new THREE.Color(0xe0f7fa);
        const colorSoftBlue = new THREE.Color(0xbae6fd);

        for (let i = 0; i < flakeCount * 3; i += 3) {
            const x = (Math.random() - 0.5) * 140;
            const y = (Math.random() - 0.5) * 120;
            const z = (Math.random() - 0.5) * 90;

            flakePositions[i] = x;
            flakePositions[i + 1] = y;
            flakePositions[i + 2] = z;

            flakeVelocities.push({
                speedY: 0.08 + Math.random() * 0.18,
                swaySpeed: 0.8 + Math.random() * 1.5,
                swayAmp: 0.05 + Math.random() * 0.12,
                offset: Math.random() * Math.PI * 2
            });

            const randCol = Math.random();
            let col = colorPureWhite;
            if (randCol > 0.6) col = colorIceCyan;
            else if (randCol > 0.85) col = colorSoftBlue;

            colors[i] = col.r;
            colors[i + 1] = col.g;
            colors[i + 2] = col.b;
        }

        snowGeo.setAttribute('position', new THREE.BufferAttribute(flakePositions, 3));
        snowGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const snowMat = new THREE.PointsMaterial({
            size: 0.38,
            vertexColors: true,
            transparent: true,
            opacity: 0.82,
            blending: THREE.AdditiveBlending
        });

        snowParticles = new THREE.Points(snowGeo, snowMat);
        scene.add(snowParticles);

        // --- AURORA BOREALIS NORTHERN LIGHTS WAVE RIBBON ---
        const auroraGeo = new THREE.PlaneGeometry(160, 40, 64, 16);
        const auroraMat = new THREE.MeshBasicMaterial({
            color: 0x00f2fe,
            transparent: true,
            opacity: 0.14,
            wireframe: true,
            blending: THREE.AdditiveBlending
        });

        auroraMesh = new THREE.Mesh(auroraGeo, auroraMat);
        auroraMesh.position.set(0, 18, -25);
        auroraMesh.rotation.x = Math.PI / 4;
        scene.add(auroraMesh);

        // --- FLOATING FROST CRYSTALS ---
        const crystalMat = new THREE.MeshPhysicalMaterial({
            color: 0xe0f7fa,
            transmission: 0.9,
            ior: 1.5,
            roughness: 0.05,
            specularIntensity: 2.5,
            transparent: true,
            opacity: 0.8,
            flatShading: true
        });

        const geo1 = new THREE.OctahedronGeometry(3.5, 0);
        frostCrystal1 = new THREE.Mesh(geo1, crystalMat);
        frostCrystal1.position.set(17, 6, -2);
        scene.add(frostCrystal1);

        const geo2 = new THREE.IcosahedronGeometry(3, 0);
        frostCrystal2 = new THREE.Mesh(geo2, crystalMat);
        frostCrystal2.position.set(-17, -8, 2);
        scene.add(frostCrystal2);

        // --- ANIMATION, SNOWFALL & AURORA RENDER LOOP ---
        let clock = new THREE.Clock();

        const animate = () => {
            requestAnimationFrame(animate);
            const t = clock.getElapsedTime();

            targetX += (mouseX - targetX) * 0.04;
            targetY += (mouseY - targetY) * 0.04;

            // Endless Snowfall Physics Loop
            if (snowParticles) {
                const posArr = snowParticles.geometry.attributes.position.array;

                for (let i = 0; i < flakeCount; i++) {
                    const idx = i * 3;
                    const vel = flakeVelocities[i];

                    // Fall Y
                    posArr[idx + 1] -= vel.speedY + (scrollVelocity * 0.005);

                    // Sway X with Arctic Wind
                    posArr[idx] += Math.sin(t * vel.swaySpeed + vel.offset) * vel.swayAmp + (targetX * 0.05);

                    // Reset to Sky when falling past bottom
                    if (posArr[idx + 1] < -60) {
                        posArr[idx + 1] = 60;
                        posArr[idx] = (Math.random() - 0.5) * 140;
                    }
                }

                snowParticles.geometry.attributes.position.needsUpdate = true;
            }

            // Aurora Borealis Wave Motion
            if (auroraMesh) {
                const pos = auroraMesh.geometry.attributes.position.array;
                for (let i = 0; i < pos.length; i += 3) {
                    const u = pos[i];
                    pos[i + 2] = Math.sin(u * 0.08 + t * 0.8) * 4 + Math.cos(u * 0.04 + t * 0.6) * 2;
                }
                auroraMesh.geometry.attributes.position.needsUpdate = true;
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

    // Preload 102 SVG Frames from extracted archive
    for (let i = 0; i < totalFrames; i++) {
        const img = new Image();
        const paddedIndex = String(i).padStart(3, '0');
        img.src = `assets/frames/no_need_the_kid_just_the_dynam_${paddedIndex}.svg`;
        img.onload = () => {
            loadedFramesCount++;
            if (i === 0) drawFrame(0);
        };
        frameImages.push(img);
    }

    function drawFrame(frameIdx) {
        if (!frameCanvas || !ctx) return;
        const validIdx = Math.max(0, Math.min(totalFrames - 1, Math.floor(frameIdx)));
        const img = frameImages[validIdx];

        if (!img || !img.complete || img.naturalWidth === 0) return;

        frameCanvas.width = window.innerWidth;
        frameCanvas.height = window.innerHeight;

        const hRatio = frameCanvas.width / img.naturalWidth;
        const vRatio = frameCanvas.height / img.naturalHeight;
        const ratio = Math.max(hRatio, vRatio);

        const centerShift_x = (frameCanvas.width - img.naturalWidth * ratio) / 2;
        const centerShift_y = (frameCanvas.height - img.naturalHeight * ratio) / 2;

        ctx.clearRect(0, 0, frameCanvas.width, frameCanvas.height);
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight,
                      centerShift_x, centerShift_y, img.naturalWidth * ratio, img.naturalHeight * ratio);
    }

    // Smooth Frame Animation Loop (10-30 FPS interpolation)
    let lastFpsTime = performance.now();
    const targetFpsInterval = 1000 / 24; // 24 FPS dynamic playback

    function updateFrameLoop(now) {
        requestAnimationFrame(updateFrameLoop);

        // Smooth Lerp Scrubbing on Scroll
        currentFrame += (targetFrame - currentFrame) * 0.18;

        // Auto-play dynamic loop when user is idle (10-30 FPS)
        if (!isUserScrolling && now - lastFpsTime > targetFpsInterval) {
            targetFrame = (targetFrame + 0.5) % totalFrames;
            lastFpsTime = now;
        }

        drawFrame(currentFrame);
    }

    requestAnimationFrame(updateFrameLoop);

    // Window Scroll Handler for Frame Scrubbing
    const progressBar = document.getElementById('scroll-progress');
    const trackerItems = document.querySelectorAll('.tracker-item');
    const sections = document.querySelectorAll('.scroll-section, section');

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

        // Top Scroll Progress Line
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

    // Kinetic Tracker Section Highlight
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                trackerItems.forEach(item => {
                    if (item.getAttribute('data-section') === id) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            }
        });
    }, { threshold: 0.3 });

    sections.forEach(sec => sectionObserver.observe(sec));

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

    // ==========================================
    // 3. MAGNETIC CURSOR & SPOTLIGHT SHADER
    // ==========================================
    const cursor = document.getElementById('custom-cursor');
    const cursorBlur = document.getElementById('cursor-blur');

    document.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        const y = e.clientY;

        mouseX = (x / window.innerWidth - 0.5);
        mouseY = (y / window.innerHeight - 0.5);

        if (cursor) {
            cursor.style.left = `${x}px`;
            cursor.style.top = `${y}px`;
        }

        if (cursorBlur) {
            cursorBlur.style.left = `${x}px`;
            cursorBlur.style.top = `${y}px`;
        }

        // Spotlight Shader tracking over glass cards
        document.querySelectorAll('.glass-card').forEach(card => {
            const rect = card.getBoundingClientRect();
            const cardX = x - rect.left;
            const cardY = y - rect.top;
            card.style.setProperty('--mouse-x', `${cardX}px`);
            card.style.setProperty('--mouse-y', `${cardY}px`);
        });
    });

    document.querySelectorAll('.magnetic-target, a, button').forEach(elem => {
        elem.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        elem.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    // ==========================================
    // 4. SCROLL REVEAL & GLASS CARDS ANIMATION
    // ==========================================
    const revealElements = document.querySelectorAll('.scroll-reveal, .scroll-3d-card');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, { threshold: 0.15 });

    revealElements.forEach(el => revealObserver.observe(el));

    // ==========================================
    // 5. TYPEWRITER EFFECT (MIDHUN'S EXACT ROLES)
    // ==========================================
    const roles = [
        "Engineering Student @ ASET",
        "General Secretary, College Union",
        "Technical Lead at IEDC",
        "Founder of NovusTech",
        "Cybersecurity Enthusiast"
    ];

    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    const typeWriterElement = document.getElementById('typewriter');

    function type() {
        if (!typeWriterElement) return;
        const currentRole = roles[roleIndex];

        if (isDeleting) {
            typeWriterElement.textContent = currentRole.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50;
        } else {
            typeWriterElement.textContent = currentRole.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100;
        }

        if (!isDeleting && charIndex === currentRole.length) {
            isDeleting = true;
            typingSpeed = 2000;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            typingSpeed = 500;
        }

        setTimeout(type, typingSpeed);
    }

    if (typeWriterElement) {
        setTimeout(type, 1000);
    }

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







