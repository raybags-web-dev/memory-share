import mongoose from 'mongoose'

const DocumentModel = {
  originalname: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  token: {
    type: String,
    maxlength: 500,
    minlength: 3
  },
  data: {
    type: Buffer,
    required: true
  },
  url: {
    type: String,
    required: true,
    default: ''
  },
  signature: {
    type: String,
    require: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: function () {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  size: {
    type: String,
    trim: true,
    maxlength: 500,
    minlength: 1
  },
  encoding: {
    type: String,
    trim: true,
    maxlength: 100,
    minlength: 1,
    required: true
  },
  description: {
    type: String,
    default: 'Description not provided for this document.',
    trim: true,
    maxlength: 7000,
    minlength: 1
  }
}

const DOCUMENT_SCHEMA = new mongoose.Schema(DocumentModel, {
  timestamps: true
})

// Add text index on 'originalname' and 'description' fields
DOCUMENT_SCHEMA.index({ originalname: 'text', description: 'text' })

const DOCUMENT = mongoose.model('document-collection', DOCUMENT_SCHEMA)
export { DOCUMENT }
