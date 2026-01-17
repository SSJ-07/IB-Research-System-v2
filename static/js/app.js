// Define sendMessage early to ensure global accessibility
// This must be defined before any HTML tries to use onclick="sendMessage()"
// #region agent log
console.log('Defining sendMessage on window object');
// #endregion
window.sendMessage = function sendMessage() {
    // #region agent log
    console.log('sendMessage function called');
    // #endregion
    var input = $("#chat-input");
    var content = input.val().trim();
    if (content === "") return;

    // On first message, show proposal in sticky box and clear placeholder
    const isFirstMessage = $("#welcome-message").is(":visible");
    if (isFirstMessage) {
        $("#welcome-message").hide();
        $("#proposal-content").show().text(content);
        $("#edit-button").show();
        input.attr("placeholder", "Provide feedback or suggestions to refine your research idea...");
    }

    // Ensure Research Brief tab is active
    switchTab('research-brief');
    showGenerateRQButton();

    // Disable input while processing
    input.prop('disabled', true);
    input.val('');

    // Add user message to chat ONLY if it's not the first message
    var chatArea = $("#chat-box");
    if (!isFirstMessage) {
        var userMessageDiv = $('<div></div>')
            .attr('data-sender', 'user')
            .text(content)
            .hide();
        chatArea.append(userMessageDiv);
        userMessageDiv.slideDown();
        chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
    }

    // Hide Generate RQ button during loading/generation
    $("#generate-rq-container").hide();
    
    // Add loading indicator with context-specific message
    let loadingMessage = 'Processing...';
    if (isFirstMessage) {
        loadingMessage = 'Generating initial idea...';
    } else {
        // Check for feedback-related keywords more thoroughly
        const lowerContent = content.toLowerCase().trim();
        const feedbackKeywords = ['feedback', 'improve', 'refine', 'suggest', 'change', 'modify', 'update', 'revise', 'edit', 'adjust'];
        const hasFeedback = feedbackKeywords.some(keyword => lowerContent.includes(keyword));
        if (hasFeedback) {
            loadingMessage = 'Processing your feedback to improve the research idea...';
        }
    }
    
    var loadingDiv = $('<div></div>')
        .attr('data-sender', 'system')
        .html(`<span style="display: flex; align-items: center; gap: 6px;">${createLoadingText(loadingMessage)}</span>`)
        .hide();
    chatArea.append(loadingDiv);
    loadingDiv.slideDown();
    chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');

    $.ajax({
        url: '/api/chat',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ 
            content: content,
            subject: selectedSubject  // Include selected subject
        }),
        success: function (data) {
            // Remove loading indicator
            loadingDiv.remove();

            // Display system messages (like "Generating idea...")
            if (data.messages && data.messages.length > 0) {
                // Add all system messages that were added after user's message
                const userMessageIndex = data.messages.findIndex(m =>
                    m.role === 'user' && m.content === content);

                if (userMessageIndex !== -1) {
                    for (let i = userMessageIndex + 1; i < data.messages.length; i++) {
                        const msg = data.messages[i];
                        if (msg.role === 'system') {
                            var systemMsgDiv = $('<div></div>')
                                .attr('data-sender', 'system')
                                .text(msg.content)
                                .hide();
                            chatArea.append(systemMsgDiv);
                            systemMsgDiv.slideDown();
                        }
                    }
                }

                // Auto scroll to bottom
                chatArea.scrollTop(chatArea[0].scrollHeight);
            }

            // Update main idea if provided
            if (data.idea) {
                // Parse and format any JSON structure in the idea
                const structuredIdea = parseAndFormatStructuredIdea(data.idea);
                $("#main-idea").html(prependFeedbackToIdea(formatMessage(structuredIdea), data.feedback));
                $("#main-idea").removeAttr('style').addClass('active');
                // Hide placeholder when content is added
                $("#brief-placeholder").hide();
                showGenerateRQButton();
            }

            // Show research brief buttons after first response
            $(".research-brief-buttons").fadeIn();

            if (data.average_score !== undefined) {
                updateScoreDisplay(data.average_score);
            }

            // After successful idea generation, collapse physics topics if any
        },
        error: function (xhr, status, error) {
            // Remove loading indicator
            loadingDiv.remove();

            var errorDiv = $('<div></div>')
                .attr('data-sender', 'system')
                .text('Error: ' + (xhr.responseJSON?.error || error))
                .hide();
            chatArea.append(errorDiv);
            errorDiv.slideDown();
            chatArea.scrollTop(chatArea[0].scrollHeight);
        },
        complete: function () {
            // Re-enable input
            input.prop('disabled', false);
            input.focus();
        }
    });
};

// Helper function to create loading text with animated dots
function createLoadingText(text) {
    // Replace "..." with animated dots HTML
    return text.replace('...', '<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>');
}
window.createLoadingText = createLoadingText;

// Initialize state object
const state = {
    currentReviewAspectIndex: 0,
    aspectsToReview: ["lack_of_novelty", "assumptions", "vagueness", "feasibility_and_practicality", "overgeneralization", "overstatement", "evaluation_and_validation_issues", "justification_for_methods", "reproducibility", "contradictory_statements", "impact", "alignment", "ethical_and_social_considerations", "robustness"],
    acceptedReviews: [],
    reviewInProgress: false
};

const MCTS_CONFIG = {
    maxIterations: 5,
    explorationDelay: 3000,
    explorationConstant: 1.414,
    discountFactor: 0.95,
    maxDepth: 3
};

// Add iteration tracking variable
let mctsIterationCount = 0;
let currentMCTSDepth = 0;

// Initialize highlight state and tree variables
const highlightState = {
    rawIdea: "",
    highlights: [],
    lastContent: ""
};

let treeMode = false;
let treeData = null;
let current_root = null; // Initialize current_root

// Define main_idea as a global variable to store the current idea
let main_idea = "";

// Store selected subject (default to physics for Physics IA flow)
let selectedSubject = 'physics';

// Add this near the top of the file to ensure our function is available globally
let toggleFromAutoGenerate; 

$(document).ready(function () {
    // #region agent log
    console.log('Document ready - checking sendMessage:', typeof window.sendMessage, typeof sendMessage);
    // #endregion
    loadKnowledge();
    loadChat();
    loadIdea(true); // Initial load, don't overwrite highlights
    
    // Initialize subject selector
    // #region agent log
    console.log('Attaching subject select handler, element exists:', $('#subject-select').length > 0);
    // #endregion
    $('#subject-select').on('change', function() {
        // #region agent log
        console.log('Subject select changed to:', $(this).val());
        // #endregion
        const subject = $(this).val();
        selectedSubject = subject;
        saveSubject(subject);
        updateSubjectUI(subject);
    });
    
    // Load saved subject on page load
    loadSubject();
    
    // Auto-resize textarea function
    function autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        const maxHeight = 128; // 8rem = 128px
        const newHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = newHeight + 'px';
        
        // Show scrollbar only when content exceeds max-height
        if (textarea.scrollHeight > maxHeight) {
            textarea.style.overflowY = 'auto';
        } else {
            textarea.style.overflowY = 'hidden';
        }
    }
    
    // Add input event for auto-resize
    $('#chat-input').on('input', function() {
        autoResizeTextarea(this);
    });
    
    // Add Enter key handler for chat input (Enter sends, Shift+Enter creates new line)
    $('#chat-input').on('keydown', function(e) {
        if (e.which === 13 || e.keyCode === 13) {
            if (!e.shiftKey) {
                e.preventDefault();
                sendMessage();
                // Reset height after sending
                this.style.height = 'auto';
            }
            // If Shift+Enter, allow default behavior (new line)
        }
    });

    // Polling removed - loadIdea should only be called when idea is actually updated
    // (e.g., after generation, refresh, or node selection)
    // setInterval(loadIdea, 5000); // REMOVED - was causing constant polling
    
    // Check if the MCTS auto module has a toggleAutoGenerate function and use it
    if (typeof window.toggleAutoGenerate === 'function') {
        // Store a reference to the MCTS auto implementation
        toggleFromAutoGenerate = window.toggleAutoGenerate;
    }

    // Connect main RQ button to generateRQ - use event delegation to ensure it works even if button is dynamically shown
    $(document).on('click', '#generate-rq-btn-main', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Generate RQ button clicked');
        generateRQ();
        return false;
    });
    
    $(document).on('click', '.expand-section-btn', function() {
        const section = $(this).data('section');
        expandSection(section);
    });

    $(document).on('click', '.retrieve-citations-btn', function() {
        const section = $(this).data('section');
        retrieveCitations(section);
    });

    // Tab buttons
    $(document).on('click', '#tab-research-brief', function(e) {
        e.preventDefault();
        console.log('Research Brief tab button clicked');
        // Visual feedback
        $(this).css('opacity', '0.5');
        setTimeout(() => $(this).css('opacity', ''), 100);
        switchTab('research-brief');
    });
    
    $(document).on('click', '#tab-ia-section', function(e) {
        e.preventDefault();
        console.log('IA Section tab button clicked');
        // Visual feedback
        $(this).css('opacity', '0.5');
        setTimeout(() => $(this).css('opacity', ''), 100);
        switchTab('ia-section');
    });

    // Copy Brief button
    $(document).on('click', '#copy-brief-btn', function(e) {
        e.preventDefault();
        copyResearchBrief();
    });

    // Watch for changes to main-idea to show/hide copy button
    const mainIdea = document.getElementById('main-idea');
    if (mainIdea) {
        const observer = new MutationObserver(function(mutations) {
            updateCopyButtonVisibility();
        });
        observer.observe(mainIdea, { childList: true, subtree: true, characterData: true });
        
        // Initial check
        updateCopyButtonVisibility();
    }

    // Initialization for tabs
    $('#tab-research-brief').show();
    $('#tab-ia-section').show();
    $('#main-idea').show().addClass('active');
    $('#ia-sections-panel').hide().removeClass('active');
    
    // #region agent log
    console.log('Event handlers consolidated and attached.');
    // #endregion
});

// Configure marked for safe rendering
marked.setOptions({
    sanitize: true,
    breaks: true
});

function formatMessage(content) {
    try {
        // First ensure our styling for section headers is in place
        ensureSectionHeaderStyles();
        
        // Ensure content is a string (handle arrays and other types)
        if (Array.isArray(content)) {
            // If content is an array, join elements or take first element
            content = content.length > 0 ? String(content[0]) : '';
        } else if (content === null || content === undefined) {
            content = '';
        } else {
            content = String(content);
        }
        
        // Parse markdown content using marked
        let formattedContent = marked.parse(content);
        
        // Add section-header class to all h2 and h3 elements for consistent styling
        formattedContent = formattedContent
            .replace(/<h2([^>]*)>/g, '<h2$1 class="section-header">')
            .replace(/<h3([^>]*)>/g, '<h3$1 class="section-header">');
        
        return formattedContent;
    } catch (e) {
        console.error('Markdown parsing error:', e);
        return content;
    }
}

function formatCitationPrefix(author, year, index, numbered) {
    let authorCitation = '';
    if (author) {
        if (author.includes('et al.')) {
            authorCitation = author;
        } else {
            const parts = author.trim().split(' ');
            authorCitation = parts[parts.length - 1];
        }
    }
    if (year) {
        authorCitation += ` (${year})`;
    }
    if (numbered) {
        authorCitation = `[${index}] ${authorCitation}`;
    }
    return authorCitation.trim();
}

function renderCitationList(citations, options = {}) {
    const numbered = Boolean(options.numbered);
    const validCitations = (citations || []).filter(c =>
        c.author && c.author !== 'N/A' && c.author !== 'Unknown' &&
        c.year && c.year !== 'N/A'
    );
    if (validCitations.length === 0) {
        return { html: '', count: 0, citations: [] };
    }
    const citationsHtml = validCitations.map((c, index) => {
        const title = c.title || 'Untitled';
        const author = c.author || 'Unknown';
        const year = c.year || 'n.d.';
        const url = c.url || '';
        const prefix = formatCitationPrefix(author, year, index + 1, numbered);
        const linkHtml = url ? `<a href="${url}" target="_blank">${title}</a>` : `${title}`;
        return `<div class="citation-item">
            <div class="citation-link">
                <span class="citation-prefix">${prefix}</span>
                ${linkHtml}
            </div>
        </div>`;
    }).join('');
    return { html: citationsHtml, count: validCitations.length, citations: validCitations };
}

const COPY_ICON_SVG = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
`;

const CHECK_ICON_SVG = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6 9 17l-5-5"></path>
    </svg>
`;

function ensureCopyButtonContainer() {
    const mainIdea = document.getElementById('main-idea');
    if (!mainIdea) return null;

    let container = document.getElementById('copy-brief-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'copy-brief-container';
        container.className = 'copy-brief-container';

        const button = document.createElement('button');
        button.id = 'copy-brief-btn';
        button.className = 'copy-brief-btn';
        button.title = 'Copy research brief to clipboard';
        button.innerHTML = COPY_ICON_SVG;
        container.appendChild(button);

        mainIdea.appendChild(container);
    } else if (container.parentElement !== mainIdea) {
        mainIdea.appendChild(container);
    } else if (mainIdea.lastElementChild !== container) {
        // Ensure the button container stays at the end of the content
        mainIdea.appendChild(container);
    }

    return container;
}

// Copy research brief to clipboard
function copyResearchBrief() {
    const mainIdea = document.getElementById('main-idea');
    if (!mainIdea) return;
    
    // Get the text content (without HTML)
    const textContent = mainIdea.innerText || mainIdea.textContent;
    
    if (!textContent || textContent.trim() === '') {
        console.log('No content to copy');
        return;
    }
    
    // Copy to clipboard
    navigator.clipboard.writeText(textContent.trim()).then(() => {
        // Show success feedback
        const btn = document.getElementById('copy-brief-btn');
        if (btn) {
            btn.classList.add('copied');
            btn.innerHTML = CHECK_ICON_SVG;
            
            // Reset after 2 seconds
            setTimeout(() => {
                btn.classList.remove('copied');
                btn.innerHTML = COPY_ICON_SVG;
            }, 2000);
        }
    }).catch(err => {
        console.error('Failed to copy text:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = textContent.trim();
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            const btn = document.getElementById('copy-brief-btn');
            if (btn) {
                btn.classList.add('copied');
                btn.innerHTML = CHECK_ICON_SVG;
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = COPY_ICON_SVG;
                }, 2000);
            }
        } catch (e) {
            console.error('Fallback copy failed:', e);
        }
        document.body.removeChild(textArea);
    });
}

// Show/hide copy button based on content
function updateCopyButtonVisibility() {
    const mainIdea = document.getElementById('main-idea');
    const copyContainer = ensureCopyButtonContainer();
    
    if (mainIdea && copyContainer) {
        const hasContent = (mainIdea.textContent || '').trim().length > 0;
        copyContainer.style.display = hasContent ? 'block' : 'none';
    }
}

// Helper function to ensure consistent section header styling across the application
function ensureSectionHeaderStyles() {
    const styleId = 'section-header-styles';
    
    // Create style element if it doesn't exist yet
    if (!document.getElementById(styleId)) {
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = `
            #main-idea .section-header {
                margin-top: 20px;
                margin-bottom: 10px;
                border-bottom: 1px solid #eaeaea;
                padding-bottom: 5px;
            }
            #main-idea h2.section-header {
                margin-top: 0;
            }
        `;
        document.head.appendChild(styleEl);
    }
}

