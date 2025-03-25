// Sample data (mocketData)
export interface BlockLoopInstructionLoadDTO {
  homeBankingId: number;
  botJobId: number;
  botJobName: string;
  id: number;
  instructionOrderNumber: number;
  name: string;
  description: string;
  blockId: number;
  blockOrderNumber: number;
  blockName: string;
  blockActive: boolean;
  blockWait: number;
  actions: string;
  instructionActive: boolean;
  parentId?: number;
  operation?: string;
  preComponent?: boolean;
  exportFile?: string;
  refreshLoop?: boolean;
  loopOnly?: boolean;
}

export interface ElementDTO {
  typeElement: string;
  tagName: string;
  xPath: string;
  someText: string;
  attribId: string;
  attribName: string;
  coordinates: string;
  attributeData: AttributeData[];
  customXPath: string;
  iFrameXPath: string;
  attributeValue: string;
  attributeType: string;
  searchAttributeValue: string;
}

export interface AttributeData {
  name: string;
  value: string;
}

export interface WebSocketMessage {
  type: string;
  body: any;
}

export interface ComplexMessage {
  parentNameWithId: string; // Format: "(parentId)parentName"
  connectionLabel: string;  // "Connected to:"
  actions: string;          // A string of actions, separated by commas
}

export interface UpdatedBlock {
  botJobId: number | null;  // Adjust the type based on actual data (use `null` if it's nullable)
  blockId: number;
  blockName: string;
  blockOrderNumber: number;
}

// Updated Block interface to include potential new fields in instructions
export interface Block {
  instructions: Array<{
    blockOrderNumber: number;
    blockActive: boolean;
    blockWait: number;
    [key: string]: any; // Include other properties if needed
  }>;
  [key: string]: any; // Add any other properties the block might have
}


export interface BotJobData {
  id: number;
  name: string;
  instructionId: number;
}

