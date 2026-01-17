// Minimal onboarding wizard - entirely frontend-based
(function() {
    'use strict';

    const DEMO_QUERY = "Investigating the relationship between temperature and the rate of photosynthesis in aquatic plants";

    const STEPS = [
        {
            title: "Welcome to IB Research Assistant",
            text: "This tool helps you develop and refine research ideas for your IB Internal Assessment. Let me show you around.",
            target: null,
            position: "center"
        },
        {
            title: "Enter Your Research Idea",
            text: "Start by typing your initial research idea or question here. Be as specific or broad as you like.",
            target: ".chat-input",
            position: "top"
        },
        {
            title: "Conversation Area",
            text: "Your conversation history appears here. The system will help refine your idea through feedback.",
            target: "#chat-box",
            position: "right"
        },
        {
            title: "Research Brief",
            text: "Your evolving research brief appears here. It updates as you refine your idea.",
            target: ".idea",
            position: "left"
        },
        {
            title: "Action Buttons",
            text: "Use these to generate reviews, retrieve knowledge from literature, or refresh your brief.",
            target: ".research-brief-buttons",
            position: "top"
        },
        {
            title: "Ready to Try?",
            text: "Click 'Run Demo' to see the system in action with an example query, or 'Start Fresh' to begin with your own idea.",
            target: null,
            position: "center",
            isLast: true
        }
    ];

    let currentStep = 0;
    let wizardOverlay = null;
    let wizardModal = null;
    let spotlight = null;

    function createWizardElements() {
        // Overlay
        wizardOverlay = document.createElement('div');
        wizardOverlay.className = 'wizard-overlay';
        wizardOverlay.innerHTML = `
            <div class="wizard-spotlight"></div>
            <div class="wizard-modal">
                <div class="wizard-progress"></div>
                <h3 class="wizard-title"></h3>
                <p class="wizard-text"></p>
                <div class="wizard-actions">
                    <button class="wizard-btn wizard-skip">Skip</button>
                    <div class="wizard-nav">
                        <button class="wizard-btn wizard-prev">Back</button>
                        <button class="wizard-btn wizard-next">Next</button>
                    </div>
                </div>
                <div class="wizard-final-actions" style="display: none;">
                    <button class="wizard-btn wizard-demo">Run Demo</button>
                    <button class="wizard-btn wizard-start">Start Fresh</button>
                </div>
            </div>
        `;
        document.body.appendChild(wizardOverlay);

        wizardModal = wizardOverlay.querySelector('.wizard-modal');
        spotlight = wizardOverlay.querySelector('.wizard-spotlight');

        // Event listeners
        wizardOverlay.querySelector('.wizard-skip').addEventListener('click', closeWizard);
        wizardOverlay.querySelector('.wizard-prev').addEventListener('click', prevStep);
        wizardOverlay.querySelector('.wizard-next').addEventListener('click', nextStep);
        wizardOverlay.querySelector('.wizard-demo').addEventListener('click', runDemo);
        wizardOverlay.querySelector('.wizard-start').addEventListener('click', closeWizard);

        // Close on escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && wizardOverlay.classList.contains('active')) {
                closeWizard();
            }
        });
    }

    function showStep(index) {
        const step = STEPS[index];
        const progress = wizardOverlay.querySelector('.wizard-progress');
        const title = wizardOverlay.querySelector('.wizard-title');
        const text = wizardOverlay.querySelector('.wizard-text');
        const prevBtn = wizardOverlay.querySelector('.wizard-prev');
        const nextBtn = wizardOverlay.querySelector('.wizard-next');
        const actions = wizardOverlay.querySelector('.wizard-actions');
        const finalActions = wizardOverlay.querySelector('.wizard-final-actions');

        // Update progress
        progress.style.width = ((index + 1) / STEPS.length * 100) + '%';

        // Update content
        title.textContent = step.title;
        text.textContent = step.text;

        // Show/hide buttons
        prevBtn.style.display = index === 0 ? 'none' : 'block';

        if (step.isLast) {
            actions.querySelector('.wizard-nav').style.display = 'none';
            finalActions.style.display = 'flex';
        } else {
            actions.querySelector('.wizard-nav').style.display = 'flex';
            finalActions.style.display = 'none';
            nextBtn.textContent = index === STEPS.length - 2 ? 'Finish' : 'Next';
        }

        // Position spotlight and modal
        if (step.target) {
            const target = document.querySelector(step.target);
            if (target) {
                const rect = target.getBoundingClientRect();
                spotlight.style.display = 'block';
                spotlight.style.top = (rect.top - 8) + 'px';
                spotlight.style.left = (rect.left - 8) + 'px';
                spotlight.style.width = (rect.width + 16) + 'px';
                spotlight.style.height = (rect.height + 16) + 'px';

                // Position modal based on step.position
                positionModal(rect, step.position);
            }
        } else {
            spotlight.style.display = 'none';
            wizardModal.style.top = '50%';
            wizardModal.style.left = '50%';
            wizardModal.style.transform = 'translate(-50%, -50%)';
        }
    }

    function positionModal(targetRect, position) {
        const modalRect = wizardModal.getBoundingClientRect();
        const padding = 20;

        wizardModal.style.transform = 'none';

        switch (position) {
            case 'top':
                wizardModal.style.top = (targetRect.top - modalRect.height - padding) + 'px';
                wizardModal.style.left = (targetRect.left + targetRect.width / 2 - modalRect.width / 2) + 'px';
                break;
            case 'bottom':
                wizardModal.style.top = (targetRect.bottom + padding) + 'px';
                wizardModal.style.left = (targetRect.left + targetRect.width / 2 - modalRect.width / 2) + 'px';
                break;
            case 'left':
                wizardModal.style.top = (targetRect.top + targetRect.height / 2 - modalRect.height / 2) + 'px';
                wizardModal.style.left = (targetRect.left - modalRect.width - padding) + 'px';
                break;
            case 'right':
                wizardModal.style.top = (targetRect.top + targetRect.height / 2 - modalRect.height / 2) + 'px';
                wizardModal.style.left = (targetRect.right + padding) + 'px';
                break;
        }

        // Keep modal in viewport
        const newRect = wizardModal.getBoundingClientRect();
        if (newRect.left < 10) wizardModal.style.left = '10px';
        if (newRect.right > window.innerWidth - 10) {
            wizardModal.style.left = (window.innerWidth - modalRect.width - 10) + 'px';
        }
        if (newRect.top < 10) wizardModal.style.top = '10px';
        if (newRect.bottom > window.innerHeight - 10) {
            wizardModal.style.top = (window.innerHeight - modalRect.height - 10) + 'px';
        }
    }

    function nextStep() {
        if (currentStep < STEPS.length - 1) {
            currentStep++;
            showStep(currentStep);
        } else {
            closeWizard();
        }
    }

    function prevStep() {
        if (currentStep > 0) {
            currentStep--;
            showStep(currentStep);
        }
    }

    function closeWizard() {
        wizardOverlay.classList.remove('active');
        localStorage.setItem('wizardCompleted', 'true');
    }

    function runDemo() {
        closeWizard();

        // Set demo query in input
        const input = document.getElementById('chat-input');
        if (input) {
            input.value = DEMO_QUERY;
            input.focus();

            // Show a hint
            const hint = document.createElement('div');
            hint.className = 'demo-hint';
            hint.innerHTML = 'Press Enter or click Send to see the demo in action';
            input.parentNode.appendChild(hint);

            setTimeout(() => hint.remove(), 5000);
        }
    }

    function startWizard() {
        if (!wizardOverlay) {
            createWizardElements();
        }
        currentStep = 0;
        wizardOverlay.classList.add('active');
        showStep(currentStep);
    }

    // Auto-start for new users (check localStorage)
    function init() {
        // Add help button to trigger wizard
        const helpBtn = document.createElement('button');
        helpBtn.className = 'wizard-help-btn';
        helpBtn.innerHTML = '?';
        helpBtn.title = 'Show tutorial';
        helpBtn.addEventListener('click', startWizard);
        document.body.appendChild(helpBtn);

        // Auto-start for first-time users
        if (!localStorage.getItem('wizardCompleted')) {
            setTimeout(startWizard, 500);
        }
    }

    // Expose to window for manual trigger
    window.startWizard = startWizard;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
