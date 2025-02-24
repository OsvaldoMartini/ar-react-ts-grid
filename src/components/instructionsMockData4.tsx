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
  coords: string;
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
    "coords": "100,200",
    "attributeData": [],
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
    "coords": "150,250",
    "attributeData": [],
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
    "coords": "150,280",
    "attributeData": [],
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
    "coords": "160,300",
    "attributeData": [],
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
    "coords": "170,320",
    "attributeData": [],
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
    "coords": "100,200",
    "attributeData": [],
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
    "coords": "200,350",
    "attributeData": [],
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
    "coords": "210,360",
    "attributeData": [],
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
    "coords": "220,370",
    "attributeData": [],
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
    "coords": "230,380",
    "attributeData": [],
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
    "coords": "240,390",
    "attributeData": [],
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
    "coords": "250,400",
    "attributeData": [],
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
    "coords": "260,410",
    "attributeData": [],
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
    "coords": "270,420",
    "attributeData": [],
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
    "coords": "280,430",
    "attributeData": [],
    "customXPath": "//td[contains(@class,'column1')]",
    "iFrameXPath": "",
    "attributeValue": "text",
    "attributeType": "string",
    "searchAttributeValue": "column1"
  }
];

const instructionsMockData2: BlockLoopInstructionLoadDTO[] = [
  // {
  //   "id": 1214,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 1,
  //   "actions": "I:username",
  //   "name": "username",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1040,
  //   "blockOrderNumber": 1,
  //   "blockName": "CA Next Bank default block",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1215,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 2,
  //   "actions": "I:password",
  //   "name": "password",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1040,
  //   "blockOrderNumber": 1,
  //   "blockName": "CA Next Bank default block",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1216,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 3,
  //   "actions": "C",
  //   "name": "loginButton",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1040,
  //   "blockOrderNumber": 1,
  //   "blockName": "CA Next Bank default block",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1217,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 4,
  //   "actions": "PAUSE",
  //   "name": "PAUSE",
  //   "description": "PAUSE Action",
  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 1040,
  //   "blockOrderNumber": 1,
  //   "blockName": "CA Next Bank default block",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1218,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 1,
  //   "actions": "C",
  //   "name": "profile",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1041,
  //   "blockOrderNumber": 2,
  //   "blockName": "Change Language",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1221,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 2,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",
  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 1041,
  //   "blockOrderNumber": 2,
  //   "blockName": "Change Language",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1219,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 3,
  //   "actions": "C",
  //   "name": "language selection",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1041,
  //   "blockOrderNumber": 2,
  //   "blockName": "Change Language",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1222,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 4,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",
  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 1041,
  //   "blockOrderNumber": 2,
  //   "blockName": "Change Language",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1220,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 5,
  //   "actions": "I:select language",
  //   "name": "select language",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1041,
  //   "blockOrderNumber": 2,
  //   "blockName": "Change Language",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1225,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 6,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",
  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 1041,
  //   "blockOrderNumber": 2,
  //   "blockName": "Change Language",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1223,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 7,
  //   "actions": "C",
  //   "name": "English",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1041,
  //   "blockOrderNumber": 2,
  //   "blockName": "Change Language",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1226,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 8,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",
  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 1041,
  //   "blockOrderNumber": 2,
  //   "blockName": "Change Language",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1224,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 9,
  //   "actions": "C",
  //   "name": "changer",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1041,
  //   "blockOrderNumber": 2,
  //   "blockName": "Change Language",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1227,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 10,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",
  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 1041,
  //   "blockOrderNumber": 2,
  //   "blockName": "Change Language",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1228,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 1,
  //   "actions": "C",
  //   "name": "new payment",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1042,
  //   "blockOrderNumber": 3,
  //   "blockName": "New Payment",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1231,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 2,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",
  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 1042,
  //   "blockOrderNumber": 3,
  //   "blockName": "New Payment",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1229,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 3,
  //   "actions": "C",
  //   "name": "NEW ACCOUNT TRANSFER",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1042,
  //   "blockOrderNumber": 3,
  //   "blockName": "New Payment",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1232,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 4,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",
  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 1042,
  //   "blockOrderNumber": 3,
  //   "blockName": "New Payment",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1230,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 5,
  //   "actions": "C",
  //   "name": "CREDIT ACCOUNT",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1042,
  //   "blockOrderNumber": 3,
  //   "blockName": "New Payment",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1234,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 6,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",
  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 1042,
  //   "blockOrderNumber": 3,
  //   "blockName": "New Payment",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1233,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 7,
  //   "actions": "C",
  //   "name": "ACCOUNT",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1042,
  //   "blockOrderNumber": 3,
  //   "blockName": "New Payment",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1236,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 8,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",
  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 1042,
  //   "blockOrderNumber": 3,
  //   "blockName": "New Payment",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1235,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 9,
  //   "actions": "I:AMOUNT",
  //   "name": "AMOUNT",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1042,
  //   "blockOrderNumber": 3,
  //   "blockName": "New Payment",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1237,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 10,
  //   "actions": "I:REASON",
  //   "name": "REASON",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1042,
  //   "blockOrderNumber": 3,
  //   "blockName": "New Payment",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1251,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 11,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",
  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 1042,
  //   "blockOrderNumber": 3,
  //   "blockName": "New Payment",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1238,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 12,
  //   "actions": "C",
  //   "name": "NEXT",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1042,
  //   "blockOrderNumber": 3,
  //   "blockName": "New Payment",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1242,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 13,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",
  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 1042,
  //   "blockOrderNumber": 3,
  //   "blockName": "New Payment",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1240,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 14,
  //   "actions": "C",
  //   "name": "SUBMIT",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1042,
  //   "blockOrderNumber": 3,
  //   "blockName": "New Payment",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1239,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 1,
  //   "actions": "C",
  //   "name": "NEXT CONFIRM",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1043,
  //   "blockOrderNumber": 4,
  //   "blockName": "Confirm Date",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1241,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 1,
  //   "actions": "C",
  //   "name": "VIEW DETAILS",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1044,
  //   "blockOrderNumber": 5,
  //   "blockName": "View Details",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1244,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 1,
  //   "actions": "C",
  //   "name": "Payments",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1045,
  //   "blockOrderNumber": 6,
  //   "blockName": "All Payments",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1250,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 2,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",
  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 1045,
  //   "blockOrderNumber": 6,
  //   "blockName": "All Payments",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1245,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 3,
  //   "actions": "C",
  //   "name": "ALL",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1045,
  //   "blockOrderNumber": 6,
  //   "blockName": "All Payments",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1249,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 4,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",
  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 1045,
  //   "blockOrderNumber": 6,
  //   "blockName": "All Payments",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1246,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 5,
  //   "actions": "C",
  //   "name": "OPEN DETAILS",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1045,
  //   "blockOrderNumber": 6,
  //   "blockName": "All Payments",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1248,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 6,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",
  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 1045,
  //   "blockOrderNumber": 6,
  //   "blockName": "All Payments",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1247,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 7,
  //   "actions": "C",
  //   "name": "VIEW",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1045,
  //   "blockOrderNumber": 6,
  //   "blockName": "All Payments",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1252,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 1,
  //   "actions": "IF",
  //   "name": "IF",
  //   "description": "IF",
  //   "operation": "IF",
  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/credito agricola.xlsx",
  //   "parentId": 1252,
  //   "blockId": 1046,
  //   "blockOrderNumber": 7,
  //   "blockName": "Check Transaction",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1243,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 2,
  //   "actions": "O:reference number",
  //   "name": "reference number",
  //   "description": "loop desc",
  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/credito agricola.xlsx",
  //   "parentId": 0,
  //   "blockId": 1046,
  //   "blockOrderNumber": 7,
  //   "blockName": "Check Transaction",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1258,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 3,
  //   "actions": "E",
  //   "name": "ExcelWrite",
  //   "description": "ExcelWrite",
  //   "operation": "ExcelWrite:$REFERENCE NUMBER",
  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/credito agricola.xlsx",
  //   "parentId": 1243,
  //   "blockId": 1046,
  //   "blockOrderNumber": 7,
  //   "blockName": "Check Transaction",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1253,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 4,
  //   "actions": "ELSE",
  //   "name": "ELSE",
  //   "description": "ELSE",
  //   "operation": "ELSE",
  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/credito agricola.xlsx",
  //   "parentId": 1252,
  //   "blockId": 1046,
  //   "blockOrderNumber": 7,
  //   "blockName": "Check Transaction",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1255,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 5,
  //   "actions": "H",
  //   "name": "Wait 5second(s)",
  //   "description": "Waiting action",
  //   "operation": "",
  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/credito agricola.xlsx",
  //   "parentId": 0,
  //   "blockId": 1046,
  //   "blockOrderNumber": 7,
  //   "blockName": "Check Transaction",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1256,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 6,
  //   "actions": "GOTO",
  //   "name": "GOTO",
  //   "description": "GOTO",
  //   "operation": "6# All Payments",
  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/credito agricola.xlsx",
  //   "parentId": 1045,
  //   "blockId": 1046,
  //   "blockOrderNumber": 7,
  //   "blockName": "Check Transaction",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1254,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 7,
  //   "actions": "ENDIF",
  //   "name": "ENDIF",
  //   "description": "ENDIF",
  //   "operation": "ENDIF",
  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/credito agricola.xlsx",
  //   "parentId": 1252,
  //   "blockId": 1046,
  //   "blockOrderNumber": 7,
  //   "blockName": "Check Transaction",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // },
  // {
  //   "id": 1257,
  //   "botJobId": 1032,
  //   "botJobName": "CA Next Bank",
  //   "instructionOrderNumber": 8,
  //   "actions": "PAUSE",
  //   "name": "PAUSE",
  //   "description": "PAUSE Action",
  //   "operation": "",
  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/credito agricola.xlsx",
  //   "parentId": 0,
  //   "blockId": 1046,
  //   "blockOrderNumber": 7,
  //   "blockName": "Check Transaction",
  //   "blockActive": true,
  //   "instructionActive": true,
  //   "blockWait": 3
  // }
];

export default instructionsMockData2;

// export const botJobMockData: BotJobData = { id: 1, name: "FlatFox", data: 0 };
export const botJobMockData: BotJobData = {
  id: 0,
  name: "",
  instructionId: 0
};