export const elementsDTOMockData: ElementDTO[] = [
  {
    "typeElement": "button",
    "tagName": "button",
    "xPath": "//button[@id='submit']",
    "someText": "Submit",
    "attribId": "submit",
    "attribName": "submitBtn",
    "coordinates": "100,200",
    "attributeData": [
      { "name": "id", "value": "submit" },
      { "name": "title", "value": "Click to submit the form" },
      { "name": "aria-label", "value": "Submit button" }
    ],
    "customXPath": "//button[contains(text(),'Submit')]",
    "iFrameXPath": "",
    "attributeValue": "enabled",
    "attributeType": "boolean",
    "searchAttributeValue": "submit"
  },
  {
    "typeElement": "input",
    "tagName": "input",
    "xPath": "//input[@name='username']",
    "someText": "",
    "attribId": "userInput",
    "attribName": "username",
    "coordinates": "150,250",
    "attributeData": [
      { "name": "id", "value": "username" },
      { "name": "placeholder", "value": "Enter username" },
      { "name": "maxlength", "value": "50" }
    ],
    "customXPath": "//input[@placeholder='Enter username']",
    "iFrameXPath": "",
    "attributeValue": "text",
    "attributeType": "string",
    "searchAttributeValue": "username"
  },
  {
    "typeElement": "input",
    "tagName": "input",
    "xPath": "//input[@type='password']",
    "someText": "",
    "attribId": "password",
    "attribName": "passwordInput",
    "coordinates": "150,280",
    "attributeData": [
      { "name": "id", "value": "password" },
      { "name": "placeholder", "value": "Enter password" },
      { "name": "autocomplete", "value": "off" }
    ],
    "customXPath": "//input[@name='password']",
    "iFrameXPath": "",
    "attributeValue": "password",
    "attributeType": "string",
    "searchAttributeValue": "password"
  },
  {
    "typeElement": "div",
    "tagName": "div",
    "xPath": "//div[@class='alert']",
    "someText": "Error: Invalid login",
    "attribId": "",
    "attribName": "errorDiv",
    "coordinates": "160,300",
    "attributeData": [
      { "name": "class", "value": "alert alert-danger" },
      { "name": "role", "value": "alert" },
      { "name": "aria-live", "value": "assertive" }
    ],
    "customXPath": "//div[contains(text(),'Error')]",
    "iFrameXPath": "",
    "attributeValue": "visible",
    "attributeType": "boolean",
    "searchAttributeValue": "alert"
  },
  {
    "typeElement": "a",
    "tagName": "a",
    "xPath": "//a[@href='/forgot-password']",
    "someText": "Forgot Password?",
    "attribId": "",
    "attribName": "forgotPwd",
    "coordinates": "170,320",
    "attributeData": [
      { "name": "href", "value": "/forgot-password" },
      { "name": "title", "value": "Go to forgot password page" }
    ],
    "customXPath": "//a[contains(text(),'Forgot')]",
    "iFrameXPath": "",
    "attributeValue": "link",
    "attributeType": "string",
    "searchAttributeValue": "forgot-password"
  },
  {
    "typeElement": "label",
    "tagName": "label",
    "xPath": "//label[@for='username']",
    "someText": "Username:",
    "attribId": "",
    "attribName": "usernameLabel",
    "coordinates": "100,200",
    "attributeData": [
      { "name": "for", "value": "username" },
      { "name": "class", "value": "form-label" }
    ],
    "customXPath": "//label[contains(text(),'Username')]",
    "iFrameXPath": "",
    "attributeValue": "text",
    "attributeType": "string",
    "searchAttributeValue": "usernameLabel"
  },
  {
    "typeElement": "select",
    "tagName": "select",
    "xPath": "//select[@id='country']",
    "someText": "",
    "attribId": "countrySelect",
    "attribName": "country",
    "coordinates": "200,350",
    "attributeData": [
      { "name": "id", "value": "country" },
      { "name": "name", "value": "country" },
      { "name": "aria-label", "value": "Select country" }
    ],
    "customXPath": "//select[@name='country']",
    "iFrameXPath": "",
    "attributeValue": "dropdown",
    "attributeType": "string",
    "searchAttributeValue": "country"
  },
  {
    "typeElement": "option",
    "tagName": "option",
    "xPath": "//option[@value='US']",
    "someText": "United States",
    "attribId": "",
    "attribName": "usOption",
    "coordinates": "210,360",
    "attributeData": [
      { "name": "value", "value": "US" },
      { "name": "selected", "value": "true" }
    ],
    "customXPath": "//option[contains(text(),'United States')]",
    "iFrameXPath": "",
    "attributeValue": "selected",
    "attributeType": "boolean",
    "searchAttributeValue": "US"
  },
  {
    "typeElement": "checkbox",
    "tagName": "input",
    "xPath": "//input[@type='checkbox' and @id='agree']",
    "someText": "",
    "attribId": "agree",
    "attribName": "agreeCheck",
    "coordinates": "220,370",
    "attributeData": [
      { "name": "id", "value": "agree" },
      { "name": "name", "value": "agree" },
      { "name": "checked", "value": "false" }
    ],
    "customXPath": "//input[@name='agree']",
    "iFrameXPath": "",
    "attributeValue": "checked",
    "attributeType": "boolean",
    "searchAttributeValue": "agree"
  },
  {
    "typeElement": "radio",
    "tagName": "input",
    "xPath": "//input[@type='radio' and @name='gender']",
    "someText": "",
    "attribId": "male",
    "attribName": "genderRadio",
    "coordinates": "230,380",
    "attributeData": [
      { "name": "value", "value": "male" },
      { "name": "checked", "value": "true" }
    ],
    "customXPath": "//input[@value='male']",
    "iFrameXPath": "",
    "attributeValue": "selected",
    "attributeType": "boolean",
    "searchAttributeValue": "male"
  },
  {
    "typeElement": "textarea",
    "tagName": "textarea",
    "xPath": "//textarea[@id='comments']",
    "someText": "",
    "attribId": "comments",
    "attribName": "commentsTextArea",
    "coordinates": "240,390",
    "attributeData": [
      { "name": "id", "value": "comments" },
      { "name": "placeholder", "value": "Enter your comments" },
      { "name": "rows", "value": "4" },
      { "name": "cols", "value": "50" }
    ],
    "customXPath": "//textarea[@name='comments']",
    "iFrameXPath": "",
    "attributeValue": "text",
    "attributeType": "string",
    "searchAttributeValue": "comments"
  },
  {
    "typeElement": "span",
    "tagName": "span",
    "xPath": "//span[@class='tooltip']",
    "someText": "Help text",
    "attribId": "",
    "attribName": "helpTooltip",
    "coordinates": "250,400",
    "attributeData": [
      { "name": "class", "value": "tooltip-text" },
      { "name": "aria-describedby", "value": "help" }
    ],
    "customXPath": "//span[contains(text(),'Help')]",
    "iFrameXPath": "",
    "attributeValue": "visible",
    "attributeType": "boolean",
    "searchAttributeValue": "tooltip"
  },
  {
    "typeElement": "table",
    "tagName": "table",
    "xPath": "//table[@id='dataTable']",
    "someText": "",
    "attribId": "dataTable",
    "attribName": "dataTable",
    "coordinates": "260,410",
    "attributeData": [
      { "name": "id", "value": "dataTable" },
      { "name": "class", "value": "table-striped" }
    ],
    "customXPath": "//table[contains(@class,'data-table')]",
    "iFrameXPath": "",
    "attributeValue": "structure",
    "attributeType": "string",
    "searchAttributeValue": "dataTable"
  },
  {
    "typeElement": "tr",
    "tagName": "tr",
    "xPath": "//tr[@class='row1']",
    "someText": "",
    "attribId": "",
    "attribName": "tableRow",
    "coordinates": "270,420",
    "attributeData": [
      { "name": "class", "value": "row1" }
    ],
    "customXPath": "//tr[contains(@class,'row1')]",
    "iFrameXPath": "",
    "attributeValue": "row",
    "attributeType": "string",
    "searchAttributeValue": "row1"
  },
  {
    "typeElement": "td",
    "tagName": "td",
    "xPath": "//td[@class='column1']",
    "someText": "Cell Data",
    "attribId": "",
    "attribName": "tableCell",
    "coordinates": "280,430",
    "attributeData": [
      { "name": "class", "value": "column1" }
    ],
    "customXPath": "//td[contains(text(),'Cell Data')]",
    "iFrameXPath": "",
    "attributeValue": "text",
    "attributeType": "string",
    "searchAttributeValue": "column1"
  }
];

