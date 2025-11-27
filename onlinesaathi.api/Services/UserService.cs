using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using OnlineSaathi.API.Models;
using OnlineSaathi.API.Models.Auth;
using OnlineSaathi.API.Settings;
using System.Text.RegularExpressions;

namespace OnlineSaathi.API.Services
{
    public class UserService : IUserService
    {
        private readonly IMongoCollection<User> _users;
        private readonly IConfiguration _configuration;
        private const string AllowedChars = "ABCDEFGHJKLMNOPQRSTUVWXYZ0123456789";
        private const int InvitationCodeLength = 8;

        public UserService(IMongoDBSettings settings, IConfiguration configuration)
        {
            var client = new MongoClient(settings.ConnectionString);
            var database = client.GetDatabase(settings.DatabaseName);
            _users = database.GetCollection<User>("Users");
            _configuration = configuration;
        }

        public async Task<User> GetUserByIdAsync(string userId)
        {
            return await _users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        }

        public async Task<User> GetUserByUsernameAsync(string username)
        {
            return await _users.Find(u => u.Username == username).FirstOrDefaultAsync();
        }

        public async Task<User> RegisterUserAsync(RegisterRequest registerRequest)
        {
            // Check if username is taken
            if (await UserExists(registerRequest.Username))
                throw new Exception("Username is already taken");
                
            // Check if email is already registered
            if (await EmailExists(registerRequest.Email))
                throw new Exception("Email is already registered");
            
            // Check if this is the first user (super admin)
            var userCount = await GetUserCountAsync();
            
            // For non-super admin registrations, validate invitation code
            if (!string.IsNullOrEmpty(registerRequest.InvitationCode))
            {
                if (!await IsValidInvitationCode(registerRequest.InvitationCode, registerRequest.UserType))
                    throw new Exception("Invalid or expired invitation code");
            }
            else if (registerRequest.UserType != UserType.Admin)
            {
                // Only allow admin registration without invitation code for the first user
                if (userCount > 0)
                    throw new Exception("Invitation code is required for registration");
            }

            // Create password hash
            CreatePasswordHash(registerRequest.Password, out byte[] passwordHash, out byte[] passwordSalt);

            var user = new User
            {
                Username = registerRequest.Username,
                Email = registerRequest.Email,
                PasswordHash = passwordHash,
                PasswordSalt = passwordSalt,
                UserType = registerRequest.UserType,
                State = registerRequest.State,
                District = registerRequest.District,
                IsSuperAdmin = false, // Will be set to true for the first admin
                InvitationCode = await GenerateInvitationCode(),
                CreatedAt = DateTime.UtcNow
            };

            // If this is the first user, make them super admin
            if (userCount == 0)
            {
                user.UserType = UserType.Admin;
                user.IsSuperAdmin = true;
            }

            // Add user to hierarchy if invitation code is provided
            if (!string.IsNullOrEmpty(registerRequest.InvitationCode))
            {
                await AddUserToHierarchy(user, registerRequest.InvitationCode);
            }

            await _users.InsertOneAsync(user);
            return user;
        }

        public async Task<User> CreateUserAsync(User user, string password)
        {
            if (await UserExists(user.Username))
                throw new Exception("Username is already taken");

            CreatePasswordHash(password, out byte[] passwordHash, out byte[] passwordSalt);

            user.PasswordHash = passwordHash;
            user.PasswordSalt = passwordSalt;
            user.CreatedAt = DateTime.UtcNow;
            user.InvitationCode = await GenerateInvitationCode();

            await _users.InsertOneAsync(user);
            return user;
        }

        public async Task<bool> UserExists(string username)
        {
            return await _users.Find(u => u.Username == username).AnyAsync();
        }

        public async Task<bool> EmailExists(string email)
        {
            return await _users.Find(u => u.Email == email).AnyAsync();
        }

        public async Task<User> GetUserByInvitationCodeAsync(string invitationCode)
        {
            if (string.IsNullOrWhiteSpace(invitationCode))
                return null;
                
            return await _users.Find(u => u.InvitationCode == invitationCode).FirstOrDefaultAsync();
        }