// Helper function to parse Python dict string to JSON
function parsePythonDictString(dictStr) {
    if (typeof dictStr !== 'string') return null;
    
    try {
        // Convert Python dict syntax to JSON
        let jsonStr = dictStr
            .replace(/'/g, '"')  // Replace single quotes with double quotes
            .replace(/True/g, 'true')
            .replace(/False/g, 'false')
            .replace(/None/g, 'null');
        
        // Parse as JSON
        return JSON.parse(jsonStr);
    } catch (e) {
        console.warn("Failed to parse Python dict string:", e);
        return null;
    }
}

// Helper function to format experiment plan dict as markdown
function formatExperimentPlanDict(planObj) {
    if (!planObj || typeof planObj !== 'object') return String(planObj);
    
    let result = '';
    for (const [key, value] of Object.entries(planObj)) {
        // Format key as header
        const headerKey = key.replace(/_/g, ' ');
        result += `### ${headerKey}\n\n`;
        
        // Format value
        if (Array.isArray(value)) {
            // Format array items as bullet list, removing leading * markers
            value.forEach(item => {
                if (typeof item === 'string') {
                    // Remove leading * or - markers and clean up
                    const cleaned = item.replace(/^[\s]*[\*\-\u2022]\s+/, '').trim();
                    if (cleaned) {
                        result += `- ${cleaned}\n`;
                    }
                } else {
                    result += `- ${String(item)}\n`;
                }
            });
        } else if (typeof value === 'string') {
            // Remove leading * or - markers
            const cleaned = value.replace(/^[\s]*[\*\-\u2022]\s+/, '').trim();
            result += `${cleaned}\n`;
        } else {
            result += `${String(value)}\n`;
        }
        result += '\n';
    }
    return result;
}

// Helper function to check and format experiment plan if it's a Python dict string
function formatExperimentPlan(plan) {
    if (!plan) return plan;
    
    // If it's already an object, format it directly
    if (typeof plan === 'object' && plan !== null) {
        return formatExperimentPlanDict(plan);
    }
    
    // If it's a string that looks like a Python dict, parse and format it
    if (typeof plan === 'string' && plan.trim().startsWith('{') && plan.includes("'")) {
        const parsed = parsePythonDictString(plan);
        if (parsed) {
            return formatExperimentPlanDict(parsed);
        }
    }
    
    // Otherwise return as-is
    return plan;
}

// New function to parse and format JSON structured ideas with fallback
function parseAndFormatStructuredIdea(ideaContent) {
    // Early exit for non-JSON content
    if (!ideaContent || (!ideaContent.includes('{') && !ideaContent.includes('}'))) {
        return ideaContent;
    }
    
    // Try direct JSON parsing first
    try {
        const jsonPattern = /({[\s\S]*})/g;
        const match = jsonPattern.exec(ideaContent);
        
        if (match && match[1]) {
            const jsonStr = match[1].trim();
            console.log("Found possible JSON:", jsonStr.substring(0, 100) + "...");
            
            const ideaJson = JSON.parse(jsonStr);
            
            if (ideaJson.title) {
                console.log("Successfully parsed structured idea JSON");
                
                let formattedContent = `# ${ideaJson.title}\n\n`;
                
                if (ideaJson.proposed_method) {
                    formattedContent += `## Proposed Method\n\n${ideaJson.proposed_method}\n\n***\n\n`;
                }
                
                if (ideaJson.experiment_plan) {
                    const formattedPlan = formatExperimentPlan(ideaJson.experiment_plan);
                    formattedContent += `## Experiment Plan\n\n${formattedPlan}\n\n***\n\n`;
                }
                
                if (ideaJson.test_case_examples) {
                    formattedContent += `## Test Case Examples\n\n${ideaJson.test_case_examples}\n\n`;
                }
                
                if (ideaJson.content && 
                    !ideaJson.proposed_method && 
                    !ideaJson.experiment_plan && 
                    !ideaJson.test_case_examples) {
                    formattedContent += ideaJson.content;
                }
                
                console.log("Formatted content from JSON:", formattedContent.substring(0, 100) + "...");
                return formattedContent;
            }
        } else {
            // No JSON pattern found - this is expected, silently fall back
            // Don't log errors for normal non-JSON content
        }
    } catch (e) {
        // Only log if we actually found a JSON pattern but parsing failed
        // This indicates a real parsing issue, not just non-JSON content
        const jsonPattern = /({[\s\S]*})/g;
        const match = jsonPattern.exec(ideaContent);
        if (match && match[1]) {
            console.warn("JSON parsing error (pattern found but invalid):", e.message);
        }
        // Silently fall back to regex extraction for normal cases
        
        // FALLBACK: Use regex extraction when JSON parsing fails
        try {
            // Extract sections using regex
            let formattedContent = "";
            
            // Extract title
            const titleMatch = ideaContent.match(/"title":\s*"([^"]+)"/);
            if (titleMatch && titleMatch[1]) {
                formattedContent += `# ${titleMatch[1]}\n\n`;
            } else {
                // Alternative match with single quotes
                const altTitleMatch = ideaContent.match(/'title':\s*'([^']+)'/);
                if (altTitleMatch && altTitleMatch[1]) {
                    formattedContent += `# ${altTitleMatch[1]}\n\n`;
                }
            }
            
            // Extract proposed method
            let proposedMethod = extractField(ideaContent, "proposed_method");
            if (proposedMethod) {
                formattedContent += `## Proposed Method\n\n${proposedMethod}\n\n***\n\n`;
            }
            
            // Extract experiment plan
            let experimentPlan = extractField(ideaContent, "experiment_plan");
            if (experimentPlan) {
                const formattedPlan = formatExperimentPlan(experimentPlan);
                formattedContent += `## Experiment Plan\n\n${formattedPlan}\n\n***\n\n`;
            }
            
            // Extract test case examples
            let testCases = extractField(ideaContent, "test_case_examples");
            if (testCases) {
                formattedContent += `## Test Case Examples\n\n${testCases}\n\n`;
            }
            
            // If no structured fields were found, return the original content
            if (formattedContent === "" || formattedContent === "# \n\n") {
                console.log("No structured fields found with regex, returning original");
                return ideaContent;
            }
            
            console.log("Formatted content from regex:", formattedContent.substring(0, 100) + "...");
            return formattedContent;
        } catch (regexError) {
            console.error("Regex extraction failed:", regexError);
            // If regex extraction also fails, return original content
            return ideaContent;
        }
    }
    
    console.log("No JSON structure found, returning original");
    return ideaContent;
}


// Helper function to extract fields using regex
function extractField(content, fieldName) {
    // Try double quotes first
    const doubleQuotePattern = new RegExp(`"${fieldName}":\\s*"([^"]*(?:"[^"]*"[^"]*)*)"`);
    const doubleMatch = content.match(doubleQuotePattern);
    
    if (doubleMatch && doubleMatch[1]) {
        return doubleMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
    }
    
    // Try single quotes
    const singleQuotePattern = new RegExp(`'${fieldName}':\\s*'([^']*(?:'[^']*'[^']*)*)'`);
    const singleMatch = content.match(singleQuotePattern);
    
    if (singleMatch && singleMatch[1]) {
        return singleMatch[1].replace(/\\'/g, "'").replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
    }
    
    // Try block approach - look for field followed by content between braces
    const blockPattern = new RegExp(`"${fieldName}":\\s*(\\{[^\\}]*\\}|\\[[^\\]]*\\])`);
    const blockMatch = content.match(blockPattern);
    
    if (blockMatch && blockMatch[1]) {
        return blockMatch[1];
    }
    
    // Try multi-line extraction (more complex but handles more cases)
    const multilinePattern = new RegExp(`"${fieldName}":\\s*"([\\s\\S]*?)(?:"\\s*,\\s*"(?:experiment_plan|proposed_method|test_case_examples|title)":|"\\s*\\})`);
    const multiMatch = content.match(multilinePattern);
    
    if (multiMatch && multiMatch[1]) {
        return multiMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
    }
    
    // If nothing works, return null
    return null;
}

function loadKnowledge() {
    $.get('/api/knowledge', function (data) {
        var list = $("#knowledge-list");
        list.empty();
        data.forEach(function (chunk) {
            var chunkDiv = $('<div class="knowledge-chunk"></div>');
            chunkDiv.text(chunk.text);
            // Create hover popup for full text
            var fullText = $('<div class="full-text"></div>');
            fullText.text(chunk.full_text);
            chunkDiv.append(fullText);
            // Append source link
            var link = $('<br/><a target="_blank" href="' + chunk.source + '">Source</a>');
            chunkDiv.append(link);
            list.append(chunkDiv);
        });
    });
}

function addKnowledge() {
    var text = prompt("Enter knowledge text:");
    var source = prompt("Enter source URL:");
    if (text && source) {
        $.ajax({
            url: '/api/add_knowledge',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ text: text, source: source }),
            success: function (data) {
                loadKnowledge();
            }
        });
    }
}

function loadSubject() {
    $.get('/api/subject')
        .done(function(data) {
            if (data.subject) {
                selectedSubject = data.subject;
                $('#subject-select').val(data.subject);
                updateSubjectUI(data.subject);
            } else {
                // Default to physics if no subject is saved
                selectedSubject = 'physics';
                $('#subject-select').val('physics');
                updateSubjectUI('physics');
                saveSubject('physics');
            }
        })
        .fail(function() {
            // Default to physics on error
            selectedSubject = 'physics';
            $('#subject-select').val('physics');
            updateSubjectUI('physics');
            saveSubject('physics');
        });
}

function updateSubjectUI(subject) {
    // Update placeholder text based on subject
    const placeholder = subject === 'physics' 
        ? 'Enter your Physics research goal...'
        : subject === 'chemistry'
        ? 'Enter your Chemistry research goal...'
        : 'Enter your research goal to begin...';
    $('#chat-input').attr('placeholder', placeholder);
}

function saveSubject(subject) {
    $.ajax({
        url: '/api/subject',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ subject: subject || null }),
        success: function(data) {
            console.log('Subject saved:', data.subject);
        },
        error: function() {
            console.error('Failed to save subject');
        }
    });
}

function updateSubjectBadge(subject) {
    // Legacy function - kept for compatibility
    updateSubjectUI(subject);
}

// Physics IA Functions - Load all topics from syllabus automatically
function loadAllPhysicsTopics(callback) {
    $.get('/api/physics/topics', function(data) {
        const topics = data.topics || [];
        if (callback) callback(topics);
    }).fail(function() {
        console.error('Failed to load physics topics');
        if (callback) callback([]);
    });
}

// Chemistry IA Functions - Load all topics from syllabus automatically
function loadAllChemistryTopics(callback) {
    $.get('/api/chemistry/topics', function(data) {
        const topics = data.topics || [];
        if (callback) callback(topics);
    }).fail(function() {
        console.error('Failed to load chemistry topics');
        if (callback) callback([]);
    });
}

// Generic topic loader for any subject
function loadTopicsForSubject(subject, callback) {
    if (subject === 'physics') {
        loadAllPhysicsTopics(callback);
    } else if (subject === 'chemistry') {
        loadAllChemistryTopics(callback);
    } else {
        // No topics for other subjects
        if (callback) callback([]);
    }
}

function generateIATopic() {
    const researchGoal = $('#chat-input').val() || '';
    
    // Load all topics from syllabus for physics or chemistry
    if (selectedSubject === 'physics' || selectedSubject === 'chemistry') {
        loadTopicsForSubject(selectedSubject, function(allTopics) {
            $.ajax({
                url: '/api/step',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    action: 'generate_ia_topic',
                    research_goal: researchGoal,
                    topics: allTopics, // Pass all topics from syllabus
                    use_mcts: false
                }),
                success: function(data) {
                    if (data.idea) {
                        displayIATopic(data.idea);
                    }
                },
                error: function(xhr) {
                    console.error('Error generating IA topic:', xhr);
                    alert('Error generating IA topic. Please try again.');
                }
            });
        });
    } else {
        // For other subjects, proceed without topics
        $.ajax({
            url: '/api/step',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                action: 'generate_ia_topic',
                research_goal: researchGoal,
                use_mcts: false
            }),
            success: function(data) {
                if (data.idea) {
                    displayIATopic(data.idea);
                }
            },
            error: function(xhr) {
                console.error('Error generating IA topic:', xhr);
                alert('Error generating IA topic. Please try again.');
            }
        });
    }
}

function displayIATopic(content) {
    $('#ia-topic-content').html(formatMessage(content));
    $('#ia-topic-display').show();
    // Hide IA section placeholder when content is displayed
    $('#ia-placeholder').hide();
    
    // Show IA sections tab button and switch to research brief (initial state)
    $('#tab-ia-section').show();
    switchTab('research-brief');
}

// Make generateRQ globally accessible
window.generateRQ = function generateRQ() {
    console.log('generateRQ called');
    
    // Get button and store original text
    const btn = $('#generate-rq-btn-main');
    if (!btn.length) {
        console.error('Generate RQ button not found');
        return;
    }
    
    // Check if already generating
    if (btn.prop('disabled')) {
        console.log('Already generating RQ, ignoring request');
        return;
    }
    
    // Use a hardcoded original text to prevent getting stuck on "Generating..."
    const originalText = 'Generate Research Question';
    
    // Helper function to reset button state
    const resetButton = function() {
        if (btn.length) {
            btn.prop('disabled', false).text(originalText);
        }
    };
    
    // Get research brief content - try both IA topic and main idea
    let researchContent = $('#ia-topic-content').text();
    if (!researchContent || researchContent.trim().length === 0) {
        // Fall back to main research brief
        researchContent = $('#main-idea').text() || main_idea;
    }
    
    console.log('Research content length:', researchContent ? researchContent.trim().length : 0);
    
    if (!researchContent || researchContent.trim().length === 0) {
        alert('Please generate a research brief first.');
        return;
    }
    
    // Show loading state
    btn.prop('disabled', true).html(`<span style="display: flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap;">${createLoadingText('Generating Research Question...')}</span>`);
    
    // Load all topics from syllabus if physics subject
    const sendRQRequest = function(topics) {
        $.ajax({
            url: '/api/generate_rq',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 
                ia_topic: researchContent,
                topics: topics || [] // Pass all topics from syllabus
            }),
            success: function(data) {
                console.log('RQ generation success:', data);
                // Prefer multiple RQ options if available
                if (Array.isArray(data.research_questions) && data.research_questions.length > 0) {
                    renderRQChoices(data.research_questions);
                } else if (data.research_question) {
                    displayRQ(data.research_question, data.warnings || [], data.is_valid);
                    displayRQInChat(data.research_question, data.warnings || [], data.is_valid);
                } else {
                    alert('No research question was generated. Please try again.');
                }
                resetButton();
            },
            error: function(xhr) {
                console.error('Error generating RQ:', xhr);
                console.error('Response:', xhr.responseText);
                const errorMsg = xhr.responseJSON?.error || xhr.statusText || 'Please try again.';
                alert('Error generating Research Question: ' + errorMsg);
                resetButton();
            }
        });
    };
    
    // Load all topics from syllabus for physics or chemistry
    if (selectedSubject === 'physics' || selectedSubject === 'chemistry') {
        let callbackFired = false;
        const timeout = setTimeout(function() {
            if (!callbackFired) {
                console.warn(`loadTopicsForSubject(${selectedSubject}) timeout, proceeding without topics`);
                sendRQRequest([]);
            }
        }, 5000); // 5 second timeout
        
        try {
            loadTopicsForSubject(selectedSubject, function(allTopics) {
                callbackFired = true;
                clearTimeout(timeout);
                console.log(`Loaded all ${selectedSubject} topics from syllabus:`, allTopics.length);
                sendRQRequest(allTopics);
            });
        } catch (error) {
            callbackFired = true;
            clearTimeout(timeout);
            console.error(`Error loading ${selectedSubject} topics:`, error);
            sendRQRequest([]);
        }
    } else {
        // For other subjects, proceed without topics
        sendRQRequest([]);
    }
};

function displayRQ(rq, warnings, is_valid) {
    const rqDisplay = $('#rq-display');
    const rqContent = $('#rq-content');
    
    // Update content
    rqContent.text(rq);
    rqDisplay.show();
    // Hide IA section placeholder when RQ is displayed
    $('#ia-placeholder').hide();
    
    // Show IA sections tab button and switch to research brief (initial state)
    $('#tab-ia-section').show();
    switchTab('research-brief');
    
    // Remove any existing badge
    rqDisplay.find('.rq-validity-badge').remove();
    
    // Add validity badge in header
    const badgeClass = is_valid !== false ? 'valid' : 'needs-review';
    const badgeText = is_valid !== false ? 'Valid' : 'Needs Review';
    const badge = $(`<span class="rq-validity-badge ${badgeClass}">${badgeText}</span>`);
    rqDisplay.find('h3').after(badge);
    
    // Reset text color to standard (badge handles status indication)
    rqContent.css('color', '#1f2937');
    
    if (warnings && warnings.length > 0) {
        $('#rq-warnings').html('<div class="rq-warnings-title">Validation Issues:</div><ul>' + 
            warnings.map(w => `<li>${w}</li>`).join('') + '</ul>');
        $('#rq-warnings').show();
    } else {
        $('#rq-warnings').empty().hide();
    }
}

