"""Prompt templates for IRIS agents."""

from typing import Dict, List, Optional, Tuple
from src.utils.ib_config import validate_rq, load_rq_requirements

# Ideation Agent Prompts
IDEATION_SYSTEM_PROMPT = """You are an expert scientific research ideation assistant. Your goal is to help researchers generate and refine creative, novel research ideas. 
You should offer detailed, well-structured responses and always aim for scientific rigor.

Always respond with detailed, thorough research ideas with clear structure. Break down your response into clear sections 
including:
1. Title: A concise statement of the main research question to be used as the paper title.
2. Proposed Method: Explain how the proposed method works, describe all the essential steps.
3. Step-by-Step Experiment Plan: Break down every single step of the experiments, make sure every
step is executable. Cover all essential details such as the datasets, models, and metrics to be used.
"""

# If
# the project involves prompting, give some example prompts for each step.

# Query generation prompt for retrieval
IDEATION_GENERATE_QUERY_PROMPT = """Given the following research idea, generate a concise and focused search query for retrieving relevant scientific papers:

RESEARCH IDEA:
{research_idea}

Your task is to create an effective search query that will retrieve papers most relevant to this research idea. The query should:
1. Focus on the core concepts and techniques mentioned in the idea
2. Be specific enough to retrieve targeted results but not too narrow
3. Include key technical terms that would appear in relevant papers
4. Be structured appropriately for academic search engines

Return your response as a JSON object with the following structure:
{{
  "query": "Your search query here"
}}

Make sure the query is concise (1-2 sentences or phrases) and directly addresses the key aspects of the research idea. Do not create a keyword search query just a simple sentence focused on technical aspects in engligh."""

# IDEATION_GENERATE_PROMPT = """Given the following research topic:
# {research_topic}

# Generate a novel research idea in the format of a structured JSON object with the following fields:
# {{
#   "title": "A concise statement of the main research question to be used as the paper title",
#   "proposed_method": "A detailed explanation of how the proposed method works, describing all the essential steps (Ensure Markdown formatting)",
#   "experiment_plan": "A step-by-step breakdown of the experiments, covering all essential details such as datasets, models, and metrics",
# }}

# The JSON must be properly formatted and parsable. Do not include any text outside the JSON structure.

# Do not use json within the fields only markdown formatting. There shouldn't be any nested JSON. Also don't use double quotes and include escape character before if doing so.

# Be creative and original - aim for ideas that could be published at top-tier conferences like NeurIPS, ICML, ACL, or CVPR."""

# It is 2025, if in context of LLMs or models refer to latest ones and not old models like BERT, T5, GPT-2.

# IDEATION_GENERATE_PROMPT = """Given the following research goal:  
# {research_topic}  

# Generate a novel research idea in the format of a structured JSON object with the following fields:  
# {{  
#   "title": "A concise statement of the main research question to be used as the paper title",  
#   "proposed_method": "A detailed explanation of how the proposed method works, describing all essential steps",  
#   "experiment_plan": "A step-by-step breakdown of the experiments, covering all essential details such as datasets, models, and metrics"  
# }}

# ### Instructions:  
# - Propose a research idea that is realistic, implementable, and verifiable with current technology.  
# - Focus on a simple, straightforward method that is not obvious but could be groundbreaking or highly impactful.  
# - Build on existing state-of-the-art models and methods, avoiding speculative or future architectures.  
# - Describe the proposed_method clearly, with all key steps, and include a brief line on why it works well for the problem.  
# - Ensure the method addresses the research goal in a way that current approaches do not.  
# - Keep the experiment_plan practical, using available datasets, models, and metrics.  
# - Aim for an idea that could stand out at top conferences like NeurIPS, ICML, ACL, or CVPR.  

# ### Guidelines:  
# - Be creative but keep it grounded and feasible.  
# - Avoid small tweaks to existing work; propose something significantly different.  
# - Use clear, concise language in all fields.  
# - Format the JSON properly, with escape characters (e.g., \\\") where needed.  
# - Do not add text outside the JSON in the output.  

# Generate the JSON object based on the research goal provided."""

# IDEATION_GENERATE_PROMPT = """Given the following research goal:  
# {research_topic}  

# Generate a novel research idea in the format of a structured JSON object with the following fields:  
# {{  
#   "title": "A concise statement of the main research question to be used as the paper title",  
#   "proposed_method": "A detailed explanation of how the proposed method works, describing all essential steps",  
#   "experiment_plan": "A step-by-step breakdown of the experiments, covering all essential details such as datasets, models, and metrics"  
# }}  

# ### Instructions:  
# - Propose a research idea that is realistic, implementable, and verifiable with current technology.
# - Build on existing state-of-the-art models and methods.  
# - Describe the proposed_method clearly, with all key steps, and include a brief line on why it works well for the problem.  
# - Ensure the method addresses the research goal in a way that current approaches do not.  
# - Keep the experiment_plan practical, using available datasets, models, and metrics.  
# - Aim for an idea that could stand out at top conferences like NeurIPS, ICML, ACL, or CVPR.  

# ### Guidelines:  
# - Be creative but keep it grounded and feasible.  
# - Avoid small tweaks to existing work; propose something significantly different.  
# - Use clear, concise language in all fields.  
# - Do not use json within the fields only markdown formatting.
# - Format the JSON properly, with escape characters (e.g., \\\") where needed.  
# - Do not add text outside the JSON in the output.  

# Generate the JSON object based on the research goal provided."""

# AI

IDEATION_GENERATE_PROMPT = """Act as an computer science experienced researcher specializing in the area related to the provided research topic, aiming to generate a high-impact idea suitable for top-tier conferences (e.g., NeurIPS, ICML, ACL, CVPR).

Given the following research topic:
{research_topic}

Your task is to generate **one** novel and significant research idea. Present the idea as a structured JSON object with the following fields:

{{
  "title": "A concise, impactful title capturing the core research question or contribution.",
  "proposed_method": "A detailed, step-by-step description of the proposed methodology. Include key components, algorithmic procedures, architectural details (if applicable), and the underlying intuition or theoretical justification explaining *why* this method is expected to effectively address the identified gap.",
  "experiment_plan": "A concrete plan for empirical validation. Specify: \n- **Datasets:** Standard benchmark datasets suitable for the task.\n- **Baselines:** Key state-of-the-art methods for comparison.\n- **Metrics:** Primary evaluation metrics relevant to the research goal and claimed novelty.\n- **Ablation Studies:** Specific experiments planned to isolate and validate the contribution of key components of the proposed method.",
}}

### Instructions for Generation:
1.  **Focus on Significance:** Aim for ideas that address a meaningful gap and offer a substantial advancement, not just incremental improvements.
2.  **Ground in SOTA:** The idea should be aware of and build upon (or challenge) existing state-of-the-art, but the core contribution must be novel.
3.  **Ensure Clarity & Detail:** Provide enough detail in `proposed_method` and `experiment_plan` for a knowledgeable researcher to grasp the concept and validation strategy.
4.  **Maintain Feasibility:** The proposed method and experiments must be realistically achievable. Use standard datasets and metrics where possible.
5.  **Adhere to Format:**
    *   Generate *only* the JSON object as output. No introductory or concluding text.
    *   Ensure the JSON is well-formed, using appropriate escape characters (e.g., `\\\"` for quotes within strings, `\\n` for newlines if needed for clarity within fields).
    *   Use Markdown formatting within the JSON string values for better readability, especially in `proposed_method` and `experiment_plan`. Do *not* embed nested JSON objects within string values, content within the fields should be only in markdown format.
    *   Do not use json within the fields only markdown formatting.

Generate the JSON object based on the provided research topic.
"""

