const validateContactForm = (req, res, next) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      error: true,
      message: 'Name, email and message are required fields'
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: true,
      message: 'Please provide a valid email address'
    });
  }

  next();
};

module.exports = { validateContactForm };