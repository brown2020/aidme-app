interface TermsCustomerResponsibilitiesProps { companyName: string }

/** Terms section: Customer Responsibilities */
export function TermsCustomerResponsibilities({ companyName }: TermsCustomerResponsibilitiesProps) {
  return (
    <>
<h4>Customer Responsibilities</h4>
      <p>
        You acknowledge that you are solely responsible and liable for your use
        of the Services, directly or indirectly, including understanding whether
        such access or use is permitted by or in violation of this Agreement.
        You are further solely responsible for compliance with all applicable
        laws relating to your use of the Services. You shall further use the
        Services solely for lawful purposes, and shall conduct all business
        through the Services in accordance with all applicable laws and
        regulations, including but not limited to all applicable federal and
        state laws and regulations governing the offer and sale of securities,
        money laundering, and counter-terrorism.
      </p>
      <p>
        You alone are responsible for ensuring and maintaining that you are able
        to access and use the Services, including by securing your own
        compatible hardware, Mobile Apps, internet access, security Mobile Apps,
        backup devices or services, and any other requirements.
        {companyName} shall have no responsibility to provide any additional
        Mobile Apps or hardware. You further agree that
        {companyName} shall have no responsibility for any data loss or other
        damage or loss suffered in connection with your use of the Services,
        including any failure to provide adequate security or backup devices or
        services.
      </p>
      <p>
        You are responsible for ensuring {companyName} has accurate and current
        information for your Customer account, including current contact and
        payment information. You are further responsible for regularly reviewing
        the associated Customer email account for any communications from{" "}
        {companyName}.
      </p>
      <p>
        If you are provided with a username, password, credentials file, or any
        other piece of information as part of any security procedure
        (“Credentials”), you must treat such information as confidential, and
        must not disclose Credentials to any other person or entity. You
        acknowledge that your account and Credentials are personal to you, and
        further agree not to provide any other person with access to the
        Services or portions of the Services using your username, password, or
        other security information. You shall notify {companyName}
        immediately of any unauthorized access to or use of your Credentials or
        any other breach of security. {companyName} has the right to disable any
        username, password, credentials file, or other identifier at any time,
        whether chosen by you or provided by {companyName}.
      </p>
      <p>
        {companyName} shall make commercially reasonable efforts to provide
        adequate support services for the Services. Notwithstanding the
        foregoing, this Agreement does not entitle you to any guaranteed level,
        availability, or turnaround time of support services for the Services.
      </p>
    </>
  );
}
