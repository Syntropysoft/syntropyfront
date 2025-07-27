import React from 'react';

const UserProfileSection = ({ userProfile, onUpdateProfile }) => {
  const updateUserProfile = (field, value) => {
    onUpdateProfile(field, value);
  };

  return (
    <div className="demo-section">
      <h2>👤 User Profile (Proxy Tracked)</h2>
      <div className="profile-form">
        <div>
          <label>Name:</label>
          <input 
            type="text" 
            value={userProfile.name}
            onChange={(e) => updateUserProfile('name', e.target.value)}
          />
        </div>
        <div>
          <label>Email:</label>
          <input 
            type="email" 
            value={userProfile.email}
            onChange={(e) => updateUserProfile('email', e.target.value)}
          />
        </div>
        <div>
          <label>Theme:</label>
          <select 
            value={userProfile.preferences.theme}
            onChange={(e) => updateUserProfile('preferences', {
              ...userProfile.preferences,
              theme: e.target.value
            })}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default UserProfileSection; 