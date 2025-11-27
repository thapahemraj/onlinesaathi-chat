using OnlineSaathi.API.Models;

namespace OnlineSaathi.API.Models.Auth
{
    public class RegisterRequest
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public UserType UserType { get; set; }
        public string InvitationCode { get; set; } // Optional for the first super admin
        public string State { get; set; } // Required for State Partner and below
        public string District { get; set; } // Required for District Partner and below
    }
}
