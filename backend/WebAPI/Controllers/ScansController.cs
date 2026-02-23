using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Application.Interfaces;
using Application.DTOs.Common;
using Application.DTOs.Scans;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ScansController : ControllerBase
{
    private readonly IScansService _scansService;

    public ScansController(IScansService scansService)
    {
        _scansService = scansService;
    }

    /// <summary>
    /// Create a new scan
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ResponseDto<ScanDto>>> CreateScan([FromBody] CreateScanDto createScanDto)
    {
        var userId = GetCurrentUserId();
        var scan = await _scansService.CreateScanAsync(createScanDto, userId);

        return CreatedAtAction(nameof(GetScanById), new { id = scan.Id }, new ResponseDto<ScanDto>
        {
            Success = true,
            Message = "Scan created successfully",
            Data = scan
        });
    }

    /// <summary>
    /// Get all scans for current user (simple list - no pagination)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ResponseDto<IEnumerable<ScanDto>>>> GetUserScans()
    {
        var userId = GetCurrentUserId();
        var scans = await _scansService.GetUserScansAsync(userId);

        return Ok(new ResponseDto<IEnumerable<ScanDto>>
        {
            Success = true,
            Message = "Scans retrieved successfully",
            Data = scans
        });
    }

    /// <summary>
    /// Get paginated scans with filtering and sorting
    /// </summary>
    [HttpGet("paged")]
    public async Task<ActionResult<ResponseDto<PagedResultDto<ScanDto>>>> GetPagedScans([FromQuery] ScanFilterParamsDto filterParams)
    {
        var userId = GetCurrentUserId();
        var pagedScans = await _scansService.GetPagedUserScansAsync(userId, filterParams);

        return Ok(new ResponseDto<PagedResultDto<ScanDto>>
        {
            Success = true,
            Message = "Scans retrieved successfully",
            Data = pagedScans
        });
    }

    /// <summary>
    /// Get scan by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ResponseDto<ScanDto>>> GetScanById(int id)
    {
        var userId = GetCurrentUserId();
        var scan = await _scansService.GetScanByIdAsync(id, userId);

        if (scan == null)
            return NotFound(new ResponseDto<ScanDto>
            {
                Success = false,
                Message = "Scan not found"
            });

        return Ok(new ResponseDto<ScanDto>
        {
            Success = true,
            Message = "Scan retrieved successfully",
            Data = scan
        });
    }

    /// <summary>
    /// Update scan status
    /// </summary>
    [HttpPut("{id}/status")]
    public async Task<ActionResult<ResponseDto<ScanDto>>> UpdateScanStatus(int id, [FromBody] UpdateScanStatusDto updateStatusDto)
    {
        var userId = GetCurrentUserId();
        var scan = await _scansService.UpdateScanStatusAsync(id, updateStatusDto, userId);

        return Ok(new ResponseDto<ScanDto>
        {
            Success = true,
            Message = "Scan status updated successfully",
            Data = scan
        });
    }

    /// <summary>
    /// Delete scan
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<ResponseDto<object>>> DeleteScan(int id)
    {
        var userId = GetCurrentUserId();
        await _scansService.DeleteScanAsync(id, userId);

        return Ok(new ResponseDto<object>
        {
            Success = true,
            Message = "Scan deleted successfully"
        });
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }
}
