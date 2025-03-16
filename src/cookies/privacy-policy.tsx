import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl text-white font-bold mb-6">Privacy Policy for AnimeCrates</h1>
      <p className="text-sm text-white mb-4">Effective Date: 07.02.2025</p>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl text-white font-semibold mb-3">1. Introduction</h2>
          <p className="text-white">Welcome to AnimeCrates ("we," "our," or "us"). Your privacy is important to us, and this Privacy Policy explains how we collect, use, and protect your information when you use our website, animecrates.netlify.app (the "Site").</p>
          <p className="mt-2 text-white">By using our Site, you consent to the practices described in this policy.</p>
        </section>

        <section>
          <h2 className="text-2xl text-white font-semibold mb-3">2. Information We Collect</h2>
          <p className="mt-2 text-white">We collect the following types of data when you use our Site:</p>
          
          <h3 className="text-xl text-white font-medium mt-3 mb-2">a. Account Information</h3>
          <p className="mt-2 text-white">If you sign up using Google OAuth or our custom login system, we collect your name, email address, and profile picture (if available).</p>

          <h3 className="text-xl text-white font-medium mt-3 mb-2">b. Usage Data</h3>
          <p className="mt-2 text-white">We collect information about your interactions with the Site, such as the anime you bookmark and your ratings.</p>
          <p className="mt-2 text-white">We use Google Analytics to track general usage patterns, including page visits and interactions.</p>

          <h3 className="text-xl  text-white font-medium mt-3 mb-2">c. Cookies and Cache</h3>
          <p className="mt-2 text-white">We use server-side caching (via Netlify Functions) and local caching to improve website performance.</p>
          <p className="mt-2 text-white">Cookies may be used to store session data and authentication tokens.</p>

          <h3 className="text-xl text-white font-medium mt-3 mb-2">d. Google Translate Integration</h3>
          <p className="mt-2 text-white">If you use Google Translate on our Site, your text input may be sent to Google's servers for translation. We do not store this data.</p>
        </section>

        {/* Additional sections following the same pattern */}
        <section>
          <h2 className="text-2xl text-white font-semibold mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc text-white pl-6 space-y-2">
            <li>Provide and improve our services.</li>
            <li>Store your anime bookmarks and ratings in our database on the Supabase platform.</li>
            <li>Personalize user experience.</li>
            <li>Monitor website performance using Google Analytics.</li>
            <li>Ensure secure authentication and login functionality.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl text-white font-semibold mb-3">4. Data Sharing & Third-Party Services</h2>
          <p className="mt-2 text-white">We do not sell or share your personal data with third parties, except in the following cases:</p>
          <ul className="list-disc text-white pl-6 space-y-2 mt-2">
            <li>Google Services: We use Google OAuth, Google Analytics, and Google Translate, which may process your data as per their respective privacy policies.</li>
            <li>Supabase: Our database is hosted on the Supabase platform, which handles data security and storage.</li>
            <li>Legal Compliance: We may share data if required by law or to protect our rights and users.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl text-white font-semibold mb-3">5. Data Retention & Security</h2>
          <ul className="list-disc text-white pl-6 space-y-2">
            <li>Your bookmarks and ratings are stored securely in our Supabase database.</li>
            <li>Authentication data is securely handled through Google OAuth and our custom login system.</li>
            <li>Cached data may be stored temporarily to enhance site performance.</li>
            <li>We implement security measures to protect against unauthorized access and data breaches, with data security managed by Supabase.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl text-white font-semibold mb-3">6. Your Rights & Choices</h2>
          <ul className="list-disc text-white pl-6 space-y-2">
            <li>Access & Deletion: You may request access to your stored data or ask for its deletion by contacting us.</li>
            <li>Cookie Preferences: You can manage cookies and caching settings in your browser.</li>
            <li>Google Account Control: If you use Google OAuth, you can manage permissions via your Google account settings.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl text-white font-semibold mb-3">7. Updates to this Policy</h2>
          <p className="mt-2 text-white">We may update this Privacy Policy periodically. The latest version will always be available on this page.</p>
        </section>

        <section>
          <h2 className="text-2xl text-white font-semibold mb-3">8. Contact Us</h2>
          <p className="mt-2 text-white">If you have any questions about this Privacy Policy, please reach out to us at [Your Contact Email].</p>
        </section>

        <footer className="text-sm text-white mt-8">
          Last Updated: 03.03.2025
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
