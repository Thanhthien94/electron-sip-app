#!/usr/bin/env node

/**
 * Script tạo file .env từ .env.example
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const examplePath = path.join(process.cwd(), '.env.example');
const envPath = path.join(process.cwd(), '.env');

// Tạo interface cho readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Đọc file .env.example
async function readExampleEnv() {
  try {
    if (!fs.existsSync(examplePath)) {
      console.error('File .env.example không tồn tại!');
      process.exit(1);
    }
    
    return fs.readFileSync(examplePath, 'utf8');
  } catch (error) {
    console.error('Lỗi khi đọc file .env.example:', error);
    process.exit(1);
  }
}

// Hỏi người dùng về biến môi trường
async function promptForEnv(exampleContent) {
  const envVars = {};
  const lines = exampleContent.split('\n');
  
  for (const line of lines) {
    // Bỏ qua comment và dòng trống
    if (line.trim() && !line.startsWith('#')) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let defaultValue = match[2].trim();
        
        // Xóa dấu nháy nếu có
        if ((defaultValue.startsWith('"') && defaultValue.endsWith('"')) || 
            (defaultValue.startsWith("'") && defaultValue.endsWith("'"))) {
          defaultValue = defaultValue.substring(1, defaultValue.length - 1);
        }
        
        // Hỏi người dùng
        const answer = await new Promise(resolve => {
          rl.question(`${key} (mặc định: ${defaultValue}): `, answer => {
            resolve(answer || defaultValue);
          });
        });
        
        envVars[key] = answer;
      }
    }
  }
  
  return envVars;
}

// Tạo file .env
async function createEnvFile(envVars) {
  try {
    let content = '# Biến môi trường cho ứng dụng SIP\n';
    content += '# Tạo tự động từ script create-env.js\n\n';
    
    // Thêm các biến
    Object.entries(envVars).forEach(([key, value]) => {
      content += `${key}='${value}'\n`;
    });
    
    // Ghi file .env
    fs.writeFileSync(envPath, content, 'utf8');
    console.log('File .env đã được tạo thành công!');
  } catch (error) {
    console.error('Lỗi khi tạo file .env:', error);
    process.exit(1);
  }
}

// Chạy script
async function main() {
  try {
    console.log('Đang tạo file .env từ .env.example...');
    
    // Kiểm tra nếu file .env đã tồn tại
    if (fs.existsSync(envPath)) {
      const overwrite = await new Promise(resolve => {
        rl.question('File .env đã tồn tại. Ghi đè? (y/N): ', answer => {
          resolve(answer.toLowerCase() === 'y');
        });
      });
      
      if (!overwrite) {
        console.log('Hủy bỏ.');
        rl.close();
        return;
      }
    }
    
    const exampleContent = await readExampleEnv();
    const envVars = await promptForEnv(exampleContent);
    await createEnvFile(envVars);
    
    rl.close();
  } catch (error) {
    console.error('Lỗi không xác định:', error);
    rl.close();
    process.exit(1);
  }
}

main();