import { ISourceProjectMetadata, ITestCase, ITestRoutine, ITestSuite } from "../../file-defs";
import { IPage } from "../../file-defs/pageFile";
import { createDotnetProjectMetadata } from "../playwright-charp-common/createDotnetProjectMetadata";
import { DotnetTestProjectMetaGenerator } from "../playwright-charp-common/dotnetTestProjectMetaGenerator";
import { IOutputProjectMetadataGenerator, MapCreator } from "../playwright-charp-common/outputProjectMetadataProcessor";
import { IOutputFileInfo, IOutputProjectMetadata } from "../types";

/** MsTest project meta: Contains info of all files and other resources */
export class MsTestProjMetaGenerator extends DotnetTestProjectMetaGenerator implements IOutputProjectMetadataGenerator {
  constructor(codegenMeta: ISourceProjectMetadata) {
    super(codegenMeta);
  }
  public createOutputProjectMetadata(): IOutputProjectMetadata {
    return this.createDotnetProjectMetadata();
  }
}
