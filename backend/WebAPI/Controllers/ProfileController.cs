using Application.DTOs.Profile;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IProfileService _profileService;

    public ProfileController(IProfileService profileService)
    {
        _profileService = profileService;
    }

    // GET /api/profile/me
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userId = GetUserId();
        var profile = await _profileService.GetMyProfileAsync(userId);
        return Ok(profile);
    }

    // PUT /api/profile/me
    [HttpPut("me")]
    public async Task<IActionResult> UpsertMe([FromBody] UpsertProfileRequestDto dto)
    {
        var userId = GetUserId();
        var profile = await _profileService.UpsertMyProfileAsync(userId, dto);
        return Ok(profile);
    }

    // POST /api/profile/me/upload
    [HttpPost("me/upload")]
    public async Task<IActionResult> UploadProfileImage([FromForm] IFormFile? image)
    {
        if (image == null)
            return BadRequest(new { message = "No image file provided." });

        var userId = GetUserId();
        await _profileService.UploadProfileImageAsync(userId, image);
        return Ok(new { message = "Profile image uploaded successfully." });
    }

    // DELETE /api/profile/me
    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMe()
    {
        var userId = GetUserId();
        await _profileService.SoftDeleteMyProfileAsync(userId);
        return NoContent();
    }

    private int GetUserId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(idStr) || !int.TryParse(idStr, out var userId))
            throw new UnauthorizedAccessException("Invalid token: missing user id claim.");
        return userId;
    }
}