function displayRQInChat(rq, warnings, is_valid) {
    const chatArea = $("#chat-box");
    
    // Create RQ display card with consistent app styling
    const rqCard = $(`
        <div class="rq-card">
            <div class="rq-card-header">
                <h3>Research Question</h3>
                <span class="rq-status-badge ${is_valid ? 'valid' : 'needs-review'}">
                    ${is_valid ? 'Valid' : 'Needs Review'}
                </span>
            </div>
            <div class="rq-text">
                ${rq}
            </div>
            ${warnings && warnings.length > 0 ? `
                <div class="rq-warnings">
                    <span class="rq-warnings-title">Validation Issues:</span>
                    <ul>
                        ${warnings.map(w => `<li>${w}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            <div class="rq-actions">
                <button class="ia-section-action-btn secondary rq-edit-btn">Edit</button>
                <button class="ia-section-action-btn rq-approve-btn">Approve</button>
                <button class="ia-section-action-btn secondary rq-decline-btn">Decline</button>
                <button class="ia-section-action-btn secondary rq-feedback-btn">Feedback</button>
            </div>
        </div>
    `);
    
    // Add click handlers
    rqCard.find('.rq-edit-btn').on('click', function() {
        editRQ(rqCard, rq, warnings, is_valid);
    });
    
    rqCard.find('.rq-approve-btn').on('click', function() {
        const editedRQ = rqCard.find('.rq-text').text().trim();
        handleRQApproval(editedRQ);
        // Hide all other RQ cards
        $('.rq-card').not(rqCard).fadeOut(300, function() { $(this).remove(); });
        rqCard.fadeOut(300, function() { $(this).remove(); });
    });
    
    rqCard.find('.rq-decline-btn').on('click', function() {
        handleRQDecline(rq);
        rqCard.fadeOut(300, function() { $(this).remove(); });
    });
    
    rqCard.find('.rq-feedback-btn').on('click', function() {
        const currentRQ = rqCard.find('.rq-text').text().trim();
        showRQFeedbackModal(currentRQ, warnings);
    });
    
    // Append to chat area
    chatArea.append(rqCard);
    
    // Scroll to bottom
    chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
}

function renderRQChoices(rqOptions) {
    if (!Array.isArray(rqOptions) || rqOptions.length === 0) {
        return false;
    }
    // Hide right panel RQ display until a choice is approved
    $('#rq-display').hide();
    $('#rq-warnings').empty().hide();
    $('#expand-buttons').hide();

    rqOptions.forEach((option) => {
        const text = option.text || option.research_question || '';
        const warnings = option.warnings || [];
        const isValid = option.is_valid !== false;
        if (text) {
            displayRQInChat(text, warnings, isValid);
        }
    });
    return true;
}

function editRQ(rqCard, rq, warnings, is_valid) {
    const rqTextDiv = rqCard.find('.rq-text, .ia-section-text');
    const currentText = rqTextDiv.text().trim();
    
    // Create editable textarea
    const textarea = $('<textarea class="ia-section-edit-textarea"></textarea>')
        .css({
            'width': '100%',
            'min-height': '80px',
            'padding': '12px',
            'border': '2px solid #3b82f6',
            'border-radius': '8px',
            'font-size': '0.95rem',
            'font-weight': '500',
            'font-family': 'inherit',
            'resize': 'vertical'
        })
        .val(currentText);
    
    // Replace text with textarea
    rqTextDiv.replaceWith(textarea);
    
    // Add save/cancel buttons using new CSS classes
    const editActions = $('<div class="ia-section-edit-actions"></div>');
    const saveBtn = $('<button class="ia-section-save-btn">Save</button>');
    const cancelBtn = $('<button class="ia-section-cancel-btn">Cancel</button>');
    
    editActions.append(saveBtn).append(cancelBtn);
    rqCard.find('.rq-actions, .ia-section-actions').before(editActions);
    
    // Hide original action buttons
    rqCard.find('.rq-actions, .ia-section-actions').hide();
    
    // Save handler
    saveBtn.on('click', function() {
        const newRQ = textarea.val().trim();
        if (newRQ) {
            // Replace textarea with updated text
            const newTextDiv = $('<div class="ia-section-text rq-text"></div>').text(newRQ);
            textarea.replaceWith(newTextDiv);
            editActions.remove();
            rqCard.find('.rq-actions, .ia-section-actions').show();
        }
    });
    
    // Cancel handler
    cancelBtn.on('click', function() {
        const originalTextDiv = $('<div class="ia-section-text rq-text"></div>').text(currentText);
        textarea.replaceWith(originalTextDiv);
        editActions.remove();
        rqCard.find('.rq-actions, .ia-section-actions').show();
    });
}

function handleRQApproval(rq) {
    // Hide all other RQ cards in chat
    $('.rq-card').fadeOut(300, function() { $(this).remove(); });
    
    // Ensure IA sections tab button is visible and switch to IA Section tab
    $('#tab-ia-section').show();
    switchTab('ia-section');
    
    // Update the RQ in the sidebar with consistent styling
    $('#rq-content').text(rq);
    $('#rq-display').show();
    $('#rq-content').css('color', '#334155'); // Use app's standard text color
    $('#rq-warnings').empty().hide();
    
    // Show section generation buttons
    $('#expand-buttons').show();
    
    // Show success message with consistent styling
    const chatArea = $("#chat-box");
    const successMsg = $('<div></div>')
        .attr('data-sender', 'system')
        .css({
            'padding': '10px 15px',
            'background': '#f0fdf4',
            'border-left': '3px solid #22c55e',
            'border-radius': '6px',
            'margin': '10px 0',
            'color': '#166534',
            'font-size': '13px'
        })
        .html('Research Question approved and saved.')
        .hide();
    chatArea.append(successMsg);
    successMsg.slideDown();
    chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
    
    // Update backend state
    $.ajax({
        url: '/api/approve_rq',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ research_question: rq }),
        success: function(data) {
            console.log('RQ approved in backend:', data);
        },
        error: function(xhr) {
            console.error('Error approving RQ:', xhr);
        }
    });
}

function handleRQDecline(rq) {
    // Show message with consistent styling
    const chatArea = $("#chat-box");
    const declineMsg = $('<div></div>')
        .attr('data-sender', 'system')
        .css({
            'padding': '10px 15px',
            'background': '#fef2f2',
            'border-left': '3px solid #ef4444',
            'border-radius': '6px',
            'margin': '10px 0',
            'color': '#991b1b',
            'font-size': '0.9rem'
        })
        .html('Research Question declined. You can generate a new one.')
        .hide();
    chatArea.append(declineMsg);
    declineMsg.slideDown();
    chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
}

function showRQFeedbackModal(rq, warnings) {
    // Create feedback modal
    const modal = $(`
        <div class="rq-feedback-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <h2 style="margin-top: 0; margin-bottom: 20px;">Provide Feedback on Research Question</h2>
                <div style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 6px;">
                    <strong>Current RQ:</strong>
                    <div style="margin-top: 8px; font-style: italic; color: #666;">${rq}</div>
                </div>
                ${warnings && warnings.length > 0 ? `
                    <div style="margin-bottom: 20px; padding: 15px; background: #ffebee; border-radius: 6px; border-left: 4px solid #d32f2f;">
                        <strong style="color: #d32f2f;">Current Issues:</strong>
                        <ul style="margin-top: 8px; color: #c62828;">
                            ${warnings.map(w => `<li>${w}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Your Feedback:</label>
                    <textarea id="rq-feedback-text" rows="6" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; font-family: inherit;" placeholder="Describe what should be changed or improved..."></textarea>
                </div>
                <div class="ia-section-actions" style="justify-content: flex-end;">
                    <button class="ia-section-action-btn secondary rq-feedback-cancel">
                        Cancel
                    </button>
                    <button class="ia-section-action-btn primary rq-feedback-submit">
                        Submit Feedback
                    </button>
                </div>
            </div>
        </div>
    `);
    
    // Add handlers
    modal.find('.rq-feedback-cancel').on('click', function() {
        modal.fadeOut(300, function() { $(this).remove(); });
    });
    
    modal.find('.rq-feedback-submit').on('click', function() {
        const feedback = $('#rq-feedback-text').val().trim();
        if (feedback) {
            submitRQFeedback(rq, feedback, warnings);
            modal.fadeOut(300, function() { $(this).remove(); });
        } else {
            alert('Please provide feedback before submitting.');
        }
    });
    
    // Close on overlay click
    modal.on('click', function(e) {
        if ($(e.target).hasClass('rq-feedback-modal')) {
            modal.fadeOut(300, function() { $(this).remove(); });
        }
    });
    
    // Add to body
    $('body').append(modal);
    $('#rq-feedback-text').focus();
}

function submitRQFeedback(rq, feedback, warnings) {
    // Load all topics from syllabus for physics, then send feedback
    const sendFeedbackRequest = function(topics) {
        $.ajax({
            url: '/api/generate_rq',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                ia_topic: $('#ia-topic-content').text() || $('#main-idea').text() || main_idea,
                topics: topics || [],
                feedback: feedback,
                previous_rq: rq
            }),
            success: function(data) {
                if (Array.isArray(data.research_questions) && data.research_questions.length > 0) {
                    renderRQChoices(data.research_questions);
                } else {
                    // Show new RQ in chat
                    displayRQInChat(data.research_question, data.warnings || [], data.is_valid);
                    // Update sidebar
                    displayRQ(data.research_question, data.warnings || [], data.is_valid);
                }
                
                const chatArea = $("#chat-box");
                const feedbackMsg = $('<div></div>')
                    .attr('data-sender', 'system')
                    .html(`<span style="display: flex; align-items: center; gap: 6px; color: #6b7280;"><img src="/static/icons/chat.svg" width="14" height="14" alt="chat" style="opacity: 0.6;"> Feedback received. New Research Question generated.</span>`)
                    .hide();
                chatArea.append(feedbackMsg);
                feedbackMsg.slideDown();
                chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
            },
            error: function(xhr) {
                console.error('Error regenerating RQ with feedback:', xhr);
                alert('Error regenerating Research Question. Please try again.');
            }
        });
    };
    
    // Load all topics from syllabus for physics or chemistry
    if (selectedSubject === 'physics' || selectedSubject === 'chemistry') {
        loadTopicsForSubject(selectedSubject, function(allTopics) {
            sendFeedbackRequest(allTopics);
        });
    } else {
        sendFeedbackRequest([]);
    }
}

function expandSection(section) {
    const iaTopic = $('#ia-topic-content').text();
    const rq = $('#rq-content').text();
    
    // Show loading state
    const btn = $(`.expand-section-btn[data-section="${section}"]`);
    const originalText = btn.text();
    const sectionNames = {
        'background': 'Generating Background Information...',
        'procedure': 'Generating Procedure...',
        'research_design': 'Generating Research Design...'
    };
    const loadingText = sectionNames[section] || 'Generating...';
    btn.prop('disabled', true).html(`<span style="display: flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; font-size: inherit;">${createLoadingText(loadingText)}</span>`);
    
    $.ajax({
        url: `/api/expand/${section}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            ia_topic: iaTopic,
            research_question: rq,
            auto_retrieve: true
        }),
        success: function(data) {
            btn.prop('disabled', false).text(originalText);
            // Display in chat with edit/approve/feedback
            displaySectionInChat(section, data.content, data.citations || []);
        },
        error: function(xhr) {
            btn.prop('disabled', false).text(originalText);
            console.error(`Error expanding ${section}:`, xhr);
            alert(`Error expanding ${section}. Please try again.`);
        }
    });
}

// Section-specific knowledge retrieval (uses literature panel query flow)
window.retrieveKnowledgeForSection = function(section) {
    if (window.retrieval && typeof retrieval.generateQuery === 'function') {
        retrieval.generateQuery(section);
        return;
    }
    console.error('Retrieval module not available');
    alert('Retrieval module not available yet. Please try again.');
};

function displaySectionInChat(section, content, citations) {
    const chatArea = $("#chat-box");
    const sectionNames = {
        'background': 'Background Information',
        'procedure': 'Procedure',
        'research_design': 'Research Design'
    };
    const sectionName = sectionNames[section] || section;
    
    // Filter out N/A or empty citations just in case (skip for research_design)
    const numbered = section === 'background';
    const rendered = section !== 'research_design' ? renderCitationList(citations, { numbered }) : { count: 0, html: '', citations: [] };
    const validCitations = rendered.citations;
    
    // Check if content already contains hallucinated template citations and remove them
    let cleanContent = content;
    if (typeof cleanContent === 'string') {
        // Remove N/A placeholder citations
        cleanContent = cleanContent.replace(/\[ID: N\/A \| AUTHOR_REF: N\/A \| YEAR: N\/A \| Citations: N\/A\]/g, '');
        cleanContent = cleanContent.replace(/\[ID: .*? \| AUTHOR_REF: N\/A \| YEAR: N\/A \| Citations: .*?\]/g, '');
        // Remove template format citations (when LLM outputs the template literally)
        cleanContent = cleanContent.replace(/\[ID \| AUTHOR_REF \| YEAR \| Citations: CITES\]/g, '');
        cleanContent = cleanContent.replace(/\[ID \| AUTHOR_REF \| YEAR \| Citations: CITES\]\./g, '');
    }
    
    // Create section display card with consistent app styling
    const sectionCard = $(`
        <div class="section-card" data-section="${section}">
            <div class="section-card-header">
                <h3>${sectionName}</h3>
                <span class="section-status-badge">Draft</span>
            </div>
            <div class="section-text">
                ${formatMessage(cleanContent)}
            </div>
            ${section !== 'research_design' && rendered.count > 0 ? `
                <div class="section-citations-box">
                    <strong>Sources (${rendered.count}):</strong>
                    ${rendered.html}
                </div>
            ` : ''}
            <div class="ia-section-actions section-actions">
                <button class="ia-section-action-btn secondary section-edit-btn">Edit</button>
                <button class="ia-section-action-btn primary section-approve-btn">Approve</button>
                <button class="ia-section-action-btn danger section-decline-btn">Decline</button>
                <button class="ia-section-action-btn secondary section-feedback-btn">Feedback</button>
            </div>
        </div>
    `);
    
    // Store original content in data attribute for later use
    sectionCard.data('original-content', content);
    sectionCard.data('original-citations', citations);
    
    // Add click handlers
    sectionCard.find('.section-edit-btn').on('click', function() {
        editSection(sectionCard, section, content, citations);
    });
    
    sectionCard.find('.section-approve-btn').on('click', function() {
        // Get the original raw content, not the formatted HTML
        const originalContent = sectionCard.data('original-content') || content;
        const originalCitations = sectionCard.data('original-citations') || citations;
        handleSectionApproval(section, originalContent, originalCitations);
        // Hide all other section cards for this section type
        $(`.section-card[data-section="${section}"]`).not(sectionCard).fadeOut(300, function() { $(this).remove(); });
        sectionCard.fadeOut(300, function() { $(this).remove(); });
    });
    
    sectionCard.find('.section-decline-btn').on('click', function() {
        handleSectionDecline(section);
        sectionCard.fadeOut(300, function() { $(this).remove(); });
    });
    
    sectionCard.find('.section-feedback-btn').on('click', function() {
        const currentContent = sectionCard.find('.section-text').html();
        showSectionFeedbackModal(section, currentContent, citations);
    });
    
    // Append to chat area
    chatArea.append(sectionCard);
    chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
}

function editSection(sectionCard, section, content, citations) {
    const sectionTextDiv = sectionCard.find('.section-text, .ia-section-text');
    const currentHtml = sectionTextDiv.html();
    
    // Create editable textarea
    const textarea = $('<textarea class="ia-section-edit-textarea"></textarea>')
        .css({
            'width': '100%',
            'min-height': '200px',
            'padding': '12px',
            'border': '2px solid #3b82f6',
            'border-radius': '8px',
            'font-size': '0.95rem',
            'font-family': 'inherit',
            'resize': 'vertical',
            'white-space': 'pre-wrap'
        })
        .val($('<div>').html(currentHtml).text()); // Convert HTML to text
    
    // Replace text with textarea
    sectionTextDiv.replaceWith(textarea);
    
    // Add save/cancel buttons using new CSS classes
    const editActions = $('<div class="ia-section-edit-actions"></div>');
    const saveBtn = $('<button class="ia-section-save-btn">Save</button>');
    const cancelBtn = $('<button class="ia-section-cancel-btn">Cancel</button>');
    
    editActions.append(saveBtn).append(cancelBtn);
    sectionCard.find('.section-actions, .ia-section-actions').before(editActions);
    
    // Hide original action buttons
    sectionCard.find('.section-actions, .ia-section-actions').hide();
    
    // Save handler
    saveBtn.on('click', function() {
        const newContent = textarea.val().trim();
        if (newContent) {
            // Replace textarea with updated content
            const newTextDiv = $('<div class="ia-section-text section-text"></div>')
                .html(formatMessage(newContent));
            textarea.replaceWith(newTextDiv);
            editActions.remove();
            sectionCard.find('.section-actions, .ia-section-actions').show();
        }
    });
    
    // Cancel handler
    cancelBtn.on('click', function() {
        const originalTextDiv = $('<div class="ia-section-text section-text"></div>')
            .html(currentHtml);
        textarea.replaceWith(originalTextDiv);
        editActions.remove();
        sectionCard.find('.section-actions, .ia-section-actions').show();
    });
}

function handleSectionApproval(section, content, citations) {
    const sectionNames = {
        'background': 'Background Information',
        'procedure': 'Procedure',
        'research_design': 'Research Design'
    };
    const sectionName = sectionNames[section] || section;
    
    // Clean content (remove template citations)
    let cleanContent = content;
    if (typeof cleanContent === 'string') {
        cleanContent = cleanContent.replace(/\[ID: N\/A \| AUTHOR_REF: N\/A \| YEAR: N\/A \| Citations: N\/A\]/g, '');
        cleanContent = cleanContent.replace(/\[ID: .*? \| AUTHOR_REF: N\/A \| YEAR: N\/A \| Citations: .*?\]/g, '');
        cleanContent = cleanContent.replace(/\[ID \| AUTHOR_REF \| YEAR \| Citations: CITES\]/g, '');
        cleanContent = cleanContent.replace(/\[ID \| AUTHOR_REF \| YEAR \| Citations: CITES\]\./g, '');
    }
    
    // Update the section in the sidebar using displayExpandedSection for proper formatting
    // This will format the content and display it in the IA section
    displayExpandedSection(section, cleanContent, citations || []);
    
    // Ensure section is visible
    $(`#${section}-section`).show();
    
    // Hide IA placeholder since we now have content
    $('#ia-placeholder').hide();
    
    // Switch to IA section tab to show the approved content
    switchTab('ia-section');
    
    // Show success message with consistent styling
    const chatArea = $("#chat-box");
    const successMsg = $('<div></div>')
        .attr('data-sender', 'system')
        .css({
            'padding': '10px 15px',
            'background': '#f0fdf4',
            'border-left': '3px solid #22c55e',
            'border-radius': '6px',
            'margin': '10px 0',
            'color': '#166534',
            'font-size': '13px'
        })
        .html(`${sectionName} approved and saved.`)
        .hide();
    chatArea.append(successMsg);
    successMsg.slideDown();
    chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
    
    // Update backend state
    $.ajax({
        url: `/api/approve_section/${section}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ 
            content: content,
            citations: citations || []
        }),
        success: function(data) {
            console.log(`Section ${section} approved in backend:`, data);
        },
        error: function(xhr) {
            console.error(`Error approving section ${section}:`, xhr);
        }
    });
}

function handleSectionDecline(section) {
    const sectionNames = {
        'background': 'Background Information',
        'procedure': 'Procedure',
        'research_design': 'Research Design'
    };
    const sectionName = sectionNames[section] || section;
    
    const chatArea = $("#chat-box");
    const declineMsg = $('<div></div>')
        .attr('data-sender', 'system')
        .css({
            'padding': '10px 15px',
            'background': '#fef2f2',
            'border-left': '3px solid #ef4444',
            'border-radius': '6px',
            'margin': '10px 0',
            'color': '#991b1b',
            'font-size': '0.9rem'
        })
        .html(`${sectionName} declined.`)
        .hide();
    chatArea.append(declineMsg);
    declineMsg.slideDown();
    chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
}

function showSectionFeedbackModal(section, content, citations) {
    const sectionNames = {
        'background': 'Background Information',
        'procedure': 'Procedure',
        'research_design': 'Research Design'
    };
    const sectionName = sectionNames[section] || section;
    
    // Consistent modal styling
    const modal = $(`
        <div class="section-feedback-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 24px; border-radius: 8px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                <h2 style="margin-top: 0; margin-bottom: 20px; color: #334155; font-size: 1.1rem; font-weight: 600;">Provide Feedback for ${sectionName}</h2>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #475569; font-size: 0.9rem;">Your Feedback:</label>
                    <textarea id="section-feedback-text" rows="6" style="width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.95rem; font-family: inherit; resize: vertical;" placeholder="Describe what should be changed or improved..."></textarea>
                </div>
                <div class="ia-section-actions" style="justify-content: flex-end;">
                    <button class="ia-section-action-btn secondary section-feedback-cancel">Cancel</button>
                    <button class="ia-section-action-btn primary section-feedback-submit">Submit Feedback</button>
                </div>
            </div>
        </div>
    `);
    
    // Add handlers
    modal.find('.section-feedback-cancel').on('click', function() {
        modal.fadeOut(300, function() { $(this).remove(); });
    });
    
    modal.find('.section-feedback-submit').on('click', function() {
        const feedback = $('#section-feedback-text').val().trim();
        if (feedback) {
            submitSectionFeedback(section, content, feedback, citations);
            modal.fadeOut(300, function() { $(this).remove(); });
        } else {
            alert('Please provide feedback before submitting.');
        }
    });
    
    // Close on overlay click
    modal.on('click', function(e) {
        if ($(e.target).hasClass('section-feedback-modal')) {
            modal.fadeOut(300, function() { $(this).remove(); });
        }
    });
    
    // Add to body
    $('body').append(modal);
    $('#section-feedback-text').focus();
}

function submitSectionFeedback(section, content, feedback, citations) {
    const iaTopic = $('#ia-topic-content').text();
    const rq = $('#rq-content').text();
    
    $.ajax({
        url: `/api/expand/${section}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            ia_topic: iaTopic,
            research_question: rq,
            feedback: feedback,
            previous_content: content
        }),
        success: function(data) {
            // Show new section in chat
            displaySectionInChat(section, data.content, data.citations || []);
            
            const sectionNames = {
                'background': 'Background Information',
                'procedure': 'Procedure',
                'research_design': 'Research Design'
            };
            const sectionName = sectionNames[section] || section;
            
            const chatArea = $("#chat-box");
            const feedbackMsg = $('<div></div>')
                .attr('data-sender', 'system')
                .css({
                    'padding': '10px 15px',
                    'background': '#eff6ff',
                    'border-left': '3px solid #3b82f6',
                    'border-radius': '6px',
                    'margin': '10px 0',
                    'color': '#1e40af',
                    'font-size': '0.9rem'
                })
                .html(`Feedback received. New ${sectionName} generated.`)
                .hide();
            chatArea.append(feedbackMsg);
            feedbackMsg.slideDown();
            chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
        },
        error: function(xhr) {
            console.error(`Error regenerating ${section} with feedback:`, xhr);
            alert(`Error regenerating ${section}. Please try again.`);
        }
    });
}

