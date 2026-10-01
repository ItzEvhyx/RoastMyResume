export const LEGAL_CONTACT_EMAIL = 'subayhvhan@gmail.com';
export const LEGAL_EFFECTIVE_DATE = 'October 1, 2026';

export type TextPart =
  | string
  | { strong: string }
  | { em: string }
  | { email: string };

export type LegalBlock =
  | { kind: 'p'; parts: TextPart[] }
  | { kind: 'ul'; items: TextPart[][] }
  | { kind: 'table'; headers: [string, string, string]; rows: [string, string, string][] };

export type LegalSection = {
  id: string;
  heading: string;
  blocks: LegalBlock[];
};

export type LegalDocumentId = 'privacy' | 'terms';

export type LegalDocument = {
  id: LegalDocumentId;
  title: string;
  kicker: string;
  intro: string;
  sections: LegalSection[];
};

const mail = { email: LEGAL_CONTACT_EMAIL } as const;

export const privacyDocument: LegalDocument = {
  id: 'privacy',
  title: 'Privacy Policy',
  kicker: 'How RoastMyResume handles information',
  intro:
    'RoastMyResume ("we," "us," "our") provides a resume canvas and AI feedback tools. This Privacy Policy describes the information the Service actually collects, where it is kept, and what we do not collect. It is written to match the product as it works today.',
  sections: [
    {
      id: 'information-we-collect',
      heading: 'Information we collect',
      blocks: [
        {
          kind: 'ul',
          items: [
            [
              { strong: 'Email and password. ' },
              'If you create an account with an email address and a password, we store that email address and the password you set in our database so we can recognize you when you sign in.',
            ],
            [
              { strong: 'Google sign-up. ' },
              'If you continue with Google, we store the email address, display name, and profile photo address Google shares with us, and an identifier for that Google account. We do not receive your Google password.',
            ],
            [
              { strong: 'Email verification. ' },
              'Before an email account is created, we send a one-time code to that address through Gmail. We keep the code only until you enter it or it expires, and then we discard it.',
            ],
            [
              { strong: 'Sign-in session. ' },
              'After you sign in, your browser stores your email address, your name when we have one, and the time you signed in. That session is kept in local storage and in a cookie named rmr_auth_session so you can stay signed in. The cookie is set to last about 30 days.',
            ],
            [
              { strong: 'Resume on this device. ' },
              'The resume you build on the canvas, including text, layout, icons, drawings, and images you place there, is saved in your browser on that device. We do not copy the canvas into your account in our database.',
            ],
            [
              { strong: 'AI requests. ' },
              'When you use Ask Denise, Job Match, ATS Check, or resume import, we send the resume text needed for that request to Anthropic so it can write a response. If you use Job Match, we also send the job posting you paste. We do not keep a separate copy of those replies in your account record.',
            ],
            [
              { strong: 'Usage counts. ' },
              'We store a daily count of how many times your email address has used each AI feature, so we can apply usage limits.',
            ],
            [
              { strong: 'Voice. ' },
              'If you play a reply aloud, we send the text of that reply to Cartesia to generate speech. If you speak into the app, we send that audio to Deepgram to turn it into text. We do not keep those recordings.',
            ],
            [
              { strong: 'Interface icons. ' },
              'We use Cloudinary to store and serve icons in the product. Those files are part of the interface, not your resume.',
            ],
          ],
        },
      ],
    },
    {
      id: 'how-we-use-information',
      heading: 'How we use information',
      blocks: [
        { kind: 'p', parts: ['We use the information above to:'] },
        {
          kind: 'ul',
          items: [
            ['Create your account and sign you in.'],
            ['Send the verification code to the email address you gave us.'],
            ['Run the AI features you ask for, and apply daily limits to those features.'],
            ['Keep you signed in on the browser you used.'],
            ['Operate, secure, and troubleshoot the Service.'],
          ],
        },
        {
          kind: 'p',
          parts: [
            { strong: 'We do not sell your personal information or your resume content.' },
          ],
        },
      ],
    },
    {
      id: 'who-we-share-with',
      heading: 'Who we share data with',
      blocks: [
        {
          kind: 'p',
          parts: [
            'We share limited data with the providers below only so the related feature can work. Each provider handles that data under its own terms. We do not claim a separate contract that forbids them from using data to train models.',
          ],
        },
        {
          kind: 'table',
          headers: ['Provider', 'What is sent', 'Why'],
          rows: [
            ['Google Firebase', 'Account record', 'Stores your account'],
            ['Google sign-in', 'The Google profile you approve', 'Creates a Google-based account'],
            ['Gmail', 'Your email address and a one-time code', 'Sends the verification email'],
            ['Anthropic', 'Resume text, and a job posting if you use Job Match', 'Writes AI feedback'],
            ['Cartesia', 'Reply text, if you use read-aloud', 'Turns that text into speech'],
            ['Deepgram', 'Audio, if you use voice input', 'Turns speech into text'],
            ['Cloudinary', 'Interface icon files', 'Serves product icons'],
          ],
        },
      ],
    },
    {
      id: 'what-we-do-not-do',
      heading: 'What we do not do',
      blocks: [
        {
          kind: 'ul',
          items: [
            ['We do not sell personal information or resume content.'],
            ['We do not use advertising cookies, and we do not run a separate analytics product.'],
            ['We do not collect payment-card numbers. There is no paid checkout in the product today.'],
            ['We do not store your canvas resume in our account database.'],
            ['We do not keep the audio from voice input or read-aloud.'],
            ['We do not receive your Google password.'],
          ],
        },
      ],
    },
    {
      id: 'retention',
      heading: 'How long we keep information',
      blocks: [
        {
          kind: 'p',
          parts: [
            'We keep your account record while the account exists. A verification code is discarded after you use it or it expires. Canvas content stays in your browser until you clear this site\'s saved data.',
          ],
        },
        {
          kind: 'p',
          parts: [
            'There is no delete-account button in the product. To ask us to remove the account record we hold, email ',
            mail,
            '. We will delete that record after we confirm the request. We do not promise an automatic deletion on a fixed number of days.',
          ],
        },
      ],
    },
    {
      id: 'your-choices',
      heading: 'Your choices',
      blocks: [
        {
          kind: 'ul',
          items: [
            ['Sign out to end the session in that browser.'],
            ['Clear this site\'s cookies and local storage in your browser to remove the saved session and the canvas stored on that device.'],
            ['Use your browser settings to block or delete cookies. Blocking the session cookie will sign you out.'],
            ['Email us if you want a copy of the account record we hold, a correction, or deletion of that record.'],
          ],
        },
      ],
    },
    {
      id: 'security',
      heading: 'Security',
      blocks: [
        {
          kind: 'p',
          parts: [
            'Pages are served over HTTPS. No method of storage or transmission is perfectly secure. Choose a password you do not reuse on other sites, and do not share your sign-in.',
          ],
        },
      ],
    },
    {
      id: 'children',
      heading: 'Children\'s privacy',
      blocks: [
        {
          kind: 'p',
          parts: [
            'RoastMyResume is not directed to children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child under 13 has given us an account, email ',
            mail,
            ' and we will delete that account record.',
          ],
        },
      ],
    },
    {
      id: 'changes',
      heading: 'Changes to this policy',
      blocks: [
        {
          kind: 'p',
          parts: [
            'We may update this policy. When we do, we will change the effective date at the top of this page. Please read it again when you return. Continuing to use the Service after that date means you accept the updated policy.',
          ],
        },
      ],
    },
    {
      id: 'contact',
      heading: 'Contact',
      blocks: [
        {
          kind: 'p',
          parts: [
            'Questions about this policy or the account record we hold: ',
            mail,
            '.',
          ],
        },
      ],
    },
  ],
};

