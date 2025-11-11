using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using OnlineSaathi.API.Models;
using OnlineSaathi.API.Models.Auth;
using OnlineSaathi.API.Services;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace OnlineSaathi.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IJwtService _jwtService;
        private readonly IConfiguration _configuration;

        public AuthController(IUserService userService, IJwtService jwtService, IConfiguration configuration)
        {
            _userService = userService;
            _jwtService = jwtService;
            _configuration = configuration;
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequest registerRequest)
        {
            try
            {
                // Validate the request
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Check if this is the first user (super admin)
                var userCount = await _userService.GetUserCountAsync();
                if (userCount == 0)
                {
                    // First user is always super admin
                    registerRequest.UserType = UserType.Admin;
                }
                else
                {
                    // For non-first users, validate invitation code
                    if (string.IsNullOrEmpty(registerRequest.InvitationCode))
                    {
                        return BadRequest(new { message = "Invitation code is required" });
                    }

                    if (!await _userService.IsValidInvitationCode(registerRequest.InvitationCode, registerRequest.UserType))
                    {
                        return BadRequest(new { message = "Invalid or expired invitation code" });
                    }
                }

                // Register the user
                var user = await _userService.RegisterUserAsync(registerRequest);
                
                // Generate JWT token
                var token = _jwtService.GenerateToken(user);

                return Ok(new 
                { 
                    user.Id, 
                    user.Username, 
                    user.Email, 
                    user.UserType, 
                    user.InvitationCode,
                    Token = token 
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var user = await _userService.GetUserByUsernameAsync(request.Username);
                
                if (user == null || !_userService.VerifyPasswordHash(request.Password, user.PasswordHash, user.PasswordSalt))
                {
                    return Unauthorized(new { message = "Invalid username or password" });
                }

                // Generate JWT token
                var token = _jwtService.GenerateToken(user);

                return Ok(new 
                { 
                    user.Id, 
                    user.Username, 
                    user.Email, 
                    user.UserType, 
                    user.InvitationCode,
                    Token = token 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while processing your request" });
            }
        }

        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var user = await _userService.GetUserByIdAsync(userId);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                // Return user profile without sensitive data
                return Ok(new 
                { 
                    user.Id, 
                    user.Username, 
                    user.Email, 
                    user.UserType, 
                    user.IsSuperAdmin,
                    user.State,
                    user.District,
                    user.InvitationCode,
                    user.CreatedAt
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "An error occurred while processing your request" });
            }
        }
    }
}
