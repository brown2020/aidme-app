interface TermsIntellectualPropertyRightsProps { companyName: string; companyEmail: string }

/** Terms section: Intellectual Property Rights */
export function TermsIntellectualPropertyRights({ companyName, companyEmail }: TermsIntellectualPropertyRightsProps) {
  return (
    <>
<h4>Intellectual Property Rights</h4>
      <p>
        {companyName} is a trademark of {companyName}.{companyName} Content,{" "}
        {companyName} products,
        {companyName} features and Services, and our underlying technology are
        protected by copyright, trademark, patent, intellectual property, and
        other laws of the United States and foreign countries. All rights
        reserved. You are not granted, by implication or otherwise, any license
        or right to use any marks appearing on, or used or displayed in
        connection with, the Services (“Trademarks”). The Services may also
        contain or refer to third-party trademarks, trade names, product names,
        and logos that may be registered trademarks of their respective owners.
        Under no circumstances may you use or copy any of the Trademarks.
        Nothing herein should be construed as granting any license or right to
        use any Trademarks displayed in connection with the Services without
        {companyName}’s express written permission.
      </p>
      <p>
        All content provided in association with the Services and this
        Agreement, including, but not limited to, the Sites, the Mobile Apps,
        all text, graphics, user interfaces, visual interfaces, photographs,
        images/video, electronic art, sounds/audio, data, communications
        programs, executable code, computer code, and data (collectively,
        “Content”) formatted, organized, and collected in a variety of forms,
        including design, structure, selection, coordination, expression, “look
        and feel,” arrangement, layouts, pages, screens, and databases of such
        Content, contained in the Content, Services, and underlying technology,
        and any and all other copyright-protected work associated with the
        Services (“Copyrighted Works”), are exclusively owned, controlled, or
        licensed by or to {companyName} and are protected by U.S. and
        international copyright laws. You agree you will not directly or
        indirectly copy, reproduce, modify, create derivative works from,
        distribute, or publicly display the Copyrighted Works without the prior
        express written permission of {companyName}.
      </p>
      <p>
        If you provide any communications or materials to {companyName} by mail,
        email, telephone, or otherwise, suggesting or recommending changes to
        the Services, including without limitation, new features or
        functionality relating thereto, or any comments, questions, suggestions,
        or the like (“Feedback”), {companyName} is free to use such Feedback
        irrespective of any other obligation or limitation between the Parties
        governing such Feedback. {companyName} is free to use, without any
        attribution or compensation to any party, any ideas, know-how, concepts,
        techniques, or other intellectual property rights contained in the
        Feedback, for any purpose whatsoever, although
        {companyName} is not required to use any Feedback.
      </p>
      <p>
        {companyName} respects the intellectual property rights of others and it
        is our policy to expeditiously process and review notices of claimed
        infringement of copyright or other applicable intellectual property
        laws. Any notices of claimed infringement should be sent to
        {companyName}’s Designated Agent at {companyEmail}, and must contain all
        of the following: (i) a signature (physical or electronic) of the
        copyright owner or a person authorized to act on behalf of the copyright
        owner; (ii) a description of the copyrighted work that you claim has
        been infringed; (iii) a description of the material that you claim is
        infringing and is to be removed or have access to same disabled, and
        information sufficient to permit {companyName}’s administrators to
        locate the material; (iv) information sufficient for us to contact you,
        such as address, telephone number, and email address; (v) a statement
        that you have a good faith belief that use of the material in the manner
        complained of is not authorized by the copyright owner, its agent, or
        the law; and (vi) a statement that the information in the notification
        is accurate and, under penalty of perjury, that you are the copyright
        owner or are authorized to act on behalf of the owner of a copyright
        that is allegedly infringed.
      </p>
    </>
  );
}
