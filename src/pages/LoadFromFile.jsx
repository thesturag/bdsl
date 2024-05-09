import React, { useState } from "react";
import * as tmImage from "@teachablemachine/image";
import FileUpload from "../components/FileUpload";
import ModelViewer from "../components/ModelViewer";

function TeachableUrl() {
  const [model, setModel] = useState(null);

  const loadModel = async (modelFile, weightsFile, metadataFile) => {
    if (modelFile && weightsFile && metadataFile) {
      const loadedModel = await tmImage.loadFromFiles(
        modelFile,
        weightsFile,
        metadataFile
      );
      setModel(loadedModel);
    }
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <div className="wrapper">
            {!model && <FileUpload loadModel={loadModel} />}
            {model && <ModelViewer model={model} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeachableUrl;
