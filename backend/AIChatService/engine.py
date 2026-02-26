import re
import difflib
from typing import Optional
from fuzzywuzzy import fuzz

# ---------------------------------------------------------------------------
# Algorithm 1: Rule-Based Classification (knowledge base)
# ---------------------------------------------------------------------------
VULNERABILITIES = {
    "sql_injection": {
        "name": "SQL Injection",
        "explanation": (
            "SQL Injection occurs when an attacker inserts or manipulates SQL queries "
            "via user-supplied input, allowing them to read, modify, or delete database "
            "data and sometimes execute OS-level commands."
        ),
        "severity": "Critical",
        "fix": (
            "Use parameterized queries / prepared statements. "
            "Apply input validation and least-privilege DB accounts. "
            "Use an ORM and avoid dynamic SQL concatenation."
        ),
        "patterns": [
            r"(sql\s*inject|sqli|sql[-\s]injection|sqlinjection)",
            r"(union\s+select|drop\s+table|or\s+1=1)",
        ],
        "keywords": ["sql injection", "sqli", "sql-injection", "sqlinjection",
                     "union select", "drop table"],
    },
    "xss": {
        "name": "Cross-Site Scripting (XSS)",
        "explanation": (
            "XSS allows attackers to inject malicious scripts into web pages viewed by "
            "other users, enabling session hijacking, credential theft, and defacement."
        ),
        "severity": "High",
        "fix": (
            "Encode all output (HTML-encode user-supplied data). "
            "Use Content-Security-Policy headers. "
            "Validate and sanitize every input on the server side."
        ),
        "patterns": [
            r"(cross[-\s]site\s*script|xss|\bscript\s+inject)",
        ],
        "keywords": ["xss", "cross site scripting", "cross-site scripting",
                     "script injection"],
    },
    "csrf": {
        "name": "Cross-Site Request Forgery (CSRF)",
        "explanation": (
            "CSRF tricks authenticated users into submitting unwanted requests, "
            "allowing attackers to perform actions on their behalf."
        ),
        "severity": "Medium",
        "fix": (
            "Use CSRF tokens on all state-changing forms/requests. "
            "Validate the Origin/Referer header. "
            "Use SameSite=Strict or SameSite=Lax cookie attribute."
        ),
        "patterns": [
            r"(cross[-\s]site\s*request\s*forgery|csrf|xsrf)",
        ],
        "keywords": ["csrf", "xsrf", "cross site request forgery",
                     "cross-site request forgery"],
    },
    "rce": {
        "name": "Remote Code Execution (RCE)",
        "explanation": (
            "RCE lets an attacker execute arbitrary code on the server, "
            "potentially leading to full system compromise."
        ),
        "severity": "Critical",
        "fix": (
            "Never pass user input to shell commands. "
            "Use safe APIs instead of exec()/system(). "
            "Apply strict input validation and sandboxing."
        ),
        "patterns": [
            r"(remote\s+code\s+exec|rce|\bcode\s+execut)",
        ],
        "keywords": ["rce", "remote code execution", "code execution"],
    },
    "lfi": {
        "name": "Local File Inclusion (LFI)",
        "explanation": (
            "LFI allows an attacker to include files from the server's filesystem, "
            "potentially exposing sensitive data or executing server-side code."
        ),
        "severity": "High",
        "fix": (
            "Whitelist allowed file paths/names. "
            "Never pass raw user input to file-include functions. "
            "Use realpath() and verify paths stay within the intended directory."
        ),
        "patterns": [
            r"(local\s+file\s+inclus|lfi|\.\./|path\s+travers)",
        ],
        "keywords": ["lfi", "local file inclusion", "../", "path traversal"],
    },
    "rfi": {
        "name": "Remote File Inclusion (RFI)",
        "explanation": (
            "RFI enables attackers to include remote files (often containing malicious "
            "code) into the application's execution flow."
        ),
        "severity": "Critical",
        "fix": (
            "Disable allow_url_include in PHP. "
            "Whitelist all allowed includes. "
            "Validate and sanitize file path parameters."
        ),
        "patterns": [
            r"(remote\s+file\s+inclus|rfi)",
        ],
        "keywords": ["rfi", "remote file inclusion"],
    },
    "ssrf": {
        "name": "Server-Side Request Forgery (SSRF)",
        "explanation": (
            "SSRF allows attackers to induce the server to make HTTP requests to "
            "unintended locations, potentially accessing internal services."
        ),
        "severity": "High",
        "fix": (
            "Validate and whitelist allowed URLs/IP ranges. "
            "Block requests to internal/metadata IPs. "
            "Use a dedicated HTTP client with timeouts."
        ),
        "patterns": [
            r"(server[-\s]side\s+request\s+forgery|ssrf)",
        ],
        "keywords": ["ssrf", "server-side request forgery",
                     "server side request forgery"],
    },
    "directory_traversal": {
        "name": "Directory Traversal",
        "explanation": (
            "Directory traversal (path traversal) lets attackers access files and "
            "directories outside the intended web root by manipulating file paths."
        ),
        "severity": "High",
        "fix": (
            "Sanitize all user-supplied file paths. "
            "Use canonical path checks (realpath/os.path.abspath). "
            "Restrict the application to a defined base directory."
        ),
        "patterns": [
            r"(directory\s+travers|path\s+travers|\.\./|dot\s*dot\s*slash)",
        ],
        "keywords": ["directory traversal", "path traversal", "../",
                     "dot dot slash"],
    },
    "open_redirect": {
        "name": "Open Redirect",
        "explanation": (
            "Open redirect occurs when an application accepts an untrusted URL as a "
            "redirect target, enabling phishing and credential-theft attacks."
        ),
        "severity": "Medium",
        "fix": (
            "Whitelist redirect destinations. "
            "Use relative paths or server-side token validation. "
            "Warn users when redirecting to external sites."
        ),
        "patterns": [
            r"(open\s+redirect|unvalidated\s+redirect)",
        ],
        "keywords": ["open redirect", "unvalidated redirect"],
    },
    "auth_bypass": {
        "name": "Authentication Bypass",
        "explanation": (
            "Authentication bypass lets attackers skip authentication checks, "
            "gaining unauthorized access to protected resources."
        ),
        "severity": "Critical",
        "fix": (
            "Enforce server-side authentication on every protected endpoint. "
            "Use well-tested auth libraries. "
            "Implement MFA and account lockout policies."
        ),
        "patterns": [
            r"(auth\w*\s+bypass|authentication\s+bypass|bypass\s+auth)",
        ],
        "keywords": ["authentication bypass", "auth bypass", "bypass login"],
    },
    "exposed_secrets": {
        "name": "Exposed API Keys / Secrets",
        "explanation": (
            "Hard-coded or exposed API keys/secrets allow attackers to access "
            "third-party services, databases, or internal systems."
        ),
        "severity": "Critical",
        "fix": (
            "Store secrets in environment variables or a secrets manager. "
            "Rotate any exposed credentials immediately. "
            "Scan code with tools like truffleHog or git-secrets before committing."
        ),
        "patterns": [
            r"(exposed\s+(api\s+key|secret|token|credential)|api\s+key\s+leak)",
        ],
        "keywords": ["exposed api key", "api key leak", "exposed secret",
                     "hard-coded credentials"],
    },
    "insecure_cookies": {
        "name": "Insecure Cookies",
        "explanation": (
            "Cookies without Secure, HttpOnly, or SameSite flags can be stolen via "
            "XSS, network sniffing, or CSRF attacks."
        ),
        "severity": "Medium",
        "fix": (
            "Set Secure, HttpOnly, and SameSite=Strict flags on all sensitive cookies. "
            "Use short expiry times for session cookies."
        ),
        "patterns": [
            r"(insecure\s+cookie|cookie\s+security|missing\s+(httponly|secure)\s+flag)",
        ],
        "keywords": ["insecure cookie", "cookie security", "httponly flag",
                     "secure flag", "samesite"],
    },
    "missing_security_headers": {
        "name": "Missing Security Headers",
        "explanation": (
            "Missing HTTP security headers (CSP, HSTS, X-Frame-Options, etc.) "
            "leave applications vulnerable to various client-side attacks."
        ),
        "severity": "Medium",
        "fix": (
            "Add Content-Security-Policy, X-Frame-Options, "
            "Strict-Transport-Security, X-Content-Type-Options, "
            "and Referrer-Policy headers to all responses."
        ),
        "patterns": [
            r"(missing\s+security\s+header|security\s+header|csp\s+header|hsts)",
        ],
        "keywords": ["missing security headers", "csp", "hsts", "x-frame-options",
                     "content security policy"],
    },
    "clickjacking": {
        "name": "Clickjacking",
        "explanation": (
            "Clickjacking tricks users into clicking hidden UI elements embedded "
            "within iframes, potentially performing unintended actions."
        ),
        "severity": "Medium",
        "fix": (
            "Set X-Frame-Options: DENY or SAMEORIGIN. "
            "Use CSP frame-ancestors directive. "
            "Implement frame-busting JavaScript as a secondary defence."
        ),
        "patterns": [
            r"(clickjack|click\s+jack|iframe\s+attack|ui\s+redress)",
        ],
        "keywords": ["clickjacking", "click jacking", "iframe attack",
                     "ui redressing"],
    },
    "exposed_comments": {
        "name": "Exposed Comments / Sensitive Information in Source",
        "explanation": (
            "Developer comments in HTML/JS source code can reveal internal paths, "
            "credentials, logic flaws, or TODOs that aid attackers."
        ),
        "severity": "Low",
        "fix": (
            "Remove sensitive comments before deploying to production. "
            "Use automated pre-commit hooks to detect accidental disclosures."
        ),
        "patterns": [
            r"(exposed\s+comment|sensitive\s+(comment|info\s+in\s+source)|"
            r"html\s+comment\s+leak)",
        ],
        "keywords": ["exposed comments", "sensitive comments",
                     "information disclosure", "source code comments"],
    },
}

