document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const calculator = document.querySelector('.calculator');
    const inputDisplay = document.querySelector('.input');
    const resultDisplay = document.querySelector('.result');
    const historyList = document.querySelector('.history-list');
    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    const clearHistoryBtn = document.querySelector('.clear-history');
    const exportHistoryBtn = document.querySelector('.export-history');
    const modeBtns = document.querySelectorAll('.mode-btn');
    const standardMode = document.querySelector('.standard-mode');
    const scientificMode = document.querySelector('.scientific-mode');
    const themeBtns = document.querySelectorAll('.theme-btn');
    const settingsBtn = document.querySelector('.settings-btn');
    const settingsPanel = document.querySelector('.settings-panel');
    const closeSettings = document.querySelector('.close-settings');
    const tabs = document.querySelectorAll('.tab');
    const voiceBtn = document.querySelector('.voice-input');
    
    // Button selectors
    const digitButtons = document.querySelectorAll('.digit');
    const operatorButtons = document.querySelectorAll('.operator');
    const equalsButton = document.querySelector('.equals');
    const clearButton = document.querySelector('.clear');
    const backspaceButton = document.querySelector('.backspace');
    const decimalButton = document.querySelector('.decimal');
    const functionButtons = document.querySelectorAll('.function');
    const memoryButtons = document.querySelectorAll('.memory');
    const bracketButtons = document.querySelectorAll('.bracket');
    const constantButtons = document.querySelectorAll('.constant');
    
    // State variables
    let input = '';
    let result = '';
    let history = [];
    let memoryValue = 0;
    let currentMode = 'standard';
    let inputHistory = [];
    let historyIndex = -1;
    let undoStack = [];
    
    // Audio context for sound effects
    let audioContext;
    const initAudio = () => {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    };
    
    // Play sound effect
    const playSound = (frequency, type = 'sine', duration = 0.1) => {
        if (!audioContext || !document.getElementById('sound-effects')?.checked) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0.1;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + duration);
        oscillator.stop(audioContext.currentTime + duration);
    };
    
    // Add haptic feedback
    const vibrate = (duration = 20) => {
        if (navigator.vibrate && document.getElementById('haptic-feedback')?.checked) {
            navigator.vibrate(duration);
        }
    };
    
    // Load settings from localStorage
    const loadSettings = () => {
        try {
            // Load history
            if (localStorage.getItem('calculatorHistory')) {
                history = JSON.parse(localStorage.getItem('calculatorHistory'));
                updateHistory();
            }
            
            // Load theme
            const savedTheme = localStorage.getItem('calculatorTheme');
            if (savedTheme) {
                document.body.classList.remove('theme-premium', 'theme-blue', 'theme-green');
                if (savedTheme !== 'default') {
                    document.body.classList.add(`theme-${savedTheme}`);
                }
            }
            
            // Load dark mode preference
            if (localStorage.getItem('darkMode') === 'true') {
                document.body.classList.add('dark-mode');
                darkModeToggle.textContent = '☀️ Light';
            }
            
            // Load calculator mode
            const savedMode = localStorage.getItem('calculatorMode');
            if (savedMode === 'scientific') {
                modeBtns.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.mode === 'scientific') {
                        btn.classList.add('active');
                    }
                });
                standardMode.classList.add('hidden');
                scientificMode.classList.remove('hidden');
                currentMode = 'scientific';
            }
            
            // Initialize settings panel options
            if (localStorage.getItem('decimalPrecision')) {
                document.getElementById('decimal-precision').value = localStorage.getItem('decimalPrecision');
            }
            
            if (localStorage.getItem('thousandsSeparator') === 'false') {
                document.getElementById('thousands-separator').checked = false;
            }
            
            if (localStorage.getItem('hapticFeedback') === 'true') {
                document.getElementById('haptic-feedback').checked = true;
            }
            
            if (localStorage.getItem('soundEffects') === 'true') {
                document.getElementById('sound-effects').checked = true;
            }
            
            if (localStorage.getItem('autoSaveHistory') === 'false') {
                document.getElementById('auto-save-history').checked = false;
            }
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    };
    
    // Save settings to localStorage
    const saveSettings = () => {
        try {
            if (document.getElementById('auto-save-history').checked) {
                localStorage.setItem('calculatorHistory', JSON.stringify(history));
            }
            
            localStorage.setItem('decimalPrecision', document.getElementById('decimal-precision').value);
            localStorage.setItem('thousandsSeparator', document.getElementById('thousands-separator').checked);
            localStorage.setItem('hapticFeedback', document.getElementById('haptic-feedback').checked);
            localStorage.setItem('soundEffects', document.getElementById('sound-effects').checked);
            localStorage.setItem('autoSaveHistory', document.getElementById('auto-save-history').checked);
        } catch (e) {
            console.error('Error saving settings:', e);
        }
    };
    
    // Initialize calculator
    const initialize = () => {
        updateDisplay();
        loadSettings();
        updateShortcutsDisplay();
        
        // Initialize tabs
        document.querySelectorAll('[data-panel]').forEach(panel => {
            panel.classList.add('hidden');
        });
        
        // Attach events for settings changes
        document.getElementById('decimal-precision').addEventListener('change', saveSettings);
        document.getElementById('thousands-separator').addEventListener('change', saveSettings);
        document.getElementById('haptic-feedback').addEventListener('change', saveSettings);
        document.getElementById('sound-effects').addEventListener('change', saveSettings);
        document.getElementById('auto-save-history').addEventListener('change', saveSettings);
    };
    
    // Initialize
    initialize();
    
    // Add event listeners to buttons
    digitButtons.forEach(button => {
        button.addEventListener('click', () => {
            playSound(600 + Math.random() * 200);
            vibrate();
            handleButtonClick(button.textContent);
        });
    });
    
    operatorButtons.forEach(button => {
        button.addEventListener('click', () => {
            playSound(800);
            vibrate();
            
            // Convert display symbols to actual operators for calculation
            let operator = button.textContent;
            if (operator === '×') operator = '*';
            if (operator === '−') operator = '-';
            handleButtonClick(operator);
        });
    });
    
    functionButtons.forEach(button => {
        button.addEventListener('click', () => {
            playSound(900);
            vibrate();
            const func = button.dataset.function;
            handleFunction(func);
        });
    });
    
    constantButtons?.forEach(button => {
        button.addEventListener('click', () => {
            playSound(700);
            vibrate();
            const constant = button.dataset.constant;
            handleConstant(constant);
        });
    });
    
    bracketButtons?.forEach(button => {
        button.addEventListener('click', () => {
            playSound(650);
            vibrate();
            handleButtonClick(button.textContent);
        });
    });
    
    memoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            playSound(750);
            vibrate();
            const memoryOp = button.dataset.memory;
            handleMemory(memoryOp);
        });
    });
    
    equalsButton.addEventListener('click', () => {
        playSound(1000, 'triangle', 0.2);
        vibrate(30);
        calculate();
    });
    
    clearButton.addEventListener('click', () => {
        playSound(500, 'sawtooth');
        vibrate(25);
        clear();
    });
    
    backspaceButton.addEventListener('click', () => {
        playSound(550);
        vibrate();
        backspace();
    });
    
    decimalButton.addEventListener('click', () => {
        playSound(600);
        vibrate();
        handleButtonClick('.');
    });
    
    darkModeToggle.addEventListener('click', toggleDarkMode);
    settingsBtn.addEventListener('click', () => {
        settingsPanel.classList.add('active');
    });
    
    closeSettings.addEventListener('click', () => {
        settingsPanel.classList.remove('active');
    });
    
    // Mode toggle listeners
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            localStorage.setItem('calculatorMode', currentMode);
            
            if (currentMode === 'standard') {
                standardMode.classList.remove('hidden');
                scientificMode.classList.add('hidden');
            } else {
                standardMode.classList.add('hidden');
                scientificMode.classList.remove('hidden');
            }
        });
    });
    
    // Tab Navigation
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding panel
            const panelType = tab.dataset.tab;
            document.querySelectorAll('[data-panel]').forEach(panel => {
                panel.classList.add('hidden');
            });
            
            if (panelType === 'standard') {
                // Show calculator buttons for standard tab
                if (currentMode === 'standard') {
                    standardMode.classList.remove('hidden');
                } else {
                    scientificMode.classList.remove('hidden');
                }
            } else {
                // Show specific panel for other tabs
                const panel = document.querySelector(`[data-panel="${panelType}"]`);
                if (panel) panel.classList.remove('hidden');
                
                // Hide calculator buttons
                standardMode.classList.add('hidden');
                scientificMode.classList.add('hidden');
            }
            
            // Update mode indicator
            document.querySelector('.mode-indicator').textContent = tab.textContent;
        });
    });
    
    // Voice Input
    voiceBtn.addEventListener('click', () => {
        initAudio(); // Initialize audio (needed for Safari)
        
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            
            voiceBtn.classList.add('active');
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                console.log('Voice input:', transcript);
                
                // Process voice input (e.g., "two plus two")
                let processedInput = transcript
                    .replace(/plus/g, '+')
                    .replace(/minus/g, '-')
                    .replace(/times/g, '*')
                    .replace(/multiplied by/g, '*')
                    .replace(/divided by/g, '/')
                    .replace(/equals/g, '=')
                    .replace(/equal/g, '=')
                    .replace(/squared/g, '^2')
                    .replace(/cubed/g, '^3')
                    .replace(/square root of/g, 'sqrt(')
                    .replace(/sine of/g, 'sin(')
                    .replace(/cosine of/g, 'cos(')
                    .replace(/tangent of/g, 'tan(')
                    .replace(/log of/g, 'log(')
                    .replace(/pi/g, '3.14159');
                
                // Convert spoken numbers to digits
                processedInput = processedInput
                    .replace(/zero/g, '0')
                    .replace(/one/g, '1')
                    .replace(/two/g, '2')
                    .replace(/three/g, '3')
                    .replace(/four/g, '4')
                    .replace(/five/g, '5')
                    .replace(/six/g, '6')
                    .replace(/seven/g, '7')
                    .replace(/eight/g, '8')
                    .replace(/nine/g, '9')
                    .replace(/ten/g, '10');
                
                // Handle commands
                if (transcript.includes('clear') || transcript.includes('reset')) {
                    clear();
                    return;
                }
                
                if (transcript.includes('equals') || transcript.includes('calculate') || transcript.includes('result')) {
                    input = processedInput.replace(/equals|calculate|result/g, '');
                    updateDisplay();
                    calculate();
                    return;
                }
                
                input = processedInput;
                updateDisplay();
            };
            
            recognition.onend = () => {
                voiceBtn.classList.remove('active');
            };
            
            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                voiceBtn.classList.remove('active');
            };
            
            recognition.start();
        } else {
            alert('Voice recognition is not supported in your browser.');
        }
    });
    
    // Unit Converter
    document.querySelector('.convert-btn')?.addEventListener('click', () => {
        const fromUnit = document.getElementById('unit-from').value;
        const toUnit = document.getElementById('unit-to').value;
        const fromValue = parseFloat(document.getElementById('unit-from-value').value);
        
        if (isNaN(fromValue)) return;
        
        // Convert to base unit (meters)
        const conversionRates = {
            cm: 0.01,
            m: 1,
            km: 1000,
            in: 0.0254,
            ft: 0.3048,
            mi: 1609.34
        };
        
        const baseValue = fromValue * conversionRates[fromUnit];
        const result = baseValue / conversionRates[toUnit];
        
        document.getElementById('unit-to-value').value = formatNumber(result);
        createParticles();
    });
    
    // Finance Calculator
    document.querySelector('.calculate-loan')?.addEventListener('click', () => {
        const loanAmount = parseFloat(document.getElementById('loan-amount').value);
        const interestRate = parseFloat(document.getElementById('interest-rate').value) / 100 / 12; // Monthly rate
        const loanTerm = parseFloat(document.getElementById('loan-term').value) * 12; // Months
        
        if (isNaN(loanAmount) || isNaN(interestRate) || isNaN(loanTerm)) return;
        
        // Calculate monthly payment using formula: P = (r * PV) / (1 - (1 + r)^-n)
        const monthlyPayment = (interestRate * loanAmount) / (1 - Math.pow(1 + interestRate, -loanTerm));
        const totalPayment = monthlyPayment * loanTerm;
        const totalInterest = totalPayment - loanAmount;
        
        document.getElementById('monthly-payment').textContent = `$${formatNumber(monthlyPayment)}`;
        document.getElementById('total-interest').textContent = `$${formatNumber(totalInterest)}`;
        document.getElementById('total-payment').textContent = `$${formatNumber(totalPayment)}`;
        
        createParticles();
    });
    
    // Date Calculator
    document.querySelector('.calculate-dates')?.addEventListener('click', () => {
        const startDate = new Date(document.getElementById('start-date').value);
        const endDate = new Date(document.getElementById('end-date').value);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;
        
        // Calculate difference in days
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        document.getElementById('date-result').textContent = `${diffDays} days between dates`;
        createParticles();
    });
    
    document.querySelector('.calculate-modified-date')?.addEventListener('click', () => {
        const baseDate = new Date(document.getElementById('base-date').value);
        const daysCount = parseInt(document.getElementById('days-count').value);
        const operation = document.getElementById('add-subtract').value;
        
        if (isNaN(baseDate.getTime()) || isNaN(daysCount)) return;
        
        // Add or subtract days
        const resultDate = new Date(baseDate);
        if (operation === 'add') {
            resultDate.setDate(resultDate.getDate() + daysCount);
        } else {
            resultDate.setDate(resultDate.getDate() - daysCount);
        }
        
        document.getElementById('modified-date-result').textContent = resultDate.toLocaleDateString();
        createParticles();
    });
    
    // Custom Shortcuts
    document.querySelector('.add-shortcut')?.addEventListener('click', () => {
        const currentExpression = input;
        if (!currentExpression) return;
        
        const label = prompt('Enter a name for this shortcut:');
        if (!label) return;
        
        // Save shortcut
        const shortcuts = JSON.parse(localStorage.getItem('calculatorShortcuts') || '[]');
        shortcuts.push({ label, expression: currentExpression });
        localStorage.setItem('calculatorShortcuts', JSON.stringify(shortcuts));
        
        // Update shortcuts display
        updateShortcutsDisplay();
    });
    
    // Enable keyboard input
    calculator.addEventListener('keydown', handleKeyPress);
    
    // History buttons
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearHistory);
    }
    
    if (exportHistoryBtn) {
        exportHistoryBtn.addEventListener('click', exportHistory);
    }
    
    // Gesture Support
    let touchStartX = 0;
    let touchEndX = 0;
    
    calculator.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    calculator.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    // Button click handler
    function handleButtonClick(value) {
        // Save state for undo
        saveState();
        
        // Prevent invalid consecutive operators
        if (/[\+\-\*\/]$/.test(input) && /[\+\-\*\/]/.test(value)) {
            return;
        }
        
        input += value;
        updateDisplay();
    }
    
    // Save current state for undo
    function saveState() {
        undoStack.push(input);
        if (undoStack.length > 20) { // Limit stack size
            undoStack.shift();
        }
    }
    
    // Undo last action
    function undo() {
        if (undoStack.length > 0) {
            input = undoStack.pop();
            updateDisplay();
        }
    }
    
    // Handle special functions
    function handleFunction(func) {
        saveState();
        
        switch (func) {
            case 'sqrt':
                handleButtonClick('sqrt(');
                break;
            case 'power':
                handleButtonClick('^');
                break;
            case 'sin':
                handleButtonClick('sin(');
                break;
            case 'cos':
                handleButtonClick('cos(');
                break;
            case 'tan':
                handleButtonClick('tan(');
                break;
            case 'log':
                handleButtonClick('log10(');
                break;
            case 'ln':
                handleButtonClick('log(');
                break;
            case 'factorial':
                // If there's a number before, add factorial
                if (/\d$/.test(input)) {
                    handleButtonClick('!');
                }
                break;
            case 'percent':
                // Calculate percentage of previous number
                if (/[\d\)]$/.test(input)) {
                    handleButtonClick('/100');
                }
                break;
            case 'pow10':
                handleButtonClick('10^');
                break;
        }
    }
    
    // Handle constants
    function handleConstant(constant) {
        saveState();
        
        if (constant === 'pi') {
            handleButtonClick('3.14159265359');
        } else if (constant === 'e') {
            handleButtonClick('2.71828182846');
        }
    }
    
    // Handle memory operations
    function handleMemory(operation) {
        switch (operation) {
            case 'mc': // Memory Clear
                memoryValue = 0;
                break;
            case 'mr': // Memory Recall
                saveState();
                input += memoryValue.toString();
                updateDisplay();
                break;
            case 'm-plus': // Memory Add
                try {
                    if (result) {
                        memoryValue += parseFloat(result);
                    } else if (input) {
                        memoryValue += parseFloat(calculate(true));
                    }
                } catch (e) {
                    console.error('Error in M+:', e);
                }
                break;
            case 'm-minus': // Memory Subtract
                try {
                    if (result) {
                        memoryValue -= parseFloat(result);
                    } else if (input) {
                        memoryValue -= parseFloat(calculate(true));
                    }
                } catch (e) {
                    console.error('Error in M-:', e);
                }
                break;
        }
    }
    
    // Calculate result
    function calculate(returnOnly = false) {
        if (!input) return returnOnly ? '0' : null;
        
        try {
            // Replace ^ with ** for power operations
            let expression = input.replace(/\^/g, '**');
            
            // Handle factorial
            expression = handleFactorial(expression);
            
            // Ensure closing parenthesis for functions
            let openParens = (expression.match(/\(/g) || []).length;
            let closeParens = (expression.match(/\)/g) || []).length;
            if (openParens > closeParens) {
                expression += ')'.repeat(openParens - closeParens);
            }
            
            // Use Function constructor as a safer alternative to eval
            const calculatedResult = new Function('return ' + expression)();
            
            if (returnOnly) return calculatedResult.toString();
            
            // Add to input history
            inputHistory.push(input);
            historyIndex = inputHistory.length;
            
            // Format the result
            if (calculatedResult !== undefined) {
                // Add to history
                const historyEntry = `${input} = ${formatNumber(calculatedResult)}`;
                history.push(historyEntry);
                
                // Save history to localStorage if setting is enabled
                if (document.getElementById('auto-save-history')?.checked) {
                    saveSettings();
                }
                
                updateHistory();
                
                // Format result as string
                result = calculatedResult.toString();
                
                // Create particle effect
                createParticles();
                
                // Highlight result
                resultDisplay.classList.add('highlight');
                setTimeout(() => {
                    resultDisplay.classList.remove('highlight');
                }, 500);
            }
        } catch (error) {
            if (returnOnly) return '0';
            result = 'Error';
            console.error('Calculation error:', error);
        }
        
        updateDisplay();
    }
    
    // Handle factorial in expression
    function handleFactorial(expr) {
        // Replace all instances of number! with factorial calculation
        return expr.replace(/(\d+)!/g, (match, number) => {
            return factorial(parseInt(number));
        });
    }
    
    // Calculate factorial
    function factorial(n) {
        if (n === 0 || n === 1) return 1;
        if (n > 100) return Infinity; // Prevent stack overflow
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }
    
    // Format number with commas and decimal precision
    function formatNumber(num) {
        const precision = parseInt(document.getElementById('decimal-precision')?.value || 2);
        const useSeparator = document.getElementById('thousands-separator')?.checked !== false;
        
        let formattedNum = parseFloat(num).toFixed(precision);
        
        // Add thousands separator if enabled
        if (useSeparator) {
            const parts = formattedNum.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            formattedNum = parts.join('.');
        }
        
        return formattedNum;
    }
    
    // Clear calculator
    function clear() {
        saveState();
        input = '';
        result = '';
        updateDisplay();
    }
    
    // Handle backspace
    function backspace() {
        saveState();
        input = input.slice(0, -1);
        updateDisplay();
    }
    
    // Update display
    function updateDisplay() {
        inputDisplay.textContent = input || '0';
        resultDisplay.textContent = result ? `= ${formatNumber(result)}` : '';
    }
    
    // Update history list
    function updateHistory() {
        if (!historyList) return;
        
        // Clear the list
        historyList.innerHTML = '';
        
        // Add each history item
        history.forEach((entry, index) => {
            const li = document.createElement('li');
            li.textContent = entry;
            
            // Add click event to reuse the calculation
            li.addEventListener('click', () => {
                const parts = entry.split(' = ');
                if (parts.length === 2) {
                    input = parts[0];
                    result = parts[1].replace(/,/g, ''); // Remove commas
                    updateDisplay();
                }
            });
            
            historyList.appendChild(li);
        });
        
        // Show empty message if history is empty
        if (history.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No calculations yet';
            li.classList.add('empty-history');
            historyList.appendChild(li);
        }
        
        // Show/hide clear and export buttons
        if (clearHistoryBtn) {
            clearHistoryBtn.style.display = history.length ? 'block' : 'none';
        }
        
        if (exportHistoryBtn) {
            exportHistoryBtn.style.display = history.length ? 'block' : 'none';
        }
    }
    
    // Export history to file
    function exportHistory() {
        if (history.length === 0) return;
        
        const historyText = history.join('\n');
        const blob = new Blob([historyText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'calculator_history.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Clear history
    function clearHistory() {
        history = [];
        updateHistory();
        localStorage.removeItem('calculatorHistory');
    }
    
    // Toggle dark mode
    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        darkModeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️ Light' : '🌙 Dark';
    }
    
    // Handle keyboard input
    function handleKeyPress(event) {
        const key = event.key;
        
        if (/[0-9]/.test(key)) {
            handleButtonClick(key);
        } else if (key === '+' || key === '-' || key === '*' || key === '/') {
            handleButtonClick(key);
        } else if (key === '.') {
            handleButtonClick('.');
        } else if (key === 'Enter') {
            calculate();
        } else if (key === 'Backspace') {
            backspace();
        } else if (key === 'Escape') {
            clear();
        } else if (key === 'r') {
            // Shortcut for square root
            handleButtonClick('sqrt(');
        } else if (key === '^') {
            handleButtonClick('^');
        } else if (key === '(' || key === ')') {
            handleButtonClick(key);
        } else if (key === '%') {
            handleFunction('percent');
        } else if (key === '!') {
            handleFunction('factorial');
        }
    }
    
    // Check system preference for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        toggleDarkMode();
    }
});