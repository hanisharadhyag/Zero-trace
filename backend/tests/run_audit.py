"""
Demo Security Audit Report Runner for SIH6155 Auditor.

Runs the complete cybersecurity audit suite on demo configuration and prints
a formatted security audit report.
"""

from engine.audit import run_security_audit
from sample_configs.demo_config import config

def main():
    audit = run_security_audit(config)

    results = audit["results"]
    summary = audit["summary"]
    prioritized = audit.get("prioritized_risks", [])
    remediations = audit.get("remediations", [])
    ai_analysis = audit.get("ai_analysis", {})

    print("\n==================================================")
    print("           SECURITY AUDIT REPORT                  ")
    print("==================================================\n")

    print(f"Device Hostname : {config.get('device', {}).get('hostname', 'N/A')}")
    print(f"Device Vendor   : {config.get('device', {}).get('vendor', 'N/A')}")
    print(f"Security Score  : {summary['score']}%")
    print(f"Risk Level      : {summary['risk_level']}")
    print(f"Total Rules     : {summary['total_rules']}")
    print(f"Passed          : {summary['passed']}")
    print(f"Failed          : {summary['failed']}")
    print(f"Critical        : {summary['critical_issues']}")
    print(f"High            : {summary['high_issues']}")
    print(f"Medium          : {summary['medium_issues']}")
    print(f"Low             : {summary.get('low_issues', 0)}")

    print("\n===== PRIORITIZED RISKS =====\n")
    if prioritized:
        for risk in prioritized:
            print(
                f"{risk['priority']}. {risk['rule_id']} | "
                f"{risk['title']} | "
                f"{risk['severity']}"
            )
            print(f"   Reason: {risk['reason']}")
    else:
        print("No failed risks detected.")

    print("\n===== RULE RESULTS =====\n")

    for result in results:
        status_symbol = "[PASS]" if result['status'] == 'PASS' else "[FAIL]"
        print(
            f"{result['rule_id']} | "
            f"{result['title']:<38} | "
            f"{result['severity']:<8} | "
            f"{status_symbol} {result['status']}"
        )

    print("\n===== REMEDIATION RECOMMENDATIONS =====\n")

    if remediations:
        for rem in remediations:
            print(f"Rule {rem['rule_id']} [{rem['severity']}] - {rem['issue']}")
            print(f"  Explanation: {rem['explanation']}")
            print(f"  Recommended Action: {rem['recommended_action']}")
            if rem.get("vendor_command_example"):
                print(f"  Example Remediation Command:\n    {rem['vendor_command_example']}")
            print()
    else:
        print("No remediation actions required.")

    print("\n===== LOCAL AI ANALYSIS =====\n")
    print(f"Engine: {ai_analysis.get('ai_engine', 'N/A')}")
    print(f"Summary: {ai_analysis.get('posture_summary', 'N/A')}")
    if ai_analysis.get("correlated_risks"):
        print("Correlated Multi-Rule Risks:")
        for corr in ai_analysis["correlated_risks"]:
            print(f"  - [{corr['severity']}] {corr['title']} ({', '.join(corr['involved_rules'])}): {corr['analysis']}")
    if ai_analysis.get("unusual_configurations"):
        print("Unusual Configurations:")
        for un in ai_analysis["unusual_configurations"]:
            print(f"  - {un}")

    print("\n==================================================\n")


if __name__ == "__main__":
    main()