export const termsDocument: LegalDocument = {
  id: 'terms',
  title: 'Terms of Service',
  kicker: 'Rules for using RoastMyResume',
  intro:
    'These Terms of Service ("Terms") govern your use of RoastMyResume, including the resume canvas, AI feedback, and related features (the "Service"). By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the Service.',
  sections: [
    {
      id: 'who-can-use',
      heading: 'Who can use the Service',
      blocks: [
        {
          kind: 'p',
          parts: [
            'You must be at least 13 years old. If you are under 18, you confirm that a parent or guardian has allowed you to use the Service. You confirm that the information you provide is accurate and that you have the right to submit any resume text, images, or job postings you place in the Service.',
          ],
        },
      ],
    },
    {
      id: 'your-account',
      heading: 'Your account',
      blocks: [
        {
          kind: 'ul',
          items: [
            [
              'You can build a resume on the canvas without an account. That canvas stays in your browser. AI features, including Ask Denise, Job Match, ATS Check, resume import, and voice tools, require an account.',
            ],
            [
              'You may register with an email address and a password, or by continuing with Google. You are responsible for your sign-in and for activity under your account.',
            ],
            [
              'Do not create extra accounts to get around usage limits.',
            ],
            [
              'We may suspend or close an account that violates these Terms, abuses the Service, or tries to get around usage limits.',
            ],
          ],
        },
      ],
    },
    {
      id: 'the-service',
      heading: 'What you can do',
      blocks: [
        {
          kind: 'p',
          parts: [
            'You may use the Service to build, edit, and export a resume, and to request AI feedback on resume content. That feedback includes a critique you can ask for in a direct tone or a harsher "roast" tone, a job-match reading against a posting you paste, and an ATS readability check.',
          ],
        },
      ],
    },
    {
      id: 'your-content',
      heading: 'Your content',
      blocks: [
        {
          kind: 'p',
          parts: [
            { strong: 'You own what you submit. ' },
            'Resume text, images, job postings, and other material you add ("Your Content") remain yours. You give us a limited permission to process and display Your Content only to provide the Service to you, including sending the needed text to the providers named in the Privacy Policy.',
          ],
        },
        { kind: 'p', parts: ['Do not submit:'] },
        {
          kind: 'ul',
          items: [
            ['Someone else\'s resume or other material you do not have permission to use.'],
            ['Information you intend to use to deceive an employer.'],
            ['Material that is unlawful, abusive, or infringes another person\'s rights.'],
            ['Files or content meant to disrupt or break the Service.'],
          ],
        },
        {
          kind: 'p',
          parts: ['We may remove content that violates these Terms.'],
        },
      ],
    },
    {
      id: 'ai-feedback',
      heading: 'AI-generated feedback',
      blocks: [
        {
          kind: 'ul',
          items: [
            [
              { strong: 'AI feedback is not career, legal, or hiring advice. ' },
              'It is a tool to help you read your own resume. It is not a promise of an interview or a job.',
            ],
            [
              'Feedback, including roast-mode wording, is generated automatically. It can be incomplete, off-tone, or wrong about your situation. Decide for yourself before you change a resume.',
            ],
            [
              'Job-match scores are estimates from the text you provided. They do not predict how a particular employer or applicant tracking system will read your resume.',
            ],
            [
              'We are not responsible for hiring decisions or other employment results that follow your use of the Service.',
            ],
          ],
        },
      ],
    },
    {
      id: 'third-parties',
      heading: 'Third-party services',
      blocks: [
        {
          kind: 'p',
          parts: [
            'To run the Service we send limited data to Google Firebase (account records), Google sign-in, Gmail (the verification email), Anthropic (AI feedback), Cartesia (read-aloud), Deepgram (voice input), and Cloudinary (interface icons). They process that data to deliver the related feature, under their own terms. The Privacy Policy describes what each one receives.',
          ],
        },
      ],
    },
    {
      id: 'rate-limits',
      heading: 'Free use and limits',
      blocks: [
        {
          kind: 'ul',
          items: [
            ['The resume canvas is free to use without an account.'],
            ['AI features require an account and are subject to daily limits. We may change those limits.'],
            ['The Service does not sell paid plans today. If we offer them later, the terms of that purchase will be shown before you pay.'],
            ['We may slow or restrict access to prevent abuse.'],
          ],
        },
      ],
    },
    {
      id: 'acceptable-use',
      heading: 'Acceptable use',
      blocks: [
        { kind: 'p', parts: ['You agree not to:'] },
        {
          kind: 'ul',
          items: [
            ['Use bots or scrapers to access the Service outside ordinary use.'],
            ['Try to extract or copy our prompts, models, or scoring logic.'],
            ['Get around rate limits or account restrictions.'],
            ['Use the Service to harass, defame, or impersonate someone.'],
            ['Upload malware or try to compromise the Service.'],
          ],
        },
      ],
    },
    {
      id: 'intellectual-property',
      heading: 'Our intellectual property',
      blocks: [
        {
          kind: 'p',
          parts: [
            'The RoastMyResume name, branding, templates, and software belong to us or to our licensors. These Terms do not give you the right to use that branding or code except as needed to use the Service in the ordinary way.',
          ],
        },
      ],
    },
    {
      id: 'disclaimers',
      heading: 'Disclaimers',
      blocks: [
        {
          kind: 'p',
          parts: [
            'The Service is provided "as is," without warranties of any kind, express or implied, to the extent the law allows. We do not guarantee that the Service will be uninterrupted or error-free, or that AI feedback will be accurate or fit for your situation. You use AI feedback at your own judgment.',
          ],
        },
      ],
    },
    {
      id: 'liability',
      heading: 'Limitation of liability',
      blocks: [
        {
          kind: 'p',
          parts: [
            'To the fullest extent the law allows, RoastMyResume and its operators are not liable for indirect, incidental, or consequential damages arising from your use of the Service, including employment results, lost opportunities, or loss of data stored in your browser. Our total liability for a claim about the Service is limited to the amount you paid us for the Service in the 12 months before the claim. That amount is zero while the Service is free.',
          ],
        },
      ],
    },
    {
      id: 'ending-access',
      heading: 'Stopping use',
      blocks: [
        {
          kind: 'p',
          parts: [
            'You may stop using the Service at any time. To ask us to delete the account record we hold, email ',
            mail,
            '. There is no delete button in the product. We may suspend or end your access if you violate these Terms. Some sections, including ownership of content, disclaimers, and limits on liability, continue to apply after access ends.',
          ],
        },
      ],
    },
    {
      id: 'changes',
      heading: 'Changes to these Terms',
      blocks: [
        {
          kind: 'p',
          parts: [
            'We may update these Terms. When we do, we will change the effective date on this page. Continuing to use the Service after that date means you accept the updated Terms.',
          ],
        },
      ],
    },
    {
      id: 'contact',
      heading: 'Contact',
      blocks: [
        {
          kind: 'p',
          parts: ['Questions about these Terms: ', mail, '.'],
        },
      ],
    },
  ],
};

export function legalDocumentFor(doc: string | string[] | undefined): LegalDocument {
  const value = Array.isArray(doc) ? doc[0] : doc;
  return value === 'terms' ? termsDocument : privacyDocument;
}
