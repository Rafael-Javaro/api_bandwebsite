const { db } = require('../config/firebase');
const { logger } = require('../utils/logger');
const { sendEmail } = require('../utils/emailSender');

// Submit contact form
const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message, phoneNumber } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: true, 
        message: 'Name, email, and message are required' 
      });
    }
    
    // Store contact form submission in database
    const contactRef = db.ref('contacts');
    await contactRef.set({
      name,
      email,
      subject: subject || 'Contact Form Submission',
      message,
      phoneNumber: phoneNumber || '',
      createdAt: new Date().toISOString(),
      status: 'new',
      resolved: false
    });
    
    // Send email notification to band admin
    try {
      await sendEmail({
        to: 'rafaeljavaro750@gmail.com',
        subject: `New Contact Form: ${subject || 'Contact Form Submission'}`,
        text: `
          New contact form submission from ${name} (${email})
          
          ${phoneNumber ? `Phone: ${phoneNumber}` : ''}
          
          Message:
          ${message}
          
          Manage this submission in the admin panel.
        `,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          ${phoneNumber ? `<p><strong>Phone:</strong> ${phoneNumber}</p>` : ''}
          <p><strong>Subject:</strong> ${subject || 'Contact Form Submission'}</p>
          <h3>Message:</h3>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <p>Manage this submission in the admin panel.</p>
        `
      });
    } catch (emailError) {
      logger.error('Email sending error:', emailError);
      // Continue even if email fails
    }
    
    return res.status(201).json({ 
      success: true, 
      message: 'Contact form submitted successfully',
      contactId: contactRef.id
    });
  } catch (error) {
    logger.error('Contact form submission error:', error);
    return res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

// Get all contact submissions (admin only)
const getAllContactSubmissions = async (req, res) => {
  try {
    const { limit = 20, offset = 0, status } = req.query;
    
    let query = db.collection('contacts').orderBy('createdAt', 'desc');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const contactsSnapshot = await query
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();
    
    const contacts = [];
    contactsSnapshot.forEach(doc => {
      contacts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return res.status(200).json({ 
      success: true, 
      contacts
    });
  } catch (error) {
    logger.error('Get contact submissions error:', error);
    return res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

// Update contact submission status (admin only)
const updateContactStatus = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { status, resolved, notes } = req.body;
    
    const contactRef = db.collection('contacts').doc(contactId);
    const contactDoc = await contactRef.get();
    
    if (!contactDoc.exists) {
      return res.status(404).json({ 
        error: true, 
        message: 'Contact submission not found' 
      });
    }
    
    const updates = {};
    if (status) updates.status = status;
    if (resolved !== undefined) updates.resolved = resolved;
    if (notes !== undefined) updates.notes = notes;
    updates.updatedAt = new Date().toISOString();
    updates.updatedBy = req.user.uid;
    
    await contactRef.update(updates);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Contact submission updated successfully' 
    });
  } catch (error) {
    logger.error('Update contact status error:', error);
    return res.status(400).json({ 
      error: true, 
      message: error.message 
    });
  }
};

module.exports = {
  submitContactForm,
  getAllContactSubmissions,
  updateContactStatus
};