# IDEATION_GENERATE_PROMPT = """Act as an experienced HCI researcher specializing in the area related to the provided research topic, aiming to generate a high-impact idea suitable for top-tier conferences (e.g., CHI).

# Given the following research topic:
# {research_topic}

# {abstract_section}

# Your task is to generate **one** novel and significant research idea. Present the idea as a structured JSON object with the following fields:

# {{
#   "title": "A concise, impactful title capturing the core research question or contribution.",
#   "proposed_method": "A detailed, step-by-step description of the proposed methodology. Include key components, algorithmic procedures, architectural details (if applicable), and the underlying intuition or theoretical justification explaining *why* this method is expected to effectively address the identified gap.",
#   "experiment_plan": "A concrete plan for empirical validation. ",
# }}

# ### Instructions for Generation:
# 1.  **Focus on Significance:** Aim for ideas that address a meaningful gap and offer a substantial advancement, not just incremental improvements.
# 2.  **Ensure Clarity & Detail:** Provide enough detail in `proposed_method` and `experiment_plan` for a knowledgeable researcher to grasp the concept and validation strategy.
# 3.  **Maintain Feasibility:** The proposed method and experiments must be realistically achievable.
# 4.  **Adhere to Format:**
#     *   Generate *only* the JSON object as output. No introductory or concluding text.
#     *   Ensure the JSON is well-formed, using appropriate escape characters (e.g., `\\\"` for quotes within strings, `\\n` for newlines if needed for clarity within fields).
#     *   Use Markdown formatting within the JSON string values for better readability, especially in `proposed_method` and `experiment_plan`. Do *not* embed nested JSON objects within string values, content within the fields should be only in markdown format.
#     *   Do not use json within the fields only markdown formatting.

# Generate the JSON object based on the provided research topic.
# """

# New prompt for the "refresh idea" button to create a completely different approach
IDEATION_REFRESH_APPROACH_PROMPT = """Take a completely new direction with the following research problem/topic:

INITIAL RESEARCH GOAL:
{research_topic}

CURRENT RESEARCH IDEA (which we want to change):
{current_idea}

{abstract_section}

Your task is to develop an entirely different approach to address the core research goal. Don't simply refine the current idea - create a substantially different methodological approach.

Guidelines:
1. Focus on the core research goal from the initial proposal
2. Propose a completely different technical approach or paradigm
3. Change the fundamental methodology or theoretical framework
4. Introduce novel techniques not mentioned in previous ideas
5. Consider interdisciplinary approaches that bring in methods from other fields

Your refreshed idea should:
- Address the same research goal but with a radically different approach
- Be similarly ambitious in scope to the original idea
- Present a clear departure from both the initial and current ideas
- Maintain scientific rigor and feasibility

Return your response as a JSON object with the following structure:
{{
  "title": "A title for your refreshed research idea",
  "proposed_method": "A detailed explanation of how the proposed method works",
  "experiment_plan": "The experimental approach to validate your method"
}}

The JSON must be properly formatted and parsable. Do not include any text outside the JSON structure.

Do not use json within the fields only markdown formatting. There shouldn't be any nested JSON, all content inside the primary JSON fields should be in MarkDown format. Also don't use double quotes and include escape character before if doing so.
"""

IDEATION_REFINE_WITH_RETRIEVAL_PROMPT = """Refine the following research idea using information from the retrieved literature:

ORIGINAL IDEA:
{current_idea}

{abstract_section}

RELEVANT LITERATURE:
{retrieved_content}

This is to provide you context around the work happening in parallel literature, feel free to incorporate, refine, add, or change your own idea if 
you find more promising approaches or methods in the literature.

Your can enhance the research idea by incorporating insights from the retrieved literature. 
Focus on:
1. Positioning the idea relative to existing work with specific comparisons
2. Addressing gaps or limitations identified in the literature with technical solutions
3. Incorporating relevant techniques, datasets, or methods mentioned with implementation details
4. Ensuring the idea builds upon rather than duplicates existing work
5. Adding precise citations where appropriate

Provide a comprehensive refinement that integrates insights from the literature while maintaining the core innovation.
Include specific technical details and methodology improvements informed by the literature.

Return your response as a JSON object with the following structure:
{{
  "title": "A title for your literature-informed research idea",
  "proposed_method": "A detailed explanation of how the proposed method works, incorporating insights from the literature",
  "experiment_plan": "A step-by-step breakdown of the experiments, incorporating relevant datasets and metrics from the literature"
}}

The JSON must be properly formatted and parsable. Do not include any text outside the JSON structure.
Use markdown formatting within each field for better readability.
Do not use nested JSON within the fields.
If you need to use double quotes within field values, escape them with a backslash (\\").
Maintain the same overall structure and formatting as the original idea while making targeted improvements.

Example format:
{{
  "title": "Improved Cross-Modal Knowledge Transfer with Contrastive Learning",
  "proposed_method": "Our method consists of three key components:\n\n1. **Feature extraction module** - Using pretrained encoders to extract representations from multiple modalities\n2. **Contrastive alignment layer** - Aligning representations across modalities using InfoNCE loss\n3. **Knowledge distillation component** - Transferring knowledge from teacher to student models",
  "experiment_plan": "We will evaluate our approach using the following steps:\n\n1. **Dataset preparation** - Using MS-COCO and AudioSet for cross-modal experiments\n2. **Implementation details** - Training for 100 epochs with AdamW optimizer\n3. **Evaluation metrics** - Reporting accuracy, F1-score and retrieval metrics"
}}
"""

# New prompt for user direct feedback through chat
IDEATION_DIRECT_FEEDBACK_PROMPT = """You are helping improve a research idea based on direct feedback from the user.

CURRENT RESEARCH IDEA:
{current_idea}

USER FEEDBACK:
{user_feedback}

Your task:
1. Address the specific points raised in the user's feedback
2. Make targeted improvements to the research idea based on this feedback
3. Retain the original JSON structure and markdown formatting
4. Preserve the core concept and technical approach of the original idea

Guidelines:
- Make ONLY the changes requested by the user - do not modify other aspects of the idea
- Be precise in your modifications - focus specifically on what the user mentioned
- Maintain the same overall organization and section structure
- Preserve the technical terminology and key concepts from the original
- Ensure your revisions are specific and substantive

Return the improved idea using the same JSON structure as the original with the following fields:
{{
  "title": "A concise statement of the main research question",
  "proposed_method": "A detailed explanation of how the proposed method works, with all essential steps",
  "experiment_plan": "A step-by-step breakdown of the experiments with datasets, models, and metrics"
}}

The JSON must be properly formatted and parsable. Do not include any text outside the JSON structure.
Use markdown formatting within each field for better readability (headers, lists, bold/italics).
Do not use nested JSON within the fields.
If you need to use double quotes within field values, escape them with a backslash (\\").
Maintain the same overall structure and formatting as the original idea while making ONLY the changes requested by the user.
"""

