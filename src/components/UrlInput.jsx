import { useState } from "react";

function UrlInput({ handleSubmit }) {
  const [url, setUrl] = useState("");

  const handleInputChange = (event) => {
    setUrl(event.target.value);
  };

  const handleButtonClick = () => {
    // Create an object with model URL and metadata URL
    const modelData = {
      modelURL: `${url}model.json`,
      metadataURL: `${url}metadata.json`,
    };
    //   console.log(modelData)

    handleSubmit(modelData);
  };

  return (
    <>
      <div className="card card-width">
        <h5 className="card-header">Teachable Machine URL Input</h5>
        <div className="card-body">
          <h5 className="card-title">Special title treatment</h5>
          <input
            className="form-control"
            type="text"
            placeholder="Enter Teachable Machine URL"
            value={url}
            onChange={handleInputChange}
          />
        </div>
        <div className="card-footer">
          <button className="btn btn-success mt-2" onClick={handleButtonClick}>
            Submit
          </button>
        </div>
      </div>
    </>
  );
}

export default UrlInput;
