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

const instructionsMockData2: BlockLoopInstructionLoadDTO[] = [
  {
    "homeBankingId": 1002,
    "id": 1109,
    "botJobId": 1005,
    "botJobName": "LocalTest Cloned2",
    "instructionOrderNumber": 1,
    "actions": "I:input",
    "name": "input",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1010,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "homeBankingId": 1002,
    "id": 1110,
    "botJobId": 1005,
    "botJobName": "LocalTest Cloned2",
    "instructionOrderNumber": 1,
    "actions": "I:input horses",
    "name": "input horses",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1011,
    "blockOrderNumber": 2,
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
