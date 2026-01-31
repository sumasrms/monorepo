import { SidebarDemo } from "@/components/sidebar";
import StatisticCard1 from "@/components/statistic-card-1";
import { div } from "motion/react-client";

const Overview = () => {
  return (
    <div className="grid grid-rows-2">
      <StatisticCard1 />
    </div>
  );
};

export default Overview;
