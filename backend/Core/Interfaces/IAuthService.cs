namespace Core.Interfaces;

public interface IAuthService
{
    Task<string> RegisterAsync(string email, string username, string firstName, string lastName, string password);
    Task<string> LoginAsync(string email, string password);
    Task<bool> ValidateTokenAsync(string token);
}
