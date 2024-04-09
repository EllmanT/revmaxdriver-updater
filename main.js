const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const configFileName = 'config.ini';
const certificateFolderName = 'certificate';

// Get the list of available drives on the system
const drives = os.platform() === 'win32' ? getWindowsDrives() : getUnixDrives();

// Iterate through the drives to find the correct one
let targetDrive = null;
let configFilePath= null;
for (const drive of drives) {
  const driveRoot = path.join(drive, path.sep);

  // Skip the drive containing the operating system
  if (os.platform() === 'win32' && driveRoot === os.platform() + '\\') {
    console.log(`Skipping drive ${drive} (OS drive)`);
    continue;
  }
  if (os.platform() !== 'win32' && driveRoot === '/') {
    console.log(`Skipping drive ${drive} (OS drive)`);
    continue;
  }

  console.log(`Checking drive ${drive}...`);

  const certificateFolderPath = path.join(driveRoot, certificateFolderName);
   configFilePath = path.join(driveRoot, configFileName);

  console.log(`Checking certificate folder: ${certificateFolderPath}`);
  console.log(`Checking config file: ${configFilePath}`);

  // Check if the certificate folder and config.ini file exist
  if (fs.existsSync(certificateFolderPath) && fs.existsSync(configFilePath)) {
    targetDrive = drive;
    break;
  }
}

if (!targetDrive) {
  console.error(`Drive with '${certificateFolderName}' folder and '${configFileName}' file not found.`);
  return;
}

console.log(`Target drive found: ${targetDrive}`);

fs.readFile(configFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error opening the file:', err);
      return;
    }
  
    console.log("File opened");
  
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  
    let vatNumber = null;
    let previousReceiptDateExists = false;
    let isVATvalid = false;
    let count = 10;
  
    rl.on('line', (input) => {
      const trimmedInput = input.trim();
      if (trimmedInput.length === 9) {
        vatNumber = trimmedInput;
        isVATvalid = true;
        console.log("VAT is Valid");
        rl.close();
      } else {
        count--;
        console.log(`VAT is not valid (must be 9 characters). ${count} attempts left.`);
        if (count > 0) {
          rl.prompt();
        } else {
          console.log("No attempts left. Exiting.");
          rl.close();
        }
      }
    });
  
    console.log("Enter your VAT Number (9 characters):");
    rl.prompt();
  
    rl.on('close', () => {
      if (isVATvalid) {
        const lines = data.split('\n');
        let updatedData = '';
        let vatNumberUpdated = false;
  
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
  
          if (line.match(/^PreviousReceiptDate:/i)) {
            previousReceiptDateExists = true;
          }
  
          if (line.match(/^VATNumber:/i)) {
            updatedData += `VATNumber: ${vatNumber}\n`;
            vatNumberUpdated = true;
          } else {
            updatedData += line + '\n';
          }
        }
  
        if (!vatNumberUpdated) {
          updatedData += `VATNumber: ${vatNumber}\n`;
        }
  
        if (!previousReceiptDateExists) {
            const currentDate = new Date().toISOString();
            updatedData += `PreviousReceiptDate: ${currentDate}\n`;
          }
        fs.writeFile(configFilePath, updatedData, 'utf8', (err) => {
          if (err) {
            console.error("Error saving the file:", err);
            console.error("Update failed!");
          } else {
            console.log("File saved successfully.");
            console.log("Update successful!");
          }
        });
      }
    });
  });
// Continue with the rest of the code for the target drive

// Function to get the list of Windows drives
function getWindowsDrives() {
  const drives = [];
  for (let i = 65; i <= 90; i++) {
    const driveLetter = String.fromCharCode(i);
    const drivePath = driveLetter + ':\\';
    if (fs.existsSync(drivePath)) {
      drives.push(drivePath);
    }
  }
  return drives;
}

// Function to get the list of Unix drives
function getUnixDrives() {
  return fs.readdirSync('/').map((entry) => path.join('/', entry));
}