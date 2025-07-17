// 2. Updated server.js with better error handling and debugging
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { DevTag } from "./models/DevTag.js";
import dotenv from "dotenv";
dotenv.config();
const app = express();

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// Serve static files
// app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));

// View engine setup
app.set("view engine", "ejs");

// MongoDB connection with better error handling
mongoose
  .connect(
    process.env.MONGO_URI,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("✅ MongoDB Connected");
    console.log("📊 Database Name:", mongoose.connection.db.databaseName);
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// Monitor connection events
mongoose.connection.on("connected", () => {
  console.log("🔗 Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("🔌 Mongoose disconnected");
});

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage: storage });

// Routes
app.get("/", (req, res) => {
  res.render("index.ejs");
});
app.post(
  "/getdevtag",
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("📨 Received request body:", req.body);
      console.log("📁 Received files:", req.files);

      const {
        fullName,
        tagline,
        customTagline,
        bio,
        github,
        linkedin,
        twitter,
        portfolio,
      } = req.body;

      // Normalize skills
      let skills = [];
      if (req.body.skills) {
        if (Array.isArray(req.body.skills)) {
          skills = req.body.skills.filter((skill) => skill.trim() !== "");
        } else if (typeof req.body.skills === "string") {
          skills = [req.body.skills].filter((skill) => skill.trim() !== "");
        }
      }

      console.log("🔧 Processed skills:", skills);

      const profilePicture = req.files?.profilePicture?.[0]?.filename || null;
      const resume = req.files?.resume?.[0]?.filename || null;

      const devtagData = {
        fullName: fullName?.trim() || "",
        tagline: tagline?.trim() || "",
        customTagline: customTagline?.trim() || "",
        bio: bio?.trim() || "",
        skills,
        github: github?.trim() || "",
        linkedin: linkedin?.trim() || "",
        twitter: twitter?.trim() || "",
        portfolio: portfolio?.trim() || "",
        profilePicture,
        resume,
      };

      console.log("💾 Data to save:", devtagData);

      if (!devtagData.fullName) {
        throw new Error("Full name is required");
      }

      const devtag = new DevTag(devtagData);
      const validationError = devtag.validateSync();

      if (validationError) {
        console.error("❌ Validation Error:", validationError);
        return res.status(400).json({
          error: "Validation failed",
          details: validationError,
        });
      }

      const savedDevtag = await devtag.save();

      console.log("✅ DevTag saved successfully:", savedDevtag);
      console.log("🆔 Document ID:", savedDevtag._id);

      // 🔥 Render the DevTag card and pass data
      res.redirect(`/devtag/${savedDevtag._id}`);

    } catch (error) {
      console.error("❌ Error saving DevTag:", error);
      console.error("📋 Error details:", error.message);
      console.error("📊 Stack trace:", error.stack);

      res.status(500).json({
        success: false,
        error: "Something went wrong.",
        details: error.message,
      });
    }
  }
);

app.get("/devtag/:id", async (req, res) => {
    try {
      const dev = await DevTag.findById(req.params.id);
  
      if (!dev) {
        return res.status(404).send("DevTag not found");
      }
  
      res.render("card", { dev });
    } catch (err) {
      console.error("❌ Error fetching DevTag:", err.message);
      res.status(500).send("Server error");
    }
  });
  

// Add a route to check saved data
app.get("/devtags", async (req, res) => {
  try {
    const devtags = await DevTag.find({}).sort({ createdAt: -1 });
    console.log("📋 Found DevTags:", devtags.length);
    res.json(devtags);
  } catch (error) {
    console.error("❌ Error fetching DevTags:", error);
    res.status(500).json({ error: "Failed to fetch DevTags" });
  }
});

// Server
const port = 3000;
app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});
