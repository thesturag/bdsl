import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoadFromUrl from "./pages/LoadFromUrl"; // Create this component
import LoadFromFile from "./pages/LoadFromFile"; // Create this component
import BanglaSign from "./pages/BanglaSign";
import TrainAndPredict from "./pages/TrainAndPredict";
import SpeechToSign from "./pages/SpeechToSign";
import { NavbarComponent } from "./components/Navbar";
import "./index.css";
import SpeechToSignTrainAndExport from "./pages/SpeechToSignTrainAndExport";

function App() {
  return (
    <Router>
        <NavbarComponent/>
      <Routes>
        <Route path="/" element={<BanglaSign />} />
        <Route path="/load-from-url" element={<LoadFromUrl />} />
        <Route path="/load-from-file" element={<LoadFromFile />} />
        <Route path="/train-and-predict" element={<TrainAndPredict />} />
        <Route path="/speech-to-sign" element={<SpeechToSign />} />
        <Route path="/speech-to-sign-train-and-export" element={<SpeechToSignTrainAndExport />} />
      </Routes>
    </Router>
  );
}

export default App;
