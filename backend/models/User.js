const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockUntil: {
    type: Date
  }
}, { timestamps: true });

// Check if account is locked
userSchema.virtual('isCurrentlyLocked').get(function() {
  return this.isLocked && this.lockUntil && this.lockUntil > Date.now();
});

module.exports = mongoose.model('User', userSchema);
