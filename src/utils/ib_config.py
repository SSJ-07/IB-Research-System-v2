"""Configuration loading helpers for IB topics and RQ format requirements."""

from typing import List, Dict, Tuple, Optional
import yaml
from pathlib import Path


def load_physics_topics() -> List[Dict[str, str]]:
    """Load all Physics topics from config file.
    
    Returns:
        List of topic dictionaries with 'code', 'name', and 'category' keys
    """
    config_path = Path(__file__).parent.parent.parent / "config" / "ib" / "physics_topics.yaml"
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    return config.get("topics", [])


def load_chemistry_topics() -> List[Dict[str, str]]:
    """Load all Chemistry topics from config file.
    
    Returns:
        List of topic dictionaries with 'code', 'name', and 'category' keys
    """
    config_path = Path(__file__).parent.parent.parent / "config" / "ib" / "chemistry_topics.yaml"
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    return config.get("topics", [])


def load_topics_for_subject(subject: str) -> List[Dict[str, str]]:
    """Load topics for a given subject.
    
    Args:
        subject: Subject name (e.g., "physics", "chemistry")
        
    Returns:
        List of topic dictionaries with 'code', 'name', and 'category' keys
    """
    subject_lower = subject.lower().strip() if subject else ""
    
    if subject_lower == "physics":
        return load_physics_topics()
    elif subject_lower == "chemistry":
        return load_chemistry_topics()
    else:
        return []


def load_rq_requirements(subject: str, assessment_type: str) -> Dict:
    """Load RQ format requirements for a given subject and assessment type.
    
    Args:
        subject: Subject name (e.g., "physics")
        assessment_type: Assessment type (e.g., "IA")
        
    Returns:
        Dictionary containing required_elements, templates, and validation_rules
    """
    config_path = Path(__file__).parent.parent.parent / "config" / "ib" / "rq_formats.yaml"
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    
    key = f"{subject}_{assessment_type.lower()}"
    return config.get(key, {})


def validate_rq(rq: str, requirements: Dict) -> Tuple[bool, List[str]]:
    """Validate a research question against format requirements.
    
    Args:
        rq: Research question string to validate
        requirements: RQ format requirements dictionary
        
    Returns:
        Tuple of (is_valid, list_of_warnings)
    """
    warnings = []
    validation_rules = requirements.get("validation_rules", [])
    
    # Check for independent variable
    if validation_rules and any(rule.get("must_contain_iv", False) for rule in validation_rules if isinstance(rule, dict)):
        if not any(word in rq.lower() for word in ["how does", "effect", "affect", "influence", "relationship"]):
            warnings.append("Research question should clearly identify an independent variable")
    
    # Check for dependent variable
    if validation_rules and any(rule.get("must_contain_dv", False) for rule in validation_rules if isinstance(rule, dict)):
        if not any(word in rq.lower() for word in ["affect", "effect", "influence", "relationship", "change"]):
            warnings.append("Research question should clearly identify a dependent variable")
    
    # Check for units
    if validation_rules and any(rule.get("must_have_units", False) for rule in validation_rules if isinstance(rule, dict)):
        common_units = ["m", "kg", "s", "a", "k", "mol", "cd", "hz", "db", "°c", "°f", "pa", "n", "j", "w", "v", "a", "ohm"]
        if not any(unit in rq.lower() for unit in common_units):
            # Check for unit indicators like "in", "at", "for" which might indicate units are mentioned
            if not any(indicator in rq.lower() for indicator in ["in ", "at ", "for ", "of ", "with "]):
                warnings.append("Research question should specify units for measurable quantities")
    
    # Check for scope/range
    if validation_rules and any(rule.get("must_have_scope", False) for rule in validation_rules if isinstance(rule, dict)):
        scope_indicators = ["at", "for", "between", "from", "to", "range", "various", "different", "levels"]
        if not any(indicator in rq.lower() for indicator in scope_indicators):
            warnings.append("Research question should specify the scope or range of investigation")
    
    is_valid = len(warnings) == 0
    return is_valid, warnings