# ---------------------------------------------------------------------------
# Module-level keyword cache used by Algorithm 3
# ---------------------------------------------------------------------------
_ALL_KEYWORDS: list = []
_KEYWORD_TO_KEY: dict = {}
for _k, _v in VULNERABILITIES.items():
    for _kw in _v["keywords"]:
        _ALL_KEYWORDS.append(_kw)
        _KEYWORD_TO_KEY[_kw] = _k


# ---------------------------------------------------------------------------
# Algorithm 2: Keyword Matching via Regex Pattern Matching
# ---------------------------------------------------------------------------
def regex_match(user_input: str) -> Optional[str]:
    """Return the first vulnerability key whose regex patterns match user_input."""
    text = user_input.lower()
    for key, vuln in VULNERABILITIES.items():
        for pattern in vuln["patterns"]:
            if re.search(pattern, text, re.IGNORECASE):
                return key
    return None


# ---------------------------------------------------------------------------
# Algorithm 3: Fuzzy String Matching
# ---------------------------------------------------------------------------
def fuzzy_match(user_input: str, threshold: int = 60) -> Optional[str]:
    """
    Try fuzz.partial_ratio against each vulnerability's keyword list.
    Also use difflib.get_close_matches as a secondary pass.
    Returns the vulnerability key with the best score above threshold.
    """
    text = user_input.lower()
    best_key = None
    best_score = 0

    # Pass 1 – fuzzywuzzy partial_ratio
    for key, vuln in VULNERABILITIES.items():
        for kw in vuln["keywords"]:
            score = fuzz.partial_ratio(text, kw)
            if score > best_score:
                best_score = score
                best_key = key

    if best_score >= threshold:
        return best_key

    # Pass 2 – difflib close matches against cached keyword list
    matches = difflib.get_close_matches(text, _ALL_KEYWORDS, n=1, cutoff=0.75)
    if matches:
        return _KEYWORD_TO_KEY[matches[0]]

    return None


