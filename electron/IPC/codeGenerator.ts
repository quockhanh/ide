import { exec } from 'child_process';
import { BrowserWindow } from 'electron';
import fs from 'fs';
import moment from 'moment';
import path from 'path';

import {
  IIpcGenericResponse,
  IIpcResponse,
  IOutputProjectMetadata,
  IProgressDetail,
  IProgressEvent,
  IRmProjFile,
  Language,
  StandardFolder,
} from 'rockmelonqa.common';
import { ISourceProjectMetadata, StandardOutputFile } from 'rockmelonqa.common/file-defs';
import * as fileSystem from '../utils/fileSystem';
import { StringBuilder } from '../utils/stringBuilder';
import { IActionResult, extractMajorMinorVersion, generateCode } from '../worker/actions';
import { buildCode } from '../worker/actions/buildCode';
import { generateOutputProjectMetadata } from '../worker/actions/generateOutputProjectMetadata';
import { generateSourceProjectMetadata } from '../worker/actions/generateSourceProjectMetadata';
import { IChannels } from './core/channelsInterface';
import IPC from './core/ipc';

const nameAPI = 'codeGenerator';

// to Main
const validSendChannel: IChannels = { genCode: genCode };

const validInvokeChannel: IChannels = {
  prerequire: prerequire,
  generateSourceProjectMetadata: genSourceProjectMetadata,
  generateOutputProjectMetadata: genOutputProjectMetadata,
  getOutputProjectMetadata: getOutputProjectMetadata,
};

// from Main
const validReceiveChannel: string[] = [
  'gen-code:validate-input',
  'gen-code:parse-data',
  'gen-code:clean-folder',
  'gen-code:validation-errors',
  'gen-code:generate-code',
  'gen-code:copy-custom-code',
  'build:build',
  'build:install-dependencies',
  'finish',
];

const codeGenearator = new IPC({
  nameAPI,
  validSendChannel,
  validInvokeChannel,
  validReceiveChannel,
});

export default codeGenearator;

/**
 * Get list of invalid prerequisites for code generation
 */
async function prerequire(
  browserWindow: BrowserWindow,
  event: Electron.IpcMainEvent,
  rmprojFile: IRmProjFile
): Promise<string[]> {
  const { language } = rmprojFile.content;
  switch (language) {
    case Language.CSharp:
      const [dotnet, pwsh] = await Promise.all([detectDotnet(6), detectPwsh()]);
      const invalidPrerequisites = [];
      if (!dotnet) {
        invalidPrerequisites.push('dotnet');
      }
      if (!pwsh) {
        invalidPrerequisites.push('pwsh');
      }
      return invalidPrerequisites;
    case Language.Typescript:
      return (await detectNode(16.16)) ? [] : ['node'];
    default:
      return [];
  }
}

/**
 * Determine whether dotnet installed or not
 * @returns True if installed
 */
async function detectDotnet(miniumVersion: number): Promise<boolean> {
  return await new Promise<boolean>((rs, _) => {
    const cmd = 'dotnet --version';
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error (${cmd}): ${error.message}`);
        rs(false);
      }

      if (stderr) {
        console.error(`stderr (${cmd}): ${stderr}`);
        rs(false);
      }

      try {
        const fullVersion = stdout.trim();
        const shortVersion = extractMajorMinorVersion(fullVersion);
        rs(parseFloat(shortVersion) >= miniumVersion);
      } catch (error) {
        console.error(`Error while parsing dotnet version: ${String(error)}`);
        rs(false);
      }
    });
  });
}

/**
 * Determine whether Node installed or not
 * @returns True if installed
 */
async function detectNode(miniumVersion: number): Promise<boolean> {
  return await new Promise<boolean>((rs, _) => {
    const cmd = 'node -v';
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error (${cmd}): ${error.message}`);
        rs(false);
      }

      if (stderr) {
        console.error(`stderr (${cmd}): ${stderr}`);
        rs(false);
      }

      try {
        const match = stdout.trim().match(/^v(\d+\.\d+)\.\d+$/);
        if (match) {
          const version = parseFloat(match[1]);
          rs(version >= miniumVersion);
        } else {
          rs(false);
        }
      } catch (error) {
        console.error(`Error while parsing Node version: ${String(error)}`);
        rs(false);
      }
    });
  });
}

async function detectPwsh(): Promise<boolean> {
  return await new Promise<boolean>((rs, _) => {
    exec('pwsh --version', (error, stdout, stderr) => {
      if (error) {
        rs(false);
      } else if (stderr) {
        rs(false);
      } else {
        rs(true);
      }
    });
  });
}