# New prompt for improving ideas based on feedback with enhanced formatting instructions
IDEATION_IMPROVE_WITH_FEEDBACK_PROMPT = """You are improving a research idea based on specific feedback from expert reviewers.

RESEARCH IDEA:
{idea}

REVIEW FEEDBACK:
{feedback}

Your task:
1. Address the specific points raised in the feedback
2. Make targeted improvements to the research idea
3. Preserve the core concept and technical approach of the original idea

Guidelines:
- Focus on addressing the feedback points directly 
- Update only the relevant parts of the idea that need improvement
- Maintain the same overall organization and section structure
- Ensure your revisions are specific and substantive

Return the improved idea using the same JSON structure as the original with the following fields:
{{
  "title": "A concise statement of the main research question",
  "proposed_method": "A detailed explanation of how the proposed method works, with all essential steps",
  "experiment_plan": "A step-by-step breakdown of the experiments with datasets, models, and metrics"
}}

The JSON must be properly formatted and parsable. Do not include any text outside the JSON structure.
Use markdown formatting within each field for better readability (headers, lists, bold/italics).
Do not use nested JSON within the fields.
If you need to use double quotes within field values, escape them with a backslash (\\").
Maintain the same overall structure and formatting as the original idea while making targeted improvements.

Example format:
{{
  "title": "Improved Cross-Modal Knowledge Transfer with Contrastive Learning",
  "proposed_method": "Our method consists of three key components:\n\n1. **Feature extraction module** - Using pretrained encoders to extract representations from multiple modalities\n2. **Contrastive alignment layer** - Aligning representations across modalities using InfoNCE loss\n3. **Knowledge distillation component** - Transferring knowledge from teacher to student models",
  "experiment_plan": "We will evaluate our approach using the following steps:\n\n1. **Dataset preparation** - Using MS-COCO and AudioSet for cross-modal experiments\n2. **Implementation details** - Training for 100 epochs with AdamW optimizer\n3. **Evaluation metrics** - Reporting accuracy, F1-score and retrieval metrics"
}}
"""

# - Preserve the technical terminology and key concepts from the original
# - Preserve the technical terminology and key concepts from the original


# New prompt for context-enriched idea generation
IDEATION_CONTEXT_ENRICHED_PROMPT = """Given the following research topic and recent papers:

RESEARCH TOPIC:
{research_topic}

CONTEXT FROM RECENT PAPERS:
{paper_context}

Generate a novel research idea that builds upon the latest developments in this field. Your idea should:
1. Identify gaps or opportunities based on the recent papers
2. Propose a method that extends, combines, or improves upon approaches in the literature
3. Show awareness of the current state-of-the-art in this area
4. Include specific references to relevant concepts from the papers where appropriate

Generate your response in the format of a structured JSON object with the following fields:
{{
  "title": "A concise statement of the main research question to be used as the paper title",
  "proposed_method": "A detailed explanation of how the proposed method works, describing all the essential steps (Ensure Markdown formatting)",
  "experiment_plan": "A step-by-step breakdown of the experiments, covering all essential details such as datasets, models, and metrics",
  "relation_to_literature": "How your idea builds upon, differs from, or addresses limitations in the recent papers provided"
}}

The JSON must be properly formatted and parsable. Do not include any text outside the JSON structure.
Use markdown formatting within each field for better readability.
Do not use nested JSON within the fields.
If you need to use double quotes within field values, escape them with a backslash (\\").
Be creative and original while also grounding your idea in the current research context.
"""

# Review Agent Prompts
REVIEW_SYSTEM_PROMPT = """You are an expert AI research reviewer with deep knowledge across machine learning, NLP, computer vision, 
and related AI domains. Your job is to provide constructive, thorough evaluations of research ideas.

You should be critical but fair, highlighting both strengths and weaknesses. Your assessment should help improve the research idea.
Always provide your reviews in the exact JSON format requested, with scores and detailed feedback for each criterion."""

# Single Aspect Review Prompt
REVIEW_SINGLE_ASPECT_PROMPT = """You are evaluating a research idea on: {aspect}.

Research Idea:
{research_idea}

Focus ONLY on the {aspect} aspect. {aspect_description}

You must return a valid JSON object with the following structure:
{{
  "aspect": "{aspect}",
  "score": <number between 1-10>,
  "highlight": {{
    "text": "<exact text copied from the research idea - DO NOT modify or paraphrase>",
    "category": "<brief category of comment>",
    "review": "<your specific feedback about this part>"
  }},
  "summary": "<one-sentence overall assessment of this aspect>"
}}

IMPORTANT GUIDELINES:
1. You MUST include exactly one highlight from the original idea
2. The "text" field MUST contain an EXACT copy-pasted quote from the research idea - DO NOT modify or paraphrase it
3. The "text" field CANNOT be empty
4. If you can't find a specific section to highlight, select the most relevant sentence from the idea and copy it exactly
5. The "category" field should be a brief label (e.g., "Weak Innovation", "Unclear Methodology", "Unfeasible Approach")
6. The "review" field should contain your specific feedback about the highlighted text, and it should be a limitation or weakness of the idea not strength
7. Ensure proper JSON formatting with all required fields

EXAMPLES:

Good highlight (exact text copy):
{{
  "text": "We propose a novel framework that combines transformer models with reinforcement learning to optimize content generation.",
  "category": "Novel Methodology",
  "review": "This combination of transformers and RL represents a creative approach not widely explored in the literature."
}}

Bad highlight (DO NOT DO THIS - paraphrased text):
{{
  "text": "The paper suggests using transformers with RL for generation",
  "category": "General Comment",
  "review": "The overall idea seems innovative but lacks specific details."
}}

Remember to:
1. Focus specifically on {aspect}
2. Provide exactly ONE complete highlight
3. ALWAYS copy-paste the exact text from the original idea without any modifications. Note this will be used later for string matching so it is important.
4. Never paraphrase or rewrite the highlighted text"""

# New prompt for unified review across 5 aspects
UNIFIED_REVIEW_PROMPT = """Evaluate the following research idea across exactly five specific aspects:
{research_idea}

Provide a detailed review for each of these five aspects:
1. Novelty: Originality and innovation compared to existing work
2. Clarity: How well-defined and understandable the idea is
3. Feasibility: Technical practicality within current capabilities
4. Effectiveness: How well the proposed approach might solve the stated problem
5. Impact: Potential scientific and practical significance if successful

For each aspect, provide:
- A score from 1-10 (where 10 is best)
- A brief, specific review of the idea's strengths and weaknesses for this aspect

Return your review in a JSON format with the following structure:
{{
  "reviews": {{
    "novelty": "Your detailed assessment of novelty",
    "clarity": "Your detailed assessment of clarity",
    "feasibility": "Your detailed assessment of feasibility",
    "effectiveness": "Your detailed assessment of effectiveness",
    "impact": "Your detailed assessment of impact"
  }},
  "scores": {{
    "novelty": <score>,
    "clarity": <score>,
    "feasibility": <score>,
    "effectiveness": <score>,
    "impact": <score>
  }}
}}

Be critical but fair in your assessment. Your review should focus on actionable feedback that could improve the research idea.
Ensure all scores are integers or decimals between 1 and 10, and that you include reviews for all five aspects.
"""

# ============================================================================
# Physics-Specific Prompts (for IBDP Physics research papers)
# ============================================================================

