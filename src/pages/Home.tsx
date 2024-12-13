import GridItem from "../components/GridItem";
import instructionsMockData, { botJobMockData } from "../components/instructionsMockData3";

const Home = () => (
  <div>
    <GridItem data={instructionsMockData} botJobData={botJobMockData} />
  </div>
);

export default Home;