function displayExpandedSection(section, content, citations) {
    const contentElement = $(`#${section}-content`);
    const citationsElement = $(`#${section}-citations`);
    
    // Check if content already contains hallucinated template citations and remove them
    let cleanContent = content;
    if (typeof cleanContent === 'string') {
        // Remove N/A placeholder citations
        cleanContent = cleanContent.replace(/\[ID: N\/A \| AUTHOR_REF: N\/A \| YEAR: N\/A \| Citations: N\/A\]/g, '');
        cleanContent = cleanContent.replace(/\[ID: .*? \| AUTHOR_REF: N\/A \| YEAR: N\/A \| Citations: .*?\]/g, '');
        // Remove template format citations (when LLM outputs the template literally)
        cleanContent = cleanContent.replace(/\[ID \| AUTHOR_REF \| YEAR \| Citations: CITES\]/g, '');
        cleanContent = cleanContent.replace(/\[ID \| AUTHOR_REF \| YEAR \| Citations: CITES\]\./g, '');
    }
    
    if (contentElement.length) {
        $(`#${section}-section`).show();
        contentElement.html(formatMessage(cleanContent)).show();
    }
    
    // Display citations (skip for research_design as it doesn't need citations)
    if (citationsElement.length && section !== 'research_design') {
        // Filter out N/A or empty citations
        const numbered = section === 'background';
        const rendered = renderCitationList(citations, { numbered });
        if (rendered.count > 0) {
            citationsElement.addClass('section-citations-box').html(`<strong>Sources (${rendered.count}):</strong>` + rendered.html).show();
        } else {
            citationsElement.hide();
        }
    } else if (section === 'research_design') {
        // Always hide citations for research_design
        citationsElement.hide();
    }
}

function toggleSection(section) {
    const content = $(`#${section}-content`);
    const icon = $(`#${section}-section h3 .toggle-icon`);
    if (content.is(':visible')) {
        content.slideUp();
        icon.text('▶');
    } else {
        content.slideDown();
        icon.text('▼');
    }
}

// Event handlers
function retrieveCitations(section) {
    const iaTopic = $('#ia-topic-content').text();
    const rq = $('#rq-content').text();
    
    $.ajax({
        url: '/api/citations/retrieve',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            section: section,
            ia_topic: iaTopic,
            research_question: rq
        }),
        success: function(data) {
            // Append new citations
            // Skip citations for research_design
            if (section !== 'research_design') {
                const existingCitations = $(`#${section}-citations`).data('citations') || [];
                const allCitations = [...existingCitations, ...(data.citations || [])];
                
                const numbered = section === 'background';
                const rendered = renderCitationList(allCitations, { numbered });
                $(`#${section}-citations`).data('citations', rendered.citations);
                
                if (rendered.count > 0) {
                    $(`#${section}-citations`).addClass('section-citations-box').html(`<strong>Sources (${rendered.count}):</strong>` + rendered.html).show();
                } else {
                    $(`#${section}-citations`).hide();
                }
            } else {
                // Always hide citations for research_design
                $(`#${section}-citations`).hide();
            }
        },
        error: function(xhr) {
            console.error(`Error retrieving citations for ${section}:`, xhr);
            alert(`Error retrieving citations for ${section}. Please try again.`);
        }
    });
}

// Edit an approved section in the right panel
function editApprovedSection(section) {
    const contentDiv = $(`#${section}-content`);
    const currentHtml = contentDiv.html();
    const currentText = contentDiv.text();
    
    // Create textarea for editing
    const textarea = $(`<textarea class="ia-section-edit-textarea" style="width: 100%; min-height: 200px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; resize: vertical; box-sizing: border-box;">${currentText}</textarea>`);
    
    // Create action buttons
    const actionsDiv = $(`<div class="ia-section-edit-actions" style="display: flex; gap: 8px; margin-top: 10px;">
        <button class="ia-section-action-btn primary save-section-btn">Save</button>
        <button class="ia-section-action-btn secondary cancel-section-btn">Cancel</button>
    </div>`);
    
    // Replace content with textarea
    contentDiv.html('').append(textarea);
    $(`#${section}-actions`).hide();
    contentDiv.after(actionsDiv);
    
    // Save handler
    actionsDiv.find('.save-section-btn').on('click', function() {
        const newContent = textarea.val();
        contentDiv.html(formatMessage(newContent));
        actionsDiv.remove();
        $(`#${section}-actions`).show();
        
        // Update backend state
        $.ajax({
            url: `/api/update_section/${section}`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ content: newContent })
        });
    });
    
    // Cancel handler
    actionsDiv.find('.cancel-section-btn').on('click', function() {
        contentDiv.html(currentHtml);
        actionsDiv.remove();
        $(`#${section}-actions`).show();
    });
}

// Provide feedback for a section in the right panel
function provideSectionFeedback(section) {
    const sectionNames = {
        'background': 'Background Information',
        'procedure': 'Procedure',
        'research_design': 'Research Design'
    };
    const sectionName = sectionNames[section] || section;
    
    // Remove any existing modal
    $('#section-feedback-modal').remove();
    
    const modal = $(`
        <div id="section-feedback-modal" class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
            <div class="modal-content" style="background: white; padding: 24px; border-radius: 12px; max-width: 500px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
                <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 1.1rem;">Feedback for ${sectionName}</h3>
                <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 15px;">What would you like to improve?</p>
                <textarea id="section-feedback-input" placeholder="e.g., 'Add more detail about safety precautions' or 'Include uncertainty calculations'" 
                    style="width: 100%; height: 100px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; resize: vertical; box-sizing: border-box;"></textarea>
                <div style="display: flex; gap: 10px; margin-top: 15px; justify-content: flex-end;">
                    <button class="ia-section-action-btn secondary" onclick="$('#section-feedback-modal').remove();">Cancel</button>
                    <button class="ia-section-action-btn primary" onclick="submitSectionFeedbackFromPanel('${section}');">Submit Feedback</button>
                </div>
            </div>
        </div>
    `);
    
    $('body').append(modal);
    $('#section-feedback-input').focus();
}

// Submit feedback for a section from the right panel
function submitSectionFeedbackFromPanel(section) {
    const feedback = $('#section-feedback-input').val();
    $('#section-feedback-modal').remove();
    
    if (!feedback.trim()) {
        alert('Please enter feedback.');
        return;
    }
    
    const iaTopic = $('#ia-topic-content').text();
    const rq = $('#rq-content').text();
    const previousContent = $(`#${section}-content`).html();
    
    // Show loading
    $(`#${section}-content`).html('<div class="loading-state"><div class="spinner"></div><span class="loading-text">Regenerating<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span></span></div>');
    
    $.ajax({
        url: `/api/expand/${section}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            ia_topic: iaTopic,
            research_question: rq,
            feedback: feedback,
            previous_content: previousContent
        }),
        success: function(data) {
            if (data.content) {
                $(`#${section}-content`).html(formatMessage(data.content));
                displayExpandedSection(section, data.content, data.citations || []);
            }
        },
        error: function(xhr) {
            console.error(`Error regenerating ${section}:`, xhr);
            $(`#${section}-content`).html(previousContent);
            alert(`Error regenerating ${section}. Please try again.`);
        }
    });
}

function loadChat() {
    $.get('/api/chat', function (data) {
        var chatArea = $("#chat-box");
        chatArea.empty();
        data.forEach(function (message) {
            var messageDiv = $('<div></div>')
                .attr('data-sender', message.role)
                .html(formatMessage(message.content));
            chatArea.append(messageDiv);
        });
        // Smooth scroll to bottom
        chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
    });
}

// Update loadIdea to preserve highlights and handle JSON structure
function loadIdea(isInitialLoad = false) {
    $.get('/api/idea', function (data) {
        if (data.idea) {
            // Store the raw idea
            highlightState.rawIdea = data.idea;
            
            // Store the idea in the global variable
            main_idea = data.idea;
            
            // Parse and format structured JSON if present
            const structuredContent = parseAndFormatStructuredIdea(data.idea);
            
            // If this is an initial load or there are no highlights yet, replace content
            if (isInitialLoad || highlightState.highlights.length === 0) {
                const formattedContent = formatMessage(structuredContent);
                $("#main-idea").html(prependFeedbackToIdea(formattedContent, data.feedback));
                highlightState.lastContent = $("#main-idea").html();
                $("#main-idea").show(); // Show the main idea panel
                
                // Show Generate RQ button when research brief is displayed
                showGenerateRQButton();
            }
            
            // Show review feedback if it exists (without removing highlights)
            if (data.review_feedback) {
                updateReviewFeedback(data.review_feedback);
            }
            
            // Handle score display
            updateReview(data);
        }
    });
}

function showGenerateRQButton() {
    // Show the Generate RQ button if research brief has content (regardless of visibility)
    // This ensures the button shows even when viewing IA section tab
    // Do NOT show bottom-panel or divider here - only show after RQ is generated
    if ($("#main-idea").html().trim().length > 0) {
        $("#generate-rq-container").show();
    } else {
        $("#generate-rq-container").hide();
    }
}

// sendMessage is already defined at the top of the file (line 3) for global accessibility
// Enter key handler is added inside $(document).ready() - see line 59

