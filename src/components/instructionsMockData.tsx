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


const instructionsMockData: BlockLoopInstructionLoadDTO[] = [
  { botJobId: 1, id: 101, instructionOrderNumber: 1, name: "Popolari", description: "Label Popolari", blockId: 1, blockOrderNumber: 1, blockName: "Default Block", actions: "O:popolari", exportFile: "D:/Projects/AllinWeb/ABRWeb/Export/banca export.xlsx", refreshLoop: true },
  { botJobId: 1, id: 102, instructionOrderNumber: 2, name: "Refresh", description: "Refresh", blockId: 1, blockOrderNumber: 1, blockName: "Default Block", actions: "REFRESH" },
  { botJobId: 1, id: 103, instructionOrderNumber: 2, name: "Refresh Loop", description: "Refresh Loop", blockId: 1, blockOrderNumber: 1, blockName: "Default Block", actions: "REFRESH_LOOP", parentId: 1, operation: "30:20" },
  { botJobId: 1, id: 104, instructionOrderNumber: 3, name: "PAUSE", description: "PAUSE", blockId: 1, blockOrderNumber: 1, blockName: "Default Block", actions: "PAUSE" },

  { botJobId: 1, id: 105, instructionOrderNumber: 3, name: "GOTO", description: "GOTO", blockId: 1, blockOrderNumber: 1, blockName: "Default Block", actions: "GOTO", parentId: 2, operation: "2# Block Test 2" },

  // Block 2                                                                                                                                                                                        
  { botJobId: 1, id: 106, instructionOrderNumber: 1, name: "GetValue", description: "Description 2", blockId: 2, blockOrderNumber: 2, blockName: "Block Test 2", actions: "GET", parentId: 4, operation: "firstname:$FIRSTNAME" },
  { botJobId: 1, id: 107, instructionOrderNumber: 2, name: "Check", description: "Description 3", blockId: 2, blockOrderNumber: 2, blockName: "Block Test 2", actions: "CK", parentId: 4, operation: "$firstname:=:Osvaldo" },
  { botJobId: 1, id: 108, instructionOrderNumber: 1, name: "IF", description: "IF", blockId: 3, blockOrderNumber: 3, blockName: "Block Test 3", actions: "IF", parentId: 6 },
  { botJobId: 1, id: 109, instructionOrderNumber: 2, name: "ELSE", description: "ELSE", blockId: 3, blockOrderNumber: 3, blockName: "Block Test 3", actions: "ELSE", parentId: 6, },
  { botJobId: 1, id: 110, instructionOrderNumber: 3, name: "ENDIF", description: "ENDIF", blockId: 3, blockOrderNumber: 3, blockName: "Block Test 3", actions: "ENDIF", parentId: 6 },

  // Block 3                                                                                                                                                                                        
  { botJobId: 11, id: 111, instructionOrderNumber: 1, name: "ExcelWrite", description: "Description 8", blockId: 36, blockOrderNumber: 4, blockName: "Block Test 3", actions: "E", parentId: 4, operation: "$payment:56855874" },
  { botJobId: 11, id: 112, instructionOrderNumber: 2, name: "SetValue", description: "Description 9", blockId: 36, blockOrderNumber: 4, blockName: "Block Test 3", actions: "SET", parentId: 4, operation: "firstName:Osvaldo" },
  { botJobId: 11, id: 113, instructionOrderNumber: 3, name: "GetValue", description: "Description 10", blockId: 36, blockOrderNumber: 4, blockName: "Block Test 3", actions: "GET", parentId: 4, operation: "firstname:$FIRSTNAME" },
  { botJobId: 11, id: 114, instructionOrderNumber: 4, name: "Search", description: "Search", blockId: 36, blockOrderNumber: 4, blockName: "Block Test 3", actions: "C", parentId: 4 },
  { botJobId: 11, id: 115, instructionOrderNumber: 5, name: "Check", description: "Description 12", blockId: 36, blockOrderNumber: 4, blockName: "Block Test 3", actions: "CK", parentId: 4, operation: "$firstname:!=:Osvaldo" },

  // Block 4                                                                                                                                                                                        
  { botJobId: 11, id: 116, instructionOrderNumber: 1, name: "Close Browser", description: "Close Browser", blockId: 37, blockOrderNumber: 5, blockName: "Block Test 4", actions: "Q" },
  { botJobId: 11, id: 117, instructionOrderNumber: 2, name: "Screen Shot", description: "Screen Shot", blockId: 37, blockOrderNumber: 5, blockName: "Block Test 4", actions: "P" },
  { botJobId: 11, id: 118, instructionOrderNumber: 3, name: "Wait 15second(s)", description: "Waiting action", blockId: 37, blockOrderNumber: 5, blockName: "Block Test 4", actions: "H" },
  { botJobId: 11, id: 119, instructionOrderNumber: 4, name: "city-name", description: "city-name", blockId: 37, blockOrderNumber: 5, blockName: "Block Test 4", actions: "I:city-name:hidden", parentId: 4 },
  { botJobId: 11, id: 120, instructionOrderNumber: 5, name: "Instruction 17", description: "Description 17", blockId: 37, blockOrderNumber: 5, blockName: "Block Test 4", actions: "click", parentId: 4 },

  // Block 5                                                                                                                                                                                        
  { botJobId: 11, id: 121, instructionOrderNumber: 1, name: "IF", description: "IF", blockId: 38, blockOrderNumber: 6, blockName: "Block Test 5", actions: "IF", parentId: 20 },
  { botJobId: 11, id: 122, instructionOrderNumber: 2, name: "Drag Error", description: "Drag Error", blockId: 6, blockOrderNumber: 6, blockName: "Block Test 5", actions: "click", parentId: 4 },
  { botJobId: 11, id: 123, instructionOrderNumber: 3, name: "GOTO", description: "GOTO", blockId: 38, blockOrderNumber: 6, blockName: "Block Test 5", actions: "GOTO", parentId: 37, operation: "2# Block Test 1" },
  { botJobId: 11, id: 124, instructionOrderNumber: 4, name: "ENDIF", description: "ENDIF", blockId: 38, blockOrderNumber: 6, blockName: "Block Test 5", actions: "ENDIF", parentId: 19 },
  { botJobId: 11, id: 125, instructionOrderNumber: 5, name: "Instruction 21", description: "Description 21", blockId: 38, blockOrderNumber: 6, blockName: "Block Test 5", actions: "click", parentId: 4 },
  { botJobId: 11, id: 126, instructionOrderNumber: 6, name: "Instruction 22", description: "Description 22", blockId: 38, blockOrderNumber: 6, blockName: "Block Test 5", actions: "click", parentId: 4 },

  // Block 6                                                                                                                                                                                        
  { botJobId: 11, id: 127, instructionOrderNumber: 2, name: "Instruction 24", description: "Description 24", blockId: 39, blockOrderNumber: 7, blockName: "Block Test 6", actions: "click", parentId: 4 },
  { botJobId: 11, id: 128, instructionOrderNumber: 3, name: "Instruction 25", description: "Description 25", blockId: 39, blockOrderNumber: 7, blockName: "Block Test 6", actions: "click", parentId: 4 },
  { botJobId: 11, id: 129, instructionOrderNumber: 4, name: "Instruction 26", description: "Description 26", blockId: 39, blockOrderNumber: 7, blockName: "Block Test 6", actions: "click", parentId: 4 },
  { botJobId: 11, id: 130, instructionOrderNumber: 5, name: "Instruction 27", description: "Description 27", blockId: 39, blockOrderNumber: 7, blockName: "Block Test 6", actions: "click", parentId: 4 },

  // Block 7                                                                                                                                                                                      
  { botJobId: 11, id: 131, instructionOrderNumber: 1, name: "Instruction 28", description: "Description 28", blockId: 40, blockOrderNumber: 8, blockName: "Block Test 7", actions: "click", parentId: 4 },
  { botJobId: 11, id: 132, instructionOrderNumber: 2, name: "Instruction 29", description: "Description 29", blockId: 40, blockOrderNumber: 8, blockName: "Block Test 7", actions: "click", parentId: 4 },
  { botJobId: 11, id: 133, instructionOrderNumber: 3, name: "Instruction 30", description: "Description 30", blockId: 40, blockOrderNumber: 8, blockName: "Block Test 7", actions: "click", parentId: 4 },
  { botJobId: 11, id: 134, instructionOrderNumber: 4, name: "Instruction 31", description: "Description 31", blockId: 40, blockOrderNumber: 8, blockName: "Block Test 7", actions: "click", parentId: 4 },
  { botJobId: 11, id: 135, instructionOrderNumber: 5, name: "Instruction 32", description: "Description 32", blockId: 40, blockOrderNumber: 8, blockName: "Block Test 7", actions: "click", parentId: 4 }
];

export default instructionsMockData;