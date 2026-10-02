const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        category_name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
            unique: true
        },

        category_image: {
            type: String,
            default: ""
        },

        parent_category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null
        },

        is_active: {
            type: Boolean,
            default: true
        }
    }, { timestamps: true}
);

module.exports = mongoose.model("Category", categorySchema);