//The function defined below uses the backend logic where the MCTS algorithm is implemented.
function toggleAutoGenerate() {
    const button = $(".auto-generate");
    
    if (button.hasClass("active")) {
        // Stop auto-generation
        button.removeClass("active");
        
        // Clear timer immediately
        if (window.autoGenerateTimer) {
            clearTimeout(window.autoGenerateTimer);
            window.autoGenerateTimer = null;
        }
        
        // Reset counter
        mctsIterationCount = 0;
        currentMCTSDepth = 0;
        
        // Stop MCTS loading animation if it's still running
        if (window.mctsStartMessage && window.mctsStartMessage.length) {
            const loadingSpan = window.mctsStartMessage.find('.loading-dots');
            if (loadingSpan.length) {
                // Replace loading dots with static text
                const messageText = window.mctsStartMessage.html();
                const staticText = messageText.replace(/<span class="loading-dots">.*?<\/span>/, '');
                window.mctsStartMessage.html(staticText);
            }
            window.mctsStartMessage = null;
        }
        
        // Add system message about stopping
        const chatArea = $("#chat-box");
        const stopMessage = $('<div></div>')
            .attr('data-sender', 'system')
            .html(`<span style="display: flex; align-items: center; gap: 6px;"><img src="/static/icons/stop.svg" width="14" height="14" alt="stop" style="opacity: 0.6;"> MCTS exploration stopped.</span>`)
            .hide();
        chatArea.append(stopMessage);
        stopMessage.slideDown();
        chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');

        // Get final best result
        $.ajax({
            url: '/api/get_best_child',
            type: 'POST',
            success: function(data) {
                if (data.idea) {
                    const structuredIdea = parseAndFormatStructuredIdea ? 
                        parseAndFormatStructuredIdea(data.idea) : data.idea;
                    const formattedContent = formatMessage ? formatMessage(structuredIdea) : structuredIdea;
                    $("#main-idea").html(prependFeedbackToIdea(formattedContent, data.feedback));
                    $("#main-idea").show();
                    showGenerateRQButton();
                    
                    if (typeof window !== 'undefined') {
                        window.main_idea = data.idea;
                    }
                    
                    // Update score display if available
                    if (data.average_score !== undefined && typeof updateScoreDisplay === 'function') {
                        updateScoreDisplay(data.average_score);
                    }
                    
                    // Reload tree to show selected node
                    if (typeof loadTree === 'function') {
                        loadTree();
                    }
                }
                
                const finalMessage = $('<div></div>')
                    .attr('data-sender', 'system')
                    .html(`<span style="display: flex; align-items: center; gap: 6px;"><img src="/static/icons/trophy.svg" width="14" height="14" alt="trophy" style="opacity: 0.6;"> Best idea selected from exploration (Score: ${data.average_score ? data.average_score.toFixed(1) : '?'}/10).</span>`)
                    .hide();
                chatArea.append(finalMessage);
                finalMessage.slideDown();
                chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
            },
            error: function(xhr, status, error) {
                console.error('Error getting best child:', error);
                const errorMsg = $('<div></div>')
                    .attr('data-sender', 'system')
                    .html(`<span style="display: flex; align-items: center; gap: 6px; color: #dc2626;"><img src="/static/icons/cross.svg" width="14" height="14" alt="error" style="opacity: 0.6;"> Error retrieving best result: ${xhr.responseJSON?.error || error}</span>`)
                    .hide();
                chatArea.append(errorMsg);
                errorMsg.slideDown();
            }
        });
        
        return; // Exit early
    } else {
        // Check if we have an idea to work with
        const mainIdea = $("#main-idea").text().trim();
        if (!mainIdea || mainIdea.length === 0) {
            alert("Please enter a research idea first before starting automated exploration.");
            return;
        }
        
        // Reset counters and start auto-generation
        mctsIterationCount = 0;
        currentMCTSDepth = 0;
        button.addClass("active");
        
        // Add system message about starting
        const chatArea = $("#chat-box");
        const startMessage = $('<div></div>')
            .attr('data-sender', 'system')
            .attr('data-mcts-loading', 'true')
            .html(`<span style="display: flex; align-items: center; gap: 6px;"><img src="/static/icons/robot.svg" width="14" height="14" alt="robot" style="opacity: 0.6;"> ${createLoadingText(`Starting MCTS exploration (${MCTS_CONFIG.maxIterations} iterations)...`)}</span>`)
            .hide();
        chatArea.append(startMessage);
        startMessage.slideDown();
        chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
        
        // Store reference to stop loading animation later
        window.mctsStartMessage = startMessage;
        
        // Helper functions
        function getCurrentDepth() {
            return currentMCTSDepth;
        }
        
        function updateMCTSDepth(newDepth) {
            currentMCTSDepth = newDepth;
        }
        
        // FIXED: Main exploration function
        function performMCTSStep() {
            // Check stop conditions FIRST
            const maxIterationsReached = mctsIterationCount >= MCTS_CONFIG.maxIterations;
            const maxDepthReached = currentMCTSDepth >= MCTS_CONFIG.maxDepth;
            const buttonInactive = !button.hasClass("active");
            
            if (buttonInactive || maxIterationsReached || maxDepthReached) {
                // STOP: Clean up and show final results
                
                // Stop MCTS loading animation if it's still running
                if (window.mctsStartMessage && window.mctsStartMessage.length) {
                    const loadingSpan = window.mctsStartMessage.find('.loading-dots');
                    if (loadingSpan.length) {
                        // Replace loading dots with static text
                        const messageText = window.mctsStartMessage.html();
                        const staticText = messageText.replace(/<span class="loading-dots">.*?<\/span>/, '');
                        window.mctsStartMessage.html(staticText);
                    }
                    window.mctsStartMessage = null;
                }
                
                // Clear timer
                if (window.autoGenerateTimer) {
                    clearTimeout(window.autoGenerateTimer);
                    window.autoGenerateTimer = null;
                }
                
                // Remove active class
                button.removeClass("active");
                
                // Show completion message
                const chatArea = $("#chat-box");
                let reason = "manually stopped";
                if (maxIterationsReached) reason = `completed after ${mctsIterationCount} iterations`;
                if (maxDepthReached) reason = `reached maximum depth ${currentMCTSDepth}`;
                
                const completionMessage = $('<div></div>')
                    .attr('data-sender', 'system')
                    .html(`<span style="display: flex; align-items: center; gap: 6px;"><img src="/static/icons/tick.svg" width="14" height="14" alt="success" style="opacity: 0.6;"> MCTS exploration ${reason}.</span>`)
                    .hide();
                chatArea.append(completionMessage);
                completionMessage.slideDown();
                chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
                
                // Save counter value before resetting (for use in success callback)
                const savedIterationCount = mctsIterationCount;
                
                // Get final best result
                $.ajax({
                    url: '/api/get_best_child',
                    type: 'POST',
                    success: function(data) {
                        if (data.idea) {
                            const structuredIdea = parseAndFormatStructuredIdea ? 
                                parseAndFormatStructuredIdea(data.idea) : data.idea;
                            const formattedContent = formatMessage ? formatMessage(structuredIdea) : structuredIdea;
                            $("#main-idea").html(prependFeedbackToIdea(formattedContent, data.feedback));
                            $("#main-idea").show();
                            showGenerateRQButton();
                            
                            if (typeof window !== 'undefined') {
                                window.main_idea = data.idea;
                            }
                            
                            // Update score display if available
                            if (data.average_score !== undefined && typeof updateScoreDisplay === 'function') {
                                updateScoreDisplay(data.average_score);
                            }
                            
                            // Reload tree to show selected node
                            if (typeof loadTree === 'function') {
                                loadTree();
                            }
                        }
                        
                        const finalMessage = $('<div></div>')
                            .attr('data-sender', 'system')
                            .html(`<span style="display: flex; align-items: center; gap: 6px;"><img src="/static/icons/trophy.svg" width="14" height="14" alt="trophy" style="opacity: 0.6;"> Best idea selected from ${savedIterationCount} iterations (Score: ${data.average_score ? data.average_score.toFixed(1) : '?'}/10).</span>`)
                            .hide();
                        chatArea.append(finalMessage);
                        finalMessage.slideDown();
                        chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
                        
                        // Reset counters after message is displayed
                        mctsIterationCount = 0;
                        currentMCTSDepth = 0;
                    },
                    error: function(xhr, status, error) {
                        console.error('Error getting best child:', error);
                        // Reset counters even on error
                        mctsIterationCount = 0;
                        currentMCTSDepth = 0;
                    }
                });
                return; // ✅ FIXED: Exit without recursive call
            }
            
            // CONTINUE: Perform next MCTS step
            mctsIterationCount++;
            
            console.log(`Starting MCTS iteration ${mctsIterationCount}/${MCTS_CONFIG.maxIterations}`);
            
            // Call the backend with the generate action and use_mcts flag
            $.ajax({
                url: '/api/step',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ 
                    action: 'generate', 
                    use_mcts: true,
                    num_iterations: 1,
                    iteration: mctsIterationCount,
                    max_iterations: MCTS_CONFIG.maxIterations
                }),
                success: function(data) {
                    console.log(`MCTS step ${mctsIterationCount}/${MCTS_CONFIG.maxIterations} completed:`, data);
                    
                    // Update depth from backend response
                    if (data.depth !== undefined) {
                        updateMCTSDepth(data.depth);
                    }
                    
                    // Update Research Brief panel
                    if (data.idea) {
                        let structuredIdea = parseAndFormatStructuredIdea ? 
                            parseAndFormatStructuredIdea(data.idea) : data.idea;
                        
                        // Ensure structuredIdea is a string (handle arrays)
                        if (Array.isArray(structuredIdea)) {
                            structuredIdea = structuredIdea.length > 0 ? String(structuredIdea[0]) : '';
                        } else if (structuredIdea !== null && structuredIdea !== undefined) {
                            structuredIdea = String(structuredIdea);
                        } else {
                            structuredIdea = '';
                        }
                        
                        const formattedContent = formatMessage ? formatMessage(structuredIdea) : structuredIdea;
                        $("#main-idea").html(prependFeedbackToIdea(formattedContent, data.feedback));
                        
                        // Update global variable
                        if (typeof window !== 'undefined') {
                            window.main_idea = data.idea;
                        }
                        
                        // Make sure Research Brief is visible
                        $("#main-idea").show();
                        showGenerateRQButton();
                    }
                    
                    // Update score display
                    if (data.average_score !== undefined && typeof updateScoreDisplay === 'function') {
                        updateScoreDisplay(data.average_score);
                    }
                    
                    // Add progress message
                    const chatArea = $("#chat-box");
                    const progressMsg = $('<div></div>')
                        .attr('data-sender', 'system')
                        .html(`<span style="display: flex; align-items: center; gap: 6px;"><img src="/static/icons/refresh.svg" width="14" height="14" alt="refresh" style="opacity: 0.6;"> MCTS Iteration ${mctsIterationCount}/${MCTS_CONFIG.maxIterations} (Depth: ${currentMCTSDepth}/${MCTS_CONFIG.maxDepth}) - Score: ${(data.average_score || 0).toFixed(1)}/10</span>`)
                        .hide();
                    chatArea.append(progressMsg);
                    progressMsg.slideDown();
                    chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
                    
                    // Update tree visualization if available
                    if (typeof loadTree === 'function') {
                        loadTree();
                    }
                    
                    // ✅ FIXED: Schedule next step ONLY if we should continue
                    if (button.hasClass("active") && 
                        mctsIterationCount < MCTS_CONFIG.maxIterations && 
                        currentMCTSDepth < MCTS_CONFIG.maxDepth) {
                        
                        window.autoGenerateTimer = setTimeout(performMCTSStep, MCTS_CONFIG.explorationDelay);
                    } else {
                        // MCTS exploration completed - stop loading animation
                        if (window.mctsStartMessage && window.mctsStartMessage.length) {
                            const loadingSpan = window.mctsStartMessage.find('.loading-dots');
                            if (loadingSpan.length) {
                                // Replace loading dots with static text
                                const messageText = window.mctsStartMessage.html();
                                const staticText = messageText.replace(/<span class="loading-dots">.*?<\/span>/, '');
                                window.mctsStartMessage.html(staticText);
                            }
                            window.mctsStartMessage = null;
                        }
                        
                        // Trigger stop logic by calling performMCTSStep again
                        // This time it will hit the stop condition at the top
                        setTimeout(performMCTSStep, 100); // Small delay to ensure UI updates
                    }
                },
                error: function(xhr, status, error) {
                    console.error('MCTS step error:', error);
                    
                    const chatArea = $("#chat-box");
                    const errorMsg = $('<div></div>')
                        .attr('data-sender', 'system')
                        .html(`<span style="display: flex; align-items: center; gap: 6px; color: #dc2626;"><img src="/static/icons/cross.svg" width="14" height="14" alt="error" style="opacity: 0.6;"> Error in MCTS exploration: ${xhr.responseJSON?.error || error}</span>`)
                        .hide();
                    chatArea.append(errorMsg);
                    errorMsg.slideDown();
                    chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
                    
                    // Stop auto-generation on error
                    button.removeClass("active");
                    mctsIterationCount = 0;
                    currentMCTSDepth = 0;
                    if (window.autoGenerateTimer) {
                        clearTimeout(window.autoGenerateTimer);
                        window.autoGenerateTimer = null;
                    }
                }
            });
        }
        
        // Start the first MCTS step
        performMCTSStep();
    }
}

function stepAction(action) {
    // Get chat area for message display
    const chatArea = $("#chat-box");

    // Handle active state for buttons
    if (action === 'generate') {
        toggleAutoGenerate();
    } else if (action === 'judge') {
        // Add system message to indicate review generation is starting
        var loadingDiv = $('<div></div>')
            .attr('data-sender', 'system')
            .html(createLoadingText('Generating review...'))
            .hide();
        chatArea.append(loadingDiv);
        loadingDiv.slideDown();
        chatArea.scrollTop(chatArea[0].scrollHeight);

        const judgeButton = $(".top-bar button:nth-child(4)"); // Judge button
        judgeButton.toggleClass("active"); // Toggle active class

        // If the Judge button is active, remove active class from other buttons
        if (judgeButton.hasClass("active")) {
            $(".top-bar button").not(judgeButton).removeClass("active");
        }
    } else {
        // Remove active class from Auto and Judge buttons
        $(".auto-generate").removeClass("active"); // Auto button
        $(".top-bar button:nth-child(4)").removeClass("active"); // Judge button

        // Highlight Previous or Next button temporarily
        const buttonToHighlight = action === 'prev' ? $(".top-bar button:nth-child(2)") : $(".top-bar button:nth-child(3)");
        buttonToHighlight.addClass("active");

        // Remove highlight after a short delay
        setTimeout(function () {
            buttonToHighlight.removeClass("active");
        }, 500); // Adjust the duration as needed
    }

    $.ajax({
        url: '/api/step',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ action: action }),
        success: function (data) {
            // Update the main idea if provided
            if (data.idea) {
                // Parse and format any JSON structure in the idea
                const structuredIdea = parseAndFormatStructuredIdea(data.idea);
                const formattedContent = formatMessage(structuredIdea);
                $("#main-idea").html(prependFeedbackToIdea(formattedContent, data.feedback));
            }

            // Update review scores if available
            updateReview(data);
            
            // Update chat messages if provided
            if (data.messages) {
                // Filter out "Navigated to node" messages
                const filteredMessages = data.messages.filter(msg => 
                    !msg.content || (!msg.content.includes('Navigated to node') && !msg.content.includes('navigated to node'))
                );
                if (filteredMessages.length > 0) {
                    updateChat(filteredMessages);
                }
            }

            if (data.average_score !== undefined) {
                updateScoreDisplay(data.average_score);
            } else if (data.idea) {
                // If idea changed but score not in response, reload to get updated score
                loadIdea(false);
            }
        },
        error: function (xhr, status, error) {
            var errorDiv = $('<div></div>')
                .attr('data-sender', 'system')
                .text('Error: ' + (xhr.responseJSON?.error || error))
                .hide();
            chatArea.append(errorDiv);
            errorDiv.slideDown();
            chatArea.scrollTop(chatArea[0].scrollHeight);
        }
    });
}

function toggleTree() {
    treeMode = !treeMode;
    $("#chat-box").toggle(!treeMode);
    $("#tree-area").toggle(treeMode);
    // Fix: Target the tree button specifically (5th button) instead of using last()
    $(".top-bar button:nth-child(5)").toggleClass("active");
    if (treeMode) {
        loadTree();
    }
}

function loadTree() {
    // Show loading indicator
    $("#tree-area").html(`<div class='loading' style="display: flex; align-items: center; gap: 6px;"><span style="display: inline-flex; align-items: center;"><img src="/static/icons/search.svg" width="14" height="14" alt="search" style="opacity: 0.6;"></span> Looking for ideas...</div>`);
    
    // Fetch actual tree data from server
    $.ajax({
        url: "/api/tree",
        type: "GET",
        success: function(data) {
            if (data.state && data.state.current_idea) {
                // We have at least a root node
                treeData = transformTreeData(data);
                createTree(treeData);
            } else {
                // Show cute message when no ideas yet
                $("#tree-area").html(`
                    <div class='empty-tree-message'>
                        <div class='empty-tree-content'>
                            <div class='empty-tree-icon'>🌱</div>
                            <div class='empty-tree-text'>
                                Plant your first idea in the chat!
                                <br/>
                                <span class='empty-tree-subtext'>Watch it grow into a tree of ideas</span>
                            </div>
                        </div>
                    </div>
                `);
            }
        },
        error: function(error) {
            $("#tree-area").html("<div class='empty-tree-message'>Oops! My branches got tangled 🌿<br/>Let's try again!</div>");
            console.error("Error loading tree:", error);
        }
    });
}

// Transform API tree data into D3-friendly format
function transformTreeData(apiData) {
    function processNode(node) {
        // Check if this is a research goal node (special handling)
        const isResearchGoal = node.action === "research_goal" || 
                              (node.state && node.state.isResearchGoal === true);
        
        return {
            name: isResearchGoal ? "research_goal" : node.action,
            id: node.id,
            nodeData: {
                idea: node.state?.current_idea || node.idea,
                reward: node.reward || node.state?.reward,
                depth: node.depth || node.state?.depth,
                hasReviews: node.state?.hasReviews || false,
                hasRetrieval: node.state?.hasRetrieval || false,
                hasFeedback: node.state?.hasFeedback || false,
                isCurrentNode: node.isCurrentNode || false,
                reviews: node.reviews,
                isResearchGoal: isResearchGoal
            },
            children: node.children ? node.children.map(processNode) : []
        };
    }
    
    return processNode(apiData);
}

