import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import '../styles/modal.css';

const CheckoutModal = ({ isOpen, closeModal, cartTotal, cart }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    pincode: '',
    city: '',
    paymentScreenshot: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    pincode: '',
    city: '',
    paymentScreenshot: ''
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        pincode: '',
        city: '',
        paymentScreenshot: null
      });
      setPreviewImage(null);
      setOrderSuccess(false);
      setErrorMessage('');
      setFormErrors({
        name: '',
        email: '',
        phone: '',
        address: '',
        pincode: '',
        city: '',
        paymentScreenshot: ''
      });
    }
  }, [isOpen]);

  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'name':
        if (!value.trim()) error = 'Name is required';
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Invalid email format';
        }
        break;
      case 'phone':
        if (!/^[0-9]{10}$/.test(value)) {
          error = 'Phone must be 10 digits';
        }
        break;
      case 'pincode':
        if (value && !/^[0-9]{6}$/.test(value)) {
          error = 'Pincode must be 6 digits';
        }
        break;
      case 'paymentScreenshot':
        if (!value && !orderSuccess) error = 'Payment screenshot is required';
        break;
      default:
        break;
    }
    
    return error;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    
    // Clear any existing error when user starts typing
    if (formErrors[id]) {
      setFormErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, paymentScreenshot: file }));
      setFormErrors(prev => ({ ...prev, paymentScreenshot: '' }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBlur = (e) => {
    const { id, value } = e.target;
    const error = validateField(id, value);
    setFormErrors(prev => ({ ...prev, [id]: error }));
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Only validate required fields
    const requiredFields = ['name', 'email', 'phone', 'paymentScreenshot'];
    requiredFields.forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        errors[key] = error;
        isValid = false;
      }
    });

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setErrorMessage('Please fill in all required fields correctly');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', formData.address || 'Not provided');
      formDataToSend.append('pincode', formData.pincode || 'Not provided');
      formDataToSend.append('city', formData.city || 'Not provided');
      formDataToSend.append('paymentScreenshot', formData.paymentScreenshot);
      formDataToSend.append('totalAmount', cartTotal);
      formDataToSend.append('products', JSON.stringify(cart.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      }))));

      // Updated backend URL - replace with your actual backend URL
      const backendUrl = 'https://your-backend-url.vercel.app/api/orders'; // or 'https://your-backend-url.onrender.com/api/orders'
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order. Please check your details and try again.');
      }

      const result = await response.json();
      console.log('Order created:', result);
      setOrderSuccess(true);
    } catch (error) {
      console.error('Checkout error:', error);
      setErrorMessage(error.message || 'There was an error processing your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="checkout-modal">
      <div className="modal-content">
        <span className="close-modal" onClick={closeModal}>&times;</span>
        
        {orderSuccess ? (
          <div className="order-success">
            <h2>Order Placed Successfully!</h2>
            <p>Thank you for your order, {formData.name}!</p>
            <p>Your order total is ₹{cartTotal.toLocaleString('en-IN')}.</p>
            <button onClick={closeModal} className="submit-order">
              Close
            </button>
          </div>
        ) : (
          <>
            <h2>Checkout</h2>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            <form onSubmit={handleSubmit} noValidate encType="multipart/form-data">
              <div className="form-group">
                <label htmlFor="name">Full Name <span className="required">*</span></label>
                <input 
                  type="text" 
                  id="name" 
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required 
                  className={formErrors.name ? 'error' : ''}
                />
                {formErrors.name && <span className="field-error">{formErrors.name}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="email">Email <span className="required">*</span></label>
                <input 
                  type="email" 
                  id="email" 
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required 
                  className={formErrors.email ? 'error' : ''}
                />
                {formErrors.email && <span className="field-error">{formErrors.email}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number <span className="required">*</span></label>
                <input 
                  type="tel" 
                  id="phone" 
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required 
                  className={formErrors.phone ? 'error' : ''}
                />
                {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <textarea 
                  id="address" 
                  value={formData.address}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={formErrors.address ? 'error' : ''}
                  placeholder="Enter address"
                />
                {formErrors.address && <span className="field-error">{formErrors.address}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="pincode">Pincode</label>
                <input 
                  type="text" 
                  id="pincode" 
                  value={formData.pincode}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={formErrors.pincode ? 'error' : ''}
                  placeholder="Enter pincode"
                />
                {formErrors.pincode && <span className="field-error">{formErrors.pincode}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input 
                  type="text" 
                  id="city" 
                  value={formData.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={formErrors.city ? 'error' : ''}
                  placeholder="Enter city"
                />
                {formErrors.city && <span className="field-error">{formErrors.city}</span>}
              </div>
              
              <div className="payment-section">
                <h3>Payment Method</h3>
                <p>Please transfer ₹{cartTotal.toLocaleString('en-IN')} to our GPay account:</p>
                
                <div className="gpay-instructions">
                  <div className="gpay-qr-container">
                    <img 
                      src="assets/images/gpay-qr.jpg" 
                      alt="GPay QR Code" 
                      className="gpay-qr-code"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        document.querySelector('.gpay-fallback').style.display = 'block';
                      }}
                    />
                    <div className="gpay-fallback" style={{ display: 'none' }}>
                      <p>GPay Number: 8075875280</p>
                      <p>Name: Your Business Name</p>
                    </div>
                  </div>
                  <p className="payment-note">
                    After payment, please upload the screenshot below for verification.
                  </p>
                </div>
                
                <div className="form-group">
                  <label htmlFor="paymentScreenshot">Upload Payment Screenshot <span className="required">*</span></label>
                  <input 
                    type="file" 
                    id="paymentScreenshot"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    required
                    className={formErrors.paymentScreenshot ? 'error' : ''}
                  />
                  {formErrors.paymentScreenshot && (
                    <span className="field-error">{formErrors.paymentScreenshot}</span>
                  )}
                  {previewImage && (
                    <div className="image-preview">
                      <img src={previewImage} alt="Payment preview" />
                    </div>
                  )}
                </div>
              </div>
              
              <button 
                type="submit" 
                className="submit-order"
                disabled={isSubmitting || cart.length === 0}
              >
                {isSubmitting ? 'Processing...' : 'Place Order'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

CheckoutModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  closeModal: PropTypes.func.isRequired,
  cartTotal: PropTypes.number.isRequired,
  cart: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      quantity: PropTypes.number.isRequired,
      image: PropTypes.string
    })
  ).isRequired
};

export default CheckoutModal;