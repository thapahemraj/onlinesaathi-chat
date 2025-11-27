using OnlineSaathi.API.Models;
using System.Security.Claims;
using System.Threading.Tasks;

namespace OnlineSaathi.API.Services
{
    public interface IJwtService
    {
        string GenerateToken(User user);
        string GenerateRefreshToken();
        ClaimsPrincipal GetPrincipalFromExpiredToken(string token);
        Task<bool> IsTokenValid(string token, string userId);
    }
}
