const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🔍 Debugging MongoDB Connection...\n');

// Check environment variables
console.log('Environment Check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);

if (process.env.MONGODB_URI) {
    // Mask the connection string for security but show structure
    const uri = process.env.MONGODB_URI;
    const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
    console.log('- Connection string format:', maskedUri);
    
    // Check connection string components
    console.log('\nConnection String Analysis:');
    console.log('- Protocol:', uri.startsWith('mongodb+srv://') ? 'mongodb+srv (✅)' : 'Invalid protocol (❌)');
    console.log('- Has username:', uri.includes('://') && uri.split('://')[1].includes('@') ? '✅' : '❌');
    console.log('- Has password:', uri.includes(':') && uri.includes('@') ? '✅' : '❌');
    console.log('- Has cluster:', uri.includes('.mongodb.net') ? '✅' : '❌');
    console.log('- Has database name:', uri.includes('.net/') && uri.split('.net/')[1].split('?')[0] ? '✅ (' + uri.split('.net/')[1].split('?')[0] + ')' : '❌');
}

async function testConnection() {
    try {
        console.log('\n🔄 Attempting connection with different options...\n');
        
        // Try with relaxed SSL settings
        const connectionOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
            // SSL options that might help
            ssl: true,
            sslValidate: false,
        };
        
        console.log('Connection options:', JSON.stringify(connectionOptions, null, 2));
        
        await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
        
        console.log('✅ SUCCESS: Connected to MongoDB Atlas!');
        console.log('📊 Connection Details:');
        console.log('- Connection state:', mongoose.connection.readyState);
        console.log('- Database name:', mongoose.connection.name);
        console.log('- Host:', mongoose.connection.host);
        console.log('- Port:', mongoose.connection.port);
        
        // Test basic operations
        console.log('\n🧪 Testing database operations...');
        
        // Create a simple test collection
        const testSchema = new mongoose.Schema({
            test: String,
            timestamp: { type: Date, default: Date.now }
        });
        
        const TestModel = mongoose.model('ConnectionTest', testSchema);
        
        // Test write operation
        const testDoc = new TestModel({ test: 'Connection test successful' });
        const savedDoc = await testDoc.save();
        console.log('✅ Write test passed - Document ID:', savedDoc._id);
        
        // Test read operation
        const foundDoc = await TestModel.findById(savedDoc._id);
        console.log('✅ Read test passed - Found:', foundDoc.test);
        
        // Test delete operation
        await TestModel.deleteOne({ _id: savedDoc._id });
        console.log('✅ Delete test passed');
        
        console.log('\n🎉 All MongoDB tests passed! Your database is ready to use!\n');
        
    } catch (error) {
        console.error('\n❌ Connection failed with error:');
        console.error('Type:', error.constructor.name);
        console.error('Message:', error.message);
        
        if (error.code) {
            console.error('Error Code:', error.code);
        }
        
        console.log('\n🔧 Troubleshooting suggestions:');
        
        if (error.message.includes('authentication failed')) {
            console.log('🔐 Authentication Issue:');
            console.log('1. Double-check username and password in MongoDB Atlas');
            console.log('2. Ensure the database user exists and has correct permissions');
            console.log('3. Check if the password contains special characters that need URL encoding');
        } 
        else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.log('🌐 Network Issue:');
            console.log('1. Check your internet connection');
            console.log('2. Verify the cluster URL is correct');
            console.log('3. Try connecting from MongoDB Compass to test the connection string');
        }
        else if (error.message.includes('IP') || error.message.includes('whitelist')) {
            console.log('🔒 IP Whitelist Issue:');
            console.log('1. In MongoDB Atlas, go to Network Access');
            console.log('2. Add 0.0.0.0/0 to allow access from anywhere');
            console.log('3. Or add your specific IP address');
        }
        else if (error.message.includes('SSL') || error.message.includes('TLS')) {
            console.log('🔐 SSL/TLS Issue:');
            console.log('1. This might be a temporary cluster issue');
            console.log('2. Try again in a few minutes');
            console.log('3. Check if your cluster is in a paused state');
            console.log('4. Verify your cluster is running (not paused/stopped)');
        }
        else {
            console.log('❓ General troubleshooting:');
            console.log('1. Check MongoDB Atlas cluster status');
            console.log('2. Verify your connection string format');
            console.log('3. Try connecting with MongoDB Compass first');
            console.log('4. Check if there are any ongoing MongoDB Atlas issues');
        }
        
        console.log('\n📋 Next steps:');
        console.log('1. Log into MongoDB Atlas and check cluster status');
        console.log('2. Test the connection string with MongoDB Compass');
        console.log('3. Verify network access settings allow 0.0.0.0/0');
        console.log('4. Ensure database user has read/write permissions');
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            console.log('🔌 Disconnected from MongoDB');
        }
        process.exit(0);
    }
}

testConnection();