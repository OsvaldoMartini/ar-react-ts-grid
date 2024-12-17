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
  actions: string;
  parentId?: number;
  operation?: string;
  preComponent?: boolean;
  exportFile?: string;
  blockActive: boolean;
  blockWait: number;
  refreshLoop?: boolean;
  loopOnly?: boolean;
}

// Define the message type for better type safety
export interface Message {
  body: string;
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
  // {
  //   "id": 1272,
  //   "botJobId": 1033,
  //   "botJobName": "Local Tests",
  //   "instructionOrderNumber": 1,
  //   "actions": "C",
  //   "name": "first page",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1057,
  //   "blockOrderNumber": 1,
  //   "blockName": "Default Block",
  //   "blockActive": true,
  //   "blockWait": 3,
  //   "refreshLoop": true,
  //   "loopOnly": true
  // },
  // {
  //   "id": 1277,
  //   "botJobId": 1033,
  //   "botJobName": "Local Tests",
  //   "instructionOrderNumber": 2,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",
  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 1057,
  //   "blockOrderNumber": 1,
  //   "blockName": "Default Block",
  //   "blockActive": true,
  //   "blockWait": 3,
  //   "refreshLoop": false,
  //   "loopOnly": false
  // },
  // {
  //   "id": 1291,
  //   "botJobId": 1033,
  //   "botJobName": "Local Tests",
  //   "instructionOrderNumber": 3,
  //   "actions": "REFRESH",
  //   "name": "Refresh",
  //   "description": "Refresh",
  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 1057,
  //   "blockOrderNumber": 1,
  //   "blockName": "Default Block",
  //   "blockActive": true,
  //   "blockWait": 3,
  //   "refreshLoop": false,
  //   "loopOnly": false
  // },
  // {
  //   "id": 1286,
  //   "botJobId": 1033,
  //   "botJobName": "Local Tests",
  //   "instructionOrderNumber": 4,
  //   "actions": "C",
  //   "name": "clean",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1057,
  //   "blockOrderNumber": 1,
  //   "blockName": "Default Block",
  //   "blockActive": true,
  //   "blockWait": 3,
  //   "refreshLoop": false,
  //   "loopOnly": false
  // },
  // {
  //   "id": 1273,
  //   "botJobId": 1033,
  //   "botJobName": "Local Tests",
  //   "instructionOrderNumber": 5,
  //   "actions": "C",
  //   "name": "home page",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1057,
  //   "blockOrderNumber": 1,
  //   "blockName": "Default Block",
  //   "blockActive": true,
  //   "blockWait": 3,
  //   "refreshLoop": false,
  //   "loopOnly": false
  // },
  // {
  //   "id": 1289,
  //   "botJobId": 1033,
  //   "botJobName": "Local Tests",
  //   "instructionOrderNumber": 6,
  //   "actions": "REFRESH_LOOP",
  //   "name": "Refresh Loop",
  //   "description": "Refresh Loop",
  //   "operation": "5:5",
  //   "parentId": 1272,
  //   "blockId": 1057,
  //   "blockOrderNumber": 1,
  //   "blockName": "Default Block",
  //   "blockActive": true,
  //   "blockWait": 3,
  //   "refreshLoop": false,
  //   "loopOnly": false
  // },
  // {
  //   "id": 1290,
  //   "botJobId": 1033,
  //   "botJobName": "Local Tests",
  //   "instructionOrderNumber": 7,
  //   "actions": "LOOP",
  //   "name": "LOOP",
  //   "description": "LOOP",
  //   "operation": "5",
  //   "parentId": 1272,
  //   "blockId": 1057,
  //   "blockOrderNumber": 1,
  //   "blockName": "Default Block",
  //   "blockActive": true,
  //   "blockWait": 3,
  //   "refreshLoop": false,
  //   "loopOnly": false
  // },
  // {
  //   "id": 1279,
  //   "botJobId": 1033,
  //   "botJobName": "Local Tests",
  //   "instructionOrderNumber": 8,
  //   "actions": "I:select for horses",
  //   "name": "select for horses",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1057,
  //   "blockOrderNumber": 1,
  //   "blockName": "Default Block",
  //   "blockActive": true,
  //   "blockWait": 3,
  //   "refreshLoop": false,
  //   "loopOnly": false
  // },
  // {
  //   "id": 1282,
  //   "botJobId": 1033,
  //   "botJobName": "Local Tests",
  //   "instructionOrderNumber": 9,
  //   "actions": "I:select for dogs3",
  //   "name": "select for dogs3",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1057,
  //   "blockOrderNumber": 1,
  //   "blockName": "Default Block",
  //   "blockActive": true,
  //   "blockWait": 3,
  //   "refreshLoop": false,
  //   "loopOnly": false
  // },
  // {
  //   "id": 1270,
  //   "botJobId": 1033,
  //   "botJobName": "Local Tests",
  //   "instructionOrderNumber": 1,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",
  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 1056,
  //   "blockOrderNumber": 2,
  //   "blockName": "Goto Block",
  //   "blockActive": true,
  //   "blockWait": 3,
  //   "refreshLoop": false,
  //   "loopOnly": false
  // },
  // {
  //   "id": 1274,
  //   "botJobId": 1033,
  //   "botJobName": "Local Tests",
  //   "instructionOrderNumber": 2,
  //   "actions": "C",
  //   "name": "about",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1056,
  //   "blockOrderNumber": 2,
  //   "blockName": "Goto Block",
  //   "blockActive": true,
  //   "blockWait": 3,
  //   "refreshLoop": false,
  //   "loopOnly": false
  // },
  // {
  //   "id": 1276,
  //   "botJobId": 1033,
  //   "botJobName": "Local Tests",
  //   "instructionOrderNumber": 3,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",
  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 1056,
  //   "blockOrderNumber": 2,
  //   "blockName": "Goto Block",
  //   "blockActive": true,
  //   "blockWait": 3,
  //   "refreshLoop": false,
  //   "loopOnly": false
  // },
  // {
  //   "id": 1283,
  //   "botJobId": 1033,
  //   "botJobName": "Local Tests",
  //   "instructionOrderNumber": 4,
  //   "actions": "C",
  //   "name": "back home",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1056,
  //   "blockOrderNumber": 2,
  //   "blockName": "Goto Block",
  //   "blockActive": true,
  //   "blockWait": 3,
  //   "refreshLoop": false,
  //   "loopOnly": false
  // },
  // {
  //   "id": 1284,
  //   "botJobId": 1033,
  //   "botJobName": "Local Tests",
  //   "instructionOrderNumber": 5,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",
  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 1056,
  //   "blockOrderNumber": 2,
  //   "blockName": "Goto Block",
  //   "blockActive": true,
  //   "blockWait": 3,
  //   "refreshLoop": false,
  //   "loopOnly": false
  // },
  // {
  //   "id": 1280,
  //   "botJobId": 1033,
  //   "botJobName": "Local Tests",
  //   "instructionOrderNumber": 6,
  //   "actions": "I:select for dogs",
  //   "name": "select for dogs",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1056,
  //   "blockOrderNumber": 2,
  //   "blockName": "Goto Block",
  //   "blockActive": true,
  //   "blockWait": 3,
  //   "refreshLoop": false,
  //   "loopOnly": false
  // },
  // {
  //   "id": 1281,
  //   "botJobId": 1033,
  //   "botJobName": "Local Tests",
  //   "instructionOrderNumber": 7,
  //   "actions": "I:select for horese2",
  //   "name": "select for horese2",
  //   "description": "loop desc",
  //   "parentId": 0,
  //   "blockId": 1056,
  //   "blockOrderNumber": 2,
  //   "blockName": "Goto Block",
  //   "blockActive": true,
  //   "blockWait": 3,
  //   "refreshLoop": false,
  //   "loopOnly": false
  // },
  // {
  //   "id": 1287,
  //   "botJobId": 1033,
  //   "botJobName": "Local Tests",
  //   "instructionOrderNumber": 8,
  //   "actions": "GOTO",
  //   "name": "GOTO",
  //   "description": "GOTO",
  //   "operation": "5",
  //   "parentId": 1057,
  //   "blockId": 1056,
  //   "blockOrderNumber": 2,
  //   "blockName": "Goto Block",
  //   "blockActive": true,
  //   "blockWait": 3,
  //   "refreshLoop": false,
  //   "loopOnly": false
  // }
];

export default instructionsMockData2;

// export const botJobMockData: BotJobData = { id: 1, name: "FlatFox", data: 0 };
export const botJobMockData: BotJobData = {
  id: 0,
  name: "",
  instructionId: 0
};
