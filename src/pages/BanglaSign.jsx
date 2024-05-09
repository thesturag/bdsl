'use client'
import { useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import FileUpload from "../components/FileUpload";
import { Link } from "react-router-dom";
import { Card, Button, Alert } from 'keep-react'
import { loadLabels, loadModel } from "../utilities/utilities";

function BanglaSign() {
  const [isLoading,setIsLoading] = useState(false);
  const [enableWebCam, setEnableCam] = useState(false);
  const [btnLabel, setBtnLabel] = useState("Enable Webcam");
  const [modelType, setModelType] = useState(null);
  const [model, setModel] = useState(null);
  const [classNames, setClasses] = useState()
  const [currentClass, setCurrentClass] = useState(null);
  const [predictAnimationId, setPredictAnimationId] = useState(null);
  const [predictionStatus,setPredictionStatus] = useState(null);
  const [predict, setPredict] = useState(false);
  const [mobilenet, setMobilenet] = useState(null);

   //handleSetModelType
  const handleModelType = (modelType) => {
    setModelType(modelType);
  };
   

  //load model from tshub
  function loadMobileNetFeatureModel() {
    setIsLoading(true)
    const URL =
      "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/feature_vector/5/default/1";
    tf.loadGraphModel(URL, {
      fromTFHub: true,
      onProgress: (p) => console.log(p),
    }).then((response) => {
      setMobilenet(response);
      setIsLoading(false);
    })
    .catch((err) => {
      console.log(err)
      setIsLoading(false);
    }) 
  }

  useEffect(() => {
    if(!mobilenet){
      loadMobileNetFeatureModel();
    }
  },[mobilenet]);

  useEffect(() => {
    if(modelType === "default"){
      loadLabels(setClasses,"./src/pages/models/metadata.json");
    }
  },[modelType])


  const hasGetUserMedia = () =>
    !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia); 

   const enableCam = async() => {
    if (hasGetUserMedia()) {
      const constraints = {
        video: true,
        width: 640,
        height: 480,
      };

      navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        const videoElement = document.getElementById("webcam");
        const webcamEnableBtn = document.getElementById("enableCam");
        videoElement.srcObject = stream;
        videoElement.addEventListener("loadeddata", () => {
          webcamEnableBtn.innerText = "Disable Camera"
        });
      });
      setEnableCam(true);
      if(modelType === "default"){
        await loadModel(null,null,null,tf,setClasses,setModel,"/new-model/image-recognition.json")
      }
      setPredict(true);
    } else {
      console.log("getUserMedia() is not supported by your browser");
    }
  }

  useEffect(() => {
    (async() => {
      if (enableWebCam && modelType === "default") {
        await loadModel(null,null,null,tf,setClasses,setModel,"/new-model/image-recognition.json")
      }
    })()
    if (!enableWebCam) {
      setBtnLabel("Enable Webcam");
    } else {
      setBtnLabel("Disable Webcam");
    }
  }, [enableWebCam,modelType]);


  const detect = async() => {
    if(predict && model){
      tf.tidy(() => {
        const videoFrameAsTensor = tf.browser
          .fromPixels(document.getElementById("webcam"))
          .div(255);
          
        const resizedTensorFrame = tf.image.resizeBilinear(
          videoFrameAsTensor,
          [224, 224],
          true
        );
        const imageFeatures = mobilenet?.predict(
          resizedTensorFrame.expandDims()
        );
  
        const prediction = model.predict(imageFeatures).squeeze();
        const highestIndex = prediction.argMax().arraySync();
        const predictionArray = prediction.arraySync();
  
        console.log(classNames[highestIndex]);
        setPredictionStatus( "Prediction: " + classNames[highestIndex])
        setCurrentClass(classNames[highestIndex]);
      });
      let predictLoopAnimationId = window.requestAnimationFrame(detect);
      setPredictAnimationId(predictLoopAnimationId);
    } else {
      window.cancelAnimationFrame(predictAnimationId);
      setPredictAnimationId(null);
    }
  };

  useEffect(() => {
    if(predict){
      const intervalId = setInterval(() => detect(), 1000);
      return () => clearInterval(intervalId); 
    }
  },[predict])

 
  if(isLoading){
    return (
      <div className='flex space-x-2 justify-center items-center bg-white h-screen dark:invert'>
        <span className='sr-only'>Loading mobilenet model...</span>
          <div className='h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.3s]'></div>
        <div className='h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.15s]'></div>
        <div className='h-8 w-8 bg-black rounded-full animate-bounce'></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 space-y-4 md:space-y-0">
        <div>
          <Card className="max-w-md">
            <Card.Content>
              <Card.Title>Select model type first*</Card.Title>
              <Card.Description>
                <Button
                    color="primary"
                    // variant="outline"
                    className="mt-2 w-full"
                    size="sm"
                    onClick={() => handleModelType("default")}
                  >
                    Use Default Model
                </Button>
                <Button
                  color="primary"
                  // variant="outline"
                  className="mt-2 w-full"
                  size="sm"
                  onClick={() => handleModelType("own")}
                >
                  Use own Model
                </Button>
                <Button 
                  color="primary"
                  // variant="outline"
                  className="mt-2 w-full"
                  size="sm"
                >
                  <Link to="/train-and-predict">
                    Train Custom Model and Export
                  </Link>
                </Button>
              </Card.Description>
            </Card.Content>
          </Card>
          {modelType && modelType === "own" && (
            <FileUpload loadModel={loadModel} />
          )}
        </div>
        <Card className="max-w-xl h-fit">
          <Card.Content>
              <Card.Description>
                <video id="webcam" className="webcam" autoPlay></video>
              </Card.Description>
              <Card.Footer>
                {
                  predict && 
                  <Alert withBg={true} color="secondary" className="mt-4">
                    <Alert.Container>
                      <Alert.Icon />
                      <Alert.Description>{predictionStatus}</Alert.Description>
                    </Alert.Container>
                  </Alert>
                }
                <Button
                  disabled={!modelType}
                  id="enableCam"
                  className="btn btn-secondary mt-6"
                  size="sm"
                  onClick={enableCam}
                >
                  {btnLabel}
                </Button>
                </Card.Footer>
            </Card.Content>
        </Card>
      </div>
    </div>
  );
}

export default BanglaSign;
