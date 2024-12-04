// Sample data (mocketData)
export interface BlockLoopInstructionLoadDTO {
  botJobId: number;
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

export interface Block {
  instructions: Array<{
    blockOrderNumber: number;
    [key: string]: any; // Include other properties if needed
  }>;
  [key: string]: any; // Add any other properties the block might have
}


export interface BotJobData {
  id: number;
  name: string;
  data: number;
}

const instructionsMockData: BlockLoopInstructionLoadDTO[] = [
  // { botJobId: 1, id: 101, instructionOrderNumber: 1, name: "Popolari", description: "Label Popolari", blockId: 1, blockOrderNumber: 1, blockName: "Default Block", actions: "O:popolari", exportFile: "D:/Projects/AllinWeb/ABRWeb/Export/banca export.xlsx", refreshLoop: true },
];

export default instructionsMockData;

// export const botJobMockData: BotJobData = { id: 1, name: "FlatFox", data: 0 };
export const botJobMockData: BotJobData = {
  id: 0,
  name: "",
  data: 0
};
