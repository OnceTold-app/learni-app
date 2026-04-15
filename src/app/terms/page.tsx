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
        <p style={{ color: '#5a8a84', fontSize: '14px', marginBottom: '8px' }}>Last updated: 15 April 2026</p>
        <p style={{ color: '#5a8a84', fontSize: '14px', marginBottom: '32px' }}>Operated by Momentum Ventures Limited, Auckland, New Zealand.</p>

        <div style={{ background: '#e8f5f3', borderRadius: '12px', padding: '16px 20px', marginBottom: '32px', fontSize: '14px', color: '#0d2b28', lineHeight: 1.7 }}>
          <strong>The short version:</strong> Learni is an AI tutoring service for children, run by parents. You control your account and your child&apos;s data. We don&apos;t sell data. Stars have no cash value with us — rewards are paid by you, the parent. If something&apos;s unclear, just email us.
        </div>

        <div style={{ fontSize: '15px', lineHeight: 1.8, color: '#2d3a38' }}>

          <h2 style={h2Style}>1. Who These Terms Apply To</h2>
          <p>These Terms of Service (&quot;Terms&quot;) govern your use of the Learni platform, including our website, web app, and any related services (collectively, &quot;the Service&quot;). By creating an account or using the Service, you agree to these Terms.</p>
          <p>The Service is intended for use by parents or guardians (&quot;Parent Users&quot;) on behalf of their children (&quot;Child Users&quot;). If you are creating an account, you confirm that you are at least 18 years old and a parent or legal guardian of any child you add to the platform.</p>
          <p style={basicallyStyle}>💡 <em>In plain English: Learni is for families. Parents sign up and manage everything. Children use the platform under their parent&apos;s account.</em></p>

          <h2 style={h2Style}>2. Your Account</h2>
          <p>You are responsible for:</p>
          <ul style={ulStyle}>
            <li>Keeping your login credentials secure and confidential</li>
            <li>All activity that occurs under your account, including your child&apos;s sessions</li>
            <li>Ensuring all information you provide is accurate and up to date</li>
            <li>Notifying us immediately if you suspect unauthorised access to your account</li>
          </ul>
          <p>Child profiles are created by and remain the responsibility of the parent account holder. Children cannot create accounts independently or access account settings.</p>
          <p style={basicallyStyle}>💡 <em>In plain English: You&apos;re in charge of your account. Keep your password safe and let us know if anything looks wrong.</em></p>

          <h2 style={h2Style}>3. What Learni Provides</h2>
          <p>Learni provides an AI-powered tutoring service that includes:</p>
          <ul style={ulStyle}>
            <li>Voice-guided tutoring sessions across core subjects</li>
            <li>Progress tracking, assessment, and personalised lesson content</li>
            <li>A star-based reward system with parent-controlled monetary values</li>
            <li>A parent dashboard (&quot;Hub&quot;) for monitoring and managing your child&apos;s learning</li>
            <li>Weekly summary emails from Earni</li>
          </ul>
          <p><strong>Learni is a supplementary learning tool.</strong> It is designed to support — not replace — formal schooling. We do not guarantee specific academic outcomes. Results vary based on how the service is used, the child&apos;s individual needs, and other factors outside our control.</p>
          <p style={basicallyStyle}>💡 <em>In plain English: We give your child a smart, voice-based tutor. It&apos;s a great support tool, but it&apos;s not a substitute for school.</em></p>

          <h2 style={h2Style}>4. AI-Generated Content</h2>
          <p>Earni is powered by artificial intelligence. This means:</p>
          <ul style={ulStyle}>
            <li>Lesson content and responses are generated in real time — not pre-written by humans</li>
            <li>While we apply strict content filters and safety prompts, AI-generated content may occasionally contain errors or unexpected responses</li>
            <li>We continuously monitor and improve Earni&apos;s accuracy and safety</li>
            <li>Earni is designed never to discuss topics outside of learning, encouragement, and the three-jar financial literacy system</li>
          </ul>
          <p>If you encounter content that seems incorrect, inappropriate, or concerning, please report it immediately to <a href="mailto:hello@learniapp.co" style={{ color: '#2ec4b6' }}>hello@learniapp.co</a>. We take all reports seriously.</p>
          <p style={basicallyStyle}>💡 <em>In plain English: Earni is an AI, not a human teacher. We&apos;ve built in safety measures, but if something looks wrong, tell us straight away.</em></p>

          <h2 style={h2Style}>5. Parental Consent & Child Safety</h2>
          <p>By adding a child profile, you confirm that:</p>
          <ul style={ulStyle}>
            <li>You are the parent or legal guardian of that child</li>
            <li>You consent to your child using the Learni service under these Terms</li>
            <li>You have reviewed our Privacy Policy and understand how your child&apos;s data is used</li>
          </ul>
          <p>We collect only the minimum information needed to provide the service. Children&apos;s data is never used for advertising. Parents can view, edit, or delete their child&apos;s profile and data at any time from the Hub.</p>
          <p style={basicallyStyle}>💡 <em>In plain English: You&apos;re giving permission for your child to use Learni. You stay in control of their data the whole time.</em></p>

          <h2 style={h2Style}>6. Pricing & Subscriptions</h2>
          <p><strong>Free trial:</strong> New accounts receive a 14-day free trial with full access to all features.</p>
          <p><strong>Standard plan:</strong> $49 NZD per month for one child, with unlimited sessions across all subjects.</p>
          <p><strong>Additional children:</strong> $19 NZD per month per additional child (maximum 4 children per account).</p>
          <p><strong>Billing:</strong> Subscriptions renew automatically each month. You will be charged on the same date each month following your trial period.</p>
          <p><strong>Price changes:</strong> We will give you at least 30 days&apos; notice by email before any price increase takes effect. You may cancel before the change if you do not wish to continue.</p>
          <p><strong>Refunds:</strong> We consider refund requests on a case-by-case basis within 14 days of payment. Chat with us or email <a href="mailto:hello@learniapp.co" style={{ color: '#2ec4b6' }}>hello@learniapp.co</a>. Nothing in these Terms limits your rights under applicable consumer protection law.</p>
          <p style={basicallyStyle}>💡 <em>In plain English: $49/month for one child, $19/month for each extra child. Cancel any time. We&apos;ll always warn you before prices go up.</em></p>

          <h2 style={h2Style}>7. Star Rewards</h2>
          <p>Children earn stars for correct answers during sessions. Stars are a measure of in-session achievement only.</p>
          <ul style={ulStyle}>
            <li><strong>Stars have no monetary value with Learni.</strong> We do not pay children or parents in cash or credits.</li>
            <li>Parents may choose to assign their own monetary value to stars (e.g., 100 stars = $5) and pay that reward directly to their child. This is entirely at the parent&apos;s discretion and is a private arrangement between parent and child.</li>
            <li>Learni is not responsible for any reward payments made or not made by parents to children.</li>
            <li>The three-jar financial literacy system (Save / Spend / Give) is an educational tool to help children learn money habits. Jar allocations are tracked in-app but do not represent real money held by Learni.</li>
          </ul>
          <p style={basicallyStyle}>💡 <em>In plain English: Stars are earned in the app. You decide if and how much you pay your child for them. Learni never pays anyone directly.</em></p>

          <h2 style={h2Style}>8. Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul style={ulStyle}>
            <li>Share your account with people outside your immediate family</li>
            <li>Attempt to reverse-engineer, extract, copy, or reproduce our AI prompts, question content, scoring logic, or any other proprietary systems</li>
            <li>Use automated tools, bots, or scrapers to access any part of the Service</li>
            <li>Attempt to gain unauthorised access to other accounts, our servers, or our infrastructure</li>
            <li>Engage in any activity that places an unreasonable load on our systems</li>
            <li>Use the Service for any unlawful purpose or in violation of any applicable law</li>
            <li>Introduce malicious code, viruses, or any software designed to disrupt the Service</li>
          </ul>
          <p>We reserve the right to suspend or permanently terminate accounts that violate these terms, without refund.</p>
          <p style={basicallyStyle}>💡 <em>In plain English: Use Learni for what it&apos;s for — helping your kids learn. Don&apos;t try to copy it, scrape it, or abuse it.</em></p>

          <h2 style={h2Style}>9. Intellectual Property</h2>
          <p>All content, design, branding, AI prompts, question banks, scoring systems, and code that make up the Learni platform are owned by or licensed to Momentum Ventures Limited. You may not copy, reproduce, modify, distribute, or create derivative works from any part of the Service without our prior written permission.</p>
          <p>You retain ownership of any content you submit to the Service (such as child names or avatar choices). By submitting such content, you grant us a limited licence to use it solely to provide the Service to you.</p>
          <p style={basicallyStyle}>💡 <em>In plain English: Learni&apos;s content is ours. Your data is yours. We only use your data to run the service.</em></p>

          <h2 style={h2Style}>10. Cancellation & Termination</h2>
          <p><strong>By you:</strong> You can cancel your subscription at any time from your account settings. Access continues until the end of your current billing period. No partial refunds are given for unused time.</p>
          <p><strong>By us:</strong> We may suspend or terminate your account if you violate these Terms. In the event of termination, you will have 30 days to request a copy of your data before it is deleted. After 30 days, all account data will be permanently removed.</p>
          <p><strong>Account deletion:</strong> To permanently delete your account and all associated data, email <a href="mailto:hello@learniapp.co" style={{ color: '#2ec4b6' }}>hello@learniapp.co</a>. We will process deletion within 5 business days.</p>
          <p style={basicallyStyle}>💡 <em>In plain English: Cancel any time — no hoops. If we ever close your account, you get 30 days to grab your data first.</em></p>

          <h2 style={h2Style}>11. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law:</p>
          <ul style={ulStyle}>
            <li>The Service is provided &quot;as is&quot; without warranties of any kind, express or implied</li>
            <li>We are not liable for any indirect, incidental, special, or consequential damages arising from your use of the Service</li>
            <li>Our total liability to you for any claim is limited to the total amount you paid us in the 12 months preceding the claim</li>
            <li>We are not responsible for internet outages, device issues, or third-party service interruptions that affect your access to Learni</li>
          </ul>
          <p>Nothing in these Terms limits your rights under the New Zealand Consumer Guarantees Act 1993 or any other applicable consumer protection law that cannot be waived by contract.</p>
          <p style={basicallyStyle}>💡 <em>In plain English: We do our best, but we can&apos;t guarantee perfection. Your legal rights under NZ consumer law are always protected.</em></p>

          <h2 style={h2Style}>12. Changes to These Terms</h2>
          <p>We may update these Terms from time to time. If we make material changes, we will notify you by email at least 14 days before the changes take effect. Minor changes (such as fixing typos or clarifying existing language) may be made without notice.</p>
          <p>Continuing to use the Service after changes take effect means you accept the updated Terms. If you don&apos;t agree with a change, you may cancel your account before it takes effect.</p>
          <p style={basicallyStyle}>💡 <em>In plain English: We&apos;ll always warn you before anything important changes. You can leave if you don&apos;t like it.</em></p>

          <h2 style={h2Style}>13. Governing Law</h2>
          <p>These Terms are governed by the laws of New Zealand. Any disputes that cannot be resolved informally will be subject to the exclusive jurisdiction of the courts of Auckland, New Zealand.</p>

          <h2 style={h2Style}>14. Contact</h2>
          <p>Questions? <a href="https://learniapp.co/#chat" style={{ color: '#2ec4b6' }}>Chat with us</a> or email <a href="mailto:hello@learniapp.co" style={{ color: '#2ec4b6' }}>hello@learniapp.co</a></p>
          <p style={{ color: '#5a8a84', fontSize: '14px' }}>Momentum Ventures Limited, Auckland, New Zealand.</p>
        </div>
      </div>
    </div>
  )
}

const h2Style: React.CSSProperties = {
  fontFamily: "'Nunito', sans-serif",
  fontSize: '20px',
  fontWeight: 800,
  color: '#0d2b28',
  marginTop: '40px',
  marginBottom: '10px',
}

const basicallyStyle: React.CSSProperties = {
  background: '#e8f5f3',
  borderRadius: '8px',
  padding: '10px 14px',
  marginTop: '12px',
  fontSize: '14px',
  color: '#0d5a52',
}

const ulStyle: React.CSSProperties = {
  paddingLeft: '20px',
  marginTop: '8px',
  marginBottom: '12px',
}
