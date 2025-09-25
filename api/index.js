const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      frameSrc: ["'self'", "https://www.figma.com"],
      connectSrc: ["'self'"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.vercel.app'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static('./', {
  index: 'index.html',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/figma-portfolio', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB Atlas');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// Prototype Schema
const prototypeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  description: {
    type: String,
    trim: true,
    maxLength: 1000
  },
  figmaUrl: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return v.includes('figma.com') && (v.includes('/proto/') || v.includes('/file/'));
      },
      message: 'Please provide a valid Figma URL'
    }
  },
  category: {
    type: String,
    enum: ['mobile-app', 'web-app', 'website', 'ui-kit', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true,
    maxLength: 50
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
prototypeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Prototype = mongoose.model('Prototype', prototypeSchema);

// API Routes

// Get all prototypes with optional filtering
app.get('/api/prototypes', async (req, res) => {
  try {
    const { search, category, sortBy = 'newest' } = req.query;
    
    let query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'alphabetical':
        sortOptions = { title: 1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }
    
    const prototypes = await Prototype.find(query).sort(sortOptions);
    res.json(prototypes);
  } catch (error) {
    console.error('Error fetching prototypes:', error);
    res.status(500).json({ error: 'Failed to fetch prototypes' });
  }
});

// Get a single prototype by ID
app.get('/api/prototypes/:id', async (req, res) => {
  try {
    const prototype = await Prototype.findById(req.params.id);
    if (!prototype) {
      return res.status(404).json({ error: 'Prototype not found' });
    }
    res.json(prototype);
  } catch (error) {
    console.error('Error fetching prototype:', error);
    res.status(500).json({ error: 'Failed to fetch prototype' });
  }
});

// Create a new prototype
app.post('/api/prototypes', async (req, res) => {
  try {
    const { title, description, figmaUrl, category, tags } = req.body;
    
    // Validation
    if (!title || !figmaUrl) {
      return res.status(400).json({ error: 'Title and Figma URL are required' });
    }
    
    // Process tags
    const processedTags = tags ? 
      tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : 
      [];
    
    const prototype = new Prototype({
      title,
      description,
      figmaUrl,
      category,
      tags: processedTags
    });
    
    const savedPrototype = await prototype.save();
    res.status(201).json(savedPrototype);
  } catch (error) {
    console.error('Error creating prototype:', error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create prototype' });
    }
  }
});

// Update a prototype
app.put('/api/prototypes/:id', async (req, res) => {
  try {
    const { title, description, figmaUrl, category, tags } = req.body;
    
    // Validation
    if (!title || !figmaUrl) {
      return res.status(400).json({ error: 'Title and Figma URL are required' });
    }
    
    // Process tags
    const processedTags = tags ? 
      tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : 
      [];
    
    const updatedPrototype = await Prototype.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        figmaUrl,
        category,
        tags: processedTags,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedPrototype) {
      return res.status(404).json({ error: 'Prototype not found' });
    }
    
    res.json(updatedPrototype);
  } catch (error) {
    console.error('Error updating prototype:', error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update prototype' });
    }
  }
});

// Delete a prototype
app.delete('/api/prototypes/:id', async (req, res) => {
  try {
    const deletedPrototype = await Prototype.findByIdAndDelete(req.params.id);
    
    if (!deletedPrototype) {
      return res.status(404).json({ error: 'Prototype not found' });
    }
    
    res.json({ message: 'Prototype deleted successfully' });
  } catch (error) {
    console.error('Error deleting prototype:', error);
    res.status(500).json({ error: 'Failed to delete prototype' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongoStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Catch-all handler for client-side routing
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/../index.html');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;