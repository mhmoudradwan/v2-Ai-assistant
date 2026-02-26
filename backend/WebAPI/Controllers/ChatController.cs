using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Application.DTOs.Common;
using System.Text;
using System.Text.Json;

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

        if (System.Text.RegularExpressions.Regex.IsMatch(lower,
            @"\b(who are you|what are you|what is your name|what'?s your name|" +
            @"tell me about yourself|what do you do|your name|introduce yourself)\b"))
        {
            return ConversationalResponse(
                "I'm Baseera Assistant — your AI-powered security advisor! 🛡️ " +
                "I can explain vulnerabilities, assess their severity, and suggest fixes " +
                "for 15 different types of web security issues. Just ask me about any vulnerability!",
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

        if (System.Text.RegularExpressions.Regex.IsMatch(lower,
            @"\b(help|what can you do|capabilities)\b"))
        {
            return ConversationalResponse(
                "I can explain vulnerabilities, assess their severity, and suggest fixes for: " +
                "SQL Injection, XSS, CSRF, RCE, LFI, RFI, SSRF, Directory Traversal, Open Redirect, " +
                "Authentication Bypass, Exposed API Keys, Insecure Cookies, Missing Security Headers, " +
                "Clickjacking, and Exposed Comments. Just ask 'What is <vuln>?' or 'How to fix <vuln>?'",
                "meta:help");
        }

        if (System.Text.RegularExpressions.Regex.IsMatch(lower,
            @"\b(list|show all|all vulner)\b") ||
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
                "- Clickjacking (Medium)\n- Exposed Comments (Low)",
                "meta:list");
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
            ["xss"] = ("Cross-Site Scripting (XSS)", "High",
                "XSS allows attackers to inject malicious scripts into web pages viewed by other users, enabling session hijacking, credential theft, and defacement.",
                "Encode all output (HTML-encode user-supplied data). Use Content-Security-Policy headers. Validate and sanitize every input on the server side."),
            ["cross-site scripting"] = ("Cross-Site Scripting (XSS)", "High",
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
            ["directory traversal"] = ("Directory Traversal", "High",
                "Directory traversal lets attackers access files and directories outside the intended web root by manipulating file paths.",
                "Sanitize all user-supplied file paths. Use canonical path checks. Restrict the application to a defined base directory."),
            ["path traversal"] = ("Directory Traversal", "High",
                "Path traversal lets attackers access files outside the intended web root by manipulating file paths.",
                "Sanitize all user-supplied file paths. Use canonical path checks. Restrict the application to a defined base directory."),
            ["open redirect"] = ("Open Redirect", "Medium",
                "Open redirect occurs when an application accepts an untrusted URL as a redirect target, enabling phishing and credential-theft attacks.",
                "Whitelist redirect destinations. Use relative paths or server-side token validation. Warn users when redirecting to external sites."),
            ["authentication bypass"] = ("Authentication Bypass", "Critical",
                "Authentication bypass lets attackers skip authentication checks, gaining unauthorized access to protected resources.",
                "Enforce server-side authentication on every protected endpoint. Use well-tested auth libraries. Implement MFA and account lockout policies."),
            ["auth bypass"] = ("Authentication Bypass", "Critical",
                "Authentication bypass lets attackers skip authentication checks, gaining unauthorized access to protected resources.",
                "Enforce server-side authentication on every protected endpoint. Use well-tested auth libraries."),
            ["exposed api key"] = ("Exposed API Keys / Secrets", "Critical",
                "Hard-coded or exposed API keys/secrets allow attackers to access third-party services, databases, or internal systems.",
                "Store secrets in environment variables or a secrets manager. Rotate any exposed credentials immediately. Scan code with tools like truffleHog before committing."),
            ["api key leak"] = ("Exposed API Keys / Secrets", "Critical",
                "Exposed API keys allow attackers to access third-party services or internal systems.",
                "Store secrets in environment variables or a secrets manager. Rotate any exposed credentials immediately."),
            ["insecure cookie"] = ("Insecure Cookies", "Medium",
                "Cookies without Secure, HttpOnly, or SameSite flags can be stolen via XSS, network sniffing, or CSRF attacks.",
                "Set Secure, HttpOnly, and SameSite=Strict flags on all sensitive cookies. Use short expiry times for session cookies."),
            ["missing security header"] = ("Missing Security Headers", "Medium",
                "Missing HTTP security headers (CSP, HSTS, X-Frame-Options, etc.) leave applications vulnerable to various client-side attacks.",
                "Add Content-Security-Policy, X-Frame-Options, Strict-Transport-Security, X-Content-Type-Options, and Referrer-Policy headers to all responses."),
            ["clickjacking"] = ("Clickjacking", "Medium",
                "Clickjacking tricks users into clicking hidden UI elements embedded within iframes, potentially performing unintended actions.",
                "Set X-Frame-Options: DENY or SAMEORIGIN. Use CSP frame-ancestors directive. Implement frame-busting JavaScript as a secondary defence."),
            ["exposed comments"] = ("Exposed Comments / Sensitive Information in Source", "Low",
                "Developer comments in HTML/JS source code can reveal internal paths, credentials, logic flaws, or TODOs that aid attackers.",
                "Remove sensitive comments before deploying to production. Use automated pre-commit hooks to detect accidental disclosures."),
        };

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

        return new
        {
            vulnerability = (string?)null,
            explanation = "I'm not sure I understood that. I'm best at helping with cybersecurity topics! 🔒\n\n" +
                          "You can ask me things like:\n" +
                          "• 'What is SQL Injection?'\n" +
                          "• 'How to fix XSS?'\n" +
                          "• 'Tell me about CSRF'\n" +
                          "• 'List all vulnerabilities'\n\n" +
                          "Or just say 'help' to see everything I can do!" +
                          "\n\n(Note: The AI service is temporarily unavailable.)",
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
}

public class ChatRequestDto
{
    public string Message { get; set; } = string.Empty;
    public string? ConversationId { get; set; }
}
