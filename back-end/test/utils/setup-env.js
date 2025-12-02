process.env.NODE_ENV = "test";

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test_jwt_secret";
}

if (!process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = "sk-test";
}

if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = "mongodb://127.0.0.1:27017/in-site-test";
}

if (!process.env.PORT) {
  process.env.PORT = "20991";
}

