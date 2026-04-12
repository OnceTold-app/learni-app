'use client'

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f7fafa', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <a href="/" style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 900, color: '#0d2b28', textDecoration: 'none' }}>
          learni<span style={{ color: '#2ec4b6' }}>.</span>
        </a>

        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '32px', fontWeight: 900, color: '#0d2b28', marginTop: '32px', marginBottom: '8px' }}>
          Terms of Service
        </h1>
        <p style={{ color: '#5a8a84', fontSize: '14px', marginBottom: '32px' }}>Last updated: 12 April 2026</p>

        <div style={{ fontSize: '15px', lineHeight: 1.8, color: '#2d3a38' }}>
          <h2 style={h2Style}>1. About Learni</h2>
          <p>Learni is an AI-powered tutoring platform for children, operated by Momentum Ventures Limited (NZBN pending), based in Auckland, New Zealand (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;).</p>
          <p>By creating an account or using Learni, you agree to these terms. If you don&apos;t agree, please don&apos;t use the service.</p>

          <h2 style={h2Style}>2. Accounts</h2>
          <p>Parent or guardian accounts are required to use Learni. You must be at least 18 years old to create an account.</p>
          <p>You are responsible for:</p>
          <ul style={ulStyle}>
            <li>Keeping your login details secure</li>
            <li>All activity under your account, including your children&apos;s use</li>
            <li>Ensuring the information you provide is accurate</li>
          </ul>
          <p>Child profiles are created and managed by the parent account holder. Children cannot create accounts independently.</p>

          <h2 style={h2Style}>3. The Service</h2>
          <p>Learni provides AI-powered tutoring sessions, including:</p>
          <ul style={ulStyle}>
            <li>Interactive lessons aligned to the New Zealand Curriculum</li>
            <li>Voice-guided tutoring using AI (Earni)</li>
            <li>Progress tracking and assessment</li>
            <li>A star-based reward system</li>
          </ul>
          <p><strong>Learni is a supplementary learning tool.</strong> It is not a replacement for school education, and we do not guarantee specific educational outcomes. Results depend on how the service is used.</p>

          <h2 style={h2Style}>4. AI Disclaimer</h2>
          <p>Earni is an AI tutor. While we work hard to ensure accuracy and quality:</p>
          <ul style={ulStyle}>
            <li>AI-generated content may occasionally contain errors</li>
            <li>Earni&apos;s responses are generated in real-time and are not pre-reviewed by humans</li>
            <li>We continuously improve our AI prompts and safety filters</li>
            <li>If you notice incorrect or inappropriate content, please contact us at hello@learniapp.co</li>
          </ul>

          <h2 style={h2Style}>5. Pricing & Payment</h2>
          <p><strong>Free trial:</strong> New accounts receive a 14-day free trial with full access. No credit card is required to start.</p>
          <p><strong>Standard plan:</strong> $49 NZD per month for one child, with unlimited sessions.</p>
          <p><strong>Additional children:</strong> $19 NZD per month per additional child (up to 4 children total).</p>
          <p><strong>Billing:</strong> Subscriptions are billed monthly through Stripe. You can cancel at any time from your account.</p>
          <p><strong>Refunds:</strong> We offer refunds on a case-by-case basis within 14 days of payment. Contact hello@learniapp.co.</p>
          <p>We may change pricing with 30 days&apos; notice. Existing subscribers will be notified by email before any price change takes effect.</p>

          <h2 style={h2Style}>6. Star Rewards</h2>
          <p>Children earn stars for correct answers during sessions. Parents may choose to assign a monetary value to stars (e.g., 100 stars = $5).</p>
          <p>Star-to-money conversion is entirely at the parent&apos;s discretion. Learni does not pay children directly. Stars have no cash value with Learni.</p>

          <h2 style={h2Style}>7. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul style={ulStyle}>
            <li>Share your account with non-family members</li>
            <li>Use the service for any unlawful purpose</li>
            <li>Attempt to reverse-engineer, copy, or extract our AI prompts, content, or systems</li>
            <li>Use automated tools to access the service (bots, scrapers)</li>
            <li>Harass, abuse, or send inappropriate content through any Learni feature</li>
          </ul>
          <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>

          <h2 style={h2Style}>8. Intellectual Property</h2>
          <p>All content, design, code, AI prompts, and branding on Learni are owned by Momentum Ventures Limited.</p>
          <p>You may not copy, reproduce, or distribute any part of the service without written permission.</p>

          <h2 style={h2Style}>9. Limitation of Liability</h2>
          <p>To the maximum extent permitted by New Zealand law:</p>
          <ul style={ulStyle}>
            <li>Learni is provided &quot;as is&quot; without warranties of any kind</li>
            <li>We are not liable for any indirect, incidental, or consequential damages</li>
            <li>Our total liability is limited to the amount you paid us in the 12 months before the claim</li>
          </ul>
          <p>Nothing in these terms limits your rights under the New Zealand Consumer Guarantees Act 1993.</p>

          <h2 style={h2Style}>10. Cancellation</h2>
          <p>You can cancel your subscription at any time. Your access continues until the end of your current billing period. No partial refunds are issued for unused time in a billing period.</p>
          <p>If you want to delete your account and all associated data, email hello@learniapp.co and we will process it within 5 business days.</p>

          <h2 style={h2Style}>11. Changes to These Terms</h2>
          <p>We may update these terms from time to time. We will notify you by email of any material changes at least 14 days before they take effect.</p>
          <p>Continued use after changes take effect constitutes acceptance of the new terms.</p>

          <h2 style={h2Style}>12. Governing Law</h2>
          <p>These terms are governed by the laws of New Zealand. Any disputes will be resolved in the courts of Auckland, New Zealand.</p>

          <h2 style={h2Style}>13. Contact</h2>
          <p>Questions? Contact us at <a href="mailto:hello@learniapp.co" style={{ color: '#2ec4b6' }}>hello@learniapp.co</a></p>
        </div>
      </div>
    </div>
  )
}

const h2Style = { fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800 as const, color: '#0d2b28', marginTop: '32px', marginBottom: '12px' }
const ulStyle = { paddingLeft: '20px', marginBottom: '12px' }
