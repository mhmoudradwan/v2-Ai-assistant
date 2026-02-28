using Microsoft.AspNetCore.Http;

namespace Application.Interfaces;

public interface ICloudinaryService
{
    Task<string> UploadProfileImageAsync(
        IFormFile file,
        string folderName,
        string? oldImagePublicId = null
    );

    Task DeleteImageAsync(string publicId);
}
