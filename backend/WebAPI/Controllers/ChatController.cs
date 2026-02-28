using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Application.DTOs.Common;
using System.Text;
using System.Text.Json;
using System.Linq;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ChatController> _logger;
    private readonly string _aiServiceUrl;

    public ChatController(IHttpClientFactory httpClientFactory, ILogger<ChatController> logger, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _aiServiceUrl = configuration.GetValue<string>("AIChatServiceUrl") ?? "http://localhost:5001";
    }

    /// <summary>
    /// Send a chat message to the Baseera AI assistant.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ResponseDto<object>>> Chat([FromBody] ChatRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new ResponseDto<object>
            {
                Success = false,
                Message = "Message cannot be empty.",
                Data = null
            });
        }

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(30);

            var payload = JsonSerializer.Serialize(new { message = request.Message });
            var content = new StringContent(payload, Encoding.UTF8, "application/json");

            var response = await client.PostAsync($"{_aiServiceUrl}/analyze", content);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<object>(json);

            return Ok(new ResponseDto<object>
            {
                Success = true,
                Message = "Analysis complete.",
                Data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AI service unavailable, falling back to keyword detection.");
            var fallback = KeywordFallback(request.Message);
            return Ok(new ResponseDto<object>
            {
                Success = true,
                Message = "Analysis complete (fallback mode).",
                Data = fallback
            });
        }
    }

    private static object KeywordFallback(string message)
    {
        var lower = message.ToLowerInvariant().Trim();

        // ── Conversational patterns (checked before keyword matching) ──────────
        var greetingPattern = new[] { "hi", "hello", "hey", "howdy", "yo", "sup", "wassup",
            "good morning", "good afternoon", "good evening", "good night" };
        if (Array.Exists(greetingPattern, g => lower == g) ||
            System.Text.RegularExpressions.Regex.IsMatch(lower, @"^(hi|hello|hey|howdy|yo|sup)[!,.]?\s*$"))
        {
            return ConversationalResponse(
                "Hello! 👋 I'm Baseera Assistant, your AI-powered security advisor. " +
                "Ask me about any web vulnerability — e.g., 'What is XSS?' or 'How do I fix SQL Injection?'",
                "meta:greeting");
        }

        if (System.Text.RegularExpressions.Regex.IsMatch(lower,
            @"\b(how are you|how are you doing|how'?s it going|how do you do|are you okay|you good)\b"))
        {
            return ConversationalResponse(
                "I'm doing great, thanks for asking! 😊 I'm always ready to help you with cybersecurity questions. " +
                "What would you like to know about?",
                "meta:how_are_you");
        }

        // What is Baseera? / Tell me about Baseera
        if (System.Text.RegularExpressions.Regex.IsMatch(lower,
            @"\b(what is baseera|tell me about baseera|who is baseera|about baseera|explain baseera|describe baseera|baseera platform|what does baseera do|what(')?s baseera)\b"))
        {
            return ConversationalResponse(
                "Baseera is a cybersecurity platform with a browser extension that helps detect vulnerabilities and security risks in websites. " +
                "It analyzes web applications, highlights potential issues, and provides clear explanations and remediation guidance to improve overall security.",
                "meta:about_baseera");
        }

        // Who is Baseera AI? / What is Baseera AI?
        if (System.Text.RegularExpressions.Regex.IsMatch(lower,
            @"\b(baseera ai|baseera assistant|who are you|what are you|your name|introduce yourself|what is your name|what(')?s your name|tell me about yourself|what do you do)\b"))
        {
            return ConversationalResponse(
                "Baseera AI is an intelligent cybersecurity assistant that explains web application vulnerabilities, evaluates their severity, " +
                "and provides structured recommendations for mitigation and secure implementation.",
                "meta:identity");
        }

        if (System.Text.RegularExpressions.Regex.IsMatch(lower,
            @"\b(thank you|thanks|thx|appreciate it|much appreciated|thanks a lot|thank you so much|ty)\b"))
        {
            return ConversationalResponse(
                "You're welcome! 😊 Feel free to ask me anything else about security vulnerabilities.",
                "meta:thanks");
        }

        if (System.Text.RegularExpressions.Regex.IsMatch(lower,
            @"\b(bye|goodbye|see you|later|take care|good night|gn|see ya|cya)\b"))
        {
            return ConversationalResponse(
                "Goodbye! Stay safe online! 🔒 Come back anytime you need security advice.",
                "meta:goodbye");
        }

        if (System.Text.RegularExpressions.Regex.IsMatch(lower,
            @"^(ok|okay|got it|understood|sure|alright|cool|nice|great|awesome|perfect|good|yes|yep|yeah|right)[!.,]?\s*$"))
        {
            return ConversationalResponse(
                "Great! Let me know if you have any other security questions. I'm here to help! 💪",
                "meta:affirmative");
        }

        // ── Vulnerability keyword matching with full explanations ──────────────
        var keywords = new Dictionary<string, (string name, string severity, string explanation, string fix)>
        {
            ["sql injection"] = ("SQL Injection", "Critical",
                "SQL Injection occurs when an attacker inserts or manipulates SQL queries via user-supplied input, allowing them to read, modify, or delete database data.",
                "Use parameterized queries / prepared statements. Apply input validation and least-privilege DB accounts. Use an ORM and avoid dynamic SQL concatenation."),
            ["sqli"] = ("SQL Injection", "Critical",
                "SQL Injection occurs when an attacker inserts or manipulates SQL queries via user-supplied input, allowing them to read, modify, or delete database data.",
                "Use parameterized queries / prepared statements. Apply input validation and least-privilege DB accounts."),
            ["sql attack"] = ("SQL Injection", "Critical",
                "SQL Injection occurs when an attacker inserts or manipulates SQL queries via user-supplied input, allowing them to read, modify, or delete database data.",
                "Use parameterized queries / prepared statements. Apply input validation and least-privilege DB accounts."),
            ["database injection"] = ("SQL Injection", "Critical",
                "SQL Injection occurs when an attacker inserts or manipulates SQL queries via user-supplied input, allowing them to read, modify, or delete database data.",
                "Use parameterized queries / prepared statements. Apply input validation and least-privilege DB accounts."),
            ["xss"] = ("Cross-Site Scripting (XSS)", "High",
                "XSS allows attackers to inject malicious scripts into web pages viewed by other users, enabling session hijacking, credential theft, and defacement.",
                "Encode all output (HTML-encode user-supplied data). Use Content-Security-Policy headers. Validate and sanitize every input on the server side."),
            ["cross-site scripting"] = ("Cross-Site Scripting (XSS)", "High",
                "XSS allows attackers to inject malicious scripts into web pages viewed by other users, enabling session hijacking, credential theft, and defacement.",
                "Encode all output. Use Content-Security-Policy headers. Validate and sanitize every input on the server side."),
            ["cross site scripting"] = ("Cross-Site Scripting (XSS)", "High",
                "XSS allows attackers to inject malicious scripts into web pages viewed by other users, enabling session hijacking, credential theft, and defacement.",
                "Encode all output. Use Content-Security-Policy headers. Validate and sanitize every input on the server side."),
            ["csrf"] = ("Cross-Site Request Forgery (CSRF)", "Medium",
                "CSRF tricks authenticated users into submitting unwanted requests, allowing attackers to perform actions on their behalf.",
                "Use CSRF tokens on all state-changing forms/requests. Validate the Origin/Referer header. Use SameSite=Strict or SameSite=Lax cookie attribute."),
            ["xsrf"] = ("Cross-Site Request Forgery (CSRF)", "Medium",
                "CSRF tricks authenticated users into submitting unwanted requests, allowing attackers to perform actions on their behalf.",
                "Use CSRF tokens on all state-changing forms/requests. Validate the Origin/Referer header. Use SameSite cookie attribute."),
            ["rce"] = ("Remote Code Execution (RCE)", "Critical",
                "RCE lets an attacker execute arbitrary code on the server, potentially leading to full system compromise.",
                "Never pass user input to shell commands. Use safe APIs instead of exec()/system(). Apply strict input validation and sandboxing."),
            ["remote code execution"] = ("Remote Code Execution (RCE)", "Critical",
                "RCE lets an attacker execute arbitrary code on the server, potentially leading to full system compromise.",
                "Never pass user input to shell commands. Use safe APIs instead of exec()/system(). Apply strict input validation and sandboxing."),
            ["command injection"] = ("Remote Code Execution (RCE)", "Critical",
                "Command injection lets an attacker execute arbitrary OS commands on the server.",
                "Never pass user input to shell commands. Use safe APIs. Apply strict input validation and sandboxing."),
            ["command execution"] = ("Remote Code Execution (RCE)", "Critical",
                "Command execution vulnerabilities let an attacker run arbitrary commands on the server.",
                "Never pass user input to shell commands. Use safe APIs. Apply strict input validation and sandboxing."),
            ["shell injection"] = ("Remote Code Execution (RCE)", "Critical",
                "Shell injection lets an attacker inject shell commands via user-supplied input.",
                "Never pass user input to shell commands. Use safe APIs. Apply strict input validation and sandboxing."),
            ["lfi"] = ("Local File Inclusion (LFI)", "High",
                "LFI allows an attacker to include files from the server's filesystem, potentially exposing sensitive data or executing server-side code.",
                "Whitelist allowed file paths/names. Never pass raw user input to file-include functions. Use realpath() and verify paths stay within the intended directory."),
            ["local file inclusion"] = ("Local File Inclusion (LFI)", "High",
                "LFI allows an attacker to include files from the server's filesystem, potentially exposing sensitive data or executing server-side code.",
                "Whitelist allowed file paths/names. Never pass raw user input to file-include functions."),
            ["rfi"] = ("Remote File Inclusion (RFI)", "Critical",
                "RFI enables attackers to include remote files (often containing malicious code) into the application's execution flow.",
                "Disable allow_url_include in PHP. Whitelist all allowed includes. Validate and sanitize file path parameters."),
            ["remote file inclusion"] = ("Remote File Inclusion (RFI)", "Critical",
                "RFI enables attackers to include remote files into the application's execution flow.",
                "Disable allow_url_include in PHP. Whitelist all allowed includes. Validate and sanitize file path parameters."),
            ["ssrf"] = ("Server-Side Request Forgery (SSRF)", "High",
                "SSRF allows attackers to induce the server to make HTTP requests to unintended locations, potentially accessing internal services.",
                "Validate and whitelist allowed URLs/IP ranges. Block requests to internal/metadata IPs. Use a dedicated HTTP client with timeouts."),
            ["server-side request forgery"] = ("Server-Side Request Forgery (SSRF)", "High",
                "SSRF allows attackers to induce the server to make HTTP requests to unintended locations, potentially accessing internal services.",
                "Validate and whitelist allowed URLs/IP ranges. Block requests to internal/metadata IPs."),
            ["server side request forgery"] = ("Server-Side Request Forgery (SSRF)", "High",
                "SSRF allows attackers to induce the server to make HTTP requests to unintended locations, potentially accessing internal services.",
                "Validate and whitelist allowed URLs/IP ranges. Block requests to internal/metadata IPs."),
            ["directory traversal"] = ("Directory Traversal", "High",
                "Directory traversal lets attackers access files and directories outside the intended web root by manipulating file paths.",
                "Sanitize all user-supplied file paths. Use canonical path checks. Restrict the application to a defined base directory."),
            ["path traversal"] = ("Directory Traversal", "High",
                "Path traversal lets attackers access files outside the intended web root by manipulating file paths.",
                "Sanitize all user-supplied file paths. Use canonical path checks. Restrict the application to a defined base directory."),
            ["file traversal"] = ("Directory Traversal", "High",
                "File traversal lets attackers access files outside the intended web root by manipulating file paths.",
                "Sanitize all user-supplied file paths. Use canonical path checks. Restrict the application to a defined base directory."),
            ["folder traversal"] = ("Directory Traversal", "High",
                "Folder traversal lets attackers access directories outside the intended web root.",
                "Sanitize all user-supplied file paths. Use canonical path checks. Restrict the application to a defined base directory."),
            ["open redirect"] = ("Open Redirect", "Medium",
                "Open redirect occurs when an application accepts an untrusted URL as a redirect target, enabling phishing and credential-theft attacks.",
                "Whitelist redirect destinations. Use relative paths or server-side token validation. Warn users when redirecting to external sites."),
            ["url redirect"] = ("Open Redirect", "Medium",
                "Open redirect occurs when an application accepts an untrusted URL as a redirect target, enabling phishing attacks.",
                "Whitelist redirect destinations. Use relative paths or server-side token validation."),
            ["redirect vulnerability"] = ("Open Redirect", "Medium",
                "Open redirect occurs when an application accepts an untrusted URL as a redirect target, enabling phishing attacks.",
                "Whitelist redirect destinations. Use relative paths or server-side token validation."),
            ["open redirection"] = ("Open Redirect", "Medium",
                "Open redirect occurs when an application accepts an untrusted URL as a redirect target, enabling phishing attacks.",
                "Whitelist redirect destinations. Use relative paths or server-side token validation."),
            ["authentication bypass"] = ("Authentication Bypass", "Critical",
                "Authentication bypass lets attackers skip authentication checks, gaining unauthorized access to protected resources.",
                "Enforce server-side authentication on every protected endpoint. Use well-tested auth libraries. Implement MFA and account lockout policies."),
            ["auth bypass"] = ("Authentication Bypass", "Critical",
                "Authentication bypass lets attackers skip authentication checks, gaining unauthorized access to protected resources.",
                "Enforce server-side authentication on every protected endpoint. Use well-tested auth libraries."),
            ["bypass authentication"] = ("Authentication Bypass", "Critical",
                "Authentication bypass lets attackers skip authentication checks, gaining unauthorized access to protected resources.",
                "Enforce server-side authentication on every protected endpoint. Use well-tested auth libraries."),
            ["login bypass"] = ("Authentication Bypass", "Critical",
                "Login bypass lets attackers skip the login process, gaining unauthorized access to protected resources.",
                "Enforce server-side authentication on every protected endpoint. Use well-tested auth libraries."),
            ["broken authentication"] = ("Authentication Bypass", "Critical",
                "Broken authentication lets attackers compromise credentials or sessions to gain unauthorized access.",
                "Enforce server-side authentication on every protected endpoint. Use well-tested auth libraries. Implement MFA."),
            ["broken auth"] = ("Authentication Bypass", "Critical",
                "Broken authentication lets attackers compromise credentials or sessions to gain unauthorized access.",
                "Enforce server-side authentication on every protected endpoint. Use well-tested auth libraries. Implement MFA."),
            ["exposed api key"] = ("Exposed API Keys / Secrets", "Critical",
                "Hard-coded or exposed API keys/secrets allow attackers to access third-party services, databases, or internal systems.",
                "Store secrets in environment variables or a secrets manager. Rotate any exposed credentials immediately. Scan code with tools like truffleHog before committing."),
            ["api key leak"] = ("Exposed API Keys / Secrets", "Critical",
                "Exposed API keys allow attackers to access third-party services or internal systems.",
                "Store secrets in environment variables or a secrets manager. Rotate any exposed credentials immediately."),
            ["api keys"] = ("Exposed API Keys / Secrets", "Critical",
                "Exposed API keys allow attackers to access third-party services or internal systems.",
                "Store secrets in environment variables or a secrets manager. Rotate any exposed credentials immediately."),
            ["api key"] = ("Exposed API Keys / Secrets", "Critical",
                "Exposed API keys allow attackers to access third-party services or internal systems.",
                "Store secrets in environment variables or a secrets manager. Rotate any exposed credentials immediately."),
            ["exposed api"] = ("Exposed API Keys / Secrets", "Critical",
                "Exposed API credentials allow attackers to access third-party services or internal systems.",
                "Store secrets in environment variables or a secrets manager. Rotate any exposed credentials immediately."),
            ["exposed keys"] = ("Exposed API Keys / Secrets", "Critical",
                "Exposed API keys or secrets allow attackers to access third-party services or internal systems.",
                "Store secrets in environment variables or a secrets manager. Rotate any exposed credentials immediately."),
            ["leaked credentials"] = ("Exposed API Keys / Secrets", "Critical",
                "Leaked credentials allow attackers to access systems or services.",
                "Store secrets in environment variables or a secrets manager. Rotate any exposed credentials immediately."),
            ["hardcoded credentials"] = ("Exposed API Keys / Secrets", "Critical",
                "Hard-coded credentials in source code allow attackers to access systems or services.",
                "Store secrets in environment variables or a secrets manager. Remove hardcoded credentials immediately."),
            ["hardcoded secrets"] = ("Exposed API Keys / Secrets", "Critical",
                "Hard-coded secrets in source code allow attackers to access systems or services.",
                "Store secrets in environment variables or a secrets manager. Remove hardcoded secrets immediately."),
            ["secret leak"] = ("Exposed API Keys / Secrets", "Critical",
                "Leaked secrets allow attackers to access systems or services.",
                "Store secrets in environment variables or a secrets manager. Rotate any exposed credentials immediately."),
            ["token leak"] = ("Exposed API Keys / Secrets", "Critical",
                "Leaked tokens allow attackers to access systems or services.",
                "Store tokens in environment variables or a secrets manager. Rotate any exposed tokens immediately."),
            ["insecure cookie"] = ("Insecure Cookies", "Medium",
                "Cookies without Secure, HttpOnly, or SameSite flags can be stolen via XSS, network sniffing, or CSRF attacks.",
                "Set Secure, HttpOnly, and SameSite=Strict flags on all sensitive cookies. Use short expiry times for session cookies."),
            ["insecure cookies"] = ("Insecure Cookies", "Medium",
                "Cookies without Secure, HttpOnly, or SameSite flags can be stolen via XSS, network sniffing, or CSRF attacks.",
                "Set Secure, HttpOnly, and SameSite=Strict flags on all sensitive cookies. Use short expiry times for session cookies."),
            ["cookie flags"] = ("Insecure Cookies", "Medium",
                "Missing cookie security flags (Secure, HttpOnly, SameSite) can lead to session theft.",
                "Set Secure, HttpOnly, and SameSite=Strict flags on all sensitive cookies."),
            ["cookie vulnerability"] = ("Insecure Cookies", "Medium",
                "Cookie vulnerabilities can allow session theft via XSS or network sniffing.",
                "Set Secure, HttpOnly, and SameSite=Strict flags on all sensitive cookies."),
            ["missing security header"] = ("Missing Security Headers", "Medium",
                "Missing HTTP security headers (CSP, HSTS, X-Frame-Options, etc.) leave applications vulnerable to various client-side attacks.",
                "Add Content-Security-Policy, X-Frame-Options, Strict-Transport-Security, X-Content-Type-Options, and Referrer-Policy headers to all responses."),
            ["security headers"] = ("Missing Security Headers", "Medium",
                "Missing HTTP security headers leave applications vulnerable to various client-side attacks.",
                "Add Content-Security-Policy, X-Frame-Options, Strict-Transport-Security, X-Content-Type-Options, and Referrer-Policy headers to all responses."),
            ["missing headers"] = ("Missing Security Headers", "Medium",
                "Missing HTTP security headers leave applications vulnerable to various client-side attacks.",
                "Add Content-Security-Policy, X-Frame-Options, Strict-Transport-Security, X-Content-Type-Options, and Referrer-Policy headers to all responses."),
            ["http headers"] = ("Missing Security Headers", "Medium",
                "Missing HTTP security headers leave applications vulnerable to various client-side attacks.",
                "Add Content-Security-Policy, X-Frame-Options, Strict-Transport-Security, X-Content-Type-Options, and Referrer-Policy headers to all responses."),
            ["csp header"] = ("Missing Security Headers", "Medium",
                "A missing or weak Content-Security-Policy header leaves applications vulnerable to XSS and data injection.",
                "Add a strong Content-Security-Policy header to all responses."),
            ["clickjacking"] = ("Clickjacking", "Medium",
                "Clickjacking tricks users into clicking hidden UI elements embedded within iframes, potentially performing unintended actions.",
                "Set X-Frame-Options: DENY or SAMEORIGIN. Use CSP frame-ancestors directive. Implement frame-busting JavaScript as a secondary defence."),
            ["click jacking"] = ("Clickjacking", "Medium",
                "Clickjacking tricks users into clicking hidden UI elements embedded within iframes.",
                "Set X-Frame-Options: DENY or SAMEORIGIN. Use CSP frame-ancestors directive."),
            ["frame attack"] = ("Clickjacking", "Medium",
                "Frame-based attacks trick users into clicking hidden UI elements embedded within iframes.",
                "Set X-Frame-Options: DENY or SAMEORIGIN. Use CSP frame-ancestors directive."),
            ["exposed comments"] = ("Exposed Comments / Sensitive Information in Source", "Low",
                "Developer comments in HTML/JS source code can reveal internal paths, credentials, logic flaws, or TODOs that aid attackers.",
                "Remove sensitive comments before deploying to production. Use automated pre-commit hooks to detect accidental disclosures."),
            ["html comments"] = ("Exposed Comments / Sensitive Information in Source", "Low",
                "HTML comments visible in page source can reveal internal paths, credentials, or logic flaws.",
                "Remove sensitive comments before deploying to production."),
            ["code comments"] = ("Exposed Comments / Sensitive Information in Source", "Low",
                "Comments left in source code can reveal internal paths, credentials, or logic flaws.",
                "Remove sensitive comments before deploying to production."),
            ["developer comments"] = ("Exposed Comments / Sensitive Information in Source", "Low",
                "Developer comments in source code can reveal internal paths, credentials, or logic flaws.",
                "Remove sensitive comments before deploying to production."),
            ["sensitive files"] = ("Sensitive Files Exposure", "High",
                "Sensitive files like .env, .git/config, wp-config.php, and backup files being publicly accessible can expose credentials, API keys, and internal configuration.",
                "Block access to sensitive files via web server configuration. Remove unnecessary files from production. Add sensitive files to .gitignore."),
            ["sensitive data"] = ("Sensitive Files Exposure", "High",
                "Sensitive data or files being publicly accessible can expose credentials, API keys, and internal configuration.",
                "Block access to sensitive files via web server configuration. Remove unnecessary files from production. Add sensitive files to .gitignore."),
            ["exposed files"] = ("Sensitive Files Exposure", "High",
                "Exposed files on the web server can reveal credentials, API keys, and internal configuration.",
                "Block access to sensitive files via web server configuration. Remove unnecessary files from production."),
            ["backup files"] = ("Sensitive Files Exposure", "High",
                "Backup files left accessible on the web server can expose database dumps, credentials, and source code.",
                "Remove backup files from production. Block access via web server configuration."),
            [".env file"] = ("Sensitive Files Exposure", "High",
                "An accessible .env file exposes environment variables including API keys, database passwords, and other secrets.",
                "Block access to .env files via web server configuration. Never commit .env files to version control."),
            ["database dump"] = ("Sensitive Files Exposure", "High",
                "An accessible database dump file exposes all database contents including credentials and sensitive data.",
                "Remove database dumps from web-accessible directories. Store backups in secure, non-public locations."),
            ["file exposure"] = ("Sensitive Files Exposure", "High",
                "Exposed files on the web server can reveal credentials, API keys, and internal configuration.",
                "Block access to sensitive files via web server configuration. Remove unnecessary files from production."),
            ["debug page"] = ("Debug Pages / Debug Mode Exposure", "Medium",
                "Debug pages left enabled in production can reveal stack traces, environment variables, and sensitive internal information.",
                "Disable debug mode in production. Configure custom error pages. Remove debug endpoints."),
            ["debug pages"] = ("Debug Pages / Debug Mode Exposure", "Medium",
                "Debug pages left enabled in production can reveal stack traces, environment variables, and sensitive internal information.",
                "Disable debug mode in production. Configure custom error pages. Remove debug endpoints."),
            ["debug mode"] = ("Debug Pages / Debug Mode Exposure", "Medium",
                "Debug mode enabled in production can reveal stack traces, environment variables, and sensitive internal information.",
                "Disable debug mode in all production environments. Use environment-specific configuration."),
            ["stack trace"] = ("Debug Pages / Debug Mode Exposure", "Medium",
                "Exposed stack traces reveal internal application paths, library versions, and code structure to attackers.",
                "Disable debug mode in production. Configure custom error pages that don't reveal internal details."),
            ["debug information"] = ("Debug Pages / Debug Mode Exposure", "Medium",
                "Exposed debug information can reveal stack traces, environment variables, and sensitive internal data.",
                "Disable debug mode in production. Configure custom error pages. Remove debug endpoints."),
            ["development mode"] = ("Debug Pages / Debug Mode Exposure", "Medium",
                "Development mode enabled in production can expose debug information and sensitive configuration.",
                "Disable development/debug mode in all production environments."),
            ["csp issue"] = ("Content Security Policy (CSP) Issues", "Medium",
                "Missing or misconfigured CSP headers allow XSS attacks, data injection, and unauthorized resource loading.",
                "Implement a strict Content-Security-Policy header. Use nonces or hashes for inline scripts. Avoid 'unsafe-inline' and 'unsafe-eval'."),
            ["csp issues"] = ("Content Security Policy (CSP) Issues", "Medium",
                "Missing or misconfigured CSP headers allow XSS attacks, data injection, and unauthorized resource loading.",
                "Implement a strict Content-Security-Policy header. Use nonces or hashes for inline scripts. Avoid 'unsafe-inline' and 'unsafe-eval'."),
            ["csp misconfiguration"] = ("Content Security Policy (CSP) Issues", "Medium",
                "A misconfigured CSP header can be bypassed, allowing XSS attacks and unauthorized resource loading.",
                "Review and tighten your CSP policy. Use nonces or hashes for inline scripts. Enable CSP reporting."),
            ["csp bypass"] = ("Content Security Policy (CSP) Issues", "Medium",
                "CSP bypass vulnerabilities allow attackers to circumvent Content Security Policy protections.",
                "Review and tighten your CSP policy. Use nonces or hashes for inline scripts. Avoid 'unsafe-inline' and 'unsafe-eval'."),
            ["content security policy issue"] = ("Content Security Policy (CSP) Issues", "Medium",
                "Missing or misconfigured CSP headers allow XSS attacks, data injection, and unauthorized resource loading.",
                "Implement a strict Content-Security-Policy header. Use nonces or hashes for inline scripts. Avoid 'unsafe-inline' and 'unsafe-eval'."),
            ["weak csp"] = ("Content Security Policy (CSP) Issues", "Medium",
                "A weak Content Security Policy can be bypassed, allowing XSS attacks and unauthorized resource loading.",
                "Review and tighten your CSP policy. Use nonces or hashes for inline scripts. Enable CSP reporting."),
            ["csp policy"] = ("Content Security Policy (CSP) Issues", "Medium",
                "Missing or weak CSP policies allow XSS attacks and unauthorized resource loading.",
                "Implement a strict Content-Security-Policy header. Use nonces or hashes for inline scripts."),
        };

        if (System.Text.RegularExpressions.Regex.IsMatch(lower,
            @"\b(help|what can you do|capabilities)\b"))
        {
            // Don't show help if message also contains a vulnerability keyword
            bool hasVuln = false;
            foreach (var kv in keywords)
            {
                if (lower.Contains(kv.Key))
                {
                    hasVuln = true;
                    break;
                }
            }
            if (!hasVuln)
            {
                return ConversationalResponse(
                    "I can explain vulnerabilities, assess their severity, and suggest fixes for: " +
                    "SQL Injection, XSS, CSRF, RCE, LFI, RFI, SSRF, Directory Traversal, Open Redirect, " +
                    "Authentication Bypass, Exposed API Keys, Insecure Cookies, Missing Security Headers, " +
                    "Clickjacking, Exposed Comments, Sensitive Files Exposure, Debug Pages / Debug Mode Exposure, " +
                    "and Content Security Policy (CSP) Issues. Just ask 'What is <vuln>?' or 'How to fix <vuln>?'",
                    "meta:help");
            }
        }

        // Show vulnerabilities by severity – supports multiple severities
        var severityMap = new Dictionary<string, string[]>
        {
            ["critical"] = new[] { "SQL Injection", "RCE", "RFI", "Authentication Bypass", "Exposed API Keys" },
            ["high"] = new[] { "XSS", "LFI", "SSRF", "Directory Traversal", "Sensitive Files Exposure" },
            ["medium"] = new[] { "CSRF", "Open Redirect", "Insecure Cookies", "Missing Security Headers", "Clickjacking", "Debug Pages / Debug Mode Exposure", "Content Security Policy (CSP) Issues" },
            ["low"] = new[] { "Exposed Comments" },
        };

        bool asksAboutVulns = System.Text.RegularExpressions.Regex.IsMatch(lower,
            @"\b(show|list|display|get|what\s+are|tell\s+me\s+about|give\s+me)\b.*vulnerabilit") ||
            System.Text.RegularExpressions.Regex.IsMatch(lower,
            @"vulnerabilit.*\b(critical|high|medium|low)\b");

        if (asksAboutVulns)
        {
            var foundSeverities = new List<string>();
            foreach (var sev in new[] { "critical", "high", "medium", "low" })
            {
                if (lower.Contains(sev))
                    foundSeverities.Add(sev);
            }

            if (foundSeverities.Count > 0)
            {
                var parts = new List<string>();
                var labels = new List<string>();
                foreach (var sev in foundSeverities)
                {
                    labels.Add(char.ToUpper(sev[0]) + sev.Substring(1));
                    if (severityMap.ContainsKey(sev))
                    {
                        foreach (var v in severityMap[sev])
                            parts.Add($"- {v}");
                    }
                }
                var labelStr = string.Join(" & ", labels);
                return ConversationalResponse(
                    $"{labelStr} severity vulnerabilities:\n{string.Join("\n", parts)}",
                    $"meta:list:{string.Join("+", foundSeverities)}");
            }
        }

        // Show vulnerabilities by severity (simple pattern)
        var severityMatch = System.Text.RegularExpressions.Regex.Match(lower,
            @"\b(show|list|display|get)\s+(critical|high|medium|low)\b");
        if (severityMatch.Success)
        {
            var targetSeverity = severityMatch.Groups[2].Value;
            if (severityMap.ContainsKey(targetSeverity))
            {
                var list = string.Join("\n", severityMap[targetSeverity].Select(v => $"- {v}"));
                return ConversationalResponse(
                    $"{char.ToUpper(targetSeverity[0]) + targetSeverity.Substring(1)} severity vulnerabilities:\n{list}",
                    $"meta:list:{targetSeverity}");
            }
        }

        if (System.Text.RegularExpressions.Regex.IsMatch(lower,
            @"\b(list|show all)\b"
            + @"|\b(all|every)\s+vulner"
            + @"|\b(what|which)\s+(all\s+(the\s+)?)?vulner"
            + @"|\bwhat\s+vulns?\b"
            + @"|\bhow\s+many\s+vulner"
            + @"|\byour\s+vulner"
            + @"|\bdo\s+you\s+(have|know).*vulner"
            + @"|\bwhat\s+do\s+you\s+(know|support)([!?,.\s]*$|.*vulner)"
            + @"|\bwhat\s+can\s+you\s+(detect|scan)([!?,.\s]*$|.*vulner)"
            + @"|\bshow\s+me\s+vulner"
            + @"|\btell\s+me\s+(all\s+)?vulner") ||
            lower.StartsWith("vulnerabilit"))
        {
            return ConversationalResponse(
                "Supported vulnerability types:\n" +
                "- SQL Injection (Critical)\n- Cross-Site Scripting/XSS (High)\n" +
                "- CSRF (Medium)\n- Remote Code Execution/RCE (Critical)\n" +
                "- Local File Inclusion/LFI (High)\n- Remote File Inclusion/RFI (Critical)\n" +
                "- SSRF (High)\n- Directory Traversal (High)\n- Open Redirect (Medium)\n" +
                "- Authentication Bypass (Critical)\n- Exposed API Keys (Critical)\n" +
                "- Insecure Cookies (Medium)\n- Missing Security Headers (Medium)\n" +
                "- Clickjacking (Medium)\n- Exposed Comments (Low)\n" +
                "- Sensitive Files Exposure (High)\n- Debug Pages / Debug Mode Exposure (Medium)\n" +
                "- Content Security Policy (CSP) Issues (Medium)",
                "meta:list");
        }

        foreach (var kv in keywords)
        {
            if (lower.Contains(kv.Key))
            {
                return new
                {
                    vulnerability = kv.Value.name,
                    explanation = kv.Value.explanation,
                    severity = kv.Value.severity,
                    fix = kv.Value.fix,
                    report = (string?)null,
                    matched_by = "fallback:keyword"
                };
            }
        }

        // Before the default "I'm not sure" response, check for close matches
        string? bestMatch = null;
        string? bestMatchName = null;
        int bestDistance = int.MaxValue;

        foreach (var kv in keywords)
        {
            int distance = LevenshteinDistance(lower, kv.Key);
            if (distance < bestDistance && distance <= 3)
            {
                bestDistance = distance;
                bestMatch = kv.Key;
                bestMatchName = kv.Value.name;
            }
        }

        if (bestMatchName != null)
        {
            return ConversationalResponse(
                $"Hmm, I'm not sure about that. Did you mean **{bestMatchName}**? " +
                "Reply 'Yes' to learn about it, or ask me about a specific vulnerability.\n\n" +
                "You can ask things like:\n" +
                "• 'What is SQL Injection?'\n" +
                "• 'How to fix XSS?'\n" +
                "• 'Tell me about CSRF'",
                $"suggestion:{bestMatch}");
        }

        return new
        {
            vulnerability = (string?)null,
            explanation = "I'm not sure I understood that. I'm best at helping with cybersecurity topics! 🔒\n\n" +
                          "You can ask me things like:\n" +
                          "• 'What is SQL Injection?'\n" +
                          "• 'How to fix XSS?'\n" +
                          "• 'Tell me about CSRF'\n" +
                          "• 'List all vulnerabilities'\n\n" +
                          "Or just say 'help' to see everything I can do!",
            severity = (string?)null,
            fix = (string?)null,
            report = (string?)null,
            matched_by = (string?)null
        };
    }

    private static object ConversationalResponse(string explanation, string matchedBy)
    {
        return new
        {
            vulnerability = (string?)null,
            explanation,
            severity = (string?)null,
            fix = (string?)null,
            report = (string?)null,
            matched_by = matchedBy
        };
    }

    private static int LevenshteinDistance(string s, string t)
    {
        if (string.IsNullOrEmpty(s)) return t?.Length ?? 0;
        if (string.IsNullOrEmpty(t)) return s.Length;

        var d = new int[s.Length + 1, t.Length + 1];
        for (int i = 0; i <= s.Length; i++) d[i, 0] = i;
        for (int j = 0; j <= t.Length; j++) d[0, j] = j;

        for (int i = 1; i <= s.Length; i++)
        {
            for (int j = 1; j <= t.Length; j++)
            {
                int cost = s[i - 1] == t[j - 1] ? 0 : 1;
                d[i, j] = Math.Min(Math.Min(d[i - 1, j] + 1, d[i, j - 1] + 1), d[i - 1, j - 1] + cost);
            }
        }
        return d[s.Length, t.Length];
    }
}

public class ChatRequestDto
{
    public string Message { get; set; } = string.Empty;
    public string? ConversationId { get; set; }
}
