// Comprehensive onboarding wizard - entirely frontend-based
(function() {
    'use strict';

    const DEMO_QUERY = "Investigating the relationship between temperature and the rate of photosynthesis in aquatic plants using Elodea";

    const STEPS = [
        {
            title: "Welcome to IB Research Assistant",
            text: "This tool helps you develop, refine, and validate research ideas for your IB Internal Assessment. It uses AI to guide you through the entire research design process. Let's explore all the features.",
            target: null,
            position: "center"
        },
        {
            title: "Choose Your Subject",
            text: "First, select your IA subject. The system tailors its guidance based on whether you're working on a Physics or Chemistry IA, with subject-specific criteria and suggestions.",
            target: "#subject-select",
            position: "bottom"
        },
        {
            title: "Enter Your Research Idea",
            text: "Type your initial research idea or question here. Don't worry about making it perfect - the system will help you refine it. You can be as broad as 'something about magnetism' or as specific as a full research question.",
            target: ".chat-input",
            position: "top"
        },
        {
            title: "Conversation History",
            text: "Your conversation with the AI appears here. As you provide feedback and ask questions, the system responds with suggestions, critiques, and improvements. Think of it as a dialogue with a research mentor.",
            target: "#chat-box",
            position: "right"
        },
        {
            title: "Your Research Brief",
            text: "This panel shows your evolving research brief. It automatically updates as you refine your idea, showing the current state of your research proposal with all its components.",
            target: "#main-idea",
            position: "left"
        },
        {
            title: "Research Brief Tab",
            text: "The 'Research Brief' tab shows your main research idea, hypothesis, variables, and methodology overview. This is your working document that evolves through the conversation.",
            target: "#tab-research-brief",
            position: "bottom"
        },
        {
            title: "IA Section Tab",
            text: "Switch to 'IA Section' to see structured components of your IA: the research question, background information, procedure, and research design. These sections can be generated and edited individually.",
            target: "#tab-ia-section",
            position: "bottom",
            action: () => {
                const tab = document.getElementById('tab-ia-section');
                if (tab) tab.click();
            }
        },
        {
            title: "Generate Research Question",
            text: "Once you have a solid research idea, click this button to generate a formal research question. The system will create an IB-appropriate RQ with proper scope and measurable variables.",
            target: "#generate-rq-btn-main",
            position: "top",
            action: () => {
                const container = document.getElementById('generate-rq-container');
                if (container) container.style.display = 'block';
            }
        },
        {
            title: "Expand IA Sections",
            text: "After generating your RQ, you can expand individual sections like Background Information, Procedure, and Research Design. Each section is AI-generated based on your specific research question.",
            target: "#expand-buttons",
            position: "top",
            action: () => {
                const buttons = document.getElementById('expand-buttons');
                if (buttons) buttons.style.display = 'block';
            }
        },
        {
            title: "Quality Score",
            text: "Your research idea is continuously evaluated against IB criteria. The score reflects novelty, feasibility, clarity, and alignment with IB expectations. Aim for 7+ for a strong foundation.",
            target: "#score-display",
            position: "left",
            action: () => {
                // Switch back to research brief tab
                const tab = document.getElementById('tab-research-brief');
                if (tab) tab.click();
            }
        },
        {
            title: "Generate Review",
            text: "Click 'Generate Review' to get detailed AI feedback on your research idea. It identifies weaknesses like vague methodology, feasibility concerns, or gaps in your reasoning - with specific suggestions for improvement.",
            target: ".generate-review",
            position: "top"
        },
        {
            title: "Retrieve Knowledge",
            text: "This searches academic literature related to your research topic. It finds relevant papers, extracts key findings, and helps you build a stronger theoretical foundation for your IA.",
            target: ".retrieve-knowledge",
            position: "top"
        },
        {
            title: "Refresh Brief",
            text: "If your brief gets out of sync or you want to regenerate it from the current conversation state, click Refresh to update the research brief panel.",
            target: ".refresh-button",
            position: "top"
        },
        {
            title: "Retrieved Knowledge Panel",
            text: "This sidebar shows your research queries and retrieved academic knowledge. Citations and summaries from literature searches appear here for reference while you work.",
            target: ".qa-container",
            position: "right"
        },
        {
            title: "Search Literature Directly",
            text: "You can also search academic literature directly using this search bar. Enter keywords or questions to find relevant research papers.",
            target: ".sidebar-search",
            position: "top"
        },
        {
            title: "Start Fresh",
            text: "Click 'New Idea' to clear everything and start a completely new research project. Your current work will be reset.",
            target: ".start-new-idea-btn",
            position: "bottom"
        },
        {
            title: "Automate Generation",
            text: "Enable 'Automate' to let the AI iteratively improve your research idea automatically. It will cycle through critique-and-improve loops until reaching a high-quality proposal.",
            target: ".auto-generate",
            position: "bottom"
        },
        {
            title: "Idea Tree Visualization",
            text: "Click 'Tree' to see a visual map of how your research idea has evolved. Each node represents a version of your idea, showing the exploration path and alternatives considered.",
            target: ".top-bar-buttons button:last-child",
            position: "bottom"
        },
        {
            title: "You're Ready!",
            text: "That's everything! Click 'Run Demo' to see the system in action with a sample Physics IA query about photosynthesis, or 'Start Fresh' to begin with your own research idea.",
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
                <div class="wizard-header">
                    <div class="wizard-step-count"></div>
                    <button class="wizard-close">&times;</button>
                </div>
                <div class="wizard-progress-bar">
                    <div class="wizard-progress"></div>
                </div>
                <h3 class="wizard-title"></h3>
                <p class="wizard-text"></p>
                <div class="wizard-actions">
                    <button class="wizard-btn wizard-skip">Skip Tutorial</button>
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
        wizardOverlay.querySelector('.wizard-close').addEventListener('click', closeWizard);
        wizardOverlay.querySelector('.wizard-prev').addEventListener('click', prevStep);
        wizardOverlay.querySelector('.wizard-next').addEventListener('click', nextStep);
        wizardOverlay.querySelector('.wizard-demo').addEventListener('click', runDemo);
        wizardOverlay.querySelector('.wizard-start').addEventListener('click', closeWizard);

        // Close on escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && wizardOverlay.classList.contains('active')) {
                closeWizard();
            }
            if (e.key === 'ArrowRight' && wizardOverlay.classList.contains('active')) {
                nextStep();
            }
            if (e.key === 'ArrowLeft' && wizardOverlay.classList.contains('active')) {
                prevStep();
            }
        });
    }

    function showStep(index) {
        const step = STEPS[index];
        const progress = wizardOverlay.querySelector('.wizard-progress');
        const stepCount = wizardOverlay.querySelector('.wizard-step-count');
        const title = wizardOverlay.querySelector('.wizard-title');
        const text = wizardOverlay.querySelector('.wizard-text');
        const prevBtn = wizardOverlay.querySelector('.wizard-prev');
        const nextBtn = wizardOverlay.querySelector('.wizard-next');
        const actions = wizardOverlay.querySelector('.wizard-actions');
        const finalActions = wizardOverlay.querySelector('.wizard-final-actions');

        // Run any step action
        if (step.action) {
            step.action();
        }

        // Update progress
        progress.style.width = ((index + 1) / STEPS.length * 100) + '%';
        stepCount.textContent = `${index + 1} of ${STEPS.length}`;

        // Update content
        title.textContent = step.title;
        text.textContent = step.text;

        // Show/hide buttons
        prevBtn.style.display = index === 0 ? 'none' : 'block';

        if (step.isLast) {
            actions.querySelector('.wizard-nav').style.display = 'none';
            actions.querySelector('.wizard-skip').style.display = 'none';
            finalActions.style.display = 'flex';
        } else {
            actions.querySelector('.wizard-nav').style.display = 'flex';
            actions.querySelector('.wizard-skip').style.display = 'block';
            finalActions.style.display = 'none';
            nextBtn.textContent = 'Next';
        }

        // Position spotlight and modal
        if (step.target) {
            const target = document.querySelector(step.target);
            if (target) {
                // Make sure target is visible
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });

                setTimeout(() => {
                    const rect = target.getBoundingClientRect();
                    spotlight.style.display = 'block';
                    spotlight.style.top = (rect.top - 8) + 'px';
                    spotlight.style.left = (rect.left - 8) + 'px';
                    spotlight.style.width = (rect.width + 16) + 'px';
                    spotlight.style.height = (rect.height + 16) + 'px';

                    // Position modal based on step.position
                    positionModal(rect, step.position);
                }, 100);
            } else {
                spotlight.style.display = 'none';
                centerModal();
            }
        } else {
            spotlight.style.display = 'none';
            centerModal();
        }
    }

    function centerModal() {
        wizardModal.style.top = '50%';
        wizardModal.style.left = '50%';
        wizardModal.style.transform = 'translate(-50%, -50%)';
    }

    function positionModal(targetRect, position) {
        const modalRect = wizardModal.getBoundingClientRect();
        const padding = 20;

        wizardModal.style.transform = 'none';

        switch (position) {
            case 'top':
                wizardModal.style.top = Math.max(10, targetRect.top - modalRect.height - padding) + 'px';
                wizardModal.style.left = Math.max(10, targetRect.left + targetRect.width / 2 - modalRect.width / 2) + 'px';
                break;
            case 'bottom':
                wizardModal.style.top = (targetRect.bottom + padding) + 'px';
                wizardModal.style.left = Math.max(10, targetRect.left + targetRect.width / 2 - modalRect.width / 2) + 'px';
                break;
            case 'left':
                wizardModal.style.top = Math.max(10, targetRect.top + targetRect.height / 2 - modalRect.height / 2) + 'px';
                wizardModal.style.left = Math.max(10, targetRect.left - modalRect.width - padding) + 'px';
                break;
            case 'right':
                wizardModal.style.top = Math.max(10, targetRect.top + targetRect.height / 2 - modalRect.height / 2) + 'px';
                wizardModal.style.left = (targetRect.right + padding) + 'px';
                break;
        }

        // Keep modal in viewport
        const newRect = wizardModal.getBoundingClientRect();
        if (newRect.left < 10) wizardModal.style.left = '10px';
        if (newRect.right > window.innerWidth - 10) {
            wizardModal.style.left = (window.innerWidth - newRect.width - 10) + 'px';
        }
        if (newRect.top < 10) wizardModal.style.top = '10px';
        if (newRect.bottom > window.innerHeight - 10) {
            wizardModal.style.top = (window.innerHeight - newRect.height - 10) + 'px';
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

        // Reset UI state
        const tabResearch = document.getElementById('tab-research-brief');
        if (tabResearch) tabResearch.click();

        const rqContainer = document.getElementById('generate-rq-container');
        if (rqContainer && !rqContainer.dataset.wasVisible) {
            rqContainer.style.display = 'none';
        }

        const expandButtons = document.getElementById('expand-buttons');
        if (expandButtons && !expandButtons.dataset.wasVisible) {
            expandButtons.style.display = 'none';
        }
    }

    function runDemo() {
        closeWizard();

        // Set demo query in input
        const input = document.getElementById('chat-input');
        if (input) {
            input.value = DEMO_QUERY;
            input.focus();

            // Animate typing effect
            input.style.transition = 'none';
            input.setSelectionRange(input.value.length, input.value.length);

            // Show a hint tooltip
            showDemoHint(input, 'Press Enter or click the send button to run the demo');
        }
    }

    function showDemoHint(target, message) {
        const hint = document.createElement('div');
        hint.className = 'demo-hint';
        hint.textContent = message;

        const rect = target.getBoundingClientRect();
        hint.style.position = 'fixed';
        hint.style.top = (rect.top - 40) + 'px';
        hint.style.left = (rect.left + rect.width / 2) + 'px';

        document.body.appendChild(hint);

        setTimeout(() => {
            hint.style.opacity = '0';
            setTimeout(() => hint.remove(), 300);
        }, 4000);
    }

    function startWizard() {
        if (!wizardOverlay) {
            createWizardElements();
        }

        // Store current visibility state
        const rqContainer = document.getElementById('generate-rq-container');
        if (rqContainer) {
            rqContainer.dataset.wasVisible = rqContainer.style.display !== 'none';
        }

        const expandButtons = document.getElementById('expand-buttons');
        if (expandButtons) {
            expandButtons.dataset.wasVisible = expandButtons.style.display !== 'none';
        }

        currentStep = 0;
        wizardOverlay.classList.add('active');
        showStep(currentStep);
    }

    function resetWizard() {
        localStorage.removeItem('wizardCompleted');
        startWizard();
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
            setTimeout(startWizard, 800);
        }
    }

    // Expose to window for manual trigger
    window.startWizard = startWizard;
    window.resetWizard = resetWizard;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
