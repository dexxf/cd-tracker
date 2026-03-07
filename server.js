const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const app = express();
const PORT = 5500;

// Promisify exec
const execPromise = util.promisify(exec);

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Store active sessions
const sessions = new Map();

// Create temp directory for cloned repos
const TEMP_BASE_PATH = path.join(__dirname, 'temp');
if (!fsSync.existsSync(TEMP_BASE_PATH)) {
  fsSync.mkdirSync(TEMP_BASE_PATH, { recursive: true });
}

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ success: true, message: 'Server is running!' });
});

// Clone repository endpoint (NOW ACTUALLY CLONES FROM GITHUB)
app.post('/clone-repo', async (req, res) => {
  try {
    const { url, branch = 'main' } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'GitHub repository URL is required'
      });
    }

    console.log(`📦 Cloning repository: ${url}`);
    
    const sessionId = Date.now().toString();
    const clonePath = path.join(TEMP_BASE_PATH, sessionId);
    
    // Clone the repository
    try {
      await execPromise(`git clone --depth 1 ${url} ${clonePath}`);
      console.log(`✅ Repository cloned successfully to ${clonePath}`);
    } catch (cloneError) {
      console.error('❌ Git clone failed:', cloneError);
      
      // Try with 'master' branch if 'main' fails
      try {
        await execPromise(`git clone --depth 1 -b master ${url} ${clonePath}`);
        console.log(`✅ Repository cloned successfully using master branch`);
      } catch (retryError) {
        return res.status(500).json({
          success: false,
          error: `Failed to clone repository: ${cloneError.message}`
        });
      }
    }
    
    // Read all files from the cloned repository
    const files = await readAllFiles(clonePath);
    
    console.log(`✅ Found ${files.length} files in repository`);
    
    // Store session info
    sessions.set(sessionId, {
      basePath: clonePath,
      files: files,
      repoUrl: url,
      createdAt: Date.now()
    });
    
    res.json({
      success: true,
      session_id: sessionId,
      files: files,
      repo_url: url
    });
    
  } catch (error) {
    console.error('❌ Error in clone-repo:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get file content
app.post('/file-content', async (req, res) => {
  try {
    const { session_id, file_path } = req.body;
    
    const session = sessions.get(session_id);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or expired'
      });
    }
    
    const fullPath = path.join(session.basePath, file_path);
    console.log('📖 Reading file:', file_path);
    
    // Security check
    const relativePath = path.relative(session.basePath, fullPath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      return res.status(403).json({
        success: false,
        error: 'Invalid file path'
      });
    }
    
    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
    // Read file
    const content = await fs.readFile(fullPath, 'utf8');
    
    res.json({
      success: true,
      content: content
    });
    
  } catch (error) {
    console.error('❌ Error reading file:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Analyze file content
app.post('/analyze-file-content', (req, res) => {
  try {
    const { content, language } = req.body;
    const errors = [];
    const warnings = [];
    
    const lines = content.split('\n');
    
    // Basic syntax checks based on language
    lines.forEach((line, i) => {
      const lineNum = i + 1;
      const trimmedLine = line.trim();
      
      if (trimmedLine === '' || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
        return; // Skip empty lines and comments
      }
      
      if (language === 'javascript' || language === 'js') {
        if (trimmedLine && 
            !trimmedLine.endsWith('{') && 
            !trimmedLine.endsWith('}') && 
            !trimmedLine.endsWith(';') &&
            !trimmedLine.endsWith('(') &&
            !trimmedLine.endsWith(')') &&
            !trimmedLine.includes('function') &&
            !trimmedLine.includes('if') &&
            !trimmedLine.includes('else') &&
            !trimmedLine.includes('for') &&
            !trimmedLine.includes('while') &&
            !trimmedLine.includes('return')) {
          warnings.push({
            line: lineNum,
            message: 'Missing semicolon'
          });
        }
        
        if (trimmedLine.includes('=') && 
            !trimmedLine.includes('var ') && 
            !trimmedLine.includes('let ') && 
            !trimmedLine.includes('const ')) {
          warnings.push({
            line: lineNum,
            message: 'Variable may not be declared (use let/const)'
          });
        }
      }
      
      else if (language === 'python' || language === 'py') {
        if (trimmedLine.includes('print') && !trimmedLine.includes('(')) {
          errors.push({
            line: lineNum,
            message: 'print requires parentheses in Python 3'
          });
        }
      }
      
      else if (language === 'java') {
        if (trimmedLine.includes('System.out.println') && !trimmedLine.endsWith(';')) {
          errors.push({
            line: lineNum,
            message: 'Missing semicolon'
          });
        }
      }
      
      else if (language === 'cpp' || language === 'c') {
        if (trimmedLine.includes('cout') && !trimmedLine.endsWith(';')) {
          errors.push({
            line: lineNum,
            message: 'Missing semicolon'
          });
        }
      }
      
      else if (language === 'php') {
        if (trimmedLine.includes('echo') && !trimmedLine.endsWith(';')) {
          errors.push({
            line: lineNum,
            message: 'Missing semicolon'
          });
        }
      }
      
      else if (language === 'html') {
        if (trimmedLine.includes('<') && !trimmedLine.includes('>') && trimmedLine.includes('</')) {
          errors.push({
            line: lineNum,
            message: 'Unclosed HTML tag'
          });
        }
      }
      
      else if (language === 'css') {
        if (trimmedLine.includes(':') && !trimmedLine.endsWith(';') && !trimmedLine.endsWith('}') && !trimmedLine.includes('{')) {
          warnings.push({
            line: lineNum,
            message: 'Missing semicolon in CSS property'
          });
        }
      }
    });
    
    res.json({
      success: true,
      errors: errors,
      warnings: warnings
    });
    
  } catch (error) {
    console.error('❌ Error analyzing file:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Save feedback
app.post('/save-feedback', (req, res) => {
  try {
    const { assignment_id, session_id, file_path, feedback, errors, warnings } = req.body;
    
    console.log('💾 Feedback saved:', {
      assignment_id,
      file_path,
      feedback: feedback ? feedback.substring(0, 50) + '...' : 'No feedback',
      errorCount: errors.length,
      warningCount: warnings.length
    });
    
    // In a real app, you would save this to a database
    // For now, we'll just return success
    
    res.json({
      success: true,
      message: 'Feedback saved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error saving feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clean up old sessions (run every hour)
setInterval(() => {
  const now = Date.now();
  sessions.forEach((session, sessionId) => {
    // Delete sessions older than 1 hour
    if (now - session.createdAt > 3600000) {
      // Delete the cloned repository
      fsSync.rmSync(session.basePath, { recursive: true, force: true });
      sessions.delete(sessionId);
      console.log(`🧹 Cleaned up old session: ${sessionId}`);
    }
  });
}, 3600000);

// Helper function to read all files recursively
async function readAllFiles(dir) {
  const files = [];
  
  async function traverse(currentPath, relativePath = '') {
    const entries = await fs.readdir(currentPath);
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry);
      const relPath = relativePath ? path.join(relativePath, entry) : entry;
      
      try {
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          // Skip hidden directories and .git folder
          if (!entry.startsWith('.') && entry !== 'node_modules' && entry !== '__pycache__') {
            await traverse(fullPath, relPath);
          }
        } else {
          // Get file extension
          const ext = path.extname(entry).toLowerCase();
          
          // Determine language
          let language = 'text';
          const languageMap = {
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.html': 'html',
            '.htm': 'html',
            '.php': 'php',
            '.css': 'css',
            '.scss': 'scss',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.h': 'cpp',
            '.hpp': 'cpp',
            '.json': 'json',
            '.md': 'markdown',
            '.txt': 'text'
          };
          
          language = languageMap[ext] || 'text';
          
          files.push({
            name: entry,
            path: relPath,
            language: language,
            size: stat.size
          });
        }
      } catch (err) {
        console.error(`Error accessing ${fullPath}:`, err.message);
      }
    }
  }
  
  await traverse(dir);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 ==================================');
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📁 Temporary repositories stored in: ${TEMP_BASE_PATH}`);
  console.log('=================================\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Server shutting down...');
  console.log('🧹 Cleaning up temporary files...');
  
  // Clean up all temp folders on shutdown
  if (fsSync.existsSync(TEMP_BASE_PATH)) {
    fsSync.rmSync(TEMP_BASE_PATH, { recursive: true, force: true });
  }
  
  process.exit();
});