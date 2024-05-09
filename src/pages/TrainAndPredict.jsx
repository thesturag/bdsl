import { useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import "../teach.css";
import { handleAddClasses, handleClassDelete, handleEditClass, handleExportModel, handleUpdateClass, initialClassNames } from "../utilities/utilities";
import {Card, Button} from "keep-react"
import ExportModelCard from "../components/ExportModelCard";

function TrainAndPredict() {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [mobilenet, setMobilenet] = useState(null);
  const [predict, setPredict] = useState(false);
  const [trainingDataInputs, setTrainingDataInputs] = useState([]);
  const [trainingDataOutputs, setTrainingDataOutputs] = useState([]);
  const [examplesCount, setExamplesCount] = useState([]);
  const [model, setModel] = useState(null);
  const [classIndex, setClassIndex] = useState("");
  const [requestFrameId, setRequestFrameId] = useState(null);
  const [predictAnimationId, setPredictAnimationId] = useState(null);
  const [gatherDataState, setGatherDataState] = useState(-1);
  const [classNameInput, setClassNameInput] = useState("");
  const [counter, setCounter] = useState(0);
  const [currentClass, setCurrentClass] = useState(null);
  const [classNames, setClasses] = useState(() => {
    const storedValue = localStorage.getItem("classNames");
    if (storedValue) {
      return JSON.parse(storedValue);
    } else {
      localStorage.setItem("classNames", JSON.stringify(initialClassNames));
      return initialClassNames;
    }
  });

  async function loadMobileNetFeatureModel() {
      const URL =
        "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/feature_vector/5/default/1";

      const mobilenetModel = await tf.loadGraphModel(URL, {
        fromTFHub: true,
        onProgress: (p) => console.log(p),
      });
      setMobilenet(mobilenetModel);

      tf.tidy(() => {
        const answer = mobilenetModel.predict(tf.zeros([1, 224, 224, 3]));
        console.log(answer?.shape);
        console.log(mobilenetModel.inputs[0].shape, 'input shape')
      });
      let tempClassNames = [...classNames];
      tempClassNames.map((singleClass) => {
        return {
          ...singleClass,
          statusText: "Required tools loaded successfully!",
        };
      });
      setClasses(tempClassNames);
    }

    useEffect(() => {
      if(!mobilenet){
        setTimeout(() => loadMobileNetFeatureModel(),1000)
      }
    }, [mobilenet]);

  useEffect(() => {
    if (classNames.length) {
      const model = tf.sequential();
      model.add(
        tf.layers.dense({ inputShape: [1024], units: 128, activation: "relu" })
      );
      model.add(
        tf.layers.dense({ units: classNames.length, activation: "softmax" })
      );

      model.summary();

      model.compile({
        optimizer: "adam",
        loss:
          classNames.length === 2
            ? "binaryCrossentropy"
            : "categoricalCrossentropy",
        metrics: ["accuracy"],
      });

      setModel(model);
    }
  }, [classNames.length]);

  const hasGetUserMedia = () =>
    !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const enableCam = () => {
    if (hasGetUserMedia()) {
      const constraints = {
        video: true,
        width: 800,
        height: 480,
      };

      navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        const videoElement = document.getElementById("webcam");
        const webcamEnableBtn = document.getElementById("enableCam");
        videoElement.srcObject = stream;
        videoElement.addEventListener("loadeddata", () => {
          setVideoPlaying(true);
          webcamEnableBtn.classList.add("removed");
        });
      });
    } else {
      console.log("getUserMedia() is not supported by your browser");
    }
  };

  const trainAndPredict = async () => {
    setPredict(false);

    const data = examplesCount.reduce(
      (acc, currentValue) => acc + currentValue,
      0
    );

    if (classNames.length > 0) {
      tf.util.shuffleCombo(trainingDataInputs, trainingDataOutputs);
      const outputsAsTensor = tf.tensor1d(trainingDataOutputs, "int32");
      const oneHotOutputs = tf.oneHot(outputsAsTensor, classNames.length);
      const inputsAsTensor = tf.stack(trainingDataInputs);

      await model.fit(inputsAsTensor, oneHotOutputs, {
        shuffle: true,
        batchSize: 5,
        epochs: 51,
        callbacks: {
          onEpochBegin: async (epoch, logs) => {
            console.log("Epoch: ", epoch);
            setCounter(epoch);
          },
          onEpochEnd: async (epoch, logs) => {
            console.log("Epoch:" + epoch + " Loss:" + logs.loss);
          },
        },
      });
      outputsAsTensor.dispose();
      oneHotOutputs.dispose();
      inputsAsTensor.dispose();

      setPredict(true);
    }
  };

  if (predictAnimationId && !predict) {
    window.cancelAnimationFrame(predictAnimationId);
    setPredictAnimationId(null);
  }

  const predictLoop = () => {
    if (predict) {
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

        let tempClassNames = [...classNames];
        tempClassNames[highestIndex].statusText =
          "Prediction: " +
          classNames[highestIndex].className +
          " with " +
          Math.floor(predictionArray[highestIndex] * 100) +
          "% confidence";

        setCurrentClass(classNames[highestIndex].className);
        setClasses(tempClassNames);
      });

      if (predict) {
        let predictLoopAnimationId = window.requestAnimationFrame(predictLoop);
        setPredictAnimationId(predictLoopAnimationId);
      } else {
        window.cancelAnimationFrame(predictAnimationId);
        setPredictAnimationId(null);
      }
    }
  };

  useEffect(() => {
    if (predict) {
      predictLoop();
    }
  }, [predict]);

  const reset = () => {
    setPredict(false);
    setExamplesCount([]);
    trainingDataInputs.forEach((tensor) => tensor.dispose());
    setTrainingDataInputs([]);
    setTrainingDataOutputs([]);

    let tempClassNames = [...classNames];
    tempClassNames.map(
      (singleClass) => (singleClass.statusText = "No data collected!")
    );
    setClasses(tempClassNames);
    localStorage.setItem("classNames", JSON.stringify([...tempClassNames]));

    console.log("Tensors in memory: " + tf.memory().numTensors);
  };

  const gatherDataForClass = (e) => {
    const classNumber = e.target.getAttribute("data-1hot");
    const className = e.target.getAttribute("data-name");
    setClassIndex(className);
    setGatherDataState((prevState) => (prevState === -1 ? classNumber : -1));
  };

  useEffect(() => {
    if (gatherDataState !== -1) {
      dataGatherLoop();
    }
  }, [gatherDataState]);

  if (gatherDataState === -1) {
    window.cancelAnimationFrame(requestFrameId);
  }

  const dataGatherLoop = () => {
    if (videoPlaying && gatherDataState !== -1) {
      const imageFeatures = tf.tidy(() => {
        const videoFrameAsTensor = tf.browser.fromPixels(
          document.getElementById("webcam")
        );
        const resizedTensorFrame = tf.image.resizeBilinear(
          videoFrameAsTensor,
          [224, 224],
          true
        );
        const normalizedTensorFrame = resizedTensorFrame.div(255);
        return mobilenet?.predict(normalizedTensorFrame.expandDims()).squeeze();
      });


      setTrainingDataInputs((prevInputs) => [...prevInputs, imageFeatures]);
      setTrainingDataOutputs((prevOutputs) => [
        ...prevOutputs,
        gatherDataState,
      ]);

      if (examplesCount[gatherDataState] === undefined) {
        examplesCount[gatherDataState] = 0;
      }

      examplesCount[gatherDataState]++;

      let tempClassNames = [...classNames];
      tempClassNames[gatherDataState].statusText =
        classIndex + " data count: " + examplesCount[gatherDataState] + ". ";
      setClasses(tempClassNames);

      let frameId = window.requestAnimationFrame(dataGatherLoop);
      setRequestFrameId(frameId);
    }
  };


  return (
    <>
      <div className="px-4 2xl:container 2xl:mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
          <div className="column scroll">
              {classNames.map((singleClass, index) => (
                <Card className="max-w-md my-4" key={singleClass.id}>
                  <Card.Content>
                    <Card.Title className="flex">
                      <input
                        type="text"
                        value={singleClass.className}
                        onChange={(event) => handleEditClass(singleClass.id,event,classNames,setClasses,setClassNameInput)}
                        onKeyUp={() => handleUpdateClass(singleClass.id,classNames,classNameInput,'classNames')}
                        className="className-edit"
                      />
                      <div id="dropdown-menu-holder" role="menu">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 30 30"
                          width="25px"
                          height="25px"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleClassDelete(singleClass.id,'classNames',classNames,setClasses)}
                        >
                          {" "}
                          <path d="M 14.984375 2.4863281 A 1.0001 1.0001 0 0 0 14 3.5 L 14 4 L 8.5 4 A 1.0001 1.0001 0 0 0 7.4863281 5 L 6 5 A 1.0001 1.0001 0 1 0 6 7 L 24 7 A 1.0001 1.0001 0 1 0 24 5 L 22.513672 5 A 1.0001 1.0001 0 0 0 21.5 4 L 16 4 L 16 3.5 A 1.0001 1.0001 0 0 0 14.984375 2.4863281 z M 6 9 L 7.7929688 24.234375 C 7.9109687 25.241375 8.7633438 26 9.7773438 26 L 20.222656 26 C 21.236656 26 22.088031 25.241375 22.207031 24.234375 L 24 9 L 6 9 z" />
                        </svg>
                        <div
                          id="dropdown-menu"
                          className="open"
                          style={{ top: "128px", left: "396px" }}
                        >
                          <slot aria-hidden="false"></slot>
                        </div>
                      </div>
                    </Card.Title>
                    <Card.Description className="py-4">
                       <p className="text-base">{singleClass.statusText}</p>
                    </Card.Description>
                    <Card.Footer>
                      <Button
                        size="xs"
                        className="btn btn-success"
                        data-1hot={index}
                        data-name={`Class ${singleClass.id}`}
                        onMouseDown={gatherDataForClass}
                        onMouseUp={gatherDataForClass}
                      >
                        {singleClass.buttonLabel}
                      </Button>
                    </Card.Footer>
                  </Card.Content>
                </Card>
              ))}
              <button className="add-classes" onClick={() => handleAddClasses(setClasses,classNames,'Add Data','','classNames')}>
                <svg
                  className="add-class-svg"
                  width="15"
                  height="14"
                  viewBox="0 0 15 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12.9961 0.25H2.33376C1.48838 0.25 0.810562 0.925 0.810562 1.75V12.25C0.810562 13.075 1.48838 13.75 2.33376 13.75H12.9961C13.8339 13.75 14.5193 13.075 14.5193 12.25V1.75C14.5193 0.925 13.8339 0.25 12.9961 0.25ZM12.9961 12.25H2.33376V1.75H12.9961V12.25ZM8.42654 10.75H6.90335V7.75H3.85695V6.25H6.90335V3.25H8.42654V6.25H11.4729V7.75H8.42654V10.75Z"
                    fill="#80868B"
                  ></path>
                </svg>
                Add a class
              </button>
            </div>
          <div className="xl:vcenter-sticky">
            <div className="xl:column-stretch-container">
              <Card className="max-w-lg webcam-wrapper">
                <Card.Content>
                  <Card.Description>
                    <video id="webcam" className="webcam" autoPlay></video>
                    <div className="text-center"><b>{currentClass}</b></div>
                  </Card.Description>
                  <Card.Footer>
                    <div className="action-buttons">
                    <Button
                      size="xs"
                      id="enableCam"
                      onClick={enableCam}
                    >
                      Enable Webcam
                    </Button>
                    <Button color="success" size="sm" onClick={trainAndPredict}>
                      Train & Predict!
                    </Button>
                    <Button color="warning" size="sm" onClick={reset}>
                      Reset Data
                    </Button>
                  </div>
                  {examplesCount.length > 0 && (
                    <div className="progressbar">
                      {counter} / {50}
                    </div>
                  )}
                  </Card.Footer>
                </Card.Content>
              </Card>
            </div>
          </div>
          <div className="xl:column vcenter-sticky">
            <div className="xl:column-stretch-container">
              <ExportModelCard handleExportModel={handleExportModel} classNames={classNames} model={model} downloadPath={"downloads://image-recognition"} metadatFileName={"metadata.json"} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default TrainAndPredict;