        public async Task UpdateUserConnection(string userId, string connectionId, bool isOnline)
        {
            var filter = Builders<User>.Filter.Eq(u => u.Id, userId);
            var update = Builders<User>.Update
                .Set(u => u.ConnectionId, connectionId)
                .Set(u => u.IsOnline, isOnline);

            await _users.UpdateOneAsync(filter, update);
        }

        public async Task<IEnumerable<User>> GetAvailableUsersForChatAsync(string currentUserId, UserType currentUserType)
        {
            var currentUser = await GetUserByIdAsync(currentUserId);
            if (currentUser == null) return new List<User>();

            var filter = Builders<User>.Filter.Ne(u => u.Id, currentUserId);
            
            // Filter based on user type hierarchy
            switch (currentUserType)
            {
                case UserType.Admin:
                    // Admin can see everyone
                    break;
                    
                case UserType.StatePartner:
                    // State partners can see district partners and users in their state
                    filter = Builders<User>.Filter.And(
                        filter,
                        Builders<User>.Filter.Eq(u => u.State, currentUser.State),
                        Builders<User>.Filter.In(u => u.UserType, new[] { UserType.DistrictPartner, UserType.Member, UserType.Agent })
                    );
                    break;
                    
                case UserType.DistrictPartner:
                    // District partners can see users in their district
                    filter = Builders<User>.Filter.And(
                        filter,
                        Builders<User>.Filter.Eq(u => u.District, currentUser.District),
                        Builders<User>.Filter.In(u => u.UserType, new[] { UserType.Member, UserType.Agent })
                    );
                    break;
                    
                case UserType.Member:
                case UserType.Agent:
                    // Members and Agents can only see users they share a service with
                    // This will be filtered further in the ChatHub
                    return new List<User>();
            }

            return await _users.Find(filter).ToListAsync();
        }

        public async Task<bool> AddUserToService(string userId, string serviceId)
        {
            var user = await GetUserByIdAsync(userId);
            if (user == null) return false;

            if (user.ConnectedServices == null)
            {
                user.ConnectedServices = new List<string>();
            }

            if (!user.ConnectedServices.Contains(serviceId))
            {
                user.ConnectedServices.Add(serviceId);
                var filter = Builders<User>.Filter.Eq(u => u.Id, userId);
                var update = Builders<User>.Update.Set(u => u.ConnectedServices, user.ConnectedServices);
                await _users.UpdateOneAsync(filter, update);
            }

            return true;
        }

        public async Task<bool> RemoveUserFromService(string userId, string serviceId)
        {
            var user = await GetUserByIdAsync(userId);
            if (user?.ConnectedServices == null) return false;

            if (user.ConnectedServices.Contains(serviceId))
            {
                user.ConnectedServices.Remove(serviceId);
                var filter = Builders<User>.Filter.Eq(u => u.Id, userId);
                var update = Builders<User>.Update.Set(u => u.ConnectedServices, user.ConnectedServices);
                await _users.UpdateOneAsync(filter, update);
            }

            return true;
        }

        public void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
        {
            using (var hmac = new HMACSHA512())
            {
                passwordSalt = hmac.Key;
                passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            }
        }

        public bool VerifyPasswordHash(string password, byte[] storedHash, byte[] storedSalt)
        {
            if (storedHash == null || storedSalt == null)
                return false;

            using (var hmac = new HMACSHA512(storedSalt))
            {
                var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
                return computedHash.SequenceEqual(storedHash);
            }
        }

        #region Hierarchy Management

