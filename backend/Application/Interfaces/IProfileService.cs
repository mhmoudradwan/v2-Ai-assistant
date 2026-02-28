using Application.DTOs.Profile;
using Microsoft.AspNetCore.Http;

namespace Application.Interfaces;

public interface IProfileService
{
    Task<ProfileDto> GetMyProfileAsync(int userId);
    Task<ProfileDto> UpsertMyProfileAsync(int userId, UpsertProfileRequestDto dto);
    Task UploadProfileImageAsync(int userId, IFormFile image);
    Task SoftDeleteMyProfileAsync(int userId);
}