const instructionsMockData: BlockLoopInstructionLoadDTO[] = [
  {
    "homeBankingId": 1005,
    "id": 1314,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 1,
    "actions": "H",
    "name": "Wait 2second(s)",
    "description": "Waiting action",
    "operation": "",
    "parentId": 0,
    "blockId": 1059,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "homeBankingId": 1005,
    "id": 1328,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 2,
    "actions": "IF",
    "name": "IF",
    "description": "IF",
    "operation": "IF",
    "parentId": 1328,
    "blockId": 1059,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "homeBankingId": 1005,
    "id": 1286,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 3,
    "actions": "C",
    "name": "clean fields",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1059,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "homeBankingId": 1005,
    "id": 1329,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 4,
    "actions": "ELSE",
    "name": "ELSE",
    "description": "ELSE",
    "operation": "ELSE",
    "parentId": 1328,
    "blockId": 1059,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "homeBankingId": 1005,
    "id": 1295,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 5,
    "actions": "PAUSE",
    "name": "PAUSE",
    "description": "PAUSE Action",
    "operation": "",
    "parentId": 0,
    "blockId": 1059,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "homeBankingId": 1005,
    "id": 1330,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 6,
    "actions": "ENDIF",
    "name": "ENDIF",
    "description": "ENDIF",
    "operation": "ENDIF",
    "parentId": 1328,
    "blockId": 1059,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "homeBankingId": 1005,
    "id": 1273,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 7,
    "actions": "C",
    "name": "home page",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1059,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "homeBankingId": 1005,
    "id": 1279,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 8,
    "actions": "I:select for horses",
    "name": "select for horses",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1059,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "homeBankingId": 1005,
    "id": 1313,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 9,
    "actions": "PAUSE",
    "name": "PAUSE",
    "description": "PAUSE Action",
    "operation": "",
    "parentId": 0,
    "blockId": 1059,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "homeBankingId": 1005,
    "id": 1272,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 10,
    "actions": "C",
    "name": "first page",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1059,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3,
    "refreshLoop": true,
    "loopOnly": true
  },
  {
    "homeBankingId": 1005,
    "id": 1296,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 11,
    "actions": "LOOP",
    "name": "LOOP",
    "description": "LOOP",
    "operation": "5",
    "parentId": 1272,
    "blockId": 1059,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "homeBankingId": 1005,
    "id": 1311,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 12,
    "actions": "H",
    "name": "Wait 2second(s)",
    "description": "Waiting action",
    "operation": "",
    "parentId": 0,
    "blockId": 1059,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "homeBankingId": 1005,
    "id": 1289,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 13,
    "actions": "REFRESH_LOOP",
    "name": "Refresh Loop",
    "description": "Refresh Loop",
    "operation": "5:5",
    "parentId": 1272,
    "blockId": 1059,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "homeBankingId": 1005,
    "id": 1291,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 14,
    "actions": "REFRESH",
    "name": "Refresh",
    "description": "Refresh",
    "operation": "",
    "parentId": 0,
    "blockId": 1059,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "homeBankingId": 1005,
    "id": 1276,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 15,
    "actions": "H",
    "name": "Wait 2second(s)",
    "description": "Waiting action",
    "operation": "",
    "parentId": 0,
    "blockId": 1059,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "homeBankingId": 1005,
    "id": 1280,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 16,
    "actions": "I:select for dogs",
    "name": "select for dogs",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1059,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "homeBankingId": 1005,
    "id": 1281,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 17,
    "actions": "I:select for horese2",
    "name": "select for horese2",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1059,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "homeBankingId": 1005,
    "id": 1282,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 18,
    "actions": "I:select for dogs3",
    "name": "select for dogs3",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1059,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "homeBankingId": 1005,
    "id": 1270,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 19,
    "actions": "H",
    "name": "Wait 2second(s)",
    "description": "Waiting action",
    "operation": "",
    "parentId": 0,
    "blockId": 1059,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "homeBankingId": 1005,
    "id": 1482,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 20,
    "actions": "I:asdasdasdasdasdasd",
    "name": "asdasdasdasdasdasd",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1059,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "homeBankingId": 1005,
    "id": 1481,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 21,
    "actions": "I:h1",
    "name": "h1",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1059,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  }
];

export default instructionsMockData;

// export const botJobMockData: BotJobData = { id: 1, name: "FlatFox", data: 0 };
export const botJobMockData: BotJobData = {
  id: 0,
  name: "",
  instructionId: 0
};
