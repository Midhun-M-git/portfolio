document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. THREE.JS MAGICAL IGLOO 3D ENGINE & SHADERS
    // ==========================================
    let scene, camera, renderer;
    let glassOrb, glassCrystal, cyberTorus, glassCube, particleSystem;
    let pointLight1, pointLight2, spotLight;
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;

    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let scrollPercent = 0;

    function initWebGL() {
        const canvas = document.getElementById('webgl-canvas');
        if (!canvas || typeof THREE === 'undefined') return;

        scene = new THREE.Scene();

        // Responsive Camera setup
        const isMobile = window.innerWidth < 768;
        camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = isMobile ? 32 : 25;

        // Renderer setup with high precision shadows & tone mapping
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;

        // --- MAGICAL LIGHTING SYSTEM ---
        const ambientLight = new THREE.AmbientLight(0x0a0e1a, 2.0);
        scene.add(ambientLight);

        // Neon Cyan Point Light
        pointLight1 = new THREE.PointLight(0x00f2fe, 4, 60);
        pointLight1.position.set(15, 12, 10);
        scene.add(pointLight1);

        // Electric Violet Point Light
        pointLight2 = new THREE.PointLight(0x8b5cf6, 4.5, 60);
        pointLight2.position.set(-15, -12, 10);
        scene.add(pointLight2);

        // Specular Spotlight for Crystal Refraction Highlights
        spotLight = new THREE.SpotLight(0xffffff, 2, 80, Math.PI / 4, 0.5);
        spotLight.position.set(0, 20, 20);
        scene.add(spotLight);

        // --- IGLOO MAGICAL IRIDESCENT GLASS MATERIALS ---
        const glassMatCyan = new THREE.MeshPhysicalMaterial({
            color: 0x00f2fe,
            metalness: 0.1,
            roughness: 0.08,
            transmission: 0.88,
            ior: 1.5,
            thickness: 1.4,
            specularIntensity: 2.0,
            specularColor: new THREE.Color(0x00f2fe),
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            iridescence: 0.9,
            iridescenceIOR: 1.3,
            transparent: true,
            opacity: 0.85
        });

        const glassMatViolet = new THREE.MeshPhysicalMaterial({
            color: 0x8b5cf6,
            metalness: 0.15,
            roughness: 0.1,
            transmission: 0.85,
            ior: 1.55,
            thickness: 1.5,
            specularIntensity: 2.2,
            specularColor: new THREE.Color(0xc084fc),
            clearcoat: 1.0,
            clearcoatRoughness: 0.08,
            iridescence: 1.0,
            iridescenceIOR: 1.4,
            transparent: true,
            opacity: 0.85
        });

        // --- MAGICAL 3D FLOATING OBJECTS ---
        
        // 1. Floating Magical Liquid Glass Orb (Top Right Hero)
        const orbGeo = new THREE.SphereGeometry(3.5, 64, 64);
        glassOrb = new THREE.Mesh(orbGeo, glassMatCyan);
        glassOrb.position.set(isMobile ? 0 : 16, isMobile ? 12 : 5, -2);
        scene.add(glassOrb);

        // 2. Iridescent Glass Diamond Crystal (Left Side About)
        const crystalGeo = new THREE.OctahedronGeometry(3.2, 0);
        glassCrystal = new THREE.Mesh(crystalGeo, glassMatViolet);
        glassCrystal.position.set(isMobile ? -8 : -17, -5, 2);
        scene.add(glassCrystal);

        // 3. Glowing Cyber Torus Ring (Right Side Projects)
        const torusGeo = new THREE.TorusGeometry(2.8, 0.7, 32, 64);
        cyberTorus = new THREE.Mesh(torusGeo, glassMatCyan);
        cyberTorus.position.set(isMobile ? 8 : 17, -15, -4);
        scene.add(cyberTorus);

        // 4. Floating Rounded Glass Cube (Left Side Skills)
        const cubeGeo = new THREE.BoxGeometry(3, 3, 3);
        glassCube = new THREE.Mesh(cubeGeo, glassMatViolet);
        glassCube.position.set(isMobile ? -6 : -16, -26, -2);
        scene.add(glassCube);

        // --- MAGICAL AMBIENT STARFIELD / PARTICLES ---
        const particleCount = isMobile ? 250 : 500;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const c1 = new THREE.Color(0x00f2fe);
        const c2 = new THREE.Color(0x8b5cf6);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 120;
            positions[i + 1] = (Math.random() - 0.5) * 120;
            positions[i + 2] = (Math.random() - 0.5) * 90;

            const col = Math.random() > 0.5 ? c1 : c2;
            colors[i] = col.r;
            colors[i + 1] = col.g;
            colors[i + 2] = col.b;
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMat = new THREE.PointsMaterial({
            size: 0.25,
            vertexColors: true,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });

        particleSystem = new THREE.Points(particleGeo, particleMat);
        scene.add(particleSystem);

        // --- ANIMATION, MAGNETIC MOUSE TILT & SCROLL ENGINE ---
        let clock = new THREE.Clock();

        const animate = () => {
            requestAnimationFrame(animate);
            const t = clock.getElapsedTime();

            targetX += (mouseX - targetX) * 0.05;
            targetY += (mouseY - targetY) * 0.05;

            // Magical Floating & Mouse Magnetic Physics
            if (glassOrb) {
                glassOrb.rotation.x = t * 0.4 + (targetY * 0.4);
                glassOrb.rotation.y = t * 0.5 + (targetX * 0.4);
                glassOrb.position.y = 5 + Math.sin(t * 1.5) * 0.8 + (scrollPercent * 6);
                glassOrb.position.x = (isMobile ? 0 : 16) + (targetX * 2);
            }

            if (glassCrystal) {
                glassCrystal.rotation.x = t * -0.3 + (targetY * 0.3);
                glassCrystal.rotation.z = t * 0.4;
                glassCrystal.position.y = -5 + Math.cos(t * 1.3) * 0.7 - (scrollPercent * 5);
                glassCrystal.position.x = (isMobile ? -8 : -17) + (targetX * 2.5);
            }

            if (cyberTorus) {
                cyberTorus.rotation.x = t * 0.5;
                cyberTorus.rotation.y = t * 0.6 + (targetX * 0.5);
                cyberTorus.position.y = -15 + Math.sin(t * 1.1) * 0.9 - (scrollPercent * 10);
            }

            if (glassCube) {
                glassCube.rotation.x = t * 0.3;
                glassCube.rotation.y = t * 0.4;
                glassCube.position.y = -26 + Math.cos(t * 1.2) * 0.7 - (scrollPercent * 12);
            }

            // Orbit Lights
            if (pointLight1) {
                pointLight1.position.x = 15 + Math.sin(t * 1.2) * 5;
                pointLight1.position.y = 12 + Math.cos(t * 0.9) * 5;
            }

            if (pointLight2) {
                pointLight2.position.x = -15 + Math.cos(t * 1.1) * 5;
                pointLight2.position.y = -12 + Math.sin(t * 0.8) * 5;
            }

            if (particleSystem) {
                particleSystem.rotation.y = t * 0.03 + (scrollPercent * 0.6);
            }

            // Smooth Camera Zoom
            camera.position.z = (isMobile ? 32 : 25) - (scrollPercent * 8);

            renderer.render(scene, camera);
        };

        animate();

        // Window Resize Responsiveness
        window.addEventListener('resize', () => {
            const mobile = window.innerWidth < 768;
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.position.z = mobile ? 32 : 25;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    initWebGL();

    // ==========================================
    // 2. DYNAMIC SCROLL ENGINE & TRACKER
    // ==========================================
    const progressBar = document.getElementById('scroll-progress');
    const trackerItems = document.querySelectorAll('.tracker-item');
    const sections = document.querySelectorAll('.scroll-section, section');

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        
        scrollPercent = Math.max(0, Math.min(1, currentScrollY / maxScroll));
        scrollVelocity = currentScrollY - lastScrollY;
        lastScrollY = currentScrollY;

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
    // 6. INTERACTIVE CLI TERMINAL (AUTHENTIC DATA)
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
                promptLine.innerHTML = `<span class="prompt-text">midhun@igloo:~$</span> ${escapeHtml(rawCmd)}`;
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






