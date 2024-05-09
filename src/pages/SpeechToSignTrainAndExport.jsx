import React, { useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as speechCommands from "@tensorflow-models/speech-commands";
import { Button, Card, Input, Label } from "keep-react";
import {
  handleAddClasses,
  handleClassDelete,
  handleEditClass,
  handleExportModel,
  handleUpdateClass,
  initialAudioClassNames,
  initializeModel,
} from "../utilities/utilities";
import ExportModelCard from "../components/ExportModelCard";

function SpeechToSignTrainAndExport() {
  const [recording, setRecording] = useState(null);
  const [recognizer, setRecognizer] = useState(null);
  const [model, setModel] = useState(null);
  const [examples, setExamples] = useState([]);
  const [classNameInput, setClassNameInput] = useState("");
  const [trainingStatus, setTrainingStatus] = useState(null);

  const [classNames, setClasses] = useState(() => {
    const storedValue = localStorage.getItem("audioClassNames");
    if (storedValue) {
      return JSON.parse(storedValue);
    } else {
      localStorage.setItem(
        "audioClassNames",
        JSON.stringify(initialAudioClassNames)
      );
      return initialAudioClassNames;
    }
  });

  const NUM_FRAMES = classNames.length;
  const INPUT_SHAPE = [NUM_FRAMES, 232, 1];

  async function handleImageUpload(event, id) {
    const formData = new FormData();
    formData.append("image", event.target.files[0]);
    console.log(formData);
    try {
      const response = await fetch(
        `http://localhost:5173/api/upload-sign-image`,
        {
          method: "POST",
          body: formData,
        }
      );
      const result = await response.json();
      let tempClassNames = [...classNames];
      const editedClass = tempClassNames.find((obj) => obj.id === id);
      editedClass.imagePath = "http://localhost:5173/" + result.imageUrl;
      localStorage.setItem(
        "audioClassNames",
        JSON.stringify([...tempClassNames])
      );
    } catch (error) {
      console.log(error);
    }
  }

  const [signImages, setSignImages] = useState([
    "/images/yes.png",
    "/images/background_noise.jpeg",
  ]);

  const [currentLabel, setCurrentLabel] = useState("");
  const [currentSignImage, setCurrentSignImage] = useState("");

  useEffect(() => {
    (async () => {
      const recognizer = await initializeModel(speechCommands);
      setRecognizer(recognizer);
      buildModel();
    })();
  }, []);

  const buildModel = () => {
    const model = tf.sequential();
    model.add(
      tf.layers.depthwiseConv2d({
        depthMultiplier: 8,
        kernelSize: [NUM_FRAMES, classNames.length],
        activation: "relu",
        inputShape: INPUT_SHAPE,
      })
    );
    model.add(tf.layers.maxPooling2d({ poolSize: [1, 2], strides: [2, 2] }));
    model.add(tf.layers.flatten());
    model.add(
      tf.layers.dense({ units: classNames.length, activation: "softmax" })
    );
    const optimizer = tf.train.adam(0.01);
    model.compile({
      optimizer,
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });
    setModel(model);
  };

  const collect = (label) => {
    if (recognizer.isListening()) {
      return recognizer.stopListening();
    }
    if (label == null) {
      return;
    }
    recognizer.listen(
      async ({ spectrogram: { frameSize, data } }) => {
        const vals = normalize(data.subarray(-frameSize * NUM_FRAMES));
        setExamples((prevExamples) => [...prevExamples, { vals, label }]);
      },
      {
        overlapFactor: 0.999,
        includeSpectrogram: true,
        invokeCallbackOnNoiseAndUnknown: true,
      }
    );
  };

  // console.log(examples);

  const train = async () => {
    toggleButtons(false);
    const ys = tf.oneHot(
      examples.map((e) => e.label),
      classNames.length
    );
    const xsShape = [examples.length, ...INPUT_SHAPE];
    const xs = tf.tensor(flatten(examples.map((e) => e.vals)), xsShape);

    await model.fit(xs, ys, {
      batchSize: 16,
      epochs: 10,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          setTrainingStatus(
            `Accuracy: ${(logs.acc * 100).toFixed(1)}% Epoch: ${epoch + 1}`
          );
        },
        onTrainEnd: () => {
          setTrainingStatus("Training complete");
        },
      },
    });
    tf.dispose([xs, ys]);
    toggleButtons(true);
  };

  const normalize = (x) => {
    const mean = -100;
    const std = 10;
    return x.map((x) => (x - mean) / std);
  };

  const toggleButtons = (enable) => {
    document.querySelectorAll("button").forEach((b) => (b.disabled = !enable));
  };

  const flatten = (tensors) => {
    const size = tensors[0].length;
    const result = new Float32Array(tensors.length * size);
    tensors.forEach((arr, i) => result.set(arr, i * size));
    return result;
  };

  const moveSlider = async (labelTensor) => {
    const label = (await labelTensor.data())[0];
    if (label === classNames.length) {
      return;
    }
    let delta = 0.1;
    const prevValue = +document.getElementById("output").value;
    document.getElementById("output").value =
      prevValue + (label === 0 ? -delta : delta);
  };

  const listen = () => {
    if (recognizer.isListening()) {
      recognizer.stopListening();
      // toggleButtons(true);
      console.log("Listening stopped");
      return;
    }
    // toggleButtons(false);
    console.log("Listening started");

    recognizer.listen(
      async ({ spectrogram: { frameSize, data } }) => {
        const vals = normalize(data.subarray(-frameSize * NUM_FRAMES));
        const input = tf.tensor(vals, [1, ...INPUT_SHAPE]);
        const probs = model.predict(input);
        const predLabel = probs.argMax(1);
        const commandIndex = (await predLabel.data())[0];
        setCurrentLabel(classNames[commandIndex].className);
        setCurrentSignImage(classNames[commandIndex].imagePath);
        await moveSlider(predLabel);
        tf.dispose([input, probs, predLabel]);
      },
      {
        overlapFactor: 0.999,
        includeSpectrogram: true,
        invokeCallbackOnNoiseAndUnknown: true,
      }
    );
    // setTimeout(async() => await recognizer.stopListening(), 10000)
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-evenly gap-4">
        <div className="flex flex-col gap-2">
          {classNames.map((singleClass, index) => (
            <Card className="max-w-lg my-4" key={singleClass.id}>
              <Card.Content>
                <Card.Title className="flex">
                  <input
                    type="text"
                    value={singleClass.className}
                    onChange={(event) =>
                      handleEditClass(
                        singleClass.id,
                        event,
                        classNames,
                        setClasses,
                        setClassNameInput
                      )
                    }
                    onKeyUp={() =>
                      handleUpdateClass(
                        singleClass.id,
                        classNames,
                        classNameInput,
                        "audioClassNames"
                      )
                    }
                    className="className-edit"
                    readOnly={singleClass.className === "Noise"}
                  />
                  {singleClass.className !== "Noise" && (
                    <div id="dropdown-menu-holder" role="menu">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 30 30"
                        width="25px"
                        height="25px"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          handleClassDelete(
                            singleClass.id,
                            "audioClassNames",
                            classNames,
                            setClasses
                          )
                        }
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
                  )}
                </Card.Title>
                <Card.Description className="py-4">
                  <Button
                    size="xs"
                    className="btn btn-success"
                    data-1hot={index}
                    data-name={`Class ${singleClass.id}`}
                    onMouseDown={() => {
                      setRecording(index);
                      collect(index);
                    }}
                    onMouseUp={() => {
                      setRecording(false);
                      collect(null);
                      console.log(examples);
                    }}
                  >
                    {recording === index ? "Recording" : "Record"}
                  </Button>
                </Card.Description>

                <p className="py-4">
                  Sample collected:{" "}
                  {examples.filter((i) => i.label === index).length}
                </p>

                {singleClass.className !== "Noise" && (
                  <Card.Footer>
                    <Label>
                      Select your sign image
                      <Input
                        type="file"
                        placeholder="Select your sign image"
                        className="pl-0"
                        onChange={(e) => handleImageUpload(e, singleClass.id)}
                      />
                    </Label>
                  </Card.Footer>
                )}
              </Card.Content>
            </Card>
          ))}
          <button
            className="add-classes"
            onClick={() =>
              handleAddClasses(
                setClasses,
                classNames,
                "Record Speechs",
                "",
                "audioClassNames"
              )
            }
          >
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
        <div>
          <img
            src={currentSignImage ? currentSignImage : signImages[1]}
            alt={currentLabel}
            width={800}
            height={300}
          />
          <p className="text-black font-bold py-6">{currentLabel}</p>
          <div className="flex mt-4 gap-6">
            <Button id="train" onClick={train}>
              {trainingStatus || 'Train Model'}
            </Button>
            <Button id="listen" onClick={listen}>
              Listen Speech
            </Button>
            <Input
              type="range"
              id="output"
              min="0"
              max="10"
              step="0.1"
              className="w-100"
            />
          </div>
        </div>
        <ExportModelCard
          handleExportModel={handleExportModel}
          classNames={classNames}
          model={model}
          downloadPath={"downloads://speech-to-sign"}
          metadatFileName={"speech-metadata.json"}
        />
      </div>
    </div>
  );
}

export default SpeechToSignTrainAndExport;
