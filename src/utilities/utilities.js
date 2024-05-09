// Define our labelmap
const labelMap = {
  1: { name: 'হ্যালো', color: 'red' },
  2: { name: 'ধন্যবাদ', color: 'yellow' },
  3: { name: 'আমি তোমাকে ভালোবাসি', color: 'lime' },
  4: { name: 'হ্যাঁ', color: 'blue' },
  5: { name: 'না', color: 'purple' },
}

// Define a drawing function
export const drawRect = (boxes, classes, scores, threshold, imgWidth, imgHeight, ctx) => {
  for (let i = 0; i <= boxes.length; i++) {
    if (boxes[i] && classes[i] && scores[i] > threshold) {
      // Extract variables
      const [y, x, height, width] = boxes[i]
      const text = classes[i]

      // Set styling
      ctx.strokeStyle = labelMap[text]['color']
      ctx.lineWidth = 10
      ctx.fillStyle = 'white'
      ctx.font = '30px Arial'

      // DRAW!!
      ctx.beginPath()
      ctx.fillText(labelMap[text]['name'] + ' - ' + Math.round(scores[i] * 100) / 100, x * imgWidth, y * imgHeight - 10)
      ctx.rect(x * imgWidth, y * imgHeight, width * imgWidth / 2, height * imgHeight / 1.5);
      ctx.stroke()
    }
  }
}

//Find largest id 
export function findLargestId(array) {
  let largestId = 0;
  for (const obj of array) {
    if (obj.id > largestId) {
      largestId = obj.id;
    }
  }
  return largestId;
}

//initial classnames
export const initialClassNames = [
  {
    id: 1,
    className: "Class 1",
    buttonLabel: "Add Data",
    statusText: "Required tools loaded successfully!",
  },
  {
    id: 2,
    className: "Class 2",
    buttonLabel: "Add Data",
    statusText: "Required tools loaded successfully!",
  },
]

//initial audio classnames
export const initialAudioClassNames = [
  {
    id: null,
    className: "Noise",
    imagePath: '',
    buttonLabel: "Record Speechs",
  },
  {
    id: 1,
    className: "Class 1",
    imagePath: '/images/background_noise.jpeg',
    buttonLabel: "Record Speecsssh",
  },
]

export const normalize = (x) => {
  const mean = -100;
  const std = 10;
  return x.map(x => (x - mean) / std);
};

export const moveSlider = async (labelTensor, classNames) => {
  const label = (await labelTensor.data())[0];
  if (label === classNames.length) {
    return;
  }
  let delta = 0.1;
  const prevValue = +document.getElementById('output').value;
  document.getElementById('output').value =
    prevValue + (label === 0 ? -delta : delta);
};


//initialize speech to sign audio recognizer

export const initializeModel = async (speechCommands) => {
  const recognizer = speechCommands.create('BROWSER_FFT');
  await recognizer.ensureModelLoaded();
  return recognizer;
};

// model load 
export const loadModel = async (modelFile, weightsFile, metadataFile, tf, setClasses, setModel, modelFileUrl) => {
  if (modelFile && weightsFile && metadataFile) {
    const loadedModel = await tf.loadLayersModel(tf.io.browserFiles([modelFile, weightsFile]));
    setModel(loadedModel)
    setClasses(metadataFile.labels)
  } else {
    const loadedModel = await tf.loadLayersModel(modelFileUrl);
    console.log(modelFileUrl, 'modelFileUrl')
    if (loadedModel) {
      setModel(loadedModel)
    }
  }
};

//load data group labels
export async function loadLabels(setClasses, metadataUrl) {
  try {
    const response = await fetch(metadataUrl);
    if (!response.ok) {
      throw new Error(`Failed to load metadata: ${response.status}`);
    }
    const data = await response.json();
    setClasses(data.labels);
  } catch (error) {
    console.error('Error loading class names:', error);
    return null;
  }
}

// add class for group data
export const handleAddClasses = (setClasses, classNames, buttonLabel, imagePath, localStorageName) => {
  let largestId = findLargestId(classNames);

  setClasses([
    ...classNames,
    {
      id: largestId + 1,
      className: `Class ${largestId + 1}`,
      buttonLabel: buttonLabel,
      imagePath: imagePath ? imagePath : '',
      statusText: "Required tools loaded successfully!",
    },
  ]);
  localStorage.setItem(
    localStorageName,
    JSON.stringify([
      ...classNames,
      {
        id: largestId + 1,
        className: `Class ${largestId + 1}`,
        buttonLabel: buttonLabel,
        imagePath: imagePath ? imagePath : '',
        statusText: "Required tools loaded successfully!",
      },
    ])
  );
};

//delete class from local state and localstorage
export const handleClassDelete = (id, localStorageName, classNames, setClasses) => {
  const storedValue = localStorage.getItem(localStorageName);
  if (storedValue || classNames.length > 0) {
    const parsedValue = JSON.parse(storedValue);
    const filterdData = parsedValue.filter((data) => data.id !== id);
    setClasses([...filterdData]);
    filterdData.length > 0
      ? localStorage.setItem(localStorageName, JSON.stringify(filterdData))
      : localStorage.clear(localStorageName);
  }
};

// edit class names
export const handleEditClass = (id, event, classNames, setClasses, setClassNameInput) => {
  setClassNameInput(event.target.value);
  let tempClassNames = [...classNames];
  const editedClass = tempClassNames.find((obj) => obj.id === id);
  editedClass.className = event.target.value;
  setClasses(tempClassNames);
};

// handle class update 
export const handleUpdateClass = (id, classNames, classNameInput, localStorageName) => {
  let tempClassNames = [...classNames];
  const editedClass = tempClassNames.find((obj) => obj.id === id);
  editedClass.className = classNameInput;
  localStorage.setItem(localStorageName, JSON.stringify([...tempClassNames]));
};

//export model 

export const handleExportModel = async (classNames, model, downloadPath, metadataFileName) => {
  const modelInfo = {
    version: 1.0,
    trainingData: "MNIST",
    accuracy: 0.95,
    labels: classNames.map((data) => data.className),

  };
  const jsonData = JSON.stringify(modelInfo);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = metadataFileName;
  a.click();
  URL.revokeObjectURL(url);
  await model.save(downloadPath);
};