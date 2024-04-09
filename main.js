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
  const configFilePath = path.join(driveRoot, configFileName);

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