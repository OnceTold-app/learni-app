'use client'

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f7fafa', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <a href="/" style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 900, color: '#0d2b28', textDecoration: 'none' }}>
          learni<span style={{ color: '#2ec4b6' }}>.</span>
        </a>

        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '32px', fontWeight: 900, color: '#0d2b28', marginTop: '32px', marginBottom: '8px' }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#5a8a84', fontSize: '14px', marginBottom: '32px' }}>Last updated: 12 April 2026</p>

        <div style={{ fontSize: '15px', lineHeight: 1.8, color: '#2d3a38' }}>
          <h2 style={h2Style}>1. Who We Are</h2>
          <p>Learni is operated by Momentum Ventures Limited, based in Auckland, New Zealand. We comply with the New Zealand Privacy Act 2020.</p>
          <p>Contact: <a href="mailto:hello@learniapp.co" style={{ color: '#2ec4b6' }}>hello@learniapp.co</a></p>

          <h2 style={h2Style}>2. Information We Collect</h2>

          <h3 style={h3Style}>Parent account information</h3>
          <ul style={ulStyle}>
            <li>Email address</li>
            <li>Full name</li>
            <li>Password (encrypted, we cannot see it)</li>
            <li>Payment information (processed by Stripe — we never see full card details)</li>
          </ul>

          <h3 style={h3Style}>Child profile information</h3>
          <ul style={ulStyle}>
            <li>First name</li>
            <li>Age and school year level</li>
            <li>PIN (for child login)</li>
            <li>Username (chosen by the child)</li>
            <li>Avatar preferences</li>
            <li>Preferred language</li>
          </ul>

          <h3 style={h3Style}>Learning data</h3>
          <ul style={ulStyle}>
            <li>Session history (questions, answers, time spent)</li>
            <li>Topic mastery scores</li>
            <li>Stars earned and jar allocations</li>
            <li>Baseline assessment results</li>
          </ul>

          <h3 style={h3Style}>Technical data</h3>
          <ul style={ulStyle}>
            <li>Browser type and device information</li>
            <li>IP address</li>
            <li>Pages visited and feature usage</li>
          </ul>

          <h2 style={h2Style}>3. What We Do NOT Collect</h2>
          <ul style={ulStyle}>
            <li>We do not collect children&apos;s email addresses</li>
            <li>We do not record or store children&apos;s voice data (speech recognition runs in your browser only)</li>
            <li>We do not use cookies for advertising or tracking</li>
            <li>We do not sell any data to third parties. Ever.</li>
          </ul>

          <h2 style={h2Style}>4. How We Use Your Information</h2>
          <ul style={ulStyle}>
            <li><strong>To provide the service:</strong> personalise lessons, track progress, generate reports</li>
            <li><strong>To communicate:</strong> session summary emails, weekly digests, account notifications</li>
            <li><strong>To improve Learni:</strong> understand usage patterns, fix bugs, improve AI tutoring quality</li>
            <li><strong>To process payments:</strong> via Stripe (see their privacy policy at stripe.com/privacy)</li>
          </ul>
          <p><strong>We do NOT use your child&apos;s data to train AI models.</strong> Learning data is used only to personalise your child&apos;s experience within Learni.</p>

          <h2 style={h2Style}>5. AI and Children&apos;s Data</h2>
          <p>Learni uses AI (Anthropic&apos;s Claude) to generate tutoring content. When your child interacts with Earni:</p>
          <ul style={ulStyle}>
            <li>Questions and answers are sent to the AI to generate appropriate responses</li>
            <li>The child&apos;s first name and year level are shared with the AI for personalisation</li>
            <li>No surnames, email addresses, or identifying information is sent to the AI</li>
            <li>AI conversations are not stored by the AI provider after the session</li>
          </ul>

          <h2 style={h2Style}>6. Voice Features</h2>
          <p><strong>Text-to-speech (Earni speaking):</strong> We use ElevenLabs to generate Earni&apos;s voice. The text sent is the tutoring content only — no personal data.</p>
          <p><strong>Speech recognition (child speaking):</strong> If enabled, speech recognition runs entirely in your browser using the Web Speech API. Audio is processed locally and is <strong>never sent to our servers or stored</strong>.</p>

          <h2 style={h2Style}>7. Where Your Data Is Stored</h2>
          <ul style={ulStyle}>
            <li><strong>Database:</strong> Supabase (hosted in Sydney, Australia)</li>
            <li><strong>Website:</strong> Vercel (global CDN)</li>
            <li><strong>Payments:</strong> Stripe (US, PCI compliant)</li>
            <li><strong>Email:</strong> Zoho Mail (Australia)</li>
            <li><strong>AI:</strong> Anthropic (US) — no data retained after processing</li>
          </ul>
          <p>We choose providers with strong security practices. Data is encrypted in transit (HTTPS/TLS) and at rest.</p>

          <h2 style={h2Style}>8. Data Sharing</h2>
          <p>We share data only with:</p>
          <ul style={ulStyle}>
            <li><strong>Service providers</strong> (Supabase, Stripe, Anthropic, ElevenLabs, Vercel, Zoho) — only what&apos;s necessary for them to provide their service</li>
            <li><strong>Legal requirements</strong> — if required by New Zealand law or a court order</li>
          </ul>
          <p>We will <strong>never</strong> sell, rent, or trade your personal information or your child&apos;s data.</p>

          <h2 style={h2Style}>9. Your Rights (NZ Privacy Act 2020)</h2>
          <p>You have the right to:</p>
          <ul style={ulStyle}>
            <li><strong>Access</strong> your data — request a copy of what we hold</li>
            <li><strong>Correct</strong> your data — update or fix inaccuracies</li>
            <li><strong>Delete</strong> your data — request full deletion of your account and all associated data</li>
            <li><strong>Complain</strong> to the NZ Privacy Commissioner if you believe we&apos;ve breached the Privacy Act</li>
          </ul>
          <p>To exercise any of these rights, email <a href="mailto:hello@learniapp.co" style={{ color: '#2ec4b6' }}>hello@learniapp.co</a>. We will respond within 20 business days.</p>

          <h2 style={h2Style}>10. Children&apos;s Privacy</h2>
          <p>We take children&apos;s privacy seriously:</p>
          <ul style={ulStyle}>
            <li>Only parents can create accounts and add children</li>
            <li>Children cannot contact us or other users directly</li>
            <li>We collect the minimum information necessary for the service</li>
            <li>Parents can view, edit, or delete their child&apos;s data at any time from the Hub</li>
            <li>No advertising is shown to children</li>
            <li>No social features that connect children with strangers</li>
          </ul>

          <h2 style={h2Style}>11. Data Retention</h2>
          <ul style={ulStyle}>
            <li><strong>Active accounts:</strong> Data retained while your account is active</li>
            <li><strong>Cancelled accounts:</strong> Data retained for 90 days after cancellation, then permanently deleted</li>
            <li><strong>Deletion requests:</strong> Processed within 5 business days, data permanently removed within 30 days</li>
          </ul>

          <h2 style={h2Style}>12. Security</h2>
          <ul style={ulStyle}>
            <li>All data transmitted over HTTPS/TLS encryption</li>
            <li>Passwords are hashed (bcrypt) — we cannot see them</li>
            <li>Database access is restricted with role-based permissions</li>
            <li>We use Supabase Row Level Security (RLS) to isolate account data</li>
            <li>Payment data is handled entirely by Stripe (PCI DSS Level 1 compliant)</li>
          </ul>

          <h2 style={h2Style}>13. Changes to This Policy</h2>
          <p>We may update this policy from time to time. We will notify you by email of any material changes at least 14 days before they take effect.</p>

          <h2 style={h2Style}>14. Contact</h2>
          <p>Privacy questions or requests: <a href="mailto:hello@learniapp.co" style={{ color: '#2ec4b6' }}>hello@learniapp.co</a></p>
          <p>NZ Privacy Commissioner: <a href="https://privacy.org.nz" style={{ color: '#2ec4b6' }} target="_blank" rel="noopener noreferrer">privacy.org.nz</a></p>
        </div>
      </div>
    </div>
  )
}

const h2Style = { fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 800 as const, color: '#0d2b28', marginTop: '32px', marginBottom: '12px' }
const h3Style = { fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 700 as const, color: '#0d2b28', marginTop: '16px', marginBottom: '8px' }
const ulStyle = { paddingLeft: '20px', marginBottom: '12px' }
