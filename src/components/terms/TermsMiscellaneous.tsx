interface TermsMiscellaneousProps { companyName: string }

/** Terms section: Miscellaneous */
export function TermsMiscellaneous({ companyName }: TermsMiscellaneousProps) {
  return (
    <>
<h4>Miscellaneous</h4>
      <p>
        You acknowledge that {companyName} has the right to monitor use of the
        Services to ensure compliance with the Agreement.
      </p>
      <p>
        No waiver of any term, provision, or condition of this Agreement,
        whether by conduct or otherwise, in any one or more instances, shall be
        deemed to be, or shall constitute, a waiver of any other term,
        provision, or condition hereof, whether or not similar, nor shall such
        waiver constitute a continuing waiver of any such term, provision, or
        condition hereof. No waiver shall be binding unless executed in writing
        by the party making the waiver.
      </p>
      <p>
        You may not assign this Agreement to any other party and any attempt to
        do so is void.
      </p>
      <p>
        If any provision of this Agreement is determined to be illegal or
        unenforceable, then such provision will be enforced to the maximum
        extent possible, and the other provisions will remain fully effective
        and enforceable.
      </p>
      <p>
        This Agreement and the Privacy Policy constitute the complete and
        exclusive statement of the agreement between you and {companyName}
        regarding the Services, and supersedes any and all prior or
        contemporaneous communications, representations, statements, and
        understandings, whether oral or written, between the parties.
      </p>
      <p>
        In case of any conflict between the terms of this Agreement and the
        terms of the Privacy Policy, the terms of this Agreement shall prevail.
      </p>
    </>
  );
}
