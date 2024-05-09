import React, { useState } from "react";
import "./FileUpload.css";
import { Button, Icon, Input, Label } from 'keep-react'

function FileUpload({ loadModel }) {

  const [modelFile, setModelFile] = useState(null);
  const [weightsFile, setWeightsFile] = useState(null);
  const [metadataFile, setMetadataFile] = useState(null);

  const handleModelUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setModelFile(file);
    }
  };

  const handleWeightsUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setWeightsFile(file);
    }
  };

  const handleMetadataUpload = (event) => {
    const file = event.target.files[0];
    const fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = e => {
      setMetadataFile(JSON.parse(e.target.result));
    };
  };

  const loadModelHandler = () => {
    loadModel(modelFile, weightsFile, metadataFile); // Call the parent's loadModel function
  };

  return (
    <form className="max-w-md space-y-2 rounded-lg border p-8 shadow-md mt-4">
      <h5 className="card-title">Upload Model Files</h5>
      <fieldset className="space-y-1">
        <Label htmlFor="name">Model File (.json):</Label>
        <div className="relative">
          <Input placeholder="model.json" type="file" accept=".json" name="model" className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" onChange={handleModelUpload}/>
        </div>
      </fieldset>
      <fieldset className="space-y-1">
        <Label htmlFor="password">Weights File (.bin):</Label>
        <div className="relative">
         <Input placeholder="weights.bin" type="file" accept=".bin" name="weights" className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" onChange={handleWeightsUpload}/>
        </div>
      </fieldset>
       <fieldset className="space-y-1">
        <Label htmlFor="password">Metadata File (.json):</Label>
        <div className="relative">
         <Input placeholder="metadata.bin" type="file" accept=".json" name="metadata" className=" block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" onChange={handleMetadataUpload}/>
        </div>
      </fieldset>
      <Button size="sm" color="success" type="button" onClick={loadModelHandler}>
        Load Model
      </Button>
    </form>
  );
}

export default FileUpload;
