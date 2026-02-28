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
                     "union select", "drop table", "sql attack", "database injection",
                     "injection"],
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
        "keywords": ["rce", "remote code execution", "code execution",
                     "command injection", "command execution", "shell injection"],
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
                     "dot dot slash", "file traversal", "folder traversal",
                     "traversal"],
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
        "keywords": ["open redirect", "unvalidated redirect",
                     "url redirect", "redirect vulnerability", "open redirection",
                     "redirect"],
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
        "keywords": ["authentication bypass", "auth bypass", "bypass login",
                     "bypass authentication", "login bypass", "broken authentication",
                     "broken auth"],
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
                     "hard-coded credentials", "api keys", "exposed api", "api key",
                     "exposed keys", "leaked credentials", "hardcoded credentials",
                     "hardcoded secrets", "secret leak", "token leak", "exposed token",
                     "exposed credential", "exposed"],
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
                     "secure flag", "samesite", "insecure cookies", "cookie flags",
                     "cookie vulnerability", "cookie", "cookies"],
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
                     "content security policy", "security headers", "missing headers",
                     "http headers", "csp header", "headers"],
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
                     "ui redressing", "frame attack"],
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
                     "information disclosure", "source code comments",
                     "html comments", "code comments", "developer comments",
                     "exposed comment"],
    },
    "sensitive_files": {
        "name": "Sensitive Files Exposure",
        "explanation": (
            "Sensitive files like .env, .git/config, wp-config.php, backup files, and database dumps "
            "being publicly accessible on a web server can expose credentials, API keys, database passwords, "
            "and internal configuration details to attackers."
        ),
        "severity": "High",
        "fix": (
            "Block access to sensitive files via web server configuration using .htaccess or nginx rules. "
            "Remove unnecessary files from production environments. "
            "Add sensitive files and directories to .gitignore. "
            "Regularly audit publicly accessible files on your server."
        ),
        "patterns": [
            r"(sensitive\s+file|\.env\s+(file|exposed)|wp[-\s]config|database\s+dump|"
            r"backup\s+file|config\s+file\s+exposed|\.git[/\\]config|file\s+exposure)",
        ],
        "keywords": ["sensitive files", "sensitive data files", "sensitive data",
                     "exposed files", "backup files", ".env file", ".env exposed",
                     "config file exposed", "git exposed", ".git/config",
                     "wp-config", "database dump", "file exposure",
                     "sensitive file exposure", "sensitive"],
    },
    "debug_pages": {
        "name": "Debug Pages / Debug Mode Exposure",
        "explanation": (
            "Debug pages and debug mode left enabled in production can reveal stack traces, "
            "environment variables, database queries, internal paths, and other sensitive information "
            "that gives attackers significant advantages."
        ),
        "severity": "Medium",
        "fix": (
            "Disable debug mode in all production environments. "
            "Configure custom error pages that don't reveal internal details. "
            "Remove or restrict access to debug endpoints. "
            "Use environment-specific configuration to ensure debug settings are never enabled in production."
        ),
        "patterns": [
            r"(debug\s+(page|mode|endpoint|enabled|info|information)|stack\s+trace|"
            r"verbose\s+error|development\s+mode|error\s+page\s+leak)",
        ],
        "keywords": ["debug page", "debug pages", "debug mode", "debug endpoint",
                     "debug enabled", "stack trace", "error page", "verbose error",
                     "debug information", "debug info", "development mode", "debug"],
    },
    "csp_issues": {
        "name": "Content Security Policy (CSP) Issues",
        "explanation": (
            "Missing or misconfigured Content Security Policy (CSP) headers allow XSS attacks, "
            "data injection attacks, and unauthorized resource loading. "
            "A properly configured CSP restricts which sources are allowed to serve content to the page, "
            "significantly reducing the attack surface."
        ),
        "severity": "Medium",
        "fix": (
            "Implement a strict Content-Security-Policy header on all responses. "
            "Use nonces or hashes for inline scripts instead of 'unsafe-inline'. "
            "Avoid 'unsafe-eval' in CSP directives. "
            "Enable CSP reporting to detect and fix violations. "
            "Regularly review and tighten your CSP policy."
        ),
        "patterns": [
            r"(csp\s+(issue|misconfiguration|bypass|violation|header|policy)|"
            r"content\s+security\s+policy\s+issue|weak\s+csp)",
        ],
        "keywords": ["csp issue", "csp issues", "csp misconfiguration", "csp bypass",
                     "content security policy issue", "csp violation",
                     "csp header missing", "weak csp", "csp policy"],
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

# Stop words stripped during fuzzy matching to reduce noise
_FUZZY_STOP_WORDS = frozenset({
    "what", "about", "is", "are", "the", "tell", "me", "how", "to",
    "fix", "do", "you", "have", "can", "explain", "describe", "a", "an",
    "i", "want", "know", "learn", "please", "show", "give", "information",
    "on", "regarding", "for", "with", "there",
})


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
def fuzzy_match(user_input: str, threshold: int = 75) -> tuple:
    """
    Returns (vuln_key, score). vuln_key is None if nothing scores above threshold.
    Score is always returned for "did you mean" suggestions.
    """
    if len(user_input.strip()) < 3:
        return None, 0

    text = user_input.lower()

    # Token extraction: strip common noise words to improve matching accuracy
    tokens = [w for w in re.split(r'\W+', text) if w and w not in _FUZZY_STOP_WORDS]
    cleaned = " ".join(tokens)

    # Direct keyword match on cleaned text
    if cleaned and cleaned in _KEYWORD_TO_KEY:
        return _KEYWORD_TO_KEY[cleaned], 100

    # Check if any keyword is contained within the cleaned text
    if cleaned:
        for kw in _ALL_KEYWORDS:
            if kw in cleaned:
                return _KEYWORD_TO_KEY[kw], 95

    best_key = None
    best_score = 0

    # Try fuzzy matching on cleaned text first, then fall back to original
    search_texts = [cleaned, text] if cleaned and cleaned != text else [text]
    for search_text in search_texts:
        for key, vuln in VULNERABILITIES.items():
            for kw in vuln["keywords"]:
                score = fuzz.partial_ratio(search_text, kw)
                if score > best_score:
                    best_score = score
                    best_key = key

    if best_score >= threshold:
        return best_key, best_score

    matches = difflib.get_close_matches(text, _ALL_KEYWORDS, n=1, cutoff=0.75)
    if matches:
        return _KEYWORD_TO_KEY[matches[0]], 75

    return best_key, best_score


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

    # Algorithm 3 – Fuzzy
    if not vuln_key:
        fuzzy_key, fuzzy_score = fuzzy_match(user_input)
        if fuzzy_key and fuzzy_score >= 75:
            vuln_key = fuzzy_key
            matched_by = "fuzzy"
        elif fuzzy_key and fuzzy_score >= 55:
            # Close enough to suggest
            suggested_name = VULNERABILITIES[fuzzy_key]["name"]
            return {
                "vulnerability": None,
                "explanation": (
                    f"Hmm, I'm not sure about that. Did you mean **{suggested_name}**? "
                    f"Reply 'Yes' to learn about it, or ask me about a specific vulnerability.\n\n"
                    "You can ask things like:\n"
                    "• 'What is SQL Injection?'\n"
                    "• 'How to fix XSS?'\n"
                    "• 'Tell me about CSRF'"
                ),
                "severity": None,
                "fix": None,
                "report": None,
                "matched_by": "suggestion",
                "suggested_vuln": fuzzy_key,
            }

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
            "I'm not sure I understood that. I'm best at helping with cybersecurity topics! 🔒\n\n"
            "You can ask me things like:\n"
            "• 'What is SQL Injection?'\n"
            "• 'How to fix XSS?'\n"
            "• 'Tell me about CSRF'\n"
            "• 'List all vulnerabilities'\n\n"
            "Or just say 'help' to see everything I can do!"
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
    """Handle greetings, help, list commands, and rich conversational patterns."""
    t = text.strip().lower()

    def _meta_response(explanation: str, tag: str) -> dict:
        return {
            "vulnerability": None,
            "explanation": explanation,
            "severity": None,
            "fix": None,
            "report": None,
            "matched_by": tag,
        }

    # Greetings
    greetings = {
        "hi", "hello", "hey", "greetings", "howdy", "yo", "sup", "wassup",
        "good morning", "good afternoon", "good evening",
        "good night",
    }
    if t in greetings or re.match(r"^(hi|hello|hey|howdy|yo|sup|wassup)[!,.]?\s*$", t):
        return _meta_response(
            "Hello! 👋 I'm Baseera Assistant, your AI-powered security advisor. "
            "Ask me about any web vulnerability — e.g., 'What is XSS?' "
            "or 'How do I fix SQL Injection?'",
            "meta:greeting",
        )

    # How are you
    if re.search(
        r"\b(how are you|how are you doing|how'?s it going|how do you do|"
        r"are you okay|you good)\b",
        t,
    ):
        return _meta_response(
            "I'm doing great, thanks for asking! 😊 "
            "I'm always ready to help you with cybersecurity questions. "
            "What would you like to know about?",
            "meta:how_are_you",
        )

    # What is Baseera?
    if re.search(
        r"\b(what is baseera|tell me about baseera|who is baseera|about baseera|explain baseera|describe baseera|baseera platform|what does baseera do|what'?s baseera)\b",
        t,
    ):
        return _meta_response(
            "Baseera is a cybersecurity platform with a browser extension that helps detect vulnerabilities and security risks in websites. "
            "It analyzes web applications, highlights potential issues, and provides clear explanations and remediation guidance to improve overall security.",
            "meta:about_baseera",
        )

    # Who is Baseera AI?
    if re.search(
        r"\b(baseera ai|baseera assistant|who are you|what are you|your name|introduce yourself|what is your name|what'?s your name|tell me about yourself|what do you do)\b",
        t,
    ):
        return _meta_response(
            "Baseera AI is an intelligent cybersecurity assistant that explains web application vulnerabilities, evaluates their severity, "
            "and provides structured recommendations for mitigation and secure implementation.",
            "meta:identity",
        )

    # Thanks
    if re.search(
        r"\b(thank you|thanks|thx|appreciate it|much appreciated|thanks a lot|"
        r"thank you so much|ty)\b",
        t,
    ):
        return _meta_response(
            "You're welcome! 😊 "
            "Feel free to ask me anything else about security vulnerabilities.",
            "meta:thanks",
        )

    # Goodbye
    if re.search(
        r"\b(bye|goodbye|see you|later|take care|good night|gn|see ya|cya)\b",
        t,
    ):
        return _meta_response(
            "Goodbye! Stay safe online! 🔒 "
            "Come back anytime you need security advice.",
            "meta:goodbye",
        )

    # Affirmative / OK
    if re.search(
        r"^(ok|okay|got it|understood|sure|alright|cool|nice|great|awesome|"
        r"perfect|good|yes|yep|yeah|right)[!.,]?\s*$",
        t,
    ):
        return _meta_response(
            "Great! Let me know if you have any other security questions. "
            "I'm here to help! 💪",
            "meta:affirmative",
        )

    # Negative
    if re.search(
        r"^(no|nope|nah|not really|never mind|forget it|cancel)[!.,]?\s*$",
        t,
    ):
        return _meta_response(
            "No problem! Feel free to ask whenever you're ready. 😊",
            "meta:negative",
        )

    # Compliments
    if re.search(
        r"\b(you'?re great|nice work|good job|well done|amazing|impressive)\b",
        t,
    ):
        return _meta_response(
            "Thank you, that means a lot! 😊 "
            "I'm always here to help you stay secure. "
            "Is there anything else you'd like to know?",
            "meta:compliment",
        )

    # Jokes / Fun
    if re.search(r"\b(tell me a joke|make me laugh)\b", t) or t == "funny":
        return _meta_response(
            "Why did the hacker break up with the internet? "
            "Because it had too many open connections! 😄 "
            "Now, shall we get back to serious security topics?",
            "meta:joke",
        )

    # General off-topic questions
    if re.search(
        r"\b(what time is it|what'?s the weather|what day is it)\b",
        t,
    ):
        return _meta_response(
            "I'm a security assistant, so I don't have access to the time or weather. 😊 "
            "But I'm happy to help with any cybersecurity questions you have!",
            "meta:off_topic",
        )

    # Profanity / abuse (simple heuristic)
    if re.search(r"\b(damn|shit|fuck|bastard|idiot|stupid bot)\b", t):
        return _meta_response(
            "I'm here to help you with cybersecurity topics! 😊 "
            "Let's keep it professional — feel free to ask me anything about security.",
            "meta:profanity",
        )

    # Help / capabilities (but NOT if a vulnerability name follows)
    if re.search(r"\b(help|what can you do|capabilities)\b", t):
        # Check if the message also contains a vulnerability keyword
        has_vuln = False
        for vuln in VULNERABILITIES.values():
            for kw in vuln["keywords"]:
                if kw in t:
                    has_vuln = True
                    break
            if has_vuln:
                break
        if not has_vuln:
            vuln_names = ", ".join(v["name"] for v in VULNERABILITIES.values())
            return _meta_response(
                f"I can explain, assess severity, and suggest fixes for these "
                f"vulnerabilities: {vuln_names}. "
                "Just ask 'What is <vuln>?' or 'How to fix <vuln>?'",
                "meta:help",
            )

    # Show vulnerabilities by severity (supports multiple: "show low and medium vulnerabilities")
    severity_levels = {"critical", "high", "medium", "low"}
    # Check if the message is asking about vulnerabilities by severity
    if re.search(r"\b(show|list|display|get|what\s+are|tell\s+me\s+about|give\s+me)\b.*vulnerabilit", t) or \
       re.search(r"vulnerabilit.*\b(critical|high|medium|low)\b", t):
        found_severities = [s for s in severity_levels if s in t]
        if found_severities:
            filtered = []
            labels = []
            for sev in ["critical", "high", "medium", "low"]:  # fixed order
                if sev in found_severities:
                    labels.append(sev.capitalize())
                    for v in VULNERABILITIES.values():
                        if v["severity"].lower() == sev:
                            filtered.append(f"- {v['name']} ({v['severity']})")
            if filtered:
                label_str = " & ".join(labels)
                return _meta_response(
                    f"{label_str} severity vulnerabilities:\n" + "\n".join(filtered),
                    f"meta:list:{'+'.join(s.lower() for s in labels)}",
                )

    # Show vulnerabilities by severity (simple pattern)
    severity_match = re.search(r"\b(show|list|display|get)\s+(critical|high|medium|low)\b", t)
    if severity_match:
        target_severity = severity_match.group(2).capitalize()
        filtered = [
            f"- {v['name']} ({v['severity']})"
            for v in VULNERABILITIES.values()
            if v["severity"].lower() == target_severity.lower()
        ]
        if filtered:
            return _meta_response(
                f"{target_severity} severity vulnerabilities:\n" + "\n".join(filtered),
                f"meta:list:{target_severity.lower()}",
            )

    # List all vulnerabilities
    if re.search(
        r"\b(list|show all)\b"
        r"|\b(all|every)\s+vulner"
        r"|\b(what|which)\s+(all\s+(the\s+)?)?vulner"
        r"|\bwhat\s+are\s+(the\s+)?vulner"
        r"|\bwhat\s+are\s+your\s+vulner"
        r"|\bwhat\s+(types?\s+of\s+)?vulner"
        r"|\bwhat\s+vulns?\b"
        r"|\bhow\s+many\s+vulner"
        r"|\byour\s+vulner"
        r"|\bdo\s+you\s+(have|know).*vulner"
        r"|\bwhat\s+do\s+you\s+(know|support)([!?,.\s]*$|.*vulner)"
        r"|\bwhat\s+can\s+you\s+(detect|scan)([!?,.\s]*$|.*vulner)"
        r"|\bshow\s+me\s+vulner"
        r"|\btell\s+me\s+(all\s+)?vulner",
        t,
    ) or re.match(r"^vulnerabilit", t):
        vuln_list = "\n".join(
            f"- {v['name']} ({v['severity']})"
            for v in VULNERABILITIES.values()
        )
        return _meta_response(
            f"Supported vulnerability types:\n{vuln_list}",
            "meta:list",
        )

    return None
