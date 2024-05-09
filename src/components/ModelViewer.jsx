import { useEffect, useCallback } from "react";
import * as tmImage from "@teachablemachine/image";
import * as tf from "@tensorflow/tfjs";
function ModelViewer({ model }) {
  let webcam, labelContainer, maxPredictions;
  let isIos = false;
  console.log("from props", model);

  // model.add(tf.layers.add({inputShape: [1, 224, 224, 3]}))

  // Check if running on iOS
  if (
    window.navigator.userAgent.indexOf("iPhone") > -1 ||
    window.navigator.userAgent.indexOf("iPad") > -1
  ) {
    isIos = true;
  }

  const init = useCallback(async () => {
    if (!model) return;

    maxPredictions = model.getTotalClasses();

    const flip = true;
    const width = 400;
    const height = 400;

    webcam = new tmImage.Webcam(width, height, flip);
    await webcam.setup();

    if (isIos) {
      document.getElementById("webcam-container").appendChild(webcam.webcam);
      const webCamVideo = document.getElementsByTagName("video")[0];
      webCamVideo.setAttribute("playsinline", true);
      webCamVideo.muted = "true";
      webCamVideo.style.width = width + "px";
      webCamVideo.style.height = height + "px";
    } else {
      document.getElementById("webcam-container").appendChild(webcam.canvas);
    }

    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) {
      labelContainer.appendChild(document.createElement("div"));
    }

    webcam.play();
    window.requestAnimationFrame(loop);
  }, [model]);

  const loop = async () => {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
  };

  const predict = async () => {
    if (!model) return;

    let prediction;
   
    if (isIos) {
      prediction = await model.predict(webcam.webcam);
    } else {
      prediction = await model.predict(webcam.canvas);
    }

     

    for (let i = 0; i < maxPredictions; i++) {
      const classPrediction =
        prediction[i].className + ": " + prediction[i].probability.toFixed(2);
      labelContainer.childNodes[i].innerHTML = classPrediction;
    }
  };

  useEffect(() => {
    init(); // Call init on component mount
  }, [model]);

  return (
    <div className="card card-width">
      <div className="card-body">
        {/* <h5 className="card-title">Teachable Machine Image Model</h5> */}
        <div id="webcam-container"></div>
        <div id="label-container"></div>
        <button className="btn btn-info" type="button" onClick={init}>
          Refresh
        </button>
      </div>
    </div>
  );
}

export default ModelViewer;
