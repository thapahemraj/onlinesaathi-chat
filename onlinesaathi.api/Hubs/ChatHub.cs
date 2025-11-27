using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using OnlineSaathi.API.Models;
using OnlineSaathi.API.Services;

namespace OnlineSaathi.API.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IChatService _chatService;
        private readonly IUserService _userService;
        private static readonly Dictionary<string, string> _connections = new Dictionary<string, string>();

        public ChatHub(IChatService chatService, IUserService userService)
        {
            _chatService = chatService;
            _userService = userService;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;
            var connectionId = Context.ConnectionId;
            
            _connections[userId] = connectionId;
            
            // Update user's online status
            await _userService.UpdateUserConnection(userId, connectionId, true);
            
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var userId = Context.UserIdentifier;
            
            if (_connections.ContainsKey(userId))
            {
                _connections.Remove(userId);
            }
            
            // Update user's online status
            await _userService.UpdateUserConnection(userId, null, false);
            
            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendMessage(string receiverId, string content, string serviceId = null)
        {
            var senderId = Context.UserIdentifier;
            
            // Check if the sender is authorized to send message to the receiver
            if (!await _chatService.CanCommunicate(senderId, receiverId, serviceId))
            {
                throw new HubException("You are not authorized to send a message to this user.");
            }

            var message = new ChatMessage
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Content = content,
                ServiceId = serviceId,
                Timestamp = DateTime.UtcNow,
                IsRead = false
            };

            // Save the message to the database
            await _chatService.SaveMessageAsync(message);

            // Send the message to the receiver if online
            if (_connections.TryGetValue(receiverId, out var connectionId))
            {
                await Clients.Client(connectionId).SendAsync("ReceiveMessage", message);
            }

            // Send a notification to the sender that the message was sent
            await Clients.Caller.SendAsync("MessageSent", message);
        }

        public async Task MarkAsRead(string messageId)
        {
            await _chatService.MarkMessageAsReadAsync(messageId);
        }

        public async Task<IEnumerable<User>> GetAvailableUsers()
        {
            var currentUserId = Context.UserIdentifier;
            var currentUser = await _userService.GetUserByIdAsync(currentUserId);
            
            // Get users based on hierarchy and permissions
            return await _userService.GetAvailableUsersForChatAsync(currentUserId, currentUser.UserType);
        }
    }
}