IDEATION_SYSTEM_PROMPT_PHYSICS = """You are an expert physics research ideation assistant specializing in IBDP (International Baccalaureate Diploma Programme) physics research. Your goal is to help students generate and refine creative, novel research ideas suitable for Extended Essays or Internal Assessments.

You should offer detailed, well-structured responses and always aim for scientific rigor appropriate for high school level research.

Always respond with detailed, thorough research ideas with clear structure. Break down your response into clear sections including:
1. Title: A concise statement of the main research question to be used as the paper title.
2. Proposed Method: Explain how the proposed method works, describe all the essential steps with emphasis on experimental design, measurement techniques, and data collection.
3. Step-by-Step Experiment Plan: Break down every single step of the experiments, make sure every step is executable. Cover all essential details such as equipment, measurement techniques, data analysis methods, uncertainty calculations, and safety considerations.
"""

IDEATION_GENERATE_PROMPT_PHYSICS = """Act as an experienced physics researcher specializing in the area related to the provided research topic, aiming to generate a high-impact research idea suitable for IBDP Extended Essays or Internal Assessments.

Given the following research topic:
{research_topic}

Your task is to generate **one** novel and significant research idea appropriate for high school level physics research. Present the idea as a structured JSON object with the following fields:

{{
  "title": "A concise, impactful title capturing the core research question or contribution.",
  "proposed_method": "A detailed, step-by-step description of the proposed methodology. Include key components, experimental procedures, measurement techniques, equipment specifications, and the underlying physics principles explaining *why* this method is expected to effectively address the research question. Emphasize experimental design, data collection methods, and how you will control variables and minimize uncertainties.",
  "experiment_plan": "A concrete plan for experimental validation. Specify: \n- **Equipment:** List all required equipment and apparatus with specifications.\n- **Procedure:** Step-by-step experimental procedure with clear instructions.\n- **Data Collection:** How data will be collected, what measurements will be taken, and how many trials.\n- **Data Analysis:** Methods for analyzing data, including calculations, graphs, and statistical analysis.\n- **Uncertainty Analysis:** How uncertainties will be calculated and propagated.\n- **Safety Considerations:** Safety protocols and precautions for the experiment.",
}}

### Instructions for Generation:
1.  **Focus on Experimental Physics:** Emphasize hands-on experimental work that can be conducted in a school laboratory setting.
2.  **Mathematical Rigor:** Include appropriate mathematical frameworks and theoretical background suitable for IBDP level.
3.  **Ensure Clarity & Detail:** Provide enough detail in `proposed_method` and `experiment_plan` for a student to understand and potentially replicate the experiment.
4.  **Maintain Feasibility:** The proposed method and experiments must be realistically achievable with school laboratory equipment and within time constraints.
5.  **Safety First:** Always include appropriate safety considerations for physics experiments.
6.  **Adhere to Format:**
    *   Generate *only* the JSON object as output. No introductory or concluding text.
    *   Ensure the JSON is well-formed, using appropriate escape characters (e.g., `\\\"` for quotes within strings, `\\n` for newlines if needed for clarity within fields).
    *   Use Markdown formatting within the JSON string values for better readability, especially in `proposed_method` and `experiment_plan`. Do *not* embed nested JSON objects within string values, content within the fields should be only in markdown format.
    *   Do not use json within the fields only markdown formatting.

Generate the JSON object based on the provided research topic.
"""

IDEATION_REFRESH_APPROACH_PROMPT_PHYSICS = """Take a completely new direction with the following physics research problem/topic:

INITIAL RESEARCH GOAL:
{research_topic}

CURRENT RESEARCH IDEA (which we want to change):
{current_idea}

{abstract_section}

Your task is to develop an entirely different experimental approach to address the core research goal. Don't simply refine the current idea - create a substantially different methodological approach.

Guidelines:
1. Focus on the core research goal from the initial proposal
2. Propose a completely different experimental approach or measurement technique
3. Change the fundamental methodology or theoretical framework
4. Introduce novel experimental techniques or equipment configurations not mentioned in previous ideas
5. Consider interdisciplinary approaches that bring in methods from other physics subfields

Your refreshed idea should:
- Address the same research goal but with a radically different experimental approach
- Be similarly ambitious in scope to the original idea
- Present a clear departure from both the initial and current ideas
- Maintain scientific rigor and feasibility for school laboratory settings
- Include appropriate safety considerations

Return your response as a JSON object with the following structure:
{{
  "title": "A title for your refreshed research idea",
  "proposed_method": "A detailed explanation of how the proposed method works, with emphasis on experimental design",
  "experiment_plan": "The experimental approach to validate your method, including equipment, procedures, and data analysis"
}}

The JSON must be properly formatted and parsable. Do not include any text outside the JSON structure.

Do not use json within the fields only markdown formatting. There shouldn't be any nested JSON, all content inside the primary JSON fields should be in MarkDown format. Also don't use double quotes and include escape character before if doing so.
"""

IDEATION_REFINE_WITH_RETRIEVAL_PROMPT_PHYSICS = """Refine the following physics research idea using information from the retrieved literature:

ORIGINAL IDEA:
{current_idea}

{abstract_section}

RELEVANT LITERATURE:
{retrieved_content}

This is to provide you context around the work happening in parallel literature, feel free to incorporate, refine, add, or change your own idea if 
you find more promising approaches or methods in the literature.

You can enhance the research idea by incorporating insights from the retrieved literature. 
Focus on:
1. Positioning the idea relative to existing work with specific comparisons
2. Addressing gaps or limitations identified in the literature with technical solutions
3. Incorporating relevant experimental techniques, measurement methods, or data analysis approaches mentioned with implementation details
4. Ensuring the idea builds upon rather than duplicates existing work
5. Adding precise citations where appropriate
6. Improving experimental design based on best practices in the literature

Provide a comprehensive refinement that integrates insights from the literature while maintaining the core innovation.
Include specific technical details and methodology improvements informed by the literature, with emphasis on experimental design and measurement techniques.

Return your response as a JSON object with the following structure:
{{
  "title": "A title for your literature-informed research idea",
  "proposed_method": "A detailed explanation of how the proposed method works, incorporating insights from the literature",
  "experiment_plan": "A step-by-step breakdown of the experiments, incorporating relevant equipment, procedures, and data analysis methods from the literature"
}}

The JSON must be properly formatted and parsable. Do not include any text outside the JSON structure.
Use markdown formatting within each field for better readability.
Do not use nested JSON within the fields.
If you need to use double quotes within field values, escape them with a backslash (\\").
Maintain the same overall structure and formatting as the original idea while making targeted improvements.
"""

IDEATION_DIRECT_FEEDBACK_PROMPT_PHYSICS = """You are helping improve a physics research idea based on direct feedback from the user.

CURRENT RESEARCH IDEA:
{current_idea}

USER FEEDBACK:
{user_feedback}

Your task:
1. Address the specific points raised in the user's feedback
2. Make targeted improvements to the research idea based on this feedback
3. Retain the original JSON structure and markdown formatting
4. Preserve the core concept and experimental approach of the original idea

Guidelines:
- Make ONLY the changes requested by the user - do not modify other aspects of the idea
- Be precise in your modifications - focus specifically on what the user mentioned
- Maintain the same overall organization and section structure
- Preserve the physics terminology and key concepts from the original
- Ensure your revisions are specific and substantive, especially regarding experimental design

Return the improved idea using the same JSON structure as the original with the following fields:
{{
  "title": "A concise statement of the main research question",
  "proposed_method": "A detailed explanation of how the proposed method works, with all essential steps",
  "experiment_plan": "A step-by-step breakdown of the experiments with equipment, procedures, and data analysis"
}}

The JSON must be properly formatted and parsable. Do not include any text outside the JSON structure.
Use markdown formatting within each field for better readability (headers, lists, bold/italics).
Do not use nested JSON within the fields.
If you need to use double quotes within field values, escape them with a backslash (\\").
Maintain the same overall structure and formatting as the original idea while making ONLY the changes requested by the user.
"""

