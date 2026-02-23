using Microsoft.AspNetCore.Mvc;
using Core.Interfaces;
using Application.DTOs.Auth;
using Application.DTOs.Common;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<ResponseDto<string>>> Register([FromBody] RegisterDto registerDto)
    {
        try
        {
            var token = await _authService.RegisterAsync(
                registerDto.Email,
                registerDto.Username,
                registerDto.FirstName,
                registerDto.LastName,
                registerDto.Password
            );

            return Ok(new ResponseDto<string>
            {
                Success = true,
                Message = "User registered successfully",
                Data = token
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Registration failed for email: {Email}", registerDto.Email);
            return BadRequest(new ResponseDto<string>
            {
                Success = false,
                Message = ex.Message,
                Data = null
            });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<ResponseDto<string>>> Login([FromBody] LoginDto loginDto)
    {
        try
        {
            var token = await _authService.LoginAsync(loginDto.Email, loginDto.Password);

            return Ok(new ResponseDto<string>
            {
                Success = true,
                Message = "Login successful",
                Data = token
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Login failed for email: {Email}", loginDto.Email);
            return Unauthorized(new ResponseDto<string>
            {
                Success = false,
                Message = ex.Message,
                Data = null
            });
        }
    }

    [HttpPost("validate-token")]
    public async Task<ActionResult<ResponseDto<bool>>> ValidateToken([FromBody] string token)
    {
        var isValid = await _authService.ValidateTokenAsync(token);

        return Ok(new ResponseDto<bool>
        {
            Success = isValid,
            Message = isValid ? "Token is valid" : "Token is invalid",
            Data = isValid
        });
    }
}
