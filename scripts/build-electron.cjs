// CRITICAL: Disable Electron's internal ASAR archive interception
// so fs methods treat .asar as ordinary files, preventing rmdir/EBUSY/invalid package errors.
process.noAsar = true;

const { build, Platform, Arch } = require('electron-builder');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('====================================================');
  console.log("DOMINAL'S POS — INAMDAR RESTAURANT DESKTOP EXE BUILDER");
  console.log('====================================================');
  console.log('Targets: Windows NSIS Setup Installer + Portable .exe (x64)');
  console.log('Dual Storage: Automatic C:\\InamdarPOS_Data and D:\\InamdarPOS_Data initialization');
  console.log('Output Directory: dist-electron\n');

  try {
    const result = await build({
      targets: Platform.WINDOWS.createTarget(['nsis', 'portable'], Arch.x64),
      config: {
        appId: 'com.dominals.inamdarpos',
        productName: 'Inamdar Restaurant POS',
        electronDist: 'node_modules/electron/dist',
        compression: 'normal',
        directories: {
          output: 'dist-electron'
        },
        files: [
          'dist/**/*',
          'electron/**/*',
          'package.json'
        ],
        win: {
          target: [
            {
              target: 'nsis',
              arch: ['x64']
            },
            {
              target: 'portable',
              arch: ['x64']
            }
          ]
        },
        nsis: {
          oneClick: false,
          perMachine: true,
          allowToChangeInstallationDirectory: true,
          deleteAppDataOnUninstall: false,
          createDesktopShortcut: 'always',
          createStartMenuShortcut: true,
          shortcutName: 'Inamdar Restaurant POS',
          artifactName: 'Inamdar-Restaurant-POS-Setup-${version}.${ext}',
          uninstallDisplayName: 'Inamdar Restaurant POS'
        },
        portable: {
          artifactName: 'Inamdar-Restaurant-POS-Portable.exe'
        },
        asar: true
      }
    });

    console.log('\n====================================================');
    console.log('BUILD FINISHED SUCCESSFULLY!');
    console.log('Artifacts generated:', result);

    // Copy generated executables directly to the project root for instant one-click download & launching!
    const generatedSetup = path.join(__dirname, '../dist-electron/Inamdar-Restaurant-POS-Setup-1.0.0.exe');
    const rootSetup = path.join(__dirname, '../Inamdar-Restaurant-POS-Setup-1.0.0.exe');
    if (fs.existsSync(generatedSetup)) {
      fs.copyFileSync(generatedSetup, rootSetup);
      const setupStat = fs.statSync(rootSetup);
      console.log(`Copied Setup Installer to root: ${rootSetup} (${(setupStat.size / (1024 * 1024)).toFixed(1)} MB)`);
    }

    const generatedPortable = path.join(__dirname, '../dist-electron/Inamdar-Restaurant-POS-Portable.exe');
    const rootPortable = path.join(__dirname, '../Inamdar-Restaurant-POS-Portable.exe');
    if (fs.existsSync(generatedPortable)) {
      fs.copyFileSync(generatedPortable, rootPortable);
      const portStat = fs.statSync(rootPortable);
      console.log(`Copied Portable Executable to root: ${rootPortable} (${(portStat.size / (1024 * 1024)).toFixed(1)} MB)`);
    }

    console.log('====================================================');
  } catch (err) {
    console.error('\nBuild failed with error:', err);
    process.exit(1);
  }
}

run();
