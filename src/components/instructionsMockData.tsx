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


const instructionsMockData: BlockLoopInstructionLoadDTO[] = [
  // { botJobId: 1, id: 1, instructionOrderNumber: 1, name: "Instruction 4", description: "Description 4", blockId: 1, blockOrderNumber: 1, blockName: "Default Block", actions: "click", parentId: 4 },
  // { botJobId: 1, id: 2, instructionOrderNumber: 2, name: "SetValue", description: "Description 1", blockId: 1, blockOrderNumber: 2, blockName: "Default Block", actions: "SET", parentId: 4, operation: "firstName:MockData-martini-martini" },

  // // Block 2                                                                                                                                                                                        
  // { botJobId: 11, id: 3, instructionOrderNumber: 3, name: "GetValue", description: "Description 2", blockId: 34, blockOrderNumber: 2, blockName: "Block Test 1", actions: "GET", parentId: 4, operation: "firstname:$FIRSTNAME" },
  // { botJobId: 11, id: 4, instructionOrderNumber: 4, name: "Check", description: "Description 3", blockId: 34, blockOrderNumber: 2, blockName: "Block Test 1", actions: "CK", parentId: 4, operation: "$firstname:=:Osvaldo" },
  // { botJobId: 11, id: 5, instructionOrderNumber: 1, name: "Instruction 5", description: "Description 5", blockId: 34, blockOrderNumber: 2, blockName: "Block Test 1", actions: "click", parentId: 4 },
  // { botJobId: 11, id: 6, instructionOrderNumber: 2, name: "SetValue", description: "Description 6", blockId: 35, blockOrderNumber: 3, blockName: "Block Test 2", actions: "SET", parentId: 4, operation: "firstName:Osvaldo" },
  // { botJobId: 11, id: 7, instructionOrderNumber: 1, name: "GetValue", description: "Description 7", blockId: 35, blockOrderNumber: 3, blockName: "Block Test 2", actions: "GET", parentId: 4, operation: "firstname:$FIRSTNAME" },

  // // Block 3                                                                                                                                                                                        
  // { botJobId: 11, id: 8, instructionOrderNumber: 1, name: "ExcelWrite", description: "Description 8", blockId: 36, blockOrderNumber: 4, blockName: "Block Test 3", actions: "E", parentId: 4, operation: "$payment:56855874" },
  // { botJobId: 11, id: 9, instructionOrderNumber: 2, name: "SetValue", description: "Description 9", blockId: 36, blockOrderNumber: 4, blockName: "Block Test 3", actions: "SET", parentId: 4, operation: "firstName:Osvaldo" },
  // { botJobId: 11, id: 10, instructionOrderNumber: 3, name: "GetValue", description: "Description 10", blockId: 36, blockOrderNumber: 4, blockName: "Block Test 3", actions: "GET", parentId: 4, operation: "firstname:$FIRSTNAME" },
  // { botJobId: 11, id: 11, instructionOrderNumber: 4, name: "Instruction 11", description: "Description 11", blockId: 36, blockOrderNumber: 4, blockName: "Block Test 3", actions: "click", parentId: 4 },
  // { botJobId: 11, id: 12, instructionOrderNumber: 5, name: "Check", description: "Description 12", blockId: 36, blockOrderNumber: 4, blockName: "Block Test 3", actions: "CK", parentId: 4, operation: "$firstname:=:Osvaldo" },

  // // Block 4                                                                                                                                                                                        
  // { botJobId: 11, id: 13, instructionOrderNumber: 1, name: "Close Browser", description: "Close Browser", blockId: 37, blockOrderNumber: 5, blockName: "Block Test 4", actions: "Q" },
  // { botJobId: 11, id: 14, instructionOrderNumber: 2, name: "Screen Shot", description: "Screen Shot", blockId: 37, blockOrderNumber: 5, blockName: "Block Test 4", actions: "P" },
  // { botJobId: 11, id: 15, instructionOrderNumber: 3, name: "Wait 15second(s)", description: "Waiting action", blockId: 37, blockOrderNumber: 5, blockName: "Block Test 4", actions: "H" },
  // { botJobId: 11, id: 16, instructionOrderNumber: 4, name: "Instruction 16", description: "Description 16", blockId: 37, blockOrderNumber: 5, blockName: "Block Test 4", actions: "click", parentId: 4 },
  // { botJobId: 11, id: 17, instructionOrderNumber: 5, name: "Instruction 17", description: "Description 17", blockId: 37, blockOrderNumber: 5, blockName: "Block Test 4", actions: "click", parentId: 4 },

  // // Block 5                                                                                                                                                                                        
  // { botJobId: 11, id: 18, instructionOrderNumber: 1, name: "Instruction 18", description: "Description 18", blockId: 38, blockOrderNumber: 6, blockName: "Block Test 5", actions: "click", parentId: 4 },
  // { botJobId: 11, id: 19, instructionOrderNumber: 2, name: "Instruction 19", description: "Description 19", blockId: 38, blockOrderNumber: 6, blockName: "Block Test 5", actions: "click", parentId: 4 },
  // { botJobId: 11, id: 20, instructionOrderNumber: 3, name: "Instruction 20", description: "Description 20", blockId: 38, blockOrderNumber: 6, blockName: "Block Test 5", actions: "click", parentId: 4 },
  // { botJobId: 11, id: 21, instructionOrderNumber: 4, name: "Instruction 21", description: "Description 21", blockId: 38, blockOrderNumber: 6, blockName: "Block Test 5", actions: "click", parentId: 4 },
  // { botJobId: 11, id: 22, instructionOrderNumber: 5, name: "Instruction 22", description: "Description 22", blockId: 38, blockOrderNumber: 6, blockName: "Block Test 5", actions: "click", parentId: 4 },

  // // Block 6                                                                                                                                                                                        
  // { botJobId: 11, id: 23, instructionOrderNumber: 1, name: "Instruction 23", description: "Description 23", blockId: 39, blockOrderNumber: 7, blockName: "Block Test 6", actions: "click", parentId: 4 },
  // { botJobId: 11, id: 24, instructionOrderNumber: 2, name: "Instruction 24", description: "Description 24", blockId: 39, blockOrderNumber: 7, blockName: "Block Test 6", actions: "click", parentId: 4 },
  // { botJobId: 11, id: 25, instructionOrderNumber: 3, name: "Instruction 25", description: "Description 25", blockId: 39, blockOrderNumber: 7, blockName: "Block Test 6", actions: "click", parentId: 4 },
  // { botJobId: 11, id: 26, instructionOrderNumber: 4, name: "Instruction 26", description: "Description 26", blockId: 39, blockOrderNumber: 7, blockName: "Block Test 6", actions: "click", parentId: 4 },
  // { botJobId: 11, id: 27, instructionOrderNumber: 5, name: "Instruction 27", description: "Description 27", blockId: 39, blockOrderNumber: 7, blockName: "Block Test 6", actions: "click", parentId: 4 },

  // // Block 7                                                                                                                                                                                      
  // { botJobId: 11, id: 28, instructionOrderNumber: 1, name: "Instruction 28", description: "Description 28", blockId: 40, blockOrderNumber: 8, blockName: "Block Test 7", actions: "click", parentId: 4 },
  // { botJobId: 11, id: 29, instructionOrderNumber: 2, name: "Instruction 29", description: "Description 29", blockId: 40, blockOrderNumber: 8, blockName: "Block Test 7", actions: "click", parentId: 4 },
  // { botJobId: 11, id: 30, instructionOrderNumber: 3, name: "Instruction 30", description: "Description 30", blockId: 40, blockOrderNumber: 8, blockName: "Block Test 7", actions: "click", parentId: 4 },
  // { botJobId: 11, id: 31, instructionOrderNumber: 4, name: "Instruction 31", description: "Description 31", blockId: 40, blockOrderNumber: 8, blockName: "Block Test 7", actions: "click", parentId: 4 },
  // { botJobId: 11, id: 32, instructionOrderNumber: 5, name: "Instruction 32", description: "Description 32", blockId: 40, blockOrderNumber: 8, blockName: "Block Test 7", actions: "click", parentId: 4 }
];

export default instructionsMockData;