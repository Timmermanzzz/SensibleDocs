#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Demo reset script - Windows compatible
console.log('🔄 Sensible Docs Demo Reset (Windows)');
console.log('='.repeat(50));

// Windows paths
const tempDir = 'C:\\tmp\\demo';
const auditLogPath = path.join(tempDir, 'audit-log.json');

// Clean up existing files
try {
  if (fs.existsSync(auditLogPath)) {
    fs.unlinkSync(auditLogPath);
    console.log('✅ Audit log cleaned');
  } else {
    console.log('ℹ️  No existing audit log found');
  }
  
  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log('✅ Temp directory created');
  } else {
    console.log('ℹ️  Temp directory already exists');
  }
  
  // Create fresh audit log
  fs.writeFileSync(auditLogPath, JSON.stringify([], null, 2));
  console.log('✅ Fresh audit log created');
  
  console.log(`📁 Audit log location: ${auditLogPath}`);
  
} catch (error) {
  console.error('❌ Error during cleanup:', error.message);
  process.exit(1);
}

console.log('');
console.log('🎉 Demo reset complete!');
console.log('💡 The audit trail will start fresh with proper hash chains');
console.log('');
console.log('Next steps:');
console.log('1. Refresh your browser');
console.log('2. Navigate to Audit Log to see clean state');
console.log('3. Perform some actions to test the blockchain integrity'); 