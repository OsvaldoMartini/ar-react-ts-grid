interface BlockSplitDTO {
  type: string;
  details: DetailsDTO;
}

interface DetailsDTO {
  // Add properties based on the structure of DetailsDTO in your Java code.
  // For example:
  property1: string;
  property2: number;
}


const responseTestDTO: BlockSplitDTO = {
  type: "RESPONSE_BACK",
  details: {
    property1: "exampleValue",
    property2: 42,
  },
};

export default responseTestDTO;
