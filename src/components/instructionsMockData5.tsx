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

const instructionsMockData2: BlockLoopInstructionLoadDTO[] = [
  {
    "id": 1080,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 1,
    "actions": "I:city-name",
    "name": "city-name",
    "description": "loop desc",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 0,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3,
    "loopOnly": true
  },
  {
    "id": 1081,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 2,
    "actions": "C",
    "name": "advertise",
    "description": "loop desc",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 0,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1082,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 3,
    "actions": "C",
    "name": "FlatFoxHome",
    "description": "loop desc",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 0,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1083,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 4,
    "actions": "H",
    "name": "Wait 2second(s)",
    "description": "Waiting action",
    "operation": "",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 0,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1084,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 5,
    "actions": "GET",
    "name": "GetValue",
    "description": "GetValue",
    "operation": "city-name:$CITY-NAME",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 1080,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1085,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 6,
    "actions": "SET",
    "name": "SetValue",
    "description": "SetValue",
    "operation": "city-name:Lugano",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 1080,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1086,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 7,
    "actions": "C",
    "name": "business",
    "description": "loop desc",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 0,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1087,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 8,
    "actions": "IF",
    "name": "IF",
    "description": "IF",
    "operation": "IF",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 1087,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1088,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 9,
    "actions": "SET",
    "name": "SetValue",
    "description": "SetValue",
    "operation": "city-name:Lugano",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 1080,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1089,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 10,
    "actions": "GET",
    "name": "GetValue",
    "description": "GetValue",
    "operation": "city-name:$CITY-NAME",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 1080,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1090,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 11,
    "actions": "E",
    "name": "ExcelWrite",
    "description": "ExcelWrite",
    "operation": "ExcelWrite:$CITY-NAME",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 1080,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1091,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 12,
    "actions": "ELSEIF",
    "name": "ELSEIF",
    "description": "ELSEIF",
    "operation": "ELSEIF",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 1087,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1092,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 13,
    "actions": "C",
    "name": "search button",
    "description": "loop desc",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 0,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1093,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 14,
    "actions": "ELSEIF",
    "name": "ELSEIF",
    "description": "ELSEIF",
    "operation": "ELSEIF",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 1087,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1094,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 15,
    "actions": "GET",
    "name": "GetValue",
    "description": "GetValue",
    "operation": "city-name:$CITY-NAME",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 1080,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1095,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 16,
    "actions": "E",
    "name": "ExcelWrite",
    "description": "ExcelWrite",
    "operation": "ExcelWrite:$CITY-NAME",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 1080,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1096,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 17,
    "actions": "CK",
    "name": "Check",
    "description": "Check Value",
    "operation": "$city-name2:\u003d:Zug",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 1080,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1097,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 18,
    "actions": "ELSEIF",
    "name": "ELSEIF",
    "description": "ELSEIF",
    "operation": "ELSEIF",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 1087,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1098,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 19,
    "actions": "CK",
    "name": "Check",
    "description": "Check Value",
    "operation": "$city-name:\u003d:Lugano",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 1080,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1099,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 20,
    "actions": "ELSEIF",
    "name": "ELSEIF",
    "description": "ELSEIF",
    "operation": "ELSEIF",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 1087,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1100,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 21,
    "actions": "ELSE",
    "name": "ELSE",
    "description": "ELSE",
    "operation": "ELSE",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 1087,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1101,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 22,
    "actions": "LOOP",
    "name": "LOOP",
    "description": "LOOP",
    "operation": "5",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 1080,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1102,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 23,
    "actions": "ENDIF",
    "name": "ENDIF",
    "description": "ENDIF",
    "operation": "ENDIF",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 1087,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1103,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 24,
    "actions": "H",
    "name": "Wait 2second(s)",
    "description": "Waiting action",
    "operation": "",
    "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/test_file.xlsx",
    "parentId": 0,
    "blockId": 1005,
    "blockOrderNumber": 1,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1104,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 1,
    "actions": "P",
    "name": "Screenshot Browser",
    "description": "Screenshot Browser",
    "operation": "",
    "parentId": 0,
    "blockId": 1006,
    "blockOrderNumber": 2,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1105,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 2,
    "actions": "GOTO",
    "name": "GOTO",
    "description": "GOTO",
    "operation": "5",
    "parentId": 1007,
    "blockId": 1006,
    "blockOrderNumber": 2,
    "blockName": "Default Block",
    "blockActive": true,
    "instructionActive": true,
    "blockWait": 3
  },
  {
    "id": 1106,
    "botJobId": 1002,
    "botJobName": "FlatFox Cloned",
    "instructionOrderNumber": 1,
    "actions": "C",
    "name": "debt extra",
    "description": "loop desc",
    "parentId": 0,
    "blockId": 1007,
    "blockOrderNumber": 3,
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