async function genCode(browserWindow: BrowserWindow, event: Electron.IpcMainEvent, rmprojFile: IRmProjFile) {
  const startTime = new Date();
  let actionRs: IActionResult;
  const sb = new StringBuilder();

  // Main action
  try {
    // Generate code
    actionRs = await generateCode(rmprojFile, (event: IProgressEvent) => {
      const { type, ...details } = event;

      if (details.log) {
        sb.appendLine(details.log);
      }

      browserWindow.webContents.send(type, details as IProgressDetail);
    });

    if (actionRs.isSuccess) {
      // Then, build project + install dependencies
      actionRs = await buildCode(rmprojFile, (event: IProgressEvent) => {
        const { type, ...details } = event;

        if (details.log) {
          sb.appendLine(details.log);
        }

        browserWindow.webContents.send(type, details as IProgressDetail);
      });
    }

    // Actions are completed, let's Save error (if any) to the .code-metadata
    if (!actionRs.isSuccess) {
      let defaultMetaData: IOutputProjectMetadata = { suites: [], cases: [], pages: [], environments: [], routines: [] };
      const metaFilePath = path.join(rmprojFile.folderPath, StandardFolder.OutputCode, StandardOutputFile.MetaData);

      if (fs.existsSync(metaFilePath)) {
        const metaContent = await fileSystem.readFile(metaFilePath);
        defaultMetaData = JSON.parse(metaContent) as IOutputProjectMetadata;
        defaultMetaData.error = { message: actionRs.errorMessage ?? 'Unknown error', data: actionRs.data };
      }
      await fileSystem.writeFile(metaFilePath, JSON.stringify(defaultMetaData, null, 2));
    }
  } catch (err) {
    actionRs = { isSuccess: false, errorMessage: String(err), data: (err as Error)?.stack };
  }

  const ipcRs: IIpcGenericResponse<{ logFile: string }> = {
    isSuccess: actionRs.isSuccess,
    errorMessage: actionRs.errorMessage,
    data: actionRs.data,
  };

  // Print log file
  try {
    sb.appendLine(`*** Finish at ${moment().format('MMMM Do YYYY, h:mm:ss a')}`);
    sb.appendLine(JSON.stringify(ipcRs, null, 4));

    const logsFolder = path.join(rmprojFile.folderPath, StandardFolder.Logs);
    await fileSystem.createFolder(logsFolder);

    const logFileName = `gen-code.${moment(startTime).format('YYYYMMDD_HHmmss')}.log`;
    const logFilePath = path.join(logsFolder, logFileName);
    await fileSystem.writeFile(logFilePath, sb.toString());

    ipcRs.data = { logFile: path.join(StandardFolder.Logs, logFileName) };
  } finally {
    browserWindow.webContents.send('finish', ipcRs);
  }
}

/** Compile metadata of source project */
async function genSourceProjectMetadata(
  browserWindow: BrowserWindow,
  event: Electron.IpcMainEvent,
  projectFile: IRmProjFile
): Promise<IIpcGenericResponse<ISourceProjectMetadata>> {
  try {
    const actionRs = await generateSourceProjectMetadata(projectFile);
    return { isSuccess: true, data: actionRs.data } as IIpcResponse;
  } catch (error) {
    return { isSuccess: false, errorMessage: `Cannot generate source project metadata: ${error}` };
  }
}

/** Compile metadata of output project */
async function genOutputProjectMetadata(
  browserWindow: BrowserWindow,
  event: Electron.IpcMainEvent,
  projectFile: IRmProjFile
): Promise<IIpcGenericResponse<IOutputProjectMetadata>> {
  try {
    const actionRs = await generateOutputProjectMetadata(projectFile);
    return { isSuccess: true, data: actionRs.data } as IIpcResponse;
  } catch (error) {
    return { isSuccess: false, errorMessage: `Cannot generate output project metadata: ${error}` };
  }
}

/** Read metadata file of output project */
async function getOutputProjectMetadata(
  browserWindow: BrowserWindow,
  event: Electron.IpcMainEvent,
  projectFile: IRmProjFile
): Promise<IIpcGenericResponse<IOutputProjectMetadata>> {
  try {
    const metaFilePath = path.join(projectFile.folderPath, StandardFolder.OutputCode, StandardOutputFile.MetaData);
    const content = fs.readFileSync(metaFilePath, 'utf-8');
    const metaData = JSON.parse(content);
    return { isSuccess: true, data: metaData } as IIpcResponse;
  } catch (error) {
    return {
      isSuccess: false,
      errorMessage: `Cannot get output project metadata from ${StandardOutputFile.MetaData} file: ${error}`,
    };
  }
}
