# Prompts and Metrics Documentation

## ⚠️ ACTUALLY USED vs AVAILABLE

This document shows which prompts are **ACTUALLY USED** in the system vs which are just defined but not used.

---

## 1. Idea Creation Prompts

### Location: `src/agents/prompts.py`

### Main Prompts:

#### **IDEATION_SYSTEM_PROMPT** (Lines 4-13)
- **Purpose**: System-level instructions for the ideation agent
- **Location**: `src/agents/prompts.py:4-13`
- **Key Instructions**:
  - Generate detailed, well-structured research ideas
  - Include: Title, Proposed Method, Step-by-Step Experiment Plan
  - Cover datasets, models, and metrics

#### **IDEATION_GENERATE_PROMPT** (Lines 113-138) - **PRIMARY IDEA GENERATION PROMPT** ✅ **ACTIVELY USED**
- **Purpose**: Main prompt for generating new research ideas
- **Location**: `src/agents/prompts.py:113-138`
- **Format**: JSON with fields:
  - `title`: Research question/title
  - `proposed_method`: Detailed methodology with steps
  - `experiment_plan`: Datasets, baselines, metrics, ablation studies
- **Used by**: 
  - Initial idea generation from research topic (`action == "generate"` in `app.py:915`)
  - Called via `ideation_agent.execute_action("generate", ...)` in `ideation.py:388-394`

#### **IDEATION_REFRESH_APPROACH_PROMPT** (Lines 169-204) ✅ **ACTIVELY USED**
- **Purpose**: Generate a completely different approach to the same research goal
- **Location**: `src/agents/prompts.py:169-204`
- **Used by**: 
  - "Refresh Idea" button/action (`action == "refresh_idea"` in `app.py:1181`)
  - MCTS exploration (`action == "refresh_idea"` in `app.py:1364`)
  - Called via `ideation_agent.execute_action("refresh_idea", ...)` in `ideation.py:405-415`

#### **IDEATION_REFINE_WITH_RETRIEVAL_PROMPT** (Lines 206-249) ✅ **ACTIVELY USED**
- **Purpose**: Refine idea using retrieved literature
- **Location**: `src/agents/prompts.py:206-249`
- **Used by**: 
  - MCTS `retrieve_and_refine` action (`app.py:1068`, `app.py:1306`)
  - Called via `ideation_agent.execute_action("retrieve_and_refine", ...)` in `ideation.py:472-488`
  - Also handles `refine_with_retrieval` action (same prompt)

#### **IDEATION_DIRECT_FEEDBACK_PROMPT** (Lines 252-285) ✅ **ACTIVELY USED**
- **Purpose**: Improve idea based on direct user feedback from chat
- **Location**: `src/agents/prompts.py:252-285`
- **Used by**: 
  - User feedback through chat interface (`action == "process_feedback"` in `ideation.py:489-494`)
  - Called when user provides feedback in chat (`app.py:504` - direct feedback handling)

#### **IDEATION_IMPROVE_WITH_FEEDBACK_PROMPT** (Lines 288-326) ✅ **ACTIVELY USED**
- **Purpose**: Improve idea based on review feedback
- **Location**: `src/agents/prompts.py:288-326`
- **Used by**: 
  - MCTS `review_and_refine` action (`app.py:1010`, `app.py:1262`)
  - Improving ideas based on accepted review suggestions
  - Called via `ideation_agent.execute_action("review_and_refine", ...)` in `ideation.py:416-470`
  - Note: Sometimes uses custom prompt instead (when `original_raw_output` exists)

#### **IDEATION_GENERATE_QUERY_PROMPT** (Lines 19-35) ✅ **ACTIVELY USED**
- **Purpose**: Generate search queries for paper retrieval
- **Location**: `src/agents/prompts.py:19-35`
- **Format**: JSON with `query` field
- **Used by**: 
  - Query generation for Semantic Scholar API (`action == "generate_query"` in `ideation.py:396-404`)
  - Called when user clicks "Find Literature" button
  - Note: Currently commented out in some places (`app.py:744`), but prompt is still used elsewhere

---

## 2. Review Metrics

### Location: `src/agents/prompts.py` and `src/agents/review.py`

### Review System Prompt
- **REVIEW_SYSTEM_PROMPT** (Lines 363-367)
- **Location**: `src/agents/prompts.py:363-367`
- **Purpose**: System instructions for review agent

### Review Metrics (5 Criteria)

#### **UNIFIED_REVIEW_PROMPT** (Lines 421-455) - **PRIMARY REVIEW PROMPT** ✅ **ACTIVELY USED**
- **Location**: `src/agents/prompts.py:421-455`
- **Metrics Evaluated** (each scored 1-10):
  1. **Novelty**: Originality and innovation compared to existing work
  2. **Clarity**: How well-defined and understandable the idea is
  3. **Feasibility**: Technical practicality within current capabilities
  4. **Effectiveness**: How well the proposed approach might solve the stated problem
  5. **Impact**: Potential scientific and practical significance if successful

- **Output Format**: JSON with:
  - `scores`: Dictionary with scores for each metric (1-10)
  - `reviews`: Dictionary with detailed assessment for each metric

