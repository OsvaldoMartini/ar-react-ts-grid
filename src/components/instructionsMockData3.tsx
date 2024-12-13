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
  {
    "id": 1259,
    "botJobId": 1002,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 1,
    "actions": "C",
    "name": "termination",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1050,
    "blockOrderNumber": 1,
    "blockName": "Termination",
    "blockActive": true,
    "blockWait": 3,
    "refreshLoop": false
  },
  {
    "id": 1098,
    "botJobId": 1002,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 2,
    "actions": "H",
    "name": "Wait 5second(s)",
    "description": "Waiting action",
    "operation": "",
    "parentId": 0,
    "blockId": 1050,
    "blockOrderNumber": 1,
    "blockName": "Termination",
    "blockActive": true,
    "blockWait": 3,
    "refreshLoop": false
  },
  {
    "id": 1263,
    "botJobId": 1002,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 1,
    "actions": "C",
    "name": "advertise",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1053,
    "blockOrderNumber": 2,
    "blockName": "Advertise",
    "blockActive": true,
    "blockWait": 3,
    "refreshLoop": false
  },
  {
    "id": 1096,
    "botJobId": 1002,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 2,
    "actions": "H",
    "name": "Wait 5second(s)",
    "description": "Waiting action",
    "operation": "",
    "parentId": 0,
    "blockId": 1053,
    "blockOrderNumber": 2,
    "blockName": "Advertise",
    "blockActive": true,
    "blockWait": 3,
    "refreshLoop": false
  },
  {
    "id": 1264,
    "botJobId": 1002,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 3,
    "actions": "C",
    "name": "about us",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1053,
    "blockOrderNumber": 2,
    "blockName": "Advertise",
    "blockActive": true,
    "blockWait": 3,
    "refreshLoop": false
  },
  {
    "id": 1194,
    "botJobId": 1002,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 1,
    "actions": "IF",
    "name": "IF",
    "description": "IF",
    "operation": "IF",
    "parentId": 1194,
    "blockId": 1051,
    "blockOrderNumber": 3,
    "blockName": "Search Field",
    "blockActive": true,
    "blockWait": 3,
    "refreshLoop": false
  },
  {
    "id": 1269,
    "botJobId": 1002,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 2,
    "actions": "REFRESH",
    "name": "Refresh",
    "description": "Refresh",
    "operation": "",
    "parentId": 0,
    "blockId": 1051,
    "blockOrderNumber": 3,
    "blockName": "Search Field",
    "blockActive": true,
    "blockWait": 3,
    "refreshLoop": false
  },
  {
    "id": 1265,
    "botJobId": 1002,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 3,
    "actions": "I:city-name",
    "name": "city-name",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1051,
    "blockOrderNumber": 3,
    "blockName": "Search Field",
    "blockActive": true,
    "blockWait": 3,
    "refreshLoop": true
  },
  {
    "id": 1195,
    "botJobId": 1002,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 4,
    "actions": "ELSE",
    "name": "ELSE",
    "description": "ELSE",
    "operation": "ELSE",
    "parentId": 1194,
    "blockId": 1051,
    "blockOrderNumber": 3,
    "blockName": "Search Field",
    "blockActive": true,
    "blockWait": 3,
    "refreshLoop": false
  },
  {
    "id": 1268,
    "botJobId": 1002,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 5,
    "actions": "LOOP",
    "name": "Loop",
    "description": "Loop",
    "operation": "5",
    "parentId": 1264,
    "blockId": 1051,
    "blockOrderNumber": 3,
    "blockName": "Search Field",
    "blockActive": true,
    "blockWait": 3,
    "refreshLoop": false
  },
  {
    "id": 1266,
    "botJobId": 1002,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 6,
    "actions": "GOTO",
    "name": "GOTO",
    "description": "GOTO",
    "operation": "2# Advertise",
    "parentId": 1053,
    "blockId": 1051,
    "blockOrderNumber": 3,
    "blockName": "Search Field",
    "blockActive": true,
    "blockWait": 3,
    "refreshLoop": false
  },
  {
    "id": 1196,
    "botJobId": 1002,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 7,
    "actions": "ENDIF",
    "name": "ENDIF",
    "description": "ENDIF",
    "operation": "ENDIF",
    "parentId": 1194,
    "blockId": 1051,
    "blockOrderNumber": 3,
    "blockName": "Search Field",
    "blockActive": true,
    "blockWait": 3,
    "refreshLoop": false
  },
  {
    "id": 1267,
    "botJobId": 1002,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 8,
    "actions": "REFRESH_LOOP",
    "name": "Refresh Loop",
    "description": "Refresh Loop",
    "operation": "5:5",
    "parentId": 1265,
    "blockId": 1051,
    "blockOrderNumber": 3,
    "blockName": "Search Field",
    "blockActive": true,
    "blockWait": 3,
    "refreshLoop": false
  },
  {
    "id": 1097,
    "botJobId": 1002,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 9,
    "actions": "C",
    "name": "Home Flat Fox",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1051,
    "blockOrderNumber": 3,
    "blockName": "Search Field",
    "blockActive": true,
    "blockWait": 3,
    "refreshLoop": false
  }
];

export default instructionsMockData2;

// export const botJobMockData: BotJobData = { id: 1, name: "FlatFox", data: 0 };
export const botJobMockData: BotJobData = {
  id: 0,
  name: "",
  instructionId: 0
};
