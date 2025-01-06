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
    "id": 1002,
    "botJobId": 1001,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 1,
    "actions": "I:city-name",
    "name": "city-name",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1001,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3,
    "loopOnly": true
  },
  {
    "id": 1007,
    "botJobId": 1001,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 2,
    "actions": "IF",
    "name": "IF",
    "description": "IF",
    "operation": "IF",
    "parentId": 1007,
    "blockId": 1001,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1003,
    "botJobId": 1001,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 3,
    "actions": "SET",
    "name": "SetValue",
    "description": "SetValue",
    "operation": "city-name:Lugano",
    "parentId": 1002,
    "blockId": 1001,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1012,
    "botJobId": 1001,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 4,
    "actions": "GET",
    "name": "GetValue",
    "description": "GetValue",
    "operation": "city-name:$CITY-NAME",
    "parentId": 1002,
    "blockId": 1001,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1004,
    "botJobId": 1001,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 5,
    "actions": "CK",
    "name": "Check",
    "description": "Check Value",
    "operation": "$city-name:\u003d:Lugano",
    "parentId": 1002,
    "blockId": 1001,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1008,
    "botJobId": 1001,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 6,
    "actions": "ELSE",
    "name": "ELSE",
    "description": "ELSE",
    "operation": "ELSE",
    "parentId": 1007,
    "blockId": 1001,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1011,
    "botJobId": 1001,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 7,
    "actions": "LOOP",
    "name": "LOOP",
    "description": "LOOP",
    "operation": "5",
    "parentId": 1002,
    "blockId": 1001,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1010,
    "botJobId": 1001,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 8,
    "actions": "H",
    "name": "Wait 2second(s)",
    "description": "Waiting action",
    "operation": "",
    "parentId": 0,
    "blockId": 1001,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1009,
    "botJobId": 1001,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 9,
    "actions": "ENDIF",
    "name": "ENDIF",
    "description": "ENDIF",
    "operation": "ENDIF",
    "parentId": 1007,
    "blockId": 1001,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1001,
    "botJobId": 1001,
    "botJobName": "FlatFox",
    "instructionOrderNumber": 10,
    "actions": "P",
    "name": "Screenshot Browser",
    "description": "Screenshot Browser",
    "operation": "",
    "parentId": 0,
    "blockId": 1001,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
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
