import mongoose from "mongoose";

const searchSchema = new mongoose.Schema({
  caption: {
    type: String,
    required: true,
    trim: true,
  },
  tags: {
    type: [String],
    default: [],
  },
}, { timestamps: true });

const Search = mongoose.model("Search", searchSchema);
export default Search;
