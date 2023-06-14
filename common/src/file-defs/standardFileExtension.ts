export class StandardFileExtension {
  static readonly Environment: string = ".env";
  static readonly TestSuite: string = ".tsuite";
  static readonly TestCase: string = ".tcase";
  static readonly TestRoutine: string = ".troutine";
  static readonly Page: string = ".page";
  static readonly Project: string = ".rmproj";  
}

export const ExtensionToNameMap = {
  [StandardFileExtension.Environment]: "Environment",
  [StandardFileExtension.TestSuite]: "TestSuite",
  [StandardFileExtension.TestCase]: "TestCase",
  [StandardFileExtension.TestRoutine]: "TestRoutine",
  [StandardFileExtension.Page]: "Page",
};
