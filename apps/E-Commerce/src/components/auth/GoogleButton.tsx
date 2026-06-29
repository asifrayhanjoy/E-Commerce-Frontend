"use client";

import React from "react";

const GoogleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.09-6.09C34.46 3.06 29.53 1 24 1 14.82 1 6.96 6.48 3.19 14.29l7.09 5.51C12.02 13.68 17.55 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.7c-.55 2.99-2.2 5.52-4.68 7.22l7.19 5.59C43.18 37.4 46.52 31.39 46.52 24.5z"/>
    <path fill="#FBBC05" d="M10.28 28.2A14.54 14.54 0 0 1 9.5 24c0-1.46.25-2.87.69-4.2l-7.09-5.51A23.93 23.93 0 0 0 .5 24c0 3.87.93 7.53 2.6 10.74l7.18-5.54z"/>
    <path fill="#34A853" d="M24 46.5c5.53 0 10.17-1.83 13.56-4.97l-7.19-5.59c-1.83 1.23-4.17 1.96-6.37 1.96-6.45 0-11.98-4.18-13.72-9.8l-7.18 5.54C6.96 41.52 14.82 46.5 24 46.5z"/>
  </svg>
);

const GoogleButton = () => {
  const handleGoogleSignIn = () => {
    // Google OAuth handler
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      type="button"
      className="flex items-center justify-center gap-3 px-8 py-3 mx-auto bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors duration-200 cursor-pointer"
    >
      <GoogleIcon />
      <span className="text-sm font-medium text-gray-700">Sign In with Google</span>
    </button>
  );
};

export default GoogleButton;
