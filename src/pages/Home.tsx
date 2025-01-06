import GridItem from "../components/GridItem";
import instructionsMockData, { botJobMockData } from "../components/instructionsMockData3";
import ClothingType from "./ClothingType";

const Home = () => (
  <div>
    <ClothingType />
    {/* <GridItem data={instructionsMockData} botJobData={botJobMockData} /> */}
  </div>
);

export default Home;