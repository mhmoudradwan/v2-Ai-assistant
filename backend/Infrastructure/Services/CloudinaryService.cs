using Application.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Services;

public class CloudinaryService : ICloudinaryService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryService(IConfiguration config)
    {
        var cloudName = config["Cloudinary:CloudName"] ?? throw new InvalidOperationException("Cloudinary:CloudName is not configured");
        var apiKey = config["Cloudinary:ApiKey"] ?? throw new InvalidOperationException("Cloudinary:ApiKey is not configured");
        var apiSecret = config["Cloudinary:ApiSecret"] ?? throw new InvalidOperationException("Cloudinary:ApiSecret is not configured");

        var account = new Account(cloudName, apiKey, apiSecret);

        _cloudinary = new Cloudinary(account);
    }

    public async Task<string> UploadProfileImageAsync(
        IFormFile file,
        string folderName,
        string? oldImagePublicId = null)
    {
        if (file.Length <= 0)
            throw new ArgumentException("File cannot be empty", nameof(file));

        if (!string.IsNullOrWhiteSpace(oldImagePublicId))
        {
            await DeleteImageAsync(oldImagePublicId);
        }

        await using var stream = file.OpenReadStream();

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = folderName,
            Transformation = new Transformation()
                .Width(400)
                .Height(400)
                .Crop("fill")
                .Gravity("face")
        };

        var result = await _cloudinary.UploadAsync(uploadParams);

        if (result.StatusCode != System.Net.HttpStatusCode.OK)
            throw new InvalidOperationException($"Image upload failed: {result.Error?.Message}");

        return result.SecureUrl.ToString();
    }

    public async Task DeleteImageAsync(string publicId)
    {
        var deleteParams = new DeletionParams(publicId)
        {
            ResourceType = ResourceType.Image
        };

        await _cloudinary.DestroyAsync(deleteParams);
    }
}
