document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. THREE.JS 3D WEBGL GRAPHICS & SCROLL SYNC
    // ==========================================
    let scene, camera, renderer, icosahedron, particleSystem;
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;

    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let scrollPercent = 0;

    function initWebGL() {
        const canvas = document.getElementById('webgl-canvas');
        if (!canvas || typeof THREE === 'undefined') return;

        scene = new THREE.Scene();

        // Camera setup
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 24;

        // Renderer setup
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // 3D Geometric Mesh Core
        const geometry = new THREE.IcosahedronGeometry(7, 2);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00f2fe,
            wireframe: true,
            transparent: true,
            opacity: 0.22
        });
        icosahedron = new THREE.Mesh(geometry, material);
        scene.add(icosahedron);

        // Particle Galaxy System
        const particleCount = window.innerWidth < 768 ? 250 : 550;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 90;
            positions[i + 1] = (Math.random() - 0.5) * 90;
            positions[i + 2] = (Math.random() - 0.5) * 90;
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMat = new THREE.PointsMaterial({
            color: 0x8b5cf6,
            size: 0.28,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });

        particleSystem = new THREE.Points(particleGeo, particleMat);
        scene.add(particleSystem);

        // Animation & Scroll Render Loop
        const animate = () => {
            requestAnimationFrame(animate);

            targetX += (mouseX - targetX) * 0.05;
            targetY += (mouseY - targetY) * 0.05;

            // 3D Mesh Rotation & Scroll-driven Depth Interpolation
            if (icosahedron) {
                icosahedron.rotation.x += 0.003;
                icosahedron.rotation.y += 0.004;

                // Sync 3D mesh angle & camera depth directly to scroll percentage!
                icosahedron.rotation.z = scrollPercent * Math.PI * 1.5;
                icosahedron.rotation.x = targetY * 0.4 + (scrollPercent * Math.PI);
                icosahedron.rotation.y = targetX * 0.4 + (scrollPercent * Math.PI * 2);
            }

            if (particleSystem) {
                particleSystem.rotation.y = -scrollPercent * Math.PI * 0.8;
                particleSystem.rotation.z += scrollVelocity * 0.0005;
            }

            // Scroll Zoom Camera Depth effect (Igloo style 3D camera move)
            camera.position.z = 24 - (scrollPercent * 10);

            // Decay scroll velocity smoothly
            scrollVelocity *= 0.92;

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
    // 4. SCROLL REVEAL & 3D CARD PERSPECTIVE TILT
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



