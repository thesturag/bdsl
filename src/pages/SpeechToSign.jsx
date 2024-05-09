import React from 'react'
import {Card, Button , Input} from "keep-react"
import FileUpload from '../components/FileUpload'
import * as tf from "@tensorflow/tfjs"
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import * as speechCommands from '@tensorflow-models/speech-commands';
import { initializeModel, loadLabels, loadModel, moveSlider, normalize } from '../utilities/utilities'


const SpeechToSign = () => {

  const [modelType, setModelType] = useState(null);
  const [model, setModel] = useState(null);
  const [classNames, setClasses] = useState([])
  const [currentLabel,setCurrentLabel] = useState('')
  const [signImages,setSignImages] = useState([
    '/images/yes.png',
    '/images/background_noise.jpeg'
  ]);
  const [currentSignImage,setCurrentSignImage] = useState('')
  const [recognizer, setRecognizer] = useState(null);
  const NUM_FRAMES = classNames.length;
  const INPUT_SHAPE = [NUM_FRAMES, 232, 1]; 

    //handleSetModelType
  const handleModelType = (modelType) => {
    setModelType(modelType);
  };

  useEffect(() => {
    (async() => {
      const recognizer = await initializeModel(speechCommands);
      console.log(recognizer)
      setRecognizer(recognizer);  
    })()
  }, []);

  useEffect(() => {
    if (modelType === "default") {
      loadModel(null,null,null,tf,setClasses, setModel,"/audio-models/speech-to-sign.json");
      loadLabels(setClasses,"/audio-models/speech-metadata.json")
    }
  }, [modelType]);

  const listen = () => {
    if (recognizer.isListening()) {
      recognizer.stopListening();
      console.log('Listening stopped');
      return;
    }
    console.log('Listening started');

    recognizer.listen(async ({ spectrogram: { frameSize, data } }) => {
      const vals = normalize(data.subarray(-frameSize * NUM_FRAMES));
      const input = tf.tensor(vals, [1, ...INPUT_SHAPE]);
      const probs = model.predict(input);
      const predLabel = probs.argMax(1);
      const commandIndex = (await predLabel.data())[0];
      setCurrentLabel(classNames[commandIndex].className)
      setCurrentSignImage(classNames[commandIndex].imagePath);
      await moveSlider(predLabel,classNames);
      tf.dispose([input, probs, predLabel]);
    }, {
      overlapFactor: 0.999,
      includeSpectrogram: true,
      invokeCallbackOnNoiseAndUnknown: true
    });
    // setTimeout(async() => await recognizer.stopListening(), 10000)
  };


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
                    className="mt-2 w-full"
                    size="sm"
                    onClick={() => handleModelType("default")}
                  >
                    Use Default Model
                </Button>
                <Button
                  color="primary"
                  className="mt-2 w-full"
                  size="sm"
                  onClick={() => handleModelType("own")}
                >
                  Use own Model
                </Button>
                <Button 
                  color="primary"
                  className="mt-2 w-full"
                  size="sm"
                >
                  <Link to="/speech-to-sign-train-and-export">
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
                <>
                  <img src={currentSignImage ? currentSignImage : signImages[1]} alt={currentLabel} width={800} height={300} />
                  <span className='text-black font-bold py-6'>{currentLabel}</span>
                </>
              </Card.Description>
              <Card.Footer>
               <div className='flex mt-4 gap-6'>
                    <Button
                      id="listen"
                      onClick={listen}
                    >
                      Listen Speech
                    </Button>
                    <Input type="range" id="output" min="0" max="10" step="0.1" className='w-100'/>
                  </div>
                </Card.Footer>
            </Card.Content>
        </Card>
      </div>
    </div>
  )
}

export default SpeechToSign