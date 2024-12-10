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
  // {
  //   "id": 9137,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 1,
  //   "actions": "I:username",
  //   "name": "username",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 828,
  //   "blockOrderNumber": 1,
  //   "blockName": "Login",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9138,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 2,
  //   "actions": "I:password",
  //   "name": "password",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 828,
  //   "blockOrderNumber": 1,
  //   "blockName": "Login",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9139,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 3,
  //   "actions": "C",
  //   "name": "login",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 828,
  //   "blockOrderNumber": 1,
  //   "blockName": "Login",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9140,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 4,
  //   "actions": "PAUSE",
  //   "name": "PAUSE",
  //   "description": "PAUSE Action",


  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 828,
  //   "blockOrderNumber": 1,
  //   "blockName": "Login",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 984,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 1,
  //   "actions": "C",
  //   "name": "conti e carta",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 824,
  //   "blockOrderNumber": 2,
  //   "blockName": "Conti e Carta",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 985,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 2,
  //   "actions": "C",
  //   "name": "Conti",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 824,
  //   "blockOrderNumber": 2,
  //   "blockName": "Conti e Carta",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9131,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 1,
  //   "actions": "C",
  //   "name": "open-divise",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 827,
  //   "blockOrderNumber": 3,
  //   "blockName": "Open Divise",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9181,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 2,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",


  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 827,
  //   "blockOrderNumber": 3,
  //   "blockName": "Open Divise",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9146,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 3,
  //   "actions": "C",
  //   "name": "AUD",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 827,
  //   "blockOrderNumber": 3,
  //   "blockName": "Open Divise",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9183,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 4,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",


  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 827,
  //   "blockOrderNumber": 3,
  //   "blockName": "Open Divise",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9117,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 5,
  //   "actions": "C",
  //   "name": "open-divise-AUD",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 827,
  //   "blockOrderNumber": 3,
  //   "blockName": "Open Divise",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9176,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 6,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",


  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 827,
  //   "blockOrderNumber": 3,
  //   "blockName": "Open Divise",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9106,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 7,
  //   "actions": "C",
  //   "name": "CHF",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 827,
  //   "blockOrderNumber": 3,
  //   "blockName": "Open Divise",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9184,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 8,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",


  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 827,
  //   "blockOrderNumber": 3,
  //   "blockName": "Open Divise",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9141,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 9,
  //   "actions": "C",
  //   "name": "OPEN-DIVISE-CHF",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 827,
  //   "blockOrderNumber": 3,
  //   "blockName": "Open Divise",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9182,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 10,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",


  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 827,
  //   "blockOrderNumber": 3,
  //   "blockName": "Open Divise",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9119,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 11,
  //   "actions": "C",
  //   "name": "ZAR",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 827,
  //   "blockOrderNumber": 3,
  //   "blockName": "Open Divise",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9120,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 1,
  //   "actions": "C",
  //   "name": "OPEN-DIVISE-ZAR",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 834,
  //   "blockOrderNumber": 4,
  //   "blockName": "Open Divise ZAR",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9130,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 2,
  //   "actions": "C",
  //   "name": "CHF",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 834,
  //   "blockOrderNumber": 4,
  //   "blockName": "Open Divise ZAR",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 988,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 1,
  //   "actions": "C",
  //   "name": "carta di credito",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 825,
  //   "blockOrderNumber": 5,
  //   "blockName": "Carta di Credito",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9178,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 2,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",


  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 825,
  //   "blockOrderNumber": 5,
  //   "blockName": "Carta di Credito",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9162,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 3,
  //   "actions": "C",
  //   "name": "autorizzo",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 825,
  //   "blockOrderNumber": 5,
  //   "blockName": "Carta di Credito",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9207,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 4,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",


  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 825,
  //   "blockOrderNumber": 5,
  //   "blockName": "Carta di Credito",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9206,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 5,
  //   "actions": "C",
  //   "name": "credito proseguire",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 825,
  //   "blockOrderNumber": 5,
  //   "blockName": "Carta di Credito",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9208,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 1,
  //   "actions": "C",
  //   "name": "pagina iniziale",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 838,
  //   "blockOrderNumber": 6,
  //   "blockName": "Initiale",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9150,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 1,
  //   "actions": "C",
  //   "name": "nuovo pagamento",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 829,
  //   "blockOrderNumber": 7,
  //   "blockName": "Nuovo Pagamento",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9179,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 2,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",


  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 829,
  //   "blockOrderNumber": 7,
  //   "blockName": "Nuovo Pagamento",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9151,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 3,
  //   "actions": "C",
  //   "name": "flag-svizerra",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 829,
  //   "blockOrderNumber": 7,
  //   "blockName": "Nuovo Pagamento",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9152,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 1,
  //   "actions": "I:iban",
  //   "name": "iban",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 831,
  //   "blockOrderNumber": 8,
  //   "blockName": "Iban",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9180,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 2,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",


  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 831,
  //   "blockOrderNumber": 8,
  //   "blockName": "Iban",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9153,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 3,
  //   "actions": "I:nome",
  //   "name": "nome",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 831,
  //   "blockOrderNumber": 8,
  //   "blockName": "Iban",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9154,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 4,
  //   "actions": "I:indirizzo",
  //   "name": "indirizzo",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 831,
  //   "blockOrderNumber": 8,
  //   "blockName": "Iban",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9157,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 5,
  //   "actions": "C",
  //   "name": "iban-avanti",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 831,
  //   "blockOrderNumber": 8,
  //   "blockName": "Iban",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 926,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 1,
  //   "actions": "I:importo",
  //   "name": "importo",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 830,
  //   "blockOrderNumber": 9,
  //   "blockName": "Insert Importo",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 928,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 2,
  //   "actions": "C",
  //   "name": "avanti",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 830,
  //   "blockOrderNumber": 9,
  //   "blockName": "Insert Importo",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9210,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 3,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",


  //   "operation": "",
  //   "parentId": 0,
  //   "blockId": 830,
  //   "blockOrderNumber": 9,
  //   "blockName": "Insert Importo",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9209,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 4,
  //   "actions": "C",
  //   "name": "inviare",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 830,
  //   "blockOrderNumber": 9,
  //   "blockName": "Insert Importo",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9160,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 1,
  //   "actions": "C",
  //   "name": "visualizzare detagli",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 832,
  //   "blockOrderNumber": 10,
  //   "blockName": "Visualizzare Detagli",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 932,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 1,
  //   "actions": "O:transaction",
  //   "name": "transaction",
  //   "description": "loop desc",


  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/banca-stato.xlsx",
  //   "parentId": 0,
  //   "blockId": 87,
  //   "blockOrderNumber": 11,
  //   "blockName": "ExcelWrite Transaction",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": true
  // },
  // {
  //   "id": 956,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 2,
  //   "actions": "IF",
  //   "name": "IF",
  //   "description": "IF",


  //   "operation": "IF",
  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/banca-stato.xlsx",
  //   "parentId": 56,
  //   "blockId": 87,
  //   "blockOrderNumber": 11,
  //   "blockName": "ExcelWrite Transaction",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9185,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 3,
  //   "actions": "C",
  //   "name": "visualizzare recente",
  //   "description": "loop desc",


  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/banca-stato.xlsx",
  //   "parentId": 0,
  //   "blockId": 87,
  //   "blockOrderNumber": 11,
  //   "blockName": "ExcelWrite Transaction",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9188,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 4,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",


  //   "operation": "",
  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/banca-stato.xlsx",
  //   "parentId": 0,
  //   "blockId": 87,
  //   "blockOrderNumber": 11,
  //   "blockName": "ExcelWrite Transaction",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9191,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 5,
  //   "actions": "C",
  //   "name": "in corso",
  //   "description": "loop desc",


  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/banca-stato.xlsx",
  //   "parentId": 0,
  //   "blockId": 87,
  //   "blockOrderNumber": 11,
  //   "blockName": "ExcelWrite Transaction",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9192,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 6,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",


  //   "operation": "",
  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/banca-stato.xlsx",
  //   "parentId": 0,
  //   "blockId": 87,
  //   "blockOrderNumber": 11,
  //   "blockName": "ExcelWrite Transaction",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9198,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 7,
  //   "actions": "C",
  //   "name": "data di esecuzione",
  //   "description": "loop desc",


  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/banca-stato.xlsx",
  //   "parentId": 0,
  //   "blockId": 87,
  //   "blockOrderNumber": 11,
  //   "blockName": "ExcelWrite Transaction",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9199,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 8,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",


  //   "operation": "",
  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/banca-stato.xlsx",
  //   "parentId": 0,
  //   "blockId": 87,
  //   "blockOrderNumber": 11,
  //   "blockName": "ExcelWrite Transaction",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9186,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 9,
  //   "actions": "C",
  //   "name": "first pgto",
  //   "description": "loop desc",


  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/banca-stato.xlsx",
  //   "parentId": 0,
  //   "blockId": 87,
  //   "blockOrderNumber": 11,
  //   "blockName": "ExcelWrite Transaction",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9189,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 10,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",


  //   "operation": "",
  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/banca-stato.xlsx",
  //   "parentId": 0,
  //   "blockId": 87,
  //   "blockOrderNumber": 11,
  //   "blockName": "ExcelWrite Transaction",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9187,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 11,
  //   "actions": "C",
  //   "name": "dettagli",
  //   "description": "loop desc",


  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/banca-stato.xlsx",
  //   "parentId": 0,
  //   "blockId": 87,
  //   "blockOrderNumber": 11,
  //   "blockName": "ExcelWrite Transaction",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9190,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 12,
  //   "actions": "H",
  //   "name": "Wait 2second(s)",
  //   "description": "Waiting action",


  //   "operation": "",
  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/banca-stato.xlsx",
  //   "parentId": 0,
  //   "blockId": 87,
  //   "blockOrderNumber": 11,
  //   "blockName": "ExcelWrite Transaction",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 957,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 13,
  //   "actions": "ELSE",
  //   "name": "ELSE",
  //   "description": "ELSE",


  //   "operation": "ELSE",
  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/banca-stato.xlsx",
  //   "parentId": 56,
  //   "blockId": 87,
  //   "blockOrderNumber": 11,
  //   "blockName": "ExcelWrite Transaction",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 958,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 14,
  //   "actions": "ENDIF",
  //   "name": "ENDIF",
  //   "description": "ENDIF",


  //   "operation": "ENDIF",
  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/banca-stato.xlsx",
  //   "parentId": 56,
  //   "blockId": 87,
  //   "blockOrderNumber": 11,
  //   "blockName": "ExcelWrite Transaction",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 955,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 15,
  //   "actions": "CK",
  //   "name": "Check",
  //   "description": "Check Value",


  //   "operation": "$transaction:!\u003d:Condivise (SHA)",
  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/banca-stato.xlsx",
  //   "parentId": 32,
  //   "blockId": 87,
  //   "blockOrderNumber": 11,
  //   "blockName": "ExcelWrite Transaction",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 941,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 16,
  //   "actions": "REFRESH_LOOP",
  //   "name": "Refresh Loop",
  //   "description": "Refresh Loop",


  //   "operation": "5:5",
  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/banca-stato.xlsx",
  //   "parentId": 32,
  //   "blockId": 87,
  //   "blockOrderNumber": 11,
  //   "blockName": "ExcelWrite Transaction",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 933,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 17,
  //   "actions": "E",
  //   "name": "ExcelWrite",
  //   "description": "ExcelWrite",


  //   "operation": "ExcelWrite:$TRANSACTION",
  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/banca-stato.xlsx",
  //   "parentId": 32,
  //   "blockId": 87,
  //   "blockOrderNumber": 11,
  //   "blockName": "ExcelWrite Transaction",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9205,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 18,
  //   "actions": "Q",
  //   "name": "Close Browser",
  //   "description": "Close Browser",


  //   "operation": "",
  //   "exportFile": "D:/Projects/AllinWeb/ABRWeb/Export/banca-stato.xlsx",
  //   "parentId": 0,
  //   "blockId": 87,
  //   "blockOrderNumber": 11,
  //   "blockName": "ExcelWrite Transaction",
  //   "blockActive": true,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 961,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 1,
  //   "actions": "C",
  //   "name": "mercati e divise",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 810,
  //   "blockOrderNumber": 12,
  //   "blockName": "Mercati e Divise",
  //   "blockActive": false,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 962,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 2,
  //   "actions": "C",
  //   "name": "informazioni finanziarie",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 810,
  //   "blockOrderNumber": 12,
  //   "blockName": "Mercati e Divise",
  //   "blockActive": false,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9168,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 3,
  //   "actions": "C",
  //   "name": "circa search",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 810,
  //   "blockOrderNumber": 12,
  //   "blockName": "Mercati e Divise",
  //   "blockActive": false,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9170,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 4,
  //   "actions": "C",
  //   "name": "circa search",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 810,
  //   "blockOrderNumber": 12,
  //   "blockName": "Mercati e Divise",
  //   "blockActive": false,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9172,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 5,
  //   "actions": "I:circa input",
  //   "name": "circa input",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 810,
  //   "blockOrderNumber": 12,
  //   "blockName": "Mercati e Divise",
  //   "blockActive": false,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9171,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 6,
  //   "actions": "C",
  //   "name": "circa button",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 810,
  //   "blockOrderNumber": 12,
  //   "blockName": "Mercati e Divise",
  //   "blockActive": false,
  //   "blockWait": 3,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9173,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 1,
  //   "actions": "C",
  //   "name": "search finanziarie",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 833,
  //   "blockOrderNumber": 13,
  //   "blockName": "Search Term",
  //   "blockActive": false,
  //   "blockWait": 0,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9174,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 2,
  //   "actions": "I:search term",
  //   "name": "search term",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 833,
  //   "blockOrderNumber": 13,
  //   "blockName": "Search Term",
  //   "blockActive": false,
  //   "blockWait": 0,

  //   "refreshLoop": false
  // },
  // {
  //   "id": 9175,
  //   "botJobId": 1111,
  //   "botJobName": "BancaStato Pagamento",
  //   "instructionOrderNumber": 3,
  //   "actions": "C",
  //   "name": "search finanziarie",
  //   "description": "loop desc",


  //   "parentId": 0,
  //   "blockId": 833,
  //   "blockOrderNumber": 13,
  //   "blockName": "Search Term",
  //   "blockActive": false,
  //   "blockWait": 0,

  //   "refreshLoop": false
  // }
];
export default instructionsMockData2;

// export const botJobMockData: BotJobData = { id: 1, name: "FlatFox", data: 0 };
export const botJobMockData: BotJobData = {
  id: 0,
  name: "",
  instructionId: 0
};
