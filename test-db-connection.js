const mongoose = require('mongoose');

const dbURI = "mongodb+srv://autofinder:Autofinder@cluster0.fcal8.mongodb.net/Autofinder?retryWrites=true&w=majority&appName=Cluster0";

async function testConnection() {
  try {
    console.log('🔄 Testing MongoDB connection...');
    
    await mongoose.connect(dbURI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: true,
      maxPoolSize: 10
    });
    
    console.log('✅ MongoDB connection successful!');
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('✅ Disconnected successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
