// Sample data (mocketData)
export interface BlockLoopInstructionLoadDTO {
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


// Define the message type for better type safety
export interface Message {
  body: string;
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

const instructionsMockData2: BlockLoopInstructionLoadDTO[] = [
  {
    "id": 1328,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 1,
    "actions": "IF",
    "name": "IF",
    "description": "IF",
    "operation": "IF",
    "parentId": 1328,
    "blockId": 1060,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1314,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 2,
    "actions": "H",
    "name": "Wait 2second(s)",
    "description": "Waiting action",
    "operation": "",
    "parentId": 0,
    "blockId": 1060,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1312,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 3,
    "actions": "H",
    "name": "Wait 2second(s)",
    "description": "Waiting action",
    "operation": "",
    "parentId": 0,
    "blockId": 1060,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1329,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 4,
    "actions": "ELSE",
    "name": "ELSE",
    "description": "ELSE",
    "operation": "ELSE",
    "parentId": 1328,
    "blockId": 1060,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1330,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 5,
    "actions": "ENDIF",
    "name": "ENDIF",
    "description": "ENDIF",
    "operation": "ENDIF",
    "parentId": 1328,
    "blockId": 1060,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1315,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 6,
    "actions": "H",
    "name": "Wait 2second(s)",
    "description": "Waiting action",
    "operation": "",
    "parentId": 0,
    "blockId": 1060,
    "blockOrderNumber": 1,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1317,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 1,
    "actions": "H",
    "name": "Wait 5second(s)",
    "description": "Waiting action",
    "operation": "",
    "parentId": 0,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1323,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 2,
    "actions": "H",
    "name": "Wait 30second(s)",
    "description": "Waiting action",
    "operation": "",
    "parentId": 0,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1324,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 3,
    "actions": "Q",
    "name": "Close Browser",
    "description": "Close Browser",
    "operation": "",
    "parentId": 0,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1325,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 4,
    "actions": "Q",
    "name": "Close Browser",
    "description": "Close Browser",
    "operation": "",
    "parentId": 0,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1327,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 5,
    "actions": "P",
    "name": "Screenshot Browser",
    "description": "Screenshot Browser",
    "operation": "",
    "parentId": 0,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1326,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 6,
    "actions": "P",
    "name": "Screenshot Browser",
    "description": "Screenshot Browser",
    "operation": "",
    "parentId": 0,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1286,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 7,
    "actions": "C",
    "name": "clean fields",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1295,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 8,
    "actions": "PAUSE",
    "name": "PAUSE",
    "description": "PAUSE Action",
    "operation": "",
    "parentId": 0,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1273,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 9,
    "actions": "C",
    "name": "home page",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1279,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 10,
    "actions": "I:select for horses",
    "name": "select for horses",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1313,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 11,
    "actions": "PAUSE",
    "name": "PAUSE",
    "description": "PAUSE Action",
    "operation": "",
    "parentId": 0,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1272,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 12,
    "actions": "C",
    "name": "first page",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": false,
    "instructionActive": false,
    "blockWait": 3,
    "refreshLoop": true,
    "loopOnly": true
  },
  {
    "id": 1296,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 13,
    "actions": "LOOP",
    "name": "LOOP",
    "description": "LOOP",
    "operation": "5",
    "parentId": 1272,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": false,
    "instructionActive": false,
    "blockWait": 3
  },
  {
    "id": 1311,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 14,
    "actions": "H",
    "name": "Wait 2second(s)",
    "description": "Waiting action",
    "operation": "",
    "parentId": 0,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": false,
    "instructionActive": false,
    "blockWait": 3
  },
  {
    "id": 1289,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 15,
    "actions": "REFRESH_LOOP",
    "name": "Refresh Loop",
    "description": "Refresh Loop",
    "operation": "5:5",
    "parentId": 1272,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": false,
    "instructionActive": false,
    "blockWait": 3
  },
  {
    "id": 1291,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 16,
    "actions": "REFRESH",
    "name": "Refresh",
    "description": "Refresh",
    "operation": "",
    "parentId": 0,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1276,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 17,
    "actions": "H",
    "name": "Wait 2second(s)",
    "description": "Waiting action",
    "operation": "",
    "parentId": 0,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1280,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 18,
    "actions": "I:select for dogs",
    "name": "select for dogs",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1281,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 19,
    "actions": "I:select for horese2",
    "name": "select for horese2",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1282,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 20,
    "actions": "I:select for dogs3",
    "name": "select for dogs3",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1270,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 21,
    "actions": "H",
    "name": "Wait 2second(s)",
    "description": "Waiting action",
    "operation": "",
    "parentId": 0,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1274,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 22,
    "actions": "C",
    "name": "about",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1283,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 23,
    "actions": "C",
    "name": "back home",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1063,
    "blockOrderNumber": 2,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1284,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 1,
    "actions": "H",
    "name": "Wait 2second(s)",
    "description": "Waiting action",
    "operation": "",
    "parentId": 0,
    "blockId": 1062,
    "blockOrderNumber": 3,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1287,
    "botJobId": 1033,
    "botJobName": "Local Tests",
    "instructionOrderNumber": 1,
    "actions": "GOTO",
    "name": "GOTO",
    "description": "GOTO",
    "operation": "5",
    "parentId": 1057,
    "blockId": 1061,
    "blockOrderNumber": 4,
    "blockName": "Firs Logic",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  }
];

export default instructionsMockData2;

// export const botJobMockData: BotJobData = { id: 1, name: "FlatFox", data: 0 };
export const botJobMockData: BotJobData = {
  id: 0,
  name: "",
  instructionId: 0
};
