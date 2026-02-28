namespace Core.Entities;

public class Profile
{
    public int Id { get; set; }

    // 1:1 with User
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    // Profile fields
    public string? FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public string? AvatarPublicId { get; set; }

    // Auditing
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    // Soft delete
    public DateTime? DeletedAtUtc { get; set; }
}
