document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. THREE.JS 3D WEBGL GRAPHICS ENGINE
    // ==========================================
    let scene, camera, renderer, icosahedron, particleSystem;
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;

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

        // 3D Geometric Central Mesh (Icy Geometric Core)
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
        const scales = new Float32Array(particleCount);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 80;
            positions[i + 1] = (Math.random() - 0.5) * 80;
            positions[i + 2] = (Math.random() - 0.5) * 80;
            scales[i / 3] = Math.random() * 2;
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMat = new THREE.PointsMaterial({
            color: 0x8b5cf6,
            size: 0.25,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        particleSystem = new THREE.Points(particleGeo, particleMat);
        scene.add(particleSystem);

        // Ambient Lights
        const light = new THREE.DirectionalLight(0x00f2fe, 1);
        light.position.set(10, 10, 10);
        scene.add(light);

        // Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);

            // Smooth Interpolated Mouse Rotation
            targetX += (mouseX - targetX) * 0.05;
            targetY += (mouseY - targetY) * 0.05;

            if (icosahedron) {
                icosahedron.rotation.x += 0.003;
                icosahedron.rotation.y += 0.004;
                icosahedron.rotation.x += (targetY * 0.5 - icosahedron.rotation.x) * 0.05;
                icosahedron.rotation.y += (targetX * 0.5 - icosahedron.rotation.y) * 0.05;
            }

            if (particleSystem) {
                particleSystem.rotation.y -= 0.001;
            }

            renderer.render(scene, camera);
        };

        animate();

        // Window Resize Handler
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    initWebGL();

    // ==========================================
    // 2. MAGNETIC CURSOR & SPOTLIGHT EFFECT
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

        // Card Spotlight Shader Tracking
        document.querySelectorAll('.glass-card').forEach(card => {
            const rect = card.getBoundingClientRect();
            const cardX = x - rect.left;
            const cardY = y - rect.top;
            card.style.setProperty('--mouse-x', `${cardX}px`);
            card.style.setProperty('--mouse-y', `${cardY}px`);
        });
    });

    // Magnetic Targets Hover Listener
    document.querySelectorAll('.magnetic-target, a, button').forEach(elem => {
        elem.addEventListener('mouseenter', () => {
            document.body.classList.add('cursor-hover');
            playAudioFx(440, 0.03); // Subtle synth tone
        });
        elem.addEventListener('mouseleave', () => {
            document.body.classList.remove('cursor-hover');
        });
    });

    // ==========================================
    // 3. WEB AUDIO SYNTHESIZER ENGINE
    // ==========================================
    let audioCtx = null;
    let soundMuted = true; // Default muted for smooth UX

    const soundToggle = document.getElementById('sound-toggle');
    const soundIcon = document.getElementById('sound-icon');

    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            soundMuted = !soundMuted;
            if (soundMuted) {
                soundIcon.className = 'fas fa-volume-mute';
                showToast('UI Sound FX Muted');
            } else {
                soundIcon.className = 'fas fa-volume-up text-cyan';
                showToast('UI Sound FX Active 🔊');
                playAudioFx(880, 0.1);
            }
        });
    }

    function playAudioFx(freq = 440, duration = 0.05) {
        if (soundMuted) return;
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

            gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
            // Audio context fallback ignored silently
        }
    }

    // ==========================================
    // 4. INTERACTIVE CLI TERMINAL ENGINE
    // ==========================================
    const terminalDrawer = document.getElementById('terminal-drawer');
    const terminalToggle = document.getElementById('terminal-toggle');
    const heroCliBtn = document.getElementById('hero-cli-btn');
    const terminalClose = document.getElementById('terminal-close');
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');

    const toggleTerminal = () => {
        if (terminalDrawer) {
            terminalDrawer.classList.toggle('active');
            if (terminalDrawer.classList.contains('active') && terminalInput) {
                terminalInput.focus();
                playAudioFx(600, 0.08);
            }
        }
    };

    if (terminalToggle) terminalToggle.addEventListener('click', toggleTerminal);
    if (heroCliBtn) heroCliBtn.addEventListener('click', toggleTerminal);
    if (terminalClose) terminalClose.addEventListener('click', toggleTerminal);

    // Terminal Commands
    const commands = {
        help: `Available Shell Commands:
 - <span class="cmd-highlight">whoami</span>      : Learn about Midhun M
 - <span class="cmd-highlight">skills</span>      : Print Technical Arsenal & Stack
 - <span class="cmd-highlight">projects</span>    : List Featured Engineering Projects
 - <span class="cmd-highlight">experience</span>  : View Leadership & Roles
 - <span class="cmd-highlight">spidey</span>      : Launch Spidey Vector Terminal Easter Egg
 - <span class="cmd-highlight">contact</span>     : Contact & Social Info
 - <span class="cmd-highlight">clear</span>       : Clear Terminal Screen`,

        whoami: `Midhun M — B.Tech Computer Science Engineer @ ASET Palakkad (2023-2027).
General Secretary of ASET College Union & Technical Lead at IEDC.
Founder of NovusTech. Passionate about software architecture, security & hardware.`,

        skills: `Technical Stack & Capabilities:
 - Languages: React.js, Python, Node.js, Flutter, FastAPI, C/C++, Java, HTML/CSS
 - Cybersecurity: Certified Pen Tester, OSINT, Breach Verification, DefSec
 - Hardware: ESP32 Microcontrollers, Embedded IoT, Wireless Telemetry
 - Soft Skills: Student Union Leadership, Technical Mentorship, Keynotes`,

        projects: `Featured Projects:
 1. Asthra AI [Flutter + Python] : AI document & report automation system
 2. Breach Checker [Full-Stack] : Credential breach auditing tool
 3. Novus Hardware Sentinel    : ESP32 IoT telemetry node
 4. Spidey Terminal            : Dynamic vector SVG statistics pipeline`,

        experience: `Leadership & Roles:
 [2025-2026] General Secretary — ASET College Union
 [2025-Pres] Technical Lead — IEDC ASET
 [2024-Pres] Founder — NovusTech`,

        contact: `Connect with Midhun:
 - LinkedIn: https://www.linkedin.com/in/techwithmidhun/
 - GitHub  : https://github.com/Midhun-M-git
 - Email   : midhun@example.com`,

        spidey: `🕷️ SPIDEY VECTOR ENGINE LAUNCHED!
   /_/ / /_/ / /_/ /
  / ___  / / /_/ / 
 /_/  /_/_/\\____/  
Spider-Man animated SVG modules generated and verified in repository!`
    };

    if (terminalInput) {
        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const rawCmd = terminalInput.value.trim();
                const cmd = rawCmd.toLowerCase();
                terminalInput.value = '';

                if (!rawCmd) return;

                // Print input prompt line
                const promptLine = document.createElement('div');
                promptLine.className = 'terminal-line';
                promptLine.innerHTML = `<span class="prompt-text">midhun@igloo:~$</span> ${escapeHtml(rawCmd)}`;
                terminalOutput.appendChild(promptLine);

                // Command processing
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

                // Auto Scroll
                const terminalBody = document.getElementById('terminal-body');
                if (terminalBody) {
                    terminalBody.scrollTop = terminalBody.scrollHeight;
                }

                playAudioFx(520, 0.04);
            }
        });
    }

    function escapeHtml(text) {
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // ==========================================
    // 5. DYNAMIC PROJECTS FILTER & MODAL
    // ==========================================
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });

            playAudioFx(480, 0.05);
        });
    });

    // Project Details Modal Data
    const projectDetails = {
        asthra: {
            title: "Asthra AI — Automated Workflow Engine",
            tag: "AI & Workflow Systems",
            description: "Asthra AI is an enterprise document & workflow automation solution built to solve manual document bottlenecks. It intelligently parses raw input data, constructs clean structured reports, drafts patent applications, and batch-generates verified credentials with cryptographic logging.",
            stack: ["Flutter", "Python", "FastAPI", "OpenAI / Gemini API", "PDF Engine"],
            highlights: [
                "Automated PDF & document layout generation engine.",
                "FastAPI asynchronous backend with background task queueing.",
                "Custom template builder for academic and organizational reports."
            ]
        },
        breach: {
            title: "Breach Checker — Security Credential Auditor",
            tag: "Cybersecurity & OSINT",
            description: "A full-stack defensive cybersecurity platform that allows users and security administrators to verify whether email credentials or passwords have appeared in known compromised datasets, using k-Anonymity SHA-1 hash lookups.",
            stack: ["Node.js", "Express", "SHA-1 Hashing", "OSINT Data", "React"],
            highlights: [
                "Zero-knowledge password hashing (k-Anonymity model).",
                "Real-time breach statistics and threat risk score dashboard.",
                "REST API integration for enterprise credential monitoring."
            ]
        },
        esp32: {
            title: "Novus Hardware Sentinel — ESP32 Telemetry",
            tag: "Embedded IoT Systems",
            description: "Developed under NovusTech, this ESP32 microcontroller system provides wireless sensor telemetry, environmental telemetry monitoring, and remote relay switching with automatic rollback safety protocols.",
            stack: ["ESP32", "C++ / Arduino", "MQTT", "Sensors", "WebSockets"],
            highlights: [
                "Sub-second MQTT sensor data streaming over Wi-Fi.",
                "Fail-safe hardware state recovery and watchdog timer.",
                "Interactive web dashboard for remote control and logging."
            ]
        },
        spidey: {
            title: "Spidey Interactive Terminal & Vector Engine",
            tag: "SVG Graphics & GitHub Pipeline",
            description: "A custom animated SVG graphic and dynamic GitHub profile pipeline built to visualize developer statistics, repository contributions, and interactive Spider-Man vector physics.",
            stack: ["Python", "SVG Physics", "GitHub Actions", "XML Parser"],
            highlights: [
                "Automated GitHub Actions workflow for real-time SVG update.",
                "Pure vector Spider-Man character animation.",
                "Dynamic typewriter stats terminal generation."
            ]
        }
    };

    const modal = document.getElementById('project-modal');
    const modalContent = document.getElementById('modal-content');
    const modalClose = document.getElementById('modal-close');

    document.querySelectorAll('[data-open-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-open-modal');
            const data = projectDetails[key];

            if (data && modal && modalContent) {
                modalContent.innerHTML = `
                    <div style="margin-bottom:1rem;">
                        <span class="project-tag">${data.tag}</span>
                    </div>
                    <h2 style="font-size:1.8rem; margin-bottom:1rem; color: var(--text-primary);">${data.title}</h2>
                    <p style="color: var(--text-secondary); margin-bottom:1.5rem; line-height:1.6;">${data.description}</p>
                    
                    <h4 style="color: var(--accent-cyan); margin-bottom:0.8rem;">Architecture Highlights</h4>
                    <ul style="list-style:none; margin-bottom:1.5rem;">
                        ${data.highlights.map(h => `<li style="margin-bottom:0.5rem; color:var(--text-secondary); font-size:0.92rem;"><i class="fas fa-check-circle text-cyan" style="margin-right:0.5rem;"></i> ${h}</li>`).join('')}
                    </ul>

                    <h4 style="color: var(--accent-violet); margin-bottom:0.8rem;">Technologies Used</h4>
                    <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:2rem;">
                        ${data.stack.map(s => `<span class="chip" style="border-color:rgba(139,92,246,0.3);">${s}</span>`).join('')}
                    </div>

                    <a href="https://github.com/Midhun-M-git" target="_blank" class="btn btn-primary" style="width:100%;">
                        <span>Explore Code Repository on GitHub</span> <i class="fab fa-github"></i>
                    </a>
                `;

                modal.classList.add('active');
                playAudioFx(540, 0.06);
            }
        });
    });

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            if (modal) modal.classList.remove('active');
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    // ==========================================
    // 6. TYPEWRITER & INTERSECTION OBSERVER
    // ==========================================
    const roles = [
        "Software Architect & Engineer",
        "General Secretary @ ASET Union",
        "Technical Lead @ IEDC",
        "Founder of NovusTech",
        "Cybersecurity Specialist"
    ];

    let roleIdx = 0, charIdx = 0, isDeleting = false;
    const typewriterEl = document.getElementById('typewriter');

    function type() {
        if (!typewriterEl) return;
        const currentRole = roles[roleIdx];

        if (isDeleting) {
            typewriterEl.textContent = currentRole.substring(0, charIdx - 1);
            charIdx--;
        } else {
            typewriterEl.textContent = currentRole.substring(0, charIdx + 1);
            charIdx++;
        }

        let speed = isDeleting ? 40 : 80;

        if (!isDeleting && charIdx === currentRole.length) {
            isDeleting = true;
            speed = 2200;
        } else if (isDeleting && charIdx === 0) {
            isDeleting = false;
            roleIdx = (roleIdx + 1) % roles.length;
            speed = 400;
        }

        setTimeout(type, speed);
    }

    type();

    // Scroll Fade Observer
    const faders = document.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.12 });

    faders.forEach(el => observer.observe(el));

    // Navbar Scroll Background Change
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (navbar) {
            if (window.scrollY > 40) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });

    // ==========================================
    // 7. FORM SUBMISSION & TOAST NOTIFICATION
    // ==========================================
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast("Message sent successfully! Midhun will reach out soon.");
            contactForm.reset();
            playAudioFx(700, 0.1);
        });
    }

    const copyEmailBtn = document.getElementById('copy-email-btn');
    if (copyEmailBtn) {
        copyEmailBtn.addEventListener('click', () => {
            navigator.clipboard.writeText('techwithmidhun@gmail.com').then(() => {
                showToast("Email address copied to clipboard!");
                playAudioFx(660, 0.06);
            }).catch(() => {
                showToast("techwithmidhun@gmail.com");
            });
        });
    }

    function showToast(msg) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fas fa-info-circle text-cyan" style="margin-right:0.6rem;"></i> ${msg}`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
});