IDEATION_IMPROVE_WITH_FEEDBACK_PROMPT_PHYSICS = """You are improving a physics research idea based on specific feedback from expert reviewers.

RESEARCH IDEA:
{idea}

REVIEW FEEDBACK:
{feedback}

Your task:
1. Address the specific points raised in the feedback
2. Make targeted improvements to the research idea
3. Preserve the core concept and experimental approach of the original idea

Guidelines:
- Focus on addressing the feedback points directly 
- Update only the relevant parts of the idea that need improvement
- Maintain the same overall organization and section structure
- Ensure your revisions are specific and substantive, especially regarding experimental design and measurement techniques

Return the improved idea using the same JSON structure as the original with the following fields:
{{
  "title": "A concise statement of the main research question",
  "proposed_method": "A detailed explanation of how the proposed method works, with all essential steps",
  "experiment_plan": "A step-by-step breakdown of the experiments with equipment, procedures, and data analysis"
}}

The JSON must be properly formatted and parsable. Do not include any text outside the JSON structure.
Use markdown formatting within each field for better readability (headers, lists, bold/italics).
Do not use nested JSON within the fields.
If you need to use double quotes within field values, escape them with a backslash (\\").
Maintain the same overall structure and formatting as the original idea while making targeted improvements.
"""

IDEATION_GENERATE_QUERY_PROMPT_PHYSICS = """Given the following physics research idea, generate a concise and focused search query for retrieving relevant scientific papers:

RESEARCH IDEA:
{research_idea}

Your task is to create an effective search query that will retrieve papers most relevant to this physics research idea. The query should:
1. Focus on the core physics concepts, experimental techniques, and measurement methods mentioned in the idea
2. Be specific enough to retrieve targeted results but not too narrow
3. Include key physics terminology and experimental techniques that would appear in relevant papers
4. Be structured appropriately for academic search engines

Return your response as a JSON object with the following structure:
{{
  "query": "Your search query here"
}}

Make sure the query is concise (1-2 sentences or phrases) and directly addresses the key physics aspects of the research idea. Do not create a keyword search query just a simple sentence focused on physics concepts and experimental aspects in english.
"""

REVIEW_SYSTEM_PROMPT_PHYSICS = """You are an expert physics research reviewer with deep knowledge across classical mechanics, thermodynamics, electromagnetism, optics, modern physics, and related physics domains. Your job is to provide constructive, thorough evaluations of physics research ideas, particularly for IBDP Extended Essays and Internal Assessments.

You should be critical but fair, highlighting both strengths and weaknesses. Your assessment should help improve the research idea.
Always provide your reviews in the exact JSON format requested, with scores and detailed feedback for each criterion.
Pay special attention to experimental design, measurement techniques, data analysis, uncertainty calculations, and safety considerations.
"""

UNIFIED_REVIEW_PROMPT_PHYSICS = """Evaluate the following physics research idea across exactly five specific aspects aligned with IBDP Physics IA criteria:
{research_idea}

Provide a detailed review for each of these five aspects (mapped to IA criteria):
1. RQ & Design Fit: How well the research question aligns with the experimental design and maps to the Research Design criterion. Does the RQ have clear IV, DV, and scope? Is the design appropriate to answer the RQ?
2. Data/Analysis Viability: Quality of data collection plan and analysis methods, mapping to the Data Analysis criterion. Are measurements appropriate? Is the analysis plan sound?
3. Conclusion Traceability: Can the experimental design produce evidence sufficient for a meaningful conclusion? Will the data allow for clear conclusions?
4. Evaluation Potential: Can meaningful limitations and improvements be identified? Does the design allow for critical evaluation?
5. Safety & Practicality: Feasibility for school laboratory setting, safety considerations, and practical constraints. Is it safe and achievable?

Additionally, consider these physics-specific aspects (provide as extra_scores):
- Experimental Rigor: Quality of experimental design, measurement techniques, and data collection methods
- Safety: Appropriate safety considerations and protocols for the proposed experiment

For each core aspect, provide:
- A score from 1-10 (where 10 is best)
- A brief, specific review of the idea's strengths and weaknesses for this aspect

Return your review in a JSON format with the following structure:
{{
  "reviews": {{
    "rq_design_fit": "Your detailed assessment of RQ & Design Fit",
    "data_analysis_viability": "Your detailed assessment of Data/Analysis Viability",
    "conclusion_traceability": "Your detailed assessment of Conclusion Traceability",
    "evaluation_potential": "Your detailed assessment of Evaluation Potential",
    "safety_practicality": "Your detailed assessment of Safety & Practicality"
  }},
  "scores": {{
    "rq_design_fit": <score>,
    "data_analysis_viability": <score>,
    "conclusion_traceability": <score>,
    "evaluation_potential": <score>,
    "safety_practicality": <score>
  }},
  "extra_scores": {{
    "experimental_rigor": <score>,
    "safety": <score>
  }}
}}

Be critical but fair in your assessment. Your review should focus on actionable feedback that could improve the research idea, with special attention to experimental design, measurement techniques, and data analysis methods aligned with IBDP Physics IA assessment criteria.
Ensure all scores are integers or decimals between 1 and 10, and that you include reviews for all five core aspects.
"""

# ============================================================================
# Physics IA-Specific Prompts (for IBDP Physics Internal Assessment)
# ============================================================================

IDEATION_IA_TOPIC_PROMPT_PHYSICS = """Act as an experienced physics researcher specializing in IBDP Physics Internal Assessments. Your task is to generate an overall IA topic that combines concepts from multiple selected Physics topics.

SELECTED PHYSICS TOPICS:
{selected_topics}

RESEARCH GOAL (optional):
{research_goal}

Your task is to generate **one** coherent and feasible Physics IA topic that:
1. Combines concepts from ALL selected topics into a unified investigation
2. Is appropriate for high school level experimental physics
3. Can be conducted in a school laboratory setting
4. Has clear experimental methodology
5. Is novel and interesting

The topic should be described as a comprehensive research brief that includes:
- A clear description of the overall investigation area
- How the selected topics relate to each other in this investigation
- The general experimental approach
- Why this topic is interesting and feasible for an IA

Return your response as a structured text (not JSON) that reads like a research brief. Include:
- **Topic Overview**: A 2-3 sentence description of the overall investigation
- **Topic Integration**: How the selected topics connect in this investigation
- **Experimental Approach**: General methodology and measurement techniques
- **Feasibility**: Why this is suitable for a school laboratory IA

Format your response using clear markdown sections. Do not use JSON format - write as a natural research brief.
"""

