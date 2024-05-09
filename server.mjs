import express from "express";
import fileUpload from "express-fileupload";
import { fileURLToPath } from "url";
import { dirname } from "path";
import crypto from 'crypto';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 9005;

// Enable files upload
app.use(
  fileUpload({
    createParentPath: true,
  })
);

// Serve files from the public directory
app.use(express.static("public"));

// Upload endpoint
app.post("/api/upload-sign-image", async (req, res) => {
  try {
    if (!req.files) {
      res.send({
        status: false,
        message: "No file uploaded",
      });
    } else {
      let image = req.files.image;
      
      // Read the file buffer and calculate hash
      const hash = crypto.createHash("sha256").update(image.data).digest("hex");
      const newFilename = hash + "." + image.name.split(".").pop(); // Append original file extension

      // Use the mv() method to place the file in a directory (creates the directory if not found)
      const uploadPath = __dirname + "/public/uploads/" + newFilename;

      // Use the mv() method to place the file in a directory (creates the directory if not found)
      // const uploadPath = __dirname + '/public/uploads/' + image.name;

      image.mv(uploadPath, (err) => {
        if (err) {
          return res.status(500).send(err);
        }

        // Return the URL of the uploaded file
        res.json({
          status: true,
          message: "File is uploaded",
          imageUrl: "uploads/" + newFilename,
        });
      });
    }
  } catch (err) {
    console.log({ err });
    res.status(500).send(err);
  }
});

app.listen(port, () =>
  console.log(`Express server is running on port ${port}`)
);
