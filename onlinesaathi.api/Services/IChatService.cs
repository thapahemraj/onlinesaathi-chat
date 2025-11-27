using OnlineSaathi.API.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace OnlineSaathi.API.Services
{
    public interface IChatService
    {
        Task<ChatMessage> SaveMessageAsync(ChatMessage message);
        Task<IEnumerable<ChatMessage>> GetConversationAsync(string user1Id, string user2Id, string serviceId = null);
        Task MarkMessageAsReadAsync(string messageId);
        Task<IEnumerable<ChatMessage>> GetUnreadMessagesAsync(string userId);
        Task<bool> CanCommunicate(string senderId, string receiverId, string serviceId = null);
    }
}
