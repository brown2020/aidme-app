import TermsPage from "@/components/TermsPage";
import { COMPANY_INFO } from "@/lib/constants";

export default function Terms() {
  return (
    <TermsPage
      privacyLink="/privacy"
      companyName={COMPANY_INFO.name}
      companyEmail={COMPANY_INFO.email}
      updatedAt={COMPANY_INFO.updatedAt}
    />
  );
}
