import { COMPANY_INFO } from "@/lib/constants";
import { TermsAccessAndUse } from "./terms/TermsAccessAndUse";
import { TermsCustomerResponsibilities } from "./terms/TermsCustomerResponsibilities";
import { TermsPaymentAndFees } from "./terms/TermsPaymentAndFees";
import { TermsSubscriptions } from "./terms/TermsSubscriptions";
import { TermsDataAndCommunications } from "./terms/TermsDataAndCommunications";
import { TermsIntellectualPropertyRights } from "./terms/TermsIntellectualPropertyRights";
import { TermsWarrantyDisclaimer } from "./terms/TermsWarrantyDisclaimer";
import { TermsLimitationOfLiability } from "./terms/TermsLimitationOfLiability";
import { TermsPrecautions } from "./terms/TermsPrecautions";
import { TermsNoticeForCaliforniaUsers } from "./terms/TermsNoticeForCaliforniaUsers";
import { TermsTerminationCancellation } from "./terms/TermsTerminationCancellation";
import { TermsFederalGovernmentEndUseRestrictions } from "./terms/TermsFederalGovernmentEndUseRestrictions";
import { TermsExportComplianceAndUseRestrictions } from "./terms/TermsExportComplianceAndUseRestrictions";
import { TermsGoverningLawForumMandatoryBindingArbitrationClassAction } from "./terms/TermsGoverningLawForumMandatoryBindingArbitrationClassAction";
import { TermsMiscellaneous } from "./terms/TermsMiscellaneous";
import { TermsModificationOfTheTermsAndServices } from "./terms/TermsModificationOfTheTermsAndServices";

const PRIVACY_LINK = "/privacy";

/**
 * Terms of Service page - Server Component
 * Renders static terms of service content using company information from constants
 */
export default function Terms() {
  const { name: companyName, email: companyEmail, updatedAt } = COMPANY_INFO;
  return (
    <div className="text-wrapper">
<h3>Terms of Service</h3>

      <p>
        Welcome and thank you for your interest in {companyName} services and
        mobile apps! These Terms of Use (the “Agreement”) describe the terms and
        conditions applicable to your use of {companyName} (the “Sites”) and the
        related mobile applications (the “Mobile Apps”) (collectively, the
        “Services”). The Sites and Mobile Apps are owned and operated by{" "}
        {companyName}, and its affiliates and subsidiaries (collectively “
        {companyName}”).
      </p>
      <p>
        In this Agreement, we refer to ourselves as {companyName} or “us” or
        “we”; we refer to you as “you” or “Customer.” {companyName} and Customer
        are referred to in this Agreement individually as a “Party” and
        collectively as the “Parties.”
      </p>
      <p>
        By accessing or using the Services, including access to the Sites, you
        intend and expressly agree to be bound by all the terms and conditions
        of this Agreement and the Privacy Policy (available at {PRIVACY_LINK}),
        which is incorporated by reference. If you do not agree to these terms
        and conditions, you may not use the Services.
      </p>
      <TermsAccessAndUse companyName={companyName} />
      <TermsCustomerResponsibilities companyName={companyName} />
      <TermsPaymentAndFees companyName={companyName} />
      <TermsSubscriptions companyName={companyName} companyEmail={companyEmail} />
      <TermsDataAndCommunications companyName={companyName} />
      <TermsIntellectualPropertyRights companyName={companyName} companyEmail={companyEmail} />
      <TermsWarrantyDisclaimer companyName={companyName} />
      <TermsLimitationOfLiability companyName={companyName} />
      <TermsPrecautions companyName={companyName} />
      <TermsNoticeForCaliforniaUsers />
      <TermsTerminationCancellation companyName={companyName} companyEmail={companyEmail} />
      <TermsFederalGovernmentEndUseRestrictions />
      <TermsExportComplianceAndUseRestrictions />
      <TermsGoverningLawForumMandatoryBindingArbitrationClassAction companyName={companyName} />
      <TermsMiscellaneous companyName={companyName} />
      <TermsModificationOfTheTermsAndServices companyName={companyName} updatedAt={updatedAt} />
    </div>
  );
}
