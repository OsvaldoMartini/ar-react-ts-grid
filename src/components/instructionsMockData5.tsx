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
    "id": 1352,
    "botJobId": 1034,
    "botJobName": "sdfsdf",
    "instructionOrderNumber": 1,
    "actions": "REFRESH",
    "name": "Refresh",
    "description": "Refresh",
    "operation": "",
    "parentId": 0,
    "blockId": 1060,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1353,
    "botJobId": 1034,
    "botJobName": "sdfsdf",
    "instructionOrderNumber": 2,
    "actions": "PAUSE",
    "name": "PAUSE",
    "description": "PAUSE Action",
    "operation": "",
    "parentId": 0,
    "blockId": 1060,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1355,
    "botJobId": 1034,
    "botJobName": "sdfsdf",
    "instructionOrderNumber": 2,
    "actions": "I:city-name",
    "name": "city-name",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1060,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1354,
    "botJobId": 1034,
    "botJobName": "sdfsdf",
    "instructionOrderNumber": 3,
    "actions": "C",
    "name": "CIRCA BTN",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1060,
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
