using OnlineSaathi.API.Models;
using OnlineSaathi.API.Models.Auth;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace OnlineSaathi.API.Services
{
    public interface IUserService
    {
        // User Management
        Task<long> GetUserCountAsync();
        Task<User> GetUserByIdAsync(string userId);
        Task<User> GetUserByUsernameAsync(string username);
        Task<User> GetUserByInvitationCodeAsync(string invitationCode);
        Task<User> RegisterUserAsync(RegisterRequest registerRequest);
        Task<User> CreateUserAsync(User user, string password);
        Task<bool> UserExists(string username);
        Task<bool> EmailExists(string email);
        bool VerifyPasswordHash(string password, byte[] storedHash, byte[] storedSalt);
        
        // Connection Management
        Task UpdateUserConnection(string userId, string connectionId, bool isOnline);
        
        // Chat & Communication
        Task<IEnumerable<User>> GetAvailableUsersForChatAsync(string currentUserId, UserType currentUserType);
        
        // Service Management
        Task<bool> AddUserToService(string userId, string serviceId);
        Task<bool> RemoveUserFromService(string userId, string serviceId);
        
        // Hierarchy Management
        Task<bool> AddUserToHierarchy(User newUser, string invitationCode);
        Task<IEnumerable<User>> GetUsersInHierarchy(string userId);
        Task<IEnumerable<User>> GetDirectReferrals(string userId);
        Task<string> GenerateInvitationCode();
        Task<bool> IsValidInvitationCode(string invitationCode, UserType newUserType);
    }
}
