interface TermsTerminationCancellationProps { companyName: string; companyEmail: string }

/** Terms section: Termination; Cancellation */
export function TermsTerminationCancellation({ companyName, companyEmail }: TermsTerminationCancellationProps) {
  return (
    <>
<h4>Termination; Cancellation</h4>
      <p>
        This Agreement shall continue in full force until terminated or canceled
        pursuant to this Agreement.
      </p>
      <p>
        {companyName} shall have the right to terminate this Agreement (i) for
        any reason whatsoever by providing thirty (30) days’ notice to you; (ii)
        immediately for your material breach of this Agreement, other than
        non-payment of Fees; or (iii) for non-payment of Fees. Notwithstanding
        the foregoing, {companyName} reserves the right, in its sole discretion
        and without notice, at any time and for any reason, to remove, modify,
        suspend, or disable access to all or any portion of the Services.
      </p>
      <p>
        You may terminate the Agreement for any reason whatsoever by providing
        thirty (30) days’ notice to {companyName} by email at {companyEmail}.
        You shall be responsible for all Fees incurred prior to and during the
        notice period.
      </p>
      <p>
        Sections titled Precautions, Intellectual Property Rights, Data and
        Communications, Indemnification, Warranty Disclaimer, Limitation of
        Liability, Governing Law, Forum; Mandatory Binding Arbitration; Class
        Action Waiver, and payment obligations for Fees incurred prior to and
        during any notice period shall survive termination of this Agreement for
        any reason whatsoever.
      </p>
    </>
  );
}