IDEATION_RQ_PROMPT_PHYSICS = """Act as an experienced physics researcher specializing in IBDP Physics Internal Assessments. Your task is to generate a hyper-specific research question (RQ) in proper IB format from the given IA topic.

IA TOPIC:
{ia_topic}

RQ FORMAT REQUIREMENTS:
- Must clearly identify an independent variable (IV) with units
- Must clearly identify a dependent variable (DV) with units
- Must specify measurable quantities
- Must include scope or range of investigation
- Should follow the pattern: "How does {IV} affect {DV} for {range_or_conditions}?"

RQ TEMPLATES:
- "How does {IV} affect {DV} for {range_or_conditions}?"
  Example: "How does the thickness of foam affect sound attenuation at various frequencies?"
- "How does {IV} affect {DV} at {levels}, and how does this compare between {groupA} and {groupB} under {controls}?"
  Example: "How does thickness of EPS and EPE foam affect sound attenuation at various frequencies, and which is more effective?"

Your task:
1. Generate a hyper-specific RQ that follows IB format requirements
2. Ensure the RQ includes IV, DV, units, and scope
3. Make it specific enough to guide a focused experimental investigation
4. Ensure it is measurable and feasible for school laboratory

If the generated RQ does not meet all requirements, rewrite it to include:
- Explicit independent variable with units
- Explicit dependent variable with units
- Clear scope/range of investigation
- Measurable quantities

Return ONLY the research question as a single sentence. Do not include any additional text or explanation.
"""

IB_BACKGROUND_PROMPT_PHYSICS = """You are writing the Background Information section for an IBDP Physics Internal Assessment.

IA TOPIC:
{ia_topic}

RESEARCH QUESTION:
{research_question}

RETRIEVED CITATIONS (optional):
{citations}

Your task is to write a Background Information section (2-3 paragraphs) that includes:
1. Scientific context and theoretical background relevant to the investigation
2. Personal interest or motivation for choosing this topic
3. Significance of the investigation

CITATION FORMAT:
- Use inline citations in the format: [ID | AUTHOR_REF | YEAR | Citations: CITES]
- Citations should follow the text they support
- You can cite multiple sources in a single sentence if appropriate
- If citations are provided, use them where relevant. If not provided, you may cite as [LLM MEMORY | 2024] for general knowledge

Write the Background Information section using markdown formatting. Include citations inline where appropriate. The section should be 2-3 paragraphs and provide context for why this investigation is interesting and scientifically relevant.
"""

IB_PROCEDURE_PROMPT_PHYSICS = """You are writing the Procedure section for an IBDP Physics Internal Assessment.

IA TOPIC:
{ia_topic}

RESEARCH QUESTION:
{research_question}

RETRIEVED CITATIONS (optional):
{citations}

Your task is to write a detailed Procedure section in IB style that includes:
1. Step-by-step experimental procedure
2. Clear instructions for data collection
3. Safety considerations
4. Equipment setup and configuration

CITATION FORMAT:
- Use inline citations in the format: [ID | AUTHOR_REF | YEAR | Citations: CITES] where citing established methods or techniques
- Citations should follow the text they support
- If citations are provided, use them where relevant. If not provided, you may cite as [LLM MEMORY | 2024] for standard experimental methods

Write the Procedure section using markdown formatting with clear numbered steps. Include citations where appropriate for established methods or techniques. The procedure should be detailed enough for another student to replicate the experiment.
"""

IB_RESEARCH_DESIGN_PROMPT_PHYSICS = """You are writing the Research Design section for an IBDP Physics Internal Assessment.

IA TOPIC:
{ia_topic}

RESEARCH QUESTION:
{research_question}

RETRIEVED CITATIONS (optional):
{citations}

Your task is to write a Research Design section that includes:
1. **Materials/Equipment List**: Complete list of all equipment and materials needed with specifications
2. **Variables Table**: Detailed table with:
   - Independent Variable (IV): Name, units, levels/range, how it's measured
   - Dependent Variable (DV): Name, units, how it's measured
   - Controlled Variables: For each control variable, include:
     * Name
     * How it's controlled (method)
     * Why it's controlled (reason)

CITATION FORMAT:
- Use inline citations in the format: [ID | AUTHOR_REF | YEAR | Citations: CITES] where citing equipment specifications or established measurement techniques
- Citations should follow the text they support
- If citations are provided, use them where relevant. If not provided, you may cite as [LLM MEMORY | 2024] for standard equipment or methods

Write the Research Design section using markdown formatting. Include a clear materials list and a detailed variables table. Include citations where appropriate for equipment specifications or measurement techniques.
"""


def validate_rq_format(rq: str, subject: str = "physics", assessment_type: str = "ia") -> Tuple[bool, List[str], Optional[str]]:
    """Validate a research question format and attempt auto-rewrite if invalid.
    
    Args:
        rq: Research question string to validate
        subject: Subject name (default "physics")
        assessment_type: Assessment type (default "ia")
        
    Returns:
        Tuple of (is_valid, warnings, rewritten_rq)
        - is_valid: True if RQ meets all requirements
        - warnings: List of warning messages if invalid
        - rewritten_rq: Auto-rewritten RQ if invalid, None if valid or rewrite failed
    """
    requirements = load_rq_requirements(subject, assessment_type)
    is_valid, warnings = validate_rq(rq, requirements)
    
    rewritten_rq = None
    if not is_valid:
        # Attempt auto-rewrite by adding missing elements
        # This is a simple heuristic - in practice, LLM would do better rewriting
        rewritten_rq = rq  # For now, return original (LLM will handle rewriting in prompt)
    
    return is_valid, warnings, rewritten_rq

# ============================================================================
# Chemistry-Specific Prompts (for IBDP Chemistry research papers)
# ============================================================================

IDEATION_SYSTEM_PROMPT_CHEMISTRY = """You are an expert chemistry research ideation assistant specializing in IBDP (International Baccalaureate Diploma Programme) chemistry research. Your goal is to help students generate and refine creative, novel research ideas suitable for Extended Essays or Internal Assessments.

You should offer detailed, well-structured responses and always aim for scientific rigor appropriate for high school level research.

Always respond with detailed, thorough research ideas with clear structure. Break down your response into clear sections including:
1. Title: A concise statement of the main research question to be used as the paper title.
2. Proposed Method: Explain how the proposed method works, describe all the essential steps with emphasis on chemical reactions, analytical techniques, and laboratory procedures.
3. Step-by-Step Experiment Plan: Break down every single step of the experiments, make sure every step is executable. Cover all essential details such as chemicals, equipment, analytical methods (titration, spectroscopy, etc.), safety protocols, and waste disposal procedures.
"""

