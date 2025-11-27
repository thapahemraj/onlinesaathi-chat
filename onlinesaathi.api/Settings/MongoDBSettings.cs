using Microsoft.Extensions.Configuration;

namespace OnlineSaathi.API.Settings
{
    public class MongoDBSettings : IMongoDBSettings
    {
        public string ConnectionString { get; set; }
        public string DatabaseName { get; set; }
    }
}
