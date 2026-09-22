const PRIVACY_LINK = "/privacy";

interface TermsDataAndCommunicationsProps { companyName: string }

/** Terms section: Data and Communications */
export function TermsDataAndCommunications({ companyName }: TermsDataAndCommunicationsProps) {
  return (
    <>
<h4>Data and Communications</h4>
      <p>
        {companyName} may collect and process information regarding your usage
        of the Services. You consent to {companyName}’s collection and use of
        such information, as well as the sharing of such information with
        third-party service providers for purposes of providing, marketing, and
        improving the Services, and any other reason described in the Privacy
        Policy. All personal information collected by
        {companyName} is treated in accordance with the{" "}
        <a href={PRIVACY_LINK}>Privacy Policy</a>.
      </p>
      <p>
        By agreeing to the terms and conditions in this Agreement and providing
        your contact information to {companyName}, you give your express consent
        to allow {companyName}, its affiliates, and agents to contact you from
        time to time at any mailing address, phone number, or email address you
        provide to {companyName}. Your consent means you agree to be contacted
        by {companyName} and its service providers via phone, email, text
        message, or other means for any purpose, including but not limited to
        notifications related to the Services and your account, subscriptions,
        purchases, available upgrades, billing and payment processing issues,
        and telemarketing communications. Such authorized communications may
        include use of automated dialing technology or the use of pre-recorded
        messages. You are responsible for any charges that may be billed to you
        by your service provider(s) when we contact you. You further acknowledge
        that your consent to the foregoing is not a condition of using the{" "}
        {companyName} Services, and if you do not wish to consent, you may
        contact us and request to be placed on a do not contact list, or you may
        opt out any time using the opt-out mechanism provided in any such
        communications.
      </p>
      <p>
        {companyName} disclaims all liability under this Agreement for any
        information you provide to {companyName} that may constitute electronic
        patient health records or similar information supplied by you or an end
        user, notwithstanding anything to the contrary in this Agreement or as
        otherwise required by any applicable federal, state, or international
        laws, rules, or regulations.
      </p>
    </>
  );
}
