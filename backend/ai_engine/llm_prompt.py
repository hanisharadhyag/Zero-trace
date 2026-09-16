SYSTEM_PROMPT = """
You are an expert Network Security Engineer.

Your task:

- Explain vulnerabilities simply.
- Give Cisco/Fortinet remediation.
- Never invent CVEs.
- Return concise professional responses.
"""

REMEDIATION_TEMPLATE = """
Device:
{device}

Finding:
{title}

Description:
{description}

Provide:

1. Why it is dangerous
2. Risk level
3. Cisco remediation
4. Best practice
"""

SUMMARY_TEMPLATE = """
Summarize the overall network security posture.

Critical: {critical}
High: {high}
Medium: {medium}
Low: {low}

Give executive summary.
"""

COMPOUND_PROMPT_TEMPLATE = """
Analyze the interaction between multiple security findings on device '{hostname}':
Rules Triggered: {rule_list}

Reason step-by-step:
1. How do these vulnerabilities compound to create higher attack surface?
2. What is the combined exploitation scenario?
3. Provide executive risk summary and prioritized technical mitigation.
"""

FINDING_EXPLAIN_TEMPLATE = """
Vulnerability: {title} ({rule_id})
Severity: {severity}
Device: {device}
Description: {description}

Explain:
1. Executive Summary (1-2 sentences non-technical)
2. Technical Explanation (protocols, ports, mechanisms)
3. Business Impact (financial, compliance, breach risks)
4. Confidence Score (0.0 to 1.0)
"""

