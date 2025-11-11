using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace OnlineSaathi.API.Models
{
    [BsonIgnoreExtraElements]
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        
        [BsonElement("username")]
        [Required]
        [StringLength(50, MinimumLength = 3)]
        public string Username { get; set; }
        
        [BsonElement("email")]
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        
        [BsonElement("passwordHash")]
        [BsonIgnore]
        public byte[] PasswordHash { get; set; }
        
        [BsonElement("passwordSalt")]
        [BsonIgnore]
        public byte[] PasswordSalt { get; set; }
        
        [BsonElement("userType")]
        [BsonRepresentation(BsonType.String)]
        public UserType UserType { get; set; }
        
        [BsonElement("state")]
        public string State { get; set; }
        
        [BsonElement("district")]
        public string District { get; set; }
        
        [BsonElement("connectedServices")]
        public List<string> ConnectedServices { get; set; } = new List<string>();
        
        [BsonElement("connectionId")]
        public string ConnectionId { get; set; }
        
        [BsonElement("isOnline")]
        public bool IsOnline { get; set; } = false;
        
        [BsonElement("invitationCode")]
        [Required]
        public string InvitationCode { get; set; }
        
        [BsonElement("referredBy")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ReferredBy { get; set; }
        
        [BsonElement("referredUsers")]
        public List<string> ReferredUsers { get; set; } = new List<string>();
        
        [BsonElement("createdAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [BsonElement("isSuperAdmin")]
        public bool IsSuperAdmin { get; set; } = false;
        
        [BsonElement("parentId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ParentId { get; set; }
        
        [BsonElement("statePartnerId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string StatePartnerId { get; set; }
        
        [BsonElement("districtPartnerId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string DistrictPartnerId { get; set; }
        
        [BsonElement("isActive")]
        public bool IsActive { get; set; } = true;
        
        [BsonElement("lastLogin")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime? LastLogin { get; set; }
    }
}
