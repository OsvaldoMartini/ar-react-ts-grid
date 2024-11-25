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
  { botJobId: 1, id: 1, instructionOrderNumber: 1, name: "Popolari", description: "Label Popolari", blockId: 1, blockOrderNumber: 1, blockName: "Default Block", actions: "O:popolari", exportFile: "D:/Projects/AllinWeb/ABRWeb/Export/banca export.xlsx" },
  { botJobId: 1, id: 2, instructionOrderNumber: 2, name: "Refresh Loop", description: "Refresh Loop", blockId: 1, blockOrderNumber: 1, blockName: "Default Block", actions: "REFRESH_LOOP", parentId: 1, operation: "Refresh:30:Loop:20:Parent:popolari" },
  { botJobId: 1, id: 34, instructionOrderNumber: 3, name: "PAUSE", description: "PAUSE", blockId: 1, blockOrderNumber: 1, blockName: "Default Block", actions: "PAUSE" },

  { botJobId: 1, id: 3, instructionOrderNumber: 3, name: "GOTO", description: "GOTO", blockId: 1, blockOrderNumber: 1, blockName: "Default Block", actions: "GOTO", parentId: 2, operation: "2# Block Test 2" },

  // Block 2                                                                                                                                                                                        
  { botJobId: 1, id: 4, instructionOrderNumber: 1, name: "GetValue", description: "Description 2", blockId: 2, blockOrderNumber: 2, blockName: "Block Test 2", actions: "GET", parentId: 4, operation: "firstname:$FIRSTNAME" },
  { botJobId: 1, id: 5, instructionOrderNumber: 2, name: "Check", description: "Description 3", blockId: 2, blockOrderNumber: 2, blockName: "Block Test 2", actions: "CK", parentId: 4, operation: "$firstname:=:Osvaldo" },
  { botJobId: 1, id: 6, instructionOrderNumber: 1, name: "IF", description: "IF", blockId: 3, blockOrderNumber: 3, blockName: "Block Test 3", actions: "IF", parentId: 6 },
  { botJobId: 1, id: 7, instructionOrderNumber: 2, name: "ELSE", description: "ELSE", blockId: 3, blockOrderNumber: 3, blockName: "Block Test 3", actions: "ELSE", parentId: 6, },
  { botJobId: 1, id: 8, instructionOrderNumber: 3, name: "ENDIF", description: "ENDIF", blockId: 3, blockOrderNumber: 3, blockName: "Block Test 3", actions: "ENDIF", parentId: 6 },

  // Block 3                                                                                                                                                                                        
  { botJobId: 11, id: 9, instructionOrderNumber: 1, name: "ExcelWrite", description: "Description 8", blockId: 36, blockOrderNumber: 4, blockName: "Block Test 3", actions: "E", parentId: 4, operation: "$payment:56855874" },
  { botJobId: 11, id: 10, instructionOrderNumber: 2, name: "SetValue", description: "Description 9", blockId: 36, blockOrderNumber: 4, blockName: "Block Test 3", actions: "SET", parentId: 4, operation: "firstName:Osvaldo" },
  { botJobId: 11, id: 11, instructionOrderNumber: 3, name: "GetValue", description: "Description 10", blockId: 36, blockOrderNumber: 4, blockName: "Block Test 3", actions: "GET", parentId: 4, operation: "firstname:$FIRSTNAME" },
  { botJobId: 11, id: 12, instructionOrderNumber: 4, name: "Search", description: "Search", blockId: 36, blockOrderNumber: 4, blockName: "Block Test 3", actions: "C", parentId: 4 },
  { botJobId: 11, id: 13, instructionOrderNumber: 5, name: "Check", description: "Description 12", blockId: 36, blockOrderNumber: 4, blockName: "Block Test 3", actions: "CK", parentId: 4, operation: "$firstname:=:Osvaldo" },

  // Block 4                                                                                                                                                                                        
  { botJobId: 11, id: 14, instructionOrderNumber: 1, name: "Close Browser", description: "Close Browser", blockId: 37, blockOrderNumber: 5, blockName: "Block Test 4", actions: "Q" },
  { botJobId: 11, id: 15, instructionOrderNumber: 2, name: "Screen Shot", description: "Screen Shot", blockId: 37, blockOrderNumber: 5, blockName: "Block Test 4", actions: "P" },
  { botJobId: 11, id: 16, instructionOrderNumber: 3, name: "Wait 15second(s)", description: "Waiting action", blockId: 37, blockOrderNumber: 5, blockName: "Block Test 4", actions: "H" },
  { botJobId: 11, id: 17, instructionOrderNumber: 4, name: "city-name", description: "city-name", blockId: 37, blockOrderNumber: 5, blockName: "Block Test 4", actions: "I:city-name", parentId: 4 },
  { botJobId: 11, id: 18, instructionOrderNumber: 5, name: "Instruction 17", description: "Description 17", blockId: 37, blockOrderNumber: 5, blockName: "Block Test 4", actions: "click", parentId: 4 },

  // Block 5                                                                                                                                                                                        
  { botJobId: 11, id: 19, instructionOrderNumber: 1, name: "IF", description: "IF", blockId: 38, blockOrderNumber: 6, blockName: "Block Test 5", actions: "IF", parentId: 20 },
  { botJobId: 11, id: 24, instructionOrderNumber: 2, name: "Instruction 23", description: "Description 23", blockId: 6, blockOrderNumber: 6, blockName: "Block Test 5", actions: "click", parentId: 4 },
  { botJobId: 11, id: 21, instructionOrderNumber: 3, name: "GOTO", description: "GOTO", blockId: 38, blockOrderNumber: 6, blockName: "Block Test 5", actions: "GOTO", parentId: 37, operation: "2# Block Test 1" },
  { botJobId: 11, id: 20, instructionOrderNumber: 4, name: "ENDIF", description: "ENDIF", blockId: 38, blockOrderNumber: 6, blockName: "Block Test 5", actions: "ENDIF", parentId: 19 },
  { botJobId: 11, id: 22, instructionOrderNumber: 5, name: "Instruction 21", description: "Description 21", blockId: 38, blockOrderNumber: 6, blockName: "Block Test 5", actions: "click", parentId: 4 },
  { botJobId: 11, id: 23, instructionOrderNumber: 6, name: "Instruction 22", description: "Description 22", blockId: 38, blockOrderNumber: 6, blockName: "Block Test 5", actions: "click", parentId: 4 },

  // Block 6                                                                                                                                                                                        
  { botJobId: 11, id: 25, instructionOrderNumber: 2, name: "Instruction 24", description: "Description 24", blockId: 39, blockOrderNumber: 7, blockName: "Block Test 6", actions: "click", parentId: 4 },
  { botJobId: 11, id: 26, instructionOrderNumber: 3, name: "Instruction 25", description: "Description 25", blockId: 39, blockOrderNumber: 7, blockName: "Block Test 6", actions: "click", parentId: 4 },
  { botJobId: 11, id: 27, instructionOrderNumber: 4, name: "Instruction 26", description: "Description 26", blockId: 39, blockOrderNumber: 7, blockName: "Block Test 6", actions: "click", parentId: 4 },
  { botJobId: 11, id: 28, instructionOrderNumber: 5, name: "Instruction 27", description: "Description 27", blockId: 39, blockOrderNumber: 7, blockName: "Block Test 6", actions: "click", parentId: 4 },

  // Block 7                                                                                                                                                                                      
  { botJobId: 11, id: 29, instructionOrderNumber: 1, name: "Instruction 28", description: "Description 28", blockId: 40, blockOrderNumber: 8, blockName: "Block Test 7", actions: "click", parentId: 4 },
  { botJobId: 11, id: 30, instructionOrderNumber: 2, name: "Instruction 29", description: "Description 29", blockId: 40, blockOrderNumber: 8, blockName: "Block Test 7", actions: "click", parentId: 4 },
  { botJobId: 11, id: 31, instructionOrderNumber: 3, name: "Instruction 30", description: "Description 30", blockId: 40, blockOrderNumber: 8, blockName: "Block Test 7", actions: "click", parentId: 4 },
  { botJobId: 11, id: 32, instructionOrderNumber: 4, name: "Instruction 31", description: "Description 31", blockId: 40, blockOrderNumber: 8, blockName: "Block Test 7", actions: "click", parentId: 4 },
  { botJobId: 11, id: 33, instructionOrderNumber: 5, name: "Instruction 32", description: "Description 32", blockId: 40, blockOrderNumber: 8, blockName: "Block Test 7", actions: "click", parentId: 4 }
];

export default instructionsMockData;