export interface ICsharpTemplateCollection {
  BASE_CLASSES_FILE: HandlebarsTemplateDelegate<any>;

  COMMENT: HandlebarsTemplateDelegate<any>;

  PAGE_DEFINITIONS_FILE: HandlebarsTemplateDelegate<any>;
  PAGE_ELEMENT_PROPERTY: HandlebarsTemplateDelegate<any>;
  PAGE_FILE: HandlebarsTemplateDelegate<any>;

  TEST_CASE_FILE: HandlebarsTemplateDelegate<any>;
  TEST_ROUTINE_FILE: HandlebarsTemplateDelegate<any>;
  TEST_SUITE_FILE: HandlebarsTemplateDelegate<any>;
  TEST_FUNCTION: HandlebarsTemplateDelegate<any>;

  CSPROJECT_FILE: HandlebarsTemplateDelegate<any>;
  RUNSETTINGS_FILE: HandlebarsTemplateDelegate<any>;
  USINGS_FILE: HandlebarsTemplateDelegate<any>;
}
