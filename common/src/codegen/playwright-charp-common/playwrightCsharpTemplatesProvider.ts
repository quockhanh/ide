import { IActionTemplateParam, ILocatorTemplateParam } from "../types";

export interface IPlaywrightCsharpTemplatesProvider {
  getEnvironmentSettingsFiles: (rootNamespace: string, allVariableNames: string[]) => string;
  getTestSuiteBase: (rootNamespace: string, testIdAttributeName: string) => string;
  getTestSuiteFile: (
    usings: string,
    name: string,
    description: string,
    body: string,
    rootNamespace: string,
    fullNamespace: string
  ) => string;

  getTestCaseBase: (rootNamespace: string) => string;
  getBasePageFile: (rootNamespace: string) => string;
  getBasePageTestFile: (rootNamespace: string) => string;
  getTestCaseFile: (
    testCaseName: string,
    description: string,
    body: string,
    rootNamespace: string,
    fullNamespace: string,
    usings: string[]
  ) => string;

  getTestRoutineClass: (testRoutineName: string, description: string, body: string) => string;
  getTestRoutineFile: (rootNamespace: string, fullNamespace: string, testRoutineClasses: string[]) => string;
  getTestRoutineBaseFile: (rootNamespace: string) => string;

  getAction: (params: IActionTemplateParam) => string;
  getComment: (message: string) => string;
  getTestFunction: (name: string, description: string) => string;

  getLocator: (params: ILocatorTemplateParam) => string;
  getPage: (fullNamespace: string, pageClassName: string, pageDescription: string, pageBody: string) => string;
  getPageDefinitions: (rootNamespace: string, usings: string, pageDeclaration: string, body: string) => string;

  getCsProject: (rootNamespace: string) => string;
  getRunSettings: () => string;
  getUsings: (rootNamespace: string, hasRoutines: boolean) => string;
}