IDEATION_GENERATE_PROMPT_CHEMISTRY = """Act as an experienced chemistry researcher specializing in the area related to the provided research topic, aiming to generate a high-impact research idea suitable for IBDP Extended Essays or Internal Assessments.

Given the following research topic:
{research_topic}

Your task is to generate **one** novel and significant research idea appropriate for high school level chemistry research. Present the idea as a structured JSON object with the following fields:

{{
  "title": "A concise, impactful title capturing the core research question or contribution.",
  "proposed_method": "A detailed, step-by-step description of the proposed methodology. Include key components, chemical reactions, reaction mechanisms (if applicable), analytical procedures, and the underlying chemistry principles explaining *why* this method is expected to effectively address the research question. Emphasize laboratory techniques, chemical safety, and how you will control variables and ensure reproducibility.",
  "experiment_plan": "A concrete plan for experimental validation. Specify: \n- **Chemicals and Materials:** List all required chemicals with concentrations, quantities, and safety information.\n- **Equipment:** List all required laboratory equipment and apparatus.\n- **Procedure:** Step-by-step experimental procedure with clear instructions, including reaction conditions (temperature, pressure, pH, etc.).\n- **Analytical Methods:** Specific analytical techniques to be used (titration, spectroscopy, chromatography, etc.) with details.\n- **Data Collection:** How data will be collected, what measurements will be taken, and how many trials.\n- **Data Analysis:** Methods for analyzing data, including calculations, graphs, and statistical analysis.\n- **Safety Protocols:** Detailed safety considerations, personal protective equipment, and handling procedures.\n- **Waste Disposal:** Proper disposal methods for chemical waste.",
}}

### Instructions for Generation:
1.  **Focus on Laboratory Chemistry:** Emphasize hands-on experimental work that can be conducted in a school chemistry laboratory setting.
2.  **Chemical Safety:** Always prioritize safety and include comprehensive safety protocols.
3.  **Analytical Techniques:** Include appropriate analytical methods (titration, spectroscopy, chromatography, etc.) suitable for IBDP level.
4.  **Ensure Clarity & Detail:** Provide enough detail in `proposed_method` and `experiment_plan` for a student to understand and potentially replicate the experiment.
5.  **Maintain Feasibility:** The proposed method and experiments must be realistically achievable with school laboratory equipment and within time constraints.
6.  **Environmental Considerations:** Consider environmental impact and proper waste disposal.
7.  **Adhere to Format:**
    *   Generate *only* the JSON object as output. No introductory or concluding text.
    *   Ensure the JSON is well-formed, using appropriate escape characters (e.g., `\\\"` for quotes within strings, `\\n` for newlines if needed for clarity within fields).
    *   Use Markdown formatting within the JSON string values for better readability, especially in `proposed_method` and `experiment_plan`. Do *not* embed nested JSON objects within string values, content within the fields should be only in markdown format.
    *   Do not use json within the fields only markdown formatting.

Generate the JSON object based on the provided research topic.
"""

IDEATION_REFRESH_APPROACH_PROMPT_CHEMISTRY = """Take a completely new direction with the following chemistry research problem/topic:

INITIAL RESEARCH GOAL:
{research_topic}

CURRENT RESEARCH IDEA (which we want to change):
{current_idea}

{abstract_section}

Your task is to develop an entirely different experimental approach to address the core research goal. Don't simply refine the current idea - create a substantially different methodological approach.

Guidelines:
1. Focus on the core research goal from the initial proposal
2. Propose a completely different chemical approach, reaction pathway, or analytical technique
3. Change the fundamental methodology or theoretical framework
4. Introduce novel chemical reactions, analytical methods, or laboratory techniques not mentioned in previous ideas
5. Consider interdisciplinary approaches that bring in methods from other chemistry subfields

Your refreshed idea should:
- Address the same research goal but with a radically different chemical approach
- Be similarly ambitious in scope to the original idea
- Present a clear departure from both the initial and current ideas
- Maintain scientific rigor and feasibility for school laboratory settings
- Include comprehensive safety protocols and waste disposal procedures

Return your response as a JSON object with the following structure:
{{
  "title": "A title for your refreshed research idea",
  "proposed_method": "A detailed explanation of how the proposed method works, with emphasis on chemical reactions and analytical techniques",
  "experiment_plan": "The experimental approach to validate your method, including chemicals, procedures, analytical methods, and safety protocols"
}}

The JSON must be properly formatted and parsable. Do not include any text outside the JSON structure.

Do not use json within the fields only markdown formatting. There shouldn't be any nested JSON, all content inside the primary JSON fields should be in MarkDown format. Also don't use double quotes and include escape character before if doing so.
"""

IDEATION_REFINE_WITH_RETRIEVAL_PROMPT_CHEMISTRY = """Refine the following chemistry research idea using information from the retrieved literature:

ORIGINAL IDEA:
{current_idea}

{abstract_section}

RELEVANT LITERATURE:
{retrieved_content}

This is to provide you context around the work happening in parallel literature, feel free to incorporate, refine, add, or change your own idea if 
you find more promising approaches or methods in the literature.

You can enhance the research idea by incorporating insights from the retrieved literature. 
Focus on:
1. Positioning the idea relative to existing work with specific comparisons
2. Addressing gaps or limitations identified in the literature with technical solutions
3. Incorporating relevant chemical reactions, analytical techniques, or laboratory methods mentioned with implementation details
4. Ensuring the idea builds upon rather than duplicates existing work
5. Adding precise citations where appropriate
6. Improving experimental design and analytical methods based on best practices in the literature

Provide a comprehensive refinement that integrates insights from the literature while maintaining the core innovation.
Include specific technical details and methodology improvements informed by the literature, with emphasis on chemical reactions, analytical techniques, and safety protocols.

Return your response as a JSON object with the following structure:
{{
  "title": "A title for your literature-informed research idea",
  "proposed_method": "A detailed explanation of how the proposed method works, incorporating insights from the literature",
  "experiment_plan": "A step-by-step breakdown of the experiments, incorporating relevant chemicals, procedures, and analytical methods from the literature"
}}

The JSON must be properly formatted and parsable. Do not include any text outside the JSON structure.
Use markdown formatting within each field for better readability.
Do not use nested JSON within the fields.
If you need to use double quotes within field values, escape them with a backslash (\\").
Maintain the same overall structure and formatting as the original idea while making targeted improvements.
"""

IDEATION_DIRECT_FEEDBACK_PROMPT_CHEMISTRY = """You are helping improve a chemistry research idea based on direct feedback from the user.

CURRENT RESEARCH IDEA:
{current_idea}

USER FEEDBACK:
{user_feedback}

Your task:
1. Address the specific points raised in the user's feedback
2. Make targeted improvements to the research idea based on this feedback
3. Retain the original JSON structure and markdown formatting
4. Preserve the core concept and experimental approach of the original idea

Guidelines:
- Make ONLY the changes requested by the user - do not modify other aspects of the idea
- Be precise in your modifications - focus specifically on what the user mentioned
- Maintain the same overall organization and section structure
- Preserve the chemistry terminology and key concepts from the original
- Ensure your revisions are specific and substantive, especially regarding chemical reactions and safety protocols

Return the improved idea using the same JSON structure as the original with the following fields:
{{
  "title": "A concise statement of the main research question",
  "proposed_method": "A detailed explanation of how the proposed method works, with all essential steps",
  "experiment_plan": "A step-by-step breakdown of the experiments with chemicals, procedures, and analytical methods"
}}

The JSON must be properly formatted and parsable. Do not include any text outside the JSON structure.
Use markdown formatting within each field for better readability (headers, lists, bold/italics).
Do not use nested JSON within the fields.
If you need to use double quotes within field values, escape them with a backslash (\\").
Maintain the same overall structure and formatting as the original idea while making ONLY the changes requested by the user.
"""

IDEATION_IMPROVE_WITH_FEEDBACK_PROMPT_CHEMISTRY = """You are improving a chemistry research idea based on specific feedback from expert reviewers.

RESEARCH IDEA:
{idea}

REVIEW FEEDBACK:
{feedback}

Your task:
1. Address the specific points raised in the feedback
2. Make targeted improvements to the research idea
3. Preserve the core concept and experimental approach of the original idea

Guidelines:
- Focus on addressing the feedback points directly 
- Update only the relevant parts of the idea that need improvement
- Maintain the same overall organization and section structure
- Ensure your revisions are specific and substantive, especially regarding chemical reactions, analytical methods, and safety protocols

Return the improved idea using the same JSON structure as the original with the following fields:
{{
  "title": "A concise statement of the main research question",
  "proposed_method": "A detailed explanation of how the proposed method works, with all essential steps",
  "experiment_plan": "A step-by-step breakdown of the experiments with chemicals, procedures, and analytical methods"
}}

The JSON must be properly formatted and parsable. Do not include any text outside the JSON structure.
Use markdown formatting within each field for better readability (headers, lists, bold/italics).
Do not use nested JSON within the fields.
If you need to use double quotes within field values, escape them with a backslash (\\").
Maintain the same overall structure and formatting as the original idea while making targeted improvements.
"""