# ---------------------------------------------------------------------------
# Main analysis pipeline
# ---------------------------------------------------------------------------
def analyze(user_input: str) -> dict:
    """
    Run the 3-algorithm pipeline and return structured JSON.
    Order: Regex → Fuzzy → Rule-Based Classification (knowledge base lookup)
    """
    # Handle greetings / meta commands before vulnerability detection
    meta = _handle_meta(user_input)
    if meta:
        return meta

    vuln_key = None
    matched_by = None

    # Algorithm 2 – Regex
    vuln_key = regex_match(user_input)
    if vuln_key:
        matched_by = "regex"

    # Algorithm 3 – Fuzzy (fallback)
    if not vuln_key:
        vuln_key = fuzzy_match(user_input)
        if vuln_key:
            matched_by = "fuzzy"

    # Algorithm 1 – Rule-Based lookup
    if vuln_key and vuln_key in VULNERABILITIES:
        vuln = VULNERABILITIES[vuln_key]
        report = _build_report(vuln)
        return {
            "vulnerability": vuln["name"],
            "explanation": vuln["explanation"],
            "severity": vuln["severity"],
            "fix": vuln["fix"],
            "report": report,
            "matched_by": matched_by,
        }

    # Nothing detected
    return {
        "vulnerability": None,
        "explanation": (
            "I couldn't identify a specific vulnerability in your message. "
            "Try asking about SQL Injection, XSS, CSRF, RCE, LFI, RFI, SSRF, "
            "Directory Traversal, Open Redirect, Authentication Bypass, "
            "Exposed API Keys, Insecure Cookies, Missing Security Headers, "
            "Clickjacking, or Exposed Comments."
        ),
        "severity": None,
        "fix": None,
        "report": None,
        "matched_by": None,
    }


