namespace Core.Interfaces;

public interface IAuthService
{
    Task<string> RegisterAsync(string email, string username, string firstName, string lastName, string password,
        string? phoneNumber = null, string? gender = null, DateTime? dateOfBirth = null, string? country = null, string? bio = null);
    Task<string> LoginAsync(string email, string password);
    Task<bool> ValidateTokenAsync(string token);
    Task ChangePasswordAsync(int userId, string newPassword);
}
