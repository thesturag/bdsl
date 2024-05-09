import React, { useState, useEffect } from "react";

const TrainingProgress = ({ totalImages }) => {
  const [imagesProcessed, setImagesProcessed] = useState(0);

  useEffect(() => {
    // Simulate processing images (replace this with your actual TensorFlow.js code)
    const processImage = () => {
      setImagesProcessed((prevImagesProcessed) => prevImagesProcessed + 1);
    };

    const interval = setInterval(() => {
      if (imagesProcessed < totalImages) {
        processImage();
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [imagesProcessed, totalImages]);

  const percentage = (imagesProcessed / totalImages) * 100;

  return (
    <div>
      <h1>Training Progress</h1>
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${percentage}%` }}></div>
      </div>
      <p>
        {imagesProcessed}/{totalImages}
      </p>
    </div>
  );
};

export default TrainingProgress;