def _build_report(vuln: dict) -> str:
    return (
        f"## Security Report: {vuln['name']}\n\n"
        f"**Severity:** {vuln['severity']}\n\n"
        f"**Description:** {vuln['explanation']}\n\n"
        f"**Recommended Fix:** {vuln['fix']}"
    )


def _handle_meta(text: str) -> Optional[dict]:
    """Handle greetings, help, and list commands."""
    t = text.strip().lower()

    greetings = {"hi", "hello", "hey", "greetings", "howdy", "yo"}
    if t in greetings or re.match(r"^(hi|hello|hey)[!,.]?\s*$", t):
        return {
            "vulnerability": None,
            "explanation": (
                "Hello! I'm Baseera Assistant, your AI security advisor. "
                "Ask me about any web vulnerability — e.g., 'What is XSS?' "
                "or 'How do I fix SQL Injection?'"
            ),
            "severity": None,
            "fix": None,
            "report": None,
            "matched_by": "meta:greeting",
        }

    if re.search(r"\b(help|what can you do|capabilities)\b", t):
        vuln_names = ", ".join(v["name"] for v in VULNERABILITIES.values())
        return {
            "vulnerability": None,
            "explanation": (
                f"I can explain, assess severity, and suggest fixes for these "
                f"vulnerabilities: {vuln_names}. "
                "Just ask 'What is <vuln>?' or 'How to fix <vuln>?'"
            ),
            "severity": None,
            "fix": None,
            "report": None,
            "matched_by": "meta:help",
        }

    if re.search(r"\b(list|show all|all vulner)\b", t) or re.match(r"^vulnerabilit", t):
        vuln_list = "\n".join(
            f"- {v['name']} ({v['severity']})"
            for v in VULNERABILITIES.values()
        )
        return {
            "vulnerability": None,
            "explanation": f"Supported vulnerability types:\n{vuln_list}",
            "severity": None,
            "fix": None,
            "report": None,
            "matched_by": "meta:list",
        }

    return None
