import React, { useState } from "react";
import * as tmImage from "@teachablemachine/image";
import UrlInput from "../components/UrlInput";
import ModelViewer from "../components/ModelViewer";
import Navbar from "../components/Navbar";

function LoadFromUrl() {
  const [model, setModel] = useState(null);

  const loadModelUrl = async (data) => {
    const { modelURL, metadataURL } = data;
    if (modelURL && metadataURL) {
      const loadedModel = await tmImage.load(modelURL, metadataURL);
      setModel(loadedModel);
    }
  };

  return (
    <div className="container">
      {/* <div className="row">
        <div className="col-12">
          <Navbar />
        </div>
      </div> */}
      <div className="row">
        <div className="col-12">
          <div className="wrapper">
            {!model && <UrlInput handleSubmit={loadModelUrl} />}
            {model && <ModelViewer model={model} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadFromUrl;
