import { info } from "console";
import fs from "fs";
import fse from "fs-extra";
import path from "path";

import { IRmProjFile, StandardFolder } from "../file-defs";
import { CodeGenFactory } from "./codegenFactory";
import { ProgressEventCallback } from "./types";
import { buildWriteFileFn, copyCustomCode } from "./utils/codegenUtils";
import { createSourceProjectMetadata } from "./codegenSourceProjectMeta";
import { CodegenSourceProjectValidator } from "./codegenSourceProjectValidator";

/** Generates test project */
export const generateCode = async (
  rmprojFile: IRmProjFile,
  progressNotify: ProgressEventCallback
): Promise<boolean> => {
  info("#################");
  info("# GENERATE CODE #");
  info("#################");

  // Print out information about the context
  info(``);
  info(``);
  info(`--------------------------------------------------`);
  info(`-- Rockmelon QA`);
  info(`-- Framework: ${rmprojFile.content.automationFramework}`);
  info(`-- Language: ${rmprojFile.content.language}`);
  info(`-- Test Framework: ${rmprojFile.content.testFramework}`);
  info(`-- Date: ${new Date()}`);
  info(`--------------------------------------------------`);

  const sourceProjMeta = await createSourceProjectMetadata(rmprojFile, progressNotify);

  const validationErrors = new CodegenSourceProjectValidator(sourceProjMeta).validate();

  if (validationErrors.length) {
    progressNotify({
      type: "validation-errors",
      log: `Validation of source files returned errors`,
      data: validationErrors,
    });
    console.error(validationErrors);
    return false;
  }

  const outputDir = path.join(rmprojFile.folderPath, StandardFolder.OutputCode);

  info(``);
  info(``);
  info(`--------------------------------------------------`);
  info(`-- Generating code to '${outputDir}'`);
  info("--------------------------------------------------");

  if (fs.existsSync(outputDir)) {
    progressNotify({ type: "clean-folder", log: `Cleaning folder: ${outputDir}` });
    fse.emptyDirSync(outputDir);
  }

  info(``);
  info(``);
  info(`--------------------------------------------------`);
  info(`-- Copy custom code`);
  info("--------------------------------------------------");
  await copyCustomCode(rmprojFile, outputDir, progressNotify);

  const writeFile = buildWriteFileFn(rmprojFile, progressNotify);
  const codegen = CodeGenFactory.newInstance(sourceProjMeta);
  await codegen.generateCode(true, writeFile);

  // Done
  info(``);
  info(``);
  info(`Finish generating code!`);
  return true;
};