function createTree(data) {
    // Clear previous tree
    d3.select("#tree-area").html("");
    const margin = { top: 60, right: 40, bottom: 60, left: 40 };
    const width = document.getElementById('tree-area').offsetWidth - margin.left - margin.right;
    const height = document.getElementById('tree-area').offsetHeight - margin.top - margin.bottom;
    const svg = d3.select("#tree-area")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    const tree = d3.tree()
        .size([width, height * 0.8]);
    const root = d3.hierarchy(data);
    tree(root);
    const rootX = root.x;
    root.descendants().forEach(d => {
        d.x = d.x - rootX + width / 2;
    });
    // Add links with curved paths
    svg.selectAll(".link")
        .data(root.links())
        .join("path")
        .attr("class", "link")
        .attr("d", d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y));
    // Add nodes group
    const nodes = svg.selectAll(".node")
        .data(root.descendants())
        .join("g")
        .attr("class", d => `node ${d.data.nodeData.isCurrentNode ? "current" : ""} ${d.data.nodeData.isResearchGoal ? "research-goal" : ""}`)
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .on("click", function(event, d) {
            selectNode(d);
        });
    // Add node circles with colors based on action type
    nodes.append("circle")
        .attr("r", d => d.data.nodeData.isResearchGoal ? 12 : 8)  // Larger circle for research goal
        .attr("fill", d => {
            // Special color for research goal node
            if (d.data.nodeData.isResearchGoal) return "#3b82f6";  // Blue for research goal
            
            // Color nodes based on action type
            if (d.data.name === "root") return "#ffffff";
            if (d.data.name === "generate") return "#4ade80"; // green
            if (d.data.name === "reflect_and_reframe") return "#a78bfa"; // purple
            if (d.data.name === "review_and_refine") return "#fb923c"; // orange
            if (d.data.name === "retrieve_and_refine") return "#fbbf24"; // yellow
            if (d.data.name === "first_idea") return "#4ade80"; // green for first idea
            return "#3b82f6"; // default blue
        })
        .attr("stroke", d => d.data.nodeData.isResearchGoal ? "#2563eb" : "#3b82f6")
        .attr("stroke-width", d => d.data.nodeData.isResearchGoal ? 3 : 2.5);

    // Add indicators for nodes with reviews, retrieval or feedback
    const indicatorRadius = 3;
    const indicators = nodes.filter(d => 
        !d.data.nodeData.isResearchGoal && (
          d.data.nodeData.hasReviews || 
          d.data.nodeData.hasRetrieval || 
          d.data.nodeData.hasFeedback
        )
    );
    
    // Add indicators in a row under the node
    indicators.each(function(d) {
        const g = d3.select(this);
        let xOffset = -8;
        
        if (d.data.nodeData.hasReviews) {
            g.append("circle")
                .attr("cx", xOffset += 8)
                .attr("cy", 15)
                .attr("r", indicatorRadius)
                .attr("fill", "#fb923c")
                .attr("stroke", "#ffffff")
                .attr("stroke-width", 1);
        }
        
        if (d.data.nodeData.hasRetrieval) {
            g.append("circle")
                .attr("cx", xOffset += 8)
                .attr("cy", 15)
                .attr("r", indicatorRadius)
                .attr("fill", "#fbbf24")
                .attr("stroke", "#ffffff")
                .attr("stroke-width", 1);
        }
        
        if (d.data.nodeData.hasFeedback) {
            g.append("circle")
                .attr("cx", xOffset += 8)
                .attr("cy", 15)
                .attr("r", indicatorRadius)
                .attr("fill", "#a78bfa")
                .attr("stroke", "#ffffff")
                .attr("stroke-width", 1);
        }
    });
    // Add text labels showing action type
    nodes.append("text")
        .attr("dy", "25")
        .attr("y", 5) 
        .attr("text-anchor", "middle")
        .text(d => {
            const action = d.data.name;
            
            // Special label for research goal
            if (d.data.nodeData.isResearchGoal || action === "research_goal") {
                return "Research Goal";
            }
            
            // Shorten action names for display
            if (action === "root") return "Root";
            if (action === "generate") return "Gen";
            if (action === "first_idea") return "First Idea";
            if (action === "reflect_and_reframe") return "Reflect";
            if (action === "review_and_refine") return "Review";
            if (action === "retrieve_and_refine") return "Retrieve";
            if (action === "refresh_idea") return "Refresh";
            return action;
        })
        .each(function(d) {
            // Add background rectangle for text
            const bbox = this.getBBox();
            const padding = 2;
            
            d3.select(this.parentNode)
                .insert("rect", "text")
                .attr("x", bbox.x - padding)
                .attr("y", bbox.y - padding)
                .attr("width", bbox.width + (padding * 2))
                .attr("height", bbox.height + (padding * 2))
                .attr("fill", "#ffffff")
                .attr("fill-opacity", 0.9)
                .attr("rx", 4);
        });
    
    // Add highlight for current node
    nodes.filter(d => d.data.nodeData.isCurrentNode)
        .append("circle")
        .attr("r", 12)
        .attr("fill", "none")
        .attr("stroke", "#2563eb")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "3,3")
        .attr("class", "current-indicator");
        
    // Add CSS for research goal node
    const style = document.createElement('style');
    if (!document.getElementById('research-goal-style')) {
        style.id = 'research-goal-style';
        style.textContent = `
            .node.research-goal text {
                font-weight: bold;
                font-size: 1.1em;
            }
        `;
        document.head.appendChild(style);
    }
}

function selectNode(d) {
    // Node data is in d.data.nodeData from D3 hierarchy
    const nodeData = d.data;
    const nodeId = nodeData.id;
    
    // Send request to backend to select this node
    $.ajax({
        url: "/api/node",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ node_id: nodeId }),
        success: function(response) {
            // Update UI to reflect selected node
            // Parse and format any JSON structure in the idea
            if (response.idea) {
                let structuredIdea = response.idea;
                
                // If it's already an object, convert to JSON string first
                if (typeof structuredIdea === 'object' && structuredIdea !== null && !Array.isArray(structuredIdea)) {
                    structuredIdea = JSON.stringify(structuredIdea);
                }
                
                // Now parse and format
                structuredIdea = parseAndFormatStructuredIdea(structuredIdea);
                
                // Ensure it's a string
                if (Array.isArray(structuredIdea)) {
                    structuredIdea = structuredIdea.length > 0 ? String(structuredIdea[0]) : '';
                } else if (structuredIdea !== null && structuredIdea !== undefined) {
                    structuredIdea = String(structuredIdea);
                } else {
                    structuredIdea = '';
                }
                
                // Check which tab is currently active BEFORE updating UI
                const wasInIASection = $('#tab-ia-section').hasClass('active');
                
                const formattedContent = marked.parse(structuredIdea);
                $("#main-idea").html(prependFeedbackToIdea(formattedContent, response.feedback));
                
                // Only show main-idea and switch tabs if we're NOT in IA section
                // If we're in IA section, just update the content but don't change visibility
                if (!wasInIASection) {
                    $("#main-idea").show();
                    switchTab('research-brief');
                    $('#rq-display').hide();
                }
                // If we were in IA section, don't show main-idea, don't switch tabs, don't hide anything
                // Just update the content silently - IA section remains unchanged
                
                showGenerateRQButton();
            } else {
                // No idea in response - check tab state
                const wasInIASection = $('#tab-ia-section').hasClass('active');
                if (!wasInIASection) {
                    switchTab('research-brief');
                    $('#rq-display').hide();
                }
            }
            
            // Update score display if score is available
            if (response.average_score !== undefined && typeof updateScoreDisplay === 'function') {
                updateScoreDisplay(response.average_score);
            }
            
            // Reload tree to update visualization
            loadTree();
            
            // Add history entry
            const action = nodeData.name || "Unknown";
            $("#history-log").append(
                `<div class="history-item">Selected ${action} node (ID: ${nodeId})</div>`
            );
            
            // Scroll history to bottom
            const historyLog = document.getElementById("history-log");
            if (historyLog) {
                historyLog.scrollTop = historyLog.scrollHeight;
            }
        },
        error: function(error) {
            console.error("Error selecting node:", error);
            alert("Error selecting node: " + (error.responseJSON?.error || "Unknown error"));
        }
    });
}

// Add refresh button handler for refreshing ideas with proper feedback
$(".refresh-button").click(function() {
    refreshResearchIdea();
});

// Create a dedicated function for refreshing research ideas
function refreshResearchIdea() {
    // Add feedback message to chat area first
    const chatArea = $("#chat-box");
    const loadingMessage = $('<div></div>')
        .attr('data-sender', 'system')
        .text('Refreshing your research idea...')
        .hide();
    
    chatArea.append(loadingMessage);
    loadingMessage.slideDown();
    chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
    
    // Ensure we have the current idea text
    if (!main_idea) {
        main_idea = $("#main-idea").text();
    }
    
    console.log("Refreshing idea, current idea length:", main_idea.length);
    
    // Create dedicated API call for refresh
    $.ajax({
        url: "/api/refresh_idea",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ idea: main_idea }),
        success: function(response) {
            console.log("Refresh success, response received");
            console.log("Response idea length:", response.idea ? response.idea.length : 0);
            console.log("Response idea preview:", response.idea ? response.idea.substring(0, 100) + "..." : "No idea in response");
            
            // Remove loading message
            loadingMessage.remove();
            
            // Add success message
            const successMessage = $('<div></div>')
                .attr('data-sender', 'system')
                .text('Successfully refreshed your research idea!')
                .hide();
            chatArea.append(successMessage);
            successMessage.slideDown();
            
            // Update research brief with new idea - this is the critical part
            if (response.idea) {
                // Force update the main_idea variable
                main_idea = response.idea;
                
                // Force direct update to the research brief panel without parsing
                // Ensure response.idea is a string before parsing
                let ideaContent = response.idea;
                if (Array.isArray(ideaContent)) {
                    ideaContent = ideaContent.length > 0 ? String(ideaContent[0]) : '';
                } else if (ideaContent !== null && ideaContent !== undefined) {
                    ideaContent = String(ideaContent);
                } else {
                    ideaContent = '';
                }
                const formattedContent = marked.parse(ideaContent);
                $("#main-idea").html(prependFeedbackToIdea(formattedContent, response.feedback));
                $("#main-idea").show();
                showGenerateRQButton();
                
                console.log("Research brief updated with new content:", $("#main-idea").html().substring(0, 100) + "...");
                
                // Don't add the refreshed idea to the chat window
                // Only keep system messages in chat
            }
            
            // Update chat messages if any (only system messages)
            if (response.messages) {
                // Filter to only get system messages and not the full idea
                // Also filter out "Navigated to node" messages
                const systemMessages = response.messages.filter(msg => {
                    // Skip "Navigated to node" messages
                    if (msg.content && (msg.content.includes('Navigated to node') || msg.content.includes('navigated to node'))) {
                        return false;
                    }
                    return msg.role === 'system' || 
                        (msg.role === 'assistant' && msg.content.length < 500);
                });
                
                if (systemMessages.length > 0) {
                    updateChat(systemMessages);
                }
            }
            
            // Reload tree visualization
            if (typeof loadTree === 'function') {
                loadTree();
            }
            
            // Scroll chat to bottom
            chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
            
            // Update review scores if available
            if (response.review_scores && response.average_score) {
                updateScoreDisplay(response.review_scores, response.average_score);
            } else {
                // If scores not in response, reload idea to get updated scores
                loadIdea(false);
            }
        },
        error: function(error) {
            console.error("Error refreshing idea:", error);
            
            // Remove loading message
            loadingMessage.remove();
            
            // Show error message
            const errorMessage = $('<div></div>')
                .attr('data-sender', 'system')
                .text('Error refreshing idea: ' + (error.responseJSON?.error || "An error occurred"))
                .hide();
            chatArea.append(errorMessage);
            errorMessage.slideDown();
            chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
        }
    });
}

// Add window resize handler
$(window).resize(function () {
    if (treeMode && treeData) {
        createTree(treeData);
    }
});

// Add this function to handle the edit button click - in-place editing
$("#edit-button").click(function () {
    const proposalBox = $("#proposal-box");
    const proposalContent = $("#proposal-content");
    const editButton = $(this);
    
    // Check if already in edit mode
    if (proposalBox.hasClass('editing')) {
        return;
    }
    
    // Get current content
    const currentText = proposalContent.text();
    
    // Add editing class
    proposalBox.addClass('editing');
    
    // Hide edit button and proposal content
    editButton.hide();
    proposalContent.hide();
    
    // Create in-place edit elements
    const editContainer = $(`
        <div class="proposal-edit-container">
            <div class="proposal-edit-header">
                <span class="proposal-edit-title">Edit Research Proposal</span>
                <button class="proposal-edit-close" type="button">&times;</button>
            </div>
            <textarea class="proposal-edit-textarea">${currentText}</textarea>
            <div class="proposal-edit-actions">
                <button class="proposal-edit-cancel" type="button">Cancel</button>
                <button class="proposal-edit-save" type="button">Save</button>
            </div>
        </div>
    `);
    
    // Insert edit container
    proposalBox.append(editContainer);
    
    // Focus on textarea
    const textarea = editContainer.find('.proposal-edit-textarea');
    textarea.focus();
    const textLength = textarea.val().length;
    textarea[0].setSelectionRange(textLength, textLength);
    
    // Close/Cancel handler
    function closeEditMode() {
        editContainer.remove();
        proposalBox.removeClass('editing');
        proposalContent.show();
        editButton.show();
    }
    
    editContainer.find('.proposal-edit-close, .proposal-edit-cancel').click(closeEditMode);
    
    // Save handler
    editContainer.find('.proposal-edit-save').click(function() {
        const newContent = textarea.val().trim();
        if (newContent !== "") {
            proposalContent.text(newContent);
        }
        closeEditMode();
    });
    
    // Close on escape key
    $(document).on('keydown.proposalEdit', function(e) {
        if (e.key === 'Escape') {
            closeEditMode();
            $(document).off('keydown.proposalEdit');
        }
    });
});

// Update handleReviewAction function
// function handleReviewAction(action) {
//     if (!$("#review-feedback").is(":visible")) {
//         $("#review-feedback").show();
//     }
//     if (action === 'fix') {
//         // In the future this will trigger the fix workflow
//         console.log('Fixing review issue');
//         stepAction('generate');  // For now just trigger generate
//     } else {
//         // Maybe store that this issue was ignored
//         console.log('Ignoring review issue');
//     }
// }

// Add new function for the Generate Review button
$(".generate-review").click(function () {
    // Reset review state
    currentReviewAspectIndex = 0;
    acceptedReviews = [];
    reviewInProgress = true;

    // Clear any existing highlights
    cleanupPreviousHighlights();

    // Add a loading message to chat
    const chatArea = $("#chat-box");
    const loadingMessage = $('<div></div>')
        .attr('data-sender', 'system')
        .text('Starting structured review... Evaluating ' + aspectsToReview[0])
        .hide();
    chatArea.append(loadingMessage);
    loadingMessage.slideDown();
    chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');

    // Start the review process
    requestAspectReview(0);
});

// Function to request review for a specific aspect
function requestAspectReview(aspectIndex) {
    console.log("Requesting review for aspect index:", aspectIndex);
    
    if (aspectIndex >= state.aspectsToReview.length) {
        // Review process complete
        const chatArea = $("#chat-box");
        const completionMessage = $('<div></div>')
            .attr('data-sender', 'system')
            .text('Review process complete. Please review each suggestion and accept or reject them.')
            .hide();

        chatArea.append(completionMessage);
        completionMessage.slideDown();
        chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');

        state.reviewInProgress = false;
        return;
    }

    // Get the current research idea text
    const ideaText = $("#main-idea").text();
    console.log("Current idea text:", ideaText);

    $.ajax({
        url: '/api/review_aspect',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            idea: ideaText,
            aspect: state.aspectsToReview[aspectIndex],
            aspect_index: aspectIndex
        }),
        success: function(data) {
            console.log("Review data received:", data);
            if (data.review_data) {
                displayAspectReview(data.review_data);
                
                // Move to next aspect after a delay
                setTimeout(() => {
                    state.currentReviewAspectIndex++;
                    requestAspectReview(state.currentReviewAspectIndex);
                }, 3000);
            } else {
                console.error("No review data received");
                // Continue to next aspect
                state.currentReviewAspectIndex++;
                requestAspectReview(state.currentReviewAspectIndex);
            }
        },
        error: function(xhr, status, error) {
            console.error("Review request error:", error);
            
            const chatArea = $("#chat-box");
            const errorMessage = $('<div></div>')
                .attr('data-sender', 'system')
                .text('Error: ' + (xhr.responseJSON?.error || error))
                .hide();
            chatArea.append(errorMessage);
            errorMessage.slideDown();
            chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');

            // Continue with next aspect despite error
            state.currentReviewAspectIndex++;
            requestAspectReview(state.currentReviewAspectIndex);
        }
    });
}

