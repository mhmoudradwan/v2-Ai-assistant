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
        var lower = message.ToLowerInvariant();

        var keywords = new Dictionary<string, (string name, string severity)>
        {
            ["sql injection"] = ("SQL Injection", "Critical"),
            ["sqli"] = ("SQL Injection", "Critical"),
            ["xss"] = ("Cross-Site Scripting (XSS)", "High"),
            ["cross-site scripting"] = ("Cross-Site Scripting (XSS)", "High"),
            ["csrf"] = ("Cross-Site Request Forgery (CSRF)", "Medium"),
            ["rce"] = ("Remote Code Execution (RCE)", "Critical"),
            ["lfi"] = ("Local File Inclusion (LFI)", "High"),
            ["rfi"] = ("Remote File Inclusion (RFI)", "Critical"),
            ["ssrf"] = ("Server-Side Request Forgery (SSRF)", "High"),
            ["clickjacking"] = ("Clickjacking", "Medium"),
            ["open redirect"] = ("Open Redirect", "Medium"),
        };

        foreach (var kv in keywords)
        {
            if (lower.Contains(kv.Key))
            {
                return new
                {
                    vulnerability = kv.Value.name,
                    explanation = $"This appears to be related to {kv.Value.name}. The AI service is temporarily unavailable for a full analysis.",
                    severity = kv.Value.severity,
                    fix = "Please consult OWASP guidelines for remediation advice.",
                    report = (string?)null,
                    matched_by = "fallback:keyword"
                };
            }
        }

        return new
        {
            vulnerability = (string?)null,
            explanation = "The AI service is temporarily unavailable. Please try again later.",
            severity = (string?)null,
            fix = (string?)null,
            report = (string?)null,
            matched_by = (string?)null
        };
    }
}

public class ChatRequestDto
{
    public string Message { get; set; } = string.Empty;
    public string? ConversationId { get; set; }
}
