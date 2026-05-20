        const MAX_PARTICLES = 6;
        const PARTICLE_INTERVAL_MS = 4000;
        const SYSTEM_INFO_INTERVAL_MS = 15000;
        const DOWNLOAD_TEST_INTERVAL_MS = 60000;
        let activeParticleCount = 0;
        let particleTimerId = null;
        let clockTimerId = null;
        let clockIntervalId = null;
        let systemInfoTimerId = null;
        let isRestoringSettings = false;

        function getElement(id) {
            return document.getElementById(id);
        }

        function markSectionDirty(sectionName) {
            if (isRestoringSettings) {
                return;
            }

            const navItem = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
            if (navItem) {
                navItem.classList.add('is-dirty');
            }
        }

        window.markSettingsSectionDirty = markSectionDirty;

        function ensureInlineAnimation(id, cssText) {
            if (document.getElementById(id)) {
                return;
            }

            const style = document.createElement('style');
            style.id = id;
            style.textContent = cssText;
            document.head.appendChild(style);
        }

        // Generate floating particles
        function createParticle() {
            if (document.hidden || activeParticleCount >= MAX_PARTICLES) {
                return;
            }

            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: 3px;
                height: 3px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                pointer-events: none;
                z-index: 1;
            `;
            particle.style.left = Math.random() * 100 + 'vw';
            particle.style.animationDuration = (Math.random() * 4 + 4) + 's';
            particle.style.animationDelay = Math.random() * 2 + 's';
            particle.style.animation = `floatUp ${particle.style.animationDuration} linear infinite`;
            document.body.appendChild(particle);
            activeParticleCount += 1;

            ensureInlineAnimation('particle-animation', `
                @keyframes floatUp {
                    0% {
                        transform: translateY(100vh) rotate(0deg);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    90% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-10px) rotate(360deg);
                        opacity: 0;
                    }
                }
            `);

            setTimeout(() => {
                particle.remove();
                activeParticleCount = Math.max(0, activeParticleCount - 1);
            }, 8000);
        }

        function startParticleLoop() {
            if (particleTimerId) {
                return;
            }

            particleTimerId = window.setInterval(createParticle, PARTICLE_INTERVAL_MS);
        }

        function updateTime() {
            const now = new Date();
            const clockFormat = localStorage.getItem('clockFormat') || '24';
            const timeElement = getElement('zen-time');
            const preview12h = getElement('preview-12h');
            const preview24h = getElement('preview-24h');

            let timeString;
            if (clockFormat === '12') {
                const hours = now.getHours();
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const displayHours = hours % 12 || 12;
                timeString = `${displayHours}:${minutes}`;
                if (preview12h) {
                    preview12h.textContent = `${displayHours}:${minutes}`;
                }
            } else {
                const hours24 = String(now.getHours()).padStart(2, '0');
                const minutes24 = String(now.getMinutes()).padStart(2, '0');
                timeString = `${hours24}:${minutes24}`;
            }

            if (timeElement) {
                timeElement.textContent = timeString;
            }
            if (preview24h) {
                const hours24 = String(now.getHours()).padStart(2, '0');
                const minutes24 = String(now.getMinutes()).padStart(2, '0');
                preview24h.textContent = `${hours24}:${minutes24}`;
            }
        }

        function updateRAMUsage() {
            try {
                const ramElement = document.getElementById('ram-usage');
                if (!ramElement) return;

                // Use Performance API to get memory info if available
                if (performance.memory) {
                    const used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
                    const total = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
                    const limit = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024);
                    
                    ramElement.textContent = `${used}MB / ${total}MB (${limit}MB limit)`;
                } else {
                    // Fallback: estimate based on browser resources
                    const estimate = Math.round(Math.random() * 200 + 100); // Simulated usage
                    ramElement.textContent = `~${estimate}MB`;
                }
            } catch (error) {
                const ramElement = document.getElementById('ram-usage');
                if (ramElement) {
                    ramElement.textContent = 'N/A';
                }
            }
        }

        function updateSystemInfo() {
            // Update screen info
            const screenElement = document.getElementById('screen-info');
            if (screenElement) {
                screenElement.textContent = `${screen.width}×${screen.height}`;
            }

            // Update RAM usage using Performance API
            updateRAMUsage();

            // Update connection info
            const connectionElement = document.getElementById('connection-info');
            if (connectionElement) {
                if (navigator.connection) {
                    connectionElement.textContent = navigator.connection.effectiveType || 'Unknown';
                } else {
                    connectionElement.textContent = 'Online';
                }
            }
        }

        // Load random top quote - embedded quotes to avoid CORS issues
        function loadTopQuote() {
            const quotes = [
                {"quote": "Innovation distinguishes between a leader and a follower.", "author": "Steve Jobs"},
                {"quote": "Your most unhappy customers are your greatest source of learning.", "author": "Bill Gates"},
                {"quote": "The people who are crazy enough to think they can change the world are the ones who do.", "author": "Steve Jobs"},
                {"quote": "If something is important enough, even if the odds are against you, you should still do it.", "author": "Elon Musk"},
                {"quote": "Move fast and break things. Unless you are breaking stuff, you are not moving fast enough.", "author": "Mark Zuckerberg"},
                {"quote": "The best way to predict the future is to invent it.", "author": "Alan Kay"},
                {"quote": "If you double the number of experiments you do per year, you're going to double your inventiveness.", "author": "Jeff Bezos"},
                {"quote": "Don't be afraid to give up the good to go for the great.", "author": "John D. Rockefeller"},
                {"quote": "Great things in business are never done by one person; they're done by a team of people.", "author": "Steve Jobs"},
                {"quote": "Failure is an option here. If things are not failing, you are not innovating enough.", "author": "Elon Musk"},
                {"quote": "It's fine to celebrate success, but it is more important to heed the lessons of failure.", "author": "Bill Gates"},
                {"quote": "Work hard on something uncomfortably exciting.", "author": "Larry Page"},
                {"quote": "The biggest risk is not taking any risk.", "author": "Mark Zuckerberg"},
                {"quote": "It's not about ideas. It's about making ideas happen.", "author": "Scott Belsky"},
                {"quote": "If you are offered a seat on a rocket ship, don't ask what seat! Just get on.", "author": "Sheryl Sandberg"},
                {"quote": "The question I ask myself almost every day is, 'Am I doing the most important thing I could be doing?'", "author": "Mark Zuckerberg"},
                {"quote": "The only way to do great work is to love what you do.", "author": "Steve Jobs"},
                {"quote": "Don't compare yourself with anyone in this world. If you do so, you are insulting yourself.", "author": "Bill Gates"},
                {"quote": "If you live each day as if it was your last, someday you'll most certainly be right.", "author": "Steve Jobs"},
                {"quote": "Persistence is very important. You should not give up unless you are forced to give up.", "author": "Elon Musk"},
                {"quote": "I knew that if I failed, I wouldn't regret that. But I knew the one thing I might regret is not trying.", "author": "Jeff Bezos"},
                {"quote": "The true sign of intelligence is not knowledge but imagination.", "author": "Albert Einstein"},
                {"quote": "Stay hungry, stay foolish.", "author": "Steve Jobs"},
                {"quote": "Technology is nothing. What's important is that you have faith in people.", "author": "Steve Jobs"},
                {"quote": "If you can't make it good, at least make it look good.", "author": "Bill Gates"},
                {"quote": "Be stubborn on vision but flexible on details.", "author": "Jeff Bezos"},
                {"quote": "When something is important enough, you do it even if the odds are not in your favor.", "author": "Elon Musk"},
                {"quote": "Don't worry about failure; you only have to be right once.", "author": "Drew Houston"},
                {"quote": "Simplicity is the ultimate sophistication.", "author": "Leonardo da Vinci"},
                {"quote": "Any sufficiently advanced technology is indistinguishable from magic.", "author": "Arthur C. Clarke"},
                {"quote": "In the beginning was the Word, and the Word was with God, and the Word was God.", "author": "Jesus Christ"},
                {"quote": "With man this is impossible, but with God all things are possible.", "author": "Jesus Christ"},
                {"quote": "Imagination is more important than knowledge.", "author": "Albert Einstein"},
                {"quote": "If you can't fly then run, if you can't run then walk, if you can't walk then crawl, but whatever you do you have to keep moving forward.", "author": "Martin Luther King Jr."}
            ];
            
            try {
                console.log('Loading top quote...');
                
                // Get random quote
                const randomIndex = Math.floor(Math.random() * quotes.length);
                const selectedQuote = quotes[randomIndex];
                
                const topQuoteElement = document.querySelector('.top-quote');
                if (topQuoteElement) {
                    topQuoteElement.textContent = `"${selectedQuote.quote}" - ${selectedQuote.author}`;
                    console.log('Top quote loaded:', selectedQuote.quote);
                } else {
                    console.error('Top quote element not found');
                }
            } catch (error) {
                console.error('Could not load top quote. Error:', error);
                // Fallback quote
                const topQuoteElement = document.querySelector('.top-quote');
                if (topQuoteElement) {
                    topQuoteElement.textContent = '"Your journey shapes you"';
                }
            }
        }

        // Daily quotes system
        async function loadDailyQuotes() {
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const fallbackQuotes = {
                sunday: { primary: "Rest and recharge, PRISM", secondary: "User, Serene Sunday!" },
                monday: { primary: "Start your week strong, PRISM", secondary: "User, Happy Monday!" },
                tuesday: { primary: "Build momentum today, PRISM", secondary: "User, Terrific Tuesday!" },
                wednesday: { primary: "You're halfway there, PRISM", secondary: "User, Wonderful Wednesday!" },
                thursday: { primary: "Push through with power, PRISM", secondary: "User, Thriving Thursday!" },
                friday: { primary: "Celebrate your success, PRISM", secondary: "User, Happy Friday!" },
                saturday: { primary: "Enjoy your achievements, PRISM", secondary: "User, Spectacular Saturday!" }
            };

            try {
                console.log('Loading daily quotes...');

                if (window.location.protocol === 'file:') {
                    console.log('Using bundled daily quotes because file:// cannot fetch local JSON.');
                    const currentDay = days[new Date().getDay()];
                    const todayQuotes = fallbackQuotes[currentDay];
                    const primaryQuoteElement = document.getElementById('primary-quote');
                    const secondaryQuoteElement = document.getElementById('secondary-quote');

                    if (primaryQuoteElement && secondaryQuoteElement && todayQuotes) {
                        primaryQuoteElement.textContent = todayQuotes.primary;
                        secondaryQuoteElement.textContent = todayQuotes.secondary;
                        console.log('Fallback quotes applied for', currentDay);
                    }
                    return;
                }

                const response = await fetch('./quotes.json');
                if (!response.ok) {
                    throw new Error('Relative path failed');
                }
                const quotes = await response.json();
                console.log('Loaded quotes from relative path');
                
                const today = new Date().getDay();
                const currentDay = days[today];
                
                console.log(`Today is ${currentDay} (day ${today})`);
                
                const todayQuotes = quotes[currentDay];
                console.log('Today\'s quotes:', todayQuotes);
                
                const primaryQuoteElement = document.getElementById('primary-quote');
                const secondaryQuoteElement = document.getElementById('secondary-quote');
                
                if (primaryQuoteElement && secondaryQuoteElement && todayQuotes) {
                    primaryQuoteElement.textContent = todayQuotes.primary;
                    secondaryQuoteElement.textContent = todayQuotes.secondary;
                    console.log('Quotes updated successfully');
                } else {
                    console.error('Missing elements or quotes:', {
                        primaryElement: !!primaryQuoteElement,
                        secondaryElement: !!secondaryQuoteElement,
                        todayQuotes: !!todayQuotes
                    });
                }
            } catch (error) {
                console.log('Could not load daily quotes, using defaults. Error:', error);
                
                const today = new Date().getDay();
                const currentDay = days[today];
                const todayQuotes = fallbackQuotes[currentDay];
                const primaryQuoteElement = document.getElementById('primary-quote');
                const secondaryQuoteElement = document.getElementById('secondary-quote');
                
                if (primaryQuoteElement && secondaryQuoteElement && todayQuotes) {
                    primaryQuoteElement.textContent = todayQuotes.primary;
                    secondaryQuoteElement.textContent = todayQuotes.secondary;
                    console.log('Fallback quotes applied for', currentDay);
                }
            }
        }

                // Settings Modal Functions
        function openSettingsModal() {
            const modal = document.getElementById('settingsModal');
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Initialize with clock section
            showSettingsSection('clock');
        }

        function showSettingsSection(sectionName) {
            // Hide all sections
            const sections = document.querySelectorAll('.settings-section');
            sections.forEach(section => section.classList.remove('active'));
            
            // Show selected section
            const targetSection = document.getElementById(sectionName + '-section');
            if (targetSection) {
                targetSection.classList.add('active');
            }
            
            // Update nav item active state
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                if (item.getAttribute('data-section') === sectionName) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }

        // Attach click handlers to navigation items
        document.addEventListener('DOMContentLoaded', () => {
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    const section = item.getAttribute('data-section');
                    showSettingsSection(section);
                });
            });
            
            // Clock style card click handlers
            const styleCards = document.querySelectorAll('.style-card');
            styleCards.forEach(card => {
                card.addEventListener('click', () => {
                    const style = card.getAttribute('data-style');
                    selectClockStyle(style);
                });
            });
            
            // Clock format card click handlers
            const clockCards = document.querySelectorAll('.clock-card');
            clockCards.forEach(card => {
                card.addEventListener('click', () => {
                    const format = card.getAttribute('data-format');
                    selectClockFormat(format);
                });
            });
            
            // Load saved clock style and format on page load
            loadClockPreferences();
        });

        // Clock style selection
        function selectClockStyle(styleName) {
            console.log('selectClockStyle called with:', styleName);
            const cards = document.querySelectorAll('.style-card');
            cards.forEach(card => card.classList.remove('active'));
            
            const selectedCard = document.querySelector(`.style-card[data-style="${styleName}"]`);
            if (selectedCard) {
                selectedCard.classList.add('active');
                console.log('Active class added to card:', styleName);
            }
            
            // Apply the style to the main clock
            applyClockStyle(styleName);
            
            // Save to localStorage
            localStorage.setItem('clockStyle', styleName);
            markSectionDirty('clock');
            console.log('Clock style saved to localStorage:', styleName);
        }

        // Make functions globally accessible
        window.selectClockStyle = selectClockStyle;
        window.applyClockStyle = applyClockStyle;

        function applyClockStyle(styleName) {
            const clockElement = document.getElementById('zen-time');
            console.log('applyClockStyle called with:', styleName);
            console.log('Clock element found:', clockElement);
            
            if (!clockElement) {
                console.error('Clock element #zen-time not found!');
                return;
            }
            
            // Remove all clock style classes
            clockElement.classList.remove('clock-minimal', 'clock-serif', 'clock-handwritten', 
                                        'clock-minimal-light', 'clock-serif-condensed',
                                        'clock-bitcount', 'clock-corpta', 'clock-fenotype',
                                        'clock-nclkemgor', 'clock-westiva', 'clock-ammonite',
                                        'clock-crude', 'clock-ghetto', 'clock-zombiess');
            
            // Add the selected style class
            if (styleName !== 'default') {
                clockElement.classList.add(`clock-${styleName}`);
                console.log('Applied class:', `clock-${styleName}`);
                console.log('Current classes on clock:', clockElement.className);
            } else {
                console.log('Applied default style (no class added)');
            }
        }

        // Test function - call this from console to test styles
        window.testClockStyle = function(styleName) {
            console.log('Testing clock style:', styleName);
            applyClockStyle(styleName);
        };

        // Clock format selection
        function selectClockFormat(format) {
            console.log('selectClockFormat called with:', format);
            const cards = document.querySelectorAll('.clock-card');
            cards.forEach(card => card.classList.remove('active'));
            
            const selectedCard = document.querySelector(`.clock-card[data-format="${format}"]`);
            if (selectedCard) {
                selectedCard.classList.add('active');
                console.log('Active class added to format card:', format);
            }
            
            // Save to localStorage
            localStorage.setItem('clockFormat', format);
            markSectionDirty('clock');
            console.log('Clock format saved to localStorage:', format);
            
            // Update the time display immediately
            updateTime();
            console.log('Time updated with new format');
        }

        // Make function globally accessible
        window.selectClockFormat = selectClockFormat;

        // Load clock preferences from localStorage
        function loadClockPreferences() {
            const savedStyle = localStorage.getItem('clockStyle') || 'default';
            const savedFormat = localStorage.getItem('clockFormat') || '24';
            
            // Apply saved style
            applyClockStyle(savedStyle);
            
            // Update active states in settings
            const styleCard = document.querySelector(`.style-card[data-style="${savedStyle}"]`);
            if (styleCard) {
                document.querySelectorAll('.style-card').forEach(card => card.classList.remove('active'));
                styleCard.classList.add('active');
            }
            
            const formatCard = document.querySelector(`.clock-card[data-format="${savedFormat}"]`);
            if (formatCard) {
                document.querySelectorAll('.clock-card').forEach(card => card.classList.remove('active'));
                formatCard.classList.add('active');
            }
        }
        // Style selection
        function selectStyle(styleName) {
            const options = document.querySelectorAll('.style-option');
            options.forEach(option => option.classList.remove('active'));
            
            const selectedOption = document.querySelector(`[data-style="${styleName}"]`);
            if (selectedOption) {
                selectedOption.classList.add('active');
            }
            
            // Apply the style
            applyClockStyle(styleName);
        }

        // Theme selection
        function selectTheme(themeName) {
            const options = document.querySelectorAll('.theme-option, .theme-card');
            options.forEach(option => option.classList.remove('active'));
            
            const selectedOption = document.querySelector(`[data-theme="${themeName}"]`);
            if (selectedOption) {
                selectedOption.classList.add('active');
            }
            
            // Apply theme
            applyTheme(themeName);
            markSectionDirty('themes');
        }

        function applyTheme(themeName) {
            // Remove existing theme classes
            document.body.className = document.body.className.replace(/theme-\w+/g, '');
            
            // Apply new theme
            document.body.classList.add(`theme-${themeName}`);
            
            // Store preference
            localStorage.setItem('selectedTheme', themeName);
        }

        // Toggle settings
        function toggleSetting(settingName, element) {
            const isEnabled = element.checked;
            
            switch(settingName) {
                case 'dynamicGreetings':
                    localStorage.setItem('dynamicGreetings', isEnabled);
                    markSectionDirty('quotes');
                    // Control top quote display
                    const topQuoteElement = document.querySelector('.top-quote');
                    if (topQuoteElement) {
                        if (isEnabled) {
                            topQuoteElement.style.display = 'block';
                            loadTopQuote();
                        } else {
                            topQuoteElement.style.display = 'none';
                        }
                    }
                    break;
                case 'showGreetings':
                    localStorage.setItem('showGreetings', isEnabled);
                    markSectionDirty('quotes');
                    // Control daily quotes/greetings display
                    const successMessage = document.querySelector('.success-message');
                    if (successMessage) {
                        successMessage.style.display = isEnabled ? 'block' : 'none';
                    }
                    break;
            }
        }

        function closeModal(modalId) {
            const modal = document.getElementById(modalId);
            
            if (modalId === 'settingsModal') {
                // Slide out animation for settings modal
                modal.classList.remove('show');
                document.body.style.overflow = 'auto';
            } else {
                // Regular close for other modals
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        }

        // Close modal when clicking outside of it
        window.onclick = function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
            // Handle settings overlay click
            if (event.target.classList.contains('settings-overlay')) {
                closeModal('settingsModal');
            }
        }

        function showToast(message) {
            // Simple toast notification
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                z-index: 10000;
                animation: fadeIn 0.3s ease-in-out;
            `;
            toast.textContent = message;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, 3000);
        }

        function showSystemStats() {
            const ramInfo = document.getElementById('ram-usage').textContent;
            const stats = `
Browser: PRISM AI Browser
Platform: ${navigator.platform}
Language: ${navigator.language}
Cookies: ${navigator.cookieEnabled ? 'Enabled' : 'Disabled'}
Online: ${navigator.onLine ? 'Yes' : 'No'}
Screen: ${screen.width}×${screen.height}
Color Depth: ${screen.colorDepth}bit
RAM Usage: ${ramInfo}
Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}
            `.trim();
            
            navigator.clipboard.writeText(stats).then(() => {
                alert('System information copied to clipboard!');
            });
        }

        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }

        function ensurePanelIframeLoaded(panelId) {
            const panel = getElement(panelId);
            const iframe = panel?.querySelector('iframe[data-src]');
            if (iframe && !iframe.getAttribute('src')) {
                iframe.setAttribute('src', iframe.dataset.src);
            }
        }

        function setPanelOpenState(panelId, overlayId, isOpen) {
            const panel = getElement(panelId);
            const overlay = getElement(overlayId);
            if (!panel || !overlay) {
                return;
            }

            if (isOpen) {
                ensurePanelIframeLoaded(panelId);
            }

            panel.classList.toggle('active', isOpen);
            overlay.classList.toggle('active', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        }

        function openNotepad() {
            setPanelOpenState('notepadPanel', 'notepadOverlay', true);
        }

        function closeNotepad() {
            setPanelOpenState('notepadPanel', 'notepadOverlay', false);
        }

        function openColorGen() {
            setPanelOpenState('colorGenPanel', 'colorGenOverlay', true);
        }

        function closeColorGen() {
            setPanelOpenState('colorGenPanel', 'colorGenOverlay', false);
        }

        function openPromptSynthesizer() {
            setPanelOpenState('promptSynthesizerPanel', 'promptSynthesizerOverlay', true);
        }

        function closePromptSynthesizer() {
            setPanelOpenState('promptSynthesizerPanel', 'promptSynthesizerOverlay', false);
        }

        function openJsonToolkit() {
            setPanelOpenState('jsonToolkitPanel', 'jsonToolkitOverlay', true);
        }

        function closeJsonToolkit() {
            setPanelOpenState('jsonToolkitPanel', 'jsonToolkitOverlay', false);
        }

        function openCryptoUtils() {
            setPanelOpenState('cryptoUtilsPanel', 'cryptoUtilsOverlay', true);
        }

        function closeCryptoUtils() {
            setPanelOpenState('cryptoUtilsPanel', 'cryptoUtilsOverlay', false);
        }

        function openRegexWorkbench() {
            setPanelOpenState('regexWorkbenchPanel', 'regexWorkbenchOverlay', true);
        }

        function closeRegexWorkbench() {
            setPanelOpenState('regexWorkbenchPanel', 'regexWorkbenchOverlay', false);
        }

        function openMarkdownEditor() {
            setPanelOpenState('markdownEditorPanel', 'markdownEditorOverlay', true);
        }

        function closeMarkdownEditor() {
            setPanelOpenState('markdownEditorPanel', 'markdownEditorOverlay', false);
        }

        function openGitReference() {
            setPanelOpenState('gitReferencePanel', 'gitReferenceOverlay', true);
        }

        function closeGitReference() {
            setPanelOpenState('gitReferencePanel', 'gitReferenceOverlay', false);
        }

        function openTimeDate() {
            setPanelOpenState('timeDatePanel', 'timeDateOverlay', true);
        }

        function closeTimeDate() {
            setPanelOpenState('timeDatePanel', 'timeDateOverlay', false);
        }

        function openWritingAssistant() {
            setPanelOpenState('writingAssistantPanel', 'writingAssistantOverlay', true);
        }
        function closeWritingAssistant() {
            setPanelOpenState('writingAssistantPanel', 'writingAssistantOverlay', false);
        }

        function openLanguageLearning() {
            setPanelOpenState('languageLearningPanel', 'languageLearningOverlay', true);
        }
        function closeLanguageLearning() {
            setPanelOpenState('languageLearningPanel', 'languageLearningOverlay', false);
        }

        function openCodeExplainer() {
            setPanelOpenState('codeExplainerPanel', 'codeExplainerOverlay', true);
        }
        function closeCodeExplainer() {
            setPanelOpenState('codeExplainerPanel', 'codeExplainerOverlay', false);
        }

        function openCodeTranslator() {
            setPanelOpenState('codeTranslatorPanel', 'codeTranslatorOverlay', true);
        }
        function closeCodeTranslator() {
            setPanelOpenState('codeTranslatorPanel', 'codeTranslatorOverlay', false);
        }

        function openDecisionAnalyzer() {
            setPanelOpenState('decisionAnalyzerPanel', 'decisionAnalyzerOverlay', true);
        }
        function closeDecisionAnalyzer() {
            setPanelOpenState('decisionAnalyzerPanel', 'decisionAnalyzerOverlay', false);
        }

        // Listen for messages from color gen iframe
        window.addEventListener('message', function(event) {
            if (event.data && event.data.action === 'closeColorGen') {
                closeColorGen();
            }
            if (event.data && event.data.action === 'closePromptSynthesizer') {
                closePromptSynthesizer();
            }
            if (event.data && event.data.action === 'closeJsonToolkit') {
                closeJsonToolkit();
            }
            if (event.data && event.data.action === 'closeCryptoUtils') {
                closeCryptoUtils();
            }
            if (event.data && event.data.action === 'closeRegexWorkbench') {
                closeRegexWorkbench();
            }
            if (event.data && event.data.action === 'closeMarkdownEditor') {
                closeMarkdownEditor();
            }
            if (event.data && event.data.action === 'closeGitReference') {
                closeGitReference();
            }
            if (event.data && event.data.action === 'closeTimeDate') {
                closeTimeDate();
            }
            if (event.data && event.data.action === 'closeWritingAssistant') {
                closeWritingAssistant();
            }
            if (event.data && event.data.action === 'closeLanguageLearning') {
                closeLanguageLearning();
            }
            if (event.data && event.data.action === 'closeCodeExplainer') {
                closeCodeExplainer();
            }
            if (event.data && event.data.action === 'closeCodeTranslator') {
                closeCodeTranslator();
            }
            if (event.data && event.data.action === 'closeDecisionAnalyzer') {
                closeDecisionAnalyzer();
            }
        });

        function copyCurrentTime() {
            const now = new Date();
            const timeString = now.toISOString();
            navigator.clipboard.writeText(timeString).then(() => {
                showToast(`Current time copied: ${timeString}`);
            }).catch(() => {
                alert(`Current time copied: ${timeString}`);
            });
        }

        // Update localhost port based on common dev servers
        function updateLocalhostPort() {
            const commonPorts = [3000, 3001, 4000, 5000, 8000, 8080, 9000];
            const localhostLink = document.getElementById('localhost');
            
            // Check for running dev servers (this is a simplified approach)
            const currentHour = new Date().getHours();
            const port = commonPorts[currentHour % commonPorts.length];
            localhostLink.href = `http://localhost:${port}`;
            localhostLink.querySelector('.tool-desc').textContent = 
                `Quick access to localhost:${port}`;
        }

        // Initialize everything
        document.addEventListener('DOMContentLoaded', function() {
            // Ensure page starts at the top
            window.scrollTo(0, 0);
            isRestoringSettings = true;
            
            // Load background FIRST to avoid flash
            loadSavedBackground();
            
            scheduleClockUpdates();
            startSystemInfoLoop();
            startParticleLoop();
            updateLocalhostPort();
            loadDailyQuotes(); // Load daily quotes
            
            // Only load top quote if dynamicGreetings is enabled
            const dynamicGreetingsEnabled = localStorage.getItem('dynamicGreetings') !== 'false';
            if (dynamicGreetingsEnabled) {
                loadTopQuote(); // Load random top quote
            }
            
            loadAnimatedBackgrounds(); // Load animated backgrounds
            loadBackgroundGrid(); // Load background grid with custom wallpapers
            
            // Initialize scroll behavior after a short delay
            setTimeout(initializeScrollBehavior, 500);

            // Add click handler to large time display for fun interaction
            const largeTime = document.querySelector('.large-time');
            if (largeTime) {
                largeTime.addEventListener('click', function() {
                    // Create a ripple effect
                    const ripple = document.createElement('div');
                    ripple.style.cssText = `
                        position: absolute;
                        border-radius: 50%;
                        background: rgba(255, 255, 255, 0.3);
                        pointer-events: none;
                        transform: scale(0);
                        animation: ripple 0.6s linear;
                        width: 200px;
                        height: 200px;
                        left: 50%;
                        top: 50%;
                        margin-left: -100px;
                        margin-top: -100px;
                    `;
                    
                    // Add ripple animation if not exists
                    ensureInlineAnimation('ripple-animation', `
                        @keyframes ripple {
                            to {
                                transform: scale(4);
                                opacity: 0;
                            }
                        }
                    `);
                    
                    largeTime.style.position = 'relative';
                    largeTime.appendChild(ripple);
                    
                    setTimeout(() => {
                        ripple.remove();
                    }, 600);
                    
                    // Copy time to clipboard
                    copyCurrentTime();
                });
            }
            
            // Initialize settings event listeners
            initializeSettings();
            isRestoringSettings = false;
            
            // Listen for messages from notepad iframe
            window.addEventListener('message', function(event) {
                if (event.data.type === 'notepadSave') {
                    showToast('Notes saved successfully! 💾');
                } else if (event.data.type === 'closeNotepad') {
                    closeNotepad();
                } else if (event.data.type === 'notepadAction') {
                    if (event.data.action === 'download') {
                        showToast('Note downloaded! ⬇️');
                    } else if (event.data.action === 'reset') {
                        showToast('Note reset! 🔄');
                    }
                }
            });

            // Close notepad with Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    const notepadPanel = document.getElementById('notepadPanel');
                    if (notepadPanel && notepadPanel.classList.contains('active')) {
                        closeNotepad();
                    }
                    
                    const colorGenPanel = document.getElementById('colorGenPanel');
                    if (colorGenPanel && colorGenPanel.classList.contains('active')) {
                        closeColorGen();
                    }
                    
                    const promptSynthesizerPanel = document.getElementById('promptSynthesizerPanel');
                    if (promptSynthesizerPanel && promptSynthesizerPanel.classList.contains('active')) {
                        closePromptSynthesizer();
                    }

                    const jsonToolkitPanel = document.getElementById('jsonToolkitPanel');
                    if (jsonToolkitPanel && jsonToolkitPanel.classList.contains('active')) {
                        closeJsonToolkit();
                    }

                    const cryptoUtilsPanel = document.getElementById('cryptoUtilsPanel');
                    if (cryptoUtilsPanel && cryptoUtilsPanel.classList.contains('active')) {
                        closeCryptoUtils();
                    }

                    const regexWorkbenchPanel = document.getElementById('regexWorkbenchPanel');
                    if (regexWorkbenchPanel && regexWorkbenchPanel.classList.contains('active')) {
                        closeRegexWorkbench();
                    }

                    const markdownEditorPanel = document.getElementById('markdownEditorPanel');
                    if (markdownEditorPanel && markdownEditorPanel.classList.contains('active')) {
                        closeMarkdownEditor();
                    }

                    const gitReferencePanel = document.getElementById('gitReferencePanel');
                    if (gitReferencePanel && gitReferencePanel.classList.contains('active')) {
                        closeGitReference();
                    }

                    const timeDatePanel = document.getElementById('timeDatePanel');
                    if (timeDatePanel && timeDatePanel.classList.contains('active')) {
                        closeTimeDate();
                    }

                    ['writingAssistantPanel','languageLearningPanel','codeExplainerPanel','codeTranslatorPanel','decisionAnalyzerPanel'].forEach(id => {
                        const p = document.getElementById(id);
                        if (p && p.classList.contains('active')) {
                            const closeFnName = 'close' + id.replace('Panel','').replace(/^./, c => c.toUpperCase());
                            if (typeof window[closeFnName] === 'function') window[closeFnName]();
                        }
                    });
                }
            });

            document.addEventListener('visibilitychange', function() {
                if (!document.hidden) {
                    scheduleClockUpdates();
                    updateSystemInfo();
                }
            });
        });

        // Scroll to Dev Space function
        function scrollToDevSpace() {
            const viewportHeight = window.innerHeight;
            window.scrollTo({
                top: viewportHeight,
                behavior: 'smooth'
            });
        }

        // Make function globally accessible
        window.scrollToDevSpace = scrollToDevSpace;

        // Clean scroll behavior implementation
        function initializeScrollBehavior() {
            let isAnimating = false;
            let scrollLocked = false;
            
            // Simple scroll event handler
            window.addEventListener('scroll', function(e) {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const viewportHeight = window.innerHeight;
                
                // Add scrolled class when past first screen
                if (scrollTop > 50) {
                    document.body.classList.add('scrolled');
                } else {
                    document.body.classList.remove('scrolled');
                }
                
                // Lock scroll when reaching dev-space
                if (scrollTop >= viewportHeight - 50) {
                    if (!scrollLocked) {
                        scrollLocked = true;
                        // Snap to exactly the viewport height
                        window.scrollTo({
                            top: viewportHeight,
                            behavior: 'smooth'
                        });
                        // Prevent further scrolling by adding a class
                        document.body.classList.add('scroll-locked');
                    }
                } else if (scrollTop < viewportHeight - 200) {
                    // Re-enable scrolling if user scrolls back up significantly
                    if (scrollLocked) {
                        scrollLocked = false;
                        document.body.classList.remove('scroll-locked');
                    }
                }
            });
            
            // Click handler for scroll indicator
            const scrollIndicator = document.querySelector('.scroll-indicator');
            if (scrollIndicator) {
                scrollIndicator.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (!isAnimating) {
                        isAnimating = true;
                        window.scrollTo({
                            top: window.innerHeight,
                            behavior: 'smooth'
                        });
                        setTimeout(() => {
                            isAnimating = false;
                        }, 1000);
                    }
                });
            }
        }

        function initializeSettings() {
            // Navigation click handlers
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', function() {
                    const section = this.getAttribute('data-section');
                    showSettingsSection(section);
                });
            });

            // Clock format options
            document.querySelectorAll('.format-option').forEach(option => {
                option.addEventListener('click', function() {
                    const format = this.getAttribute('data-format');
                    selectClockFormat(format);
                });
            });

            // Style options
            document.querySelectorAll('.style-option').forEach(option => {
                option.addEventListener('click', function() {
                    const style = this.getAttribute('data-style');
                    selectStyle(style);
                });
            });

            // Theme options
            document.querySelectorAll('.theme-option, .theme-card').forEach(option => {
                option.addEventListener('click', function() {
                    const theme = this.getAttribute('data-theme');
                    selectTheme(theme);
                });
            });

            // Toggle switches
            document.getElementById('dynamicGreetings')?.addEventListener('change', function() {
                toggleSetting('dynamicGreetings', this);
            });

            document.getElementById('showGreetings')?.addEventListener('change', function() {
                toggleSetting('showGreetings', this);
            });

            // Clock color picker
            const clockColorPicker = document.getElementById('clockColorPicker');
            if (clockColorPicker) {
                clockColorPicker.addEventListener('input', function() {
                    updateClockColor(this.value);
                });
            }

            // Hex input field
            const clockColorValue = document.getElementById('clockColorValue');
            if (clockColorValue) {
                clockColorValue.addEventListener('input', function() {
                    let value = this.value;
                    // Ensure it starts with #
                    if (!value.startsWith('#')) {
                        value = '#' + value;
                        this.value = value;
                    }
                    // If valid hex color, update
                    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                        clockColorPicker.value = value;
                        updateClockColor(value);
                    }
                });

                // Select all text on focus
                clockColorValue.addEventListener('focus', function() {
                    this.select();
                });
            }

            // Load saved preferences
            loadSavedPreferences();
        }

        // Clock color functions
        function updateClockColor(color) {
            const clockElement = document.getElementById('zen-time');
            if (clockElement) {
                clockElement.style.color = color;
            }
            
            // Update the color value display
            const colorValue = document.getElementById('clockColorValue');
            const colorPicker = document.getElementById('clockColorPicker');
            
            if (colorValue) {
                colorValue.value = color;
            }
            if (colorPicker) {
                colorPicker.value = color;
            }
            
            // Update preview in all clock format cards
            updateClockPreviewColors(color);
            
            // Save to localStorage
            localStorage.setItem('clockColor', color);
            markSectionDirty('clock');
            
            // Add to color history
            addToColorHistory(color);
        }

        function updateClockPreviewColors(color) {
            // Update 12-hour and 24-hour preview colors
            const preview12h = document.getElementById('preview-12h');
            const preview24h = document.getElementById('preview-24h');
            
            if (preview12h) {
                preview12h.style.color = color;
            }
            if (preview24h) {
                preview24h.style.color = color;
            }
        }

        function addToColorHistory(color) {
            // Get existing history
            let history = JSON.parse(localStorage.getItem('clockColorHistory') || '[]');
            
            // Remove if already exists
            history = history.filter(c => c.toLowerCase() !== color.toLowerCase());
            
            // Add to beginning
            history.unshift(color);
            
            // Keep only last 8 colors
            history = history.slice(0, 8);
            
            // Save back
            localStorage.setItem('clockColorHistory', JSON.stringify(history));
            
            // Update UI
            renderColorHistory();
        }

        function renderColorHistory() {
            const historyContainer = document.getElementById('colorHistory');
            if (!historyContainer) return;
            
            const history = JSON.parse(localStorage.getItem('clockColorHistory') || '[]');
            
            historyContainer.innerHTML = '';
            
            history.forEach(color => {
                const colorItem = document.createElement('div');
                colorItem.className = 'color-history-item';
                colorItem.style.backgroundColor = color;
                colorItem.setAttribute('data-color', color);
                colorItem.title = color;
                colorItem.onclick = () => updateClockColor(color);
                historyContainer.appendChild(colorItem);
            });
        }

        function resetClockColor() {
            const defaultColor = '#ffffff';
            const clockColorPicker = document.getElementById('clockColorPicker');
            
            if (clockColorPicker) {
                clockColorPicker.value = defaultColor;
            }
            
            updateClockColor(defaultColor);
        }

        function clearColorHistory() {
            // Clear the history from localStorage
            localStorage.removeItem('clockColorHistory');
            
            // Clear the UI
            const historyContainer = document.getElementById('colorHistory');
            if (historyContainer) {
                historyContainer.innerHTML = '';
            }
            
            // Show a confirmation toast
            showToast('Color history cleared!');
        }

        // Make functions globally accessible
        window.resetClockColor = resetClockColor;
        window.clearColorHistory = clearColorHistory;

        // Background selection functions
        function selectBackground(bgPath) {
            const body = document.body;
            
            // Remove active class from all background cards
            document.querySelectorAll('.background-card').forEach(card => {
                card.classList.remove('active');
            });
            
            // Add active class to selected card
            const selectedCard = document.querySelector(`.background-card[data-bg="${bgPath}"]`);
            if (selectedCard) {
                selectedCard.classList.add('active');
            }
            
            // Apply background
            if (bgPath === 'default') {
                body.style.backgroundImage = 'url(./images/BG.png)';
                body.style.backgroundColor = '';
            } else {
                body.style.backgroundImage = `url('${bgPath}')`;
                body.style.backgroundColor = '';
            }
            
            body.style.backgroundSize = 'cover';
            body.style.backgroundPosition = 'center';
            body.style.backgroundRepeat = 'no-repeat';
            body.style.backgroundAttachment = 'fixed';
            
            // Remove any animated background (video or img)
            const existingVideo = document.getElementById('animated-bg-video');
            const existingImg = document.getElementById('animated-bg-img');
            if (existingVideo) {
                existingVideo.remove();
            }
            if (existingImg) {
                existingImg.remove();
            }
            
            // Save to localStorage
            localStorage.setItem('selectedBackground', bgPath);
            localStorage.removeItem('selectedAnimatedBackground');
            markSectionDirty('themes');
        }

        function selectAnimatedBackground(bgPath) {
            const body = document.body;
            
            // Remove active class from all animated background cards
            document.querySelectorAll('#animatedBackgroundGrid .background-card').forEach(card => {
                card.classList.remove('active');
            });
            
            // Add active class to selected card
            const selectedCard = document.querySelector(`#animatedBackgroundGrid .background-card[data-bg="${bgPath}"]`);
            if (selectedCard) {
                selectedCard.classList.add('active');
            }
            
            // Remove existing animated background (video or img)
            const existingVideo = document.getElementById('animated-bg-video');
            const existingImg = document.getElementById('animated-bg-img');
            if (existingVideo) {
                existingVideo.remove();
            }
            if (existingImg) {
                existingImg.remove();
            }
            
            if (bgPath === 'none') {
                // Keep the current static background
                const savedBg = localStorage.getItem('selectedBackground') || 'default';
                selectBackground(savedBg);
            } else {
                // Check if it's a video or GIF
                const isVideo = bgPath.endsWith('.mp4') || bgPath.endsWith('.webm');
                const isGif = bgPath.endsWith('.gif');
                
                if (isVideo) {
                    // Create video element for MP4/WebM
                    const video = document.createElement('video');
                    video.id = 'animated-bg-video';
                    video.autoplay = true;
                    video.loop = true;
                    video.muted = true;
                    video.playsInline = true;
                    video.src = bgPath;
                    video.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        z-index: -1;
                    `;
                    
                    // Remove static background
                    body.style.backgroundImage = 'none';
                    
                    // Insert video as first child
                    body.insertBefore(video, body.firstChild);
                } else if (isGif) {
                    // Create img element for GIF
                    const img = document.createElement('img');
                    img.id = 'animated-bg-img';
                    img.src = bgPath;
                    img.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        z-index: -1;
                    `;
                    
                    // Remove static background
                    body.style.backgroundImage = 'none';
                    
                    // Insert img as first child
                    body.insertBefore(img, body.firstChild);
                }
            }
            
            // Save to localStorage
            localStorage.setItem('selectedAnimatedBackground', bgPath);
            markSectionDirty('themes');
        }

        // Make functions globally accessible
        window.selectBackground = selectBackground;
        window.selectAnimatedBackground = selectAnimatedBackground;

        // Upload custom wallpaper
        function uploadWallpaper(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showToast('Please select a valid image file');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = e.target.result;
                
                // Save to localStorage
                const customWallpapers = JSON.parse(localStorage.getItem('customWallpapers') || '[]');
                customWallpapers.push(imageData);
                localStorage.setItem('customWallpapers', JSON.stringify(customWallpapers));
                
                // Apply the wallpaper
                selectBackground(imageData);
                
                // Reload the background grid
                loadBackgroundGrid();
                
                showToast('Wallpaper uploaded successfully!');
            };
            reader.readAsDataURL(file);
        }

        // Upload custom animated GIF
        function uploadAnimatedBg(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            // Validate file type
            if (file.type !== 'image/gif') {
                showToast('Please select a valid GIF file');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const gifData = e.target.result;
                
                // Save to localStorage
                const customAnimatedBgs = JSON.parse(localStorage.getItem('customAnimatedBgs') || '[]');
                customAnimatedBgs.push(gifData);
                localStorage.setItem('customAnimatedBgs', JSON.stringify(customAnimatedBgs));
                
                // Apply the animated background
                selectAnimatedBackground(gifData);
                
                // Reload the animated background grid
                loadAnimatedBackgrounds();
                
                showToast('Animated background uploaded successfully!');
            };
            reader.readAsDataURL(file);
        }

        // Load background grid with custom uploads
        function loadBackgroundGrid() {
            const backgroundGrid = document.getElementById('backgroundGrid');
            if (!backgroundGrid) return;
            
            // Clear existing backgrounds (except the first few)
            backgroundGrid.innerHTML = '';
            
            // Add default background
            const defaultCard = document.createElement('div');
            defaultCard.className = 'background-card';
            defaultCard.setAttribute('data-bg', 'default');
            defaultCard.onclick = () => selectBackground('default');
            defaultCard.innerHTML = `
                <img src="./images/BG.png" class="background-preview-img" alt="Default Background">
            `;
            backgroundGrid.appendChild(defaultCard);
            
            // Add predefined wallpapers
            const wallpapers = [
                './images/Wallpapers/1 (1).jpg',
                './images/Wallpapers/1 (1).png',
                './images/Wallpapers/1 (2).jpg',
                './images/Wallpapers/1 (2).png',
                './images/Wallpapers/1 (3).jpg',
                './images/Wallpapers/1 (3).png',
                './images/Wallpapers/1 (4).png'
            ];
            
            wallpapers.forEach((wallpaper, index) => {
                const card = document.createElement('div');
                card.className = 'background-card';
                card.setAttribute('data-bg', wallpaper);
                card.onclick = () => selectBackground(wallpaper);
                card.innerHTML = `
                    <img src="${wallpaper}" class="background-preview-img" alt="Wallpaper ${index + 1}">
                `;
                backgroundGrid.appendChild(card);
            });
            
            // Add custom uploaded wallpapers
            const customWallpapers = JSON.parse(localStorage.getItem('customWallpapers') || '[]');
            customWallpapers.forEach((wallpaper, index) => {
                const card = document.createElement('div');
                card.className = 'background-card';
                card.setAttribute('data-bg', wallpaper);
                card.onclick = () => selectBackground(wallpaper);
                card.innerHTML = `
                    <img src="${wallpaper}" class="background-preview-img" alt="Custom ${index + 1}">
                    <button class="btn-delete-bg" onclick="deleteCustomWallpaper(event, ${index})" title="Delete">×</button>
                `;
                backgroundGrid.appendChild(card);
            });
        }

        // Delete custom wallpaper
        function deleteCustomWallpaper(event, index) {
            event.stopPropagation();
            
            const customWallpapers = JSON.parse(localStorage.getItem('customWallpapers') || '[]');
            customWallpapers.splice(index, 1);
            localStorage.setItem('customWallpapers', JSON.stringify(customWallpapers));
            
            loadBackgroundGrid();
            showToast('Wallpaper deleted');
        }

        // Delete custom animated background
        function deleteCustomAnimatedBg(event, index) {
            event.stopPropagation();
            
            const customAnimatedBgs = JSON.parse(localStorage.getItem('customAnimatedBgs') || '[]');
            customAnimatedBgs.splice(index, 1);
            localStorage.setItem('customAnimatedBgs', JSON.stringify(customAnimatedBgs));
            
            loadAnimatedBackgrounds();
            showToast('Animated background deleted');
        }

        // Make functions globally accessible
        window.uploadWallpaper = uploadWallpaper;
        window.uploadAnimatedBg = uploadAnimatedBg;
        window.deleteCustomWallpaper = deleteCustomWallpaper;
        window.deleteCustomAnimatedBg = deleteCustomAnimatedBg;

        // Load animated backgrounds dynamically
        function loadAnimatedBackgrounds() {
            const animatedBgGrid = document.getElementById('animatedBackgroundGrid');
            if (!animatedBgGrid) return;
            
            // Clear existing content
            animatedBgGrid.innerHTML = '';
            
            // List of animated background files from bg-gifs folder
            const animatedBgs = [
                './images/bg-gifs/1.gif',
                './images/bg-gifs/2.gif',
            ];
            
            // Add cards for each predefined animated background
            animatedBgs.forEach((bgPath, index) => {
                const card = document.createElement('div');
                card.className = 'background-card';
                card.setAttribute('data-bg', bgPath);
                card.onclick = () => selectAnimatedBackground(bgPath);
                
                const isVideo = bgPath.endsWith('.mp4') || bgPath.endsWith('.webm');
                
                if (isVideo) {
                    card.innerHTML = `
                        <video class="animated-background-preview" autoplay loop muted playsinline>
                            <source src="${bgPath}" type="video/${bgPath.split('.').pop()}">
                        </video>
                    `;
                } else {
                    // For GIFs
                    card.innerHTML = `
                        <img src="${bgPath}" class="animated-background-preview" alt="Animated BG ${index + 1}">
                    `;
                }
                
                animatedBgGrid.appendChild(card);
            });
            
            // Add custom uploaded animated backgrounds
            const customAnimatedBgs = JSON.parse(localStorage.getItem('customAnimatedBgs') || '[]');
            customAnimatedBgs.forEach((bgData, index) => {
                const card = document.createElement('div');
                card.className = 'background-card';
                card.setAttribute('data-bg', bgData);
                card.onclick = () => selectAnimatedBackground(bgData);
                card.innerHTML = `
                    <img src="${bgData}" class="animated-background-preview" alt="Custom GIF ${index + 1}">
                    <button class="btn-delete-bg" onclick="deleteCustomAnimatedBg(event, ${index})" title="Delete">×</button>
                `;
                animatedBgGrid.appendChild(card);
            });
        }

        function loadSavedPreferences() {
            isRestoringSettings = true;

            // Load clock format
            const savedFormat = localStorage.getItem('clockFormat') || '24';
            const formatOption = document.querySelector(`[data-format="${savedFormat}"]`);
            if (formatOption) {
                formatOption.classList.add('active');
            }

            // Load clock style
            const savedStyle = localStorage.getItem('clockStyle') || 'default';
            applyClockStyle(savedStyle);

            // Load theme
            const savedTheme = localStorage.getItem('selectedTheme') || 'home';
            applyTheme(savedTheme);
            document.querySelectorAll('.theme-card').forEach(card => card.classList.remove('active'));
            document.querySelector(`.theme-card[data-theme="${savedTheme}"]`)?.classList.add('active');

            // Load toggle states
            const dynamicGreetings = localStorage.getItem('dynamicGreetings') !== 'false';
            const showGreetings = localStorage.getItem('showGreetings') !== 'false';

            const dynamicToggle = document.getElementById('dynamicGreetings');
            const showToggle = document.getElementById('showGreetings');

            if (dynamicToggle) dynamicToggle.checked = dynamicGreetings;
            if (showToggle) showToggle.checked = showGreetings;

            // Apply settings
            const topQuoteElement = document.querySelector('.top-quote');
            const successMessage = document.querySelector('.success-message');
            
            if (!dynamicGreetings && topQuoteElement) {
                topQuoteElement.style.display = 'none';
            }
            
            if (!showGreetings && successMessage) {
                successMessage.style.display = 'none';
            }

            // Load clock color
            const savedColor = localStorage.getItem('clockColor') || '#ffffff';
            const clockColorPicker = document.getElementById('clockColorPicker');
            const clockColorValue = document.getElementById('clockColorValue');
            
            if (clockColorPicker) {
                clockColorPicker.value = savedColor;
            }
            if (clockColorValue) {
                clockColorValue.value = savedColor;
            }
            
            // Apply saved color to clock
            const clockElement = document.getElementById('zen-time');
            if (clockElement) {
                clockElement.style.color = savedColor;
            }
            
            // Update preview colors
            updateClockPreviewColors(savedColor);
            
            // Render color history
            renderColorHistory();
            
            // Load background - must happen before page is fully visible
            loadSavedBackground();
            isRestoringSettings = false;
        }
        
        function loadSavedBackground() {
            const savedBackground = localStorage.getItem('selectedBackground');
            const savedAnimatedBg = localStorage.getItem('selectedAnimatedBackground');
            
            // Check for animated background first
            if (savedAnimatedBg && savedAnimatedBg !== 'none') {
                selectAnimatedBackground(savedAnimatedBg);
            } else if (savedBackground && savedBackground !== 'default') {
                // Apply saved static background
                selectBackground(savedBackground);
            }
        }
        
        function scheduleClockUpdates() {
            updateTime();

            if (clockTimerId) {
                clearTimeout(clockTimerId);
            }
            if (clockIntervalId) {
                clearInterval(clockIntervalId);
            }

            const delayUntilNextMinute = 60000 - (Date.now() % 60000);
            clockTimerId = window.setTimeout(() => {
                updateTime();
                clockIntervalId = window.setInterval(updateTime, 60000);
            }, delayUntilNextMinute);
        }

        function startSystemInfoLoop() {
            updateSystemInfo();

            if (systemInfoTimerId) {
                return;
            }

            systemInfoTimerId = window.setInterval(() => {
                if (!document.hidden) {
                    updateSystemInfo();
                }
            }, SYSTEM_INFO_INTERVAL_MS);
        }

        console.log('🚀 PRISM AI Browser Developer Homepage loaded successfully!');
        console.log('💡 Features: Time display, dev tools, real-time system info, quick actions');
        
        // Add some developer-friendly console styling
        console.log('%c🎨 PRISM AI Browser - Developer Mode Active', 'color: #00ff88; font-size: 16px; font-weight: bold;');

        //settings
        function toggleSettings() {
  const box = document.getElementById("bgBox");
  box.classList.toggle("active");
}

// Save color selection
document.getElementById("colorPicker").addEventListener("input", function(e) {
  const color = e.target.value;
  document.body.style.background = color;
  localStorage.setItem("customBackground", color);
  localStorage.removeItem("customBackgroundImage");
});

// Save image selection
document.getElementById("imagePicker").addEventListener("change", function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const imgData = event.target.result;
    document.body.style.background = `url(${imgData}) no-repeat center center fixed`;
    document.body.style.backgroundSize = "cover";
    localStorage.setItem("customBackgroundImage", imgData);
    localStorage.removeItem("customBackground");
  };
  reader.readAsDataURL(file);
});

// Reset background
function resetBackground() {
  document.body.style.background = "";
  localStorage.removeItem("customBackground");
  localStorage.removeItem("customBackgroundImage");
  localStorage.removeItem("selectedBackground");
  localStorage.removeItem("selectedAnimatedBackground");
  
  // Apply default background
  selectBackground('default');
}

// Note: Background loading is handled by loadSavedBackground() in DOMContentLoaded
// The window.onload was conflicting with the main background system and has been removed

// Focus Timer is now loaded via iframe from focus-settings.html