// Function to display review for a specific aspect
function displayAspectReview(reviewData) {
    const mainIdea = $('#main-idea');
    console.log("Displaying review for aspect:", reviewData);
    
    // Add dynamic CSS for highlights
    addHighlightStyles(reviewData.aspect);
    
    // Clear previous highlights for current aspect
    clearHighlightsForAspect(reviewData.aspect);

    // Get the current text content
    let currentText = mainIdea.html() || mainIdea.text();
    
    // Add debugging for the text matching issue
    console.log("Review highlight text:", reviewData.highlights && reviewData.highlights.length > 0 ? 
                reviewData.highlights[0].text : "No highlights found");
                
    // Apply highlights if they exist
    if (reviewData.highlights && reviewData.highlights.length > 0) {
        reviewData.highlights.forEach(highlight => {
            console.log("Processing highlight:", highlight);
            
            // Find the exact text to highlight
            const text = highlight.text;
            console.log("Searching for text:", text);
            
            // Try direct string matching first (case sensitive)
            const index = currentText.indexOf(text);
            
            if (index !== -1) {
                console.log("Found exact match at position:", index);
                
                // Create the highlight span, preserving the exact text as-is
                const highlightSpan = `<span class="review-highlight ${reviewData.aspect}" 
                    data-aspect="${reviewData.aspect}"
                    data-category="${highlight.category}"
                    data-review="${escape(highlight.review)}">${text}</span>`;
                
                // Replace the text with highlighted version
                currentText = currentText.substring(0, index) + 
                             highlightSpan + 
                             currentText.substring(index + text.length);
                
                console.log("Highlight applied successfully");
            } else {
                // Fall back to case-insensitive search
                console.log("Exact match not found, trying case-insensitive match");
                const lowerText = currentText.toLowerCase();
                const lowerSearchText = text.toLowerCase();
                const lowerIndex = lowerText.indexOf(lowerSearchText);
                
                if (lowerIndex !== -1) {
                    console.log("Found case-insensitive match at position:", lowerIndex);
                    
                    // Extract the actual text with its original case/format
                    const actualText = currentText.substring(lowerIndex, lowerIndex + text.length);
                    
                    // Create the highlight span with the original text preserved
                    const highlightSpan = `<span class="review-highlight ${reviewData.aspect}" 
                        data-aspect="${reviewData.aspect}"
                        data-category="${highlight.category}"
                        data-review="${escape(highlight.review)}">${actualText}</span>`;
                    
                    // Replace the text with highlighted version
                    currentText = currentText.substring(0, lowerIndex) + 
                                 highlightSpan + 
                                 currentText.substring(lowerIndex + actualText.length);
                                 
                    console.log("Highlight applied with original case preserved");
                } else {
                    // Neither exact nor case-insensitive match found
                    console.log("No match found for text:", text);
                }
            }
        });
        
        // Update the content
        mainIdea.html(currentText);
        
        // Add click handlers
        addHighlightClickHandlers();
        
        // Show review summary in chat
        const chatArea = $("#chat-box");
        const summaryCard = $('<div class="review-summary-card"></div>')
            .html(`
                <div class="review-header">
                    <span class="aspect-badge ${reviewData.aspect}">${reviewData.aspect.toUpperCase()}</span>
                    <span class="score">Score: ${reviewData.score}/10</span>
                </div>
                <div class="summary">${reviewData.summary || ''}</div>
            `)
            .hide();
        
        chatArea.append(summaryCard);
        summaryCard.slideDown();
        
        // Show individual highlights in chat
        reviewData.highlights.forEach(highlight => {
            showReviewInChat(
                highlight.category,
                highlight.review,
                reviewData.aspect,
                null
            );
        });
    }
}

// Add new helper function for highlight styles
function addHighlightStyles(aspect) {
    const style = document.createElement('style');
    
    // Color palette for different aspects
    const colors = {
        'novelty': '#fff3cd',          // Light yellow
        'feasibility': '#d4edda',      // Light green
        'clarity': '#cfe2ff',          // Light blue
        'impact': '#f8d7da',           // Light red
        'methodology': '#e2e3e5',      // Light gray
        'assumptions': '#d1e7dd',      // Mint green
        'vagueness': '#d7f5fc',        // Light cyan
        'lack_of_novelty': '#fff3cd',  // Light yellow
        'reproducibility': '#e7d8fc'    // Light purple
    };
    
    // Default color for aspects not in our mapping
    const defaultColor = '#f8f9fa';
    
    // Get color for current aspect, or use default
    const color = colors[aspect] || defaultColor;
    
    style.textContent = `
        /* Highlight styles for text */
        .review-highlight.${aspect} {
            background-color: ${color};
            cursor: pointer;
            padding: 2px 4px;
            border-radius: 3px;
            transition: background-color 0.2s;
        }
        
        .review-highlight.${aspect}:hover {
            filter: brightness(0.95);
        }
        
        /* Badge and score styles for review cards */
        .aspect-badge.${aspect}, 
        .review-card:has(.aspect-badge.${aspect}) .aspect-score {
            background-color: ${color};
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: 500;
        }
    `;
    
    document.head.appendChild(style);
}

// Update showReviewInChat to be more visually appealing
function showReviewInChat(category, description, aspect, highlightElement) {
    const chatArea = $("#chat-box");
    
    const reviewCard = $('<div class="review-card"></div>')
        .html(`
            <div class="review-card-header">
                <span class="aspect-badge ${aspect}">${aspect}</span>
                <span class="category">${category}</span>
            </div>
            <div class="review-card-body">${description}</div>
            <div class="review-card-actions">
                <button class="accept-btn" title="Accept">
                    <img src="/static/icons/tick.svg" alt="Accept">
                </button>
                <button class="reject-btn" title="Reject">
                    <img src="/static/icons/cross.svg" alt="Reject">
                </button>
            </div>
        `)
        .hide();

    // Add click handlers for buttons
    reviewCard.find('.accept-btn').click(function() {
        acceptReview(aspect, category, description, highlightElement);
        reviewCard.slideUp();
    });

    reviewCard.find('.reject-btn').click(function() {
        rejectReview(highlightElement);
        reviewCard.slideUp();
    });

    chatArea.append(reviewCard);
    reviewCard.slideDown();
    chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
}

// Add handler for accepting reviews
function acceptReview(aspect, category, review, highlightElement) {
    state.acceptedReviews.push({
        aspect: aspect,
        category: category,
        review: review
    });
    
    // Update highlight if it exists
    if (highlightElement) {
        $(highlightElement).addClass('accepted');
    }
}

// Add handler for rejecting reviews
function rejectReview(highlightElement) {
    if (highlightElement) {
        $(highlightElement).addClass('rejected');
    }
}

// Function to improve the idea based on accepted reviews
function improveIdeaBasedOnReviews() {
    if (state.acceptedReviews.length === 0) {
        const chatArea = $("#chat-box");
        chatArea.append(
            $('<div></div>')
                .attr('data-sender', 'system')
                .text('No review suggestions were accepted. Please accept some suggestions to improve the idea.')
        );
        chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
        return;
    }

    const ideaText = $("#main-idea").text();
    const chatArea = $("#chat-box");
    const loadingMessage = $('<div></div>')
        .attr('data-sender', 'system')
        .text('Improving idea based on accepted feedback...')
        .hide();
    chatArea.append(loadingMessage);
    loadingMessage.slideDown();
    chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');

    $.ajax({
        url: '/api/improve_idea',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            idea: ideaText,
            accepted_reviews: state.acceptedReviews
        }),
        success: function (data) {
            loadingMessage.remove();

            // The backend returns improved_idea in the response
            const improvedIdea = data.improved_idea;
            
            if (improvedIdea) {
                // Add success message to chat
                const successMessage = $('<div></div>')
                    .attr('data-sender', 'system')
                    .text('Idea improved successfully based on accepted feedback.')
                    .hide();
                chatArea.append(successMessage);
                successMessage.slideDown();

                // CRITICAL: Update the global main_idea variable
                window.main_idea = improvedIdea;
                
                // Update the main idea display with proper formatting
                const formattedContent = formatMessage(improvedIdea);
                $("#main-idea").html(prependFeedbackToIdea(formattedContent, data.feedback));
                $("#main-idea").show();
                showGenerateRQButton();

                // Reset review state
                state.acceptedReviews = [];
                
                // Update visualizations
                if (typeof loadTree === 'function') {
                    loadTree();
                }

                if (data.average_score !== undefined) {
                    updateScoreDisplay(data.average_score);
                } else {
                    // If scores not in response, reload idea to get updated scores
                    loadIdea(false);
                }
            } else {
                const errorMessage = $('<div></div>')
                    .attr('data-sender', 'system')
                    .text('Error improving idea: ' + (data.error || 'Unknown error'))
                    .hide();
                chatArea.append(errorMessage);
                errorMessage.slideDown();
            }
            chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
        },
        error: function (xhr, status, error) {
            loadingMessage.remove();
            const errorMessage = $('<div></div>')
                .attr('data-sender', 'system')
                .text('Error: ' + (xhr.responseJSON?.error || error))
                .hide();
            chatArea.append(errorMessage);
            errorMessage.slideDown();
            chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');
        }
    });
}

// Helper function to escape HTML special characters
function escape(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// Helper function to unescape HTML special characters
function unescape(str) {
    const div = document.createElement('div');
    div.innerHTML = str;
    return div.textContent;
}

// Add CSS for accepted highlights
// Update requestAspectReview to use the state object
function requestAspectReview(aspectIndex) {
    console.log("Requesting review for aspect index:", aspectIndex);
    
    if (aspectIndex >= state.aspectsToReview.length) {
        // Review process complete
        const chatArea = $("#chat-box");
        const completionMessage = $('<div></div>')
            .attr('data-sender', 'system')
            .text('Review process complete. Please review each suggestion and accept or reject them.')
            .hide();

        chatArea.append(completionMessage);
        completionMessage.slideDown();
        chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');

        state.reviewInProgress = false;
        return;
    }

    // Get the current research idea text
    const ideaText = $("#main-idea").text();
    console.log("Current idea text:", ideaText);

    $.ajax({
        url: '/api/review_aspect',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            idea: ideaText,
            aspect: state.aspectsToReview[aspectIndex],
            aspect_index: aspectIndex
        }),
        success: function(data) {
            console.log("Review data received:", data);
            if (data.review_data) {
                displayAspectReview(data.review_data);
                
                // Move to next aspect after a delay
                setTimeout(() => {
                    state.currentReviewAspectIndex++;
                    requestAspectReview(state.currentReviewAspectIndex);
                }, 3000);
            } else {
                console.error("No review data received");
                // Continue to next aspect
                state.currentReviewAspectIndex++;
                requestAspectReview(state.currentReviewAspectIndex);
            }
        },
        error: function(xhr, status, error) {
            console.error("Review request error:", error);
            
            const chatArea = $("#chat-box");
            const errorMessage = $('<div></div>')
                .attr('data-sender', 'system')
                .text('Error: ' + (xhr.responseJSON?.error || error))
                .hide();
            chatArea.append(errorMessage);
            errorMessage.slideDown();
            chatArea.animate({ scrollTop: chatArea[0].scrollHeight }, 'slow');

            // Continue with next aspect despite error
            state.currentReviewAspectIndex++;
            requestAspectReview(state.currentReviewAspectIndex);
        }
    });
}

// Update other functions to use state
function acceptReview(aspect, category, review, highlightElement) {
    state.acceptedReviews.push({
        aspect: aspect,
        category: category,
        review: review
    });
    
    if (highlightElement) {
        $(highlightElement).addClass('accepted');
    }
}

// ...rest of existing code...

// Make sure helper functions are properly defined
function cleanupPreviousHighlights() {
    const mainIdea = $('#main-idea');
    const content = mainIdea.html();
    if (content) {
        mainIdea.html(content.replace(/<span class="review-highlight[^>]*>(.*?)<\/span>/g, '$1'));
    }
}

function clearHighlightsForAspect(aspect) {
    const mainIdea = $('#main-idea');
    const content = mainIdea.html();
    if (content) {
        mainIdea.html(content.replace(
            new RegExp(`<span class="review-highlight ${aspect}"[^>]*>(.*?)<\/span>`, 'g'), 
            '$1'
        ));
    }
}

// Add this direct update function at the top of the file, to ensure it's available for all other functions
function forceUpdateScoreDisplay(score) {
    if (score === undefined || score === null) {
        return; // Don't update if no score is provided
    }
    
    console.log("Forcing score update to:", score);
    
    // Get DOM elements
    const scoreDisplay = document.getElementById('score-display');
    const scoreValue = document.getElementById('current-score');
    
    // Safety check
    if (!scoreDisplay || !scoreValue) {
        console.error("Score display elements not found in the DOM");
        return;
    }
    
    // Update the score text with 2 decimal places
    scoreValue.textContent = `${parseFloat(score).toFixed(2)}/10`;
    
    // Ensure the score display is visible
    scoreDisplay.style.display = 'block';
    
    // Add a flash animation
    scoreValue.classList.add('score-flash');
    setTimeout(() => scoreValue.classList.remove('score-flash'), 500);
}

// Now update the original function to use our direct update function
function updateScoreDisplay(score) {
    forceUpdateScoreDisplay(score);
}

// Function to update score display
function updateScoreDisplay(score) {
    forceUpdateScoreDisplay(score);
}

// Simple helper function to prepend feedback to idea content
function prependFeedbackToIdea(ideaContent, feedback) {
    if (!feedback || feedback === '') {
        return ideaContent;
    }
    const feedbackHeader = `<div class="feedback-header"><div class="feedback-label">Feedback:</div><div class="feedback-text">${escapeHtml(feedback)}</div></div>`;
    return feedbackHeader + ideaContent;
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add to the success handlers of API calls
$.ajax({
    url: '/api/chat',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
        content: messageContent,
        subject: selectedSubject  // Include selected subject
    }),
    success: function(data) {
        // ...existing success handler code...
        if (data.average_score !== undefined) {
            updateScoreDisplay(data.average_score);
        }
    },
    // ...rest of ajax code...
});

// Update score in other relevant API calls
$.ajax({
    url: '/api/step',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
        action: action
    }),
    success: function(data) {
        // ...existing success handler code...
        if (data.average_score !== undefined) {
            updateScoreDisplay(data.average_score);
        }
    },
    // ...rest of ajax code...
});

// $.ajax({
//     url: '/api/improve_idea',
//     type: 'POST',
//     contentType: 'application/json',
//     data: JSON.stringify({
//         idea: ideaText,
//         accepted_reviews: state.acceptedReviews
//     }),
//     success: function(data) {
//         // ...existing success handler code...
//         if (data.average_score !== undefined) {
//             updateScoreDisplay(data.average_score);
//         }
//     },
//     // ...rest of ajax code...
// });

$.ajax({
    url: '/api/improve_idea_with_knowledge',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
        idea: idea,
        // ...other data...
    }),
    success: function(data) {
        // ...existing success handler code...
        if (data.average_score !== undefined) {
            updateScoreDisplay(data.average_score);
        }
    },
    // ...rest of ajax code...
});

// Also update score when loading idea
function loadIdea(isInitialLoad = false) {
    $.ajax({
        url: '/api/idea',
        type: 'GET',
        success: function(data) {
            // ...existing success handler code...
            if (data.average_score !== undefined) {
                updateScoreDisplay(data.average_score);
            }
        },
        // ...rest of ajax code...
    });
}

// Add to existing event listeners
document.addEventListener('DOMContentLoaded', function() {
    // ...existing initialization code...
    
    // Initialize MCTS automation button state
    const autoGenBtn = document.querySelector('.auto-generate');
    if (autoGenBtn) {
        autoGenBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleAutoGenerate();
        });
    }
});

// Add these functions to handle state updates
function updateScore(score) {
    const scoreDisplay = document.getElementById('current-score');
    if (scoreDisplay) {
        const oldScore = parseFloat(scoreDisplay.textContent);
        scoreDisplay.textContent = `${score.toFixed(1)}/10`;
        
        // Add animation class if score improved
        if (score > oldScore) {
            scoreDisplay.classList.add('score-flash');
            setTimeout(() => scoreDisplay.classList.remove('score-flash'), 500);
        }
    }
}

function updateMainIdea(content) {
    const mainIdea = document.getElementById('main-idea');
    if (mainIdea) {
        mainIdea.style.display = 'block';
        mainIdea.innerHTML = marked.parse(content);
        document.getElementById('brief-placeholder').style.display = 'none';
    }
}

