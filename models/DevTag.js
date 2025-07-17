// Here are the potential issues and solutions:

// 1. First, check your DevTag model schema
// models/DevTag.js should look like this:
import mongoose from "mongoose";

const DevTagSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  tagline: {
    type: String,
    trim: true
  },
  customTagline: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true
  },
  skills: {
    type: [String],
    default: []
  },
  github: {
    type: String,
    trim: true
  },
  linkedin: {
    type: String,
    trim: true
  },
  twitter: {
    type: String,
    trim: true
  },
  portfolio: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String
  },
  resume: {
    type: String
  }
}, {
  timestamps: true // This adds createdAt and updatedAt
});

export const DevTag = mongoose.model("DevTag", DevTagSchema);
