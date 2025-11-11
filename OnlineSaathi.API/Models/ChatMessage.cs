using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.ComponentModel.DataAnnotations;

namespace OnlineSaathi.API.Models
{
    [BsonIgnoreExtraElements]
    public class ChatMessage
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        
        [BsonElement("senderId")]
        [BsonRepresentation(BsonType.ObjectId)]
        [Required]
        public string SenderId { get; set; }
        
        [BsonElement("receiverId")]
        [BsonRepresentation(BsonType.ObjectId)]
        [Required]
        public string ReceiverId { get; set; }
        
        [BsonElement("content")]
        [Required]
        [MaxLength(2000)]
        public string Content { get; set; }
        
        [BsonElement("timestamp")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        
        [BsonElement("serviceId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ServiceId { get; set; }
        
        [BsonElement("isRead")]
        public bool IsRead { get; set; } = false;
        
        [BsonElement("readAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime? ReadAt { get; set; }
        
        [BsonElement("messageType")]
        [BsonRepresentation(BsonType.String)]
        public MessageType MessageType { get; set; } = MessageType.Text;
        
        [BsonElement("metadata")]
        public object Metadata { get; set; }
    }
    
    public enum MessageType
    {
        Text,
        Image,
        File,
        Location,
        System
    }
}
