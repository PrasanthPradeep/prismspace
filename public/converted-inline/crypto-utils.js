
        // Switch tabs
        function switchTab(e, tabName) {
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');
            e.target.classList.add('active');
        }

        // MD5 implementation (basic)
        function md5(str) {
            function md5_init(msg) {
                let A = 0x67452301, B = 0xefcdab89, C = 0x98badcfe, D = 0x10325476;
                const k = [];
                for (let i = 0; i < 64; i++) k[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000);
                msg = str2bin(msg);
                let tail = msg.length % 64;
                msg += '\x80';
                while ((msg.length % 64) !== 56) msg += '\x00';
                for (let i = 0; i < 8; i++) msg += String.fromCharCode((str.length * 8) >> (i * 8) & 0xff);
                
                for (let m = 0; m < msg.length; m += 64) {
                    let x = [];
                    for (let i = 0; i < 16; i++) {
                        x[i] = msg.charCodeAt(m + i * 4) | (msg.charCodeAt(m + i * 4 + 1) << 8) | 
                               (msg.charCodeAt(m + i * 4 + 2) << 16) | (msg.charCodeAt(m + i * 4 + 3) << 24);
                    }
                    [A, B, C, D] = md5_main(A, B, C, D, x, k);
                }
                return [(A & 0xff), (A >> 8 & 0xff), (A >> 16 & 0xff), (A >> 24 & 0xff),
                        (B & 0xff), (B >> 8 & 0xff), (B >> 16 & 0xff), (B >> 24 & 0xff),
                        (C & 0xff), (C >> 8 & 0xff), (C >> 16 & 0xff), (C >> 24 & 0xff),
                        (D & 0xff), (D >> 8 & 0xff), (D >> 16 & 0xff), (D >> 24 & 0xff)];
            }
            
            function str2bin(str) {
                let bin = '';
                for (let i = 0; i < str.length; i++) bin += String.fromCharCode(str.charCodeAt(i));
                return bin;
            }
            
            function md5_main(A, B, C, D, X, k) {
                for (let i = 0; i < 12; i++) {
                    A = (A + ((B & C) | (~B & D)) + k[i] + X[i]) >>> 0; A = ((A << 7) | (A >>> 25)) >>> 0; A = (A + B) >>> 0;
                    D = (D + ((A & B) | (~A & C)) + k[i + 1] + X[(i + 1) % 16]) >>> 0; D = ((D << 12) | (D >>> 20)) >>> 0; D = (D + A) >>> 0;
                }
                return [A, B, C, D];
            }
            
            const hash = md5_init(msg);
            return hash.map(x => ('0' + x.toString(16)).slice(-2)).join('');
        }

        // Hash function
        async function hashText(algorithm) {
            const input = document.getElementById('hashInput').value;
            if (!input) {
                document.getElementById('hashOutput').textContent = 'Please enter text to hash';
                return;
            }

            let result = '';
            
            if (algorithm === 'md5') {
                result = md5(input);
            } else {
                const algoMap = { 'sha1': 'SHA-1', 'sha256': 'SHA-256', 'sha512': 'SHA-512' };
                const data = new TextEncoder().encode(input);
                const hashBuffer = await crypto.subtle.digest(algoMap[algorithm], data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                result = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            }

            document.getElementById('hashOutput').innerHTML = result + '<button class="copy-btn" onclick="copyToClipboard(\'hashOutput\')">Copy</button>';
        }

        // Base64
        function encodeBase64() {
            const input = document.getElementById('base64Input').value;
            const encoded = btoa(unescape(encodeURIComponent(input)));
            document.getElementById('base64Output').innerHTML = encoded + '<button class="copy-btn" onclick="copyToClipboard(\'base64Output\')">Copy</button>';
        }

        function decodeBase64() {
            const input = document.getElementById('base64Input').value;
            try {
                const decoded = decodeURIComponent(escape(atob(input)));
                document.getElementById('base64Output').innerHTML = decoded + '<button class="copy-btn" onclick="copyToClipboard(\'base64Output\')">Copy</button>';
            } catch (e) {
                document.getElementById('base64Output').innerHTML = '<span style="color: #ff4444;">❌ Invalid base64</span>';
            }
        }

        function encodeBase64URL() {
            const input = document.getElementById('base64Input').value;
            const encoded = btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            document.getElementById('base64Output').innerHTML = encoded + '<button class="copy-btn" onclick="copyToClipboard(\'base64Output\')">Copy</button>';
        }

        function decodeBase64URL() {
            let input = document.getElementById('base64Input').value;
            input = input.replace(/-/g, '+').replace(/_/g, '/');
            while (input.length % 4) input += '=';
            try {
                const decoded = atob(input);
                document.getElementById('base64Output').innerHTML = decoded + '<button class="copy-btn" onclick="copyToClipboard(\'base64Output\')">Copy</button>';
            } catch (e) {
                document.getElementById('base64Output').innerHTML = '<span style="color: #ff4444;">❌ Invalid base64</span>';
            }
        }

        // URL Encode/Decode
        function urlEncode() {
            const input = document.getElementById('urlInput').value;
            const encoded = encodeURIComponent(input);
            document.getElementById('urlOutput').innerHTML = encoded + '<button class="copy-btn" onclick="copyToClipboard(\'urlOutput\')">Copy</button>';
        }

        function urlDecode() {
            const input = document.getElementById('urlInput').value;
            try {
                const decoded = decodeURIComponent(input);
                document.getElementById('urlOutput').innerHTML = decoded + '<button class="copy-btn" onclick="copyToClipboard(\'urlOutput\')">Copy</button>';
            } catch (e) {
                document.getElementById('urlOutput').innerHTML = '<span style="color: #ff4444;">❌ Invalid URL encoding</span>';
            }
        }

        // JWT Decoder
        document.getElementById('jwtInput').addEventListener('input', () => {
            const jwt = document.getElementById('jwtInput').value.trim();
            if (!jwt) {
                document.getElementById('jwtOutput').innerHTML = 'JWT will be decoded when you paste a token';
                return;
            }

            const parts = jwt.split('.');
            if (parts.length !== 3) {
                document.getElementById('jwtOutput').innerHTML = '<span style="color: #ff4444;">❌ Invalid JWT format</span>';
                return;
            }

            try {
                const header = JSON.parse(atob(parts[0]));
                const payload = JSON.parse(atob(parts[1]));
                
                let expiry = 'No expiry set';
                if (payload.exp) {
                    const expiryDate = new Date(payload.exp * 1000);
                    const now = new Date();
                    const expired = expiryDate < now;
                    expiry = `${expiryDate.toISOString()} (${expired ? '❌ Expired' : '✓ Valid'})`;
                }

                document.getElementById('jwtOutput').innerHTML = `
                    <div class="info-box">
                        <div class="info-box-label">Header</div>
                        <pre style="font-size: 0.8rem; overflow-x: auto;">${JSON.stringify(header, null, 2)}</pre>
                    </div>
                    <div class="info-box">
                        <div class="info-box-label">Payload</div>
                        <pre style="font-size: 0.8rem; overflow-x: auto;">${JSON.stringify(payload, null, 2)}</pre>
                    </div>
                    <div class="info-box">
                        <div class="info-box-label">Expiry</div>
                        <div style="color: ${payload.exp && new Date(payload.exp * 1000) < new Date() ? '#ff4444' : '#00ff88'};">${expiry}</div>
                    </div>
                `;
            } catch (e) {
                document.getElementById('jwtOutput').innerHTML = '<span style="color: #ff4444;">❌ Failed to decode JWT</span>';
            }
        });

        // UUID Generator
        function generateUUIDs() {
            const count = Math.min(Math.max(parseInt(document.getElementById('uuidCount').value) || 1, 1), 100);
            let uuids = '';
            for (let i = 0; i < count; i++) {
                uuids += crypto.randomUUID() + '\
';
            }
            document.getElementById('uuidOutput').innerHTML = uuids.trim() + '<button class="copy-btn" onclick="copyToClipboard(\'uuidOutput\')">Copy</button>';
        }

        // Password Strength
        document.getElementById('passwordInput').addEventListener('input', () => {
            const password = document.getElementById('passwordInput').value;
            analyzePassword(password);
        });

        function analyzePassword(password) {
            if (!password) {
                document.getElementById('passwordAnalysis').innerHTML = '';
                return;
            }

            const entropy = calculateEntropy(password);
            const strength = getStrength(entropy);
            const crackTime = estimateCrackTime(entropy);
            const suggestions = getSuggestions(password);

            const strengthClass = strength === 'Weak' ? 'weak' : strength === 'Fair' ? 'fair' : strength === 'Good' ? 'good' : 'strong';

            let html = `
                <div class="info-grid">
                    <div class="info-box">
                        <div class="info-box-label">Length</div>
                        <div class="info-box-value">${password.length} chars</div>
                    </div>
                    <div class="info-box">
                        <div class="info-box-label">Entropy</div>
                        <div class="info-box-value">${entropy.toFixed(1)} bits</div>
                    </div>
                    <div class="info-box">
                        <div class="info-box-label">Strength</div>
                        <div class="info-box-value" style="color: ${strengthClass === 'weak' ? '#ff4444' : strengthClass === 'fair' ? '#ffaa00' : strengthClass === 'good' ? '#ffcc00' : '#00ff88'};">${strength}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-box-label">Crack Time</div>
                        <div class="info-box-value">${crackTime}</div>
                    </div>
                </div>
                <div class="strength-meter">
                    <div class="strength-bar ${strengthClass}"></div>
                </div>
            `;

            if (suggestions.length > 0) {
                html += '<div style="margin-top: 1rem;"><strong style="color: #ffaa00;">💡 Suggestions:</strong><ul style="margin-top: 0.5rem; margin-left: 1.5rem;">';
                suggestions.forEach(s => html += `<li>${s}</li>`);
                html += '</ul></div>';
            }

            document.getElementById('passwordAnalysis').innerHTML = html;
        }

        function calculateEntropy(password) {
            let charspace = 0;
            if (/[a-z]/.test(password)) charspace += 26;
            if (/[A-Z]/.test(password)) charspace += 26;
            if (/[0-9]/.test(password)) charspace += 10;
            if (/[^a-zA-Z0-9]/.test(password)) charspace += 32;
            return password.length * Math.log2(charspace);
        }

        function getStrength(entropy) {
            if (entropy < 30) return 'Weak';
            if (entropy < 60) return 'Fair';
            if (entropy < 90) return 'Good';
            return 'Strong';
        }

        function estimateCrackTime(entropy) {
            const guessesPerSecond = 1e9;
            const seconds = Math.pow(2, entropy) / (2 * guessesPerSecond);
            if (seconds < 1) return 'Instant';
            if (seconds < 60) return 'Seconds';
            if (seconds < 3600) return 'Minutes';
            if (seconds < 86400) return 'Hours';
            if (seconds < 2.6e6) return 'Days';
            if (seconds < 7.889e7) return 'Months';
            return 'Years';
        }

        function getSuggestions(password) {
            const suggestions = [];
            if (password.length < 12) suggestions.push('Use at least 12 characters');
            if (!/[A-Z]/.test(password)) suggestions.push('Add uppercase letters');
            if (!/[a-z]/.test(password)) suggestions.push('Add lowercase letters');
            if (!/[0-9]/.test(password)) suggestions.push('Add numbers');
            if (!/[^a-zA-Z0-9]/.test(password)) suggestions.push('Add special characters');
            return suggestions;
        }

        // Copy to clipboard
        function copyToClipboard(elementId) {
            const element = document.getElementById(elementId);
            const text = element.textContent.replace('Copy', '').trim();
            navigator.clipboard.writeText(text);
            const btn = event.target;
            const orig = btn.textContent;
            btn.textContent = '✓ Copied!';
            setTimeout(() => btn.textContent = orig, 2000);
        }

// Event listeners for data-click/data-change/data-input/data-keyup/data-keydown attributes
(function() {
  var ready = function() {
    // Click handlers
    document.querySelectorAll('[data-click]').forEach(function(el) {
      el.addEventListener('click', function(e) {
        var fn = el.getAttribute('data-click');
        var tab = el.getAttribute('data-tab');
        var arg = el.getAttribute('data-arg');
        var params = el.getAttribute('data-params');
        if (fn === 'closePanel') { if (window.closePanel) window.closePanel(); return; }
        if (fn === 'close') { try { parent.postMessage({action: 'close'}, '*'); } catch(e) { window.close(); } return; }
        if (fn === 'switchTab' && tab) { if (window.switchTab) window.switchTab(e, tab); return; }
        if (fn === 'toggleCrit') { if (window.toggleCrit) window.toggleCrit(el); return; }
        if (fn === 'setDepth' && arg) { if (window.setDepth) window.setDepth(parseInt(arg), el); return; }
        if (fn === 'switchMode' && arg) { if (window.switchMode) window.switchMode(arg, el); return; }
        if (fn === 'setAction' && arg) { if (window.setAction) window.setAction(arg, el); return; }
        if (fn === 'insertMarkdown' && params) {
          var parts = params.split('|');
          if (window.insertMarkdown) window.insertMarkdown(parts[0]||'', parts[1]||'', parts[2]||'');
          return;
        }
        if (arg !== null && arg !== undefined) {
          if (window[fn]) window[fn](arg);
        } else if (params) {
          var p = params.split('|');
          if (window[fn]) window[fn](p[0]||'', p[1]||'', p[2]||'');
        } else {
          if (window[fn]) window[fn](el);
        }
      });
    });

    // Change handlers
    document.querySelectorAll('[data-change]').forEach(function(el) {
      el.addEventListener('change', function() {
        var fn = el.getAttribute('data-change');
        if (fn === 'applyHeading') { if (window.applyHeading) { window.applyHeading(el.value); el.value = ''; } return; }
        if (fn === 'applyFont') { if (window.applyFont) window.applyFont(el.value); return; }
        if (fn === 'applyFontWeight') { if (window.applyFontWeight) window.applyFontWeight(el.value); return; }
        if (fn === 'onLangChange') { if (window.onLangChange) window.onLangChange(el); return; }
        if (window[fn]) window[fn]();
      });
    });

    // Input handlers
    document.querySelectorAll('[data-input]').forEach(function(el) {
      el.addEventListener('input', function() {
        var fn = el.getAttribute('data-input');
        if (window[fn]) window[fn]();
      });
    });

    // Keyup handlers
    document.querySelectorAll('[data-keyup]').forEach(function(el) {
      el.addEventListener('keyup', function() {
        var fn = el.getAttribute('data-keyup');
        if (window[fn]) window[fn]();
      });
    });

    // Keydown handlers
    document.querySelectorAll('[data-keydown]').forEach(function(el) {
      el.addEventListener('keydown', function(e) {
        var fn = el.getAttribute('data-keydown');
        if (fn === 'sendOnEnter' && e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (window.sendMsg) window.sendMsg();
        }
      });
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
})();