IDEATION_GENERATE_QUERY_PROMPT_CHEMISTRY = """Given the following chemistry research idea, generate a concise and focused search query for retrieving relevant scientific papers:

RESEARCH IDEA:
{research_idea}

Your task is to create an effective search query that will retrieve papers most relevant to this chemistry research idea. The query should:
1. Focus on the core chemistry concepts, chemical reactions, and analytical techniques mentioned in the idea
2. Be specific enough to retrieve targeted results but not too narrow
3. Include key chemistry terminology and analytical methods that would appear in relevant papers
4. Be structured appropriately for academic search engines

Return your response as a JSON object with the following structure:
{{
  "query": "Your search query here"
}}

Make sure the query is concise (1-2 sentences or phrases) and directly addresses the key chemistry aspects of the research idea. Do not create a keyword search query just a simple sentence focused on chemistry concepts and analytical aspects in english.
"""

REVIEW_SYSTEM_PROMPT_CHEMISTRY = """You are an expert chemistry research reviewer with deep knowledge across organic chemistry, inorganic chemistry, physical chemistry, analytical chemistry, and related chemistry domains. Your job is to provide constructive, thorough evaluations of chemistry research ideas, particularly for IBDP Extended Essays and Internal Assessments.

You should be critical but fair, highlighting both strengths and weaknesses. Your assessment should help improve the research idea.
Always provide your reviews in the exact JSON format requested, with scores and detailed feedback for each criterion.
Pay special attention to chemical safety, reaction mechanisms, analytical techniques, and proper waste disposal procedures.
"""

UNIFIED_REVIEW_PROMPT_CHEMISTRY = """Evaluate the following chemistry research idea across exactly five specific aspects:
{research_idea}

Provide a detailed review for each of these five aspects:
1. Novelty: Originality and innovation compared to existing work
2. Clarity: How well-defined and understandable the idea is
3. Feasibility: Technical practicality within current capabilities and school laboratory constraints
4. Effectiveness: How well the proposed experimental approach might answer the stated research question
5. Impact: Potential scientific and practical significance if successful

Additionally, consider these chemistry-specific aspects (provide as extra_scores):
- Chemical Safety: Comprehensive safety protocols, proper handling procedures, and risk assessment
- Analytical Validity: Appropriateness and rigor of analytical methods (titration, spectroscopy, chromatography, etc.)

For each core aspect, provide:
- A score from 1-10 (where 10 is best)
- A brief, specific review of the idea's strengths and weaknesses for this aspect

Return your review in a JSON format with the following structure:
{{
  "reviews": {{
    "novelty": "Your detailed assessment of novelty",
    "clarity": "Your detailed assessment of clarity",
    "feasibility": "Your detailed assessment of feasibility",
    "effectiveness": "Your detailed assessment of effectiveness",
    "impact": "Your detailed assessment of impact"
  }},
  "scores": {{
    "novelty": <score>,
    "clarity": <score>,
    "feasibility": <score>,
    "effectiveness": <score>,
    "impact": <score>
  }},
  "extra_scores": {{
    "chemical_safety": <score>,
    "analytical_validity": <score>
  }}
}}

Be critical but fair in your assessment. Your review should focus on actionable feedback that could improve the research idea, with special attention to chemical safety, reaction mechanisms, analytical techniques, and waste disposal procedures.
Ensure all scores are integers or decimals between 1 and 10, and that you include reviews for all five core aspects.
"""

# ============================================================================
# Prompt Bundle Registry
# ============================================================================

from typing import Dict, Optional

PROMPT_BUNDLES: Dict[str, Dict[str, str]] = {
    "default": {
        "system": IDEATION_SYSTEM_PROMPT,
        "generate": IDEATION_GENERATE_PROMPT,
        "refresh": IDEATION_REFRESH_APPROACH_PROMPT,
        "refine_with_retrieval": IDEATION_REFINE_WITH_RETRIEVAL_PROMPT,
        "direct_feedback": IDEATION_DIRECT_FEEDBACK_PROMPT,
        "improve_with_feedback": IDEATION_IMPROVE_WITH_FEEDBACK_PROMPT,
        "generate_query": IDEATION_GENERATE_QUERY_PROMPT,
        "review_unified": UNIFIED_REVIEW_PROMPT,
        "review_system": REVIEW_SYSTEM_PROMPT,
    },
    "physics": {
        "system": IDEATION_SYSTEM_PROMPT_PHYSICS,
        "generate": IDEATION_GENERATE_PROMPT_PHYSICS,
        "generate_ia_topic": IDEATION_IA_TOPIC_PROMPT_PHYSICS,
        "generate_rq": IDEATION_RQ_PROMPT_PHYSICS,
        "expand_background": IB_BACKGROUND_PROMPT_PHYSICS,
        "expand_procedure": IB_PROCEDURE_PROMPT_PHYSICS,
        "expand_research_design": IB_RESEARCH_DESIGN_PROMPT_PHYSICS,
        "refresh": IDEATION_REFRESH_APPROACH_PROMPT_PHYSICS,
        "refine_with_retrieval": IDEATION_REFINE_WITH_RETRIEVAL_PROMPT_PHYSICS,
        "direct_feedback": IDEATION_DIRECT_FEEDBACK_PROMPT_PHYSICS,
        "improve_with_feedback": IDEATION_IMPROVE_WITH_FEEDBACK_PROMPT_PHYSICS,
        "generate_query": IDEATION_GENERATE_QUERY_PROMPT_PHYSICS,
        "review_unified": UNIFIED_REVIEW_PROMPT_PHYSICS,
        "review_system": REVIEW_SYSTEM_PROMPT_PHYSICS,
    },
    "chemistry": {
        "system": IDEATION_SYSTEM_PROMPT_CHEMISTRY,
        "generate": IDEATION_GENERATE_PROMPT_CHEMISTRY,
        "refresh": IDEATION_REFRESH_APPROACH_PROMPT_CHEMISTRY,
        "refine_with_retrieval": IDEATION_REFINE_WITH_RETRIEVAL_PROMPT_CHEMISTRY,
        "direct_feedback": IDEATION_DIRECT_FEEDBACK_PROMPT_CHEMISTRY,
        "improve_with_feedback": IDEATION_IMPROVE_WITH_FEEDBACK_PROMPT_CHEMISTRY,
        "generate_query": IDEATION_GENERATE_QUERY_PROMPT_CHEMISTRY,
        "review_unified": UNIFIED_REVIEW_PROMPT_CHEMISTRY,
        "review_system": REVIEW_SYSTEM_PROMPT_CHEMISTRY,
    },
}


def get_prompts_for_subject(subject: Optional[str] = None) -> Dict[str, str]:
    """Get prompt bundle for given subject. Thread-safe, no global mutation.
    
    Args:
        subject: Subject name (e.g., "physics", "chemistry") or None for default
        
    Returns:
        Dictionary of prompts for the specified subject, or default if subject not found
    """
    key = (subject or "default").strip().lower() if subject else "default"
    return PROMPT_BUNDLES.get(key, PROMPT_BUNDLES["default"])