// Update chat box with exploration status
function addExplorationMessage(message, isLoading = false) {
    const messageDiv = document.createElement('div');
    messageDiv.setAttribute('data-sender', 'system');
    
    if (isLoading) {
        // Apply animated dots if message contains "..."
        const animatedMessage = message.replace('...', '<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>');
        messageDiv.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <div class="loading-text">${animatedMessage}</div>
            </div>`;
    } else {
        messageDiv.textContent = message;
    }
    
    const chatBox = document.getElementById('chat-box');
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageDiv;
}

// Add error handling for API calls
function handleApiError(error, context) {
    console.error(`Error in ${context}:`, error);
    addExplorationMessage(`Error: ${error.message || 'An error occurred during exploration'}`, false);
    mctsAuto.stopExploration();
}

// Add WebSocket handling if using real-time updates
let explorationSocket = null;

function setupWebSocket() {
    if (!explorationSocket || explorationSocket.readyState !== WebSocket.OPEN) {
        explorationSocket = new WebSocket(getWebSocketUrl());
        
        explorationSocket.onmessage = function(event) {
            const data = JSON.parse(event.data);
            handleExplorationUpdate(data);
        };
        
        explorationSocket.onerror = function(error) {
            console.error('WebSocket error:', error);
            handleApiError(error, 'WebSocket connection');
        };
    }
}

function getWebSocketUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/exploration`;
}

function handleExplorationUpdate(data) {
    switch (data.type) {
        case 'progress':
            addExplorationMessage(data.message, data.isLoading);
            break;
        case 'score':
            updateScore(data.score);
            break;
        case 'idea':
            updateMainIdea(data.content);
            break;
        case 'complete':
            mctsAuto.stopExploration();
            addExplorationMessage('Exploration completed!');
            break;
        case 'error':
            handleApiError(new Error(data.message), 'Exploration update');
            break;
    }
}

// Add MCTS visualization support
function updateTreeVisualization(treeData) {
    const treeArea = document.getElementById('tree-area');
    if (!treeArea || treeArea.style.display === 'none') return;
    
    // Clear existing visualization
    treeArea.innerHTML = '';
    
    if (!treeData || !treeData.nodes || treeData.nodes.length === 0) {
        treeArea.innerHTML = `
            <div class="empty-tree-message">
                <div class="empty-tree-content">
                    <div class="empty-tree-icon">🌱</div>
                    <div class="empty-tree-text">No exploration data yet</div>
                    <div class="empty-tree-subtext">Start the automated exploration to see the search tree grow</div>
                </div>
            </div>`;
            }
    // Set up D3 visualization
    const width = treeArea.clientWidth;
    const height = treeArea.clientHeight;
    
    const svg = d3.select(treeArea)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    const g = svg.append('g')
        .attr('transform', `translate(${width/2},50)`);
    
    // Create tree layout
    const treeLayout = d3.tree()
        .size([width - 100, height - 100]);
    
    const root = d3.hierarchy(treeData);
    treeLayout(root);
    
    // Add links
    g.selectAll('.link')
        .data(root.links())
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y));
    
    // Add nodes
    const nodes = g.selectAll('.node')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('class', d => `node${d.data.isCurrent ? ' current' : ''}`)
        .attr('transform', d => `translate(${d.x},${d.y})`);
    
    nodes.append('circle')
        .attr('r', 8)
        .attr('fill', d => getNodeColor(d.data));
    
    nodes.append('text')
        .attr('dy', '2em')
        .attr('text-anchor', 'middle')
        .text(d => d.data.score ? `${(d.data.score * 10).toFixed(1)}` : '');
}

function getNodeColor(nodeData) {
    if (nodeData.isCurrent) return '#3b82f6';
    if (nodeData.score > 0.7) return '#22c55e';
    if (nodeData.score > 0.4) return '#eab308';
    return '#64748b';
}

// Export functions that need to be accessible globally
window.updateScore = updateScore;
window.updateMainIdea = updateMainIdea;
window.addExplorationMessage = addExplorationMessage;
window.updateTreeVisualization = updateTreeVisualization;

// New Research reset function - clears all state and starts fresh
function startNewResearch() {
    if (!confirm("Start a new research idea? This will clear the current one.")) return;

    $.post('/api/reset', function() {
        // Clear major UI regions
        $('#chat-box').empty();
        $('#main-idea').empty();
        $('#expanded-sections').empty();
        
        // Clear IA sections content
        $('#background-content').empty();
        $('#procedure-content').empty();
        $('#research_design-content').empty();
        $('#background-citations').empty();
        $('#procedure-citations').empty();
        $('#research_design-citations').empty();
        $('#background-section').hide();
        $('#procedure-section').hide();
        $('#research_design-section').hide();
        
        // Reset RQ display
        $('#rq-display').hide();
        $('#rq-content').empty();
        $('#rq-warnings').empty().hide();
        $('#expand-buttons').hide();
        
        // Hide panels
        $('#ia-sections-panel').hide();
        $('#generate-rq-container').hide();
        
        // Show IA Section tab (it should be visible initially)
        $('#tab-ia-section').show();
        
        // Reset inputs
        $('#chat-input').val('').attr('placeholder', 'Enter your research goal...');
        // Keep the current subject selected (don't clear it)
        // The subject selector should maintain its value
        
        // Reset tabs / views
        switchTab('research-brief');
        
        // Show welcome / placeholder
        $('#welcome-message').show();
        $('#proposal-content').hide().empty();
        $('#edit-button').hide();
        
        // Clear main-idea and show the initial placeholder (like on first load)
        $('#main-idea').empty();
        $('#brief-placeholder').show();
        
        // Show IA section placeholder
        $('#ia-placeholder').show();
        
        // Hide copy button
        const copyContainer = document.getElementById('copy-brief-container');
        if (copyContainer) {
            copyContainer.style.display = 'none';
        }

        // Reset tree & review safely
        if (window.updateTreeVisualization) updateTreeVisualization({ nodes: [] });
        if (window.reviewUI && reviewUI.reset) reviewUI.reset();
        
        // Reset global variables
        if (typeof window.main_idea !== 'undefined') {
            window.main_idea = '';
        }
        
        // Reset score display to initial state (show "--" instead of "0")
        const scoreValue = document.getElementById('current-score');
        if (scoreValue) {
            scoreValue.textContent = '-/10';
        }
        
        // Show success message
        const chatArea = $("#chat-box");
        const resetMessage = $('<div></div>')
            .attr('data-sender', 'system')
            .css({
                'padding': '10px 15px',
                'background': '#f9fafb',
                'border-left': '3px solid #6b7280',
                'border-radius': '6px',
                'margin': '10px 0',
                'color': '#6b7280',
                'font-size': '13px'
            })
            .text('Ready for a new research project! Enter your research goal to begin.')
            .hide();
        chatArea.append(resetMessage);
        resetMessage.slideDown();
    }).fail(function(xhr) {
        console.error('Error resetting application:', xhr);
        alert('Error resetting application. Please refresh the page.');
    });
}
window.startNewResearch = startNewResearch;

// Add helper functions for automated button clicks
function triggerRetrieveKnowledge() {
    // Simulate click on retrieve button
    const retrieveBtn = document.querySelector(".retrieve-knowledge");
    if (retrieveBtn) {
        retrieveBtn.click();
        return true;
    }
    return false;
}

function triggerRefreshIdea() {
    // Simulate click on refresh button  
    const refreshBtn = document.querySelector(".refresh-button");
    if (refreshBtn) {
        refreshBtn.click();
        return true;
    }
    return false;
}

// // Update toggleAutoGenerate to use the trigger functions
// function toggleAutoGenerate() {
//     const autoButton = $(".auto-generate");
//     autoButton.toggleClass("active");
    
//     // If the Auto button is active, remove active class from other buttons
//     if (autoButton.hasClass("active")) {
//         $(".top-bar button").not(autoButton).removeClass("active");
        
//         // Get available actions with their trigger functions
//         const availableActions = [
//             {
//                 button: ".generate-review",
//                 action: "judge",
//                 trigger: () => window.triggerGenerateReview()
//             },
//             {
//                 button: ".retrieve-knowledge", 
//                 action: "retrieve_and_refine",
//                 trigger: triggerRetrieveKnowledge
//             },
//             {
//                 button: ".refresh-button",
//                 action: "refresh_idea", 
//                 trigger: triggerRefreshIdea
//             }
//         ];

//         // For now, randomly select one action
//         const randomAction = availableActions[Math.floor(Math.random() * availableActions.length)];
//         updateChat("🤖 " + "Taking action " + randomAction);
        
//         // Call the appropriate trigger function
//         if (randomAction.trigger()) {
//             // Send the corresponding action to backend
//             $.ajax({
//                 url: '/api/step',
//                 type: 'POST',
//                 contentType: 'application/json',
//                 data: JSON.stringify({ action: randomAction.action }),
//                 success: function (data) {
//                     // Update the main idea if provided
//                     if (data.idea) {
//                         const structuredIdea = parseAndFormatStructuredIdea(data.idea);
//                         $("#main-idea").html(formatMessage(structuredIdea));
//                     }

//                     // Update chat messages if provided
//                     if (data.messages) {
//                         updateChat(data.messages);
//                     }

//                     if (data.average_score !== undefined) {
//                         updateScoreDisplay(data.average_score);
//                     }
                    
//                     // If auto mode is still active, schedule next action
//                     if (autoButton.hasClass("active")) {
//                         setTimeout(toggleAutoGenerate, 5000); // 5 second delay between actions
//                     }
//                 },
//                 error: function(xhr, status, error) {
//                     const chatArea = $("#chat-box");
//                     var errorDiv = $('<div></div>')
//                         .attr('data-sender', 'system')
//                         .text('Error: ' + (xhr.responseJSON?.error || error))
//                         .hide();
//                     chatArea.append(errorDiv);
//                     errorDiv.slideDown();
//                     chatArea.scrollTop(chatArea[0].scrollHeight);
                    
//                     // Stop auto mode on error
//                     autoButton.removeClass("active");
//                 }
//             });
//         }
//     }
    
//     // Prevent the click from triggering other handlers
//     return false;
// }

// Add this function to properly handle review data
function updateReview(data) {
    // Check if we have review scores and update the display
    if (data.average_score !== undefined) {
        updateScoreDisplay(data.average_score);
    }
    
    // Handle other review data if needed
    if (data.review_scores) {
        // Could add additional functionality here like showing detailed scores
        console.log("Review scores received:", data.review_scores);
    }
    
    if (data.review_feedback) {
        // Could handle detailed feedback here
        console.log("Review feedback received");
    }
}

window.toggleAutoGenerate = toggleAutoGenerate;

// =============================================
// Panel Resizer Functionality - Self-contained module
// =============================================

(function() {
    // Use var to avoid TDZ issues - these are initialized immediately
    var isResizing = false;
    var startY = 0;
    var startMainHeight = 0;
    var startBottomHeight = 0;
    
    // Handle mouse move during resize
    function handleMouseMove(e) {
        if (!isResizing) return;
        
        var divider = $('#panel-divider');
        var mainIdea = $('#main-idea');
        var bottomPanel = $('#bottom-panel');
        
        var container = $('.idea');
        var containerHeight = container.height();
        var headerHeight = $('.heading').outerHeight() + $('#score-display').outerHeight() + 20;
        var availableHeight = containerHeight - headerHeight - divider.outerHeight() - 50;
        
        var deltaY = e.clientY - startY;
        
        // Calculate new heights
        var newMainHeight = startMainHeight + deltaY;
        var newBottomHeight = startBottomHeight - deltaY;
        
        // Minimum heights
        var minHeight = 150;
        if (newMainHeight < minHeight) {
            newMainHeight = minHeight;
            newBottomHeight = availableHeight - newMainHeight;
        }
        if (newBottomHeight < minHeight) {
            newBottomHeight = minHeight;
            newMainHeight = availableHeight - newBottomHeight;
        }
        
        // Maximum heights
        if (newMainHeight > availableHeight - minHeight) {
            newMainHeight = availableHeight - minHeight;
            newBottomHeight = minHeight;
        }
        if (newBottomHeight > availableHeight - minHeight) {
            newBottomHeight = availableHeight - minHeight;
            newMainHeight = minHeight;
        }
        
        // Apply new heights
        mainIdea.css('flex', 'none');
        bottomPanel.css('flex', 'none');
        mainIdea.css('height', newMainHeight + 'px');
        bottomPanel.css('height', newBottomHeight + 'px');
        
        // Store in localStorage for persistence
        var splitRatio = newMainHeight / availableHeight;
        localStorage.setItem('panelSplitRatio', splitRatio);
    }
    
    // Handle mouse up - end resize
    function handleMouseUp() {
        if (isResizing) {
            isResizing = false;
            $('#panel-divider').removeClass('active');
            $('body').css('user-select', '');
            $('body').css('cursor', '');
        }
    }
    
    // Attach document-level handlers once on DOM ready
    $(document).ready(function() {
        $(document).on('mousemove', handleMouseMove);
        $(document).on('mouseup', handleMouseUp);
    });
    
    // Expose initializePanelResizer to window (disabled - using tab system instead)
    window.initializePanelResizer = function() {
        // Tab system is now used instead of resizable panels
        // This function is kept for compatibility but does nothing
        return;
        
        /* DISABLED - Tab system replaces resizer
        var divider = $('#panel-divider');
        var mainIdea = $('#main-idea');
        var bottomPanel = $('#ia-sections-panel');
        
        // Check if elements exist and are visible
        if (!divider.length || !mainIdea.length || !bottomPanel.length) {
            console.warn('Panel resizer: Required elements not found');
            return;
        }
        
        // Remove any existing handlers to prevent duplicates
        divider.off('mousedown.panelResizer');
        
        // Set initial 50/50 split if not already set
        if (!mainIdea.data('initial-height-set')) {
            // Use flex for equal split
            mainIdea.css('flex', '1');
            bottomPanel.css('flex', '1');
            mainIdea.data('initial-height-set', true);
        }
        
        // Mouse down handler - start resize
        divider.on('mousedown.panelResizer', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (!mainIdea.is(':visible') || !bottomPanel.is(':visible')) {
                return;
            }
            
            isResizing = true;
            divider.addClass('active');
            
            // Get current positions and heights
            startY = e.clientY || e.pageY;
            
            // Get actual rendered heights
            var mainIdeaRect = mainIdea[0].getBoundingClientRect();
            var bottomPanelRect = bottomPanel[0].getBoundingClientRect();
            
            startMainHeight = mainIdeaRect.height;
            startBottomHeight = bottomPanelRect.height;
            
            // Prevent text selection during resize
            $('body').css('user-select', 'none');
            $('body').css('cursor', 'row-resize');
        });
        
        // Restore saved split ratio if available
        var savedRatio = localStorage.getItem('panelSplitRatio');
        if (savedRatio && parseFloat(savedRatio) > 0 && parseFloat(savedRatio) < 1) {
            // Use setTimeout to ensure layout is ready
            setTimeout(function() {
                var container = $('.idea');
                if (!container.length) return;
                
                var containerHeight = container.height();
                var headerHeight = $('.heading').outerHeight() + $('#score-display').outerHeight() + 20;
                var availableHeight = containerHeight - headerHeight - divider.outerHeight() - 50;
                
                if (availableHeight > 300) {
                    var mainHeight = availableHeight * parseFloat(savedRatio);
                    var bottomHeight = availableHeight - mainHeight;
                    
                    if (mainHeight >= 150 && bottomHeight >= 150) {
                        mainIdea.css('flex', 'none');
                        bottomPanel.css('flex', 'none');
                        mainIdea.css('height', mainHeight + 'px');
                        bottomPanel.css('height', bottomHeight + 'px');
                    }
                }
            }, 100);
        }
        */
    };
})();

// =============================================
// Tab System Functionality
// =============================================

function switchTab(tabName) {
    const researchBriefTab = $('#tab-research-brief');
    const iaSectionTab = $('#tab-ia-section');
    const mainIdea = $('#main-idea');
    const iaSections = $('#ia-sections-panel');
    const placeholder = $('#brief-placeholder');
    
    console.log('switchTab attempting transition to:', tabName);
    
    if (tabName === 'research-brief') {
        // Switch to Research Brief
        researchBriefTab.addClass('active');
        iaSectionTab.removeClass('active');
        
        // Show Research Brief content
        iaSections.hide().removeClass('active');
        mainIdea.show().addClass('active');
        
        // Handle placeholder visibility
        // Check if main-idea has meaningful text content (not just HTML tags or whitespace)
        const mainIdeaText = mainIdea.text().trim();
        const mainIdeaHtml = mainIdea.html().trim();
        
        // Show placeholder if there's no meaningful text content
        // Also check for the specific "Enter a new research goal" message that shouldn't be there
        if (mainIdeaText.length === 0 || 
            mainIdeaHtml === '<p style="color: #94a3b8; text-align: center; padding: 20px;">Enter a new research goal to begin.</p>' ||
            mainIdea.is(':empty')) {
            placeholder.show();
        } else {
            placeholder.hide();
        }
        
        console.log('Switched to Research Brief UI state');
    } else if (tabName === 'ia-section') {
        // Switch to IA Section
        iaSectionTab.addClass('active');
        researchBriefTab.removeClass('active');
        
        // Show IA Section content
        mainIdea.hide().removeClass('active');
        placeholder.hide(); // Never show brief placeholder in IA section tab
        iaSections.show().addClass('active');
        
        // Handle IA section placeholder visibility
        const iaPlaceholder = $('#ia-placeholder');
        const hasIATopic = $('#ia-topic-content').text().trim().length > 0;
        const hasRQ = $('#rq-content').text().trim().length > 0;
        const hasExpandedSections = $('#background-section').is(':visible') || 
                                     $('#procedure-section').is(':visible') || 
                                     $('#research_design-section').is(':visible');
        
        // Show placeholder if there's no IA topic, RQ, or expanded sections
        if (hasIATopic || hasRQ || hasExpandedSections) {
            iaPlaceholder.hide();
        } else {
            iaPlaceholder.show();
        }
        
        console.log('Switched to IA Section UI state');
    } else {
        console.warn('Unknown tab name provided to switchTab:', tabName);
    }
}

// Attach tab button handlers
// #region agent log
// Verify sendMessage is defined after script loads
console.log('Script loaded. sendMessage defined:', typeof window.sendMessage);
if (typeof window.sendMessage !== 'function') {
    console.error('ERROR: sendMessage is not a function! Type:', typeof window.sendMessage);
}
// #endregion