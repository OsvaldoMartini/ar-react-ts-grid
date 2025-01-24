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

const instructionsMockData: BlockLoopInstructionLoadDTO[] = [
  // { botJobId: 1000, botJobName: "BotJobName", id: 101, instructionOrderNumber: 5991, name: "Popolari", description: "Label Popolari", blockId: 991, blockOrderNumber: 1, blockName: "Default Block", blockActive: false, blockWait: 3, actions: "O:popolari", exportFile: "D:/Projects/AllinWeb/ABRWeb/Export/banca export.xlsx", refreshLoop: true },
  // { botJobId: 1000, botJobName: "BotJobName", id: 102, instructionOrderNumber: 5992, name: "Refresh", description: "Refresh", blockId: 991, blockOrderNumber: 1, blockName: "Default Block", blockActive: true, blockWait: 3, actions: "REFRESH" },
  // { botJobId: 1000, botJobName: "BotJobName", id: 103, instructionOrderNumber: 5992, name: "Refresh Loop", description: "Refresh Loop", blockId: 991, blockOrderNumber: 1, blockName: "Default Block", blockActive: true, blockWait: 3, actions: "REFRESH_LOOP", parentId: 1, operation: "30:20" },
  // { botJobId: 1000, botJobName: "BotJobName", id: 104, instructionOrderNumber: 5993, name: "PAUSE", description: "PAUSE", blockId: 991, blockOrderNumber: 1, blockName: "Default Block", blockActive: true, blockWait: 3, actions: "PAUSE" },

  // { botJobId: 1000, botJobName: "BotJobName", id: 105, instructionOrderNumber: 5993, name: "GOTO", description: "GOTO", blockId: 991, blockOrderNumber: 1, blockName: "Default Block", blockActive: true, blockWait: 3, actions: "GOTO", parentId: 2, operation: "2# Block Test 2" },

  // // Block 2                                                                                                                                                                                        
  // { botJobId: 1000, botJobName: "BotJobName", id: 106, instructionOrderNumber: 5991, name: "GetValue", description: "Description 2", blockId: 2222, blockOrderNumber: 2, blockName: "Block Test 2", blockActive: true, blockWait: 3, actions: "GET", parentId: 4, operation: "firstname:$FIRSTNAME" },
  // { botJobId: 1000, botJobName: "BotJobName", id: 107, instructionOrderNumber: 5992, name: "Check", description: "Description 3", blockId: 2222, blockOrderNumber: 2, blockName: "Block Test 2", blockActive: true, blockWait: 3, actions: "CK", parentId: 4, operation: "$firstname:=:Osvaldo" },
  // { botJobId: 1000, botJobName: "BotJobName", id: 108, instructionOrderNumber: 5991, name: "IF", description: "IF", blockId: 3333, blockOrderNumber: 3, blockName: "Block Test 3", blockActive: true, blockWait: 3, actions: "IF", parentId: 6 },
  // { botJobId: 1000, botJobName: "BotJobName", id: 109, instructionOrderNumber: 5992, name: "ELSE", description: "ELSE", blockId: 3333, blockOrderNumber: 3, blockName: "Block Test 3", blockActive: true, blockWait: 3, actions: "ELSE", parentId: 6, },
  // { botJobId: 1000, botJobName: "BotJobName", id: 110, instructionOrderNumber: 5993, name: "ENDIF", description: "ENDIF", blockId: 3333, blockOrderNumber: 3, blockName: "Block Test 3", blockActive: true, blockWait: 3, actions: "ENDIF", parentId: 6 },

  // // Block 3                                                                                                                                                                                        
  // { botJobId: 2000, botJobName: "BotJobName", id: 111, instructionOrderNumber: 5991, name: "ExcelWrite", description: "Description 8", blockId: 36, blockOrderNumber: 4, blockName: "Block Test 3", blockActive: true, blockWait: 3, actions: "E", parentId: 4, operation: "$payment:56855874" },
  // { botJobId: 2000, botJobName: "BotJobName", id: 112, instructionOrderNumber: 5992, name: "SetValue", description: "Description 9", blockId: 36, blockOrderNumber: 4, blockName: "Block Test 3", blockActive: true, blockWait: 3, actions: "SET", parentId: 4, operation: "firstName:Osvaldo" },
  // { botJobId: 2000, botJobName: "BotJobName", id: 113, instructionOrderNumber: 5993, name: "GetValue", description: "Description 10", blockId: 36, blockOrderNumber: 4, blockName: "Block Test 3", blockActive: true, blockWait: 3, actions: "GET", parentId: 4, operation: "firstname:$FIRSTNAME" },
  // { botJobId: 2000, botJobName: "BotJobName", id: 114, instructionOrderNumber: 5994, name: "Search", description: "Search", blockId: 36, blockOrderNumber: 4, blockName: "Block Test 3", blockActive: true, blockWait: 3, actions: "C", parentId: 4 },
  // { botJobId: 2000, botJobName: "BotJobName", id: 115, instructionOrderNumber: 5995, name: "Check", description: "Description 12", blockId: 36, blockOrderNumber: 4, blockName: "Block Test 3", blockActive: true, blockWait: 3, actions: "CK", parentId: 4, operation: "$firstname:!=:Osvaldo" },

  // // Block 4                                                                                                                                                                                        
  // { botJobId: 2000, botJobName: "BotJobName", id: 116, instructionOrderNumber: 5991, name: "Close Browser", description: "Close Browser", blockId: 37, blockOrderNumber: 5, blockName: "Block Test 4", blockActive: true, blockWait: 3, actions: "Q" },
  // { botJobId: 2000, botJobName: "BotJobName", id: 117, instructionOrderNumber: 5992, name: "Screen Shot", description: "Screen Shot", blockId: 37, blockOrderNumber: 5, blockName: "Block Test 4", blockActive: true, blockWait: 3, actions: "P" },
  // { botJobId: 2000, botJobName: "BotJobName", id: 118, instructionOrderNumber: 5993, name: "Wait 15second(s)", description: "Waiting action", blockId: 37, blockOrderNumber: 5, blockName: "Block Test 4", blockActive: true, blockWait: 3, actions: "H" },
  // { botJobId: 2000, botJobName: "BotJobName", id: 119, instructionOrderNumber: 5994, name: "city-name", description: "city-name", blockId: 37, blockOrderNumber: 5, blockName: "Block Test 4", blockActive: true, blockWait: 3, actions: "I:city-name:hidden", parentId: 4 },
  // { botJobId: 2000, botJobName: "BotJobName", id: 120, instructionOrderNumber: 5995, name: "Instruction 17", description: "Description 17", blockId: 37, blockOrderNumber: 5, blockName: "Block Test 4", blockActive: true, blockWait: 3, actions: "click", parentId: 4 },

  // // Block 5                                                                                                                                                                                        
  // { botJobId: 2000, botJobName: "BotJobName", id: 121, instructionOrderNumber: 5991, name: "IF", description: "IF", blockId: 38, blockOrderNumber: 6, blockName: "Block Test 5", blockActive: true, blockWait: 3, actions: "IF", parentId: 20 },
  // { botJobId: 2000, botJobName: "BotJobName", id: 122, instructionOrderNumber: 5992, name: "Drag Error", description: "Drag Error", blockId: 38, blockOrderNumber: 6, blockName: "Block Test 5", blockActive: true, blockWait: 3, actions: "click", parentId: 4 },
  // { botJobId: 2000, botJobName: "BotJobName", id: 123, instructionOrderNumber: 5993, name: "GOTO", description: "GOTO", blockId: 38, blockOrderNumber: 6, blockName: "Block Test 5", blockActive: true, blockWait: 3, actions: "GOTO", parentId: 37, operation: "2# Block Test 1" },
  // { botJobId: 2000, botJobName: "BotJobName", id: 124, instructionOrderNumber: 5994, name: "ENDIF", description: "ENDIF", blockId: 38, blockOrderNumber: 6, blockName: "Block Test 5", blockActive: true, blockWait: 3, actions: "ENDIF", parentId: 19 },
  // { botJobId: 2000, botJobName: "BotJobName", id: 125, instructionOrderNumber: 5995, name: "Instruction 21", description: "Description 21", blockId: 38, blockOrderNumber: 6, blockName: "Block Test 5", blockActive: true, blockWait: 3, actions: "click", parentId: 4 },
  // { botJobId: 2000, botJobName: "BotJobName", id: 126, instructionOrderNumber: 5996, name: "Instruction 22", description: "Description 22", blockId: 38, blockOrderNumber: 6, blockName: "Block Test 5", blockActive: true, blockWait: 3, actions: "click", parentId: 4 },

  // // Block 6                                                                                                                                                                                        
  // { botJobId: 2000, botJobName: "BotJobName", id: 127, instructionOrderNumber: 5992, name: "Instruction 24", description: "Description 24", blockId: 39, blockOrderNumber: 7, blockName: "Block Test 6", blockActive: true, blockWait: 3, actions: "click", parentId: 4 },
  // { botJobId: 2000, botJobName: "BotJobName", id: 128, instructionOrderNumber: 5993, name: "Instruction 25", description: "Description 25", blockId: 39, blockOrderNumber: 7, blockName: "Block Test 6", blockActive: true, blockWait: 3, actions: "click", parentId: 4 },
  // { botJobId: 2000, botJobName: "BotJobName", id: 129, instructionOrderNumber: 5994, name: "Instruction 26", description: "Description 26", blockId: 39, blockOrderNumber: 7, blockName: "Block Test 6", blockActive: true, blockWait: 3, actions: "click", parentId: 4 },
  // { botJobId: 2000, botJobName: "BotJobName", id: 130, instructionOrderNumber: 5995, name: "Instruction 27", description: "Description 27", blockId: 39, blockOrderNumber: 7, blockName: "Block Test 6", blockActive: true, blockWait: 3, actions: "click", parentId: 4 },

  // // Block 7                                                                                                                                                                                      
  // { botJobId: 2000, botJobName: "BotJobName", id: 131, instructionOrderNumber: 5991, name: "Instruction 28", description: "Description 28", blockId: 40, blockOrderNumber: 8, blockName: "Block Test 7", blockActive: true, blockWait: 3, actions: "click", parentId: 4 },
  // { botJobId: 2000, botJobName: "BotJobName", id: 132, instructionOrderNumber: 5992, name: "Instruction 29", description: "Description 29", blockId: 40, blockOrderNumber: 8, blockName: "Block Test 7", blockActive: true, blockWait: 3, actions: "click", parentId: 4 },
  // { botJobId: 2000, botJobName: "BotJobName", id: 133, instructionOrderNumber: 5993, name: "Instruction 30", description: "Description 30", blockId: 40, blockOrderNumber: 8, blockName: "Block Test 7", blockActive: true, blockWait: 3, actions: "click", parentId: 4 },
  // { botJobId: 2000, botJobName: "BotJobName", id: 134, instructionOrderNumber: 5994, name: "Instruction 31", description: "Description 31", blockId: 40, blockOrderNumber: 8, blockName: "Block Test 7", blockActive: true, blockWait: 3, actions: "click", parentId: 4 },
  // { botJobId: 2000, botJobName: "BotJobName", id: 135, instructionOrderNumber: 5995, name: "Instruction 32", description: "Description 32", blockId: 40, blockOrderNumber: 8, blockName: "Block Test 7", blockActive: true, blockWait: 3, actions: "click", parentId: 4 }
];

export default instructionsMockData;

// export const botJobMockData: BotJobData = { id: 1, name: "FlatFox", data: 0 };
export const botJobMockData: BotJobData = {
  id: 0,
  name: "",
  instructionId: 0
};