- **Weight Distribution** (from `src/agents/review.py:25-29`):
  - Each metric has equal weight: 0.2 (20%)
  - Average score = weighted sum of all 5 metrics

#### **REVIEW_SINGLE_ASPECT_PROMPT** (Lines 370-418) ✅ **ACTIVELY USED (Limited)**
- **Location**: `src/agents/prompts.py:370-418`
- **Purpose**: Review a single aspect with highlight extraction
- **Used by**: 
  - Structured review agent (`src/agents/structured_review.py:80`)
  - Called via `/api/review_aspect` endpoint (`app.py:1847`)
  - Used for detailed per-aspect review with highlighting (not the primary review mechanism)
- **Output**: JSON with aspect, score, highlight (exact text), category, review, summary

### Review Agent Implementation
- **Location**: `src/agents/review.py`
- **Method**: `unified_review()` (Lines 103-207)
- **Aspect Descriptions** (Lines 107-111):
  - Novelty: "Evaluate how original and innovative the idea is compared to existing work."
  - Clarity: "Assess how well-defined, understandable, and precisely communicated the idea is."
  - Feasibility: "Determine if the idea is technically practical within current capabilities and constraints."
  - Effectiveness: "Evaluate how well the proposed approach might solve the stated problem."
  - Impact: "Assess the potential scientific and practical significance if the idea is successfully implemented."

---

## 3. Retrieval Prompts

### Query Generation
- **IDEATION_GENERATE_QUERY_PROMPT** (Lines 19-35)
- **Location**: `src/agents/prompts.py:19-35`
- **Purpose**: Convert research idea into search query for Semantic Scholar

### ScholarQA Retrieval Pipeline Prompts
- **Location**: `src/retrieval_api/scholarqa/llms/prompts.py`
- **Key Prompts**:
  1. **SYSTEM_PROMPT_QUOTE_PER_PAPER** (Lines 2-25): Extract exact quotes from papers
  2. **CLUSTER_PROMPT_FEW_SHOTS** (Line 37+): Cluster quotes by topic
  3. **ITERATIVE_SUMMARY_PROMPT** (Lines 270-342): Generate iterative summaries with citations
  4. **QUERY_DECOMPOSER_PROMPT** (Lines 344-494): Decompose queries into structured components (years, venues, authors, fields of study)

---

## 4. Other Evaluation Mechanisms

### Structured Review Agent ✅ **ACTIVELY USED (Limited)**
- **Location**: `src/agents/structured_review.py`
- **Purpose**: Alternative review mechanism with specific categories
- **Categories** (Lines 28-38):
  - `lack_of_novelty`
  - `feasibility_and_practicality`
  - `overstatement`
  - `evaluation_and_validation_issues`
  - `impact`
- **Used by**: 
  - `/api/review_aspect` endpoint (`app.py:1847`)
  - Called when user requests detailed review of a specific aspect
- **Note**: This is NOT the primary review agent - `ReviewAgent.unified_review()` is the main one

### MCTS Reward Calculation
- **Location**: `src/mcts/tree.py`
- **Reward**: Based on `average_score` from unified review (Lines 522-531 in `app.py`)
- **Formula**: `reward = average_score / 10` (normalized to 0-1 range)

---

## Summary

### Idea Creation:
- **Primary**: `IDEATION_GENERATE_PROMPT` in `src/agents/prompts.py:113-138`
- **System**: `IDEATION_SYSTEM_PROMPT` in `src/agents/prompts.py:4-13`
- **Variants**: Refresh, Refine with Retrieval, Direct Feedback, Improve with Feedback

### Review Metrics:
- **5 Metrics**: Novelty, Clarity, Feasibility, Effectiveness, Impact
- **Scoring**: 1-10 for each metric
- **Primary Prompt**: `UNIFIED_REVIEW_PROMPT` in `src/agents/prompts.py:421-455`
- **Implementation**: `src/agents/review.py:unified_review()`

### Retrieval:
- **Query Generation**: `IDEATION_GENERATE_QUERY_PROMPT` in `src/agents/prompts.py:19-35` ✅ **USED**
- **ScholarQA Pipeline**: Multiple prompts in `src/retrieval_api/scholarqa/llms/prompts.py` ✅ **USED** (for paper retrieval and summarization)

### No Manual Metric Entry:
- All metrics are automatically calculated by LLM based on prompts
- No manual metric configuration or entry points exist
- Review scores are computed from LLM responses, not manually entered

---

## ❌ NOT USED / COMMENTED OUT

### IDEATION_CONTEXT_ENRICHED_PROMPT (Lines 333-360)
- **Status**: ❌ **NOT USED** - Defined but never imported or called
- **Location**: `src/agents/prompts.py:333-360`
- **Note**: This prompt exists but is not imported in `ideation.py` and has no action handler

### Commented-out IDEATION_GENERATE_PROMPT variants
- **Status**: ❌ **NOT USED** - All commented out
- **Location**: `src/agents/prompts.py:37-111`
- **Note**: Multiple commented-out versions of the generate prompt (HCI-specific, older versions, etc.)

