import { ActionDataType, IActionTemplateParam } from "../../types";
import { createEnvironmentVariableString, escapeStr } from "../../utils/stringUtils";

/** Generates Csharp code for action GotoUrl */
export default (params: IActionTemplateParam) => {
  const data =
    params.data.dataType === ActionDataType.LiteralValue
      ? `"${String(params.data.rawData)}"`
      : createEnvironmentVariableString(String(params.data.rawData));
  return `await this.page.goto(${data});`;
};
