const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('Testing MongoDB connection...');
console.log('Current directory:', __dirname);
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set (hidden for security)' : 'Not set');

async function testConnection() {
    try {
        console.log('Attempting to connect to MongoDB Atlas...');
        
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ SUCCESS: Connected to MongoDB Atlas!');
        console.log('Database connection state:', mongoose.connection.readyState);
        console.log('Database name:', mongoose.connection.name);
        console.log('Host:', mongoose.connection.host);
        
        // Test a simple operation
        const testSchema = new mongoose.Schema({ test: String });
        const TestModel = mongoose.model('Test', testSchema);
        
        console.log('Testing database operations...');
        const testDoc = new TestModel({ test: 'Connection test' });
        await testDoc.save();
        console.log('✅ Test document saved successfully');
        
        await TestModel.deleteOne({ _id: testDoc._id });
        console.log('✅ Test document deleted successfully');
        
        console.log('🎉 All tests passed! Your MongoDB connection is working perfectly!');
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        if (error.message.includes('authentication failed')) {
            console.error('\n💡 Authentication Error - Check:');
            console.error('1. Username and password in connection string');
            console.error('2. Database user exists in MongoDB Atlas');
            console.error('3. User has correct permissions');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.error('\n💡 Network Error - Check:');
            console.error('1. Internet connection');
            console.error('2. Cluster URL in connection string');
            console.error('3. Network access settings in MongoDB Atlas');
        } else if (error.message.includes('IP not in whitelist')) {
            console.error('\n💡 IP Whitelist Error - Check:');
            console.error('1. Add 0.0.0.0/0 to IP whitelist in MongoDB Atlas');
            console.error('2. Or add your current IP address');
        }
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
}

testConnection();