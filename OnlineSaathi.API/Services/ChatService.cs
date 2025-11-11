using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MongoDB.Driver;
using OnlineSaathi.API.Models;
using OnlineSaathi.API.Settings;

namespace OnlineSaathi.API.Services
{
    public class ChatService : IChatService
    {
        private readonly IMongoCollection<ChatMessage> _messages;
        private readonly IUserService _userService;

        public ChatService(IMongoDBSettings settings, IUserService userService)
        {
            var client = new MongoClient(settings.ConnectionString);
            var database = client.GetDatabase(settings.DatabaseName);
            _messages = database.GetCollection<ChatMessage>("ChatMessages");
            _userService = userService;
        }

        public async Task<ChatMessage> SaveMessageAsync(ChatMessage message)
        {
            await _messages.InsertOneAsync(message);
            return message;
        }

        public async Task<IEnumerable<ChatMessage>> GetConversationAsync(string user1Id, string user2Id, string serviceId = null)
        {
            var filter = Builders<ChatMessage>.Filter.Or(
                Builders<ChatMessage>.Filter.And(
                    Builders<ChatMessage>.Filter.Eq(m => m.SenderId, user1Id),
                    Builders<ChatMessage>.Filter.Eq(m => m.ReceiverId, user2Id)
                ),
                Builders<ChatMessage>.Filter.And(
                    Builders<ChatMessage>.Filter.Eq(m => m.SenderId, user2Id),
                    Builders<ChatMessage>.Filter.Eq(m => m.ReceiverId, user1Id)
                )
            );

            if (!string.IsNullOrEmpty(serviceId))
            {
                filter = Builders<ChatMessage>.Filter.And(
                    filter,
                    Builders<ChatMessage>.Filter.Eq(m => m.ServiceId, serviceId)
                );
            }

            var sort = Builders<ChatMessage>.Sort.Ascending(m => m.Timestamp);
            return await _messages.Find(filter).Sort(sort).ToListAsync();
        }

        public async Task MarkMessageAsReadAsync(string messageId)
        {
            var filter = Builders<ChatMessage>.Filter.Eq(m => m.Id, messageId);
            var update = Builders<ChatMessage>.Update.Set(m => m.IsRead, true);
            await _messages.UpdateOneAsync(filter, update);
        }

        public async Task<IEnumerable<ChatMessage>> GetUnreadMessagesAsync(string userId)
        {
            var filter = Builders<ChatMessage>.Filter.And(
                Builders<ChatMessage>.Filter.Eq(m => m.ReceiverId, userId),
                Builders<ChatMessage>.Filter.Eq(m => m.IsRead, false)
            );

            return await _messages.Find(filter).ToListAsync();
        }

        public async Task<bool> CanCommunicate(string senderId, string receiverId, string serviceId = null)
        {
            var sender = await _userService.GetUserByIdAsync(senderId);
            var receiver = await _userService.GetUserByIdAsync(receiverId);

            if (sender == null || receiver == null) return false;

            // Admin can communicate with everyone
            if (sender.UserType == UserType.Admin) return true;

            // Users can't communicate with themselves
            if (senderId == receiverId) return false;

            // Check hierarchy-based communication
            switch (sender.UserType)
            {
                case UserType.StatePartner:
                    // State partner can communicate with district partners and users in their state
                    return receiver.State == sender.State && 
                           (receiver.UserType == UserType.DistrictPartner || 
                            receiver.UserType == UserType.Member || 
                            receiver.UserType == UserType.Agent);

                case UserType.DistrictPartner:
                    // District partner can communicate with users in their district
                    return receiver.District == sender.District && 
                           (receiver.UserType == UserType.Member || 
                            receiver.UserType == UserType.Agent);

                case UserType.Member:
                case UserType.Agent:
                    // Members and Agents can only communicate if they are connected through a service
                    if (string.IsNullOrEmpty(serviceId)) return false;
                    
                    // Check if both users are connected through the same service
                    return (sender.ConnectedServices?.Contains(serviceId) ?? false) && 
                           (receiver.ConnectedServices?.Contains(serviceId) ?? false) &&
                           ((sender.UserType == UserType.Member && receiver.UserType == UserType.Agent) ||
                            (sender.UserType == UserType.Agent && receiver.UserType == UserType.Member));

                default:
                    return false;
            }
        }
    }
}
