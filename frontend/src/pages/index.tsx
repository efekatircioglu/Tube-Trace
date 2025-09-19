import TflApiTest from '../components/TflApiTest';
import TrainLineData from '../components/TrainLineData';
import TransportDisruptions from '../components/TransportDisruptions';

export default function Home() {
  return (
    <main>
      <TflApiTest />
      <div className="mt-8">
        <TrainLineData />
      </div>
      <div className="mt-8">
        <TransportDisruptions />
      </div>
    </main>
  );
}