        public async Task<bool> AddUserToHierarchy(User newUser, string invitationCode)
        {
            if (string.IsNullOrEmpty(invitationCode))
                return false;

            var referrer = await GetUserByInvitationCodeAsync(invitationCode);
            if (referrer == null)
                return false;

            // Set the referrer
            newUser.ReferredBy = referrer.Id;
            referrer.ReferredUsers.Add(newUser.Id);

            // Set hierarchy based on user types
            switch (newUser.UserType)
            {
                case UserType.Admin:
                    // Only super admin can create other admins
                    if (!referrer.IsSuperAdmin)
                        return false;
                    break;

                case UserType.StatePartner:
                    // Only admin can create state partners
                    if (referrer.UserType != UserType.Admin)
                        return false;
                    newUser.ParentId = referrer.Id;
                    break;

                case UserType.DistrictPartner:
                    // State partners can create district partners
                    if (referrer.UserType != UserType.StatePartner)
                        return false;
                    newUser.ParentId = referrer.Id;
                    newUser.StatePartnerId = referrer.Id;
                    newUser.State = referrer.State; // Inherit state from state partner
                    break;

                case UserType.Member:
                case UserType.Agent:
                    // District partners can create members/agents
                    if (referrer.UserType != UserType.DistrictPartner)
                        return false;
                    newUser.ParentId = referrer.Id;
                    newUser.StatePartnerId = referrer.StatePartnerId;
                    newUser.DistrictPartnerId = referrer.Id;
                    newUser.State = referrer.State;
                    newUser.District = referrer.District; // Inherit district from district partner
                    break;
            }

            // Update referrer's referred users list
            await _users.UpdateOneAsync(
                u => u.Id == referrer.Id,
                Builders<User>.Update.Push(u => u.ReferredUsers, newUser.Id));

            return true;
        }

        public async Task<IEnumerable<User>> GetUsersInHierarchy(string userId)
        {
            var user = await GetUserByIdAsync(userId);
            if (user == null)
                return new List<User>();

            var filter = Builders<User>.Filter.Empty;

            switch (user.UserType)
            {
                case UserType.Admin:
                    // Admin can see all users
                    break;
                case UserType.StatePartner:
                    // State partners can see users in their state
                    filter = Builders<User>.Filter.Eq(u => u.StatePartnerId, userId);
                    break;
                case UserType.DistrictPartner:
                    // District partners can see users in their district
                    filter = Builders<User>.Filter.Eq(u => u.DistrictPartnerId, userId);
                    break;
                default:
                    // Members and agents can only see their own data
                    filter = Builders<User>.Filter.Eq(u => u.Id, userId);
                    break;
            }

            return await _users.Find(filter).ToListAsync();
        }

        public async Task<IEnumerable<User>> GetDirectReferrals(string userId)
        {
            var user = await GetUserByIdAsync(userId);
            if (user == null || !user.ReferredUsers.Any())
                return new List<User>();

            var filter = Builders<User>.Filter.In(u => u.Id, user.ReferredUsers);
            return await _users.Find(filter).ToListAsync();
        }

        public async Task<string> GenerateInvitationCode()
        {
            string code;
            var random = new Random();
            bool isUnique;
            
            // Keep generating until we get a unique code
            do
            {
                code = new string(Enumerable.Repeat(AllowedChars, InvitationCodeLength)
                    .Select(s => s[random.Next(s.Length)]).ToArray());
                
                isUnique = !await _users.Find(u => u.InvitationCode == code).AnyAsync();
            } while (!isUnique);

            return code;
        }

        public async Task<bool> IsValidInvitationCode(string invitationCode, UserType newUserType)
        {
            if (string.IsNullOrWhiteSpace(invitationCode))
                return false;

            var referrer = await GetUserByInvitationCodeAsync(invitationCode);
            if (referrer == null)
                return false;

            // Check if the referrer is allowed to invite this type of user
            switch (newUserType)
            {
                case UserType.Admin:
                    return referrer.IsSuperAdmin; // Only super admin can invite other admins
                case UserType.StatePartner:
                    return referrer.UserType == UserType.Admin; // Only admin can invite state partners
                case UserType.DistrictPartner:
                    return referrer.UserType == UserType.StatePartner; // Only state partners can invite district partners
                case UserType.Member:
                case UserType.Agent:
                    return referrer.UserType == UserType.DistrictPartner; // Only district partners can invite members/agents
                default:
                    return false;
            }
        }

        #endregion

        public async Task<long> GetUserCountAsync()
        {
            return await _users.CountDocumentsAsync(FilterDefinition<User>.Empty);
        }
    }
}
