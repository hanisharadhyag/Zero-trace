"""
Remediation API Router for SIH26155 Network Security Compliance Auditor.

Generates multi-vendor (Cisco CLI, Fortinet CLI, Palo Alto XML/CLI) remediation plans.
Each remediation includes:
- Problem
- Severity
- Why it matters
- Recommended action
- Configuration snippet
- Verification command
- Estimated risk reduction
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query

from backend.api.upload import get_current_device, get_current_findings
from backend.engine.remediation import REMEDIATION_CATALOG

router = APIRouter()

# Enhanced vendor commands and verification commands
VENDOR_REMEDIATIONS = {
    "R01": {
        "problem": "Telnet Protocol Enabled",
        "why_it_matters": "Telnet sends credentials in cleartext over the wire, allowing attackers to sniff passwords via MITM or ARP spoofing.",
        "recommended_action": "Disable Telnet and enforce SSHv2 on all virtual terminal lines.",
        "verification_command": {
            "Cisco": "show line vty 0 4 | include transport",
            "Fortinet": "get system admin status",
            "PaloAlto": "show running security-policy"
        },
        "estimated_risk_reduction": "25% Risk Reduction (Eliminates cleartext credential exposure)",
        "snippets": {
            "Cisco": "line vty 0 4\n transport input ssh\n login local\n exit",
            "Fortinet": "config system admin\n edit \"admin\"\n set trusthost1 10.0.0.0 255.255.255.0\n unset telnet\n next\nend",
            "PaloAlto": "<system>\n  <service>\n    <disable-telnet>yes</disable-telnet>\n  </service>\n</system>"
        }
    },
    "R02": {
        "problem": "Unrestricted SSH Exposure",
        "why_it_matters": "Exposing SSH to ANY (0.0.0.0/0) allows external botnets to launch credential stuffing and zero-day attacks.",
        "recommended_action": "Bind an access-class to virtual lines limiting SSH access to designated management subnets.",
        "verification_command": {
            "Cisco": "show running-config | section line vty",
            "Fortinet": "show system interface | grep allowaccess",
            "PaloAlto": "show system setting ssl-tls-service-profile"
        },
        "estimated_risk_reduction": "15% Risk Reduction (Removes direct public attack surface)",
        "snippets": {
            "Cisco": "access-list 10 permit 10.0.0.0 0.255.255.255\nline vty 0 4\n access-class 10 in\n exit",
            "Fortinet": "config system interface\n edit \"port1\"\n set allowaccess ping https ssh\n next\nend",
            "PaloAlto": "<entry name=\"mgmt-acl\">\n  <source>\n    <member>10.0.0.0/8</member>\n  </source>\n</entry>"
        }
    },
    "R03": {
        "problem": "Overly Permissive ANY-to-ANY Rule",
        "why_it_matters": "Unrestricted traffic allow bypasses stateful inspection and permits unrestricted lateral movement across security zones.",
        "recommended_action": "Delete ANY-to-ANY allow policies and substitute explicit least-privilege service definitions.",
        "verification_command": {
            "Cisco": "show access-lists | include permit ip any any",
            "Fortinet": "show firewall policy | grep any",
            "PaloAlto": "show running security-policy | match any"
        },
        "estimated_risk_reduction": "30% Risk Reduction (Restores fundamental network perimeter isolation)",
        "snippets": {
            "Cisco": "no access-list 100 permit ip any any\naccess-list 100 deny ip any any log",
            "Fortinet": "config firewall policy\n delete 1\nend",
            "PaloAlto": "<entry name=\"rule1\">\n  <action>deny</action>\n  <log-end>yes</log-end>\n</entry>"
        }
    },
    "R04": {
        "problem": "Broad Access Rule to Database/Internal Zone",
        "why_it_matters": "Allowing entire subnets to access database ports (3306, 5432, 1521) exposes critical records to internal compromises.",
        "recommended_action": "Scope destination access strictly to authorized application server IP addresses.",
        "verification_command": {
            "Cisco": "show access-lists | include permit tcp",
            "Fortinet": "diagnose firewall iprope show 100004",
            "PaloAlto": "show running security-policy"
        },
        "estimated_risk_reduction": "20% Risk Reduction (Protects high-value data stores)",
        "snippets": {
            "Cisco": "no access-list 101 permit ip any host 10.1.1.50\naccess-list 101 permit tcp host 10.1.1.10 host 10.1.1.50 eq 3306",
            "Fortinet": "config firewall policy\n edit 10\n set srcaddr \"App-Server-Host\"\n set dstaddr \"DB-Server-Host\"\n next\nend",
            "PaloAlto": "<entry name=\"db-access\">\n  <source><member>10.1.1.10/32</member></source>\n  <destination><member>10.1.1.50/32</member></destination>\n</entry>"
        }
    },
    "R05": {
        "problem": "Firewall Drop Logging Disabled",
        "why_it_matters": "Without drop logging, security analysts are blind to reconnaissance sweeps, port scans, and policy violation attempts.",
        "recommended_action": "Append logging parameters to default deny rules and security access lists.",
        "verification_command": {
            "Cisco": "show logging | include access-list",
            "Fortinet": "show firewall policy | grep logtraffic",
            "PaloAlto": "show running security-policy | match log-end"
        },
        "estimated_risk_reduction": "10% Risk Reduction (Provides essential security event visibility)",
        "snippets": {
            "Cisco": "access-list 100 deny ip any any log",
            "Fortinet": "config firewall policy\n edit 1\n set logtraffic all\n next\nend",
            "PaloAlto": "<entry name=\"default-deny\">\n  <log-end>yes</log-end>\n  <log-start>no</log-start>\n</entry>"
        }
    },
    "R06": {
        "problem": "Insecure Management Protocol (HTTP/FTP)",
        "why_it_matters": "Cleartext administrative web portals expose session tokens and passwords to interception.",
        "recommended_action": "Disable unencrypted HTTP server and mandate HTTPS with TLS 1.3.",
        "verification_command": {
            "Cisco": "show ip http server status",
            "Fortinet": "get system admin status",
            "PaloAlto": "show system setting ssl-tls-service-profile"
        },
        "estimated_risk_reduction": "15% Risk Reduction (Prevents credential theft and session hijacking)",
        "snippets": {
            "Cisco": "no ip http server\nip http secure-server",
            "Fortinet": "config system global\n set admin-https-redirect enable\n unset admin-http\nend",
            "PaloAlto": "<system>\n  <service>\n    <disable-http>yes</disable-http>\n  </service>\n</system>"
        }
    },
    "R07": {
        "problem": "Weak SSH Configuration / Password Auth Only",
        "why_it_matters": "Legacy password-based authentication without public key cryptographic validation is susceptible to automated dictionary attacks.",
        "recommended_action": "Enforce SSHv2, increase RSA key modulus to 2048+ bits, and require public key auth.",
        "verification_command": {
            "Cisco": "show ip ssh",
            "Fortinet": "get system global | grep ssh",
            "PaloAlto": "show system setting ssl-tls-service-profile"
        },
        "estimated_risk_reduction": "12% Risk Reduction (Hardens administrative identity validation)",
        "snippets": {
            "Cisco": "ip ssh version 2\ncrypto key generate rsa modulus 2048",
            "Fortinet": "config system global\n set strong-crypto enable\n set ssh-enc-algo chacha20-poly1305@openssh.com aes256-gcm@openssh.com\nend",
            "PaloAlto": "<system>\n  <ssh>\n    <ciphers>aes256-gcm@openssh.com</ciphers>\n  </ssh>\n</system>"
        }
    },
    "R08": {
        "problem": "Default or Factory Credentials Active",
        "why_it_matters": "Factory default usernames and passwords (e.g. cisco/cisco, admin/admin) allow trivial unauthorized login.",
        "recommended_action": "Remove factory credentials, enforce AAA authentication, and create individual role-based accounts.",
        "verification_command": {
            "Cisco": "show running-config | include username",
            "Fortinet": "show system admin",
            "PaloAlto": "show system admin"
        },
        "estimated_risk_reduction": "25% Risk Reduction (Eliminates universal initial access vulnerability)",
        "snippets": {
            "Cisco": "no username cisco\nno username admin\nusername secops privilege 15 secret 9 $9$robustPassword2026#",
            "Fortinet": "config system admin\n edit \"admin\"\n set password \"Comp1!ance#2026!Str0ng\"\n next\nend",
            "PaloAlto": "<users>\n  <entry name=\"admin\">\n    <phash>$1$salt$hashedpassword</phash>\n  </entry>\n</users>"
        }
    },
    "R09": {
        "problem": "Unencrypted Management Channels",
        "why_it_matters": "Unencrypted administrative protocols (Telnet, HTTP, SNMPv1/v2c) transmit community strings and passwords in the clear.",
        "recommended_action": "Decommission legacy protocols and migrate to SNMPv3 with authPriv encryption.",
        "verification_command": {
            "Cisco": "show snmp group",
            "Fortinet": "show system snmp sysinfo",
            "PaloAlto": "show snmp-server"
        },
        "estimated_risk_reduction": "15% Risk Reduction (Protects telemetry and operational credentials)",
        "snippets": {
            "Cisco": "no snmp-server community public\nsnmp-server group SECGROUP v3 priv\nsnmp-server user secuser SECGROUP v3 auth sha StrongAuthPass priv aes 128 StrongPrivPass",
            "Fortinet": "config system snmp user\n edit \"secuser\"\n set security-level auth-priv\n set auth-pwd \"AuthPass2026!\"\n set priv-pwd \"PrivPass2026!\"\n next\nend",
            "PaloAlto": "<snmp-server>\n  <version>v3</version>\n</snmp-server>"
        }
    },
    "R10": {
        "problem": "Centralized Syslog Logging Missing",
        "why_it_matters": "Local log buffers overwrite rapidly and can be cleared by attackers; central syslog guarantees tamper-resistant telemetry.",
        "recommended_action": "Configure redundant remote syslog hosts and set trap level to informational.",
        "verification_command": {
            "Cisco": "show logging | include host",
            "Fortinet": "get log syslogd setting",
            "PaloAlto": "show system setting syslog"
        },
        "estimated_risk_reduction": "10% Risk Reduction (Guarantees forensic non-repudiation)",
        "snippets": {
            "Cisco": "logging host 10.0.10.50\nlogging trap informational\nlogging source-interface Loopback0",
            "Fortinet": "config log syslogd setting\n set status enable\n set server \"10.0.10.50\"\n set mode udp\nend",
            "PaloAlto": "<syslog>\n  <server><name>siem-01</name><ip>10.0.10.50</ip></server>\n</syslog>"
        }
    },
    "R11": {
        "problem": "Weak Cryptographic Algorithms (DES/3DES/RC4)",
        "why_it_matters": "Legacy ciphers have known mathematical flaws (Sweet32, key collision) allowing adversaries to decrypt recorded sessions.",
        "recommended_action": "Disable legacy cipher suites and mandate AES-256-GCM and SHA-256/384.",
        "verification_command": {
            "Cisco": "show crypto ipsec transform-set",
            "Fortinet": "show vpn ipsec phase2-interface",
            "PaloAlto": "show running crypto-profile"
        },
        "estimated_risk_reduction": "15% Risk Reduction (Secures data-in-transit confidentiality)",
        "snippets": {
            "Cisco": "crypto ipsec transform-set SECURE_SET esp-aes 256 esp-sha256-hmac\n mode tunnel",
            "Fortinet": "config vpn ipsec phase2-interface\n edit \"VPN-TNL\"\n set proposal aes256gcm\n next\nend",
            "PaloAlto": "<ipsec-crypto-profiles>\n  <entry name=\"aes256-sha256\">\n    <encryption><member>aes-256-gcm</member></encryption>\n  </entry>\n</ipsec-crypto-profiles>"
        }
    },
    "R12": {
        "problem": "Unrestricted Administrative Access",
        "why_it_matters": "Lack of role-based privilege separation allows any administrative account to perform full destructive reconfiguration.",
        "recommended_action": "Define distinct privilege levels and configure TACACS+/RADIUS authorization.",
        "verification_command": {
            "Cisco": "show running-config | section privilege",
            "Fortinet": "show system admin",
            "PaloAlto": "show system admin"
        },
        "estimated_risk_reduction": "12% Risk Reduction (Restricts insider threat and blast radius)",
        "snippets": {
            "Cisco": "privilege exec level 7 show running-config\nprivilege exec level 7 show ip route\naaa authorization exec default group tacacs+ local",
            "Fortinet": "config system accprofile\n edit \"Read-Only-Auditor\"\n set secfabread read\n set ftviewgrp read\n next\nend",
            "PaloAlto": "<entry name=\"auditor\"><role>superreader</role></entry>"
        }
    },
    "R13": {
        "problem": "Missing Configuration Change Audit Logging",
        "why_it_matters": "Unlogged configuration commits prevent determining who changed firewall policies and when, impeding root cause analysis.",
        "recommended_action": "Enable configuration archive and command accounting.",
        "verification_command": {
            "Cisco": "show archive log config all",
            "Fortinet": "diagnose sys config-audit status",
            "PaloAlto": "show log config"
        },
        "estimated_risk_reduction": "8% Risk Reduction (Provides administrative accountability)",
        "snippets": {
            "Cisco": "archive\n log config\n  logging enable\n  notify syslog contenttype plaintext\n  hidekeys",
            "Fortinet": "config system global\n set revision-backup-on-logout enable\n set revision-image-auto-backup enable\nend",
            "PaloAlto": "<system>\n  <audit-log-enabled>yes</audit-log-enabled>\n</system>"
        }
    },
    "R14": {
        "problem": "Firewall Rule Conflict / Shadowing Detected",
        "why_it_matters": "A broader allow rule placed before a specific deny rule causes the deny rule to never trigger, silently exposing traffic.",
        "recommended_action": "Reorder rules by placing most specific rules at the top and broader policies beneath.",
        "verification_command": {
            "Cisco": "show access-lists",
            "Fortinet": "diagnose firewall iprope show 100004",
            "PaloAlto": "show running security-policy"
        },
        "estimated_risk_reduction": "18% Risk Reduction (Eliminates accidental security policy bypasses)",
        "snippets": {
            "Cisco": "no access-list 100\naccess-list 100 deny tcp any host 10.0.0.5 eq 22\naccess-list 100 permit ip 10.0.0.0 0.255.255.255 any\naccess-list 100 deny ip any any log",
            "Fortinet": "config firewall policy\n move 15 before 2\nend",
            "PaloAlto": "<entry name=\"specific-deny\">\n  <action>deny</action>\n</entry>\n<!-- Place before generic permit -->"
        }
    },
    "R15": {
        "problem": "Security Baseline Deviations Detected",
        "why_it_matters": "Unsynchronized NTP, missing login banners, and active auxiliary ports violate CIS Benchmark and NIST SP 800-53 baselines.",
        "recommended_action": "Apply enterprise hardening template: configure NTP server, login warning banner, and disable aux port.",
        "verification_command": {
            "Cisco": "show ntp status",
            "Fortinet": "get system status | grep NTP",
            "PaloAlto": "show ntp"
        },
        "estimated_risk_reduction": "10% Risk Reduction (Achieves full baseline compliance)",
        "snippets": {
            "Cisco": "banner motd ^C Authorized Access Only. All activities are monitored. ^C\nntp server 10.0.1.1\nline aux 0\n transport input none\n no exec",
            "Fortinet": "config system global\n set pre-login-banner enable\n set timezone 04\nend\nconfig system ntp\n set status enable\n set server-mode enable\nend",
            "PaloAlto": "<system>\n  <login-banner>Authorized Access Only</login-banner>\n  <ntp-servers><primary>10.0.1.1</primary></ntp-servers>\n</system>"
        }
    }
}


@router.get("/remediation")
@router.get("/api/remediation")
def get_remediation_console(
    vendor: Optional[str] = Query(None, description="Filter commands by vendor (Cisco, Fortinet, PaloAlto)")
):
    """
    Return comprehensive, vendor-specific remediation console entries for all current non-compliant findings.
    """
    current_device = get_current_device()
    current_findings = get_current_findings()

    active_vendor = vendor or (getattr(current_device, "vendor", "Cisco") if current_device else "Cisco")
    hostname = getattr(current_device, "hostname", "Network-Device") if current_device else "Network-Device"

    remediations_list = []

    # Map findings to catalog
    for finding in current_findings:
        f_id = getattr(finding, "id", None) or (finding.get("id") or finding.get("rule_id") if isinstance(finding, dict) else "R00")
        title = getattr(finding, "title", None) or (finding.get("title") if isinstance(finding, dict) else "Security Issue")
        severity = getattr(finding, "severity", None) or (finding.get("severity") if isinstance(finding, dict) else "Medium")
        status = getattr(finding, "status", "Open") if not isinstance(finding, dict) else finding.get("status", "Open")

        if str(status).upper() not in ["FAIL", "OPEN"]:
            continue

        catalog_data = VENDOR_REMEDIATIONS.get(f_id, {
            "problem": title,
            "why_it_matters": "Violates network security compliance baseline.",
            "recommended_action": "Review and correct configuration.",
            "verification_command": {"Cisco": "show running-config", "Fortinet": "show", "PaloAlto": "show"},
            "estimated_risk_reduction": "5% Risk Reduction",
            "snippets": {
                "Cisco": "! Remediate " + title,
                "Fortinet": "# Remediate " + title,
                "PaloAlto": "<!-- Remediate " + title + " -->"
            }
        })

        snippet = catalog_data["snippets"].get(active_vendor, catalog_data["snippets"].get("Cisco", ""))
        verify_cmd = catalog_data["verification_command"].get(active_vendor, catalog_data["verification_command"].get("Cisco", ""))

        remediations_list.append({
            "rule_id": f_id,
            "problem": catalog_data["problem"],
            "severity": severity,
            "why_it_matters": catalog_data["why_it_matters"],
            "recommended_action": catalog_data["recommended_action"],
            "configuration_snippet": snippet,
            "verification_command": verify_cmd,
            "estimated_risk_reduction": catalog_data["estimated_risk_reduction"],
            "target_vendor": active_vendor,
            "affected_device": hostname
        })

    return {
        "device": hostname,
        "vendor": active_vendor,
        "total_remediations": len(remediations_list),
        "remediations": remediations_list
    }
